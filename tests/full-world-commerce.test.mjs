import test from 'node:test';
import assert from 'node:assert/strict';
process.env.REALM_WORLD_PROFILE='master-reference';
const {walletValue,coinValue,changeWallet}=await import('../server/currency.mjs');
const {Realm}=await import('../server/world.mjs');
const {WorldStore}=await import('../server/store.mjs');
const {MERCHANTS,offers,merchantView}=await import('../server/merchants.mjs');
const {MASTER_LANDMARKS}=await import('../server/master-geography.mjs');
const {ensureMasterEncounters}=await import('../server/master-encounters.mjs');
const {FACTION_TOWNS}=await import('../server/master-rules.mjs');
const {authorizedTown}=await import('../server/accounts.mjs');

function fixture(){
 const s=new WorldStore(':memory:',()=>1000000,{ruleset:'master-v1'});
 s.transaction(r=>{r.join('one');r.command('one',{id:'create',type:'createCharacter',faction:'bandit',appearance:'female-1',profession:'hunter'});});
 const r=s.realm,p=r.player('one'),m=MERCHANTS.find(m=>m.shop==='Provisioner');
 Object.assign(p,{inventory:{},interior:m.interior,x:m.x,y:m.y,openMerchant:m.id});
 Object.assign(r.state.accounts.one,{gold:100,silver:100,copper:100,reputation:-7});
 return {s,m};
}
test('all denominations preserve exact combined value and survive saved-state restoration',()=>{
 const {s,m}=fixture();const original=offers[m.shop].wood;
 try{
  for(const coin of ['copper','silver','gold']){
   // Fixture prices exercise each denomination without inventing live catalog prices.
   offers[m.shop].wood=[3,1,coin];const r=s.realm,a=r.state.accounts.one,before={...a};
   const row=merchantView(r,r.player('one')).offers.find(o=>o.item==='wood');
   const cmd={id:'buy-'+coin,type:'merchantBuy',target:m.id,item:'wood',amount:1,expectedTotal:row.buy,expectedCurrency:coin};
   s.transaction(r=>r.command('one',cmd));s.transaction(r=>r.command('one',cmd));
   assert.equal(walletValue(s.realm.state.accounts.one),walletValue(before)-coinValue(row.buy,coin));
  }
  const view=s.realm.snapshot('one');assert.equal(view.openMerchant.standing.reputation,-7);assert.equal(view.openMerchant.standing.displayOnly,true);assert.equal(view.openMerchant.standing.access,'Open');
  assert.equal(view.account.copper,view.you.coinPouch.copper);assert.equal(view.account.silver,view.openMerchant.wallet.silver);
  const restored=new Realm(structuredClone(s.realm.state),()=>1000000,{ruleset:'master-v1'});restored.join('one');assert.deepEqual(restored.snapshot('one').you.coinPouch,view.you.coinPouch);assert.equal(restored.state.accounts.one.reputation,-7);
 }finally{offers[m.shop].wood=original;s.close();}
});
test('wrong denomination, insufficient total funds and full pouch roll back stock, items and receipts',()=>{
 const {s,m}=fixture(),original=offers[m.shop].wood;offers[m.shop].wood=[3,1,'silver'];
 try{
  const cmd={id:'same-price-wrong-coin',type:'merchantBuy',target:m.id,item:'wood',amount:1,expectedTotal:3,expectedCurrency:'gold'};
  let before=JSON.stringify(s.realm.state);assert.throws(()=>s.transaction(r=>r.command('one',cmd)),/Currency changed/);assert.equal(JSON.stringify(s.realm.state),before);
  Object.assign(s.realm.state.accounts.one,{gold:0,silver:0,copper:0});before=JSON.stringify(s.realm.state);
  assert.throws(()=>s.transaction(r=>r.command('one',{...cmd,id:'no-silver',expectedCurrency:'silver'})),/Not enough coins/);assert.equal(JSON.stringify(s.realm.state),before);
  Object.assign(s.realm.state.accounts.one,{gold:500,silver:2000,copper:2000});s.realm.player('one').inventory.wood=1;before=JSON.stringify(s.realm.state);
  assert.throws(()=>s.transaction(r=>r.command('one',{...cmd,id:'pouch-full',type:'merchantSell',expectedTotal:1,expectedCurrency:'silver'})),/pouch is full/);assert.equal(JSON.stringify(s.realm.state),before);
 }finally{offers[m.shop].wood=original;s.close();}
});
test('both full-world towns keep neutral access and their complete protected radius',()=>{
 const {s}=fixture();try{const r=s.realm,p=r.player('one');for(const town of FACTION_TOWNS){assert.equal(town.faction,'neutral');assert.equal(town.radius,1450);Object.assign(p,{interior:null,x:town.x+1000,y:town.y});assert.ok(r.safe(p));assert.equal(authorizedTown(r,p).id,town.id);}}finally{s.close();}
});
test('wilderness encounters exist across west and east, retain death state, and avoid protected towns',()=>{
 const {s}=fixture();try{const r=s.realm,p=r.player('one');p.interior=null;
  for(const town of MASTER_LANDMARKS.filter(l=>l.kind==='trader')){
   Object.assign(p,{x:town.x-2200,y:town.y+2200});ensureMasterEncounters(r,p);
   assert.ok(Object.values(r.state.enemies).some(e=>e.id.startsWith('master-encounter-')&&Math.hypot(e.x-p.x,e.y-p.y)<4600));
  }
  const e=Object.values(r.state.enemies).find(e=>e.id.startsWith('master-encounter-'));e.hp=0;e.respawnAt=2000000;
  const before=JSON.stringify(r.state.enemies);ensureMasterEncounters(r,p);assert.equal(JSON.stringify(r.state.enemies),before);
  for(const enemy of Object.values(r.state.enemies).filter(e=>e.id.startsWith('master-encounter-'))){assert.ok(!r.safe(enemy));assert.ok(!r.blocks(enemy.x,enemy.y));}
  Object.assign(p,{x:512,y:512});r.leave('one');r.join('one');assert.ok(r.safe(r.player('one')));assert.ok(!r.blocks(r.player('one').x,r.player('one').y));
 }finally{s.close();}
});

test('one gold pays two silver and returns exactly eight silver',()=>{
 assert.deepEqual(changeWallet({gold:1,silver:0,copper:0},2,'silver'),{gold:0,silver:8,copper:0});
 assert.deepEqual(changeWallet({gold:0,silver:1,copper:0},2,'copper'),{gold:0,silver:0,copper:8});
 assert.deepEqual(changeWallet({gold:0,silver:9,copper:10},1,'gold'),{gold:0,silver:0,copper:0});
 for(const amount of [-1,1.5,NaN,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>changeWallet({gold:1},amount,'silver'));
});

test('trader purchase charges 2 silver from one gold, returns 8 silver, and retry charges once',()=>{
 const {s,m}=fixture(),original=offers[m.shop].wood;offers[m.shop].wood=[2,10,'silver'];
 try{Object.assign(s.realm.state.accounts.one,{gold:1,silver:0,copper:0});
  const cmd={id:'owner-change-example',type:'merchantBuy',target:m.id,item:'wood',amount:1,expectedTotal:2,expectedCurrency:'silver'};
  s.transaction(r=>r.command('one',cmd));s.transaction(r=>r.command('one',cmd));
  assert.deepEqual(s.realm.snapshot('one').you.coinPouch,{gold:0,silver:8,copper:0});assert.equal(s.realm.player('one').inventory.wood,1);
 }finally{offers[m.shop].wood=original;s.close();}
});

test('personal bank makes exact change without changing total wallet plus bank value',async()=>{
 const {servicePosition}=await import('../server/service-locations.mjs');const {s}=fixture();
 try{const p=s.realm.player('one');Object.assign(p,servicePosition(FACTION_TOWNS[0],'bank'));Object.assign(s.realm.state.accounts.one,{gold:1,silver:0,copper:0,bank:{gold:0,silver:0,copper:0,tier:1,tokens:{}}});
  s.transaction(r=>r.command('one',{id:'deposit-change',type:'bankDeposit',item:'silver',amount:2}));
  let a=s.realm.state.accounts.one;assert.equal(a.gold,0);assert.equal(a.silver,8);assert.equal(a.bank.silver,2);assert.equal(walletValue(a)+walletValue(a.bank),100n);
  s.transaction(r=>r.command('one',{id:'withdraw-change',type:'bankWithdraw',item:'copper',amount:5}));
  a=s.realm.state.accounts.one;assert.equal(a.copper,5);assert.equal(a.bank.silver,1);assert.equal(a.bank.copper,5);assert.equal(walletValue(a)+walletValue(a.bank),100n);
 }finally{s.close();}
});

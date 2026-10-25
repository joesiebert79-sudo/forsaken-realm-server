import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
process.env.REALM_WORLD_PROFILE='master-reference';
const {WorldStore}=await import('../server/store.mjs');
const {COIN_VALUE,coinValue,walletValue,changeWallet}=await import('../server/currency.mjs');
const {CONTRACTS}=await import('../server/contracts.mjs');
const {LEGENDARY_CHAINS}=await import('../server/legendary-missions.mjs');
const {FACTION_TOWNS}=await import('../server/master-rules.mjs');
const {BASIC_OFFERS,ensureCosmetics}=await import('../server/cosmetics.mjs');
const {ITEMS}=await import('../server/catalog.mjs');
const {itemPrice,supplyPrice,flashPrice}=await import('../server/item-commerce.mjs');
function fixture(path=':memory:'){
 const store=new WorldStore(path,()=>1000000,{ruleset:'master-v1'});
 store.transaction(r=>{r.join('owner');if(r.player('owner').creationRequired)r.command('owner',{id:'create',type:'createCharacter',faction:'survivor',appearance:'male-1',profession:'melee'});});
 return store;
}
test('100:1 values, mixed payments and every live item bundle use exact copper totals',()=>{
 assert.deepEqual(COIN_VALUE,{copper:1,silver:100,gold:10000});
 assert.equal(coinValue(1,'gold'),coinValue(100,'silver'));
 assert.equal(coinValue(1,'silver'),coinValue(100,'copper'));
 for(const item of Object.values(ITEMS)){
  if(item.id.startsWith('deed:'))continue;
  const price=itemPrice(item.id),total=coinValue(price.amount,price.currency);
  const bundle=supplyPrice({[item.id]:3});
  assert.equal(coinValue(bundle.amount,bundle.currency),total*3n,item.id);
  const sale=flashPrice(price.amount,price.currency);
  assert.ok(coinValue(sale.gold,sale.currency)<=total,item.id);
 }
 for(const offer of BASIC_OFFERS.filter(o=>o.kind==='coins'))assert.equal(coinValue(offer.coinCount,offer.coin),coinValue(offer.gold,offer.currency));
 assert.equal(walletValue(changeWallet({gold:1},99,'silver')),100n);
 assert.deepEqual(changeWallet({gold:1},1,'copper'),{gold:0,silver:99,copper:99});
});
test('every task contract pays its declared gold under 100:1 once, and rejects unfinished work',()=>{
 const s=fixture();try{
  const r=s.realm,p=r.player('owner'),town=FACTION_TOWNS[0];Object.assign(p,{interior:null,x:town.x,y:town.y+80});
  Object.assign(r.state.accounts.owner,{gold:0,silver:0,copper:0});
  for(const def of CONTRACTS){
   const command={id:'claim-'+def.id,type:'contractClaim',contract:def.id};
   assert.throws(()=>r.command(p.id,command),/incomplete/);
   p.contracts.progress[def.event]=def.goal;
   // Test each reward below the unchanged 500-gold belt capacity.
   Object.assign(r.state.accounts.owner,{gold:0,silver:0,copper:0});
   s.transaction(r=>r.command(p.id,command));
   assert.equal(walletValue(r.state.accounts.owner),BigInt(def.gold)*10000n,def.id);
   const paid=walletValue(r.state.accounts.owner);
   s.transaction(r=>r.command(p.id,{...command,id:'retry-'+def.id}));
   assert.equal(walletValue(r.state.accounts.owner),paid);
  }
 }finally{s.close();}
});
test('all three legendary mission completions award their equipment and 100 gold exactly once',()=>{
 for(const chain of LEGENDARY_CHAINS){const s=fixture();try{
  const r=s.realm,p=r.player('owner'),town=FACTION_TOWNS[0],chapter=chain.chapters.length-1,def=chain.chapters[chapter];
  Object.assign(p,{interior:null,x:town.x,y:town.y+80,legendary:{chain:chain.id,chapter,baseline:0},contracts:{progress:{[def.event]:def.goal},claimed:{}}});
  Object.assign(r.state.accounts.owner,{gold:0,silver:0,copper:0});
  const command={id:'final-'+chain.id,type:'legendaryClaim',chain:chain.id,chapter};
  s.transaction(r=>r.command(p.id,command));
  assert.equal(walletValue(r.state.accounts.owner),1000000n);
  assert.equal(p.inventory[chain.reward],1);
  s.transaction(r=>r.command(p.id,command));
  assert.equal(walletValue(r.state.accounts.owner),1000000n);
  assert.equal(p.inventory[chain.reward],1);
 }finally{s.close();}}
});
test('saved catalog reprices exchanges and active item deals without replenishing stock or deleting history',()=>{
 const s=fixture();try{const r=s.realm;
  r.state.basicShopVersion=6;
  Object.assign(r.state.shop.offers['exchange-copper'],{coinCount:10});
  r.state.shop.offers['flash-old']={id:'flash-old',kind:'supplies',supplies:{arrow:20},featured:'flash',gold:3,currency:'silver',regularGold:4,stock:2};
  r.state.shop.transactions.old={amount:1,currency:'silver',at:1};
  ensureCosmetics(r);
  assert.equal(r.state.shop.offers['exchange-copper'].coinCount,100);
  const o=r.state.shop.offers['flash-old'];assert.equal(coinValue(o.gold,o.currency),30n);assert.equal(o.stock,2);
  assert.deepEqual(r.state.shop.transactions.old,{amount:1,currency:'silver',at:1});
  const once=JSON.stringify(r.state.shop);ensureCosmetics(r);assert.equal(JSON.stringify(r.state.shop),once);
 }finally{s.close();}
});
test('first currency upgrade backs up the original save and preserves nominal wallet/bank counts and missions',()=>{
 const dir=mkdtempSync(join(tmpdir(),'realm-currency-')),path=join(dir,'save.sqlite');let s=fixture(path);
 try{
  s.transaction(r=>{delete r.state.currencyVersion;Object.assign(r.state.accounts.owner,{gold:7,silver:8,copper:9,bank:{gold:11,silver:12,copper:13}});r.player('owner').contracts={progress:{craft:3},claimed:{}};});s.close();
  s=new WorldStore(path,()=>1000001,{ruleset:'master-v1'});
  assert.ok(existsSync(path+'.before-currency-100.sqlite'));
  const a=s.realm.state.accounts.owner;assert.deepEqual({gold:a.gold,silver:a.silver,copper:a.copper},{gold:7,silver:8,copper:9});
  assert.deepEqual(a.bank,{gold:11,silver:12,copper:13});assert.equal(s.realm.state.players.owner.contracts.progress.craft,3);assert.equal(s.realm.state.currencyVersion,2);
 }finally{s.close();rmSync(dir,{recursive:true,force:true});}
});

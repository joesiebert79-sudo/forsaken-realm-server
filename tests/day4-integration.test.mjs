import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
process.env.REALM_WORLD_PROFILE='day4-housing';const {buyFixtureDeed}=await import('./deed-fixture.mjs');
const {LAYOUT}=await import('../server/world-profile.mjs');const {WorldStore}=await import('../server/store.mjs');const {HOUSE_DESIGNS}=await import('../server/housing-catalog.mjs');const {housingWorld}=await import('../server/housing-runtime.mjs');const {validateHousingPlacement}=await import('../server/housing.mjs');const {MERCHANTS}=await import('../server/merchants.mjs');
test('Day 4 real transactions: corner trader services, house purchase, owner entrance, persistence and duplicate protection',()=>{
 const dir=mkdtempSync(join(tmpdir(),'day4-')),path=join(dir,'world.sqlite');let store=new WorldStore(path,()=>1000000,{ruleset:'master-v1'}),seq=0;
 const act=(id,type,args={})=>store.transaction(r=>r.command(id,{id:'housing-'+(++seq),type,...args}));
 try{
 for(const [id,faction] of [['one','survivor'],['two','bandit']]){store.transaction(r=>r.join(id));act(id,'createCharacter',{faction,appearance:'male-1',profession:'farmer'});}
 let r=store.realm,p=r.player('one');assert.equal(r.snapshot('one').towns.length,2);assert.equal(r.safe(LAYOUT.settlements.find(t=>t.id==='day2-survivor')),true);assert.equal(r.safe({x:3430,y:3430}),false);assert.ok(MERCHANTS.every(m=>m.faction==='neutral'));
 for(const id of ['one','two']){const player=r.player(id),bank=r.buildings.find(b=>b.id==='day2-'+player.faction+'-bank');player.x=bank.x;player.y=bank.y+35;act(id,'enter',{target:bank.id});player.x=120;player.y=350;r.state.accounts[id].gold=1000;act(id,'bankOpen',{quote:20});player.x=310;player.y=415;act(id,'exit');}
 const b=r.buildings.find(b=>b.housingStatus==='vacant');p.x=b.x;p.y=b.y+35;act('one','interact');assert.equal(p.openService,'housing');
 buyFixtureDeed(store,'one',b.houseDesign);act('one','housingPreview',{design:b.houseDesign,target:b.id});const nonce=r.state.accounts.one.housingProposal.nonce,gold=r.state.accounts.one.gold;
 act('one','housingConfirm',{nonce});assert.equal(r.state.accounts.one.gold,gold);assert.equal(Object.keys(r.state.properties).length,1);act('one','enter',{target:b.id});assert.equal(p.interior,b.id);
 const two=r.player('two');two.x=b.x;two.y=b.y+35;assert.throws(()=>act('two','enter',{target:b.id}),/belongs/);r=store.realm;p=r.player('one');const room=r.snapshot('one').room;p.x=room.exit.x;p.y=room.exit.y;act('one','exit');assert.equal(p.interior,null);
 const code=p.characterId;store.close();store=new WorldStore(path,()=>1000001,{ruleset:'master-v1'});r=store.realm;store.transaction(r=>r.join('one'));assert.equal(r.player('one').characterId,code);assert.equal(Object.keys(r.state.properties).length,1);assert.throws(()=>act('one','settlementPrepare'),/one property/);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
test('five designs place, rotate, enter and persist without changing original movement/combat commands',()=>{
 for(const d of HOUSE_DESIGNS){const store=new WorldStore(':memory:',()=>1000000,{ruleset:'master-v1'});try{let seq=0;const act=(type,args={})=>store.transaction(r=>r.command('one',{id:'p'+(++seq),type,...args}));store.transaction(r=>r.join('one'));act('createCharacter',{faction:'survivor',appearance:'female-1',profession:'hunter'});const r=store.realm,p=r.player('one');r.state.accounts.one.gold=10000;
 let position;outer:for(let y=300;y<6500;y+=50)for(let x=300;x<6500;x+=50){try{validateHousingPlacement(d,{x,y},90,housingWorld(r));position={x,y};break outer;}catch{}}
 assert.ok(position);p.x=position.x;p.y=position.y+d.width/2+60;
 buyFixtureDeed(store,'one',d.id);act('housingPreview',{design:d.id,...position,rotation:90});act('housingConfirm',{nonce:r.state.accounts.one.housingProposal.nonce});const home=Object.values(r.state.properties)[0],b=r.buildings.find(b=>b.id===home.buildingId);assert.ok(r.blocks(b.x,b.y-20));p.x=b.door.x;p.y=b.door.y;act('enter',{target:b.id});assert.equal(r.snapshot('one').room.width,d.roomWidth);assert.equal(r.state.accounts.one.gold,10000);
 }finally{store.close();}}
});
test('rollback leaves no phantom house; clan members share ownership and storage while outsiders cannot enter',()=>{
 const store=new WorldStore(':memory:',()=>1000000,{ruleset:'master-v1'});let seq=0;const act=(id,type,args={})=>store.transaction(r=>r.command(id,{id:'clan-house-'+(++seq),type,...args}));
 try{for(const id of ['leader','member','outsider']){store.transaction(r=>r.join(id));act(id,'createCharacter',{faction:'survivor',appearance:'male-1',profession:'farmer'});}let r=store.realm;for(const id of ['leader','member'])r.state.accounts[id].clanId='guild';r.state.clans={guild:{id:'guild',leader:'leader',members:{leader:'Warlord',member:'Recruit'}}};
 const house=r.buildings.find(b=>b.housingStatus==='vacant');for(const id of ['leader','member','outsider']){const p=r.player(id);p.x=house.x;p.y=house.y+35;r.state.accounts[id].gold=10000;}
 assert.throws(()=>act('member','housingPreview',{target:house.id,design:house.houseDesign}),/leader/);r=store.realm;
 buyFixtureDeed(store,'leader',house.houseDesign);act('leader','housingPreview',{target:house.id,design:house.houseDesign});const nonce=r.state.accounts.leader.housingProposal.nonce;r.state.claims[Math.floor(house.x/256)+','+Math.floor(house.y/256)]={owner:'other'};
 const balance=r.state.accounts.leader.gold;assert.throws(()=>act('leader','housingConfirm',{nonce}),/claimed/);r=store.realm;assert.equal(r.state.accounts.leader.gold,balance);assert.equal(Object.keys(r.state.properties||{}).length,0);assert.equal(r.buildings.find(b=>b.id===house.id).housingStatus,'vacant');delete r.state.claims[Math.floor(house.x/256)+','+Math.floor(house.y/256)];
 act('leader','housingConfirm',{nonce});act('member','enter',{target:house.id});assert.equal(store.realm.player('member').interior,house.id);assert.throws(()=>act('outsider','enter',{target:house.id}),/belongs/);
 }finally{store.close();}
});
test('first Day 4 upgrade snapshots the prior database without changing account codes or balances',async()=>{
 const {DatabaseSync}=await import('node:sqlite');const {existsSync}=await import('node:fs');const dir=mkdtempSync(join(tmpdir(),'day4-backup-')),path=join(dir,'saved.sqlite');let store=new WorldStore(path,()=>1000000,{ruleset:'master-v1'});
 try{store.transaction(r=>r.join('same-player-code'));store.transaction(r=>{delete r.state.day4HousingVersion;r.state.accounts['same-player-code'].gold=765;});store.close();store=new WorldStore(path,()=>1000001,{ruleset:'master-v1'});assert.ok(existsSync(path+'.before-v068.sqlite'));const backup=new DatabaseSync(path+'.before-v068.sqlite',{readOnly:true});try{const state=JSON.parse(backup.prepare('SELECT body FROM world WHERE id=1').get().body);assert.equal(state.accounts['same-player-code'].gold,765);assert.equal(state.day4HousingVersion,undefined);}finally{backup.close();}assert.equal(store.realm.state.accounts['same-player-code'].gold,765);
 }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});



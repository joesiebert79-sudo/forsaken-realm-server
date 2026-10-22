import test from 'node:test';import assert from 'node:assert/strict';
process.env.REALM_WORLD_PROFILE='day4-housing';
const {LAYOUT}=await import('../server/world-profile.mjs');const {blocks}=await import('../server/day2-layout.mjs');const {MERCHANTS}=await import('../server/merchants.mjs');const {migrateTraderVillage}=await import('../server/trader-village-migration.mjs');const {WorldStore}=await import('../server/store.mjs');const {roomFor}=await import('../server/interiors.mjs');
test('two corner markets, fifteen varied enterable homes, clear paths and resources',()=>{
 assert.deepEqual(LAYOUT.protection.zones.map(z=>z.townId),['day2-survivor','day2-bandit']);const homes=LAYOUT.buildings.filter(b=>b.housingStatus==='vacant');assert.equal(homes.length,15);assert.equal(new Set(homes.map(b=>b.houseDesign)).size,5);assert.equal(new Set(homes.map(b=>Math.floor(b.x/256)+','+Math.floor(b.y/256))).size,15);assert.equal(MERCHANTS.length,4);
 for(const b of homes){assert.ok(roomFor(b.id));for(const o of LAYOUT.buildings.filter(o=>o!==b))assert.ok(Math.abs(b.x-o.x)>b.halfWidth+o.halfWidth+20||b.y+20<o.y-o.depth||o.y+20<b.y-b.depth);}
 for(const road of LAYOUT.roads)for(const p of road.points)assert.equal(blocks(LAYOUT.buildings,p.x,p.y,road.width/2+5),false,road.id);
 for(const n of LAYOUT.resources)assert.equal(blocks(LAYOUT.buildings,n.x,n.y,80),false);
});
test('both factions can trade; opposite-faction transactions rejected; shops not buyable',()=>{
 const store=new WorldStore(':memory:',()=>1000000,{ruleset:'master-v1'});let seq=0;
 try{for(const faction of ['survivor','bandit']){
 const act=(type,args={})=>store.transaction(r=>r.command(faction,{id:'t'+(++seq),type,...args}));store.transaction(r=>r.join(faction));act('createCharacter',{faction,appearance:'male-1',profession:'farmer'});
 let r=store.realm,p=r.player(faction);assert.equal(p.x,faction==='survivor'?700:6160);const merchant=MERCHANTS.find(m=>m.faction===faction&&m.shop==='Provisioner'),b=r.buildings.find(b=>b.id===merchant.buildingId);p.x=b.x;p.y=b.y+35;act('enter',{target:b.id});p.x=merchant.x;p.y=merchant.y;act('interact');assert.ok(r.snapshot(faction).openMerchant);r.state.accounts[faction].gold=100;act('merchantBuy',{target:merchant.id,item:'wood',amount:1});assert.ok(p.inventory.wood>0);act('merchantSell',{target:merchant.id,item:'wood',amount:1});
 const other=MERCHANTS.find(m=>m.faction!==faction);p.interior=other.interior;p.x=other.x;p.y=other.y;p.openMerchant=other.id;assert.throws(()=>act('merchantBuy',{target:other.id,item:'sword',amount:1}),/faction/);assert.throws(()=>act('housingPreview',{target:b.id,design:'cottage'}));
 }}finally{store.close();}
});
test('legacy trader house migration preserves codes, owner, bank, contents and flag, and is idempotent',()=>{
 const s={properties:{h:{id:'h',buildingId:'day2-survivor-merchant',design:'cottage',owner:'one',ownerType:'account',x:970,y:960,settlementId:'s'}},settlements:{s:{id:'s',cell:'3,3',owner:'one',flagActive:true}},claims:{'3,3':{settlementId:'s',owner:'one'}},accounts:{one:{gold:123,bank:{gold:456},activeCharacterId:'same-character'}},players:{one:{id:'same-code',interior:'day2-survivor-merchant',x:100,y:100,inventory:{wood:9}}},containers:{'fixture:day2-survivor-merchant:3':{items:{iron:17}}},resources:[]};migrateTraderVillage(s);const h=s.properties.h;assert.equal(h.owner,'one');assert.equal(s.players.one.interior,h.buildingId);assert.equal(s.players.one.id,'same-code');assert.equal(s.accounts.one.bank.gold,456);assert.equal(s.accounts.one.gold,123);assert.equal(s.containers['fixture:'+h.buildingId+':3'].items.iron,17);assert.ok(s.settlements.s.flagActive);const before=JSON.stringify(s);migrateTraderVillage(s);assert.equal(JSON.stringify(s),before);
});

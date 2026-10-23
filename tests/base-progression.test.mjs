import test from 'node:test';import assert from 'node:assert/strict';
process.env.REALM_WORLD_PROFILE='master-reference';
const {WorldStore}=await import('../server/store.mjs');
const {BASE_LEVELS,BENCH_COSTS,baseProgressionCommand,baseProgressionView,checkBasePiece,atConstructionBench}=await import('../server/base-progression.mjs');
const {HOUSE_DESIGNS}=await import('../server/housing-catalog.mjs');
const {validateBaseLand}=await import('../server/base-land.mjs');
function setup(design='hut'){const store=new WorldStore(':memory:',()=>1000000,{ruleset:'master-v1'});store.transaction(r=>{r.join('owner');r.command('owner',{id:'create',type:'createCharacter',appearance:'male-1',profession:'melee',faction:'survivor'});const p=r.player('owner'),d=HOUSE_DESIGNS.find(d=>d.id===design),id='home:'+design+':test';r.state.properties={h:{id:'h',buildingId:id,design,tier:d.tier,rotation:0,width:d.width,depth:d.depth,ownerType:'account',owner:p.id,x:8000,y:15000,settlementId:'s'}};r.state.settlements={s:{id:'s',propertyId:'h',ownerType:'account',owner:p.id,flagActive:true}};r.state.accounts.owner.settlementId='s';p.inventory={};Object.assign(p,{interior:id,x:115,y:d.roomHeight-70});r.state.structures={};const all={};for(const needs of [...BASE_LEVELS.map(l=>l.needs),...BENCH_COSTS.filter(Boolean)])for(const id of Object.keys(needs))all[id]=10000;for(let n=0;n<8;n++)r.state.structures['chest'+n]={id:'chest'+n,kind:'chest',hp:200,x:8000+n*40,y:15000,settlementId:'s',owner:p.id,items:n?{}:all};});return store;}
test('each of five saved house styles advances through eight independent levels, retaining the old style tier and earlier bench access',()=>{
 for(const d of HOUSE_DESIGNS){const s=setup(d.id);try{const r=s.realm,p=r.player('owner'),h=r.state.properties.h;assert.equal(baseProgressionView(r,p).level,1);assert.equal(baseProgressionView(r,p).benchLevel,0);
  let site;for(let x=12000;x<44000&&!site;x+=1200)for(let y=7000;y<23000&&!site;y+=1200){try{validateBaseLand(r,{...h,x,y},8);site={x,y};}catch{}}assert.ok(site,'find clear terrain for final compound');const dx=site.x-h.x,dy=site.y-h.y;Object.assign(h,site);for(const chest of Object.values(r.state.structures)){chest.x+=dx;chest.y+=dy;}
  baseProgressionCommand(r,p,{type:'baseBenchUpgrade',expectedLevel:0});for(let level=2;level<=8;level++){baseProgressionCommand(r,p,{type:'baseBenchUpgrade',expectedLevel:level-1});baseProgressionCommand(r,p,{type:'baseUpgrade',expectedLevel:level-1});assert.equal(h.baseLevel,level);assert.ok(atConstructionBench(r,p,1));assert.ok(atConstructionBench(r,p,level));}
  assert.equal(h.tier,d.tier);assert.equal(h.design,d.id);assert.equal(baseProgressionView(r,p).next,null);assert.throws(()=>baseProgressionCommand(r,p,{type:'baseUpgrade',expectedLevel:8}),/fully upgraded/);
 }finally{s.close();}}
});
test('missing bench, insufficient storage, remote use, stale upgrade and insufficient materials reject before consuming resources',()=>{
 const s=setup();try{const r=s.realm,p=r.player('owner'),h=r.state.properties.h;const initial=JSON.stringify(r.state.structures);assert.throws(()=>baseProgressionCommand(r,p,{type:'baseUpgrade',expectedLevel:1}),/bench level 2/);assert.equal(JSON.stringify(r.state.structures),initial);
  baseProgressionCommand(r,p,{type:'baseBenchUpgrade',expectedLevel:0});assert.throws(()=>baseProgressionCommand(r,p,{type:'baseBenchUpgrade',expectedLevel:0}),/changed/);
  baseProgressionCommand(r,p,{type:'baseBenchUpgrade',expectedLevel:1});baseProgressionCommand(r,p,{type:'baseUpgrade',expectedLevel:1});baseProgressionCommand(r,p,{type:'baseBenchUpgrade',expectedLevel:2});
  for(const chest of Object.values(r.state.structures))chest.hp=0;const before=JSON.stringify(r.state.structures);assert.throws(()=>baseProgressionCommand(r,p,{type:'baseUpgrade',expectedLevel:2}),/storage chests/);assert.equal(h.baseLevel,2);assert.equal(JSON.stringify(r.state.structures),before);
  p.interior=null;assert.throws(()=>baseProgressionCommand(r,p,{type:'baseUpgrade',expectedLevel:2}),/Approach/);p.interior=h.buildingId;r.state.structures.chest0.hp=200;r.state.structures.chest0.items={plank:29,stone:40,nails:12};const funds=JSON.stringify(r.state.structures);assert.throws(()=>baseProgressionCommand(r,p,{type:'baseUpgrade',expectedLevel:2}),/Missing materials/);assert.equal(JSON.stringify(r.state.structures),funds);
 }finally{s.close();}
});
test('real command replay charges once, persists levels and blocks forged building-kit bypasses',()=>{
 const s=setup();try{const p=s.realm.player('owner'),command={id:'bench',type:'baseBenchUpgrade',expectedLevel:0};s.transaction(r=>r.command(p.id,command));const once=JSON.stringify(s.realm.state.structures);s.transaction(r=>r.command(p.id,command));assert.equal(JSON.stringify(s.realm.state.structures),once);assert.equal(s.realm.state.properties.h.constructionBenchLevel,1);
  assert.throws(()=>checkBasePiece(s.realm,p,s.realm.state.settlements.s,'stonewall'),/level 4/);checkBasePiece(s.realm,p,s.realm.state.settlements.s,'chest');
  const state=structuredClone(s.realm.state);assert.equal(state.properties.h.tier,1);assert.equal(state.properties.h.constructionBenchLevel,1);assert.equal(state.accounts.owner.activeCharacterId,s.realm.state.accounts.owner.activeCharacterId);
  s.realm.state.properties.h.owner='other';assert.throws(()=>baseProgressionCommand(s.realm,p,{type:'baseBenchUpgrade',expectedLevel:1}),/owned home/);
 }finally{s.close();}
});
test('construction recipes require the nearby upgraded bench and retain lower-tier recipes after later upgrades',()=>{
 const s=setup();try{let r=s.realm,p=r.player('owner');p.professions.masonry=10;p.inventory={stone:20};
  assert.throws(()=>s.transaction(r=>r.command('owner',{id:'no-bench-cut',type:'craft',recipe:'cutStone'})),/construction bench level 2/);
  r=s.realm;p=r.player('owner');s.transaction(r=>r.command('owner',{id:'bench-one',type:'baseBenchUpgrade',expectedLevel:0}));s.transaction(r=>r.command('owner',{id:'bench-two',type:'baseBenchUpgrade',expectedLevel:1}));
  s.transaction(r=>r.command('owner',{id:'cut',type:'craft',recipe:'cutStone'}));assert.equal(s.realm.player('owner').inventory.cutStone,2);
  s.transaction(r=>r.command('owner',{id:'level-two',type:'baseUpgrade',expectedLevel:1}));s.transaction(r=>r.command('owner',{id:'bench-three',type:'baseBenchUpgrade',expectedLevel:2}));
  s.transaction(r=>r.command('owner',{id:'cut-again',type:'craft',recipe:'cutStone'}));assert.equal(s.realm.player('owner').inventory.cutStone,4);
  const h=s.realm.state.properties.h;assert.equal(h.constructionBenchLevel,3);assert.ok(s.realm.snapshot('owner').you.constructionBenchLevel>=2);
 }finally{s.close();}
});


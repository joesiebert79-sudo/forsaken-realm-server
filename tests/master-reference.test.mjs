import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
import {MASTER_LANDMARKS,MASTER_SIZE,MAP_SCALE,createMasterLayout,masterBlocked,ensureMasterResources} from '../server/master-geography.mjs';
test('reference geography has exactly 2 protected coastal hubs, 12 unsafe villages and 5 fixed castles',()=>{
 const m=createMasterLayout();assert.equal(m.settlements.length,14);assert.equal(m.protection.zones.length,2);assert.equal(m.castles.length,5);assert.equal(MASTER_LANDMARKS.filter(l=>l.kind==='village').length,12);
 assert.deepEqual([MASTER_LANDMARKS[0].x,MASTER_LANDMARKS[0].y],[177*MAP_SCALE,247*MAP_SCALE]);assert.deepEqual([MASTER_LANDMARKS[1].x,MASTER_LANDMARKS[1].y],[1372*MAP_SCALE,662*MAP_SCALE]);
 assert.ok(m.settlements.filter(s=>s.kind==='village').every(v=>!v.safe&&!v.traderZone));assert.equal(MASTER_SIZE.width/MASTER_SIZE.height,1.5);assert.equal(masterBlocked(0,0),true);
 for(const b of m.buildings){assert.equal(masterBlocked(b.x,b.y+45),false,b.id+' door on land');for(const o of m.buildings)if(o!==b)assert.ok(Math.abs(o.x-b.x)>o.halfWidth+b.halfWidth+10||Math.abs(o.y-b.y)>Math.max(o.depth,b.depth)+50,b.id+' overlap');}
 for(const p of m.roads.filter(p=>p.kind==='path'))for(let j=1;j<p.points.length;j++){const a=p.points[j-1],b=p.points[j],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/12);for(let n=0;n<=steps;n++){const x=a.x+(b.x-a.x)*n/steps,y=a.y+(b.y-a.y)*n/steps;assert.ok(!m.buildings.some(h=>Math.abs(x-h.x)<h.halfWidth+10&&y>h.y-h.depth-10&&y<h.y+10),p.id+' clear');}}
});
test('streamed harvest chunks retain depletion and never regenerate on revisit',()=>{
 const m=createMasterLayout(),state={resources:[]},p={x:370*MAP_SCALE,y:170*MAP_SCALE};ensureMasterResources(state,p,m.buildings);assert.ok(state.resources.length);state.resources[0].remaining=0;const before=JSON.stringify(state);ensureMasterResources(state,p,m.buildings);assert.equal(JSON.stringify(state),before);
});
test('master profile integrates neutral services, all doors, saves, fog and safe spawn without touching older saves',()=>{
 const script=`import assert from 'node:assert/strict';import {Realm} from './server/world.mjs';import {LAYOUT,databasePath} from './server/world-profile.mjs';import {roomFor,enterRoom,exitRoom} from './server/interiors.mjs';import {MERCHANTS} from './server/merchants.mjs';
 let now=1000000;const r=new Realm(undefined,()=>now,{ruleset:'master-v1'});for(const [id,faction]of[['a','survivor'],['b','bandit']]){r.join(id);r.command(id,{id:'create-'+id,type:'createCharacter',appearance:'male-1',profession:'farmer',faction});const p=r.player(id);assert.ok(r.safe(p));assert.ok(!r.blocks(p.x,p.y));}assert.equal(MERCHANTS.length,4);assert.equal(new Set(MERCHANTS.map(m=>m.townId)).size,2);
 for(const b of LAYOUT.buildings){const p={x:b.x,y:b.y+45,inventory:{wood:7}};assert.ok(roomFor(b.id),b.id);enterRoom(p,b.id);p.x=roomFor(b.id).exit.x;p.y=roomFor(b.id).exit.y;exitRoom(p);assert.equal(p.interior,null);assert.equal(p.inventory.wood,7);}
 const before=r.player('a').characterId;const save=structuredClone(r.state);const again=new Realm(save,()=>now,{ruleset:'master-v1'});again.join('a');assert.equal(again.player('a').characterId,before);assert.ok(databasePath('world.sqlite').endsWith('.master-reference.sqlite'));assert.throws(()=>new Realm({...save,profile:'day2-compact'}),/different world profile/);console.log('master integration passed');`;
 const run=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:new URL('..',import.meta.url),env:{...process.env,REALM_WORLD_PROFILE:'master-reference'},encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);
});


test('out-of-world travel cannot allocate unbounded master terrain chunk keys',()=>{
 const state={resources:[]};ensureMasterResources(state,{x:MASTER_SIZE.width+10000,y:MASTER_SIZE.height+10000},[]);
 assert.deepEqual(state.masterResourceChunks,{});assert.deepEqual(state.resources,[]);
 ensureMasterResources(state,{x:-10000,y:-10000},[]);assert.deepEqual(state.masterResourceChunks,{});
});

test('full-map house deed purchase, occupied-home rejection, claim and bed/stove interior persist',()=>{
 const script=`import assert from 'node:assert/strict';import {Realm} from './server/world.mjs';import {LAYOUT} from './server/world-profile.mjs';import {servicePosition} from './server/service-locations.mjs';import {roomFor} from './server/interiors.mjs';import {HOUSE_DESIGNS} from './server/housing-catalog.mjs';
 let now=1000000;const r=new Realm(undefined,()=>now,{ruleset:'master-v1'});r.join('same-permanent-id');r.command('same-permanent-id',{id:'create',type:'createCharacter',appearance:'male-1',profession:'farmer',faction:'survivor'});const p=r.player('same-permanent-id'),a=r.state.accounts[p.id];a.bank={gold:10000,tier:1,tokens:{}};Object.assign(p,servicePosition(LAYOUT.settlements[0],'bank'));const occupied=LAYOUT.buildings.find(b=>b.housingStatus==='occupied');Object.assign(p,{interior:null,x:occupied.x,y:occupied.y+35});assert.throws(()=>r.command(p.id,{id:'occupied',type:'housingPreview',design:occupied.houseDesign,target:occupied.id}),/not for sale/);Object.assign(p,servicePosition(LAYOUT.settlements[0],'bank'));const home=LAYOUT.buildings.find(b=>b.housingStatus==='vacant'),d=HOUSE_DESIGNS.find(d=>d.id===home.houseDesign);r.command(p.id,{id:'deed',type:'houseDeedBuy',design:d.id,quote:d.price});Object.assign(p,{interior:null,x:home.x,y:home.y+35});r.command(p.id,{id:'preview',type:'housingPreview',design:d.id,target:home.id});r.command(p.id,{id:'confirm',type:'housingConfirm',nonce:a.housingProposal.nonce});assert.equal(Object.values(r.state.properties).length,1);assert.equal(r.buildings.find(b=>b.id===home.id).housingStatus,'owned');assert.deepEqual(roomFor(home.id).fixtures.map(f=>f.kind),['bed','hearth','table']);const again=new Realm(structuredClone(r.state),()=>now,{ruleset:'master-v1'});again.join(p.id);assert.equal(again.player(p.id).characterId,p.characterId);assert.equal(again.buildings.find(b=>b.id===home.id).housingStatus,'owned');assert.ok(again.snapshot(p.id).housing.property);`;
 const run=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:new URL('..',import.meta.url),env:{...process.env,REALM_WORLD_PROFILE:'master-reference'},encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);
});

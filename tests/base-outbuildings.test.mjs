import test from 'node:test';import assert from 'node:assert/strict';
process.env.REALM_WORLD_PROFILE='master-reference';
const {OUTBUILDINGS,outbuildingRoom,validateOutbuildingPlacement}=await import('../server/base-outbuildings.mjs');
const {roomFor,roomBlocked,roomWorkstations,enterRoom,exitRoom}=await import('../server/interiors.mjs');
const {buildSettlement}=await import('../server/settlements.mjs');const {refreshHousing,canEnterHome}=await import('../server/housing-runtime.mjs');const {baseStorage}=await import('../server/base-progression.mjs');
test('all eight approved/authorized outbuilding rooms have connected doorways and reachable station/storage approaches',()=>{
 for(const kind of Object.keys(OUTBUILDINGS)){const id='annex:'+kind+':test',room=roomFor(id);assert.ok(room);assert.equal(room.id,id);assert.ok(!roomBlocked(room,310,400));const q=[{x:310,y:400}],seen=new Set(['310,400']);
  for(let i=0;i<q.length;i++)for(const [dx,dy]of [[10,0],[-10,0],[0,10],[0,-10]]){const n={x:q[i].x+dx,y:q[i].y+dy},key=n.x+','+n.y;if(seen.has(key)||roomBlocked(room,n.x,n.y))continue;seen.add(key);q.push(n);}
  for(const f of room.fixtures)assert.ok(q.some(p=>Math.hypot(p.x-f.x-f.w/2,p.y-f.y-f.h/2)<100),kind+':'+f.kind+' reachable');
  if(kind==='workshop')assert.ok(roomWorkstations({interior:id}).some(s=>s.station==='forge'));if(kind==='cookhouse')assert.ok(roomWorkstations({interior:id}).some(s=>s.station==='hearth'));if(kind==='smokehouse')assert.ok(roomWorkstations({interior:id}).some(s=>s.station==='smoker'));
 }
 assert.equal(outbuildingRoom('annex:unknown:test'),null);
});
function fixture(){const p={id:'owner',hp:100,x:10200,y:10200,inventory:{}},h={id:'h',buildingId:'home:hut:test',design:'hut',tier:1,rotation:0,x:10000,y:10000,settlementId:'s',baseLevel:8,landRadius:720,constructionBenchLevel:8,ownerType:'account',owner:'owner'},s={id:'s',propertyId:'h',ownerType:'account',owner:'owner',flagActive:true,x:10200,y:10200};const state={players:{owner:p},properties:{h},accounts:{owner:{id:'owner',settlementId:'s'}},settlements:{s},containers:{},structures:{materials:{id:'materials',kind:'chest',hp:200,x:10000,y:10100,settlementId:'s',owner:'owner',items:{plank:1000,stone:1000,nails:1000,wood:1000,iron:1000,seasonedPlank:1000,brick:1000,ironBraces:1000,fiber:1000}}}};const r={state,buildings:[],housingBase:[],blocks:()=>false,safe:()=>false,owns:()=>true,roadGeometry:{nearRoad:()=>false}};return {r,p,h,s};}
test('building uses owned storage, creates empty usable chests, keeps property permissions and synchronizes map buildings',()=>{
 const {r,p,h}=fixture();buildSettlement(r,p,{kind:'storehouse',x:10245,y:10200});const annex=Object.values(r.state.structures).find(s=>s.kind==='storehouse');assert.ok(annex);assert.equal(annex.propertyId,h.id);assert.equal(r.state.structures.materials.items.plank,965);assert.ok(r.buildings.some(b=>b.id===annex.id));assert.ok(r.housingBlocks(annex.x,annex.y));assert.deepEqual([p.x,p.y],[annex.x,annex.y+45]);
 const room=roomFor(annex.id);for(const [i,f]of room.fixtures.entries())if(f.kind==='chest')assert.deepEqual(r.state.containers['fixture:'+annex.id+':'+i].items,{});assert.equal(baseStorage(r,h).length,4);
 canEnterHome(r,p,annex.id);assert.throws(()=>canEnterHome(r,{id:'intruder'},annex.id),/another player/);enterRoom(p,annex.id,r.buildings);assert.equal(p.interior,annex.id);Object.assign(p,room.exit);exitRoom(p,r.buildings);assert.equal(p.interior,null);
 const saved=JSON.parse(JSON.stringify(r.state));r.state=saved;refreshHousing(r);assert.ok(r.buildings.some(b=>b.id===annex.id));
});
test('blocked footprints and insufficient bench reject without charging; destroyed buildings release trapped occupants',()=>{
 const {r,p,h,s}=fixture();h.constructionBenchLevel=1;const before=JSON.stringify(r.state.structures);assert.throws(()=>buildSettlement(r,p,{kind:'workshop',x:10245,y:10200}),/level 3/);assert.equal(JSON.stringify(r.state.structures),before);h.constructionBenchLevel=8;r.blocks=()=>true;assert.throws(()=>validateOutbuildingPlacement(r,p,s,'workshop',{x:10245,y:10200}),/obstacle/);assert.equal(JSON.stringify(r.state.structures),before);r.blocks=()=>false;
 buildSettlement(r,p,{kind:'cookhouse',x:10245,y:10200});const annex=Object.values(r.state.structures).find(s=>s.kind==='cookhouse');p.interior=annex.id;annex.hp=0;refreshHousing(r);assert.equal(p.interior,null);assert.ok(!r.buildings.some(b=>b.id===annex.id));
});


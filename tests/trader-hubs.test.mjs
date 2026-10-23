import test from 'node:test';
import assert from 'node:assert/strict';
import {TRADER_HUBS,traderHubRoom} from '../server/trader-hubs.mjs';
import {createMasterLayout} from '../server/master-geography.mjs';
import {roomFor,roomBlocked,enterRoom,exitRoom} from '../server/interiors.mjs';

test('both named hubs retain service IDs, footprint, map coordinates and existing neutral permissions',()=>{
 const layout=createMasterLayout();
 for(const [id,hub] of Object.entries(TRADER_HUBS)){
  const building=layout.buildings.find(b=>b.id===id);assert.ok(building);assert.equal(building.name,hub.name);
  assert.equal(building.faction,'neutral');assert.equal(building.role,'merchant');assert.equal(building.halfWidth,125);assert.equal(building.depth,80);
  assert.equal(roomFor(id,layout.buildings).name,hub.name);
  const p={x:building.x,y:building.y+45};enterRoom(p,id,layout.buildings);
  assert.equal(roomBlocked(roomFor(id,layout.buildings),p.x,p.y),false);
  Object.assign(p,roomFor(id,layout.buildings).exit);exitRoom(p,layout.buildings);assert.equal(p.interior,null);
 }
});

test('doorways have a connected walking route to the established NPC and counter approach in each hub',()=>{
 for(const id of Object.keys(TRADER_HUBS)){
  const room=traderHubRoom(id),seen=new Set(),queue=[{x:310,y:400}];
  for(let i=0;i<queue.length;i++){const p=queue[i];for(const [dx,dy]of [[10,0],[-10,0],[0,10],[0,-10]]){
   const n={x:p.x+dx,y:p.y+dy},key=n.x+','+n.y;if(seen.has(key)||roomBlocked(room,n.x,n.y))continue;seen.add(key);queue.push(n);
  }}
  assert.ok(seen.has('200,250'),id+' NPC accessible');assert.ok(seen.has('310,200'),id+' counter accessible');
  assert.equal(roomBlocked(room,200,250),false);assert.equal(room.fixtures.filter(f=>f.kind==='counter').length,1);
 }
 assert.equal(traderHubRoom('other-building'),null);
});

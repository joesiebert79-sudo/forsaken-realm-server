import test from 'node:test';
import assert from 'node:assert/strict';
import {createApprovedWorldLayout} from '../server/approved-world-layout.mjs';
import {createDay2Layout} from '../server/day2-layout.mjs';
import {masterBlocked} from '../server/master-geography.mjs';
import {migrateApprovedWorld} from '../server/approved-world-migration.mjs';
import {Realm} from '../server/world.mjs';
import {planCaravanRoute} from '../server/caravan-routing.mjs';

test('approved geography preserves building identities and clear approaches',()=>{
 const old=createDay2Layout(true),w=createApprovedWorldLayout();
 assert.equal(w.settlements.filter(s=>s.kind==='trader').length,2);
 assert.equal(w.settlements.filter(s=>s.kind==='village').length,12);
 assert.equal(w.castles.length,5);
 assert.equal(w.buildings.filter(b=>b.houseDesign).length,147);
 assert.ok(w.width>old.width*5&&w.height>old.height*4);
 for(const b of old.buildings)assert.ok(w.buildings.some(n=>n.id===b.id&&n.houseDesign===b.houseDesign),b.id);
 for(const b of w.buildings)assert.equal(masterBlocked(b.x,b.y+35),false,b.id+' door');
 for(const road of w.roads.filter(r=>r.kind==='path'))for(let i=1;i<road.points.length;i++){
  const a=road.points[i-1],b=road.points[i],steps=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/20);
  for(let n=0;n<=steps;n++){const x=a.x+(b.x-a.x)*n/steps,y=a.y+(b.y-a.y)*n/steps;
   assert.ok(!w.buildings.some(h=>Math.abs(x-h.x)<h.halfWidth+8&&y>h.y-h.depth-8&&y<h.y+8),road.id+' clear');
  }
 }
});

test('trader-to-trader caravan follows the continuous authored road network',()=>{
 const r=new Realm(undefined,()=>1000000,{ruleset:'master-v1'}),towns=createApprovedWorldLayout().settlements;
 const route=planCaravanRoute(r,towns[0],towns[1]);assert.ok(route&&route.points.length>10);
 assert.ok(route.cost>20000);assert.ok(route.roads.length>=2);
 assert.ok(Math.hypot(route.points[0].x-towns[0].x,route.points[0].y-towns[0].y)<3);
 assert.ok(Math.hypot(route.points.at(-1).x-towns[1].x,route.points.at(-1).y-towns[1].y)<3);
});

test('saved identity, ownership, inventory and interior remain intact after relocation',()=>{
 const old=createDay2Layout(true),w=createApprovedWorldLayout();
 const home=old.buildings.find(b=>b.houseDesign),propertyId='owned-home';
 const state={players:{p:{id:'p',x:home.x,y:home.y+35,inventory:{iron:27},level:9,interior:null}},companions:{p:{owner:'p',x:home.x+20,y:home.y+40,level:4}},properties:{[propertyId]:{id:propertyId,buildingId:home.id,x:home.x,y:home.y,design:home.houseDesign,level:5,owner:'p'}},structures:{forge:{id:'forge',propertyId,x:home.x+90,y:home.y+140,kind:'forge'},interior:{id:'interior',interior:home.id,x:40,y:55}},claims:{},resources:[],exploration:{},accounts:{p:{gold:777,bank:{gold:123}}}};
 const before=structuredClone(state);assert.equal(migrateApprovedWorld(state,w),true);
 const placed=w.buildings.find(b=>b.id===home.id);
 assert.deepEqual([state.properties[propertyId].x,state.properties[propertyId].y],[placed.x,placed.y]);
 assert.equal(state.structures.forge.x-placed.x,90);
 assert.equal(state.structures.forge.y-placed.y,140);
 assert.deepEqual([state.structures.interior.x,state.structures.interior.y],[40,55]);
 assert.deepEqual(state.players.p.inventory,before.players.p.inventory);
 assert.deepEqual(state.accounts,before.accounts);
 assert.equal(state.players.p.level,9);assert.equal(state.companions.p.level,4);
 const once=structuredClone(state);assert.equal(migrateApprovedWorld(state,w),false);assert.deepEqual(state,once);
});

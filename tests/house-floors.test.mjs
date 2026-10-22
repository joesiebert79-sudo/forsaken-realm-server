import test from 'node:test';import assert from 'node:assert/strict';
import {interact} from '../server/interaction.mjs';
import {homeRoom} from '../server/housing-catalog.mjs';import {descendDungeon,exitRoom,roomFor} from '../server/interiors.mjs';import {canEnterHome} from '../server/housing-runtime.mjs';
test('house basement is bound to the same property for every permitted visitor and returns upstairs',()=>{
 const id='home:cottage:fixture';const home=homeRoom(id),buildings=[{id,houseDesign:'cottage',x:1000,y:1000}];
 const a={id:'owner',interior:id,x:home.portal.x,y:home.portal.y},b={...a,id:'visitor'};descendDungeon(a);descendDungeon(b);assert.equal(a.interior,id+':basement');assert.equal(b.interior,a.interior);assert.equal(roomFor(a.interior).type,'basement');assert.deepEqual(roomFor(a.interior).fixtures,[],'no free trophies or storage');const vault=roomFor(a.interior);Object.assign(a,vault.exit);exitRoom(a,buildings);assert.equal(a.interior,id);assert.equal(a.x,home.portal.x);assert.throws(()=>exitRoom(a,buildings),/exit doorway/);
 const r={state:{properties:{h:{buildingId:id,ownerType:'account',owner:'owner'}},accounts:{},corpses:{}}};assert.doesNotThrow(()=>canEnterHome(r,a,id+':basement'));assert.throws(()=>canEnterHome(r,b,id+':basement'),/belongs/);Object.assign(b,{interior:id,x:home.portal.x,y:home.portal.y});assert.throws(()=>interact(r,b),/belongs/);assert.equal(b.interior,id);
});

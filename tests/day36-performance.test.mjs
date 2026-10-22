import test from 'node:test';import assert from 'node:assert/strict';
import {staticNearby} from '../server/spatial-index.mjs';
import {sceneTransport,SCENE_FIELDS} from '../server/scene-transport.mjs';
import {visibility} from '../server/world-visibility.mjs';
test('spatial queries preserve source ordering, harvest references, radius and interiors',()=>{
 const items=Array.from({length:40000},(_,i)=>({id:i,x:i*31%200000,y:i*73%130000,remaining:12}));const p={x:600,y:1000};
 const baseline=items.filter(o=>Math.hypot(o.x-p.x,o.y-p.y)<900);assert.deepEqual(staticNearby(items,p),baseline);
 const first=baseline[0];first.remaining=0;assert.equal(staticNearby(items,p).find(x=>x.id===first.id).remaining,0);
 items.push({id:'new',x:600,y:1000});assert.equal(staticNearby(items,p).at(-1).id,'new');assert.deepEqual(staticNearby(items,{...p,interior:'room'}),[]);
});
test('scene transport removes only unchanged scenery and invalidates ownership or interior changes',()=>{
 const full={you:{id:'one',hp:100},village:[{id:'house',owner:'one'}],roads:[],streams:[],terrain:[],towns:[],settlements:[],yards:[],enemies:[{id:'enemy',hp:90}]};
 const first=sceneTransport(full,'');const reduced=sceneTransport({...full,you:{id:'one',hp:70}},first.sceneRevision);
 assert.equal(reduced.you.hp,70);assert.deepEqual(reduced.enemies,full.enemies);assert.ok(!('village'in reduced));assert.ok('village'in full);
 const changed=sceneTransport({...full,village:[{id:'house',owner:'two'}]},first.sceneRevision);assert.ok(changed.village);assert.notEqual(changed.sceneRevision,first.sceneRevision);
 const room=sceneTransport({...full,village:[],roads:[],terrain:[]},first.sceneRevision);assert.deepEqual(room.village,[]);
 const merged={...first,...reduced};for(const k of SCENE_FIELDS)if(k in full)assert.deepEqual(merged[k],full[k]);
});
test('large exploration histories retain distant discovery without scanning or returning the whole map',()=>{
 const state={exploration:{one:{}}},p={id:'one',x:1000,y:1000};for(let i=0;i<100000;i++)state.exploration.one[(i+200)+',200']=true;
 const view=visibility(state,p);assert.ok(view.explored.length>0&&view.explored.length<2401);assert.equal(state.exploration.one['99999,200'],true);assert.ok(!view.explored.includes('99999,200'));
 const before=Object.keys(state.exploration.one).length;p.interior='house';assert.deepEqual(visibility(state,p).explored,[]);assert.equal(Object.keys(state.exploration.one).length,before);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {visibility,SIGHT_RADIUS,EXPLORE_RADIUS} from '../server/world-visibility.mjs';

test('explored map follows the route permanently while sight remains 500 units',()=>{
 const state={},player={id:'traveler',characterId:'traveler-1',x:1000,y:1000,interior:null};
 const first=visibility(state,player);
 assert.equal(first.radius,SIGHT_RADIUS);
 assert.equal(SIGHT_RADIUS,500);
 assert.ok(EXPLORE_RADIUS<SIGHT_RADIUS);
 const origin=Object.keys(state.exploration[player.characterId]);
 assert.ok(origin.length>0&&origin.length<30,'a visit uncovers a narrow area');
 player.x=3000;player.y=1000;
 visibility(state,player);
 for(const cell of origin)assert.equal(state.exploration[player.characterId][cell],true,'previously visited terrain stays uncovered');
 assert.equal(state.exploration[player.characterId]['30,30'],undefined,'unvisited terrain stays covered');
});

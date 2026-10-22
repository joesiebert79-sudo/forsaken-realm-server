import test from 'node:test';import assert from 'node:assert/strict';
import {migrateTravelLayout} from '../server/travel-migration.mjs';
import {createDay2Layout} from '../server/day2-layout.mjs';
test('existing player codes, characters, banks and inventory survive map expansion; migration is idempotent',()=>{
 const state={players:{code1:{id:'code1',characterId:'fixed-character',x:550,y:550,inventory:{wood:17},interior:null}},companions:{code1:{id:'fixed-pet',x:570,y:550}},accounts:{code1:{gold:42,bank:{gold:10000}}},resources:[{id:'day2-resource-1',remaining:0,readyAt:9999}],structures:{},settlements:{}};
 migrateTravelLayout(state,createDay2Layout());assert.equal(state.players.code1.id,'code1');assert.equal(state.players.code1.characterId,'fixed-character');assert.equal(state.accounts.code1.bank.gold,10000);assert.deepEqual(state.players.code1.inventory,{wood:17});assert.deepEqual([state.players.code1.x,state.players.code1.y],[700,700]);assert.equal(state.companions.code1.id,'fixed-pet');const before=structuredClone(state);migrateTravelLayout(state,createDay2Layout());assert.deepEqual(state,before);
});

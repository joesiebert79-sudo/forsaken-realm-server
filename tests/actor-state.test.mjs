import test from 'node:test';import assert from 'node:assert/strict';
import {direction16,recordActorMotion,actorAnimation} from '../server/actor-animation.mjs';
import {WILDLIFE_SPECIES,WILDLIFE_REFERENCE_OCCURRENCES,BIOME_SPAWNS} from '../server/wildlife-catalog.mjs';
test('server animation follows actual displacement, sustained gait and event timestamps',()=>{
 const p={role:'melee',hp:100,x:1,y:0};recordActorMotion(p,{x:0,y:0},1000,true);
 assert.deepEqual([actorAnimation(p,1100).entityId,actorAnimation(p,1100).action],['warrior','run']);
 p.x=2;recordActorMotion(p,{x:1,y:0},1150,true);assert.equal(actorAnimation(p,1200).startedAt,1000);
 assert.equal(actorAnimation(p,1500).action,'idle');
 p.lastAttack=1600;p.attackDX=0;p.attackDY=1;assert.equal(actorAnimation(p,1650).direction,4);
 p.lastHitAt=1700;assert.equal(actorAnimation(p,1750).action,'hit');
 p.hp=0;assert.equal(actorAnimation(p,5000).action,'death');assert.equal(actorAnimation(p,5000).startedAt,1700);
 const blocked=structuredClone(p);recordActorMotion(blocked,p,6000,true);assert.deepEqual(blocked.animationMotion,p.animationMotion);
 for(let d=0;d<16;d++)assert.equal(direction16(Math.cos(d*Math.PI/8),Math.sin(d*Math.PI/8)),d);
});
test('all approved wildlife labels are accounted for without incentivizing fawns or treating owned livestock as wild game',()=>{
 assert.equal(Object.keys(WILDLIFE_SPECIES).length,55);
 assert.equal(WILDLIFE_REFERENCE_OCCURRENCES.length,56);
 assert.equal(WILDLIFE_REFERENCE_OCCURRENCES.filter(x=>x.id==='coyote').length,2);
 assert.equal(WILDLIFE_SPECIES.fawn.huntable,false);assert.deepEqual(WILDLIFE_SPECIES.fawn.yields,{});
 for(const id of ['cow','bull','horse']){assert.equal(WILDLIFE_SPECIES[id].domestic,true);assert.ok(Object.values(BIOME_SPAWNS).every(rows=>!rows.some(r=>r.species===id)));}
 assert.equal(WILDLIFE_SPECIES.wildHorse.domestic,false);
 assert.ok(!('antler' in WILDLIFE_SPECIES.doe.yields));
 for(const id of ['trout','salmon','pike','bass','catfish'])assert.equal(WILDLIFE_SPECIES[id].fish,true);
});

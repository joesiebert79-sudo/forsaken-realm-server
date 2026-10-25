import test from 'node:test';
import assert from 'node:assert/strict';
import {Realm} from '../server/world.mjs';
import {createWildlife,wildlifeBiome,harvestWildlife,chooseSpecies} from '../server/wildlife.mjs';
import {WILDLIFE_SPECIES} from '../server/wildlife-catalog.mjs';

test('authored geography drives wildlife; there is no invented desert zone',()=>{
 assert.equal(wildlifeBiome(-100,-100),null);
 for(const biome of ['forest','mountain','plains','wetland','river']){
  const selected=chooseSpecies(biome,12345);
  assert.ok(WILDLIFE_SPECIES[selected].biomes.includes(biome));
  assert.equal(WILDLIFE_SPECIES[selected].domestic,false);
 }
});

test('juveniles and owned species yield no wild harvest; one carcass yields one traced batch',()=>{
 let now=3_000_000;const r=new Realm(undefined,()=>now,{allowDraftWildlife:true});r.join('hunter');
 const p=r.player('hunter');p.role='melee';p.roleRequired=false;p.x=10000;p.y=10000;p.inventory.axe=1;
 assert.throws(()=>createWildlife('cow',p.x+30,p.y,now),/Domestic/);
 const fawn=createWildlife('fawn',p.x+30,p.y,now);fawn.hp=0;fawn.killedAt=now;r.state.wildlife={[fawn.id]:fawn};
 assert.throws(()=>harvestWildlife(r,p,{target:fawn.id,id:'no-fawn'}),/cannot be harvested/);
 const deer=createWildlife('deer',p.x+40,p.y,now,'wild-deer');deer.hp=0;deer.killedAt=now;deer.killedBy='hunter';deer.quality='fine';r.state.wildlife[deer.id]=deer;
 const result=harvestWildlife(r,p,{target:deer.id,id:'harvest-deer'});
 assert.ok(Object.keys(result).length>=3);
 for(const id of Object.keys(result)){assert.equal(r.state.fieldLots[id].quality,'fine');assert.equal(r.state.fieldLots[id].provenance.species,'deer');}
 assert.throws(()=>harvestWildlife(r,p,{target:deer.id,id:'again'}),/unavailable/);
});

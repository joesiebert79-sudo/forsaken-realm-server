import test from 'node:test';import assert from 'node:assert/strict';
import {WORLD_BUILDINGS} from '../server/catalog.mjs';import {buildingPresentation} from '../server/building-presentation.mjs';import {MERCHANTS} from '../server/merchants.mjs';
import {Realm as Before} from './baseline-world.mjs';import {Realm as After} from '../server/world.mjs';
test('merchant presentation uses existing authoritative faction and service',()=>{for(const m of MERCHANTS){const b=WORLD_BUILDINGS.find(b=>b.id===m.interior);assert.ok(b);const p=buildingPresentation(b);assert.equal(p.faction,m.faction);if(m.shop==='Smithy')assert.equal(p.role,'smithy');if(m.shop==='Provisioner')assert.equal(p.role,'merchant');}});
test('presentation leaves saved world and snapshot gameplay identical',()=>{const before=new Before(undefined,()=>1000000,{ruleset:'master-v1'});before.join('day2-audit');const baseline=structuredClone(before.state);const after=new After(structuredClone(baseline),()=>1000000,{ruleset:'master-v1'});after.sessions=new Map(before.sessions);const a=before.snapshot('day2-audit'),b=after.snapshot('day2-audit');for(const v of b.village){delete v.faction;delete v.role;}assert.equal(b.worldProfile,'full');delete b.worldProfile;assert.ok(Array.isArray(b.fountains));delete b.fountains;assert.deepEqual(b,a);assert.deepEqual(after.state,before.state);});



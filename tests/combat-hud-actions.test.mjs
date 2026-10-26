import test from 'node:test';
import assert from 'node:assert/strict';
process.env.REALM_WORLD_PROFILE='master-reference';
const {Realm}=await import('../server/world.mjs');
const {defend}=await import('../server/combat.mjs');

test('HUD skills use server cooldowns and apply their advertised combat effects',()=>{
 let now=1_000_000;const realm=new Realm(undefined,()=>now,{ruleset:'master-v1'});
 realm.join('one');realm.command('one',{id:'create',type:'createCharacter',name:'Aster',appearance:'female-1',profession:'melee',faction:'bandit',companion:'wolf'});
 const p=realm.player('one');assert.equal(p.faction,'bandit');
 p.stamina=50;realm.command('one',{id:'focus',type:'activateSkill',slot:1});assert.equal(p.stamina,65);
 assert.equal(realm.snapshot('one').you.skillReadyAt[1],now+5000);
 assert.throws(()=>realm.command('one',{id:'focus-again',type:'activateSkill',slot:1}),/recovering/);
 realm.command('one',{id:'guard',type:'activateSkill',slot:2});assert.ok(p.skillGuardUntil>now);
 const guarded=defend({...p,armorSlots:{},equippedShield:false},20,now);
 const unguarded=defend({...p,armorSlots:{},equippedShield:false},20,now+5000);assert.ok(guarded<unguarded);
 p.hp=40;realm.command('one',{id:'rally',type:'activateSkill',slot:3});assert.equal(p.hp,75);
 now+=30_000;realm.command('one',{id:'focus-later',type:'activateSkill',slot:1});assert.ok(p.stamina>0);
});

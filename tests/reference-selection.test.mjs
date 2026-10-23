import test from 'node:test';
import assert from 'node:assert/strict';
process.env.REALM_WORLD_PROFILE='master-reference';
const {Realm}=await import('../server/world.mjs');
const {REFERENCE_COMPANIONS}=await import('../server/companions.mjs');
const {spendAttack,weaponReady}=await import('../server/weapon-actions.mjs');
const {ITEMS}=await import('../server/catalog.mjs');
const {civicLabel}=await import('../server/service-locations.mjs');
const {FACTION_TOWNS}=await import('../server/master-rules.mjs');
const classes=['melee','ranged','mage','rogue','paladin','necromancer'];
function fixture(role='melee',companion='wolf'){const r=new Realm(undefined,()=>1000000,{ruleset:'master-v1'});r.join('one');r.command('one',{id:'create',type:'createCharacter',appearance:'female-1',profession:role,faction:'survivor',companion});return r;}
test('only reference classes and all seven reference companions are offered; each selection creates real gear and a functional companion',()=>{
 for(const role of classes)for(const companion of Object.keys(REFERENCE_COMPANIONS)){
  const r=fixture(role,companion),s=r.snapshot('one'),p=r.player('one');
  assert.deepEqual(s.roles.map(x=>x.id),classes);assert.deepEqual(s.characterCreation.professions,classes);
  assert.equal(s.characterCreation.companions.length,7);assert.equal(s.companion.kind,companion);
  assert.ok(ITEMS[p.equippedWeapon]?.damage>0);assert.ok(p.inventory[p.equippedWeapon]>0);
  assert.equal(s.companion.hp,REFERENCE_COMPANIONS[companion].maxHp);
  assert.ok(!s.services.mission);
 }
});
test('mission service is absent until activation and never offers remote reward claims',()=>{
 const r=fixture(),p=r.player('one');p.legendary={chain:'wild',chapter:0,baseline:0};
 const s=r.snapshot('one');assert.equal(s.services.mission.rows.length,1);assert.match(s.services.mission.rows[0].detail,/Thin the wolf packs/);assert.equal(s.services.mission.rows[0].action,undefined);
 p.legendary=null;assert.equal(r.snapshot('one').services.mission,undefined);
});
test('crafting halls have a service name without changing mission or banking signs',()=>{
 for(const town of FACTION_TOWNS.filter(t=>t.traderZone!==false&&t.id.startsWith('day2-master-'))){assert.equal(civicLabel(town.id+'-workshop'),'CRAFTING HALL');assert.equal(civicLabel(town.id+'-missions'),'MISSIONS');}
});
test('staff attacks use the real stamina and cooldown pipeline with the correct damage type',()=>{
 for(const [role,kind] of [['mage','fire'],['necromancer','poison']]){const r=fixture(role),p=r.player('one'),w=ITEMS[p.equippedWeapon],stamina=p.stamina;assert.equal(spendAttack(r,p,w,1000000),kind);assert.equal(p.stamina,stamina-10);assert.throws(()=>weaponReady(p,w,1000001),/cooldown/);}
});
test('existing survivor adopts reference class once without losing identity, progression, inventory or account',()=>{
 const r=fixture('farmer'),p=r.player('one'),a=r.state.accounts.one,id=p.characterId;p.level=12;p.xp='1337';p.inventory={axe:1,wood:17};delete p.backpackGrid;const gold=a.gold;
 r.command('one',{id:'adopt',type:'adoptReferenceClass',profession:'rogue',appearance:'male-2',companion:'raven'});
 assert.equal(p.characterId,id);assert.equal(p.level,12);assert.equal(p.xp,'1337');assert.equal(p.inventory.wood,17);assert.equal(a.gold,gold);assert.equal(p.role,'rogue');assert.equal(r.state.companions.one.kind,'raven');assert.ok(a.previousCompanion);
 assert.throws(()=>r.command('one',{id:'again',type:'adoptReferenceClass',profession:'mage',appearance:'male-2',companion:'wolf'}),/already selected/);
});

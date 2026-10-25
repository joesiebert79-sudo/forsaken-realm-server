import {recordActorMotion} from './actor-animation.mjs';
import {revokeRepairProtection} from './sieges.mjs';
import {contractKill} from './contracts.mjs';
import {companionRank} from './companion-progression.mjs';
import {EXPERIENCE,maxStamina} from './skill-balance.mjs';
import {ensureCharacterProgression,awardXp} from './character-progression.mjs';
import {clanFriendlyFireBlocked} from './clans.mjs';
import {masterEnabled,spawnFor} from './accounts.mjs';
import {randomUUID} from 'node:crypto';
import {buildingBlocks} from './catalog.mjs';
import {roomFor,roomBlocked} from './interiors.mjs';
import {clearStrike,recordHit,defend} from './combat.mjs';
import {killEnemy} from './enemies.mjs';
export const COMPANIONS=Object.freeze({
 soldier:{kind:'dog',name:'War Dog',maxHp:130,damage:12,speed:165,skill:'Rending Bite',description:'A powerful bite adds 14 damage every 8 seconds.',cooldown:8000},
 hunter:{kind:'wolf',name:'Grey Wolf',maxHp:110,damage:11,speed:180,skill:'Hamstring',description:'A bite slows its target by 35% for 3 seconds, every 10 seconds.',cooldown:10000},
 farmer:{kind:'horse',name:'Farm Horse',maxHp:160,damage:8,speed:190,skill:'Second Wind',description:'A hoof strike restores 20 of your stamina every 12 seconds.',cooldown:12000},
 woodsman:{kind:'bear',name:'Forest Bear',maxHp:210,damage:16,speed:130,skill:'Crushing Maul',description:'A heavy maul adds 24 damage every 12 seconds.',cooldown:12000},
 smith:{kind:'boar',name:'Iron Boar',maxHp:150,damage:10,speed:150,skill:'Ironhide Charge',description:'Tusk strike adds 10 damage every 10 seconds. Armour always absorbs 30% of incoming damage.',cooldown:10000}
});
export const REFERENCE_COMPANIONS=Object.freeze({
 wolf:{kind:'wolf',name:'Wolf',maxHp:110,damage:11,speed:180,skill:'Hamstring',description:'Slows a struck target for three seconds.',cooldown:10000},
 direWolf:{kind:'direWolf',name:'Dire Wolf',maxHp:140,damage:13,speed:170,skill:'Rending Bite',description:'A heavy bite every ten seconds.',cooldown:10000},
 horse:{kind:'horse',name:'Horse',maxHp:160,damage:8,speed:190,skill:'Second Wind',description:'A hoof strike restores twenty stamina.',cooldown:12000},
 warBear:{kind:'warBear',name:'War Bear',maxHp:210,damage:16,speed:130,skill:'Crushing Maul',description:'A heavy maul every twelve seconds.',cooldown:12000},
 raven:{kind:'raven',name:'Raven',maxHp:80,damage:8,speed:200,skill:'Raking Talons',description:'A fast companion with a timed talon strike.',cooldown:8000},
 loneWolf:{kind:'loneWolf',name:'Lone Wolf',maxHp:120,damage:12,speed:180,skill:'Rending Bite',description:'A swift wolf with a timed heavy bite.',cooldown:10000},
 familiar:{kind:'familiar',name:'Familiar',maxHp:90,damage:10,speed:170,skill:'Ember Bite',description:'A small companion with a timed ember bite.',cooldown:10000}
});
export const companionSpec=pet=>REFERENCE_COMPANIONS[pet.kind]||Object.values(COMPANIONS).find(s=>s.kind===pet.kind)||COMPANIONS[pet.role];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const sameRoom=(a,b)=>(a.interior||null)===(b.interior||null);
const blockedFor=(realm,p)=>{const room=roomFor(p.interior,realm.buildings);return room?(x,y)=>roomBlocked(room,x,y):realm.blocks;};
export function ensureCompanion(realm,p){
 const spec=REFERENCE_COMPANIONS[p.companionKind]||(['melee','ranged','mage','rogue','paladin','necromancer'].includes(p.role)?REFERENCE_COMPANIONS.wolf:null)||(masterEnabled(realm)&&!p.legacyCharacter&&p.role==='farmer'?COMPANIONS.soldier:COMPANIONS[p.role]);if(!spec)return null;
 realm.state.companions??={};let pet=realm.state.companions[p.id];
 if(!pet){pet={id:randomUUID(),owner:p.id,role:p.role,kind:spec.kind,name:spec.name,maxHp:spec.maxHp,hp:spec.maxHp,x:p.x,y:p.y,interior:p.interior||null,mode:'follow',target:null,lastAttack:0,skillReadyAt:0};realm.state.companions[p.id]=pet;if(p.hp<=0)resetCompanion(realm,p);}
 if(masterEnabled(realm)){ensureCharacterProgression(pet);pet.maxHp=Math.round(companionSpec(pet).maxHp*(1+companionRank(pet,'vigor')*.04));pet.hp=Math.min(pet.hp,pet.maxHp);}
 return pet;
}
export function dismount(realm,p){if(!p)return;p.mounted=false;const pet=realm.state.companions?.[p.id];if(pet?.mode==='ridden'){pet.mode='follow';pet.active=false;}}
export function rideCompanion(realm,p){if(p.mounted){dismount(realm,p);return;}const pet=ensureCompanion(realm,p);if(!pet||pet.kind!=='horse')throw Error('Only your horse companion can be ridden');if(p.interior||pet.interior||pet.hp<=0||pet.mode==='recovering'||pet.mode==='waiting'||distance(p,pet)>65||!clearStrike(p,pet,realm.blocks))throw Error('Approach your healthy horse outdoors to ride');if(p.blockUntil>realm.clock()||p.dodgeUntil>realm.clock())throw Error('Finish blocking or dodging before mounting');p.mounted=true;pet.mode='ridden';pet.target=null;pet.x=p.x;pet.y=p.y;pet.active=false;}
export function resetCompanion(realm,p){p.mounted=false;const pet=realm.state.companions?.[p.id];if(!pet)return;Object.assign(pet,{...(masterEnabled(realm)?spawnFor(p):{x:512,y:512}),interior:null,hp:pet.maxHp,mode:'waiting',target:null,active:false,recoverAt:0,stuckFor:0,slowUntil:0});}
export function downCompanion(realm,pet){const owner=realm.state.players[pet.owner];if(owner)owner.mounted=false;Object.assign(pet,{hp:0,mode:'recovering',target:null,active:false,recoverAt:realm.clock()+60000-companionRank(pet,'recovery')*4000});}
export function companionDamage(pet,damage){return pet.kind==='boar'?Math.ceil(damage*.7):damage;}
export function findCompanion(realm,id){return Object.values(realm.state.companions||{}).find(c=>c.id===id);}
function targetFor(realm,id){return realm.state.enemies[id]||realm.state.players[id]||findCompanion(realm,id);}
function allowed(realm,p,pet,target){
 if(target&&clanFriendlyFireBlocked(realm,p,target.owner?realm.state.players[target.owner]||target:target))return false;
 if(!target||target===p||target===pet||target.owner===p.id||target.hp<=0||p.hp<=0||pet.hp<=0||!sameRoom(p,pet)||!sameRoom(p,target)||distance(p,pet)>300||distance(p,target)>300||realm.safe(p)||realm.safe(pet)||realm.safe(target))return false;
 if(realm.state.players[target.id]&&!realm.sessions.has(target.id))return false;
 if(target.owner&&realm.state.companions[target.owner]===target&&!realm.sessions.has(target.owner))return false;
 return true;
}
export function commandCompanion(realm,p,command){
 const pet=ensureCompanion(realm,p);if(!pet)throw new Error('Choose a role to receive a companion');
 if(command.type==='companionStay'){if(pet.hp<=0||pet.mode==='recovering'||pet.mode==='waiting')throw Error('Your companion is recovering or waiting at respawn');dismount(realm,p);pet.mode='stay';pet.target=null;pet.active=false;pet.stuckFor=0;return;}
 if(command.type==='companionFollow'){dismount(realm,p);pet.target=null;if(pet.mode!=='recovering'&&pet.mode!=='waiting')pet.mode='follow';pet.active=false;return;}
 if(command.type==='companionRetreat'){dismount(realm,p);pet.target=null;if(pet.mode!=='recovering'&&pet.mode!=='waiting')pet.mode='retreat';pet.active=false;return;}
 if(p.mounted)throw Error('Dismount before commanding an attack');
 if(pet.mode==='recovering'||pet.mode==='waiting')throw new Error('Your companion is recovering or waiting in the safe town');
 const target=targetFor(realm,command.target);if(!allowed(realm,p,pet,target))throw new Error('Companion target protected or outside 300-unit command range');
 pet.target=target.id;pet.mode='attack';
}
function hit(realm,pet,victim,damage,now){
 if(masterEnabled(realm)&&!realm.state.enemies[victim.id]&&realm.state.players[pet.owner])revokeRepairProtection(realm,realm.state.players[pet.owner]);
 const isPet=victim.owner&&realm.state.companions[victim.owner]===victim;
 recordHit(pet,victim,pet.kind,isPet?companionDamage(victim,damage):defend(victim,damage,now),now);
 if(victim.hp<=0){if(realm.state.enemies[victim.id]){killEnemy(realm,victim,now);if(masterEnabled(realm)&&realm.state.players[pet.owner])contractKill(realm.state.players[pet.owner],victim);if(masterEnabled(realm))awardXp(pet,EXPERIENCE.companionEnemy,realm.progressionBalance);}else if(isPet)downCompanion(realm,victim);else realm.die(victim,now);}
}
function move(pet,target,speed,dt,blocked,stop=0){
 const d=distance(pet,target);if(d<=stop)return false;const step=Math.min(d-stop,speed*dt),dx=(target.x-pet.x)/d*step,dy=(target.y-pet.y)/d*step;
 const beforeX=pet.x,beforeY=pet.y;const slices=Math.max(1,Math.ceil(step/6));
 for(let i=0;i<slices;i++){if(!blocked(pet.x+dx/slices,pet.y))pet.x+=dx/slices;if(!blocked(pet.x,pet.y+dy/slices))pet.y+=dy/slices;}
 if(distance(pet,{x:beforeX,y:beforeY})>.1){pet.facingDX=dx;pet.facingDY=dy;return true;}return false;
}
export function tickCompanions(realm,dt){
 const now=realm.clock();
 for(const id of realm.sessions.keys()){
  const p=realm.state.players[id],pet=ensureCompanion(realm,p);if(!pet)continue;pet.active=false;
  if(p.hp<=0)continue;
  if(p.mounted){if(pet.kind!=='horse'||pet.hp<=0||p.interior)dismount(realm,p);else{pet.x=p.x;pet.y=p.y;pet.interior=null;pet.mode='ridden';pet.target=null;pet.active=now-(p.lastMove||0)<200;continue;}}
  if(pet.mode==='ridden')pet.mode='follow';
  if(pet.interior){const b=realm.buildings.find(b=>b.id===pet.interior.replace(/:dungeon$/,''));if(b){pet.x=b.x;pet.y=b.y+65;pet.interior=null;pet.target=null;if(pet.mode==='attack')pet.mode='follow';}}
  if(pet.mode==='stay'){if(realm.safe(pet))pet.hp=Math.min(pet.maxHp,pet.hp+dt*8);continue;}
  if(pet.mode==='recovering'){if(now<pet.recoverAt)continue;resetCompanion(realm,p);}
  if(pet.mode==='waiting'){if(!sameRoom(p,pet)||distance(p,pet)>140)continue;pet.mode='follow';}
  const spec=companionSpec(pet),blocked=blockedFor(realm,p);
  // A companion uses the owner's established doorway transition, never changes it.
  // Companions stay outdoors, regardless of safe-zone boundaries.
  // Recover companions saved indoors by placing them outside that building.
  if(p.interior){pet.target=null;if(pet.mode==='attack'||pet.mode==='retreat')pet.mode='follow';continue;}
  if(pet.mode==='follow'){
   const candidates=[];
   if(now-(p.lastAttack||0)<8000)candidates.push(p.lastCombatTarget);
   if(now-(p.lastHitAt||0)<8000)candidates.push(p.lastAttackerId);
   if(now-(pet.lastHitAt||0)<8000)candidates.push(pet.lastAttackerId);
   for(const id of candidates){const candidate=targetFor(realm,id);if(allowed(realm,p,pet,candidate)){pet.target=id;pet.mode='attack';break;}}
  }
  let target=pet.mode==='attack'?targetFor(realm,pet.target):null;
  if(target&&!allowed(realm,p,pet,target)){target=null;pet.target=null;pet.mode='follow';}
  if(pet.mode==='attack'&&!target){pet.mode='follow';pet.target=null;}
  if(target){
   const before={x:pet.x,y:pet.y};pet.active=move(pet,target,spec.speed*(1+companionRank(pet,'agility')*.02)*(pet.slowUntil>now?.65:1),dt,blocked,34);
   recordActorMotion(pet,before,now,true);
   if(distance(pet,target)<=38&&now-pet.lastAttack>=1100&&now>=(pet.attackReadyAt||0)&&clearStrike(pet,target,blocked)){
    const skill=now>=(pet.skillReadyAt||0);let damage=spec.damage;
    if(skill){if(pet.kind==='dog')damage+=14;if(pet.kind==='bear'||pet.kind==='warBear')damage+=24;if(['direWolf','loneWolf'].includes(pet.kind))damage+=14;if(['raven','familiar'].includes(pet.kind))damage+=8;if(pet.kind==='boar')damage+=10;pet.skillReadyAt=now+spec.cooldown*(1-companionRank(pet,'discipline')*.03);pet.lastSkillAt=now;}
    const canAffect=!(target.dodgeUntil>now);hit(realm,pet,target,damage*(1+companionRank(pet,'ferocity')*.03),now);
    if(skill&&canAffect&&pet.kind==='wolf'&&target.hp>0)target.slowUntil=now+3000;
    if(skill&&pet.kind==='horse')p.stamina=Math.min(maxStamina(p),p.stamina+20);
    realm.state.revision++;
   }
  }else{
   const before={x:pet.x,y:pet.y};pet.active=move(pet,p,spec.speed*(1+companionRank(pet,'agility')*.02)*(pet.mode==='retreat'?1.25:1),dt,blocked,48);
   recordActorMotion(pet,before,now,pet.mode==='retreat');
   pet.stuckFor=distance(pet,p)>100&&!pet.active?(pet.stuckFor||0)+dt:0;
   // Recall a stuck follower; never teleport into an attack. Door/fixture collision stays authoritative.
   if(pet.stuckFor>5||distance(pet,p)>650){pet.x=p.x;pet.y=p.y;pet.stuckFor=0;pet.attackReadyAt=now+2000;}
   if(distance(pet,p)<60&&pet.mode==='retreat')pet.mode='follow';
   if(realm.safe(pet))pet.hp=Math.min(pet.maxHp,pet.hp+dt*8);
  }
 }
}
export function companionView(pet,ownerId){if(!pet)return null;const {owner,target,stuckFor,...view}=pet;return {...view,yours:owner===ownerId,skill:companionSpec(pet).skill,skillDescription:companionSpec(pet).description};}






import {clearDefensiveStrike} from './base-defenses.mjs';
import {randomInt} from 'node:crypto';
import {rareEquipmentDrop} from './item-commerce.mjs';
import {navigate} from './navigation.mjs';
import {legendaryKill} from './legendary-missions.mjs';
import {societyDeath} from './societies.mjs';
import {downCompanion,companionDamage} from './companions.mjs';
import {defend,clearStrike,recordHit} from './combat.mjs';
import { ENEMIES, WORLD, ITEMS, buildingBlocks } from './catalog.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const AI_LIMITS=Object.freeze({perPlayer:2,total:64,activation:240,leash:180,respawnMs:600000});
const safe=p=>WORLD.safeTowns.some(t=>distance(t,p)<=t.radius+20);
export function equipEnemy(e,reset=false){
 if(e.inventory&&!reset)return;
 const animal=/wolf|boar|bear|rat|hound/.test(e.kind);
 e.equippedWeapon=animal?'':/archer|poacher/.test(e.kind)?'bow':/spearman/.test(e.kind)?'spear':/raider|brigand|bandit/.test(e.kind)?'axe':'sword';
 e.equippedShield=!animal&&/knight|guard|deserter/.test(e.kind);
 e.equippedArmour=!animal?(/knight|guard/.test(e.kind)?'mail':'tunic'):null;
 e.inventory=animal?{hide:2,rawMeat:2,fat:1,bone:1}:{[e.equippedWeapon]:1,bread:1,helmet:1};
 if(e.equippedShield)e.inventory.shield=1;
 if(e.equippedArmour)e.inventory[e.equippedArmour]=1;
 if(e.equippedWeapon==='bow')e.inventory.arrow=12;
 e.range=e.equippedWeapon==='bow'?120:e.equippedWeapon==='spear'?65:35;
}
export function createEnemies(){
 const enemies={};const biomes=Object.keys(ENEMIES);
 for(let zone=0;zone<4;zone++)for(let i=0;i<30;i++){
  const kind=ENEMIES[biomes[zone]][i%5];
  const x=180+(zone%2)*2048+(i*293)%1650,y=180+Math.floor(zone/2)*2048+(i*457)%1650;
  if(safe({x,y}))continue;
  const id=`enemy-${zone}-${i}`;const rank=i%5;
  enemies[id]={id,kind,biome:biomes[zone],x,y,homeX:x,homeY:y,hp:40+rank*15,maxHp:40+rank*15,damage:5+rank*2,speed:rank===0?85:55,range:rank===2?120:35,lastAttack:0,respawnAt:0,active:false};
 }
 for(const e of Object.values(enemies))equipEnemy(e);
 return enemies;
}
export function tickEnemies(realm,dt){
 const now=realm.clock();const players=[...realm.sessions.keys()].map(id=>realm.state.players[id]).filter(p=>p.hp>0&&!p.interior&&!realm.safe(p)&&!p.roleRequired);
 const counts=new Map();let active=0;
 // Nearest-first allocation avoids activating an entire crowd near one survivor.
 const candidates=[];
 for(const enemy of Object.values(realm.state.enemies)){
  enemy.retaliating=false;if(enemy.aggroUntil&&enemy.aggroUntil<=now){delete enemy.aggro;delete enemy.aggroUntil;}if(enemy.caravanId||enemy.interior)continue;if(enemy.societyId&&!(enemy.aggroUntil>now))continue;enemy.active=false;
  if(enemy.hp<=0){if(enemy.legendaryOwner)continue;if(now>=enemy.respawnAt&&!players.some(p=>distance(enemy,p)<220)){equipEnemy(enemy,true);enemy.lootDropped=false;enemy.hp=enemy.maxHp;enemy.x=enemy.homeX;enemy.y=enemy.homeY;}else continue;}
  const attacker=players.find(p=>p.id===enemy.aggro&&enemy.aggroUntil>now&&distance(enemy,p)<=750);
  if(enemy.aggro&&!attacker){delete enemy.aggro;delete enemy.aggroUntil;}
  if(enemy.societyId&&!attacker)continue;
  let target=attacker||null,best=attacker?distance(enemy,attacker):AI_LIMITS.activation;
  for(const p of attacker?[]:players){const d=distance(enemy,p);if(d<best&&distance({x:enemy.homeX,y:enemy.homeY},p)<AI_LIMITS.leash){best=d;target=p;}}
  if(target)candidates.push({enemy,target,d:best,provoked:!!attacker});
  else if(distance(enemy,{x:enemy.homeX,y:enemy.homeY})>1){const d=distance(enemy,{x:enemy.homeX,y:enemy.homeY});const step=Math.min(d,enemy.speed*dt);enemy.x+=(enemy.homeX-enemy.x)/d*step;enemy.y+=(enemy.homeY-enemy.y)/d*step;}
 }
 candidates.sort((a,b)=>Number(b.provoked)-Number(a.provoked)||a.d-b.d||a.enemy.id.localeCompare(b.enemy.id));
 for(const candidate of candidates){
  const enemy=candidate.enemy;let target=candidate.target;
  if(active>=AI_LIMITS.total||(counts.get(target.id)||0)>=AI_LIMITS.perPlayer||target.hp<=0)continue;
  counts.set(target.id,(counts.get(target.id)||0)+1);active++;enemy.active=true;enemy.retaliating=!!candidate.provoked;
  const pet=realm.state.companions?.[target.id];if(pet&&pet.hp>0&&!pet.interior&&pet.mode==='attack'&&pet.target===enemy.id&&distance(enemy,pet)<90&&!realm.safe(pet))target=pet;
  const d=distance(enemy,target);
  if(d>enemy.range){navigate(realm,enemy,target,Math.min(dt,Math.max(0,(d-enemy.range)/(enemy.speed||55)))*(enemy.slowUntil>now?.65:1));}
  else if(now-enemy.lastAttack>=1400&&!realm.safe(target)&&!realm.safe(enemy)){
   if(!clearDefensiveStrike(realm,enemy,target,ITEMS[enemy.equippedWeapon])){navigate(realm,enemy,target,dt);continue;}
   const ranged=enemy.equippedWeapon==='bow',canShoot=ranged&&(enemy.inventory.arrow||0)>0;if(ranged&&!canShoot&&d>35){enemy.range=35;continue;}if(canShoot){enemy.inventory.arrow--;if(!enemy.inventory.arrow)delete enemy.inventory.arrow;}
   recordHit(enemy,target,ranged&&!canShoot?'':enemy.equippedWeapon,target===pet?companionDamage(pet,ranged&&!canShoot?3:enemy.damage):defend(target,ranged&&!canShoot?3:enemy.damage,now),now);realm.state.revision++;
   if(target.hp===0){if(target===pet)downCompanion(realm,pet);else realm.die(target,now);}
  }
 }
 realm.activeEnemyCounts=counts;return active;
}
export function killEnemy(realm,enemy,now){
 if(enemy.lootDropped)return;
 equipEnemy(enemy);legendaryKill(realm,enemy);enemy.lootDropped=true;enemy.active=false;enemy.respawnAt=now+AI_LIMITS.respawnMs;
 const random=()=>randomInt(0,0x1000000)/0x1000000;const source=enemy.legendaryOwner?'boss':enemy.id?.startsWith('master-encounter-')&&enemy.maxHp>=100&&!realm.safe(enemy)?'dangerous-exploration':null;const rare=rareEquipmentDrop(source,random);if(rare)enemy.inventory[rare]=(enemy.inventory[rare]||0)+1;const id=`loot-${enemy.id}-${now}`;
 realm.state.corpses[id]={id,x:enemy.x,y:enemy.y,interior:enemy.interior||null,items:structuredClone(enemy.inventory),name:enemy.kind,owner:enemy.id,createdAt:now};enemy.inventory={};if(enemy.societyId)societyDeath(realm,enemy);
}





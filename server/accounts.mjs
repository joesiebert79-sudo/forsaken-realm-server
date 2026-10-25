import {checkBackpack,checkWeight,carryWeight} from './backpack-capacity.mjs';
import {APPROVED_WORLD,DAY4,EFFICIENCY,MASTER} from './world-profile.mjs';
import {wallet} from './currency.mjs';
import {STARTING_GOLD} from './skill-balance.mjs';
import {addWhole} from './master-rules.mjs';
import {randomUUID} from 'node:crypto';
import {APPEARANCES,INITIAL_PROFESSIONS,FACTION_TOWNS,CORPSE_LIFETIME_MS} from './master-rules.mjs';
import {ROLES,chooseRole} from './roles.mjs';
import {REFERENCE_COMPANIONS,ensureCompanion} from './companions.mjs';
import {buildingById} from './interiors.mjs';
export const masterEnabled=r=>r.state.ruleset==='master-v1';
export function accountFor(r,p){
 r.state.accounts??={};
 if(!Object.hasOwn(r.state.accounts,p.id))r.state.accounts[p.id]={id:p.id,username:p.id,activeCharacterId:p.role?randomUUID():null,characters:{},gold:0,bank:null,reputation:0,clanId:p.kingdom||null,settlementId:null,relocationLockedUntil:0};
 const a=r.state.accounts[p.id];
 // Account-wide one-time grant, including accounts from earlier playtests.
 if(masterEnabled(r)&&a.startingGoldGranted!==true){a.gold=addWhole(a.gold||0,STARTING_GOLD);a.startingGoldGranted=true;}
 if(p.role&&!p.characterId){p.characterId=a.activeCharacterId||randomUUID();a.activeCharacterId=p.characterId;p.legacyCharacter=true;p.creationRequired=true;}
 if(!p.role){p.creationRequired=true;p.roleRequired=true;}
 if(p.characterId)a.characters[p.characterId]??={id:p.characterId,profession:p.role,legacy:!!p.legacyCharacter};
 // Owner-requested personal-bank credit; receipt survives reconnect and restart.
 if(masterEnabled(r)&&p.id==='lan-player-1'&&a.bank&&!a.ownerBankCredit20261019){
  a.bank.gold=addWhole(a.bank.gold||0,10000);
  a.ownerBankCredit20261019={gold:10000,at:r.clock()};
 }
 return a;
}
export function townAt(r,position){const pos=position.interior?buildingById(position.interior):position;return pos&&FACTION_TOWNS.find(t=>Math.hypot(t.x-pos.x,t.y-pos.y)<=t.radius);}
export function authorizedTown(r,p){const town=townAt(r,p);return (town?.traderZone!==false)&&(town?.faction===p.faction||town?.faction==='neutral')?town:null;}
export function canEnter(r,p,position){const town=townAt(r,position);return EFFICIENCY||!town||town.traderZone===false||town.faction==='neutral'||town.faction===p.faction;}
export function spawnFor(p){const t=MASTER||APPROVED_WORLD?FACTION_TOWNS[p.faction==='bandit'?1:0]:FACTION_TOWNS.find(t=>t.faction===(p.faction||'survivor'));return {x:t.x,y:t.y};}
export function createCharacter(r,p,command){
 const a=accountFor(r,p);
 if(!p.creationRequired)throw Error('Appearance, faction and profession are already selected');
 if(command.name!==undefined&&!(typeof command.name==='string'&&/^[\p{L}\p{N} '-]{1,20}$/u.test(command.name.trim())))throw Error('Character name must be 1–20 letters, numbers, spaces, hyphens or apostrophes');
 if(!APPEARANCES.some(v=>v.id===command.appearance))throw Error('Choose one of the four appearances');
 if(!['survivor','bandit'].includes(command.faction))throw Error('Choose Survivor or Bandit');
 if(!p.legacyCharacter&&![...INITIAL_PROFESSIONS,'farmer','hunter'].includes(command.profession))throw Error('Choose one of the six approved classes');
 if(p.legacyCharacter&&command.profession!==p.role)throw Error('Existing profession and progress must be preserved');
 if(!p.legacyCharacter&&command.companion&&!Object.hasOwn(REFERENCE_COMPANIONS,command.companion))throw Error('Choose a reference companion');
 if(!p.legacyCharacter){p.companionKind=command.companion||'wolf';chooseRole(r,p,command.profession);if(command.profession==='hunter'){delete p.startingItems.fishingRod;delete p.inventory.fishingRod;}p.characterId=randomUUID();p.level=1;p.xp=0;p.skillPoints=0;p.skills={};p.armorMastery={};}
 p.characterName=command.name?.trim()||p.characterName||p.id.slice(0,20);p.appearance=command.appearance;const appearance=APPEARANCES.find(a=>a.id===p.appearance);p.sex=appearance.sex;p.bodyStyle=appearance.bodyStyle;p.faction=command.faction;p.creationRequired=false;p.roleRequired=false;
 Object.assign(p,spawnFor(p));p.interior=null;a.activeCharacterId=p.characterId;
 a.characters[p.characterId]={id:p.characterId,name:p.characterName,profession:p.role,appearance:p.appearance,sex:p.sex,bodyStyle:p.bodyStyle,legacy:!!p.legacyCharacter};
 // Legacy companion identity/progression is deliberately retained until migration is approved.
 const pet=ensureCompanion(r,p);if(pet){Object.assign(pet,{x:p.x,y:p.y,interior:null});pet.level??=1;pet.xp??=0;pet.skills??={};}
}
export function accountView(r,p){const a=accountFor(r,p);return {id:a.id,username:a.username,activeCharacterId:a.activeCharacterId,...wallet(a),reputation:a.reputation,clanId:a.clanId,settlementId:a.settlementId,relocationLockedUntil:a.relocationLockedUntil,characters:Object.values(a.characters).map(({saved,companion,...c})=>c),bank:a.bank?structuredClone(a.bank):null};}
export function expireCorpses(r){const now=r.clock();for(const [id,c] of Object.entries(r.state.corpses)){if(Number.isFinite(c.createdAt)&&now>=c.createdAt+CORPSE_LIFETIME_MS)delete r.state.corpses[id];}}





// One-time adoption for pre-reference survivors: retain account, levels, skills,
// inventory and identity; replace only class, appearance and companion selection.
export function adoptReferenceClass(r,p,c){
 const a=accountFor(r,p);
 if(c.name!==undefined&&!(typeof c.name==='string'&&/^[\p{L}\p{N} '-]{1,20}$/u.test(c.name.trim())))throw Error('Character name must be 1–20 letters, numbers, spaces, hyphens or apostrophes');
 if(INITIAL_PROFESSIONS.includes(p.role)||p.referenceClassAdopted)throw Error('Reference class already selected');
 if(p.creationRequired||!p.role)throw Error('Complete character creation first');
 if(!r.safe(p)||p.interior||p.mounted||r.clock()-Math.max(p.lastAttack||0,p.lastHitAt||0)<10000)throw Error('Choose your new class outdoors in a protected town, out of combat and dismounted');
 const role=ROLES.find(x=>INITIAL_PROFESSIONS.includes(x.id)&&x.id===c.profession),look=APPEARANCES.find(x=>x.id===c.appearance);
 if(!role||!look||!Object.hasOwn(REFERENCE_COMPANIONS,c.companion))throw Error('Choose an approved class, appearance and companion');
 const next=structuredClone(p);for(const [id,n] of Object.entries(role.items))next.inventory[id]=Math.max(next.inventory[id]||0,n);next.equippedWeapon=role.weapon;next.equippedShield=!!role.shield;next.armorSlots??={};if(role.armour)next.armorSlots.chest=role.armour;checkBackpack(0,next);checkWeight(carryWeight(p),next);
 p.inventory=next.inventory;p.backpackGrid=next.backpackGrid;p.previousClass=p.role;p.role=role.id;p.referenceClassAdopted=true;p.companionKind=c.companion;p.appearance=look.id;p.sex=look.sex;p.bodyStyle=look.bodyStyle;
 p.characterName=c.name?.trim()||p.characterName||p.id.slice(0,20);p.startingItems=structuredClone(role.items);p.equippedWeapon=role.weapon;p.equippedShield=!!role.shield;p.equippedArmour=role.armour||null;p.armorSlots??={};if(role.armour)p.armorSlots.chest=role.armour;
 const pet=r.state.companions?.[p.id];if(pet){a.previousCompanion=structuredClone(pet);delete r.state.companions[p.id];}ensureCompanion(r,p);
 a.characters[p.characterId]={...a.characters[p.characterId],name:p.characterName,profession:p.role,appearance:p.appearance,level:p.level,legacy:false};
}

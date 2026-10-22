import {DAY4,EFFICIENCY,MASTER} from './world-profile.mjs';
import {wallet} from './currency.mjs';
import {STARTING_GOLD} from './skill-balance.mjs';
import {addWhole} from './master-rules.mjs';
import {randomUUID} from 'node:crypto';
import {APPEARANCES,INITIAL_PROFESSIONS,FACTION_TOWNS,CORPSE_LIFETIME_MS} from './master-rules.mjs';
import {chooseRole} from './roles.mjs';
import {ensureCompanion} from './companions.mjs';
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
export function spawnFor(p){const t=MASTER?FACTION_TOWNS[p.faction==='bandit'?1:0]:FACTION_TOWNS.find(t=>t.faction===(p.faction||'survivor'));return {x:t.x,y:t.y};}
export function createCharacter(r,p,command){
 const a=accountFor(r,p);
 if(!p.creationRequired)throw Error('Appearance, faction and profession are already selected');
 if(!APPEARANCES.some(v=>v.id===command.appearance))throw Error('Choose one of the four appearances');
 if(!['survivor','bandit'].includes(command.faction))throw Error('Choose Survivor or Bandit');
 if(!p.legacyCharacter&&!INITIAL_PROFESSIONS.includes(command.profession))throw Error('Only Farmer or Hunter can be selected initially');
 if(p.legacyCharacter&&command.profession!==p.role)throw Error('Existing profession and progress must be preserved');
 if(!p.legacyCharacter){chooseRole(r,p,command.profession);if(command.profession==='hunter'){delete p.startingItems.fishingRod;delete p.inventory.fishingRod;}p.characterId=randomUUID();p.level=1;p.xp=0;p.skillPoints=0;p.skills={};p.armorMastery={};}
 p.appearance=command.appearance;const appearance=APPEARANCES.find(a=>a.id===p.appearance);p.sex=appearance.sex;p.bodyStyle=appearance.bodyStyle;p.faction=command.faction;p.creationRequired=false;p.roleRequired=false;
 Object.assign(p,spawnFor(p));p.interior=null;a.activeCharacterId=p.characterId;
 a.characters[p.characterId]={id:p.characterId,profession:p.role,appearance:p.appearance,sex:p.sex,bodyStyle:p.bodyStyle,legacy:!!p.legacyCharacter};
 // Legacy companion identity/progression is deliberately retained until migration is approved.
 const pet=ensureCompanion(r,p);if(pet){Object.assign(pet,{x:p.x,y:p.y,interior:null});pet.level??=1;pet.xp??=0;pet.skills??={};}
}
export function accountView(r,p){const a=accountFor(r,p);return {id:a.id,username:a.username,activeCharacterId:a.activeCharacterId,...wallet(a),reputation:a.reputation,clanId:a.clanId,settlementId:a.settlementId,relocationLockedUntil:a.relocationLockedUntil,characters:Object.values(a.characters).map(({saved,companion,...c})=>c),bank:a.bank?structuredClone(a.bank):null};}
export function expireCorpses(r){const now=r.clock();for(const [id,c] of Object.entries(r.state.corpses)){if(Number.isFinite(c.createdAt)&&now>=c.createdAt+CORPSE_LIFETIME_MS)delete r.state.corpses[id];}}





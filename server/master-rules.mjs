import {COMPACT,LAYOUT,DAY4} from './world-profile.mjs';
// Finalized constants only. Prices, fee curves and balance values remain unconfigured.
export const APPEARANCES=Object.freeze([
 {id:'male-1',name:'Male — Lean',sex:'male',bodyStyle:'lean'},{id:'male-2',name:'Male — Sturdy',sex:'male',bodyStyle:'sturdy'},
 {id:'female-1',name:'Female — Lean',sex:'female',bodyStyle:'lean'},{id:'female-2',name:'Female — Sturdy',sex:'female',bodyStyle:'sturdy'}
]);
export const INITIAL_PROFESSIONS=Object.freeze(["melee","ranged","mage","rogue","paladin","necromancer"]);
export const CLAN_RANKS=Object.freeze(['Recruit','Private','Corporal','Sergeant','Lieutenant','Captain','Commander','Warlord']);
export const EQUIPMENT_TIERS=Object.freeze(['Crude','Common','Uncommon','Rare','Epic','Legendary','Mythic','Unique']);
export const ARMOR_SLOTS=Object.freeze(['helmet','chest','gloves','leggings','boots']);
export const RECLAMATION_TOKENS=Object.freeze({reclamationMinor:1,reclamationGreater:3,reclamationSuperior:5});
export const BANK_TIERS=Object.freeze([
 {name:'Peasant’s Chest',slots:20},{name:'Traveler’s Locker',slots:40},{name:'Merchant’s Strongbox',slots:60},{name:'Ironbound Vault',slots:90},
 {name:'Nobleman’s Treasury',slots:125},{name:'Royal Depository',slots:175},{name:'King’s Vault',slots:250},{name:'Imperial Treasury',slots:400}
]);
// Reuse existing map settlements; placement is staging geography, not final map approval.
export const FACTION_TOWNS=Object.freeze(COMPACT?LAYOUT.settlements.filter(t=>DAY4||t.traderZone).map(t=>({...t,mapId:t.id,radius:t.radius??(t.faction==='neutral'?560:500)})): [
 {id:'ashenhold',mapId:'greyhaven',name:'Ashenhold',faction:'survivor',x:512,y:512,radius:1440},
 {id:'ironwatch',mapId:'ironwatch',name:'Ironwatch',faction:'survivor',x:3500,y:3500,radius:1440},
 {id:'blackwood-refuge',mapId:'march-0',name:'Blackwood Refuge',faction:'survivor',x:1600,y:5600,radius:1440},
 {id:'bloodhaven',mapId:'march-3',name:'Bloodhaven',faction:'bandit',x:11200,y:5600,radius:1440},
 {id:'ravenspire',mapId:'march-7',name:'Ravenspire',faction:'bandit',x:11200,y:8600,radius:1440},
 {id:'skullport',mapId:'march-11',name:'Skullport',faction:'bandit',x:11200,y:11600,radius:1440}
]);
export const CORPSE_LIFETIME_MS=60*60*1000;
export function whole(value,label='Amount'){if(!Number.isSafeInteger(value)||value<0)throw Error(`${label} must be a nonnegative safe integer`);return value;}
export function positive(value,label='Amount'){whole(value,label);if(value===0)throw Error(`${label} must be positive`);return value;}
export function addWhole(a,b){whole(a);whole(b);return whole(a+b);}
export function maxGoldPrice(usdCents){whole(usdCents,'USD cents');return whole(Number(BigInt(usdCents)*250n/100n),'Gold price cap');}




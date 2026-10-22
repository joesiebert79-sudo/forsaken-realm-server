import {ITEMS} from './catalog.mjs';
export const ROLES=Object.freeze([
 {id:'soldier',name:'Soldier',description:'A spear, shield and leather protection.',items:{spear:1,shield:1,tunic:1,bread:3,water:3,waterskin:1},weapon:'spear',armour:'tunic',shield:true},
 {id:'hunter',name:'Hunter',description:'A hunting bow, arrows and fishing rod.',items:{bow:1,arrow:20,fishingRod:1,bread:3,water:3,waterskin:1},weapon:'bow'},
 {id:'smith',name:'Smith',description:'Hammer and pickaxe for a life at the forge.',items:{hammer:1,pickaxe:1,axe:1,bread:3,water:3,waterskin:1},weapon:'axe'},
 {id:'farmer',name:'Farmer',description:'A sickle and seeds to establish your fields.',items:{sickle:1,seed:8,flaxSeed:4,axe:1,bread:4,water:3,waterskin:1},weapon:'axe'},
 {id:'woodsman',name:'Woodsman',description:'An axe, rope and torches for the wilderness.',items:{axe:1,rope:3,torch:2,bread:3,water:3,waterskin:1},weapon:'axe'}
]);
export function chooseRole(realm,p,id){if(p.role)throw Error('Your role is permanent');const role=ROLES.find(r=>r.id===id);if(!role)throw Error('Choose a valid role');p.role=role.id;p.startingItems=structuredClone(role.items);realm.grant(p,role.items);equipRole(p,role);p.roleRequired=false;}
function equipRole(p,role){p.equippedWeapon=role.weapon||'unarmed';p.equippedArmour=role.armour||null;p.equippedHelmet=null;p.equippedShield=!!role.shield;p.blockUntil=0;}
export function respawnKit(realm,p){const role=ROLES.find(r=>r.id===p.role);if(!role)return;const items=p.startingItems||role.items;for(const [id,n] of Object.entries(items))if(!ITEMS[id]||!Number.isSafeInteger(n)||n<1)throw Error('Invalid saved starting kit');realm.grant(p,items);equipRole(p,role);}




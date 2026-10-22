import {arrange} from './backpack-grid.mjs';
import {ITEMS} from './catalog.mjs';
export function backpackCapacity(p){return p.inventory?.[p.equippedBackpack]>0?(ITEMS[p.equippedBackpack]?.backpackSlots||6):6;}
export function backpackSlots(p){const items={...(p.inventory||{})};const worn=[...Object.values(p.armorSlots||{}),p.equippedShield?'shield':'',p.equippedWeapon,p.equippedBackpack];if(!p.armorSlots)worn.push(p.equippedHelmet,p.equippedArmour);for(const id of worn)if(id&&items[id]>0)items[id]--;return Object.values(items).filter(n=>n>0).length;}
export function checkBackpack(before,p,oldCapacity=backpackCapacity(p)){arrange(p,true);}

export function carryWeight(p){return Object.entries(p.inventory||{}).reduce((sum,[id,n])=>sum+Math.max(0,n)*(ITEMS[id]?.weight??1),0);}
export function burden(p){return Math.max(0,Math.min(1,(carryWeight(p)-25)/25));}
export function checkWeight(before,p){if(carryWeight(p)>Math.max(50,before)+.000001)throw Error('Too heavy — maximum carrying weight is 50 kg. Store or drop items first.');}



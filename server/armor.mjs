import {skillRank} from './skill-balance.mjs';
import {ITEMS} from './catalog.mjs';
import {ARMOR_SLOTS,whole} from './master-rules.mjs';
import {reclaimSkills} from './banking.mjs';
export const ARMOR_SETS={crude:'Ragged',hide:'Hide',padded:'Padded',mailset:'Riveted Mail',brigandine:'Brigandine',plate:'Tempered Plate',royal:'Royal Plate',kingslayer:'Kingslayer Plate'};
const costs=[1,2,2,3],bonuses=[0,.02,.04,.07,.10];
export function ensureArmor(p){
 if(!p.armorSlots){p.armorSlots={};if(p.inventory[p.equippedHelmet]>0)p.armorSlots.helmet=p.equippedHelmet;if(p.inventory[p.equippedArmour]>0)p.armorSlots.chest=p.equippedArmour;}
 p.armorCondition??={};p.armorMastery??={};syncArmor(p);
}
export function syncArmor(p){if(!p.armorSlots)return;for(const slot of ARMOR_SLOTS){const id=p.armorSlots[slot];if(id&&(!(p.inventory[id]>0)||ITEMS[id]?.armorSlot!==slot))delete p.armorSlots[slot];}p.equippedHelmet=p.armorSlots.helmet||null;p.equippedArmour=p.armorSlots.chest||null;}
export function equipArmor(p,id){if(!(p.inventory[id]>0)||!ITEMS[id]?.armorSlot)throw Error('Armor is not in your backpack');ensureArmor(p);const slot=ITEMS[id].armorSlot;if(p.armorSlots[slot]===id)delete p.armorSlots[slot];else p.armorSlots[slot]=id;syncArmor(p);}
export function armorCondition(p,id){return Math.max(0,Math.min(100,p.armorCondition?.[id]??100));}
export function matchingPieces(p,set){return Object.values(p.armorSlots||{}).filter(id=>p.inventory[id]>0&&ITEMS[id]?.armorSet===set&&armorCondition(p,id)>0).length;}
export function armorPenalty(p){return Math.min(.30,Object.values(p.armorSlots||{}).reduce((n,id)=>n+(p.inventory[id]>0?(ITEMS[id]?.movementPenalty||0):0),0));}
export function armorProtection(p,damage,type='physical'){
 const sequence=['chest','leggings','chest','helmet','gloves','boots'];p.armorHitSequence=(p.armorHitSequence||0)+1;const slot=sequence[(p.armorHitSequence-1)%sequence.length],id=p.armorSlots[slot],item=ITEMS[id];p.lastHitSlot=slot;
 if(!item||!(p.inventory[id]>0)||armorCondition(p,id)<=0)return damage;
 const active=Math.min(Math.max(0,(p.armorMastery[item.armorSet]||0)),matchingPieces(p,item.armorSet)-1,4);
 let protection=item.armour+(bonuses[Math.max(0,active)]||0);
 if(type==='blackpowder'&&item.equipmentTier===8)protection=Math.max(protection,.85);
 if(type==='blunt'||type==='armorPiercing')protection*=.45;
 if(type==='fire'||type==='poison')protection*=.2;
 p.armorCondition[id]=Math.max(0,armorCondition(p,id)-1);
 return Math.max(1,damage*(1-Math.min(.9,protection)));
}
export function moveArmorCondition(from,to,id){if(!ITEMS[id]?.armorSlot)return;to.armorCondition??={};to.armorCondition[id]=Math.min(armorCondition(from,id),armorCondition(to,id));if(!((from.inventory||from.items||{})[id]>0)&&from.armorCondition)delete from.armorCondition[id];syncArmor(from);}
export function repairArmor(r,p,id){
 if(!(p.inventory[id]>0)||!ITEMS[id]?.armorSlot)throw Error('Choose carried armor');const item=ITEMS[id];if(armorCondition(p,id)>=100)throw Error('Armor is already repaired');
 const station=item.material==='cloth'?'loom':item.material==='leather'||id==='tunic'?'tannery':'forge';
 if(!r.snapshot(p.id,false).stationsAvailable.includes(station))throw Error('Repair at a '+station);
 r.pay(p,station==='forge'?{iron:Math.max(1,Math.ceil(Math.max(1,item.equipmentTier||1)*p.inventory[id]*(1-skillRank(p,'metalCare')*.04)))}:{fiber:Math.max(1,Math.ceil(Math.max(1,item.equipmentTier||1)*p.inventory[id]*(1-skillRank(p,'metalCare')*.04)))});p.armorCondition??={};p.armorCondition[id]=100;
}
export function masteryCommand(p,c){
 ensureArmor(p);p.skillTransactions??={};const key=JSON.stringify(c.id);if(Object.hasOwn(p.skillTransactions,key))return;
 if(c.type==='reclaimMastery'){
  const subject={skills:Object.fromEntries(Object.entries(p.armorMastery).filter(([id])=>Object.hasOwn(ARMOR_SETS,id))),skillPoints:p.skillPoints,inventory:p.inventory};reclaimSkills(subject,c.token,c.selection,Object.fromEntries(Object.keys(ARMOR_SETS).map(id=>[id,{costs}])));p.armorMastery={...p.armorMastery,...subject.skills};p.skillPoints=subject.skillPoints;
 }else{
  if(!Object.hasOwn(ARMOR_SETS,c.skill))throw Error('Unknown armor set');const rank=p.armorMastery[c.skill]||0;whole(rank,'Mastery rank');whole(p.skillPoints,'Skill points');if(rank>=4)throw Error('Mastery is fully trained');if(matchingPieces(p,c.skill)<2)throw Error('Wear two matching pieces to train this set');if(p.skillPoints<costs[rank])throw Error('Not enough skill points');p.skillPoints-=costs[rank];p.armorMastery[c.skill]=rank+1;
 }
 p.skillTransactions[key]=true;
}
export function masteryView(p){return {title:'ARMOR MASTERY',configured:true,level:p.level,xp:String(p.xp),nextLevelXp:'—',skillPoints:p.skillPoints,rankCosts:'Mastery costs: 1, 2, 2, 3. Wear two matching pieces to train.',nodes:Object.entries(ARMOR_SETS).map(([id,name])=>({id,name,rank:p.armorMastery?.[id]||0,costs,description:matchingPieces(p,id)+' worn • 2/3/4/5 pieces unlock 2/4/7/10% protection',requires:{}}))};}




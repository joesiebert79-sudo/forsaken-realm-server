import {randomUUID} from 'node:crypto';
import {ITEMS} from './catalog.mjs';
import {FIELD_ITEMS,FIELD_RECIPES,fieldId} from './field-catalog.mjs';
import {HARVEST_QUALITY} from './wildlife-catalog.mjs';
import {craftingContainers} from './craft-storage.mjs';
import {arrange} from './backpack-grid.mjs';
import {carryWeight} from './backpack-capacity.mjs';
export const isFieldLot=id=>typeof id==='string'&&id.startsWith('lot:');
export function fieldLot(r,id){return Object.hasOwn(r.state.fieldLots||{},id)?r.state.fieldLots[id]:null;}
export function lotDefinition(r,id){const lot=fieldLot(r,id);if(!lot)return null;const base=FIELD_ITEMS[lot.baseId];if(!base)return null;return {...base,id,name:base.name+' — '+lot.quality,baseItem:lot.baseId,quality:lot.quality,provenance:lot.provenance,createdAt:lot.createdAt,expiresAt:lot.expiresAt,spoiled:lot.expiresAt!=null&&r.clock()>=lot.expiresAt};}
export function restoreFieldCatalog(r){
 for(const id of Object.keys(r.state.fieldLots||{})){const def=lotDefinition(r,id);if(!def)throw Error('Saved harvest lot references an unknown item');ITEMS[id]=Object.freeze(def);}
}
export function grantFieldLot(r,inventory,baseId,amount,{quality='common',provenance=null,createdAt=r.clock()}={}){
 const base=FIELD_ITEMS[baseId];if(!base||base.virtualIngredient||!Object.hasOwn(HARVEST_QUALITY,quality)||!Number.isSafeInteger(amount)||amount<1)throw Error('Invalid field item grant');
 const id='lot:'+randomUUID();r.state.fieldLots??={};r.state.fieldLots[id]={id,baseId,quality,provenance:provenance?structuredClone(provenance):null,createdAt,expiresAt:base.spoilMs?createdAt+base.spoilMs:null};
 ITEMS[id]=Object.freeze(lotDefinition(r,id));inventory[id]=amount;return id;
}
function matches(r,id,need,species){
 const lot=fieldLot(r,id),baseId=lot?.baseId||id,base=FIELD_ITEMS[baseId],requested=FIELD_ITEMS[need];
 if(lot?.expiresAt!=null&&r.clock()>=lot.expiresAt)return false;
 if(!lot&&base?.spoilMs)return false; // Legacy untracked field food cannot acquire invented freshness.
 if(species?.length&&!species.includes(lot?.provenance?.species))return false;
 if(need===fieldId('cleanWater')&&(base?.water&&!base.unsafeWater||id==='water'))return true;
 if(requested?.virtualIngredient)return !!base?.ingredientTags?.some(tag=>requested.ingredientTags.includes(tag));
 return baseId===need;
}
export function fieldIngredientPlan(r,p,recipe){
 const sources=[{id:'backpack',items:p.inventory},...craftingContainers(r,p)];
 const remaining=sources.map(source=>({...source,remaining:{...source.items}})),plan=[];
 for(const [need,amount]of Object.entries(recipe.needs)){
  let left=amount;const candidates=[];
  for(const source of remaining)for(const [id,n]of Object.entries(source.remaining))if(n>0&&matches(r,id,need,recipe.speciesNeeds?.[need]))candidates.push({source,id,expiry:fieldLot(r,id)?.expiresAt??Infinity});
  candidates.sort((a,b)=>a.expiry-b.expiry||a.source.id.localeCompare(b.source.id)||a.id.localeCompare(b.id));
  for(const c of candidates){const take=Math.min(left,c.source.remaining[c.id]);if(!take)continue;plan.push({source:c.source.items,id:c.id,amount:take});c.source.remaining[c.id]-=take;left-=take;if(!left)break;}
  if(left)throw Error('Missing fresh '+(FIELD_ITEMS[need]?.name||ITEMS[need]?.name||need)+' with required provenance');
 }
 return plan;
}
export function fieldAvailability(r,p){
 const total={};const sources=[p.inventory,...craftingContainers(r,p).map(c=>c.items)];
 for(const source of sources)for(const [id,n]of Object.entries(source)){
  const lot=fieldLot(r,id);if(lot&&!(lot.expiresAt!=null&&r.clock()>=lot.expiresAt))total[lot.baseId]=(total[lot.baseId]||0)+n;
  for(const virtual of Object.values(FIELD_ITEMS).filter(d=>d.virtualIngredient))if(matches(r,id,virtual.id))total[virtual.id]=(total[virtual.id]||0)+n;
 }
 return total;
}
export function beginFieldCraft(r,p,recipe){
 if(p.fieldCraft)throw Error('Finish your current field craft first');
 const plan=fieldIngredientPlan(r,p,recipe);let quality='common',qualityValue=Infinity;const species=new Set();
 for(const entry of plan){const lot=fieldLot(r,entry.id),base=FIELD_ITEMS[lot?.baseId||entry.id];if(base&&!base.water){const q=lot?.quality||'common';if(HARVEST_QUALITY[q]<qualityValue){quality=q;qualityValue=HARVEST_QUALITY[q];}}if(lot?.provenance?.species)species.add(lot.provenance.species);}
 for(const {source,id,amount}of plan){source[id]-=amount;if(!source[id])delete source[id];}
 p.fieldCraft={id:randomUUID(),recipe:recipe.id,readyAt:r.clock()+recipe.craftMs,quality,provenance:{craftedBy:p.characterId||p.id,species:[...species],recipe:recipe.id},output:structuredClone(recipe.output)};
}
export function finishFieldCraft(r,p){
 const job=p.fieldCraft;if(!job||r.clock()<job.readyAt||p.hp<=0)return false;
 const test={...p,inventory:{...p.inventory},backpackGrid:p.backpackGrid?structuredClone(p.backpackGrid):undefined};
 // Capacity is validated before lot creation or any state mutation.
 for(const [id,n]of Object.entries(job.output))test.inventory[id]=(test.inventory[id]||0)+n;
 try{arrange(test,true);if(carryWeight(test)>50.000001)return false;}catch{return false;}
 const result={};for(const [id,n]of Object.entries(job.output)){const lot=grantFieldLot(r,p.inventory,id,n,{quality:job.quality,provenance:job.provenance,createdAt:job.readyAt});result[lot]=n;}
 const recipe=FIELD_RECIPES[job.recipe];p.professions[recipe.profession]=(p.professions[recipe.profession]||0)+1;p.lastFieldCraft={id:job.id,recipe:job.recipe,completedAt:r.clock(),items:result};delete p.fieldCraft;return true;
}
export function useFieldFood(r,p,id){
 const lot=fieldLot(r,id),base=FIELD_ITEMS[lot?.baseId||id];
 if(!lot||!base||base.nutrition===undefined||!(p.inventory[id]>0))throw Error('Choose owned food or drink');
 if(lot.expiresAt!=null&&r.clock()>=lot.expiresAt)throw Error('Food has spoiled');
 p.hunger=Math.min(100,p.hunger+(base.nutrition||0));p.thirst=Math.min(100,p.thirst+(base.hydration||0));
 if(base.unsafeWater)p.waterIllnessUntil=Math.max(p.waterIllnessUntil||0,r.clock()+120000);
 p.inventory[id]--;if(!p.inventory[id])delete p.inventory[id];
}
export function fieldCatalogView(r,p){
 const visible=new Set(Object.keys(p.inventory||{}));
 const open=r.state.corpses[p.openContainer]||r.state.structures[p.openContainer]||r.state.containers[p.openContainer];for(const id of Object.keys(open?.items||{}))visible.add(id);
 return {balanceStatus:'draft-playtest',items:[...Object.values(FIELD_ITEMS),...[...visible].map(id=>lotDefinition(r,id)).filter(Boolean)],recipes:Object.values(FIELD_RECIPES)};
}

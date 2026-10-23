import {readFileSync} from 'node:fs';
import {PROGRESSION} from './progression.mjs';
export const ITEM_COMMERCE=JSON.parse(readFileSync(new URL('./item-atlas-catalog.json',import.meta.url),'utf8'));
export const restrictedEquipment=id=>ITEM_COMMERCE[id]?.acquisition?.includes('boss')||false;
export const RARE_EQUIPMENT=Object.freeze(PROGRESSION.items.filter(i=>restrictedEquipment(i.id)&&!i.source?.includes('mission chain')).map(i=>i.id));
const unitPrices={wood:[3,'copper'],stone:[2,'copper'],fiber:[2,'copper'],water:[2,'copper'],bread:[5,'copper'],bandage:[12,'copper'],torch:[4,'copper'],axe:[30,'copper'],pickaxe:[30,'copper'],sickle:[20,'copper'],sword:[70,'copper'],spear:[25,'copper'],shield:[50,'copper'],bow:[60,'copper'],arrow:[2,'copper'],bolt:[3,'copper'],apple:[3,'copper'],roastMeat:[12,'copper'],stew:[16,'copper'],vegetableStew:[14,'copper'],smokedMeat:[18,'copper'],herbalTea:[8,'copper'],smallSatchel:[35,'copper'],travelersPack:[100,'silver'],largeRucksack:[240,'silver']};
export function itemPrice(id){const d=ITEM_COMMERCE[id],item=PROGRESSION.items.find(i=>i.id===id);if(unitPrices[id])return {amount:unitPrices[id][0],currency:unitPrices[id][1]};
 if(item?.armorSlot){const tier=item.equipmentTier||Math.min(5,item.rarity||1),base=[0,10,30,90,35,90,180,300,500][tier],factor={helmet:.6,chest:1,gloves:.35,leggings:.75,boots:.45}[item.armorSlot];return {amount:Math.max(1,Math.ceil(base*factor)),currency:tier>=4?'gold':tier>=2?'silver':'copper'};}
 if(restrictedEquipment(id))return {amount:150,currency:'gold'};
 return {amount:Math.max(2,(d?.rarity||1)*5*(1+Math.floor((d?.crafting?.level||0)/5))),currency:(d?.rarity||1)>=4?'gold':(d?.rarity||1)>=2?'silver':'copper'};
}
export function supplyPrice(supplies){let copper=0;for(const [id,n]of Object.entries(supplies)){const p=itemPrice(id);copper+=p.amount*n*({copper:1,silver:10,gold:100}[p.currency]);}if(!Number.isSafeInteger(copper)||copper<=0)throw Error('Invalid supply price');return copper%100===0?{amount:copper/100,currency:'gold'}:copper%10===0?{amount:copper/10,currency:'silver'}:{amount:copper,currency:'copper'};}
export function flashPrice(amount,currency){if(amount<4&&currency!=='copper'){amount*=10;currency=currency==='gold'?'silver':'copper';}const discounted=Math.max(1,Math.ceil(amount*.75));return {gold:discounted,currency,...(discounted<amount?{regularGold:amount}:{})};}
export function saleMetadata(id){const d=ITEM_COMMERCE[id];return d?{equipmentTier:d.equipmentTier,rarity:d.rarity,rarityName:d.rarityName,crafting:d.crafting,atlasCategory:d.atlasCategory,acquisition:d.acquisition}:{};}
export function offerRestricted(o){return Object.keys(o.supplies||{}).some(restrictedEquipment)||o.kind==='supplies'&&restrictedEquipment(o.item);}
export function rareEquipmentDrop(source,random){
 if(source!=='boss'&&source!=='dangerous-exploration')return null;
 if(source!=='boss'&&random()>=.02)return null;
 const roll=random(),tier=roll<.8?6:roll<.98?7:8,pool=RARE_EQUIPMENT.filter(id=>(ITEM_COMMERCE[id].equipmentTier||6)===tier);
 return pool.length?pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]:null;
}


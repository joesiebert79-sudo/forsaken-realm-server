import {randomInt} from 'node:crypto';
import {ITEMS} from './catalog.mjs';
// Only newly opened world fixtures roll loot. Saved containers never reroll.
const pools={
 woodland:'wood fiber bark herb mushroom berry',
 chapel:'linen bandage torch herbalTea',
 guildhall:'linen thread rope torch',
 cottage:'wood fiber thread wool linen rope apple bread onion carrot peas egg bandage torch waterskin crude_gloves crude_boots',
 tavern:'bread apple berry cabbage onion carrot flour oats barley salt cheese butter honey driedApples oatcakes pottage porridge smokedFish smokedMeat herbalTea',
 smithy:'wood charcoal ironOre copperOre tinOre clay leather nails iron copper bronze plank axe sickle hammer pickaxe',
 storehouse:'wheat seed flaxSeed barley oats peas cabbage flour wood plank fiber rope wool clay nails salt linen leather',
 tower:'bread driedApples bandage torch rope arrow spear bow tunic crude_helmet hide_gloves shield sword helmet',
 castle:'bread cheese smokedMeat linen bandage torch arrow bolt spear sword shield helmet gambeson padded_boots',
 dungeon:'iron bronze leather bandage torch arrow bolt sword shield helmet gambeson padded_gloves padded_boots steel mail longbow'
};
const single=new Set('axe sickle hammer pickaxe waterskin spear bow tunic shield sword helmet gambeson mail longbow'.split(' '));
export function rollContainerLoot(type,random=()=>randomInt(0,0x1000000)/0x1000000){
 const pool=(pools[type]||pools.woodland).split(' ').map(id=>({id,weight:({1:10,2:6,3:2,4:.35}[ITEMS[id].rarity]||.1)}));
 // 40% empty, 45% one stack, 15% two stacks; saved results never reroll.
 const chance=random(),items={},count=chance<.4?0:chance<.85?1:2;
 for(let n=0;n<count;n++){
  let roll=random()*pool.reduce((sum,e)=>sum+e.weight,0),index=pool.length-1;
  for(let i=0;i<pool.length;i++){roll-=pool[i].weight;if(roll<0){index=i;break;}}
  const {id}=pool.splice(index,1)[0];
  items[id]=single.has(id)||/_(helmet|chest|gloves|leggings|boots)$/.test(id)?1:id==='arrow'||id==='bolt'?2+Math.floor(random()*3):1;
 }
 return items;
}



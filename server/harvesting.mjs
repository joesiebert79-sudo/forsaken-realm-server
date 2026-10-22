import {nearRoad} from './landscape.mjs';
import {VILLAGES,buildingBlocks,ITEMS} from './catalog.mjs';
const minerals=new Set(['sulfur','saltpetre','leadOre','stone','ironOre','copperOre','tinOre','clay','limestone','salt']);
const bushes=new Set(['fiber','berry','herb','flaxSeed','barley','oats','peas','cabbage','onion','carrot']);
export function requiredTool(node){if(node.loose)return null;if(node.kind==='wood'||node.kind==='bark')return 'axe';if(minerals.has(node.kind))return 'pickaxe';if(bushes.has(node.kind))return 'sickle';if(node.kind==='rawFish')return 'fishingRod';return null;}
export function checkHarvestTool(p,node){const tool=requiredTool(node);if(tool&&(p.equippedWeapon!==tool||!(p.inventory[tool]>0)))throw Error('Equip '+ITEMS[tool].name+' in Hands to harvest this resource');return tool;}
export function addHandGathering(state){
 if(state.handGatherVersion)return;
 const used=new Set(state.resources.map(r=>r.id));
 // Loose ground materials break the tool/forge bootstrap cycle without making trees or ore seams hand-harvestable.
 for(const village of VILLAGES)for(const [index,kind] of ['wood','stone','fiber','ironOre'].entries()){
  const id=`loose-${village.id}-${kind}`;if(used.has(id))continue;
  for(let step=0;step<80;step++){const a=(index*20+step)*.31,r=120+step*3,x=village.x+Math.cos(a)*r,y=village.y+Math.sin(a)*r;if(buildingBlocks(x,y)||nearRoad(x,y,100))continue;state.resources.push({id,kind,x,y,loose:true,remaining:12,readyAt:0});break;}
 }
 state.handGatherVersion=1;
}





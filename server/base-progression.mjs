import {ownedHousing} from './housing.mjs';
import {HOUSE_DESIGNS} from './housing-catalog.mjs';
import {plotContains} from './base-geometry.mjs';
import {validateBaseLand,cornerRelocations} from './base-land.mjs';
import {OUTBUILDINGS} from './base-outbuildings.mjs';
import {ITEMS} from './catalog.mjs';
import {consumeCraftMaterials,annexStorage,homeStorage} from './craft-storage.mjs';

// Independent of the five saved house-style tiers. No currency charge or timers:
// difficulty comes from materials, local storage and a matching construction bench.
export const BASE_LEVELS=Object.freeze([
 {level:1,name:'Fenced Homestead',storage:0,needs:{}},
 {level:2,name:'Reinforced Homestead',storage:0,needs:{wood:25,stone:15}},
 {level:3,name:'Stone Foundation',storage:1,needs:{plank:30,stone:40,nails:12}},
 {level:4,name:'Walled Homestead',storage:2,needs:{plank:60,brick:50,mortar:20,iron:10}},
 {level:5,name:'Defensive Courtyard',storage:3,needs:{seasonedPlank:80,brick:100,mortar:40,ironBraces:15}},
 {level:6,name:'Fortified Estate',storage:4,needs:{seasonedPlank:120,cutStone:80,mortar:60,ironBraces:30,roofTiles:40}},
 {level:7,name:'Castle Enclosure',storage:6,needs:{timberFrame:60,cutStone:150,mortar:100,ironHinges:40,roofTiles:100}},
 {level:8,name:'Realm Fortress',storage:8,needs:{timberFrame:120,cutStone:300,mortar:200,ironHinges:80,steel:60,roofTiles:200}}
]);
export const BENCH_COSTS=Object.freeze([null,{wood:10,stone:5},{plank:8,nails:4},{plank:16,iron:4},{brick:20,iron:8},{seasonedPlank:20,ironBraces:6},{cutStone:30,ironBraces:12},{timberFrame:20,steel:10},{timberFrame:40,steel:25}]);
export const BASE_PIECE_LEVELS=Object.freeze({tower:5,walkway:4,chest:1,hearth:1,farm:1,palisade:2,loom:2,smoker:2,tannery:2,kiln:3,forge:3,mill:3,gate:3,stonewall:4,keep:5});
export const baseLevel=h=>Number.isSafeInteger(h?.baseLevel)&&h.baseLevel>=1&&h.baseLevel<=8?h.baseLevel:1;
export const benchLevel=h=>Number.isSafeInteger(h?.constructionBenchLevel)&&h.constructionBenchLevel>=1&&h.constructionBenchLevel<=8?h.constructionBenchLevel:0;
export function constructionPoint(h){const d=HOUSE_DESIGNS.find(d=>d.id===h.design);return d?.snapPoints.find(p=>p.id==='workbench');}
function authorize(r,p){const h=ownedHousing(r.state,p);if(!h||p.hp<=0||p.creationRequired||h.abandonedAt)throw Error('Use the construction bench in your owned home');const a=r.state.accounts[p.id];if(h.ownerType==='clan'&&r.state.clans?.[a.clanId]?.leader!==p.id)throw Error('Only the clan leader may upgrade the home or bench');return h;}
export function atConstructionBench(r,p,required=1){const h=ownedHousing(r.state,p),point=h&&constructionPoint(h);return !!h&&p.hp>0&&!h.abandonedAt&&p.interior===h.buildingId&&point&&Math.hypot(p.x-(point.x+45),p.y-(point.y+27))<=100&&benchLevel(h)>=required;}
export function baseStorage(r,h){return h.settlementId?[...homeStorage(r,h),...annexStorage(r,h),...Object.values(r.state.structures||{}).filter(s=>s.kind==='chest'&&s.hp>0&&!s.abandonedAt&&s.settlementId===h.settlementId&&(Math.hypot(s.x-h.x,s.y-h.y)<=400||plotContains(h,s.x,s.y)))]:[];}
function materials(r,p,h){const fixtures=Object.entries(r.state.containers||{}).filter(([id])=>id.startsWith('fixture:'+h.buildingId+':')).map(([,c])=>c.items||{});return [...fixtures,...baseStorage(r,h).filter(s=>!String(s.id).startsWith("fixture:"+h.buildingId+":" )).map(s=>s.items||{})];}
export function payBaseConstruction(r,p,settlement,needs){const h=r.state.properties?.[settlement.propertyId];if(!h)throw Error('Owned property unavailable');consumeCraftMaterials(p.inventory,materials(r,p,h),needs);}
export function baseProgressionView(r,p){const h=ownedHousing(r.state,p);if(!h)return null;const level=baseLevel(h),bench=benchLevel(h);return {landRadius:h.landRadius||300,level,maxLevel:8,style:h.design,name:BASE_LEVELS[level-1].name,benchLevel:bench,benchPoint:constructionPoint(h),storageChests:baseStorage(r,h).length,next:BASE_LEVELS[level]||null,nextBench:bench<8?{level:bench+1,needs:BENCH_COSTS[bench+1],requiredBaseLevel:Math.max(1,bench)}:null};}
export function baseProgressionCommand(r,p,c){const h=authorize(r,p),point=constructionPoint(h);if(!point||p.interior!==h.buildingId||Math.hypot(p.x-(point.x+45),p.y-(point.y+27))>100)throw Error('Approach the construction bench inside your home');const level=baseLevel(h),bench=benchLevel(h);
 if(c.type==='baseBenchUpgrade'){
  if(c.expectedLevel!==bench)throw Error('Bench level changed; refresh the upgrade');if(bench>=8)throw Error('Construction bench is fully upgraded');if(level<Math.max(1,bench))throw Error('Upgrade the base before improving this bench again');consumeCraftMaterials(p.inventory,materials(r,p,h),BENCH_COSTS[bench+1]);h.constructionBenchLevel=bench+1;return;
 }
 if(c.type!=='baseUpgrade')throw Error('Unknown base action');if(c.expectedLevel!==level)throw Error('Base level changed; refresh the upgrade');const next=BASE_LEVELS[level];if(!next)throw Error('Base is fully upgraded');if(bench<next.level)throw Error('Requires construction bench level '+next.level);if(baseStorage(r,h).length<next.storage)throw Error('Requires '+next.storage+' active storage chests at this base');const expansion=validateBaseLand(r,h,next.level),moves=cornerRelocations(r,h,expansion);consumeCraftMaterials(p.inventory,materials(r,p,h),next.needs);Object.assign(h,expansion);for(const move of moves){move.tower.x=move.x;move.tower.y=move.y;}h.baseLevel=next.level;
}
export function checkBasePiece(r,p,s,kind){if(!s?.propertyId)return;const h=r.state.properties?.[s.propertyId];if(!h)return;const required=OUTBUILDINGS[kind]?.level||BASE_PIECE_LEVELS[kind]||1;if(benchLevel(h)<required||baseLevel(h)<required)throw Error('Requires base and construction bench level '+required);}
const describe=needs=>Object.entries(needs).map(([id,n])=>n+' '+(ITEMS[id]?.name||id)).join(', ');
export function baseProgressionRows(r,p){const v=baseProgressionView(r,p);if(!v)return [];return [{name:'Base level '+v.level+' / 8 — '+v.name,detail:'Construction bench '+v.benchLevel+' / 8 • '+v.storageChests+' active storage chests. Bench is at the house workbench snap point.'},...(v.nextBench?[{name:v.benchLevel?'Upgrade construction bench to '+v.nextBench.level:'Build construction bench',detail:describe(v.nextBench.needs)+' • Base level '+v.nextBench.requiredBaseLevel+' • Approach your indoor bench.',confirm:'Use these materials to upgrade your construction bench?',action:{type:'baseBenchUpgrade',expectedLevel:v.benchLevel}}]:[]),...(v.next?[{name:'Upgrade base to level '+v.next.level,detail:describe(v.next.needs)+' • Bench '+v.next.level+' • '+v.next.storage+' storage chests required.',confirm:'Use these materials to upgrade your base?',action:{type:'baseUpgrade',expectedLevel:v.level}}]:[])];}


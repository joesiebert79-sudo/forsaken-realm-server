import {createDay2Layout} from './day2-layout.mjs';
import {MASTER_LANDMARKS,MASTER_ROADS,MASTER_RIVERS,MASTER_SIZE} from './master-geography.mjs';
import {clearPath} from './master-paths.mjs';

// Issue #2: arrange the existing house/shop/castle assets on the approved map.
// Keep Day 4 IDs so saved homes, merchant stock and service interiors still bind.
const villageNames=['Northreach','Ravenford','Pinecrest','Stonehollow','Millford','Eastvale','Oakridge','Clearwater','Sundown','Highmeadow','Ashenvale','Stonewatch'];
const biomes=['mountain','forest','woodland','farmland','marsh','plains','coast','river','coast','marsh','swamp','mountain'];
const castleNames=['Wolfswatch','Blackthorn','Duskfort','Ironcrown','Stormkeep'];
const villageOffsets=[[-690,-510],[-345,-560],[345,-560],[690,-510],[-730,-95],[-365,-105],[365,-105],[730,-95],[-690,385],[-345,420],[345,420],[690,385]];
const traderOffsets={smithy:[470,-290],bank:[-470,-290],workshop:[470,330],merchant:[-470,330]};
// Functional entrances aligned with the approved camp scene: blacksmith,
// missions, crafting/cooking and provisioner respectively.
const banditCampOffsets={smithy:[-65,-405],bank:[-488,48],workshop:[228,-348],merchant:[-293,-238]};
const road=(id,kind,width,points)=>({id,kind,width,points:points.map(([x,y])=>({x:Math.round(x),y:Math.round(y)}))});
export function createApprovedWorldLayout(){
 const old=createDay2Layout(true);
 const byId=new Map(MASTER_LANDMARKS.map(p=>[p.id,p]));
 const west=byId.get('trader-a'),east=byId.get('trader-b');
 const towns=[{...west,id:'day2-survivor',name:'Trader Town A',faction:'neutral',traderZone:true,safe:true,radius:1450},
              {...east,id:'day2-bandit',name:'Bandit Trader Camp',faction:'neutral',traderZone:true,safe:true,radius:1450}];
 const villages=villageNames.map((name,i)=>{const p=byId.get('village-'+(i+1));return {...p,id:i===3?'day2-neutral':p.id,name,biome:biomes[i],faction:'neutral',traderZone:false,safe:false};});
 const settlements=[...towns,...villages];
 const castles=castleNames.map((name,i)=>{const p=byId.get('castle-'+i);return {...p,id:'castle-'+i,name:name+' Castle',kind:'keep',style:'Castle',halfWidth:195,depth:160,size:700};});
 const buildings=[...castles],roads=MASTER_ROADS.map(r=>({...r,points:r.points.map(p=>({...p}))}));
 for(const town of towns){
  const oldTown=old.settlements.find(s=>s.id===town.id);
  const camp=town.id==='day2-bandit',offsets=camp?banditCampOffsets:traderOffsets;
  for(const legacy of old.buildings.filter(b=>b.faction===oldTown.faction&&b.role!=='residence')){
   const [dx,dy]=offsets[legacy.role];
   buildings.push({...legacy,x:Math.round(town.x+dx),y:Math.round(town.y+dy),faction:'neutral',name:camp?'Bandit Camp '+legacy.name.split(' ').slice(-1)[0]:legacy.name});
  }
  if(camp)continue;
  // Wide plaza and short counter approaches; no approved shop geometry is changed.
  roads.push(road('plaza-'+town.id,'path',95,[[town.x-850,town.y+95],[town.x+850,town.y+95]]));
  roads.push(road('cross-'+town.id,'path',70,[[town.x,town.y-680],[town.x,town.y+720]]));
  for(const b of buildings.filter(b=>b.id.startsWith(town.id+'-')))roads.push(road('approach-'+b.id,'path',30,[[b.x,b.y+38],[b.x,b.y+140],[town.x,b.y+140]]));
 }
 const oldHomes=old.buildings.filter(b=>b.houseDesign);
 for(const [vi,v] of villages.entries()){
  // Keep the exact relative positions of the fifteen existing homes so saved
  // garden plots, walls and workstations move with their approved house.
  const offsets=vi===3?oldHomes.map(h=>[h.x-old.settlements.find(s=>s.id==='day2-neutral').x,h.y-old.settlements.find(s=>s.id==='day2-neutral').y]):villageOffsets;
  for(let i=0;i<offsets.length;i++){
   let [dx,dy]=offsets[i];if(vi===8&&i===2)dx-=150;const legacy=vi===3?oldHomes[i]:null;
   const design=legacy?.houseDesign||(['hut','cottage','farmhouse','townhouse','manor'][i%5]);
   const b={...(legacy||{}),id:legacy?.id||`approved-${v.id}-home-${i+1}`,name:legacy?.name||`${v.name} ${design[0].toUpperCase()+design.slice(1)} ${i+1}`,kind:'house',role:'residence',artRole:'residence',style:'Cottage',faction:'neutral',houseDesign:design,tier:legacy?.tier||i%5+1,housingStatus:legacy?.housingStatus||'vacant',x:Math.round(v.x+dx),y:Math.round(v.y+dy),halfWidth:legacy?.halfWidth||125,depth:legacy?.depth||80};
   buildings.push(b);
  }
  // Orthogonal lanes frame a walkable central plaza, unlike the rejected ring.
  roads.push(road('main-street-'+v.id,'path',64,[[v.x,v.y-880],[v.x,v.y+1030]]));
  if(vi!==3)for(const y of [-315,85,585])roads.push(road('lane-'+v.id+'-'+y,'path',43,[[v.x-900,v.y+y],[v.x+900,v.y+y]]));
  for(const b of buildings.filter(b=>b.id.startsWith('approved-'+v.id+'-')||vi===3&&b.houseDesign&&oldHomes.some(h=>h.id===b.id))){
   const lane=b.y<v.y-300?v.y-315:b.y<v.y+250?v.y+85:b.y<v.y+700?v.y+585:v.y+1080;
   roads.push(road('approach-'+b.id,'path',22,vi===3?[[b.x,b.y+38],[v.x,b.y+38]]:[[b.x,b.y+38],[b.x,lane]]));
  }
 }
 for(const s of settlements){let best=null,distance=Infinity;for(const r of MASTER_ROADS)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((s.x-a.x)*dx+(s.y-a.y)*dy)/(dx*dx+dy*dy))),x=a.x+t*dx,y=a.y+t*dy,d=Math.hypot(s.x-x,s.y-y);if(d<distance){best={x,y};distance=d;}}if(best)roads.push(road('link-'+s.id,'path',34,[[best.x,best.y],[s.x,s.y]]));}
 for(const path of roads.filter(r=>r.kind==='path')){
  const points=[];for(let i=1;i<path.points.length;i++){let part;try{part=clearPath(path.points[i-1],path.points[i],buildings);}catch(e){throw Error(path.id+': '+e.message);}points.push(...(i===1?part:part.slice(1)));}path.points=points;
 }
 return {id:'approved-world-v1',layoutVersion:4,...MASTER_SIZE,settlements,buildings,castles,roads,streams:MASTER_RIVERS,bridges:[],resources:[],protection:{status:'approved-trader-towns',zones:towns.map(t=>({id:t.id+'-safe',townId:t.id,x:t.x,y:t.y,radius:t.radius,faction:'neutral'}))},activationReady:false};
}

import {MASTER_SIZE,MASTER_POLYGONS,MASTER_LANDMARKS,contains,onMasterRoad} from './master-geography.mjs';
import {ENEMIES} from './catalog.mjs';
import {equipEnemy} from './enemies.mjs';

const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return(n^(n>>>16))>>>0;};
// Sparse deterministic encounters throughout the approved geography. Existing
// combat, activation limits, loot and respawn timers remain authoritative.
export function ensureMasterEncounters(realm,p){
 if(p.interior||p.creationRequired||p.hp<=0)return;
 const state=realm.state,cell=1536,cx=Math.floor(p.x/cell),cy=Math.floor(p.y/cell);
 state.masterEncounterChunks??={};
 for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++){
  const key=x+','+y;
  if(x<0||y<0||x*cell>=MASTER_SIZE.width||y*cell>=MASTER_SIZE.height||state.masterEncounterChunks[key])continue;
  state.masterEncounterChunks[key]=true;
  const seed=hash(x*73856093^y*19349663);
  for(let attempt=0;attempt<8;attempt++){
   const n=hash(seed+attempt*83492791),px=x*cell+200+n%1136,py=y*cell+200+hash(n)%1136;
   if(px>=MASTER_SIZE.width-40||py>=MASTER_SIZE.height-40||realm.blocks(px,py)||realm.safe({x:px,y:py})||onMasterRoad(px,py,100)||MASTER_LANDMARKS.some(l=>Math.hypot(l.x-px,l.y-py)<1700))continue;
   if(realm.buildings.some(b=>Math.abs(b.x-px)<b.halfWidth+250&&Math.abs(b.y-py)<b.depth+300))continue;
   const terrain=MASTER_POLYGONS.find(s=>['mountain','marsh','forest'].includes(s.kind)&&contains(s.points,px,py));
   const biome=terrain?.kind==='mountain'?'highlands':terrain?.kind==='marsh'?'marsh':'woodland',rank=n%5,id='master-encounter-'+key;
   state.enemies[id]??={id,kind:ENEMIES[biome][rank],biome,x:px,y:py,homeX:px,homeY:py,hp:40+rank*15,maxHp:40+rank*15,damage:5+rank*2,speed:rank===0?85:55,range:35,lastAttack:0,respawnAt:0,active:false};
   equipEnemy(state.enemies[id]);break;
  }
 }
}

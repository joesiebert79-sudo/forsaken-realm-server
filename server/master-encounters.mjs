import {MASTER_SIZE,MASTER_POLYGONS,MASTER_LANDMARKS,contains,onMasterRoad} from './master-geography.mjs';
import {ENEMIES} from './catalog.mjs';
import {equipEnemy} from './enemies.mjs';

const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return(n^(n>>>16))>>>0;};
const animal=kind=>/wolf|boar|bear|rat|hound/.test(kind);

/** Populate traveled wilderness with one animal and one hostile per viable cell.
 * Existing enemies, combat rules, loot and respawn timers stay untouched.
 * A new chunk namespace repairs v0.94 worlds whose old chunks were marked
 * explored despite placing no encounter at all.
 */
export function ensureMasterEncounters(realm,p){
 if(p.interior||p.creationRequired||p.hp<=0)return;
 const state=realm.state,cell=1152,cx=Math.floor(p.x/cell),cy=Math.floor(p.y/cell);
 state.approvedEncounterChunks??={};
 for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++){
  const key=x+','+y;
  if(x<0||y<0||x*cell>=MASTER_SIZE.width||y*cell>=MASTER_SIZE.height||state.approvedEncounterChunks[key])continue;
  state.approvedEncounterChunks[key]=true;
  const seed=hash(x*73856093^y*19349663);
  for(let slot=realm.wildlifeEnabled?1:0;slot<2;slot++){
   const id='approved-encounter-'+key+'-'+slot;
   if(state.enemies[id])continue;
   for(let attempt=0;attempt<18;attempt++){
    const n=hash(seed+slot*1299709+attempt*83492791),px=x*cell+100+n%952,py=y*cell+100+hash(n)%952;
    if(px>=MASTER_SIZE.width-40||py>=MASTER_SIZE.height-40||realm.blocks(px,py)||realm.safe({x:px,y:py})||onMasterRoad(px,py,65))continue;
    if(MASTER_LANDMARKS.some(l=>Math.hypot(l.x-px,l.y-py)<(l.kind==='trader'?700:l.kind==='castle'?600:400)))continue;
    if(realm.buildings.some(b=>Math.abs(b.x-px)<b.halfWidth+150&&Math.abs(b.y-py)<b.depth+180))continue;
    const terrain=MASTER_POLYGONS.find(s=>['mountain','marsh','forest'].includes(s.kind)&&contains(s.points,px,py));
    const biome=terrain?.kind==='mountain'?'highlands':terrain?.kind==='marsh'?'marsh':'woodland';
    const choices=ENEMIES[biome].filter(kind=>animal(kind)===(slot===0));
    const kind=choices[n%choices.length],rank=slot===0?0:1+n%3;
    const enemy={id,kind,biome,x:px,y:py,homeX:px,homeY:py,hp:40+rank*15,maxHp:40+rank*15,damage:5+rank*2,speed:slot===0?85:55,range:35,lastAttack:0,respawnAt:0,active:false};
    equipEnemy(enemy);state.enemies[id]=enemy;break;
   }
  }
 }
 // A traveler leaving safety should actually see life in the nearby world.
 // One deterministic sighting per 768-unit travel cell avoids endless spawns.
 if(realm.safe(p))return;
 const tx=Math.floor(p.x/768),ty=Math.floor(p.y/768);
 const seed=hash(tx*92837111^ty*689287499);
 for(let slot=realm.wildlifeEnabled?1:0;slot<2;slot++){
  const id='approved-sighting-'+tx+','+ty+'-'+slot;
  if(state.enemies[id]||Object.values(state.enemies).some(e=>e.hp>0&&animal(e.kind)===(slot===0)&&Math.hypot(e.x-p.x,e.y-p.y)<285))continue;
  for(let attempt=0;attempt<16;attempt++){
  const angle=(seed%6283)/1000+attempt*2.399963+slot*Math.PI,radius=145+hash(seed+attempt+slot*31)%115;
  const px=Math.round(p.x+Math.cos(angle)*radius),py=Math.round(p.y+Math.sin(angle)*radius);
  if(px<40||py<40||px>MASTER_SIZE.width-40||py>MASTER_SIZE.height-40||realm.blocks(px,py)||realm.safe({x:px,y:py})||onMasterRoad(px,py,65))continue;
  if(realm.buildings.some(b=>Math.abs(b.x-px)<b.halfWidth+120&&Math.abs(b.y-py)<b.depth+150))continue;
  const kind=slot===0?'wolf':'poacher';
  const enemy={id,kind,biome:'woodland',x:px,y:py,homeX:px,homeY:py,hp:50,maxHp:50,damage:6,speed:kind==='wolf'?85:55,range:35,lastAttack:0,respawnAt:0,active:false};
  equipEnemy(enemy);state.enemies[id]=enemy;break;
 }
 }
}

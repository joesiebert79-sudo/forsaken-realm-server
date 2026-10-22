import {MASTER_POLYGONS} from './master-geography.mjs';
import {COMPACT,LAYOUT,MASTER} from './world-profile.mjs';
import {CASTLES} from './castles.mjs';
import {WORLD,VILLAGES,WORLD_BUILDINGS,NEW_VILLAGES,buildingBlocks} from './catalog.mjs';
export const segmentDistance=(x,y,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y;const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);};
export function createRoadGeometry(buildings=WORLD_BUILDINGS){
 if(COMPACT){const ROADS=LAYOUT.roads;const nearRoad=(x,y,extra=0)=>ROADS.some(r=>r.points.slice(1).some((b,i)=>segmentDistance(x,y,r.points[i],b)<r.width/2+extra));return {ROADS,nearRoad,localRoads:(p,radius=1300)=>ROADS.filter(r=>r.points.slice(1).some((b,i)=>segmentDistance(p.x,p.y,r.points[i],b)<radius))};}

const blockers=buildings.map(b=>({left:b.x-b.halfWidth-45,right:b.x+b.halfWidth+45,top:b.y-b.depth-45,bottom:b.y+45,id:b.id}));
function intersects(a,b,r){let lo=0,hi=1;for(const [origin,delta,min,max] of [[a.x,b.x-a.x,r.left,r.right],[a.y,b.y-a.y,r.top,r.bottom]]){if(Math.abs(delta)<.0001){if(origin<=min||origin>=max)return false;}else{let t0=(min-origin)/delta,t1=(max-origin)/delta;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>=hi)return false;}}return true;}
function clearSegment(a,b,ignore){return !blockers.some(r=>r.id!==ignore&&intersects(a,b,r));}
function rounded(points,ignore){const result=[points[0]];for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(c.x-b.x,c.y-b.y),radius=Math.min(180,ab*.3,bc*.3),u={x:b.x+(a.x-b.x)*radius/ab,y:b.y+(a.y-b.y)*radius/ab},v={x:b.x+(c.x-b.x)*radius/bc,y:b.y+(c.y-b.y)*radius/bc};const curve=[u];for(let j=1;j<=8;j++){const t=j/8;curve.push({x:(1-t)**2*u.x+2*(1-t)*t*b.x+t*t*v.x,y:(1-t)**2*u.y+2*(1-t)*t*b.y+t*t*v.y});}if(curve.slice(1).every((p,j)=>clearSegment(curve[j],p,ignore)))result.push(...curve);else result.push(b);}result.push(points.at(-1));return result;}
function organic(points,ignore){points=rounded(points,ignore);const output=[points[0]];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.y-a.y),count=Math.max(1,Math.ceil(length/250)),wave=length<120?0:Math.min(ignore?10:90,length*.08),part=[];for(let j=1;j<=count;j++){const t=j/count,offset=Math.sin(t*Math.PI*2)*Math.sin(t*Math.PI)*wave;part.push({x:a.x+(b.x-a.x)*t-(b.y-a.y)/length*offset,y:a.y+(b.y-a.y)*t+(b.x-a.x)/length*offset});}if(part.some(p=>!Number.isFinite(p.x)||p.x<0||p.y<0||p.x>WORLD.width||p.y>WORLD.height)||!part.every((p,j)=>clearSegment(j?part[j-1]:a,p,ignore)))output.push(b);else output.push(...part);}return output;}

function route(a,b,ignore){const candidates=[[a,b],[a,{x:a.x,y:b.y},b],[a,{x:b.x,y:a.y},b]];for(let i=0;i<30;i++){let offset=(Math.floor(i/2)+1)*240*(i%2?-1:1);for(const x of [(a.x+b.x)/2+offset,a.x+offset,b.x+offset])candidates.push([a,{x,y:a.y},{x,y:b.y},b]);for(const y of [(a.y+b.y)/2+offset,a.y+offset,b.y+offset])candidates.push([a,{x:a.x,y},{x:b.x,y},b]);}for(const points of candidates){if(points.some(p=>p.x<0||p.y<0||p.x>WORLD.width||p.y>WORLD.height))continue;if(points.slice(1).every((p,i)=>clearSegment(points[i],p,ignore)))return points.filter((p,i)=>i===0||p.x!==points[i-1].x||p.y!==points[i-1].y);}for(const margin of [700,2500]){const nodes=[a,b];for(const r of blockers){if(r.id===ignore||r.right<Math.min(a.x,b.x)-margin||r.left>Math.max(a.x,b.x)+margin||r.bottom<Math.min(a.y,b.y)-margin||r.top>Math.max(a.y,b.y)+margin)continue;for(const x of [r.left-2,r.right+2])for(const y of [r.top-2,r.bottom+2])if(x>=0&&y>=0&&x<=WORLD.width&&y<=WORLD.height)nodes.push({x,y});}const dist=nodes.map(()=>Infinity),prev=[],done=new Set();dist[0]=0;while(done.size<nodes.length){let at=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(at<0||dist[j]<dist[at]))at=j;if(at<0||!Number.isFinite(dist[at]))break;if(at===1){const result=[];for(let k=1;k!==undefined;k=prev[k])result.unshift(nodes[k]);return result;}done.add(at);for(let j=0;j<nodes.length;j++){if(done.has(j))continue;const cost=dist[at]+Math.hypot(nodes[j].x-nodes[at].x,nodes[j].y-nodes[at].y);if(cost<dist[j]&&clearSegment(nodes[at],nodes[j],ignore)){dist[j]=cost;prev[j]=at;}}}}throw Error(`Cannot route road from ${a.x},${a.y} to ${b.x},${b.y}`);}
// A spanning network makes every settlement reachable without generating a dense road grid.
const ROADS=[];const visited=new Set([0]);
while(visited.size<VILLAGES.length){let edge;for(const a of visited)for(let b=0;b<VILLAGES.length;b++){if(visited.has(b))continue;const d=Math.hypot(VILLAGES[a].x-VILLAGES[b].x,VILLAGES[a].y-VILLAGES[b].y);if(!edge||d<edge.d)edge={a,b,d};}const a=VILLAGES[edge.a],b=VILLAGES[edge.b];ROADS.push({id:`road-${a.id}-${b.id}`,kind:'road',width:76,from:a.id,to:b.id,points:organic(route(a,b))});visited.add(edge.b);}
for(const b of buildings){let village=VILLAGES.reduce((a,v)=>Math.hypot(v.x-b.x,v.y-b.y)<Math.hypot(a.x-b.x,a.y-b.y)?v:a);const door={x:b.x,y:b.y+100};let join=village,best=Math.hypot(door.x-village.x,door.y-village.y);for(const road of ROADS.filter(r=>r.kind==='road'))for(let i=1;i<road.points.length;i++){const a=road.points[i-1],z=road.points[i],dx=z.x-a.x,dy=z.y-a.y,t=Math.max(0,Math.min(1,((door.x-a.x)*dx+(door.y-a.y)*dy)/(dx*dx+dy*dy||1))),q={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(door.x-q.x,door.y-q.y);if(d<best&&clearSegment(q,door)){join=q;best=d;}}ROADS.push({id:`path-${b.id}`,kind:'path',width:22,to:b.id,points:organic([...route(join,{x:b.x,y:b.y+100}),{x:b.x,y:b.y+35}],b.id)});}
const segments=ROADS.flatMap(r=>r.points.slice(1).map((p,i)=>({a:r.points[i],b:p,width:r.width,road:r})));
// Spatially index road segments: world generation and local snapshots must not
// scan every path in every town for every resource/player query.
const roadCells=new Map(),CELL=512;
for(const s of segments)for(let x=Math.floor(Math.min(s.a.x,s.b.x)/CELL);x<=Math.floor(Math.max(s.a.x,s.b.x)/CELL);x++)for(let y=Math.floor(Math.min(s.a.y,s.b.y)/CELL);y<=Math.floor(Math.max(s.a.y,s.b.y)/CELL);y++){const key=x+','+y;let bucket=roadCells.get(key);if(!bucket)roadCells.set(key,bucket=[]);bucket.push(s);}
function roadCandidates(x,y,radius){const found=new Set();for(let cx=Math.floor((x-radius)/CELL);cx<=Math.floor((x+radius)/CELL);cx++)for(let cy=Math.floor((y-radius)/CELL);cy<=Math.floor((y+radius)/CELL);cy++)for(const s of roadCells.get(cx+','+cy)||[])found.add(s);return found;}
const nearRoad=(x,y,extra=0)=>{for(const s of roadCandidates(x,y,extra+38))if(segmentDistance(x,y,s.a,s.b)<s.width/2+extra)return true;return false;};

function localRoads(p,radius=1300){const found=new Set();for(const s of roadCandidates(p.x,p.y,radius))if(segmentDistance(p.x,p.y,s.a,s.b)<radius)found.add(s.road);return [...found];}
return {ROADS,nearRoad,localRoads};
}
const defaultRoads=createRoadGeometry();
export const {ROADS,nearRoad,localRoads}=defaultRoads;
export const nearVillage=(x,y,margin=700)=>VILLAGES.some(v=>Math.hypot(v.x-x,v.y-y)<margin);
const geometryCache=new Map();
export function roadsForWorld(state){const locations=state.buildingLocations||{};if(!Object.keys(locations).length)return defaultRoads;const key=JSON.stringify(locations);if(!geometryCache.has(key)){if(geometryCache.size>4)geometryCache.clear();geometryCache.set(key,createRoadGeometry(WORLD_BUILDINGS.map(b=>({...b,...locations[b.id]}))));}return geometryCache.get(key);}
export const STREAMS=COMPACT?LAYOUT.streams:[21000,43000].map((base,i)=>({name:i?'Eastwater':'Alder Run',width:65,points:Array.from({length:65},(_,n)=>({x:base+Math.sin(n/7+i)*1000,y:n*WORLD.height/64}))}));
// Low-cost ground detail appears on both the atlas and the playable landscape.
export const TERRAIN=VILLAGES.flatMap((v,i)=>[{id:v.id+'-fields',kind:'fields',name:v.name+' Fields',x:v.x+650,y:v.y+1350,rx:420,ry:190},{id:v.id+'-meadow',kind:'meadow',name:v.name+' Common',x:v.x-1000,y:v.y+1500,rx:570,ry:360}]).filter(t=>t.x-t.rx>0&&t.y+t.ry<WORLD.height&&!WORLD_BUILDINGS.some(b=>Math.abs(b.x-t.x)<t.rx+b.halfWidth&&Math.abs(b.y-t.y)<t.ry+b.depth));
export function localTerrain(p){return TERRAIN.filter(t=>Math.abs(t.x-p.x)<1600+t.rx&&Math.abs(t.y-p.y)<1600+t.ry);}
export const worldMap={...(MASTER?{terrainPolygons:MASTER_POLYGONS}:{}),castles:CASTLES,terrain:TERRAIN,villages:VILLAGES,roads:ROADS.filter(r=>r.kind==='road'),paths:ROADS.filter(r=>r.kind==='path'),streams:STREAMS.slice(0,1),rivers:STREAMS.slice(1),regions:COMPACT?LAYOUT.settlements.map(t=>({name:t.name,x:t.x,y:t.y})):[{name:'Western Marches',x:4000,y:24000},{name:'Northreach',x:36000,y:6500},{name:'Ashen Lowlands',x:17000,y:48000},{name:'Eastern Downs',x:49000,y:37000}]};
const hash=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
export function expandLandscape(state){if(COMPACT)return;if(state.landscapeVersion>=2)return;
 // Only generated nature is thinned. Character identities, items, claims and structures are untouched.
 state.resources=state.resources.filter(r=>!nearRoad(r.x,r.y,100)&&!nearVillage(r.x,r.y,620)&&(r.kind!=='wood'||hash(r.id)%4===0));
 const occupied=new Set(state.resources.map(r=>`${Math.floor(r.x/180)},${Math.floor(r.y/180)}`));
 const add=(id,x,y,kind)=>{const cell=`${Math.floor(x/180)},${Math.floor(y/180)}`;if(x<80||y<80||x>WORLD.width-80||y>WORLD.height-80||occupied.has(cell)||nearRoad(x,y,100)||nearVillage(x,y,620)||buildingBlocks(x,y))return;occupied.add(cell);state.resources.push({id,x,y,kind,remaining:12,readyAt:0});};
 // A few harvesting nodes outside each village, plus sparse open countryside.
 for(const v of VILLAGES)for(let i=0;i<12;i++){const angle=i*Math.PI/6;add(`village-resource-${v.id}-${i}`,v.x+Math.cos(angle)*950,v.y+Math.sin(angle)*950,['wood','stone','fiber','ironOre'][i%4]);}
 for(let i=0;i<3600;i++){const x=150+hash(`land-x-${i}`)%(WORLD.width-300),y=150+hash(`land-y-${i}`)%(WORLD.height-300);if(x<13585&&y<13585)continue;add(`open-country-${i}`,x,y,['wood','stone','fiber','ironOre'][i%4]);}
 const kept={},types=new Set();for(const e of Object.values(state.enemies)){const key=e.biome+':'+e.kind;if(types.has(key)||nearRoad(e.homeX,e.homeY,180)||nearVillage(e.homeX,e.homeY,850))continue;types.add(key);kept[e.id]=e;}
 const templates=Object.values(state.enemies);if(!templates.length){state.enemies=kept;state.landscapeVersion=2;return;}for(let i=0;i<NEW_VILLAGES.length;i++){const v=NEW_VILLAGES[i];for(let j=0;j<2;j++){const x=v.x+(j?1400:-1400),y=v.y+1300;if(nearRoad(x,y,240)||buildingBlocks(x,y))continue;const e=structuredClone(templates[(i*2+j)%templates.length]);e.id=`country-enemy-${i}-${j}`;e.x=e.homeX=x;e.y=e.homeY=y;e.hp=e.maxHp;e.active=false;e.respawnAt=0;kept[e.id]=e;}}
 state.enemies=kept;state.landscapeVersion=2;
}



// Stable one-time nature migration: leave loose starters, ores and player property intact.
export function naturalizeStones(state){
 if(state.stoneLandscapeVersion>=2)return;
 state.resources=state.resources.filter(r=>{
  if(r.kind!=='stone'||r.loose||! /^(resource-|forest-|frontier-resource-|village-resource-|open-country-)/.test(r.id))return true;
  const patch=hash(Math.floor(r.x/650)+','+Math.floor(r.y/650))%4;
  return hash(r.id)%100<(patch===0?12:3);
 });
 state.stoneLandscapeVersion=2;
}




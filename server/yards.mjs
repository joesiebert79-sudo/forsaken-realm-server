// Decorative garden beds and boundary segments; gates and roads remain clear.
const cache=new WeakMap();
export function createYards(buildings,roads){
 const key=buildings.map(b=>b.id).join('|'),cached=cache.get(roads);if(cached?.key===key)return cached.details;
 const clear=(x,y)=>!roads.nearRoad(x,y,60)&&!buildings.some(b=>Math.abs(x-b.x)<b.halfWidth+20&&y>b.y-b.depth-20&&y<b.y+55)&&!buildings.some(b=>Math.abs(x-b.x)<90&&y>b.y&&y<b.y+230);
 const details=[];
 for(const b of buildings){if(b.kind!=='house')continue;const farm=b.rural||/Farmstead|Stable|Granary|Crofter/.test(b.name),x=b.x,y=b.y,a=b.halfWidth+75,back=y-b.depth-75,front=y+175,kind=farm?'fence':b.id.length%3?'fence':'wall';
  const edges=[[x-a,back,x+a,back],[x-a,back,x-a,front],[x+a,back,x+a,front],[x-a,front,x-65,front],[x+65,front,x+a,front]];
  for(const [x1,y1,x2,y2]of edges){const count=Math.ceil(Math.hypot(x2-x1,y2-y1)/28);for(let i=0;i<count;i++){const u=i/count,v=(i+1)/count,ax=x1+(x2-x1)*u,ay=y1+(y2-y1)*u,bx=x1+(x2-x1)*v,by=y1+(y2-y1)*v;if([0,.25,.5,.75,1].every(t=>clear(ax+(bx-ax)*t,ay+(by-ay)*t)))details.push({kind,x:ax,y:ay,x2:bx,y2:by});}}
  for(const side of [-1,1]){const gx=x+side*(b.halfWidth+35),gy=y+90;if([-20,0,20].every(dx=>[-25,0,25].every(dy=>clear(gx+dx,gy+dy))))details.push({kind:farm?'crops':'garden',x:gx,y:gy,w:40,h:50});}
 }
 cache.set(roads,{key,details});return details;
}
export function localYards(yards,p,state){const occupied=[...Object.values(state.structures||{}),...Object.values(state.settlements||{}),...Object.values(state.npcSettlements||{})];return yards.filter(t=>Math.abs(t.x-p.x)<1100&&Math.abs(t.y-p.y)<1100&&!state.claims?.[Math.floor(t.x/256)+','+Math.floor(t.y/256)]&&!occupied.some(o=>Math.hypot(t.x-o.x,t.y-o.y)<160));}




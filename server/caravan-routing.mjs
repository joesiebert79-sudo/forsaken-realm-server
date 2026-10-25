import {APPROVED_WORLD} from './world-profile.mjs';
// Route choice runs only at departure. Existing road geometry remains authoritative.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function planCaravanRoute(r,from,to,convoy={}){
 if(APPROVED_WORLD)return approvedRoute(r,from,to,convoy);
 const roads=r.roadGeometry.ROADS.filter(e=>e.kind==='road'&&e.points?.length>1).map((e,i)=>({...e,key:e.id||[e.from,e.to].sort().join(':')+':'+i}));
 const previous=convoy.history?.at(-1)?.roads||[],hazards=(convoy.ambushes||[]).filter(h=>r.clock()-h.at<10800000&&Number.isFinite(h.x)&&Number.isFinite(h.y));
 const weights=new Map(roads.map(e=>{const length=e.points.slice(1).reduce((sum,p,i)=>sum+distance(e.points[i],p),0);const danger=hazards.filter(h=>e.points.some(p=>distance(p,h)<600)).length;return [e.key,length*(1+danger*5)+(previous.includes(e.key)?length*.35:0)];}));
 function shortest(excluded){const costs=new Map([[from.mapId,0]]),prev=new Map(),open=new Set([from.mapId]),done=new Set();while(open.size){const id=[...open].sort((a,b)=>costs.get(a)-costs.get(b))[0];open.delete(id);if(id===to.mapId)break;done.add(id);for(const e of roads){if(e.key===excluded)continue;const next=e.from===id?e.to:e.to===id?e.from:null;if(!next||done.has(next))continue;const cost=costs.get(id)+weights.get(e.key);if(cost<(costs.get(next)??Infinity)){costs.set(next,cost);prev.set(next,{id,e,forward:e.from===id});open.add(next);}}}if(!costs.has(to.mapId))return null;const steps=[];for(let id=to.mapId;id!==from.mapId;){const step=prev.get(id);if(!step)return null;steps.unshift(step);id=step.id;}return {points:steps.flatMap((s,i)=>{const pts=s.forward?s.e.points:[...s.e.points].reverse();return i?pts.slice(1):pts;}),roads:steps.map(s=>s.e.key),cost:costs.get(to.mapId)};}
 let best=shortest(null);if(!best)return null;
 const same=(a,b)=>a.length===b.length&&(a.every((v,i)=>v===b[i])||a.every((v,i)=>v===b[b.length-1-i]));
 if(previous.length&&same(best.roads,previous)){const alternatives=best.roads.map(key=>shortest(key)).filter(Boolean).sort((a,b)=>a.cost-b.cost);if(alternatives.length)best=alternatives[0];}
 return best;
}

function approvedRoute(r,from,to,convoy){
 const roads=r.roadGeometry.ROADS.filter(e=>e.kind==='road'&&e.points?.length>1);
 const links=r.roadGeometry.ROADS.filter(e=>e.id?.startsWith('link-')&&e.points?.length>1);
 const origin=links.find(e=>e.id==='link-'+from.id),target=links.find(e=>e.id==='link-'+to.id);
 if(!origin||!target)return null;
 const key=p=>p.x+','+p.y,nodes=new Map(),edges=new Map();
 const addNode=p=>{const id=key(p);if(!nodes.has(id))nodes.set(id,p);if(!edges.has(id))edges.set(id,[]);return id;};
 const recent=new Set(convoy.history?.at(-1)?.roads||[]),hazards=(convoy.ambushes||[]).filter(h=>r.clock()-h.at<10800000);
 const addEdge=(a,b,id)=>{const ka=addNode(a),kb=addNode(b),length=distance(a,b),danger=hazards.some(h=>Number.isFinite(h.x)&&Number.isFinite(h.y)&&Math.min(distance(h,a),distance(h,b))<600),cost=length*(1+(danger?5:0)+(recent.has(id)?.35:0));edges.get(ka).push({to:kb,id,cost});edges.get(kb).push({to:ka,id,cost});};
 for(const line of [...roads,...links])for(let i=1;i<line.points.length;i++)addEdge(line.points[i-1],line.points[i],line.id);
 // Each village approach joins a traced inter-settlement road at its nearest
 // segment, including where the junction lies between authored control points.
 for(const link of links){const q=link.points[0];let nearest=null,best=Infinity;
  for(const line of roads)for(let i=1;i<line.points.length;i++){const a=line.points[i-1],b=line.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/(dx*dx+dy*dy||1))),p={x:a.x+t*dx,y:a.y+t*dy},d=distance(q,p);if(d<best){best=d;nearest={a,b};}}
  if(nearest){addEdge(q,nearest.a,nearest.a.x+','+nearest.a.y);addEdge(q,nearest.b,nearest.b.x+','+nearest.b.y);}
 }
 const start=key(origin.points.at(-1)),end=key(target.points.at(-1)),costs=new Map([[start,0]]),prev=new Map(),queue=new Set([start]),done=new Set();
 while(queue.size){const at=[...queue].sort((a,b)=>costs.get(a)-costs.get(b))[0];queue.delete(at);if(at===end)break;done.add(at);for(const e of edges.get(at)||[]){if(done.has(e.to))continue;const cost=costs.get(at)+e.cost;if(cost<(costs.get(e.to)??Infinity)){costs.set(e.to,cost);prev.set(e.to,{from:at,id:e.id});queue.add(e.to);}}}
 if(!costs.has(end))return null;const points=[],used=[];for(let at=end;at!==start;){points.unshift(nodes.get(at));const e=prev.get(at);if(!e)return null;used.unshift(e.id);at=e.from;}points.unshift(nodes.get(start));
 return {points,roads:[...new Set(used)],cost:costs.get(end)};
}




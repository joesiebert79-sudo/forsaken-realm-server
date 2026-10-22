// Route choice runs only at departure. Existing road geometry remains authoritative.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function planCaravanRoute(r,from,to,convoy={}){
 const roads=r.roadGeometry.ROADS.filter(e=>e.kind==='road'&&e.points?.length>1).map((e,i)=>({...e,key:e.id||[e.from,e.to].sort().join(':')+':'+i}));
 const previous=convoy.history?.at(-1)?.roads||[],hazards=(convoy.ambushes||[]).filter(h=>r.clock()-h.at<10800000&&Number.isFinite(h.x)&&Number.isFinite(h.y));
 const weights=new Map(roads.map(e=>{const length=e.points.slice(1).reduce((sum,p,i)=>sum+distance(e.points[i],p),0);const danger=hazards.filter(h=>e.points.some(p=>distance(p,h)<600)).length;return [e.key,length*(1+danger*5)+(previous.includes(e.key)?length*.35:0)];}));
 function shortest(excluded){const costs=new Map([[from.mapId,0]]),prev=new Map(),open=new Set([from.mapId]),done=new Set();while(open.size){const id=[...open].sort((a,b)=>costs.get(a)-costs.get(b))[0];open.delete(id);if(id===to.mapId)break;done.add(id);for(const e of roads){if(e.key===excluded)continue;const next=e.from===id?e.to:e.to===id?e.from:null;if(!next||done.has(next))continue;const cost=costs.get(id)+weights.get(e.key);if(cost<(costs.get(next)??Infinity)){costs.set(next,cost);prev.set(next,{id,e,forward:e.from===id});open.add(next);}}}if(!costs.has(to.mapId))return null;const steps=[];for(let id=to.mapId;id!==from.mapId;){const step=prev.get(id);if(!step)return null;steps.unshift(step);id=step.id;}return {points:steps.flatMap((s,i)=>{const pts=s.forward?s.e.points:[...s.e.points].reverse();return i?pts.slice(1):pts;}),roads:steps.map(s=>s.e.key),cost:costs.get(to.mapId)};}
 let best=shortest(null);if(!best)return null;
 const same=(a,b)=>a.length===b.length&&(a.every((v,i)=>v===b[i])||a.every((v,i)=>v===b[b.length-1-i]));
 if(previous.length&&same(best.roads,previous)){const alternatives=best.roads.map(key=>shortest(key)).filter(Boolean).sort((a,b)=>a.cost-b.cost);if(alternatives.length)best=alternatives[0];}
 return best;
}




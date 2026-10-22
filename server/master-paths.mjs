// Small visibility graph for village footpaths. Traced inter-town roads remain immutable.
function crosses(a,b,r){let lo=0,hi=1;for(const [v,d,min,max]of[[a.x,b.x-a.x,r.l,r.r],[a.y,b.y-a.y,r.t,r.b]]){if(Math.abs(d)<1e-9){if(v<=min||v>=max)return false;}else{let u=(min-v)/d,w=(max-v)/d;if(u>w)[u,w]=[w,u];lo=Math.max(lo,u);hi=Math.min(hi,w);if(lo>=hi)return false;}}return true;}
export function clearPath(a,b,buildings){
 const blockers=buildings.filter(h=>h.x>Math.min(a.x,b.x)-1800&&h.x<Math.max(a.x,b.x)+1800&&h.y>Math.min(a.y,b.y)-1800&&h.y<Math.max(a.y,b.y)+1800).map(h=>({l:h.x-h.halfWidth-24,r:h.x+h.halfWidth+24,t:h.y-h.depth-24,b:h.y+24}));
 const clear=(a,b)=>!blockers.some(r=>crosses(a,b,r));if(clear(a,b))return[a,b];
 const nodes=[a,b];for(const r of blockers)for(const x of[r.l-3,r.r+3])for(const y of[r.t-3,r.b+3])nodes.push({x,y});
 const d=nodes.map(()=>Infinity),prev=[],done=new Set();d[0]=0;
 while(done.size<nodes.length){let at=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(at<0||d[i]<d[at]))at=i;if(at<0||!Number.isFinite(d[at]))break;if(at===1){const path=[];for(let i=1;i!==undefined;i=prev[i])path.unshift(nodes[i]);return path;}done.add(at);for(let i=0;i<nodes.length;i++)if(!done.has(i)&&clear(nodes[at],nodes[i])){const cost=d[at]+Math.hypot(nodes[at].x-nodes[i].x,nodes[at].y-nodes[i].y);if(cost<d[i]){d[i]=cost;prev[i]=at;}}}
 throw Error('No clear master-map village footpath');
}


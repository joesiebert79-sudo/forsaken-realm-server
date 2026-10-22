// Bounded local A* detours. Runtime-only caches never alter identities or saved orders.
const caches=new WeakMap(),STEP=32,LIMIT=128;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function clear(r,a,b){const d=distance(a,b),steps=Math.ceil(d/2);for(let i=1;i<=steps;i++){const x=a.x+(b.x-a.x)*i/steps,y=a.y+(b.y-a.y)*i/steps;if(x<0||y<0||r.blocks(x,y)||r.safe({x,y}))return false;}return true;}
export function navigate(r,n,target,dt){if(!Number.isFinite(target?.x)||!Number.isFinite(target?.y))return;const d=distance(n,target),step=Math.min(d,(n.speed||55)*dt);if(d<2||step<=0)return;const direct={x:n.x+(target.x-n.x)*step/d,y:n.y+(target.y-n.y)*step/d};if(!caches.get(r)?.entries.get(n.id)?.path.length&&clear(r,n,direct)){n.x=direct.x;n.y=direct.y;n.active=true;return;}
 let cache=caches.get(r);if(!cache){cache={entries:new Map(),window:0,budget:0};caches.set(r,cache);}const now=r.clock();if(now>=cache.window){cache.window=now+1000;cache.budget=4;}let entry=cache.entries.get(n.id);if(entry&&distance(entry.goal,target)>96){cache.entries.delete(n.id);entry=null;}
 if(!entry||now>entry.expires){if(cache.budget<=0)return;cache.budget--;const open=[{x:n.x,y:n.y,g:0,h:d,key:'0,0',parent:null,ix:0,iy:0}],seen=new Map([['0,0',0]]);let best=open[0],expanded=0;while(open.length&&expanded++<LIMIT){open.sort((a,b)=>a.g+a.h-b.g-b.h);const cur=open.shift();if(cur.h<best.h)best=cur;if(cur.h<STEP)break;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const ix=cur.ix+dx,iy=cur.iy+dy,key=ix+','+iy,next={x:n.x+ix*STEP,y:n.y+iy*STEP},g=cur.g+Math.hypot(dx,dy)*STEP;if(g>=(seen.get(key)??Infinity)||!clear(r,cur,next))continue;seen.set(key,g);open.push({...next,ix,iy,key,g,h:distance(next,target),parent:cur});}}
 const path=[];while(best.parent){path.unshift({x:best.x,y:best.y});best=best.parent;}entry={path,goal:{...target},expires:now+5000};cache.entries.set(n.id,entry);if(cache.entries.size>256)cache.entries.delete(cache.entries.keys().next().value);}
 while(entry.path.length&&distance(n,entry.path[0])<3)entry.path.shift();const next=entry.path[0];if(!next)return;const length=distance(n,next),amount=Math.min(length,step),pos={x:n.x+(next.x-n.x)*amount/length,y:n.y+(next.y-n.y)*amount/length};if(clear(r,n,pos)){n.x=pos.x;n.y=pos.y;n.active=true;}else cache.entries.delete(n.id);
}




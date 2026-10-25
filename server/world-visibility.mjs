// Shared world time; one real hour per game day, persisted across restarts.
export const DAY_LENGTH_MS=3600000;
export const SIGHT_RADIUS=500;
export const EXPLORE_CELL=75;
export const EXPLORE_RADIUS=100;
export function worldTime(state,now){
 state.dayStartedAt??=now-DAY_LENGTH_MS/3;
 const minutes=Math.floor(((now-state.dayStartedAt)%DAY_LENGTH_MS+DAY_LENGTH_MS)%DAY_LENGTH_MS/DAY_LENGTH_MS*1440);
 const hour=Math.floor(minutes/60),phase=hour<5||hour>=20?'Night':hour<7?'Dawn':hour<18?'Day':'Dusk';
 return {minutes,label:String(hour).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0'),phase,dayLengthMs:DAY_LENGTH_MS,nightShade:phase==='Night'?.28:phase==='Day'?0:.12};
}
export function visibility(state,p){
 const cellSize=EXPLORE_CELL,radius=SIGHT_RADIUS,exploreRadius=EXPLORE_RADIUS;
 state.exploration??={};const key=p.characterId||p.id;
 const explored=state.exploration[key]??={};
 if(!p.interior)for(let x=Math.floor((p.x-exploreRadius)/cellSize);x<=Math.floor((p.x+exploreRadius)/cellSize);x++)for(let y=Math.floor((p.y-exploreRadius)/cellSize);y<=Math.floor((p.y+exploreRadius)/cellSize);y++){
  if(x<0||y<0)continue;
  const dx=Math.max(x*cellSize-p.x,0,p.x-(x+1)*cellSize),dy=Math.max(y*cellSize-p.y,0,p.y-(y+1)*cellSize);
  if(Math.hypot(dx,dy)<=exploreRadius)explored[x+','+y]=true;
 }
 const local=[];if(!p.interior)for(let x=Math.floor((p.x-650)/cellSize);x<=Math.ceil((p.x+650)/cellSize);x++)for(let y=Math.floor((p.y-650)/cellSize);y<=Math.ceil((p.y+650)/cellSize);y++){const k=x+','+y;if(explored[k]&&Math.abs(x*cellSize-p.x)<650&&Math.abs(y*cellSize-p.y)<650)local.push(k);}return {radius,cellSize,explored:local};
}
export function inSight(p,actor){return (p.interior||null)===(actor.interior||null)&&Math.hypot(p.x-actor.x,p.y-actor.y)<=SIGHT_RADIUS;}




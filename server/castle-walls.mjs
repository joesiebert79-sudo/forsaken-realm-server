import {CASTLES} from './castles.mjs';
// Static perimeter with opposing 140-unit gates; keep entrances remain unchanged.
export const CASTLE_WALLS=CASTLES.flatMap(c=>[
 [-420,-360,-70,-360],[70,-360,420,-360],[-420,360,-70,360],[70,360,420,360],[-420,-360,-420,360],[420,-360,420,360]
].map(([x,y,x2,y2],i)=>({id:c.id+'-wall-'+i,kind:'castleWall',x:c.x+x,y:c.y+y,x2:c.x+x2,y2:c.y+y2,castle:c.id})));
// Reject distant castles before checking their six wall rectangles. No per-query allocations.
const wallGroups=CASTLES.map(c=>({minX:c.x-438,maxX:c.x+438,minY:c.y-378,maxY:c.y+378,walls:CASTLE_WALLS.filter(w=>w.castle===c.id).map(w=>[Math.min(w.x,w.x2)-18,Math.max(w.x,w.x2)+18,Math.min(w.y,w.y2)-18,Math.max(w.y,w.y2)+18])}));
export function castleWallBlocks(x,y){for(const g of wallGroups){if(x<g.minX||x>g.maxX||y<g.minY||y>g.maxY)continue;for(const w of g.walls)if(x>=w[0]&&x<=w[1]&&y>=w[2]&&y<=w[3])return true;}return false;}
export function localCastleWalls(p){return p.interior?[]:CASTLE_WALLS.filter(w=>p.x>=Math.min(w.x,w.x2)-1000&&p.x<=Math.max(w.x,w.x2)+1000&&p.y>=Math.min(w.y,w.y2)-1000&&p.y<=Math.max(w.y,w.y2)+1000);}
export function clearWallOverlap(p,blocked){if(!p||p.interior||!castleWallBlocks(p.x,p.y))return;for(let radius=24;radius<=200;radius+=8)for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const x=p.x+dx*radius,y=p.y+dy*radius;if(!blocked(x,y)){p.x=x;p.y=y;return;}}}



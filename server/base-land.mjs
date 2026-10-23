import {validateHousingPlacement,reservedFootprint} from './housing.mjs';
import {WORLD} from './catalog.mjs';
import {MASTER,LAYOUT} from './world-profile.mjs';
import {masterLandRectangle} from './master-geography.mjs';
export const landRadius=level=>300+60*(Math.max(1,Math.min(8,level))-1);
export function validateBaseLand(r,h,level){const radius=landRadius(level),boxSize=radius*2;
 const ownAnnex=s=>s.propertyId===h.id||s.settlementId===h.settlementId;
 const occupied=r.buildings.filter(b=>b.id!==h.buildingId&&b.propertyId!==h.id).map(b=>({left:b.x-b.halfWidth-15,right:b.x+b.halfWidth+15,top:b.y-b.depth-15,bottom:b.y+65}));
 for(const other of Object.values(r.state.properties||{})){if(other.id===h.id||other.abandonedAt)continue;occupied.push(reservedFootprint({width:other.width||100,depth:other.depth||70,reservedWidth:other.reservedWidth||other.width||100,reservedDepth:other.reservedDepth||other.depth||70},other,other.rotation||0));}
 for(const s of Object.values(r.state.structures||{}))if(s.hp>0&&!s.abandonedAt&&!ownAnnex(s))occupied.push({left:s.x-40,right:s.x+40,top:s.y-40,bottom:s.y+40});
 const world={width:WORLD.width,height:WORLD.height,protected:LAYOUT?.protection?.zones||WORLD.safeTowns,occupied,roads:(r.roadGeometry?.ROADS||[]).filter(road=>road.id!=='approach-'+h.buildingId),streams:LAYOUT?.streams||[],validLand:box=>{
  if(MASTER&&!masterLandRectangle(box))return false;
  for(let x=Math.floor(box.left/256);x<=Math.floor(box.right/256);x++)for(let y=Math.floor(box.top/256);y<=Math.floor(box.bottom/256);y++){const key=x+','+y,claim=r.state.claims?.[key];if(claim&&claim.settlementId!==h.settlementId)return false;if(Object.values(r.state.npcSettlements||{}).some(s=>!s.abandonedAt&&s.cell===key))return false;}
  return true;
 }};
 validateHousingPlacement({width:h.width||100,depth:h.depth||70,reservedWidth:Math.max(boxSize,h.reservedWidth||0),reservedDepth:Math.max(boxSize,h.reservedDepth||0)},h,0,world);
 return {landRadius:radius,reservedWidth:Math.max(boxSize,h.reservedWidth||0),reservedDepth:Math.max(boxSize,h.reservedDepth||0)};
}
export function plotContains(h,x,y,padding=0){const radius=h.landRadius||300;return Math.abs(x-h.x)<=radius-padding&&Math.abs(y-h.y)<=radius-padding;}
export function cornerRelocations(r,h,expansion){const moves=[],corners=['northwest','northeast','southwest','southeast'];for(const tower of Object.values(r.state.structures||{})){const n=corners.indexOf(tower.corner);if(tower.settlementId!==h.settlementId||n<0||tower.hp<=0||tower.abandonedAt)continue;if(Object.values(r.state.players||{}).some(p=>p.onDefense===tower.id))throw Error('Descend from corner towers before expanding your land');const offset=expansion.landRadius-55,x=h.x+(n%2?offset:-offset),y=h.y+(n<2?-offset:offset);if(Object.values(r.state.structures).some(s=>s.id!==tower.id&&s.hp>0&&!s.abandonedAt&&Math.hypot(s.x-x,s.y-y)<75))throw Error('Clear the new tower corner before expanding');moves.push({tower,x,y});}return moves;}

import {ownedHousing} from './housing.mjs';
import {HOUSE_DESIGNS} from './housing-catalog.mjs';
import {BUILDINGS,ITEMS} from './catalog.mjs';
import {checkBasePiece,payBaseConstruction} from './base-progression.mjs';
import {roomFor,roomBlocked} from './interiors.mjs';
import {refreshHousing} from './housing-runtime.mjs';
export const HOME_STATIONS=Object.freeze(['loom','tannery','forge','kiln','mill','smoker']);
export function furnishHome(r,p,c){const h=ownedHousing(r.state,p),land=h&&r.state.settlements?.[h.settlementId];if(!h||h.abandonedAt||!land?.flagActive||p.hp<=0||p.interior!==h.buildingId)throw Error('Enter your active owned home to furnish it');const kind=c.kind,pointId=kind==='chest'?'storage':'station';if(kind!=='chest'&&!HOME_STATIONS.includes(kind))throw Error('Choose storage or an indoor workstation');const d=HOUSE_DESIGNS.find(d=>d.id===h.design),point=d?.snapPoints.find(s=>s.id===pointId);if(!point||Math.hypot(p.x-point.x-35,p.y-point.y-27)>120)throw Error('Approach the marked '+pointId+' snap point');const fixtures=h.interiorState?.fixtures||[];if(fixtures.some(f=>f.snapId===pointId))throw Error('This snap point is already furnished');checkBasePiece(r,p,land,kind);
 const f={kind,x:point.x,y:point.y,w:70,h:55,snapId:pointId,name:kind==='chest'?'Home storage':kind+' workstation'},room=roomFor(p.interior,r.buildings),candidate={...room,fixtures:[...room.fixtures,f]};
 if(roomBlocked(candidate,p.x,p.y)||room.fixtures.some(o=>f.x<o.x+o.w+14&&f.x+f.w+14>o.x&&f.y<o.y+o.h+14&&f.y+f.h+14>o.y))throw Error('Keep the snap point and walking space clear');
 if(Object.values(r.state.players||{}).some(other=>other.id!==p.id&&other.hp>0&&other.interior===p.interior&&other.x>f.x-16&&other.x<f.x+f.w+16&&other.y>f.y-16&&other.y<f.y+f.h+16))throw Error('Wait for other players to leave the snap point');
 if(c.kit){if(ITEMS[c.kit]?.deployKind!==kind||!(p.inventory[c.kit]>0))throw Error('Carry the matching furnishing kit');r.pay(p,{[c.kit]:1});}else payBaseConstruction(r,p,land,BUILDINGS[kind].needs);
 h.interiorState??={};h.interiorState.fixtures??=[];h.interiorState.fixtures.push(f);const i=room.fixtures.length;if(kind==='chest'){r.state.containers??={};r.state.containers['fixture:'+h.buildingId+':'+i]={items:{}};}refreshHousing(r);
}
export function furnishingRows(r,p){const h=ownedHousing(r.state,p);if(!h||p.interior!==h.buildingId)return [];const placed=h.interiorState?.fixtures||[],d=HOUSE_DESIGNS.find(d=>d.id===h.design);return ['storage','station'].flatMap(id=>{if(placed.some(f=>f.snapId===id))return [];const point=d.snapPoints.find(s=>s.id===id);if(!point)return [];return (id==='storage'?['chest']:HOME_STATIONS).map(kind=>({name:'Furnish '+(id==='storage'?'storage chest':kind+' workstation'),detail:'Snap point '+Math.round(point.x)+', '+Math.round(point.y)+' • '+Object.entries(BUILDINGS[kind].needs).map(([id,n])=>n+' '+id).join(', '),confirm:'Build this furnishing at the marked snap point?',action:{type:'baseFurnish',kind}}));});}


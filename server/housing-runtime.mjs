import {randomUUID} from 'node:crypto';
import {masterLandRectangle} from './master-geography.mjs';
import {HOUSING,MASTER,LAYOUT} from './world-profile.mjs';
import {HOUSE_DESIGNS,homeRoom} from './housing-catalog.mjs';
import {prepareHousing,confirmHousing,ownedHousing,footprint,reservedFootprint} from './housing.mjs';
const active=h=>!h.abandonedAt;
const rect=b=>({left:b.x-b.halfWidth-10,right:b.x+b.halfWidth+10,top:b.y-b.depth-10,bottom:b.y+20});
const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
export function initializeHousing(r){r.housingBase=r.buildings;refreshHousing(r);}
export function refreshHousing(r){
 if(!r.housingBase)return;
 const homes=HOUSING?Object.values(r.state?.properties||{}):[];
 r.buildings=r.housingBase.map(b=>{const h=homes.find(h=>h.buildingId===b.id);return h?{...b,propertyId:h.id,housingStatus:active(h)?'owned':'abandoned',shop:active(h)?'OWNED HOME':'ABANDONED'}:b;});
 for(const h of homes.filter(h=>!r.housingBase.some(b=>b.id===h.buildingId))){const d=HOUSE_DESIGNS.find(d=>d.id===h.design);if(!d)continue;const f=footprint(d,h,h.rotation);r.buildings.push({id:h.buildingId,name:d.name,houseDesign:d.id,propertyId:h.id,housingStatus:active(h)?'owned':'abandoned',kind:'house',style:'Cottage',artRole:'residence',shop:active(h)?'OWNED HOME':'ABANDONED',x:h.x,y:f.bottom-10,halfWidth:(f.right-f.left)/2,depth:f.bottom-f.top-10,rotation:h.rotation,tier:d.tier});}
 for(const b of r.buildings.filter(b=>b.id.startsWith('home:'))){const h=homes.find(h=>h.buildingId===b.id),f=footprint(HOUSE_DESIGNS.find(d=>d.id===h.design),h,h.rotation);b.door=h.rotation===90?{x:f.right+35,y:h.y}:h.rotation===180?{x:h.x,y:f.top-35}:h.rotation===270?{x:f.left-35,y:h.y}:{x:h.x,y:f.bottom+25};}
 const dynamic=r.buildings.filter(b=>!r.housingBase.some(o=>o.id===b.id));r.housingBlocks=(x,y)=>dynamic.some(b=>{const a=rect(b);return x>a.left&&x<a.right&&y>a.top&&y<a.bottom;});
}
export function housingWorld(r){
 const reservations=Object.values(r.state.properties||{}).filter(active).map(h=>{const d=HOUSE_DESIGNS.find(d=>d.id===h.design);return d?reservedFootprint({...d,reservedWidth:h.reservedWidth??d.width,reservedDepth:h.reservedDepth??d.depth},h,h.rotation):null;}).filter(Boolean);
 const objects=[...reservations,...r.buildings.map(rect),...Object.values(r.state.structures).map(s=>({left:s.x-35,right:s.x+35,top:s.y-35,bottom:s.y+35})),...r.state.resources.filter(n=>n.remaining>0||r.clock()>=n.readyAt).map(n=>({left:n.x-(n.kind==='wood'?85:35),right:n.x+(n.kind==='wood'?85:35),top:n.y-(n.kind==='wood'?85:35),bottom:n.y+(n.kind==='wood'?85:35)}))];
 return {width:LAYOUT.width,height:LAYOUT.height,protected:LAYOUT.protection.zones,occupied:objects,roads:r.roadGeometry.ROADS,streams:LAYOUT.streams,
 vacant:r.buildings.filter(b=>b.housingStatus==='vacant').map(b=>({id:b.id,status:'vacant',design:b.houseDesign,x:b.x,y:b.y,rotation:0,door:{x:b.x,y:b.y+35}})),
 validLand:box=>{
  if(MASTER&&!masterLandRectangle(box))return false;
  for(let x=Math.floor(box.left/256);x<=Math.floor(box.right/256);x++)for(let y=Math.floor(box.top/256);y<=Math.floor(box.bottom/256);y++){const key=x+','+y;if(r.state.claims[key]||Object.values(r.state.settlements||{}).some(s=>!s.abandonedAt&&s.cell===key)||Object.values(r.state.npcSettlements||{}).some(s=>s.cell===key))return false;}
  return !Object.values(r.state.players).some(p=>!p.interior&&p.hp>0&&p.x>box.left&&p.x<box.right&&p.y>box.top&&p.y<box.bottom);
 }};
}
function options(r){return {catalogue:HOUSE_DESIGNS,payment:'deed',world:housingWorld(r),now:r.clock()};}
export function housingCommand(r,p,cmd){
 if(!HOUSING)throw Error('Housing requires the Day 4 test profile');
 if(cmd.type==='housingCancel'){delete r.state.accounts[p.id].housingProposal;return;}
 if(cmd.type==='housingPreview'){prepareHousing(r.state,p,cmd,options(r));return;}
 const q=r.state.accounts[p.id]?.housingProposal;if(q?.target&&Object.values(r.state.players).some(o=>o.id!==p.id&&o.interior===q.target))throw Error('Wait until the house is vacant');if(!q)throw Error('Preview a property first');
 const id='home:'+q.design+':'+randomUUID(),home=confirmHousing(r.state,p,cmd.nonce,{...options(r),id:()=>id});
 // Bind house and flag to the same allowance; never grant a second site.
 const sid='property:'+home.id,cell=Math.floor(home.x/256)+','+Math.floor(home.y/256);
 const saved=r.state.properties[home.id];saved.settlementId=sid;const room=homeRoom(home.buildingId,home.design);r.state.containers??={};for(const [i,f] of room.fixtures.entries())if(f.kind==='chest')r.state.containers['fixture:'+home.buildingId+':'+i]??={items:{}};
 const existing=r.state.claims[cell];if(existing)throw Error('Territory was claimed; preview again');
 r.state.settlements??={};r.state.settlements[sid]={id:sid,cell,x:home.x,y:home.y+home.depth/2+45,ownerType:home.ownerType,owner:home.owner,createdAt:r.clock(),flagActive:false,flagHp:0,propertyId:home.id};
 r.state.claims[cell]={settlementId:sid,owner:home.owner,ownerType:home.ownerType,createdAt:r.clock()};
 const controller=home.ownerType==='clan'?r.state.clans[home.owner]:r.state.accounts[p.id];controller.settlementId=sid;controller.relocationLockedUntil=r.clock()+90*86400000;
 refreshHousing(r);const building=r.buildings.find(b=>b.id===home.buildingId),door=building.door||{x:building.x,y:building.y+35};r.state.settlements[sid].x=door.x+45;r.state.settlements[sid].y=door.y+45;p.openService=null;
}
export function canEnterHome(r,p,id){
 const h=Object.values(r.state.properties||{}).find(h=>h.buildingId===id?.replace(/:basement$/,'')&&active(h));
 if(h&&!(h.ownerType==='account'?h.owner===p.id:h.owner===r.state.accounts[p.id]?.clanId))throw Error('This home belongs to another player or clan');
}
export function openPropertySign(r,p,id){if(!HOUSING)return false;const b=r.buildings.find(b=>b.id===id);if(b?.housingStatus!=='vacant')return false;p.openService='housing';p.housingTarget=id;return true;}
export function housingView(r,p){if(!HOUSING)return null;const a=r.state.accounts?.[p.id],q=a?.housingProposal;return {designs:HOUSE_DESIGNS,property:ownedHousing(r.state,p),preview:q&&q.expiresAt>=r.clock()?q:null};}
export function housingRows(r,p){if(!HOUSING)return[];const own=ownedHousing(r.state,p),rows=[];
 if(own)return [{name:'Owned '+own.design,detail:'Property: '+Math.round(own.x)+', '+Math.round(own.y)+' • '+(own.ownerType==='clan'?'Clan home':'Personal home')},{name:'Rest in your bed',detail:'Stand beside your bed; rest for 10 seconds without moving or taking damage.',action:{type:'houseRest'}},{name:'Cooking hearth',detail:'Approach the stove and use INTERACT to cook.'},{name:'Trophy basement',detail:'Approach the indoor stairs and use INTERACT; return by the upstairs stairwell.'},{name:'Workbenches, storage & defenses',detail:'Home & base → Settlement & flag → Restore flag. Then build on your owned land. Materials are shown in the crafting catalogue.'},{name:'Property protection',detail:'Wilderness homes are not safe zones. One property per player or clan; existing relocation lock remains.'}];
 for(const b of r.buildings.filter(b=>b.housingStatus==='vacant'&&!p.interior&&Math.hypot(p.x-b.x,p.y-b.y-35)<=100)){const d=HOUSE_DESIGNS.find(d=>d.id===b.houseDesign);rows.push({name:'Buy '+d.name,detail:'Requires matching banker-issued deed • unsafe village • one-property limit',action:{type:'housingPreview',design:d.id,target:b.id}});}
 const q=r.state.accounts?.[p.id]?.housingProposal;
 if(q&&q.expiresAt>=r.clock())rows.push({name:'Confirm '+q.design+' purchase',detail:'Consumes matching deed • 90-day relocation lock • no safe-zone protection',confirm:'Use your matching deed to claim this property?',action:{type:'housingConfirm',nonce:q.nonce}});
 rows.push({name:'Wilderness house plans',detail:'Use Town & world services → Place a home for preview and rotation.'});return rows;
}



import {createDay2Layout} from './day2-layout.mjs';

// One-time relocation of outdoor state only. Inventory, interiors, accounts,
// progression, ownership, furniture and station layouts remain byte-for-byte data.
export function migrateApprovedWorld(state,layout){
 if(state.approvedWorldVersion>=1)return false;
 const old=createDay2Layout(true);
 const anchors=old.settlements.map(s=>({old:s,next:layout.settlements.find(n=>n.id===s.id)}));
 if(anchors.some(a=>!a.next))throw Error('Approved world is missing a legacy settlement');
 const move=(x,y)=>{const a=anchors.reduce((best,a)=>Math.hypot(x-a.old.x,y-a.old.y)<Math.hypot(x-best.old.x,y-best.old.y)?a:best);return {x:Math.max(32,Math.min(layout.width-32,x+a.next.x-a.old.x)),y:Math.max(32,Math.min(layout.height-32,y+a.next.y-a.old.y))};};
 const pairs=[['x','y'],['homeX','homeY'],['spawnX','spawnY'],['targetX','targetY'],['startX','startY']];
 const groups=['players','companions','properties','structures','settlements','npcSettlements','corpses','enemies','caravans'];
 for(const group of groups)for(const o of Object.values(state[group]||{})){
  if(!o||typeof o!=='object'||o.interior)continue;
  for(const [kx,ky] of pairs)if(Number.isFinite(o[kx])&&Number.isFinite(o[ky])){const p=move(o[kx],o[ky]);o[kx]=p.x;o[ky]=p.y;}
  if(o.cell&&Number.isFinite(o.x)&&Number.isFinite(o.y))o.cell=Math.floor(o.x/256)+','+Math.floor(o.y/256);
 }
 for(const resource of state.resources||[]){if(Number.isFinite(resource.x)&&Number.isFinite(resource.y)){const p=move(resource.x,resource.y);resource.x=p.x;resource.y=p.y;}}
 const mappedClaims={};for(const [key,claim]of Object.entries(state.claims||{})){
  const [x,y]=key.split(',').map(Number);if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Invalid saved claim cell');
  const p=move((x+.5)*256,(y+.5)*256),cell=Math.floor(p.x/256)+','+Math.floor(p.y/256);
  if(mappedClaims[cell])throw Error('World relocation would overlap saved claims');
  mappedClaims[cell]=claim;
 }state.claims=mappedClaims;
 // Existing bought village houses keep their IDs and approved designs at the
 // new Stonehollow plots. Move the property anchor to the same building.
 const buildings=new Map(layout.buildings.map(b=>[b.id,b]));
 for(const home of Object.values(state.properties||{}))if(home.buildingId&&buildings.has(home.buildingId)){
  const b=buildings.get(home.buildingId);home.x=b.x;home.y=b.y;
 }
 for(const cells of Object.values(state.exploration||{}))if(cells&&typeof cells==='object'){
  const moved={};for(const key of Object.keys(cells)){const [x,y]=key.split(',').map(Number);if(Number.isFinite(x)&&Number.isFinite(y)){const p=move((x+.5)*75,(y+.5)*75);moved[Math.floor(p.x/75)+','+Math.floor(p.y/75)]=true;}}
  for(const key of Object.keys(cells))delete cells[key];Object.assign(cells,moved);
 }
 state.buildingLocations={};state.excludedTownBuildings=[];
 state.masterResourceChunks={};state.masterEncounterChunks={};
 for(const p of Object.values(state.players||{})){p.openMerchant=null;p.openService=null;p.openContainer=null;}
 state.approvedWorldVersion=1;
 state.approvedWorldMigration={from:'day4-housing',to:layout.id,settlements:layout.settlements.length};
 return true;
}

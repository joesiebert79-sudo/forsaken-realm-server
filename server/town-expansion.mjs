import {COMPACT,LAYOUT,DAY4} from './world-profile.mjs';
import {FACTION_TOWNS} from './master-rules.mjs';
import {CASTLES} from './castles.mjs';
import {DETAIL_BUILDINGS,WORLD_BUILDINGS,LEGACY_BUILDINGS,buildingBlocks} from './catalog.mjs';
// Keep new static content out of existing claimed land and saved objects.
export function prepareTownExpansion(state){
 if(COMPACT){
  const buildings=DAY4?WORLD_BUILDINGS.filter(b=>!b.houseDesign||!Object.values(state.properties||{}).some(h=>h.buildingId!==b.id&&Math.abs(h.x-b.x)<(h.width||260)/2+b.halfWidth+40&&Math.abs(h.y-b.y)<(h.depth||170)+b.depth+40)):WORLD_BUILDINGS;
  return {excluded:new Set(WORLD_BUILDINGS.filter(b=>!buildings.includes(b)).map(b=>b.id)),buildings,blocks:(x,y)=>x<0||y<0||x>LAYOUT.width||y>LAYOUT.height||buildings.some(b=>Math.abs(x-b.x)<b.halfWidth+10&&y>b.y-b.depth-10&&y<b.y+10)};
 }
 if((state.townDetailVersion||0)<2){const occupied=[...Object.values(state.structures||{}),...Object.values(state.settlements||{}),...Object.values(state.npcSettlements||{}),...Object.values(state.players||{}).filter(p=>!p.interior),...Object.values(state.corpses||{})];
 state.excludedTownBuildings=[...(state.excludedTownBuildings||[]),...(state.townDetailVersion?CASTLES:[...DETAIL_BUILDINGS,...CASTLES]).filter(b=>{for(let x=Math.floor((b.x-b.halfWidth-60)/256);x<=Math.floor((b.x+b.halfWidth+60)/256);x++)for(let y=Math.floor((b.y-b.depth-60)/256);y<=Math.floor((b.y+180)/256);y++)if(state.claims?.[x+','+y])return true;return occupied.some(o=>Math.abs(o.x-b.x)<b.halfWidth+120&&o.y>b.y-b.depth-120&&o.y<b.y+200);}).map(b=>b.id)];state.townDetailVersion=2;
 }
 if(!state.organicTownVersion){
 const occupied=[...Object.values(state.structures||{}),...Object.values(state.settlements||{}),...Object.values(state.npcSettlements||{}),...Object.values(state.players||{}).filter(p=>!p.interior),...Object.values(state.corpses||{}).filter(p=>!p.interior)];
 const conflict=b=>occupied.some(o=>Math.abs(o.x-b.x)<b.halfWidth+120&&o.y>b.y-b.depth-120&&o.y<b.y+200)||Object.keys(state.claims||{}).some(key=>{const [x,y]=key.split(',').map(Number);return x*256<b.x+b.halfWidth+120&&(x+1)*256>b.x-b.halfWidth-120&&y*256<b.y+200&&(y+1)*256>b.y-b.depth-120;});
 state.buildingLocations={};
 for(const b of WORLD_BUILDINGS){const old=LEGACY_BUILDINGS.find(o=>o.id===b.id);if((b.x!==old.x||b.y!==old.y)&&conflict(b))state.buildingLocations[b.id]={x:old.x,y:old.y};}
 // Retained footprints also take priority over newly relocated neighbors.
 let changed=true;while(changed){changed=false;for(const b of WORLD_BUILDINGS){if(state.buildingLocations[b.id])continue;const hit=Object.entries(state.buildingLocations).some(([id,pos])=>{const o=LEGACY_BUILDINGS.find(o=>o.id===id);return Math.abs(pos.x-b.x)<o.halfWidth+b.halfWidth+60&&Math.abs(pos.y-b.y)<Math.max(o.depth,b.depth)+100;});if(hit){const old=LEGACY_BUILDINGS.find(o=>o.id===b.id);state.buildingLocations[b.id]={x:old.x,y:old.y};changed=true;}}}
 state.organicTownVersion=1;
 }
 if(state.ruleset==='master-v1'&&!state.townSpacingVersion){
 state.buildingLocations??={};const placed=WORLD_BUILDINGS.map(b=>({...b,...state.buildingLocations[b.id]})),occupied=[...Object.values(state.structures||{}),...Object.values(state.settlements||{}),...Object.values(state.npcSettlements||{}),...Object.values(state.players||{}).filter(p=>!p.interior),...Object.values(state.corpses||{}).filter(p=>!p.interior)];
 for(const b of placed){const town=FACTION_TOWNS.find(t=>Math.hypot(t.x-b.x,t.y-b.y)<700);if(!town||b.style==='Castle')continue;const x=Math.max(b.halfWidth+55,Math.round(town.x+(b.x-town.x)*1.18)),y=Math.max(b.depth+55,Math.round(town.y+(b.y-town.y)*1.18));
 const touches=o=>Math.abs(o.x-x)<b.halfWidth+100&&o.y>y-b.depth-100&&o.y<y+180;
 if(occupied.some(touches)||Object.keys(state.claims||{}).some(key=>{const [cx,cy]=key.split(',').map(Number);return cx*256<x+b.halfWidth+100&&(cx+1)*256>x-b.halfWidth-100&&cy*256<y+180&&(cy+1)*256>y-b.depth-100;})||placed.some(o=>o!==b&&Math.abs(o.x-x)<o.halfWidth+b.halfWidth+40&&Math.abs(o.y-y)<Math.max(o.depth,b.depth)+65))continue;
 b.x=x;b.y=y;state.buildingLocations[b.id]={x,y};
 }state.townSpacingVersion=1;
 }
 const excluded=new Set(state.excludedTownBuildings||[]);const buildings=WORLD_BUILDINGS.filter(b=>!excluded.has(b.id)).map(b=>({...b,...state.buildingLocations?.[b.id]}));const cells=new Map();for(const b of buildings)for(let x=Math.floor((b.x-b.halfWidth-10)/256);x<=Math.floor((b.x+b.halfWidth+10)/256);x++)for(let y=Math.floor((b.y-b.depth-10)/256);y<=Math.floor((b.y+10)/256);y++){const key=x+','+y;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(b);}return {excluded,buildings,blocks:(x,y)=>(cells.get(Math.floor(x/256)+','+Math.floor(y/256))||[]).some(b=>Math.abs(x-b.x)<b.halfWidth+10&&y>b.y-b.depth-10&&y<b.y+10)};
}


export function clearStaticApproaches(state,buildings,roads){
 if(state.staticApproachVersion>=1)return;
 const occupied=[...Object.values(state.structures||{}),...Object.values(state.settlements||{}),...Object.values(state.npcSettlements||{})];
 const obstructed=(x,y)=>roads.nearRoad(x,y,60)||buildings.some(b=>Math.abs(x-b.x)<b.halfWidth+40&&y>b.y-b.depth-40&&y<b.y+50||Math.abs(x-b.x)<90&&y>b.y&&y<b.y+230);
 for(const n of state.resources){if(!obstructed(n.x,n.y))continue;for(let i=0;i<1000;i++){const angle=i*2.399963,radius=80+12*Math.sqrt(i),x=Math.round(n.x+Math.cos(angle)*radius),y=Math.round(n.y+Math.sin(angle)*radius);if(x<30||y<30||x>62200||y>62200||obstructed(x,y)||occupied.some(o=>Math.hypot(o.x-x,o.y-y)<80)||state.claims?.[Math.floor(x/256)+','+Math.floor(y/256)])continue;n.x=x;n.y=y;break;}}
 state.staticApproachVersion=1;
}




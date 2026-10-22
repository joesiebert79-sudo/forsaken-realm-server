import {DAY4,LAYOUT} from './world-profile.mjs';
export function migrateTraderVillage(state){
 if(!DAY4||state.traderVillageVersion>=1)return;
 const moved=new Map(),used=new Set(Object.values(state.properties||{}).map(h=>h.buildingId));
 for(const h of Object.values(state.properties||{})){
  if(!/^day2-(survivor|bandit)-/.test(h.buildingId))continue;
  const b=LAYOUT.buildings.find(b=>b.houseDesign===h.design&&!used.has(b.id)&&!state.claims?.[Math.floor(b.x/256)+','+Math.floor(b.y/256)]);
  if(!b)throw Error('Cannot safely relocate purchased trader house; original save is unchanged');
  const old=h.buildingId;used.add(b.id);moved.set(old,b.id);h.previousBuildingId=old;h.buildingId=b.id;h.x=b.x;h.y=b.y;
  const settlement=state.settlements?.[h.settlementId];if(settlement){const oldCell=settlement.cell,newCell=Math.floor(b.x/256)+','+Math.floor(b.y/256),claim=state.claims?.[oldCell];if(claim?.settlementId===settlement.id){delete state.claims[oldCell];state.claims[newCell]=claim;}settlement.cell=newCell;settlement.x=b.x+45;settlement.y=b.y+80;}
  for(const key of Object.keys(state.containers||{}))if(key.startsWith('fixture:'+old+':')){const next='fixture:'+b.id+key.slice(('fixture:'+old).length);if(state.containers[next])throw Error('Conflicting house storage; original save is unchanged');state.containers[next]=state.containers[key];delete state.containers[key];}
 }
 const relocate=p=>{if(!p)return;if(moved.has(p.interior))p.interior=moved.get(p.interior);else if(p.interior?.startsWith('day2-neutral-')){const b=LAYOUT.buildings.find(b=>b.id===p.interior);if(b){p.interior=null;p.x=b.x;p.y=b.y+45;}}};
 for(const group of ['players','companions','corpses'])for(const p of Object.values(state[group]||{})){relocate(p);if(group==='players'){p.openMerchant=null;p.openService=null;p.openContainer=null;p.housingTarget=null;}}
 for(const a of Object.values(state.accounts||{})){delete a.housingProposal;for(const c of Object.values(a.characters||{})){relocate(c.saved);relocate(c.companion);}}
 const oldResources=new Map((state.resources||[]).map(n=>[n.id,n]));const occupied=[...Object.values(state.properties||{}),...Object.values(state.structures||{}),...Object.values(state.settlements||{})];
 state.resources=LAYOUT.resources.filter(n=>!occupied.some(o=>Math.hypot(n.x-o.x,n.y-o.y)<250)).map(n=>({...n,...(oldResources.has(n.id)?{remaining:oldResources.get(n.id).remaining,readyAt:oldResources.get(n.id).readyAt}:{})}));state.traderVillageVersion=1;
}


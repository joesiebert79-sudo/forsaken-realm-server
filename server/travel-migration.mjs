/** One-time static-layout migration; account identities, inventory and banks stay intact. */
export function migrateTravelLayout(state,layout){
 if((state.travelLayoutVersion||0)>=3)return;
 const old=[{id:'day2-survivor',x:550,y:550},{id:'day2-neutral',x:1350,y:1350},{id:'day2-bandit',x:2250,y:2200}];
 for(const group of ['players','companions'])for(const p of Object.values(state[group]||{})){
  if(p.interior)continue;
  const town=old.find(t=>Math.hypot(p.x-t.x,p.y-t.y)<600);
  if(town){const next=layout.settlements.find(t=>t.id===town.id);p.x+=next.x-town.x;p.y+=next.y-town.y;}
 }
 const harvested=new Map((state.resources||[]).map(r=>[r.id,r]));
 const occupied=[...Object.values(state.structures||{}),...Object.values(state.settlements||{})];
 state.resources=layout.resources.filter(r=>!occupied.some(s=>Math.hypot(r.x-s.x,r.y-s.y)<250)).map(r=>{const old=harvested.get(r.id);return {...r,...(old?{remaining:old.remaining,readyAt:old.readyAt}:{})};});
 // Trade windows from the old neutral market cannot remain open after relocation.
 for(const p of Object.values(state.players||{})){p.openMerchant=null;p.openService=null;}
 state.travelLayoutVersion=3;
}


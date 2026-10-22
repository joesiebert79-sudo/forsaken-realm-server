import {navigate} from './navigation.mjs';
import {FACTION_TOWNS,addWhole} from './master-rules.mjs';
import {MERCHANTS,merchantStock,marketTotal} from './merchants.mjs';
const views=new WeakMap(),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function navigationFor(r,faction){let pair=views.get(r);if(!pair){pair={};views.set(r,pair);}return pair[faction]??={clock:r.clock,blocks:r.blocks,safe:p=>FACTION_TOWNS.some(t=>t.faction!==faction&&t.faction!=='neutral'&&dist(t,p)<t.radius)};}
export function tickNpcTravel(r,dt){for(const clan of Object.values(r.state.npcClans||{})){const home=r.state.npcSettlements[clan.id];if(!home||home.hp<=0)continue;for(const id of clan.members){const n=r.state.enemies[id];if(!n||n.retaliating||n.hp<=0||n.job!=='trade'||n.ambushClan||n.warId||n.warDefenseId||n.raidClan||n.returningHome)continue;
 if(!n.journey){if(r.clock()<(n.nextJourneyAt||0))continue;const choices=FACTION_TOWNS.filter(t=>(t.faction===clan.faction||t.faction==='neutral')&&t.traderZone!==false).sort((a,b)=>dist(home,a)-dist(home,b)),t=choices[(n.completedJourneys||0)%choices.length],quantity=Math.min(5,clan.stock.wood||0);if(!t||quantity<=0)continue;clan.stock.wood-=quantity;n.inventory.wood=addWhole(n.inventory.wood||0,quantity);n.journey={town:t.id,phase:'outbound',cargo:quantity,startedAt:r.clock(),gold:0,bread:0};}
 const trip=n.journey,t=FACTION_TOWNS.find(t=>t.id===trip.town),target=trip.phase==='outbound'&&t?{x:t.x,y:t.y+t.radius-50}:home;if(!t){delete n.journey;continue;}n.active=false;n.travelLabel=trip.phase==='outbound'?'Trading in '+t.name:'Returning to '+clan.name;
 if(dist(n,target)>45){navigate(navigationFor(r,clan.faction),n,target,dt);continue;}
 if(trip.phase==='outbound'){const buyer=MERCHANTS.find(m=>m.townId===t.id&&m.shop==='Provisioner'),inn=MERCHANTS.find(m=>m.townId===t.id&&m.shop==='Tavern');if(buyer){const s=merchantStock(r,buyer),quantity=Math.min(trip.cargo,n.inventory.wood||0),gold=marketTotal(1,s.items.wood||0,quantity,false);s.items.wood=addWhole(s.items.wood||0,quantity);n.inventory.wood-=quantity;n.inventory.gold=addWhole(n.inventory.gold||0,gold);trip.gold+=gold;}
 if(inn){const s=merchantStock(r,inn);while(trip.bread<2&&s.items.bread>0){const cost=marketTotal(5,s.items.bread,1,true);if((n.inventory.gold||0)<cost)break;n.inventory.gold-=cost;n.inventory.bread=addWhole(n.inventory.bread||0,1);s.items.bread--;trip.bread++;trip.gold-=cost;}}
 trip.phase='returning';trip.tradedAt=r.clock();
 }else{const bread=Math.min(trip.bread,n.inventory.bread||0),gold=Math.min(Math.max(0,trip.gold),n.inventory.gold||0);n.inventory.bread-=bread;n.inventory.gold-=gold;clan.stock.bread=addWhole(clan.stock.bread||0,bread);clan.gold=addWhole(clan.gold,gold);n.completedJourneys=(n.completedJourneys||0)+1;n.nextJourneyAt=r.clock()+60000;delete n.journey;delete n.travelLabel;}
 }} }




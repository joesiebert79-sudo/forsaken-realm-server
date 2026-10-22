import {FACTION_TOWNS} from '../server/master-rules.mjs';
import {servicePosition} from '../server/service-locations.mjs';
import {HOUSE_DESIGNS} from '../server/housing-catalog.mjs';
let seq=0;
export function buyFixtureDeed(store,id,design){
 const r=store.realm,p=r.player(id),saved={x:p.x,y:p.y,interior:p.interior};
 const town=FACTION_TOWNS.find(t=>t.traderZone!==false&&(t.faction===p.faction||t.faction==='neutral'));
 Object.assign(p,servicePosition(town,'bank'));r.state.accounts[id].bank??={gold:0,tokens:{},tier:1,extraSlots:0};r.state.accounts[id].bank.gold+=10000;
 store.transaction(r=>r.command(id,{id:'fixture-deed-'+(++seq),type:'houseDeedBuy',design,quote:HOUSE_DESIGNS.find(d=>d.id===design).price}));
 store.transaction(r=>Object.assign(r.player(id),saved));
 return Object.values(store.realm.state.houseDeeds).filter(d=>d.design===design&&store.realm.player(id).inventory[d.id]===1).at(-1).id;
}

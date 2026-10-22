import {canAfford,debitCoins,creditCoins} from './currency.mjs';
import {randomUUID} from 'node:crypto';
import {ITEMS,registerPhysicalDeed} from './catalog.mjs';
import {HOUSE_DESIGNS} from './housing-catalog.mjs';
import {accountFor,authorizedTown} from './accounts.mjs';
import {nearService} from './service-locations.mjs';
import {addWhole,whole} from './master-rules.mjs';
export function restoreDeedDefinitions(state){for(const d of Object.values(state.houseDeeds||{}))if(d?.id&&HOUSE_DESIGNS.some(h=>h.id===d.design))registerPhysicalDeed(d.id,d.design);}
export function carriedDeed(state,p,design,id){const list=Object.values(state.houseDeeds||{});return list.find(d=>d.status==='unused'&&d.design===design&&(!id||d.id===id)&&p.inventory[d.id]===1)||null;}
function bankAccess(r,p){const town=authorizedTown(r,p);if(!town||!nearService(p,town,'bank')||p.hp<=0)throw Error('Approach an authorized town banker');const a=accountFor(r,p);if(!a.bank)throw Error('Open a personal bank account first');return a;}
export function deedCommand(r,p,c){
 const a=bankAccess(r,p);r.state.houseDeeds??={};a.houseDeedTransactions??={};const receipt=JSON.stringify(c.id);if(Object.hasOwn(a.houseDeedTransactions,receipt))return;
 if(c.type==='houseDeedBuy'){
  const design=HOUSE_DESIGNS.find(d=>d.id===c.design);if(!design||c.quote!==design.price)throw Error('Review the current house deed price');
  if(!canAfford(a.bank,design.price))throw Error('Not enough banked gold');
  const id='deed:'+design.id+':'+randomUUID();registerPhysicalDeed(id,design.id);
  r.state.houseDeeds[id]={id,design:design.id,price:design.price,status:'unused',issuedAt:r.clock()};p.inventory[id]=1;debitCoins(a.bank,design.price,'gold',{pouch:false});
 }else if(c.type==='houseDeedRedeem'){
  const d=r.state.houseDeeds[c.item];if(!d||d.status!=='unused'||p.inventory[d.id]!==1)throw Error('Carry an unused house deed to redeem it');
  creditCoins(a.bank,whole(d.price),'gold',{pouch:false});delete p.inventory[d.id];d.status='redeemed';d.redeemedAt=r.clock();
 }else throw Error('Unknown house deed action');
 a.houseDeedTransactions[receipt]={type:c.type,at:r.clock()};
}
export function deedRows(r,p){const a=accountFor(r,p);if(!a.bank)return[];return [...HOUSE_DESIGNS.map(d=>({name:d.name+' house deed',art:{item:'deed:'+d.id},detail:d.price+' banked gold • physical, transferable deed • one inventory slot',confirm:'Pay exactly '+d.price+' from your bank for a '+d.name+' deed?',action:{type:'houseDeedBuy',design:d.id,quote:d.price}})),...Object.values(r.state.houseDeeds||{}).filter(d=>d.status==='unused'&&p.inventory[d.id]===1).map(d=>({name:'Redeem '+ITEMS[d.id]?.name,detail:d.price+' gold refunded to your bank • consumes unused deed',confirm:'Redeem this unused deed for its full original price?',action:{type:'houseDeedRedeem',item:d.id}}))];}


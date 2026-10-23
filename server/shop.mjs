import {offerRestricted,ITEM_COMMERCE} from './item-commerce.mjs';
import {offerPrice} from './shop-pricing.mjs';
import {canAfford,debitCoins,changeWallet,coinValue,validatePouch,isCoin} from './currency.mjs';
import {COSMETICS,ensureFeatured,BASIC_OFFERS,MAIN_SHOP_IDS} from './cosmetics.mjs';
import {randomUUID} from 'node:crypto';
import {whole,positive,addWhole,maxGoldPrice} from './master-rules.mjs';
import {accountFor} from './accounts.mjs';
// Catalog is server-owned. There is deliberately no client catalog-edit or cash-fulfillment action.
export function validateOffer(o){
 if(!o||typeof o.id!=='string'||!/^[a-z0-9-]{1,80}$/.test(o.id))throw Error('Invalid offer ID');
 if(!['cosmetic','supplies','coins'].includes(o.kind))throw Error('Unsupported fulfillment');if(o.kind==='supplies'&&(!o.supplies||!Object.keys(o.supplies).length||Object.entries(o.supplies).some(([id,n])=>!Object.hasOwn(ITEM_COMMERCE,id)||!Number.isSafeInteger(n)||n<1||n>20)))throw Error('Invalid provision bundle');
 if(o.kind==='coins'&&(!isCoin(o.coin)||coinValue(o.coinCount,o.coin)!==coinValue(o.gold,o.currency)))throw Error('Invalid coin exchange');
 if(typeof o.item!=='string'||!o.item.length||o.item.length>100)throw Error('Invalid cosmetic');
 if(o.items!=null&&(!Array.isArray(o.items)||!o.items.length||o.items.length>12||o.items.some(id=>!Object.hasOwn(COSMETICS,id))))throw Error('Invalid cosmetic bundle');
 if(o.usdCents!==null&&o.usdCents!==undefined)positive(o.usdCents,'USD cents');
 if(o.gold!==null&&o.gold!==undefined){positive(o.gold,'Gold price');if(o.usdCents!=null&&o.gold>maxGoldPrice(o.usdCents))throw Error('Gold price exceeds 250 gold per dollar');}
 if(o.regularGold!=null){positive(o.regularGold,'Regular gold price');if(o.gold==null||o.regularGold<=o.gold)throw Error('Invalid discount');}
 if(o.gold==null&&o.usdCents==null)throw Error('Offer needs a price');
 if(o.startsAt!=null)whole(o.startsAt);if(o.endsAt!=null){whole(o.endsAt);if(o.endsAt<=(o.startsAt||0))throw Error('Invalid offer period');}
 if(o.stock!=null)whole(o.stock,'Stock');return o;
}
function shopState(r){return r.state.shop??={offers:{},instances:{},listings:{},transactions:{}};}
export function shopView(r){const s=shopState(r),now=r.clock();ensureFeatured(r);return {serverTime:now,cashPurchasesEnabled:false,offers:Object.values(s.offers).filter(o=>MAIN_SHOP_IDS.has(o.id)&&(!offerRestricted(o)||o.featured==='flash')).map(validateOffer).filter(o=>(o.startsAt==null||now>=o.startsAt)&&(o.endsAt==null||now<o.endsAt)&&!o.retired).map(o=>({...o,price:offerPrice(o),currency:offerPrice(o).currency,available:o.stock==null||o.stock>0}))};}
export function shopCommand(r,p,c){
 ensureFeatured(r);const a=accountFor(r,p),s=shopState(r),key=JSON.stringify([p.id,c.id]);
 // Financial receipts are retained beyond the movement command replay window.
 if(Object.hasOwn(s.transactions,key))return;
 const now=r.clock();
 if(c.type==='shopBuy'){
  const o=Object.hasOwn(s.offers,c.offer)?validateOffer(s.offers[c.offer]):null;
  if(!o||!MAIN_SHOP_IDS.has(o.id)||o.retired||o.startsAt!=null&&now<o.startsAt||o.endsAt!=null&&now>=o.endsAt||o.stock===0)throw Error('Offer unavailable');
  if(o.gold==null)throw Error('Real-money purchases are not enabled');
  const recipient=c.recipient||p.id;if(!Object.hasOwn(r.state.accounts,recipient))throw Error('Recipient account unavailable');
  if(recipient!==p.id&&!o.giftable)throw Error('Offer cannot be gifted');
  if(offerRestricted(o)&&o.featured!=='flash')throw Error('Legendary equipment is only available from flash deals, dangerous exploration or bosses');const price=offerPrice(o);if(!canAfford(a,price.amount,price.currency))throw Error('Not enough coins');
  if(o.kind==='coins'){if(recipient!==p.id||p.hp<=0||p.creationRequired)throw Error('Exchange coins on your living character');const next=changeWallet(a,price.amount,price.currency);next[o.coin]=addWhole(next[o.coin]||0,o.coinCount);validatePouch(next,a);Object.assign(a,next);if(o.stock!=null)o.stock--;s.transactions[key]={type:c.type,buyer:p.id,amount:price.amount,currency:price.currency,coin:o.coin,coinCount:o.coinCount,at:now};return;}
  if(o.kind==='supplies'){const target=r.state.players[recipient];if(!target||target.creationRequired||target.hp<=0)throw Error('Recipient must have a living created character');const next={...target.inventory};for(const [item,n]of Object.entries(o.supplies))next[item]=addWhole(next[item]||0,n);debitCoins(a,price.amount,price.currency);if(o.stock!=null)o.stock--;target.inventory=next;s.transactions[key]={type:c.type,buyer:p.id,recipient,amount:price.amount,currency:price.currency,items:{...o.supplies},at:now};return;}
  const grants=(o.items||[o.item]).map(item=>({id:randomUUID(),item,owner:recipient,purchasedAt:now,offerId:o.id}));debitCoins(a,price.amount,price.currency);if(o.stock!=null)o.stock--;for(const item of grants)s.instances[item.id]=item;
  s.transactions[key]={type:c.type,buyer:p.id,recipient,instanceId:grants[0].id,instanceIds:grants.map(i=>i.id),gold:o.gold,at:now};return;
 }
 if(c.type==='cosmeticList'){
  const item=s.instances[c.instanceId];if(!item||item.owner!==p.id)throw Error('You do not own this cosmetic');positive(c.gold,'Gold price');
  if(s.listings[item.id])throw Error('Cosmetic already listed');s.listings[item.id]={instanceId:item.id,seller:p.id,gold:c.gold};
 }else if(c.type==='cosmeticEquip'){const item=s.instances[c.instanceId];if(!item||item.owner!==p.id||s.listings[item.id])throw Error('Equip an owned, unlisted cosmetic');a[COSMETICS[item.item]?.kind==='companion'?'equippedCompanionCosmetic':'equippedCosmetic']=item.id;
 }else if(c.type==='cosmeticGift'){const item=s.instances[c.instanceId];if(!item||item.owner!==p.id||s.listings[item.id])throw Error('Choose an owned, unlisted cosmetic');if(c.recipient===p.id||!Object.hasOwn(r.state.accounts,c.recipient))throw Error('Choose another existing player');item.owner=c.recipient;
 }else if(c.type==='cosmeticCancel'){
  const listing=s.listings[c.instanceId];if(!listing||listing.seller!==p.id)throw Error('Listing unavailable');delete s.listings[c.instanceId];
 }else if(c.type==='cosmeticBuy'){
  const listing=s.listings[c.instanceId],item=s.instances[c.instanceId];
  if(!listing||!item||item.owner!==listing.seller||listing.seller===p.id)throw Error('Listing unavailable');
  const seller=r.state.accounts[listing.seller];if(!seller||!canAfford(a,listing.gold))throw Error('Insufficient gold or seller unavailable');
  const paid=changeWallet(seller,listing.gold,'gold',true);debitCoins(a,listing.gold);Object.assign(seller,paid);item.owner=p.id;delete s.listings[item.id];
 }else throw Error('Unknown shop operation');
 s.transactions[key]={type:c.type,actor:p.id,instanceId:c.instanceId,at:now};
}




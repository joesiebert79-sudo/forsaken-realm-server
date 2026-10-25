import {FIELD_ITEMS} from './field-catalog.mjs';
import {HARVEST_QUALITY} from './wildlife-catalog.mjs';
import {fieldLot,grantFieldLot,lotDefinition} from './field-inventory.mjs';
import {accountFor} from './accounts.mjs';
import {changeWallet,canAfford} from './currency.mjs';

const shopFor=item=>item.category==='Food'?'Tavern':item.armorSlot||item.backpackSlots||item.fieldKnife?'Smithy':'Provisioner';
const categoryFor=item=>item.category==='Food'?'Provisions':item.armorSlot?'Armor':item.backpackSlots||item.fieldKnife?'Tools':'Materials';
const day=now=>Math.floor(now/86400000);
const purchasable=(item,shop)=>!item.virtualIngredient&&shopFor(item)===shop&&!(item.raw||item.unsafeWater);
const stockFor=(r,m)=>{
 r.state.fieldMerchantStocks??={};const old=r.state.fieldMerchantStocks[m.id],today=day(r.clock());
 if(old?.day===today)return old;
 const items={};for(const item of Object.values(FIELD_ITEMS))if(purchasable(item,m.shop))items[item.id]=item.spoilMs?8:12;
 return r.state.fieldMerchantStocks[m.id]={day:today,items,receipts:{}};
};
const unit=(item,stock)=>Math.max(1,Math.ceil(item.baseCopper*Math.max(.75,Math.min(1.5,1+(8-stock)/40))));
const saleUnit=(item,lot,stock)=>Math.min(Math.floor(unit(item,stock)*.75),Math.max(1,Math.floor(item.baseCopper*.25*HARVEST_QUALITY[lot.quality])));
const quotes=(n,value)=>Array.from({length:Math.min(100,n)+1},(_,i)=>i*value);

export function fieldMerchantRows(r,p,m){
 const s=stockFor(r,m),rows=[];
 for(const [id,n]of Object.entries(s.items)){
  const item=FIELD_ITEMS[id],buy=unit(item,n);
  rows.push({item:id,name:item.name,category:categoryFor(item),currency:'copper',sellCurrency:'copper',balanceStatus:'draft-playtest',rarityName:'Common',stock:n,owned:0,buy,sell:0,buyQuotes:quotes(n,buy),sellQuotes:[0],sellAll:0});
 }
 for(const [id,n]of Object.entries(p.inventory)){
  const lot=fieldLot(r,id),item=FIELD_ITEMS[lot?.baseId];
  if(!lot||!item||item.virtualIngredient||shopFor(item)!==m.shop||lot.expiresAt!=null&&r.clock()>=lot.expiresAt)continue;
  const sell=saleUnit(item,lot,s.items[lot.baseId]||0);
  rows.push({item:id,name:lotDefinition(r,id).name,category:categoryFor(item),currency:'copper',sellCurrency:'copper',balanceStatus:'draft-playtest',rarityName:lot.quality,stock:0,owned:n,buy:0,sell,buyQuotes:[0],sellQuotes:quotes(n,sell),sellAll:n*sell});
 }
 return rows;
}

export function fieldTrade(r,p,m,c){
 const buying=c.type==='merchantBuy',lot=fieldLot(r,c.item),baseId=lot?.baseId||c.item,item=FIELD_ITEMS[baseId];
 if(!item||item.virtualIngredient)throw Error('Unknown field market item');
 const s=stockFor(r,m),key=JSON.stringify([p.id,c.id]);if(Object.hasOwn(s.receipts,key))return;
 if(shopFor(item)!==m.shop)throw Error('This trader does not specialize in that item');
 if(!Number.isSafeInteger(c.amount??1)||(c.amount??1)<1||(c.amount??1)>100)throw Error('Invalid trade quantity');
 const amount=c.amount??1,stock=s.items[baseId]||0;
 if(buying){if(lot||!purchasable(item,m.shop)||stock<amount)throw Error('Trader is out of stock');}
 else if(c.type!=='merchantSell'||!lot||!(p.inventory[c.item]>=amount)||lot.expiresAt!=null&&r.clock()>=lot.expiresAt)throw Error('Owned fresh lot required for sale');
 const total=amount*(buying?unit(item,stock):saleUnit(item,lot,stock));
 if(c.expectedCurrency!=null&&c.expectedCurrency!=='copper'||c.expectedTotal!=null&&c.expectedTotal!==total)throw Error('Price changed; review the current quote');
 const account=accountFor(r,p);if(buying&&!canAfford(account,total,'copper'))throw Error('Not enough coins');
 const changed=changeWallet(account,total,'copper',!buying,{pouch:true});
 if(buying){grantFieldLot(r,p.inventory,baseId,amount,{provenance:{source:'trader',merchant:m.id}});s.items[baseId]-=amount;}
 else{p.inventory[c.item]-=amount;if(!p.inventory[c.item])delete p.inventory[c.item];s.purchased??={};s.purchased[baseId]=(s.purchased[baseId]||0)+amount;}
 Object.assign(account,changed);s.receipts[key]={item:c.item,amount,type:c.type,total,currency:'copper',at:r.clock()};
}

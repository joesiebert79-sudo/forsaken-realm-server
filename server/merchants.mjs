import {sellBackTotal,sellBackQuotes} from './sell-back.mjs';
import {fieldMerchantRows,fieldTrade} from './field-market.mjs';
import {FIELD_ITEMS} from './field-catalog.mjs';
import {fieldLot} from './field-inventory.mjs';
import {ITEM_COMMERCE,itemPrice,saleMetadata,restrictedEquipment} from './item-commerce.mjs';
import {traderHub} from './trader-hubs.mjs';
import {isCoin,wallet,changeWallet,canAfford} from './currency.mjs';
import {MASTER} from './world-profile.mjs';
import {WORLD_BUILDINGS,ITEMS} from './catalog.mjs';
import {FACTION_TOWNS,positive,whole,addWhole} from './master-rules.mjs';
import {accountFor,masterEnabled} from './accounts.mjs';

// Explicit provisional playtest prices, not the finalized regional economy.
export const offers={Smithy:{spear:[25,10],tunic:[30,12],axe:[30,12],pickaxe:[30,12],sickle:[20,8],sword:[70,28],shield:[50,20]},Tavern:{bread:[5,2],apple:[3,1]},Provisioner:{wood:[3,1],stone:[3,1],herb:[6,2],bandage:[12,4]}};
Object.assign(offers.Provisioner,{wheat:[4,2],flour:[4,2],thread:[3,1],fiber:[3,1],linen:[8,3],plank:[3,1],charcoal:[5,2],ironOre:[6,2],iron:[20,8],ironBraces:[65,26],rope:[8,3],strongRope:[35,14],salt:[5,2],rawMeat:[6,2],driedApples:[9,3],smokedMeat:[18,7]});
for(const catalog of Object.values(offers))for(const [id,price]of Object.entries(catalog)){const rarity=ITEMS[id]?.rarity||1;price[2]=rarity>=4?'gold':rarity>=2?'silver':'copper';}
for(const item of Object.values(ITEMS)){const d=ITEM_COMMERCE[item.id];if(!d?.trader||restrictedEquipment(item.id))continue;const stock=offers[d.trader];if(!stock||stock[item.id])continue;const price=itemPrice(item.id);stock[item.id]=[price.amount,sellBackTotal(price.amount,price.currency),price.currency];}
export const MERCHANTS=WORLD_BUILDINGS.flatMap(b=>{
 const town=FACTION_TOWNS.find(t=>t.traderZone!==false&&Math.hypot(t.x-b.x,t.y-b.y)<=(t.radius||480));
 const kind=b.role==='smithy'?'Smithy':b.role==='merchant'?'Provisioner':Object.keys(offers).find(k=>b.name.includes(k));
 return town&&kind?[{id:'merchant:'+b.id,buildingId:b.id,interior:b.id,...(kind==='Smithy'?{x:235,y:245}:kind==='Tavern'?{x:225,y:160}:{x:200,y:250}),...(traderHub(b.id)?{hubName:traderHub(b.id).name,affiliation:traderHub(b.id).affiliation}:{}),name:kind==='Smithy'?'Blacksmith':kind==='Tavern'?'Innkeeper':'Provisioner',shop:kind,townId:town.id,faction:town.faction,protected:true,recruitable:false}]:[];
});
export function merchantForBuilding(id){return MERCHANTS.find(m=>m.buildingId===id);}
export function merchantActors(r,p){return masterEnabled(r)?MERCHANTS.filter(m=>m.interior===p.interior):[];}
export function merchantStock(r,m){r.state.merchants??={};const stock=r.state.merchants[m.id]??={items:Object.fromEntries(Object.keys(offers[m.shop]).filter(id=>ITEMS[id]).map(id=>[id,20])),receipts:{}};if(m.shop==='Provisioner'&&!stock.backpacksAdded){for(const id of ['smallSatchel','travelersPack','largeRucksack'])stock.items[id]??=20;stock.backpacksAdded=true;}return stock;}

// Approved regional cap: 75% to 150% of base. Every unit updates the marginal quote.
export function marketUnit(base,stock){return Math.max(1,Math.ceil(base*.75),Math.min(Math.floor(base*1.5),Math.floor(base*Math.max(.75,Math.min(1.5,1+(20-stock)/40)))));}
export function marketTotal(base,stock,amount,buying){let total=0;const variable=Math.min(amount,100);for(let i=0;i<variable;i++)total=addWhole(total,marketUnit(base,stock+(buying?-i:i)));if(amount>variable)total=addWhole(total,whole((amount-variable)*marketUnit(base,stock+(buying?-variable:variable))));return total;}
function reachable(r,p,id){
 const m=MERCHANTS.find(m=>m.id===id);
 if(!masterEnabled(r)||!m||p.hp<=0||p.creationRequired||p.interior!==m.interior||Math.hypot(p.x-m.x,p.y-m.y)>110||(m.faction!=='neutral'&&p.faction!==m.faction))throw Error('Approach a trader in your faction town');
 return m;
}
export function openMerchant(r,p,id){reachable(r,p,id);p.openMerchant=id;p.openContainer=null;p.openFarm=null;}
// A denomination is catalog data, never supplied or converted by the client.
// Prices use the item rarity; payment always combines all denominations.
export function offerCurrency(offer){const coin=offer[2]??'copper';if(!isCoin(coin))throw Error('Invalid catalog currency');return coin;}
function quantityQuotes(base,stock,count,buying){const result=[0];for(let i=0;i<Math.min(100,count);i++)result.push(addWhole(result[i],marketUnit(base,stock+(buying?-i:i))));return result;}
function itemCategory(item){const d=ITEMS[item];return ['axe','pickaxe','sickle','hammer'].includes(item)?'Tools':d.armorSlot?'Armor':item==='shield'?'Shields':d.damage||item==='arrow'?'Weapons':d.category==='Food'||item==='bandage'||item==='herb'||item==='herbalTea'?'Provisions':'Materials';}
export function merchantView(r,p){
 if(!p.openMerchant)return null;let m;try{m=reachable(r,p,p.openMerchant);}catch{return null;}
 const s=merchantStock(r,m);return {...m,wallet:wallet(accountFor(r,p)),standing:{reputation:accountFor(r,p).reputation||0,faction:p.faction,townFaction:m.faction,access:'Open',displayOnly:true},unlimitedGold:true,playtestPrices:true,offers:[...Object.entries(offers[m.shop]).filter(([id])=>ITEMS[id]).map(([item,offer])=>{const [buy,sell]=offer;return {...saleMetadata(item),currency:offerCurrency(offer),sellCurrency:'copper',sellBackPercent:25,item,name:ITEMS[item].name,category:itemCategory(item),buyQuotes:quantityQuotes(buy,s.items[item]||0,s.items[item]||0,true),sellQuotes:sellBackQuotes(buy,offerCurrency(offer),p.inventory[item]||0),buy:marketUnit(buy,s.items[item]||0),sell:sellBackTotal(buy,offerCurrency(offer)),stock:s.items[item]||0,owned:p.inventory[item]||0,sellAll:sellBackTotal(buy,offerCurrency(offer),p.inventory[item]||0)};}),...fieldMerchantRows(r,p,m)]};
}
export function trade(r,p,c){
 const m=reachable(r,p,c.target);if(p.openMerchant!==m.id)throw Error('Interact with the trader first');
 if(FIELD_ITEMS[c.item]||fieldLot(r,c.item)){fieldTrade(r,p,m,c);return;}
 const s=merchantStock(r,m),key=JSON.stringify([p.id,c.id]);if(Object.hasOwn(s.receipts,key))return;
 const quote=offers[m.shop][c.item];if(restrictedEquipment(c.item))throw Error('Legendary equipment is only available from flash deals, dangerous exploration or bosses');if(!Object.hasOwn(offers[m.shop],c.item)||!quote||!ITEMS[c.item])throw Error('This trader does not trade that item');
 const amount=positive(c.amount??1);if(c.type==='merchantBuy'&&amount>100)throw Error('Buy at most 100 items at once');
 const buying=c.type==='merchantBuy';if(!buying&&c.type!=='merchantSell')throw Error('Invalid trade');
 const currency=buying?offerCurrency(quote):'copper';
 if(c.expectedCurrency!=null&&c.expectedCurrency!==currency)throw Error('Currency changed; review the current quote');
 const total=buying?marketTotal(quote[0],s.items[c.item]||0,amount,true):sellBackTotal(quote[0],offerCurrency(quote),amount),a=accountFor(r,p);
 if(c.expectedTotal!=null&&whole(c.expectedTotal,'Expected total')!==total)throw Error('Price changed; review the current quote');
 if(buying){
  if((s.items[c.item]||0)<amount)throw Error('Trader is out of stock');if(!canAfford(a,total,currency))throw Error('Not enough coins');
  const owned=addWhole(p.inventory[c.item]||0,amount),paid=changeWallet(a,total,currency,false,{pouch:MASTER});
  s.items[c.item]-=amount;Object.assign(a,paid);p.inventory[c.item]=owned;const depot=r.state.caravanDepots?.[m.townId];if(depot)depot[currency]=addWhole(depot[currency]||0,total);
 }else{
  if((p.inventory[c.item]||0)<amount)throw Error('Item is not in your backpack');
  const count=addWhole(s.items[c.item]||0,amount),paid=changeWallet(a,total,currency,true,{pouch:MASTER});
  p.inventory[c.item]-=amount;if(!p.inventory[c.item]){delete p.inventory[c.item];if(p.equippedWeapon===c.item)p.equippedWeapon=null;if(p.equippedArmour===c.item)p.equippedArmour=null;if(p.equippedHelmet===c.item)p.equippedHelmet=null;if(c.item==='shield'){p.equippedShield=false;p.blockUntil=0;}}
  s.items[c.item]=count;Object.assign(a,paid);
 }
 s.receipts[key]={item:c.item,amount,type:c.type,total,currency,at:r.clock()};
}


Object.assign(offers.Provisioner,{smallSatchel:[35,12],travelersPack:[100,35],largeRucksack:[240,80]});for(const stock of Object.values(offers))for(const [id,quote]of Object.entries(stock)){const price=itemPrice(id);quote[0]=price.amount;quote[1]=sellBackTotal(price.amount,price.currency);quote[2]=price.currency;}




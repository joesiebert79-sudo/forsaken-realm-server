import {restrictedEquipment,offerRestricted,RARE_EQUIPMENT,itemPrice,supplyPrice,flashPrice,saleMetadata} from './item-commerce.mjs';
import {HOUSE_DESIGNS} from './housing-catalog.mjs';
import {nearService} from './service-locations.mjs';
import {authorizedTown} from './accounts.mjs';
import {ITEMS} from './catalog.mjs';
import {priceText} from './shop-pricing.mjs';
// Fixed catalogue until the owner chooses further additions.
export const MAIN_SHOP_IDS=new Set(['bread-pair','field-bandages','water-rations','torch-pack','gatherers-axe','miners-pickaxe','farmers-sickle','crafting-materials','leather-tunic','iron-helmet','arming-sword','wooden-shield']);
// Cosmetic appearance only: no combat, capacity or progression effects.
export const COSMETICS={
 'ashen-sigil':{name:'Ashen Sigil',color:'#9ca6ad',symbol:'ash',description:'Weathered silver heraldry.'},
 'blood-sigil':{name:'Blood Sigil',color:'#ae384b',symbol:'blade',description:'Crimson war-banner emblem.'},
 'forest-sigil':{name:'Forest Sigil',color:'#4c9973',symbol:'leaf',description:'Green woodland heraldry.'},
 'iron-crown':{name:'Iron Crown',color:'#b6a16c',symbol:'crown',description:'Antique gold crown emblem.'},
 'raven-sigil':{name:'Raven Sigil',color:'#858299',symbol:'raven',description:'Dusky raven heraldry.'},
 'ember-sigil':{name:'Ember Sigil',color:'#ce824d',symbol:'flame',description:'Burnished copper flame emblem.'},
 'winter-sigil':{name:'Winter Sigil',color:'#b2d3db',symbol:'star',description:'Pale blue northern-star emblem.'},
 'oathkeeper-sigil':{name:'Oathkeeper Sigil',color:'#7b9bc3',symbol:'shield',description:'Cobalt oathkeeper heraldry.'},
 'shadow-coat':{name:'Shadow Companion Coat',color:'#45434b',light:'#797680',kind:'companion',description:'Dark coat for your existing companion; same stats and species.'},
 'autumn-coat':{name:'Autumn Companion Coat',color:'#805a39',light:'#bc9367',kind:'companion',description:'Warm brown coat for your existing companion; no stat changes.'},
 'frost-coat':{name:'Frost Companion Coat',color:'#a4aaa9',light:'#d3d5ce',kind:'companion',description:'Pale grey coat for your existing companion; no stat changes.'}
};
export const BASIC_OFFERS=[
 {id:'bread-pair',name:'Fresh Bread',item:'bread',supplies:{bread:2},gold:10,description:'2 bread • carried and lootable'},
 {id:'field-bandages',name:'Field Bandages',item:'bandage',supplies:{bandage:2},gold:24,description:'2 bandages • carried and lootable'},
 {id:'water-rations',name:'Water Rations',item:'water',supplies:{water:5},gold:10,description:'5 water • carried and lootable'},
 {id:'torch-pack',name:'Torch Pack',item:'torch',supplies:{torch:3},gold:12,description:'3 torches • carried and lootable'},
 {id:'gatherers-axe',name:'Gatherer’s Axe',item:'axe',supplies:{axe:1},gold:30,description:'1 basic axe • equip to chop trees'},
 {id:'miners-pickaxe',name:'Miner’s Pickaxe',item:'pickaxe',supplies:{pickaxe:1},gold:30,description:'1 basic pickaxe • equip to mine deposits'},
 {id:'farmers-sickle',name:'Farmer’s Sickle',item:'sickle',supplies:{sickle:1},gold:20,description:'1 basic sickle • equip to harvest plants'},
 {id:'crafting-materials',name:'Basic Crafting Materials',item:'wood',supplies:{wood:10,stone:10,fiber:10},gold:60,description:'10 wood, 10 stone, 10 fiber • no research unlocks'}
];
// Gold equipment and consumables use existing gameplay items; no mastery unlocks.
export const EXPANSION_OFFERS=[
 ['leather-tunic','Leather Tunic','tunic',1,30],
 ['padded-gambeson','Padded Gambeson','gambeson',1,90],
 ['iron-helmet','Iron Helmet','helmet',1,75],
 ['hide-gloves','Hide Gloves','hide_gloves',1,35],
 ['hide-leggings','Hide Leggings','hide_leggings',1,55],
 ['hide-boots','Hide Boots','hide_boots',1,40],
 ['ash-spear','Ash Spear','spear',1,25],
 ['arming-sword','Arming Sword','sword',1,70],
 ['wooden-shield','Shield','shield',1,50],
 ['hunting-bow','Hunting Bow','bow',1,60],
 ['arrow-bundle','Arrows','arrow',20,30],
 ['apple-basket','Apples','apple',5,15],
 ['roast-meat','Roast Meat','roastMeat',3,36],
 ['meat-stew','Meat Stew','stew',2,32],
 ['vegetable-stew','Garden Vegetable Stew','vegetableStew',2,28],
 ['smoked-venison','Smoked Venison','smokedMeat',3,54],
 ['herbal-infusion','Herbal Infusion','herbalTea',3,24],
 ['medical-pack','Medical Bandage Pack','bandage',5,60]
].map(([id,name,item,count,gold])=>({id,name,item,supplies:{[item]:count},gold,description:count+' × '+name+' • carried and lootable'}));
BASIC_OFFERS.push(...EXPANSION_OFFERS);
for(const item of Object.values(ITEMS)){if(restrictedEquipment(item.id)||BASIC_OFFERS.some(o=>o.item===item.id))continue;const id='catalog-'+item.id.replaceAll('_','-').replace(/[A-Z]/g,c=>'-'+c.toLowerCase());BASIC_OFFERS.push({id,name:item.name,item:item.id,supplies:{[item.id]:1},gold:itemPrice(item.id).amount,description:item.deployKind?item.source:item.name+' • '+item.category});}
BASIC_OFFERS.push(...[{id:'exchange-copper',name:'Copper Coin Roll',coin:'copper',coinCount:10,gold:1,currency:'silver'},{id:'exchange-silver',name:'Silver Coin Roll',coin:'silver',coinCount:10,gold:1,currency:'gold'},{id:'exchange-silver-up',name:'Silver Coin',coin:'silver',coinCount:1,gold:10,currency:'copper'},{id:'exchange-gold-up',name:'Gold Coin',coin:'gold',coinCount:1,gold:10,currency:'silver'}].map(o=>({...o,item:o.coin,kind:'coins',description:o.coinCount+' '+o.coin+' coins into your belt pouch • exact value • no fee'})));
for(const offer of BASIC_OFFERS){if(offer.supplies){const price=supplyPrice(offer.supplies);offer.gold=price.amount;offer.currency=price.currency;}MAIN_SHOP_IDS.add(offer.id);}
for(const id of Object.keys(COSMETICS))MAIN_SHOP_IDS.add(id);MAIN_SHOP_IDS.add('heralds-collection');MAIN_SHOP_IDS.add('travellers-provisions');

function ensureBasics(r){if(r.state.basicShopVersion>=6)return;for(const o of BASIC_OFFERS)r.state.shop.offers[o.id]??={...o,kind:o.kind||'supplies',giftable:false,usdCents:null,basic:true};for(const offer of BASIC_OFFERS){if(offer.supplies&&r.state.shop.offers[offer.id]?.basic){r.state.shop.offers[offer.id].gold=offer.gold;r.state.shop.offers[offer.id].currency=offer.currency;}}r.state.basicShopVersion=6;}
export function ensureCosmetics(r){r.state.shop??={offers:{},instances:{},listings:{},transactions:{}};ensureBasics(r);if((r.state.cosmeticCatalogVersion||0)>=3)return;for(const [id,skin] of Object.entries(COSMETICS))r.state.shop.offers[id]??={id,item:id,kind:'cosmetic',gold:id==='ashen-sigil'?100:skin.kind==='companion'?400:200,usdCents:skin.kind==='companion'?199:99,giftable:true,name:skin.name};r.state.shop.offers['heralds-collection']??={id:'heralds-collection',item:'iron-crown',items:['iron-crown','raven-sigil','ember-sigil'],kind:'cosmetic',gold:497,usdCents:199,giftable:true,name:'Herald’s Collection',description:'Three permanently owned heraldic cosmetics.'};r.state.shop.offers['travellers-provisions']??={id:'travellers-provisions',item:'bread',kind:'supplies',supplies:{bread:3,bandage:2,water:5},gold:45,usdCents:99,giftable:true,name:'Traveller’s Provisions',description:'3 bread, 2 bandages, 5 water; carried and lootable'};r.state.cosmeticCatalogVersion=3;}
export function equippedCosmetic(r,id,slot='character'){const a=r.state.accounts?.[id],instance=r.state.shop?.instances[a?.[slot==='companion'?'equippedCompanionCosmetic':'equippedCosmetic']];return instance?.owner===id&&!r.state.shop?.listings[instance.id]?COSMETICS[instance.item]||null:null;}
export function offerCategory(o){const item=ITEMS[o.item],skin=COSMETICS[o.item];if(o.kind==='coins')return 'Coin Exchange';if(o.items||Object.keys(o.supplies||{}).length>1)return 'Bundles';if(skin)return skin.kind==='companion'?'Companions':'Cosmetics';if(item?.deployKind)return 'Furniture';if(/seed|wheat|flax/i.test(o.item||'')||o.item==='sickle')return 'Farming';if(item&&(item.damage||item.armour||item.armorSlot||item.backpackSlots||o.item==='shield'))return 'Equipment';return 'Resources';}
export function cosmeticRows(r,p){ensureFeatured(r);const s=r.state.shop,now=r.clock(),rows=[],art=item=>{const skin=COSMETICS[item];return skin?{color:skin.color,symbol:skin.kind==='companion'?'companion':skin.symbol}:null;};
 for(const o of Object.values(s.offers).filter(o=>MAIN_SHOP_IDS.has(o.id)).sort((a,b)=>(a.featured==='flash'?0:a.basic?1:2)-(b.featured==='flash'?0:b.basic?1:2))){if(offerRestricted(o)&&o.featured!=='flash'||o.startsAt>now||o.featured&&o.endsAt<=now)continue;const retired=o.retired||o.endsAt!=null&&now>=o.endsAt,name=o.name||o.item,available=!retired&&o.stock!==0&&o.gold!=null,clock=o.endsAt==null?'Permanent offer':Math.max(0,Math.ceil((o.endsAt-now)/60000))+' min left',detail=(o.description||COSMETICS[o.item]?.description||'Cosmetic only')+' • '+(retired?'Retired':o.stock===0?'Sold out':clock)+(o.stock!=null?' • '+o.stock+' remaining':'');
 rows.push({...saleMetadata(o.item),group:'Catalog',category:offerCategory(o),featured:!!o.featured,art:o.kind==='supplies'||o.kind==='coins'?{item:o.item}:art(o.item),name:name+(o.items?' — '+o.items.length+' items':''),detail:(o.regularGold?priceText(o)+' • WAS '+priceText({...o,gold:o.regularGold}):o.gold==null?'Cash only':priceText(o))+' • '+detail+(ITEMS[o.item]?' • '+(saleMetadata(o.item).rarityName||'Common')+(ITEMS[o.item].equipmentTier?' • Equipment level '+ITEMS[o.item].equipmentTier:'')+(saleMetadata(o.item).crafting?' • '+saleMetadata(o.item).crafting.profession+' '+saleMetadata(o.item).crafting.level:''):''),confirm:'Buy '+name+' for '+priceText(o)+'?',action:available?{type:'shopBuy',offer:o.id}:null});
 if(o.giftable&&available)rows.push({group:'Catalog',category:offerCategory(o),art:o.kind==='supplies'?{item:o.item}:art(o.item),name:'Gift '+name,detail:priceText(o)+' • existing player ID • no cash transfer',prompt:'Recipient player ID',field:'recipient',action:{type:'shopBuy',offer:o.id}});
 }
 const account=r.state.accounts[p.id],town=authorizedTown(r,p),atBank=!!town&&nearService(p,town,'bank')&&!!account?.bank;for(const d of HOUSE_DESIGNS)rows.push({group:'Catalog',category:'Houses & Bases',art:{item:'deed:'+d.id},name:d.name+' House Deed',detail:d.price+' banked gold • unique physical deed • '+(atBank?'Purchase from this banker':'Visit your banker to purchase'),confirm:'Buy a '+d.name+' deed for '+d.price+' banked gold?',action:atBank?{type:'houseDeedBuy',design:d.id,quote:d.price}:null});
 for(const item of Object.values(s.instances).filter(i=>i.owner===p.id)){const name=COSMETICS[item.item]?.name||item.item,listed=!!s.listings[item.id],common={group:'Wardrobe',art:art(item.item)};rows.push({...common,name:'Equip '+name,detail:listed?'Listed for sale — cancel to equip':'Permanently owned • cosmetic only',action:listed?null:{type:'cosmeticEquip',instanceId:item.id}});rows.push({...common,name:'Gift owned '+name,detail:'Transfer this owned cosmetic to another player',prompt:'Recipient player ID',field:'recipient',action:listed?null:{type:'cosmeticGift',instanceId:item.id}});rows.push(listed?{...common,name:'Cancel listing: '+name,detail:'Return to wardrobe',action:{type:'cosmeticCancel',instanceId:item.id}}:{...common,name:'Sell '+name,detail:'Player marketplace • no tax',prompt:'Gold asking price',field:'gold',numeric:true,action:{type:'cosmeticList',instanceId:item.id}});}
 for(const listing of Object.values(s.listings)){if(listing.seller===p.id)continue;const item=s.instances[listing.instanceId];if(!item||item.owner!==listing.seller)continue;rows.push({group:'Marketplace',art:art(item.item),name:COSMETICS[item.item]?.name||item.item,detail:listing.gold+' gold • Seller '+listing.seller+' • no tax',confirm:'Buy this cosmetic for '+listing.gold+' gold?',action:{type:'cosmeticBuy',instanceId:listing.instanceId}});}
 rows.push({group:'Cash',name:'Cash checkout disabled',detail:'Cash purchases are not available. Use the Coin Shop to buy with in-game money.',action:null});return rows;
}
export function ensureFeatured(r){ensureCosmetics(r);const s=r.state.shop;if(!s)return;const day=Math.floor(r.clock()/86400000),week=Math.floor(day/7),sigils=Object.keys(COSMETICS).filter(id=>!COSMETICS[id].kind),coats=Object.keys(COSMETICS).filter(id=>COSMETICS[id].kind==='companion');for(const [period,index,list,length,gold,cents]of [['daily',day,sigils,86400000,160,99],['weekly',week,coats,604800000,320,199]]){const id=period+'-'+index,item=list[((index%list.length)+list.length)%list.length];s.offers[id]??={id,item,kind:'cosmetic',gold,usdCents:cents,giftable:true,name:period.toUpperCase()+' FEATURE: '+COSMETICS[item].name,startsAt:index*length,endsAt:(index+1)*length,stock:period==='daily'?50:100,featured:period};}const span=4*3600000,window=Math.floor(r.clock()/span);const rare=RARE_EQUIPMENT[((window%RARE_EQUIPMENT.length)+RARE_EQUIPMENT.length)%RARE_EQUIPMENT.length],rareId='flash-rare-'+window;if(rare){const price=itemPrice(rare);s.offers[rareId]??={id:rareId,item:rare,name:'FLASH DEAL: '+ITEMS[rare].name,kind:'supplies',supplies:{[rare]:1},gold:Math.ceil(price.amount*.75),regularGold:price.amount,currency:price.currency,usdCents:null,giftable:false,startsAt:window*span,endsAt:(window+1)*span,stock:3,featured:'flash'};}
for(let slot=0;slot<2;slot++){const base=BASIC_OFFERS.filter(o=>o.kind!=='coins')[(window*2+slot)%BASIC_OFFERS.filter(o=>o.kind!=='coins').length],id='flash-'+window+'-'+slot;s.offers[id]??={...base,id,name:'FLASH DEAL: '+base.name,kind:'supplies',...flashPrice(base.gold,base.currency||'gold'),usdCents:null,giftable:false,startsAt:window*span,endsAt:(window+1)*span,stock:100,featured:'flash'};}for(const [id,offer]of Object.entries(s.offers)){if(offer.featured)MAIN_SHOP_IDS.add(id);if(offer.featured&&offer.endsAt<r.clock()-30*86400000){delete s.offers[id];MAIN_SHOP_IDS.delete(id);}}}






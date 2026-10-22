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
for(const item of Object.values(ITEMS)){if(BASIC_OFFERS.some(o=>o.item===item.id))continue;const id='catalog-'+item.id.replaceAll('_','-').replace(/[A-Z]/g,c=>'-'+c.toLowerCase());BASIC_OFFERS.push({id,name:item.name,item:item.id,supplies:{[item.id]:1},gold:Math.max(2,(item.rarity||1)*5),description:item.name+' • '+item.category});}
for(const offer of BASIC_OFFERS)MAIN_SHOP_IDS.add(offer.id);
for(const id of Object.keys(COSMETICS))MAIN_SHOP_IDS.add(id);MAIN_SHOP_IDS.add('heralds-collection');MAIN_SHOP_IDS.add('travellers-provisions');

function ensureBasics(r){if(r.state.basicShopVersion>=3)return;for(const o of BASIC_OFFERS)r.state.shop.offers[o.id]??={...o,kind:'supplies',giftable:false,usdCents:null,basic:true};r.state.basicShopVersion=3;}
export function ensureCosmetics(r){r.state.shop??={offers:{},instances:{},listings:{},transactions:{}};ensureBasics(r);if((r.state.cosmeticCatalogVersion||0)>=3)return;for(const [id,skin] of Object.entries(COSMETICS))r.state.shop.offers[id]??={id,item:id,kind:'cosmetic',gold:id==='ashen-sigil'?100:skin.kind==='companion'?400:200,usdCents:skin.kind==='companion'?199:99,giftable:true,name:skin.name};r.state.shop.offers['heralds-collection']??={id:'heralds-collection',item:'iron-crown',items:['iron-crown','raven-sigil','ember-sigil'],kind:'cosmetic',gold:497,usdCents:199,giftable:true,name:'Herald’s Collection',description:'Three permanently owned heraldic cosmetics.'};r.state.shop.offers['travellers-provisions']??={id:'travellers-provisions',item:'bread',kind:'supplies',supplies:{bread:3,bandage:2,water:5},gold:45,usdCents:99,giftable:true,name:'Traveller’s Provisions',description:'3 bread, 2 bandages, 5 water; carried and lootable'};r.state.cosmeticCatalogVersion=3;}
export function equippedCosmetic(r,id,slot='character'){const a=r.state.accounts?.[id],instance=r.state.shop?.instances[a?.[slot==='companion'?'equippedCompanionCosmetic':'equippedCosmetic']];return instance?.owner===id&&!r.state.shop?.listings[instance.id]?COSMETICS[instance.item]||null:null;}
export function cosmeticRows(r,p){ensureFeatured(r);const s=r.state.shop,now=r.clock(),rows=[],art=item=>{const skin=COSMETICS[item];return skin?{color:skin.color,symbol:skin.kind==='companion'?'companion':skin.symbol}:null;};
 for(const o of Object.values(s.offers).filter(o=>MAIN_SHOP_IDS.has(o.id)).sort((a,b)=>(a.featured==='flash'?0:a.basic?1:2)-(b.featured==='flash'?0:b.basic?1:2))){if(o.startsAt>now||o.featured&&o.endsAt<=now)continue;const retired=o.retired||o.endsAt!=null&&now>=o.endsAt,name=o.name||o.item,available=!retired&&o.stock!==0&&o.gold!=null,clock=o.endsAt==null?'Permanent offer':Math.max(0,Math.ceil((o.endsAt-now)/60000))+' min left',detail=(o.description||COSMETICS[o.item]?.description||'Cosmetic only')+' • '+(retired?'Retired':o.stock===0?'Sold out':clock)+(o.stock!=null?' • '+o.stock+' remaining':'');
 rows.push({group:'Catalog',category:['axe','pickaxe','sickle','tunic','helmet','sword','shield'].includes(o.item)?'Equipment':'Resources',art:o.kind==='supplies'?{item:o.item}:art(o.item),name:name+(o.items?' — '+o.items.length+' items':''),detail:(o.regularGold?priceText(o)+' • WAS '+priceText({...o,gold:o.regularGold}):o.gold==null?'Cash only':priceText(o))+' • '+detail,confirm:'Buy '+name+' for '+priceText(o)+'?',action:available?{type:'shopBuy',offer:o.id}:null});
 if(o.giftable&&available)rows.push({group:'Catalog',art:o.kind==='supplies'?{item:o.item}:art(o.item),name:'Gift '+name,detail:priceText(o)+' • existing player ID • no cash transfer',prompt:'Recipient player ID',field:'recipient',action:{type:'shopBuy',offer:o.id}});
 }
 for(const item of Object.values(s.instances).filter(i=>i.owner===p.id)){const name=COSMETICS[item.item]?.name||item.item,listed=!!s.listings[item.id],common={group:'Wardrobe',art:art(item.item)};rows.push({...common,name:'Equip '+name,detail:listed?'Listed for sale — cancel to equip':'Permanently owned • cosmetic only',action:listed?null:{type:'cosmeticEquip',instanceId:item.id}});rows.push({...common,name:'Gift owned '+name,detail:'Transfer this owned cosmetic to another player',prompt:'Recipient player ID',field:'recipient',action:listed?null:{type:'cosmeticGift',instanceId:item.id}});rows.push(listed?{...common,name:'Cancel listing: '+name,detail:'Return to wardrobe',action:{type:'cosmeticCancel',instanceId:item.id}}:{...common,name:'Sell '+name,detail:'Player marketplace • no tax',prompt:'Gold asking price',field:'gold',numeric:true,action:{type:'cosmeticList',instanceId:item.id}});}
 for(const listing of Object.values(s.listings)){if(listing.seller===p.id)continue;const item=s.instances[listing.instanceId];if(!item||item.owner!==listing.seller)continue;rows.push({group:'Marketplace',art:art(item.item),name:COSMETICS[item.item]?.name||item.item,detail:listing.gold+' gold • Seller '+listing.seller+' • no tax',confirm:'Buy this cosmetic for '+listing.gold+' gold?',action:{type:'cosmeticBuy',instanceId:listing.instanceId}});}
 rows.push({group:'Cash',name:'Cash checkout disabled',detail:'New products, prices and payment integration require approval.',action:null});return rows;
}
export function ensureFeatured(r){ensureCosmetics(r);const s=r.state.shop;if(!s)return;const day=Math.floor(r.clock()/86400000),week=Math.floor(day/7),sigils=Object.keys(COSMETICS).filter(id=>!COSMETICS[id].kind),coats=Object.keys(COSMETICS).filter(id=>COSMETICS[id].kind==='companion');for(const [period,index,list,length,gold,cents]of [['daily',day,sigils,86400000,160,99],['weekly',week,coats,604800000,320,199]]){const id=period+'-'+index,item=list[((index%list.length)+list.length)%list.length];s.offers[id]??={id,item,kind:'cosmetic',gold,usdCents:cents,giftable:true,name:period.toUpperCase()+' FEATURE: '+COSMETICS[item].name,startsAt:index*length,endsAt:(index+1)*length,stock:period==='daily'?50:100,featured:period};}const span=4*3600000,window=Math.floor(r.clock()/span);for(let slot=0;slot<2;slot++){const base=BASIC_OFFERS[(window*2+slot)%BASIC_OFFERS.length],id='flash-'+window+'-'+slot;s.offers[id]??={...base,id,name:'FLASH DEAL: '+base.name,kind:'supplies',gold:Math.ceil(base.gold*.75),regularGold:base.gold,usdCents:null,giftable:false,startsAt:window*span,endsAt:(window+1)*span,stock:100,featured:'flash'};}for(const [id,offer]of Object.entries(s.offers))if(offer.featured&&offer.endsAt<r.clock()-30*86400000)delete s.offers[id];}





import {WILDLIFE_SPECIES} from './wildlife-catalog.mjs';
export const FIELD_BALANCE_STATUS='draft-playtest';
export const fieldId=name=>'field:'+name;
const names={venison:'Raw Venison',elkMeat:'Raw Elk Meat',boarMeat:'Raw Boar Meat',gameMeat:'Raw Wild Game',rabbitMeat:'Raw Rabbit',bearMeat:'Raw Bear Meat',mutton:'Raw Mutton',bisonMeat:'Raw Bison Meat',beef:'Raw Beef',horseMeat:'Raw Horse Meat',duckMeat:'Raw Duck',gooseMeat:'Raw Goose',birdMeat:'Raw Wild Bird',turkeyMeat:'Raw Turkey',mooseMeat:'Raw Moose Meat',troutFillet:'Trout Fillets',salmonFillet:'Salmon Fillets',pikeFillet:'Pike Fillets',bassFillet:'Bass Fillets',catfishFillet:'Catfish Fillets',roe:'Fish Roe',hide:'Raw Hide',thickHide:'Thick Raw Hide',pelt:'Pelt',fur:'Fine Fur',albinoHide:'Albino Deer Hide',redFur:'Red Fox Fur',feather:'Feathers',eagleFeather:'Golden Eagle Feathers',bone:'Bone',fat:'Animal Fat',sinew:'Sinew',antler:'Antler',horn:'Horn',tusk:'Tusk',claw:'Claw',tooth:'Tooth',fang:'Fang',venom:'Venom',snakeSkin:'Reptile Skin',chitin:'Chitin'};
const rawFood=new Set(Object.values(WILDLIFE_SPECIES).map(s=>Object.keys(s.yields)[0]).filter(k=>/Meat|Fillet|venison|mutton|beef/.test(k)));
const items={};
function item(key,name,extra={}){
 const id=fieldId(key);items[id]={id,name,category:'Components',weight:.2,stackLimit:10,inventoryWidth:1,inventoryHeight:1,rarity:1,fieldItem:true,balanceStatus:FIELD_BALANCE_STATUS,artPending:true,baseCopper:12,...extra};return id;
}
for(const [key,name]of Object.entries(names))item(key,name,{category:rawFood.has(key)||key==='roe'?'Food':'Components',...(rawFood.has(key)||key==='roe'?{spoilMs:4*3600000,raw:true,ingredientTags:[key.includes('Fillet')?'fish':'meat'],baseCopper:12}:{}),...(key==='hide'||key==='thickHide'||key==='pelt'?{ingredientTags:['hide'],baseCopper:20}:{}),...(key==='fur'||key==='redFur'||key==='albinoHide'?{ingredientTags:['fur'],baseCopper:25}:{}),...(key==='feather'||key==='eagleFeather'?{ingredientTags:['feather']}:{}),...(key==='bone'?{ingredientTags:['bone']}:{} )});
item('anyMeat','Any Fresh Wild Meat',{virtualIngredient:true,ingredientTags:['meat'],category:'Food',baseCopper:12});
item('anyFish','Any Fresh Fish',{virtualIngredient:true,ingredientTags:['fish'],category:'Food',baseCopper:12});
item('anyHide','Any Hide or Pelt',{virtualIngredient:true,ingredientTags:['hide'],baseCopper:20});
item('anyFur','Any Fine Fur',{virtualIngredient:true,ingredientTags:['fur'],baseCopper:25});
item('anyFeather','Any Feathers',{virtualIngredient:true,ingredientTags:['feather'],baseCopper:12});
item('unsafeWater','Unsafe Water',{category:'Food',hydration:20,nutrition:0,unsafeWater:true,water:true,baseCopper:1});
item('cleanWater','Clean Water',{category:'Food',hydration:25,nutrition:0,water:true,baseCopper:2});
const recipes={};
function recipe(key,name,needs,station,extra={}){
 const id=fieldId(key),output=item(key,name,extra.item||{});
 recipes[id]={id,name,needs,output:{[output]:1},station,stationTier:station?1:undefined,tech:'campcraft',profession:extra.profession||'cooking',level:0,fieldRecipe:true,craftMs:extra.craftMs||15000,balanceStatus:FIELD_BALANCE_STATUS};
 return output;
}
const f=fieldId,food=(nutrition=30,hydration=0,preserved=false)=>({item:{category:'Food',nutrition,hydration,spoilMs:(preserved?72:12)*3600000,baseCopper:20}});
for(const [key,name,meat]of [['roastVenison','Roast Venison','venison'],['boarRoast','Boar Roast','boarMeat'],['rabbitSkewers','Rabbit Skewers','rabbitMeat'],['elkSteak','Elk Steak','elkMeat'],['muttonRoast','Mutton Roast','mutton'],['roastTurkey','Roast Turkey','turkeyMeat'],['gooseRoast','Goose Roast','gooseMeat']])recipe(key,name,{[f(meat)]:1,wood:1},'hearth',food());
for(const [key,name,meat]of [['huntersStew',"Hunter's Stew",'venison'],['bearStew','Bear Stew','bearMeat'],['bisonStew','Bison Stew','bisonMeat'],['duckSoup','Duck Soup','duckMeat'],['catfishStew','Catfish Stew','catfishFillet'],['fishChowder','Fish Chowder','anyFish']])recipe(key,name,{[f(meat)]:1,onion:1,[f('cleanWater')]:1,wood:1},'hearth',food(40,15));
for(const [key,name,fish]of [['grilledTrout','Grilled Trout','troutFillet'],['panFriedBass','Pan-Fried Bass','bassFillet'],['pikeFillets','Cooked Pike Fillets','pikeFillet']])recipe(key,name,{[f(fish)]:1,wood:1},'hearth',food());
for(const [key,name,raw]of [['smokedVenison','Smoked Venison','venison'],['driedMeatRations','Dried Meat Rations','anyMeat'],['smokedSalmon','Smoked Salmon','salmonFillet'],['saltedFish','Salted Fish','anyFish'],['fishJerky','Fish Jerky','anyFish']])recipe(key,name,{[f(raw)]:1,salt:1,wood:1},'smoker',{...food(28,0,true),craftMs:45000});
recipe('travelRations','Travel Rations',{[f('driedMeatRations')]:1,bread:1},null,food(45,0,true));
recipe('venisonPie','Venison Pie',{[f('venison')]:1,flour:1,[f('cleanWater')]:1,wood:1},'hearth',food(45));
recipe('wildGameSausage','Wild Game Sausage',{[f('anyMeat')]:2,[f('fat')]:1,salt:1},'hearth',food(40));
recipe('trailMix','Trail Mix',{berry:2,driedApples:1},null,food(20,0,true));
recipe('mountainFeast','Mountain Feast',{[f('muttonRoast')]:1,[f('elkSteak')]:1,[f('cleanWater')]:1},'hearth',food(70,20));
recipe('royalHuntersBanquet',"Royal Hunter's Banquet",{[f('venisonPie')]:1,[f('gooseRoast')]:1,[f('grilledTrout')]:1},'hearth',food(100,25));
for(const [key,name,needs,nutrition]of [['boiledWater','Boiled Water',{[f('unsafeWater')]:1,wood:1},0],['herbalTea','Herbal Tea',{herb:1,[f('cleanWater')]:1,wood:1},5],['berryDrink','Berry Drink',{berry:2,[f('cleanWater')]:1},5],['vegetableBroth','Vegetable Broth',{carrot:1,onion:1,[f('cleanWater')]:1,wood:1},15],['boneBroth','Bone Broth',{[f('bone')]:1,[f('cleanWater')]:1,wood:1},15]])recipe(key,name,needs,key==='berryDrink'?null:'hearth',{item:{category:'Food',nutrition,hydration:30,water:key==='boiledWater',spoilMs:24*3600000,baseCopper:8}});
// Existing approved stations only; these definitions add no station/building art.
for(const [key,name,needs,station,extra]of [
 ['curedHide','Cured Hide',{[f('anyHide')]:1,salt:1},'tannery',{}],['leather','Standard Leather',{[f('curedHide')]:1},'tannery',{}],['thickLeather','Thick Leather',{[f('thickHide')]:1,salt:1},'tannery',{}],['fineFur','Fine Fur',{[f('anyFur')]:1,salt:1},'tannery',{}],
 ['furCloak','Fur-Lined Cloak',{[f('fineFur')]:2,[f('leather')]:1},'loom',{armorSlot:'chest',armour:.1}],['furGloves','Fur-Lined Gloves',{[f('fineFur')]:1,[f('leather')]:1},'loom',{armorSlot:'gloves',armour:.05}],['furBoots','Fur-Lined Boots',{[f('fineFur')]:1,[f('thickLeather')]:1},'tannery',{armorSlot:'boots',armour:.05}],
 ['bearRug','Bear Rug',{[f('pelt')]:1,salt:1},'tannery',{}],['wolfRug','Wolf Rug',{[f('pelt')]:1,salt:1},'tannery',{}],['boneKnife','Bone Knife',{[f('bone')]:1,wood:1},null,{handheld:true,fieldKnife:true}],['fishingHook','Bone Fishing Hook',{[f('bone')]:1},null,{}],['antlerHandle','Antler Handle',{[f('antler')]:1},null,{}],['huntingQuiver','Hunting Quiver',{[f('leather')]:2,[f('sinew')]:1},'tannery',{}],['waterskin','Waterskin',{[f('leather')]:2,[f('sinew')]:1},'tannery',{fieldWaterskin:true,handheld:true}],['huntingPack','Hunting Pack',{[f('thickLeather')]:2,[f('sinew')]:2},'tannery',{backpackSlots:12,weight:1.5}],['hornCup','Horn Cup',{[f('horn')]:1},null,{}],
 ['deerTrophy','Mounted Deer Trophy',{[f('antler')]:1,plank:2},null,{}],['elkTrophy','Mounted Elk Trophy',{[f('antler')]:1,plank:2},null,{}],['mooseTrophy','Mounted Moose Trophy',{[f('antler')]:1,plank:2},null,{}],['bearTrophy','Mounted Bear Trophy',{[f('pelt')]:1,[f('claw')]:1,plank:2},null,{}],['albinoTrophy','Mounted Albino Deer Trophy',{[f('albinoHide')]:1,[f('antler')]:1,plank:2},null,{}]
])recipe(key,name,needs,station,{profession:'leatherwork',item:extra});
// Species constraints prevent a wolf pelt becoming a bear trophy or any antler
// being relabeled as an elk/moose trophy. Provenance is immutable lot metadata.
recipes[f('bearRug')].speciesNeeds={[f('pelt')]:['bear','snowBear','blackBear']};
recipes[f('wolfRug')].speciesNeeds={[f('pelt')]:['wolf','snowWolf']};
for(const species of ['deer','elk','moose'])recipes[f(species+'Trophy')].speciesNeeds={[f('antler')]:[species,...(species==='elk'?['plainsElk']:[])]};
recipes[f('bearTrophy')].speciesNeeds={[f('pelt')]:['bear','snowBear','blackBear'],[f('claw')]:['bear','snowBear','blackBear']};
recipes[f('albinoTrophy')].speciesNeeds={[f('albinoHide')]:['albinoDeer'],[f('antler')]:['albinoDeer']};
export const FIELD_ITEMS=Object.freeze(items);
export const FIELD_RECIPES=Object.freeze(recipes);

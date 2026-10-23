import {DEFENSES} from './base-defense-catalog.mjs';
import {OUTBUILDINGS} from './base-outbuildings.mjs';
import {COMPACT,LAYOUT} from './world-profile.mjs';
import {naturalBuildings} from './organic-towns.mjs';
import {CASTLES} from './castles.mjs';
import {FACTION_TOWNS} from './master-rules.mjs';
import {PROGRESSION} from './progression.mjs';
export const WORLD = Object.freeze(COMPACT?{width:LAYOUT.width,height:LAYOUT.height,capacity:64,safeTowns:LAYOUT.protection.zones}:{ width: 62254, height: 62254, capacity: 64, safeTowns: [
  { id: 'greyhaven', name: 'Greyhaven', x: 512, y: 512, radius: 480 },
  { id: 'ironwatch', name: 'Ironwatch', x: 3500, y: 3500, radius: 480 }
] });
export const ITEMS=Object.fromEntries(PROGRESSION.items.map(i=>[i.id,Object.freeze(i)]));
export function registerPhysicalDeed(id,design){
 if(!/^deed:(hut|cottage|farmhouse|townhouse|manor):[0-9a-f-]{36}$/.test(id)||id.split(':')[1]!==design)throw Error('Invalid physical deed ID');
 ITEMS[id]??=Object.freeze({id,name:design[0].toUpperCase()+design.slice(1)+' House Deed',category:'Deeds',weight:.05,inventoryWidth:1,inventoryHeight:1,stackLimit:1});
}
export const ACCOUNT_ITEMS=Object.freeze({copper:{id:'copper',name:'Copper'},silver:{id:'silver',name:'Silver'},gold:{id:'gold',name:'Gold'},reclamationMinor:{id:'reclamationMinor',name:'Minor Skill Reclamation Token'},reclamationGreater:{id:'reclamationGreater',name:'Greater Skill Reclamation Token'},reclamationSuperior:{id:'reclamationSuperior',name:'Superior Skill Reclamation Token'}});
export const RECIPES=Object.freeze(Object.fromEntries(PROGRESSION.recipes.map(r=>[r.id,r])));
export const BUILDINGS = Object.freeze({
  ...DEFENSES,...OUTBUILDINGS,
  kiln:{needs:{stone:30,clay:20,wood:10},hp:500},loom:{needs:{wood:20,fiber:10},hp:220},mill:{needs:{stone:25,wood:20},hp:400},smoker:{needs:{wood:25,stone:10},hp:250},stonewall:{needs:{brick:12,mortar:4},hp:1000},chest:{needs:{plank:8,nails:4},hp:200},
  hearth:{needs:{stone:10,wood:5},hp:200}, forge:{needs:{stone:30,wood:15},hp:500},
  tannery:{needs:{wood:20,fiber:10},hp:300}, farm:{needs:{wood:10,stone:5},hp:200},
  palisade:{needs:{wood:25},hp:600}, gate:{needs:{wood:35,iron:5},hp:900},
  keep:{needs:{stone:150,wood:60,iron:20},hp:4000}
});
export const PROFESSIONS = ['woodcraft','mining','smithing','leatherwork','cooking','farming','masonry'];
export const ENEMIES = Object.freeze({
  woodland: ['wolf','boar','poacher','deserter','forest brigand'],
  highlands: ['mountain wolf','outlaw archer','raider','bear','exiled knight'],
  marsh: ['marsh wolf','plague rat','bog bandit','smuggler','fallen guard'],
  ruins: ['grave robber','cultist','feral hound','renegade spearman','black knight']
});

export const TOWN_BUILDINGS = WORLD.safeTowns.flatMap(t=>[
 {id:t.id+'-keep',kind:'keep',name:'Town Watch',x:t.x-245,y:t.y-235,size:600,halfWidth:155,depth:110},
 ...[[-245,55,'Smithy'],[210,-235,'Tavern'],[285,100,'Provisioner'],[-200,320,'Cottage'],[280,360,'Farmstead']].map(([dx,dy,name],i)=>({id:t.id+'-house'+i,kind:'house',name,x:t.x+dx,y:t.y+dy,size:430,halfWidth:125,depth:80}))
]);
export const LANDMARKS = [
 {id:'ruined-watch',kind:'keep',name:'Abandoned Watch',x:2050,y:1300,size:600,halfWidth:155,depth:110},
 {id:'woodland-cottage',kind:'house',name:'Woodland Cottage',x:1450,y:2350,size:430,halfWidth:125,depth:80},
 {id:'highland-watch',kind:'keep',name:'Highland Watch',x:3150,y:950,size:600,halfWidth:155,depth:110}
];
export const FRONTIER_BUILDINGS=Array.from({length:12},(_,i)=>{const x=1600+(i%4)*3200,y=5100+Math.floor(i/4)*3000;return [
 {id:`frontier-${i}-keep`,kind:'keep',name:`March Watch ${i+1}`,x,y,size:600,halfWidth:155,depth:110},
 {id:`frontier-${i}-tavern`,kind:'house',name:`Wayfarer Tavern ${i+1}`,x:x+450,y:y+270,size:430,halfWidth:125,depth:80},
 {id:`frontier-${i}-cottage`,kind:'house',name:`Crofter Cottage ${i+1}`,x:x-420,y:y+270,size:430,halfWidth:125,depth:80}
 ];}).flat();
export const NEW_VILLAGES=Array.from({length:36},(_,i)=>({id:`village-${i}`,name:['Ashford','Briar Hollow','Kingsfall','Ravenmere','Stonecross','Thornwick'][i%6]+[' Reach',' Vale',' Crossing',' Heath',' March',' Downs'][Math.floor(i/6)],x:8000+(i%6)*10000+((i*743)%1700-850),y:8000+Math.floor(i/6)*10000+((i*491)%1500-750)})).filter(v=>v.x>13585||v.y>13585);
export const ORIGINAL_VILLAGES=[...WORLD.safeTowns.map(t=>({...t,safe:true})),...Array.from({length:12},(_,i)=>({id:`march-${i}`,name:`March ${i+1}`,x:1600+(i%4)*3200,y:5600+Math.floor(i/4)*3000})),...NEW_VILLAGES];
export const EXPANSION_BUILDINGS=NEW_VILLAGES.flatMap(v=>[
 [-390,-540,'keep','Watch'],[280,-410,'house','Smithy'],[-340,-160,'house','Tavern'],[430,40,'house','Provisioner'],[-440,210,'house','Cottage'],[210,390,'house','Cottage'],[-250,690,'house','Farmstead'],[550,750,'house','Farmstead']
].map(([dx,dy,kind,name],i)=>({id:`${v.id}-building-${i}`,kind,name:`${v.name} ${name}`,x:v.x+dx,y:v.y+dy,size:kind==='keep'?600:430,halfWidth:kind==='keep'?155:125,depth:kind==='keep'?110:80})));
export const FACTION_SHOPS=FACTION_TOWNS.filter(t=>!['greyhaven','ironwatch'].includes(t.mapId)).flatMap(t=>[[-240,160,'Smithy'],[240,160,'Provisioner'],[0,-190,'Tavern']].map(([dx,dy,name],i)=>({id:`${t.id}-shop-${i}`,kind:'house',name,x:t.x+dx,y:t.y+dy,size:430,halfWidth:125,depth:80})));
export const ORIGINAL_BUILDINGS=[...FACTION_SHOPS,...TOWN_BUILDINGS,...LANDMARKS,...FRONTIER_BUILDINGS,...EXPANSION_BUILDINGS];

// Additive districts: old building IDs, footprints and doors remain unchanged.
export const DETAIL_TOWNS=[['Oakmere',12500,17000],['Dunbarrow',23500,12500],['Willowfen',33500,22500],['Cinderford',45000,13500],['Hearthwick',52000,24500],['Greywater',12500,34000],['Fox Hollow',24000,43000],['Bellhaven',35000,52000],['Rookbridge',46000,44000],['Highmere',55000,52000]].map(([name,x,y],i)=>({id:'detail-town-'+i,name,x,y}));
export const VILLAGES=COMPACT?LAYOUT.settlements:[...ORIGINAL_VILLAGES,...DETAIL_TOWNS];
const roles=['Guild Hall','Chapel','Granary','Bakery','Weaver House','Smithy','Tavern','Stable'];
const layout=[[-360,-590],[330,-430],[-510,-190],[430,30],[-420,250],[180,480],[-230,730],[560,790]];
export const DETAIL_BUILDINGS=[];
for(const [vi,v] of VILLAGES.entries()){
 const fresh=v.id.startsWith('detail-town-'),count=fresh?8:2;
 for(let i=0;i<count;i++){
  const index=(vi+i)%roles.length,role=fresh?roles[i]:roles[index];let dx,dy;
  if(fresh){[dx,dy]=layout[i];dx+=(vi%3-1)*37;dy+=Math.sin(vi+i)*45;}else{const angle=(vi*.73+i*2.3);dx=Math.cos(angle)*1150;dy=Math.sin(angle)*1150;}
  const b={id:v.id+'-detail-'+i,kind:role==='Chapel'||role==='Guild Hall'?'keep':'house',name:v.name+' '+role,style:role,x:Math.round(v.x+dx),y:Math.round(v.y+dy),size:430,halfWidth:role==='Granary'?145:role==='Chapel'?100:125,depth:role==='Chapel'?140:80};
  if(b.x-b.halfWidth<40||b.y-b.depth<40||b.x+b.halfWidth>WORLD.width-40||b.y>WORLD.height-200)continue;
  if([...ORIGINAL_BUILDINGS,...DETAIL_BUILDINGS].some(o=>Math.abs(o.x-b.x)<o.halfWidth+b.halfWidth+100&&Math.abs(o.y-b.y)<o.depth+b.depth+140))continue;
  if(VILLAGES.some(t=>Math.hypot(t.x-b.x,t.y-b.y)<220))continue;
  DETAIL_BUILDINGS.push(b);
 }
}
export const LEGACY_BUILDINGS=[...ORIGINAL_BUILDINGS,...DETAIL_BUILDINGS,...CASTLES];
export const WORLD_BUILDINGS=COMPACT?LAYOUT.buildings:naturalBuildings(LEGACY_BUILDINGS,VILLAGES,FACTION_TOWNS);
export function buildingBlocks(x,y,excluded){return WORLD_BUILDINGS.some(b=>!excluded?.has(b.id)&&Math.abs(x-b.x)<b.halfWidth+10&&y>b.y-b.depth-10&&y<b.y+10);}





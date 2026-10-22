import {homeRoom} from './housing-catalog.mjs';
import {WORLD_BUILDINGS,WORLD,buildingBlocks} from './catalog.mjs';
export const buildingById=(id,buildings=WORLD_BUILDINGS)=>buildings.find(b=>b.id===id?.replace(/:(?:dungeon|basement)$/,''));
export function roomFor(id,buildings=WORLD_BUILDINGS){const home=homeRoom(id);if(home)return home;const b=buildingById(id,buildings);if(!b)return null;if(b.houseDesign)return homeRoom(id,b.houseDesign);
 if(b.role==='missions')return {id,name:b.name,type:'missions',width:620,height:460,exit:{x:310,y:415},fixtures:[{kind:'rack',x:45,y:60,w:80,h:130},{kind:'counter',x:390,y:70,w:155,h:65},{kind:'table',x:245,y:90,w:110,h:65}]};
 if(['smithy','bank','workshop','merchant'].includes(b.role)){
  // Explicit service roles for isolated map catalogues; legacy buildings keep
  // their existing interior layouts and entry/stair transition protocol.
  const fixtures=b.role==='smithy'?[
   {kind:'forge',x:245,y:55,w:115,h:75},{kind:'anvil',x:70,y:160,w:75,h:45},
   {kind:'kiln',x:435,y:290,w:90,h:65}
  ]:b.role==='workshop'?[
   {kind:'loom',x:65,y:65,w:100,h:65},{kind:'tannery',x:435,y:65,w:100,h:65},
   {kind:'table',x:245,y:65,w:120,h:60},{kind:'hearth',x:65,y:285,w:75,h:65},
   {kind:'mill',x:435,y:285,w:65,h:65},{kind:'smoker',x:525,y:285,w:65,h:65}
  ]:b.role==='bank'?[
   {kind:'counter',x:85,y:95,w:190,h:60},{kind:'counter',x:345,y:95,w:190,h:60},
   {kind:'rack',x:65,y:40,w:90,h:35},{kind:'rack',x:465,y:40,w:90,h:35}
  ]:[{kind:'counter',x:175,y:85,w:270,h:65},
   {kind:'rack',x:65,y:65,w:70,h:110},{kind:'rack',x:485,y:65,w:70,h:110}];
  return {id,name:b.name,type:b.role,width:620,height:460,exit:{x:310,y:415},fixtures};
 }
 if(b.style==='Castle'){const dungeon=id.endsWith(':dungeon');return {id,name:b.name+(dungeon?' Dungeon':' Great Hall'),type:dungeon?'dungeon':'castle',width:620,height:460,exit:{x:310,y:415},portal:dungeon?null:{x:540,y:335,label:'DUNGEON STAIRS'},fixtures:dungeon?[{kind:'rack',x:70,y:65,w:20,h:240},{kind:'rack',x:530,y:65,w:20,h:240},{kind:'chest',x:130,y:95,w:65,h:55},{kind:'chest',x:420,y:95,w:65,h:55},{kind:'table',x:230,y:75,w:150,h:60}]:[{kind:'table',x:185,y:110,w:240,h:95},{kind:'rack',x:70,y:65,w:70,h:95},{kind:'crate',x:460,y:80,w:65,h:65},{kind:'hearth',x:70,y:270,w:70,h:70}]};}
 const type=b.style==='Chapel'?'chapel':b.style==='Granary'||b.style==='Stable'?'storehouse':b.style==='Bakery'?'tavern':b.style==='Guild Hall'?'guildhall':b.name.includes('Smith')?'smithy':b.name.includes('Tavern')?'tavern':b.kind==='keep'?'tower':'cottage';
 const fixtures=type==='chapel'?[{kind:'table',x:230,y:70,w:160,h:60},...Array.from({length:4},(_,i)=>({kind:'table',x:i%2?390:90,y:190+Math.floor(i/2)*90,w:100,h:40}))]:type==='storehouse'?[...Array.from({length:6},(_,i)=>({kind:'crate',x:70+(i%3)*185,y:70+Math.floor(i/3)*155,w:75,h:60}))]:type==='guildhall'?[{kind:'table',x:185,y:95,w:245,h:90},{kind:'rack',x:65,y:65,w:70,h:65},{kind:'counter',x:455,y:75,w:90,h:160}]:type==='smithy'?[
 {kind:'forge',x:85,y:80,w:120,h:75},{kind:'anvil',x:280,y:170,w:75,h:45},{kind:'rack',x:460,y:75,w:90,h:55}
 ]:type==='tavern'?[
 {kind:'counter',x:65,y:60,w:330,h:65},{kind:'table',x:90,y:190,w:100,h:65},{kind:'table',x:390,y:230,w:100,h:65},{kind:'hearth',x:490,y:65,w:70,h:70}
 ]:type==='tower'?[
 {kind:'rack',x:65,y:65,w:120,h:55},{kind:'table',x:240,y:80,w:120,h:65},{kind:'crate',x:470,y:95,w:65,h:65}
 ]:[{kind:'bed',x:65,y:65,w:100,h:155},{kind:'table',x:350,y:120,w:110,h:70},{kind:'hearth',x:480,y:65,w:70,h:70}];
 if(type==='smithy')fixtures.push({kind:'kiln',x:425,y:310,w:100,h:65});if(type==='cottage')fixtures.push({kind:'loom',x:385,y:310,w:100,h:65},{kind:'tannery',x:65,y:310,w:95,h:60});if(type==='tavern')fixtures.push({kind:'mill',x:515,y:315,w:65,h:65},{kind:'smoker',x:410,y:325,w:70,h:65});
 if(['smithy','cottage','tavern'].includes(type))fixtures.push({kind:'crate',x:type==='tavern'?205:430,y:type==='tavern'?285:225,w:55,h:50});
 return {id,name:b.name,type,width:620,height:460,exit:{x:310,y:415},fixtures};
}
export function roomBlocked(room,x,y){return x<25||y<35||x>room.width-25||y>room.height-25||room.fixtures.some(f=>x>f.x-12&&x<f.x+f.w+12&&y>f.y-12&&y<f.y+f.h+12);}
export function enterRoom(p,id,buildings=WORLD_BUILDINGS){const b=buildings.find(b=>b.id===id);if(!b||p.interior||Math.hypot(p.x-(b.door?.x??b.x),p.y-(b.door?.y??b.y+35))>100)throw Error('Approach the front doorway to enter');p.interior=id;const room=roomFor(id,buildings);p.x=room.exit.x;p.y=room.exit.y-15;}
export function exitRoom(p,buildings=WORLD_BUILDINGS){if(p.interior?.endsWith(':basement')){const room=roomFor(p.interior,buildings);if(!room||Math.hypot(p.x-room.exit.x,p.y-room.exit.y)>90)throw Error('Walk to the upstairs stairwell');const home=p.interior.slice(0,-9),up=roomFor(home,buildings);if(!up?.portal)throw Error('House staircase unavailable');p.interior=home;p.x=up.portal.x;p.y=up.portal.y+45;return;}const b=buildings.find(b=>b.id===p.interior?.replace(/:(?:dungeon|basement)$/,''));const room=roomFor(p.interior,buildings);if(!b||!room||Math.hypot(p.x-room.exit.x,p.y-room.exit.y)>90)throw Error('Walk to the exit doorway');if(p.interior.endsWith(':dungeon')){p.interior=b.id;p.x=540;p.y=335;}else{p.interior=null;p.x=b.door?.x??b.x;p.y=b.door?.y??b.y+45;}}
export const STATION_NAMES={forge:"Smithing bench",anvil:"Smithing bench",hearth:"Cooking hearth",loom:"Weaving bench",tannery:"Leatherworking bench",kiln:"Kiln",mill:"Grinding mill",smoker:"Smoking rack"};
export function roomWorkstations(p,buildings=WORLD_BUILDINGS){const room=roomFor(p.interior,buildings);return room?room.fixtures.filter(f=>STATION_NAMES[f.kind]).map((f,i)=>({id:"workbench:"+room.id+":"+i,x:f.x+f.w/2,y:f.y+f.h/2,station:f.kind==="anvil"?"forge":f.kind,name:STATION_NAMES[f.kind]})):[];}
export function stationInRoom(p,kind,buildings=WORLD_BUILDINGS){const room=roomFor(p.interior,buildings);return room&&room.fixtures.some(f=>(f.kind===kind||f.kind==='anvil'&&kind==='forge')&&Math.hypot(p.x-(f.x+f.w/2),p.y-(f.y+f.h/2))<150);}


// Move only generated resource nodes out of entrance approaches. Stable IDs,
// quantities and regeneration timers are preserved; player storage is untouched.
export function clearDoorApproaches(state){
 if(state.doorApproachesVersion===1)return;
 const doorway=n=>WORLD_BUILDINGS.find(b=>Math.abs(n.x-b.x)<70&&n.y>b.y+10&&n.y<b.y+175);
 for(const n of state.resources){const b=doorway(n);if(!b)continue;
  for(const [dx,dy] of [[-b.halfWidth-70,70],[b.halfWidth+70,70],[-b.halfWidth-100,130],[b.halfWidth+100,130]]){
   const candidate={x:b.x+dx,y:b.y+dy};if(candidate.x<30||candidate.y<30||candidate.x>WORLD.width-30||candidate.y>WORLD.height-30||buildingBlocks(candidate.x,candidate.y)||doorway(candidate))continue;
   Object.assign(n,candidate);break;
  }
 }
 // A saved player may occupy a spot where a moved fixture now stands.
 for(const p of Object.values(state.players||{})){const room=roomFor(p.interior);if(room&&roomBlocked(room,p.x,p.y)){p.x=310;p.y=400;}}
 state.doorApproachesVersion=1;
}

export function descendDungeon(p){const room=roomFor(p.interior);if(room?.portal?.floor==='basement'){if(Math.hypot(p.x-room.portal.x,p.y-room.portal.y)>80)throw Error('Approach the basement stairs');p.interior+=':basement';const down=roomFor(p.interior);p.x=down.exit.x;p.y=down.exit.y-20;return;}if(!room?.portal||Math.hypot(p.x-room.portal.x,p.y-room.portal.y)>80)throw Error('Approach the dungeon stairs');p.interior+=':dungeon';p.x=310;p.y=400;}






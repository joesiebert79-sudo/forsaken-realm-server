import {plotContains} from './base-geometry.mjs';
// Owner-authorized additions in the established isometric room vocabulary.
// Each room has a clear central aisle and the existing bottom-centre doorway.
export const OUTBUILDINGS=Object.freeze({
 workshop:{name:'Workshop',level:3,halfWidth:100,depth:90,hp:1800,artRole:'workshop',needs:{plank:45,stone:30,nails:15}},
 cookhouse:{name:'Cookhouse',level:2,halfWidth:85,depth:70,hp:1100,artRole:'merchant',needs:{plank:25,stone:20,nails:8}},
 smokehouse:{name:'Smokehouse',level:2,halfWidth:75,depth:65,hp:900,artRole:'workshop',needs:{plank:20,stone:10,nails:6}},
 stable:{name:'Stable',level:2,halfWidth:110,depth:85,hp:1300,artRole:'stable',needs:{plank:35,wood:30,nails:10}},
 greenhouse:{name:'Greenhouse',level:3,halfWidth:90,depth:90,hp:1000,artRole:'residence',needs:{plank:35,iron:8,fiber:20}},
 husbandry:{name:'Husbandry Barn',level:3,halfWidth:115,depth:95,hp:1600,artRole:'stable',needs:{plank:45,stone:25,nails:12}},
 storehouse:{name:'Storage House',level:2,halfWidth:95,depth:80,hp:1500,artRole:'workshop',needs:{plank:35,nails:12,iron:6}},
 trophyhouse:{name:'Trophy House',level:5,halfWidth:100,depth:90,hp:2000,artRole:'residence',needs:{seasonedPlank:40,brick:30,ironBraces:12}}
});
const f=(kind,x,y,w,h,name)=>({kind,x,y,w,h,...(name?{name}:{})});
const roomFixtures={
 workshop:[f('forge',60,60,100,65),f('anvil',230,65,70,50),f('kiln',450,60,85,70),f('loom',60,270,100,65),f('tannery',450,270,100,65),f('table',235,280,95,55,'Carpentry bench')],
 cookhouse:[f('hearth',55,65,80,65),f('table',230,65,140,60,'Food preparation'),f('mill',480,65,70,65),f('chest',55,285,70,55),f('table',425,280,120,55)],
 smokehouse:[f('smoker',60,65,75,65),f('smoker',250,65,75,65),f('rack',460,60,85,90,'Drying racks'),f('table',65,285,110,55),f('chest',475,290,65,55)],
 stable:[f('rack',55,60,120,120,'Horse stall'),f('rack',240,60,120,120,'Horse stall'),f('rack',425,60,120,120,'Horse stall'),f('crate',55,290,70,55,'Feed storage'),f('chest',480,285,65,55,'Tack storage')],
 greenhouse:[f('table',55,60,120,80,'Planting bed'),f('table',245,60,120,80,'Planting bed'),f('table',435,60,120,80,'Planting bed'),f('table',55,280,100,60,'Potting bench'),f('rack',450,275,100,70,'Herb drying'),f('chest',245,285,70,55,'Seed storage')],
 husbandry:[f('rack',55,60,120,130,'Animal pen'),f('rack',245,60,120,130,'Animal pen'),f('rack',435,60,120,130,'Animal pen'),f('tannery',55,280,100,65),f('table',245,280,110,60,'Milk and cheese preparation'),f('chest',475,285,65,55)],
 storehouse:[f('rack',55,60,100,100),f('rack',255,60,100,100),f('rack',455,60,100,100),f('chest',55,280,70,55),f('chest',250,280,70,55),f('chest',480,280,70,55)],
 trophyhouse:[f('rack',55,60,100,110,'Weapon display'),f('rack',255,60,100,110,'Armour display'),f('rack',455,60,100,110,'Trophy display'),f('chest',55,280,100,55,'Weapon display case'),f('chest',455,280,100,55,'Armour and trophy display case')]
};
export function outbuildingRoom(id){const kind=/^annex:([a-z]+):[a-z0-9-]+$/.exec(id||'')?.[1],d=OUTBUILDINGS[kind];return d?{id,name:d.name,type:kind==='workshop'?'workshop':kind==='cookhouse'?'tavern':kind==='storehouse'?'storehouse':'cottage',width:620,height:460,exit:{x:310,y:415},fixtures:structuredClone(roomFixtures[kind])}:null;}
export function outbuildingPresentation(s){const d=OUTBUILDINGS[s.kind];return d?{id:s.id,name:d.name,kind:'house',role:null,artRole:d.artRole,style:s.kind==='stable'||s.kind==='husbandry'?'Stable':s.kind==='storehouse'?'Granary':'Guild Hall',x:s.x,y:s.y,halfWidth:d.halfWidth,depth:d.depth,propertyId:s.propertyId,shop:d.name.toUpperCase(),door:{x:s.x,y:s.y+35}}:null;}
export function validateOutbuildingPlacement(r,p,s,kind,pos){const d=OUTBUILDINGS[kind];if(!d)return;if(!s.propertyId||!r.state.properties?.[s.propertyId])throw Error('Build outbuildings on your owned home property');if(p.mounted||p.hp<=0)throw Error('Dismount and build while alive');const box={left:pos.x-d.halfWidth-20,right:pos.x+d.halfWidth+20,top:pos.y-d.depth-20,bottom:pos.y+70};
 const home=r.state.properties[s.propertyId];if(![[box.left,box.top],[box.right,box.top],[box.left,box.bottom],[box.right,box.bottom]].every(([x,y])=>plotContains(home,x,y)))throw Error('Expand your base land before placing this building');
 if(r.buildings.some(b=>box.left<b.x+b.halfWidth+15&&box.right>b.x-b.halfWidth-15&&box.top<b.y+65&&box.bottom>b.y-b.depth-15))throw Error('Keep buildings and their entrance approaches clear');
 // Test the footprint and front approach, not merely the centre point.
 for(let x=box.left;x<=box.right;x+=16)for(let y=box.top;y<=box.bottom;y+=16){if(r.blocks(x,y)||r.safe({x,y})||r.roadGeometry?.nearRoad(x,y,12))throw Error('Building footprint crosses an obstacle, road or protected land');}
 if(Object.values(r.state.structures||{}).some(o=>o.id!==s.id&&o.hp>0&&o.x>box.left-35&&o.x<box.right+35&&o.y>box.top-35&&o.y<box.bottom+35))throw Error('Building footprint overlaps an existing structure');
 for(let x=Math.floor(box.left/256);x<=Math.floor(box.right/256);x++)for(let y=Math.floor(box.top/256);y<=Math.floor(box.bottom/256);y++){const claim=r.state.claims?.[x+','+y];if(claim&&claim.settlementId!==s.id)throw Error('Building footprint crosses another claimed territory');}
 if(Object.values(r.state.players||{}).some(other=>other.id!==p.id&&!other.interior&&other.hp>0&&other.x>box.left&&other.x<box.right&&other.y>box.top&&other.y<box.bottom))throw Error('Wait for other players to leave the building footprint');
}



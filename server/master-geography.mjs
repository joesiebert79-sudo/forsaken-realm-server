import {traderHub} from './trader-hubs.mjs';
import {clearPath} from './master-paths.mjs';
/** Hand-traced control points from approved-world-map.png (1536 x 1024).
 * Immutable reference coordinates, never inferred from procedural settlement grids.
 * Deployment/migration is intentionally opt-in; existing worlds retain coordinates.
 */
export const MAP_SCALE=32.5;
export const MASTER_SIZE=Object.freeze({width:1536*MAP_SCALE,height:1024*MAP_SCALE});
const point=([x,y])=>({x:x*MAP_SCALE,y:y*MAP_SCALE});
const shape=(id,kind,coords)=>({id,kind,points:coords.map(point)});
export const MASTER_LANDMARKS=Object.freeze([
 ['trader-a','Trader Town A','trader',177,247],['trader-b','Trader Town B','trader',1372,662],
 ['village-1','Village 1','village',481,164],['village-2','Village 2','village',583,296],
 ['village-3','Village 3','village',750,216],['village-4','Village 4','village',826,382],
 ['village-5','Village 5','village',1004,286],['village-6','Village 6','village',1179,388],
 ['village-7','Village 7','village',329,454],['village-8','Village 8','village',558,483],
 ['village-9','Village 9','village',780,559],['village-10','Village 10','village',907,649],
 ['village-11','Village 11','village',1125,665],['village-12','Village 12','village',651,712],
 ['castle-0','Castle 1','castle',452,48],['castle-1','Castle 2','castle',1209,149],
 ['castle-2','Castle 3','castle',1417,399],['castle-3','Castle 4','castle',400,676],
 ['castle-4','Castle 5','castle',1174,802]
].map(([id,name,kind,x,y])=>Object.freeze({id,name,kind,...point([x,y]),referenceX:x,referenceY:y})));
export const MASTER_POLYGONS=Object.freeze([
 shape('coast','land',[[51,169],[159,128],[292,143],[364,102],[423,31],[554,30],[651,15],[812,29],[956,65],[1050,39],[1189,83],[1280,139],[1332,224],[1352,300],[1417,339],[1465,421],[1510,503],[1463,541],[1456,602],[1524,660],[1518,740],[1457,766],[1459,850],[1391,875],[1327,852],[1271,838],[1235,885],[1159,849],[1115,801],[1036,787],[954,790],[915,755],[864,746],[831,709],[782,705],[751,735],[730,799],[683,800],[643,777],[594,777],[541,741],[475,751],[417,783],[354,742],[302,748],[280,696],[274,627],[287,563],[272,504],[227,472],[218,414],[191,402],[161,441],[101,433],[64,398],[103,358],[74,331],[20,300],[25,236]]),
 shape('north-lake','water',[[935,149],[977,152],[1018,180],[1007,211],[982,229],[990,256],[963,285],[934,276],[947,244],[925,216],[914,186]]),
 shape('western-marsh','marsh',[[367,351],[442,334],[495,352],[490,404],[453,429],[390,405]]),
 shape('eastern-marsh','marsh',[[978,402],[1031,409],[1081,440],[1050,473],[988,461],[950,434]]),
 shape('north-mountains','mountain',[[386,69],[453,8],[569,18],[656,0],[804,35],[853,116],[784,153],[695,120],[626,104],[536,120],[461,91]]),
 shape('east-mountains','mountain',[[1050,72],[1164,62],[1251,120],[1307,210],[1327,299],[1439,349],[1504,460],[1459,494],[1400,439],[1350,373],[1287,333],[1249,237],[1195,196],[1110,149]]),
 shape('southwest-mountains','mountain',[[297,589],[358,551],[438,568],[517,609],[555,682],[498,730],[402,737],[328,697]]),
 shape('southeast-mountains','mountain',[[1043,734],[1117,711],[1175,742],[1240,787],[1220,842],[1163,854],[1115,815]]),
 shape('west-forest','forest',[[311,150],[393,115],[450,123],[452,193],[400,228],[335,287],[306,240]]),
 shape('central-forest','forest',[[451,258],[532,232],[637,271],[730,277],[784,313],[750,378],[655,408],[612,384],[580,330],[493,311]]),
 shape('eastern-forest','forest',[[1050,215],[1150,205],[1240,260],[1268,348],[1217,354],[1160,329],[1100,317],[1056,289]]),
 shape('southern-forest','forest',[[624,570],[714,599],[801,611],[861,583],[949,575],[1014,624],[996,700],[947,733],[866,705],[785,665],[739,690],[670,664]]),
 shape('far-east-forest','forest',[[1180,444],[1273,414],[1340,451],[1407,502],[1351,552],[1245,566],[1184,521]])
]);
export const MASTER_RIVERS=Object.freeze([
 {id:'west-river',width:85,points:[[489,341],[527,354],[535,381],[564,400],[582,433],[613,458],[638,485],[677,513],[700,543],[736,557]].map(point)},
 {id:'lake-river',width:105,points:[[960,270],[948,305],[977,334],[959,370],[939,399],[905,418],[872,434],[854,472],[816,499],[777,517],[736,557]].map(point)},
 {id:'southern-river',width:120,points:[[736,557],[821,537],[908,533],[975,548],[1042,567],[1073,610],[1153,628],[1208,658],[1196,701],[1259,738],[1332,763]].map(point)},
 {id:'north-tributary',width:52.5,points:[[719,173],[705,207],[710,243],[765,273],[814,302],[856,313],[914,300],[948,305]].map(point)}
]);
// Traced bends and junctions follow the orange roads, not an invented spanning grid.
export const MASTER_ROADS=Object.freeze([
 {id:'west-north',points:[[177,247],[292,235],[383,211],[481,190],[552,202],[632,212],[704,232],[750,232],[837,225],[900,260],[945,289],[1004,307]]},
 {id:'west-south',points:[[292,235],[327,305],[346,361],[393,402],[355,433],[329,470]]},
 {id:'central-loop',points:[[481,190],[493,247],[558,274],[583,312],[656,340],[722,371],[784,341],[826,398],[928,384],[1004,307]]},
 {id:'middle-road',points:[[393,402],[472,430],[552,437],[608,441],[690,423],[757,436],[799,496],[780,575]]},
 {id:'east-road',points:[[928,384],[1009,389],[1084,401],[1105,436],[1179,404],[1246,402]]},
 {id:'southeast-road',points:[[1105,436],[1121,493],[1148,526],[1228,553],[1269,600],[1320,628],[1372,678]]},
 {id:'south-road',points:[[780,575],[845,595],[907,665],[1019,656],[1125,681],[1201,699],[1283,680],[1372,678]]},
 {id:'southwest-road',points:[[329,470],[399,499],[480,509],[558,499],[638,531],[680,589],[675,650],[651,728],[752,690],[845,595]]}
].map(r=>({...r,kind:'road',width:76,points:r.points.map(point)})));
export function contains(points,x,y){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
export function segmentDistance(p,a,b){const x=b.x-a.x,y=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y||1)));return Math.hypot(p.x-a.x-t*x,p.y-a.y-t*y);}
export function onMasterRoad(x,y,margin=0){return MASTER_ROADS.some(r=>r.points.slice(1).some((b,i)=>segmentDistance({x,y},r.points[i],b)<r.width/2+margin));}
export function masterWater(x,y){if(!contains(MASTER_POLYGONS[0].points,x,y))return true;if(MASTER_POLYGONS.some(s=>s.kind==='water'&&contains(s.points,x,y)))return true;return MASTER_RIVERS.some(r=>r.points.slice(1).some((b,i)=>segmentDistance({x,y},r.points[i],b)<r.width/2));}
export function masterBlocked(x,y){return masterWater(x,y)&&!onMasterRoad(x,y,12);}
const boxes=new Map(MASTER_POLYGONS.map(p=>[p.id,{l:Math.min(...p.points.map(v=>v.x)),r:Math.max(...p.points.map(v=>v.x)),t:Math.min(...p.points.map(v=>v.y)),b:Math.max(...p.points.map(v=>v.y))}]));
export function localMasterPolygons(p,radius=1600){return MASTER_POLYGONS.filter(s=>{const b=boxes.get(s.id);return s.kind==='land'||b.l<p.x+radius&&b.r>p.x-radius&&b.t<p.y+radius&&b.b>p.y-radius;});}
export function createMasterLayout(){
 const safe=MASTER_LANDMARKS.filter(l=>l.kind==='trader').map(l=>({...l,id:'day2-master-'+l.id,landmarkId:l.id,faction:'neutral',traderZone:true,safe:true,radius:1450}));
 const settlements=[...safe,...MASTER_LANDMARKS.filter(l=>l.kind==='village').map(l=>({...l,faction:'neutral',traderZone:false,safe:false}))];
 const castles=MASTER_LANDMARKS.filter(l=>l.kind==='castle').map(l=>({...l,kind:'keep',style:'Castle',halfWidth:195,depth:160,size:700}));
 const buildings=[...castles];const paths=[];
 for(const s of settlements){const count=s.traderZone?5:12;for(let i=0;i<count;i++){const angle=i*2*Math.PI/count+.3+Math.sin(i*2.7)*.075,rx=(s.traderZone?470:900)*(1+Math.sin(i*1.9)*.12),ry=(s.traderZone?420:700)*(1+Math.cos(i*2.3)*.12),x=Math.round(s.x+Math.cos(angle)*rx),y=Math.round(s.y+Math.sin(angle)*ry),role=s.traderZone?['smithy','bank','workshop','merchant','missions'][i]:null;const b={id:s.traderZone?s.id+'-'+role:'master-'+s.id+'-home-'+i,name:s.traderZone?s.name+' '+(role==='workshop'?'Crafting Hall':role):s.name+' Home '+(i+1),kind:'house',x,y,halfWidth:125,depth:80,size:430,faction:'neutral',...(role?{role,artRole:role==='missions'?'workshop':role}:{houseDesign:['hut','cottage','farmhouse','townhouse','manor'][i%5],tier:i%5+1,housingStatus:i%3===0?'occupied':'vacant',artRole:'residence'})};const hub=traderHub(b.id);if(hub){b.name=hub.name;b.traderTheme=hub.theme;b.affiliation=hub.affiliation;}buildings.push(b);paths.push({id:'approach-'+b.id,kind:'path',width:24,points:[{x:s.x,y:s.y},{x:b.x,y:b.y+190},{x:b.x,y:b.y+35}]});}}
 const resources=[];let seed=71;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<9000;i++){const x=random()*MASTER_SIZE.width,y=random()*MASTER_SIZE.height;if(masterBlocked(x,y)||onMasterRoad(x,y,100)||buildings.some(b=>Math.abs(x-b.x)<b.halfWidth+250&&Math.abs(y-b.y)<b.depth+350)||settlements.some(s=>Math.hypot(s.x-x,s.y-y)<1600))continue;const forest=MASTER_POLYGONS.some(s=>s.kind==='forest'&&contains(s.points,x,y));if(!forest&&i%6)continue;resources.push({id:'master-resource-'+i,x,y,kind:forest?'wood':i%3?'fiber':'stone',remaining:12,readyAt:0});}
 for(const path of paths)path.points=clearPath(path.points[0],path.points.at(-1),buildings);
 for(const s of settlements){let nearest,best=Infinity;for(const road of MASTER_ROADS)for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((s.x-a.x)*dx+(s.y-a.y)*dy)/(dx*dx+dy*dy))),q={x:a.x+t*dx,y:a.y+t*dy},d=Math.hypot(q.x-s.x,q.y-s.y);if(d<best&&!buildings.some(h=>Math.abs(q.x-h.x)<h.halfWidth+30&&q.y>h.y-h.depth-30&&q.y<h.y+30)){nearest=q;best=d;}}paths.push({id:'link-'+s.id,kind:'path',width:30,points:clearPath(nearest,{x:s.x,y:s.y},buildings)});}
 return {...MASTER_SIZE,settlements,buildings,castles,roads:[...MASTER_ROADS,...paths],streams:MASTER_RIVERS,resources,protection:{zones:safe},activationReady:false};
}

const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return(n^(n>>>16))>>>0;};
export function ensureMasterResources(state,p,buildings){
 if(p.interior)return;state.masterResourceChunks??={};
 const cell=768,cx=Math.floor(p.x/cell),cy=Math.floor(p.y/cell);
 for(let x=cx-2;x<=cx+2;x++)for(let y=cy-2;y<=cy+2;y++){const key=x+','+y;if(state.masterResourceChunks[key]||x<0||y<0||x*cell>=MASTER_SIZE.width||y*cell>=MASTER_SIZE.height)continue;state.masterResourceChunks[key]=true;
  for(let i=0;i<8;i++){const seed=hash(x*73856093^y*19349663^i*83492791),px=x*cell+60+seed%648,py=y*cell+60+hash(seed)%648;
   if(masterBlocked(px,py)||onMasterRoad(px,py,110)||MASTER_LANDMARKS.some(l=>Math.hypot(l.x-px,l.y-py)<1500)||buildings.some(b=>Math.abs(b.x-px)<b.halfWidth+230&&Math.abs(b.y-py)<b.depth+320))continue;
   const forest=MASTER_POLYGONS.some(s=>s.kind==='forest'&&contains(s.points,px,py));if(!forest&&i>1)continue;
   state.resources.push({id:'master-chunk-'+key+'-'+i,x:px,y:py,kind:forest?'wood':seed%12===0?'stone':'fiber',remaining:12,readyAt:0});
  }
 }
}


// Reject entire parcels crossing coastline/lakes, including narrow inlets and a
// lake fully enclosed by the parcel. River corridors are checked by housing.
export function masterLandRectangle(box){
 const corners=[{x:box.left,y:box.top},{x:box.right,y:box.top},{x:box.right,y:box.bottom},{x:box.left,y:box.bottom}];
 if(corners.some(p=>masterWater(p.x,p.y)))return false;
 for(const poly of MASTER_POLYGONS.filter(p=>['land','water'].includes(p.kind))){
  if(poly.points.some(p=>p.x>box.left&&p.x<box.right&&p.y>box.top&&p.y<box.bottom))return false;
  for(let i=0;i<poly.points.length;i++){const a=poly.points[i],b=poly.points[(i+1)%poly.points.length];let lo=0,hi=1;for(const [v,d,min,max]of[[a.x,b.x-a.x,box.left,box.right],[a.y,b.y-a.y,box.top,box.bottom]]){if(!d){if(v<min||v>max){lo=1;hi=0;}}else{let t=(min-v)/d,u=(max-v)/d;if(t>u)[t,u]=[u,t];lo=Math.max(lo,t);hi=Math.min(hi,u);}}if(lo<=hi)return false;}
 }return true;
}


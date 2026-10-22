import {HOUSE_DESIGNS} from './housing-catalog.mjs';
/** Profile-scoped Day 2 travel map. Two faction trader zones and a non-trading central village.
 * Active only when the separate day2-compact profile is selected.
 * No filesystem, environment, saved-state or global catalogue mutations. */
const SIZE=6860;
const point=(x,y)=>({x,y});
function curve(points){
 const out=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
  const steps=Math.max(8,Math.ceil(Math.max(Math.hypot(c.x-b.x,c.y-b.y),Math.hypot(b.x-a.x,b.y-a.y),Math.hypot(d.x-c.x,d.y-c.y))/24));
  for(let j=0;j<steps;j++){const t=j/steps,t2=t*t,t3=t2*t;const v=k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3);out.push(point(v('x'),v('y')));}
 }out.push({...points.at(-1)});return out;
}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len)):0;return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
export function blocks(buildings,x,y,padding=10){return buildings.some(b=>x>b.x-b.halfWidth-padding&&x<b.x+b.halfWidth+padding&&y>b.y-b.depth-padding&&y<b.y+10+padding);}
export function createDay2Layout(day4=false){
 const settlements=[{id:'day2-survivor',name:'Survivor Traders',faction:'survivor',traderZone:true,x:700,y:700},{id:'day2-neutral',name:'Crossroads Village',faction:'neutral',traderZone:false,x:3430,y:3430},{id:'day2-bandit',name:'Bandit Traders',faction:'bandit',traderZone:true,x:6160,y:6160}];
 const roles=[['smithy','Blacksmith',-295,-260,125,85],['bank','Bank',245,-190,120,100],['workshop','Crafting Workshop',-330,200,140,85],['merchant','Merchant',270,260,125,80]];
 const buildings=settlements.flatMap((s,si)=>roles.map(([role,name,dx,dy,halfWidth,depth],i)=>({id:s.id+'-'+role,name:s.name+' '+(si===1&&!day4?['Forge','Meeting Hall','Craft Hall','Farmhouse'][i]:name),artRole:si===1&&!day4&&['bank','merchant'].includes(role)?'workshop':role,traderZone:s.traderZone,shop:si===1&&!day4?['VILLAGE FORGE','MEETING HALL','CRAFT HALL','FARMHOUSE'][i]:role==='smithy'?'Smithy':role==='merchant'?'Provisioner':role==='bank'?'BANK':'CRAFTING WORKSHOP',role,kind:'house',style:role,faction:s.faction,x:s.x+dx+(si===2?[30,-25,15,-35][i]:0),y:s.y+dy+(si===2?[-15,25,-30,20][i]:0),halfWidth,depth})));
 if(day4){
  for(const b of buildings.filter(b=>b.faction!=='neutral')){if(b.role==='bank')b.shop='BANK & CHARACTER MASTER';if(b.role==='workshop')b.shop='CRAFTING & MISSIONS';}
  const names=['Willow Cottage','Miller’s Farmhouse','Ash Hut','Oak Townhouse','Rose Cottage','Hill Manor','Weaver’s Cottage','Orchard Farmhouse','Hazel Hut','Stone Townhouse','Brook Cottage','Thatcher’s Farmhouse','Birch Hut','Foxglove Cottage','Old Mill Manor'];
  const designs=['cottage','farmhouse','hut','townhouse','cottage','manor','cottage','farmhouse','hut','townhouse','cottage','farmhouse','hut','cottage','manor'];
  const oldIds=buildings.filter(b=>b.faction==='neutral').map(b=>b.id);
  for(let i=buildings.length-1;i>=0;i--)if(buildings[i].faction==='neutral')buildings.splice(i,1);
  for(let i=0;i<15;i++){
   const d=HOUSE_DESIGNS.find(d=>d.id===designs[i]),side=i%2?-1:1,row=Math.floor(i/2),x=3430+side*(390+[0,95,35,125,60,15,110,45][row]),y=2500+row*255+(i%2?105:0);
   buildings.push({id:oldIds[i]||'day4-village-home-'+(i+1),name:names[i],artRole:'residence',traderZone:false,shop:'FOR SALE',role:'residence',kind:'house',style:'Cottage',faction:'neutral',x,y,halfWidth:d.width/2,depth:d.depth-10,houseDesign:d.id,tier:d.tier,housingStatus:'vacant'});
  }
 }
 const roads=[{id:'day2-main-road',kind:'road',width:64,points:curve(day4?[settlements[0],point(700,1250),point(1900,2000),point(3430,2200),point(3430,2400),settlements[1],point(3430,4550),point(4700,5200),point(6160,5650),point(6160,5920),settlements[2]]:[settlements[0],point(700,1250),point(1900,2350),point(3430,2950),point(3430,3200),settlements[1],point(3430,4000),point(4700,5200),point(6160,5650),point(6160,5920),settlements[2]])}];
 if(day4)roads.push({id:'crossroads-village-lane',kind:'path',width:46,points:curve([point(3430,2400),point(3430,2900),point(3430,3430),point(3430,4000),point(3430,4500)])});
 for(const s of settlements)for(const b of buildings.filter(b=>b.faction===s.faction)){
  const door=point(b.x,b.y+45),junction=point(s.x+(b.x-s.x)*.35,s.y+(door.y-s.y)*.35);
  const points=day4&&s.faction==='neutral'?[point(3430,b.y+60),point(3430+(b.x-3430)*.45,b.y+65),point(b.x,b.y+60),door]:b.y>s.y?[s,point(s.x,b.y+175),point(b.x,b.y+175),door]:[s,junction,point(b.x,b.y+140),door];
  roads.push({id:b.id+'-approach',kind:'path',width:34,points:curve(points)});
 }
 const streams=[{id:'day2-river',width:32,points:curve([point(90,1320),point(700,1250),point(1500,1000),point(2200,1650),point(4000,1500),point(5600,1200),point(6770,1800)])}];
 const bridges=[{id:'day2-stone-bridge',x:700,y:1250,width:100,length:180}];
 const nearLine=(p,lines,margin)=>lines.some(l=>l.points.slice(1).some((b,i)=>segmentDistance(p,l.points[i],b)<l.width/2+margin));
 const resources=[];
 // Stable low-density woodland clusters, fewer exposed rocks; no milk/eggs in woodland.
 for(let i=0;i<950;i++){
  const p=point(90+(i*947)%(SIZE-180),90+(i*1583)%(SIZE-180));
  if(overlapsBuildingArt(p,buildings)||blocks(buildings,p.x,p.y,220)||settlements.some(s=>Math.hypot(p.x-s.x,p.y-s.y)<190)||buildings.some(b=>Math.abs(p.x-b.x)<85&&p.y>b.y&&p.y<b.y+185)||nearLine(p,roads,50)||nearLine(p,streams,45))continue;
  const kind=i%19===0?'ironOre':i%13===0?'stone':i%5===0?'fiber':i%11===0?'herb':'wood';
  resources.push({id:'day2-resource-'+i,...p,kind,remaining:12,readyAt:0});
 }
 return {id:'day2-travel-v3',layoutVersion:3,width:SIZE,height:SIZE,settlements,buildings,roads,streams,bridges,resources,protection:{status:'approved-layout',zones:settlements.filter(s=>s.traderZone).map(s=>({id:s.id+'-safe',townId:s.id,x:s.x,y:s.y,radius:560,faction:s.faction}))},activationReady:false};
}


/** Conservative projected sprite envelopes prevent canopies from covering rooftops. */
export function overlapsBuildingArt(p,buildings){const x=p.x-p.y,y=(p.x+p.y)*.5;return buildings.some(b=>{const bx=b.x-b.y,by=(b.x+b.y)*.5;return x+135>bx-300&&x-135<bx+300&&y+20>by-330&&y-180<by+100;});}

/** Profile-scoped safety query; never used by the production world implicitly. */
export function day2Protected(layout,position){
 const p=position.interior?layout.buildings.find(b=>b.id===position.interior):position;
 return !!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&layout.protection.zones.some(z=>Math.hypot(p.x-z.x,p.y-z.y)<=z.radius);
}



/** Approved 2800-square Day 2 efficiency map. Selected explicitly; never replaces other profiles. */
import {overlapsBuildingArt} from './day2-layout.mjs';
const SIZE=2800;
const point=(x,y)=>({x,y});
function curve(points){
 const out=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
  const steps=Math.max(8,Math.ceil(Math.hypot(c.x-b.x,c.y-b.y)/24));
  for(let j=0;j<steps;j++){const t=j/steps,t2=t*t,t3=t2*t;const v=k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3);out.push(point(v('x'),v('y')));}
 }out.push({...points.at(-1)});return out;
}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len)):0;return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
export function blocks(buildings,x,y,padding=10){return buildings.some(b=>x>b.x-b.halfWidth-padding&&x<b.x+b.halfWidth+padding&&y>b.y-b.depth-padding&&y<b.y+10+padding);}
export function createEfficiencyLayout(){
 const settlements=[{id:'day2-survivor',name:'Survivor Village',faction:'survivor',x:550,y:550},{id:'day2-neutral',name:'Trader Town',faction:'neutral',x:1350,y:1350},{id:'day2-bandit',name:'Bandit Camp',faction:'bandit',x:2250,y:2200}];
 for(const town of settlements)town.traderZone=true;
 const roles=[['smithy','Blacksmith',-295,-260,125,85],['bank','Bank',245,-190,120,100],['workshop','Crafting Workshop',-330,200,140,85],['merchant','Merchant',270,260,125,80]];
 const buildings=settlements.flatMap((s,si)=>roles.map(([role,name,dx,dy,halfWidth,depth],i)=>({id:s.id+'-'+role,name:s.name+' '+name,shop:role==='smithy'?'Smithy':role==='merchant'?'Provisioner':role==='bank'?'BANK':'CRAFTING WORKSHOP',role,kind:'house',style:role,faction:s.faction,x:s.x+dx+(si===2?[30,-25,15,-35][i]:0),y:s.y+dy+(si===2?[-15,25,-30,20][i]:0),halfWidth,depth})));
 const roads=[{id:'day2-main-road',kind:'road',width:64,points:curve([settlements[0],point(550,980),point(950,1220),point(1350,1210),settlements[1],point(1350,1775),point(1740,2030),point(2250,2050),settlements[2]])}];
 for(const s of settlements)for(const b of buildings.filter(b=>b.faction===s.faction)){
  const door=point(b.x,b.y+45),junction=point(s.x+(b.x-s.x)*.35,s.y+(door.y-s.y)*.35);
  roads.push({id:b.id+'-approach',kind:'path',width:34,points:curve(b.y>s.y?[s,point(s.x,b.y+175),point(b.x,b.y+175),door]:[s,junction,point(b.x,b.y+140),door])});
 }
 const streams=[{id:'day2-river',width:32,points:curve([point(90,1030),point(550,980),point(670,960),point(690,580),point(950,280),point(1130,80)])}];
 const bridges=[{id:'day2-stone-bridge',x:550,y:980,width:100,length:180}];
 const nearLine=(p,lines,margin)=>lines.some(l=>l.points.slice(1).some((b,i)=>segmentDistance(p,l.points[i],b)<l.width/2+margin));
 const resources=[];
 // Stable low-density woodland clusters, fewer exposed rocks; no milk/eggs in woodland.
 for(let i=0;i<280;i++){
  const p=point(90+(i*947)%(SIZE-180),90+(i*1583)%(SIZE-180));
  if(overlapsBuildingArt(p,buildings)||blocks(buildings,p.x,p.y,80)||settlements.some(s=>Math.hypot(p.x-s.x,p.y-s.y)<190)||buildings.some(b=>Math.abs(p.x-b.x)<85&&p.y>b.y&&p.y<b.y+185)||nearLine(p,roads,50)||nearLine(p,streams,45))continue;
  const kind=i%19===0?'ironOre':i%13===0?'stone':i%5===0?'fiber':i%11===0?'herb':'wood';
  resources.push({id:'day2-resource-'+i,...p,kind,remaining:12,readyAt:0});
 }
 return {id:'day2-compact-v2',width:SIZE,height:SIZE,settlements,buildings,roads,streams,bridges,resources,protection:{status:'approved-layout',zones:[{id:'day2-neutral-safe',townId:'day2-neutral',x:1350,y:1350,radius:560,faction:'neutral'}]},activationReady:true};
}


/** Profile-scoped safety query; never used by the production world implicitly. */
export function day2Protected(layout,position){
 const p=position.interior?layout.buildings.find(b=>b.id===position.interior):position;
 return !!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&layout.protection.zones.some(z=>Math.hypot(p.x-z.x,p.y-z.y)<=z.radius);
}



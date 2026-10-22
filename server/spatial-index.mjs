// Static position index stores object references: harvest depletion remains authoritative.
const cache=new WeakMap();const CELL=512;
export function staticNearby(items,p,radius=900){
 let index=cache.get(items);
 if(!index||index.length!==items.length){const cells=new Map();for(const o of items){const key=Math.floor(o.x/CELL)+','+Math.floor(o.y/CELL);let list=cells.get(key);if(!list)cells.set(key,list=[]);list.push(o);}index={cells,length:items.length,order:new Map(items.map((o,i)=>[o,i]))};cache.set(items,index);}
 const found=[];for(let x=Math.floor((p.x-radius)/CELL);x<=Math.floor((p.x+radius)/CELL);x++)for(let y=Math.floor((p.y-radius)/CELL);y<=Math.floor((p.y+radius)/CELL);y++)for(const o of index.cells.get(x+','+y)||[])if((o.interior||null)===(p.interior||null)&&Math.hypot(o.x-p.x,o.y-p.y)<radius)found.push(o);
 return found.sort((a,b)=>index.order.get(a)-index.order.get(b));
}


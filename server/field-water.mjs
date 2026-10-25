import {MASTER_POLYGONS,MASTER_RIVERS,contains,segmentDistance} from './master-geography.mjs';
import {VILLAGES,ITEMS} from './catalog.mjs';
import {fieldId} from './field-catalog.mjs';
import {grantFieldLot} from './field-inventory.mjs';

export function freshWaterSource(p){
 if(VILLAGES.some(v=>Math.hypot(v.x-p.x,v.y-p.y)<100))return 'villageWell';
 if(MASTER_POLYGONS.some(s=>s.kind==='water'&&contains(s.points,p.x,p.y)))return 'lake';
 if(MASTER_POLYGONS.some(s=>s.kind==='water'&&s.points.some((q,i)=>segmentDistance(p,q,s.points[(i+1)%s.points.length])<120)))return 'lake';
 if(MASTER_RIVERS.some(r=>r.points.slice(1).some((b,i)=>segmentDistance(p,r.points[i],b)<r.width/2+100)))return 'river';
 return null;
}
export function collectFieldWater(r,p){
 if(p.interior||p.hp<=0)throw Error('Reach a freshwater source outdoors');
 const source=freshWaterSource(p);if(!source)throw Error('Reach a village well, lake, or river');
 if(!Object.entries(p.inventory).some(([id,n])=>n>0&&(id==='waterskin'||ITEMS[id]?.fieldWaterskin)))throw Error('Carry a waterskin');
 const baseId=fieldId(source==='villageWell'?'cleanWater':'unsafeWater');
 return grantFieldLot(r,p.inventory,baseId,5,{provenance:{source,x:Math.round(p.x),y:Math.round(p.y)}});
}

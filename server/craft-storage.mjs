import {ownedHousing} from './housing.mjs';
const cell=p=>`${Math.floor(p.x/256)},${Math.floor(p.y/256)}`;
// Craft locally from owned base chests only. Never reach into loot or distant bases.
export function craftingContainers(r,p){
 if(p.hp<=0)return [];if(p.interior){const home=ownedHousing(r.state,p);if(!home||home.buildingId!==p.interior)return [];return Object.entries(r.state.containers||{}).filter(([id])=>id.startsWith('fixture:'+p.interior+':')).map(([id,c])=>({id,items:c.items||{}}));}
 const here=cell(p);
 return Object.values(r.state.structures).filter(s=>s.kind==='chest'&&!s.interior&&!s.abandonedAt&&s.hp>0&&r.owns(p,s)&&(!s.settlementId?cell(s)===here:(()=>{const land=r.state.settlements?.[s.settlementId];return land?.propertyId?Math.hypot(p.x-land.x,p.y-land.y)<=300&&Math.hypot(p.x-s.x,p.y-s.y)<=150:land?.cell===here&&cell(s)===here;})())).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
}
export function craftingStorageView(r,p){const total={};for(const c of craftingContainers(r,p))for(const [id,n] of Object.entries(c.items||{}))total[id]=(total[id]||0)+n;return total;}
export function consumeCraftMaterials(inventory,stores,needs){
 const sources=[inventory,...stores];
 for(const [k,n] of Object.entries(needs))if(sources.reduce((sum,s)=>sum+(s[k]||0),0)<n)throw Error('Missing materials');
 for(const [k,n] of Object.entries(needs)){let remaining=n;for(const source of sources){const take=Math.min(source[k]||0,remaining);if(take){source[k]-=take;if(!source[k])delete source[k];remaining-=take;}if(!remaining)break;}}
}
export function payCraft(r,p,recipe){consumeCraftMaterials(p.inventory,craftingContainers(r,p).map(c=>c.items||{}),recipe.needs);}



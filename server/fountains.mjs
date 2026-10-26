import {FACTION_TOWNS} from './master-rules.mjs';
import {APPROVED_WORLD} from './world-profile.mjs';
export const FOUNTAINS=Object.freeze(FACTION_TOWNS.filter(t=>t.traderZone!==false).map(t=>{const camp=APPROVED_WORLD&&t.id==='day2-bandit';return Object.freeze({id:'fountain:'+t.id,name:camp?'Camp Well':'Town Fountain',x:t.x+(camp?-340:0),y:t.y+(camp?110:0),kind:'fountain'});}));
export function nearbyFountains(p){return p.interior?[]:FOUNTAINS.filter(f=>Math.hypot(f.x-p.x,f.y-p.y)<900);}
export function refillFountain(r,p,id){const f=FOUNTAINS.find(f=>f.id===id);if(!f||p.interior||p.hp<=0||Math.hypot(f.x-p.x,f.y-p.y)>100)throw Error('Approach the town fountain');p.thirst=Math.min(100,p.thirst+40);if(p.inventory.waterskin>0)p.inventory.water=Math.min(20,(p.inventory.water||0)+5);}


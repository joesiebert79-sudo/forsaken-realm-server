import {MASTER,LAYOUT} from './world-profile.mjs';
import {MAP_SCALE,MASTER_LANDMARKS} from './master-geography.mjs';
// Migrate only saved outdoor coordinates. Account identity and item counts stay intact.
export function migrateMap(state){
 if(!MASTER)return;const old=state.mapScale??130;if(old===MAP_SCALE)return;
 if(!Number.isFinite(old)||old<=0)throw Error('Invalid saved map scale');
 const ratio=MAP_SCALE/old;
 const move=(x,y)=>{let nearest=null,distance=2500;for(const l of MASTER_LANDMARKS){const ox=l.x/ratio,oy=l.y/ratio,d=Math.hypot(x-ox,y-oy);if(d<distance){nearest={x:ox,y:oy,nx:l.x,ny:l.y};distance=d;}}return nearest?{x:nearest.nx+x-nearest.x,y:nearest.ny+y-nearest.y}:{x:x*ratio,y:y*ratio};};
 const seen=new WeakSet();
 function visit(o){if(!o||typeof o!=='object'||seen.has(o))return;seen.add(o);if(!o.interior){for(const [x,y]of [['x','y'],['homeX','homeY'],['spawnX','spawnY'],['targetX','targetY'],['startX','startY']])if(Number.isFinite(o[x])&&Number.isFinite(o[y])){const next=move(o[x],o[y]);o[x]=next.x;o[y]=next.y;}}for(const [k,v]of Object.entries(o))if(!['receipts','transactions','shop','merchants','resources','claims','interiorState','housingProposal'].includes(k))visit(v);}
 visit(state);
 const claims={};for(const [cell,claim]of Object.entries(state.claims||{})){const [x,y]=cell.split(',').map(Number),pos=move((x+.5)*256,(y+.5)*256),key=Math.floor(pos.x/256)+','+Math.floor(pos.y/256);if(claims[key])throw Error('Map resize would overlap saved claims; original world is preserved');claims[key]=claim;}state.claims=claims;
 for(const group of ['settlements','npcSettlements','structures'])for(const o of Object.values(state[group]||{}))if(o.cell&&Number.isFinite(o.x))o.cell=Math.floor(o.x/256)+','+Math.floor(o.y/256);
 const resources=new Map((state.resources||[]).map(n=>[n.id,n]));state.resources=LAYOUT.resources.map(n=>({...n,...(resources.has(n.id)?{remaining:resources.get(n.id).remaining,readyAt:resources.get(n.id).readyAt}:{})}));
 state.masterResourceChunks={};state.masterEncounterChunks={};state.mapScale=MAP_SCALE;state.mapMigration={from:old,to:MAP_SCALE,version:'0.77'};
 for(const [id,cells]of Object.entries(state.exploration||{})){const next={};for(const key of Object.keys(cells)){const [x,y]=key.split(',').map(Number);const p=move((x+.5)*75,(y+.5)*75);if(Number.isFinite(p.x)&&Number.isFinite(p.y))next[Math.floor(p.x/75)+','+Math.floor(p.y/75)]=true;}state.exploration[id]=next;}
 for(const a of Object.values(state.accounts||{}))delete a.housingProposal;
 for(const p of Object.values(state.players||{})){p.openMerchant=null;p.openService=null;p.openContainer=null;}
}

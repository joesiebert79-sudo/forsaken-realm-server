import {randomUUID} from 'node:crypto';
import {MASTER_POLYGONS,MASTER_RIVERS,contains,segmentDistance,masterBlocked} from './master-geography.mjs';
import {WILDLIFE_SPECIES,BIOME_SPAWNS} from './wildlife-catalog.mjs';
import {fieldId} from './field-catalog.mjs';
import {grantFieldLot} from './field-inventory.mjs';
import {ITEMS,WORLD} from './catalog.mjs';
import {weaponReady,spendAttack,shotHits,ammoDamage} from './weapon-actions.mjs';
import {weaponDamage} from './skill-balance.mjs';
import {clearDefensiveStrike} from './base-defenses.mjs';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const hash=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);return(n^(n>>>16))>>>0;};
const waterAt=(x,y)=>MASTER_POLYGONS.some(s=>s.kind==='water'&&contains(s.points,x,y))||MASTER_RIVERS.some(r=>r.points.slice(1).some((b,i)=>segmentDistance({x,y},r.points[i],b)<r.width/2));
export function wildlifeBiome(x,y){
 if(waterAt(x,y))return 'river';
 for(const [kind,biome]of [['marsh','wetland'],['mountain','mountain'],['forest','forest']])if(MASTER_POLYGONS.some(s=>s.kind===kind&&contains(s.points,x,y)))return biome;
 return contains(MASTER_POLYGONS[0].points,x,y)?'plains':null;
}
export function chooseSpecies(biome,seed){const rows=BIOME_SPAWNS[biome]||[];let total=rows.reduce((n,r)=>n+r.weight,0),position=(hash(seed)/4294967296)*total;for(const row of rows){position-=row.weight;if(position<0)return row.species;}return null;}
export function createWildlife(species,x,y,now,id='wild:'+randomUUID()){
 const def=WILDLIFE_SPECIES[species];if(!def||def.domestic)throw Error('Domestic animals require an owner and may not be wild spawns');
 return {id,species,x,y,homeX:x,homeY:y,hp:def.maxHp,maxHp:def.maxHp,spawnAt:now,mode:'graze',direction:0,lastMoveAt:now,lastSensedAt:0,woundedAt:0,killedAt:0,harvestedAt:0,tracks:[],sex:hash(Math.floor(x)*31+Math.floor(y))%2?'female':'male'};
}
export function ensureWildlife(r,p){
 if(!r.wildlifeEnabled||p.interior)return;
 const state=r.state;state.wildlife??={};state.wildlifeChunks??={};const cell=768,cx=Math.floor(p.x/cell),cy=Math.floor(p.y/cell);
 for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++){
  const key=x+','+y;if(state.wildlifeChunks[key]||Object.keys(state.wildlife).length>=512)continue;state.wildlifeChunks[key]=true;
  for(let i=0;i<4;i++){const seed=hash(x*73856093^y*19349663^i*83492791),px=x*cell+70+seed%628,py=y*cell+70+hash(seed)%628;
   if(px<0||py<0||px>WORLD.width||py>WORLD.height||r.safe({x:px,y:py}))continue;
   const biome=wildlifeBiome(px,py);if(!biome||biome==='desert'||(biome==='river'?false:masterBlocked(px,py)))continue;
   const species=chooseSpecies(biome,seed);if(!species)continue;const animal=createWildlife(species,px,py,r.clock(),`wild:${key}:${i}`);state.wildlife[animal.id]=animal;
  }
 }
}
function visible(r,a,b){if(distance(a,b)>650)return false;for(let i=1;i<8;i++){const x=a.x+(b.x-a.x)*i/8,y=a.y+(b.y-a.y)*i/8;if(!WILDLIFE_SPECIES[a.species]?.fish&&r.blocks(x,y))return false;}return true;}
export function tickWildlife(r,dt){
 if(!r.wildlifeEnabled)return;const now=r.clock(),players=[...r.sessions.keys()].map(id=>r.state.players[id]).filter(p=>p&&p.hp>0&&!p.interior);r.state.wildlife??={};
 const windAngle=Math.floor(now/3600000)*2.399963229728653;
 for(const a of Object.values(r.state.wildlife)){
  const def=WILDLIFE_SPECIES[a.species];if(!def)continue;if(a.hp<=0){if(now-a.killedAt>600000)delete r.state.wildlife[a.id];continue;}
  if(!players.some(p=>distance(a,p)<1100))continue;
  const before={x:a.x,y:a.y};let threat=null;
  for(const p of players){const d=distance(a,p),sight=d<def.sight&&visible(r,a,p),noise=d<def.hearing*(p.stalking?.5:1)&&now-(p.animationMotion?.lastAt||0)<300;
   const wx=Math.cos(windAngle),wy=Math.sin(windAngle),downwind=(p.x-a.x)*wx+(p.y-a.y)*wy;
   const scent=d<def.scent&&downwind>0;if(sight||noise||scent){if(!threat||d<distance(a,threat))threat=p;}
  }
  if(threat){a.lastSensedAt=now;a.mode=def.temperament==='predator'&&distance(a,threat)<110&&!r.safe(threat)?'threaten':'flee';}
  else if(now-a.lastSensedAt>10000){const phase=Math.floor(now/30000)+hash(a.id.length+a.homeX);a.mode=phase%4===0?'rest':def.fish?'swim':'graze';}
  const dir=threat?Math.atan2(a.y-threat.y,a.x-threat.x):hash(Math.floor(now/10000)+Math.floor(a.homeX)*17+Math.floor(a.homeY))%628/100;
  const speed=a.mode==='flee'?def.speed:a.mode==='threaten'?def.speed*.35:a.mode==='rest'?0:def.speed*.12;
  const nx=a.x+Math.cos(dir)*speed*dt,ny=a.y+Math.sin(dir)*speed*dt;
  if(nx>=0&&ny>=0&&nx<=WORLD.width&&ny<=WORLD.height&&(def.fish?waterAt(nx,ny):!r.blocks(nx,ny))){a.x=nx;a.y=ny;a.direction=dir;}
  if(distance(before,a)>2){a.lastMoveAt=now;if(now-(a.lastTrackAt||0)>1500){a.tracks.push({x:before.x,y:before.y,at:now,wounded:a.hp<a.maxHp});a.tracks=a.tracks.slice(-12);a.lastTrackAt=now;}}
 }
}
export function attackWildlife(r,p,command){
 const a=r.state.wildlife?.[command.target],def=WILDLIFE_SPECIES[a?.species],now=r.clock(),weapon=ITEMS[command.weapon];
 if(!r.wildlifeEnabled||!a||!def||!def.huntable||a.hp<=0||p.interior||r.safe(p)||r.safe(a))throw Error('Wild animal unavailable');
 if(p.blockUntil>now||p.dodgeUntil>now||p.mounted)throw Error('Finish your current action and dismount');
 if(!weapon?.damage||!(p.inventory[command.weapon]>0)||weapon.siegeEngine)throw Error('Weapon unavailable');
 if(weapon.blackpowder&&p.equippedWeapon!==command.weapon)throw Error('Equip your firearm first');
 if(distance(p,a)>weapon.range||!clearDefensiveStrike(r,p,a,weapon))throw Error('Wild animal out of reach or behind an obstacle');
 weaponReady(p,weapon,now);const damageType=spendAttack(r,p,weapon,now);p.attackDX=a.x-p.x;p.attackDY=a.y-p.y;p.lastAttack=now;
 if(!shotHits(weapon,distance(p,a))){p.lastShotMissed=true;return;}p.lastShotMissed=false;
 const damage=Math.max(1,Math.floor(ammoDamage(damageType,weaponDamage(p,weapon))));a.hp=Math.max(0,a.hp-damage);a.woundedAt=now;a.lastSensedAt=now;a.mode='flee';
 p.huntingProgress??={tracking:0,stalking:0,bow:0,skinning:0,butchering:0,fishing:0};
 if(command.weapon==='bow'||command.weapon==='longbow')p.huntingProgress.bow++;
 if(p.stalking)p.huntingProgress.stalking++;
 if(a.hp===0){a.killedAt=now;a.killedBy=p.id;a.quality=damage>=a.maxHp*.75?'damaged':a.woundedAt-a.spawnAt<30000?'common':'fine';}
}
export function harvestWildlife(r,p,command){
 const a=r.state.wildlife?.[command.target],def=WILDLIFE_SPECIES[a?.species],now=r.clock();
 if(!r.wildlifeEnabled||!a||!def||a.hp>0||a.harvestedAt||now-a.killedAt>600000||p.interior||distance(p,a)>95)throw Error('Carcass unavailable');
 if(def.juvenile||def.domestic||!def.huntable)throw Error('This animal cannot be harvested as wild game');
 if(!Object.entries(p.inventory).some(([id,n])=>n>0&&(ITEMS[id]?.fieldKnife||['axe','sickle'].includes(id))))throw Error('A knife or field cutting tool is required');
 a.harvestedAt=now;const result={};for(const [kind,amount]of Object.entries(def.yields)){
  if(kind==='roe'&&a.sex!=='female')continue;
  const id=grantFieldLot(r,p.inventory,fieldId(kind),amount,{quality:a.quality||'common',provenance:{species:a.species,carcass:a.id,sex:a.sex,killedBy:a.killedBy,biome:wildlifeBiome(a.x,a.y)}});
  result[id]=amount;
 }
 p.harvestResult={id:command.id,at:now,x:a.x,y:a.y,interior:null,items:result};
 p.huntingProgress??={tracking:0,stalking:0,bow:0,skinning:0,butchering:0,fishing:0};
 p.huntingProgress[def.fish?'fishing':'skinning']++;
 p.huntingProgress.butchering++;
 return result;
}
export function trackWildlife(r,p,command){
 const a=r.state.wildlife?.[command.target];if(!r.wildlifeEnabled||!a||p.interior||distance(p,a)>500)throw Error('No nearby trail');
 const tracks=a.tracks.filter(t=>r.clock()-t.at<120000&&distance(p,t)<130);
 if(!tracks.length)throw Error('No readable tracks nearby');
 p.huntingProgress??={tracking:0,stalking:0,bow:0,skinning:0,butchering:0,fishing:0};p.huntingProgress.tracking++;
 p.lastWildlifeTrack={species:a.species,at:r.clock(),x:tracks.at(-1).x,y:tracks.at(-1).y,wounded:tracks.at(-1).wounded};
}
export function wildlifeView(r,p){return !r.wildlifeEnabled||p.interior?[]:Object.values(r.state.wildlife||{}).filter(a=>distance(p,a)<700&&visible(r,a,p)).map(a=>({id:a.id,species:a.species,kind:'wildlife',x:a.x,y:a.y,hp:a.hp,maxHp:a.maxHp,mode:a.mode,direction:a.direction,lastMoveAt:a.lastMoveAt,killedAt:a.killedAt,harvestedAt:a.harvestedAt,wounded:a.hp>0&&a.hp<a.maxHp,balanceStatus:'draft-playtest'}));}

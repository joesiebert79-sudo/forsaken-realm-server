import {randomInt} from 'node:crypto';
import {ITEMS} from './catalog.mjs';
export function ammunition(p,w){const selected=ITEMS[p.selectedAmmo];return w.blackpowder&&selected?.blackpowderAmmo?p.selectedAmmo:w.ammo;}
export function weaponReady(p,w,now,actor=p){if(now<(p.nextAttackAt||0)||now<(actor.nextAttackAt||0)||now-(actor.lastAttack||0)<(w.reloadMs||800)||p.stamina<10)throw Error('Weapon reloading / attack cooldown or stamina too low');}
export function spendAttack(r,p,w,now,actor=p){const ammo=ammunition(p,w);if(ammo)r.pay(p,{[ammo]:1});p.stamina-=10;actor.nextAttackAt=now+(w.reloadMs||800);p.nextAttackAt=now+(w.reloadMs||800);return ITEMS[ammo]?.ammoType||w.damageType||(w.blackpowder?'blackpowder':'physical');}
export function shotHits(w,distance,roll=randomInt(10000)){if(!w.blackpowder)return true;const chance=distance<=w.range*.25?1:Math.max(.65,1-(distance/w.range-.25)*.4);return roll<chance*10000;}
export const ammoDamage=(type,damage)=>damage*(type==='explosive'?1.15:type==='poison'?.8:1);




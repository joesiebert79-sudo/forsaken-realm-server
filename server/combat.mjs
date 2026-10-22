import {skillRank} from './skill-balance.mjs';
import {armorProtection} from './armor.mjs';
import {ITEMS} from './catalog.mjs';
export const canBlock=p=>p.equippedShield===true&&(p.inventory.shield||0)>0;
export function defend(p,damage,now,type="physical"){if((p.dodgeUntil||0)>now)return 0;if(p.armorSlots)damage=armorProtection(p,damage,type);let reduction=0;for(const key of [p.equippedArmour,p.equippedHelmet])if(!p.armorSlots&&key&&p.inventory[key]>0)reduction+=ITEMS[key]?.armour||0;damage=Math.max(1,Math.ceil(damage*(1-Math.min(.35,reduction))));if(canBlock(p)&&(p.blockUntil||0)>now&&p.stamina>=8){p.stamina-=8;return Math.max(1,Math.ceil(damage*.3*(1-skillRank(p,'shieldDrill')*.03)));}return damage;}
export function block(p,enabled,now){if(!enabled){p.blockUntil=0;return;}if(!canBlock(p))throw Error('Equip a shield to block');if(p.stamina<8)throw Error('Not enough stamina to block');if((p.dodgeUntil||0)>now)throw Error('Finish your dodge first');p.blockUntil=now+350;}
export function dodge(p,command,now,blocked,bounds){if(!Number.isFinite(command.dx)||!Number.isFinite(command.dy)||Math.hypot(command.dx,command.dy)<.01)throw Error('Choose a dodge direction');if(now<(p.nextDodge||0)||p.stamina<20)throw Error('Dodge is recovering or stamina is low');const length=Math.hypot(command.dx,command.dy),dx=command.dx/length*8,dy=command.dy/length*8;let x=p.x,y=p.y;for(let i=0;i<10;i++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>bounds.width||ny>bounds.height||blocked(nx,ny))break;x=nx;y=ny;}if(Math.hypot(x-p.x,y-p.y)<1)throw Error('No room to dodge');p.x=x;p.y=y;p.stamina-=20;p.blockUntil=0;p.dodgeUntil=now+250;p.nextDodge=now+1200;}

export function clearStrike(a,b,blocked){const distance=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.ceil(distance/8);for(let i=1;i<steps;i++){const t=i/steps;if(blocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;}
export function recordHit(attacker,victim,weapon,damage,now){attacker.attackDX=victim.x-attacker.x;attacker.attackDY=victim.y-attacker.y;attacker.attackWeapon=weapon;attacker.lastAttack=now;attacker.lastCombatTarget=victim.id;victim.lastAttackerId=attacker.id;const applied=Math.min(victim.hp,Math.max(0,damage));victim.hp=Math.max(0,victim.hp-applied);victim.lastHitAt=now;victim.lastHitDamage=applied;return applied;}





// Presentation state only. Damage, movement, collision and inventory remain server-owned.
export const ACTOR_ACTIONS=Object.freeze({idle:{frames:12,fps:6,loop:true},walk:{frames:12,fps:10,loop:true},run:{frames:16,fps:16,loop:true},attack:{frames:12,fps:12},hit:{frames:6,fps:12},death:{frames:12,fps:10},special:{frames:16,fps:12},turn:{frames:4,fps:12}});
export const classActorId=role=>({melee:'warrior',ranged:'archer',mage:'mage',rogue:'rogue',paladin:'paladin',necromancer:'necromancer'}[role]||null);
export function direction16(dx,dy,fallback=0){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<.001)return fallback;
 return (Math.round(Math.atan2(dy,dx)/(Math.PI/8))+16)%16;
}
export function recordActorMotion(actor,before,now,running=false){
 const dx=actor.x-before.x,dy=actor.y-before.y;
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<.01)return;
 const action=running?'run':'walk',old=actor.animationMotion;
 actor.animationMotion={action,direction:direction16(dx,dy),startedAt:old?.action===action&&now-old.lastAt<=250?old.startedAt:now,lastAt:now};
}
export function actorAnimation(actor,now,entityId=classActorId(actor.role)){
 const motion=actor.animationMotion,moving=motion&&now>=motion.lastAt&&now-motion.lastAt<=250;
 let action=moving?motion.action:'idle',startedAt=motion?motion.lastAt+250:0,direction=motion?.direction??direction16(actor.facingDX,actor.facingDY);
 if(moving)startedAt=motion.startedAt;
 // Sort by event time: a more recent hit can interrupt attack; a new attack can follow hit.
 let eventTime=-1;
 for(const [kind,time]of [['attack',actor.lastAttack],['special',actor.lastSkillAt],['hit',actor.lastHitAt]]){
  const spec=ACTOR_ACTIONS[kind];
  if(Number.isFinite(time)&&time>0&&time<=now&&now-time<spec.frames/spec.fps*1000&&time>=eventTime){action=kind;startedAt=time;eventTime=time;}
 }
 if(action==='attack'||action==='special')direction=direction16(actor.attackDX,actor.attackDY,direction);
 if(actor.hp<=0){action='death';startedAt=actor.deathAt||actor.lastHitAt||Math.max(0,(actor.deadUntil||now)-5000);}
 return {entityId,action,direction,startedAt,serverTime:now,frames:ACTOR_ACTIONS[action].frames,fps:ACTOR_ACTIONS[action].fps};
}

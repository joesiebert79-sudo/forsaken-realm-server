package com.morongaming.forsakenrealm;

/** Deterministic presentation timing. Never emits combat damage or gameplay events. */
final class AnimationTimeline {
 static final String[] ACTIONS={"idle","walk","run","attack","hit","death","special","turn"};
 static final int[] COUNTS={12,12,16,12,6,12,16,4};
 // Starting presentation timing, independently tunable from gameplay cooldowns.
 static final int[] FPS={6,10,16,12,12,10,12,12};
 static int action(String name){for(int i=0;i<ACTIONS.length;i++)if(ACTIONS[i].equals(name))return i;throw new IllegalArgumentException("Unknown action");}
 static boolean loops(int action){return action>=0&&action<=2;}
 static int frame(int action,long elapsedMs){
  if(action<0||action>=ACTIONS.length)throw new IllegalArgumentException("Unknown action");
  long elapsed=Math.max(0,elapsedMs),period=1000L*COUNTS[action];
  if(loops(action))return (int)((elapsed%period*FPS[action]/1000)%COUNTS[action]);
  // Clamp before multiplication so long-running saved timestamps cannot overflow.
  return elapsed>=(1000L*COUNTS[action]+FPS[action]-1)/FPS[action]?COUNTS[action]-1:(int)(elapsed*FPS[action]/1000);
 }
 static boolean finished(int action,long elapsedMs){return !loops(action)&&elapsedMs>=(1000L*COUNTS[action]+FPS[action]-1)/FPS[action];}
 static int direction(double dx,double dy){
  if(!Double.isFinite(dx)||!Double.isFinite(dy)||dx==0&&dy==0)throw new IllegalArgumentException("Direction requires finite motion");
  return ((int)Math.floor(Math.atan2(dy,dx)/(Math.PI/8)+.5)+16)%16;
 }
 static double turn(double from,double to,double radiansPerSecond,double dt){
  if(!Double.isFinite(from)||!Double.isFinite(to)||!Double.isFinite(radiansPerSecond)||!Double.isFinite(dt)||radiansPerSecond<0||dt<0)throw new IllegalArgumentException("Invalid turn");
  double delta=Math.atan2(Math.sin(to-from),Math.cos(to-from)),step=Math.min(Math.abs(delta),radiansPerSecond*Math.min(dt,.25));
  return Math.atan2(Math.sin(from+Math.copySign(step,delta)),Math.cos(from+Math.copySign(step,delta)));
 }
 static final class State {
  int action=0,direction=0;long startedAt=0,event=-1;
  void request(int next,int facing,long now,long eventId){
   if(next<0||next>=ACTIONS.length||facing<0||facing>=16)throw new IllegalArgumentException("Invalid animation request");
   // Event serials distinguish a new attack from repeated delivery of one snapshot.
   boolean newEvent=eventId>=0&&eventId!=event;
   if(action==5&&next!=5)return; // Respawn must explicitly reset a death pose.
   if(next!=5&&!loops(action)&&!finished(action,Math.max(0,now-startedAt))&&!newEvent)return;
   if(next!=action||newEvent){action=next;startedAt=now;event=eventId;}
   direction=facing;
  }
  int frame(long now){return AnimationTimeline.frame(action,Math.max(0,now-startedAt));}
  void respawn(long now,int facing){if(facing<0||facing>=16)throw new IllegalArgumentException("Invalid direction");action=0;direction=facing;startedAt=now;event=-1;}
 }
}

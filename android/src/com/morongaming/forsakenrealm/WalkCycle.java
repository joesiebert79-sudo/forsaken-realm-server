package com.morongaming.forsakenrealm;
/** Visual gait clock, independent of network-position snapping. Never moves an actor. */
final class WalkCycle {
 private float x,y,phase,speed;private long sampledAt,advancedAt,lastMoveAt;private float cadence=100;private boolean initialized;
 void sample(float nx,float ny,long now){
  if(!initialized){initialized=true;x=nx;y=ny;sampledAt=advancedAt=now;return;}
  advance(now);long elapsed=now-sampledAt;float distance=(float)Math.hypot(nx-x,ny-y);
  if(elapsed>0&&elapsed<=1200)cadence=cadence*.5f+elapsed*.5f;
  if(distance>180){speed=0;lastMoveAt=0;}
  else if(distance>.2f&&elapsed>0){speed=Math.max(1.5f,Math.min(10f,distance*1000f/(elapsed*9f)));lastMoveAt=now;}
  else if(distance<=.2f){speed=0;}
  x=nx;y=ny;sampledAt=now;
 }
 private long expires(){return lastMoveAt+(long)Math.max(160,Math.min(900,cadence*1.6f));}
 private void advance(long now){if(now>advancedAt){long end=Math.min(now,expires());if(speed>0&&end>advancedAt)phase+=(end-advancedAt)*speed/1000f;advancedAt=now;}}
 float phase(long now){advance(now);return phase;}
 boolean moving(long now){return speed>0&&now<expires();}
}

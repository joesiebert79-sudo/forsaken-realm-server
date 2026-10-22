package com.morongaming.forsakenrealm;
/** Map uses server XY coordinates; heading comes from actual displacement. */
final class MapHeading {
 private float x,y;private boolean ready;private String room="";float degrees=0;
 void record(float nx,float ny,String nextRoom){if(ready&&room.equals(nextRoom)){float dx=nx-x,dy=ny-y;double length=Math.hypot(dx,dy);if(length>.1&&length<200)degrees=(float)Math.toDegrees(Math.atan2(dy,dx))+90;}x=nx;y=ny;room=nextRoom;ready=true;}
}

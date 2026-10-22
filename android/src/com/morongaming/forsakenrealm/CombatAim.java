package com.morongaming.forsakenrealm;
final class CombatAim {
 static float screenX(float dx,float dy){return dx-dy;}
 static float screenY(float dx,float dy){return (dx+dy)*.5f;}
 static float angle(float dx,float dy){return (float)Math.toDegrees(Math.atan2(screenY(dx,dy),screenX(dx,dy)));}
 static float bowRotation(float angle,boolean mirrored){return mirrored?180-angle:angle;}
 static float weaponRotation(float angle,boolean mirrored,float phase,boolean thrust){float local=mirrored?180-angle:angle;return local+90+(phase<0?0:thrust?0:(phase-.5f)*100);}
}



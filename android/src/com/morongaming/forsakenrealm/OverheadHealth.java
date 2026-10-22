package com.morongaming.forsakenrealm;
/** The local survivor's feet are the camera anchor; health follows its head as the camera pans or zooms. */
final class OverheadHealth {
 static float left(float feetX,float unit){return feetX-58*unit;}
 static float top(float feetY,float zoom,float unit,boolean mounted,boolean badge){return feetY-(mounted?145:90)*zoom-(badge?30:12)*unit;}
 static float fraction(double hp,double max){if(Double.isNaN(hp)||Double.isNaN(max)||max<=0)return 0;return(float)Math.max(0,Math.min(1,hp/max));}
}

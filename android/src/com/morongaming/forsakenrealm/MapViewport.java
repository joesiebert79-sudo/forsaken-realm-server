package com.morongaming.forsakenrealm;
/** Screen-pixel pan limits shared by draw, drag, pinch and recenter. */
final class MapViewport {
 static float limit(float pan,float content,float viewport){float bound=Math.max(0,(content-viewport)/2);return Math.max(-bound,Math.min(bound,Float.isNaN(pan)?0:pan));}
 static float anchored(float pan,float focus,float ratio){return focus-(focus-pan)*ratio;}
}


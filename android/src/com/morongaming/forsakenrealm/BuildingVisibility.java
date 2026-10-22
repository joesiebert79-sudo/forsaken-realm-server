package com.morongaming.forsakenrealm;
/** Isometric camera ray: screen=(x-y,(x+y)/2-z). */
final class BuildingVisibility {
 static boolean obstructs(double x,double y,double halfWidth,double depth,double height){
  if(!Double.isFinite(x)||!Double.isFinite(y)||halfWidth<=0||depth<=0)return false;
  // Camera faces the positive x/y sides. A character outside either front
  // face cannot be hidden by this footprint, regardless of doorway distance.
  if(x>=halfWidth||y>=10)return false;
  if(x>=-halfWidth&&y>=-depth)return false;
  double enter=Math.max(0,Math.max(-halfWidth-x,-depth-y));
  double leave=Math.min(height-45,Math.min(halfWidth-x,10-y));
  return leave>enter;
 }
}

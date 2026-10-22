package com.morongaming.forsakenrealm;
final class MapDetail {
 static boolean damaged(double hp,double max){return Double.isFinite(hp)&&Double.isFinite(max)&&max>0&&hp>0&&hp<max;}
 static boolean settlements(float zoom){return zoom>=1;}
 static boolean buildings(float zoom){return zoom>5;}
 static boolean doors(float zoom){return zoom>8;}
 static boolean labels(float zoom){return zoom>12;}
}



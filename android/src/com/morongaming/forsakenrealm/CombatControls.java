package com.morongaming.forsakenrealm;
/** One persisted layout drives both rendering and touch hit regions. */
final class CombatControls {
 static final String[] LABELS={"ATTACK","INTERACT","SPRINT","DODGE","BLOCK","D-PAD","MAP","BACKPACK","CRAFT","MENU","PET ATTACK","PET RETREAT","SLOT 1","SLOT 2","SLOT 3","SLOT 4","SLOT 5","RIDE","STAY / FOLLOW","HARVEST"};
 static final float[] RADII={56,42,38,40,38,65,28,36,30,30,36,36,24,24,24,24,24,32,32,28};
 final float[] xs=new float[LABELS.length],ys=new float[LABELS.length],sizes=new float[LABELS.length];
 static boolean enabled(int i){return i!=10&&i!=11&&i!=17&&i!=19;}
 CombatControls(){reset();}
 void reset(){float[] x={875,875,765,745,660,90,46,710,810,910,565,565,272,328,384,440,496,660,565,660},y={455,325,250,430,320,450,175,175,175,175,385,475,495,495,495,495,495,430,285,510};for(int i=0;i<LABELS.length;i++){xs[i]=x[i]/960;ys[i]=y[i]/540;sizes[i]=1;}}
 CombatControls copy(){CombatControls c=new CombatControls();System.arraycopy(xs,0,c.xs,0,LABELS.length);System.arraycopy(ys,0,c.ys,0,LABELS.length);System.arraycopy(sizes,0,c.sizes,0,LABELS.length);return c;}
 float radius(int i,float w,float h){return RADII[i]*sizes[i]*Math.min(w/960,h/540);}
 float x(int i,float w,float h){float r=radius(i,w,h);return Math.max(r+2,Math.min(w-r-2,xs[i]*w));}
 float y(int i,float w,float h){float r=radius(i,w,h);return Math.max(r+2,Math.min(h-r-2,ys[i]*h));}
 void move(int i,float x,float y,float w,float h){float r=radius(i,w,h);xs[i]=Math.max(r+2,Math.min(w-r-2,x))/w;ys[i]=Math.max(r+2,Math.min(h-r-2,y))/h;}
 int hit(float x,float y,float w,float h,boolean shield){return hit(x,y,w,h,shield,true);}
 int hit(float x,float y,float w,float h,boolean shield,boolean horse){for(int i=0;i<LABELS.length;i++){if(!enabled(i)||i==4&&!shield)continue;if(Math.hypot(x-x(i,w,h),y-y(i,w,h))<=radius(i,w,h))return i;}return -1;}
 boolean cameraArea(float px,float py,float w,float h,boolean shield){
  return px>=0&&py>=0&&px<=w&&py<=h&&hit(px,py,w,h,shield)<0;
 }
 boolean overlaps(float w,float h){for(int i=0;i<LABELS.length;i++)for(int j=i+1;j<LABELS.length;j++)if(enabled(i)&&enabled(j)&&Math.hypot(x(i,w,h)-x(j,w,h),y(i,w,h)-y(j,w,h))<radius(i,w,h)+radius(j,w,h)+2)return true;return false;}
 String encode(){StringBuilder b=new StringBuilder();for(int i=0;i<LABELS.length;i++)b.append(xs[i]).append(',').append(ys[i]).append(',').append(sizes[i]).append(';');return b.toString();}
 void placeNew(int start){for(int i=start;i<LABELS.length;i++){boolean free=false;for(int attempt=0;attempt<400&&!free;attempt++){free=true;for(int j=0;j<i;j++)if(Math.hypot(x(i,960,540)-x(j,960,540),y(i,960,540)-y(j,960,540))<radius(i,960,540)+radius(j,960,540)+4){free=false;break;}if(!free){xs[i]=(370+(attempt%13)*43)/960f;ys[i]=(170+(attempt/13%9)*38)/540f;}}}}
 void load(String text){try{String[] rows=text.split(";");if(rows.length!=10&&rows.length!=12&&rows.length!=17&&rows.length!=19&&rows.length!=LABELS.length)return;CombatControls c=new CombatControls();for(int i=0;i<rows.length;i++){String[] v=rows[i].split(",");float x=Float.parseFloat(v[0]),y=Float.parseFloat(v[1]),s=Float.parseFloat(v[2]);if(Float.isNaN(x)||Float.isNaN(y)||Float.isNaN(s)||x<0||x>1||y<0||y>1||s<.6f||s>1.8f)return;c.xs[i]=x;c.ys[i]=y;c.sizes[i]=s;}if(rows.length<LABELS.length)c.placeNew(rows.length);for(int i=6;i<=9;i++)if(Math.abs(c.ys[i]-100f/540)<.001f&&Math.abs(c.xs[i]-xs[i])<.001f&&c.sizes[i]==1)c.ys[i]=175f/540;System.arraycopy(c.xs,0,xs,0,LABELS.length);System.arraycopy(c.ys,0,ys,0,LABELS.length);System.arraycopy(c.sizes,0,sizes,0,LABELS.length);}catch(Exception ignored){}}
}




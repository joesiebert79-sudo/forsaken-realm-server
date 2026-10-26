package com.morongaming.forsakenrealm;

/** One persisted layout drives both rendering and touch hit regions. */
final class CombatControls {
 static final int ATTACK=0,INTERACT=1,SPRINT=2,DASH=3,BLOCK=4,JOYSTICK=5,MAP=6,BACKPACK=7,SKILL1=8,MENU=9,SKILL2=10,ULTIMATE=11,MINIMAP=20;
 static final String[] LABELS={"ATTACK","INTERACT","SPRINT","DASH","BLOCK","MOVE","MAP","BACKPACK","SKILL 1","MENU","SKILL 2","ULTIMATE","SLOT 1","SLOT 2","SLOT 3","SLOT 4","SLOT 5","RIDE","STAY / FOLLOW","HARVEST","MINIMAP"};
 static final float[] RADII={60,32,32,43,29,82,26,40,44,33,44,47,24,24,24,24,24,32,32,28,65};
 final float[] xs=new float[LABELS.length],ys=new float[LABELS.length],sizes=new float[LABELS.length],opacities=new float[LABELS.length];
 static boolean enabled(int i){return i>=0&&i<=ULTIMATE;}
 CombatControls(){reset();}
 void reset(){float[] x={870,445,280,735,520,112,40,620,682,720,784,898,272,328,384,440,496,660,565,660,880};float[] y={447,462,455,450,385,440,164,452,340,49,315,288,495,495,495,495,495,430,285,510,92};for(int i=0;i<LABELS.length;i++){xs[i]=x[i]/960;ys[i]=y[i]/540;sizes[i]=1;opacities[i]=1;}}
 CombatControls copy(){CombatControls c=new CombatControls();System.arraycopy(xs,0,c.xs,0,LABELS.length);System.arraycopy(ys,0,c.ys,0,LABELS.length);System.arraycopy(sizes,0,c.sizes,0,LABELS.length);System.arraycopy(opacities,0,c.opacities,0,LABELS.length);return c;}
 void preset(int choice){reset();for(int i=0;i<LABELS.length;i++){if(choice==1&&i!=MENU&&i!=MINIMAP&&i!=MAP)xs[i]=1-xs[i];if(choice==2)sizes[i]=.85f;if(choice==3)sizes[i]=1.10f;}}
 float radius(int i,float w,float h){return RADII[i]*sizes[i]*Math.min(w/960,h/540);}
 float x(int i,float w,float h){float r=radius(i,w,h);return Math.max(r+2,Math.min(w-r-2,xs[i]*w));}
 float y(int i,float w,float h){float r=radius(i,w,h);return Math.max(r+2,Math.min(h-r-2,ys[i]*h));}
 void move(int i,float x,float y,float w,float h){float r=radius(i,w,h);xs[i]=Math.max(r+2,Math.min(w-r-2,x))/w;ys[i]=Math.max(r+2,Math.min(h-r-2,y))/h;}
 int hit(float x,float y,float w,float h,boolean shield){return hit(x,y,w,h,shield,true);}
 int hit(float x,float y,float w,float h,boolean shield,boolean horse){for(int i=0;i<LABELS.length;i++){if(!enabled(i)||i==BLOCK&&!shield)continue;if(Math.hypot(x-x(i,w,h),y-y(i,w,h))<=radius(i,w,h))return i;}return -1;}
 boolean cameraArea(float px,float py,float w,float h,boolean shield){return px>=0&&py>=0&&px<=w&&py<=h&&hit(px,py,w,h,shield)<0;}
 boolean overlaps(float w,float h){for(int i=0;i<LABELS.length;i++)for(int j=i+1;j<LABELS.length;j++)if(enabled(i)&&enabled(j)&&Math.hypot(x(i,w,h)-x(j,w,h),y(i,w,h)-y(j,w,h))<radius(i,w,h)+radius(j,w,h)+2)return true;return false;}
 String encode(){StringBuilder b=new StringBuilder();for(int i=0;i<LABELS.length;i++)b.append(xs[i]).append(',').append(ys[i]).append(',').append(sizes[i]).append(',').append(opacities[i]).append(';');return b.toString();}
 void load(String text){try{String[] rows=text.split(";");if(rows.length!=10&&rows.length!=12&&rows.length!=17&&rows.length!=19&&rows.length!=20&&rows.length!=LABELS.length)return;CombatControls c=new CombatControls();int limit=rows.length==LABELS.length?LABELS.length:Math.min(rows.length,10);for(int i=0;i<limit;i++){if(rows.length!=LABELS.length&&i==SKILL1)continue;String[] v=rows[i].split(",");float x=Float.parseFloat(v[0]),y=Float.parseFloat(v[1]),s=Float.parseFloat(v[2]),a=v.length>=4?Float.parseFloat(v[3]):1;if(!Float.isFinite(x)||!Float.isFinite(y)||!Float.isFinite(s)||!Float.isFinite(a)||x<0||x>1||y<0||y>1||s<.6f||s>1.8f||a<.35f||a>1)return;c.xs[i]=x;c.ys[i]=y;c.sizes[i]=s;c.opacities[i]=a;}if(rows.length!=LABELS.length){c.xs[MENU]=320f/960;c.ys[MENU]=48f/540;if(c.overlaps(960,540))c.reset();}if(c.overlaps(960,540))return;System.arraycopy(c.xs,0,xs,0,LABELS.length);System.arraycopy(c.ys,0,ys,0,LABELS.length);System.arraycopy(c.sizes,0,sizes,0,LABELS.length);System.arraycopy(c.opacities,0,opacities,0,LABELS.length);}catch(Exception ignored){}}
}

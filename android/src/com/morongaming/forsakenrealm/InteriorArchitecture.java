package com.morongaming.forsakenrealm;
import android.graphics.*;import org.json.JSONObject;
/** Cutaway masonry and timber shell. Drawn in the same projection as furniture and actors. */
final class InteriorArchitecture {
 private final FurniturePainter art;private final Paint p=new Paint(3);private final Path path=new Path();
 InteriorArchitecture(FurniturePainter art){this.art=art;}
 void polygon(Canvas c,int color,float...v){path.reset();for(int i=0;i<v.length;i+=2){if(i==0)path.moveTo(v[i],v[i+1]);else path.lineTo(v[i],v[i+1]);}path.close();p.setColor(color);c.drawPath(path,p);}
 void wall(Canvas c,float x,float y,float w,float d,float height){art.box(c,x,y,-8,w,d,height,1);}
 void lamp(Canvas c,float x,float y,float z){float sx=art.sx(x,y),sy=art.sy(x,y,z);for(int i=4;i>0;i--){p.setColor((8<<24)|0x00ffae42);c.drawOval(sx-15*i,sy-19*i,sx+15*i,sy+19*i,p);}p.setColor(0xff34261a);c.drawRoundRect(sx-8,sy-18,sx+8,sy+12,3,3,p);p.setColor(0xffffbe58);c.drawRect(sx-5,sy-14,sx+5,sy+8,p);p.setColor(0xffffe0a0);c.drawRect(sx-2,sy-11,sx+2,sy+5,p);p.setColor(0xff302317);p.setStrokeWidth(2);c.drawLine(sx,sy-17,sx,sy+11,p);c.drawLine(sx-8,sy-3,sx+8,sy-3,p);}
 void window(Canvas c,float x,float y,boolean east){float z=74,w=42,h=48;float ax=art.sx(x,y),ay=art.sy(x,y,z);float bx=art.sx(x+(east?w:0),y+(east?0:w)),by=art.sy(x+(east?w:0),y+(east?0:w),z);polygon(c,0xff302318,ax-3,ay-h-4,bx+3,by-h-4,bx+3,by+4,ax-3,ay+4);polygon(c,0xffd1a65b,ax,ay-h,bx,by-h,bx,by,ax,ay);p.setColor(0xff594026);p.setStrokeWidth(3);for(int i=0;i<4;i++){float t=i/3f,sx=ax+(bx-ax)*t,sy=ay+(by-ay)*t;c.drawLine(sx,sy-h,sx,sy,p);}c.drawLine(ax,ay-h/2,bx,by-h/2,p);}
 void draw(Canvas c,JSONObject room){float w=(float)room.optDouble("width"),d=(float)room.optDouble("height"),height=132;boolean glass=room.optString("type").equals("greenhouse");
 // Dry interior paving replaces the outdoor moss texture. Variation is stable
 // across frames and uses the same floor coordinates as collision and actors.
 for(int row=0;row*30<d;row++)for(int col=0;col*54<w;col++){float x=col*54,y=row*30,a=Math.min(w,x+53),b=Math.min(d,y+29);int shade=(col*17+row*31)%19;int color=Color.rgb(112+shade,99+shade,80+shade);polygon(c,color,art.sx(x,y),art.sy(x,y,0),art.sx(a,y),art.sy(a,y,0),art.sx(a,b),art.sy(a,b,0),art.sx(x,b),art.sy(x,b,0));art.line(c,0xff9f8f73,.7f,x,y,0,a,y,0);}
 // High rear walls, timber framing, readable stone courses and a low front cutaway.
 wall(c,0,0,w,15,height);wall(c,0,15,15,d-15,height);
 for(float z=18;z<height;z+=21){art.line(c,0xff352e24,1,15,16,z,w,16,z);art.line(c,0xff352e24,1,16,15,z,16,d,z);}
 for(int row=0;row<5;row++){float z=18+row*21;for(float x=40+(row%2)*32;x<w-10;x+=65)art.line(c,0xff4c4132,1,x,16,z,x,16,z+20);for(float y=40+(row%2)*32;y<d-10;y+=65)art.line(c,0xff4c4132,1,16,y,z,16,y,z+20);}
 art.box(c,0,0,height-7,w,22,13,0);art.box(c,0,0,height-7,22,d,13,0);
 for(float x=0;x<w;x+=145){art.box(c,x,0,0,12,22,height,0);if(x>0&&x<w-70)lamp(c,x+46,19,84);}
 for(float y=145;y<d;y+=145){art.box(c,0,y,0,22,12,height,0);lamp(c,19,y+44,84);}
 if(glass){for(float x=45;x<w-70;x+=92)window(c,x,18,true);for(float y=47;y<d-70;y+=92)window(c,18,y,false);}else{window(c,w*.30f,18,true);window(c,18,d*.43f,false);}
 JSONObject exit=room.optJSONObject("exit");float door=exit==null?w/2:(float)exit.optDouble("x",w/2);wall(c,w-15,15,15,d-15,28);wall(c,15,d-15,Math.max(0,door-51),15,28);wall(c,door+45,d-15,Math.max(0,w-door-60),15,28);
 art.box(c,door-52,d-19,0,13,24,76,0);art.box(c,door+39,d-19,0,13,24,76,0);lamp(c,door-46,d-2,57);lamp(c,door+45,d-2,57);
 for(int i=0;i<3;i++)art.box(c,door-39,d+i*12,-5-i*4,78,13,8,1);
 }
}

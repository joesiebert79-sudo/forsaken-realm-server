package com.morongaming.forsakenrealm;
import android.graphics.*;
/** Small construction silhouettes using the approved sheet's stone, timber and iron palette. */
final class ConstructionItemArt {
 private static final Paint p=new Paint();
 private static void box(Canvas c,int color,int x,int y,int w,int h){p.setColor(color);c.drawRect(x,y,x+w,y+h,p);}
 static boolean draw(Canvas c,String id,float x,float y,float size){if(!id.equals("cutStone")&&!id.equals("timberFrame")&&!id.equals("ironHinges")&&!id.equals("roofTiles"))return false;c.save();c.translate(x,y);c.scale(size/64,size/64);
  if(id.equals("cutStone")){for(int row=0;row<2;row++)for(int col=0;col<2;col++){int a=7+col*25+(row==0?3:0),b=15+row*18;box(c,0xff323a3b,a,b,24,19);box(c,0xff747c7a,a+1,b+1,22,15);box(c,0xffbbc0b3,a+1,b+1,22,3);box(c,0xff535e5d,a+18,b+4,5,12);}}
  else if(id.equals("timberFrame")){box(c,0xff382a1b,9,8,9,48);box(c,0xff382a1b,46,8,9,48);box(c,0xff987046,11,9,5,45);box(c,0xff987046,48,9,5,45);for(int b:new int[]{11,43}){box(c,0xff4a3521,6,b,52,9);box(c,0xffb08b55,8,b+1,48,5);}p.setColor(0xff775230);p.setStrokeWidth(5);c.drawLine(16,43,47,19,p);box(c,0xffa3a798,12,13,3,3);box(c,0xffa3a798,49,45,3,3);}
  else if(id.equals("ironHinges")){for(int b:new int[]{16,38}){box(c,0xff293334,9,b,46,10);box(c,0xff89928b,11,b+2,42,6);box(c,0xffc5c6ae,28,b-3,7,16);box(c,0xff515d58,31,b-3,3,16);for(int a:new int[]{16,45})box(c,0xff273130,a,b+3,3,3);}}
  else {for(int row=0;row<3;row++)for(int col=0;col<3;col++){int a=8+col*15+row*2,b=12+row*12;box(c,0xff4e3029,a,b,16,18);box(c,0xffa26043,a+1,b+1,13,14);box(c,0xffcf9165,a+1,b+1,3,13);box(c,0xff744331,a+11,b+2,3,12);}}
 c.restore();return true;}
}

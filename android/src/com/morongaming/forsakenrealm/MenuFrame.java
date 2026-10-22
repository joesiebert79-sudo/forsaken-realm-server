package com.morongaming.forsakenrealm;
import android.graphics.*;
/** Shared fitted Android landscape geometry and black iron / aged gold styling. */
final class MenuFrame {
 final Paint paint=new Paint(3);float scale=1,left,top;
 void begin(Canvas c,android.view.View v){MenuArt.get(v.getContext()).backdrop(c);scale=Math.min(v.getWidth()/960f,v.getHeight()/540f);left=(v.getWidth()-960*scale)/2;top=(v.getHeight()-540*scale)/2;c.save();c.translate(left,top);c.scale(scale,scale);}
 float x(float x){return (x-left)/scale;}float y(float y){return (y-top)/scale;}
 void title(Canvas c,String name,float x,float y,float width){text(c,name,x+1,y+2,32,width,0xff120b06);text(c,name,x,y,32,width,0xffeee5cc);paint.setColor(0xffa32418);c.drawRect(x,y+12,x+width,y+13,paint);text(c,"BLOOD & IRON",x+width*.24f,y+33,17,width*.64f,0xffce3727);}
 void brand(Canvas c){text(c,"THE",105,18,13,150);title(c,"FORSAKEN REALM",24,46,285);}
 void navigation(Canvas c,int active){String[] names={"PLAY","SETTINGS","STORE","CREDITS","EXIT"};for(int i=0;i<5;i++){float x=330+i*121;panel(c,x,16,113,48,i==active);text(c,names[i],x+9,47,16,95);}}
 int navigationHit(float x,float y){if(x<330||x>927||y<16||y>64)return -1;int n=(int)((x-330)/121);return (x-330)%121<=113?n:-1;}
 void panel(Canvas c,float x,float y,float w,float h,boolean active){paint.setShader(new LinearGradient(x,y,x,y+h,active?0xee68451a:0xee201c17,active?0xf2251608:0xf2080b0c,Shader.TileMode.CLAMP));c.drawRect(x,y,x+w,y+h,paint);paint.setShader(null);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(active?1.6f:1);paint.setColor(active?0xffffd078:0xff887047);c.drawRect(x,y,x+w,y+h,paint);paint.setStrokeWidth(.6f);paint.setColor(active?0xffa87932:0xff40372c);c.drawRect(x+3,y+3,x+w-3,y+h-3,paint);paint.setStyle(Paint.Style.FILL);for(float xx:new float[]{x+4,x+w-4})for(float yy:new float[]{y+4,y+h-4}){paint.setColor(0xffd2b174);c.drawCircle(xx,yy,1.4f,paint);}paint.setColor(active?0xffe8bf70:0xff665238);c.drawRect(x+10,y,x+w-10,y+1,paint);}
 void text(Canvas c,String text,float x,float y,float size,float width,int color){paint.setTypeface(Typeface.create("serif",Typeface.NORMAL));paint.setTextSize(size);while(paint.measureText(text)>width&&paint.getTextSize()>12)paint.setTextSize(paint.getTextSize()-1);if(paint.measureText(text)>width){while(text.length()>1&&paint.measureText(text+"…")>width)text=text.substring(0,text.length()-1);text+="…";}paint.setColor(color);c.drawText(text,x,y,paint);}
 void text(Canvas c,String text,float x,float y,float size,float width){text(c,text,x,y,size,width,0xffead7ac);}
 void wrap(Canvas c,String text,float x,float y,float width,int lines){paint.setTypeface(Typeface.create("serif",Typeface.NORMAL));paint.setTextSize(15);for(int i=0;i<lines&&!text.isEmpty();i++){int n=paint.breakText(text,true,width,null);if(n<=0)return;if(n<text.length()){int space=text.lastIndexOf(' ',n);if(space>0)n=space;}String line=text.substring(0,n);text=text.substring(n).trim();text(c,line+(i==lines-1&&!text.isEmpty()?"…":""),x,y+i*21,15,width);}}
}

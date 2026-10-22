package com.morongaming.forsakenrealm;
import android.graphics.*;
/** Shared fitted Android landscape geometry and black iron / aged gold styling. */
final class MenuFrame {
 final Paint paint=new Paint(3);float scale=1,left,top;
 void begin(Canvas c,android.view.View v){MenuArt.get(v.getContext()).backdrop(c);scale=Math.min(v.getWidth()/960f,v.getHeight()/540f);left=(v.getWidth()-960*scale)/2;top=(v.getHeight()-540*scale)/2;c.save();c.translate(left,top);c.scale(scale,scale);}
 float x(float x){return (x-left)/scale;}float y(float y){return (y-top)/scale;}
 void panel(Canvas c,float x,float y,float w,float h,boolean active){paint.setColor(active?0xff59452d:0xff211e19);c.drawRoundRect(x,y,x+w,y+h,4,4,paint);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(1);paint.setColor(active?0xffd5ae62:0xff705d3e);c.drawRoundRect(x,y,x+w,y+h,4,4,paint);paint.setStyle(Paint.Style.FILL);}
 void text(Canvas c,String text,float x,float y,float size,float width,int color){paint.setTypeface(Typeface.create("serif",Typeface.NORMAL));paint.setTextSize(size);while(paint.measureText(text)>width&&paint.getTextSize()>12)paint.setTextSize(paint.getTextSize()-1);if(paint.measureText(text)>width){while(text.length()>1&&paint.measureText(text+"…")>width)text=text.substring(0,text.length()-1);text+="…";}paint.setColor(color);c.drawText(text,x,y,paint);}
 void text(Canvas c,String text,float x,float y,float size,float width){text(c,text,x,y,size,width,0xffead7ac);}
 void wrap(Canvas c,String text,float x,float y,float width,int lines){paint.setTypeface(Typeface.create("serif",Typeface.NORMAL));paint.setTextSize(15);for(int i=0;i<lines&&!text.isEmpty();i++){int n=paint.breakText(text,true,width,null);if(n<=0)return;if(n<text.length()){int space=text.lastIndexOf(' ',n);if(space>0)n=space;}String line=text.substring(0,n);text=text.substring(n).trim();text(c,line+(i==lines-1&&!text.isEmpty()?"…":""),x,y+i*21,15,width);}}
}

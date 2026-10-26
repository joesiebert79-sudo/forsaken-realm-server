package com.morongaming.forsakenrealm;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.View;
import java.io.IOException;
import java.io.InputStream;

/** Original owner-approved menu pictures, decoded one at a time for phone memory. */
final class ApprovedMenuScenes {
 static final float MAIN_WIDTH=1536,MAIN_HEIGHT=1024,CREATION_WIDTH=1672,CREATION_HEIGHT=941;
 private static Bitmap image;
 private static int loaded;
 private static final Paint paint=new Paint(Paint.FILTER_BITMAP_FLAG);
 private ApprovedMenuScenes(){}
 static synchronized void draw(Canvas canvas,View view,int number){
  if(loaded!=number||image==null){
   if(image!=null)image.recycle();image=null;loaded=number;
   String file=String.format(java.util.Locale.ROOT,"menu/approved-menu-%05d.png",number);
   try(InputStream in=view.getContext().getAssets().open(file)){
    BitmapFactory.Options options=new BitmapFactory.Options();
    options.inPreferredConfig=Bitmap.Config.RGB_565;
    image=BitmapFactory.decodeStream(in,null,options);
   }catch(IOException ignored){}
  }
  canvas.drawColor(Color.BLACK);
  if(image!=null)canvas.drawBitmap(image,null,bounds(view,number),paint);
 }
 static RectF bounds(View view,int number){
  float width=number==1?MAIN_WIDTH:CREATION_WIDTH,height=number==1?MAIN_HEIGHT:CREATION_HEIGHT;
  float scale=Math.min(view.getWidth()/width,view.getHeight()/height);
  float left=(view.getWidth()-width*scale)/2,top=(view.getHeight()-height*scale)/2;
  return new RectF(left,top,left+width*scale,top+height*scale);
 }
 static void beginOverlay(Canvas canvas,View view,int number){
  RectF b=bounds(view,number);
  canvas.save();canvas.translate(b.left,b.top);
  canvas.scale(b.width()/(number==1?MAIN_WIDTH:CREATION_WIDTH),b.height()/(number==1?MAIN_HEIGHT:CREATION_HEIGHT));
 }
 static float x(View view,float touch,int number){RectF b=bounds(view,number);return (touch-b.left)*(number==1?MAIN_WIDTH:CREATION_WIDTH)/b.width();}
 static float y(View view,float touch,int number){RectF b=bounds(view,number);return (touch-b.top)*(number==1?MAIN_HEIGHT:CREATION_HEIGHT)/b.height();}
}

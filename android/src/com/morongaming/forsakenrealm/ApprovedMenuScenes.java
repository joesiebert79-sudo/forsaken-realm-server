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
  if(image!=null)canvas.drawBitmap(image,null,new RectF(0,0,view.getWidth(),view.getHeight()),paint);
 }
 static float x(View view,float touch){return touch*1672f/Math.max(1,view.getWidth());}
 static float y(View view,float touch){return touch*941f/Math.max(1,view.getHeight());}
}

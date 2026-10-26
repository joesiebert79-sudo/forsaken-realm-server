package com.morongaming.forsakenrealm;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.RectF;
import java.io.InputStream;

/** Runtime crops of the exact owner-provided HUD reference; no replacement art. */
final class ApprovedCombatButtons {
 private static Bitmap sheet;
 private static final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
 private static final Path clip=new Path();
 private static final Rect[] SOURCES={
  new Rect(1389,629,1629,869), // attack
  new Rect(51,514,399,862),   // neutral frame for interact
  new Rect(51,514,399,862),   // neutral frame for sprint
  new Rect(1195,707,1365,877), // directional dash
  new Rect(51,514,399,862),   // neutral frame for block
  new Rect(51,514,399,862),   // movement pad
  new Rect(51,514,399,862),   // neutral frame for map
  new Rect(1008,713,1172,877),// backpack
  new Rect(1091,495,1277,681),// skill 1
  new Rect(1205,18,1297,110), // menu
  new Rect(1270,457,1450,637),// skill 2
  new Rect(1470,410,1650,590) // ultimate
 };
 static void load(Context context){if(sheet!=null)return;try(InputStream in=context.getAssets().open("approved-combat-buttons.png")){BitmapFactory.Options options=new BitmapFactory.Options();options.inScaled=false;options.inPreferredConfig=Bitmap.Config.RGB_565;sheet=BitmapFactory.decodeStream(in,null,options);}catch(Exception ignored){}}
 static boolean draw(Canvas canvas,Context context,int index,float x,float y,float radius,float opacity){
  if(index<0||index>=SOURCES.length)return false;load(context);if(sheet==null)return false;
  Rect source=SOURCES[index];RectF target=new RectF(x-radius,y-radius,x+radius,y+radius);
  clip.reset();clip.addCircle(x,y,radius,Path.Direction.CW);
  canvas.save();canvas.clipPath(clip);paint.setAlpha(Math.round(255*opacity));canvas.drawBitmap(sheet,source,target,paint);canvas.restore();paint.setAlpha(255);return true;
 }
 private ApprovedCombatButtons(){}
}

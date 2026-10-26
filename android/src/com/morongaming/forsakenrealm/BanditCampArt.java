package com.morongaming.forsakenrealm;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Matrix;
import android.graphics.Rect;
import android.graphics.RectF;
import java.io.InputStream;
import java.util.ArrayList;
import org.json.JSONObject;

/** Walkable Bandit Trader Camp dressing, anchored to the existing town. */
final class BanditCampArt {
 static final String TOWN="day2-bandit";
 private static Bitmap shared;
 private static int sharedSample;
 private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
 private final Rect source=new Rect();
 private final RectF target=new RectF();
 private Bitmap sheet;
 private Bitmap scene;

 void load(Context context,int quality){
  int sample=quality==0?2:1;
  if(shared==null||sharedSample!=sample)try(InputStream in=context.getAssets().open("bandit-camp-props-v1.png")){
   BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=sample;
   shared=BitmapFactory.decodeStream(in,null,options);sharedSample=sample;
  }catch(Exception ignored){shared=null;}
  sheet=shared;
  if(scene==null)try(InputStream in=context.getAssets().open("bandit-camp-scene-v2.png")){
   BitmapFactory.Options options=new BitmapFactory.Options();options.inPreferredConfig=Bitmap.Config.RGB_565;
   scene=BitmapFactory.decodeStream(in,null,options);
  }catch(Exception ignored){scene=null;}
 }

 static boolean isCamp(JSONObject town){return town!=null&&TOWN.equals(town.optString("id"));}

 void ground(Canvas canvas,float x,float y,Matrix uniso){
  if(scene==null)return;
  canvas.save();canvas.translate(x,y);canvas.concat(uniso);
  paint.setAlpha(255);paint.setColor(Color.WHITE);paint.setFilterBitmap(true);
  canvas.drawBitmap(scene,null,new RectF(-836,-470,836,471),paint);
  label(canvas,"MISSIONS",-530,-220);label(canvas,"PROVISIONER",-55,-282);
  label(canvas,"BLACKSMITH",365,-250);label(canvas,"CRAFTING & COOKING",565,-55);
  label(canvas,"WAREHOUSE",330,175);label(canvas,"STABLES",-470,45);
  canvas.restore();
 }

 private void label(Canvas canvas,String text,float x,float y){
  paint.setTextSize(20);paint.setTextAlign(Paint.Align.CENTER);float width=paint.measureText(text)+28;
  paint.setColor(0xdd111411);canvas.drawRoundRect(x-width/2,y-24,x+width/2,y+8,6,6,paint);
  paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(2);paint.setColor(0xffd4b875);canvas.drawRoundRect(x-width/2,y-24,x+width/2,y+8,6,6,paint);
  paint.setStyle(Paint.Style.FILL);paint.setColor(Color.WHITE);canvas.drawText(text,x,y,paint);paint.setTextAlign(Paint.Align.LEFT);
 }

 private void fence(Canvas canvas,float x,float y,float x2,float y2){
  paint.setStrokeWidth(15);paint.setColor(0xff30251e);canvas.drawLine(x,y,x2,y2,paint);
  paint.setStrokeWidth(9);paint.setColor(0xff66513a);canvas.drawLine(x-8,y-9,x2-8,y2-9,paint);
  int count=Math.max(1,(int)(Math.hypot(x2-x,y2-y)/28));
  paint.setStrokeWidth(7);
  for(int i=0;i<=count;i++){float px=x+(x2-x)*i/count,py=y+(y2-y)*i/count;paint.setColor(i%3==0?0xffae8952:0xff463426);canvas.drawLine(px,py-14,px-16,py-31,paint);}
 }

 void prop(Canvas canvas,int cell,float width){
  if(sheet==null||cell<0||cell>3)return;
  int w=sheet.getWidth()/2,h=sheet.getHeight()/2;
  source.set((cell%2)*w,(cell/2)*h,(cell%2+1)*w,(cell/2+1)*h);
  float height=width*h/w;
  target.set(-width*.5f,-height*.94f,width*.5f,height*.06f);
  paint.setColor(Color.WHITE);paint.setAlpha(255);
  canvas.drawBitmap(sheet,source,target,paint);
 }

 void addObjects(ArrayList<JSONObject> objects,JSONObject town){
  // The v2 scene is complete. Functional buildings and actors are overlaid by the game.
 }
}

package com.morongaming.forsakenrealm;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
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

 void load(Context context,int quality){
  int sample=quality==0?2:1;
  if(shared==null||sharedSample!=sample)try(InputStream in=context.getAssets().open("bandit-camp-props-v1.png")){
   BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=sample;
   shared=BitmapFactory.decodeStream(in,null,options);sharedSample=sample;
  }catch(Exception ignored){shared=null;}
  sheet=shared;
 }

 static boolean isCamp(JSONObject town){return town!=null&&TOWN.equals(town.optString("id"));}

 void ground(Canvas canvas,float x,float y){
  canvas.save();canvas.translate(x,y);
  paint.setStyle(Paint.Style.FILL);paint.setColor(0xff504531);
  canvas.drawOval(-670,-570,670,570,paint);
  paint.setColor(0xff706044);canvas.drawOval(-615,-515,615,515,paint);
  // Low palisade segments are decorative; the south gate stays open and walkable.
  fence(canvas,-590,-510,590,-510);fence(canvas,-590,-510,-590,480);
  fence(canvas,590,-510,590,480);fence(canvas,-590,480,-125,480);
  fence(canvas,125,480,590,480);
  for(int side:new int[]{-1,1})for(int row=0;row<3;row++){
   float xx=side*(480+row*28),yy=-390+row*65;
   paint.setColor(0xff2c3026);canvas.drawCircle(xx,yy,58,paint);
   paint.setColor(0xff3f4932);canvas.drawCircle(xx-12,yy-12,39,paint);
  }
  canvas.restore();
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
  if(!isCamp(town))return;
  float x=(float)town.optDouble("x"),y=(float)town.optDouble("y");
  // All positions are world positions, so props scroll and depth-sort with actors.
  int[][] positions={
   {-560,-420,0,210},{560,-420,0,210},{-560,420,0,210},{560,420,0,210},
   {0,495,2,270},{-180,-180,1,220},{180,-180,1,220},
   {-270,115,1,210},{260,105,1,210},{-220,340,1,190},
   {0,40,3,240}
  };
  for(int i=0;i<positions.length;i++)try{
   int[] p=positions[i];JSONObject obj=new JSONObject().put("id","bandit-camp-decor-"+i)
    .put("x",x+p[0]).put("y",y+p[1]).put("cell",p[2]).put("width",p[3]);
   objects.add(new JSONObject().put("group","camp-decor").put("object",obj));
  }catch(Exception ignored){}
 }
}

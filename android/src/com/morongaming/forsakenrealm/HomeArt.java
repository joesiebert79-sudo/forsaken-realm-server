package com.morongaming.forsakenrealm;
import android.content.Context;
import android.graphics.*;
import java.io.InputStream;
import org.json.JSONObject;
/** Residential-only atlas. Existing service sprites and server footprints are untouched. */
final class HomeArt {
 private static Bitmap shared;private static int sharedQuality=-1;
 private Bitmap atlas;private final Paint paint=new Paint(3);private final Rect src=new Rect();private final RectF dst=new RectF();
 private static final float[] DOOR_X={.762f,.732f,.770f,.775f,.730f,.770f};
 private static final float[] DOOR_Y={.830f,.830f,.822f,.848f,.846f,.836f};
 void load(Context context,int quality){int sample=quality==0?2:1;if(shared==null||sharedQuality!=sample){try(InputStream in=context.getAssets().open("residential-houses-v71.png")){BitmapFactory.Options options=new BitmapFactory.Options();options.inSampleSize=sample;shared=BitmapFactory.decodeStream(in,null,options);sharedQuality=sample;}catch(Exception e){throw new IllegalStateException("Residential artwork missing",e);}}atlas=shared;}
 boolean draw(Canvas c,JSONObject b,boolean obstructs){
  if(!b.optString("id").startsWith("home:")&&!b.has("houseDesign"))return false;
  if(atlas==null)return false;
  int cell=Math.max(0,Math.min(4,b.optInt("tier",1)-1));if(cell==0&&Math.floorMod(b.optString("id").hashCode(),2)==1)cell=5;
  int w=atlas.getWidth()/3,h=atlas.getHeight()/2;src.set(cell%3*w,cell/3*h,(cell%3+1)*w,(cell/3+1)*h);
  float width=(float)(b.optDouble("halfWidth",125)*2+b.optDouble("depth",80)+16),height=width*h/w;
  JSONObject door=b.optJSONObject("door");float dx=door==null?0:(float)(door.optDouble("x")-b.optDouble("x")),dy=door==null?10:(float)(door.optDouble("y")-b.optDouble("y")-25);
  c.save();c.translate(dx-dy,(dx+dy)*.5f);if(b.optInt("rotation")!=90)c.scale(-1,1);
  dst.set(-width*DOOR_X[cell],-height*DOOR_Y[cell],width*(1-DOOR_X[cell]),height*(1-DOOR_Y[cell]));
  paint.setColor(Color.WHITE);paint.setAlpha(obstructs?105:255);c.drawBitmap(atlas,src,dst,paint);paint.setAlpha(255);c.restore();return true;
 }
}

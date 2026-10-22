package com.morongaming.forsakenrealm;
import android.content.Context;
import android.graphics.*;
import java.io.InputStream;
import org.json.JSONObject;
/** Shared sprite atlases; drawing allocates no bitmaps, shaders, paths or arrays. */
final class VillageArt {
 private Bitmap buildings,props;private static Bitmap sharedBuildings,sharedProps;private static int sharedQuality=-1;
 private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
 private final Rect src=new Rect();private final RectF dst=new RectF();
 private static final float[] DOOR_X={.726f,.314f,.584f,.62f};
 private static final float[] DOOR_Y={.821f,.845f,.805f,.77f};
 private static final boolean[] MIRROR={true,false,true,true};
 private static Bitmap load(Context context,String file,int quality){try(InputStream in=context.getAssets().open(file)){BitmapFactory.Options o=new BitmapFactory.Options();o.inSampleSize=quality==0?2:1;return BitmapFactory.decodeStream(in,null,o);}catch(Exception e){return null;}}
 void load(Context context,int quality){if(sharedQuality!=quality||sharedBuildings==null){sharedBuildings=load(context,"village-buildings-v65.png",quality);sharedProps=load(context,"village-props-v65.png",quality);sharedQuality=quality;}buildings=sharedBuildings;props=sharedProps;}
 boolean building(Canvas c,JSONObject b,boolean obstructs){
  if(buildings==null||!b.optString("id").startsWith("day2-"))return false;
  String role=b.optString("artRole",BuildingProfile.role(b));int cell=role.equals("smithy")?0:role.equals("bank")?1:role.equals("workshop")?2:role.equals("merchant")?3:-1;if(cell<0)return false;
  int w=buildings.getWidth()/2,h=buildings.getHeight()/2;src.set(cell%2*w,cell/2*h,(cell%2+1)*w,(cell/2+1)*h);
  float width=(float)(b.optDouble("halfWidth",125)*2+b.optDouble("depth",80)+12),height=width*h/w;
  float ax=DOOR_X[cell]*width,ay=DOOR_Y[cell]*height;
  // The source threshold is anchored to server doorway (0,+10), projected (-10,+5).
  c.save();c.translate(-10,5);if(MIRROR[cell])c.scale(-1,1);dst.set(-ax,-ay,width-ax,height-ay);if(cell==3){int gutter=Math.round(w*.032f);src.left+=gutter;dst.left+=width*gutter/w;}paint.setColor(Color.WHITE);paint.setAlpha(obstructs?105:255);c.drawBitmap(buildings,src,dst,paint);paint.setAlpha(255);c.restore();return true;
 }
 boolean prop(Canvas c,int cell,float width){if(props==null)return false;int w=props.getWidth()/2,h=props.getHeight()/2;src.set(cell%2*w,cell/2*h,(cell%2+1)*w,(cell/2+1)*h);float height=width*h/w;float anchor=cell==0?.55f:cell==1?.48f:cell==2?.57f:.40f;dst.set(-width*anchor,-height*.97f,width*(1-anchor),height*.03f);paint.setColor(Color.WHITE);paint.setAlpha(255);c.drawBitmap(props,src,dst,paint);return true;}
}


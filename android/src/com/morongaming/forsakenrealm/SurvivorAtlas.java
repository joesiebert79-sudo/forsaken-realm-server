package com.morongaming.forsakenrealm;
import android.content.Context;
import android.graphics.*;
import org.json.JSONObject;
import java.io.*;
/** Shared, validated artwork. Pixel regions are measured at build time, never on the UI thread. */
final class SurvivorAtlas {
 private static final int[] WALK={1,2,3,2};
 private static final class Atlas {Bitmap sheet,limbs;final Rect[] frames=new Rect[16];Rect upper,forearm,head;final Rect[] legs=new Rect[24];String error="not loaded";}
 private static final Atlas male=new Atlas(),female=new Atlas();
 private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG|Paint.FILTER_BITMAP_FLAG);
 private final RectF dest=new RectF();
 private final android.util.LruCache<String,Pose> poses=new android.util.LruCache<String,Pose>(128);
 private static final class Pose {double x,y;boolean initialized;int row;String room="";}
 static synchronized void load(Context context){loadOne(context,male,"survivor-day1");loadOne(context,female,"survivor-female-day1");}
 private static void loadOne(Context context,Atlas atlas,String name){
  if(atlas.sheet!=null)return;
  try(InputStream in=context.getAssets().open(name+"-body.png");InputStream limbInput=context.getAssets().open(name+".png");BufferedReader metadata=new BufferedReader(new InputStreamReader(context.getAssets().open(name+".frames"),"UTF-8"))){
   BitmapFactory.Options options=new BitmapFactory.Options();options.inScaled=false;options.inPreferredConfig=Bitmap.Config.ARGB_8888;
   Bitmap decoded=BitmapFactory.decodeStream(in,null,options);
   if(decoded==null)throw new IOException("PNG decode failed");
   String[] size=metadata.readLine().split(",");if(decoded.getWidth()!=Integer.parseInt(size[0])||decoded.getHeight()!=Integer.parseInt(size[1]))throw new IOException("atlas dimensions differ from metadata");
   for(int i=0;i<18;i++){String line=metadata.readLine();if(line==null)throw new IOException("missing sprite region "+i);String[] v=line.split(",");Rect r=new Rect(Integer.parseInt(v[0]),Integer.parseInt(v[1]),Integer.parseInt(v[2]),Integer.parseInt(v[3]));if(r.width()<=0||r.height()<=0||r.left<0||r.top<0||r.right>decoded.getWidth()||r.bottom>decoded.getHeight())throw new IOException("invalid sprite region "+i);if(i<16)atlas.frames[i]=r;else if(i==16)atlas.upper=r;else atlas.forearm=r;}
   atlas.limbs=BitmapFactory.decodeStream(limbInput,null,options);if(atlas.limbs==null)throw new IOException("limb PNG decode failed");atlas.sheet=decoded;atlas.head=region(atlas.frames[0],-12,-68,12,-46);for(int row=0;row<4;row++)for(int leg=0;leg<2;leg++){float left=row>=2?-6:leg==0?-11:0,right=row>=2?6:leg==0?0:11;int index=row*6+leg*3;atlas.legs[index]=region(atlas.frames[row*4],left,-29,right,-15);atlas.legs[index+1]=region(atlas.frames[row*4],left,-15,right,-6);atlas.legs[index+2]=region(atlas.frames[row*4],left,-6,right,0);}atlas.error="";
  }catch(Exception e){atlas.sheet=null;atlas.error=name+": "+e.getClass().getSimpleName();android.util.Log.e("ForsakenCharacter",atlas.error,e);}
 }
 private static Rect region(Rect frame,float left,float top,float right,float bottom){float scale=frame.height()/68f,cx=(frame.left+frame.right)*.5f;return new Rect((int)(cx+left*scale),(int)(frame.bottom+top*scale),(int)(cx+right*scale),(int)(frame.bottom+bottom*scale));}
 private void legBone(Canvas c,Atlas atlas,Rect src,float x,float y,float tx,float ty,float width){float length=(float)Math.hypot(tx-x,ty-y);c.save();c.translate(x,y);c.rotate((float)Math.toDegrees(Math.atan2(ty-y,tx-x))-90);dest.set(-width*.5f,0,width*.5f,length+1);c.drawBitmap(atlas.sheet,src,dest,paint);c.restore();}
 void legs(Canvas c,JSONObject gear,int row,float phase,float amount,boolean mirrored){
  Atlas atlas=atlas(gear);boolean side=row>=2;
  // Continuous hip/knee/ankle poses: the four generated stills are not a complete walk cycle.
  // Counter-mirror with the body so left/right direction follows the same facing selection.
  c.save();if(mirrored)c.scale(-1,1);float direction=row==3?-1:1;
  for(int order=0;order<2;order++){int leg=side?1-order:order;float wave=(float)Math.sin(phase+(leg==0?0:Math.PI))*amount;
   float hip=side?(leg==0?-2:2):(leg==0?-5:5),stride=side?wave*10*direction:wave*1.4f;
   float footX=hip+stride,footY=side?-Math.max(0,wave)*5:wave*4;
   float kneeX=hip+stride*.45f,kneeY=-15-Math.max(0,wave)*2;
   legBone(c,atlas,atlas.legs[row*6+leg*3],hip,-29,kneeX,kneeY,side?7:10);
   legBone(c,atlas,atlas.legs[row*6+leg*3+1],kneeX,kneeY,footX,footY-5,side?6:9);
   dest.set(footX-5,footY-6,footX+6,footY+1);c.drawBitmap(atlas.sheet,atlas.legs[row*6+leg*3+2],dest,paint);
   String leggings=CharacterRig.slot(gear,"leggings"),boots=CharacterRig.slot(gear,"boots");
   if(!leggings.isEmpty()){paint.setColor(CharacterRig.color(leggings,0xff635747));paint.setStrokeWidth(2);c.drawLine(hip,-27,kneeX,kneeY,paint);}
   if(!boots.isEmpty()){paint.setColor(CharacterRig.color(boots,0xff493b2e));paint.setStrokeWidth(2);c.drawLine(footX,footY-5,footX,footY,paint);}
   paint.setColor(Color.WHITE);
  }c.restore();
 }
 static String status(){return male.sheet!=null&&female.sheet!=null?"Day 1 character graphics ready":"Character graphics error — "+(male.sheet==null?male.error:female.error);}
 private static Atlas atlas(JSONObject gear){return gear!=null&&gear.optString("appearance").startsWith("female")?female:male;}
 void headshot(Canvas c,JSONObject gear,float left,float top,float right,float bottom){Atlas atlas=atlas(gear);if(atlas.sheet==null)return;dest.set(left,top,right,bottom);c.drawBitmap(atlas.sheet,atlas.head,dest,paint);}
 boolean available(JSONObject gear){return gear!=null&&atlas(gear).sheet!=null;}
 int direction(JSONObject gear){String id=gear.optString("id","portrait");Pose pose=poses.get(id);if(pose==null){pose=new Pose();poses.put(id,pose);}double x=gear.optDouble("x"),y=gear.optDouble("y");String room=gear.optString("interior");if(pose.initialized&&room.equals(pose.room)){double dx=x-pose.x,dy=y-pose.y,distance=Math.hypot(dx,dy);if(distance>.2&&distance<180){double sx=dx-dy,sy=(dx+dy)*.5;pose.row=Math.abs(sx)>Math.abs(sy)*1.5?(sx>0?2:3):(sy<0?1:0);}}pose.x=x;pose.y=y;pose.room=room;pose.initialized=true;return pose.row;}
 void drawRegion(Canvas c,JSONObject gear,int row,int frame,float left,float top,float right,float bottom,boolean mirrored){Atlas atlas=atlas(gear);Rect src=atlas.frames[row*4+frame];float scale=68f/src.height(),width=src.width()*scale*(gear.optString("appearance").endsWith("2")?1.10f:1f);dest.set(-width/2,-68,width/2,0);c.save();if(mirrored)c.scale(-1,1);c.clipRect(left,top,right,bottom);c.drawBitmap(atlas.sheet,src,dest,paint);c.restore();}
 void limb(Canvas c,JSONObject gear,boolean forearm,float x,float y,float tx,float ty){Atlas atlas=atlas(gear);float length=(float)Math.hypot(tx-x,ty-y);Rect src=forearm?atlas.forearm:atlas.upper;c.save();c.translate(x,y);c.rotate((float)Math.toDegrees(Math.atan2(ty-y,tx-x))-90);dest.set(forearm?-2:-3,0,forearm?2:3,length);c.drawBitmap(atlas.limbs,src,dest,paint);c.restore();}
 static int frame(float phase,boolean moving){if(!moving)return 0;int step=((int)Math.floor(phase/(Math.PI*.5))%4+4)%4;return WALK[step];}
}

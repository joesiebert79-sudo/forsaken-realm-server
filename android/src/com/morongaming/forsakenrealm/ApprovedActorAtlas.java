package com.morongaming.forsakenrealm;

import android.content.Context;
import android.graphics.*;
import org.json.*;
import java.io.*;
import java.util.*;

/** Optional production atlas path. Drafts never replace the existing renderer. */
final class ApprovedActorAtlas {
 private static final int BUDGET=32*1024*1024,MAX_PAGE=2048;
 private static ApprovedActorAtlas shared;
 private static long synchronizedServerTime,synchronizedLocalTime;
 private final Context context;
 private final Map<String,JSONObject> entities=new HashMap<>();
 private final LinkedHashMap<String,Bitmap> pages=new LinkedHashMap<>(8,.75f,true);
 private final Paint paint=new Paint();
 private int bytes;
 private String error="No approved production atlases installed";
 static synchronized void load(Context context){if(shared==null)shared=new ApprovedActorAtlas(context.getApplicationContext());}
 static void synchronize(long serverTime){synchronizedServerTime=serverTime;synchronizedLocalTime=android.os.SystemClock.elapsedRealtime();}
 static boolean drawActor(Canvas canvas,JSONObject actor){
  if(shared==null||actor==null)return false;JSONObject animation=actor.optJSONObject("animation");if(animation==null)return false;
  String id=animation.optString("entityId");JSONObject entity=shared.entities.get(id);if(entity==null)return false;
  long serverNow=synchronizedServerTime+Math.max(0,android.os.SystemClock.elapsedRealtime()-synchronizedLocalTime);
  long elapsed=Math.max(0,serverNow-animation.optLong("startedAt",serverNow));
  return draw(canvas,id,animation.optString("action","idle"),animation.optInt("direction"),elapsed,(float)entity.optDouble("worldScale",1));
 }
 static String status(){return shared==null?"Not loaded":shared.error;}
 static int cachedBytes(){return shared==null?0:shared.bytes;}
 static void trim(){if(shared!=null)shared.evictTo(0);}
 private ApprovedActorAtlas(Context context){
  this.context=context;paint.setFilterBitmap(false);paint.setAntiAlias(false);
  try{
   JSONObject index=json("actors/index.json");if(index.getInt("schemaVersion")!=1)throw new IOException("Unknown atlas index");
   JSONArray list=index.getJSONArray("entities");
   for(int i=0;i<list.length();i++){
    JSONObject entity=list.getJSONObject(i);
    if(!"approved-production".equals(entity.optString("status")))continue;
    validate(entity);String id=entity.getString("id");if(entities.containsKey(id))throw new IOException("Duplicate actor");entities.put(id,entity);
   }
   if(!entities.isEmpty())error="Approved production actors: "+entities.size();
  }catch(Exception ex){entities.clear();error="Atlas unavailable: "+ex.getMessage();}
 }
 private static String path(String path)throws IOException{
  if(!path.startsWith("actors/")||path.contains("..")||path.contains("\\")||!path.endsWith(".png")&&!path.endsWith(".json"))throw new IOException("Invalid actor asset path");return path;
 }
 private JSONObject json(String path)throws Exception{
  try(InputStream in=context.getAssets().open(path(path));ByteArrayOutputStream out=new ByteArrayOutputStream()){
   byte[] chunk=new byte[4096];int n;while((n=in.read(chunk))!=-1){if(out.size()+n>1024*1024)throw new IOException("Atlas metadata too large");out.write(chunk,0,n);}return new JSONObject(out.toString("UTF-8"));
  }
 }
 private void validate(JSONObject entity)throws Exception{
  if(entity.getInt("directions")!=16||!entity.getJSONObject("review").getBoolean("approved"))throw new IOException("Unreviewed actor");
  JSONArray pages=entity.getJSONArray("pages"),clips=entity.getJSONArray("clips");Map<String,int[]> sizes=new HashMap<>();
  for(int i=0;i<pages.length();i++){
   JSONObject page=pages.getJSONObject(i);String id=page.getString("id");if(sizes.containsKey(id))throw new IOException("Duplicate page");
   BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;
   try(InputStream in=context.getAssets().open(path(page.getString("path")))){BitmapFactory.decodeStream(in,null,options);}
   if(options.outWidth<1||options.outHeight<1||options.outWidth>MAX_PAGE||options.outHeight>MAX_PAGE)throw new IOException("Oversized atlas");
   sizes.put(id,new int[]{options.outWidth,options.outHeight});
  }
  boolean[][] seen=new boolean[8][16];int count=0;
  for(int i=0;i<clips.length();i++){
   JSONObject clip=clips.getJSONObject(i);int action=AnimationTimeline.action(clip.getString("action")),direction=clip.getInt("direction");
   if(direction<0||direction>=16||seen[action][direction])throw new IOException("Duplicate directional clip");seen[action][direction]=true;
   double fps=clip.getDouble("fps");if(Double.isNaN(fps)||Double.isInfinite(fps)||fps<1||fps>60)throw new IOException("Invalid frame rate");
   JSONArray frames=clip.getJSONArray("frames");if(frames.length()!=AnimationTimeline.COUNTS[action])throw new IOException("Incomplete animation");
   for(int j=0;j<frames.length();j++){
    JSONObject frame=frames.getJSONObject(j);int[] size=sizes.get(frame.getString("page"));int x=frame.getInt("x"),y=frame.getInt("y"),w=frame.getInt("w"),h=frame.getInt("h"),ax=frame.getInt("anchorX"),ay=frame.getInt("anchorY");
    if(size==null||x<0||y<0||w<=0||h<=0||w>size[0]||h>size[1]||x>size[0]-w||y>size[1]-h||ax<0||ay<0||ax>w||ay>h)throw new IOException("Invalid feet anchor or frame bounds");count++;
   }
  }
  if(count!=1440||clips.length()!=128)throw new IOException("Production actor needs all 1440 base frames");
 }
 private void evictTo(int target){Iterator<Map.Entry<String,Bitmap>> iterator=pages.entrySet().iterator();while(bytes>target&&iterator.hasNext()){Bitmap bitmap=iterator.next().getValue();bytes-=bitmap.getByteCount();iterator.remove();}}
 private Bitmap page(JSONObject entity,String id)throws Exception{
  JSONArray list=entity.getJSONArray("pages");String path=null;for(int i=0;i<list.length();i++){JSONObject p=list.getJSONObject(i);if(id.equals(p.getString("id")))path=p.getString("path");}
  if(path==null)throw new IOException("Unknown atlas page");Bitmap cached=pages.get(path);if(cached!=null)return cached;
  BitmapFactory.Options options=new BitmapFactory.Options();options.inScaled=false;options.inJustDecodeBounds=true;
  try(InputStream in=context.getAssets().open(path(path))){BitmapFactory.decodeStream(in,null,options);}
  int estimated=options.outWidth*options.outHeight*4;if(estimated<1||estimated>BUDGET)throw new IOException("Atlas memory budget exceeded");
  evictTo(BUDGET-estimated);options.inJustDecodeBounds=false;options.inPreferredConfig=Bitmap.Config.ARGB_8888;
  Bitmap bitmap;try(InputStream in=context.getAssets().open(path(path))){bitmap=BitmapFactory.decodeStream(in,null,options);}
  if(bitmap==null||!bitmap.hasAlpha())throw new IOException("Expected transparent atlas");
  int actual=bitmap.getByteCount();if(actual>BUDGET){bitmap.recycle();throw new IOException("Decoded page exceeds budget");}evictTo(BUDGET-actual);pages.put(path,bitmap);bytes+=actual;return bitmap;
 }
 /** Caller supplies elapsed event time from its synchronized presentation clock. */
 static boolean draw(Canvas canvas,String entityId,String action,int direction,long elapsedMs,float scale){
  if(shared==null||!Float.isFinite(scale)||scale<=0||direction<0||direction>=16)return false;
  JSONObject entity=shared.entities.get(entityId);if(entity==null)return false;
  try{
   int actionId=AnimationTimeline.action(action);JSONArray clips=entity.getJSONArray("clips");
   for(int i=0;i<clips.length();i++){
    JSONObject clip=clips.getJSONObject(i);if(!action.equals(clip.getString("action"))||direction!=clip.getInt("direction"))continue;
    JSONArray frames=clip.getJSONArray("frames");double tick=Math.floor(Math.max(0,elapsedMs)/1000.0*clip.getDouble("fps"));int at=(int)(AnimationTimeline.loops(actionId)?tick%frames.length():Math.min(tick,frames.length()-1));
    JSONObject frame=frames.getJSONObject(at);Bitmap page=shared.page(entity,frame.getString("page"));int x=frame.getInt("x"),y=frame.getInt("y"),w=frame.getInt("w"),h=frame.getInt("h"),ax=frame.getInt("anchorX"),ay=frame.getInt("anchorY");
    canvas.drawBitmap(page,new Rect(x,y,x+w,y+h),new RectF(-ax*scale,-ay*scale,(w-ax)*scale,(h-ay)*scale),shared.paint);return true;
   }
  }catch(Exception ex){shared.error="Atlas draw failed: "+ex.getMessage();}
  return false;
 }
}

package com.morongaming.forsakenrealm;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import org.json.JSONObject;
import java.io.InputStream;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.Map;

/** Rough gameplay cutouts from the exact owner-approved 16-bit reference sheets. */
final class ApprovedReferenceSprites {
 private static Bitmap classes,companions;
 private static final Paint paint=new Paint();
 private static final Map<String,Bitmap> cache=new HashMap<>();
 private static final String[] ROLES={"melee","ranged","mage","rogue","paladin","necromancer"};
 private static final String[] PETS={"wolf","direWolf","warBear","raven","loneWolf","familiar","horse"};
 private static final int[][] PET_BOXES={{36,343,202,633},{193,330,398,640},{398,345,645,644},{648,339,852,634},{837,351,1061,637},{1059,338,1282,637},{1279,331,1509,637}};
 static void load(Context context){
  if(classes==null)try(InputStream in=context.getAssets().open("approved-six-classes.png")){BitmapFactory.Options o=new BitmapFactory.Options();o.inScaled=false;classes=BitmapFactory.decodeStream(in,null,o);}catch(Exception ignored){}
  if(companions==null)try(InputStream in=context.getAssets().open("approved-companions.png")){BitmapFactory.Options o=new BitmapFactory.Options();o.inScaled=false;companions=BitmapFactory.decodeStream(in,null,o);}catch(Exception ignored){}
  paint.setFilterBitmap(false);paint.setAntiAlias(false);
 }
 private static int index(String name,String[] names){for(int i=0;i<names.length;i++)if(names[i].equals(name))return i;return -1;}
 private static boolean backdrop(int color){int r=Color.red(color),g=Color.green(color),b=Color.blue(color);return Math.max(r,Math.max(g,b))<76&&Math.max(r,Math.max(g,b))-Math.min(r,Math.min(g,b))<48;}
 private static Bitmap cut(Bitmap sheet,Rect box){
  if(sheet==null||box.left<0||box.top<0||box.right>sheet.getWidth()||box.bottom>sheet.getHeight())return null;
  int w=box.width(),h=box.height(),n=w*h;int[] pixels=new int[n];sheet.getPixels(pixels,0,w,box.left,box.top,w,h);
  boolean[] outside=new boolean[n];ArrayDeque<Integer> queue=new ArrayDeque<>();
  for(int x=0;x<w;x++){edge(x,pixels,outside,queue);edge((h-1)*w+x,pixels,outside,queue);}
  for(int y=0;y<h;y++){edge(y*w,pixels,outside,queue);edge(y*w+w-1,pixels,outside,queue);}
  while(!queue.isEmpty()){int at=queue.removeFirst(),x=at%w,y=at/w;if(x>0)edge(at-1,pixels,outside,queue);if(x+1<w)edge(at+1,pixels,outside,queue);if(y>0)edge(at-w,pixels,outside,queue);if(y+1<h)edge(at+w,pixels,outside,queue);}
  for(int i=0;i<n;i++)if(outside[i])pixels[i]=Color.TRANSPARENT;
  Bitmap result=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);result.setPixels(pixels,0,w,0,0,w,h);return result;
 }
 private static void edge(int at,int[] pixels,boolean[] outside,ArrayDeque<Integer> queue){if(!outside[at]&&backdrop(pixels[at])){outside[at]=true;queue.addLast(at);}}
 private static Bitmap classPose(int role,int facing){
  String key="class:"+role+":"+facing;Bitmap b=cache.get(key);if(b!=null)return b;
  int[] offsets={0,2,1,3};int x=role*256+7+offsets[Math.max(0,Math.min(3,facing))]*62;
  b=cut(classes,new Rect(x,91,x+62,236));if(b!=null)cache.put(key,b);return b;
 }
 private static Bitmap petPose(int kind){String key="pet:"+kind;Bitmap b=cache.get(key);if(b!=null)return b;int[] r=PET_BOXES[kind];b=cut(companions,new Rect(r[0],r[1],r[2],r[3]));if(b!=null)cache.put(key,b);return b;}
 static boolean drawClass(Canvas canvas,JSONObject actor,int facing,float phase,boolean moving,float attack){
  int role=index(actor.optString("role"),ROLES);if(role<0)return false;Bitmap bitmap=classPose(role,facing);if(bitmap==null)return false;
  float height=98,width=height*bitmap.getWidth()/bitmap.getHeight(),bob=moving?(float)Math.sin(phase)*2:0;
  canvas.drawBitmap(bitmap,null,new RectF(-width/2,-height+bob,width/2,bob),paint);return true;
 }
 static boolean previewClass(Canvas canvas,JSONObject actor,RectF bounds){int role=index(actor.optString("role"),ROLES);if(role<0)return false;Bitmap bitmap=classPose(role,0);if(bitmap==null)return false;float h=Math.min(bounds.height(),bounds.width()*bitmap.getHeight()/bitmap.getWidth()),w=h*bitmap.getWidth()/bitmap.getHeight();canvas.drawBitmap(bitmap,null,new RectF(bounds.centerX()-w/2,bounds.bottom-h,bounds.centerX()+w/2,bounds.bottom),paint);return true;}
 static boolean drawCompanion(Canvas canvas,JSONObject pet,float phase){int kind=index(pet.optString("kind"),PETS);if(kind<0)return false;Bitmap bitmap=petPose(kind);if(bitmap==null)return false;float h=kind==6?112:kind==2||kind==5?105:88,w=h*bitmap.getWidth()/bitmap.getHeight(),bob=pet.optBoolean("active")?(float)Math.sin(phase)*2:0;canvas.save();if(pet.optDouble("facingDX",1)<0)canvas.scale(-1,1);canvas.drawBitmap(bitmap,null,new RectF(-w/2,-h+bob,w/2,bob),paint);canvas.restore();return true;}
 static boolean previewCompanion(Canvas canvas,JSONObject pet,RectF bounds){int kind=index(pet.optString("kind"),PETS);if(kind<0)return false;Bitmap bitmap=petPose(kind);if(bitmap==null)return false;float h=Math.min(bounds.height(),bounds.width()*bitmap.getHeight()/bitmap.getWidth()),w=h*bitmap.getWidth()/bitmap.getHeight();canvas.drawBitmap(bitmap,null,new RectF(bounds.centerX()-w/2,bounds.bottom-h,bounds.centerX()+w/2,bounds.bottom),paint);return true;}
 private ApprovedReferenceSprites(){}
}

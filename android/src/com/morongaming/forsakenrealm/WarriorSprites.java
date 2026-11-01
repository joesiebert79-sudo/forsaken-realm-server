package com.morongaming.forsakenrealm;

import android.content.Context;
import android.graphics.*;
import org.json.JSONObject;
import java.io.InputStream;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.Map;

/** The two user-selected warriors, cut from their supplied reference sheet. */
final class WarriorSprites {
 private static Bitmap sheet;
 private static final Map<String,Bitmap> cache=new HashMap<>();
 private static final Paint paint=new Paint();
 private static final int[] X_M={495,566,637,707}, X_F={1264,1335,1407,1478};
 private static final int[] Y={85,168,254,338,418,498};
 static void load(Context context){if(sheet!=null)return;try(InputStream in=context.getAssets().open("two-warriors-reference.jpg")){sheet=BitmapFactory.decodeStream(in);}catch(Exception ignored){}paint.setFilterBitmap(false);paint.setAntiAlias(false);}
 static boolean applies(JSONObject actor){return actor!=null&&"melee".equals(actor.optString("role"))&&!actor.optString("appearance").startsWith("female");}
 private static Bitmap pose(boolean female,int action,int frame){if(sheet==null)return null;frame=Math.max(0,Math.min(3,frame));String key=(female?"f":"m")+action+":"+frame;Bitmap found=cache.get(key);if(found!=null)return found;int x=(female?X_F:X_M)[frame],y=Y[action],w=action==3?67:59,h=action==5?63:69;w=Math.min(w,sheet.getWidth()-x);h=Math.min(h,sheet.getHeight()-y);if(w<=0||h<=0)return null;int[] pixels=new int[w*h];sheet.getPixels(pixels,0,w,x,y,w,h);boolean[] outside=new boolean[pixels.length];ArrayDeque<Integer> queue=new ArrayDeque<>();for(int xx=0;xx<w;xx++){edge(xx,pixels,outside,queue);edge((h-1)*w+xx,pixels,outside,queue);}for(int yy=0;yy<h;yy++){edge(yy*w,pixels,outside,queue);edge(yy*w+w-1,pixels,outside,queue);}while(!queue.isEmpty()){int at=queue.removeFirst(),px=at%w,py=at/w;if(px>0)edge(at-1,pixels,outside,queue);if(px+1<w)edge(at+1,pixels,outside,queue);if(py>0)edge(at-w,pixels,outside,queue);if(py+1<h)edge(at+w,pixels,outside,queue);}for(int i=0;i<pixels.length;i++)if(outside[i])pixels[i]=Color.TRANSPARENT;Bitmap b=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);b.setPixels(pixels,0,w,0,0,w,h);cache.put(key,b);return b;}
 private static void edge(int i,int[] pixels,boolean[] outside,ArrayDeque<Integer> q){if(outside[i])return;int c=pixels[i],r=Color.red(c),g=Color.green(c),b=Color.blue(c);if(Math.max(r,Math.max(g,b))<64&&Math.max(r,Math.max(g,b))-Math.min(r,Math.min(g,b))<35){outside[i]=true;q.addLast(i);}}
 static boolean draw(Canvas c,JSONObject actor,int direction,float phase,boolean moving,float attack){if(!applies(actor)||sheet==null)return false;boolean female=actor.optString("appearance").startsWith("female");int action=attack>=0?3:moving?1:0;int frame=attack>=0?Math.min(3,(int)(attack*4)):moving?Math.floorMod((int)Math.floor(phase/1.5),4):Math.floorMod((int)(android.os.SystemClock.uptimeMillis()/320),4);Bitmap b=pose(female,action,frame);if(b==null)return false;c.save();if(direction==3)c.scale(-1,1);c.drawBitmap(b,null,new RectF(-42,-91,42,3),paint);c.restore();return true;}
 static boolean preview(Canvas c,JSONObject actor,RectF bounds){if(!applies(actor)||sheet==null)return false;Bitmap b=pose(actor.optString("appearance").startsWith("female"),0,0);if(b==null)return false;float h=Math.min(bounds.height(),bounds.width()*b.getHeight()/b.getWidth()),w=h*b.getWidth()/b.getHeight();c.drawBitmap(b,null,new RectF(bounds.centerX()-w/2,bounds.bottom-h,bounds.centerX()+w/2,bounds.bottom),paint);return true;}
 private WarriorSprites(){}
}

package com.morongaming.forsakenrealm;
import android.graphics.*;
import org.json.*;
import java.util.ArrayList;
/** Static cartography only: drawn before exploration masking, never reveals actors. */
final class MapBuildings {
 private final Paint p=new Paint(3);private final Rect visible=new Rect();private final ArrayList<RectF> labels=new ArrayList<>();
 void draw(Canvas c,JSONArray buildings,float zoom,float scale,float u){
  if(buildings==null||scale<=0)return;float q=u/scale;c.getClipBounds(visible);labels.clear();
  for(int i=0;i<buildings.length();i++){
   JSONObject b=buildings.optJSONObject(i);if(b==null)continue;float x=(float)b.optDouble("x"),y=(float)b.optDouble("y"),a=(float)b.optDouble("halfWidth",125),d=(float)b.optDouble("depth",80);
   if(x+a<visible.left||x-a>visible.right||y+40<visible.top||y-d>visible.bottom)continue;
   boolean castle=b.optString("id").startsWith("castle-"),rural=b.optBoolean("rural"),shop=!b.isNull("shop")&&!b.optString("shop").isEmpty();
   p.setStyle(Paint.Style.FILL);p.setColor(0x55000000);c.drawRect(x-a+4*q,y-d+4*q,x+a+4*q,y+10+4*q,p);
   p.setColor(castle?0xffb4aa8a:rural?0xffad9665:shop?0xffb58b66:0xff8a9588);c.drawRect(x-a,y-d,x+a,y+10,p);
   p.setColor(castle?0xff625e50:rural?0xff756643:0xff59635c);c.drawRect(x,y-d,x+a,y+10,p);
   p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(q);p.setColor(0xffd4c5a1);c.drawRect(x-a,y-d,x+a,y+10,p);c.drawLine(x,y-d,x,y+10,p);
   if(castle){p.setStyle(Paint.Style.FILL);p.setColor(0xff545c4d);c.drawRect(x-a*.55f,y-d*.75f,x+a*.55f,y-d*.2f,p);p.setColor(0xffddd0a9);float t=Math.min(a*.23f,d*.28f);for(int k=0;k<4;k++){float tx=k%2==0?x-a:x+a,ty=k<2?y-d:y+10;c.drawRect(tx-t,ty-t,tx+t,ty+t,p);}}
   p.setStyle(Paint.Style.FILL);
   if(MapDetail.doors(zoom)){p.setColor(0xfff7d88a);p.setStrokeWidth(3*q);c.drawLine(x-20,y+10,x+20,y+10,p);p.setStrokeWidth(q);c.drawLine(x,y+14,x,y+35,p);c.drawCircle(x,y+35,2*q,p);}
   if(MapDetail.labels(zoom)&&(shop||castle)||zoom>24){String name=shop?b.optString("shop"):b.optString("name");if(name.isEmpty())continue;p.setTextSize(11*q);float width=p.measureText(name);RectF box=new RectF(x+a+5*q,y-12*q,x+a+width+11*q,y+4*q);boolean overlap=false;for(RectF prior:labels)if(RectF.intersects(prior,box)){overlap=true;break;}if(!overlap){labels.add(box);p.setColor(0xdd1a211b);c.drawRoundRect(box,2*q,2*q,p);p.setColor(shop?0xffffdda0:0xffded6bc);c.drawText(name,box.left+3*q,y,p);}}
  }
 }
}

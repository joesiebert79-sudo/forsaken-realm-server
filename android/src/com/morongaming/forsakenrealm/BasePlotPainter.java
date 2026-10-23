package com.morongaming.forsakenrealm;
import android.graphics.*;import org.json.*;
/** Ground-plane property markers and low starter fencing; built defenses are separate server objects. */
final class BasePlotPainter {
 private final Paint p=new Paint();
 private void fence(Canvas c,float x,float y,float a,float b){p.setColor(0xff725439);p.setStrokeWidth(3);for(int h:new int[]{5,12})c.drawLine(x-h,y-h,a-h,b-h,p);int count=Math.max(1,(int)(Math.hypot(a-x,b-y)/45));for(int i=0;i<=count;i++){float px=x+(a-x)*i/count,py=y+(b-y)*i/count;p.setColor(0xff402f23);p.setStrokeWidth(5);c.drawLine(px,py,px-18,py-18,p);p.setColor(0xffb49768);p.setStrokeWidth(2);c.drawLine(px-1,py,px-19,py-18,p);}}
 void draw(Canvas c,JSONArray plots){if(plots==null)return;for(int i=0;i<plots.length();i++){JSONObject plot=plots.optJSONObject(i);if(plot==null)continue;float x=(float)plot.optDouble("x"),y=(float)plot.optDouble("y"),r=(float)plot.optDouble("radius",300);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(2);p.setColor(0x778b9d75);c.drawRect(x-r,y-r,x+r,y+r,p);p.setStyle(Paint.Style.FILL);
  if(plot.optInt("level",1)<=2){fence(c,x-r,y-r,x+r,y-r);fence(c,x-r,y-r,x-r,y+r);fence(c,x+r,y-r,x+r,y+r);fence(c,x-r,y+r,x-65,y+r);fence(c,x+65,y+r,x+r,y+r);}
  p.setColor(0xffc0a570);for(int corner=0;corner<4;corner++)c.drawCircle(x+(corner%2==0?-1:1)*(r-55),y+(corner<2?-1:1)*(r-55),7,p);JSONObject greenhouse=plot.optJSONObject("greenhousePlot");if(greenhouse!=null&&!greenhouse.optBoolean("built")){float gx=(float)greenhouse.optDouble("x"),gy=(float)greenhouse.optDouble("y");p.setColor(0x774e402a);c.drawRect(gx-90,gy-90,gx+90,gy+55,p);p.setColor(0xffc6b17b);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(2);c.drawRect(gx-90,gy-90,gx+90,gy+55,p);p.setStyle(Paint.Style.FILL);p.setTextSize(14);c.drawText("UNBUILT GREENHOUSE",gx-86,gy-8,p);}}
 }
}

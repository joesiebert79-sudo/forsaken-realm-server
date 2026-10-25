package com.morongaming.forsakenrealm;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.MotionEvent;
import android.view.View;

/** Exact approved main-menu artwork with live touch targets. */
final class LandingView extends View {
 interface Host{void select(int action);String version();}
 private final Host host;
 private final boolean lore;
 private final Paint paint=new Paint(3);
 private float downX,downY;
 LandingView(Context context,Host host,boolean lore){super(context);this.host=host;this.lore=lore;setContentDescription(lore?"Forsaken Realm lore. Tap Back to return.":"Forsaken Realm main menu: Play, Continue, Store, Settings, Lore, Exit.");}
 @Override protected void onDraw(Canvas canvas){
  ApprovedMenuScenes.draw(canvas,this,1);
  if(!lore)return;
  float sx=getWidth()/1536f,sy=getHeight()/1024f;
  canvas.save();canvas.scale(sx,sy);
  paint.setColor(0xee0b0a0a);canvas.drawRoundRect(new RectF(655,205,1435,850),22,22,paint);
  paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(4);paint.setColor(0xffb69a63);canvas.drawRoundRect(new RectF(655,205,1435,850),22,22,paint);paint.setStyle(Paint.Style.FILL);
  paint.setTypeface(android.graphics.Typeface.create("serif",1));paint.setColor(0xffe9d7b2);paint.setTextSize(48);canvas.drawText("LORE OF THE REALM",715,285,paint);
  paint.setTypeface(android.graphics.Typeface.create("serif",0));paint.setTextSize(29);
  String[] lines={"The Forsaken Realm is a land of scattered villages,","two trader towns, old castles, and dangerous wilderness.","Survivors build homes, master crafts, and claim their","place in a world shaped by blood and iron."};
  for(int i=0;i<lines.length;i++)canvas.drawText(lines[i],715,365+i*47,paint);
  paint.setColor(0xffa33323);canvas.drawRoundRect(new RectF(905,682,1185,770),9,9,paint);
  paint.setColor(Color.WHITE);paint.setTextSize(35);canvas.drawText("BACK",990,738,paint);
  canvas.restore();
 }
 @Override public boolean performClick(){super.performClick();return true;}
 @Override public boolean onTouchEvent(MotionEvent event){
  float x=event.getX()*1536f/Math.max(1,getWidth()),y=event.getY()*1024f/Math.max(1,getHeight());
  if(event.getActionMasked()==MotionEvent.ACTION_DOWN){downX=x;downY=y;return true;}
  if(event.getActionMasked()!=MotionEvent.ACTION_UP)return true;
  if(Math.hypot(x-downX,y-downY)>30)return true;
  performClick();
  if(lore){host.select(6);return true;}
  if(x>=145&&x<=590){int[] top={343,439,534,625,713,803};for(int i=0;i<6;i++)if(y>=top[i]&&y<=top[i]+88){host.select(i);break;}}
  return true;
 }
}

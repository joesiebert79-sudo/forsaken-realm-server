package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import android.view.*;
/** Reference-led landscape settings with real controls and an actual isometric scene preview. */
final class RealmSettingsView extends View {
 interface Host{String value(int option);void select(int option);void back();Bitmap preview();}
 private final Host host;private final MenuFrame f=new MenuFrame();private int category;private Bitmap scene;private float downX,downY;
 private final String[] sections={"GENERAL","GRAPHICS","CONTROLS","INTERFACE","MULTIPLAYER","ACCOUNT"};
 private final int[][] options={{9,2,8},{0,1},{6,3,7},{2,8},{4},{5}};
 private final String[] names={"Graphics quality","60 FPS target","Damage numbers","Sprint mode","Server connection","Your account","Move / resize buttons","Reset button layout","FPS counter","Check for app updates"};
 RealmSettingsView(Context c,Host h){super(c);host=h;scene=h.preview();setContentDescription("Forsaken Realm settings. Graphics, controls, interface, connection and account.");}
 void refreshPreview(){scene=host.preview();invalidate();}
 protected void onDraw(Canvas c){f.begin(c,this);f.text(c,"FORSAKEN REALM  /  SETTINGS",24,39,25,840);for(int i=0;i<sections.length;i++){f.panel(c,24,80+i*61,185,51,i==category);f.text(c,sections[i],39,111+i*61,17,155);}f.panel(c,224,80,343,363,false);f.text(c,sections[category]+" SETTINGS",240,113,20,310);int[] rows=options[category];for(int i=0;i<rows.length;i++){int option=rows[i];float y=142+i*83;f.panel(c,240,y,311,69,false);f.text(c,names[option],253,y+25,17,285);f.text(c,host.value(option),253,y+52,15,285,0xffd7ba7b);}f.panel(c,583,80,353,363,false);f.text(c,"YOUR CONTROL LAYOUT",598,112,20,322);if(scene!=null){f.paint.setColor(Color.WHITE);c.drawBitmap(scene,null,new RectF(598,132,921,326),f.paint);}else{f.wrap(c,"Connect to your realm to preview your survivor and current isometric scene.",604,180,307,4);}f.panel(c,598,344,323,45,true);f.text(c,"MOVE / RESIZE BUTTONS",625,373,18,275);f.wrap(c,"Changes are saved on this device.",604,413,310,1);f.panel(c,24,474,266,43,false);f.text(c,"<  BACK",45,502,19,230);f.text(c,"FORSAKEN REALM",726,501,14,210);c.restore();}
 public boolean performClick(){super.performClick();return true;}
 public boolean onTouchEvent(MotionEvent e){float x=f.x(e.getX()),y=f.y(e.getY());if(e.getActionMasked()==MotionEvent.ACTION_DOWN){downX=x;downY=y;return true;}if(e.getActionMasked()!=MotionEvent.ACTION_UP)return true;if(Math.hypot(x-downX,y-downY)>14)return true;performClick();if(x>=24&&x<=209&&y>=80&&y<437&&(y-80)%61<51){category=(int)((y-80)/61);invalidate();}else if(x>=240&&x<=551&&y>=142){int row=(int)((y-142)/83);if(row<options[category].length&&(y-142)%83<=69){host.select(options[category][row]);invalidate();}}else if(x>=598&&x<=921&&y>=344&&y<=389){host.select(6);}if(x>=24&&x<=290&&y>=474&&y<=517)host.back();return true;}
}

package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import android.view.*;
final class RealmMenuView extends View {
 static final int MAIN=0,SETTINGS=1,MISSION=2,COMPANION=3,CLAN=4,EXIT=5;
 interface Host{void select(int option);void resume();default Bitmap preview(){return null;}default boolean missionActive(){return false;}}
 final Host host;final MenuFrame f=new MenuFrame();final Bitmap scene;float downX,downY;boolean pressed;
 final String[] names={"MAIN MENU","SETTINGS","MISSION","COMPANION","CLAN & KINGDOM","EXIT GAME"};
 RealmMenuView(Context c,Host h){super(c);host=h;scene=h.preview();setContentDescription("Realm menu. Main menu, Settings, active Mission, Companion, Clan and Kingdom, Exit game.");}
 int[] options(){return host.missionActive()?new int[]{MAIN,SETTINGS,MISSION,COMPANION,CLAN,EXIT}:new int[]{MAIN,SETTINGS,COMPANION,CLAN,EXIT};}
 protected void onDraw(Canvas c){f.begin(c,this);f.brand(c);f.text(c,"REALM MENU",358,49,28,560);int[] rows=options();for(int i=0;i<rows.length;i++){float y=98+i*55;f.panel(c,24,y,284,47,false);f.text(c,names[rows[i]],39,y+30,18,254);}f.panel(c,326,98,610,347,false);if(scene!=null){f.paint.setColor(Color.WHITE);c.drawBitmap(scene,null,new RectF(335,107,927,406),f.paint);}else f.text(c,"FORSAKEN REALM",352,182,27,555);f.text(c,"Select an option to continue",350,432,16,550);f.panel(c,646,468,292,48,true);f.text(c,"RESUME GAME",702,500,22,220);f.text(c,"Your online world continues while menus are open.",24,500,14,595);c.restore();}
 public boolean performClick(){super.performClick();return true;}
 public boolean onTouchEvent(MotionEvent e){float x=f.x(e.getX()),y=f.y(e.getY());if(e.getActionMasked()==MotionEvent.ACTION_DOWN){pressed=true;downX=x;downY=y;return true;}if(e.getActionMasked()==MotionEvent.ACTION_CANCEL){pressed=false;return true;}if(e.getActionMasked()!=MotionEvent.ACTION_UP||!pressed)return true;pressed=false;if(Math.hypot(x-downX,y-downY)>14)return true;performClick();if(x>=646&&x<=938&&y>=468&&y<=516)host.resume();else if(x>=24&&x<=308&&y>=98){int row=(int)((y-98)/55);int[] rows=options();if(row<rows.length&&(y-98)%55<=47)host.select(rows[row]);}return true;}
}

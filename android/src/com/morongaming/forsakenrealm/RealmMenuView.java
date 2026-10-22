package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import android.view.*;
/** One full-screen menu replaces the scattered utility buttons without removing their actions. */
final class RealmMenuView extends View {
 interface Host{void select(int option);void resume();}
 final Host host;final MenuFrame f=new MenuFrame();float downX,downY;boolean pressed;
 final String[] names={"BACKPACK","CRAFTING","SKILLS & TECHNOLOGY","COMPANION","CLAN & KINGDOM","SETTINGS","HOME & BASE","MAIN MENU","WORLD MAP"};
 final String[] details={"Equipment, items and nearby storage","Recipes and workbenches","Mastery, skills and blueprints","Commands, riding and equipment","Members, ranks and territory","Graphics, interface and controls","Property, construction and rest","Return to character and play screens","Explore your realm"};
 RealmMenuView(Context c,Host h){super(c);host=h;setContentDescription("Realm menu. Backpack, Crafting, Skills, Companion, Clan, Settings, Home, Main menu and World map. Resume returns to play.");}
 protected void onDraw(Canvas c){f.begin(c,this);f.title(c,"THE REALM",24,38,400);f.text(c,"YOUR JOURNEY",24,76,14,400);for(int i=0;i<names.length;i++){float x=24+i%3*310,y=102+i/3*116;f.panel(c,x,y,292,100,false);f.text(c,names[i],x+16,y+34,20,260);f.wrap(c,details[i],x+16,y+62,260,2);}f.panel(c,646,468,292,48,true);f.text(c,"RESUME GAME",702,500,22,220);f.text(c,"Backpack and Menu keep everything within reach.",24,500,15,600);c.restore();}
 public boolean performClick(){super.performClick();return true;}
 public boolean onTouchEvent(MotionEvent e){float x=f.x(e.getX()),y=f.y(e.getY());if(e.getActionMasked()==MotionEvent.ACTION_DOWN){pressed=true;downX=x;downY=y;return true;}if(e.getActionMasked()==MotionEvent.ACTION_CANCEL){pressed=false;return true;}if(e.getActionMasked()!=MotionEvent.ACTION_UP||!pressed)return true;pressed=false;if(Math.hypot(x-downX,y-downY)>14)return true;performClick();if(x>=646&&x<=938&&y>=468&&y<=516)host.resume();else for(int i=0;i<names.length;i++){float xx=24+i%3*310,yy=102+i/3*116;if(x>=xx&&x<=xx+292&&y>=yy&&y<=yy+100){host.select(i);break;}}return true;}
}

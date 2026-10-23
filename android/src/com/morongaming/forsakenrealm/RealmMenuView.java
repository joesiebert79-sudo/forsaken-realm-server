package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import android.view.*;
/** One full-screen menu replaces the scattered utility buttons without removing their actions. */
final class RealmMenuView extends View {
 interface Host{void select(int option);void resume();default Bitmap preview(){return null;}}
 final Host host;final MenuFrame f=new MenuFrame();final Bitmap scene;float downX,downY;boolean pressed;
 final String[] names={"BACKPACK","CRAFTING","SKILLS & TECHNOLOGY","COMPANION","CLAN & KINGDOM","SETTINGS","HOME & BASE","MAIN MENU","WORLD MAP"};
 final String[] details={"Equipment, items and nearby storage","Recipes and workbenches","Mastery, skills and blueprints","Commands, riding and equipment","Members, ranks and territory","Graphics, interface and controls","Property, construction and rest","Return to character and play screens","Explore your realm"};
 RealmMenuView(Context c,Host h){super(c);host=h;scene=h.preview();setContentDescription("Realm menu. Backpack, Crafting, Skills, Companion, Clan, Settings, Home, Main menu and World map. Resume returns to play.");}
 protected void onDraw(Canvas c){f.begin(c,this);f.brand(c);f.text(c,"REALM MENU",358,49,28,560);for(int i=0;i<names.length;i++){float y=98+i*39;f.panel(c,24,y,284,35,false);f.text(c,names[i],39,y+24,17,254);}f.panel(c,326,98,610,347,false);if(scene!=null){f.paint.setColor(Color.WHITE);c.drawBitmap(scene,null,new RectF(335,107,927,406),f.paint);}else{f.text(c,"FORSAKEN REALM",352,182,27,555);f.wrap(c,"Your backpack, crafting, skills, companion and home remain one menu away.",352,237,540,3);}f.text(c,"Select an option to open its full menu",350,432,16,550);f.panel(c,646,468,292,48,true);f.text(c,"RESUME GAME",702,500,22,220);f.text(c,"Your online world continues while menus are open.",24,500,14,595);c.restore();}
 public boolean performClick(){super.performClick();return true;}
 public boolean onTouchEvent(MotionEvent e){float x=f.x(e.getX()),y=f.y(e.getY());if(e.getActionMasked()==MotionEvent.ACTION_DOWN){pressed=true;downX=x;downY=y;return true;}if(e.getActionMasked()==MotionEvent.ACTION_CANCEL){pressed=false;return true;}if(e.getActionMasked()!=MotionEvent.ACTION_UP||!pressed)return true;pressed=false;if(Math.hypot(x-downX,y-downY)>14)return true;performClick();if(x>=646&&x<=938&&y>=468&&y<=516)host.resume();else if(x>=24&&x<=308&&y>=98&&y<449&&(y-98)%39<=35)host.select((int)((y-98)/39));return true;}
}


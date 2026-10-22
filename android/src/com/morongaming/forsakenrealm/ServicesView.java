package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import android.view.*;import org.json.*;
/** Fixed-page services and categorized shop; prices and ownership come from the server. */
final class ServicesView extends View {
 interface Host {long gold();JSONObject data();String status();void select(JSONObject row);void close();default void navigate(int n){close();}}
 final MenuFrame chrome=new MenuFrame();final Host host;final MarketView store;final Paint p=new Paint(3);int page,tab;float shopOffset,downX,downY,lastX;boolean dragging,shopGesture,touchActive;float scale=1,left,top;
 ServicesView(Context c,Host h){super(c);host=h;store=tabs()!=null?new MarketView(c,h):null;setContentDescription(store!=null?"Realm Store":"Realm service menu");}
 void text(Canvas c,String s,float x,float y,float size,int color,float width){p.setTextSize(size);while(p.measureText(s)>width&&p.getTextSize()>10)p.setTextSize(p.getTextSize()-1);if(p.measureText(s)>width){while(s.length()>1&&p.measureText(s+"…")>width)s=s.substring(0,s.length()-1);s+="…";}p.setColor(color);c.drawText(s,x,y,p);}
 JSONArray tabs(){JSONObject d=host.data();return d==null?null:d.optJSONArray("tabs");}
 JSONArray rows(){JSONObject d=host.data();JSONArray all=d==null?null:d.optJSONArray("rows"),filtered=new JSONArray();if(all==null)return filtered;return all;}
 void art(Canvas c,JSONObject a,float x,float y){if(a!=null&&a.has("item"))MenuArt.get(getContext()).item(c,a.optString("item"),x,y,48);else CosmeticArt.draw(c,a,x,y,p);}

 protected void onDraw(Canvas c){if(store!=null){store.layout(0,0,getWidth(),getHeight());store.draw(c);return;}scale=Math.min(getWidth()/960f,getHeight()/540f);left=(getWidth()-960*scale)/2;top=(getHeight()-540*scale)/2;MenuArt.get(getContext()).backdrop(c);c.save();c.translate(left,top);c.scale(scale,scale);JSONObject d=host.data();text(c,d==null?"SERVICE":d.optString("title"),24,38,24,0xffe8d6ad,550);text(c,"Gold: "+host.gold(),600,38,18,0xffe3c46f,215);text(c,"CLOSE",850,38,18,0xffe8d6ad,90);JSONArray ts=tabs();boolean shop=ts!=null;float start=shop?100:66;int perPage=shop?5:6;if(shop)for(int i=0;i<ts.length();i++){float x=24+i*228;p.setColor(i==tab?0xff73613a:0xff28352c);c.drawRoundRect(x,52,x+218,87,4,4,p);text(c,ts.optString(i),x+12,76,17,0xffeee1be,195);}JSONArray list=rows();int count=list.length(),pages=Math.max(1,(count+perPage-1)/perPage);page=Math.min(page,pages-1);if(count==0)text(c,"No entries available.",24,start+38,18,Color.WHITE,900);for(int i=0;i<perPage&&page*perPage+i<count;i++){JSONObject row=list.optJSONObject(page*perPage+i);float y=start+i*62;p.setColor(row.optJSONObject("action")==null?0xff26322c:0xff514a33);chrome.panel(c,24,y,912,55,row.optJSONObject("action")!=null);JSONObject icon=row.optJSONObject("art");art(c,icon,30,y+3);float x=icon==null?38:88;text(c,row.optString("name"),x,y+22,18,0xfff1e5cb,920-x);text(c,row.optString("detail"),x,y+44,14,0xffc6cbbb,920-x);}text(c,"< PREVIOUS",30,471,17,Color.WHITE,180);text(c,(page+1)+" / "+pages,450,471,17,Color.WHITE,150);text(c,"NEXT >",815,471,17,Color.WHITE,130);text(c,host.status(),24,515,14,0xffe3c88f,900);c.restore();}
 public boolean onTouchEvent(MotionEvent e){if(store!=null){boolean used=store.onTouchEvent(e);invalidate();return used;}if(e.getActionMasked()!=MotionEvent.ACTION_UP)return true;float x=(e.getX()-left)/scale,y=(e.getY()-top)/scale;if(x>820&&y<50){host.close();return true;}JSONArray ts=tabs();if(ts!=null&&y>=52&&y<=87&&x>=24&&x<936){tab=Math.min(ts.length()-1,(int)((x-24)/228));page=0;invalidate();return true;}float start=ts==null?66:100;int perPage=ts==null?6:5;JSONArray list=rows();if(y>=start&&y<start+perPage*62&&x>=24&&x<=936){int i=(int)((y-start)/62)+page*perPage;if((y-start)%62<=55&&i<list.length()){JSONObject row=list.optJSONObject(i);if(row.optJSONObject("action")!=null)host.select(row);}}if(y>=444&&y<=485){if(x<220)page=Math.max(0,page-1);else if(x>760)page=Math.min(Math.max(0,(list.length()-1)/perPage),page+1);invalidate();}return true;}

 String price(JSONObject row){String group=row.optString("group"),detail=row.optString("detail");if("Catalog".equals(group)||"Marketplace".equals(group)){int cut=detail.indexOf(" • ");return cut<0?detail:detail.substring(0,cut);}if("Cash".equals(group)){String name=row.optString("name");int cut=name.lastIndexOf(" — ");return cut<0?"Unavailable":name.substring(cut+3);}return "Owned item";}
 String description(JSONObject row){String detail=row.optString("detail"),group=row.optString("group");if("Catalog".equals(group)||"Marketplace".equals(group)){int cut=detail.indexOf(" • ");if(cut>=0)return detail.substring(cut+3);}return detail;}
 float maxOffset(){return Math.max(0,rows().length()*304f-912);}
 void wrap(Canvas c,String value,float x,float y,float width,int lines){p.setTextSize(16);String rest=value;for(int line=0;line<lines&&!rest.isEmpty();line++){int end=p.breakText(rest,true,width,null);if(end<rest.length()){int space=rest.lastIndexOf(' ',end);if(space>0)end=space;}if(end<=0)break;String part=rest.substring(0,end);rest=rest.substring(end).trim();text(c,part+(line==lines-1&&!rest.isEmpty()?"…":""),x,y+line*22,16,0xffded5bf,width);}}
 void drawShop(Canvas c){
 scale=Math.min(getWidth()/960f,getHeight()/540f);left=(getWidth()-960*scale)/2;top=(getHeight()-540*scale)/2;
 MenuArt.get(getContext()).backdrop(c);c.save();c.translate(left,top);c.scale(scale,scale);
 text(c,"REALM STORE",24,38,24,0xffe8d6ad,540);text(c,"Gold: "+host.gold(),600,38,18,0xffe3c46f,215);text(c,"CLOSE",850,38,18,0xffe8d6ad,90);
 text(c,"Swipe left or right • Tap an item for full details",24,72,16,0xffc6cbbb,900);
 JSONArray list=rows();shopOffset=Math.max(0,Math.min(maxOffset(),shopOffset));c.save();c.clipRect(24,88,936,438);
 for(int i=0;i<list.length();i++){float x=24+i*304-shopOffset;if(x+288<24||x>936)continue;JSONObject row=list.optJSONObject(i);if(row==null)continue;
 p.setColor(0xff28332d);c.drawRoundRect(x,90,x+288,432,10,10,p);
 text(c,row.optString("group"),x+16,116,13,0xffd4b778,256);
 c.save();c.translate(x+96,126);c.scale(2,2);art(c,row.optJSONObject("art"),0,0);c.restore();
 wrap(c,row.optString("name"),x+16,250,256,2);text(c,price(row),x+16,300,20,0xffffd777,256);wrap(c,description(row),x+16,326,256,3);
 text(c,row.optJSONObject("action")==null?"VIEW DETAILS":"DETAILS & OPTIONS",x+16,414,15,0xffe3c46f,256);
 }c.restore();if(list.length()==0)text(c,"No entries available.",24,150,18,Color.WHITE,900);
 text(c,"< PREVIOUS",24,470,17,Color.WHITE,180);text(c,list.length()+" listings",420,470,17,0xffe8d6ad,200);text(c,"NEXT >",815,470,17,Color.WHITE,130);
 text(c,host.status(),24,515,14,0xffe3c88f,900);c.restore();
 }
 boolean touchShop(MotionEvent e){
 float x=(e.getX()-left)/scale,y=(e.getY()-top)/scale;int action=e.getActionMasked();
 if(action==MotionEvent.ACTION_DOWN){downX=lastX=x;downY=y;touchActive=true;dragging=false;shopGesture=x>=24&&x<=936&&y>=88&&y<=438;return true;}
 if(action==MotionEvent.ACTION_POINTER_DOWN){touchActive=false;shopGesture=false;dragging=false;return true;}
 if(action==MotionEvent.ACTION_MOVE){if(!touchActive)return true;if(Math.hypot(x-downX,y-downY)>10)dragging=true;if(dragging&&shopGesture){shopOffset=Math.max(0,Math.min(maxOffset(),shopOffset+lastX-x));invalidate();}lastX=x;return true;}
 if(action==MotionEvent.ACTION_CANCEL){touchActive=false;shopGesture=false;dragging=false;return true;}
 if(action!=MotionEvent.ACTION_UP)return true;
 if(!touchActive)return true;touchActive=false;
 if(dragging){dragging=false;return true;}if(downX>820&&downY>=0&&downY<50&&x>820&&y>=0&&y<50){host.close();return true;}
 if(downY>=444&&downY<=485&&y>=444&&y<=485){if(x<220)shopOffset=Math.max(0,shopOffset-304);else if(x>760)shopOffset=Math.min(maxOffset(),shopOffset+304);invalidate();return true;}
 if(shopGesture&&x>=24&&x<=936&&y>=90&&y<=432){float pos=x-24+shopOffset;int index=(int)(pos/304);JSONArray list=rows();if(pos%304>288||index>=list.length())return true;final JSONObject row=list.optJSONObject(index);if(row==null)return true;
 android.app.AlertDialog.Builder dialog=new android.app.AlertDialog.Builder(getContext()).setTitle(row.optString("name")).setMessage(row.optString("group")+"\n\n"+row.optString("detail")).setNegativeButton("Back",null);
 if(row.optJSONObject("action")!=null)dialog.setPositiveButton("Continue",(d,which)->host.select(row));dialog.show();}
 return true;
 }

}



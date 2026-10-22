package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import android.view.*;import org.json.*;
/** Five visible skills, fixed layout, tap-to-train and explicit token refunds. */
final class SkillsView extends View {
 interface Host {JSONObject data();JSONObject player();String status();void learn(String id);void reclaim(String token,JSONObject ranks);void close();}
 private final Host host;private final Paint paint=new Paint(3);private float scale,left,top;private int page=0;private JSONObject selected=new JSONObject();
 SkillsView(Context c,Host h){super(c);host=h;setContentDescription("Character level and skill progression");}
 private void text(Canvas c,String s,float x,float y,int size,int color){paint.setColor(color);paint.setTextSize(size);c.drawText(s,x,y,paint);}
 private void box(Canvas c,float x,float y,float w,float h,int color){paint.setColor(color);c.drawRoundRect(x,y,x+w,y+h,5,5,paint);}
 private JSONArray nodes(){JSONObject d=host.data();return d==null?new JSONArray():d.optJSONArray("nodes");}
 private int refund(){int points=0;JSONArray ns=nodes();if(ns!=null)for(int i=0;i<ns.length();i++){JSONObject n=ns.optJSONObject(i);int rank=n.optInt("rank"),take=selected.optInt(n.optString("id"));JSONArray costs=n.optJSONArray("costs");if(take>rank)return -1;for(int j=rank-take;j<rank;j++)points+=costs.optInt(j);}return points;}
 protected void onDraw(Canvas c){scale=Math.min(getWidth()/960f,getHeight()/540f);left=(getWidth()-960*scale)/2;top=(getHeight()-540*scale)/2;MenuArt.get(getContext()).backdrop(c);c.save();c.translate(left,top);c.scale(scale,scale);JSONObject d=host.data();
 text(c,d==null?"SKILLS":d.optString("title","CHARACTER SKILLS"),25,35,24,0xfff4dfad);text(c,"CLOSE",850,35,18,0xfff4dfad);
 if(d==null||!d.optBoolean("configured")){text(c,"Update the server to enable skill progression.",25,100,20,Color.WHITE);c.restore();return;}
 text(c,"Level "+d.optLong("level")+"    XP "+d.optString("xp")+" / "+d.optString("nextLevelXp"),25,67,18,0xffd3c7ac);text(c,"Available points: "+d.optInt("skillPoints"),685,67,18,0xffe8cf94);
 JSONArray ns=nodes();if(ns!=null)for(int i=0;i<Math.min(5,ns.length()-page*5);i++){JSONObject n=ns.optJSONObject(page*5+i);int rank=n.optInt("rank"),take=selected.optInt(n.optString("id"));JSONArray costs=n.optJSONArray("costs");int cost=costs.optInt(rank);float y=82+i*61;
 box(c,25,y,910,55,0xff25342b);text(c,n.optString("name")+"   "+rank+" / "+costs.length(),39,y+22,18,0xffeee4cf);text(c,n.optString("description"),39,y+44,14,0xffbac9b3);
 JSONObject req=n.optJSONObject("requires");String hint="";if(req!=null){java.util.Iterator<String> keys=req.keys();while(keys.hasNext()){String k=keys.next();String name=k;for(int j=0;j<ns.length();j++)if(ns.optJSONObject(j).optString("id").equals(k))name=ns.optJSONObject(j).optString("name");hint=name+" "+req.optInt(k);}}
 text(c,hint,440,y+32,13,0xffc9b98d);box(c,650,y+5,160,45,rank<costs.length()?0xff78613b:0xff394038);text(c,rank>=costs.length()?"TRAINED":"TRAIN • "+cost+" pt",665,y+33,16,Color.WHITE);
 if(d.optBoolean("canReclaim",true)){box(c,820,y+5,103,45,0xff39463d);text(c,"UNDO "+take,829,y+33,15,0xffe4dbc9);}}
 text(c,d.optString("rankCosts","Rank costs: 1, 1, 2, 2, 3 points."),25,408,14,0xffcfbb93);if(ns!=null&&ns.length()>5)text(c,"< PAGE "+(page+1)+" / "+((ns.length()+4)/5)+" >",690,408,15,Color.WHITE);
 if(d.optBoolean("canReclaim",true)){
 int points=refund();text(c,"Refund selected: "+points+" pts",25,441,17,Color.WHITE);JSONObject inventory=host.player().optJSONObject("inventory");String[] tokens={"reclamationMinor","reclamationGreater","reclamationSuperior"};String[] labels={"Minor • 1 pt","Greater • 3 pts","Superior • 5 pts"};int[] amounts={1,3,5};
 for(int i=0;i<3;i++){int count=inventory==null?0:inventory.optInt(tokens[i]);box(c,280+i*217,418,207,40,points==amounts[i]&&count>0?0xff78613b:0xff394038);text(c,labels[i]+" ("+count+")",290+i*217,444,15,Color.WHITE);}
 text(c,"Reclamation consumes one carried token. Prerequisites must remain trained.",25,482,15,0xffbac9b3);}String status=host.status();text(c,status.length()>100?status.substring(0,100):status,25,516,15,0xffdee4d8);c.restore();}
 public boolean onTouchEvent(MotionEvent e){if(e.getActionMasked()!=MotionEvent.ACTION_UP)return true;if(scale<=0)return true;float x=(e.getX()-left)/scale,y=(e.getY()-top)/scale;if(x>=825&&y>=0&&y<50){host.close();return true;}JSONArray ns=nodes();if(ns==null)return true;
 if(y>=82&&y<387){int i=page*5+(int)((y-82)/61);if(i>=ns.length()||(y-82)%61>55)return true;JSONObject n=ns.optJSONObject(i);String id=n.optString("id");if(x>=650&&x<810){selected=new JSONObject();host.learn(id);}else if(x>=820&&x<=923&&host.data().optBoolean("canReclaim",true)){try{int count=(selected.optInt(id)+1)%(n.optInt("rank")+1);if(count==0)selected.remove(id);else selected.put(id,count);}catch(JSONException ignored){}}invalidate();}
 if(y>=387&&y<=415&&x>=680&&ns.length()>5){page=(page+1)%((ns.length()+4)/5);invalidate();}
 if(host.data()!=null&&host.data().optBoolean("canReclaim",true)&&y>=418&&y<=458&&x>=280&&x<931){int i=(int)((x-280)/217);if(i<3){String[] tokens={"reclamationMinor","reclamationGreater","reclamationSuperior"};int[] amounts={1,3,5};JSONObject inventory=host.player().optJSONObject("inventory");if(refund()==amounts[i]&&inventory!=null&&inventory.optInt(tokens[i])>0){host.reclaim(tokens[i],selected);selected=new JSONObject();invalidate();}}}return true;}
}



package com.morongaming.forsakenrealm;
import java.util.ArrayList;
import org.json.JSONArray;
import org.json.JSONObject;

/** Presentation only: stable scenery for the southeast camp, never harvest nodes. */
final class BanditCampScenery {
 final JSONArray ground=new JSONArray();
 final ArrayList<JSONObject> props=new ArrayList<>();
 private final JSONObject town;
 private final JSONArray buildings,roads,highways;
 private BanditCampScenery(JSONObject state,JSONObject town){
  this.town=town;buildings=state.optJSONArray("mapBuildings")!=null?state.optJSONArray("mapBuildings"):state.optJSONArray("village");
  JSONObject map=state.optJSONObject("worldMap");
  highways=map==null?null:map.optJSONArray("roads");
  roads=map!=null&&map.optJSONArray("paths")!=null?map.optJSONArray("paths"):state.optJSONArray("roads");
  double tx=town.optDouble("x"),ty=town.optDouble("y");
  // Irregular groves and undergrowth occupy gaps, leaving the central crossing open.
  for(int row=-5;row<=5;row++)for(int col=-5;col<=5;col++){
   int seed=Math.floorMod(row*7919+col*104729,997);
   double x=tx+col*148+(seed%63)-31,y=ty+row*148+(seed%47)-23;
   int cell=(seed%4==0)?0:1;double width=cell==0?165+seed%55:58+seed%25;
   if(clear(x,y,cell==0?100:44)){
    prop(x,y,cell,width);
    if(cell==0)for(int j=0;j<3;j++){double bx=x-65+j*57,by=y+65+(j%2)*28;if(clear(bx,by,44)){prop(bx,by,1,55+j*7);bed(bx,by);}}
   }
  }
  // Short timber boundaries and planted beds around the four existing shops.
  if(buildings!=null)for(int i=0;i<buildings.length();i++){
   JSONObject b=buildings.optJSONObject(i);if(b==null||!b.optString("id").startsWith("day2-bandit-"))continue;
   double x=b.optDouble("x"),y=b.optDouble("y"),a=b.optDouble("halfWidth",125)+85,back=y-b.optDouble("depth",80)-90;
   // Fenced side gardens mirror the reference's layered yards.
   for(int side:new int[]{-1,1})for(int k=0;k<3;k++){
    double gx=x+side*(a+62),gy=back+65+k*95;
    if(clear(gx,gy,55)){
     bed(gx,gy);fence(gx-29,gy-36,gx+29,gy-36);fence(gx-29,gy+36,gx+29,gy+36);
     fence(gx-29,gy-36,gx-29,gy+36);fence(gx+29,gy-36,gx+29,gy+36);
     if(k==0&&clear(gx,gy,100))prop(gx,gy,0,145);else prop(gx,gy,1,64);
    }
   }
   for(int side:new int[]{-1,1}){
    double lx=x+side*(a-12),ly=y+245;
    if(clear(lx,ly,32))prop(lx,ly,3,52);
   }
   fence(x-a,back,x+a,back);fence(x-a,back,x-a,y+130);fence(x+a,back,x+a,y+130);
   for(int side:new int[]{-1,1}){
    double px=x+side*a,py=y+105;
    if(clear(px,py,32)){prop(px,py,3,48);}
    for(int k=0;k<3;k++){double bx=x+side*(a+48),by=y-110+k*72;if(clear(bx,by,40)){prop(bx,by,1,70);bed(bx,by);}}
   }
  }
 }
 static BanditCampScenery create(JSONObject state){
  if(state==null||state.optJSONObject("room")!=null)return null;
  JSONArray towns=state.optJSONArray("towns");if(towns==null)towns=state.optJSONArray("settlements");if(towns==null)return null;
  JSONObject p=state.optJSONObject("you");if(p==null)return null;
  for(int i=0;i<towns.length();i++){JSONObject t=towns.optJSONObject(i);if(t!=null&&t.optString("id").equals("day2-bandit")&&Math.hypot(p.optDouble("x")-t.optDouble("x"),p.optDouble("y")-t.optDouble("y"))<2100)return new BanditCampScenery(state,t);}
  return null;
 }
 private boolean clear(double x,double y,double margin){
  double tx=town.optDouble("x"),ty=town.optDouble("y");
  if(Math.abs(x-tx)<100+margin||Math.abs(y-ty-95)<85+margin)return false;
  if(buildings!=null)for(int i=0;i<buildings.length();i++){JSONObject b=buildings.optJSONObject(i);if(b==null)continue;double bx=b.optDouble("x"),by=b.optDouble("y");
   if(Math.abs(x-bx)<b.optDouble("halfWidth",125)+margin&&y>by-b.optDouble("depth",80)-margin&&y<by+65+margin)return false;
   if(Math.abs(x-bx)<85+margin&&y>=by&&y<by+230+margin)return false;
  }
  return !nearRoad(roads,x,y,margin)&&!nearRoad(highways,x,y,margin);
 }
 private static boolean nearRoad(JSONArray roads,double x,double y,double margin){
  if(roads==null)return false;for(int i=0;i<roads.length();i++){JSONObject r=roads.optJSONObject(i);if(r==null)continue;JSONArray points=r.optJSONArray("points");if(points==null)continue;
   for(int j=1;j<points.length();j++){JSONObject a=points.optJSONObject(j-1),b=points.optJSONObject(j);if(a==null||b==null)continue;double ax=a.optDouble("x"),ay=a.optDouble("y"),dx=b.optDouble("x")-ax,dy=b.optDouble("y")-ay,len=dx*dx+dy*dy,t=len==0?0:Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/len));if(Math.hypot(x-ax-t*dx,y-ay-t*dy)<r.optDouble("width",40)/2+margin)return true;}
  }return false;
 }
 private void prop(double x,double y,int cell,double width){try{props.add(new JSONObject().put("id","bandit-scenery-"+props.size()).put("x",x).put("y",y).put("cell",cell).put("width",width));}catch(Exception ignored){}}
 private void bed(double x,double y){try{ground.put(new JSONObject().put("kind","flowerGarden").put("x",x).put("y",y).put("x2",x).put("y2",y));}catch(Exception ignored){}}
 private void fence(double x,double y,double x2,double y2){int n=(int)Math.ceil(Math.hypot(x2-x,y2-y)/28);for(int i=0;i<n;i++){double ax=x+(x2-x)*i/n,ay=y+(y2-y)*i/n,bx=x+(x2-x)*(i+1)/n,by=y+(y2-y)*(i+1)/n;if(!clear(ax,ay,22)||!clear((ax+bx)/2,(ay+by)/2,22)||!clear(bx,by,22))continue;try{ground.put(new JSONObject().put("kind","fence").put("x",ax).put("y",ay).put("x2",bx).put("y2",by));}catch(Exception ignored){}}}
}

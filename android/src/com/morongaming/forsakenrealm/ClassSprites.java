package com.morongaming.forsakenrealm;
import android.graphics.*;
import org.json.*;
import java.util.*;
/** Small pixel silhouettes. Presentation only: the server remains authoritative. */
final class ClassSprites {
 static final String[] CLASSES={"melee","ranged","mage","rogue","paladin","necromancer"};
 static final int WIDTH=160,HEIGHT=192,MAX_FRAMES=64;
 private static final Paint ink=new Paint();
 private static final LinkedHashMap<String,Bitmap> frames=new LinkedHashMap<String,Bitmap>(MAX_FRAMES,.75f,true){protected boolean removeEldestEntry(Map.Entry<String,Bitmap> e){return size()>MAX_FRAMES;}};
 private static final LinkedHashMap<String,Pose> poses=new LinkedHashMap<String,Pose>(128,.75f,true){protected boolean removeEldestEntry(Map.Entry<String,Pose> e){return size()>128;}};
 private static final class Pose{double x,y;boolean ready;int row;String room;}
 static boolean supported(String role){for(String id:CLASSES)if(id.equals(role))return true;return false;}
 static int walkFrame(float phase,boolean moving){if(!moving||(Float.isNaN(phase)||Float.isInfinite(phase)))return 0;return 1+(((int)Math.floor(phase/(Math.PI*.5))%4+4)%4);}
 static int attackFrame(float phase){return !Float.isFinite(phase)||phase<0?-1:Math.min(3,(int)(phase*4));}
 static int cachedFrames(){return frames.size();}
 static int row(JSONObject gear,float attack,float aim,boolean left){String id=gear.optString("id","preview"),room=gear.optString("interior");Pose pose=poses.get(id);if(pose==null){pose=new Pose();poses.put(id,pose);}double x=gear.optDouble("x"),y=gear.optDouble("y");if(pose.ready&&room.equals(pose.room)){double dx=x-pose.x,dy=y-pose.y,sx=dx-dy,sy=(dx+dy)*.5;if(Math.hypot(dx,dy)>.2&&Math.hypot(dx,dy)<180)pose.row=Math.abs(sx)>Math.abs(sy)*1.5?(sx<0?3:2):(sy<0?1:0);}else pose.row=left?3:0;pose.ready=true;pose.x=x;pose.y=y;pose.room=room;if(attack>=0&&(!Float.isNaN(aim)&&!Float.isInfinite(aim))){double rad=Math.toRadians(aim),sx=Math.cos(rad),sy=Math.sin(rad);return Math.abs(sx)>Math.abs(sy)*1.5?(sx<0?3:2):(sy<0?1:0);}return pose.row;}
 static boolean draw(Canvas c,JSONObject gear,float phase,boolean moving,float attack,boolean left,float aim){if(gear==null||!supported(gear.optString("role")))return false;int direction=row(gear,attack,aim,left);Bitmap b=frame(gear,direction,walkFrame(phase,moving),attackFrame(attack));ink.setColor(Color.WHITE);c.drawBitmap(b,null,new RectF(-40,-88,40,8),ink);return true;}
 static boolean preview(Canvas c,JSONObject gear,RectF bounds){if(gear==null||!supported(gear.optString("role")))return false;Bitmap b=frame(gear,0,0,-1);float scale=Math.min(bounds.width()/WIDTH,bounds.height()/HEIGHT),w=WIDTH*scale,h=HEIGHT*scale;ink.setColor(Color.WHITE);c.drawBitmap(b,null,new RectF(bounds.centerX()-w/2,bounds.bottom-h,bounds.centerX()+w/2,bounds.bottom),ink);return true;}
 private static String slot(JSONObject g,String s){JSONObject a=g.optJSONObject("armorSlots");return a==null?g.optString(s.equals("helmet")?"equippedHelmet":s.equals("chest")?"equippedArmour":""):a.optString(s);}
 static Bitmap frame(JSONObject g,int row,int walk,int attack){String role=g.optString("role"),chest=slot(g,"chest"),helmet=slot(g,"helmet"),weapon=g.optString("equippedWeapon"),look=g.optString("appearance");boolean shield=g.optBoolean("equippedShield"),block=g.optLong("blockUntil")>System.currentTimeMillis();row=((row%4+4)%4);walk=Math.max(0,Math.min(4,walk));attack=Math.max(-1,Math.min(3,attack));String key=role+":"+look+":"+chest+":"+helmet+":"+weapon+":"+shield+":"+block+":"+row+":"+walk+":"+attack;Bitmap b=frames.get(key);if(b!=null)return b;b=Bitmap.createBitmap(WIDTH,HEIGHT,Bitmap.Config.ARGB_8888);Canvas c=new Canvas(b);c.scale(2,2);c.translate(40,88);paint(c,role,look,chest,helmet,weapon,shield,block,row,walk,attack);relief(c,role,look,chest,row,walk);frames.put(key,b);return b;}
 private static void box(Canvas c,int color,int x,int y,int w,int h){ink.setColor(color);c.drawRect(x,y,x+w,y+h,ink);}
 private static void paint(Canvas c,String role,String look,String chest,String helmet,String weapon,boolean shield,boolean block,int row,int walk,int attack){
  boolean side=row>=2,back=row==1,female=look.startsWith("female"),robe=role.equals("mage")||role.equals("necromancer"),heavy=role.equals("paladin"),hood=robe||role.equals("ranged")||role.equals("rogue"),sturdy=look.endsWith("2");
  if(row==3)c.scale(-1,1);int stride=walk==1?3:walk==3?-3:0,bob=walk==2||walk==4?-1:0;c.translate(0,bob);
  final int edge=0xff151519,skin=0xffc59d7c,hair=female?0xffb49a6b:0xff47352d,boot=0xff302823,gold=0xffb99a59,steel=0xffa2a5a2,light=0xffd4cbb0;
  int cloth=role.equals("mage")?0xff24395e:role.equals("ranged")?0xff3d4939:role.equals("rogue")?0xff303038:role.equals("necromancer")?0xff25232d:heavy?0xffb4aea0:0xff655044;
  int accent=role.equals("mage")?0xff5483ba:role.equals("necromancer")?0xff9d303b:role.equals("ranged")?0xff788362:0xff8d3030;
  int armor=chest.startsWith("mail")||chest.startsWith("plate")||chest.startsWith("royal")?0xff858b8b:chest.startsWith("hide")||chest.equals("tunic")?0xff73543d:cloth;
  // Cloaks, robe hems and quivers distinguish the silhouettes even at small zoom.
  if(robe||role.equals("ranged")||role.equals("rogue")){box(c,edge,-12,-54,25,47);box(c,cloth,-10,-52,21,43);box(c,accent,-10,-12,21,3);box(c,0xff1c1c24,side?-10:6,-48,4,36);}
  if(role.equals("ranged")){box(c,edge,8,-53,8,29);box(c,0xff745033,9,-51,6,25);for(int i=0;i<3;i++){box(c,light,9+i*2,-62-i%2*2,1,14);box(c,0xff8c7956,9+i*2,-60-i%2*2,2,3);}}
  int hip=side?3:6;for(int leg=0;leg<2;leg++){int x=leg==0?-hip:hip-4,s=leg==0?stride:-stride;box(c,edge,x-1,-25,7,25);box(c,heavy?0xff656c70:0xff49423b,x,-24,5,18);box(c,boot,x+s-1,-8,7,8);box(c,heavy?steel:0xff74533d,x+s,-7,5,2);}
  if(robe){box(c,edge,-11,-35,23,24);box(c,cloth,-10,-35,21,22);for(int x=-8;x<10;x+=5)box(c,0xff151b29,x,-31,1,15);box(c,accent,-10,-17,21,3);}
  int width=side?8:sturdy?13:female?10:12;
  box(c,edge,-width-2,-55,width*2+4,31);box(c,armor,-width,-53,width*2,28);box(c,0xff3b302b,-width+2,-50,3,21);box(c,light,-width+2,-52,width*2-4,2);
  if(heavy){box(c,steel,-width-4,-54,9,9);box(c,steel,width-5,-54,9,9);box(c,0xffd0c9b3,-7,-44,14,23);box(c,gold,-1,-43,3,17);box(c,gold,-6,-38,13,3);box(c,0xff4d5559,width-4,-41,3,11);}
  else if(role.equals("melee")){for(int i=0;i<6;i++)box(c,i%2==0?0xff4b4039:0xff847365,-width-2+i*5,-57+i%2,5,7);box(c,accent,-6,-30,12,17);box(c,gold,-width+2,-49,3,3);box(c,gold,width-5,-49,3,3);}
  else{box(c,cloth,-width+2,-49,width*2-4,21);box(c,accent,side?2:-1,-49,3,21);if(role.equals("necromancer")){for(int i=0;i<3;i++){box(c,accent,-width-3+i*2,-57-i*2,2,7);box(c,accent,width-2+i*2,-57-i*2,2,7);}}}
  box(c,edge,-width,-28,width*2,4);box(c,0xff6a482d,-width,-27,width*2,2);box(c,gold,-2,-28,5,4);
  // Open face, hair and fitted hoods avoid the old oversized helmet overlay.
  box(c,edge,-7,-72,14,18);box(c,skin,side?-4:-5,-69,side?9:11,13);box(c,hair,-6,-72,12,5);if(female){box(c,hair,-7,-67,3,17);box(c,0xffd0b67b,-6,-65,1,10);}
  if(hood){box(c,edge,-10,-73,20,5);box(c,cloth,-8,-74,16,5);box(c,cloth,-10,-69,4,15);box(c,cloth,7,-69,4,15);box(c,accent,-10,-55,21,2);}
  if(back){box(c,hood?cloth:hair,-6,-69,13,14);box(c,0xff25222a,-4,-67,2,10);}else{box(c,edge,side?3:-3,-64,2,2);if(!side)box(c,edge,3,-64,2,2);box(c,0xff8e6553,1,-59,3,1);if(!female&&role.equals("melee"))box(c,hair,-4,-59,9,4);}
  if(!helmet.isEmpty()&&!helmet.equals("null")){box(c,steel,-7,-72,14,3);box(c,0xff626b6d,-8,-69,3,9);box(c,light,-5,-72,8,1);}
  int reach=attack<0?0:attack==0?2:attack==1?8:attack==2?5:1,hy=-36+(attack==1?-4:walk>0?stride/2:0),hx=width+2+reach;
  box(c,edge,-width-6,-49,7,19);box(c,cloth,-width-5,-48,5,15);box(c,skin,-width-5,-33,5,5);box(c,edge,width-1,-49,7+reach,15);box(c,cloth,width,-48,5+reach,12);box(c,skin,hx-2,hy,5,5);
  if(!weapon.isEmpty()&&!weapon.equals("null")&&!weapon.equals("unarmed"))weapon(c,weapon,hx,hy,attack,accent);
  if(shield){int sx=block?-2:-width-7,sy=block?-49:-39;box(c,edge,sx-6,sy,13,22);box(c,heavy?steel:0xff69462f,sx-5,sy+1,11,20);box(c,gold,sx-5,sy+1,11,2);box(c,gold,sx-5,sy+19,11,2);box(c,light,sx-1,sy+8,4,5);}
  c.translate(0,-bob);if(row==3)c.scale(-1,1);
 }
 private static void fine(Canvas c,int color,float x,float y,float width,float height){ink.setColor(color);c.drawRect(x,y,x+width,y+height,ink);}
 private static void relief(Canvas c,String role,String look,String chest,int row,int walk){c.save();if(row==3)c.scale(-1,1);if(walk==2||walk==4)c.translate(0,-1);boolean side=row>=2,back=row==1,female=look.startsWith("female"),robe=role.equals("mage")||role.equals("necromancer"),plate=role.equals("paladin");int gold=0xffd1b777,shade=0xff2b2730,skin=0xffe0b897;
  // Half-unit pixels add the shading, seams and material relief of a 16-bit sprite.
  int width=side?8:look.endsWith("2")?13:female?10:12;
  fine(c,0xff12151c,-width-1,-51,.5f,24);fine(c,0xffb29b76,width-1,-50,.5f,20);fine(c,0xff211d1d,-width,-29,width*2,1);
  for(int y=-48;y<-30;y+=4){fine(c,0xff332c28,-width+1,y,2,.5f);fine(c,0xffa68b60,width-3,y,1,.5f);}
  if(!back){fine(c,0xffaa8067,-4.5f,-68.5f,2,9);fine(c,skin,-2.5f,-68,6,1);fine(c,0xffe4c5a1,1,-65,1,4);fine(c,0xff90604d,2,-60,2,1);fine(c,0xffe0bd9d,-2,-58,3,.5f);fine(c,0xff363340,side?3.5f:-3.5f,-64.5f,2.5f,1);fine(c,0xffd7d7be,side?4:-3,-64,1,.5f);if(!side){fine(c,0xff363340,3,-64.5f,2.5f,1);fine(c,0xffd7d7be,3.5f,-64,1,.5f);}}
  if(female){for(int y=-66;y<-50;y+=2){fine(c,0xffe0c98c,-6.5f,y,1,.5f);fine(c,0xff746148,-5.5f,y+1,1,.5f);}}else if(role.equals("melee")){fine(c,0xff79604a,-4,-58,1,3);fine(c,0xff725844,2,-57,1,2);}
  if(role.equals("melee")){for(int x=-width;x<width;x+=2){fine(c,x%4==0?0xffb3a18a:0xff493b31,x,-56,1,5);fine(c,0xffcebaa0,x,-55,1,.5f);}for(int y=-47;y<-32;y+=3)for(int x=-7;x<8;x+=3)fine(c,0xff9b8c73,x,y,.5f,1);fine(c,0xffaf5144,-5,-28,1,12);fine(c,gold,4,-27,.5f,11);}
  if(role.equals("ranged")||role.equals("rogue")){for(int n=0;n<16;n++){float x=-width+2+n*(width*2-4)/16f,y=-48+n;fine(c,0xff9c7951,x,y,2,1);fine(c,0xff352d29,x,y+1,2,.5f);}for(int y=-69;y<-55;y+=3){fine(c,0xff66705b,-8,y,1,1);fine(c,0xff1c2223,8,y,1,1);}fine(c,gold,1,-39,4,3);fine(c,shade,2,-38,2,1);fine(c,0xffa34840,-6,-26,11,.5f);}
  if(plate){for(int y=-49;y<-32;y+=4){fine(c,0xffedf0d8,-width-3,y,6,.5f);fine(c,0xff4c575d,width-5,y+1,7,1);}fine(c,0xffeae6ce,-6,-43,3,19);fine(c,0xff8f815f,5,-42,1,17);for(int y=-23;y<-10;y+=4){fine(c,0xffdde0d3,-5,y,3,.5f);fine(c,0xff4b555e,2,y,3,1);}fine(c,gold,-1,-41,.5f,13);fine(c,0xffe9d398,-5,-38,10,.5f);}
  if(robe){int trim=role.equals("mage")?0xffb6a06b:0xffb54d59,glint=role.equals("mage")?0xff56739d:0xff5b3847;for(int x=-8;x<10;x+=4){fine(c,glint,x,-31,1,16);fine(c,0xff111923,x+1,-28,.5f,12);}for(int x=-9;x<11;x+=3){fine(c,trim,x,-16,1,1);fine(c,trim,x,-13,1,.5f);}fine(c,trim,-8,-51,.5f,20);fine(c,trim,8,-51,.5f,20);for(int y=-69;y<-56;y+=3)fine(c,glint,-8,y,1,2);if(role.equals("necromancer")){fine(c,0xffd2c9b2,-2,-46,5,4);fine(c,shade,-1,-45,1,1);fine(c,shade,2,-45,1,1);fine(c,0xffb2a189,-1,-42,3,2);}else{fine(c,gold,-2,-46,5,5);fine(c,0xff75b7cf,-1,-45,3,3);}}
  for(int x=-width+1;x<width;x+=3)fine(c,gold,x,-26,.5f,.5f);fine(c,0xffecdaa0,-1,-27,2,.5f);c.restore();
 }
 private static void weapon(Canvas c,String id,int x,int y,int attack,int accent){int wood=0xff8c633b,metal=0xffbfc4c4,dark=0xff25252b;if(id.toLowerCase().contains("staff")){box(c,dark,x-2,y-34,5,47);box(c,wood,x-1,y-33,2,46);box(c,0xffb9974c,x-3,y-34,7,3);box(c,id.equals("emberStaff")?0xffdc7938:0xff6ba799,x-3,y-40,7,7);box(c,0xffe6d6a7,x-1,y-39,2,3);if(attack==1){box(c,accent,x-6,y-45,3,3);box(c,accent,x+6,y-41,3,3);}}
  else if(id.toLowerCase().endsWith("bow")){box(c,wood,x+3,y-25,2,30);box(c,wood,x,y-29,3,5);box(c,wood,x,y+4,3,5);box(c,0xffdfd6b1,x-2,y-27,1,34);box(c,metal,x-6,y-12,15,1);}
  else if(id.equals("mace")||id.contains("Hammer")||id.equals("hammer")){box(c,wood,x-1,y-20,3,29);box(c,dark,x-5,y-29,11,11);box(c,metal,x-4,y-28,9,8);box(c,0xffe4dfce,x-3,y-28,2,7);}
  else if(id.equals("axe")||id.equals("pickaxe")){box(c,wood,x-1,y-25,3,33);box(c,dark,x,y-28,11,10);box(c,metal,x+1,y-27,9,8);}
  else{int length=id.equals("dagger")?15:id.equals("spear")?42:28;box(c,dark,x-2,y-length-3,5,length+12);box(c,metal,x-1,y-length,3,length);box(c,0xfff0e9d4,x-1,y-length,1,length);box(c,0xffb19456,x-5,y-1,11,3);box(c,wood,x,y+2,2,7);}
 }
}

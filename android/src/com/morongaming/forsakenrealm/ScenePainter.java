package com.morongaming.forsakenrealm;
import android.graphics.*;
import org.json.*;

/** Lightweight illustrated world objects, positioned at their ground-contact point. */
final class ScenePainter {
 private final Path polygonPath=new Path();private final Paint p=new Paint(3);private final CharacterRig rig=new CharacterRig();
 final HomeArt homeArt=new HomeArt();
 final VillageArt villageArt=new VillageArt();boolean villageResources=false;
 private Bitmap atlas,buildings,materialAtlas;private int quality=1;
 private final Matrix materialMap=new Matrix();private final Path materialPath=new Path();private final float[] materialSource=new float[8],materialDest=new float[8];
 private final android.util.LruCache<String,Bitmap> buildingCache=new android.util.LruCache<String,Bitmap>(12*1024*1024){protected int sizeOf(String key,Bitmap value){return value.getByteCount();}};
 void setMaterials(Bitmap bitmap,int level){if(materialAtlas!=bitmap||quality!=level){materialAtlas=bitmap;quality=level;buildingCache.evictAll();}}

 void setBuildings(Bitmap bitmap){buildings=bitmap;}
 private final Rect source=new Rect(); private final RectF destination=new RectF();
 void setAtlas(Bitmap bitmap){atlas=bitmap;}
 private boolean sprite(Canvas c,int cell,float x,float y,float size){if(atlas==null)return false;int cw=atlas.getWidth()/2,ch=atlas.getHeight()/2;source.set((cell%2)*cw,(cell/2)*ch,(cell%2+1)*cw,(cell/2+1)*ch);destination.set(x-size/2,y-size+8,x+size/2,y+8);p.setColor(Color.WHITE);c.drawBitmap(atlas,source,destination,p);return true;}

 private void oval(Canvas c,int color,float l,float t,float r,float b){p.setColor(color);c.drawOval(l,t,r,b,p);}
 private void rect(Canvas c,int color,float l,float t,float r,float b){p.setColor(color);c.drawRect(l,t,r,b,p);}
 private void poly(Canvas c,int color,float...xy){p.setColor(color);Path path=polygonPath;path.reset();path.moveTo(xy[0],xy[1]);for(int i=2;i<xy.length;i+=2)path.lineTo(xy[i],xy[i+1]);path.close();c.drawPath(path,p);}
 private void shadow(Canvas c,float width){if(quality>0){oval(c,0x12000000,-width*1.45f,-8,width*1.45f,11);oval(c,0x22000000,-width*1.15f,-6,width*1.2f,9);}oval(c,0x55000000,-width,-4,width,6);}
 void resource(Canvas c,String kind,float x,float y,boolean depleted){if(villageResources&&!depleted&&(kind.equals("wood")||kind.equals("fiber"))){c.save();c.translate(x,y);boolean drawn=villageArt.prop(c,kind.equals("wood")?0:1,kind.equals("wood")?240:78);c.restore();if(drawn)return;}if(kind.startsWith("loose:")){c.save();c.translate(x,y);shadow(c,18);if(!depleted){for(int i=0;i<4;i++){float xx=-14+i*8;if(kind.endsWith("wood")){p.setColor(0xff9b8058);p.setStrokeWidth(3);c.drawLine(xx,-8,xx+11,3,p);}else if(kind.endsWith("fiber")){poly(c,0xffa1a57a,xx,-2,xx-5,-14,xx+4,-5,xx+7,-12);}else oval(c,kind.endsWith("ironOre")?0xff9d7f60:0xff969b8d,xx-4,-7-i%2*3,xx+6,3);}}c.restore();return;}if(!kind.equals("wood")&&!kind.equals("stone")&&!kind.equals("ironOre")&&!kind.equals("clay")&&!kind.equals("limestone")&&!kind.equals("salt")&&!kind.equals("copperOre")&&!kind.equals("tinOre")&&!kind.equals("fiber")){harvestNode(c,kind,x,y,depleted);return;}if(!depleted&&kind.equals("wood")){c.save();c.translate(x,y);shadow(c,38);c.restore();if(sprite(c,0,x,y,240))return;}if((kind.equals("stone")||kind.equals("ironOre"))&&sprite(c,1,x,y,48))return;c.save();c.translate(x,y);if(kind.equals("wood")){shadow(c,22);rect(c,0xff4f3e2d,-5,-42,6,2);rect(c,0xff856044,-5,-42,-1,0);if(!depleted){poly(c,0xff1d332b,-29,-25,0,-88,29,-25);poly(c,0xff314939,-24,-40,0,-102,22,-40);poly(c,0xff47614a,-12,-53,0,-102,4,-53);poly(c,0xff263f30,-18,-59,0,-111,18,-59);}}else if(kind.equals("fiber")){shadow(c,12);for(int i=-2;i<=2;i++){rect(c,0xff65704c,i*5,-26-Math.abs(i)*2,i*5+2,0);poly(c,0xff899476,i*5,-18,i*5-8,-30,i*5,-26,i*5+7,-37);if(!depleted)oval(c,0xffa6a6bc,i*5-2,-33-Math.abs(i)*2,i*5+3,-28-Math.abs(i)*2);}}else{shadow(c,20);poly(c,0xff666b67,-23,-4,-17,-22,2,-32,20,-18,25,0,4,8);poly(c,0xff92988e,-17,-22,2,-32,8,-14,-23,-4);poly(c,0xff454d4c,8,-14,20,-18,25,0,4,8);if(kind.equals("ironOre")&&!depleted){poly(c,0xffaa8464,-12,-16,-5,-22,1,-15,-3,-7);poly(c,0xffb79973,8,-11,12,-16,17,-8,12,-3);}}c.restore();}
 void harvestNode(Canvas c,String kind,float x,float y,boolean depleted){c.save();c.translate(x,y);shadow(c,24);if(kind.equals("rawFish")){oval(c,0xff426a76,-40,-18,40,16);oval(c,0xffb6b99b,-10,-6,14,3);poly(c,0xffa6ac95,13,-1,21,-6,21,5);}else if(kind.equals("milk")||kind.equals("wool")){oval(c,kind.equals("milk")?0xffb1a68a:0xffd1cbb5,-26,-37,23,-6);rect(c,0xff403d31,-20,-12,-15,6);rect(c,0xff403d31,14,-12,19,6);oval(c,0xff5f5c4d,17,-35,34,-16);}else if(kind.equals("honey")){oval(c,0xffa48a4f,-20,-37,20,2);for(int i=0;i<4;i++)rect(c,0xff665535,-19,-29+i*8,19,-27+i*8);}else if(kind.equals("egg")){oval(c,0xff80663e,-23,-7,23,8);if(!depleted)for(int i=0;i<3;i++)oval(c,0xffd9d3b8,-13+i*9,-11,-5+i*9,1);}else{for(int i=-2;i<=2;i++){rect(c,0xff596e3b,i*10,-24,i*10+2,2);oval(c,depleted?0xff536044:0xff708745,i*10-8,-30,i*10+10,-12);}if(!depleted){int color=kind.equals("berry")||kind.equals("apple")?0xffa05942:kind.equals("carrot")?0xffba8648:0xffc7b279;for(int i=-1;i<=1;i++)oval(c,color,i*13-4,-21,i*13+4,-13);}}c.restore();}
 void actor(Canvas c,String kind,float x,float y,int color,float phase,boolean moving,float attackPhase,boolean facingLeft,float aimAngle){actor(c,kind,x,y,color,phase,moving,attackPhase,facingLeft,aimAngle,null);}
 private final android.util.LruCache<String,GaitBlend> gaitBlends=new android.util.LruCache<String,GaitBlend>(128);
 void actor(Canvas c,String kind,float x,float y,int color,float phase,boolean moving,float attackPhase,boolean facingLeft,float aimAngle,JSONObject gear){String actorId=gear==null?kind:gear.optString("id",kind);GaitBlend gait=gaitBlends.get(actorId);if(gait==null){gait=new GaitBlend();gaitBlends.put(actorId,gait);}rig.spriteMirrored=facingLeft;rig.motionAmount=gait.update(moving,android.os.SystemClock.uptimeMillis());moving=rig.motionAmount>0;c.save();c.translate(x,y);if(facingLeft)c.scale(-1,1);shadow(c,13);if(attackPhase>=0)c.translate(ArmMotion.attackWeight(attackPhase)*4,0);float step=moving?(float)Math.sin(phase)*5:0;
 boolean animal=kind.contains("wolf")||kind.contains("boar")||kind.contains("bear")||kind.contains("rat")||kind.contains("hound");
 if(animal){int coat=kind.contains("boar")?0xff594635:0xff73746b;rect(c,0xff333a36,-15,-12,-10,2+step);rect(c,0xff333a36,8,-12,13,2-step);oval(c,coat,-22,-29,20,-7);poly(c,coat,12,-29,28,-31,33,-18,22,-12);poly(c,0xff424a42,16,-28,16,-40,23,-31);poly(c,0xffc9c4ae,23,-21,35,-20,28,-15);oval(c,0xffd8b66b,25,-28,28,-25);}
 else{boolean twoHand=kind.toLowerCase().endsWith("bow")||kind.endsWith(":musket")||kind.endsWith(":blunderbuss")||kind.endsWith(":spear");float hx=rig.handX(phase,moving,attackPhase),hy=rig.handY(phase,moving,attackPhase);rig.body(c,gear,color,phase,moving,attackPhase,twoHand,hx,hy);
 c.save();c.translate(hx,hy);boolean firearm=kind.endsWith(":pistol")||kind.endsWith(":musket")||kind.endsWith(":blunderbuss"),ranged=kind.toLowerCase().endsWith("bow")||firearm,thrust=kind.endsWith(":spear")||kind.endsWith(":siegeRam");float rotation=attackPhase>=0?(ranged?CombatAim.bowRotation(aimAngle,facingLeft):CombatAim.weaponRotation(aimAngle,facingLeft,attackPhase,thrust)):ranged?-20:15;c.rotate(rotation);float gripX=firearm?-8:kind.toLowerCase().endsWith("bow")&&!kind.endsWith("crossbow")?9:0,gripY=firearm?6:kind.toLowerCase().endsWith("bow")&&!kind.endsWith("crossbow")?-15:0;c.translate(-gripX,-gripY);if(attackPhase>=0&&!thrust&&!ranged){p.setColor(0x99f4d19a);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(3);c.drawArc(-42,-52,42,32,-130,100*attackPhase,false,p);p.setStyle(Paint.Style.FILL);}rect(c,0xffbaa786,-2,-7,2,12);if(firearm){float length=kind.endsWith(":pistol")?29:49;float kick=attackPhase>=0?(float)Math.max(0,1-attackPhase*5)*7:0;rect(c,0xff775437,-13,-2,12,7);poly(c,0xff6a4831,-13,0,-5,0,-8,16,-16,13);rect(c,0xffa3a6a0,3,-6,length,0);rect(c,0xff42494a,5,-6,length,-4);if(kind.endsWith(":blunderbuss"))poly(c,0xff999c91,length-8,-6,length+5,-12,length+5,5,length-8,0);if(attackPhase>=0&&attackPhase<.22f){poly(c,0xffffd786,length,-2,length+20,-12,length+11,-2,length+24,8);}}else if(kind.endsWith(":siegeRam")){rect(c,0xff745333,-7,-52,7,5);rect(c,0xffaeb4ac,-9,-55,9,-42);rect(c,0xff393d3a,-8,-22,8,-17);}else if(kind.endsWith(":pickaxe")){rect(c,0xff806343,-2,-38,2,-5);poly(c,0xffaeb6af,-19,-32,-8,-40,7,-39,19,-29,7,-34,-6,-34);}else if((kind.endsWith(":hammer")||kind.endsWith(":founderHammer"))){rect(c,0xff866746,-2,-30,2,-5);rect(c,0xff555e5c,-10,-40,11,-28);rect(c,0xffbac1b8,-10,-40,11,-36);}else if(kind.endsWith(":sickle")){rect(c,0xff806343,-2,-21,2,-5);p.setColor(0xffc1c8bb);p.setStrokeWidth(3);p.setStyle(Paint.Style.STROKE);c.drawArc(-16,-44,10,-18,-150,240,false,p);p.setStyle(Paint.Style.FILL);}else if(kind.endsWith(":fishingRod")){rect(c,0xffae9162,-1,-65,1,-5);p.setColor(0xffd7d6bd);p.setStrokeWidth(1);c.drawLine(0,-65,15,-18,p);c.drawLine(15,-18,16,-12,p);}else if(kind.endsWith(":axe")){rect(c,0xff7e6246,-2,-38,2,-5);poly(c,0xff9ba39b,1,-37,15,-40,17,-25,1,-27);}else if(kind.endsWith(":spear")){rect(c,0xff9a7c52,-2,-54,2,-5);poly(c,0xffc4c7bb,-4,-54,0,-67,4,-54);}else if(kind.endsWith("crossbow")){rect(c,0xff80613d,-14,-3,24,3);p.setColor(0xffbec4b8);p.setStrokeWidth(3);c.drawLine(15,-22,24,0,p);c.drawLine(24,0,15,22,p);p.setStrokeWidth(1);c.drawLine(15,-22,5,0,p);c.drawLine(5,0,15,22,p);rect(c,0xffd6d2b8,3,-1,32,1);}else if(kind.toLowerCase().endsWith("bow")){p.setColor(0xffb0915e);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(3);c.drawArc(-6,-40,25,10,-90,180,false,p);p.setStrokeWidth(1);float pull=attackPhase>=0&&attackPhase<.3f?12*(1-attackPhase/.3f):0;c.drawLine(9,-40,9-pull,-15,p);c.drawLine(9-pull,-15,9,10,p);p.setStyle(Paint.Style.FILL);}else if(!kind.endsWith(":")&&!kind.endsWith(":unarmed")){rect(c,0xffd3d5c6,-2,-38,2,-5);poly(c,0xffdeded1,-2,-38,0,-45,2,-38);rect(c,0xff7b6643,-7,-7,7,-4);}c.translate(gripX,gripY);rig.hand(c,gear);c.restore();if(twoHand){float rad=(float)Math.toRadians(rotation),reach=firearm?23:thrust?16:8;rig.support(c,gear,color,hx+(thrust?(float)Math.sin(rad):(float)Math.cos(rad))*reach,hy+(thrust?-(float)Math.cos(rad):(float)Math.sin(rad))*reach,phase,moving);}if(gear!=null&&gear.optBoolean("equippedShield")){boolean raised=gear.optLong("blockUntil")>System.currentTimeMillis();c.save();if(!raised)c.translate(moving?-(float)Math.sin(phase)*7*.35f:0,-rig.bob(phase,moving)-2);shield(c,raised);c.restore();}}
 c.restore();}

 /** Four-legged companions retain independent facing, gait, strike and health feedback. */
 void companion(Canvas c,JSONObject pet,float phase,float attack){
  String kind=pet.optString("kind");boolean horse=kind.equals("horse"),bear=kind.equals("bear")||kind.equals("warBear"),boar=kind.equals("boar"),dog=kind.equals("dog");
  float size=horse?1.35f:bear?1.3f:boar?1.05f:1;float dx=(float)pet.optDouble(attack>=0?"attackDX":"facingDX",1),dy=(float)pet.optDouble(attack>=0?"attackDY":"facingDY",0);
  float sx=CombatAim.screenX(dx,dy),sy=CombatAim.screenY(dx,dy),len=(float)Math.hypot(sx,sy);float strike=attack>=0?(float)Math.sin(attack*Math.PI)*10:0;
  c.save();shadow(c,28*size);if(len>0)c.translate(sx/len*strike,sy/len*strike);if(sx<0)c.scale(-1,1);c.scale(size,size);
  float gait=pet.optBoolean("active")?(float)Math.sin(phase)*7:0;int coat=horse?0xff73533b:bear?0xff544537:boar?0xff61554b:dog?0xff453c32:0xff868b87;int light=horse?0xff9a7452:bear?0xff75614d:boar?0xff837366:dog?0xff826749:0xffb3b7aa;
  JSONObject skin=pet.optJSONObject("cosmetic");if(skin!=null)try{coat=Color.parseColor(skin.optString("color"));light=Color.parseColor(skin.optString("light"));}catch(Exception ignored){}
  float back=horse?-46:bear?-38:-30,foot=horse?-8:-4;
  for(int i=0;i<4;i++){float x=i<2?-20:18,step=(i%2==0?gait:-gait);p.setColor(i%2==0?0xff34342e:coat);p.setStrokeWidth(horse?5:7);c.drawLine(x,back+14,x+step*.6f,foot-8,p);c.drawLine(x+step*.6f,foot-8,x+step,2,p);rect(c,0xff242721,x+step-4,0,x+step+4,5);}
  oval(c,coat,-31,back,27,back+26);oval(c,light,-26,back+2,20,back+14);oval(c,coat,-24,back+8,22,back+27);
  if(horse){poly(c,coat,12,-43,18,-73,29,-79,35,-70,26,-34);poly(c,0xff302e26,16,-47,15,-73,23,-82,25,-76);oval(c,light,25,-76,45,-62);poly(c,coat,27,-75,26,-87,32,-80,35,-87,37,-74);poly(c,0xff2c2d26,-27,-43,-37,-35,-40,-9,-34,-5,-31,-29);rect(c,0xff3d3829,-12,-49,12,-43);poly(c,0xff766c4f,-8,-43,8,-43,8,-25,-8,-25);rect(c,0xffc9b38a,28,-69,44,-66);}
  else{oval(c,coat,14,back-6,bear?42:38,back+19);oval(c,light,25,back+5,boar?45:46,back+17);oval(c,0xff242820,40,back+7,47,back+13);if(bear){oval(c,coat,18,back-13,29,back-1);oval(c,coat,32,back-11,41,back-1);}else{poly(c,coat,19,back-3,20,back-18,29,back-5);poly(c,coat,29,back-2,34,back-15,37,back+1);}if(boar){poly(c,0xffe4d9bb,38,back+16,49,back+12,46,back+3,43,back+12);poly(c,0xff737f7c,-21,back-2,11,back-4,18,back+16,-18,back+18);rect(c,0xffc1c8ba,-17,back+3,13,back+6);}else{poly(c,coat,-27,back+9,-41,back+4,-49,back+12,-36,back+15);if(dog){rect(c,0xff7c382d,16,back+1,21,back+20);for(int i=0;i<3;i++)oval(c,0xffc7b894,17,back+2+i*6,21,back+5+i*6);}}}
  oval(c,0xffe9ca7b,horse?34:32,horse?-73:back+1,horse?37:35,horse?-70:back+4);
  // Sparse fur lines add texture without bitmap allocation per frame.
  p.setColor(light);p.setStrokeWidth(1);for(int i=0;i<12;i++){float x=-22+i*3.5f,y=back+10+(i%3)*4;c.drawLine(x,y,x-3,y+3,p);}c.restore();
  float top=pet.optString("mode").equals("ridden")?-150:(horse?-91:bear?-69:-58)*size;if(MapDetail.damaged(pet.optDouble("hp"),pet.optDouble("maxHp"))){p.setColor(0xff171d19);c.drawRect(-29,top,29,top+5,p);p.setColor(pet.optBoolean("yours")?0xff8fc4a1:0xffc49a70);c.drawRect(-28,top+1,-28+56*(float)(pet.optDouble("hp")/Math.max(1,pet.optDouble("maxHp"))),top+4,p);}p.setColor(0xffc4c7ad);p.setTextSize(10);String label=(pet.optBoolean("yours")?"YOUR ":"")+pet.optString("name");c.drawText(label,-p.measureText(label)/2,top-4,p);
 }

 void objectHealth(Canvas c,JSONObject object){double hp=object.optDouble("hp"),max=object.optDouble("maxHp");if(!MapDetail.damaged(hp,max))return;rect(c,0xdd121914,-28,-66,28,-60);rect(c,0xffb79d5b,-27,-65,-27+54*(float)(hp/max),-61);}
 void rider(Canvas c,JSONObject horse,JSONObject gear,float phase,boolean moving,boolean left){if(horse==null)return;companion(c,horse,phase,-1);c.save();if(left)c.scale(-1,1);float bob=moving?(float)Math.sin(phase*2)*2:0;c.translate(0,bob);poly(c,CharacterRig.color(CharacterRig.slot(gear,"leggings"),0xff45483d),-10,-75,4,-71,16,-52,13,-37,7,-39,7,-52,-5,-60);c.restore();c.save();c.translate(0,-53+bob);c.clipRect(-90,-90,90,-18);actor(c,"you:"+gear.optString("equippedWeapon"),0,0,0xff66776a,phase,false,-1,left,0,gear);c.restore();}

 void siegeShot(Canvas c,JSONObject engine,float phase){if(phase<0||phase>1)return;float dx=(float)engine.optDouble("attackDX"),dy=(float)engine.optDouble("attackDY"),sx=CombatAim.screenX(dx,dy),sy=CombatAim.screenY(dx,dy),t=phase;boolean stone=engine.optString("kind").equals("trebuchetKit");float px=sx*t,py=-55+sy*t-(stone?(float)Math.sin(t*Math.PI)*100:0);p.setColor(stone?0xffa5a18c:0xffd6cab2);if(stone)c.drawCircle(px,py,7,p);else{p.setStrokeWidth(3);float len=(float)Math.max(1,Math.hypot(sx,sy));c.drawLine(px-sx/len*24,py-sy/len*24,px,py,p);}}
 void projectile(Canvas c,String weapon,float dx,float dy,float phase){if((weapon.equals("pistol")||weapon.equals("musket")||weapon.equals("blunderbuss"))&&phase>=0){float sx=CombatAim.screenX(dx,dy),sy=CombatAim.screenY(dx,dy),len=(float)Math.max(1,Math.hypot(sx,sy));float muzzleX=sx/len*44,muzzleY=-25+sy/len*44;p.setColor(Color.argb((int)(100*(1-phase)),180,177,161));c.drawCircle(muzzleX+phase*16,muzzleY-phase*25,8+phase*23,p);if(phase<.3f){p.setColor(0xffe7d19e);p.setStrokeWidth(2);c.drawLine(muzzleX,muzzleY,muzzleX+sx*phase*3,muzzleY+sy*phase*3,p);}return;}if(!weapon.toLowerCase().endsWith("bow")||phase<.3f||phase>.9f)return;float x=CombatAim.screenX(dx,dy),y=CombatAim.screenY(dx,dy),distance=(float)Math.hypot(x,y);if(distance<1)return;float t=(phase-.3f)/.6f,start=x<0?-17:17,vx=x-start,vy=y-6,len=(float)Math.max(1,Math.hypot(vx,vy)),px=start+vx*t,py=-24+vy*t,ux=vx/len,uy=vy/len;p.setColor(0xffcbb788);p.setStrokeWidth(2);c.drawLine(px-ux*18,py-uy*18,px,py,p);poly(c,0xffd7d9cd,px+ux*4,py+uy*4,px-ux*4-uy*3,py-uy*4+ux*3,px-ux*4+uy*3,py-uy*4-ux*3);}

 // Geometry uses the same footprint and doorway coordinates as the server.
 private void plane(Canvas c,int color,float... xyz){float[] xy=new float[xyz.length/3*2];for(int i=0,j=0;i<xyz.length;i+=3){xy[j++]=xyz[i]-xyz[i+1];xy[j++]=(xyz[i]+xyz[i+1])*.5f-xyz[i+2];}poly(c,color,xy);
  if(quality>0&&materialAtlas!=null&&xyz.length==12&&Color.alpha(color)==255){float minX=xy[0],maxX=xy[0],minY=xy[1],maxY=xy[1];for(int i=0;i<8;i+=2){minX=Math.min(minX,xy[i]);maxX=Math.max(maxX,xy[i]);minY=Math.min(minY,xy[i+1]);maxY=Math.max(maxY,xy[i+1]);}if((maxX-minX)*(maxY-minY)>2200){int cell=Color.red(color)>Color.green(color)+12?0:1,cw=materialAtlas.getWidth()/2,ch=materialAtlas.getHeight()/2;float l=cell*cw+3,t=3,r=l+cw-6,b=ch-3;materialSource[0]=l;materialSource[1]=t;materialSource[2]=r;materialSource[3]=t;materialSource[4]=r;materialSource[5]=b;materialSource[6]=l;materialSource[7]=b;System.arraycopy(xy,0,materialDest,0,8);materialPath.reset();materialPath.moveTo(xy[0],xy[1]);for(int i=2;i<8;i+=2)materialPath.lineTo(xy[i],xy[i+1]);materialPath.close();if(materialMap.setPolyToPoly(materialSource,0,materialDest,0,4)){c.save();c.clipPath(materialPath);p.setColor(Color.WHITE);p.setAlpha(quality==2?92:65);c.drawBitmap(materialAtlas,materialMap,p);p.setAlpha(255);c.restore();}}}
 }
 void building(Canvas c,JSONObject b,float playerX,float playerY){
  float rx=playerX-(float)b.optDouble("x"),ry=playerY-(float)b.optDouble("y");boolean close=BuildingVisibility.obstructs(rx,ry,b.optDouble("halfWidth",125),b.optDouble("depth",80),b.optString("kind").equals("keep")?255:163);
  if(homeArt.draw(c,b,close)){p.setColor(0xffe7d6ae);p.setTextSize(13);c.drawText(b.optString("name")+" • "+b.optString("shop"),-50,45,p);return;}
  if(villageArt.building(c,b,close)){String label=b.optString("shop","");if(label.isEmpty()&&"workshop".equals(b.optString("role")))label="CRAFTING HALL";if(!label.isEmpty()){c.save();c.translate(-10,-95);c.skew(0,.5f);c.scale(.6f,.6f);shopSign(c,label);c.restore();}return;}
  String name=b.optString("name");String key=BuildingProfile.cacheKey(b);
  Bitmap cached=buildingCache.get(key);if(cached==null){cached=Bitmap.createBitmap((int)Math.max(600,2*(b.optDouble("halfWidth",125)+b.optDouble("depth",80)+70)),(int)Math.max(500,b.optDouble("halfWidth",125)+b.optDouble("depth",80)+350),Bitmap.Config.ARGB_8888);Canvas layer=new Canvas(cached);layer.translate(cached.getWidth()/2,cached.getHeight()-140);buildingGeometry(layer,b,false);buildingCache.put(key,cached);}
  boolean hides=close;
  p.setColor(Color.WHITE);p.setAlpha(hides?105:255);c.drawBitmap(cached,-cached.getWidth()/2,-cached.getHeight()+140,p);p.setAlpha(255);p.setColor(close?0xffffd388:0xffb6b093);p.setTextSize(13);c.drawText(name,-(float)b.optDouble("halfWidth",125)-5,10+(float)b.optDouble("halfWidth",125)*.5f+28,p);if(!b.optString("shop","").isEmpty()&&!b.isNull("shop")){c.save();boolean keep=b.optString("kind").equals("keep");float depth=(float)b.optDouble("depth",80),roofY=keep?(10-depth)*.5f:(20-depth*.55f)*.5f,roofZ=keep?184:135.5f;
   // Anchor to the rendered roof plane and follow its isometric ridge direction.
   c.translate(-roofY,roofY*.5f-roofZ);c.skew(0,.5f);float signScale=Math.min(.88f,(float)b.optDouble("halfWidth",125)/145f);c.scale(signScale,signScale);shopSign(c,b.optString("shop"));c.restore();}
 }
 void shopSign(Canvas c,String name){
  String label=BuildingProfile.label(name);boolean civic=label.contains("CHARACTER");String title=civic?"BANK":label;
  p.setTypeface(Typeface.create(Typeface.SERIF,Typeface.BOLD));p.setTextSize(19);float half=Math.max(73,p.measureText(title)/2+25),bottom=civic?30:16;
  rect(c,0x66000000,-half+4,-18,half+4,bottom+5);rect(c,0xff513b27,-half,-24,half,bottom);rect(c,0xffbc965d,-half+2,-22,half-2,bottom-2);rect(c,0xff29231b,-half+5,-19,half-5,bottom-5);
  p.setColor(0xffffe3a5);c.drawText(title,-p.measureText(title)/2,civic?-1:4,p);if(civic){p.setTextSize(11);c.drawText("CHARACTER MASTER",-p.measureText("CHARACTER MASTER")/2,19,p);}oval(c,0xffd4af6c,-half+8,-8,-half+12,-4);oval(c,0xffd4af6c,half-12,-8,half-8,-4);p.setTypeface(Typeface.DEFAULT);
 }
 void merchant(Canvas c,JSONObject trader){actor(c,"trader:",0,0,0xff937149,0,false,-1,false,0);oval(c,0xff765134,-12,-68,12,-58);rect(c,0xffc0a172,-11,-42,11,-15);p.setColor(0xfff3d697);p.setTextSize(13);c.drawText(trader.optString("name"),-32,-82,p);p.setTextSize(10);c.drawText(trader.has("service")?"INTERACT • PROTECTED":"TRADE • PROTECTED",-48,-70,p);}
 private void buildingGeometry(Canvas c,JSONObject b,boolean close){
  float a=(float)b.optDouble("halfWidth",125),d=(float)b.optDouble("depth",80),front=10,h=b.optString("kind").equals("keep")?180:108;
  String role=BuildingProfile.role(b);boolean bandit=BuildingProfile.bandit(b);String name=b.optString("name");int region=Math.floorMod(b.optString("id").hashCode(),4);boolean tower=b.optString("kind").equals("keep"),smith=role.equals("smithy"),tavern=name.contains("Tavern");
  plane(c,0x55000000,-a,-d,0,a+40,-d,0,a+40,front+35,0,-a,front+35,0);
  plane(c,0xff493f32,-a,-d,0,a,-d,0,a,front,0,-a,front,0);
  plane(c,tower?0xff74776b:bandit?0xff8c7c61:role.equals("bank")?0xffa6a593:0xffb7aa86,-a,front,0,a,front,0,a,front,h,-a,front,h);
  plane(c,tower?0xff565e56:bandit?0xff655c4c:role.equals("bank")?0xff777c72:0xff83795f,a,-d,0,a,front,0,a,front,h,a,-d,h);
  // Individually shaded masonry/plaster panels; stable colors, no per-frame randomness.
  for(int row=0;row<(int)h/14;row++){for(int col=0;col<(int)(2*a/24);col++){float x=-a+col*24,z=row*14;int tint=(row*17+col*31)%5;int color=tower||role.equals("bank")?new int[]{0xff797c70,0xff6a7066,0xff858678,0xff70766a,0xff8c8b78}[tint]:new int[]{0xffb3a582,0xffb8aa86,0xffb0a17e,0xffb9ab87,0xffb5a783}[tint];plane(c,color,x+1,front+.1f,z+1,Math.min(a,x+23),front+.1f,z+1,Math.min(a,x+23),front+.1f,z+13,x+1,front+.1f,z+13);}}
  // Stone foundation courses.
  for(int z=0;z<(tower?h:28);z+=14){plane(c,0xff615f50,-a,front,z,a,front,z,a,front,z+2,-a,front,z+2);for(int x=(int)-a;x<a;x+=28)plane(c,0xff6c6a58,x+(z%28==0?0:12),front,z,x+2+(z%28==0?0:12),front,z,x+2+(z%28==0?0:12),front,z+14,x+(z%28==0?0:12),front,z+14);}
  if(!tower&&!role.equals("bank")){for(float x=-a;x<=a;x+=a/2)plane(c,0xff493728,x,front,26,x+7,front,26,x+7,front,h,x,front,h);plane(c,0xff493728,-a,front,62,a,front,62,a,front,69,-a,front,69);plane(c,0xff493728,a,-d,64,a,front,64,a,front,71,a,-d,71);}
  if(b.optBoolean("rural")){for(float x=-a;x<a;x+=12)plane(c,0xff715338,x,front+1,28,x+9,front+1,28,x+9,front+1,h,x,front+1,h);plane(c,0xff372c20,-36,front+2,0,36,front+2,0,36,front+2,78,-36,front+2,78);for(int side=-1;side<=1;side+=2)plane(c,0xff8d7049,side*33,front+3,5,side*3,front+3,5,side*3,front+3,73,side*33,front+3,73);plane(c,0xffba9b65,-33,front+4,8,33,front+4,65,33,front+4,71,-33,front+4,14);}
  // Baked material detail: generated once per cached building, not every frame.
  if(quality>0){
   for(int row=0;row<(int)h/13;row++)for(int col=0;col<(int)((d+front)/23);col++){
    float yy=-d+col*23,zz=row*13;int shade=(row*19+col*7)%4;
    plane(c,tower||role.equals("bank")?(shade==0?0xff626961:0xff515b54):bandit?(shade==0?0xff75664e:0xff665943):(shade==0?0xff8c8067:0xff7b7059),a+.2f,yy+1,zz+1,a+.2f,Math.min(front,yy+22),zz+1,a+.2f,Math.min(front,yy+22),zz+12,a+.2f,yy+1,zz+12);
   }
   for(int i=0;i<75;i++){float xx=-a+4+(i*47%(Math.max(1,(int)(2*a-8)))),zz=4+i*29%((int)h-8);
    plane(c,i%3==0?0x3062533e:0x20706e58,xx,front+.8f,zz,xx+3,front+.8f,zz,xx+2,front+.8f,zz+6,xx,front+.8f,zz+4);
   }
   // Damp foundation, corner quoins and worn timber grain.
   plane(c,0x50404732,-a,front+1,0,a,front+1,0,a,front+1,9,-a,front+1,13);
   for(int side=-1;side<=1;side+=2)for(int z=0;z<h;z+=16){float xx=side<0?-a:a-14;
    plane(c,tower?0xff9b9987:0xff91856c,xx,front+2,z+1,xx+13,front+2,z+1,xx+13,front+2,Math.min(h,z+14),xx,front+2,Math.min(h,z+14));
   }
   if(!tower&&!role.equals("bank"))for(float xx=-a+8;xx<a;xx+=a/2){
    plane(c,0xffa08c66,xx,front+1,28,xx+2,front+1,28,xx+2,front+1,h,xx,front+1,h);
    plane(c,0xff57422e,xx,front+2,29,Math.min(a,xx+a/2-9),front+2,85,Math.min(a,xx+a/2-9),front+2,91,xx,front+2,35);
   }
  }
  // Full-height front door, with a stone threshold at the exact entry point.
  plane(c,0xffc2b28f,-22,front+1,0,22,front+1,0,22,front+1,65,-22,front+1,65);
  plane(c,0xff282721,-17,front+2,0,17,front+2,0,17,front+2,59,-17,front+2,59);
  for(int x=-15;x<16;x+=6)plane(c,0xff765338,x,front+3,0,x+4,front+3,0,x+4,front+3,57,x,front+3,57);
  plane(c,0xffa79e82,-24,front+3,0,24,front+3,0,24,35,0,-24,35,0);
  for(int side=-1;side<=1;side+=2){float x=side*a*.6f;plane(c,0xff362e24,x-15,front+2,44,x+15,front+2,44,x+15,front+2,78,x-15,front+2,78);plane(c,0xffe7ad49,x-11,front+3,48,x+11,front+3,48,x+11,front+3,74,x-11,front+3,74);plane(c,0xff493728,x-2,front+4,46,x+2,front+4,46,x+2,front+4,77,x-2,front+4,77);}
  // Forged door straps, rivets and recessed leaded windows.
  for(int z=14;z<=45;z+=31){plane(c,0xff333b39,-15,front+4,z,15,front+4,z,15,front+4,z+3,-15,front+4,z+3);for(int xx=-12;xx<=12;xx+=12)plane(c,0xffa29b80,xx,front+5,z+1,xx+1,front+5,z+1,xx+1,front+5,z+2,xx,front+5,z+2);}
  plane(c,0xffc0a36b,10,front+5,26,13,front+5,26,13,front+5,32,10,front+5,32);
  for(int side=-1;side<=1;side+=2){float wx=side*a*.6f;
   plane(c,0x6058482c,wx-11,front+4,68,wx+11,front+4,68,wx+11,front+4,74,wx-11,front+4,74);
   for(int z=53;z<=68;z+=8)plane(c,0xff5d5844,wx-11,front+5,z,wx+11,front+5,z,wx+11,front+5,z+1,wx-11,front+5,z+1);
  }
  // Small facade details remain on the existing building footprint.
  if(quality>0&&!tower){for(int side=-1;side<=1;side+=2){float wx=side*a*.6f;
   plane(c,0xff51432e,wx-22,front+5,43,wx-16,front+5,43,wx-16,front+5,79,wx-22,front+5,79);
   plane(c,0xff51432e,wx+16,front+5,43,wx+22,front+5,43,wx+22,front+5,79,wx+16,front+5,79);
   plane(c,0xff8a7553,wx-19,front+8,38,wx+19,front+8,38,wx+19,front+8,45,wx-19,front+8,45);
   if(!b.optBoolean("rural")&&!smith&&!role.equals("bank")&&!role.equals("workshop"))for(int j=0;j<5;j++){float fx=wx-15+j*7;plane(c,0xff657451,fx,front+9,45,fx+5,front+9,45,fx+5,front+9,51,fx,front+9,51);}
  }}
  // Day 2 service identities. All details stay on the facade; the central
  // doorway and ground-space approach remain exactly where gameplay expects.
  if(!role.equals("ordinary")){
   int timber=bandit?0xff494038:0xff715337,metal=bandit?0xff73756b:0xffa3a69a;
   for(int side=-1;side<=1;side+=2){float wx=side*a*.6f;
    if(role.equals("bank")){
     // Recessed stone window frames and forged grilles, clear of the door.
     plane(c,0xff9e9b87,wx-19,front+9,38,wx+19,front+9,38,wx+19,front+9,84,wx-19,front+9,84);
     plane(c,0xff343d3c,wx-12,front+10,45,wx+12,front+10,45,wx+12,front+10,77,wx-12,front+10,77);
     for(int j=-1;j<=1;j++)plane(c,metal,wx+j*7-1,front+11,45,wx+j*7+1,front+11,45,wx+j*7+1,front+11,77,wx+j*7-1,front+11,77);
     for(int z=53;z<77;z+=15)plane(c,metal,wx-12,front+12,z,wx+12,front+12,z,wx+12,front+12,z+2,wx-12,front+12,z+2);
    }else if(role.equals("merchant")){
     // Canvas shades and their wooden supports, above the window sill.
     for(int stripe=0;stripe<6;stripe++){float xx=wx-26+stripe*9;int cloth=stripe%2==0?(bandit?0xff713e38:0xffa24d36):0xffc1ad82;
      plane(c,cloth,xx,front+7,88,xx+9,front+7,88,xx+9,front+27,70,xx,front+27,70);
      plane(c,cloth,xx,front+27,70,xx+9,front+27,70,xx+9,front+27,64,xx,front+27,64);
     }
     for(int j=-1;j<=1;j+=2)plane(c,timber,wx+j*27,front+27,39,wx+j*27+2,front+27,39,wx+j*27+2,front+27,70,wx+j*27,front+27,70);
    }else if(role.equals("smithy")){
     plane(c,0xff343a36,wx-19,front+9,39,wx+19,front+9,39,wx+19,front+9,83,wx-19,front+9,83);
     plane(c,0xffe69a36,wx-12,front+10,47,wx+12,front+10,47,wx+12,front+10,72,wx-12,front+10,72);
     for(int j=-1;j<=1;j++)plane(c,0xff434943,wx+j*8-1,front+11,44,wx+j*8+1,front+11,44,wx+j*8+1,front+11,78,wx+j*8-1,front+11,78);
    }else if(role.equals("workshop")){
     plane(c,timber,wx-24,front+9,39,wx+24,front+9,39,wx+24,front+9,83,wx-24,front+9,83);
     for(int j=-1;j<=1;j++){float xx=wx+j*14;plane(c,0xffb79d69,xx-2,front+10,44,xx+2,front+10,44,xx+2,front+10,75,xx-2,front+10,75);plane(c,metal,xx-7,front+11,70,xx+7,front+11,70,xx+7,front+11,77,xx-7,front+11,77);}
    }
   }
   if(bandit){for(int side=-1;side<=1;side+=2){float xx=side*(a-25);plane(c,0xff703f38,xx-8,front+8,52,xx+8,front+8,48,xx+8,front+8,100,xx-8,front+8,100);}}
  }
  // Roof separates from walls, allowing cutaway near the entrance.
  if(close)c.saveLayerAlpha(null,95);
  if(tower){plane(c,0xff858778,-a-6,-d-6,h,a+6,-d-6,h,a+6,front+6,h,-a-6,front+6,h);for(int x=(int)-a;x<a;x+=32)plane(c,0xff9a9a83,x,front+6,h,x+19,front+6,h,x+19,front+6,h+22,x,front+6,h+22);}
  else{float ridge=-d*.55f,peak=h+55;plane(c,smith?0xff4f5655:0xff6b5140,-a-12,front+10,h,a+12,front+10,h,a+12,ridge,peak,-a-12,ridge,peak);plane(c,0xff443f37,a+12,ridge,peak,a+12,-d-12,h,a+12,front+10,h);for(int row=0;row<10;row++){float y0=front+10+(ridge-front-10)*row/10f,y1=front+10+(ridge-front-10)*(row+1)/10f,z0=h+55*row/10f,z1=h+55*(row+1)/10f;for(int col=0;col<18;col++){float x0=-a-12+(2*a+24)*col/18f,x1=-a-12+(2*a+24)*(col+1)/18f-1;int tint=(row*13+col*17)%5;int color=role.equals("merchant")?new int[]{0xff984d36,0xffad5a3f,0xff86432f,0xffb76745,0xff9b523a}[tint]:smith||role.equals("bank")||region==0&&!role.equals("workshop")&&!bandit?new int[]{0xff515856,0xff626965,0xff555c59,0xff464e4e,0xff5e6560}[tint]:b.optBoolean("rural")||role.equals("workshop")?new int[]{0xff857044,0xff938052,0xff7b6945,0xffa18b58,0xff897548}[tint]:region==1||bandit?new int[]{0xff6f5140,0xff82604a,0xff75543d,0xff654a39,0xff8a674b}[tint]:new int[]{0xff585f57,0xff667065,0xff555e53,0xff73796b,0xff606758}[tint];plane(c,color,x0,y0,z0+.5f,x1,y0,z0+.5f,x1,y1,z1,x0,y1,z1);}}plane(c,0xff5e6258,a*.6f,-d*.7f,h,a*.6f+24,-d*.7f,h,a*.6f+24,-d*.7f,h+82,a*.6f,-d*.7f,h+82);}
  if(!tower&&quality>0){float ridge=-d*.55f;
   // Shingle lips, moss seams and ridge caps are baked into the roof cache.
   for(int row=0;row<10;row++){float yy=front+10+(ridge-front-10)*row/10f,zz=h+55*row/10f;
    plane(c,0x7040372f,-a-12,yy,zz+.8f,a+12,yy,zz+.8f,a+12,yy-1,zz+1.4f,-a-12,yy-1,zz+1.4f);
    for(int col=0;col<6;col++)if((row*7+col*3+region)%5==0){float xx=-a+col*(2*a/6);plane(c,0x805c6743,xx,yy,zz+1,xx+12,yy,zz+1,xx+10,yy-2,zz+2,xx,yy-2,zz+2);}
   }
   for(float xx=-a-12;xx<a+12;xx+=18)plane(c,0xff969080,xx,ridge+2,h+54,Math.min(a+12,xx+16),ridge+2,h+54,Math.min(a+12,xx+16),ridge-2,h+58,xx,ridge-2,h+58);
   float cx=a*.6f,cy=-d*.7f;
   plane(c,0xff424b48,cx+24,cy,h,cx+24,cy-17,h,cx+24,cy-17,h+82,cx+24,cy,h+82);
   for(int zz=10;zz<82;zz+=12)plane(c,0xff343c39,cx,cy+.5f,h+zz,cx+24,cy+.5f,h+zz,cx+24,cy+.5f,h+zz+2,cx,cy+.5f,h+zz+2);
   plane(c,0xff8f9182,cx-3,cy+3,h+82,cx+27,cy+3,h+82,cx+27,cy-20,h+82,cx-3,cy-20,h+82);
   plane(c,0xff242b29,cx+3,cy-2,h+82.5f,cx+21,cy-2,h+82.5f,cx+21,cy-14,h+82.5f,cx+3,cy-14,h+82.5f);
  }
  if(b.optString("style").equals("Chapel")){plane(c,0xffa3a28b,-4,front+7,h+15,4,front+7,h+15,4,front+7,h+70,-4,front+7,h+70);plane(c,0xffa3a28b,-20,front+7,h+47,20,front+7,h+47,20,front+7,h+55,-20,front+7,h+55);}else if(b.optString("style").equals("Guild Hall")){plane(c,0xff7c3036,-a+22,front+5,65,-a+55,front+5,65,-a+55,front+5,140,-a+22,front+5,140);}else if(b.optString("style").equals("Granary")||b.optString("style").equals("Stable")){for(int j=0;j<5;j++){float x=-a+15+j*16;plane(c,0xff8d7549,x,front+35,0,x+14,front+35,0,x+14,front+35,23,x,front+35,23);}}
  if(b.optString("style").equals("Castle")){
   int[] heraldry={0xff793d3c,0xff365247,0xff3f5575,0xff956d32,0xff684768};int banner=heraldry[Math.floorMod(b.optString("id").hashCode(),heraldry.length)];
   // Deep corner towers, arrow slits and crenellations give castles a fortress silhouette.
   for(int side=-1;side<=1;side+=2){float x=side*(a-30),y=front+8,th=h+75;
    plane(c,0xff626b68,x-30,y-52,0,x+30,y-52,0,x+30,y-52,th,x-30,y-52,th);
    plane(c,0xff505a59,x+30,y-52,0,x+30,y,0,x+30,y,th,x+30,y-52,th);
    plane(c,0xff929183,x-30,y,0,x+30,y,0,x+30,y,th,x-30,y,th);
    for(int row=0;row<th/16;row++)for(int col=0;col<3;col++){float bx=x-29+col*20,bz=row*16;plane(c,(row+col)%3==0?0xff85897c:0xff969586,bx,y+.5f,bz+1,bx+18,y+.5f,bz+1,bx+18,y+.5f,bz+14,bx,y+.5f,bz+14);}
    plane(c,0xffa4a08b,x-32,y-54,th,x+32,y-54,th,x+32,y+2,th,x-32,y+2,th);
    for(int j=0;j<4;j++){float bx=x-30+j*17;plane(c,0xffb1ac98,bx,y+2,th,bx+10,y+2,th,bx+10,y+2,th+18,bx,y+2,th+18);}
    for(int z=45;z<230;z+=55){plane(c,0xff262e2e,x-3,y+1,z,x+3,y+1,z,x+3,y+1,z+25,x-3,y+1,z+25);}
    plane(c,banner,x-18,y+3,105,x+18,y+3,105,x+18,y+3,175,x-18,y+3,175);
    plane(c,0xffd6b977,x-2,y+4,120,x+2,y+4,120,x+2,y+4,161,x-2,y+4,161);
   }
   // Gatehouse remains aligned with the existing front doorway.
   plane(c,0xffbab098,-39,front+10,0,39,front+10,0,39,front+10,98,-39,front+10,98);
   plane(c,0xff171e1e,-29,front+11,0,29,front+11,0,29,front+11,81,-29,front+11,81);
   for(int x=-25;x<=25;x+=10)plane(c,0xff777b74,x,front+12,49,x+3,front+12,49,x+3,front+12,81,x,front+12,81);
   plane(c,0xffa69c83,-35,front+13,0,35,front+13,0,35,40,0,-35,40,0);
  }
  if(close)c.restore();
  plane(c,0x5030271f,-a,front+1,h-10,a,front+1,h-10,a,front+1,h,-a,front+1,h);
  if(tavern){plane(c,0xff342c22,-a+30,front+8,92,-a+87,front+8,92,-a+87,front+8,72,-a+30,front+8,72);p.setTextSize(11);p.setColor(0xffd9c79c);c.save();c.translate(-a+30-front-8,(-a+30+front+8)*.5f-79);c.rotate(26.565f);c.drawText("TAVERN",0,0,p);c.restore();}
  if(smith){plane(c,0xff686d66,a+18,front+10,0,a+58,front+10,0,a+58,front+10,33,a+18,front+10,33);plane(c,0xffa0a392,a+10,front+5,33,a+65,front+5,33,a+65,front+24,33,a+10,front+24,33);}

  p.setColor(close?0xffffd388:0xffb6b093);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(2);c.drawOval(-55,10,-15,25,p);p.setStyle(Paint.Style.FILL);if(close){p.setColor(0xffffd388);p.setTextSize(16);c.drawText("ENTER",-56,47,p);}
 }
 void house(Canvas c,float x,float y,String kind){if(buildings!=null){int cell=kind.contains("Tavern")?0:kind.contains("Smith")?1:kind.contains("keep")||kind.contains("Watch")?3:2;float size=cell==3?600:430;int cw=buildings.getWidth()/2,ch=buildings.getHeight()/2;source.set(cell%2*cw,cell/2*ch,(cell%2+1)*cw,(cell/2+1)*ch);destination.set(x-size/2,y-size*ch/cw+8,x+size/2,y+8);p.setColor(Color.WHITE);c.drawBitmap(buildings,source,destination,p);return;}if(sprite(c,kind.equals("keep")?3:2,x,y,kind.equals("keep")?600:430))return;c.save();c.translate(x,y);shadow(c,48);boolean keep=kind.equals("keep");float height=keep?92:45;
 poly(c,0xff777b72,-40,-height,12,-height+8,12,8,-40,-3);poly(c,0xff4b5652,12,-height+8,40,-height-4,40,-4,12,8);
 for(int row=0;row<(keep?7:3);row++){rect(c,0xff5f665f,-39,-height+row*13,11,-height+row*13+2);for(int col=0;col<4;col++)rect(c,0xff60665e,-35+col*12+(row%2)*4,-height+row*13,-33+col*12+(row%2)*4,-height+row*13+12);}
 if(keep){rect(c,0xff899083,-43,-height-9,43,-height+3);for(int i=-40;i<40;i+=16)rect(c,0xff92998c,i,-height-21,i+10,-height-4);rect(c,0xff282f2e,-7,-height+18,0,-height+36);rect(c,0xff282f2e,19,-height+18,24,-height+32);rect(c,0xff6a4939,-40,-height-48,-38,-height-7);poly(c,0xff854635,-38,-height-47,-10,-height-44,-17,-height-26,-38,-height-30);}
 else{poly(c,0xff77513d,-49,-height-2,-18,-height-34,48,-height-10,13,-height+13);poly(c,0xff483d34,-18,-height-34,40,-height-20,48,-height-10);for(int i=0;i<4;i++){p.setColor(0xff986e4d);p.setStrokeWidth(1);c.drawLine(-40+i*12,-height+i*2,-17+i*12,-height-28+i*4,p);}rect(c,0xff4b514b,22,-height-41,31,-height-17);}
 rect(c,0xff252c29,-23,-24,-9,1);rect(c,0xff91714b,-22,-23,-10,0);rect(c,0xff4c3d2b,-17,-23,-15,0);oval(c,0xffe8ce85,-13,-13,-11,-11);rect(c,0xff252d28,-4,-33,7,-21);rect(c,0xffc8ac63,-2,-31,5,-23);c.restore();}
 void structure(Canvas c,String kind,float x,float y){if(kind.equals("ballistaKit")||kind.equals("trebuchetKit")){c.save();c.translate(x,y);shadow(c,55);for(int wheel:new int[]{-37,37}){oval(c,0xff3b3025,wheel-12,-16,wheel+12,7);oval(c,0xff947247,wheel-7,-11,wheel+7,2);}rect(c,0xff725332,-42,-26,42,-16);poly(c,0xff9e7e4d,-29,-20,-7,-73,4,-73,-18,-20);poly(c,0xff685033,31,-20,9,-73,-2,-73,20,-20);if(kind.equals("trebuchetKit")){rect(c,0xffa68a5d,-4,-112,4,-34);rect(c,0xff77756c,-20,-48,16,-27);p.setColor(0xffc4b38e);p.setStrokeWidth(2);c.drawLine(0,-112,25,-80,p);oval(c,0xff4b4337,18,-84,34,-73);}else{rect(c,0xff856a42,-7,-67,7,-20);p.setColor(0xffb1b1a3);p.setStrokeWidth(5);c.drawLine(-48,-52,0,-65,p);c.drawLine(0,-65,48,-52,p);p.setStrokeWidth(1);c.drawLine(-48,-52,0,-30,p);c.drawLine(0,-30,48,-52,p);rect(c,0xffcbc4ad,-1,-82,1,-27);}c.restore();return;}if(kind.equals("caravan")){c.save();c.translate(x,y);shadow(c,55);for(int wheelX:new int[]{-38,38}){oval(c,0xff302b25,wheelX-12,-17,wheelX+12,8);oval(c,0xffa17d4b,wheelX-8,-13,wheelX+8,4);rect(c,0xff403629,wheelX-2,-15,wheelX+2,6);}poly(c,0xff503b29,-48,-20,25,-30,51,-12,-20,1);rect(c,0xff8a6944,-44,-48,44,-18);for(int row=0;row<4;row++)rect(c,0xff493728,-44,-45+row*8,44,-43+row*8);poly(c,0xffb5a784,-48,-49,-34,-78,30,-78,48,-49);poly(c,0xff85775c,30,-78,48,-49,48,-27,30,-54);for(int beam=-30;beam<=30;beam+=30)rect(c,0xff5a4935,beam,-73,beam+2,-49);rect(c,0xff655036,-3,-19,3,24);c.restore();return;}if(kind.equals("flag")||kind.equals("npcCamp")){c.save();c.translate(x,y);shadow(c,30);rect(c,0xff776041,-3,-90,3,0);poly(c,kind.equals("flag")?0xff9c3440:0xff4b6371,3,-87,46,-78,3,-52);if(kind.equals("npcCamp")){rect(c,0xff5e4937,-40,-10,40,4);poly(c,0xff8c8061,-35,-10,0,-43,35,-10);}c.restore();return;}if(kind.equals("loom")||kind.equals("mill")||kind.equals("smoker")||kind.equals("kiln")||kind.equals("chest")||kind.equals("stonewall")){c.save();c.translate(x,y);shadow(c,32);if(kind.equals("loom")){rect(c,0xff8d704b,-30,-65,-24,3);rect(c,0xff8d704b,24,-65,30,3);rect(c,0xffa68a5d,-30,-65,30,-59);for(int i=-20;i<=20;i+=4)rect(c,0xffc7bea0,i,-57,i+1,-15);rect(c,0xff836c4a,-30,-15,30,-10);}else if(kind.equals("mill")){oval(c,0xff8b8b78,-33,-27,33,7);oval(c,0xffb2ad96,-33,-35,33,-9);rect(c,0xff645239,-2,-46,2,-22);}else if(kind.equals("kiln")){oval(c,0xff8b7963,-34,-68,34,5);rect(c,0xff38342c,-16,-30,16,3);oval(c,0xffdca151,-10,-23,10,0);}else{rect(c,kind.equals("stonewall")?0xff878878:0xff6a5239,-30,-48,30,2);for(int i=0;i<4;i++)rect(c,0xffa38a60,-30,-45+i*12,30,-43+i*12);}p.setTextSize(12);p.setColor(0xffe0cda6);c.drawText(kind.toUpperCase(),-25,22,p);c.restore();return;}if(kind.equals("keep")){house(c,x,y,kind);return;}c.save();c.translate(x,y);if(kind.equals("farm")){poly(c,0xff564331,-35,-18,15,-29,39,-9,-12,7);for(int i=0;i<6;i++){p.setColor(0xff908148);p.setStrokeWidth(3);c.drawLine(-28+i*10,-14-i*2,-10+i*7,1-i*2,p);}}else if(kind.equals("palisade")||kind.equals("gate")){for(int i=-25;i<=25;i+=9){rect(c,0xff70503a,i,-36,i+7,2);poly(c,0xffa17b51,i,-36,i+3,-45,i+7,-36);}}else{rect(c,0xff77786c,-22,-18,22,1);rect(c,0xff424a45,-25,-23,25,-16);poly(c,0xffd79945,-9,-23,-2,-45,3,-31,10,-39,12,-23);oval(c,0xffffca67,-6,-33,6,-20);}c.restore();}
 void shield(Canvas c,boolean raised){c.save();c.translate(raised?20:-17,raised?-32:-22);oval(c,0xffb3ac8e,-13,-18,13,17);oval(c,0xff654b31,-10,-15,10,14);rect(c,0xff807659,-2,-15,2,14);oval(c,0xffb2b6a4,-5,-5,5,5);p.setColor(0xffd8d4ba);p.setStrokeWidth(1);c.drawArc(-12,-17,12,16,200,110,false,p);for(int rivet=0;rivet<6;rivet++){double a=rivet*Math.PI/3;float rx=(float)Math.cos(a)*9,ry=(float)Math.sin(a)*13;oval(c,0xffc0b48e,rx-1,ry-1,rx+1,ry+1);}c.restore();}
 void impact(Canvas c,long age,boolean metal){if(quality==0||age<0||age>280)return;float t=age/280f;p.setStrokeWidth(1.3f);p.setColor(Color.argb((int)(190*(1-t)),metal?239:170,metal?199:105,metal?120:66));for(int i=0;i<(quality==2?7:4);i++){double a=i*2.39996;float x=(float)Math.cos(a),y=(float)Math.sin(a);c.drawLine(x*(5+t*16),-34+y*(5+t*12),x*(9+t*23),-34+y*(9+t*17),p);}}
 void corpse(Canvas c,float x,float y){c.save();c.translate(x,y);shadow(c,17);oval(c,0xff71573a,-15,-15,15,3);rect(c,0xffad9570,-11,-13,11,-9);rect(c,0xffb5a182,-2,-14,2,2);c.restore();}
}




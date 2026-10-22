package com.morongaming.forsakenrealm;
import android.graphics.*;
import org.json.JSONObject;
/** Small reusable joint rig. All equipment layers share the body's animation. */
final class CharacterRig {
 float motionAmount=1;boolean spriteMirrored;private final SurvivorAtlas survivor=new SurvivorAtlas();
 private final Paint p=new Paint(3);private final Path path=new Path();
 private final android.util.LruCache<String,Bitmap> portraits=new android.util.LruCache<String,Bitmap>(48);
 static String slot(JSONObject actor,String slot){if(actor==null)return "";JSONObject slots=actor.optJSONObject("armorSlots");if(slots!=null)return slots.optString(slot,"");return actor.optString(slot.equals("helmet")?"equippedHelmet":slot.equals("chest")?"equippedArmour":"","");}
 static int color(String id,int fallback){if(id.isEmpty())return fallback;if(id.startsWith("kingslayer"))return 0xff424950;if(id.startsWith("royal"))return 0xffa99b70;if(id.startsWith("plate"))return 0xff9aa5a8;if(id.startsWith("brigandine"))return 0xff704d43;if(id.startsWith("mail")||id.equals("mail"))return 0xff7c898b;if(id.startsWith("hide")||id.equals("tunic"))return 0xff805b3d;if(id.startsWith("padded")||id.equals("gambeson")||id.equals("helmet"))return 0xff9a916e;return 0xff706953;}
 static boolean metal(String id){return id.startsWith("plate")||id.startsWith("royal")||id.startsWith("kingslayer")||id.startsWith("mail")||id.startsWith("brigandine");}
 void line(Canvas c,int color,float width,float x,float y,float tx,float ty){p.setColor(color);p.setStrokeWidth(width);p.setStrokeCap(Paint.Cap.ROUND);c.drawLine(x,y,tx,ty,p);}
 void oval(Canvas c,int color,float l,float t,float r,float b){p.setColor(color);c.drawOval(l,t,r,b,p);}
 void poly(Canvas c,int color,float...v){p.setColor(color);path.reset();path.moveTo(v[0],v[1]);for(int i=2;i<v.length;i+=2)path.lineTo(v[i],v[i+1]);path.close();c.drawPath(path,p);}
 float bob(float phase,boolean moving){return moving?(float)(1-Math.cos(phase*2))*.65f*motionAmount:0;}
 float handX(float phase,boolean moving,float attack){return 15+(attack>=0?ArmMotion.attackWeight(attack)*6:moving?(float)Math.sin(phase)*3.5f*motionAmount:0);}
 float handY(float phase,boolean moving,float attack){return -30-bob(phase,moving)+-ArmMotion.attackWeight(attack)*4;}
 void arm(Canvas c,JSONObject gear,int base,float sx,float sy,float hx,float hy){
  int sleeve=color(slot(gear,"chest"),base),glove=color(slot(gear,"gloves"),0xffb49a7c);
  float ax=hx-sx,ay=hy-sy,length=(float)Math.max(1,Math.hypot(ax,ay));
  float side=sx<0?-1:1;
  // Equal bone lengths keep a visible elbow bend instead of stretching a straight tube.
  float bone=Math.max(11.5f,length*.515f),bend=(float)Math.sqrt(Math.max(0,bone*bone-length*length*.25f));
  float ex=(sx+hx)*.5f+side*ay/length*bend*.65f,ey=(sy+hy)*.5f-side*ax/length*bend*.65f;
  if(survivor.available(gear)){survivor.limb(c,gear,false,sx,sy,ex,ey);oval(c,0xffa88c70,ex-1.7f,ey-1.7f,ex+1.7f,ey+1.7f);survivor.limb(c,gear,true,ex,ey,hx,hy);oval(c,glove,hx-1.7f,hy-2,hx+1.7f,hy+2);return;}
  line(c,0xff222a28,8,sx,sy,ex,ey);line(c,sleeve,6,sx,sy,ex,ey);line(c,sleeve,5,ex,ey,hx,hy);oval(c,glove,hx-3.5f,hy-3.5f,hx+3.5f,hy+3.5f);
 }

 void body(Canvas c,JSONObject gear,int base,float phase,boolean moving,float attack,boolean twoHand,float hx,float hy){
  if(survivor.available(gear)){illustratedBody(c,gear,phase,moving,attack,twoHand,hx,hy);return;}
  String chest=slot(gear,"chest"),helmet=slot(gear,"helmet"),legs=slot(gear,"leggings"),boots=slot(gear,"boots");float bob=bob(phase,moving),stride=moving?(float)Math.sin(phase)*6*motionAmount:0;
  boolean female=gear!=null&&gear.optString("appearance").startsWith("female"),sturdy=gear!=null&&gear.optString("appearance").endsWith("2");float width=sturdy?14:female?10:12;
  int spriteRow=0;
  for(int i=0;i<2;i++){float x=i==0?-6:6,s=i==0?stride:-stride,kx=x+s*.5f,ky=-10-Math.max(0,s)*.32f,fx=x+s,fy=-Math.max(0,s)*Math.max(0,s)*.09f;int leg=color(legs,0xff45483d),boot=color(boots,0xff3b3027);line(c,0xff242b29,9,x,-23-bob,kx,ky);line(c,leg,7,x,-23-bob,kx,ky);line(c,leg,6,kx,ky,fx,fy-3);line(c,boot,7,fx,fy-6,fx,fy);line(c,boot,6,fx-2,fy,fx+5,fy);if(metal(legs)){oval(c,0xffbcc2bc,kx-3,ky-3,kx+3,ky+2);}if(metal(boots))line(c,0xffbdc3ba,1,fx-2,fy-6,fx+3,fy);}
  boolean raised=gear!=null&&gear.optLong("blockUntil")>System.currentTimeMillis();float leftX=raised?20:twoHand?hx+13:-17-stride*.24f,leftY=raised?-32:twoHand?hy-8:-24-bob;arm(c,gear,base,-width,-43-bob,leftX,leftY);
  String portraitKey=chest+":"+helmet+":"+base+":"+female+":"+width;
  Bitmap portrait=portraits.get(portraitKey);
  if(portrait==null){portrait=Bitmap.createBitmap(80,90,Bitmap.Config.ARGB_8888);Canvas layer=new Canvas(portrait);layer.translate(40,75);portrait(layer,chest,helmet,base,female,width);portraits.put(portraitKey,portrait);}
  p.setColor(Color.WHITE);p.setAlpha(255);
  c.drawBitmap(portrait,-40+(moving?(float)Math.sin(phase)*.6f*motionAmount:0),-75-bob,p);
  if(gear!=null&&!gear.optString("equippedBackpack","").isEmpty()&&!gear.optString("equippedBackpack").equals("null")){float side=spriteRow==1?0:-11;oval(c,0xff382b21,side-7,-46,side+7,-24);oval(c,0xff80603f,side-6,-45,side+6,-26);line(c,0xffb3905a,1,side-3,-43,side-3,-28);line(c,0xffb3905a,1,side+3,-43,side+3,-28);}

  arm(c,gear,base,width,-43-bob,hx,hy);
 }

 private void illustratedBody(Canvas c,JSONObject gear,float phase,boolean moving,float attack,boolean twoHand,float hx,float hy){
  int row=survivor.direction(gear),frame=SurvivorAtlas.frame(phase,moving);float bob=bob(phase,moving);String chest=slot(gear,"chest"),helmet=slot(gear,"helmet"),legs=slot(gear,"leggings"),boots=slot(gear,"boots");
  // Keep trousers, knees and boots in their authored proportions.
  // Stretching narrow slices into bones visibly breaks the original silhouette.
  survivor.drawRegion(c,gear,row,frame,-40,-29,40,2,spriteMirrored);
  float stride=moving?(float)Math.sin(phase)*3.5f*motionAmount:0;
  boolean raised=gear.optLong("blockUntil")>System.currentTimeMillis();float lx=raised?12:twoHand?hx+9:-11-stride,ly=raised?-39:twoHand?hy-5:-29-bob+(moving?(float)Math.cos(phase)*1.2f*motionAmount:0);
  arm(c,gear,0xff79664d,row>=2?-2:-8,-48-bob,lx,ly);
  survivor.drawRegion(c,gear,row,0,-20,-55,20,-28,spriteMirrored);survivor.drawRegion(c,gear,row,0,-13,-70,13,-55,spriteMirrored);
  if(!chest.isEmpty()){int garment=color(chest,0xff79664d);poly(c,(garment&0xffffff)|0x66000000,-7,-50,7,-50,8,-32,-8,-32);line(c,0xffb49a6c,1,-7,-49,7,-49);if(metal(chest)){for(int y=-46;y<-32;y+=3)for(int x=-6;x<7;x+=3)oval(c,0xffa4a99c,x,y,x+1,y+1);}}
  if(!helmet.isEmpty()){int col=color(helmet,0xff74695a);oval(c,0xff343b3b,-6,-68,6,-59);oval(c,col,-5.5f,-67.5f,5.5f,-60);poly(c,0x55717c7c,0,-67,5,-64,5,-60,0,-60);line(c,0xffbac0b6,.7f,-3,-65,-1,-67);line(c,0xff494e47,1,-6,-60,6,-60);line(c,0xff929c93,1,0,-67,0,-60);}
  arm(c,gear,0xff79664d,row>=2?1:8,-48-bob,hx,hy);
  String pack=gear.optString("equippedBackpack","");if(!pack.isEmpty()&&!pack.equals("null")){float side=row==1?0:-9;oval(c,0xff3c2c1e,side-5,-49,side+5,-30);oval(c,0xff80603f,side-4,-48,side+4,-32);line(c,0xffbb9a61,1,side,-46,side,-33);}
 }
 private void portrait(Canvas c,String chest,String helmet,int base,boolean female,float width){float bob=0;
  poly(c,0xff222b28,-width-2,-47-bob,width+2,-47-bob,width+5,-19-bob,-width-4,-19-bob);
  poly(c,color(chest,base),-width,-46-bob,width,-46-bob,width+2,-21-bob,-width-2,-21-bob);
  if(metal(chest)){poly(c,0x66e1e5d9,-width+2,-44-bob,0,-45-bob,0,-23-bob,-width+1,-24-bob);line(c,0xff3e4949,1,0,-44-bob,0,-24-bob);for(int i=0;i<3;i++)line(c,0xff4b5553,1,-width,-30+i*3-bob,width,-30+i*3-bob);oval(c,color(chest,base),-width-5,-48-bob,-width+6,-39-bob);oval(c,color(chest,base),width-6,-48-bob,width+5,-39-bob);}
  if(chest.startsWith("mail")){for(int y=-42;y<-24;y+=4)for(int x=-8;x<10;x+=4)oval(c,0xffc0c4b5,x,y-bob,x+1.5f,y+1.5f-bob);}
  else if(!chest.isEmpty()&&!metal(chest)){for(int x=-7;x<10;x+=5)line(c,0x55302b23,1,x,-43-bob,x,-25-bob);}
  // Shoulder light, seams and fasteners track the same animation joints.
  line(c,0x66e9dcc0,1,-width+2,-45-bob,width-2,-45-bob);
  line(c,0x55302118,1,width-1,-42-bob,width+1,-26-bob);
  for(int button=0;button<3;button++)oval(c,0xffb3a174,1,-40+button*5-bob,2.5f,-38.5f+button*5-bob);
  line(c,0xff503d29,4,-width,-23-bob,width,-23-bob);oval(c,0xffc2a66a,-2,-25-bob,3,-21-bob);
  oval(c,0xffbda283,-7,-62-bob,8,-45-bob);if(helmet.isEmpty()){poly(c,0xff42372d,-8,-53-bob,-8,-61-bob,0,-66-bob,8,-61-bob,9,-55-bob,3,-59-bob,-3,-58-bob);if(female)line(c,0xff42372d,4,-7,-57-bob,-8,-43-bob);}
  else{poly(c,color(helmet,base),-10,-51-bob,-9,-62-bob,0,-68-bob,10,-62-bob,11,-51-bob);if(metal(helmet)){line(c,0xffccd0bd,2,0,-65-bob,0,-49-bob);line(c,0xff27312f,3,-7,-53-bob,8,-53-bob);}else line(c,0xff4b4739,2,-8,-52-bob,8,-52-bob);}
  line(c,0xff3a3027,1,-4,-54-bob,-1,-54-bob);line(c,0xff3a3027,1,3,-54-bob,5,-54-bob);
  line(c,0xff876c55,1,0,-51-bob,2,-49-bob);
  // Fine material relief is cached; limbs and equipment remain animated independently.
  if(metal(chest)){
   line(c,0xffd8d9c9,1,-width+2,-42,-3,-43);
   line(c,0xff303c3b,1,-width,-34,0,-31);line(c,0xff303c3b,1,0,-31,width,-34);
   for(int side=-1;side<=1;side+=2){line(c,0xffb4beb5,1,side*(width-1),-47,side*(width+3),-42);for(int y=-40;y<-25;y+=6)oval(c,0xffc6b887,side*(width-2)-.6f,y,side*(width-2)+.6f,y+1.2f);}
  }else{
   poly(c,0x3430231c,-width,-43,-width+5,-39,-width+1,-25,-width-1,-23);
   line(c,0x887c735b,1,-7,-32,-4,-25);line(c,0x77402f24,1,6,-35,9,-26);
   line(c,0xff363a30,2,-6,-45,0,-41);line(c,0xff363a30,2,0,-41,6,-45);
   for(int y=-39;y<-30;y+=3)line(c,0xffc3af83,.7f,-1,y,2,y+1);
  }
  // Belt stitching and a small leather pouch sit above the moving hips.
  line(c,0xff9b7d50,.7f,-width,-22,width,-22);
  poly(c,0xff473627,5,-25,11,-25,12,-18,6,-17);line(c,0xffa38758,.8f,6,-24,10,-24);oval(c,0xffbaa16e,8,-22,9,-21);
  if(helmet.isEmpty()||!metal(helmet)){
   poly(c,0x55794e36,5,-57,8,-55,6,-48,2,-46,4,-51);
   line(c,0xffd8b997,.8f,-4,-57,1,-58);line(c,0xffcfb08c,.8f,1,-54,2,-51);
   line(c,0xff765343,.8f,-1,-48,3,-48);
   if(helmet.isEmpty()){line(c,0xff79644a,1,-5,-61,-1,-63);line(c,0xff79644a,.8f,2,-63,5,-60);if(female){line(c,0xff9c8059,.8f,-7,-53,-8,-45);}else line(c,0x80574030,1,-3,-47,3,-46);}
  }else{line(c,0xffe1e1cf,.8f,-6,-62,-1,-65);line(c,0xff354341,1,7,-60,8,-55);}
 }
 void support(Canvas c,JSONObject gear,int base,float x,float y,float phase,boolean moving){arm(c,gear,base,-11,-43-bob(phase,moving),x,y);}
 void hand(Canvas c,JSONObject gear){oval(c,color(slot(gear,"gloves"),0xffb49a7c),-3.5f,-3.5f,3.5f,3.5f);}
}



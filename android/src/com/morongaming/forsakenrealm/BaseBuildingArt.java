package com.morongaming.forsakenrealm;
import android.graphics.*;import android.util.LruCache;import org.json.JSONObject;
/** Bounded pixel-scale isometric house and base-building meshes. Doors use server orientation. */
final class BaseBuildingArt {
 private final Paint p=new Paint();private final Path path=new Path();
 private final LruCache<String,Bitmap> cache=new LruCache<String,Bitmap>(8*1024*1024){protected int sizeOf(String k,Bitmap b){return b.getByteCount();}};
 private float sx(float x,float y){return x-y;}private float sy(float x,float y,float z){return (x+y)*.5f-z;}
 private void face(Canvas c,int color,float... xyz){path.reset();for(int i=0;i<xyz.length;i+=3){float x=Math.round(sx(xyz[i],xyz[i+1])),y=Math.round(sy(xyz[i],xyz[i+1],xyz[i+2]));if(i==0)path.moveTo(x,y);else path.lineTo(x,y);}path.close();p.setColor(color);c.drawPath(path,p);}
 private void beam(Canvas c,int color,float x1,float y1,float z1,float x2,float y2,float z2,float width){p.setColor(color);p.setStrokeWidth(width);c.drawLine(Math.round(sx(x1,y1)),Math.round(sy(x1,y1,z1)),Math.round(sx(x2,y2)),Math.round(sy(x2,y2,z2)),p);p.setStrokeWidth(1);}
 boolean draw(Canvas c,JSONObject b,boolean obstructs){String id=b.optString("id"),design=b.optString("houseDesign"),kind="";boolean annex=id.startsWith("annex:");if(!annex&&!id.startsWith("home:")&&design.isEmpty())return false;if(annex){String[] parts=id.split(":");if(parts.length<2)return false;kind=parts[1];}if(design.isEmpty()&&!annex){String[] parts=id.split(":");design=parts.length>1?parts[1]:"hut";}
  int level=Math.max(1,Math.min(8,b.optInt("baseLevel",1))),style=design.equals("manor")?4:design.equals("townhouse")?3:design.equals("farmhouse")?2:design.equals("cottage")?1:0,rotation=b.optInt("rotation");float a=(float)b.optDouble("halfWidth",90),d=(float)b.optDouble("depth",80),height=annex?66:52+style*9+(level-1)*3,ridge=annex?28:24+level*2;int w=(int)Math.ceil(a*2+d+48),h=(int)Math.ceil(a+d*.5f+height+ridge+74),cx=(int)(a+24),cy=h-(int)(a/2+35);
  String key=(annex?kind:design)+":"+level+":"+rotation+":"+a+":"+d;Bitmap image=cache.get(key);if(image==null){image=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);Canvas g=new Canvas(image);g.translate(cx,cy);mesh(g,kind,annex,style,level,rotation,a,d,height,ridge);cache.put(key,image);}p.setColor(Color.WHITE);p.setAlpha(obstructs?110:255);c.drawBitmap(image,-cx,-cy,p);p.setAlpha(255);return true;
 }
 private void mesh(Canvas c,String kind,boolean annex,int style,int level,int rotation,float a,float d,float z,float ridge){boolean glass=kind.equals("greenhouse"),stone=level>=5||kind.equals("workshop")||kind.equals("trophyhouse"),barn=kind.equals("stable")||kind.equals("husbandry");int front=glass?0xff7caba4:stone?0xff969382:0xff927454,right=glass?0xff547f7c:stone?0xff696f66:0xff624a36,roof=glass?0xff83b6b2:level>=6?0xff596975:level>=3?0xff745a49:barn?0xff7d6845:0xff93764f;
  face(c,0x55000000,-a-9,-d-3,0,a+12,-d-3,0,a+12,22,0,-a-9,22,0);
  face(c,front,-a,10,0,a,10,0,a,10,z,-a,10,z);face(c,right,a,-d,0,a,10,0,a,10,z,a,-d,z);
  face(c,glass?0xffa0c8bf:0xffaa8b62,-a,-d,z,a,-d,z,a,-d/2,z+ridge,-a,-d/2,z+ridge);face(c,roof,-a,-d/2,z+ridge,a,-d/2,z+ridge,a,14,z,-a,14,z);
  if(!glass){for(int row=10;row<z;row+=11){beam(c,stone?0xff666b61:0xff57432f,-a,10,row,a,10,row,1);beam(c,stone?0xff52594f:0xff443c2d,a,-d,row,a,10,row,1);}for(int col=0;col<Math.max(3,(int)(a/25));col++){float x=-a+(col+1)*2*a/(Math.max(3,(int)(a/25))+1);beam(c,0xff503d2a,x,10,0,x,10,z,3);}for(int row=0;row<5;row++){float y=-d/2+(d/2+14)*row/5;float rz=z+ridge*(1-(y+d/2)/(d/2+14));beam(c,0xff493e34,-a,y,rz,a,y,rz,1);}}
  else{for(int n=0;n<=6;n++){float x=-a+2*a*n/6;beam(c,0xffd0c39d,x,10,0,x,10,z,3);beam(c,0xffd0c39d,x,14,z,x,-d/2,z+ridge,3);}for(int n=1;n<4;n++){float zz=z*n/4;beam(c,0xffc6b991,-a,10,zz,a,10,zz,2);}beam(c,0xffd4c9a5,-a,-d/2,z+ridge,a,-d/2,z+ridge,4);}
  if(!glass){float doorW=barn?31:18;face(c,0xff282d26,-doorW,10.3f,0,doorW,10.3f,0,doorW,10.3f,z*.72f,-doorW,10.3f,z*.72f);beam(c,0xffbea16b,-doorW,10.7f,0,-doorW,10.7f,z*.72f,3);beam(c,0xffbea16b,doorW,10.7f,0,doorW,10.7f,z*.72f,3);beam(c,0xffbea16b,-doorW,10.7f,z*.72f,doorW,10.7f,z*.72f,4);for(int side:new int[]{-1,1}){float x=side*a*.64f;face(c,0xff333c38,x-9,10.6f,z*.42f,x+9,10.6f,z*.42f,x+9,10.6f,z*.73f,x-9,10.6f,z*.73f);beam(c,0xffe2bd70,x,11,z*.43f,x,11,z*.72f,2);}}
  if(level>=3&&!annex){face(c,0xff777e74,-a-4,11,0,a+4,11,0,a+4,11,12+level,-a-4,11,12+level);for(int n=-3;n<=3;n++)beam(c,0xffb4af98,n*a/3,11.4f,0,n*a/3,11.4f,12+level,1);}
  if(kind.equals("smokehouse")||kind.equals("cookhouse")||kind.equals("workshop")){face(c,0xff74776b,a*.55f,-d*.6f,z+12,a*.8f,-d*.6f,z+12,a*.8f,-d*.6f,z+ridge+34,a*.55f,-d*.6f,z+ridge+34);beam(c,0xffa3a18d,a*.55f,-d*.6f,z+ridge+34,a*.8f,-d*.6f,z+ridge+34,5);}
  if(!annex&&level>=2){beam(c,0xffc2a263,-a*.55f,-d/2,z+ridge,-a*.55f,-d/2,z+ridge+22,3);face(c,level>=7?0xffbea24c:0xff7d3e3e,-a*.55f,-d/2,z+ridge+22,-a*.55f+18+level,-d/2,z+ridge+17,-a*.55f,-d/2,z+ridge+8);}
  if(rotation!=0){p.setColor(0xffffd58a);float x=rotation==90?a+18:rotation==270?-a-18:0,y=rotation==180?-d-18:10;p.setStrokeWidth(3);c.drawCircle(sx(x,y),sy(x,y,0),7,p);p.setStrokeWidth(1);}
 }
}


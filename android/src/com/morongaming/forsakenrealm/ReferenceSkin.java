package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import java.io.*;
/** Unchanged approved picture regions supply decorative artwork; game labels and actions remain live. */
final class ReferenceSkin {
 static ReferenceSkin current;private Bitmap menu,selection,classes;private final Paint p=new Paint(3);private final Rect source=new Rect();private final RectF destination=new RectF();
 static synchronized ReferenceSkin get(Context c){if(current==null)current=new ReferenceSkin(c);return current;}
 private ReferenceSkin(Context c){menu=load(c,"menu/approved-menu-skin.png");selection=load(c,"menu/approved-character-screen.png");classes=load(c,"menu/approved-character-classes.png");}
 private Bitmap load(Context c,String name){try(InputStream in=c.getAssets().open(name)){return BitmapFactory.decodeStream(in);}catch(IOException e){return null;}}
 private void part(Canvas c,Bitmap image,int l,int t,int r,int b,float x,float y,float w,float h){if(image==null||w<=0||h<=0)return;source.set(l,t,r,b);destination.set(x,y,x+w,y+h);p.setColor(Color.WHITE);c.drawBitmap(image,source,destination,p);}
 boolean brand(Canvas c,float x,float y,float width,float height){if(selection==null)return false;part(c,selection,14,5,502,128,x,y,width,height);return true;}
 boolean icon(Canvas c,int index,float x,float y,float size){if(menu==null||index<0||index>4)return false;int top=123+index*56;part(c,menu,44,top,79,top+34,x,y,size,size);return true;}
 void companion(Canvas c,String kind,RectF r){if(kind.toLowerCase().contains("dog")){part(c,selection,533,835,666,972,r.left,r.top,r.width(),r.height());return;}int index=kind.contains("dire")?1:kind.contains("horse")?2:kind.contains("bear")?3:kind.contains("raven")?4:kind.contains("lone")?5:kind.contains("familiar")?6:0;int[] left={12,196,393,586,781,976,1157},right={181,382,574,768,969,1141,1300};part(c,classes,left[index],1008,right[index],1150,r.left,r.top,r.width(),r.height());}
 boolean frame(Canvas c,float x,float y,float w,float h,boolean active){Bitmap image=menu;if(image==null)return false;int l=34,t=active?113:169,r=229,b=active?162:218,edge=7;float e=Math.min(9,Math.min(w,h)/4);
  p.setShader(new LinearGradient(x,y,x,y+h,active?0xf5472a0c:0xf5100d09,active?0xf71b1005:0xf7060606,Shader.TileMode.CLAMP));c.drawRect(x,y,x+w,y+h,p);p.setShader(null);
  part(c,image,l,t,l+edge,t+edge,x,y,e,e);part(c,image,r-edge,t,r,t+edge,x+w-e,y,e,e);part(c,image,l,b-edge,l+edge,b,x,y+h-e,e,e);part(c,image,r-edge,b-edge,r,b,x+w-e,y+h-e,e,e);
  part(c,image,l+edge,t,r-edge,t+3,x+e,y,w-e*2,3);part(c,image,l+edge,b-3,r-edge,b,x+e,y+h-3,w-e*2,3);part(c,image,l,t+edge,l+3,b-edge,x,y+e,3,h-e*2);part(c,image,r-3,t+edge,r,b-edge,x+w-3,y+e,3,h-e*2);return true;
 }
}


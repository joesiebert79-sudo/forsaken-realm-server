package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import org.json.*;import java.io.*;
/** Exact cells from the owner's immutable item sheet; unsupported items keep existing art. */
final class ApprovedItemAtlas {
 private Bitmap bitmap;private JSONObject index;private final Paint paint=new Paint();
 ApprovedItemAtlas(Context context){try(InputStream image=context.getAssets().open("menu/item-atlas-approved.png");InputStream data=context.getAssets().open("menu/item-atlas-index.json")){
  BitmapFactory.Options options=new BitmapFactory.Options();options.inPreferredConfig=Bitmap.Config.RGB_565;bitmap=BitmapFactory.decodeStream(image,null,options);
  ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buffer=new byte[4096];int n;while((n=data.read(buffer))!=-1)out.write(buffer,0,n);index=new JSONObject(out.toString("UTF-8"));
 }catch(Exception ignored){bitmap=null;index=null;}}
 boolean draw(Canvas canvas,String id,float x,float y,float size){if(bitmap==null||index==null)return false;JSONObject entry=index.optJSONObject(id),cell=entry==null?null:entry.optJSONObject("rect");if(cell==null)return false;
  int left=cell.optInt("x"),top=cell.optInt("y"),width=cell.optInt("w"),height=cell.optInt("h");if(width<=0||height<=0||left<0||top<0||left+width>bitmap.getWidth()||top+height>bitmap.getHeight())return false;
  float scale=Math.min(size/width,size/height),w=width*scale,h=height*scale;canvas.drawBitmap(bitmap,new Rect(left,top,left+width,top+height),new RectF(x+(size-w)/2,y+(size-h)/2,x+(size+w)/2,y+(size+h)/2),paint);return true;
 }
}

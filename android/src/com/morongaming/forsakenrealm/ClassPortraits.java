package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import org.json.JSONObject;import java.io.InputStream;
/** Menu-only class illustrations. Equipment slots continue to show owned gear. */
final class ClassPortraits {
 final Bitmap atlas;final Paint p=new Paint(3);final Rect src=new Rect();final RectF dst=new RectF();
 ClassPortraits(Context c){Bitmap b=null;try(InputStream in=c.getAssets().open("menu/class-portraits-v091.png")){b=BitmapFactory.decodeStream(in);}catch(Exception ignored){}atlas=b;}
 boolean draw(Canvas c,JSONObject character,RectF bounds){if(atlas==null)return false;String role=character.optString("role");int col=-1;for(int i=0;i<ClassSprites.CLASSES.length;i++)if(role.equals(ClassSprites.CLASSES[i]))col=i;if(col<0)return false;boolean female=character.optString("appearance").startsWith("female");int cw=atlas.getWidth()/6,split=Math.round(atlas.getHeight()*348f/724f);src.set(col*cw,female?split:0,(col+1)*cw,female?atlas.getHeight():split);float scale=Math.min(bounds.width()/src.width(),bounds.height()/src.height()),w=src.width()*scale,h=src.height()*scale;dst.set(bounds.centerX()-w/2,bounds.bottom-h,bounds.centerX()+w/2,bounds.bottom);p.setColor(Color.WHITE);c.drawBitmap(atlas,src,dst,p);return true;}
}

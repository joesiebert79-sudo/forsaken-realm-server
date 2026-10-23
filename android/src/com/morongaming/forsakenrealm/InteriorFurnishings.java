package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import org.json.JSONObject;import java.io.InputStream;
/** Shared transparent reference-derived props, anchored to server footprints. */
final class InteriorFurnishings {
 final Bitmap atlas;final Paint paint=new Paint(3);final Rect source=new Rect();final RectF target=new RectF();
 static final int[][] CELLS={{0,0,340,330},{340,0,635,325},{640,0,955,335},{970,0,1270,335},{15,370,300,640},{330,325,635,635},{640,325,950,640},{975,345,1260,640},{35,630,295,940},{330,675,635,940},{645,700,935,940},{970,625,1260,965},{70,975,270,1230},{340,940,630,1240},{635,950,945,1240},{945,970,1265,1240}};
 InteriorFurnishings(Context context){Bitmap b=null;try(InputStream in=context.getAssets().open("menu/interior-furnishings-v091.png")){BitmapFactory.Options o=new BitmapFactory.Options();o.inPreferredConfig=Bitmap.Config.ARGB_8888;b=BitmapFactory.decodeStream(in,null,o);}catch(Exception ignored){}atlas=b;}
 boolean draw(Canvas canvas,JSONObject f){if(atlas==null)return false;String kind=f.optString("kind"),name=f.optString("name").toLowerCase(java.util.Locale.ROOT);int cell=-1;
 if(name.contains("planting"))cell=15;else if(name.contains("notice"))cell=13;else if(name.contains("pen")||name.contains("stall"))cell=14;
 else if(kind.equals("bed"))cell=0;else if(kind.equals("table"))cell=1;else if(kind.equals("counter"))cell=2;else if(kind.equals("forge")||kind.equals("hearth")||kind.equals("kiln"))cell=3;else if(kind.equals("anvil"))cell=4;else if(kind.equals("loom"))cell=5;else if(kind.equals("tannery"))cell=6;else if(kind.equals("mill"))cell=7;else if(kind.equals("smoker"))cell=8;else if(kind.equals("crate")||kind.equals("box"))cell=9;else if(kind.equals("chest"))cell=10;else if(kind.equals("rack"))cell=11;else if(kind.equals("barrel"))cell=12;
 if(cell<0)return false;int[] r=CELLS[cell];float factor=atlas.getWidth()/1280f;source.set(Math.round(r[0]*factor),Math.round(r[1]*factor),Math.round(r[2]*factor),Math.round(r[3]*factor));float w=(float)f.optDouble("w"),d=(float)f.optDouble("h"),width=w+d,height=width*source.height()/source.width(),bottom=(w+d)*.5f;target.set(-d,bottom-height,w,bottom);paint.setColor(Color.WHITE);canvas.drawBitmap(atlas,source,target,paint);return true;}
}

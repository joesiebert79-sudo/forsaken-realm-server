package com.morongaming.forsakenrealm;
import android.graphics.*;
/** Shared world-anchored materials. Atlases/shaders are prepared only on asset/quality changes. */
final class WorldMaterials {
 private Bitmap source;private final BitmapShader[] ground=new BitmapShader[4];private final Paint paint=new Paint(3);private final Matrix matrix=new Matrix();private int tileSize;
 void prepare(Bitmap atlas,int tile){if(source==atlas&&tileSize==tile)return;source=atlas;tileSize=tile;for(int i=0;i<4;i++){ground[i]=null;if(atlas!=null){int w=atlas.getWidth()/2,h=atlas.getHeight()/2;Bitmap cell=Bitmap.createBitmap(atlas,i%2*w,i/2*h,w,h);ground[i]=new BitmapShader(cell,Shader.TileMode.MIRROR,Shader.TileMode.MIRROR);matrix.setScale((float)tile/w,(float)tile/h);ground[i].setLocalMatrix(matrix);}}}
 private void begin(int material){paint.setColor(ground[material]==null?0xff687142:Color.WHITE);paint.setAlpha(255);paint.setShader(ground[material]);paint.setStrokeCap(Paint.Cap.ROUND);paint.setStrokeJoin(Paint.Join.ROUND);}
 private void end(){paint.setShader(null);paint.setAlpha(255);paint.setStyle(Paint.Style.FILL);}
 void ground(Canvas c,int material,float l,float t,float r,float b){begin(material);c.drawRect(l,t,r,b,paint);end();}
 void patch(Canvas c,Path path,int material,float feather,int quality){begin(material);paint.setStyle(Paint.Style.STROKE);int layers=quality==0?2:4;for(int i=layers;i>=1;i--){paint.setStrokeWidth(feather*i/layers);paint.setAlpha(quality==0?55:45);c.drawPath(path,paint);}paint.setAlpha(255);paint.setStyle(Paint.Style.FILL);c.drawPath(path,paint);end();}
 void road(Canvas c,Path path,int material,float width,int quality){begin(material);paint.setStyle(Paint.Style.STROKE);int layers=quality==0?2:4;for(int i=layers;i>=1;i--){paint.setStrokeWidth(width+5*i);paint.setAlpha(quality==0?50:40);c.drawPath(path,paint);}paint.setStrokeWidth(width);paint.setAlpha(255);c.drawPath(path,paint);end();}
}

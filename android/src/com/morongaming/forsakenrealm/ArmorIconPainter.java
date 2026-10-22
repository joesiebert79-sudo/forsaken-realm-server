package com.morongaming.forsakenrealm;
import android.graphics.*;import org.json.JSONObject;
/** Single shaded equipment silhouette per slot; no atlas collage or decoded bitmap cache. */
final class ArmorIconPainter {
 static void draw(Canvas c,JSONObject item,float x,float y,float size){
 c.save();c.translate(x,y);c.scale(size/100f,size/100f);Paint p=new Paint(3);String material=item.optString("material"),slot=item.optString("armorSlot");boolean metal=material.equals("metal");int dark=metal?0xff333c42:material.equals("leather")?0xff49301f:0xff494439,light=metal?0xffc4c9c5:material.equals("leather")?0xffa07743:0xffb3a786;Path shape=new Path();
 if(slot.equals("helmet")){shape.moveTo(23,77);shape.lineTo(23,40);shape.cubicTo(24,5,76,5,77,40);shape.lineTo(77,77);shape.lineTo(57,88);shape.lineTo(57,58);shape.lineTo(43,58);shape.lineTo(43,88);shape.close();}
 else if(slot.equals("chest")){shape.moveTo(35,12);shape.lineTo(44,24);shape.lineTo(56,24);shape.lineTo(65,12);shape.lineTo(88,30);shape.lineTo(77,48);shape.lineTo(69,39);shape.lineTo(72,85);shape.lineTo(28,85);shape.lineTo(31,39);shape.lineTo(23,48);shape.lineTo(12,30);shape.close();}
 else if(slot.equals("leggings")){shape.moveTo(27,12);shape.lineTo(73,12);shape.lineTo(79,88);shape.lineTo(56,88);shape.lineTo(50,46);shape.lineTo(44,88);shape.lineTo(21,88);shape.close();}
 else if(slot.equals("boots")){for(int i=0;i<2;i++){float a=15+i*43;shape.addRoundRect(a,17,a+25,70,4,4,Path.Direction.CW);shape.addRoundRect(a-5,63,a+29,86,6,6,Path.Direction.CW);}}
 else{for(int i=0;i<2;i++){float a=15+i*43;shape.addRoundRect(a,24,a+25,81,5,5,Path.Direction.CW);shape.addRoundRect(a-8,40,a+9,65,6,6,Path.Direction.CW);}}
 p.setShader(new LinearGradient(15,10,85,85,new int[]{dark,light,dark},new float[]{0,.45f,1},Shader.TileMode.CLAMP));c.drawPath(shape,p);p.setShader(null);c.save();c.clipPath(shape);p.setColor(metal?0x66404a50:0x665a4935);p.setStrokeWidth(1);for(int i=15;i<95;i+=metal?12:5)c.drawLine(12,i,88,i+3,p);p.setColor(0x99e0d1a4);for(int i=23;i<85;i+=14){c.drawCircle(30,i,1.4f,p);c.drawCircle(69,i,1.4f,p);}c.restore();p.setColor(0xff171c19);p.setStrokeWidth(2);p.setStyle(Paint.Style.STROKE);c.drawPath(shape,p);c.restore();
 }
}


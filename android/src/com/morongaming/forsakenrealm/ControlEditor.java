package com.morongaming.forsakenrealm;
import android.content.Context;
import android.graphics.*;
import android.view.*;
import android.widget.*;
/** Drag every control, then resize the selected control; save explicitly. */
final class ControlEditor extends LinearLayout {
 interface Host {void save(CombatControls layout);void close();void preview(Canvas canvas,float width,float height);}
 final Host host;final CombatControls draft;Preview preview;TextView selected;SeekBar size;int selection=1;
 ControlEditor(Context context,CombatControls current,Host host){super(context);this.host=host;draft=current.copy();setOrientation(VERTICAL);setBackgroundColor(0xff211c17);
 LinearLayout bar=new LinearLayout(context);bar.setGravity(Gravity.CENTER_VERTICAL);addView(bar);TextView title=new TextView(context);title.setText("BUTTON CONFIGURATION • Drag to move");title.setTextColor(Color.WHITE);bar.addView(title,new LinearLayout.LayoutParams(0,dp(56),1));
 addButton(bar,"Reset",()->{draft.reset();refresh();});addButton(bar,"Cancel",host::close);addButton(bar,"Save",()->{if(draft.overlaps(preview.worldW,preview.worldH)){Toast.makeText(context,"Separate overlapping controls before saving",Toast.LENGTH_LONG).show();return;}host.save(draft);});
 preview=new Preview(context);addView(preview,new LinearLayout.LayoutParams(-1,0,1));LinearLayout footer=new LinearLayout(context);footer.setGravity(Gravity.CENTER_VERTICAL);addView(footer);selected=new TextView(context);selected.setTextColor(Color.WHITE);footer.addView(selected,new LinearLayout.LayoutParams(dp(160),dp(56)));addButton(footer,"−",()->resize(-.05f));size=new SeekBar(context);size.setMax(120);footer.addView(size,new LinearLayout.LayoutParams(0,dp(56),1));addButton(footer,"+",()->resize(.05f));size.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){public void onProgressChanged(SeekBar s,int progress,boolean user){if(user){draft.sizes[selection]=.6f+progress/100f;preview.invalidate();selected.setText(CombatControls.LABELS[selection]+" • "+Math.round(draft.sizes[selection]*100)+"%");}}public void onStartTrackingTouch(SeekBar s){}public void onStopTrackingTouch(SeekBar s){}});refresh();}
 int dp(float n){return Math.round(n*getResources().getDisplayMetrics().density);}
 void addButton(LinearLayout row,String label,Runnable action){Button b=new Button(getContext());b.setText(label);b.setTextSize(12);b.setPadding(0,0,0,0);b.setMinWidth(0);b.setMinimumWidth(0);b.setOnClickListener(v->action.run());row.addView(b,new LinearLayout.LayoutParams(dp(64),dp(48)));}
 void resize(float step){draft.sizes[selection]=Math.max(.6f,Math.min(1.8f,draft.sizes[selection]+step));refresh();}
 void refresh(){if(size!=null)size.setProgress(Math.round((draft.sizes[selection]-.6f)*100));if(selected!=null)selected.setText(CombatControls.LABELS[selection]+" • "+Math.round(draft.sizes[selection]*100)+"%");if(preview!=null)preview.invalidate();}
 final class Preview extends View {final Paint p=new Paint(3);float scale=1,left,top,worldW=960,worldH=540,offsetX,offsetY;boolean dragging;
 Preview(Context c){super(c);}
 protected void onDraw(Canvas c){worldW=ControlEditor.this.getWidth();worldH=ControlEditor.this.getHeight();if(worldW<=0||worldH<=0)return;scale=Math.min(getWidth()/worldW,getHeight()/worldH);left=(getWidth()-worldW*scale)/2;top=(getHeight()-worldH*scale)/2;c.save();c.translate(left,top);c.scale(scale,scale);p.setColor(0xff35433a);c.drawRect(0,0,worldW,worldH,p);float u=Math.min(worldW/960,worldH/540);host.preview(c,worldW,worldH);for(int i=0;i<CombatControls.LABELS.length;i++){if(!CombatControls.enabled(i))continue;float x=draft.x(i,worldW,worldH),y=draft.y(i,worldW,worldH),r=draft.radius(i,worldW,worldH);p.setColor(i==selection?0xff8d7748:0xdd202b26);c.drawCircle(x,y,r,p);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(2*u);p.setColor(0xffe1cea0);c.drawCircle(x,y,r,p);p.setStyle(Paint.Style.FILL);p.setTextSize(Math.min(13*u,r*.3f));String label=CombatControls.LABELS[i];while(p.measureText(label)>r*1.8f)p.setTextSize(p.getTextSize()-1);c.drawText(label,x-p.measureText(label)/2,y+4*u,p);}c.restore();}
 public boolean onTouchEvent(MotionEvent e){float x=(e.getX()-left)/scale,y=(e.getY()-top)/scale;switch(e.getActionMasked()){case MotionEvent.ACTION_DOWN:int hit=draft.hit(x,y,worldW,worldH,true);dragging=hit>=0;if(dragging){selection=hit;offsetX=x-draft.x(hit,worldW,worldH);offsetY=y-draft.y(hit,worldW,worldH);refresh();}return true;case MotionEvent.ACTION_MOVE:if(dragging){draft.move(selection,x-offsetX,y-offsetY,worldW,worldH);invalidate();}return true;case MotionEvent.ACTION_UP:case MotionEvent.ACTION_CANCEL:dragging=false;return true;}return true;}
 }
}




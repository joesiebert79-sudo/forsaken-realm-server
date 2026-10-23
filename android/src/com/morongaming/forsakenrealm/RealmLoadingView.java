package com.morongaming.forsakenrealm;
import android.content.Context;import android.graphics.*;import android.view.View;
/** Displayed only while the real join request is in flight; no simulated loading percentage. */
final class RealmLoadingView extends View {
 final MenuFrame f=new MenuFrame();
 RealmLoadingView(Context c){super(c);setContentDescription("Connecting to your Forsaken Realm server. Your saved survivor will appear when the server responds.");}
 protected void onDraw(Canvas c){f.begin(c,this);ReferenceSkin.current.brand(c,235,150,490,145);f.panel(c,240,342,480,100,false);f.text(c,"CONNECTING TO YOUR REALM",282,379,22,416);f.text(c,"Loading your saved survivor and world…",286,414,16,408);c.restore();}
}


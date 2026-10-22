package com.morongaming.forsakenrealm;
/** Frame-rate independent animation amplitude; never modifies movement positions. */
final class GaitBlend {
 float amount;long at;
 float update(boolean moving,long now){float dt=at==0?0:Math.max(0,Math.min(.1f,(now-at)/1000f));at=now;float target=moving?1:0;amount+=(target-amount)*(1-(float)Math.exp(-dt/(moving?.10f:.14f)));if(!moving&&amount<.005f)amount=0;return amount;}
}

package com.morongaming.forsakenrealm;
/** Foreground checks are throttled briefly; failed checks can retry rather than locking out for the session. */
final class UpdateCheckPolicy {
 private boolean running;private long lastAttempt=-1;private int failures;
 boolean begin(long now,boolean force){if(running||(!force&&lastAttempt>=0&&now-lastAttempt<60000))return false;running=true;lastAttempt=now;return true;}
 void success(){running=false;failures=0;}
 long failure(){running=false;failures++;return failures==1?10000:failures==2?30000:-1;}
 void foreground(){failures=0;}
}

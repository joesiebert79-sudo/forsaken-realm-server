package com.morongaming.forsakenrealm;
/** Modern worlds never fall back to the legacy chooseRole protocol. */
final class OnboardingFlow {
 static final int GAME=0,CHARACTER=1,ROLE=2;
 static int screen(boolean modern,boolean required,boolean hasRole){return modern?(required||!hasRole?CHARACTER:GAME):(hasRole?GAME:ROLE);}
 static boolean allows(int screen,String action){return screen==GAME||screen==CHARACTER&&"createCharacter".equals(action)||screen==ROLE&&"chooseRole".equals(action);}
}


package com.morongaming.forsakenrealm;
import java.math.BigInteger;
/** Mirrors the approved 100:1 denomination values without overflowing a long. */
final class CoinMath {
 static boolean canAfford(long copper,long silver,long gold,long price,String currency){if(copper<0||silver<0||gold<0||price<0)return false;int factor="gold".equals(currency)?10000:"silver".equals(currency)?100:"copper".equals(currency)?1:0;if(factor==0)return false;BigInteger wallet=BigInteger.valueOf(gold).multiply(BigInteger.valueOf(10000)).add(BigInteger.valueOf(silver).multiply(BigInteger.valueOf(100))).add(BigInteger.valueOf(copper));return wallet.compareTo(BigInteger.valueOf(price).multiply(BigInteger.valueOf(factor)))>=0;}
}

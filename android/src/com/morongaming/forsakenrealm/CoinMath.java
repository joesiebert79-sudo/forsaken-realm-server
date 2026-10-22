package com.morongaming.forsakenrealm;
import java.math.BigInteger;
/** Mirrors the approved 10:1 denomination values without overflowing a long. */
final class CoinMath {
 static boolean canAfford(long copper,long silver,long gold,long price,String currency){if(copper<0||silver<0||gold<0||price<0)return false;int factor="gold".equals(currency)?100:"silver".equals(currency)?10:"copper".equals(currency)?1:0;if(factor==0)return false;BigInteger wallet=BigInteger.valueOf(gold).multiply(BigInteger.valueOf(100)).add(BigInteger.valueOf(silver).multiply(BigInteger.valueOf(10))).add(BigInteger.valueOf(copper));return wallet.compareTo(BigInteger.valueOf(price).multiply(BigInteger.valueOf(factor)))>=0;}
}

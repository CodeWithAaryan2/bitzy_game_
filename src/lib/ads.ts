/**
 * src/lib/ads.ts
 * Rewarded-ad gate for: hint unlock + heart refill.
 * Real ads only exist on native builds (AdMob SDK ships inside the app).
 * On plain web there's no AdMob SDK — falls back to a simulated ad delay
 * so the web build stays testable without pretending real ads ran.
 */
import { Capacitor } from '@capacitor/core';

export const AD_UNITS = {
  hint: 'ca-app-pub-6633163705037549/2353287433',
  heartRefill: 'ca-app-pub-6633163705037549/7594005824',
} as const;

type AdMobModule = typeof import('@capacitor-community/admob');
let admobMod: AdMobModule | null = null;
let initialized = false;
const isNative = Capacitor.isNativePlatform();

async function getAdMob() {
  if (!admobMod) admobMod = await import('@capacitor-community/admob');
  return admobMod;
}

async function ensureInit() {
  if (initialized || !isNative) return;
  const { AdMob } = await getAdMob();
  await AdMob.initialize({ initializeForTesting: false });
  initialized = true;
}

export async function initAdMob() {
  try {
    await ensureInit();
  } catch (e) {
    console.error('[ads] initAdMob failed:', e);
  }
}

export async function showRewardedAd(adUnitId: string): Promise<boolean> {
  if (!isNative) {
    console.warn('[ads] Not native — simulating rewarded ad:', adUnitId);
    await new Promise(r => setTimeout(r, 1500));
    return true;
  }

  try {
    await ensureInit();
    const { AdMob, RewardAdPluginEvents } = await getAdMob();

    return await new Promise<boolean>((resolve) => {
      let earned = false;
      let settled = false;

      const cleanup = () => {
        rewardListener.then(l => l.remove());
        dismissListener.then(l => l.remove());
        failShowListener.then(l => l.remove());
        loadedListener.then(l => l.remove());
        failLoadListener.then(l => l.remove());
      };
      const finish = (result: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      };

      const rewardListener = AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        earned = true;
      });
      const dismissListener = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        finish(earned);
      });
      const failShowListener = AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err) => {
        console.error('[ads] rewarded ad failed to show:', err);
        finish(false);
      });
      // Prepare only resolves once the *request* is issued, not once the ad
      // has actually finished loading — must wait for the Loaded event
      // before calling showRewardVideoAd, otherwise show fires on an ad
      // that isn't ready yet and silently fails.
      const loadedListener = AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        AdMob.showRewardVideoAd().catch((e) => {
          console.error('[ads] rewarded ad show failed:', e);
          finish(false);
        });
      });
      const failLoadListener = AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
        console.error('[ads] rewarded ad failed to load:', err);
        finish(false);
      });

      AdMob.prepareRewardVideoAd({ adId: adUnitId }).catch((e) => {
        console.error('[ads] rewarded ad prepare failed:', e);
        finish(false);
      });
    });
  } catch (e) {
    console.error('[ads] showRewardedAd error:', e);
    return false;
  }
}
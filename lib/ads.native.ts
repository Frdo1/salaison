import mobileAds, { AdEventType, AdsConsent, InterstitialAd, TestIds } from 'react-native-google-mobile-ads';

import { initPremium, isNoAds, onPremiumChange } from './premium';

// Pubs de test en dev et dans les builds "preview" (EXPO_PUBLIC_ADS_TEST=1 dans eas.json).
const TEST = __DEV__ || process.env.EXPO_PUBLIC_ADS_TEST === '1';

export const BANNER_ID = TEST ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-8906338773802694/8471471550';
const INTERSTITIAL_ID = TEST ? TestIds.INTERSTITIAL : 'ca-app-pub-8906338773802694/1634600461';

// Limite : 1 interstitiel tous les 3 calculs, et au moins 3 minutes d'écart.
const EVERY_N_CALCS = 3;
const MIN_GAP_MS = 3 * 60 * 1000;

let canRequest = false;
let started = false;
let interstitial: InterstitialAd | null = null;
let loaded = false;
let calcCount = 0;
let lastShown = 0;
const listeners = new Set<(ok: boolean) => void>();

export const adsReady = () => canRequest && !isNoAds();

/** S'abonner au moment où les pubs peuvent être demandées (après consentement RGPD). */
export function onAdsReady(cb: (ok: boolean) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function loadInterstitial() {
  if (!canRequest) return;
  loaded = false;
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
  interstitial.addAdEventListener(AdEventType.LOADED, () => (loaded = true));
  interstitial.addAdEventListener(AdEventType.CLOSED, loadInterstitial);
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    loaded = false;
    setTimeout(loadInterstitial, 60 * 1000);
  });
  interstitial.load();
}

/** Formulaire de consentement RGPD (Google UMP) puis initialisation du SDK. À appeler une fois au démarrage. */
export async function initAds() {
  if (started) return;
  started = true;
  await initPremium();
  if (isNoAds()) return;
  try {
    const info = await AdsConsent.gatherConsent();
    canRequest = info.canRequestAds;
  } catch {
    // Formulaire indisponible (hors ligne…) : on se fie au dernier consentement connu.
    try {
      canRequest = (await AdsConsent.getConsentInfo()).canRequestAds;
    } catch {
      canRequest = false;
    }
  }
  if (!canRequest) return;
  try {
    await mobileAds().initialize();
  } catch {}
  listeners.forEach((cb) => cb(true));
  loadInterstitial();
}

/** À appeler après chaque calcul : affiche un interstitiel si la limite le permet. */
export function maybeShowInterstitial() {
  calcCount++;
  if (isNoAds()) return;
  if (!canRequest || !loaded || !interstitial) return;
  if (calcCount % EVERY_N_CALCS !== 0) return;
  if (Date.now() - lastShown < MIN_GAP_MS) return;
  lastShown = Date.now();
  interstitial.show().catch(() => {});
}

/** Rouvre le formulaire de choix de confidentialité (obligatoire en Europe). */
export async function openPrivacyOptions() {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch {}
}

// Achat « Sans pub » : on cache la bannière immédiatement.
onPremiumChange(() => {
  if (isNoAds()) listeners.forEach((cb) => cb(false));
});

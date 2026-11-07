// Version web : pas de publicité (le SDK Google Mobile Ads n'existe que sur Android/iOS).
export const BANNER_ID = '';
export const adsReady = () => false;
export const onAdsReady = (_cb: (ok: boolean) => void) => () => {};
export async function initAds() {}
export function maybeShowInterstitial() {}
export async function openPrivacyOptions() {}

// Version web : pas d'achat intégré, pas de pub non plus.
export const NO_ADS_SKU = 'sans_pub';
export const isNoAds = () => false;
export const noAdsPrice = () => '';
export const onPremiumChange = (_cb: () => void) => () => {};
export const initPremium = async () => {};
export type BuyResult = 'ok' | 'cancelled' | 'error';
export const buyNoAds = async (): Promise<BuyResult> => 'error';
export const restoreNoAds = async () => false;

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ErrorCode,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  Purchase,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
} from 'expo-iap';

/** Identifiant du produit intégré à créer dans la Play Console (achat unique, non consommable). */
export const NO_ADS_SKU = 'sans_pub';
const KEY = 'salaison:noads';

let noAds = false;
let price = '';
let readyPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((cb) => cb());

export const isNoAds = () => noAds;
export const noAdsPrice = () => price;

/** S'abonner aux changements (achat réussi, prix chargé). */
export function onPremiumChange(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

async function unlock() {
  if (noAds) return;
  noAds = true;
  try {
    await AsyncStorage.setItem(KEY, '1');
  } catch {}
  notify();
}

const ownsNoAds = (list: Purchase[] | null | undefined) =>
  !!list?.some((p) => p.productId === NO_ADS_SKU && (p.purchaseState === 'purchased' || p.purchaseState === 'restored'));

/** Connexion à Google Play Billing, lecture de l'achat déjà fait. Sans réseau, on garde le dernier état connu. */
export function initPremium() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    try {
      noAds = (await AsyncStorage.getItem(KEY)) === '1';
    } catch {}
    try {
      await initConnection();

      purchaseUpdatedListener(async (p) => {
        if (p.productId !== NO_ADS_SKU || p.purchaseState !== 'purchased') return;
        try {
          await finishTransaction({ purchase: p, isConsumable: false });
        } catch {}
        await unlock();
      });
      purchaseErrorListener(() => {});

      if (ownsNoAds(await getAvailablePurchases())) await unlock();

      const products = await fetchProducts({ skus: [NO_ADS_SKU], type: 'in-app' });
      const product = products?.[0];
      if (product && 'displayPrice' in product) {
        price = product.displayPrice;
        notify();
      }
    } catch {}
  })();
  return readyPromise;
}

export type BuyResult = 'ok' | 'cancelled' | 'error';

/** Ouvre la fenêtre de paiement Google Play. Le déblocage se fait dans purchaseUpdatedListener. */
export async function buyNoAds(): Promise<BuyResult> {
  try {
    await initPremium();
    await requestPurchase({ request: { android: { skus: [NO_ADS_SKU] } }, type: 'in-app' });
    return 'ok';
  } catch (e: any) {
    if (e?.code === ErrorCode.UserCancelled) return 'cancelled';
    return 'error';
  }
}

/** Restaure l'achat (nouveau téléphone, réinstallation). Renvoie true si l'achat a été retrouvé. */
export async function restoreNoAds() {
  try {
    await initPremium();
    if (ownsNoAds(await getAvailablePurchases())) {
      await unlock();
      return true;
    }
  } catch {}
  return noAds;
}

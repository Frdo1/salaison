import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { adsReady, BANNER_ID, onAdsReady } from '@/lib/ads';
import { C } from '@/lib/theme';

/** Bannière adaptative affichée au-dessus de la barre d'onglets, une fois le consentement obtenu. */
export function AdBanner() {
  const [ready, setReady] = useState(adsReady());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const off = onAdsReady(setReady);
    return () => {
      off();
    };
  }, []);

  if (!ready || failed) return null;
  return (
    <View style={{ alignItems: 'center', backgroundColor: C.white }}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

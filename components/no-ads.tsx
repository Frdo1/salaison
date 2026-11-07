import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text } from 'react-native';

import { useI18n } from '@/lib/i18n';
import { buyNoAds, isNoAds, noAdsPrice, onPremiumChange, restoreNoAds } from '@/lib/premium';
import { C } from '@/lib/theme';

/** État de l'achat « Sans pub », mis à jour en direct. */
export function useNoAds() {
  const [, setTick] = useState(0);
  useEffect(() => onPremiumChange(() => setTick((n) => n + 1)), []);
  return { noAds: isNoAds(), price: noAdsPrice(), available: Platform.OS === 'android' };
}

/** Fenêtre d'achat « Retirer les pubs » + restauration. */
export function NoAdsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { noAds, price } = useNoAds();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!visible) setMsg('');
  }, [visible]);

  useEffect(() => {
    if (noAds && visible) setMsg(t('noads_thanks'));
  }, [noAds, visible, t]);

  const buy = async () => {
    setBusy(true);
    setMsg('');
    const r = await buyNoAds();
    setBusy(false);
    if (r === 'error') setMsg(t('noads_error'));
  };

  const restore = async () => {
    setBusy(true);
    setMsg('');
    const ok = await restoreNoAds();
    setBusy(false);
    setMsg(ok ? t('noads_thanks') : t('noads_none'));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.box} onPress={() => {}}>
          <Text style={st.title}>🚫 {t('noads_title')}</Text>
          <Text style={st.text}>{t('noads_text')}</Text>

          {!noAds && (
            <Pressable style={[st.buy, busy && { opacity: 0.6 }]} onPress={buy} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={st.buyText}>{price ? t('noads_buy', { price }) : t('noads_buy_noprice')}</Text>
              )}
            </Pressable>
          )}

          {!!msg && <Text style={[st.msg, noAds && { color: C.green }]}>{msg}</Text>}

          {!noAds && (
            <Pressable onPress={restore} disabled={busy} style={{ paddingTop: 16, alignItems: 'center' }}>
              <Text style={st.link}>{t('noads_restore')}</Text>
            </Pressable>
          )}
          <Pressable onPress={onClose} style={{ paddingTop: 14, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: C.muted }}>{t('cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 28 },
  box: { backgroundColor: C.white, borderRadius: 26, padding: 24 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 12, color: C.text },
  text: { fontSize: 17, lineHeight: 24, color: C.text, textAlign: 'center', marginBottom: 20 },
  buy: { backgroundColor: C.orange, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  buyText: { color: C.white, fontSize: 19, fontWeight: '800' },
  msg: { marginTop: 14, fontSize: 16, fontWeight: '600', color: C.red, textAlign: 'center' },
  link: { fontSize: 16, color: C.orange, textDecorationLine: 'underline' },
});

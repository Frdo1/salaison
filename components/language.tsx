import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { DICTS, LANGS, useI18n } from '@/lib/i18n';
import { C } from '@/lib/theme';

export function LanguagePicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { lang, setLang, t } = useI18n();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.box} onPress={() => {}}>
          <Text style={st.title}>{t('language')}</Text>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 12 }}>
            {LANGS.map((l) => {
              const sel = l.id === lang;
              return (
                <Pressable
                  key={l.id}
                  style={[st.item, sel && st.sel]}
                  onPress={() => {
                    setLang(l.id);
                    onClose();
                  }}>
                  <Text style={[st.itemText, sel && { color: C.orange }]}>
                    {l.flag} {DICTS[l.id].lang_name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable onPress={onClose} style={{ paddingTop: 18, alignItems: 'center' }}>
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
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 18, color: C.text },
  item: { borderRadius: 14, borderWidth: 2, borderColor: '#e3e3e3', backgroundColor: '#f6f6f6', paddingVertical: 14, alignItems: 'center' },
  sel: { borderColor: C.orange, backgroundColor: C.orangeSoft },
  itemText: { fontSize: 20, fontWeight: '600', color: C.text },
});

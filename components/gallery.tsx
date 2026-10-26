import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useI18n } from '@/lib/i18n';
import { newId, Photo, useStore } from '@/lib/store';
import { C } from '@/lib/theme';

import { Sheet } from './ui';

/** Copie la photo dans le dossier de l'appli pour qu'elle ne disparaisse pas du cache. */
async function keep(uri: string) {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return uri;
  const dir = FileSystem.documentDirectory + 'photos/';
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const dest = dir + newId() + '.jpg';
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export function Gallery({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { photos, update } = useStore();
  const [viewing, setViewing] = useState<Photo | null>(null);
  const { width } = useWindowDimensions();
  const size = (width - 40 - 16) / 3;

  const add = async (camera: boolean) => {
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return Alert.alert(t('permission_denied'));
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
      const res = camera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync({ ...opts, allowsMultipleSelection: true });
      if (res.canceled) return;
      const saved: Photo[] = [];
      for (const a of res.assets) saved.push({ id: newId(), uri: await keep(a.uri), date: new Date().toISOString() });
      update((d) => ({ ...d, photos: [...saved, ...d.photos] }));
    } catch {
      Alert.alert(t('permission_denied'));
    }
  };

  const remove = (p: Photo) =>
    Alert.alert(t('delete_photo'), '', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          update((d) => ({ ...d, photos: d.photos.filter((x) => x.id !== p.id) }));
          if (p.uri.startsWith('file:')) FileSystem.deleteAsync(p.uri, { idempotent: true }).catch(() => {});
          setViewing(null);
        },
      },
    ]);

  return (
    <Sheet visible={visible} title={t('gallery_title')} onClose={onClose}>
      <View style={st.row}>
        <Pressable style={st.btn} onPress={() => add(false)}>
          <Text style={st.btnText}>{t('import')}</Text>
        </Pressable>
        <Pressable style={st.btn} onPress={() => add(true)}>
          <Text style={st.btnText}>{t('take')}</Text>
        </Pressable>
      </View>
      {photos.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 50 }}>
          <Text style={{ fontSize: 22, color: C.muted }}>{t('no_photo')}</Text>
          <Text style={{ fontSize: 15, color: '#888', marginTop: 8, textAlign: 'center' }}>{t('no_photo_hint')}</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          scrollEnabled={false}
          numColumns={3}
          keyExtractor={(p) => p.id}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ gap: 8, paddingTop: 16 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => setViewing(item)} onLongPress={() => remove(item)}>
              <Image source={{ uri: item.uri }} style={{ width: size, height: size, borderRadius: 10 }} contentFit="cover" />
            </Pressable>
          )}
        />
      )}
      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <View style={st.viewer}>
          {viewing && <Image source={{ uri: viewing.uri }} style={{ flex: 1 }} contentFit="contain" />}
          <View style={st.viewerBar}>
            <Pressable onPress={() => viewing && remove(viewing)} style={st.viewerBtn}>
              <Text style={{ color: C.white, fontSize: 17 }}>🗑 {t('delete')}</Text>
            </Pressable>
            <Pressable onPress={() => setViewing(null)} style={st.viewerBtn}>
              <Text style={{ color: C.white, fontSize: 26 }}>✕</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Sheet>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginTop: 14 },
  btn: { flex: 1, backgroundColor: C.orange, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: C.white, fontSize: 18, fontWeight: '700' },
  viewer: { flex: 1, backgroundColor: '#000' },
  viewerBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingBottom: 40 },
  viewerBtn: { padding: 10 },
});

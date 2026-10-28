import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MEATS, MeatId, METHODS, MethodId, PLACES, PlaceId } from '@/lib/calc';
import { fmtDate, useI18n } from '@/lib/i18n';
import { C, S } from '@/lib/theme';

const FOND = require('@/assets/images/fond.jpg');

/** Fond photo commun à tous les écrans, avec un voile sombre pour la lisibilité. */
export function Background({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground source={FOND} style={{ flex: 1, backgroundColor: '#1d1d1d' }} resizeMode="cover">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.shade }]} />
      {children}
    </ImageBackground>
  );
}

/** Bandeau orange des écrans Planning et Pièces. */
export function Header({ title, onAdd }: { title: string; onAdd: () => void }) {
  const { t } = useI18n();
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: C.orange }}>
      <View style={st.header}>
        <Text style={st.headerTitle} numberOfLines={2}>
          {title}
        </Text>
        <Pressable style={st.addBtn} onPress={onAdd} accessibilityRole="button">
          <Text style={st.addText}>{t('add')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function Option({
  label,
  selected,
  onPress,
  pill,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  pill?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[pill ? st.pill : st.option, selected && st.selected, style]}>
      <Text
        style={[
          st.optionText,
          pill && { fontSize: 17 },
          !pill && !label.includes(' ') && label.length > 11 && { fontSize: 13 },
          selected && { color: C.orange },
        ]}
        // Mot unique (ex. « Enfouissement ») : une seule ligne, la police réduit au lieu de couper le mot.
        numberOfLines={pill || !label.includes(' ') ? 1 : 2}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MeatPicker({ value, onChange }: { value: MeatId; onChange: (m: MeatId) => void }) {
  const { t } = useI18n();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
      {MEATS.map((m) => (
        <Option key={m} pill label={t(`meat_${m}`)} selected={value === m} onPress={() => onChange(m)} />
      ))}
    </ScrollView>
  );
}

export function MethodPicker({ value, onChange, disabled }: { value: MethodId; onChange: (m: MethodId) => void; disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <View style={[st.row, disabled && { opacity: 0.4 }]} pointerEvents={disabled ? 'none' : 'auto'}>
      {METHODS.map((m) => (
        <Option key={m} label={t(`method_${m}`)} selected={value === m} onPress={() => onChange(m)} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

export function PlacePicker({ value, onChange }: { value: PlaceId; onChange: (p: PlaceId) => void }) {
  const { t } = useI18n();
  return (
    <View style={st.row}>
      {PLACES.map((p) => (
        <Option key={p} label={t(`place_${p}`)} selected={value === p} onPress={() => onChange(p)} style={{ flex: 1 }} />
      ))}
    </View>
  );
}

export function Bullets({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((l, i) => (
        <Text key={i} style={S.line}>
          • {l}
        </Text>
      ))}
    </>
  );
}

export function KV({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <View style={st.kv}>
      <Text style={st.kvKey}>{k}</Text>
      <Text style={[st.kvVal, strong && { color: C.orange }]}>{v}</Text>
    </View>
  );
}

export function DateField({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable style={S.input} onPress={() => setOpen(true)} accessibilityRole="button">
        <Text style={{ fontSize: 18, color: C.text }}>📅 {fmtDate(value)}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value}
          mode="date"
          onChange={(e, d) => {
            setOpen(Platform.OS === 'ios');
            if (e.type === 'set' && d) onChange(d);
          }}
        />
      )}
    </>
  );
}

/** Fenêtre de saisie en bas d'écran (formulaires Ajouter). */
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Android plein écran (edge-to-edge) : la fenêtre passe sous la barre de navigation du téléphone.
  // On réserve sa hauteur en bas pour que le bouton Enregistrer reste accessible.
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent>
      <Pressable style={st.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={st.sheetWrap}>
        <View style={st.sheet}>
          <View style={st.sheetHead}>
            <Text style={st.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fermer">
              <Text style={{ fontSize: 30, color: C.muted }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 28 + insets.bottom }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <>
      <Text style={S.label}>{label}</Text>
      <TextInput placeholderTextColor="#999" style={[S.input, { backgroundColor: '#f1f1f1' }, style]} {...rest} />
    </>
  );
}

export function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={st.empty}>
      <Text style={st.emptyTitle}>{title}</Text>
      <Text style={st.emptyHint}>{hint}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 12,
  },
  headerTitle: { color: C.white, fontSize: 26, fontWeight: '800', flex: 1 },
  addBtn: { backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addText: { color: C.orange, fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  option: {
    backgroundColor: C.chip,
    borderRadius: 14,
    minHeight: 64,
    paddingHorizontal: 4,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pill: {
    backgroundColor: C.chip,
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: C.orange, backgroundColor: C.orangeSoft },
  optionText: { color: C.text, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 10 },
  kvKey: { color: C.muted, fontSize: 16, flexShrink: 1 },
  kvVal: { color: C.text, fontSize: 16, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '90%' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 18 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: C.text, flex: 1 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyTitle: { color: C.white, fontSize: 21, fontWeight: '700', textAlign: 'center' },
  emptyHint: { color: '#eee', fontSize: 15, marginTop: 6, textAlign: 'center' },
});

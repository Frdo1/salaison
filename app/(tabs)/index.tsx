import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Gallery } from '@/components/gallery';
import { LanguagePicker } from '@/components/language';
import { Background, Bullets, KV, MeatPicker, MethodPicker, PlacePicker } from '@/components/ui';
import { calculate, CalcResult, isMixedSalt, MeatId, MethodId, parseWeight, PlaceId, SALT_CONDITIONS } from '@/lib/calc';
import { useI18n } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { C, S } from '@/lib/theme';

export default function Accueil() {
  const { t, n, lang } = useI18n();
  const { photos } = useStore();
  const [meat, setMeat] = useState<MeatId>('magret');
  const [weightText, setWeightText] = useState('');
  const [method, setMethod] = useState<MethodId>('sousvide');
  const [place, setPlace] = useState<PlaceId>('frigo');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState('');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const resultsY = useRef(0);
  const mixed = isMixedSalt(meat);

  const onCalc = () => {
    const w = parseWeight(weightText);
    if (!(w >= 0.05 && w <= 20)) {
      setError(t('invalid_weight'));
      setResult(null);
      return;
    }
    setError('');
    setResult(calculate(meat, method, place, w));
    setTimeout(() => scroll.current?.scrollTo({ y: resultsY.current - 10, animated: true }), 80);
  };

  // Le résultat n'est plus valable dès qu'on change un paramètre.
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setResult(null);
  };

  const hoursText = (h: number) => {
    const base = t('hours', { n: h });
    return h >= 48 ? `${base} (${t('days_hours', { d: Math.floor(h / 24), h: h % 24 })})` : base;
  };

  return (
    <Background>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={st.topBar}>
          <Pressable style={st.topBtn} onPress={() => setGalleryOpen(true)} accessibilityLabel={t('gallery_title')}>
            <Text style={st.topText}>📷 {photos.length}</Text>
          </Pressable>
          <Pressable style={st.topBtn} onPress={() => setLangOpen(true)} accessibilityLabel={t('language')}>
            <Text style={st.topText}>🌐 {lang.toUpperCase()}</Text>
          </Pressable>
        </View>

        <ScrollView ref={scroll} contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">
          <View style={st.titleBox}>
            <Text style={st.title}>{t('app_title')}</Text>
          </View>
          <Text style={st.subtitle}>{t('app_subtitle')}</Text>

          <Text style={S.section}>{t('meat_type')}</Text>
          <MeatPicker value={meat} onChange={reset(setMeat)} />

          <Text style={S.section}>{t('weight_label')}</Text>
          <TextInput
            style={S.input}
            value={weightText}
            onChangeText={reset(setWeightText)}
            placeholder={t('weight_placeholder')}
            placeholderTextColor="#888"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={onCalc}
          />
          {!!error && <Text style={st.error}>{error}</Text>}

          {mixed ? (
            <>
              <Text style={S.section}>{t('sauc_title')}</Text>
              <View style={[S.card, S.cardAccent]}>
                <Bullets text={t('sauc_lines')} />
                <Text style={S.note}>{t('sauc_note')}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={S.section}>{t('method_label')}</Text>
              <MethodPicker value={method} onChange={reset(setMethod)} />
              <MethodInfo method={method} />
            </>
          )}

          <Text style={S.section}>{t('place_label')}</Text>
          <PlacePicker value={place} onChange={reset(setPlace)} />

          <Pressable style={[S.button, { marginTop: 22 }]} onPress={onCalc} accessibilityRole="button">
            <Text style={S.buttonText}>{t('calculate')}</Text>
          </Pressable>

          {result && (
            <View onLayout={(e) => (resultsY.current = e.nativeEvent.layout.y)}>
              <Text style={[S.section, { textAlign: 'center', fontSize: 24 }]}>{t('results')}</Text>

              <View style={[S.card, st.resultCard]}>
                <Text style={st.resultTitle}>{t('salting')}</Text>
                {result.mixedSalt ? (
                  <Text style={S.line}>{t('no_salting')}</Text>
                ) : (
                  <>
                    <KV k={t('duration')} v={hoursText(result.saltHours)} strong />
                    <KV k={t('temperature')} v={SALT_CONDITIONS.temp} />
                    <KV
                      k={t('conditions')}
                      v={t(result.method === 'enfouissement' ? 'cond_enf' : result.method === 'sousvide' ? 'cond_sv' : 'cond_br')}
                    />
                    {result.method === 'sousvide' && <SousVideSteps hours={result.saltHours} />}
                  </>
                )}
                <Text style={[st.resultTitle, { fontSize: 16, marginTop: 12 }]}>{t('quantities')}</Text>
                {result.ingredients.map((i) => (
                  <KV
                    key={i.key}
                    k={t(`ing_${i.key}`)}
                    v={i.liters != null ? `${n(i.liters)} L` : `${i.grams} g`}
                  />
                ))}
              </View>

              <View style={[S.card, st.resultCard]}>
                <Text style={st.resultTitle}>{t('drying')}</Text>
                <KV k={t('duration')} v={t('weeks', { n: n(result.dryWeeks) })} strong />
                <KV k={t('temperature')} v={result.dryTemp} />
                <KV k={t('humidity')} v={result.dryHumidity} />
                <KV
                  k={t('expected_loss')}
                  v={`${Math.round(result.lossMin * 100)} – ${Math.round(result.lossMax * 100)} %`}
                />
                <Text style={S.strong}>
                  ⚖️ {t('ready_at', { min: result.targetMinG, max: result.targetMaxG })}
                </Text>
                <Text style={S.note}>{t('ready_hint')}</Text>
              </View>

              <View style={st.totalBox}>
                <Text style={st.totalLabel}>{t('total')}</Text>
                <Text style={st.totalValue}>
                  {result.mixedSalt ? '' : `${t('hours', { n: result.saltHours })} + `}
                  {t('weeks', { n: n(result.dryWeeks) })}
                </Text>
                <Text style={st.totalSub}>{t('approx_weeks', { n: n(result.totalWeeks) })}</Text>
              </View>

              <Pressable
                style={[S.button, { backgroundColor: C.white, marginTop: 14 }]}
                onPress={() =>
                  router.navigate({
                    pathname: '/planning',
                    params: { meat: result.meat, method: result.method, place: result.place, weight: String(result.weightKg) },
                  })
                }>
                <Text style={[S.buttonText, { color: C.orange }]}>📅 {t('add_to_planning')}</Text>
              </Pressable>

              <Text style={[S.note, { color: '#eee', textAlign: 'center' }]}>{t('safety')}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <Gallery visible={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <LanguagePicker visible={langOpen} onClose={() => setLangOpen(false)} />
    </Background>
  );
}

function MethodInfo({ method }: { method: MethodId }) {
  const { t } = useI18n();
  if (method === 'enfouissement')
    return (
      <>
        <Text style={S.section}>{t('enf_title')}</Text>
        <View style={[S.card, S.cardAccent]}>
          <Text style={S.cardTitle}>{t('enf_sub')}</Text>
          <Bullets text={t('enf_lines')} />
          <Text style={S.strong}>{t('enf_qty')}</Text>
          <Text style={[S.cardTitle, { marginTop: 14 }]}>{t('technique')}</Text>
          <Bullets text={t('enf_tech')} />
          <Text style={S.note}>{t('enf_note')}</Text>
        </View>
      </>
    );
  if (method === 'sousvide')
    return (
      <>
        <Text style={S.section}>{t('sv_title')}</Text>
        <View style={[S.card, S.cardAccent]}>
          <Text style={S.cardTitle}>{t('sv_sub')}</Text>
          <Bullets text={t('sv_lines')} />
          <Text style={S.strong}>{t('sv_total')}</Text>
          <Text style={[S.cardTitle, { marginTop: 14 }]}>{t('sv_proto_title')}</Text>
          <Bullets text={t('sv_proto')} />
          <Text style={S.note}>{t('sv_note')}</Text>
        </View>
      </>
    );
  return (
    <>
      <Text style={S.section}>{t('br_title')}</Text>
      <View style={[S.card, S.cardAccent]}>
        <Text style={S.cardTitle}>{t('br_sub')}</Text>
        <Bullets text={t('br_lines')} />
        <Text style={[S.cardTitle, { marginTop: 14 }]}>{t('variants')}</Text>
        <Bullets text={t('br_variants')} />
        <Text style={S.note}>{t('br_note')}</Text>
      </View>
    </>
  );
}

/** Protocole 4-2-1 appliqué à la durée calculée (4/7, 2/7, 1/7 du temps). */
function SousVideSteps({ hours }: { hours: number }) {
  const { t } = useI18n();
  const a = Math.round((hours * 4) / 7);
  const b = Math.round((hours * 2) / 7);
  const c = hours - a - b;
  return (
    <View style={{ marginTop: 6 }}>
      {[
        [a, '4 °C'],
        [b, '2 °C'],
        [c, '1 °C'],
      ].map(([h, temp]) => (
        <Text key={temp} style={S.line}>
          • {t('hours', { n: h })} → {temp}
        </Text>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  topBtn: { backgroundColor: 'rgba(245,245,245,0.92)', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10 },
  topText: { fontSize: 18, fontWeight: '700', color: C.text },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  titleBox: {
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,87,51,0.7)',
    borderRadius: 20,
    paddingVertical: 18,
    backgroundColor: 'rgba(255,87,51,0.12)',
  },
  title: {
    color: C.white,
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(255,87,51,0.9)',
    textShadowRadius: 12,
  },
  subtitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  error: { color: '#FFD2C7', fontSize: 15, fontWeight: '700', marginTop: 8 },
  resultCard: { borderLeftWidth: 5, borderLeftColor: C.orange },
  resultTitle: { color: C.orange, fontSize: 21, fontWeight: '800', marginBottom: 8 },
  totalBox: { backgroundColor: C.orange, borderRadius: 18, padding: 20, alignItems: 'center' },
  totalLabel: { color: C.white, fontSize: 19, fontWeight: '700' },
  totalValue: { color: C.white, fontSize: 24, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  totalSub: { color: C.white, fontSize: 17, marginTop: 4 },
});

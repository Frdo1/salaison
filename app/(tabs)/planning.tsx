import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Background, DateField, Empty, Field, Header, KV, MeatPicker, MethodPicker, PlacePicker, Sheet } from '@/components/ui';
import { calculate, currentLoss, isMixedSalt, MeatId, MEATS, MethodId, METHODS, parseWeight, PlaceId, PLACES, scheduleDates } from '@/lib/calc';
import { fmtDate, useI18n } from '@/lib/i18n';
import { cancel, scheduleAt } from '@/lib/notify';
import { newId, PlanEntry, useStore } from '@/lib/store';
import { C, S } from '@/lib/theme';

type Status = 'salting' | 'drying' | 'done';

function statusOf(e: PlanEntry, now = Date.now()): Status {
  if (now < new Date(e.saltEnd).getTime()) return 'salting';
  if (now < new Date(e.dryEnd).getTime()) return 'drying';
  return 'done';
}

const STATUS_COLOR: Record<Status, string> = { salting: C.blue, drying: C.amber, done: C.green };

export default function Planning() {
  const { t } = useI18n();
  const { plan, update } = useStore();
  const params = useLocalSearchParams<{ meat?: string; method?: string; place?: string; weight?: string }>();
  const [formOpen, setFormOpen] = useState(false);
  const [weighing, setWeighing] = useState<PlanEntry | null>(null);

  // Arrivée depuis le bouton « Ajouter au planning » de l'accueil.
  useEffect(() => {
    if (params.meat) setFormOpen(true);
  }, [params.meat, params.weight]);

  const closeForm = () => {
    setFormOpen(false);
    if (params.meat) router.setParams({ meat: undefined, method: undefined, place: undefined, weight: undefined });
  };

  const remove = (e: PlanEntry) =>
    Alert.alert(t('delete_confirm', { name: e.name }), '', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          cancel(e.notifIds);
          update((d) => ({ ...d, plan: d.plan.filter((x) => x.id !== e.id) }));
        },
      },
    ]);

  const toPieces = (e: PlanEntry) => {
    const last = e.weighings[e.weighings.length - 1];
    update((d) => ({
      ...d,
      plan: d.plan.filter((x) => x.id !== e.id),
      pieces: [
        { id: newId(), name: e.name, meat: e.meat, weightKg: last ? last.kg : null, date: new Date().toISOString(), notes: '' },
        ...d.pieces,
      ],
    }));
    cancel(e.notifIds);
    router.navigate('/pieces');
  };

  const sorted = [...plan].sort((a, b) => a.dryEnd.localeCompare(b.dryEnd));

  return (
    <View style={{ flex: 1 }}>
      <Header title={t('planning_title')} onAdd={() => setFormOpen(true)} />
      <Background>
        <FlatList
          data={sorted}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Empty title={t('empty_planning')} hint={t('empty_planning_hint')} />}
          renderItem={({ item }) => (
            <EntryCard entry={item} onDelete={() => remove(item)} onWeigh={() => setWeighing(item)} onStore={() => toPieces(item)} />
          )}
        />
      </Background>

      {formOpen && (
        <EntryForm
          onClose={closeForm}
          initial={{
            meat: MEATS.includes(params.meat as MeatId) ? (params.meat as MeatId) : undefined,
            method: METHODS.includes(params.method as MethodId) ? (params.method as MethodId) : undefined,
            place: PLACES.includes(params.place as PlaceId) ? (params.place as PlaceId) : undefined,
            weight: params.weight,
          }}
        />
      )}
      <WeighSheet entry={weighing} onClose={() => setWeighing(null)} />
    </View>
  );
}

function EntryCard({ entry, onDelete, onWeigh, onStore }: { entry: PlanEntry; onDelete: () => void; onWeigh: () => void; onStore: () => void }) {
  const { t, n } = useI18n();
  const status = statusOf(entry);
  const last = entry.weighings[entry.weighings.length - 1];
  const loss = last ? currentLoss(entry.weightKg, last.kg) : NaN;
  const reached = Number.isFinite(loss) && loss >= entry.lossMin;
  const mixed = isMixedSalt(entry.meat);

  return (
    <View style={[S.card, { padding: 20 }]}>
      <View style={st.cardHead}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <Text style={st.name}>{entry.name}</Text>
            <View style={[st.badge, { backgroundColor: STATUS_COLOR[status] }]}>
              <Text style={st.badgeText}>{t(`status_${status}`)}</Text>
            </View>
          </View>
          {entry.name !== t(`meat_${entry.meat}`) && <Text style={st.sub}>{t(`meat_${entry.meat}`)}</Text>}
        </View>
        <Pressable onPress={onDelete} hitSlop={10} accessibilityLabel={t('delete')}>
          <Text style={{ fontSize: 30, color: C.red }}>✕</Text>
        </Pressable>
      </View>

      <View style={st.sep} />
      <KV k={t('weight')} v={`${n(entry.weightKg, 3)} kg`} />
      {!mixed && <KV k={t('method')} v={t(`method_${entry.method}`)} />}
      <KV k={t('place')} v={t(`place_${entry.place}`)} />

      <View style={st.sep} />
      <Text style={st.datesTitle}>{t('important_dates')}</Text>
      {!mixed && <KV k={t('salt_end')} v={fmtDate(new Date(entry.saltEnd))} />}
      <KV k={t('dry_end')} v={fmtDate(new Date(entry.dryEnd))} />
      <Text style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>
        🔔 {t(entry.notifIds.length ? 'reminders_on' : 'reminders_off')}
      </Text>

      {last && (
        <>
          <View style={st.sep} />
          <KV k={t('last_weighing')} v={`${n(last.kg, 3)} kg · ${fmtDate(new Date(last.date))}`} />
          <Text style={[S.line, { marginTop: 4, color: reached ? C.green : C.text, fontWeight: '600' }]}>
            {t('loss_now', {
              p: n(Math.max(0, loss) * 100),
              min: Math.round(entry.lossMin * 100),
              max: Math.round(entry.lossMax * 100),
            })}
          </Text>
          {reached && <Text style={[S.line, { color: C.green, fontWeight: '800' }]}>✅ {t('target_reached')}</Text>}
        </>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Pressable style={[st.action, { backgroundColor: C.orange }]} onPress={onWeigh}>
          <Text style={st.actionText}>⚖️ {t('weigh')}</Text>
        </Pressable>
        {(status === 'done' || reached) && (
          <Pressable style={[st.action, { backgroundColor: C.green }]} onPress={onStore}>
            <Text style={st.actionText}>{t('to_pieces')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function EntryForm({
  onClose,
  initial,
}: {
  onClose: () => void;
  initial: { meat?: MeatId; method?: MethodId; place?: PlaceId; weight?: string };
}) {
  const { t, n } = useI18n();
  const { update } = useStore();
  const [name, setName] = useState('');
  const [meat, setMeat] = useState<MeatId>(initial.meat ?? 'magret');
  const [method, setMethod] = useState<MethodId>(initial.method ?? 'enfouissement');
  const [place, setPlace] = useState<PlaceId>(initial.place ?? 'frigo');
  const [weight, setWeight] = useState(initial.weight ? n(Number(initial.weight), 3) : '');
  const [start, setStart] = useState(new Date());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const w = parseWeight(weight);
    if (!(w >= 0.05 && w <= 20)) return setError(t('invalid_weight'));
    setSaving(true);
    const r = calculate(meat, method, place, w);
    const { saltEnd, dryEnd } = scheduleDates(start, r);
    const label = name.trim() || t(`meat_${meat}`);
    const ids = [
      r.mixedSalt ? null : await scheduleAt(saltEnd, t('reminder_salt_title', { name: label }), t('reminder_salt_body')),
      await scheduleAt(dryEnd, t('reminder_dry_title', { name: label }), t('reminder_dry_body')),
    ].filter((x): x is string => !!x);
    const entry: PlanEntry = {
      id: newId(),
      name: label,
      meat,
      method: r.method,
      place,
      weightKg: w,
      start: start.toISOString(),
      saltEnd: saltEnd.toISOString(),
      dryEnd: dryEnd.toISOString(),
      lossMin: r.lossMin,
      lossMax: r.lossMax,
      weighings: [],
      notifIds: ids,
    };
    update((d) => ({ ...d, plan: [entry, ...d.plan] }));
    onClose();
  };

  return (
    <Sheet visible title={t('new_entry')} onClose={onClose}>
      <Field label={t('name')} value={name} onChangeText={setName} placeholder={t('name_placeholder')} />
      <Text style={S.label}>{t('meat_type')}</Text>
      <MeatPicker value={meat} onChange={setMeat} />
      <Field label={t('weight_label')} value={weight} onChangeText={setWeight} placeholder={t('weight_placeholder')} keyboardType="decimal-pad" />
      {!isMixedSalt(meat) && (
        <>
          <Text style={S.label}>{t('method_label')}</Text>
          <MethodPicker value={method} onChange={setMethod} />
        </>
      )}
      <Text style={S.label}>{t('place_label')}</Text>
      <PlacePicker value={place} onChange={setPlace} />
      <Text style={S.label}>{t('start_date')}</Text>
      <DateField value={start} onChange={setStart} />
      {!!error && <Text style={{ color: C.red, marginTop: 10, fontWeight: '600' }}>{error}</Text>}
      <Pressable style={[S.button, { marginTop: 22, opacity: saving ? 0.6 : 1 }]} onPress={save} disabled={saving}>
        <Text style={S.buttonText}>{t('save')}</Text>
      </Pressable>
    </Sheet>
  );
}

function WeighSheet({ entry, onClose }: { entry: PlanEntry | null; onClose: () => void }) {
  const { t } = useI18n();
  const { update } = useStore();
  const [kg, setKg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setKg('');
    setError('');
  }, [entry?.id]);

  const save = () => {
    if (!entry) return;
    const v = parseWeight(kg);
    if (!(v > 0 && v <= entry.weightKg * 1.2)) return setError(t('invalid_weight'));
    update((d) => ({
      ...d,
      plan: d.plan.map((x) => (x.id === entry.id ? { ...x, weighings: [...x.weighings, { date: new Date().toISOString(), kg: v }] } : x)),
    }));
    onClose();
  };

  return (
    <Sheet visible={!!entry} title={t('weigh_title')} onClose={onClose}>
      <Field label={entry?.name ?? ''} value={kg} onChangeText={setKg} placeholder={t('weight_placeholder')} keyboardType="decimal-pad" autoFocus />
      {!!error && <Text style={{ color: C.red, marginTop: 10, fontWeight: '600' }}>{error}</Text>}
      <Pressable style={[S.button, { marginTop: 22 }]} onPress={save}>
        <Text style={S.buttonText}>{t('save')}</Text>
      </Pressable>
    </Sheet>
  );
}

const st = StyleSheet.create({
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { fontSize: 26, fontWeight: '800', color: C.text },
  sub: { fontSize: 17, color: C.muted, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  badgeText: { color: C.white, fontWeight: '700', fontSize: 15 },
  sep: { height: 1, backgroundColor: '#ddd', marginVertical: 12 },
  datesTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4 },
  action: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: C.white, fontWeight: '700', fontSize: 16, textAlign: 'center' },
});

import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';

import { Background, DateField, Empty, Field, Header, KV, MeatPicker, Sheet } from '@/components/ui';
import { MeatId, parseWeight } from '@/lib/calc';
import { fmtDate, useI18n } from '@/lib/i18n';
import { newId, Piece, useStore } from '@/lib/store';
import { C, S } from '@/lib/theme';

export default function Pieces() {
  const { t, n } = useI18n();
  const { pieces, update } = useStore();
  const [open, setOpen] = useState(false);

  const remove = (p: Piece) =>
    Alert.alert(t('delete_confirm', { name: p.name }), '', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => update((d) => ({ ...d, pieces: d.pieces.filter((x) => x.id !== p.id) })) },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <Header title={t('pieces_title')} onAdd={() => setOpen(true)} />
      <Background>
        <FlatList
          data={pieces}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Empty title={t('empty_pieces')} hint={t('empty_pieces_hint')} />}
          renderItem={({ item }) => (
            <View style={[S.card, { padding: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: C.text }}>{item.name}</Text>
                  <Text style={{ fontSize: 16, color: C.muted }}>{t(`meat_${item.meat}`)}</Text>
                </View>
                <Pressable onPress={() => remove(item)} hitSlop={10} accessibilityLabel={t('delete')}>
                  <Text style={{ fontSize: 28, color: C.red }}>✕</Text>
                </Pressable>
              </View>
              <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 10 }} />
              {item.weightKg != null && <KV k={t('weight')} v={`${n(item.weightKg, 3)} kg`} />}
              <KV k={t('date_label')} v={fmtDate(new Date(item.date))} />
              {!!item.notes && <Text style={[S.line, { marginTop: 8 }]}>{item.notes}</Text>}
            </View>
          )}
        />
      </Background>
      {open && <PieceForm onClose={() => setOpen(false)} />}
    </View>
  );
}

function PieceForm({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { update } = useStore();
  const [name, setName] = useState('');
  const [meat, setMeat] = useState<MeatId>('magret');
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState('');

  const save = () => {
    const w = parseWeight(weight);
    update((d) => ({
      ...d,
      pieces: [
        {
          id: newId(),
          name: name.trim() || t(`meat_${meat}`),
          meat,
          weightKg: Number.isFinite(w) && w > 0 ? w : null,
          date: date.toISOString(),
          notes: notes.trim(),
        },
        ...d.pieces,
      ],
    }));
    onClose();
  };

  return (
    <Sheet visible title={t('new_piece')} onClose={onClose}>
      <Field label={t('name')} value={name} onChangeText={setName} placeholder={t('name_placeholder')} />
      <Text style={S.label}>{t('meat_type')}</Text>
      <MeatPicker value={meat} onChange={setMeat} />
      <Field label={t('final_weight')} value={weight} onChangeText={setWeight} placeholder={t('weight_placeholder')} keyboardType="decimal-pad" />
      <Text style={S.label}>{t('date_label')}</Text>
      <DateField value={date} onChange={setDate} />
      <Field
        label={t('notes')}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('notes_placeholder')}
        multiline
        style={{ minHeight: 90, textAlignVertical: 'top' }}
      />
      <Pressable style={[S.button, { marginTop: 22 }]} onPress={save}>
        <Text style={S.buttonText}>{t('save')}</Text>
      </Pressable>
    </Sheet>
  );
}

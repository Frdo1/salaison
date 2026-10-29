import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { MeatId, MethodId, PlaceId } from './calc';
import { DICTS, I18nContext, Lang, fmtNum, translate } from './i18n';

export type Weighing = { date: string; kg: number };

export type PlanEntry = {
  id: string;
  name: string;
  meat: MeatId;
  method: MethodId;
  place: PlaceId;
  weightKg: number;
  start: string;
  saltEnd: string;
  dryEnd: string;
  lossMin: number;
  lossMax: number;
  weighings: Weighing[];
  notifIds: string[];
  /** Événements de l'agenda du téléphone (absent = pas encore tenté). */
  calEventIds?: string[];
};

export type Piece = {
  id: string;
  name: string;
  meat: MeatId;
  weightKg: number | null;
  date: string;
  notes: string;
};

export type Photo = { id: string; uri: string; date: string };

type Data = { lang: Lang; plan: PlanEntry[]; pieces: Piece[]; photos: Photo[] };

const KEY = 'salaison:v1';
const EMPTY: Data = { lang: 'fr', plan: [], pieces: [], photos: [] };

type Store = Data & {
  ready: boolean;
  update: (fn: (d: Data) => Data) => void;
};

const StoreContext = createContext<Store>({ ...EMPTY, ready: false, update: () => {} });

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Data>;
          setData({ ...EMPTY, ...parsed, lang: parsed.lang && DICTS[parsed.lang] ? parsed.lang : 'fr' });
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (d: Data) => Data) => {
    setData((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const store = useMemo(() => ({ ...data, ready, update }), [data, ready, update]);

  const i18n = useMemo(
    () => ({
      lang: data.lang,
      setLang: (lang: Lang) => update((d) => ({ ...d, lang })),
      t: (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(data.lang, k, v),
      n: (x: number, digits?: number) => fmtNum(data.lang, x, digits),
    }),
    [data.lang, update],
  );

  return (
    <StoreContext.Provider value={store}>
      <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);

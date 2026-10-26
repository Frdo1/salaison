// Moteur de calcul de la Calculatrice Salaison.
//
// Formules reprises de la v1.0 (retrouvées à partir des résultats affichés),
// avec les corrections suivantes :
//  - perte de poids : la v1.0 affichait 0,5 % x semaines (faux) ; on vise
//    maintenant 30 à 40 % du poids frais selon la viande, avec poids cible ;
//  - températures de séchage : frigo 3-6 °C, cave à vin 10-14 °C ;
//  - saumure : plus longue que l'enfouissement à sec (la v1.0 donnait la même durée) ;
//  - quantités de sel / mélange SSV / eau calculées pour le poids saisi.

export type MeatId =
  | 'magret'
  | 'filet_mignon'
  | 'jambon'
  | 'saucisson'
  | 'coppa'
  | 'bresaola'
  | 'lomo'
  | 'autre';

export type MethodId = 'enfouissement' | 'sousvide' | 'saumure';
export type PlaceId = 'frigo' | 'cave';

export const MEATS: MeatId[] = [
  'magret',
  'filet_mignon',
  'jambon',
  'saucisson',
  'coppa',
  'bresaola',
  'lomo',
  'autre',
];
export const METHODS: MethodId[] = ['enfouissement', 'sousvide', 'saumure'];
export const PLACES: PlaceId[] = ['frigo', 'cave'];

type MeatProfile = {
  /** Enfouissement : heures = coef x poids^exposant (poids en kg) */
  saltCoef: number;
  saltExp: number;
  /** Minimum d'heures de salage à sec */
  saltMin: number;
  /** Sous vide : heures = (svBase + svPerKg x poids) */
  svBase: number;
  svPerKg: number;
  /** Séchage au frigo : semaines = dryBase + dryPerKg x poids */
  dryBase: number;
  dryPerKg: number;
  /** Perte de poids visée (fraction du poids frais) */
  lossMin: number;
  lossMax: number;
  /** Le saucisson n'est pas salé par enfouissement : sel incorporé à la mêlée */
  mixedSalt?: boolean;
};

// Magret : valeurs exactes de la v1.0 (25 h x racine du poids, 24 + 144 h/kg sous vide,
// 0,5 + 2 semaines/kg de séchage). Les autres pièces : repères usuels en charcuterie
// maison (pièces plus épaisses = salage proportionnel au poids, séchage plus long).
const PROFILES: Record<MeatId, MeatProfile> = {
  magret: { saltCoef: 25, saltExp: 0.5, saltMin: 12, svBase: 24, svPerKg: 144, dryBase: 0.5, dryPerKg: 2, lossMin: 0.3, lossMax: 0.35 },
  filet_mignon: { saltCoef: 30, saltExp: 0.5, saltMin: 12, svBase: 24, svPerKg: 144, dryBase: 1, dryPerKg: 2, lossMin: 0.3, lossMax: 0.35 },
  jambon: { saltCoef: 24, saltExp: 1, saltMin: 48, svBase: 48, svPerKg: 120, dryBase: 8, dryPerKg: 4, lossMin: 0.3, lossMax: 0.35 },
  saucisson: { saltCoef: 0, saltExp: 1, saltMin: 0, svBase: 0, svPerKg: 0, dryBase: 3, dryPerKg: 1, lossMin: 0.35, lossMax: 0.4, mixedSalt: true },
  coppa: { saltCoef: 24, saltExp: 1, saltMin: 24, svBase: 48, svPerKg: 168, dryBase: 6, dryPerKg: 4, lossMin: 0.3, lossMax: 0.35 },
  bresaola: { saltCoef: 24, saltExp: 1, saltMin: 24, svBase: 48, svPerKg: 168, dryBase: 3, dryPerKg: 3, lossMin: 0.35, lossMax: 0.4 },
  lomo: { saltCoef: 18, saltExp: 1, saltMin: 18, svBase: 48, svPerKg: 144, dryBase: 4, dryPerKg: 3, lossMin: 0.3, lossMax: 0.35 },
  autre: { saltCoef: 25, saltExp: 0.5, saltMin: 12, svBase: 24, svPerKg: 144, dryBase: 0.5, dryPerKg: 2, lossMin: 0.3, lossMax: 0.35 },
};

/** Saumure : la viande se sale plus lentement qu'enfouie dans le sel sec. */
const BRINE_FACTOR = 2;
/** Cave à vin : plus humide, séchage un peu plus long qu'au frigo (v1.0 : 1,5 -> 2 sem). */
const CAVE_FACTOR = 4 / 3;

export const DRY_CONDITIONS: Record<PlaceId, { temp: string; humidity: string }> = {
  frigo: { temp: '3-6 °C', humidity: '60-70 %' },
  cave: { temp: '10-14 °C', humidity: '70-80 %' },
};

export const SALT_CONDITIONS = { temp: '≤ 3 °C' };

export type Ingredient = { key: 'salt' | 'sugar' | 'spices' | 'water' | 'curedSalt'; grams?: number; liters?: number };

export type CalcResult = {
  meat: MeatId;
  method: MethodId;
  place: PlaceId;
  weightKg: number;
  /** 0 pour le saucisson (sel incorporé) */
  saltHours: number;
  dryWeeks: number;
  dryTemp: string;
  dryHumidity: string;
  lossMin: number;
  lossMax: number;
  /** Poids auquel la pièce est prête (fourchette, en grammes) */
  targetMinG: number;
  targetMaxG: number;
  ingredients: Ingredient[];
  totalWeeks: number;
  mixedSalt: boolean;
};

const roundHalf = (n: number) => Math.round(n * 2) / 2;

/** Accepte "0,5" comme "0.5". Retourne NaN si invalide. */
export function parseWeight(text: string): number {
  const n = parseFloat(String(text).replace(',', '.').trim());
  return Number.isFinite(n) ? n : NaN;
}

export function calculate(meat: MeatId, method: MethodId, place: PlaceId, weightKg: number): CalcResult {
  const p = PROFILES[meat];
  const w = weightKg;
  const ingredients: Ingredient[] = [];

  let saltHours = 0;
  if (p.mixedSalt) {
    // Saucisson : 25-28 g de sel nitrité par kg de mêlée, pas de phase de salage.
    ingredients.push({ key: 'curedSalt', grams: Math.round(w * 27) });
  } else if (method === 'enfouissement') {
    saltHours = Math.max(p.saltMin, Math.round(p.saltCoef * Math.pow(w, p.saltExp)));
    // 1 à 1,5 kg de sel par kg de viande : on affiche le haut de fourchette, minimum 500 g.
    ingredients.push({ key: 'salt', grams: Math.max(500, Math.round(w * 1500)) });
  } else if (method === 'sousvide') {
    saltHours = Math.round(p.svBase + p.svPerKg * w);
    // Mélange SSV 4-2-1 : 70 g/kg -> 40 g sel, 20 g sucre, 10 g épices par kg.
    ingredients.push(
      { key: 'salt', grams: Math.round(w * 40) },
      { key: 'sugar', grams: Math.round(w * 20) },
      { key: 'spices', grams: Math.round(w * 10) },
    );
  } else {
    const dry = Math.max(p.saltMin, Math.round(p.saltCoef * Math.pow(w, p.saltExp)));
    saltHours = Math.round(dry * BRINE_FACTOR);
    // 1 L d'eau par kg (au moins 1 L pour bien immerger), 70 g de sel par litre.
    const liters = Math.max(1, Math.ceil(w * 2) / 2);
    ingredients.push({ key: 'water', liters }, { key: 'salt', grams: Math.round(liters * 70) });
  }

  let dryWeeks = p.dryBase + p.dryPerKg * w;
  if (place === 'cave') dryWeeks *= CAVE_FACTOR;
  dryWeeks = Math.max(1, roundHalf(dryWeeks));

  const grams = w * 1000;
  return {
    meat,
    method: p.mixedSalt ? 'enfouissement' : method,
    place,
    weightKg: w,
    saltHours,
    dryWeeks,
    dryTemp: DRY_CONDITIONS[place].temp,
    dryHumidity: DRY_CONDITIONS[place].humidity,
    lossMin: p.lossMin,
    lossMax: p.lossMax,
    targetMinG: Math.round(grams * (1 - p.lossMax)),
    targetMaxG: Math.round(grams * (1 - p.lossMin)),
    ingredients,
    totalWeeks: Math.round((saltHours / 168 + dryWeeks) * 10) / 10,
    mixedSalt: !!p.mixedSalt,
  };
}

export function isMixedSalt(meat: MeatId) {
  return !!PROFILES[meat].mixedSalt;
}

/** Dates de fin de salage et de séchage à partir d'une date de début. */
export function scheduleDates(start: Date, r: Pick<CalcResult, 'saltHours' | 'dryWeeks'>) {
  const saltEnd = new Date(start.getTime() + r.saltHours * 3600_000);
  const dryEnd = new Date(saltEnd.getTime() + r.dryWeeks * 7 * 86400_000);
  return { saltEnd, dryEnd };
}

/** Perte de poids actuelle (fraction) d'après une pesée. */
export function currentLoss(initialKg: number, currentKg: number) {
  if (!(initialKg > 0) || !(currentKg > 0)) return NaN;
  return 1 - currentKg / initialKg;
}

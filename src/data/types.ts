export type Side = "kk" | "dj" | "ru" | "civ";

export type MarkerKind =
  | "battle"      // шайқас
  | "fallen"      // қала/бекініз құлауы
  | "curultai"    // құрылтай / жиын
  | "city"        // тарихи қала / қоныс
  | "fort"        // бекініс
  | "camp"        // орда / қон
  | "memorial"    // жер-атауы (халық есінде)
  | "gate";       // қақпа / асу

export type Certainty = "confirmed" | "approximate" | "debated";

export interface Place {
  id: string;
  kk: string;            // қазақша атауы
  alt?: string;          // екінші / тарихи атауы
  kind: MarkerKind;
  side?: Side;
  loc: [number, number];  // [lon, lat] — координаттар нақты географиялық нүктелер немесе талдау
  certainty: Certainty;
  spanKm?: number;       // белгісіздік шеңберінің радиусы (км)
  note?: string;         // қысқаша дәйек
}

export type RouteKind = "raid" | "attack" | "retreat" | "flight" | "convergence" | "diplomacy" | "march";

export interface Route {
  id: string;
  side: Side;
  kind: RouteKind;
  label: string;
  /** Осы қимылдың қысқа қазақша түсіндірмесі — анимациямен бірге көрсетіледі */
  caption: string;
  pts: [number, number][];
  certainty: Certainty;
  phase: number;          // реттік кезең (0..N-1); бір кезеңдегі бағыттар қатар жүреді
  note?: string;
}

export interface EventPlaceRef {
  id: string;
  appearAt: number;       // осы кезеңде көрінеді (0-бастан)
  role?: string;          // маркердің қосымша рөлдік белгісі
  pulse?: boolean;
}

export interface HistoricalEvent {
  id: string;
  year: number;           // сұрыптау үшін (бастапқы жылы)
  yearLabel: string;      // көрнекі жыл жазуы
  era: string;            // "XVII ғ." / "XVIII ғ. басы" ...
  title: string;
  short: string;          // таймлайн жолағына арналған қысқа атау
  subtitle: string;
  narrative: string[];    // ақпарат тақтасының мәтіні (абзацтар)
  outcome: { tone: "win" | "loss" | "tragedy" | "politics" | "context"; text: string };
  phases: number;          // кезең саны (маркер+бағыт кестесі үшін)
  places: EventPlaceRef[];
  routes: Route[];
  figureIds: string[];
  sourceIds: string[];
  uncertainty: string;     // нақтысыздық туралы ескертпе
}

export interface Figure {
  id: string;
  name: string;
  side: "kk" | "dj" | "ru" | "other";
  role: string;
  lifeLabel: string;        // "шамамен ..." деген белгілермен
  certainty: Certainty;
  bio: string[];
  events: string[];         // байланысты оқиғалардың id-лері
}

export interface SourceRec {
  id: string;
  title: string;
  cite: string;
  url?: string;
  kind: "book" | "article" | "wiki" | "data" | "code";
  note?: string;
}

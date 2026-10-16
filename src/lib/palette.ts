import type { Side } from "../data/types";

/** Бір палитра — CSS пен карта қабаттары үшін */
export const C = {
  void: "#0a1116",
  voidDeep: "#070d11",
  gold: "#d2a755",
  goldBright: "#f0cf8a",
  goldDim: "#8a743f",
  sand: "#e7dcc3",
  textMap: "#aebfca",
  textRegion: "#71858f",
  land: "#0f1a1a",
  landKz: "#12211a",
  border: "#3d5259",
  water: "#0c1c27",
  river: "#35596b",
  ridge: "#6d5a38",
  kk: "#ffd23e",
  dj: "#c81e3c",
  civ: "#6fd3c0",
  ru: "#8fb4dd",
} as const;

export const SIDE_LABEL: Record<Side, string> = {
  kk: "Қазақ жасақтары",
  dj: "Жоңғар (ойрат) қолы",
  civ: "Бейіл қозғалыс · қоныс · елшілік",
  ru: "Ресей бекіністері сызығы",
};

export const SIDE_COLOR: Record<Side, string> = {
  kk: C.kk,
  dj: C.dj,
  civ: C.civ,
  ru: C.ru,
};

export const ROUTE_KIND_LABEL: Record<string, string> = {
  raid: "шапқыншылық жорығы",
  attack: "соққы / шайқас",
  retreat: "шегіну",
  flight: "халық көші (қашқын)",
  convergence: "қол жиналу / бас қосу",
  diplomacy: "елшілік жолы",
  march: "жорық қозғалысы",
};

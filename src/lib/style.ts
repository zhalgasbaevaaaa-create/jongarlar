import type { StyleSpecification } from "maplibre-gl";
import { C } from "./palette";

const BASE = import.meta.env.BASE_URL || "/";

/**
│ Базалық «тарихи атлас» стилі — толығымен офлайн жұмыс істейді:
 * жер-су сызықтары Natural Earth (public domain) үзінділерінен.
 * Желіде болса, қараңғы CARTO тайлдары overlay ретінде қосылады (MapCanvas-та).
 */
export function buildAtlasStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: `${BASE}glyphs/{fontstack}/{range}.pbf`,
    sources: {
      countries: { type: "geojson", data: `${BASE}data/countries.geojson` },
      lakes: { type: "geojson", data: `${BASE}data/lakes.geojson` },
      geo: { type: "geojson", data: emptyFC() },
      "routes-ghost": { type: "geojson", data: emptyFC() },
      "routes-live": { type: "geojson", data: emptyFC() },
      "routes-glow": { type: "geojson", data: emptyFC() },
      "route-arrows": { type: "geojson", data: emptyFC() },
      uncert: { type: "geojson", data: emptyFC() },
    },
    layers: [
      { id: "bg", type: "background", paint: { "background-color": C.void } },

      // ── Жер ──
      {
        id: "land-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": ["case", ["==", ["get", "kz"], 1], C.landKz, C.land],
          "fill-opacity": 0.98,
        },
      },
      {
        id: "land-hatch",
        type: "fill",
        source: "countries",
        filter: ["==", ["get", "kz"], 1],
        paint: { "fill-outline-color": "#1d2f2a", "fill-color": "#131f1c", "fill-opacity": 0.35 },
      },
      {
        id: "country-borders",
        type: "line",
        source: "countries",
        paint: { "line-color": C.border, "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.7, 8, 1.8], "line-opacity": 0.55 },
      },

      // ── Су ──
      {
        id: "water-fill",
        type: "fill",
        source: "lakes",
        paint: { "fill-color": C.water, "fill-opacity": 0.9 },
      },
      {
        id: "water-line",
        type: "line",
        source: "lakes",
        paint: { "line-color": "#1c3a49", "line-width": 0.8, "line-opacity": 0.7 },
      },

      // ── Схемалық география (geo source-тағы қолмен салынған қабаттар) ──
      {
        id: "aral-fill",
        type: "fill",
        source: "geo",
        filter: ["==", ["get", "gk"], "aral"],
        paint: { "fill-color": "#12303e", "fill-opacity": 0.5 },
      },
      {
        id: "aral-outline",
        type: "line",
        source: "geo",
        filter: ["==", ["get", "gk"], "aral"],
        paint: { "line-color": C.gold, "line-width": 1, "line-dasharray": [2, 2], "line-opacity": 0.45 },
      },
      {
        id: "river-glow",
        type: "line",
        source: "geo",
        filter: ["==", ["get", "gk"], "river"],
        paint: { "line-color": "#1d3d4a", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 2.6, 7, 6], "line-opacity": 0.35, "line-blur": 2 },
      },
      {
        id: "river",
        type: "line",
        source: "geo",
        filter: ["==", ["get", "gk"], "river"],
        minzoom: 3,
        paint: { "line-color": C.river, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.9, 7, 2.2], "line-opacity": 0.95 },
      },
      {
        id: "ridge",
        type: "line",
        source: "geo",
        filter: ["==", ["get", "gk"], "ridge"],
        paint: { "line-color": C.ridge, "line-width": 2.6, "line-dasharray": [1.6, 1.1], "line-opacity": 0.75 },
      },
      {
        id: "labels-riverline",
        type: "symbol",
        source: "geo",
        filter: ["all", ["==", ["get", "gk"], "riverlabel"]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, 9, 8, 12],
          "symbol-placement": "line",
          "text-letter-spacing": 0.12,
          "text-padding": 4,
        },
        paint: { "text-color": "#5f8898", },
      },
      {
        id: "labels-region",
        type: "symbol",
        source: "geo",
        filter: ["all", ["==", ["get", "gk"], "label"], ["==", ["get", "cls"], "region"]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["match", ["get", "size"], "xl", 15, "l", 12.5, 10],
          "text-letter-spacing": 0.24,
          "text-allow-overlap": false,
        },
        paint: { "text-color": C.textRegion, "text-halo-color": C.void, "text-halo-width": 1.6, },
      },
      {
        id: "labels-desert",
        type: "symbol",
        source: "geo",
        filter: ["all", ["==", ["get", "gk"], "label"], ["==", ["get", "cls"], "desert"]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 9.5,
          "text-letter-spacing": 0.3,
        },
        paint: { "text-color": "#6b5d3f", "text-halo-color": C.void, "text-halo-width": 1.2, },
      },
      {
        id: "labels-water",
        type: "symbol",
        source: "geo",
        filter: ["all", ["==", ["get", "gk"], "label"], ["==", ["get", "cls"], "water"]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 10,
          "text-letter-spacing": 0.22,
        },
        paint: { "text-color": "#4f7f93", "text-halo-color": C.voidDeep, "text-halo-width": 1.4, },
      },
      {
        id: "labels-mountain",
        type: "symbol",
        source: "geo",
        filter: ["all", ["==", ["get", "gk"], "label"], ["==", ["get", "cls"], "mountain"]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 9.5,
          "text-letter-spacing": 0.24,
        },
        paint: { "text-color": "#847150", "text-halo-color": C.void, "text-halo-width": 1.2, },
      },
      {
        id: "labels-state",
        type: "symbol",
        source: "geo",
        filter: ["all", ["==", ["get", "gk"], "label"], ["==", ["get", "cls"], "state"]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 3, 11, 7, 20],
          "text-letter-spacing": 0.4,
          "text-optional": true,
        },
        paint: { "text-color": "#3f5158", "text-halo-color": C.voidDeep, "text-halo-width": 0.4 },
      },

      // ── Нақтысыздық шеңберлері ──
      {
        id: "uncert-fill",
        type: "fill",
        source: "uncert",
        paint: { "fill-color": C.gold, "fill-opacity": 0.05 },
      },
      {
        id: "uncert-line",
        type: "line",
        source: "uncert",
        paint: { "line-color": C.gold, "line-dasharray": [1.4, 1.8], "line-width": 1.1, "line-opacity": 0.4 },
      },

      // ── Маршруттар ──
      {
        id: "route-ghost",
        type: "line",
        source: "routes-ghost",
        layout: { "line-cap": "round" },
        paint: {
          "line-color": ["match", ["get", "side"], "kk", C.kk, "dj", C.dj, "ru", C.ru, C.civ],
          "line-width": 1.9,
          "line-dasharray": [2.2, 3.2],
          "line-opacity": 0.28,
        },
      },
      {
        id: "route-glow",
        type: "line",
        source: "routes-glow",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "side"], "kk", C.kk, "dj", C.dj, "ru", C.ru, C.civ],
          "line-width": 11,
          "line-blur": 7,
          "line-opacity": 0.16,
        },
      },
      {
        id: "route-live",
        type: "line",
        source: "routes-live",
        filter: ["==", ["get", "unc"], 0],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "side"], "kk", C.kk, "dj", C.dj, "ru", C.ru, C.civ],
          "line-width": ["case", ["==", ["get", "side"], "civ"], 2.6, 3.4],
          "line-opacity": 0.95,
        },
      },
      {
        // жуық (≈) маршруттар — үзік сызық: жазбада нақты жолы жоқ қимылдар
        id: "route-live-approx",
        type: "line",
        source: "routes-live",
        filter: ["==", ["get", "unc"], 1],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "side"], "kk", C.kk, "dj", C.dj, "ru", C.ru, C.civ],
          "line-width": ["case", ["==", ["get", "side"], "civ"], 2.3, 3.1],
          "line-dasharray": [2.7, 1.7],
          "line-opacity": 0.88,
        },
      },
      {
        // талас (±?) маршруттар — нүктелі сызық: орны/жылы даулы қимылдар
        id: "route-live-debated",
        type: "line",
        source: "routes-live",
        filter: ["==", ["get", "unc"], 2],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "side"], "kk", C.kk, "dj", C.dj, "ru", C.ru, C.civ],
          "line-width": 3.4,
          "line-dasharray": [0.1, 2.1],
          "line-opacity": 0.82,
        },
      },
      {
        id: "route-arrows",
        type: "symbol",
        source: "route-arrows",
        layout: {
          "icon-image": ["get", "icon"],
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 3.4, 0.55, 6.5, 0.9],
          "icon-allow-overlap": true,
        },
        paint: {
          "icon-opacity": ["case", [">", ["get", "unc"], 0], 0.5, 0.95],
        },
      },
    ],
  };
}

export function emptyFC(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

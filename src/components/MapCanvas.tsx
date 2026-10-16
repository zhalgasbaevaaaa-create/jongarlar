import { useEffect, useImperativeHandle, useMemo, useRef, type RefObject } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MLMap, StyleSpecification } from "maplibre-gl";
// MapLibre v6 жұмысшы файлын Vite бандліне қосамыз (vite's ?url) — әйтпесе worker 404
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
maplibregl.setWorkerUrl(workerUrl);
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection } from "geojson";
import { buildAtlasStyle } from "../lib/style";
import { SIDE_COLOR } from "../lib/palette";
import { makeChevron, makeGlow } from "../lib/icons";
import { arrowChain, circleAround, densify, pointAtFraction, trimFraction } from "../lib/geoMath";
import { place, RIVERS, RIDGES, ARAL_HIST, LABELS } from "../data/geo";
import { CERTAINTY_LEGEND } from "../data/sources";
import type { HistoricalEvent, Place } from "../data/types";
import { buildSchedule } from "../lib/schedule";

export type TileStatus = "off" | "loading" | "online" | "blocked";

export interface MapCanvasHandle {
  flyToAll: () => void;
  zoomBy: (dz: number) => void;
}

export interface MapCanvasProps {
  event: HistoricalEvent;
  p: number; // локальды прогресс 0..1
  showTiles: boolean;
  showGhost: boolean;
  showArrows: boolean;
  showUncert: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  onTileStatus: (s: TileStatus) => void;
  apiRef: RefObject<MapCanvasHandle | null>;
}

/* Ашық OpenStreetMap тайлдары — кілтсіз, тегін (қолдану саясаты: жаппай жүктеме емес,
 * атрибуция міндетті). CARTO dark бұрын кілтсіз еді — енді watermark қояды, сондықтан бас тартылды. */
const TILE_URLS = ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"];
const TILE_ATTR = 'Карта деректері © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> үлескерлері (ODbL)';

interface MarkerBundle {
  marker: maplibregl.Marker;
  el: HTMLDivElement;
  appearP: number;
  hitP: number;
}
interface RouteRuntime {
  dense: [number, number][];
  arrows: { pos: [number, number]; bearing: number }[];
  head: maplibregl.Marker;
  headG: Element | null;
  phase: number;
  side: "kk" | "dj" | "civ" | "ru";
  unc: 0 | 1 | 2; // 0 = нақты, 1 = шамамен, 2 = талас
}

function sideForPlace(pl: Place): "kk" | "dj" | "ru" | "civ" {
  if (pl.side) return pl.side;
  switch (pl.kind) {
    case "fort": return "ru";
    case "fallen": return "dj";
    case "battle":
    case "curultai":
    case "gate":
    case "memorial": return "kk";
    default: return "civ";
  }
}

export default function MapCanvas(props: MapCanvasProps) {
  const { event, p, showTiles, showGhost, showArrows, showUncert, showLabels, showMarkers } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const readyRef = useRef(false);
  const tilesState = useRef({ added: false, errs: 0, loaded: false });
  const markersRef = useRef<MarkerBundle[]>([]);
  const routesRef = useRef<RouteRuntime[]>([]);
  const pRef = useRef(p);
  pRef.current = p;
  const statusCbRef = useRef(props.onTileStatus);
  statusCbRef.current = props.onTileStatus;
  const lastFitRef = useRef(false);
  const schedule = useMemo(() => buildSchedule(event), [event]);
  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;

  const paintFrame = () => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const pp = pRef.current;
    const sch = scheduleRef.current;
    const setSrc = (id: string, fc: FeatureCollection) => (map.getSource(id) as GeoJSONSource | undefined)?.setData(fc);

    const live: FeatureCollection = { type: "FeatureCollection", features: [] };
    const arrows: FeatureCollection = { type: "FeatureCollection", features: [] };

    for (const rt of routesRef.current) {
      const win = sch.windows.find((w) => w.phase === rt.phase);
      if (!win) continue;
      let cut = 0;
      if (pp >= win.end) cut = 1;
      else if (pp > win.start) cut = (pp - win.start) / (win.end - win.start);
      else cut = 0;

      if (cut > 0.001) {
        const trimmed = trimFraction(rt.dense, cut);
        if (trimmed.length >= 2) {
          live.features.push({
            type: "Feature",
            properties: { side: rt.side, unc: rt.unc },
            geometry: { type: "LineString", coordinates: trimmed },
          });
        }
      }
      // head marker
      if (cut > 0.001 && cut < 0.999) {
        const pt = pointAtFraction(rt.dense, cut);
        rt.head.setLngLat(pt.pos as [number, number]);
        rt.head.getElement().style.display = "block";
        rt.headG?.setAttribute("transform", `rotate(${pt.bearing.toFixed(1)} 12 12)`);
      } else {
        rt.head.getElement().style.display = "none";
      }
      // прогрессивті бағдар белгілері
      const shown = Math.floor(rt.arrows.length * Math.min(1, Math.max(0, (cut - 0.08) / 0.92)));
      for (let i = 0; i < shown; i++) {
        const a = rt.arrows[i];
        arrows.features.push({
          type: "Feature",
          properties: { bearing: a.bearing, icon: `arrow-${rt.side}`, unc: rt.unc },
          geometry: { type: "Point", coordinates: a.pos },
        } as Feature);
      }
    }
    setSrc("routes-live", live);
    setSrc("routes-glow", live);
    setSrc("route-arrows", arrows);

    // авто-тест/дебаг айнасы (жұмыс істеуін тексеруге ыңғайлы)
    const dbg = ((window as unknown as { __atlasState?: Record<string, unknown> }).__atlasState ??= {});
    dbg.p = pp;
    dbg.live = live.features.length;
    dbg.liveUnc = live.features.filter((f) => ((f.properties as { unc?: number })?.unc ?? 0) > 0).length;
    dbg.arrows = arrows.features.length;
    dbg.markersShown = undefined;

    for (const mb of markersRef.current) {
      mb.el.classList.toggle("is-in", pp >= mb.appearP - 1e-6);
      mb.el.classList.toggle("is-hit", mb.hitP >= 0 && pp >= mb.hitP - 1e-6);
    }
  };

  /* ─────────── карта instance ─────────── */
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: hostRef.current,
      style: buildAtlasStyle() as StyleSpecification,
      center: [68.5, 46.5],
      zoom: 3.7,
      minZoom: 2.4,
      maxZoom: 10,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      hash: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");
    (window as unknown as { __atlas?: unknown }).__atlas = map; // авто-тест/дебаг тұтқасы

    // контейнер өлшемі өзгерсе (rotation, панель, браузер үлесі) — картаны жаңартып, театрды қайта орналастыру
    const host0 = hostRef.current;
    let ro: ResizeObserver | null = null;
    if (host0 && typeof ResizeObserver !== "undefined") {
      let lastH = host0.getBoundingClientRect().height;
      ro = new ResizeObserver(() => {
        const h = host0.getBoundingClientRect().height;
        if (!map) return;
        if (Math.abs(h - lastH) > 2) {
          lastH = h;
          try {
            map.resize();
            if (lastFitRef.current) {
              const bb = map.getBounds();
              fitTheater(map, host0, [bb.getWest(), bb.getSouth(), bb.getEast(), bb.getNorth()], false);
            }
          } catch { /* ignore */ }
        }
      });
      ro.observe(host0);
    }
    mapRef.current = map;

    map.on("load", () => {
      readyRef.current = true;
      try { map.resize(); } catch { /* ignore */ }
      const add = (id: string, img: { width: number; height: number; data: Uint8Array }) => {
        if (!map.hasImage(id)) map.addImage(id, img);
      };
      (["kk", "dj", "civ", "ru"] as const).forEach((s) => add(`arrow-${s}`, makeChevron(SIDE_COLOR[s])));
      (["kk", "dj", "civ"] as const).forEach((s) => add(`glow-${s}`, makeGlow(SIDE_COLOR[s])));
      (map.getSource("geo") as GeoJSONSource)?.setData(buildGeoFeatures());
      map.resize();
    });

    map.on("error", (e: unknown) => {
      const anyE = e as unknown as { sourceId?: string; error?: Error };
      if (anyE.sourceId === "tiles" || /openstreetmap|tile\./i.test(anyE.error?.message || "")) {
        tilesState.current.errs++;
        if (!tilesState.current.loaded && tilesState.current.errs >= 4) statusCbRef.current("blocked");
      }
    });
    map.on("data", (e: unknown) => {
      const ev = e as unknown as { dataType?: string; sourceId?: string; isSourceLoaded?: boolean };
      if (ev.sourceId === "tiles" && ev.dataType === "source" && ev.isSourceLoaded) {
        tilesState.current.loaded = true;
        statusCbRef.current("online");
      }
    });

    return () => {
      ro?.disconnect();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─────────── тайл қабаты ─────────── */
  const prevTiles = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevTiles.current === false && showTiles) {
      // пайдаланушы қайта қосты — қателер есебін нөлдеп, екінші мүмкіндік береміз
      tilesState.current.errs = 0;
    }
    prevTiles.current = showTiles;
    const apply = () => {
      const map = mapRef.current;
      if (!map || !readyRef.current) return;
      const has = !!map.getSource("tiles");
      const soften = (on: boolean) => {
        try {
          map.setPaintProperty("land-fill", "fill-opacity", on ? 0.28 : 0.98);
          map.setPaintProperty("land-hatch", "fill-opacity", on ? 0.08 : 0.35);
          map.setPaintProperty("water-fill", "fill-opacity", on ? 0.25 : 0.9);
          map.setPaintProperty("country-borders", "line-opacity", on ? 0.22 : 0.55);
        } catch { /* ignore */ }
      };
      if (showTiles && !has && tilesState.current.errs < 4) {
        map.addSource("tiles", { type: "raster", tiles: TILE_URLS, tileSize: 256, attribution: TILE_ATTR, maxzoom: 19 });
        map.addLayer(
          {
            id: "tiles-layer",
            type: "raster",
            source: "tiles",
            paint: {
              "raster-opacity": 0.62,
              // ашық OSM тайлдарын қараңғы атлас стиліне бейімдеу
              "raster-saturation": -0.55,
              "raster-contrast": 0.12,
              "raster-brightness-min": 0.22,
              "raster-brightness-max": 0.58,
              "raster-resampling": "linear",
            },
          } as never,
          "land-fill",
        );
        statusCbRef.current("loading");
        soften(true);
      } else if (!showTiles && has) {
        if (map.getLayer("tiles-layer")) map.removeLayer("tiles-layer");
        map.removeSource("tiles");
        statusCbRef.current("off");
        soften(false);
      }
    };
    apply();
    const map = mapRef.current;
    if (map && !readyRef.current) map.once("load", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTiles]);

  /* ─────────── қабат ауысулары ─────────── */
  useEffect(() => {
    const toggle = () => {
      const map = mapRef.current;
      if (!map || !readyRef.current) return;
      const vis = (id: string, on: boolean) => {
        try { map.setLayoutProperty(id, "visibility", on ? "visible" : "none"); } catch { /* ignore */ }
      };
      vis("route-ghost", showGhost);
      vis("route-arrows", showArrows);
      vis("uncert-fill", showUncert);
      vis("uncert-line", showUncert);
      for (const id of ["labels-region", "labels-desert", "labels-water", "labels-mountain", "labels-state", "labels-riverline"]) vis(id, showLabels);
    };
    toggle();
    const map = mapRef.current;
    if (map && !readyRef.current) map.once("load", toggle);
  }, [showGhost, showArrows, showUncert, showLabels]);

  /* ─────────── оқиға ауысқанда ─────────── */
  useEffect(() => {
    const build = () => {
      const map = mapRef.current;
      if (!map || !readyRef.current) return;
      const setSrc = (id: string, fc: FeatureCollection) => (map.getSource(id) as GeoJSONSource | undefined)?.setData(fc);

      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current = [];
      routesRef.current.forEach((r) => r.head.remove());
      routesRef.current = [];

      ((window as unknown as { __atlasState?: Record<string, unknown> }).__atlasState ??= {}).ghost = event.routes.length;
      ((window as unknown as { __atlasState?: Record<string, unknown> }).__atlasState ??= {}).routeIds = event.routes.map((r) => r.id).join("+");
      ((window as unknown as { __atlasState?: Record<string, unknown> }).__atlasState ??= {}).eventId = event.id;
      setSrc("routes-ghost", {
        type: "FeatureCollection",
        features: event.routes.map((r) => ({
          type: "Feature",
          properties: { side: r.side, unc: uncCode(r.certainty) },
          geometry: { type: "LineString", coordinates: densify(r.pts) },
        })),
      });

      routesRef.current = event.routes.map((r) => {
        const dense = densify(r.pts);
        const headEl = document.createElement("div");
        headEl.className = `head head--${r.side}` + (r.certainty !== "confirmed" ? " head--unc" : "");
        headEl.innerHTML = `<svg viewBox="0 0 24 24" width="23" height="23"><g class="head-rot"><path d="M12 2.6 L19.4 21 L12 16.2 L4.6 21 Z" fill="${SIDE_COLOR[r.side]}" stroke="#05090b" stroke-width="1.6" stroke-linejoin="round"/></g></svg>`;
        const head = new maplibregl.Marker({ element: headEl, anchor: "center" }).setLngLat(r.pts[r.pts.length - 1]);
        head.addTo(map);
        return { dense, arrows: arrowChain(dense), head, headG: headEl.querySelector(".head-rot"), phase: r.phase, side: r.side as import("../data/types").Side, unc: uncCode(r.certainty) };
      });

      setSrc("uncert", {
        type: "FeatureCollection",
        features: event.places
          .map((ref) => place(ref.id))
          .filter((pl) => pl.spanKm && pl.spanKm > 0)
          .map((pl) => {
            const ring = circleAround(pl.loc, pl.spanKm!).concat([circleAround(pl.loc, pl.spanKm!)[0]]);
            return {
              type: "Feature",
              properties: { id: pl.id, certainty: pl.certainty },
              geometry: { type: "Polygon", coordinates: [ring] },
            } as Feature;
          }),
      });

      const sch = buildSchedule(event);
      markersRef.current = event.places.map((ref) => {
        const pl = place(ref.id);
        const side = sideForPlace(pl);
        const el = document.createElement("div");
        el.className = `mk mk--${pl.kind} mk--${side} mk--c-${pl.certainty}`;
        el.innerHTML = `<div class="mk-core">
            <div class="mk-glow"></div>
            <div class="mk-dot">${kindGlyph(pl.kind)}</div>
            <div class="mk-label"><span class="mk-name">${pl.kk}</span>${certaintyBadge(pl.certainty) ? `<span class="mk-cert">${certaintyBadge(pl.certainty)}</span>` : ""}</div>
          </div>`;
        const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(pl.loc);
        marker.addTo(map);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          new maplibregl.Popup({ offset: 18, className: "atlas-popup", maxWidth: "320px" })
            .setLngLat(pl.loc)
            .setHTML(
              `<div class="pp"><h4>${pl.kk}${pl.alt ? ` <em>(${pl.alt})</em>` : ""}</h4>
              <div class="pp-cert pp-cert--${pl.certainty}">${CERTAINTY_LEGEND[pl.certainty].label}</div>
              ${ref.role ? `<div class="pp-role">${ref.role}</div>` : ""}
              ${pl.note ? `<p>${pl.note}</p>` : ""}
              <p class="pp-coord">≈ ${pl.loc[1].toFixed(2)}°, ${pl.loc[0].toFixed(2)}°</p></div>`,
            )
            .addTo(map);
        });
        const wAppear = sch.windows[Math.min(sch.windows.length - 1, ref.appearAt)];
        const wHit = ref.pulse ? sch.windows[Math.min(sch.windows.length - 1, ref.appearAt)] : null;
        return { marker, el, appearP: wAppear ? wAppear.start : 0, hitP: wHit ? wHit.end : -1 };
      });

      // камера — жеткілікті орын болмаса да, ешқашан құламауы үшін padding-ды бейімдейміз
      const pts: [number, number][] = [];
      event.routes.forEach((r) => pts.push(...r.pts));
      event.places.forEach((ref) => pts.push(place(ref.id).loc));
      let minX = 360, minY = 90, maxX = -360, maxY = -90;
      for (const [x, y] of pts) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      fitTheater(map, hostRef.current, [minX - 0.4, minY - 0.3, maxX + 0.4, maxY + 0.3]);
      lastFitRef.current = true;

      paintFrame();
    };
    build();
    const map = mapRef.current;
    if (map && !readyRef.current) map.once("load", build);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  /* p өзгергенде */
  useEffect(() => {
    paintFrame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p]);

  /* маркерлерді көрсету/жасыру */
  useEffect(() => {
    markersRef.current.forEach((m) => m.el.classList.toggle("mk-hidden", !showMarkers));
    routesRef.current.forEach((r) => r.head.getElement().classList.toggle("mk-hidden", !showMarkers));
    const map = mapRef.current;
    if (map) try { map.setLayoutProperty("route-arrows", "visibility", showMarkers && showArrows ? "visible" : "none"); } catch { /* ignore */ }
  }, [showMarkers, showArrows]);

  useImperativeHandle(props.apiRef, () => ({
    flyToAll: () => {
      try { mapRef.current?.flyTo({ center: [68.5, 46.5], zoom: 3.7, duration: 1400, essential: true }); } catch { /* ignore */ }
    },
    zoomBy: (dz) => {
      const map = mapRef.current;
      if (!map) return;
      map.easeTo({ zoom: map.getZoom() + dz, duration: 450 });
    },
  }));

  return <div className="map-host" ref={hostRef} />;
}

/** Камераның тегіс ауысуы — cubic ease-in/out (секірмейтін кинематографиялық жылжу) */
const EASE = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Оқиға театрын экранға бейімдеп көрсету: панельдер астында қалмайтын
 * padding, ал терезе тым қысқа болса — padding-ды қысып, fitBounds құламайды.
 */
function fitTheater(map: MLMap, host: HTMLElement | null, b: [number, number, number, number], animate = true) {
  const rect = host?.getBoundingClientRect();
  const W = Math.max(320, rect?.width ?? window.innerWidth);
  const H = Math.max(240, rect?.height ?? window.innerHeight);
  let pad = W > 1024
    ? { top: 96, bottom: 252, left: 468, right: 56 }
    : W > 700
      ? { top: 86, bottom: 306, left: 68, right: 44 }
      : { top: H > 560 ? 72 : 56, bottom: H > 560 ? 322 : Math.round(H * 0.34), left: 26, right: 20 };
  const maxV = H * 0.66;
  if (pad.top + pad.bottom > maxV) { const k = maxV / (pad.top + pad.bottom); pad = { ...pad, top: Math.round(pad.top * k), bottom: Math.round(pad.bottom * k) }; }
  const maxH = W * 0.78;
  if (pad.left + pad.right > maxH) { const k = maxH / (pad.left + pad.right); pad = { ...pad, left: Math.round(pad.left * k), right: Math.round(pad.right * k) }; }
  try {
    map.fitBounds([[b[0], b[1]], [b[2], b[3]]], {
      padding: pad,
      duration: animate ? 1650 : 0,
      maxZoom: 7.0,
      easing: EASE,
    });
  } catch {
    try { map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40, duration: 0, maxZoom: 6.2 }); } catch { /* ignore */ }
  }
}

function uncCode(c: "confirmed" | "approximate" | "debated"): 0 | 1 | 2 {
  return c === "confirmed" ? 0 : c === "approximate" ? 1 : 2;
}

function certaintyBadge(c: Place["certainty"]) {
  return c === "confirmed" ? "" : c === "approximate" ? "≈" : "±?";
}

/* ─────────── схема-география → GeoJSON ─────────── */
let cachedGeo: FeatureCollection | null = null;
function buildGeoFeatures(): FeatureCollection {
  if (cachedGeo) return cachedGeo;
  const features: Feature[] = [
    ...RIVERS.map((r) => ({
      type: "Feature",
      properties: { gk: "river", name: r.name },
      geometry: { type: "LineString", coordinates: r.pts },
    } as Feature)),
    ...RIVERS.map((r) => ({
      type: "Feature",
      properties: { gk: "riverlabel", name: r.name },
      geometry: { type: "LineString", coordinates: r.pts },
    } as Feature)),
    ...RIDGES.map((r) => ({
      type: "Feature",
      properties: { gk: "ridge", name: r.name },
      geometry: { type: "LineString", coordinates: r.pts },
    } as Feature)),
    {
      type: "Feature",
      properties: { gk: "aral", name: "aral" },
      geometry: { type: "Polygon", coordinates: [ARAL_HIST] },
    } as Feature,
    ...LABELS.map((l) => ({
      type: "Feature",
      properties: { gk: "label", cls: l.kind, name: l.kk, size: l.size || "s" },
      geometry: { type: "Point", coordinates: l.loc },
    } as Feature)),
  ];
  cachedGeo = { type: "FeatureCollection", features };
  return cachedGeo;
}

function kindGlyph(kind: Place["kind"]): string {
  const svg = (inner: string) =>
    `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  switch (kind) {
    case "battle": return svg(`<path d="M4 4 L14.5 14.5 M4 4 L4 8.5 M4 4 L8.5 4"/><path d="M20 4 L9.5 14.5 M20 4 L20 8.5 M20 4 L15.5 4"/><path d="M10 20.5 L12 15.5 L14 20.5"/>`);
    case "fallen": return svg(`<path d="M5 20 V9 L8 11 L11 9 V20"/><path d="M13 20 V9 L16 11 L19 9 V20"/><path d="M3 20 H21"/>`);
    case "curultai": return svg(`<path d="M12 3.5 V20.5"/><path d="M12 4.5 L18.5 6.5 L12 9"/><circle cx="12" cy="17" r="1.6"/>`);
    case "city": return svg(`<path d="M5 21 V8 l3 -2 v3 l3 -3 v4 l3 -2 v5 h3 v8 z"/>`);
    case "fort": return svg(`<path d="M4 21 V8 h3 V5 h3 v3 h4 V5 h3 v3 h3 v13 z"/>`);
    case "camp": return svg(`<path d="M12 4 L21 19 H3 z"/><path d="M12 11.5 V19"/>`);
    case "memorial": return svg(`<path d="M12 3 L12 21 M6.5 8.5 L12 3 L17.5 8.5 M7 21 H17"/>`);
    case "gate": return svg(`<path d="M5 21 V10 a7 7 0 0 1 14 0 v11"/><path d="M3 21 H21"/>`);
    default: return svg(`<circle cx="12" cy="12" r="6"/>`);
  }
}

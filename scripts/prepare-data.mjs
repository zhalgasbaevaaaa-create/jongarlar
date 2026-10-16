// Препарация дереккөздері / Data prep (run once, results committed to public/data).
// Inputs:
//  - node_modules/world-atlas/countries-50m.json  (Natural Earth 1:50m via world-atlas, Public Domain)
//  - /home/user/research/ne-lakes-50.geojson      (Natural Earth lakes 1:50m, Public Domain)
// Outputs: public/data/countries.geojson, public/data/lakes.geojson
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import simplify from "@turf/simplify";

const BBOX = { xmin: 44.0, ymin: 37.0, xmax: 98.5, ymax: 58.6 }; // theater of the Kazakh–Dzungar wars
const KEEP = {
  Kazakhstan: { kk: "Қазақстан", kz: 1 },
  Uzbekistan: { kk: "Өзбекстан" },
  "Kyrgyzstan ": { kk: "Қырғызстан" },
  Kyrgyzstan: { kk: "Қырғызстан" },
  Tajikistan: { kk: "Тәжікстан" },
  Turkmenistan: { kk: "Түрікменстан" },
  Russia: { kk: "Ресей" },
  China: { kk: "Қытай" },
  Mongolia: { kk: "Моңғолия" },
  Afghanistan: { kk: "Ауғанстан" },
  Pakistan: { kk: "Пәкістан" },
  Iran: { kk: "Иран" },
  India: { kk: "Үндістан" },
  Iraq: { kk: "Ирак" },
  Turkey: { kk: "Түркия" },
  Azerbaijan: { kk: "Әзірбайжан" },
  Georgia: { kk: "Грузия" },
  Armenia: { kk: "Армения" },
  "Netherlands ": {},
};

// Sutherland–Hodgman: clip a ring (closed [x,y] array) by the bbox rectangle.
function clipRing(ring) {
  let pts = ring.slice();
  const edges = [
    { inside: (p) => p[0] >= BBOX.xmin, clip: (a, b) => intersect(a, b, "x", BBOX.xmin) },
    { inside: (p) => p[0] <= BBOX.xmax, clip: (a, b) => intersect(a, b, "x", BBOX.xmax) },
    { inside: (p) => p[1] >= BBOX.ymin, clip: (a, b) => intersect(a, b, "y", BBOX.ymin) },
    { inside: (p) => p[1] <= BBOX.ymax, clip: (a, b) => intersect(a, b, "y", BBOX.ymax) },
  ];
  for (const { inside, clip } of edges) {
    const out = [];
    for (let i = 0; i < pts.length - (pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1] ? 1 : 0); i++) {
      const cur = pts[i];
      const prev = pts[(i - 1 + pts.length) % pts.length];
      const curIn = inside(cur);
      const prevIn = inside(prev);
      if (curIn) {
        if (!prevIn) out.push(clip(prev, cur));
        out.push(cur);
      } else if (prevIn) {
        out.push(clip(prev, cur));
      }
    }
    if (out.length > 2 && !(out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1])) out.push(out[0].slice());
    pts = out;
    if (!pts.length) return null;
  }
  return pts;
}
function intersect(a, b, axis, v) {
  const t = (v - a[axis === "x" ? 0 : 1]) / (b[axis === "x" ? 0 : 1] - a[axis === "x" ? 0 : 1]);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function round(n) { return Math.round(n * 1000) / 1000; }
function roundRing(ring) { return ring.map(([x, y]) => [round(x), round(y)]); }
function ringArea(ring) {
  let s = 0;
  for (let i = 1; i < ring.length; i++) s += ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1];
  return Math.abs(s / 2);
}
function clipGeom(g) {
  if (!g) return null;
  if (g.type === "Polygon") {
    const rings = g.coordinates.map(clipRing).filter((r) => r && r.length > 3);
    return rings.length ? { type: "Polygon", coordinates: rings.map(roundRing) } : null;
  }
  if (g.type === "MultiPolygon") {
    const polys = [];
    for (const p of g.coordinates) {
      const rings = p.map(clipRing).filter((r) => r && r.length > 3);
      if (rings.length) polys.push(rings.map(roundRing));
    }
    return polys.length ? { type: "MultiPolygon", coordinates: polys } : null;
  }
  return null;
}

// ---- countries ----
const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/countries-50m.json", import.meta.url)));
const countries = feature(topo, topo.objects.countries);
const feats = [];
for (const f of countries.features) {
  const name = (f.properties?.name || "").trim();
  const meta = KEEP[name];
  if (!meta) continue;
  const geom = clipGeom(f.geometry);
  if (!geom) continue;
  feats.push({ type: "Feature", properties: { id: f.id, name, kk: meta.kk || name, kz: meta.kz ? 1 : 0 }, geometry: geom });
}
const out = { type: "FeatureCollection", features: feats };
writeFileSync(new URL("../public/data/countries.geojson", import.meta.url), JSON.stringify(out));
console.log("countries:", feats.length, "size KB:", Math.round(JSON.stringify(out).length / 1024));

// ---- lakes ----
const lakesRaw = JSON.parse(readFileSync("/home/user/research/ne-lakes-50.geojson"));

const keep = [];
for (const f of lakesRaw.features) {
  const nm = f.properties?.name || f.properties?.name_en || "";
  const bboxHit = f.bbox && f.bbox[2] > 44 && f.bbox[0] < 98.5 && f.bbox[3] > 37 && f.bbox[1] < 58.6;
  if (!bboxHit) continue;
  if (f.geometry.type !== "Polygon" && f.geometry.type !== "MultiPolygon") continue;
  const simp = simplify({ type: "Feature", properties: {}, geometry: f.geometry }, { tolerance: 0.02, highQuality: true });
  const geom = clipGeom(simp.geometry);
  if (!geom) continue;
  // drop tiny islands
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  const cleaned = polys.map((p) => p.filter((r, i) => (i === 0 ? ringArea(r) > 0.02 : ringArea(r) > 0.02)));
  const finalPolys = cleaned.filter((p) => p.length && p[0] && ringArea(p[0]) > 0.02);
  if (!finalPolys.length) continue;
  keep.push({ type: "Feature", properties: { name: nm }, geometry: finalPolys.length === 1 ? { type: "Polygon", coordinates: finalPolys[0] } : { type: "MultiPolygon", coordinates: finalPolys } });
}
const lakeOut = { type: "FeatureCollection", features: keep };
writeFileSync(new URL("../public/data/lakes.geojson", import.meta.url), JSON.stringify(lakeOut));
console.log("lakes:", keep.length, "size KB:", Math.round(JSON.stringify(lakeOut).length / 1024));
console.log("lake names:", keep.map((f) => f.properties.name).filter(Boolean).join(", "));

export type LonLat = [number, number];

const R_EARTH = 6371.0088;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Haversine, км */
export function distKm(a: LonLat, b: LonLat): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(s));
}

/** Бағыт a→b: солтүстіктен сағат тілімен, градус (0..360) */
export function bearingDeg(a: LonLat, b: LonLat): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLon = rad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(dLon);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Центрден bearing бағытына dist км қашықтықтағы нүкте (сфералық жуықтау) */
export function destination(from: LonLat, bearing: number, dist: number): LonLat {
  const br = rad(bearing);
  const lat1 = rad(from[1]);
  const lon1 = rad(from[0]);
  const dR = dist / R_EARTH;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dR) + Math.cos(lat1) * Math.sin(dR) * Math.cos(br));
  const lon2 = lon1 + Math.atan2(Math.sin(br) * Math.sin(dR) * Math.cos(lat1), Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2));
  return [deg(lon2), deg(lat2)];
}

export function pathLengthKm(pts: LonLat[]): number {
  let t = 0;
  for (let i = 1; i < pts.length; i++) t += distKm(pts[i - 1], pts[i]);
  return t;
}

/** Сынық сызықты maxStep км-ден ұзын емес буындарға бөліп тығыздау (маркер жылжуы тегіс болу үшін) */
export function densify(pts: LonLat[], maxStep = 26): LonLat[] {
  const out: LonLat[] = [];
  for (let i = 0; i < pts.length; i++) {
    out.push(pts[i]);
    if (i === pts.length - 1) break;
    const a = pts[i];
    const b = pts[i + 1];
    const d = distKm(a, b);
    const n = Math.max(0, Math.floor(d / maxStep) - 1);
    for (let k = 1; k <= n; k++) out.push(destination(a, bearingDeg(a, b), (d * k) / (n + 1)));
  }
  return out;
}

/** 0..1 үлесі бойынша сынық сызықты кию — «сызылып жазылған» маршрут эффектісі */
export function trimFraction(pts: LonLat[], f: number): LonLat[] {
  if (pts.length < 2 || f <= 0) return [];
  const total = pathLengthKm(pts);
  return trimKm(pts, Math.min(total, f * total));
}

export function trimKm(pts: LonLat[], km: number): LonLat[] {
  const out: LonLat[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = distKm(pts[i - 1], pts[i]);
    if (acc + seg <= km) {
      out.push(pts[i]);
      acc += seg;
    } else {
      const f = seg === 0 ? 1 : (km - acc) / seg;
      const p: LonLat = [
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f,
      ];
      out.push(p);
      return out;
    }
  }
  return out;
}

export interface PointOnPath {
  pos: LonLat;
  bearing: number;
}
/** Сынық сызықтың f∈[0,1] үлесіндегі нүктесі + сол нүктедегі бағыт */
export function pointAtFraction(pts: LonLat[], f: number): PointOnPath {
  const total = pathLengthKm(pts);
  return pointAtKm(pts, Math.max(0, Math.min(1, f)) * total);
}
export function pointAtKm(pts: LonLat[], km: number): PointOnPath {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = distKm(pts[i - 1], pts[i]);
    if (acc + seg >= km || i === pts.length - 1) {
      const f = seg === 0 ? 1 : Math.max(0, Math.min(1, (km - acc) / seg));
      const br = bearingDeg(pts[i - 1], pts[i]);
      return {
        pos: [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f],
        bearing: br,
      };
    }
    acc += seg;
  }
  return { pos: pts[0], bearing: 0 };
}

/** Белгісіздік шеңбері — радиусы span км дөңгелек полигон */
export function circleAround(center: LonLat, rKm: number, n = 40): LonLat[] {
  const ring: LonLat[] = [];
  for (let i = 0; i <= n; i++) ring.push(destination(center, (360 / n) * i, rKm));
  return ring;
}

/** Маршрут бойымен кезең-кезеңімен қойылатын бағыт белгілері (chevron-нүктелер) */
export function arrowChain(pts: LonLat[], spacingKm = 240): { pos: LonLat; bearing: number }[] {
  const total = pathLengthKm(pts);
  if (total < 60) return [];
  const count = Math.max(2, Math.floor(total / spacingKm));
  const out: { pos: LonLat; bearing: number }[] = [];
  for (let i = 1; i <= count; i++) out.push(pointAtKm(pts, (total * i) / (count + 1)));
  return out;
}

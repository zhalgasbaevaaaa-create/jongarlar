import type { HistoricalEvent, Route } from "../data/types";

/**
 * Ойнату кестесі: әр оқиғаның кезеңдері (phases) бойынша уақыт терезелері.
 * Бір кезеңдегі маршруттар қатар жүреді; кезеңдер арасында қысқа үзіліс.
 */
export interface PhaseWindow {
  phase: number;
  start: number; // 0..1 үлесі
  end: number;
}
export interface EventSchedule {
  windows: PhaseWindow[];
  total: number;
  routesByPhase: Map<number, Route[]>;
}

export const GAP = 0.09; // кезеңдер арасындағы үзіліс үлесі
export const BASE_PHASE_SECONDS = 3.4; // бір кезеңнің ұзақтығы (1× жылдамдықта)

export function buildSchedule(ev: HistoricalEvent): EventSchedule {
  const phases = Math.max(1, ev.phases);
  const usable = 1 - GAP * (phases - 1);
  const slotLen = usable / phases;
  const windows: PhaseWindow[] = [];
  const routesByPhase = new Map<number, Route[]>();
  for (let k = 0; k < phases; k++) {
    windows.push({ phase: k, start: k * (slotLen + GAP), end: k * (slotLen + GAP) + slotLen });
    routesByPhase.set(k, []);
  }
  for (const r of ev.routes) {
    const ph = Math.min(phases - 1, Math.max(0, r.phase));
    routesByPhase.get(ph)!.push(r);
  }
  return { windows, total: phases * (slotLen + GAP), routesByPhase };
}

/** p (0..1) → осы кезең терезесінің ішіндегі f (0..1) немесе null (үзіліс) */
export function phaseProgress(w: PhaseWindow, p: number): number | null {
  if (p < w.start || p > w.end) return null;
  return (p - w.start) / (w.end - w.start);
}

/** Әр кезеңнің секундық ұзақтығы — кадрлық цикл үшін */
export function secondsPerPhase(ev: HistoricalEvent): number {
  const longest = ev.routes.reduce((m: number, r) => {
    let len = 0;
    for (let i = 1; i < r.pts.length; i++) {
      const a = r.pts[i - 1];
      const b = r.pts[i];
      const dLat = ((b[1] - a[1]) * Math.PI) / 180;
      const dLon = ((b[0] - a[0]) * Math.PI) / 180;
      const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      len += 2 * 6371 * Math.asin(Math.sqrt(s));
    }
    return Math.max(m, len);
  }, 0);
  const extra = Math.min(2.2, longest / 900); // ұзын жорықтарға сәл көбірек уақыт
  return BASE_PHASE_SECONDS + extra;
}

/** Толық жорық режимі: оқиғалар кезегінің ұзақтық үлестері */
export function campaignSpans(events: HistoricalEvent[]): { id: string; start: number; end: number }[] {
  const secs = events.map((e) => secondsPerPhase(e) * e.phases + 0.8);
  const total = secs.reduce((a, b) => a + b, 0);
  let acc = 0;
  return events.map((e, i) => {
    const s = acc / total;
    acc += secs[i];
    return { id: e.id, start: s, end: i === events.length - 1 ? 1 : acc / total };
  });
}

/** p сәтіндегі белсенді терезе (нақты ішінде) — CaptionBar үшін */
export function activeWindow(sch: EventSchedule, p: number): PhaseWindow | null {
  for (const w of sch.windows) if (p >= w.start && p <= w.end) return w;
  return null;
}

/** p-ден бұрынғы соңғы аяқталған терезе (үзіліс кезінде соңғы жазуды ұстап тұру үшін) */
export function lastEndedWindow(sch: EventSchedule, p: number): PhaseWindow | null {
  let best: PhaseWindow | null = null;
  for (const w of sch.windows) if (w.end <= p && (!best || w.end > best.end)) best = w;
  return best;
}

import { useEffect, useMemo, useState } from "react";
import type { HistoricalEvent, Route } from "../data/types";
import { buildSchedule, activeWindow, lastEndedWindow } from "../lib/schedule";
import { SIDE_COLOR, SIDE_LABEL } from "../lib/palette";

/**
 * Жорық субтитрі: ағымдағы кезеңдегі әр қимылдың қысқа қазақша түсіндірмесі
 * маршрут сызылып жатқан уақытпен кезектесіп көрсетіледі.
 */
export default function CaptionBar({ event, p, playing }: { event: HistoricalEvent; p: number; playing: boolean }) {
  const sch = useMemo(() => buildSchedule(event), [event]);
  const win = activeWindow(sch, p) ?? lastEndedWindow(sch, p);
  const exact = !!win && p >= win.start && p <= win.end;
  const routes: Route[] = win ? sch.routesByPhase.get(win.phase) ?? [] : [];
  const [i, setI] = useState(0);

  useEffect(() => setI(0), [win?.phase, event.id]);
  useEffect(() => {
    if (routes.length < 2 || !exact) return;
    const t = setInterval(() => setI((v) => (v + 1) % routes.length), 3000);
    return () => clearInterval(t);
  }, [routes.length, exact, win?.phase, event.id]);

  if (!win || routes.length === 0) return null;
  const r = routes[Math.min(i, routes.length - 1)];
  const unc = routes.some((x) => x.certainty === "debated")
    ? { t: "±? бағыт талас", cls: "deb" }
    : routes.some((x) => x.certainty === "approximate")
      ? { t: "≈ жуық сызба", cls: "approx" }
      : null;
  const km = Math.round(sumKm(r.pts) / 10) * 10;

  return (
    <div className={"capbar" + (exact ? "" : " dim")} key={`${event.id}-${win.phase}`} role="status" aria-live="polite">
      <span className="cap-phase">
        {win.phase + 1}/{event.phases}
      </span>
      <span className="cap-side" style={{ background: SIDE_COLOR[r.side] }} title={SIDE_LABEL[r.side]} />
      <span className="cap-text">
        <b>{r.label}</b>
        <span>{r.caption}</span>
      </span>
      <span className="cap-meta">≈{km} км</span>
      {unc && <span className={"cap-unc " + unc.cls}>{unc.t}</span>}
      {routes.length > 1 && (
        <span className="cap-rot">
          {Math.min(i, routes.length - 1) + 1}/{routes.length}
        </span>
      )}
      {playing && exact && <span className="cap-live" aria-hidden>●</span>}
    </div>
  );
}

function sumKm(pts: [number, number][]): number {
  let len = 0;
  for (let k = 1; k < pts.length; k++) {
    const [a, b] = [pts[k - 1], pts[k]];
    const dLat = ((b[1] - a[1]) * Math.PI) / 180;
    const dLon = ((b[0] - a[0]) * Math.PI) / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    len += 2 * 6371 * Math.asin(Math.sqrt(s));
  }
  return len;
}

import { useMemo, useState } from "react";
import type { HistoricalEvent } from "../data/types";
import { PLACES, place } from "../data/geo";
import { FIGURES } from "../data/figures";
import { ROUTE_KIND_LABEL, SIDE_COLOR, SIDE_LABEL } from "../lib/palette";
import { pathLengthKm } from "../lib/geoMath";
import { SOURCES } from "../data/sources";

interface Props {
  event: HistoricalEvent;
  p: number;
  onFigure(id: string): void;
  onSources(): void;
}

export default function EventPanel({ event, p, onFigure, onSources }: Props) {
  const [open, setOpen] = useState(true);
  const [fullText, setFullText] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);

  const figs = useMemo(
    () => event.figureIds.map((id) => FIGURES.find((f) => f.id === id)).filter(Boolean) as typeof FIGURES,
    [event],
  );
  const battleNow = useMemo(() => {
    const frac = p * event.phases;
    const phase = Math.min(event.phases - 1, Math.floor(frac));
    return phase;
  }, [p, event]);
  const activeRoutes = event.routes.filter((r) => r.phase === battleNow);

  return (
    <aside className={"epanel" + (open ? "" : " collapsed")}>
      <div className="ep-head">
        <div>
          <div className="ep-era">{event.era} <span className="ep-dot">·</span> {event.yearLabel}</div>
          <h2 className="ep-title">{event.title}</h2>
          <div className="ep-sub">{event.subtitle}</div>
        </div>
        <button className="ep-fold" onClick={() => setOpen((o) => !o)} aria-label={open ? "Панельді жию" : "Панельді ашу"}>{open ? "▾" : "▸"}</button>
      </div>

      {open && (
        <div className="ep-body">
          <div className={"ep-text" + (fullText ? " full" : "")}>
            {event.narrative.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </div>
          {event.narrative.length > 2 && (
            <button className="ep-more" onClick={() => setFullText((v) => !v)}>{fullText ? "қысқаша көрсету ▴" : "толық мәтін ▾"}</button>
          )}

          <div className={"ep-outcome tone-" + event.outcome.tone}>
            <span className="ep-outcome-label">{event.outcome.tone === "win" ? "Нәтиже — жеңіс" : event.outcome.tone === "tragedy" ? "Нәтиже — апат" : event.outcome.tone === "loss" ? "Нәтиже — ауыртпалық" : event.outcome.tone === "politics" ? "Нәтиже — саяси шешім" : "Контекст"}</span>
            <span>{event.outcome.text}</span>
          </div>

          <div className="ep-warn">
            <span className="ep-warn-i">⚠</span>
            <span><b>Дерек дәлдігі.</b> {event.uncertainty}</span>
          </div>

          <div className="ep-kicker">Кезең {Math.min(event.phases, battleNow + 1)}/{event.phases} · {activeRoutes.length ? "қозғалыстағы жолдар:" : "үзіліс — қорытынды кезең"}</div>
          <div className="ep-routes">
            {(showRoutes ? event.routes : activeRoutes.length ? activeRoutes : event.routes.slice(0, 3)).map((r) => (
              <div className={"erow" + (r.phase === battleNow ? " on" : "")} key={r.id}>
                <span className="eswatch" style={{ background: SIDE_COLOR[r.side] }} />
                <div className="erow-txt">
                  <div className="erow-label">{r.label}</div>
                  <div className="erow-meta">{SIDE_LABEL[r.side]} · {ROUTE_KIND_LABEL[r.kind] || r.kind} · ≈{Math.round(pathLengthKm(r.pts) / 10) * 10} км · {r.certainty === "confirmed" ? "нақты" : r.certainty === "approximate" ? "шамамен" : "талас"}</div>
                  <div className="erow-cap">{r.caption}</div>
                </div>
              </div>
            ))}
            <button className="ep-more" onClick={() => setShowRoutes((v) => !v)}>{showRoutes ? "белсенді жолдарды көрсету ▴" : `барлық ${event.routes.length} бағытты көрсету ▾`}</button>
          </div>

          {figs.length > 0 && (
            <>
              <div className="ep-kicker">Тұлғалар</div>
              <div className="ep-figs">
                {figs.map((f) => (
                  <button key={f.id} className="figchip" onClick={() => onFigure(f.id)} title={f.role}>
                    <span className={"figav fig-" + f.side}>{f.name.split(" ")[0][0]}</span>
                    <span className="figname">{f.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="ep-kicker">Дереккөздер</div>
          <div className="ep-sources">
            {event.sourceIds.map((sid) => (
              <button key={sid} className="srcchip" onClick={onSources} title={SOURCES[sid]?.cite}>
                {SOURCES[sid]?.title || sid}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

export function CertaintyNote({ id }: { id: string }) {
  const pl = PLACES[id] || place(id);
  return <span className={"cert cert-" + pl.certainty}>{pl.certainty === "confirmed" ? "нақты" : pl.certainty === "approximate" ? "шамамен" : "талас"}</span>;
}

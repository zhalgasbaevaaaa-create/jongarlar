import { useEffect, useRef } from "react";
import type { HistoricalEvent } from "../data/types";
import type { PlayMode } from "../hooks/usePlayback";

interface Props {
  events: HistoricalEvent[];
  index: number;
  playing: boolean;
  speed: number;
  mode: PlayMode;
  pLocal: number;
  pGlobal: number;
  spans: { id: string; start: number; end: number }[];
  onSelect(i: number): void;
  onToggle(): void;
  onReplay(): void;
  onSeek(v: number): void;
  onSpeed(s: number): void;
  onMode(m: PlayMode): void;
  onZoom(dz: number): void;
  onOverview(): void;
}

const SPEEDS = [0.5, 1, 2, 3];

export default function Timeline({ events, index, playing, speed, mode, pLocal, pGlobal, spans, onSelect, onToggle, onReplay, onSeek, onSpeed, onMode, onZoom, onOverview }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-i="${index}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  const seekFromClient = (clientX: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const r = bar.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  };

  const span = spans[index];

  return (
    <div className="timeline" role="navigation" aria-label="Тарихи уақыт жолағы">
      <div className="tl-controls">
        <div className="tl-btns">
          <button className="tb tb-play" onClick={onToggle} aria-label={playing ? "Үнсіз қосу (pause)" : "Ойнату (play)"} title={playing ? "Үнсіздету" : "Ойнату"}>
            {playing ? (
              <svg viewBox="0 0 24 24" width="19" height="19"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="19" height="19"><path d="M7 4.8 L19 12 L7 19.2 Z" fill="currentColor"/></svg>
            )}
          </button>
          <button className="tb" onClick={onReplay} title="Қайта ойнату" aria-label="Қайта ойнату">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"><path d="M4.6 12 a7.4 7.4 0 1 0 2.2-5.2"/><path d="M4.2 3.6 L4.9 7.2 L8.4 6.4"/></svg>
          </button>
          <div className="tb tb-speed" role="group" aria-label="Жылдамдық">
            {SPEEDS.map((s) => (
              <button key={s} className={"sp" + (speed === s ? " on" : "")} onClick={() => onSpeed(s)}>{s}×</button>
            ))}
          </div>
          <div className="tb tb-mode" role="group" aria-label="Ойнату режимі">
            <button className={"md" + (mode === "event" ? " on" : "")} onClick={() => onMode("event")}>Оқиға</button>
            <button className={"md" + (mode === "campaign" ? " on" : "")} onClick={() => onMode("campaign")}>Толық жорық</button>
          </div>
          <div className="tb tb-nav">
            <button onClick={() => onZoom(-1)} title="Алыстату">−</button>
            <button onClick={() => onZoom(1)} title="Жақындету">+</button>
            <button onClick={onOverview} title="Барлық театрды көрсету">⤢</button>
          </div>
        </div>

        <div className="tl-yearwrap">
          <div className="tl-years">{events[index].yearLabel} <span className="tl-title">· {events[index].short}</span></div>
          <div
            ref={barRef}
            className="tl-scrub"
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pLocal * 100)}
            aria-label="Уақыт бойынша жылжу"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                e.stopPropagation();
                onSeek(pLocal + (e.key === "ArrowRight" ? 0.04 : -0.04));
              }
            }}
            onPointerDown={(e) => {
              dragging.current = true;
              try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer */ }
              seekFromClient(e.clientX);
            }}
            onPointerMove={(e) => dragging.current && seekFromClient(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
          >
            {mode === "campaign" &&
              spans.map((s, i) => (
                <span key={s.id} className={"scrub-tick" + (i === index ? " on" : "")} style={{ left: `${s.start * 100}%` }} />
              ))}
            <div className="scrub-fill" style={{ width: `${(mode === "campaign" ? (pGlobal - span.start) / (span.end - span.start) : pLocal) * 100}%` }} />
            <div className="scrub-knob" style={{ left: `${(mode === "campaign" ? (pGlobal - span.start) / (span.end - span.start) : pLocal) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="tl-strip" ref={stripRef}>
        {events.map((ev, i) => (
          <button key={ev.id} data-i={i} className={"chip" + (i === index ? " on" : "")} onClick={() => onSelect(i)} title={ev.title}>
            <span className="chip-year">{ev.yearLabel}</span>
            <span className="chip-title">{ev.short}</span>
            {i === index && mode === "campaign" && <span className="chip-progress" style={{ width: `${pGlobal * 100}%` }} />}
            {i === index && mode === "event" && <span className="chip-progress" style={{ width: `${pLocal * 100}%` }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

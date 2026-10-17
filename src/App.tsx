import { useCallback, useEffect, useRef, useState } from "react";
import MapCanvas, { type MapCanvasHandle, type TileStatus } from "./components/MapCanvas";
import Timeline from "./components/Timeline";
import EventPanel from "./components/EventPanel";
import LegendPanel from "./components/LegendPanel";
import CaptionBar from "./components/CaptionBar";
import { FiguresModal, IntroModal, SourcesModal } from "./components/Modals";
import { EVENTS } from "./data/events";
import { usePlayback } from "./hooks/usePlayback";

export default function App() {
  const pb = usePlayback(EVENTS, 0);
  const [tileStatus, setTileStatus] = useState<TileStatus>("loading");
  const [showTiles, setShowTiles] = useState(true);
  const [ghost, setGhost] = useState(true);
  const [arrows, setArrows] = useState(true);
  const [uncert, setUncert] = useState(true);
  const [labels, setLabels] = useState(true);
  const [markers, setMarkers] = useState(true);
  const [legendOpen, setLegendOpen] = useState(false);
  const [figOpen, setFigOpen] = useState(false);
  const [figFocus, setFigFocus] = useState<string | undefined>(undefined);
  const [srcOpen, setSrcOpen] = useState(false);
  const [intro, setIntro] = useState(true);
  const api = useRef<MapCanvasHandle | null>(null);

  const onTileStatus = useCallback((s: TileStatus) => {
    setTileStatus(s);
    if (s === "blocked") setShowTiles(false);
  }, []);

  /* пернетақта: ғарыш — ойнату/үзілу, бағыт түймелері — оқиғалар */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (intro || figOpen || srcOpen) return;
      if (e.code === "Space") { e.preventDefault(); pb.toggle(); }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const d = e.key === "ArrowRight" ? 1 : -1;
        const n = Math.max(0, Math.min(EVENTS.length - 1, pb.index + d));
        pb.selectEvent(n, true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [pb, intro, figOpen, srcOpen]);

  const tileBadge =
    tileStatus === "online" ? { t: "Карта: ADM1 негізі ✓", cls: "ok" } :
    tileStatus === "loading" ? { t: "Карта қабаттарын дайындау…", cls: "mid" } :
    tileStatus === "blocked" ? { t: "Карта дайын", cls: "warn" } :
    { t: "Тайлдар сөндіулі", cls: "off" };

  return (
    <div className="app">
      <MapCanvas
        event={pb.ev}
        p={pb.pLocal}
        showTiles={showTiles}
        showGhost={ghost}
        showArrows={arrows}
        showUncert={uncert}
        showLabels={labels}
        showMarkers={markers}
        onTileStatus={onTileStatus}
        apiRef={api}
      />

      <div className="vignette" aria-hidden />

      <header className="topbar">
        <div className="brand">
          <span className="brand-emblem" aria-hidden>
            <svg viewBox="0 0 40 40" width="34" height="34">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#d2a755" strokeWidth="1.4" />
              <circle cx="20" cy="20" r="13.5" fill="none" stroke="#d2a755" strokeWidth="0.7" opacity=".6" />
              <path d="M20 5.5 L22 17 L34.5 20 L22 23 L20 34.5 L18 23 L5.5 20 L18 17 Z" fill="#e8c87a" opacity=".9" />
              <circle cx="20" cy="20" r="2.6" fill="#0a1116" />
            </svg>
          </span>
          <div>
            <h1>Қазақ–жоңғар соғыстары</h1>
            <p>Интерактивті тарихи атлас · 1635–1771</p>
          </div>
        </div>
        <div className="top-actions">
          <button className={"tb tb-tiles " + tileBadge.cls} onClick={() => setShowTiles((v) => !v)} title="Желідегі карта тайлдарын қосу/өшіру">
            <span className="dot" aria-hidden />{tileBadge.t}
          </button>
          <button className="tb" onClick={() => setLegendOpen((v) => !v)} aria-pressed={legendOpen}>Аңыз</button>
          <button className="tb" onClick={() => { setFigFocus(undefined); setFigOpen(true); }}>Тұлғалар</button>
          <button className="tb" onClick={() => setSrcOpen(true)}>Дереккөздер</button>
        </div>
      </header>

      <EventPanel
        event={pb.ev}
        p={pb.pLocal}
        onFigure={(id) => { setFigFocus(id); setFigOpen(true); }}
        onSources={() => setSrcOpen(true)}
      />

      <CaptionBar event={pb.ev} p={pb.pLocal} playing={pb.playing} />

      <LegendPanel
        open={legendOpen}
        onClose={() => setLegendOpen(false)}
        layers={{ tiles: showTiles, ghost, arrows, uncert, labels, markers }}
        onLayer={(k, v) => {
          if (k === "tiles") setShowTiles(v);
          if (k === "ghost") setGhost(v);
          if (k === "arrows") setArrows(v);
          if (k === "uncert") setUncert(v);
          if (k === "labels") setLabels(v);
          if (k === "markers") setMarkers(v);
        }}
        tileStatus={tileStatus}
      />

      <Timeline
        events={EVENTS}
        index={pb.index}
        playing={pb.playing}
        speed={pb.speed}
        mode={pb.mode}
        pLocal={pb.pLocal}
        pGlobal={pb.p}
        spans={pb.spans}
        onSelect={(i) => pb.selectEvent(i)}
        onToggle={pb.toggle}
        onReplay={pb.replay}
        onSeek={(v) => (pb.mode === "campaign" ? pb.seekGlobal(clampSpan(pb.spans[pb.index], v)) : pb.seekLocal(v))}
        onSpeed={pb.setSpeed}
        onMode={pb.switchMode}
        onZoom={(dz) => api.current?.zoomBy(dz)}
        onOverview={() => api.current?.flyToAll()}
      />

      <FiguresModal
        open={figOpen}
        focusId={figFocus}
        onClose={() => setFigOpen(false)}
        onGotoEvent={(ev) => { const i = EVENTS.findIndex((x) => x.id === ev.id); if (i >= 0) pb.selectEvent(i, true); }}
      />
      <SourcesModal open={srcOpen} onClose={() => setSrcOpen(false)} />
      <IntroModal
        open={intro}
        onClose={() => { setIntro(false); pb.selectEvent(0, true); }}
        onStart={() => {
          setIntro(false);
          const i = EVENTS.findIndex((x) => x.id === "aqtaban1723");
          pb.selectEvent(i >= 0 ? i : 0, true);
        }}
      />
    </div>
  );
}

function clampSpan(span: { start: number; end: number }, local: number): number {
  return span.start + Math.max(0, Math.min(1, local)) * (span.end - span.start);
}

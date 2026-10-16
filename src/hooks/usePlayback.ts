import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HistoricalEvent } from "../data/types";
import { campaignSpans, secondsPerPhase } from "../lib/schedule";

export type PlayMode = "event" | "campaign";

export function usePlayback(events: HistoricalEvent[], initialIndex = 0) {
  const [index, setIndex] = useState(initialIndex);
  const [p, setP] = useState(0);          // event mode → локальды; campaign → глобалды
  const [playing, setPlaying] = useState(false);
  const pRef = useRef(p); pRef.current = p;
  const epochRef = useRef(0); // seek/select/replay белсенді сағатты қайта бекітсін
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<PlayMode>("event");

  const spans = useMemo(() => campaignSpans(events), [events]);
  const spansRef = useRef(spans); spansRef.current = spans;
  const modeRef = useRef(mode); modeRef.current = mode;
  const speedRef = useRef(speed); speedRef.current = speed;
  const indexRef = useRef(index); indexRef.current = index;

  const eventDur = useCallback((i: number) => {
    const ev = events[i];
    return secondsPerPhase(ev) * ev.phases * 1.22 + 0.6;
  }, [events]);
  const durRef = useRef(eventDur); durRef.current = eventDur;

  const eventDurs = useMemo(() => events.map((_, i) => eventDur(i)), [events, eventDur]);
  const globalTotal = useMemo(() => eventDurs.reduce((a, b) => a + b, 0), [eventDurs]);

  /* Қабырға сағатына байланған прогресс: кадр санына тәуелсіз — баяу рендерде де
     анимация уақыт бойынша дұрыс жүреді (elapsed time → route cut). */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let anchorT = performance.now();
    let anchorP = pRef.current;
    let myEpoch = epochRef.current;
    let usedSpeed = speedRef.current;
    const tick = (now: number) => {
      if (epochRef.current !== myEpoch || usedSpeed !== speedRef.current) {
        // seek/режим/жылдамдық өзгерді — сағатты қайта бекітеміз
        myEpoch = epochRef.current;
        usedSpeed = speedRef.current;
        anchorP = pRef.current;
        anchorT = now;
      }
      const el = (Math.max(0, now - anchorT) / 1000) * usedSpeed;
      if (modeRef.current === "event") {
        const D = durRef.current(indexRef.current);
        const nx = anchorP + el / D;
        if (nx >= 1) { setP(1); setPlaying(false); return; }
        setP(nx);
      } else {
        const nx = anchorP + el / globalTotalRef.current;
        if (nx >= 1) { setP(1); setPlaying(false); return; }
        const sp = spansRef.current;
        let idx = sp.findIndex((s) => nx < s.end - 1e-9);
        if (idx === -1) idx = sp.length - 1;
        if (idx !== indexRef.current) { indexRef.current = idx; setIndex(idx); }
        setP(nx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const globalTotalRef = useRef(globalTotal); globalTotalRef.current = globalTotal;

  const ev = events[index];
  const span = spans[index];
  const pLocal = mode === "campaign" ? Math.min(1, Math.max(0, (p - span.start) / (span.end - span.start))) : p;

  const selectEvent = useCallback((i: number, autoplay = true) => {
    const clamped = Math.max(0, Math.min(events.length - 1, i));
    setMode("event");
    indexRef.current = clamped;
    setIndex(clamped);
    if (autoplay) { setP(0); setPlaying(true); } else { setP(1); setPlaying(false); }
    epochRef.current++;
  }, [events.length]);

  const toggle = useCallback(() => {
    setPlaying((pl) => {
      if (!pl && p >= 0.999) setP(modeRef.current === "event" ? 0 : spansRef.current[indexRef.current].start + 1e-6);
      return !pl;
    });
  }, [p]);

  const replay = useCallback(() => {
    setP(mode === "campaign" ? spans[index].start + 1e-6 : 0);
    setPlaying(true);
    epochRef.current++;
  }, [mode, index]);

  const pause = useCallback(() => setPlaying(false), []);

  const seekLocal = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    if (modeRef.current === "campaign") {
      const s = spansRef.current[indexRef.current];
      setP(s.start + clamped * (s.end - s.start));
    } else setP(clamped);
    epochRef.current++;
  }, []);

  const seekGlobal = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setMode("campaign");
    setP(clamped);
    epochRef.current++;
    const sp = spansRef.current;
    let idx = sp.findIndex((s) => clamped < s.end - 1e-9);
    if (idx === -1) idx = sp.length - 1;
    indexRef.current = idx;
    setIndex(idx);
  }, []);

  const switchMode = useCallback((m: PlayMode) => {
    if (m === modeRef.current) return;
    if (m === "campaign") {
      const s = spansRef.current[indexRef.current];
      setP(s.start + pLocalRef.current * (s.end - s.start));
    } else {
      setP(pLocalRef.current);
    }
    setMode(m);
  }, []);
  const pLocalRef = useRef(pLocal); pLocalRef.current = pLocal;

  return {
    ev, events, index, p: mode === "campaign" ? p : pLocal, pLocal, playing, speed, setSpeed, mode, switchMode,
    selectEvent, toggle, pause, replay, seekLocal, seekGlobal, spans,
    campaignTotal: globalTotal,
  };
}

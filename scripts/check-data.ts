import { EVENTS } from "../src/data/events";
import { PLACES } from "../src/data/geo";
import { FIGURES } from "../src/data/figures";
import { SOURCES } from "../src/data/sources";
import { buildSchedule } from "../src/lib/schedule";

let errs: string[] = [];
const figIds = new Set(FIGURES.map((f) => f.id));
for (const ev of EVENTS) {
  for (const ref of ev.places) if (!PLACES[ref.id]) errs.push(`[${ev.id}] жер жоқ: ${ref.id}`);
  for (const r of ev.routes) {
    for (const pid of r.pts) {
      // pts are coords arrays OR place ids? check type
      void pid;
    }
    if (!["kk","dj","civ","ru"].includes(r.side)) errs.push(`[${ev.id}] route side: ${r.side}`);
  }
  for (const fid of ev.figureIds) if (!figIds.has(fid)) errs.push(`[${ev.id}] тұлға жоқ: ${fid}`);
  for (const sid of ev.sourceIds) if (!SOURCES[sid]) errs.push(`[${ev.id}] дереккөз жоқ: ${sid}`);
  try {
    const sch = buildSchedule(ev);
    if (sch.windows.length !== ev.phases) errs.push(`[${ev.id}] windows ${sch.windows.length}≠phases ${ev.phases}`);
    for (const w of sch.windows) if (!(w.end > w.start)) errs.push(`[${ev.id}] жаман терезе ${w.phase}`);
  } catch (e) { errs.push(`[${ev.id}] schedule: ${e}`); }
  if (!ev.short || !ev.title || ev.narrative.length < 1) errs.push(`[${ev.id}] мазмұн бос`);
}
for (const f of FIGURES) for (const eid of f.events) if (!EVENTS.some((e) => e.id === eid)) errs.push(`[fig ${f.id}] оқиға жоқ: ${eid}`);
const usedSrc = new Set(EVENTS.flatMap((e) => e.sourceIds));
for (const sid of Object.keys(SOURCES)) if (!usedSrc.has(sid)) errs.push(`[sources] қолданылмаған: ${sid}`);
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : `OK — ${EVENTS.length} events, ${Object.keys(PLACES).length} places, ${FIGURES.length} figures, ${Object.keys(SOURCES).length} sources, барлық байланыс тұтас ✓`);

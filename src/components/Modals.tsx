import { useMemo, type ReactNode } from "react";
import { FIGURES } from "../data/figures";
import { SOURCES, DATA_LICENSES, CERTAINTY_LEGEND } from "../data/sources";
import { PLACES } from "../data/geo";
import { EVENTS } from "../data/events";
import { SIDE_COLOR } from "../lib/palette";
import type { HistoricalEvent } from "../data/types";

export function Modal({ title, onClose, children, wide }: { title: string; onClose(): void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className={"modal" + (wide ? " wide" : "")} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Жабу">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ─────────── ТҰЛҒАЛАР ─────────── */
export function FiguresModal({ open, onClose, focusId, onGotoEvent }: { open: boolean; onClose(): void; focusId?: string; onGotoEvent(ev: HistoricalEvent): void }) {
  if (!open) return null;
  const groups = [
    { cap: "Қазақ тарапы", side: "kk" as const },
    { cap: "Жоңғар (ойрат) тарапы", side: "dj" as const },
    { cap: "Көрші империялар", side: "other" as const },
  ];
  return (
    <Modal title="Тарихи тұлғалар — екі жақтың көшбасшылары" onClose={onClose} wide>
      <p className="m-note">
        Өмір/билік жылдары көптеген тұлға үшін бірнеше нұсқада кездеседі. Біз мұнда тек жарияланған есептерді «шамамен» деп қоямыз —
        нақ даталарды ойлап таппау үшін.
      </p>
      {groups.map((g) => {
        const list = FIGURES.filter((f) => (g.side === "other" ? f.side === "other" || f.side === "ru" : f.side === g.side));
        if (!list.length) return null;
        return (
          <div key={g.side}>
            <div className="fig-group">{g.cap}</div>
            <div className="fig-grid">
              {list.map((f) => (
                <article className={"fig-card" + (focusId === f.id ? " focus" : "")} key={f.id} data-fig={f.id}>
                  <div className="fig-top">
                    <span className="fig-medal" style={{ borderColor: SIDE_COLOR[f.side as "kk"] || "#8899aa" }}>
                      <span style={{ color: SIDE_COLOR[f.side as "kk"] || "#8899aa" }}>{f.name.split(" ")[0][0]}</span>
                    </span>
                    <div>
                      <h4>{f.name}</h4>
                      <div className="fig-role">{f.role}</div>
                    </div>
                  </div>
                  <div className="fig-life">⏳ {f.lifeLabel} {f.certainty !== "confirmed" && <span className={"cert cert-" + f.certainty}>{f.certainty === "approximate" ? "≈ шамамен" : "±? талас"}</span>}</div>
                  {f.bio.map((b, i) => <p key={i}>{b}</p>)}
                  <div className="fig-evs">
                    {f.events.map((eid) => {
                      const ev = EVENTS.find((x) => x.id === eid);
                      return ev ? (
                        <button key={eid} className="fig-evbtn" onClick={() => { onGotoEvent(ev); onClose(); }}>
                          {ev.yearLabel} · {ev.short}
                        </button>
                      ) : null;
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </Modal>
  );
}

/* ─────────── ДЕРЕКТЕР МЕН ЛИЦЕНЗИЯЛАР ─────────── */
export function SourcesModal({ open, onClose }: { open: boolean; onClose(): void }) {
  const register = useMemo(() => {
    const rows: { place: string; evs: string; certainty: string; note: string }[] = [];
    for (const ev of EVENTS) {
      for (const ref of ev.places) {
        const pl = PLACES[ref.id];
        if (!pl || pl.certainty === "confirmed") continue;
        if (rows.some((r) => r.place === pl.kk)) continue;
        rows.push({
          place: pl.kk,
          evs: ev.yearLabel,
          certainty: pl.certainty === "approximate" ? "шамамен ≈" : "талас ±?",
          note: (pl.note || "") + (pl.spanKm ? ` Ықтималдық радиусы — ~${pl.spanKm} км.` : ""),
        });
      }
    }
    return rows;
  }, []);

  if (!open) return null;
  return (
    <Modal title="Дереккөздер, даталар мен нақтысыздықтар" onClose={onClose} wide>
      <p className="m-note">
        Бұл атлас білім беру мақсатында жасалған. Нақты шайқас координаттары мен «дайын фактілер» ойлап табылмаған:
        тарихи жерлер жарияланған зерттеулер мен энциклопедиялық сипаттамаларға сүйенетін <b>жуық нүктелер</b> ретінде
        қойылды, ал маршруттар <b>шартты сызба</b>. Төменде — әр деректің тектілігі мен екіұшты жазбалар реестрі.
      </p>

      <div className="src-sec">
        <h4>Негізгі әдебиет пен жазба деректер</h4>
        <ul className="src-list">
          {Object.values(SOURCES).map((s) => (
            <li key={s.id}>
              <span className={"src-kind src-kind-" + s.kind}>{s.kind === "book" ? "кітап" : s.kind === "article" ? "мақала" : s.kind === "wiki" ? "уики" : s.kind === "data" ? "дерек" : "код"}</span>
              <b>{s.title}</b>
              <div className="src-cite">{s.cite}</div>
              {s.note && <div className="src-note">✎ {s.note}</div>}
              {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="src-url">{s.url}</a>}
            </li>
          ))}
        </ul>
      </div>

      <div className="src-sec">
        <h4>Нақтысыздық реестрі — картадағы күмәнді нүктелер</h4>
        <table className="cert-table">
          <thead>
            <tr><th>Жер атауы</th><th>Оқиға</th><th>Дәлдік</th><th>Ескерту</th></tr>
          </thead>
          <tbody>
            {register.map((r, i) => (
              <tr key={i}>
                <td>{r.place}</td>
                <td>{r.evs}</td>
                <td><span className={"cert " + (r.certainty.startsWith("шамамен") ? "cert-approximate" : "cert-debated")}>{r.certainty}</span></td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="m-mini">
          Дәлдік белгілері: {Object.values(CERTAINTY_LEGEND).map((c) => `${c.label} — ${c.desc}`).join("  ·  ")}
        </p>
      </div>

      <div className="src-sec">
        <h4>Карта ресурстары мен лицензиялар (пайдалану шарттары сақталған)</h4>
        <ul className="lic-list">
          {DATA_LICENSES.map((l) => (
            <li key={l.title}>
              <b>{l.title}</b>
              <div>{l.terms}</div>
              <a href={l.url.split(" ")[0]} target="_blank" rel="noreferrer">{l.url}</a>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

/* ─────────── КІРІСПЕ ─────────── */
export function IntroModal({ open, onStart, onClose }: { open: boolean; onStart(): void; onClose(): void }) {
  if (!open) return null;
  return (
    <div className="modal-back intro-back">
      <div className="intro" role="dialog" aria-modal="true">
        <div className="intro-kicker">Интерактивті тарихи атлас · 1635–1771</div>
        <h1>Қазақ-жоңғар соғыстары</h1>
        <p className="intro-lead">
          Жүз жылға созылған отыздан астам жорық пен шайқастың негізгі кезеңдері: карта, анимацияланған жорық
          бағыттары, құрылтайлар мен тұлғалар. Мұндағы көптеген даталар мен жерлер ғылымда талқылы — атлас соны
          жасырмай, «шамамен / талас» деп белгілейді.
        </p>
        <ul className="intro-list">
          <li><b>Төмендегі уақыт жолағынан</b> оқиғаны таңдаңыз — жорықтар мен шегінулер картада суріледі.</li>
          <li><b>▶ / ⏸ ⟲ және 0.5×–3×</b> — анимацияны басқару; «Толық жорық» режимі — бүкіл кезеңді басынан аяғына дейін.</li>
          <li><b>Маркерлерді басып</b> нақтылығы мен дерек ескертпесін көріңіз.</li>
        </ul>
        <div className="intro-btns">
          <button className="btn-primary" onClick={onStart}>Атласты ашу — 1723 жылдан бастау</button>
          <button className="btn-ghost" onClick={onClose}>Прологтан бастау</button>
        </div>
        <div className="intro-foot">Дереккөздер мен рұқсат шарттары — «Дереккөздер» бөлімінде.</div>
      </div>
    </div>
  );
}

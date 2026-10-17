import { C, SIDE_COLOR, SIDE_LABEL } from "../lib/palette";
import type { TileStatus } from "./MapCanvas";

interface Props {
  open: boolean;
  onClose(): void;
  layers: {
    tiles: boolean; ghost: boolean; arrows: boolean; uncert: boolean; labels: boolean; markers: boolean;
  };
  onLayer(k: "tiles" | "ghost" | "arrows" | "uncert" | "labels" | "markers", v: boolean): void;
  tileStatus: TileStatus;
}

const LINE = (color: string, dash = false) => (
  <svg viewBox="0 0 40 12" width="40" height="12">
    <path d="M2 6 H38" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeDasharray={dash ? "5 4" : undefined} fill="none" />
  </svg>
);

export default function LegendPanel({ open, onClose, layers, onLayer, tileStatus }: Props) {
  if (!open) return null;
  return (
    <section className="legend card-pop" aria-label="Шартты белгілер">
      <div className="lg-head">
        <h3>Шартты белгілер</h3>
        <button onClick={onClose} aria-label="Жабу">✕</button>
      </div>

      <div className="lg-sec">
        <div className="lg-cap">Тараптар мен қозғалыс</div>
        {(["kk", "dj", "civ", "ru"] as const).map((s) => (
          <div className="lg-row" key={s}>
            <span className="lg-swatch" style={{ background: SIDE_COLOR[s] }} />
            <span className="lg-txt">{SIDE_LABEL[s]}</span>
            <span className="lg-line">{LINE(SIDE_COLOR[s], s === "civ")}</span>
          </div>
        ))}
      </div>

      <div className="lg-sec">
        <div className="lg-cap">Сызықтар</div>
        <div className="lg-row"><span className="lg-line">{LINE(C.goldBright)}</span><span className="lg-txt">нақты сызылып жатқан қозғалыс</span></div>
        <div className="lg-row"><span className="lg-line">{LINE("#8c7a4d", true)}</span><span className="lg-txt">бағыттың толық жолы (шартты «арқа»)</span></div>
        <div className="lg-row"><span className="lg-ar">❯</span><span className="lg-txt">жорық бағыты (жебелер)</span></div>
      </div>

      <div className="lg-sec">
        <div className="lg-cap">Нүктелік белгілер</div>
        <div className="lg-row"><span className="mk mk-demo mk--battle mk--kk"><span className="mk-dot"><i>⚔</i></span></span><span className="lg-txt">шайқас</span></div>
        <div className="lg-row"><span className="mk mk-demo mk--fallen mk--dj"><span className="mk-dot"><i>⚑</i></span></span><span className="lg-txt">басып алынған / құлаған қала</span></div>
        <div className="lg-row"><span className="mk mk-demo mk--curultai mk--kk"><span className="mk-dot"><i>⚖</i></span></span><span className="lg-txt">құрылтай / жиын</span></div>
        <div className="lg-row"><span className="mk mk-demo mk--city mk--civ"><span className="mk-dot"><i>▣</i></span></span><span className="lg-txt">тарихи қала, қоныс</span></div>
        <div className="lg-row"><span className="mk mk-demo mk--fort mk--ru"><span className="mk-dot"><i>▤</i></span></span><span className="lg-txt">бекініс (ресей сызығы)</span></div>
        <div className="lg-row"><span className="mk mk-demo mk--camp mk--dj"><span className="mk-dot"><i>⛺</i></span></span><span className="lg-txt">орда, қыстау, аймақ</span></div>
        <div className="lg-row"><span className="lg-dash">◌</span><span className="lg-txt">еркін сызылған шеңбер — «мұнда шамамен» деген ықтималдық аймағы</span></div>
      </div>

      <div className="lg-sec">
        <div className="lg-cap">Дерек дәлдігі</div>
        <div className="lg-row"><span className="cert cert-confirmed">нақты</span><span className="lg-txt">заманауи нысан координаты тексерілген</span></div>
        <div className="lg-row"><span className="cert cert-approximate">шамамен ≈</span><span className="lg-txt">сипаттамаға сүйенген жуық нүкте</span></div>
        <div className="lg-row"><span className="cert cert-debated">талас ±?</span><span className="lg-txt">орны/жылы ғылыми талқыда</span></div>
      </div>

      <div className="lg-sec">
        <div className="lg-cap">Қабаттар</div>
        {[
          ["tiles", "Әкімшілік қабат — облыстар (KZ ADM1)"],
          ["labels", "Жер-су атаулары"],
          ["ghost", "Бағыттардың толық жолы"],
          ["arrows", "Бағыт жебелері"],
          ["uncert", "Нақтысыздық шеңберлері"],
          ["markers", "Оқиға маркерлері"],
        ].map(([k, t]) => (
          <label className="lg-sw" key={k}>
            <input type="checkbox" checked={layers[k as never]} onChange={(e) => onLayer(k as never, e.target.checked)} />
            <span className="sw" aria-hidden />
            <span className="lg-txt">{t}</span>
          </label>
        ))}
        <div className="lg-note">
          {tileStatus === "online" && "● ADM1 қабаты қосулы — карта негізі: ұсынылған файлдағы облыс шекаралары (интернет талап етілмейді)."}
          {tileStatus === "loading" && "◐ карта қабаттары дайындалуда…"}
          {tileStatus === "blocked" && "○ негізгі қабат оқылмады — таза атлас-режим (Natural Earth)."}
          {tileStatus === "off" && "○ облыс қабаты сөндірулі — таза атлас-режим."}
        </div>
      </div>

      <div className="lg-foot">
        Өзен/тау сызықтары мен XVIII ғ. Арал шекарасы — <b>схема</b>; тарихи маршруттар — жазба
        деректерге негізделген <b>жуық сызба</b>, нақты жорық жолдары емес.
      </div>
    </section>
  );
}

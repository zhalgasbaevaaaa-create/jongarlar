import type { SourceRec } from "./types";

export const SOURCES: Record<string, SourceRec> = {
  levshin: {
    id: "levshin",
    kind: "book",
    title: "А. И. Левшин. «Қырғыз-қайсақ, не қырғыз-қайсақ, не қазақ-қырғыз ордаларының және Жоңғарияның қысқаша тарихы» (1832)",
    cite: "Левшин А.И. История киргиз-кайсацких орд и Джунгарии. — СПб., 1832 (қайта басылымдары бар).",
    note: "1723 ж. жоңғар үстеуінің «жеті баған» туралы баяны, жоңғар әкімшілігі туралы алғашқы орыс тілді жинақтау. Шеттен жазылғандықтан барлық сандары жуық.",
  },
  valikhanov_dz: {
    id: "valikhanov_dz",
    kind: "book",
    title: "Ш. Уәлиханов. «Жоңғарияның қысқаша ұйымдастырылу тарихы» (1860)",
    cite: "Уалиханов Ч.Ч. Собрание сочинений, т. 1 — жоңғарлардың 1630–50 жж. оқиғалары мен Орбұлақ аңызы (Жетісу, Іле бойы нұсқасы).",
    note: "XVII ғ. шайқастарының даталары мен аңыздарының ерте жинақталған нұсқасы.",
  },
  ehistory_kz: {
    id: "ehistory_kz",
    kind: "article",
    title: "«Қазақ-жоңғар қатынастары XVIII ғ. басында» (e-history.kz)",
    cite: "e-history.kz сайтындағы оқу материалы: Салқам Жәңгір ханның 1635/1643/1652 жж. шайқастары; Тәуке (1680–1715/18) кезеңі.",
    url: "https://e-history.kz/media/scorm/377/text/text.htm",
  },
  kkwiki_joq_1698: {
    id: "kkwiki_joq_1698",
    kind: "wiki",
    title: "kk.wikipedia — «Жоңғар шапқыншылығы» мақаласы",
    cite: "1698 ж. Тәуке ханның ойраттар мен Еділ қалмақтарына соққы беруі; 1710 ж. Қарақұм құрылтайы; 1710 ж. Бөгенбайның бас қолбасшы болуы.",
    url: "https://kk.wikipedia.org/wiki/Жоңғар_шапқыншылығы",
    note: "Уикипедия — бастапқы дерек емес, жинақтаушы; даталар бастапқы деректерде талқылы.",
  },
  kkwiki_tauke: {
    id: "kkwiki_tauke",
    kind: "wiki",
    title: "kk.wikipedia — «Тәуке хан»",
    cite: "1698–1703, 1708, 1709–1710, 1712 жж. соғыстар кестесі; билік жылдарының нұсқалары.",
    url: "https://kk.wikipedia.org/wiki/Тәуке_хан",
  },
  kkwiki_bogenbai: {
    id: "kkwiki_bogenbai",
    kind: "wiki",
    title: "kk.wikipedia — «Бөгенбай батыр»",
    cite: "Батыр толғаулары желісі: Айлақыға жорық, Аңырақай, «Шуно-Дабо» жекпе-жегі.",
    url: "https://kk.wikipedia.org/wiki/Бөгенбай_батыр",
    note: "Толғаулар — әдеби-тарихи мұра; даталары нақты емес.",
  },
  kkwiki_aqtaban: {
    id: "kkwiki_aqtaban",
    kind: "wiki",
    title: "kk.wikipedia — «Ақтабан шұбырынды, Алқакөл сұлама»",
    cite: "1723–1727 апаты: Левшиннің 7 баған баяны, қолбасшы есімдері, Түркістан/Сайрам/Ташкенттің алынуы, Самарқан-Ходжент бағытындағы қоныс.",
    url: "https://kk.wikipedia.org/wiki/Ақтабан_шұбырынды,_Алқакөл_сұлама",
  },
  kkwiki_ordabasy: {
    id: "kkwiki_ordabasy",
    kind: "wiki",
    title: "kk.wikipedia — «Ордабасы құрылтайы»",
    cite: "1726 ж. күз, Бадам бойындағы Ордабасы; Әбілқайырдың бас қолбасшы болуы; «1727 ж. Бұланты-Білеуті, 1729–30 жж. Аңырақай» шайқастарының кестесі.",
    url: "https://kk.wikipedia.org/wiki/Ордабасы_құрылтайы",
  },
  kkwiki_bulan: {
    id: "kkwiki_bulan",
    kind: "wiki",
    title: "kk.wikipedia — «Бұланты шайқасы»",
    cite: "Бұланты өзенінің оң жағасы, Қарасиыр (Байқоңыр ақылынан оңт.-батысқа 20 км; 1998, 2007, 2015 жж. экспедициялары); 1727/1728 ж. нұсқалар; Артықбаев Ж.О. зерттеуі (1998).",
    url: "https://kk.wikipedia.org/wiki/Бұланты_шайқасы",
  },
  abai_bulan: {
    id: "abai_bulan",
    kind: "article",
    title: "«Бұланты шайқасы – бірліктің үлгісі» (abai.kz)",
    cite: "1728 ж. Ұлытау етегіндегі Қарасиыр шайқасы туралы шолу.",
    url: "https://abai.kz/post/122240",
  },
  ruwiki_anyraqay: {
    id: "ruwiki_anyraqay",
    kind: "wiki",
    title: "ru.wikipedia — «Аныракайское сражение»",
    cite: "1730 ж. сәуір соңы; І.В. Ерофееваның экспедициялық реконструкциясы (үш жиналу бағыты: Сарыарқа, Оңтүстік, Балқаштың оңтүстік-батыс жағасы); ескертпе: Аңырақай туралы ең ерте жазба — А. Диваев жазған 1905 ж. аңыз.",
    url: "https://ru.wikipedia.org/wiki/Аныракайское_сражение",
  },
  kkwiki_anyrakay: {
    id: "kkwiki_anyrakay",
    kind: "wiki",
    title: "kk.wikipedia — «Аңырақай шайқасы»",
    cite: "1729 ж. (кей деректе 1730); Балқаш–Оғар даласы–Шу–Құрты аралығы; 40–45 күндік шайқас; Аягөз бен Шарға қарай шегіну; Хантау/Сұңқар тауы бас қосуы.",
    url: "https://kk.wikipedia.org/wiki/Аңырақай_шайқасы",
  },
  abai_ani: {
    id: "abai_ani",
    kind: "article",
    title: "«Аңырақай шайқасына – 290 жыл!» (abai.kz)",
    cite: "1726 ж. күз Ордабасы мәжілісі; Әбілқайырдың 1726 ж. соңы–1727 ж. Торғай даласындағы жеңістері туралы нұсқа.",
    url: "https://abai.kz/post/112622",
  },
  kazgazeta_dalatau: {
    id: "kazgazeta_dalatau",
    kind: "article",
    title: "«Далатау қалай Аңырақай аталды?» (aqiqat.kazgazeta.kz)",
    cite: "1729 ж. шайқас орны — Далатау/Хантау/Ақсүйек сайы аймағы, Алматыдан ~200 км; «Ітішпес-Алакөл» топонимі.",
    url: "https://aqiqat.kazgazeta.kz/news/12792",
  },
  egemen_khan: {
    id: "egemen_khan",
    kind: "article",
    title: "«Хан мен халық» — Egemen Qazaqstan (2026)",
    cite: "Шарыш өлімі (1742 ж. ойрат елшілерінің хабары), Абылайдың тұтқынға түсуі, 1741 ж. көктемгі шайқас туралы мұрағаттық дерек сілтемесі.",
    url: "https://egemen.kz/news/article13377-khan-men-khalyq",
  },
  kkwiki_abylai: {
    id: "kkwiki_abylai",
    kind: "wiki",
    title: "kk.wikipedia — «Абылай хан»",
    cite: "1740 ж. Орынборға 120 сұлтанмен барып Ресей боданын қабылдау; 1741 ж. жоңғар жорығы мен тұтқын; 1743 ж. 5 қыркүйекте босатылу; 1756–57 жж. цинмен шайқас/бітім нұсқасы.",
    url: "https://kk.wikipedia.org/wiki/Абылай_хан",
  },
  inform_abylai: {
    id: "inform_abylai",
    kind: "article",
    title: "«Абылай хан» — ҚазАқпарат",
    cite: "1738–41 жж. шайқастар; 1742 ж. тұтқынға түсу; Төле би бастаған 90 адам елшілігі; 1743 ж. 5 қыркүйек — бостандық.",
    url: "https://kaz.inform.kz/news/abylay-han_a2182939/",
  },
  inform_amanat: {
    id: "inform_amanat",
    kind: "article",
    title: "«Перзентін жауға аманатқа берген Әбілмәмбет хан» — ҚазАқпарат",
    cite: "1742 ж. күз Әбілпейіз бен Нияз батыр ұлының аманатқа берілуі; 1743 ж. Абылайдың босатылуы; «екінші Ақтабан» туралы сипаттама; Әбілмәмбеттің 1770/71 ж. қайтыс болуы.",
    url: "https://kaz.inform.kz/news/perzentin-zhauga-amanatka-bergen-abilmambet-han_a2831306/",
  },
  kkwiki_zhungar_state: {
    id: "kkwiki_zhungar_state",
    kind: "wiki",
    title: "kk.wikipedia — «Жоңғар хандығы»",
    cite: "Циннің 1755/56/57 жж. шабуылдары, хандықтың жойылуы; Амырсана көтерілісі; жоңғар халқының басына түскен апат.",
    url: "https://kk.wikipedia.org/wiki/Жоңғар_хандығы",
  },
  kkwiki_torghut: {
    id: "kkwiki_torghut",
    kind: "wiki",
    title: "kk.wikipedia — «Торғауыттар»",
    cite: "Торғауыт (қалмақ) хандығының тарихы, 1771 ж. Ілеге қарай жаппай көші.",
    url: "https://kk.wikipedia.org/wiki/Торғауыттар",
  },
  school_kz: {
    id: "school_kz",
    kind: "book",
    title: "Мектеп оқулықтары: «Қазақстан тарихы» (5–7 сынып) және БҰТ дайындық жинақтары",
    cite: "Апта мен шайқастардың мектеп кестесі: 1723; Бұланты — 1726/1728; Аңырақай — 1729/1730; Малдымода — 1743.",
    note: "Оқулық даталары ғылыми талқылауды қорытындылайды, нақтыландыруларға ашық.",
  },
  aybyn_anyrakay: {
    id: "aybyn_anyrakay",
    kind: "book",
    title: "«Айбын» энциклопедиясы / «Қазақстан» Ұлттық энциклопедиясы",
    cite: "Аңырақай, Бұланты, Ақтабан, Айлақы т.б. мақалалардың даталық нұсқалары.",
  },
};

export const DATA_LICENSES: { title: string; url: string; terms: string }[] = [
  {
    title: "Карта негізі — Қазақстан әкімшілік шекаралары (ADM1, 17 бірлік)",
    url: "https://github.com/zhalgasbaevaaaa-create/jongarlar",
    terms: "Пайдаланушы ұсынған kz_1.json (KAZ_adm, DIVA-GIS үлгісіндегі ашық әкімшілік шекаралар жиыны) негізгі карта қабаты ретінде қолданылды; ~111 м дәлдікке жалпылап, сыртқы шекара / облыс шекаралары / облыс атаулары бөлек қабаттарға бөлінді. Сыртқы тайл-серверлер (OpenStreetMap/CARTO) енді мүлдем жүктелмейді — карта толық офлайн.",
  },
  {
    title: "OpenStreetMap деректері",
    url: "https://www.openstreetmap.org/copyright",
    terms: "ODbL 1.0 — көзді көрсету міндетті, туынды дерек осымен лицензияланады.",
  },
  {
    title: "Жер-су сызықтары (офлайн қабат) — Natural Earth 1:50m (world-atlas арқылы)",
    url: "https://www.naturalearthdata.com / https://github.com/topojson/world-atlas",
    terms: "Natural Earth — Public Domain. world-atlas — ISC/CC0 (Natural Earth негізі). Ешқандай рұқсат қажет етпейді.",
  },
  {
    title: "Кarta қаріп глифтері — MapLibre demotiles «Noto Sans Regular»",
    url: "https://demotiles.maplibre.org",
    terms: "MapLibre демо ресурстары мен Noto қаріптері (OFL/Apache) — бекер. Жүктеліп, локальді ұсынылады.",
  },
  {
    title: "UI қаріптері — PT Sans / PT Serif (ParaType)",
    url: "https://fonts.google.com/specimen/PT+Sans",
    terms: "SIL Open Font License — бекер, өзгерту-таратуға рұқсат (лицензия мәтінімен бірге).",
  },
  {
    title: "Кітапханалар",
    url: "https://maplibre.org · https://threejs.org · https://turfjs.org",
    terms: "MapLibre GL JS (BSD-3/ISC), three.js (MIT), @turf (MIT) — барлығы бекер, ашық лицензиялы.",
  },
];

/**
 * Нақтысыздық реестрі: картаға қойылған әр нүктенің дәлдігі.
 * «talas» — ғылыми пікірталас; «шамамен» — жалпылама сипаттама; «нақты» — заманауи координат тексерілген.
 */
export const CERTAINTY_LEGEND = {
  confirmed: { label: "Нақты координат", desc: "Заманауи қала/нысан бойынша тексерілген (OSM/Nominatim, 2026-10)." },
  approximate: { label: "Шамамен", desc: "Жалпылама сипаттама; нақты нүкте емес, аймақ белгісі. Бағыт сызықтары — шартты." },
  debated: { label: "Талас", desc: "Ғылыми әдебиетте датасы/орны бір тоқтамда емес; карта кең ықтималдық шеңберімен көрсетеді." },
} as const;

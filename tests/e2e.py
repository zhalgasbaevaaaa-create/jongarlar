"""E2E v2: оқиға ауысулары, анимация, субтитр, нақтысыздық сызықтары, камера, sync."""
import json, re, sys
from playwright.sync_api import sync_playwright

URL = __import__("os").environ.get("ATLAS_URL", "http://127.0.0.1:4173/")
RESULTS = []
def ok(name, cond, extra=""):
    RESULTS.append((name, bool(cond), extra))
    print(("✓ PASS" if cond else "✗ FAIL"), name, ("— " + str(extra)[:260]), flush=True)

ARGS = ["--no-sandbox", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"]

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, args=ARGS)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, locale="kk-KZ")
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    page.goto(URL, wait_until="load", timeout=45000)
    page.wait_for_selector(".intro h1", timeout=15000)
    page.click(".btn-primary")
    page.wait_for_selector(".map-host canvas", timeout=20000)
    page.wait_for_timeout(1200)
    ok("map canvas rendered", page.evaluate("!!document.querySelector('.map-host canvas')"))
    ok("atlas handle exposed", page.evaluate("!!window.__atlas"))
    ch = page.evaluate("document.querySelector('.map-host canvas').getBoundingClientRect().height")
    ok("canvas has full viewport height (fit math valid)", ch > 800, f"canvas h={ch}")

    # ── A. Барлық 10 оқиға ауысуы + per-event route деректері ──
    events = json.loads(page.evaluate("""JSON.stringify([...document.querySelectorAll('.chip')].map(c => ({
        year: c.querySelector('.chip-year').textContent, title: c.querySelector('.chip-title').textContent })))"""))
    ok("timeline: 10 event buttons", len(events) == 10)
    per = []
    good = 0
    for i in range(10):
        page.click(f".chip[data-i='{i}']")
        page.wait_for_timeout(2600)
        st = page.evaluate("""(() => {
          const m = window.__atlas;
          const st = window.__atlasState || {};
          return {
            mk: document.querySelectorAll('.mk').length,
            shown: document.querySelectorAll('.mk.is-in').length,
            ghost: st.ghost || 0,
            liveN: st.live || 0,
            moving: m.isMoving() || true,
            title: document.querySelector('.ep-title').textContent,
            cap: document.querySelector('.capbar .cap-text b')?.textContent || '',
            hasUnc: (st.liveUnc || 0) > 0,
            routeIds: (window.__atlasState || {}).routeIds || "",
            layerApprox: !!m.getLayer('route-live-approx'),
            layerDeb: !!m.getLayer('route-live-debated'),
          };
        })()""")
        ok_cond = st["mk"] > 0 and st["ghost"] > 0 and st["cap"] and st["layerApprox"] and st["layerDeb"]
        good += 1 if ok_cond else 0
        per.append((events[i]["year"], st))
    ok("all 10 transitions: markers + own route data + caption + unc layers", good == 10,
       " | ".join(f"{y}:mk{s['mk']},ghost{s['ghost']}" for y, s in per[:4]))
    ids_sets = [st.get("routeIds", "") for _, st in per]
    ok("per-event route sets unique (no shared generic route)", len(set(ids_sets)) == 10 and all(ids_sets),
       f"unique={len(set(ids_sets))}/10")
    allids = [x for j in ids_sets for x in j.split("+") if x]
    ok("no route id reused across events", len(allids) == 51 and len(set(allids)) == 51, f"{len(allids)} ids, {len(set(allids))} unique")

    # ── B. Камера smooth ауысуы: нақты өлшеу ──
    def bounds():
        return page.evaluate("(() => {const b = window.__atlas.getBounds(); return [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()]})()")
    b0 = tuple(bounds())
    page.click(".chip[data-i='0']")
    samples = [b0]
    for _ in range(16):
        page.wait_for_timeout(230)
        v = tuple(bounds())
        samples.append(v)
        if len(samples) >= 4 and v == samples[-2] == samples[-3]:
            break
    distinct = len(set(samples))
    ok("camera animates to new event over multiple frames (no hard jump)", distinct >= 3 and samples[-1] != b0,
       f"{distinct} distinct camera frames, settled={samples[-1] != b0}")

    # ── C. Субтитр кезеңмен ауысады (әр қимылға жеңіл түсіндірме) ──
    page.click(".chip[data-i='6']")  # Аңырақай — 3 кезең, 5 бағыт
    page.wait_for_timeout(500)
    cap1 = page.inner_text(".capbar .cap-text b") if page.is_visible(".capbar") else ""
    ok("caption appears during animation", len(cap1) > 8, cap1[:70])

    def seek_and_cap(v):
        page.evaluate("""(v) => {
          const bar = document.querySelector('.tl-scrub'); const r = bar.getBoundingClientRect();
          bar.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, pointerId: 2, isPrimary: true, clientX: r.left + r.width*v, clientY: r.top+5}));
          bar.dispatchEvent(new PointerEvent('pointerup', {bubbles:true, pointerId: 2}));
        }""", v)
        page.wait_for_timeout(250)
        return page.inner_text(".capbar .cap-text b") if page.is_visible(".capbar") else "-"

    # кезеңдердің ортасына дәйекті seek — әр қимылдың өз түсіндірмесі шығуы керек
    caps = []
    for v in (0.06, 0.18, 0.40, 0.55, 0.72, 0.93):
        caps.append(seek_and_cap(v))
    ok("each phase has its own caption (seek-probed)", len(set([c for c in caps if c != "-"])) >= 3, f"labels: {[c[:24] for c in caps]}")
    seek_and_cap(0.42)  # I кезең іші: 3 бағыт кезекпен ауысуы керек
    rot1 = page.inner_text(".capbar .cap-text b")
    page.wait_for_timeout(3300)
    rot2 = page.inner_text(".capbar .cap-text b")
    ok("within one phase, movements' captions rotate", rot1 != rot2, f"'{rot1[:26]}' → '{rot2[:26]}'")
    # running playback advances p wall-clock (fps-independent)
    page.click("button.tb[title='Қайта ойнату']")
    page.wait_for_timeout(1200)
    pA = page.evaluate("(window.__atlasState||{}).p || 0")
    page.wait_for_timeout(1600)
    pB = page.evaluate("(window.__atlasState||{}).p || 0")
    ok("animation clock follows elapsed time", pB - pA > 0.06, f"Δp={pB - pA:.3f} over 1.6s (expect ~0.11 at 1×)")
    unc_badge = page.evaluate("!!document.querySelector('.cap-unc')")
    ok("uncertain routes labelled in caption (≈/±?)", unc_badge)

    # ── D. Нақтысыз маршрут = үзік сызық: unc қасиеті layer сүзгіден өтеді ──
    dstyle = page.evaluate("""(() => {
      const m = window.__atlas;
      const approx = m.getLayer('route-live-approx');
      const deb = m.getLayer('route-live-debated');
      const live = m.getLayer('route-live');
      return {
        aFilter: JSON.stringify(m.getFilter('route-live-approx')),
        lFilter: JSON.stringify(m.getFilter('route-live')),
        dots: m.getLayoutProperty('route-live-debated', 'line-cap'),
        dash: JSON.stringify(m.getPaintProperty('route-live-approx', 'line-dasharray')),
        arrowOp: JSON.stringify(m.getPaintProperty('route-arrows', 'icon-opacity')),
      };
    })()""")
    ok("approx layer: dashed + filtered unc==1", "1" in dstyle["aFilter"] and "2.7" in dstyle["dash"], f"filter={dstyle['aFilter']} dash={dstyle['dash']}")
    ok("debated layer: dotted (round cap micro-dash)", dstyle["dots"] == "round" and "2" in dstyle["lFilter"] or "0" in dstyle["lFilter"])
    ok("arrows fade on uncertain routes", "unc" in dstyle["arrowOp"], dstyle["arrowOp"][:60])

    # ── E. Әр қимылдың жолы өз кезеңінде сызылады: head уақытпен жүреді ──
    page.wait_for_timeout(400)
    tr1 = page.evaluate("""(() => {
      const h = [...document.querySelectorAll('.head')].find(x => x.style.display !== 'none');
      return h ? h.style.transform : 'none';
    })()""")
    page.wait_for_timeout(700)
    tr2 = page.evaluate("""(() => {
      const h = [...document.querySelectorAll('.head')].find(x => x.style.display !== 'none');
      return h ? h.style.transform : 'none';
    })()""")
    ok("army head advances with elapsed time", tr1 != "none" and tr1 != tr2, f"{str(tr1)[:26]} → {str(tr2)[:26]}")

    # ── F. Таймлайн-анимация sync: үзіп, scrub-пен жылжытқанда сызық ұзарады ──
    page.evaluate("() => { if (document.querySelector('.tb-play').innerHTML.includes('rect')) document.querySelector('.tb-play').click(); }")
    page.wait_for_timeout(250)
    def live_len():
        return page.evaluate("(window.__atlasState.live || 0) * 1000 + (window.__atlasState.liveUnc || 0)")
    l1 = live_len()
    page.focus(".tl-scrub")
    for _ in range(10): page.keyboard.press("ArrowRight")
    page.wait_for_timeout(150)
    l2 = live_len()
    ok("timeline scrub drives route drawing (paused)", l2 > l1, f"live-metric {l1} → {l2}")
    cap_after = page.inner_text(".capbar .cap-text b") if page.is_visible(".capbar") else ""
    ok("caption follows scrub position", len(cap_after) > 10, cap_after[:50])

    # ── G. Жолдар соңына дейін: барлық кезең терезесі толса — marкерлердің бәрі is-in ──
    page.evaluate("""() => {
      const bar = document.querySelector('.tl-scrub');
      const r = bar.getBoundingClientRect();
      bar.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, pointerId: 1, isPrimary: true, clientX: r.left + r.width*0.995, clientY: r.top+5}));
      bar.dispatchEvent(new PointerEvent('pointerup', {bubbles:true}));
    }""")
    page.wait_for_timeout(400)
    end = page.evaluate("""(() => ({
      all: document.querySelectorAll('.mk').length,
      shown: document.querySelectorAll('.mk.is-in').length,
      hit: document.querySelectorAll('.mk.is-hit').length,
    }))()""")
    ok("at p≈1 all event markers revealed + battle pulses", end["shown"] == end["all"] and end["hit"] > 0, str(end))

    # ── H. Popup (JS арқылы басу — панель үстінен) ──
    page.evaluate("""() => { const el = document.querySelector('.mk--battle .mk-core'); el && el.click(); }""")
    page.wait_for_timeout(400)
    pop = page.evaluate("!!document.querySelector('.atlas-popup .pp')")
    ptxt = page.inner_text(".atlas-popup .pp") if pop else ""
    ok("battle marker popup with certainty note", pop and re.search("шамамен|талас|нақты|дәл", ptxt, re.I) is not None, ptxt[:70].replace("\n", " | "))
    page.keyboard.press("Escape")

    # ── I. Басқару: play/pause/replay/speed/режим ──
    page.click("button.tb[title='Қайта ойнату']"); page.wait_for_timeout(250)
    st_play = page.evaluate("document.querySelector('.tb-play').innerHTML.includes('rect')")
    page.click(".tb-play"); page.wait_for_timeout(250)
    st_after = page.evaluate("document.querySelector('.tb-play').innerHTML.includes('rect')")
    ok("pause/play icon toggles", st_play and not st_after, f"playing-icon before={st_play}, after={st_after}")
    page.click(".tb-play"); page.wait_for_timeout(200)
    ok("play again resumes", page.evaluate("document.querySelector('.tb-play').innerHTML.includes('rect')"))
    page.click("button.tb[title='Қайта ойнату']"); page.wait_for_timeout(350)
    w = page.evaluate("parseFloat(document.querySelector('.scrub-fill').style.width)")
    ok("replay resets", w < 5, f"{w}%")
    page.click(".tb-speed button:text-is('2×')")
    ok("speed 2× selected", page.evaluate("document.querySelector('.tb-speed button.on').textContent") == "2×")
    page.click(".tb-mode button:text-is('Толық жорық')")
    page.wait_for_timeout(2000)
    ticks = page.evaluate("document.querySelectorAll('.scrub-tick').length")
    ok("campaign mode with 10 ticks runs", ticks == 10)
    page.click(".tb-mode button:text-is('Оқиға')")

    # ── J. Панельдегі бағыт тізімі: caption + белсенді кезең highlighting ──
    page.click(".chip[data-i='4']"); page.wait_for_timeout(1500)
    caps = page.evaluate("""document.querySelectorAll('.erow-cap').length""")
    on_rows = page.evaluate("""document.querySelectorAll('.erow.on').length""")
    ok("panel lists per-movement captions", caps > 0, f"n={caps}")
    ok("active phase routes highlighted in panel", on_rows > 0, f"on={on_rows}")

    # ── K. Аңыз, тұлғалар, дереккөздер ──
    page.click(".top-actions button:text-is('Аңыз')")
    page.wait_for_selector(".legend"); ok("legend opens", True)
    page.click(".lg-head button")
    page.click(".top-actions button:text-is('Тұлғалар')")
    page.wait_for_selector(".fig-card")
    ok("21 figure profiles", page.evaluate("document.querySelectorAll('.fig-card').length") == 21)
    page.click(".modal-head button")
    page.click(".top-actions button:text-is('Дереккөздер')")
    page.wait_for_selector(".cert-table")
    ok("sources + uncertainty registry + licenses",
       page.evaluate("document.querySelectorAll('.src-list li').length") == 22
       and page.evaluate("document.querySelectorAll('.cert-table tbody tr').length") >= 8
       and page.evaluate("document.querySelectorAll('.lic-list li').length") >= 5)
    page.click(".modal-head button")

    # ── L. Тегістік Screenshots ──
    page.click(".chip[data-i='3']"); page.wait_for_timeout(3000)
    page.screenshot(path="tests/shot-desktop.png")
    ctx2 = browser.new_context(viewport={"width": 834, "height": 1112})
    t2 = ctx2.new_page(); t2.goto(URL, wait_until="load"); t2.wait_for_selector(".intro h1")
    t2.click(".btn-primary"); t2.wait_for_timeout(3500)
    t2.screenshot(path="tests/shot-tablet.png")
    ok("tablet: caption visible + canvas", t2.evaluate("!!document.querySelector('.map-host canvas')") and t2.is_visible(".capbar"))
    ctx3 = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    m = ctx3.new_page(); m.goto(URL, wait_until="load"); m.wait_for_selector(".intro h1")
    m.click(".btn-primary"); m.wait_for_timeout(3500)
    m.screenshot(path="tests/shot-mobile.png")
    mob = m.evaluate("""(() => {
      const cap = document.querySelector('.capbar'); const tl = document.querySelector('.timeline');
      const ep = document.querySelector('.epanel');
      return { capTop: cap?.getBoundingClientRect().top, tlTop: tl?.getBoundingClientRect().top,
               epW: ep?.getBoundingClientRect().width, vw: innerWidth, canvas: !!document.querySelector('.map-host canvas') };
    })()""")
    ok("mobile: caption under header, panel fits", mob["capTop"] > 40 and mob["capTop"] < mob["tlTop"] and mob["epW"] <= mob["vw"], json.dumps(mob))

    real = [e for e in errors if not re.search(r"tile|carto|net::|ERR_|Failed to load (resource|font)|status of 4|status of 0|Worker", e, re.I)]
    ok("no fatal page errors", len(real) == 0, (" ; ".join(real[:3]))[:200])
    browser.close()

fails = [r for r in RESULTS if not r[1]]
print("\n══════ ИТОГ: %d/%d passed ══════" % (len(RESULTS) - len(fails), len(RESULTS)))
for f in fails: print("  ✗", f[0], "—", f[2][:200])
sys.exit(1 if fails else 0)

/* This rAF loop is the only writer of the lid's transforms and clips, and writes the DOM directly: a reactive write per frame would re-render the hero and restart its transitions. */
import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { viewHeight } from '@/composables/useMediaQuery';
import { lidStrips } from '@/data/lidArt';
import { easeCamera, easeEmphasis, easeOutCubic, smoothstep } from '@/site/easing';
import { SCROLL_INPUTS } from '@/site/glide';
import { ENTRANCE, HERO, SCRUB, SEAM, SPLIT, figureSize, notchPolygon, registration, type Registration } from '@/site/lidSplitScene';
import { createCircuit, type Circuit, type StripBox, type Zone } from '@/site/lidCircuit';
import { token, tokenMs } from '@/site/tokens';

export interface LidSceneEls {
  runway: Ref<HTMLElement | null>;
  box: Ref<HTMLElement | null>;
  stage: Ref<HTMLElement | null>;
  mark: Ref<HTMLElement | null>;
  strips: Ref<HTMLElement[]>;
  arts: Ref<HTMLElement[]>;
  figures: Ref<HTMLElement[]>;
  circuit: {
    zones: Ref<SVGSVGElement | null>;
    wires: Ref<SVGSVGElement | null>;
    buses: Ref<SVGSVGElement | null>;
  };
  /** A pointer on the rail hex hovers no strip. */
  hex: () => HTMLElement | null;
  field: () => HTMLElement | null;
  tagButton: () => HTMLElement | null;
}

export interface LidSceneOpts {
  reduced: Readonly<Ref<boolean>>;
  hover: Readonly<Ref<boolean>>;
  narrow: Readonly<Ref<boolean>>;
  band: Readonly<Ref<number>>;
  /** Side column only: the lid lands full-width, scaled `k` about `ox`. */
  intro: Readonly<Ref<{ k: number; ox: number } | null>>;
  tones: string[];
  /** After each frame that changed something: reads here see the lid where the frame put it. */
  onFrame?: () => void;
}

const FOLLOW_MS = 55;
const HOVER_MS = 65;
const MAX_STEP_MS = 64;
/** The follower snaps to the scroll when this many lid heights behind. */
const FOLLOW_RESET = 3;
/** Clip polygons reach this many lid heights past their edge. */
const FAR = 3;
/** Of split progress. */
const OPEN_AT = 0.97;
/** Share of the visible height to scroll back before the rail flips back. */
const FLIP_REWIND = 0.06;
/** Slowest rise towards `SPLIT.clear`, px per px of scroll. */
const FAST_MIN = 0.29;
const MARK_PARALLAX = 0.18;
const MARK_PAN = 0.3;
/** Px: a page restored further down than this skips the entrance. */
const RESTORED_AT = 40;
/** Ms the entrance clock jumps ahead when skipped. */
const SKIP_BOOST = 8000;
const IN_VIEW_MARGIN = '20% 0px';
/** Share of its width a figure may spill past its strip's sides. */
const FIGURE_SPILL = '60%';
const SKIP_EVENTS = [...SCROLL_INPUTS, 'scroll'] as const;
/* The router's own scroll on arrival must not count as the reader skipping. */
const SKIP_SCROLL_AFTER = 300;
/** Px from the lid's visible foot to the tags button's top; `_OPEN` for reduced motion, where the split starts open. */
const TAGS_LIFT = HERO.rail + HERO.tagsButton + HERO.tagsGap;
const TAGS_LIFT_OPEN = SPLIT.clear + HERO.tagsButton + HERO.tagsGap;

/** Which strip a viewport x falls in, on the lid's rect. */
const stripAt = (x: number, r: DOMRect) => {
  const n = lidStrips.length;
  return Math.min(n - 1, Math.max(0, Math.floor((x - r.left) / (r.width / n))));
};

/* Module scope: the entrance plays once per page load. */
let arrived = false;

export function useLidSplitScene(els: LidSceneEls, opts: LidSceneOpts) {
  const n = lidStrips.length;
  const hovered = ref(-1);
  const open = ref(false);
  const pastPin = ref(false);
  const settled = ref(false);
  const badgeIn = ref(false);
  const scrubIndex = ref(-1);
  const scrubEnd = ref(false);
  const tagsReady = ref(false);

  const pinLen = computed(() =>
    opts.narrow.value ? SPLIT.pin + n * SCRUB.perFigure : SPLIT.pin,
  );

  let reg: Registration | null = null;
  let sizes: { w: number; h: number }[] = [];
  let runwayTop = 0;
  let fieldW = 0;
  let boxW = 0;
  let boxH = 0;
  let screenH = 0;
  let fieldAt = '';
  const origins: string[] = [];
  let follow: number | null = null;
  let lastNow: number | null = null;
  let sig: string | null = null;
  let hovSettled = true;
  let t0 = Infinity;
  let skipAt: number | null = null;
  let scrubKey: string | null = null;
  let tagOpacity = -1;
  let tagButton: HTMLElement | null = null;
  const hov = new Array<number>(n).fill(0);
  let px = -1;
  let py = -1;
  let tapped = -1;
  let raf = 0;
  let idle = 0;
  let mountedAt = 0;
  let inView = true;
  let io: IntersectionObserver | null = null;
  let circuit: Circuit | null = null;

  function panDuration(H: number, vh: number): number {
    const intro = opts.intro.value;
    if (opts.reduced.value) return 0;
    const d = Math.max(0, (intro ? H * intro.k : H) - vh);
    const ms = ENTRANCE.panBase + d * ENTRANCE.panPerPx;
    if (intro) return Math.round(Math.max(ENTRANCE.introMin, Math.min(ENTRANCE.introMax, ms)));
    return d < ENTRANCE.panMin ? 0 : Math.round(Math.min(ENTRANCE.camMax, ms));
  }

  function timeline(H: number, vh: number) {
    const seat = (n - 1) * ENTRANCE.stagger + ENTRANCE.dur + ENTRANCE.seat;
    const cam = panDuration(H, vh);
    const badgeAt = Math.max(seat, seat + cam - ENTRANCE.badgeLead);
    return {
      camAt: seat,
      cam,
      badgeAt,
      badgeEnd: badgeAt + ENTRANCE.badge,
      stripsEnd: Math.max(seat, (n - 1) * ENTRANCE.stagger + ENTRANCE.dur * ENTRANCE.settleSpan),
    };
  }

  function measure(): void {
    const box = els.box.value;
    const runway = els.runway.value;
    if (!box || !runway) return;
    boxW = box.clientWidth;
    boxH = box.clientHeight;
    screenH = viewHeight();
    const pw = boxW / n;
    const r = registration(pw, boxH, n);
    reg = r;
    sizes = lidStrips.map((s) => figureSize(s, r));
    runwayTop = runway.getBoundingClientRect().top + window.scrollY;
    fieldW = els.field()?.offsetWidth ?? 0;
    for (const img of els.arts.value) {
      Object.assign(img.style, {
        left: `${r.ax}px`,
        top: `${r.oyRest}px`,
        width: `${r.aw}px`,
        height: `${r.ah}px`,
        transformOrigin: '0 0',
      });
    }
    els.figures.value.forEach((el, i) => {
      el.style.width = `${sizes[i].w}px`;
      el.style.height = `${sizes[i].h}px`;
    });
    sig = null;
    frame(performance.now());
    wake();
  }

  /** `t` runs 0 to 1 across the fade. */
  function fadeTags(t: number, red: boolean, focused: Element | null): void {
    const btn = els.tagButton();
    const fade = !settled.value ? 0 : Math.max(0, Math.min(1, 1 - t));
    /* Keyboard focus keeps the button, not the tags: Tab scrolls it into view, which would otherwise fade it from under the key. */
    const held = !!btn && focused === btn && btn.matches(':focus-visible');
    const bOp = held && settled.value ? 1 : fade;
    if (btn && (bOp !== tagOpacity || btn !== tagButton)) {
      tagOpacity = bOp;
      tagButton = btn;
      btn.style.opacity = bOp.toFixed(3);
      btn.style.visibility = bOp > 0 ? 'visible' : 'hidden';
      btn.style.pointerEvents = bOp > 0.5 ? 'auto' : 'none';
      btn.style.transform = bOp > 0.5 || red ? 'none' : 'scale(0.8)';
    }
    tagsReady.value = fade > 0.5;
  }

  function scrub(q: number): void {
    const span = SCRUB.to - SCRUB.from;
    const act =
      q > SCRUB.from && q < SCRUB.to
        ? Math.min(n - 1, Math.floor(((q - SCRUB.from) / span) * n))
        : -1;
    const end = q >= SCRUB.to;
    const key = `${act}|${end}`;
    if (key === scrubKey) return;
    scrubKey = key;
    scrubIndex.value = act;
    scrubEnd.value = end;
    els.figures.value.forEach((fig, i) => {
      fig.classList.toggle('is-named', !end && act === i);
      fig.classList.toggle('is-dim', !end && act >= 0 && act !== i);
      fig.classList.toggle('is-dark', end);
    });
  }

  function unscrub(): void {
    if (scrubKey === null) return;
    scrubKey = null;
    scrubIndex.value = -1;
    scrubEnd.value = false;
    for (const fig of els.figures.value) fig.classList.remove('is-named', 'is-dim', 'is-dark');
  }

  /** Returns false when nothing changed. */
  function frame(now: number): boolean {
    const box = els.box.value;
    if (!box || !reg || !els.strips.value.length) return false;
    /* All reads before the first write: a read after a write forces a second style pass. */
    const scrolled = window.scrollY;
    const hr = box.getBoundingClientRect();
    const pointer = opts.hover.value && settled.value;
    const hx = pointer ? els.hex()?.getBoundingClientRect() : undefined;
    const held = document.activeElement;

    const red = opts.reduced.value;
    const moving = red ? 0 : 1;
    const entranceOn = !red;
    const W = boxW;
    const H = boxH;
    const pw = W / n;
    const vh = Math.max(1, screenH - opts.band.value);

    const dt = Math.min(MAX_STEP_MS, Math.max(0, now - (lastNow ?? now)));
    lastNow = now;
    const raw = Math.max(0, scrolled - runwayTop);
    if (follow === null || Math.abs(raw - follow) > H * FOLLOW_RESET) follow = raw;
    follow += (raw - follow) * (1 - Math.exp(-dt / FOLLOW_MS));
    if (Math.abs(raw - follow) < 0.05) follow = raw;
    const sy = follow;

    const T = timeline(H, screenH);
    const boost = skipAt !== null ? smoothstep((now - skipAt) / ENTRANCE.skip) * SKIP_BOOST : 0;
    const t = now - t0 + boost;
    const ce = entranceOn && T.cam ? easeCamera((t - T.camAt) / Math.max(1, T.cam)) : 1;
    const intro = opts.intro.value;
    const zi = intro && entranceOn ? 1 - ce : 0;
    const kI = 1 + ((intro?.k ?? 1) - 1) * zi;
    if (zi > 0.001 && intro) {
      box.style.transformOrigin = `${intro.ox.toFixed(1)}px 0`;
      box.style.transform = `scale(${kI.toFixed(4)})`;
    } else if (box.style.transform) box.style.transform = '';
    const field = els.field();
    const fieldNext =
      zi > 0.001
        ? `translateX(${(-(fieldW + ENTRANCE.fieldSlide) * zi).toFixed(1)}px) scale(${(1 + ENTRANCE.fieldGrow * zi).toFixed(4)})`
        : '';
    if (field && fieldNext !== fieldAt) {
      field.style.transformOrigin = '100% 50%';
      field.style.transform = fieldNext;
      fieldAt = fieldNext;
    }

    const hv = Math.min(H, vh);
    const sp = Math.max(0, sy - Math.max(0, H - vh));
    const pinEnd = hv * pinLen.value;
    const sA = red ? hv * SPLIT.pin : sp <= pinEnd ? sp * (SPLIT.pin / pinLen.value) : sp - (pinEnd - hv * SPLIT.pin);
    const p = red ? 1 : smoothstep(sA / (hv * SPLIT.pin * SPLIT.doneAt));
    open.value = p >= OPEN_AT;
    const flipAt = hv * pinLen.value * SPLIT.doneAt;
    if (!pastPin.value && sp >= flipAt) pastPin.value = true;
    else if (pastPin.value && sp < flipAt - hv * FLIP_REWIND) pastPin.value = false;

    const span = Math.max(1, hv * pinLen.value * SPLIT.doneAt);
    const q = Math.min(1, sp / span);
    fadeTags(sp / Math.max(span * SCRUB.tagsFade, SCRUB.tagsFadeMin), red, held);
    if (opts.narrow.value && !red) scrub(q);
    else unscrub();

    const onHex = !!hx && hx.width > 0 && px >= hx.left && px <= hx.right && py >= hx.top && py <= hx.bottom;
    const inside = pointer && !onHex && px >= hr.left && px <= hr.right && py >= hr.top && py <= hr.bottom;
    const hoverI = inside ? stripAt(px, hr) : settled.value ? tapped : -1;
    hovered.value = hoverI;

    if (settled.value && hovSettled && sy === raw) {
      const next = `${sy}|${hoverI}|${W}|${H}|${red}`;
      if (next === sig) return false;
      sig = next;
    } else sig = null;

    /* The camera pans the stage. */
    const camY = entranceOn && T.cam ? (Math.max(0, (intro ? H * intro.k : H) - screenH) * (1 - ce)) / kI : 0;
    const stage = els.stage.value;
    if (stage) stage.style.transform = camY > 0.05 ? `translate3d(0,${(-camY).toFixed(2)}px,0)` : '';
    const vt = Math.min(H - 1, Math.max(0, -hr.top) / kI + camY);
    const vb = Math.max(vt + 1, Math.min(H, (screenH - hr.top) / kI + camY));
    const btn = els.tagButton();
    const btnTop = `${Math.round(Math.max(0, vb - (red ? TAGS_LIFT_OPEN : TAGS_LIFT)))}px`;
    if (btn && btn.style.top !== btnTop) btn.style.top = btnTop;

    const far = H * FAR;
    const ease = 1 - Math.exp(-dt / HOVER_MS);
    const pad = Math.max(SPLIT.pullMin, pw * SPLIT.pull);
    const slip = SPLIT.slip * (opts.narrow.value ? SPLIT.slipNarrow : 1);
    const stripW = pw * (1 + (SPLIT.overlapPct * n) / 100);
    const r = reg;
    const cur: StripBox[] = [];
    let still = true;

    els.strips.value.forEach((el, i) => {
      const strip = lidStrips[i];
      const size = sizes[i];
      if (!strip || !size) return;
      const up = i % 2 === 0;
      const inner = i > 0 && i < n - 1;
      const nd = Math.min(SPLIT.notchMax, Math.max(SPLIT.notchMin, pw * (strip.notchDepth ?? SPLIT.notchDepth)));
      const flip = !strip.notch && !up;

      const tIn = t - i * ENTRANCE.stagger;
      const ei = entranceOn ? easeEmphasis(tIn / ENTRANCE.dur) : 1;
      const entering = entranceOn && tIn < ENTRANCE.dur + ENTRANCE.seat;
      const beyond = nd + SPLIT.edgeClear;
      const dSeat = nd * (1 - easeOutCubic((tIn - ENTRANCE.dur) / ENTRANCE.seat));
      const travel = vb - vt + beyond;
      const introY = (up ? 1 : -1) * (1 - ei) * travel;
      /* The leading edge seats just past the view, clamped to the strip's own end so it still shows when the whole lid fits. */
      const edgeY = up ? Math.max(0, vt - beyond) : Math.min(H, vb + beyond);
      const edgeDir = up ? 1 : -1;
      const ec = entranceOn ? easeOutCubic(tIn / (ENTRANCE.dur * ENTRANCE.settleSpan)) : 1;
      const cz = 1 + ENTRANCE.settle * (1 - ec);
      const ccx = pw / 2;
      const ccy = up ? vt : vb;

      /* Each figure copies this matrix exactly: keep it one translate · scale about one origin. */
      const oy = H - hv / 2;
      const ox = inner ? pw / 2 : i === 0 ? 0 : pw;
      const sc = 1 - (inner ? SPLIT.shrinkInner : SPLIT.shrinkOuter) * p;
      const scale = `scale(${sc.toFixed(4)})`;
      const sD = Math.min(sA, hv * SPLIT.driftCap);
      let ty0 = sD * SPLIT.drift;
      if (up) {
        const sClear = Math.max(1, Math.min(SPLIT.clear / FAST_MIN, hv * SPLIT.pin * SPLIT.clearWithin));
        ty0 = -(sD <= sClear ? sD * (SPLIT.clear / sClear) : SPLIT.clear + (sD - sClear) * SPLIT.drift);
      }
      const ty = strip.flush ? Math.max(ty0, (H - oy) * (1 - sc)) : ty0;
      const origin = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`;
      if (origins[i] !== origin) {
        el.style.transformOrigin = origin;
        origins[i] = origin;
      }
      el.style.transform = `translate3d(0,${(ty + introY).toFixed(2)}px,0) ${scale}`;

      const target = !red && hoverI === i ? 1 : 0;
      hov[i] += (target - hov[i]) * ease;
      if (Math.abs(target - hov[i]) < 0.002) hov[i] = target;
      if (hov[i] !== target) still = false;
      const ins = (hov[i] * pad) / sc;
      const iL = i === 0 ? 0 : ins;
      const iR = i === n - 1 ? 0 : ins;

      /* Rising strips notch their foot, dropping ones their head. */
      const dSplit = entering ? 0 : nd * p;
      el.style.clipPath = entering
        ? notchPolygon({ y: edgeY, dir: edgeDir, width: stripW, depth: dSeat, far, profile: strip.notch, flip })
        : dSplit > 0.2
          ? notchPolygon({
              y: up ? H : 0,
              dir: up ? -1 : 1,
              width: stripW,
              depth: dSplit,
              far,
              profile: strip.notch,
              flip,
              map: ins > 0.2 ? ([x, y]) => [Math.min(pw - iR, Math.max(iL, x)), y] : undefined,
            })
          : ins > 0.2
            ? `inset(0 ${iR.toFixed(2)}px 0 ${iL.toFixed(2)}px)`
            : 'none';

      /* The art must sink at most `slip`, or the figure's painted hole shows. */
      const ka = 1 + SPLIT.artZoom * p;
      const kf = 1 + SPLIT.figureZoom * p;
      const u0 = r.ax + (strip.box[0] * n - i) * r.aw;
      const v0 = r.oyRest + strip.box[1] * r.ah;
      const hw = size.w / 2;
      const hh = size.h / 2;
      const artY = Math.min(sA * SPLIT.sink, slip, (ka - 1) * Math.max(1, v0 + hh - r.oyRest));

      const art = els.arts.value[i];
      if (art) {
        const ex = r.ax;
        const ey = r.oyRest;
        const ax = u0 + hw - ex;
        const ay = v0 + hh - ey;
        const settle =
          cz !== 1
            ? `translate(${(ccx - ex).toFixed(1)}px,${(ccy - ey).toFixed(1)}px) scale(${cz.toFixed(4)}) translate(${(ex - ccx).toFixed(1)}px,${(ey - ccy).toFixed(1)}px) `
            : '';
        const sink =
          artY || ka !== 1
            ? `translate3d(0,${artY.toFixed(2)}px,0) translate(${ax.toFixed(1)}px,${ay.toFixed(1)}px) scale(${ka.toFixed(4)}) translate(${(-ax).toFixed(1)}px,${(-ay).toFixed(1)}px)`
            : '';
        art.style.transform = (settle + sink).trim() || 'none';
      }

      const fig = els.figures.value[i];
      if (fig) {
        const grow =
          kf !== 1
            ? ` translate(${hw.toFixed(1)}px,${hh.toFixed(1)}px) scale(${kf.toFixed(4)}) translate(${(-hw).toFixed(1)}px,${(-hh).toFixed(1)}px)`
            : '';
        const settle =
          cz !== 1
            ? ` translate(${ccx.toFixed(1)}px,${ccy.toFixed(1)}px) scale(${cz.toFixed(4)}) translate(${(-ccx).toFixed(1)}px,${(-ccy).toFixed(1)}px)`
            : '';
        fig.style.transform = `translate3d(${(i * pw).toFixed(2)}px,${(ty + introY).toFixed(2)}px,0) translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px) ${scale} translate(${(-ox).toFixed(1)}px,${(-oy).toFixed(1)}px)${settle} translate(${u0.toFixed(2)}px,${v0.toFixed(2)}px)${grow}`;
        /* Top and foot only: a figure may cross its seam. */
        const cTop = Math.max(0, hh - (v0 + hh) / kf);
        const cBot = Math.max(0, size.h - (hh + (H - v0 - hh) / kf));
        fig.style.clipPath = entering
          ? notchPolygon({
              y: edgeY,
              dir: edgeDir,
              width: pw,
              depth: dSeat,
              far,
              profile: strip.notch,
              flip,
              ext: pw,
              map: ([x, y]) => [ccx + (x - ccx) / cz - u0, ccy + (y - ccy) / cz - v0],
            })
          : up && dSplit > 0.2
            ? notchPolygon({
                y: H,
                dir: -1,
                width: pw,
                depth: dSplit,
                far,
                profile: strip.notch,
                flip,
                ext: pw,
                map: ([x, y]) => [hw + (x - u0 - hw) / kf, y < -far / 2 ? cTop : hh + (y - v0 - hh) / kf],
              })
            : `inset(${cTop.toFixed(1)}px -${FIGURE_SPILL} ${cBot.toFixed(1)}px -${FIGURE_SPILL})`;
      }
      cur[i] = { x: i * pw + ox * (1 - sc), y: ty + oy * (1 - sc) + introY, w: pw * sc, h: H * sc, ei, travel };
    });
    hovSettled = still;

    const done =
      !entranceOn ||
      (t - T.badgeEnd > ENTRANCE.rest &&
        t - T.stripsEnd > ENTRANCE.rest &&
        (skipAt === null || now - skipAt > ENTRANCE.skip + ENTRANCE.skipTail));
    if (done && !settled.value) {
      settled.value = true;
      arrived = true;
      releaseSkip();
    }
    badgeIn.value = !entranceOn || t >= T.badgeAt;

    const seam = opts.narrow.value ? SEAM.narrow : SEAM.wide;
    const zones: Zone[] = cur.map((_, i) => ({
      x0: i === 0 ? -SEAM.overhang : i * pw + seam / 2,
      x1: i === n - 1 ? W + SEAM.overhang : (i + 1) * pw - seam / 2,
    }));
    circuit?.update({ cur, zones, H, p, sy, reduced: red, narrow: opts.narrow.value });

    const mark = els.mark.value;
    if (mark) {
      /* Leaves out the narrow scrub's hold, as the split does; with it the mark sinks onto the arrow. */
      const markY = sy - (sp - sA);
      mark.style.transform = `translate3d(-50%,${(-camY * MARK_PAN + markY * MARK_PARALLAX * moving).toFixed(2)}px,0)`;
    }
    opts.onFrame?.();
    return true;
  }

  /* Parks after two unchanged frames: every input that can change a frame must wake it. */
  const loop = (now: number) => {
    idle = frame(now) ? 0 : idle + 1;
    raf = (inView || !settled.value) && idle < 2 ? requestAnimationFrame(loop) : 0;
  };

  function wake(): void {
    if (raf || (!inView && settled.value)) return;
    idle = 0;
    lastNow = null;
    raf = requestAnimationFrame(loop);
  }

  function onTap(event: PointerEvent): void {
    if (event.pointerType === 'mouse' || opts.hover.value || opts.narrow.value) return;
    const box = els.box.value;
    const target = event.target as Element | null;
    sig = null;
    if (!box || !target || !box.contains(target) || target.closest('a, button')) {
      tapped = -1;
      wake();
      return;
    }
    const r = box.getBoundingClientRect();
    const i = stripAt(event.clientX, r);
    tapped = i === tapped ? -1 : i;
    wake();
  }

  watch([opts.narrow, opts.hover], () => {
    tapped = -1;
    sig = null;
  });

  watch([opts.reduced, opts.band, opts.intro], () => {
    sig = null;
    wake();
  });

  function onPointer(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    px = event.clientX;
    py = event.clientY;
    wake();
  }

  function onPointerOut(event: PointerEvent): void {
    if (event.relatedTarget) return;
    px = -1;
    py = -1;
    wake();
  }

  function onSkip(event: Event): void {
    if (settled.value || skipAt !== null) return;
    if (event.type === 'scroll' && performance.now() - mountedAt < SKIP_SCROLL_AFTER) return;
    skipAt = performance.now();
    sig = null;
    wake();
  }

  function releaseSkip(): void {
    for (const name of SKIP_EVENTS) window.removeEventListener(name, onSkip);
  }

  onMounted(() => {
    mountedAt = performance.now();
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerup', onTap, { passive: true });
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('focusin', wake);
    window.addEventListener('focusout', wake);
    document.addEventListener('pointerout', onPointerOut);
    const { zones, wires, buses } = els.circuit;
    if (zones.value && wires.value && buses.value) {
      circuit = createCircuit({ zones: zones.value, wires: wires.value, buses: buses.value }, opts.tones);
    }

    if (opts.reduced.value && !arrived && window.scrollY <= RESTORED_AT) {
      els.box.value?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: tokenMs('--dur-4'), easing: token('--ease-out') });
    }
    if (arrived || opts.reduced.value || window.scrollY > RESTORED_AT) t0 = -1e9;
    else {
      for (const name of SKIP_EVENTS) window.addEventListener(name, onSkip, { passive: true });
      const figures = els.figures.value.map((fig) => fig.querySelector('img'));
      const decoded = [...els.arts.value, ...figures].map((img) =>
        img instanceof HTMLImageElement ? img.decode().catch(() => undefined) : undefined,
      );
      Promise.race([
        Promise.all(decoded),
        new Promise((resolve) => setTimeout(resolve, ENTRANCE.decodeCap)),
      ]).then(() => {
        if (t0 !== Infinity) return;
        t0 = performance.now() + ENTRANCE.startDelay;
        sig = null;
      });
    }

    raf = requestAnimationFrame(loop);
    if (!('IntersectionObserver' in window) || !els.runway.value) return;
    io = new IntersectionObserver(
      (entries) => {
        const on = entries.some((e) => e.isIntersecting);
        if (on === inView) return;
        inView = on;
        circuit?.play(on);
        if (on) {
          sig = null;
          wake();
        }
      },
      { rootMargin: IN_VIEW_MARGIN },
    );
    io.observe(els.runway.value);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    io?.disconnect();
    circuit?.destroy();
    releaseSkip();
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('pointerup', onTap);
    window.removeEventListener('scroll', wake);
    window.removeEventListener('focusin', wake);
    window.removeEventListener('focusout', wake);
    document.removeEventListener('pointerout', onPointerOut);
  });

  return {
    hovered,
    open,
    pastPin,
    settled,
    badgeIn,
    pinLen,
    scrubIndex,
    scrubEnd,
    tagsReady,
    measure,
  };
}

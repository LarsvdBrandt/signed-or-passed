import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, FONT_SIGN, STAMP_IMPACT, STAMP_START, STROKE, colourOf} from '../constants';
import {SourceLine, clamp, useUnit} from '../components/common';
import {SplitFlapScene} from '../scenes/MotionScenes';
import type {Scene, SceneProps, VideoProps} from '../types';

/**
 * Kinetic typography (scene kind 'kinetic-text', visual {preset, text | lines[], accent?, background?, colour?,
 * accentColour?, ...per preset}). Register a preset in TEXT_PRESETS + schema/spec.schema.json ($defs/textPreset)
 * + docs/library/typography.md. Colours are read at render time so themes apply.
 */
export type TextProps = {v: any; scene: Scene; ctx: VideoProps; fg: string; bg: string; accent: string};

const BG: Record<string, () => string> = {
  paper: () => C.paper,
  board: () => C.board,
  ink: () => C.ink,
  stamp: () => C.stamp,
};

const onBg = (bg: string): string => (bg === C.paper || bg === C.greyLight ? C.board : C.paper);

export const linesOf = (v: any): string[] => {
  if (Array.isArray(v.lines) && v.lines.length) return (v.lines as unknown[]).map((l) => String(l ?? '')).slice(0, 6);
  return String(v.text ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
};

const norm = (w: string): string => w.toLowerCase().replace(/[.,!?;:"'()‘’“”]/g, '');

const accentSet = (v: any): Set<string> => {
  const a = v.accent;
  const list: string[] = Array.isArray(a) ? (a as unknown[]).map((x) => String(x)) : a ? String(a).split(/\s+/) : [];
  return new Set(list.map(norm).filter(Boolean));
};

const fitSize = (lines: string[], maxW: number, base: number, k = 0.56): number => {
  const longest = Math.max(1, ...lines.map((l) => l.length));
  return Math.min(base, maxW / (longest * k));
};

const ez = (f: number, a: number, b: number): number => interpolate(f, [a, Math.max(a + 1, b)], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

const words = (l: string): string[] => l.split(/\s+/).filter(Boolean);

const centre: React.CSSProperties = {justifyContent: 'center', alignItems: 'center'};

/* ------------------------------------------------------------------ presets */

/** typewriter: monospace characters appear at cps (default 18 per second) with a blinking block caret. */
const Typewriter: React.FC<TextProps> = ({v, fg}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const u = useUnit();
  const lines = linesOf(v);
  const cps = Math.max(2, Number(v.cps) || 18);
  const fs = fitSize(lines, width * 0.84, 72 * u, 0.62);
  let left = Math.max(0, Math.floor(((frame - 6) / fps) * cps));
  const total = lines.reduce((a, l) => a + l.length, 0);
  const done = left >= total;
  const caretOn = !done || Math.floor(frame / 15) % 2 === 0;
  let caretPlaced = false;
  return (
    <AbsoluteFill style={centre}>
      <div style={{width: width * 0.84, fontFamily: FONT_MONO, fontWeight: 500, fontSize: fs, lineHeight: 1.35, color: fg}}>
        {lines.map((l, i) => {
          const n = Math.min(l.length, left);
          left -= n;
          const showCaret = !caretPlaced && (n < l.length || i === lines.length - 1);
          if (showCaret) caretPlaced = true;
          return (
            <div key={i} style={{whiteSpace: 'pre', minHeight: fs * 1.35}}>
              {l.slice(0, n)}
              {showCaret ? <span style={{display: 'inline-block', width: fs * 0.55, height: fs * 1.05, marginLeft: 2 * u, verticalAlign: 'text-bottom', background: fg, opacity: caretOn ? 1 : 0}} /> : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** word-pop: words spring in one by one (stagger seconds optional); accent words in the accent colour. */
const WordPop: React.FC<TextProps> = ({v, scene, fg, accent}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const u = useUnit();
  const lines = linesOf(v);
  const acc = accentSet(v);
  const fs = fitSize(lines, width * 0.86, 110 * u, 0.6);
  const count = lines.reduce((a, l) => a + words(l).length, 0);
  const D = Math.max(1, scene.durationFrames);
  const stagger = Number(v.stagger) > 0 ? Number(v.stagger) * fps : Math.max(3, Math.min(10, (D * 0.5) / Math.max(1, count)));
  let k = 0;
  return (
    <AbsoluteFill style={centre}>
      <div style={{width: width * 0.86, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fs, lineHeight: 1.12, color: fg}}>
        {lines.map((l, i) => (
          <div key={i}>
            {words(l).map((w, j) => {
              const at = 6 + k * stagger;
              k++;
              const s = spring({frame: Math.max(0, frame - at), fps, config: {damping: 11, stiffness: 160}});
              const o = interpolate(frame, [at, at + 4], [0, 1], clamp);
              return (
                <span key={j} style={{display: 'inline-block', margin: `0 ${fs * 0.14}px`, transform: `translateY(${(1 - s) * fs * 0.5}px) scale(${0.4 + 0.6 * s})`, opacity: o, color: acc.has(norm(w)) ? accent : fg}}>
                  {w}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** highlighter-marker: a marker stroke (colour, default stamp) sweeps behind the accent words (default: the last line). */
const Highlighter: React.FC<TextProps> = ({v, fg}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const u = useUnit();
  const lines = linesOf(v);
  const acc = accentSet(v);
  const marker = colourOf(v.colour, C.stamp);
  const fs = fitSize(lines, width * 0.84, 96 * u, 0.58);
  let k = 0;
  return (
    <AbsoluteFill style={centre}>
      <div style={{width: width * 0.84, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fs, lineHeight: 1.25, color: fg, opacity: ez(frame, 0, 8)}}>
        {lines.map((l, i) => (
          <div key={i}>
            {words(l).map((w, j) => {
              const mark = acc.size ? acc.has(norm(w)) : i === lines.length - 1;
              if (!mark) {
                return (
                  <span key={j} style={{display: 'inline-block', margin: `0 ${fs * 0.12}px`}}>
                    {w}
                  </span>
                );
              }
              const a = 12 + k * 10;
              k++;
              const p = ez(frame, a, a + 12);
              return (
                <span key={j} style={{position: 'relative', display: 'inline-block', margin: `0 ${fs * 0.12}px`}}>
                  <span style={{position: 'absolute', left: -fs * 0.08, bottom: fs * 0.1, height: fs * 0.55, width: `calc(${p * 100}% + ${fs * 0.16 * p}px)`, background: marker, opacity: 0.55, transform: 'skewX(-8deg)'}} />
                  <span style={{position: 'relative'}}>{w}</span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** strike-then-correct: {wrong, right} (or lines[0], lines[1]): the wrong text is struck through, the right one drops in. */
const StrikeThenCorrect: React.FC<TextProps> = ({v, fg, bg, accent}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const u = useUnit();
  const lines = linesOf(v);
  const wrong = String(v.wrong ?? lines[0] ?? '');
  const right = String(v.right ?? lines[1] ?? '');
  const fs = fitSize([wrong, right], width * 0.8, 100 * u, 0.58);
  const p1 = ez(frame, 14, 26);
  const s2 = spring({frame: Math.max(0, frame - 32), fps, config: {damping: 12}});
  const strike = bg === C.stamp ? C.board : C.stamp;
  return (
    <AbsoluteFill style={{...centre, flexDirection: 'column'}}>
      <div style={{position: 'relative', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fs, color: fg, opacity: (1 - 0.45 * p1) * ez(frame, 0, 8)}}>
        {wrong}
        <div style={{position: 'absolute', left: -fs * 0.1, top: '50%', height: Math.max(6 * u, fs * 0.11), width: `calc(${p1 * 100}% + ${fs * 0.2 * p1}px)`, background: strike, transform: 'rotate(-3deg)', transformOrigin: 'left center'}} />
      </div>
      <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fs, color: accent, marginTop: fs * 0.3, opacity: frame >= 32 ? 1 : 0, transform: `scale(${s2}) rotate(${(1 - s2) * -6}deg)`}}>{right}</div>
    </AbsoluteFill>
  );
};

/** stamp-text: the text as a rubber stamp falling from scale 1.6 to 1 (timed like the PASSED stamp: sfx 'stamp' fits), short shake. */
const StampText: React.FC<TextProps> = ({v, bg}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const u = useUnit();
  const text = linesOf(v).join(' ').toUpperCase();
  const fs = fitSize([text], width * 0.66, 150 * u, 0.66);
  const col = colourOf(v.colour, bg === C.stamp ? C.board : C.stamp);
  const p = interpolate(frame, [STAMP_START, STAMP_IMPACT], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const scale = 1.6 - 0.6 * p;
  const o = frame < STAMP_START ? 0 : interpolate(frame, [STAMP_START, STAMP_START + 3], [0, 1], clamp);
  const t = frame - STAMP_IMPACT;
  const sh = t >= 0 && t < 10 ? Math.sin(t * 2.4) * (10 - t) * 1.6 * u : 0;
  const rot = Number.isFinite(Number(v.rotate)) && v.rotate !== null && v.rotate !== undefined ? Number(v.rotate) : -8;
  return (
    <AbsoluteFill style={{...centre, transform: `translate(${sh}px, ${-sh * 0.6}px)`}}>
      <div style={{transform: `rotate(${rot}deg) scale(${scale})`, opacity: o, border: `${Math.max(6 * u, fs * 0.09)}px solid ${col}`, outline: `${Math.max(2 * u, fs * 0.03)}px solid ${col}`, outlineOffset: fs * 0.07, padding: `${fs * 0.12}px ${fs * 0.3}px`, color: col, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fs, letterSpacing: fs * 0.04, lineHeight: 1, whiteSpace: 'nowrap'}}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

const NEON_OFF = new Set([9, 10, 13, 17, 18, 22]);

/** neon-flicker: a neon sign (colour, default stamp) that flickers on, with an occasional stutter; default background board. */
const NeonFlicker: React.FC<TextProps> = ({v}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const u = useUnit();
  const lines = linesOf(v);
  const col = colourOf(v.colour, C.stamp);
  const fs = fitSize(lines, width * 0.76, 120 * u, 0.58);
  const on = frame >= 8 && !NEON_OFF.has(frame) && !(frame > 40 && frame % 53 < 2);
  const glow = on ? `0 0 ${6 * u}px ${col}, 0 0 ${18 * u}px ${col}, 0 0 ${42 * u}px ${col}` : 'none';
  return (
    <AbsoluteFill style={centre}>
      <div style={{padding: `${fs * 0.25}px ${fs * 0.5}px`, border: `${5 * u}px solid ${on ? col : C.grey}`, borderRadius: fs * 0.35, boxShadow: on ? `0 0 ${24 * u}px ${col}, inset 0 0 ${18 * u}px ${col}` : 'none', textAlign: 'center'}}>
        {lines.map((l, i) => (
          <div key={i} style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: fs, lineHeight: 1.15, color: on ? C.paper : C.grey, textShadow: glow, opacity: on ? 1 : 0.5}}>
            {l}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** handwritten-reveal: the text in the signature font is written left to right (mask) and underlined; sfx 'pen' fits. */
const HandwrittenReveal: React.FC<TextProps> = ({v, bg}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const u = useUnit();
  const text = linesOf(v).join(' ');
  const fs = fitSize([text], width * 0.8, 200 * u, 0.42);
  const col = colourOf(v.colour, bg === C.ink ? C.paper : C.ink);
  const dur = Math.max(20, text.length * 2.2);
  const p = interpolate(frame, [8, 8 + dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const ul = ez(frame, 8 + dur, 18 + dur);
  return (
    <AbsoluteFill style={centre}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
        <div style={{fontFamily: FONT_SIGN, fontSize: fs, color: col, lineHeight: 1.3, padding: `${fs * 0.15}px ${fs * 0.25}px`, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}>{text}</div>
        <div style={{height: Math.max(4 * u, fs * 0.03), background: col, width: `${ul * 100}%`, marginTop: -fs * 0.15}} />
      </div>
    </AbsoluteFill>
  );
};

/** newspaper-spin: a front page spins in (masthead?, date?) with the text as the headline; default background board. */
const NewspaperSpin: React.FC<TextProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const u = useUnit();
  const headline = linesOf(v).join(' ').toUpperCase();
  const pw = Math.min(width * 0.62, height * 1.0);
  const ph = pw * 0.72;
  const p = interpolate(frame, [0, 24], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const push = interpolate(frame, [24, Math.max(25, scene.durationFrames)], [1, 1.06], clamp);
  const fs = Math.min(pw * 0.1, (pw * 0.9 * 2) / (Math.max(1, headline.length) * 0.6));
  return (
    <AbsoluteFill style={centre}>
      <div style={{width: pw, height: ph, background: C.paper, border: `${STROKE}px solid ${C.board}`, boxShadow: `${14 * u}px ${14 * u}px 0 ${C.grey}`, transform: `rotate(${(1 - p) * 720 - 3 * p}deg) scale(${(0.05 + 0.95 * p) * push})`, padding: pw * 0.04, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: pw * 0.06, textAlign: 'center', color: C.board, borderBottom: `${STROKE}px solid ${C.board}`, paddingBottom: pw * 0.01}}>{String(v.masthead || 'THE DAILY LEDGER')}</div>
        <div style={{fontFamily: FONT_MONO, fontSize: pw * 0.022, display: 'flex', justifyContent: 'space-between', color: C.grey, borderBottom: `2px solid ${C.board}`, padding: `${pw * 0.006}px 0`}}>
          <span>{String(v.date || '')}</span>
          <span>EXTRA</span>
        </div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fs, lineHeight: 1.02, color: C.board, textAlign: 'center', margin: `${pw * 0.03}px 0`}}>{headline}</div>
        <div style={{flex: 1, display: 'flex', gap: pw * 0.03}}>
          {[0, 1, 2].map((c) => (
            <div key={c} style={{flex: 1, display: 'flex', flexDirection: 'column', gap: pw * 0.014}}>
              {Array.from({length: 7}, (_, r) => (
                <div key={r} style={{height: pw * 0.012, background: C.greyLight, width: `${70 + ((r * 13 + c * 29) % 30)}%`}} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** split-flap: the departure-board scene (scene kind split-flap) with lines as rows (max 5 x 18 characters), accentRow?. */
const SplitFlapText: React.FC<TextProps> = ({v, scene, ctx}) => {
  const rows = linesOf(v)
    .map((l) => l.toUpperCase().slice(0, 18))
    .slice(0, 5);
  return <SplitFlapScene scene={{...scene, visual: {rows: rows.length ? rows : [' '], accentRow: v.accentRow}}} ctx={ctx} />;
};

/** scrolling-ticker: a news ticker band (label?, default LATEST) with the lines as items; title? above; position? centre | bottom; speed?. */
const ScrollingTicker: React.FC<TextProps> = ({v, fg}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const u = useUnit();
  const items = linesOf(v);
  const label = String(v.label || 'LATEST').toUpperCase();
  const text = (items.length ? items : ['...']).join('   ■   ') + '   ■   ';
  const fs = 56 * u;
  const bandH = fs * 1.8;
  const speed = (Number(v.speed) > 0 ? Number(v.speed) : 1) * 7 * u;
  const copyW = text.length * fs * 0.6;
  const raw = width * 0.3 - frame * speed;
  const off = raw > 0 ? raw : -(-raw % copyW);
  const y = v.position === 'bottom' ? height * 0.74 : height / 2 - bandH / 2;
  const titleO = ez(frame, 0, 10);
  return (
    <AbsoluteFill>
      {v.title ? (
        <div style={{position: 'absolute', left: width * 0.08, right: width * 0.08, top: y - 190 * u, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 84 * u, lineHeight: 1.05, color: fg, opacity: titleO}}>{String(v.title)}</div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: y, height: bandH, background: C.board, overflow: 'hidden', borderTop: `${STROKE}px solid ${C.board}`, borderBottom: `${STROKE}px solid ${C.board}`}}>
        <div style={{position: 'absolute', top: 0, left: off, height: bandH, display: 'flex', alignItems: 'center', whiteSpace: 'pre', fontFamily: FONT_MONO, fontWeight: 700, fontSize: fs, color: C.paper}}>
          <span>{text}</span>
          <span>{text}</span>
          <span>{text}</span>
          <span>{text}</span>
        </div>
        <div style={{position: 'absolute', left: 0, top: 0, height: bandH, display: 'flex', alignItems: 'center', padding: `0 ${28 * u}px`, background: C.stamp, color: C.paper, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fs * 0.8, letterSpacing: 2 * u}}>{label}</div>
      </div>
    </AbsoluteFill>
  );
};

/** quote-card: a card with a big quotation mark, the text word by word, speaker? and status? (disputed = DISPUTED tag). */
const QuoteCard: React.FC<TextProps> = ({v, scene, accent}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const u = useUnit();
  const text = linesOf(v).join(' ');
  const ws = words(text);
  const cw = width * 0.76;
  const fs = Math.min(72 * u, (cw * 0.86 * 3) / (Math.max(1, text.length) * 0.55));
  const D = Math.max(1, scene.durationFrames);
  const stagger = Math.max(1.5, Math.min(6, (D * 0.4) / Math.max(1, ws.length)));
  const cardIn = ez(frame, 0, 12);
  return (
    <AbsoluteFill style={centre}>
      <div style={{position: 'relative', width: cw, background: C.paper, border: `${STROKE}px solid ${C.board}`, boxShadow: `${14 * u}px ${14 * u}px 0 ${C.board}`, padding: `${70 * u}px ${70 * u}px ${50 * u}px`, boxSizing: 'border-box', opacity: cardIn, transform: `translateY(${(1 - cardIn) * 40 * u}px)`}}>
        <div style={{position: 'absolute', left: 30 * u, top: -40 * u, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 220 * u, lineHeight: 1, color: accent}}>{'“'}</div>
        {v.status === 'disputed' ? (
          <div style={{position: 'absolute', right: 30 * u, top: -24 * u, background: C.stamp, color: C.paper, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 28 * u, padding: `${6 * u}px ${14 * u}px`, transform: 'rotate(4deg)'}}>DISPUTED</div>
        ) : null}
        <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: fs, lineHeight: 1.2, color: C.board}}>
          {ws.map((w, i) => (
            <span key={i} style={{opacity: ez(frame, 10 + i * stagger, 16 + i * stagger)}}>{w + ' '}</span>
          ))}
        </div>
        {v.speaker ? (
          <div style={{marginTop: 30 * u, fontFamily: FONT_MONO, fontSize: 30 * u, color: C.grey, opacity: ez(frame, 10 + ws.length * stagger, 20 + ws.length * stagger)}}>{'— ' + String(v.speaker)}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------------- registry */

export type TextPreset = {component: React.FC<TextProps>; bg: string; description: string; fields: string};

export const TEXT_PRESETS: Record<string, TextPreset> = {
  typewriter: {component: Typewriter, bg: 'paper', description: 'monospace characters typed with a blinking caret', fields: 'text | lines, cps?'},
  'word-pop': {component: WordPop, bg: 'paper', description: 'words spring in one by one; accent words coloured', fields: 'text | lines, accent?, stagger?'},
  'highlighter-marker': {component: Highlighter, bg: 'paper', description: 'marker stroke sweeps behind the accent words (default last line)', fields: 'text | lines, accent?, colour?'},
  'strike-then-correct': {component: StrikeThenCorrect, bg: 'paper', description: 'wrong text struck through, right text drops in', fields: 'wrong, right (or lines[0], lines[1])'},
  'stamp-text': {component: StampText, bg: 'paper', description: 'rubber stamp falls and shakes (sfx stamp)', fields: 'text, colour?, rotate?'},
  'neon-flicker': {component: NeonFlicker, bg: 'board', description: 'neon sign flickers on', fields: 'text | lines, colour?'},
  'handwritten-reveal': {component: HandwrittenReveal, bg: 'paper', description: 'signature font written left to right, underlined (sfx pen)', fields: 'text, colour?'},
  'newspaper-spin': {component: NewspaperSpin, bg: 'board', description: 'front page spins in with the headline', fields: 'text, masthead?, date?'},
  'split-flap': {component: SplitFlapText, bg: 'paper', description: 'departure board rows flip into place', fields: 'lines (max 5 x 18), accentRow?'},
  'scrolling-ticker': {component: ScrollingTicker, bg: 'paper', description: 'news ticker band with items', fields: 'lines, label?, title?, position?, speed?'},
  'quote-card': {component: QuoteCard, bg: 'greyLight', description: 'quote card, words fade in, speaker line', fields: 'text, speaker?, status?, sourceId?'},
};

export const TEXT_PRESET_IDS = Object.keys(TEXT_PRESETS);

/** Scene kind 'kinetic-text'. background: paper | board | ink | stamp | greyLight (default per preset). */
export const KineticTextScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const v = scene.visual || {};
  const preset = TEXT_PRESETS[String(v.preset)] || TEXT_PRESETS['word-pop'];
  const bgName = String(v.background || preset.bg);
  const bg = bgName === 'greyLight' ? C.greyLight : (BG[bgName] || BG.paper)();
  const fg = onBg(bg);
  const accent = colourOf(v.accentColour, bg === C.ink ? C.stamp : bg === C.stamp ? C.board : C.ink);
  const Comp = preset.component;
  return (
    <AbsoluteFill style={{backgroundColor: bg}}>
      <Comp v={v} scene={scene} ctx={ctx} fg={fg} bg={bg} accent={accent} />
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} dark={fg === C.paper} />
    </AbsoluteFill>
  );
};

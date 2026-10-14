import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE} from '../constants';
import {Kicker, SourceLine, clamp, formatNumber, usePortrait, useUnit, withUnit} from '../components/common';
import type {SceneProps} from '../types';

export const ChartScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const u = useUnit();
  const v = scene.visual || {};
  const series: Array<{label: string; value: number}> = v.series || [];
  const max = Math.max(1e-9, ...series.map((s) => s.value));
  const W = width * 0.76;
  const H = height * (height > width ? 0.42 : 0.52);
  const left = (width - W) / 2;
  const top = (height - H) / 2 + 30 * u;
  const n = Math.max(1, series.length);
  const maxIdx = series.findIndex((s) => s.value === max);
  if (v.type === 'line') {
    const pts = series.map((s, i) => [left + (n === 1 ? W / 2 : (i / (n - 1)) * W), top + H - (s.value / max) * H]);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const p = interpolate(frame, [8, Math.max(20, scene.durationFrames * 0.6)], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
    return (
      <AbsoluteFill style={{backgroundColor: C.paper}}>
        <Kicker text={scene.onScreenText} />
        <svg width={width} height={height} style={{position: 'absolute'}}>
          <line x1={left} y1={top + H} x2={left + W} y2={top + H} stroke={C.board} strokeWidth={STROKE} />
          <path d={d} fill="none" stroke={C.ink} strokeWidth={8 * u} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
          {pts.map((pt, i) => {
            const show = p * (n - 1) >= i - 0.01 || n === 1;
            return (
              <g key={i} opacity={show ? 1 : 0}>
                <circle cx={pt[0]} cy={pt[1]} r={12 * u} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
                <text x={pt[0]} y={pt[1] - 26 * u} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={30 * u} fill={C.board}>{withUnit(formatNumber(series[i].value), v.unit)}</text>
                <text x={pt[0]} y={top + H + 46 * u} textAnchor="middle" fontFamily={FONT_MONO} fontSize={28 * u} fill={C.grey}>{series[i].label}</text>
              </g>
            );
          })}
        </svg>
        <SourceLine sourceId={v.sourceId} sources={ctx.sources} />
      </AbsoluteFill>
    );
  }
  const gap = (W / n) * 0.28;
  const bw = W / n - gap;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <Kicker text={scene.onScreenText} />
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {series.map((s, i) => {
          const g = spring({frame: Math.max(0, frame - 8 - i * 6), fps, config: {damping: 15}});
          const h = (s.value / max) * H * g;
          const x = left + i * (bw + gap) + gap / 2;
          return (
            <g key={i}>
              <rect x={x} y={top + H - h} width={bw} height={Math.max(0, h)} fill={i === maxIdx ? C.ink : C.greyLight} stroke={C.board} strokeWidth={STROKE} />
              <text x={x + bw / 2} y={top + H - h - 20 * u} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={34 * u} fill={C.board} opacity={g}>{withUnit(formatNumber(s.value * g), v.unit)}</text>
              <text x={x + bw / 2} y={top + H + 48 * u} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={32 * u} fill={C.board}>{s.label}</text>
            </g>
          );
        })}
        <line x1={left} y1={top + H} x2={left + W} y2={top + H} stroke={C.board} strokeWidth={STROKE} />
      </svg>
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} />
    </AbsoluteFill>
  );
};

export const CounterScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const u = useUnit();
  const v = scene.visual || {};
  const from = Number(v.from) || 0;
  const to = Number(v.to) || 0;
  const value = interpolate(frame, [6, Math.max(20, scene.durationFrames * 0.6)], [from, to], {...clamp, easing: Easing.out(Easing.cubic)});
  const decimals = Number.isInteger(from) && Number.isInteger(to) ? 0 : 1;
  const text = withUnit(value.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals}), v.unit);
  const finalText = withUnit(to.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals}), v.unit);
  const size = Math.min(220 * u, (width * 0.86) / (0.62 * Math.max(4, finalText.length)));
  const done = frame >= scene.durationFrames * 0.6;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: size, color: C.board, letterSpacing: -2 * u, borderBottom: `${10 * u}px solid ${done ? C.ink : C.greyLight}`, paddingBottom: 10 * u}}>{text}</div>
      {scene.onScreenText ? (
        <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 52 * u, color: C.board, marginTop: 40 * u, textAlign: 'center', maxWidth: '80%'}}>{scene.onScreenText}</div>
      ) : null}
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} />
    </AbsoluteFill>
  );
};

/** Largest font size (between min and max) at which every text fits in maxLines lines of boxW pixels. */
const fitSize = (texts: string[], boxW: number, max: number, min: number, maxLines: number): number => {
  const lines = (txt: string, size: number): number => {
    const cpl = Math.max(1, Math.floor(boxW / (size * 0.52)));
    let l = 1;
    let cur = 0;
    for (const w of txt.split(/\s+/).filter(Boolean)) {
      if (w.length > cpl) return 99;
      if (cur === 0) cur = w.length;
      else if (cur + 1 + w.length <= cpl) cur += 1 + w.length;
      else {
        l++;
        cur = w.length;
      }
    }
    return l;
  };
  let s = max;
  while (s > min && texts.some((t) => lines(t, s) > maxLines)) s -= 2;
  return s;
};

/**
 * Timeline: the line draws from dot to dot, dots pop in one by one. Landscape: each date sits centred UNDER its dot
 * (IBM Plex Mono), the event label ABOVE the dot (wrapped, auto-sized), never on the line. Portrait: vertical line,
 * date and label to the right of each dot. 2-8 events.
 */
export const TimelineScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const events: Array<{date: string; label: string}> = (((scene.visual || {}).events || []) as Array<{date: string; label: string}>).slice(0, 8);
  const n = Math.max(1, events.length);
  const stagger = Math.max(6, Math.min(24, (scene.durationFrames * 0.6) / n));
  const t = (i: number) => 8 + i * stagger;
  const r = 17 * u;
  const pop = (i: number) => spring({frame: Math.max(0, frame - t(i)), fps, config: {damping: 12, stiffness: 160}});
  const inFrames = [2, ...events.map((_, i) => t(i)), t(Math.max(0, events.length - 1)) + 12];
  const fade = (i: number) => interpolate(frame, [t(i) + 2, t(i) + 10], [0, 1], clamp);
  const lastI = events.length - 1;

  if (portrait) {
    const lx = width * 0.16;
    const y0 = height * 0.12;
    const y1 = height * 0.86;
    const ys = events.map((_, i) => (n === 1 ? height * 0.5 : height * 0.18 + (i / (n - 1)) * height * 0.62));
    const lineY = interpolate(frame, inFrames, [y0, ...ys, y1], clamp);
    const textW = width * 0.68;
    const maxDate = Math.max(1, ...events.map((e) => String(e.date).length));
    const dateSize = Math.min(44 * u, textW / (maxDate * 0.62));
    const labelSize = fitSize(events.map((e) => String(e.label)), textW, 46 * u, 26 * u, 2);
    return (
      <AbsoluteFill style={{backgroundColor: C.paper}}>
        <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0}}>
          <line x1={lx} y1={y0} x2={lx} y2={lineY} stroke={C.board} strokeWidth={6 * u} strokeLinecap="round" />
          {ys.map((y, i) => (
            <circle key={i} cx={lx} cy={y} r={r * pop(i)} fill={i === lastI ? C.ink : C.paper} stroke={C.board} strokeWidth={STROKE} />
          ))}
        </svg>
        {events.map((e, i) => {
          const o = fade(i);
          return (
            <div key={i} style={{position: 'absolute', left: lx + r + 30 * u, top: ys[i] - dateSize * 0.7, width: textW, opacity: o, transform: `translateX(${(1 - o) * 20 * u}px)`}}>
              <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: dateSize, lineHeight: 1.1, color: i === lastI ? C.ink : C.board}}>{e.date}</div>
              <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: labelSize, lineHeight: 1.1, color: C.board, marginTop: 6 * u, overflowWrap: 'break-word'}}>{e.label}</div>
            </div>
          );
        })}
        <Kicker text={scene.onScreenText} />
      </AbsoluteFill>
    );
  }

  const axisY = height * 0.56;
  const x0 = width * 0.06;
  const x1 = width * 0.94;
  const xs = events.map((_, i) => (n === 1 ? width * 0.5 : width * 0.12 + (i / (n - 1)) * width * 0.76));
  const lineX = interpolate(frame, inFrames, [x0, ...xs, x1], clamp);
  const cw = Math.min(400 * u, (width * 0.84) / n);
  const maxDate = Math.max(1, ...events.map((e) => String(e.date).length));
  const dateSize = Math.min(40 * u, (cw - 12 * u) / (maxDate * 0.62));
  const labelSize = fitSize(events.map((e) => String(e.label)), cw - 16 * u, 38 * u, 20 * u, 3);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={x0} y1={axisY} x2={lineX} y2={axisY} stroke={C.board} strokeWidth={6 * u} strokeLinecap="round" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={axisY} r={r * pop(i)} fill={i === lastI ? C.ink : C.paper} stroke={C.board} strokeWidth={STROKE} />
        ))}
      </svg>
      {events.map((e, i) => {
        const o = fade(i);
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: xs[i] - cw / 2, width: cw, bottom: height - axisY + r + 26 * u, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: labelSize, lineHeight: 1.1, color: C.board, opacity: o, transform: `translateY(${(1 - o) * 16 * u}px)`, overflowWrap: 'break-word'}}>
              {e.label}
            </div>
            <div style={{position: 'absolute', left: xs[i] - cw / 2, width: cw, top: axisY + r + 18 * u, textAlign: 'center', fontFamily: FONT_MONO, fontWeight: 700, fontSize: dateSize, lineHeight: 1.1, color: i === lastI ? C.ink : C.board, opacity: o, whiteSpace: 'nowrap'}}>
              {e.date}
            </div>
          </React.Fragment>
        );
      })}
      <Kicker text={scene.onScreenText} />
    </AbsoluteFill>
  );
};

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
      <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: size, color: done ? C.board : C.board, letterSpacing: -2 * u, borderBottom: `${10 * u}px solid ${done ? C.ink : C.greyLight}`, paddingBottom: 10 * u}}>{text}</div>
      {scene.onScreenText ? (
        <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 52 * u, color: C.board, marginTop: 40 * u, textAlign: 'center', maxWidth: '80%'}}>{scene.onScreenText}</div>
      ) : null}
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} />
    </AbsoluteFill>
  );
};

export const TimelineScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const events: Array<{date: string; label: string}> = (scene.visual || {}).events || [];
  const n = Math.max(1, events.length);
  const stagger = Math.min(24, (scene.durationFrames * 0.6) / n);
  const line = interpolate(frame, [4, 4 + stagger * n], [0, 1], clamp);
  const pos = (i: number) => (n === 1 ? 0.5 : 0.12 + (i / (n - 1)) * 0.76);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {portrait ? (
          <line x1={width * 0.2} y1={height * 0.1} x2={width * 0.2} y2={height * (0.1 + 0.8 * line)} stroke={C.board} strokeWidth={6 * u} />
        ) : (
          <line x1={width * 0.06} y1={height * 0.55} x2={width * (0.06 + 0.88 * line)} y2={height * 0.55} stroke={C.board} strokeWidth={6 * u} />
        )}
      </svg>
      {events.map((e, i) => {
        const o = interpolate(frame, [6 + i * stagger, 14 + i * stagger], [0, 1], clamp);
        const last = i === events.length - 1;
        const dot = (
          <div style={{width: 34 * u, height: 34 * u, borderRadius: '50%', background: last ? C.ink : C.paper, border: `${STROKE}px solid ${C.board}`, transform: `scale(${o})`}} />
        );
        if (portrait) {
          return (
            <div key={i} style={{position: 'absolute', left: width * 0.2 - 17 * u, top: height * pos(i) - 17 * u, display: 'flex', alignItems: 'flex-start', gap: 30 * u, opacity: o}}>
              {dot}
              <div style={{marginTop: -10 * u, width: width * 0.62}}>
                <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: 40 * u, color: C.board}}>{e.date}</div>
                <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 44 * u, color: C.board, lineHeight: 1.1}}>{e.label}</div>
              </div>
            </div>
          );
        }
        const cw = Math.min(420 * u, (width * 0.8) / n);
        return (
          <div key={i} style={{position: 'absolute', left: width * pos(i) - cw / 2, width: cw, top: height * 0.55 - 17 * u, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o}}>
            <div style={{position: 'absolute', bottom: 34 * u + 18 * u, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 40 * u, color: C.board}}>{e.date}</div>
            {dot}
            <div style={{marginTop: 22 * u, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 38 * u, color: C.board, textAlign: 'center', lineHeight: 1.1}}>{e.label}</div>
          </div>
        );
      })}
      <Kicker text={scene.onScreenText} />
    </AbsoluteFill>
  );
};

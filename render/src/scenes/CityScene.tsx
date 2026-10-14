import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, STROKE} from '../constants';
import {Kicker, clamp, useUnit} from '../components/common';
import type {SceneProps} from '../types';

/**
 * CITY BUILD-UP: a skyline that builds itself. The ground line draws, buildings rise one by one with a slight
 * overshoot, windows light up, cranes swing, factory chimneys smoke. visual: {era, density, label?, night?}
 */

const hashStr = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const makeRng = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Era = '1900s' | '1950s' | 'modern';
const ERAS: Record<Era, {hMin: number; hMax: number; wMin: number; wMax: number; win: [number, number, number, number]}> = {
  '1900s': {hMin: 0.12, hMax: 0.3, wMin: 120, wMax: 240, win: [16, 24, 34, 44]},
  '1950s': {hMin: 0.18, hMax: 0.44, wMin: 100, wMax: 200, win: [18, 14, 28, 26]},
  modern: {hMin: 0.26, hMax: 0.6, wMin: 90, wMax: 180, win: [22, 9, 30, 17]},
};

type Win = {x: number; y: number; w: number; h: number; lit: number; on: boolean; accent: boolean};
type Bld = {x: number; w: number; h: number; slant: number; fill: string; start: number; windows: Win[]; roof: string; chimneyX: number; chimneyH: number};

const sawPoints = (w: number, h: number, u: number): string => {
  const n = Math.max(2, Math.round(w / (50 * u)));
  const tw = w / n;
  const parts: string[] = [];
  for (let kk = 0; kk < n; kk++) {
    parts.push(`${kk * tw},${-h} ${kk * tw + tw * 0.75},${-h - 34 * u} ${kk * tw + tw},${-h}`);
  }
  return parts.join(' ');
};

const buildRow = (rand: () => number, W: number, H: number, u: number, era: Era, density: number, back: boolean, night: boolean): Bld[] => {
  const cfg = ERAS[era];
  const out: Bld[] = [];
  let x = -30 * u;
  while (x < W + 10 * u && out.length < 40) {
    const w = (((cfg.wMin + rand() * (cfg.wMax - cfg.wMin)) * u) / density) * (back ? 1.2 : 1);
    const h = (cfg.hMin + rand() * (cfg.hMax - cfg.hMin)) * H * (back ? 1.18 : 1);
    const slant = era === 'modern' && !back && rand() < 0.3 ? Math.min(h * 0.15, 60 * u) : 0;
    const fill = back ? (night ? C.grey : C.greyLight) : night ? C.board : rand() < 0.5 ? C.paper : C.greyLight;
    let roof = 'flat';
    const r = rand();
    if (era === '1900s') roof = r < 0.45 ? 'saw' : r < 0.85 ? 'chimney' : 'flat';
    else if (era === '1950s') roof = r < 0.3 ? 'tank' : r < 0.55 ? 'antenna' : 'flat';
    else roof = r < 0.25 ? 'antenna' : 'flat';
    if (back) roof = 'flat';
    const windows: Win[] = [];
    if (!back) {
      const [ww, wh, sx, sy] = cfg.win.map((n) => n * u) as [number, number, number, number];
      const mx = 14 * u;
      const top = 20 * u + slant;
      const bottom = (era === '1900s' ? 56 : 28) * u;
      const cols = Math.max(0, Math.floor((w - 2 * mx - ww) / sx) + 1);
      const rows = Math.max(0, Math.floor((h - top - bottom - wh) / sy) + 1);
      const offX = (w - ((cols - 1) * sx + ww)) / 2;
      for (let rI = 0; rI < rows && windows.length < 140; rI++) {
        for (let cI = 0; cI < cols && windows.length < 140; cI++) {
          windows.push({x: offX + cI * sx, y: -h + top + rI * sy, w: ww, h: wh, lit: rand(), on: rand() < (night ? 0.72 : 0.45), accent: rand() < 0.05});
        }
      }
    }
    out.push({x, w, h, slant, fill, start: 0, windows, roof, chimneyX: w * (0.2 + rand() * 0.5), chimneyH: (60 + rand() * 80) * u});
    x += w + (back ? -20 : rand() * 18 - 6) * u;
  }
  return out;
};

export const CityScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H, fps} = useVideoConfig();
  const u = useUnit();
  const v = scene.visual || {};
  const D = Math.max(1, scene.durationFrames);
  const era: Era = (['1900s', '1950s', 'modern'].includes(v.era) ? v.era : 'modern') as Era;
  const density = v.density === 'low' ? 0.75 : v.density === 'high' ? 1.4 : typeof v.density === 'number' ? Math.max(0.5, Math.min(2, v.density)) : 1;
  const night = !!v.night;
  const groundY = H * 0.8;

  const rand = makeRng(hashStr(scene.id + era + String(density) + (night ? 'n' : 'd')));
  const back = buildRow(rand, W, groundY, u, era, density, true, night);
  const front = buildRow(rand, W, groundY, u, era, density, false, night);

  // rise order: back row first (left to right, quick), then the front row in shuffled order
  const groundF = 0.6 * fps;
  const backWindow = Math.min(0.8 * fps, D * 0.15);
  back.forEach((b, i) => (b.start = groundF * 0.6 + (i / Math.max(1, back.length)) * backWindow));
  const order = front.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  const riseWindow = Math.max(0.8 * fps, Math.min(D * 0.5, front.length * 0.28 * fps));
  order.forEach((idx, kk) => (front[idx].start = groundF + backWindow * 0.5 + (kk / Math.max(1, front.length)) * riseWindow));
  const allUp = groundF + backWindow * 0.5 + riseWindow + 0.6 * fps;

  const rise = (start: number) => spring({frame: Math.max(0, frame - start), fps, config: {damping: 11, stiffness: 120, mass: 0.8}});

  const cranes: Array<{x: number; h: number; L: number; phase: number}> = [];
  if (era !== '1900s') {
    const n = density > 1.2 ? 2 : 1;
    for (let i = 0; i < n; i++) cranes.push({x: W * (0.25 + 0.45 * i + rand() * 0.1), h: groundY * (0.62 + rand() * 0.12), L: (260 + rand() * 120) * u, phase: rand() * 6});
  }

  const sky = night ? C.ink : C.paper;
  const groundFill = night ? C.board : C.greyLight;
  const pGround = interpolate(frame, [0, groundF], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const time = frame / fps;

  const winFill = (b: Bld, w: Win, start: number) => {
    const litAt = start + 0.5 * fps + w.lit * 1.6 * fps;
    const lit = w.on && frame >= litAt;
    if (night) return lit ? (w.accent ? C.stamp : C.paper) : C.grey;
    if (lit) return w.accent ? C.stamp : C.ink;
    return b.fill === C.paper ? C.greyLight : C.paper;
  };

  const renderBuilding = (b: Bld, i: number, isBack: boolean) => {
    const p = rise(b.start);
    if (p <= 0.001) return null;
    const pts = `0,0 ${b.w},0 ${b.w},${-b.h} 0,${-b.h + b.slant}`;
    const sw = {vectorEffect: 'non-scaling-stroke' as const};
    return (
      <g key={(isBack ? 'b' : 'f') + i} transform={`translate(${b.x} ${groundY}) scale(1 ${p})`}>
        {b.roof === 'saw' ? (
          <polygon points={sawPoints(b.w, b.h, u)} fill={b.fill} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" {...sw} />
        ) : null}
        {b.roof === 'chimney' ? <rect x={b.chimneyX} y={-b.h - b.chimneyH} width={22 * u} height={b.chimneyH} fill={night ? C.grey : C.stamp} stroke={C.board} strokeWidth={STROKE} {...sw} /> : null}
        {b.roof === 'tank' ? (
          <g>
            <line x1={b.w * 0.3} y1={-b.h} x2={b.w * 0.3} y2={-b.h - 30 * u} stroke={C.board} strokeWidth={STROKE} {...sw} />
            <line x1={b.w * 0.55} y1={-b.h} x2={b.w * 0.55} y2={-b.h - 30 * u} stroke={C.board} strokeWidth={STROKE} {...sw} />
            <rect x={b.w * 0.25} y={-b.h - 70 * u} width={b.w * 0.35} height={42 * u} rx={6 * u} fill={night ? C.grey : C.greyLight} stroke={C.board} strokeWidth={STROKE} {...sw} />
          </g>
        ) : null}
        {b.roof === 'antenna' ? <line x1={b.w * 0.5} y1={-b.h + b.slant / 2} x2={b.w * 0.5} y2={-b.h - 70 * u} stroke={C.board} strokeWidth={STROKE + 1} {...sw} /> : null}
        <polygon points={pts} fill={b.fill} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" {...sw} />
        {b.windows.map((w, kk) => (
          <rect key={kk} x={w.x} y={w.y} width={w.w} height={w.h} fill={winFill(b, w, b.start)} stroke={C.board} strokeWidth={1.5} {...sw} />
        ))}
        {!isBack && era === '1900s' ? <rect x={b.w / 2 - 18 * u} y={-46 * u} width={36 * u} height={46 * u} fill={C.board} /> : null}
      </g>
    );
  };

  const labelO = interpolate(frame, [allUp, allUp + 0.5 * fps], [0, 1], clamp);

  return (
    <AbsoluteFill style={{backgroundColor: sky}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        {night ? (
          <g>
            <circle cx={W * 0.82} cy={H * 0.18} r={54 * u} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
            {Array.from({length: 40}, (_, kk) => {
              const sx = (((Math.sin(kk * 12.9898) * 43758.5453) % 1) + 1) % 1;
              const sy = (((Math.sin(kk * 78.233) * 12543.31) % 1) + 1) % 1;
              const tw = 0.5 + 0.5 * Math.sin(time * 2 + kk);
              return <circle key={kk} cx={sx * W} cy={sy * groundY * 0.55} r={(2 + 2 * tw) * u} fill={C.paper} opacity={0.5 + 0.5 * tw} />;
            })}
          </g>
        ) : (
          <g>
            {[0, 1, 2].map((kk) => {
              const cx = ((W * (0.15 + 0.33 * kk) + time * 18 * u * (1 + kk * 0.3)) % (W + 300 * u)) - 100 * u;
              const cy = H * (0.12 + 0.07 * kk);
              return (
                <g key={kk} transform={`translate(${cx} ${cy}) scale(${u})`}>
                  <path d="M-90 20 a40 40 0 0 1 40 -46 a55 55 0 0 1 100 6 a36 36 0 0 1 40 40 z" fill={C.paper} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
                </g>
              );
            })}
          </g>
        )}
        {back.map((b, i) => renderBuilding(b, i, true))}
        {cranes.map((c, i) => {
          const p = rise(groundF + i * 0.3 * fps);
          if (p <= 0.001) return null;
          const top = groundY - c.h * p;
          const th = 0.55 * Math.sin(time * 0.7 + c.phase);
          const jib = c.L * Math.cos(th);
          const dir = Math.sin(th) >= 0 ? 1 : -1;
          const cj = c.L * 0.35 * Math.cos(th);
          const trolley = c.x + jib * dir * 0.65;
          const hookY = top + (90 + 60 * (0.5 + 0.5 * Math.sin(time * 0.9 + c.phase))) * u;
          const mw = 24 * u;
          const segs = Math.max(1, Math.floor((c.h * p) / (mw * 1.6)));
          const zigParts: string[] = [];
          for (let kk = 0; kk < segs; kk++) {
            const y0 = groundY - kk * mw * 1.6;
            const y1 = groundY - (kk + 1) * mw * 1.6;
            zigParts.push(`M${c.x - mw / 2} ${y0} L${c.x + mw / 2} ${y1}`);
          }
          const zig = zigParts.join(' ');
          return (
            <g key={'c' + i}>
              <rect x={c.x - mw / 2} y={top} width={mw} height={Math.max(0, groundY - top)} fill="none" stroke={C.board} strokeWidth={STROKE} />
              <path d={zig} stroke={C.stamp} strokeWidth={2.5} fill="none" />
              <line x1={c.x - cj * dir} y1={top} x2={c.x + jib * dir} y2={top} stroke={C.stamp} strokeWidth={10 * u} strokeLinecap="round" />
              <line x1={c.x - cj * dir} y1={top} x2={c.x + jib * dir} y2={top} stroke={C.board} strokeWidth={2} />
              <rect x={c.x - cj * dir - (dir > 0 ? 30 * u : 0)} y={top - 4 * u} width={30 * u} height={26 * u} fill={C.board} />
              <polygon points={`${c.x - 10 * u},${top} ${c.x},${top - 50 * u} ${c.x + 10 * u},${top}`} fill={C.stamp} stroke={C.board} strokeWidth={2} />
              <line x1={trolley} y1={top} x2={trolley} y2={hookY} stroke={C.board} strokeWidth={2} />
              <rect x={trolley - 26 * u} y={hookY} width={52 * u} height={30 * u} fill={night ? C.grey : C.greyLight} stroke={C.board} strokeWidth={STROKE} />
            </g>
          );
        })}
        {front.map((b, i) => renderBuilding(b, i, false))}
        {era === '1900s'
          ? front.map((b, i) => {
              if (b.roof !== 'chimney' || rise(b.start) < 0.95) return null;
              const cx0 = b.x + b.chimneyX + 11 * u;
              const cy0 = groundY - b.h - b.chimneyH;
              return (
                <g key={'s' + i}>
                  {[0, 1, 2, 3].map((j) => {
                    const ph = (((time * 0.75 + j * 0.25 + i * 0.13) % 1) + 1) % 1;
                    return <circle key={j} cx={cx0 + ph * 40 * u} cy={cy0 - ph * 170 * u} r={(10 + ph * 28) * u} fill={night ? C.greyLight : C.paper} stroke={C.grey} strokeWidth={2} opacity={(1 - ph) * 0.9} />;
                  })}
                </g>
              );
            })
          : null}
        <rect x={0} y={groundY} width={W} height={H - groundY} fill={groundFill} />
        <line x1={0} y1={groundY} x2={Math.max(1, W * pGround)} y2={groundY} stroke={night ? C.paper : C.board} strokeWidth={STROKE + 2} strokeLinecap="round" />
      </svg>
      {v.label ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: groundY + (H - groundY) * 0.28, textAlign: 'center', opacity: labelO, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 64 * u, color: night ? C.paper : C.board, letterSpacing: 1 * u}}>
          {v.label}
        </div>
      ) : null}
      <Kicker text={scene.onScreenText} />
    </AbsoluteFill>
  );
};

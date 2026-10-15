import React from 'react';
import {C, FONT_HEAD, STROKE, colourOf} from '../constants';
import {c01} from '../illustrations/kit';

/** Every mood shot receives the scene-local time in seconds, the scene length and its free props. */
export type ShotProps = {t: number; dur: number; p: Record<string, any>};

/** 1920x1080 drawing surface; portrait formats letterbox it (the scene background fills the rest). */
export const ShotSvg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg viewBox="0 0 1920 1080" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{position: 'absolute', left: 0, top: 0}}>
    {children}
  </svg>
);

export const snap = (x: number): number => 1 - Math.pow(1 - c01(x), 3);

/** Pop with a little overshoot: 0 -> 1.3 -> 1. */
export const pop = (x: number): number => (x <= 0 ? 0 : c01(x * 2) * (1 + 0.3 * Math.sin(Math.PI * c01(x))));

export const starPath = (r1: number, r2: number, n = 5): string => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
};

export const TEAR = 'M0 -40 C 18 -10, 28 10, 0 30 C -28 10, -18 -10, 0 -40 Z';

export type FigureProps = {
  x: number;
  y: number;
  s?: number;
  colour?: string;
  rot?: number;
  squash?: number;
  arms?: 'down' | 'up' | 'head' | 'out';
  legs?: number;
  opacity?: number;
};

/** Small faceless stand-in figure for mood shots (feet at x,y; about 410 px tall at s = 1). */
export const Figure: React.FC<FigureProps> = ({x, y, s = 1, colour, rot = 0, squash = 0, arms = 'down', legs = 0, opacity = 1}) => {
  const fill = colourOf(colour, C.board);
  const sw = STROKE / Math.max(0.2, s);
  const arm =
    arms === 'up'
      ? 'M-48 -285 L-100 -400 M48 -285 L100 -400'
      : arms === 'head'
        ? 'M-48 -285 L-96 -330 L-44 -385 M48 -285 L80 -190'
        : arms === 'out'
          ? 'M-48 -285 L-150 -300 M48 -285 L150 -300'
          : 'M-48 -285 L-66 -160 M48 -285 L66 -160';
  const lg = legs * 40;
  const legPath = `M-20 -150 L${(-20 - lg).toFixed(1)} -6 M20 -150 L${(20 + lg).toFixed(1)} -6`;
  const sx = s * (1 + squash * 0.35);
  const sy = s * (1 - squash);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`} opacity={opacity}>
      <path d={legPath} stroke={C.board} strokeWidth={34 + 2 * sw} strokeLinecap="round" fill="none" />
      <path d={legPath} stroke={fill} strokeWidth={34} strokeLinecap="round" fill="none" />
      <path d={arm} stroke={C.board} strokeWidth={24 + 2 * sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={arm} stroke={fill} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M-58 -300 Q0 -322 58 -300 L48 -140 L-48 -140 Z" fill={fill} stroke={C.board} strokeWidth={sw} strokeLinejoin="round" />
      <circle cx={0} cy={-358} r={46} fill={fill} stroke={C.board} strokeWidth={sw} />
    </g>
  );
};

/** Big comic word that pops in at time `at` (seconds). */
export const PopText: React.FC<{x: number; y: number; text: string; t: number; at: number; size?: number; fill?: string; rot?: number; font?: string}> = ({
  x,
  y,
  text,
  t,
  at,
  size = 140,
  fill,
  rot = 0,
  font,
}) => {
  const k = pop((t - at) / 0.3);
  if (k <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      <text
        x={0}
        y={size * 0.35}
        textAnchor="middle"
        fontFamily={font || FONT_HEAD}
        fontWeight={800}
        fontSize={size}
        fill={fill || C.stamp}
        stroke={C.board}
        strokeWidth={STROKE * 2}
        strokeLinejoin="round"
        style={{paintOrder: 'stroke'}}
      >
        {text}
      </text>
    </g>
  );
};

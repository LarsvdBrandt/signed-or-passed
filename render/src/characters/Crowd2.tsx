import React from 'react';
import {C, FONT_MONO, STROKE} from '../constants';
import {Character} from './Rig';

/** Deterministic PRNG (mulberry32): the same seed always gives the same crowd. */
const rng = (seed: number): (() => number) => {
  let a = Math.floor(seed) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const list = (v: string[] | string | undefined, d: string[]): string[] => {
  if (Array.isArray(v)) return v.length ? v : d;
  if (typeof v === 'string' && v.trim()) return v.split(',').map((s) => s.trim()).filter(Boolean);
  return d;
};

export const CROWD2_W = 1200;
export const CROWD2_H = 520;

export type Crowd2Props = {
  /** number of people, 1-24 (default 8) */
  count?: number;
  /** same seed = same crowd */
  seed?: number;
  /** costume ids or era aliases to pick from (array or comma separated) */
  costumes?: string[] | string;
  /** era alias used when costumes is not set */
  era?: string;
  /** brand colour names / hex to pick from */
  colours?: string[] | string;
  /** poses to pick from */
  poses?: string[] | string;
  /** false = frozen poses */
  animate?: boolean;
  /** 1-3 rows (default 2 when count > 6) */
  rows?: number;
  /** optional tag top-left (IBM Plex Mono) */
  label?: string;
};

type Body = {key: number; cx: number; feet: number; s: number; costume: string; colour: string; pose: string; flip: boolean; phase: number; speed: number};

/** Crowd2: a seeded crowd of animated Characters (rows, costumes, colours, poses, phase offsets). 1200x520. */
export const Crowd2: React.FC<Crowd2Props> = ({count = 8, seed = 1, costumes, era, colours, poses, animate = true, rows, label}) => {
  const n = Math.max(1, Math.min(24, Math.round(count)));
  const r = rng(seed * 9973 + n);
  const cosList = list(costumes, era ? [era] : ['suit', 'casual', 'plain']);
  const colList = list(colours, ['ink', 'stamp', 'board', 'grey']);
  const poseList = list(poses, ['stand', 'talk', 'applause', 'arms-crossed', 'thinking', 'wave']);
  const nRows = Math.max(1, Math.min(3, Math.round(rows ?? (n > 6 ? 2 : 1))));
  const bodies: Body[] = [];
  let idx = 0;
  for (let row = nRows - 1; row >= 0; row--) {
    const inRow = Math.ceil((n - idx) / (row + 1));
    const s = 1 - row * 0.2;
    const feet = CROWD2_H - 14 - row * 56;
    const slot = CROWD2_W / Math.max(1, inRow);
    const shift = row % 2 === 1 ? slot * 0.25 : 0;
    for (let k = 0; k < inRow; k++) {
      const raw = slot * (k + 0.5) + shift + (r() - 0.5) * slot * 0.3;
      const cx = Math.max(100 * s, Math.min(CROWD2_W - 100 * s, raw));
      bodies.push({
        key: idx,
        cx,
        feet,
        s,
        costume: cosList[Math.floor(r() * cosList.length) % cosList.length],
        colour: colList[Math.floor(r() * colList.length) % colList.length],
        pose: poseList[Math.floor(r() * poseList.length) % poseList.length],
        flip: r() < 0.5,
        phase: r() * 3,
        speed: 0.85 + r() * 0.3,
      });
      idx++;
    }
  }
  return (
    <div style={{position: 'relative', width: CROWD2_W, height: CROWD2_H}}>
      {bodies.map((b) => (
        <div key={b.key} style={{position: 'absolute', left: b.cx - 100, top: b.feet - 386, width: 200, height: 400, transform: `scale(${b.s})`, transformOrigin: '100px 386px'}}>
          <Character pose={b.pose} costume={b.costume} colour={b.colour} flip={b.flip} phase={b.phase} speed={animate ? b.speed : 0} blendSec={0} />
        </div>
      ))}
      {label ? (
        <div style={{position: 'absolute', left: 0, top: 0, padding: '6px 14px', background: C.paper, border: `${STROKE}px solid ${C.board}`, fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: C.board}}>{label}</div>
      ) : null}
    </div>
  );
};

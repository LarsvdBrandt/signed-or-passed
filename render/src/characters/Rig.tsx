import React from 'react';
import {C, FONT_MONO, STROKE, colourOf} from '../constants';
import {c01, easeInOut, fitText, frac, useT} from '../illustrations/kit';
import {COSTUMES, Hat, HeldProp, type RigGeo, resolveCostume, resolveHat, resolveHold} from './Costumes';

/**
 * Faceless character rig (house style: flat silhouette, 3px outlines, no face, no likeness).
 * The body is a pelvis with a rotating torso, a head on the neck, two 2-bone arms and two 2-bone legs.
 * Angles in degrees. Limbs: 0 = pointing straight down, +90 = pointing to the right ("forward"), 180 = up.
 * Elbow / knee angles are relative to the upper bone. torso / head: lean, positive = to the right.
 * y moves the pelvis down (+) or up (-) in px; sh raises the shoulders (shrug) in px.
 * Costumes, hats and held props are overlay groups from Costumes.tsx (docs/library/characters.md).
 */
export type Joints = {
  torso: number;
  head: number;
  sh: number;
  lsh: number;
  lel: number;
  rsh: number;
  rel: number;
  lhip: number;
  lkn: number;
  rhip: number;
  rkn: number;
  y: number;
};

export type PoseDef = {keys: Joints[]; dur: number; loop: boolean; linear?: boolean; armsFront?: boolean; description: string};

const BASE: Joints = {torso: 0, head: 0, sh: 0, lsh: -6, lel: 0, rsh: 6, rel: 0, lhip: -3, lkn: 0, rhip: 3, rkn: 0, y: 0};
const J = (p: Partial<Joints>): Joints => ({...BASE, ...p});
const KEYS = Object.keys(BASE) as Array<keyof Joints>;

export const STAND: Joints = BASE;

const SIT: Partial<Joints> = {lhip: 86, lkn: -86, rhip: 82, rkn: -82, y: 64, torso: -4};
const CROSSED: Partial<Joints> = {lsh: -4, lel: 100, rsh: 4, rel: -92};

/** Pose library: keyframed joint angles, interpolated (smooth by default, linear for gait cycles). */
export const POSES: Record<string, PoseDef> = {
  stand: {description: 'standing, subtle breathing', dur: 3.2, loop: true, keys: [J({}), J({sh: 2, y: 1})]},
  walk: {
    description: 'walk cycle (in place; move the layer for travel)',
    dur: 1.0,
    loop: true,
    linear: true,
    keys: [
      J({torso: 2, lhip: 24, lkn: -8, rhip: -20, rkn: -22, lsh: -22, lel: 12, rsh: 22, rel: 18}),
      J({torso: 2, lhip: 2, lkn: -6, rhip: 0, rkn: -55, lsh: 0, lel: 14, rsh: 0, rel: 14, y: -6}),
      J({torso: 2, lhip: -20, lkn: -22, rhip: 24, rkn: -8, lsh: 22, lel: 18, rsh: -22, rel: 12}),
      J({torso: 2, lhip: 0, lkn: -55, rhip: 2, rkn: -6, lsh: 0, lel: 14, rsh: 0, rel: 14, y: -6}),
    ],
  },
  run: {
    description: 'run cycle (in place)',
    dur: 0.62,
    loop: true,
    linear: true,
    keys: [
      J({torso: 12, lhip: 48, lkn: -25, rhip: -30, rkn: -75, lsh: -40, lel: 85, rsh: 50, rel: 80}),
      J({torso: 12, lhip: 5, lkn: -40, rhip: 10, rkn: -100, lsh: 5, lel: 85, rsh: 5, rel: 85, y: -16}),
      J({torso: 12, lhip: -30, lkn: -75, rhip: 48, rkn: -25, lsh: 50, lel: 80, rsh: -40, rel: 85}),
      J({torso: 12, lhip: 10, lkn: -100, rhip: 5, rkn: -40, lsh: 5, lel: 85, rsh: 5, rel: 85, y: -16}),
    ],
  },
  sit: {description: 'sitting (place a DecisionChair or Desk behind)', dur: 3, loop: true, keys: [J({...SIT, lsh: 18, lel: 62, rsh: 24, rel: 56}), J({...SIT, lsh: 18, lel: 62, rsh: 24, rel: 56, sh: 2})]},
  type: {description: 'sitting and typing', dur: 0.5, loop: true, keys: [J({...SIT, head: 4, lsh: 62, lel: 22, rsh: 58, rel: 40}), J({...SIT, head: 4, lsh: 62, lel: 36, rsh: 58, rel: 26})]},
  point: {description: 'pointing up and forward', dur: 2.4, loop: true, keys: [J({torso: 3, rsh: 115, rel: -5, lsh: -8}), J({torso: 3, rsh: 112, rel: -2, lsh: -8, sh: 1})]},
  shrug: {
    description: 'shrug: shoulders up, palms up',
    dur: 1.8,
    loop: true,
    keys: [J({}), J({sh: 10, head: 10, lsh: -45, lel: -85, rsh: 45, rel: 85}), J({sh: 10, head: 10, lsh: -45, lel: -85, rsh: 45, rel: 85}), J({})],
  },
  facepalm: {description: 'hand on the face', dur: 2.0, loop: true, armsFront: true, keys: [J({torso: 4, head: 10, rsh: 144, rel: 135}), J({torso: 6, head: 14, sh: 3, rsh: 144, rel: 135})]},
  celebrate: {
    description: 'celebrate: crouch and jump with both arms up',
    dur: 1.1,
    loop: true,
    keys: [
      J({y: 18, torso: 6, lhip: 28, lkn: -56, rhip: 28, rkn: -56, lsh: -30, lel: 20, rsh: 30, rel: -20}),
      J({y: -70, lhip: -6, lkn: -20, rhip: 10, rkn: -30, lsh: -165, rsh: 165}),
      J({y: -60, lhip: -4, lkn: -24, rhip: 8, rkn: -34, lsh: -150, rsh: 150}),
      J({y: 18, torso: 6, lhip: 28, lkn: -56, rhip: 28, rkn: -56, lsh: -30, lel: 20, rsh: 30, rel: -20}),
    ],
  },
  slump: {
    description: 'sad / slumped, head down',
    dur: 4,
    loop: true,
    keys: [
      J({torso: 10, head: 28, sh: -4, lsh: 4, rsh: 12, y: 6, lhip: 6, lkn: -10, rhip: 8, rkn: -12}),
      J({torso: 10, head: 32, sh: -6, lsh: 4, rsh: 12, y: 7, lhip: 6, lkn: -10, rhip: 8, rkn: -12}),
    ],
  },
  'arms-crossed': {description: 'arms crossed', dur: 3, loop: true, keys: [J({...CROSSED}), J({...CROSSED, sh: 2})]},
  handshake: {description: 'hand out for a handshake (pumping); pair with a flipped character', dur: 0.5, loop: true, keys: [J({rsh: 25, rel: 62}), J({rsh: 25, rel: 52})]},
  applause: {description: 'clapping', dur: 0.36, loop: true, keys: [J({lsh: -14, lel: 98, rsh: 14, rel: -98}), J({lsh: -35, lel: 95, rsh: 35, rel: -95})]},
  thinking: {description: 'hand under the chin, other arm across', dur: 3, loop: true, keys: [J({head: 6, rsh: -56, rel: -149, lsh: -4, lel: 97}), J({head: 10, rsh: -56, rel: -149, lsh: -4, lel: 97})]},
  shock: {
    description: 'shock: jolt back with both hands up (plays once, then holds)',
    dur: 0.9,
    loop: false,
    keys: [J({}), J({y: -14, torso: -8, sh: 8, lsh: -130, lel: -20, rsh: 130, rel: 20}), J({y: -4, torso: -6, sh: 8, lsh: -120, lel: -25, rsh: 120, rel: 25}), J({y: -4, torso: -6, sh: 8, lsh: -124, lel: -22, rsh: 124, rel: 22})],
  },
  wave: {description: 'waving hello', dur: 0.8, loop: true, keys: [J({rsh: 150, rel: 25}), J({rsh: 150, rel: -25})]},
  talk: {description: 'talking with one hand gesturing', dur: 1.4, loop: true, keys: [J({rsh: 40, rel: 50}), J({rsh: 52, rel: 72, head: 3}), J({rsh: 44, rel: 58})]},
  phone: {description: 'on the phone: hand at the ear (holds a handset unless hold is set)', dur: 2.6, loop: true, armsFront: true, keys: [J({rsh: 132, rel: 119, head: -4}), J({rsh: 132, rel: 119, head: -1, lsh: -12, lel: 20})]},
  protest: {description: 'holding a placard up (holds placard + holdText unless hold is set)', dur: 1.2, loop: true, keys: [J({rsh: 170, rel: -6, lsh: -8}), J({rsh: 166, rel: -10, lsh: -8, y: -3})]},
};

const ALIASES: Record<string, string> = {
  standing: 'stand',
  sitting: 'sit',
  typing: 'type',
  pointing: 'point',
  jump: 'celebrate',
  sad: 'slump',
  clap: 'applause',
  think: 'thinking',
  surprised: 'shock',
  'walk-cycle': 'walk',
  'run-cycle': 'run',
  'on-phone': 'phone',
  call: 'phone',
  'hold-sign': 'protest',
  sign: 'protest',
};

export const POSE_NAMES = Object.keys(POSES);

export const resolvePose = (pose?: string): string => {
  const p = (pose || 'stand').toLowerCase();
  if (POSES[p]) return p;
  if (ALIASES[p] && POSES[ALIASES[p]]) return ALIASES[p];
  return 'stand';
};

export const lerpJoints = (a: Joints, b: Joints, k: number): Joints => {
  const o = {...a};
  for (const key of KEYS) o[key] = a[key] + (b[key] - a[key]) * k;
  return o;
};

/** Joint angles of a pose at time t (seconds). */
export const samplePose = (def: PoseDef, t: number): Joints => {
  const n = def.keys.length;
  if (n === 1) return def.keys[0];
  const segs = def.loop ? n : n - 1;
  const p = def.loop ? frac(t / def.dur) : c01(t / def.dur);
  const s = Math.min(segs - 0.0001, p * segs);
  const i = Math.floor(s);
  const k = s - i;
  return lerpJoints(def.keys[i], def.keys[(i + 1) % n], def.linear ? k : easeInOut(k));
};

const rad = (d: number): number => (d * Math.PI) / 180;
type Pt = [number, number];
const add = (p: Pt, a: number, len: number): Pt => [p[0] + Math.sin(rad(a)) * len, p[1] + Math.cos(rad(a)) * len];
const addUp = (p: Pt, a: number, len: number): Pt => [p[0] + Math.sin(rad(a)) * len, p[1] - Math.cos(rad(a)) * len];
const path = (pts: Pt[]): string => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

const Limb: React.FC<{d: string; c: string; edge: string; w?: number}> = ({d, c, edge, w = 24}) => (
  <>
    <path d={d} stroke={edge} strokeWidth={w + STROKE * 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d={d} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </>
);

export type CharacterProps = {
  pose?: string;
  colour?: string;
  /** costume id (plain | suit | toga | tunic | merchant | victorian | twenties | fifties | dress | eighties | casual | hoodie | future | worker | labcoat | royal | trenchcoat) or an era alias */
  costume?: string;
  /** era alias used when costume is not set (ancient, medieval, golden-age, industrial, deco, diner, neon, cubicle, open-plan, modern, future ...) */
  era?: string;
  /** 'auto' (default: the costume's hat) | 'none' | a hat id */
  hat?: string;
  /** prop in the right hand: briefcase | phone | smartphone | newspaper | coffee | moneybag | pen | contract | placard | none */
  hold?: string;
  /** prop in the left hand (same ids) */
  holdLeft?: string;
  /** text on a placard */
  holdText?: string;
  label?: string;
  flip?: boolean;
  /** animation speed multiplier (1 = normal, 0 = frozen) */
  speed?: number;
  /** time offset in seconds, so a crowd of characters does not move in sync */
  phase?: number;
  /** seconds to blend from standing into the pose at the start (0 = no blend) */
  blendSec?: number;
  /** pass explicit joints to override the pose (advanced) */
  joints?: Partial<Joints>;
};

/**
 * Character: the animated faceless figure. 200x400 like Person, feet at y=386.
 * pose: stand | walk | run | sit | type | point | shrug | facepalm | celebrate | slump | arms-crossed | handshake |
 * applause | thinking | shock | wave | talk | phone | protest. flip mirrors it (placard text stays readable).
 */
export const Character: React.FC<CharacterProps> = ({pose, colour, costume, era, hat, hold, holdLeft, holdText, label, flip, speed = 1, phase = 0, blendSec = 0.4, joints}) => {
  const t = useT();
  const name = resolvePose(pose);
  const def = POSES[name];
  let j = samplePose(def, t * speed + phase);
  if (blendSec > 0 && t < blendSec && name !== 'stand') j = lerpJoints(STAND, j, easeInOut(t / blendSec));
  if (joints) j = {...j, ...joints};

  const c = colourOf(colour, C.board);
  const edge = c === C.board ? C.grey : C.board;
  const legC = c === C.board ? C.grey : C.board;
  const cos = COSTUMES[resolveCostume(costume, era)];
  const hatId = resolveHat(hat === undefined || hat === 'auto' ? cos.hat : hat);
  const holdR = resolveHold(hold !== undefined ? hold : name === 'phone' ? 'phone' : name === 'protest' ? 'placard' : cos.hold);
  const holdL = resolveHold(holdLeft);

  const P: Pt = [100, 250 + j.y];
  const S0 = addUp(P, j.torso, 130);
  const S = addUp(S0, j.torso, j.sh);
  const px = Math.cos(rad(j.torso)) * 34;
  const py = Math.sin(rad(j.torso)) * 34;
  const shL: Pt = [S[0] - px, S[1] - py];
  const shR: Pt = [S[0] + px, S[1] + py];
  const elL = add(shL, j.lsh, 62);
  const haL = add(elL, j.lsh + j.lel, 60);
  const elR = add(shR, j.rsh, 62);
  const haR = add(elR, j.rsh + j.rel, 60);
  const hipL: Pt = [P[0] - 18, P[1]];
  const hipR: Pt = [P[0] + 18, P[1]];
  const knL = add(hipL, j.lhip, 68);
  const ftL = add(knL, j.lhip + j.lkn, 66);
  const knR = add(hipR, j.rhip, 68);
  const ftR = add(knR, j.rhip + j.rkn, 66);
  const H = addUp(S0, j.torso + j.head, 62);

  const top = P[1] - 138 - j.sh * 0.7;
  const g: RigGeo = {P, top, torso: j.torso, head: j.head, H, haL, haR, c, edge, sitting: j.lhip > 45 && j.rhip > 45, flip: !!flip};
  const rot = `rotate(${j.torso.toFixed(2)} ${P[0]} ${P[1].toFixed(1)})`;

  const behind = cos.behind ? <g transform={rot}>{cos.behind(g)}</g> : null;
  const torso = (
    <g transform={rot}>
      <path d={`M58 ${top.toFixed(1)} Q100 ${(top - 20).toFixed(1)} 142 ${top.toFixed(1)} L150 ${(P[1] + 8).toFixed(1)} L50 ${(P[1] + 8).toFixed(1)} Z`} fill={c} stroke={edge} strokeWidth={STROKE} strokeLinejoin="round" />
      {cos.torso ? cos.torso(g) : null}
    </g>
  );
  const arms = (
    <g>
      <Limb d={path([shL, elL, haL])} c={c} edge={edge} />
      <Limb d={path([shR, elR, haR])} c={c} edge={edge} />
      {holdL ? <HeldProp id={holdL} at={haL} g={g} text={holdText} /> : null}
      {holdR ? <HeldProp id={holdR} at={haR} g={g} text={holdText} /> : null}
    </g>
  );
  const head = (
    <g>
      {cos.headBack ? cos.headBack(g) : null}
      <circle cx={H[0]} cy={H[1]} r={36} fill={c} stroke={edge} strokeWidth={STROKE} />
      {hatId ? <Hat id={hatId} g={g} /> : null}
    </g>
  );

  return (
    <svg width={200} height={400} viewBox="0 0 200 400" overflow="visible">
      <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>
        {behind}
        <Limb d={path([hipL, knL, ftL])} c={legC} edge={C.board} w={30} />
        <Limb d={path([hipR, knR, ftR])} c={legC} edge={C.board} w={30} />
        {torso}
        {def.armsFront ? head : arms}
        {def.armsFront ? arms : head}
      </g>
      {label ? (
        <g>
          <rect x={20} y={398} width={160} height={36} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
          <text x={100} y={422} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board} {...fitText(label, 14, 140)}>
            {label}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

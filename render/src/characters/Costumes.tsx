import React from 'react';
import {C, FONT_HEAD, STROKE} from '../constants';

/**
 * Costumes, hats and held props for the faceless character rig (Rig.tsx). Everything is an overlay group drawn on
 * top of the plain silhouette, so every pose works with every costume. House style: flat brand colours, 3px
 * outlines, no gradients, no faces, no logos.
 *
 * Painters get the rig geometry of the current frame. Torso painters draw in torso-local coordinates (the torso
 * group is rotated by the rig): the torso spans x 58..142 at the shoulder line y = top and x 50..150 at the hips
 * y = P[1] + 8; P = pelvis (x 100).
 */
export type Pt = [number, number];
export type RigGeo = {P: Pt; top: number; torso: number; head: number; H: Pt; haL: Pt; haR: Pt; c: string; edge: string; sitting: boolean; flip: boolean};
type Painter = (g: RigGeo) => React.ReactNode;

const f = (n: number): string => n.toFixed(1);
export const accentOf = (c: string): string => (c === C.stamp ? C.ink : C.stamp);
const darkOf = (c: string): string => (c === C.board ? C.grey : C.board);
const outlineOf = (fill: string): string => (fill === C.board ? C.grey : C.board);

const skirt = (g: RigGeo, fill: string, len: number, flare: number): React.ReactNode => {
  const y0 = g.P[1] - 6;
  const y1 = g.P[1] + (g.sitting ? Math.min(len, 30) : len);
  const fl = g.sitting ? flare * 0.4 : flare;
  return <path d={`M50 ${f(y0)} L150 ${f(y0)} L${f(150 + fl)} ${f(y1)} L${f(50 - fl)} ${f(y1)} Z`} fill={fill} stroke={outlineOf(fill)} strokeWidth={STROKE} strokeLinejoin="round" />;
};

const torsoShape = (g: RigGeo, fill: string): React.ReactNode => (
  <path d={`M58 ${f(g.top)} Q100 ${f(g.top - 20)} 142 ${f(g.top)} L150 ${f(g.P[1] + 8)} L50 ${f(g.P[1] + 8)} Z`} fill={fill} stroke={outlineOf(fill)} strokeWidth={STROKE} strokeLinejoin="round" />
);

const collar = (g: RigGeo, fill: string = C.paper): React.ReactNode => (
  <path d={`M84 ${f(g.top - 2)} L100 ${f(g.top + 30)} L116 ${f(g.top - 2)} Z`} fill={fill} stroke={g.edge} strokeWidth={STROKE} strokeLinejoin="round" />
);

const tie = (g: RigGeo, fill: string, w = 1): React.ReactNode => {
  const t = g.top;
  return (
    <path
      d={`M${f(100 - 5 * w)} ${f(t + 6)} L${f(100 + 5 * w)} ${f(t + 6)} L${f(100 + 3 * w)} ${f(t + 22)} L${f(100 + 9 * w)} ${f(t + 72)} L100 ${f(t + 84)} L${f(100 - 9 * w)} ${f(t + 72)} L${f(100 - 3 * w)} ${f(t + 22)} Z`}
      fill={fill}
      stroke={C.board}
      strokeWidth={STROKE}
      strokeLinejoin="round"
    />
  );
};

const tieColour = (g: RigGeo): string => (g.c === C.ink ? C.stamp : C.ink);

const buttons = (g: RigGeo, n: number, y0: number, step: number, fill: string = C.paper, x = 100): React.ReactNode => (
  <g>
    {Array.from({length: n}, (_, i) => (
      <circle key={i} cx={x} cy={f(y0 + i * step)} r={4} fill={fill} stroke={g.edge} strokeWidth={2} />
    ))}
  </g>
);

const suitTorso: Painter = (g) => (
  <g>
    {collar(g)}
    {tie(g, tieColour(g))}
  </g>
);

export type CostumeDef = {description: string; eras: string[]; hat?: string; hold?: string; behind?: Painter; torso?: Painter; headBack?: Painter};

export const COSTUMES: Record<string, CostumeDef> = {
  plain: {description: 'no costume: the plain house silhouette', eras: []},
  suit: {description: 'business suit: shirt collar + tie', eras: ['modern-office', 'cubicle', '1990s', 'business'], torso: suitTorso},
  toga: {
    description: 'ancient toga over one shoulder, laurel wreath',
    eras: ['ancient', 'antiquity', 'roman', 'rome', 'greek', 'egypt'],
    hat: 'laurel',
    torso: (g) => (
      <g>
        {skirt(g, C.paper, 62, 6)}
        <path d={`M80 ${f(g.top - 6)} L142 ${f(g.top)} L150 ${f(g.P[1] + 8)} L50 ${f(g.P[1] + 8)} L52 ${f(g.P[1] - 70)} Z`} fill={C.paper} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        <path d={`M92 ${f(g.top + 4)} L136 ${f(g.P[1] - 40)} M80 ${f(g.top + 30)} L128 ${f(g.P[1] - 6)} M64 ${f(g.P[1] - 50)} L100 ${f(g.P[1] + 4)}`} stroke={C.grey} strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  tunic: {
    description: 'medieval tunic: belt, skirt to the knee, laced neck, floppy cap',
    eras: ['medieval', 'middle-ages', '1300s', '1400s'],
    hat: 'medieval-cap',
    torso: (g) => (
      <g>
        {skirt(g, g.c, 50, 12)}
        <rect x={50} y={f(g.P[1] - 12)} width={100} height={12} fill={darkOf(g.c)} stroke={g.edge} strokeWidth={STROKE} />
        <rect x={93} y={f(g.P[1] - 14)} width={14} height={16} fill={C.paper} stroke={C.board} strokeWidth={2} />
        <path d={`M88 ${f(g.top - 2)} L100 ${f(g.top + 26)} L112 ${f(g.top - 2)} Z`} fill={C.paper} stroke={g.edge} strokeWidth={STROKE} strokeLinejoin="round" />
        <path d={`M93 ${f(g.top + 6)} L107 ${f(g.top + 10)} M93 ${f(g.top + 14)} L107 ${f(g.top + 10)}`} stroke={C.board} strokeWidth={2} fill="none" />
      </g>
    ),
  },
  merchant: {
    description: '1600s merchant: ruff collar, doublet buttons, puffed breeches, capotain hat',
    eras: ['golden-age', '1600s', '17th-century', 'renaissance', 'voc'],
    hat: 'capotain',
    torso: (g) => (
      <g>
        {skirt(g, g.c, 34, 14)}
        {buttons(g, 4, g.top + 26, 22)}
        {Array.from({length: 9}, (_, i) => (
          <circle key={i} cx={64 + i * 9} cy={f(g.top - 4)} r={9} fill={C.paper} stroke={C.board} strokeWidth={2} />
        ))}
      </g>
    ),
  },
  victorian: {
    description: '1800s industrialist: suit, watch chain, top hat',
    eras: ['industrial', 'victorian', '1800s', '1850s', '1890s', '1900s', 'gilded-age'],
    hat: 'top-hat',
    torso: (g) => (
      <g>
        {suitTorso(g)}
        <path d={`M70 ${f(g.P[1] - 50)} Q86 ${f(g.P[1] - 34)} 98 ${f(g.P[1] - 48)}`} stroke={C.greyLight} strokeWidth={3} fill="none" />
      </g>
    ),
  },
  twenties: {
    description: '1920s: suit with bow tie and vest buttons, straw boater',
    eras: ['deco', '1920s', '1930s', 'roaring-20s', 'art-deco'],
    hat: 'boater',
    torso: (g) => (
      <g>
        {collar(g)}
        <path d={`M100 ${f(g.top + 8)} L84 ${f(g.top)} L84 ${f(g.top + 16)} Z M100 ${f(g.top + 8)} L116 ${f(g.top)} L116 ${f(g.top + 16)} Z`} fill={accentOf(g.c)} stroke={C.board} strokeWidth={2} strokeLinejoin="round" />
        {buttons(g, 3, g.top + 42, 18)}
      </g>
    ),
  },
  fifties: {
    description: '1950s: suit, skinny tie, pocket square, fedora',
    eras: ['diner', '1950s', '1960s', 'mid-century'],
    hat: 'fedora',
    torso: (g) => (
      <g>
        {collar(g)}
        {tie(g, tieColour(g), 0.6)}
        <path d={`M118 ${f(g.top + 36)} L134 ${f(g.top + 36)} L126 ${f(g.top + 26)} Z`} fill={C.paper} stroke={C.board} strokeWidth={2} strokeLinejoin="round" />
      </g>
    ),
  },
  dress: {
    description: '1950s dress: round collar, belt, wide polka-dot skirt',
    eras: ['1950s-dress', 'retro', 'housewife'],
    torso: (g) => {
      const L = g.sitting ? 30 : 84;
      const dots: Array<[number, number]> = [[70, 24], [100, 44], [130, 24], [82, 66], [118, 66], [58, 58], [142, 58], [100, 14]];
      return (
        <g>
          {skirt(g, accentOf(g.c), 84, 40)}
          {dots
            .filter(([, dy]) => dy <= L - 8)
            .map(([dx, dy], i) => (
              <circle key={i} cx={dx} cy={f(g.P[1] + dy)} r={5} fill={C.paper} />
            ))}
          <rect x={50} y={f(g.P[1] - 14)} width={100} height={8} fill={C.board} />
          <ellipse cx={90} cy={f(g.top + 2)} rx={12} ry={7} fill={C.paper} stroke={C.board} strokeWidth={2} />
          <ellipse cx={110} cy={f(g.top + 2)} rx={12} ry={7} fill={C.paper} stroke={C.board} strokeWidth={2} />
        </g>
      );
    },
  },
  eighties: {
    description: '1980s power suit: shoulder pads, wide striped tie',
    eras: ['neon', '1980s', '80s', 'wall-street'],
    torso: (g) => (
      <g>
        <rect x={36} y={f(g.top - 8)} width={34} height={28} rx={8} fill={g.c} stroke={g.edge} strokeWidth={STROKE} />
        <rect x={130} y={f(g.top - 8)} width={34} height={28} rx={8} fill={g.c} stroke={g.edge} strokeWidth={STROKE} />
        {collar(g)}
        {tie(g, accentOf(g.c), 1.6)}
        <path d={`M90 ${f(g.top + 40)} L110 ${f(g.top + 32)} M88 ${f(g.top + 58)} L112 ${f(g.top + 50)}`} stroke={C.paper} strokeWidth={4} fill="none" />
      </g>
    ),
  },
  casual: {
    description: '1990s-2000s polo shirt: collar flaps, placket buttons',
    eras: ['2000s', 'open-plan', 'dotcom', 'casual'],
    torso: (g) => (
      <g>
        <path d={`M100 ${f(g.top + 4)} L84 ${f(g.top - 4)} L88 ${f(g.top + 14)} Z M100 ${f(g.top + 4)} L116 ${f(g.top - 4)} L112 ${f(g.top + 14)} Z`} fill={C.paper} stroke={C.board} strokeWidth={2} strokeLinejoin="round" />
        <path d={`M100 ${f(g.top + 4)} L100 ${f(g.top + 34)}`} stroke={g.edge} strokeWidth={2} />
        {buttons(g, 2, g.top + 14, 12)}
      </g>
    ),
  },
  hoodie: {
    description: 'modern hoodie: hood behind the head, kangaroo pocket, drawstrings',
    eras: ['modern', '2010s', '2020s', 'startup', 'tech'],
    headBack: (g) => <circle cx={f(g.H[0])} cy={f(g.H[1] + 6)} r={46} fill={g.c} stroke={g.edge} strokeWidth={STROKE} />,
    torso: (g) => (
      <g>
        <path d={`M70 ${f(g.P[1] - 50)} L130 ${f(g.P[1] - 50)} L140 ${f(g.P[1] - 6)} L60 ${f(g.P[1] - 6)} Z`} fill={g.c} stroke={g.edge} strokeWidth={STROKE} strokeLinejoin="round" />
        <path d={`M92 ${f(g.top + 2)} L90 ${f(g.top + 40)} M108 ${f(g.top + 2)} L110 ${f(g.top + 40)}`} stroke={C.paper} strokeWidth={4} strokeLinecap="round" fill="none" />
      </g>
    ),
  },
  future: {
    description: 'near future: high collar, diagonal accent stripe, badge light',
    eras: ['future', 'near-future', 'future-skyline', '2030s', 'sci-fi'],
    torso: (g) => (
      <g>
        <path d={`M58 ${f(g.top + 22)} L80 ${f(g.top + 22)} L150 ${f(g.P[1] - 28)} L150 ${f(g.P[1] - 6)} Z`} fill={accentOf(g.c)} stroke={C.board} strokeWidth={2} strokeLinejoin="round" />
        <rect x={78} y={f(g.top - 16)} width={44} height={22} rx={4} fill={g.c} stroke={g.edge} strokeWidth={STROKE} />
        <circle cx={124} cy={f(g.top + 30)} r={6} fill={C.paper} stroke={C.board} strokeWidth={2} />
      </g>
    ),
  },
  worker: {
    description: 'factory / construction worker: overalls bib with straps, hard hat',
    eras: ['factory', 'industry', 'construction', 'worker'],
    hat: 'hard-hat',
    torso: (g) => {
      const bib = g.c === C.ink ? C.stamp : C.ink;
      return (
        <g>
          <path d={`M72 ${f(g.top + 28)} L66 ${f(g.top)} M128 ${f(g.top + 28)} L134 ${f(g.top)}`} stroke={bib} strokeWidth={8} strokeLinecap="round" />
          <rect x={68} y={f(g.top + 28)} width={64} height={f(g.P[1] + 8 - (g.top + 28))} fill={bib} stroke={C.board} strokeWidth={STROKE} />
          <rect x={84} y={f(g.top + 40)} width={32} height={22} fill={bib} stroke={C.board} strokeWidth={2} />
        </g>
      );
    },
  },
  labcoat: {
    description: 'lab coat: open paper-white coat, pen in the pocket',
    eras: ['lab', 'science', 'pharma', 'research'],
    torso: (g) => {
      const L = g.sitting ? 28 : 64;
      const b = g.P[1];
      return (
        <g>
          <path d={`M50 ${f(b - 4)} L94 ${f(b - 4)} L94 ${f(b + L)} L46 ${f(b + L)} Z M150 ${f(b - 4)} L106 ${f(b - 4)} L106 ${f(b + L)} L154 ${f(b + L)} Z`} fill={C.paper} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
          <path d={`M58 ${f(g.top)} L92 ${f(g.top + 6)} L94 ${f(b + 8)} L50 ${f(b + 8)} Z M142 ${f(g.top)} L108 ${f(g.top + 6)} L106 ${f(b + 8)} L150 ${f(b + 8)} Z`} fill={C.paper} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
          <rect x={64} y={f(g.top + 34)} width={22} height={4} fill={C.board} />
          <rect x={70} y={f(g.top + 22)} width={4} height={14} fill={accentOf(g.c)} />
        </g>
      );
    },
  },
  royal: {
    description: 'king / queen: long cape, ermine collar, crown',
    eras: ['royal', 'king', 'queen', 'empire', 'monarchy'],
    hat: 'crown',
    behind: (g) => <path d={`M60 ${f(g.top)} L140 ${f(g.top)} L176 ${f(g.P[1] + 130)} Q100 ${f(g.P[1] + 146)} 24 ${f(g.P[1] + 130)} Z`} fill={g.c === C.stamp ? C.ink : C.stamp} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />,
    torso: (g) => (
      <g>
        <rect x={54} y={f(g.top - 8)} width={92} height={24} rx={10} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
        {[70, 88, 112, 130].map((x) => (
          <rect key={x} x={x - 2} y={f(g.top)} width={4} height={8} fill={C.board} />
        ))}
      </g>
    ),
  },
  trenchcoat: {
    description: 'detective / 1940s trench coat: belt, double buttons, fedora',
    eras: ['noir', 'detective', 'spy', '1940s', 'wartime'],
    hat: 'fedora',
    torso: (g) => (
      <g>
        {skirt(g, C.greyLight, 74, 10)}
        {torsoShape(g, C.greyLight)}
        <path d={`M84 ${f(g.top - 2)} L100 ${f(g.top + 40)} L116 ${f(g.top - 2)} Z`} fill={g.c} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        <rect x={50} y={f(g.P[1] - 24)} width={100} height={12} fill={C.grey} stroke={C.board} strokeWidth={2} />
        {[
          [88, 56],
          [112, 56],
          [88, 80],
          [112, 80],
        ].map(([x, dy]) => (
          <circle key={`${x}-${dy}`} cx={x} cy={f(g.top + dy)} r={4} fill={C.grey} stroke={C.board} strokeWidth={2} />
        ))}
      </g>
    ),
  },
};

export const COSTUME_IDS = Object.keys(COSTUMES);

const norm = (s?: string): string => (s || '').trim().toLowerCase();
const ERA_TO_COSTUME: Record<string, string> = {};
for (const id of COSTUME_IDS) for (const e of COSTUMES[id].eras) if (!ERA_TO_COSTUME[e]) ERA_TO_COSTUME[e] = id;

/** costume id, or an era / alias (e.g. 'medieval', '1920s', 'modern'); unknown = plain. */
export const resolveCostume = (costume?: string, era?: string): string => {
  for (const v of [norm(costume), norm(era)]) {
    if (!v) continue;
    if (COSTUMES[v]) return v;
    if (ERA_TO_COSTUME[v]) return ERA_TO_COSTUME[v];
  }
  return 'plain';
};

// ---------------------------------------------------------------- hats (head-local: head centre 0,0, radius 36)

type HatDef = {description: string; draw: (g: RigGeo) => React.ReactNode};

export const HATS: Record<string, HatDef> = {
  'top-hat': {
    description: '1800s top hat',
    draw: (g) => {
      const d = darkOf(g.c);
      return (
        <g>
          <rect x={-24} y={-98} width={48} height={66} fill={d} stroke={outlineOf(d)} strokeWidth={STROKE} />
          <rect x={-24} y={-46} width={48} height={10} fill={accentOf(g.c)} stroke={outlineOf(d)} strokeWidth={2} />
          <rect x={-42} y={-36} width={84} height={8} rx={4} fill={d} stroke={outlineOf(d)} strokeWidth={STROKE} />
        </g>
      );
    },
  },
  bowler: {
    description: 'bowler / derby',
    draw: (g) => {
      const d = darkOf(g.c);
      return (
        <g>
          <path d="M-30 -24 Q-30 -68 0 -68 Q30 -68 30 -24 Z" fill={d} stroke={outlineOf(d)} strokeWidth={STROKE} />
          <ellipse cx={0} cy={-24} rx={44} ry={7} fill={d} stroke={outlineOf(d)} strokeWidth={STROKE} />
        </g>
      );
    },
  },
  fedora: {
    description: 'fedora with band (1930s-1950s)',
    draw: (g) => {
      const d = darkOf(g.c);
      return (
        <g>
          <path d="M-26 -28 L-22 -70 Q-6 -62 0 -66 Q6 -62 22 -70 L26 -28 Z" fill={d} stroke={outlineOf(d)} strokeWidth={STROKE} strokeLinejoin="round" />
          <rect x={-25} y={-40} width={50} height={10} fill={accentOf(g.c)} />
          <ellipse cx={0} cy={-28} rx={52} ry={9} fill={d} stroke={outlineOf(d)} strokeWidth={STROKE} />
        </g>
      );
    },
  },
  boater: {
    description: 'straw boater (1900s-1920s)',
    draw: (g) => (
      <g>
        <rect x={-28} y={-58} width={56} height={30} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
        <rect x={-28} y={-42} width={56} height={10} fill={accentOf(g.c)} stroke={C.board} strokeWidth={2} />
        <ellipse cx={0} cy={-28} rx={50} ry={8} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
      </g>
    ),
  },
  'flat-cap': {
    description: 'flat cap / newsboy (worker, 1900s-1930s)',
    draw: () => <path d="M-38 -16 Q-38 -54 0 -56 Q34 -54 40 -28 L64 -18 Q30 -10 -38 -16 Z" fill={C.grey} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />,
  },
  'baseball-cap': {
    description: 'baseball cap (modern, sport)',
    draw: (g) => {
      const a = accentOf(g.c);
      return (
        <g>
          <path d="M28 -22 L70 -14 L30 -12 Z" fill={a} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
          <path d="M-34 -18 Q-34 -58 0 -58 Q34 -58 34 -18 Z" fill={a} stroke={C.board} strokeWidth={STROKE} />
        </g>
      );
    },
  },
  'hard-hat': {
    description: 'construction hard hat',
    draw: (g) => {
      const a = g.c === C.stamp ? C.ink : C.stamp;
      return (
        <g>
          <path d="M-36 -20 Q-36 -64 0 -64 Q36 -64 36 -20 Z" fill={a} stroke={C.board} strokeWidth={STROKE} />
          <path d="M0 -64 L0 -24" stroke={C.board} strokeWidth={STROKE} />
          <rect x={-46} y={-24} width={92} height={8} rx={4} fill={a} stroke={C.board} strokeWidth={STROKE} />
        </g>
      );
    },
  },
  crown: {
    description: 'royal crown',
    draw: (g) => (
      <g>
        <path d="M-30 -26 L-32 -72 L-16 -52 L0 -78 L16 -52 L32 -72 L30 -26 Z" fill={g.c === C.stamp ? C.ink : C.stamp} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        {[-18, 0, 18].map((x) => (
          <circle key={x} cx={x} cy={-38} r={4} fill={C.paper} stroke={C.board} strokeWidth={2} />
        ))}
      </g>
    ),
  },
  laurel: {
    description: 'laurel wreath (antiquity)',
    draw: () => (
      <g>
        {Array.from({length: 9}, (_, i) => {
          const a = 195 + i * 18.75;
          const r = (a * Math.PI) / 180;
          const x = Math.cos(r) * 38;
          const y = Math.sin(r) * 38;
          return <ellipse key={i} cx={f(x)} cy={f(y)} rx={12} ry={5} transform={`rotate(${f(a + 90)} ${f(x)} ${f(y)})`} fill={C.greyLight} stroke={C.board} strokeWidth={2} />;
        })}
      </g>
    ),
  },
  capotain: {
    description: 'tall 1600s capotain with buckle',
    draw: (g) => {
      const d = darkOf(g.c);
      return (
        <g>
          <path d="M-24 -30 L-18 -104 L18 -104 L24 -30 Z" fill={d} stroke={outlineOf(d)} strokeWidth={STROKE} strokeLinejoin="round" />
          <rect x={-23} y={-48} width={46} height={12} fill={C.paper} />
          <rect x={-8} y={-50} width={16} height={16} fill="none" stroke={C.greyLight} strokeWidth={3} />
          <ellipse cx={0} cy={-30} rx={48} ry={8} fill={d} stroke={outlineOf(d)} strokeWidth={STROKE} />
        </g>
      );
    },
  },
  'medieval-cap': {
    description: 'floppy medieval chaperon',
    draw: (g) => <path d="M-38 -14 Q-42 -62 0 -64 Q32 -64 38 -40 Q62 -34 70 -4 Q50 -18 36 -16 L38 -14 Z" fill={accentOf(g.c)} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />,
  },
  beret: {
    description: 'beret (artist, designer)',
    draw: (g) => {
      const d = darkOf(g.c);
      return (
        <g>
          <path d="M4 -60 L6 -70" stroke={outlineOf(d)} strokeWidth={4} strokeLinecap="round" />
          <path d="M-40 -22 Q-34 -64 16 -60 Q48 -54 42 -24 Q0 -14 -40 -22 Z" fill={d} stroke={outlineOf(d)} strokeWidth={STROKE} strokeLinejoin="round" />
        </g>
      );
    },
  },
  cowboy: {
    description: 'cowboy hat (oil, rail and cattle barons)',
    draw: () => (
      <g>
        <path d="M-24 -28 L-20 -66 Q0 -56 20 -66 L24 -28 Z" fill={C.grey} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        <path d="M-62 -36 Q-48 -22 0 -24 Q48 -22 62 -36 Q50 -14 0 -14 Q-50 -14 -62 -36 Z" fill={C.grey} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
      </g>
    ),
  },
  headphones: {
    description: 'over-ear headphones (gamer, creator, music)',
    draw: (g) => {
      const a = accentOf(g.c);
      return (
        <g>
          <path d="M-38 -2 Q-40 -50 0 -50 Q40 -50 38 -2" stroke={C.board} strokeWidth={7} fill="none" />
          <rect x={-48} y={-14} width={16} height={28} rx={6} fill={a} stroke={C.board} strokeWidth={STROKE} />
          <rect x={32} y={-14} width={16} height={28} rx={6} fill={a} stroke={C.board} strokeWidth={STROKE} />
        </g>
      );
    },
  },
};

export const HAT_IDS = Object.keys(HATS);
const HAT_ALIASES: Record<string, string> = {tophat: 'top-hat', derby: 'bowler', newsboy: 'flat-cap', cap: 'baseball-cap', helmet: 'hard-hat', wreath: 'laurel', chaperon: 'medieval-cap', puritan: 'capotain'};

export const resolveHat = (h?: string | null): string | null => {
  const v = norm(h || '');
  if (!v || v === 'none') return null;
  if (HATS[v]) return v;
  if (HAT_ALIASES[v]) return HAT_ALIASES[v];
  return null;
};

export const Hat: React.FC<{id: string; g: RigGeo}> = ({id, g}) => {
  const def = HATS[id];
  if (!def) return null;
  return <g transform={`translate(${f(g.H[0])} ${f(g.H[1])}) rotate(${f(g.torso + g.head)})`}>{def.draw(g)}</g>;
};

// ---------------------------------------------------------------- held props (drawn at a hand point)

export const HOLDS: Record<string, string> = {
  briefcase: 'briefcase hanging from the hand',
  phone: 'old telephone handset (pose phone holds it by default)',
  smartphone: 'smartphone',
  newspaper: 'folded newspaper',
  coffee: 'takeaway coffee cup',
  moneybag: 'money bag',
  pen: 'fountain pen',
  contract: 'contract sheet',
  placard: 'protest placard on a stick with holdText (pose protest holds it by default)',
};
export const HOLD_IDS = Object.keys(HOLDS);

export const resolveHold = (h?: string | null): string | null => {
  const v = norm(h || '');
  if (!v || v === 'none') return null;
  if (HOLDS[v]) return v;
  if (v === 'sign') return 'placard';
  if (v === 'cup') return 'coffee';
  if (v === 'handset') return 'phone';
  return null;
};

export const HeldProp: React.FC<{id: string; at: Pt; g: RigGeo; text?: string}> = ({id, at, g, text}) => {
  const x = at[0];
  const y = at[1];
  const dk = g.c === C.board ? C.stamp : C.board;
  const unflip = (cx: number): string | undefined => (g.flip ? `translate(${f(2 * cx)} 0) scale(-1 1)` : undefined);
  switch (id) {
    case 'briefcase':
      return (
        <g>
          <path d={`M${f(x - 12)} ${f(y + 10)} L${f(x - 12)} ${f(y - 2)} L${f(x + 12)} ${f(y - 2)} L${f(x + 12)} ${f(y + 10)}`} stroke={C.board} strokeWidth={5} fill="none" />
          <rect x={f(x - 38)} y={f(y + 8)} width={76} height={54} rx={4} fill={dk} stroke={outlineOf(dk)} strokeWidth={STROKE} />
          <rect x={f(x - 6)} y={f(y + 16)} width={12} height={8} fill={C.paper} />
        </g>
      );
    case 'phone':
      return (
        <g transform={`translate(${f(x)} ${f(y)}) rotate(-25)`}>
          <rect x={-10} y={-34} width={20} height={68} rx={8} fill={C.board} stroke={C.grey} strokeWidth={2} />
          <rect x={-14} y={-38} width={28} height={16} rx={6} fill={C.board} stroke={C.grey} strokeWidth={2} />
          <rect x={-14} y={22} width={28} height={16} rx={6} fill={C.board} stroke={C.grey} strokeWidth={2} />
        </g>
      );
    case 'smartphone':
      return (
        <g transform={`translate(${f(x)} ${f(y)})`}>
          <rect x={-13} y={-24} width={26} height={48} rx={4} fill={C.board} stroke={C.grey} strokeWidth={2} />
          <rect x={-9} y={-18} width={18} height={34} fill={C.greyLight} />
        </g>
      );
    case 'newspaper':
      return (
        <g transform={`translate(${f(x)} ${f(y)})`}>
          <rect x={-6} y={-46} width={64} height={80} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
          <rect x={2} y={-40} width={48} height={10} fill={C.board} />
          {[-22, -14, -6, 2, 10, 18].map((ly) => (
            <path key={ly} d={`M2 ${ly} L50 ${ly}`} stroke={C.grey} strokeWidth={3} />
          ))}
        </g>
      );
    case 'coffee':
      return (
        <g transform={`translate(${f(x)} ${f(y + 16)})`}>
          <path d="M-12 -34 L12 -34 L9 2 L-9 2 Z" fill={C.paper} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
          <rect x={-11} y={-24} width={22} height={12} fill={accentOf(g.c)} />
          <rect x={-14} y={-40} width={28} height={7} rx={3} fill={C.board} />
        </g>
      );
    case 'moneybag':
      return (
        <g>
          <path d={`M${f(x - 8)} ${f(y + 6)} Q${f(x - 40)} ${f(y + 30)} ${f(x - 34)} ${f(y + 66)} Q${f(x)} ${f(y + 80)} ${f(x + 34)} ${f(y + 66)} Q${f(x + 40)} ${f(y + 30)} ${f(x + 8)} ${f(y + 6)} Z`} fill={C.greyLight} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
          <rect x={f(x - 10)} y={f(y + 2)} width={20} height={8} fill={C.board} />
          <g transform={unflip(x)}>
            <text x={f(x)} y={f(y + 60)} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} fill={C.board}>
              $
            </text>
          </g>
        </g>
      );
    case 'pen':
      return (
        <g transform={`translate(${f(x)} ${f(y)}) rotate(-35)`}>
          <rect x={-4} y={-44} width={8} height={52} rx={3} fill={C.board} stroke={C.grey} strokeWidth={1} />
          <path d="M-4 8 L0 18 L4 8 Z" fill={C.greyLight} stroke={C.board} strokeWidth={1} />
        </g>
      );
    case 'contract':
      return (
        <g transform={`translate(${f(x)} ${f(y)})`}>
          <rect x={-10} y={-30} width={60} height={76} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
          {[-18, -10, -2, 6].map((ly) => (
            <path key={ly} d={`M-2 ${ly} L42 ${ly}`} stroke={C.grey} strokeWidth={3} />
          ))}
          <path d="M-2 32 Q8 20 14 32 T30 30 L42 28" stroke={C.ink} strokeWidth={3} fill="none" />
        </g>
      );
    case 'placard': {
      const txt = (text || '').toUpperCase();
      const fs = Math.max(12, Math.min(34, 140 / (0.62 * Math.max(1, txt.length))));
      return (
        <g>
          <rect x={f(x - 4)} y={f(y - 84)} width={8} height={104} fill={C.grey} stroke={C.board} strokeWidth={2} />
          <rect x={f(x - 80)} y={f(y - 172)} width={160} height={92} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
          {txt ? (
            <g transform={unflip(x)}>
              <text x={f(x)} y={f(y - 126 + fs * 0.35)} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={f(fs)} fill={C.board}>
                {txt}
              </text>
            </g>
          ) : (
            <path d={`M${f(x - 56)} ${f(y - 140)} L${f(x + 56)} ${f(y - 140)} M${f(x - 56)} ${f(y - 112)} L${f(x + 30)} ${f(y - 112)}`} stroke={C.board} strokeWidth={8} strokeLinecap="round" />
          )}
        </g>
      );
    }
    default:
      return null;
  }
};

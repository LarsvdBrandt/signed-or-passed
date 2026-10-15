import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {useUnit} from '../components/common';
import {ease, textOn, usePlot, type InfoProps} from './shared';

/*
 * INFOGRAPHICS-3: diagrams without data (no sourceId needed): org-chart, family-tree, flow.
 * People are faceless silhouettes (house rule: no likeness of real people).
 */

/* ------------------------------------------------------------ tree helpers */

type TNode = {
  key: string;
  label: string;
  sub: string;
  colour: string | null;
  highlight: boolean;
  partner: {label: string; sub: string} | null;
  children: TNode[];
  depth: number;
  w: number;
  ux: number;
};

const MAX_NODES = 24;
const MAX_DEPTH = 4;

const str = (x: unknown): string => (x === undefined || x === null ? '' : String(x));
const safeId = (s: string): string => s.replace(/[^A-Za-z0-9_-]/g, '-');

/** Tree from {root: {label, children: [...]}} or {nodes: [{id, label, parent?}]} (max 24 nodes, 5 levels). */
const buildTree = (d: any, subKey: string): TNode | null => {
  let count = 0;
  const conv = (raw: any, depth: number, key: string): TNode | null => {
    if (!raw || typeof raw !== 'object' || count >= MAX_NODES) return null;
    count++;
    const p = raw.partner;
    const partner = p
      ? typeof p === 'object'
        ? {label: str(p.label ?? p.name), sub: str(p[subKey] ?? p.sub)}
        : {label: str(p), sub: ''}
      : null;
    const node: TNode = {
      key,
      label: str(raw.label ?? raw.name),
      sub: str(raw[subKey] ?? raw.sub),
      colour: raw.colour ? String(raw.colour) : null,
      highlight: !!raw.highlight,
      partner,
      children: [],
      depth,
      w: partner ? 2 : 1,
      ux: 0,
    };
    if (depth < MAX_DEPTH && Array.isArray(raw.children)) {
      (raw.children as any[]).forEach((c: any, i: number) => {
        const n = conv(c, depth + 1, `${key}-${i}`);
        if (n) node.children.push(n);
      });
    }
    return node;
  };
  if (d && d.root) return conv(d.root, 0, 'r');
  if (d && Array.isArray(d.nodes) && d.nodes.length) {
    const list = d.nodes as any[];
    const byId = new Map<string, any>();
    list.forEach((n: any, i: number) => byId.set(str(n?.id ?? i), {...(n || {}), children: []}));
    let root: any = null;
    list.forEach((n: any, i: number) => {
      const me = byId.get(str(n?.id ?? i));
      const par = n?.parent !== undefined && n?.parent !== null ? byId.get(str(n.parent)) : undefined;
      if (par && par !== me) par.children.push(me);
      else if (!root) root = me;
    });
    return root ? conv(root, 0, 'r') : null;
  }
  return null;
};

const flatten = (n: TNode, out: TNode[] = []): TNode[] => {
  out.push(n);
  n.children.forEach((c) => flatten(c, out));
  return out;
};

const shift = (n: TNode, dx: number): void => {
  n.ux += dx;
  n.children.forEach((c) => shift(c, dx));
};

/** Leaves get consecutive slots (partners take 2); parents sit above the middle of their children. */
const layoutTree = (root: TNode): {units: number; depth: number} => {
  let cursor = 0;
  let depth = 0;
  const place = (n: TNode): void => {
    depth = Math.max(depth, n.depth);
    const start = cursor;
    if (!n.children.length) {
      n.ux = cursor + n.w / 2;
      cursor += n.w;
      return;
    }
    n.children.forEach(place);
    const span = cursor - start;
    if (span < n.w) {
      n.children.forEach((c) => shift(c, (n.w - span) / 2));
      cursor = start + n.w;
    }
    n.ux = (n.children[0].ux + n.children[n.children.length - 1].ux) / 2;
  };
  place(root);
  return {units: Math.max(1, cursor), depth};
};

const Silhouette: React.FC<{size: number; ring: string; fill: string}> = ({size, ring, fill}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{flexShrink: 0}}>
    <circle cx={50} cy={50} r={46} fill={ring} stroke={C.board} strokeWidth={5} />
    <circle cx={50} cy={40} r={15} fill={fill} />
    <path d="M23 84 Q25 60 50 60 Q75 60 77 84 Z" fill={fill} />
  </svg>
);

/* --------------------------------------------------------------- org-chart */

/**
 * org-chart: data {root: {label, title?, highlight?, colour?, children: [...]}} or {nodes: [{id, label, title?, parent?}]}
 * (max 24 nodes, 5 levels). Cards with a faceless avatar pop in level by level; elbow connectors draw themselves.
 */
export const OrgChart: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const {width, height, left, top, W, H} = usePlot();
  const root = buildTree(v.data || {}, 'title');
  if (!root) return null;
  const {units, depth} = layoutTree(root);
  const nodes = flatten(root);
  const unitW = W / units;
  const levelH = H / (depth + 1);
  const cardW = Math.min(unitW * 0.9, 360 * u);
  const cardH = Math.min(levelH * 0.58, 120 * u);
  const D = Math.max(1, scene.durationFrames);
  const stagger = Math.max(6, Math.min(26, (D * 0.55) / (depth + 1)));
  const at = (n: TNode) => 6 + n.depth * stagger;
  const X = (n: TNode) => left + n.ux * unitW;
  const Y = (n: TNode) => top + levelH * (n.depth + 0.5);
  const avatar = Math.min(cardH * 0.72, cardW * 0.26);
  const textW = Math.max(10, cardW - avatar - 36 * u);
  const fsSub = Math.min(24 * u, cardH * 0.2);
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {nodes.map((n) =>
          n.children.map((c) => {
            const p = ease(frame, at(c) - 8, at(c) + 2);
            if (p <= 0) return null;
            const x1 = X(n);
            const y1 = Y(n) + cardH / 2;
            const x2 = X(c);
            const y2 = Y(c) - cardH / 2;
            const my = (y1 + y2) / 2;
            return (
              <path key={c.key} d={`M${x1} ${y1} V${my} H${x2} V${y2}`} fill="none" stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
            );
          }),
        )}
      </svg>
      {nodes.map((n) => {
        const s = spring({frame: Math.max(0, frame - at(n)), fps, config: {damping: 13}});
        if (s <= 0.001) return null;
        const fill = n.colour ? colourOf(n.colour, C.paper) : n.highlight ? C.ink : C.paper;
        const tc = textOn(fill);
        const fsLabel = Math.min(34 * u, cardH * 0.3, textW / Math.max(1, n.label.length * 0.56));
        return (
          <div key={n.key} style={{position: 'absolute', left: X(n) - cardW / 2, top: Y(n) - cardH / 2, width: cardW, height: cardH, background: fill, border: `${STROKE}px solid ${C.board}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10 * u, padding: `0 ${12 * u}px`, transform: `scale(${s})`, overflow: 'hidden'}}>
            <Silhouette size={avatar} ring={tc === C.paper ? C.paper : C.greyLight} fill={C.board} />
            <div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
              <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fsLabel, color: tc, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{n.label}</div>
              {n.sub ? (
                <div style={{fontFamily: FONT_MONO, fontSize: fsSub, color: tc, opacity: 0.85, marginTop: 4 * u, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{n.sub}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- family-tree */

/**
 * family-tree: data {root: {label, years?, partner?: {label, years?} | "name", highlight?, colour?, children: [...]}} or
 * {nodes: [{id, label, years?, parent?, partner?}]} (max 24 people, 5 generations). Round faceless medallions per
 * generation; partners joined by a double line; descent lines draw down from the couple.
 */
export const FamilyTree: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const {width, height, left, top, W, H} = usePlot();
  const root = buildTree(v.data || {}, 'years');
  if (!root) return null;
  const {units, depth} = layoutTree(root);
  const nodes = flatten(root);
  const unitW = W / units;
  const levelH = H / (depth + 1);
  const r = Math.max(14 * u, Math.min(unitW * 0.3, levelH * 0.24, 72 * u));
  const fsName = Math.min(30 * u, Math.max(14 * u, r * 0.42));
  const fsYears = fsName * 0.75;
  const labelW = unitW * 0.95;
  const D = Math.max(1, scene.durationFrames);
  const stagger = Math.max(6, Math.min(28, (D * 0.55) / (depth + 1)));
  const at = (n: TNode) => 6 + n.depth * stagger;
  const X = (n: TNode) => left + n.ux * unitW;
  const CY = (n: TNode) => top + levelH * (n.depth + 0.5) - levelH * 0.1;
  const people = (n: TNode): Array<{x: number; label: string; sub: string; delay: number; side: string}> =>
    n.partner
      ? [
          {x: X(n) - unitW / 2, label: n.label, sub: n.sub, delay: 0, side: 'a'},
          {x: X(n) + unitW / 2, label: n.partner.label, sub: n.partner.sub, delay: 6, side: 'b'},
        ]
      : [{x: X(n), label: n.label, sub: n.sub, delay: 0, side: 'a'}];
  const below = (n: TNode) => (n.partner ? CY(n) : CY(n) + r + fsName * 1.3 + (n.sub ? fsYears * 1.3 : 0) + 10 * u);
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {nodes.map((n) =>
          n.children.map((c) => {
            const p = ease(frame, at(c) - 10, at(c) + 2);
            if (p <= 0) return null;
            const x1 = X(n);
            const y1 = below(n);
            const x2 = X(c);
            const y2 = CY(c) - r;
            const my = y2 - Math.max(12 * u, (y2 - y1) * 0.35);
            return (
              <path key={'l' + c.key} d={`M${x1} ${y1} V${my} H${x2} V${y2}`} fill="none" stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
            );
          }),
        )}
        {nodes.map((n) => {
          if (!n.partner) return null;
          const o = ease(frame, at(n) + 6, at(n) + 14);
          const xa = X(n) - unitW / 2 + r;
          const xb = X(n) + unitW / 2 - r;
          return (
            <g key={'p' + n.key} opacity={o}>
              <line x1={xa} y1={CY(n) - 4 * u} x2={xb} y2={CY(n) - 4 * u} stroke={C.board} strokeWidth={STROKE} />
              <line x1={xa} y1={CY(n) + 4 * u} x2={xb} y2={CY(n) + 4 * u} stroke={C.board} strokeWidth={STROKE} />
            </g>
          );
        })}
        {nodes.map((n) =>
          people(n).map((pp) => {
            const s = spring({frame: Math.max(0, frame - at(n) - pp.delay), fps, config: {damping: 12}});
            if (s <= 0.001) return null;
            const cx = pp.x;
            const cy = CY(n);
            const fill = n.colour && pp.side === 'a' ? colourOf(n.colour, C.greyLight) : n.highlight && pp.side === 'a' ? C.stamp : C.greyLight;
            const clip = safeId(`ft-${scene.id}-${n.key}-${pp.side}`);
            return (
              <g key={n.key + pp.side} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
                <defs>
                  <clipPath id={clip}>
                    <circle cx={cx} cy={cy} r={r} />
                  </clipPath>
                </defs>
                <circle cx={cx} cy={cy} r={r} fill={fill} />
                <g clipPath={`url(#${clip})`}>
                  <circle cx={cx} cy={cy - r * 0.2} r={r * 0.32} fill={C.board} />
                  <path d={`M${cx - r * 0.66} ${cy + r} Q${cx - r * 0.62} ${cy + r * 0.2} ${cx} ${cy + r * 0.2} Q${cx + r * 0.62} ${cy + r * 0.2} ${cx + r * 0.66} ${cy + r} Z`} fill={C.board} />
                </g>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.board} strokeWidth={STROKE} />
              </g>
            );
          }),
        )}
      </svg>
      {nodes.map((n) =>
        people(n).map((pp) => {
          const o = ease(frame, at(n) + pp.delay + 4, at(n) + pp.delay + 12);
          if (o <= 0) return null;
          return (
            <div key={'t' + n.key + pp.side} style={{position: 'absolute', left: pp.x - labelW / 2, width: labelW, top: CY(n) + r + 8 * u, textAlign: 'center', opacity: o}}>
              <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fsName, color: C.board, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{pp.label}</div>
              {pp.sub ? <div style={{fontFamily: FONT_MONO, fontSize: fsYears, color: C.grey, lineHeight: 1.2, whiteSpace: 'nowrap'}}>{pp.sub}</div> : null}
            </div>
          );
        }),
      )}
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------- flow */

type Step = {id: string; label: string; note: string; shape: string; colour: string | null; highlight: boolean};
type Pt = [number, number];

const SHAPES = ['box', 'decision', 'start', 'end'];

/** Point on the outline of a step shape (half sizes hw, hh) in direction (dx, dy) from its centre. */
const edgePoint = (shape: string, cx: number, cy: number, hw: number, hh: number, dx: number, dy: number): Pt => {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax + ay < 1e-6) return [cx, cy];
  const t = shape === 'decision' ? 1 / (ax / hw + ay / hh) : Math.min(ax > 1e-9 ? hw / ax : Infinity, ay > 1e-9 ? hh / ay : Infinity);
  return [cx + dx * t, cy + dy * t];
};

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];

/**
 * flow: data {steps: [{id?, label, note?, shape?: box | decision | start | end, colour?, highlight?}] (max 12),
 * links?: [{from, to, label?}] (step id or index; default step 1 -> 2 -> 3 ...), direction?: horizontal | vertical,
 * numbered? (default true)}. Steps pop in one by one in a snake layout; arrows grow towards the next step;
 * decisions are orange diamonds, start / end are black pills.
 */
export const FlowDiagram: React.FC<InfoProps> = ({v, scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const {width, height, portrait, left, top, W, H} = usePlot();
  const d = v.data || {};
  const steps: Step[] = ((d.steps || []) as any[]).slice(0, 12).map((s: any, i: number) => {
    const o = s && typeof s === 'object' ? s : {label: s};
    const shape = SHAPES.includes(String(o.shape)) ? String(o.shape) : 'box';
    return {id: str(o.id ?? i), label: str(o.label), note: str(o.note), shape, colour: o.colour ? String(o.colour) : null, highlight: !!o.highlight};
  });
  const n = steps.length;
  if (!n) return null;
  const vertical = String(d.direction || (portrait ? 'vertical' : 'horizontal')) === 'vertical';
  const lanes = n <= 5 ? 1 : Math.ceil(n / 5);
  const perLane = Math.ceil(n / lanes);
  const numCols = vertical ? lanes : perLane;
  const numRows = vertical ? perLane : lanes;
  const cellW = W / numCols;
  const cellH = H / numRows;
  const pos: Pt[] = steps.map((_, i) => {
    const lane = Math.floor(i / perLane);
    let k = i % perLane;
    if (lane % 2 === 1) k = perLane - 1 - k;
    const c = vertical ? lane : k;
    const r = vertical ? k : lane;
    return [left + (c + 0.5) * cellW, top + (r + 0.5) * cellH];
  });
  const bw = Math.min(cellW * 0.7, 400 * u);
  const bh = Math.min(cellH * 0.52, 150 * u);
  const half = (s: Step): Pt => (s.shape === 'decision' ? [bw * 0.55, bh * 0.62] : [bw / 2, bh / 2]);
  const D = Math.max(1, scene.durationFrames);
  const stagger = Math.max(6, Math.min(30, (D * 0.6) / n));
  const at = (i: number) => 6 + i * stagger;
  const indexOf = (x: unknown): number => {
    if (typeof x === 'number' && Number.isInteger(x)) return x >= 0 && x < n ? x : -1;
    const k = steps.findIndex((s) => s.id === String(x));
    return k;
  };
  const rawLinks: any[] = Array.isArray(d.links) && d.links.length ? d.links : steps.slice(1).map((_, i) => ({from: i, to: i + 1}));
  const links = rawLinks
    .map((l: any) => ({a: indexOf(l?.from), b: indexOf(l?.to), label: str(l?.label)}))
    .filter((l) => l.a >= 0 && l.b >= 0 && l.a !== l.b)
    .slice(0, 20);
  const numbered = d.numbered !== false;
  const arrowSize = 18 * u;
  const fs = Math.min(34 * u, bh * 0.26);
  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {links.map((l, li) => {
          const P = pos[l.a];
          const Q = pos[l.b];
          const dist = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
          if (dist < 1) return null;
          const adjacent = Math.abs(l.a - l.b) === 1;
          const bend = adjacent ? 0 : 0.28 * dist;
          const nx = -(Q[1] - P[1]) / dist;
          const ny = (Q[0] - P[0]) / dist;
          const Cc: Pt = [(P[0] + Q[0]) / 2 + nx * bend, (P[1] + Q[1]) / 2 + ny * bend];
          const hA = half(steps[l.a]);
          const hB = half(steps[l.b]);
          const S = edgePoint(steps[l.a].shape, P[0], P[1], hA[0] + 6 * u, hA[1] + 6 * u, Cc[0] - P[0], Cc[1] - P[1]);
          const E = edgePoint(steps[l.b].shape, Q[0], Q[1], hB[0] + 8 * u, hB[1] + 8 * u, Cc[0] - Q[0], Cc[1] - Q[1]);
          const start = Math.max(at(l.a), at(l.b) - stagger) + 4;
          const p = ease(frame, start, start + Math.max(6, stagger * 0.75));
          if (p <= 0) return null;
          const pts: Pt[] = [];
          const N = 20;
          for (let k = 0; k <= N; k++) pts.push(quad(S, Cc, E, (p * k) / N));
          const tip = pts[pts.length - 1];
          const dx = 2 * (1 - p) * (Cc[0] - S[0]) + 2 * p * (E[0] - Cc[0]);
          const dy = 2 * (1 - p) * (Cc[1] - S[1]) + 2 * p * (E[1] - Cc[1]);
          const dl = Math.max(1e-6, Math.hypot(dx, dy));
          const ux = dx / dl;
          const uy = dy / dl;
          const head = `${tip[0]},${tip[1]} ${tip[0] - ux * arrowSize - uy * arrowSize * 0.55},${tip[1] - uy * arrowSize + ux * arrowSize * 0.55} ${tip[0] - ux * arrowSize + uy * arrowSize * 0.55},${tip[1] - uy * arrowSize - ux * arrowSize * 0.55}`;
          return (
            <g key={'k' + li}>
              <polyline points={pts.map((q) => `${q[0]},${q[1]}`).join(' ')} fill="none" stroke={C.board} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
              <polygon points={head} fill={C.board} stroke={C.board} strokeWidth={2} strokeLinejoin="round" />
            </g>
          );
        })}
        {steps.map((s, i) => {
          const sp = spring({frame: Math.max(0, frame - at(i)), fps, config: {damping: 12}});
          if (sp <= 0.001) return null;
          const [cx, cy] = pos[i];
          const [hw, hh] = half(s);
          const fill = s.colour
            ? colourOf(s.colour, C.paper)
            : s.highlight
              ? C.ink
              : s.shape === 'decision'
                ? C.stamp
                : s.shape === 'start' || s.shape === 'end'
                  ? C.board
                  : C.paper;
          return (
            <g key={'s' + i} transform={`translate(${cx} ${cy}) scale(${sp}) translate(${-cx} ${-cy})`}>
              {s.shape === 'decision' ? (
                <polygon points={`${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`} fill={fill} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
              ) : (
                <rect x={cx - hw} y={cy - hh} width={hw * 2} height={hh * 2} rx={s.shape === 'box' ? 4 * u : hh} fill={fill} stroke={C.board} strokeWidth={STROKE} />
              )}
              {numbered && s.shape === 'box' ? (
                <g>
                  <circle cx={cx - hw} cy={cy - hh} r={20 * u} fill={C.board} />
                  <text x={cx - hw} y={cy - hh + 8 * u} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={22 * u} fill={C.paper}>
                    {i + 1}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      {steps.map((s, i) => {
        const o = ease(frame, at(i) + 3, at(i) + 10);
        if (o <= 0) return null;
        const [cx, cy] = pos[i];
        const [hw, hh] = half(s);
        const fill = s.colour ? colourOf(s.colour, C.paper) : s.highlight ? C.ink : s.shape === 'decision' ? C.stamp : s.shape === 'start' || s.shape === 'end' ? C.board : C.paper;
        const innerW = s.shape === 'decision' ? hw * 1.15 : hw * 1.8;
        return (
          <React.Fragment key={'t' + i}>
            <div style={{position: 'absolute', left: cx - innerW / 2, top: cy - hh, width: innerW, height: hh * 2, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: s.shape === 'decision' ? fs * 0.9 : fs, lineHeight: 1.1, color: textOn(fill), opacity: o, overflow: 'hidden'}}>
              {s.label}
            </div>
            {s.note ? (
              <div style={{position: 'absolute', left: cx - cellW * 0.45, width: cellW * 0.9, top: cy + hh + 10 * u, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 22 * u, color: C.grey, opacity: o}}>
                {s.note}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
      {links.map((l, li) => {
        if (!l.label) return null;
        const P = pos[l.a];
        const Q = pos[l.b];
        const dist = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
        if (dist < 1) return null;
        const bend = Math.abs(l.a - l.b) === 1 ? 0 : 0.28 * dist;
        const mx = (P[0] + Q[0]) / 2 + (-(Q[1] - P[1]) / dist) * bend * 0.5;
        const my = (P[1] + Q[1]) / 2 + ((Q[0] - P[0]) / dist) * bend * 0.5;
        const start = Math.max(at(l.a), at(l.b) - stagger) + 4 + Math.max(6, stagger * 0.75);
        const o = ease(frame, start, start + 6);
        if (o <= 0) return null;
        return (
          <div key={'ll' + li} style={{position: 'absolute', left: mx, top: my, transform: 'translate(-50%, -50%)', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 22 * u, color: C.board, background: C.paper, border: `2px solid ${C.board}`, padding: `${2 * u}px ${8 * u}px`, whiteSpace: 'nowrap', opacity: o}}>
            {l.label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

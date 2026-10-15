import React from 'react';
import {AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {Kicker, clamp, enterStyle, useUnit} from '../components/common';
import {ALL_ILLUSTRATIONS, BACKDROPS} from '../illustrations';
import type {SceneProps} from '../types';
import {eraKit, type EraKit} from './eras';
import {PARTS} from './parts';

/**
 * SCENE TEMPLATES: ready-made, era-aware compositions built from the illustration library.
 * Scene kind 'template': visual {template, era?, labels?, colours?, props?}. The era swaps backdrop, costumes and
 * props (render/src/templates/eras.ts). props.background / props.layers / props.overlays extend the first panel.
 * See docs/library/templates.md.
 */

export type TLayer = {
  component: string;
  props?: any;
  x?: number;
  y?: number;
  scale?: number;
  enter?: string;
  delaySec?: number;
  /** slow travel in percent of the frame per second, from startSec */
  drift?: {dx?: number; dy?: number; startSec?: number};
};
export type Overlay = {
  text?: string;
  x?: number;
  y?: number;
  /** stamp | sign | banner | caption | neon | flash */
  style?: string;
  colour?: string;
  rotate?: number;
  delaySec?: number;
  size?: number;
};
export type Panel = {background: string; layers: TLayer[]};
export type TemplateOut = {layout?: 'full' | 'split'; panels: Panel[]; overlays?: Overlay[]};
export type TemplateArgs = {era: EraKit; labels: Record<string, any>; colours: Record<string, any>; props: any; verdict: string};
export type TemplateDef = {
  id: string;
  name: string;
  description: string;
  /** label / colour keys the template understands */
  slots: Record<string, string>;
  defaultEra: string;
  previewEras: string[];
  build: (a: TemplateArgs) => TemplateOut;
};

const DARK = new Set(['board', 'ink', 'stamp']);

const lab = (a: TemplateArgs, k: string, d: string): string => (typeof a.labels[k] === 'string' ? a.labels[k] : d);
const col = (a: TemplateArgs, k: string, d: string): string => (typeof a.colours[k] === 'string' && a.colours[k] ? a.colours[k] : d);
const person = (a: TemplateArgs, x: number, y: number, props: any, extra: Partial<TLayer> = {}): TLayer => ({
  component: 'Character',
  x,
  y,
  scale: 1.15,
  enter: 'fade',
  ...extra,
  props: {costume: a.era.costume, ...props},
});
const crowd = (a: TemplateArgs, x: number, y: number, props: any, extra: Partial<TLayer> = {}): TLayer => ({
  component: 'Crowd2',
  x,
  y,
  scale: 1,
  enter: 'slide-up',
  ...extra,
  props: {costumes: [a.era.costume], colours: ['grey', 'board', 'greyLight'], seed: 5, ...props},
});
const cardIf = (label: string, x: number, y: number, colour: string, delaySec = 0.6): TLayer[] =>
  label ? [{component: 'NameCard', x, y, scale: 0.7, enter: 'pop', delaySec, props: {label, colour}}] : [];
const bannerIf = (text: string, colour: string, y = 10, x = 50, delaySec = 0.2): Overlay[] => (text ? [{text, x, y, style: 'banner', colour, delaySec}] : []);
const stampIf = (text: string, x: number, y: number, colour: string, delaySec: number, rotate = -8): Overlay[] =>
  text ? [{text, x, y, style: 'stamp', colour, delaySec, rotate}] : [];
const signIf = (text: string, x: number, y: number, delaySec = 0.5): Overlay[] => (text ? [{text, x, y, style: 'sign', delaySec}] : []);
const captionIf = (text: string, x: number, y: number, delaySec = 0.8): Overlay[] => (text ? [{text, x, y, style: 'caption', delaySec}] : []);

export const TEMPLATES: Record<string, TemplateDef> = {
  'boardroom-meeting': {
    id: 'boardroom-meeting',
    name: 'Boardroom meeting',
    description: 'Three people around a table with a document between them: negotiations, board votes, an offer on the table.',
    slots: {left: 'name card left (BUYER)', right: 'name card right (SELLER)', chair: 'colour only: the person in the middle', document: 'label on the document (OFFER)', banner: 'optional banner at the top'},
    defaultEra: 'modern',
    previewEras: ['eighties', 'ancient'],
    build: (a) => ({
      panels: [
        {
          background: a.era.room,
          layers: [
            person(a, 26, 58, {pose: 'talk', colour: col(a, 'left', 'ink')}),
            person(a, 50, 52, {pose: 'thinking', colour: col(a, 'chair', 'board')}, {scale: 1.0, delaySec: 0.2}),
            person(a, 74, 58, {pose: 'arms-crossed', colour: col(a, 'right', 'stamp'), flip: true}, {delaySec: 0.4}),
            {component: 'Desk', x: 50, y: 86, scale: 1.9, enter: 'slide-up'},
            {component: a.era.doc, x: 50, y: 77, scale: 0.55, enter: 'drop', delaySec: 0.8, props: {label: lab(a, 'document', 'OFFER')}},
            ...cardIf(lab(a, 'left', 'BUYER'), 26, 93, col(a, 'left', 'ink'), 0.6),
            ...cardIf(lab(a, 'right', 'SELLER'), 74, 93, col(a, 'right', 'stamp'), 0.8),
          ],
        },
      ],
      overlays: bannerIf(lab(a, 'banner', ''), 'board'),
    }),
  },
  'phone-call-split-screen': {
    id: 'phone-call-split-screen',
    name: 'Phone call (split screen)',
    description: 'Two people on a call, each in their own half (stacked in Shorts). Before the telephone: a messenger, a letter or a telegram.',
    slots: {left: 'name card left (CALLER)', right: 'name card right (RECEIVER)', line: 'banner + text on the device (era default: INCOMING CALL / TELEGRAM / A LETTER ARRIVES)'},
    defaultEra: 'fifties',
    previewEras: ['industrial', 'modern'],
    build: (a) => {
      const side = (k: string, d: string, colour: string, flip: boolean, delay: number): Panel => ({
        background: a.era.backdrop,
        layers: [
          person(a, 50, 58, {pose: a.era.callPose, hold: a.era.callHold, colour, flip}, {scale: 1.35, delaySec: delay}),
          {component: a.era.comm, x: flip ? 20 : 80, y: 76, scale: 0.6, enter: 'pop', delaySec: delay + 0.3, props: {label: lab(a, 'line', a.era.callText)}},
          ...cardIf(lab(a, k, d), 50, 92, colour, delay + 0.5),
        ],
      });
      return {
        layout: 'split',
        panels: [side('left', 'CALLER', col(a, 'left', 'ink'), false, 0), side('right', 'RECEIVER', col(a, 'right', 'stamp'), true, 0.4)],
        overlays: bannerIf(lab(a, 'line', a.era.callText), 'board', 9),
      };
    },
  },
  'signing-ceremony': {
    id: 'signing-ceremony',
    name: 'Signing ceremony',
    description: 'Handshake over the document while a small audience applauds; a SIGNED stamp lands at 2.2 s.',
    slots: {left: 'name card left (PARTY A)', right: 'name card right (PARTY B)', document: 'label on the document (AGREEMENT)', stamp: 'stamp text (SIGNED; empty = none)', banner: 'optional banner'},
    defaultEra: 'modern',
    previewEras: ['medieval', 'twenties'],
    build: (a) => ({
      panels: [
        {
          background: a.era.room,
          layers: [
            crowd(a, 50, 50, {count: 10, seed: 7, poses: ['applause', 'talk'], rows: 2}, {scale: 0.85}),
            person(a, 40, 60, {pose: 'handshake', colour: col(a, 'left', 'ink')}, {enter: 'slide-right', delaySec: 0.2}),
            person(a, 60, 60, {pose: 'handshake', colour: col(a, 'right', 'stamp'), flip: true}, {enter: 'slide-left', delaySec: 0.2}),
            {component: 'Desk', x: 50, y: 88, scale: 1.7, enter: 'slide-up'},
            {component: a.era.doc, x: 44, y: 80, scale: 0.5, enter: 'drop', delaySec: 0.7, props: {label: lab(a, 'document', 'AGREEMENT')}},
            {component: a.era.seal, x: 58, y: 80, scale: 0.55, enter: 'slide-left', delaySec: 1.0},
            ...cardIf(lab(a, 'left', 'PARTY A'), 20, 92, col(a, 'left', 'ink'), 0.6),
            ...cardIf(lab(a, 'right', 'PARTY B'), 80, 92, col(a, 'right', 'stamp'), 0.8),
          ],
        },
      ],
      overlays: [...stampIf(lab(a, 'stamp', 'SIGNED'), 50, 28, col(a, 'stamp', 'ink'), 2.2), ...bannerIf(lab(a, 'banner', ''), 'board')],
    }),
  },
  'rejection-letter': {
    id: 'rejection-letter',
    name: 'Rejection letter',
    description: 'An envelope, the letter, a REJECTED stamp and a slumped recipient.',
    slots: {document: 'label on the letter (YOUR OFFER)', stamp: 'stamp text (REJECTED)', recipient: 'name card of the recipient (optional)', note: 'optional caption under the letter'},
    defaultEra: 'modern',
    previewEras: ['golden-age', 'nineties'],
    build: (a) => ({
      panels: [
        {
          background: 'greyLight',
          layers: [
            {component: 'Envelope', x: 22, y: 58, scale: 1.2, enter: 'slide-left'},
            {component: a.era.doc, x: 52, y: 52, scale: 1.7, enter: 'drop', delaySec: 0.4, props: {label: lab(a, 'document', 'YOUR OFFER')}},
            person(a, 84, 60, {pose: 'slump', colour: col(a, 'recipient', 'ink')}, {delaySec: 0.8}),
            ...cardIf(lab(a, 'recipient', ''), 84, 92, col(a, 'recipient', 'ink'), 1.0),
          ],
        },
      ],
      overlays: [...stampIf(lab(a, 'stamp', 'REJECTED'), 52, 55, col(a, 'stamp', 'stamp'), 1.6, -14), ...captionIf(lab(a, 'note', ''), 52, 90, 2.2)],
    }),
  },
  'factory-floor': {
    id: 'factory-floor',
    name: 'Factory floor',
    description: 'Workers at the era machine (steam engine, assembly line, server racks, robot arm), a foreman pointing, the shift clock.',
    slots: {company: 'sign at the top (THE WORKS)', boss: 'name card of the foreman (optional)', workers: 'colour only'},
    defaultEra: 'industrial',
    previewEras: ['fifties', 'future'],
    build: (a) => ({
      panels: [
        {
          background: a.era.backdrop,
          layers: [
            {component: a.era.machine, x: 50, y: 56, scale: 1.3, enter: 'slide-up'},
            person(a, 18, 64, {pose: 'type', costume: a.era.worker, colour: col(a, 'workers', 'grey')}, {delaySec: 0.3}),
            person(a, 34, 68, {pose: 'type', costume: a.era.worker, colour: col(a, 'workers', 'grey'), phase: 0.4}, {delaySec: 0.4}),
            person(a, 80, 64, {pose: 'point', colour: col(a, 'boss', 'ink'), flip: true}, {delaySec: 0.6}),
            {component: 'Clock', x: 90, y: 18, scale: 0.55, enter: 'pop', delaySec: 0.8},
            ...cardIf(lab(a, 'boss', ''), 80, 92, col(a, 'boss', 'ink'), 0.9),
          ],
        },
      ],
      overlays: signIf(lab(a, 'company', 'THE WORKS'), 50, 11),
    }),
  },
  'stock-market-crash': {
    id: 'stock-market-crash',
    name: 'Stock market crash',
    description: 'The era price board and a falling chart over a crowd in shock; a red headline and a big percentage stamp.',
    slots: {headline: 'banner (MARKET CRASH)', index: 'stamp, e.g. -23% (empty = none)'},
    defaultEra: 'twenties',
    previewEras: ['eighties', 'noughties'],
    build: (a) => ({
      panels: [
        {
          background: a.era.backdrop,
          layers: [
            {component: a.era.market, x: 30, y: 36, scale: 1.1, enter: 'pop'},
            {component: 'FallingChart', x: 70, y: 36, scale: 1.1, enter: 'pop', delaySec: 0.4},
            crowd(a, 50, 80, {count: 12, seed: 11, poses: ['shock', 'facepalm', 'slump'], colours: ['ink', 'grey', 'board', 'stamp']}, {delaySec: 0.2}),
          ],
        },
      ],
      overlays: [...bannerIf(lab(a, 'headline', 'MARKET CRASH'), 'stamp', 9), ...stampIf(lab(a, 'index', '-23%'), 84, 58, col(a, 'index', 'stamp'), 1.4, -6)],
    }),
  },
  'store-opening-queue': {
    id: 'store-opening-queue',
    name: 'Store opening queue',
    description: 'A shop (market stall, canal house, store front) with a queue of customers waiting for the doors to open.',
    slots: {store: 'label on the shop (THE SHOP)', sign: 'banner over the shop (GRAND OPENING)', note: 'sign above the queue (DAY ONE)'},
    defaultEra: 'fifties',
    previewEras: ['medieval', 'modern'],
    build: (a) => ({
      panels: [
        {
          background: a.era.backdrop,
          layers: [
            {component: a.era.shop, x: 26, y: 54, scale: 1.3, enter: 'slide-up', props: {label: lab(a, 'store', 'THE SHOP')}},
            crowd(a, 68, 72, {count: 9, seed: 21, rows: 1, poses: ['stand', 'talk', 'wave', 'phone'], colours: ['ink', 'stamp', 'grey', 'board']}, {scale: 0.9, enter: 'slide-left', delaySec: 0.3}),
          ],
        },
      ],
      overlays: [...bannerIf(lab(a, 'sign', 'GRAND OPENING'), 'stamp', 12, 26), ...signIf(lab(a, 'note', 'DAY ONE'), 70, 40, 0.9)],
    }),
  },
  'garage-startup': {
    id: 'garage-startup',
    name: 'Garage startup',
    description: 'Two founders in an open garage at the era device (beige PC, laptop, typewriter ...); the idea bulb lights up.',
    slots: {name: 'label on the garage roof (THE GARAGE)', left: 'name card founder 1 (optional)', right: 'name card founder 2 (optional)', roof: 'colour only'},
    defaultEra: 'nineties',
    previewEras: ['fifties', 'modern'],
    build: (a) => ({
      panels: [
        {
          background: 'paper',
          layers: [
            {component: 'Garage', x: 50, y: 56, scale: 1.6, enter: 'slide-up', props: {label: lab(a, 'name', 'THE GARAGE'), colour: col(a, 'roof', 'stamp')}},
            person(a, 41, 79, {pose: 'type', colour: col(a, 'left', 'ink')}, {scale: 0.85, delaySec: 0.4}),
            person(a, 59, 79, {pose: 'thinking', colour: col(a, 'right', 'stamp'), flip: true}, {scale: 0.85, delaySec: 0.6}),
            {component: a.era.device, x: 50, y: 87, scale: 0.55, enter: 'pop', delaySec: 0.8},
            {component: 'Lightbulb', x: 66, y: 58, scale: 0.45, enter: 'pop', delaySec: 1.6},
            ...cardIf(lab(a, 'left', ''), 28, 93, col(a, 'left', 'ink'), 1.0),
            ...cardIf(lab(a, 'right', ''), 72, 93, col(a, 'right', 'stamp'), 1.2),
          ],
        },
      ],
    }),
  },
  'press-conference': {
    id: 'press-conference',
    name: 'Press conference',
    description: 'A speaker at a podium, press cameras flashing (none before photography), reporters in the front row.',
    slots: {speaker: 'name card of the speaker (SPOKESPERSON)', org: 'name plate on the podium (PRESS)', podium: 'colour only', banner: 'optional banner'},
    defaultEra: 'modern',
    previewEras: ['twenties', 'future'],
    build: (a) => ({
      panels: [
        {
          background: a.era.room,
          layers: [
            person(a, 50, 46, {pose: 'talk', colour: col(a, 'speaker', 'ink')}, {scale: 1.0}),
            {component: 'Podium', x: 50, y: 66, scale: 1.0, enter: 'slide-up', props: {label: lab(a, 'org', 'PRESS'), colour: col(a, 'podium', 'ink')}},
            ...(a.era.camera
              ? [
                  {component: a.era.camera, x: 13, y: 70, scale: 0.6, enter: 'slide-right', delaySec: 0.4},
                  {component: a.era.camera, x: 87, y: 70, scale: 0.6, enter: 'slide-left', delaySec: 0.5},
                ]
              : []),
            crowd(a, 50, 98, {count: 11, seed: 31, rows: 1, poses: ['phone', 'talk', 'point', 'stand'], colours: ['board', 'grey']}, {scale: 1.1, delaySec: 0.2}),
            ...cardIf(lab(a, 'speaker', 'SPOKESPERSON'), 75, 38, col(a, 'speaker', 'ink'), 0.8),
          ],
        },
      ],
      overlays: [
        ...bannerIf(lab(a, 'banner', ''), 'board', 9),
        ...(a.era.camera ? [1.2, 1.9, 2.3, 3.1].map((s) => ({style: 'flash', delaySec: s})) : []),
      ],
    }),
  },
  courtroom: {
    id: 'courtroom',
    name: 'Courtroom',
    description: 'A judge behind the bench with scales and a gavel; plaintiff and defendant on either side.',
    slots: {court: 'name plate on the bench (COURT)', left: 'name card left (PLAINTIFF)', right: 'name card right (DEFENDANT)', case: 'optional caption, e.g. A v. B'},
    defaultEra: 'modern',
    previewEras: ['industrial', 'medieval'],
    build: (a) => ({
      panels: [
        {
          background: a.era.room === 'BoardroomBackdrop' ? 'greyLight' : a.era.room,
          layers: [
            {component: 'Scales', x: 50, y: 15, scale: 0.45, enter: 'fade'},
            person(a, 50, 40, {pose: 'thinking', costume: 'plain', hat: 'none', colour: 'board'}, {scale: 0.9}),
            {component: 'Bench', x: 50, y: 62, scale: 1.3, enter: 'slide-up', props: {label: lab(a, 'court', 'COURT')}},
            {component: 'Gavel', x: 68, y: 44, scale: 0.45, enter: 'drop', delaySec: 1.2},
            person(a, 14, 68, {pose: 'point', colour: col(a, 'left', 'ink')}, {delaySec: 0.4}),
            person(a, 86, 68, {pose: 'arms-crossed', colour: col(a, 'right', 'stamp'), flip: true}, {delaySec: 0.6}),
            ...cardIf(lab(a, 'left', 'PLAINTIFF'), 14, 93, col(a, 'left', 'ink'), 0.8),
            ...cardIf(lab(a, 'right', 'DEFENDANT'), 86, 93, col(a, 'right', 'stamp'), 1.0),
          ],
        },
      ],
      overlays: captionIf(lab(a, 'case', ''), 50, 92, 1.4),
    }),
  },
  'ship-departure': {
    id: 'ship-departure',
    name: 'Ship departure',
    description: 'The era ship (galley, fluyt, steamer, container ship) leaves the quay while people wave; it drifts right from 1.5 s.',
    slots: {ship: 'label on the ship (optional)', destination: 'sign (BOUND FOR NEW SHORES)', sea: 'colour only'},
    defaultEra: 'golden-age',
    previewEras: ['ancient', 'industrial'],
    build: (a) => ({
      panels: [
        {
          background: a.era.backdrop,
          layers: [
            {component: a.era.ship, x: 58, y: 66, scale: 1.2, enter: 'slide-right', props: {label: lab(a, 'ship', '')}, drift: {dx: 2.2, startSec: 1.5}},
            {component: 'Waves', x: 50, y: 92, scale: 1, enter: 'none', props: {colour: col(a, 'sea', 'ink')}},
            {component: 'Quay', x: 20, y: 86, scale: 1, enter: 'none'},
            crowd(a, 20, 70, {count: 7, seed: 41, rows: 1, poses: ['wave', 'celebrate', 'wave'], colours: ['ink', 'stamp', 'board', 'grey']}, {scale: 0.55, delaySec: 0.4}),
          ],
        },
      ],
      overlays: signIf(lab(a, 'destination', 'BOUND FOR NEW SHORES'), 74, 14),
    }),
  },
  'city-at-night-thinking': {
    id: 'city-at-night-thinking',
    name: 'City at night, thinking',
    description: 'A lone figure at a big window over the night skyline, weighing the decision; the era lamp beside them.',
    slots: {thought: 'caption (WHAT IF?)', person: 'name card (optional)', windows: 'colour only: lit windows'},
    defaultEra: 'modern',
    previewEras: ['twenties', 'future'],
    build: (a) => ({
      panels: [
        {
          background: 'board',
          layers: [
            {component: 'NightSkyline', x: 50, y: 50, scale: 1, enter: 'fade', props: {colour: col(a, 'windows', 'paper')}},
            {component: 'WindowFrame', x: 50, y: 42, scale: 1, enter: 'fade'},
            person(a, 40, 74, {pose: 'thinking', colour: col(a, 'person', 'ink')}, {scale: 1.35, delaySec: 0.3}),
            {component: a.era.light, x: 80, y: 76, scale: 0.8, enter: 'fade', delaySec: 0.6},
            ...cardIf(lab(a, 'person', ''), 40, 95, col(a, 'person', 'ink'), 1.0),
          ],
        },
      ],
      overlays: captionIf(lab(a, 'thought', 'WHAT IF?'), 64, 30, 1.4),
    }),
  },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES);

/** Build a template from a scene visual, including the props.background / props.layers / props.overlays extensions. */
export const buildTemplate = (def: TemplateDef, v: any, verdict: string): TemplateOut => {
  const p = (v && v.props) || {};
  const out = def.build({era: eraKit(v && v.era ? v.era : def.defaultEra), labels: (v && v.labels) || {}, colours: (v && v.colours) || {}, props: p, verdict});
  const panels = out.panels.map((pn, i) =>
    i === 0 ? {background: typeof p.background === 'string' ? p.background : pn.background, layers: [...pn.layers, ...(Array.isArray(p.layers) ? p.layers : [])]} : pn,
  );
  return {...out, panels, overlays: [...(out.overlays || []), ...(Array.isArray(p.overlays) ? p.overlays : [])]};
};

/** One template layer: like an illustration Layer, plus template parts and optional drift. */
export const TemplateLayer: React.FC<{layer: TLayer}> = ({layer}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const Backdrop = BACKDROPS[layer.component];
  if (Backdrop) {
    return (
      <AbsoluteFill>
        <Backdrop {...(layer.props || {})} />
      </AbsoluteFill>
    );
  }
  const entry = PARTS[layer.component] || ALL_ILLUSTRATIONS[layer.component];
  if (!entry) return null;
  const delay = Math.max(0, Math.round((layer.delaySec || 0) * fps));
  const st = enterStyle(layer.enter || entry.enter, frame - delay, fps);
  const d = layer.drift;
  const t = d ? Math.max(0, frame / fps - (d.startSec || 0)) : 0;
  const x = (layer.x ?? 50) + (d ? (d.dx || 0) * t : 0);
  const y = (layer.y ?? 50) + (d ? (d.dy || 0) * t : 0);
  const Comp = entry.C;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: entry.w,
        height: entry.h,
        transform: `translate(-50%, -50%) scale(${(layer.scale ?? 1) * u}) ${st.transform}`,
        opacity: st.opacity,
      }}
    >
      <Sequence from={delay} layout="none">
        <Comp {...(layer.props || {})} />
      </Sequence>
    </div>
  );
};

const FLICKER = [1, 0, 1, 1, 0, 1, 1];

/** Text overlays of a template: stamp | sign | banner | caption | neon, and full-frame camera flashes (flash). */
export const TemplateOverlay: React.FC<{o: Overlay}> = ({o}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const f = frame - Math.round((o.delaySec || 0) * fps);
  if (f < 0) return null;
  const style = o.style || 'sign';
  if (style === 'flash') {
    const op = interpolate(f, [0, 1, 6], [0, 0.85, 0], clamp);
    return <AbsoluteFill style={{backgroundColor: C.paper, opacity: op}} />;
  }
  if (!o.text) return null;
  const base = style === 'stamp' ? 110 : style === 'banner' ? 56 : style === 'neon' ? 72 : style === 'caption' ? 34 : 40;
  const size = (o.size || base) * u;
  const col = colourOf(o.colour, style === 'stamp' || style === 'neon' ? C.stamp : C.board);
  const rot = typeof o.rotate === 'number' ? o.rotate : style === 'stamp' ? -8 : 0;
  let scale = 1;
  let opacity = 1;
  if (style === 'stamp') {
    scale = interpolate(f, [0, 7], [1.6, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    opacity = interpolate(f, [0, 3], [0, 1], clamp);
  } else if (style === 'neon') {
    opacity = f < 21 ? (FLICKER[Math.floor(f / 3)] ? 1 : 0.15) : 1;
  } else {
    const p = interpolate(f, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    scale = 0.9 + 0.1 * p;
    opacity = p;
  }
  const box: React.CSSProperties =
    style === 'stamp'
      ? {border: `${7 * u}px solid ${col}`, color: col, padding: `${6 * u}px ${26 * u}px`, fontFamily: FONT_HEAD, fontWeight: 800, letterSpacing: 6 * u, borderRadius: 10 * u, mixBlendMode: 'multiply'}
      : style === 'banner'
        ? {background: col, color: C.paper, padding: `${10 * u}px ${34 * u}px`, fontFamily: FONT_HEAD, fontWeight: 800, letterSpacing: 3 * u, border: `${STROKE * u}px solid ${C.board}`}
        : style === 'neon'
          ? {color: col, fontFamily: FONT_HEAD, fontWeight: 800, letterSpacing: 4 * u, padding: `${8 * u}px ${24 * u}px`, border: `${5 * u}px solid ${col}`, borderRadius: 18 * u, background: C.board}
          : style === 'caption'
            ? {background: C.paper, color: col, padding: `${8 * u}px ${18 * u}px`, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: 2 * u, border: `${STROKE * u}px solid ${C.board}`}
            : {background: C.paper, color: col, padding: `${10 * u}px ${24 * u}px`, fontFamily: FONT_MONO, fontWeight: 700, letterSpacing: 3 * u, border: `${STROKE * u}px solid ${C.board}`, boxShadow: `${8 * u}px ${8 * u}px 0 ${C.board}`};
  return (
    <div
      style={{
        position: 'absolute',
        left: `${o.x ?? 50}%`,
        top: `${o.y ?? 50}%`,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
        opacity,
        fontSize: size,
        lineHeight: 1.1,
        whiteSpace: 'pre',
        textAlign: 'center',
        ...box,
      }}
    >
      {String(o.text).toUpperCase()}
    </div>
  );
};

const PanelView: React.FC<{panel: Panel; map?: (l: TLayer) => TLayer}> = ({panel, map}) => {
  const bg = panel.background || 'paper';
  const Backdrop = BACKDROPS[bg];
  return (
    <AbsoluteFill style={{backgroundColor: Backdrop ? C.paper : colourOf(bg, C.paper)}}>
      {Backdrop ? (
        <AbsoluteFill>
          <Backdrop />
        </AbsoluteFill>
      ) : null}
      {panel.layers.map((l, i) => (
        <TemplateLayer key={i} layer={map ? map(l) : l} />
      ))}
    </AbsoluteFill>
  );
};

// split panels show the centre half of a full-size frame: panel-local percent -> frame percent
const mapX = (l: TLayer): TLayer => ({...l, x: 25 + (l.x ?? 50) * 0.5});
const mapY = (l: TLayer): TLayer => ({...l, y: 25 + (l.y ?? 50) * 0.5});

/** Scene kind 'template' (visual {template, era?, labels?, colours?, props?}). */
export const TemplateScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const v = scene.visual || {};
  const def = TEMPLATES[String(v.template)] || TEMPLATES['boardroom-meeting'];
  const out = buildTemplate(def, v, (ctx && ctx.verdict) || 'SIGNED');
  const first = out.panels[0] || {background: 'paper', layers: []};
  const dark = DARK.has(first.background);
  const split = out.layout === 'split' && out.panels.length >= 2;
  const portrait = height > width;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      {split ? (
        <>
          {out.panels.slice(0, 2).map((p, i) => {
            const pin = interpolate(frame, [0, 12], [i === 0 ? -100 : 100, 0], {...clamp, easing: Easing.out(Easing.cubic)});
            const outer: React.CSSProperties = portrait
              ? {position: 'absolute', left: 0, right: 0, top: `${i * 50}%`, height: '50%', overflow: 'hidden', transform: `translateY(${pin}%)`}
              : {position: 'absolute', top: 0, bottom: 0, left: `${i * 50}%`, width: '50%', overflow: 'hidden', transform: `translateX(${pin}%)`};
            const inner: React.CSSProperties = portrait
              ? {position: 'absolute', left: 0, width: '100%', top: '-50%', height: '200%'}
              : {position: 'absolute', top: 0, height: '100%', left: '-50%', width: '200%'};
            return (
              <div key={i} style={outer}>
                <div style={inner}>
                  <PanelView panel={p} map={portrait ? mapY : mapX} />
                </div>
              </div>
            );
          })}
          <div
            style={
              portrait
                ? {position: 'absolute', left: 0, right: 0, top: '50%', height: 10, marginTop: -5, background: C.board}
                : {position: 'absolute', top: 0, bottom: 0, left: '50%', width: 10, marginLeft: -5, background: C.board}
            }
          />
        </>
      ) : (
        <PanelView panel={first} />
      )}
      {(out.overlays || []).map((o, i) => (
        <TemplateOverlay key={i} o={o} />
      ))}
      <Kicker text={scene.onScreenText} dark={dark} />
    </AbsoluteFill>
  );
};

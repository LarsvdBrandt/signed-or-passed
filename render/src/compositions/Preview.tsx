import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE} from '../constants';
import {PaperGrain, enterStyle} from '../components/common';
import * as Brand from '../components/brand';
import {ILLUSTRATIONS} from '../illustrations';
import {SceneContent} from '../Video';
import type {Scene, VideoProps} from '../types';

type Cell = {name: string; props?: any; label: string; dark?: boolean};

const DEFAULT_PROPS: Record<string, any> = {
  Contract: {label: 'AGREEMENT'},
  NameCard: {label: 'THE FOUNDER'},
  Newspaper: {label: 'Deal of the decade?'},
  SpinningNewspaper: {label: 'Deal of the decade?'},
  Calendar: {label: 'MAR', day: 14},
  Factory: {label: 'WORKS'},
  StoreFront: {label: 'SHOP'},
  Warehouse: {label: 'DEPOT'},
  Bank: {label: 'BANK'},
  Ship: {label: 'TEST'},
  ContainerShip: {label: 'TEST LINE'},
  Train: {label: 'EXPRESS'},
  Truck: {label: 'CARGO'},
  Airplane: {from: 'AMS', to: 'JKT'},
  FallingChart: {label: 'TEST'},
  Computer: {label: 'HELLO'},
  Laptop: {label: 'START'},
  Smartphone: {label: '1 new offer'},
  Scales: {left: 'SIGN', right: 'PASS', tilt: 8},
  ShareCertificate: {label: 'TEST CO.'},
  Crowd: {highlight: 3},
  Queue: {label: 'OPEN'},
  PriceTag: {label: '$99'},
  VinylRecord: {label: 'SIDE A'},
  FloppyDisk: {label: 'DISK 1'},
  VHSTape: {label: 'TEST TAPE'},
  Trophy: {label: '#1'},
  FlipCalendar: {label: 'JAN'},
};

const buildCells = (): Cell[] => {
  const out: Cell[] = [];
  for (const name of Object.keys(ILLUSTRATIONS)) {
    if (name === 'Person') {
      for (const [pose, colour] of [
        ['standing', 'board'],
        ['sitting', 'ink'],
        ['arms-crossed', 'stamp'],
        ['pointing', 'grey'],
        ['handshake', 'ink'],
      ]) {
        out.push({name, props: {pose, colour}, label: `Person ${pose}`});
      }
      continue;
    }
    if (name === 'Building') {
      for (const [type, label] of [
        ['office', 'ACME CORP'],
        ['factory', 'WORKS'],
        ['store', 'SHOP'],
      ]) {
        out.push({name, props: {type, label}, label: `Building ${type}`});
      }
      continue;
    }
    out.push({name, props: DEFAULT_PROPS[name], label: name, dark: name === 'Spotlight'});
  }
  return out;
};

const CELLS = buildCells();
const COLS = 5;
const ROWS = 3;
const PER_PAGE = COLS * ROWS;
const PAGE = 120;
const PAGES = Math.ceil(CELLS.length / PER_PAGE);

const Sheet: React.FC<{cells: Cell[]; page: number}> = ({cells, page}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const top = 70;
  const cw = width / COLS;
  const ch = (height - top) / ROWS;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <div style={{position: 'absolute', left: 24, top: 10, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 40, color: C.board}}>
        Illustration library · {page + 1}/{PAGES}
      </div>
      {cells.map((cell, i) => {
        const entry = ILLUSTRATIONS[cell.name];
        if (!entry) return null;
        const Comp = entry.C;
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const isBackdrop = entry.w >= 1920;
        const fit = isBackdrop ? cw / entry.w : Math.min((cw - 30) / entry.w, (ch - 50) / entry.h);
        const st = enterStyle(entry.enter === 'none' ? 'fade' : entry.enter, frame - i * 3, fps);
        return (
          <div key={i} style={{position: 'absolute', left: col * cw, top: top + row * ch, width: cw, height: ch, overflow: 'hidden', borderRight: `${STROKE}px solid ${C.greyLight}`, borderTop: `${STROKE}px solid ${C.greyLight}`, background: cell.dark ? C.board : 'transparent', boxSizing: 'border-box'}}>
            {isBackdrop ? (
              <div style={{position: 'absolute', left: 0, top: 0, width: entry.w, height: entry.h, transform: `scale(${fit})`, transformOrigin: 'top left', opacity: st.opacity}}>
                <Comp {...(cell.props || {})} />
              </div>
            ) : (
              <div style={{position: 'absolute', left: '50%', top: '45%', width: entry.w, height: entry.h, transform: `translate(-50%, -50%) scale(${fit}) ${st.transform}`, opacity: st.opacity}}>
                <Comp {...(cell.props || {})} />
              </div>
            )}
            <div style={{position: 'absolute', left: 10, bottom: 6, fontFamily: FONT_MONO, fontSize: 18, color: cell.dark ? C.paper : C.board, background: cell.dark ? 'transparent' : C.paper, padding: '0 4px'}}>{cell.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const CTX: VideoProps = {
  slug: 'preview',
  cut: 'main',
  format: 'long',
  verdict: 'PASSED',
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: 1,
  introFrames: 0,
  outroFrames: 0,
  scenes: [],
  words: [],
  assets: {},
  sources: {src1: {title: 'Preview placeholder source', url: ''}},
  thumbnail: {},
  title: 'Preview',
};

type Demo = {label: string; frames: number; kind?: string; visual?: any; motion?: any; brand?: string};

const DEMOS: Demo[] = [
  {label: 'BrandIntro', frames: 90, brand: 'BrandIntro'},
  {label: 'LogoLockup', frames: 90, brand: 'LogoLockup'},
  {label: 'EndCard', frames: 150, brand: 'EndCard'},
  {
    label: 'map · WorldZoom',
    frames: 270,
    kind: 'map',
    visual: {focus: 'NLD', focusLabel: 'Netherlands', zoomTo: 'country', pins: [{lat: 52.37, lon: 4.9, label: 'Amsterdam'}, {lat: -6.2, lon: 106.8, label: 'Jakarta'}], arrows: [{from: 0, to: 1}]},
  },
  {label: 'city · 1900s', frames: 180, kind: 'city', visual: {era: '1900s', density: 'medium', label: '1900s'}},
  {label: 'city · modern night', frames: 180, kind: 'city', visual: {era: 'modern', density: 'high', night: true, label: 'Today'}},
  {
    label: 'illustration · parallax',
    frames: 180,
    kind: 'illustration',
    motion: {type: 'parallax', strength: 1.5},
    visual: {
      background: 'paper',
      layers: [
        {component: 'Factory', x: 24, y: 42, scale: 0.9, depth: 0.1},
        {component: 'Train', x: 60, y: 62, scale: 1, depth: 0.5, props: {label: 'EXPRESS'}},
        {component: 'Truck', x: 80, y: 82, scale: 0.8, depth: 1, props: {label: 'CARGO'}},
      ],
    },
  },
  {label: 'versus', frames: 150, kind: 'versus', visual: {left: {label: 'Option A', value: 40, unit: '%', component: 'Handshake'}, right: {label: 'Option B', value: 60, unit: '%', component: 'Gavel'}, sourceId: 'src1'}},
  {label: 'growth', frames: 180, kind: 'growth', visual: {from: 1, to: 120, label: 'test shops', sourceId: 'src1'}},
  {label: 'split-flap', frames: 150, kind: 'split-flap', visual: {rows: ['DATE 01-01-2000', 'OFFER $1,000,000'], accentRow: 1}},
  {label: 'document · PASSED', frames: 180, kind: 'document', visual: {title: 'TEST AGREEMENT', verdict: 'PASSED', party: 'Test Company'}},
  {label: 'document · SIGNED', frames: 180, kind: 'document', visual: {title: 'TEST AGREEMENT', verdict: 'SIGNED', party: 'Test Company'}},
  {
    label: 'photo-wall',
    frames: 210,
    kind: 'photo-wall',
    visual: {
      cards: [
        {label: 'THE FOUNDER', component: 'Person', props: {pose: 'arms-crossed', colour: 'ink'}},
        {label: 'THE OFFER', component: 'Contract', props: {label: 'OFFER'}},
        {label: 'THE BANK', component: 'Bank'},
        {label: 'THE DEADLINE', component: 'Hourglass'},
      ],
    },
  },
  {label: 'counter · money', frames: 150, kind: 'counter', visual: {from: 0, to: 1000000, unit: '$', style: 'money', label: 'Test offer', sourceId: 'src1'}},
  {
    label: 'chart · line',
    frames: 180,
    kind: 'chart',
    visual: {type: 'line', unit: 'units', sourceId: 'src1', series: [{label: 'Y1', value: 10}, {label: 'Y2', value: 24}, {label: 'Y3', value: 18}, {label: 'Y4', value: 42}, {label: 'Y5', value: 55}]},
  },
  {
    label: 'timeline',
    frames: 180,
    kind: 'timeline',
    visual: {events: [{date: '1999', label: 'Test one'}, {date: '2001', label: 'Test two'}, {date: '2005', label: 'Test three'}, {date: '2010', label: 'Test four'}, {date: '2020', label: 'Test five'}]},
  },
  {label: 'verdict · PASSED', frames: 120, kind: 'verdict', visual: {verdict: 'PASSED'}},
  {label: 'verdict · SIGNED', frames: 120, kind: 'verdict', visual: {verdict: 'SIGNED'}},
];

export const PREVIEW_FRAMES = PAGES * PAGE + DEMOS.reduce((a, d) => a + d.frames, 0);

const Banner: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', right: 24, top: 20, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 28, color: C.paper, background: C.board, padding: '6px 14px'}}>{text}</div>
);

const DemoView: React.FC<{d: Demo}> = ({d}) => {
  if (d.brand) {
    const Comp = (Brand as any)[d.brand];
    if (typeof Comp !== 'function') {
      return (
        <AbsoluteFill style={{backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', fontFamily: FONT_MONO, fontSize: 40, color: C.grey}}>
          {d.brand} (not available)
        </AbsoluteFill>
      );
    }
    return <Comp />;
  }
  const scene: Scene = {
    id: 'preview-' + d.label.replace(/[^a-z0-9]+/gi, '-'),
    kind: d.kind || 'title',
    narration: '',
    onScreenText: null,
    visual: d.visual || {},
    motion: d.motion ?? null,
    startFrame: 0,
    durationFrames: d.frames,
    sentences: [{text: '', startFrame: 0, endFrame: Math.max(1, d.frames - 10)}],
  };
  return <SceneContent scene={scene} ctx={CTX} />;
};

/** Contact sheets of the whole illustration library, then a demo of every scene kind and brand component. */
export const Preview: React.FC = () => {
  let start = PAGES * PAGE;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      {Array.from({length: PAGES}, (_, p) => (
        <Sequence key={'p' + p} from={p * PAGE} durationInFrames={PAGE}>
          <Sheet cells={CELLS.slice(p * PER_PAGE, (p + 1) * PER_PAGE)} page={p} />
        </Sequence>
      ))}
      {DEMOS.map((d, i) => {
        const from = start;
        start += d.frames;
        return (
          <Sequence key={'d' + i} from={from} durationInFrames={d.frames}>
            <AbsoluteFill style={{backgroundColor: C.paper, overflow: 'hidden'}}>
              <DemoView d={d} />
            </AbsoluteFill>
            <Banner text={d.label} />
          </Sequence>
        );
      })}
      <PaperGrain />
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {SceneContent} from '../Video';
import {TRANSITIONS, TransitionLayer, resolveTransition, type TransitionSpec} from '../transitions';
import {PARALLAX_MOVES} from '../transitions/parallax';
import type {Scene, VideoProps} from '../types';

const PER = 90;
const AT = 36;

type Entry = {name: string; kind: 'transition' | 'parallax'; spec?: TransitionSpec; move?: string; note: string};

const VARIANTS: Entry[] = [
  {name: 'paper-slide from up', kind: 'transition', spec: {id: 'paper-slide', params: {from: 'up'}}, note: 'params {from: "up"}'},
  {name: 'push from down', kind: 'transition', spec: {id: 'push', params: {from: 'down'}}, note: 'params {from: "down"}'},
  {name: 'iris-in off-centre', kind: 'transition', spec: {id: 'iris-in', params: {cx: 70, cy: 40, colour: 'stamp'}}, note: 'params {cx: 70, cy: 40, colour: "stamp"}'},
  {name: 'ink-splash orange', kind: 'transition', spec: {id: 'ink-splash', params: {colour: 'stamp', cx: 30, cy: 60}}, note: 'params {colour: "stamp", cx: 30, cy: 60}'},
  {name: 'stamp-cut with text', kind: 'transition', spec: {id: 'stamp-cut', params: {text: 'Next'}}, note: 'params {text: "Next"}'},
];

const ENTRIES: Entry[] = [
  ...Object.values(TRANSITIONS).map((d) => ({
    name: d.id,
    kind: 'transition' as const,
    spec: {id: d.id},
    note: `${d.description} · ${d.defaultSec}s · params: ${d.params}${d.Out ? ' · moves the old scene too' : ''}`,
  })),
  ...VARIANTS,
  ...PARALLAX_MOVES.filter((m) => m !== 'parallax').map((m) => ({name: m, kind: 'parallax' as const, move: m, note: 'illustration motion {type, strength}: layers move by depth (0 far - 1 near)'})),
];

export const TRANSITION_PREVIEW_FRAMES = Math.max(1, PER * ENTRIES.length);

const CTX: VideoProps = {
  slug: 'transition-preview',
  cut: 'main',
  format: 'long',
  verdict: 'PASSED',
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: PER,
  scenes: [],
  words: [],
  assets: {},
  sources: {},
  thumbnail: {},
  title: 'Transitions preview',
};

const sceneA = (i: number, dur: number): Scene => ({
  id: `tr-a-${i}`,
  kind: 'illustration',
  narration: '',
  onScreenText: 'Scene A',
  visual: {
    background: 'OfficeBackdrop',
    layers: [
      {component: 'Desk', x: 50, y: 74, scale: 1, enter: 'none'},
      {component: 'Contract', x: 56, y: 60, scale: 0.8, enter: 'none'},
      {component: 'Character', props: {pose: 'thinking', costume: 'suit', colour: 'ink'}, x: 28, y: 58, scale: 1, enter: 'none'},
    ],
  },
  startFrame: 0,
  durationFrames: dur,
  sentences: [],
});

const sceneB = (i: number, dur: number, label: string): Scene => ({
  id: `tr-b-${i}`,
  kind: 'title',
  narration: '',
  visual: {title: 'Scene B', subtitle: label},
  startFrame: 0,
  durationFrames: dur,
  sentences: [],
});

const parallaxScene = (i: number, move: string): Scene => ({
  id: `px-${i}`,
  kind: 'illustration',
  narration: '',
  onScreenText: move,
  motion: {type: move, strength: 1.6},
  visual: {
    background: 'CityBackdrop',
    layers: [
      {component: 'Bank', x: 22, y: 52, scale: 0.9, enter: 'none', depth: 0.2},
      {component: 'Factory', x: 78, y: 55, scale: 0.8, enter: 'none', depth: 0.35},
      {component: 'Character', props: {pose: 'walk', costume: 'suit', colour: 'ink', hold: 'briefcase'}, x: 44, y: 66, scale: 1, enter: 'none', depth: 0.75},
      {component: 'Character', props: {pose: 'phone', costume: 'casual', colour: 'stamp'}, x: 64, y: 70, scale: 1.1, enter: 'none', depth: 0.95},
    ],
  },
  startFrame: 0,
  durationFrames: PER,
  sentences: [],
});

const Label: React.FC<{name: string; note: string}> = ({name, note}) => (
  <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, padding: '0 28px', background: C.board, color: C.paper, display: 'flex', alignItems: 'center', gap: 24}}>
    <span style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 44, whiteSpace: 'nowrap'}}>{name}</span>
    <span style={{fontFamily: FONT_MONO, fontSize: 22, opacity: 0.85, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{note}</span>
  </div>
);

const TransitionBlock: React.FC<{e: Entry; i: number}> = ({e, i}) => {
  const tr = resolveTransition(e.spec, null, 30);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <Sequence name="A" from={0} durationInFrames={AT + tr.frames}>
        <TransitionLayer enter={null} exit={tr} exitAt={AT} seed={`a${i}`}>
          <SceneContent scene={sceneA(i, AT + tr.frames)} ctx={CTX} />
        </TransitionLayer>
      </Sequence>
      <Sequence name="B" from={AT} durationInFrames={PER - AT}>
        <TransitionLayer enter={tr} exit={null} exitAt={PER} seed={`b${i}`}>
          <SceneContent scene={sceneB(i, PER - AT, e.name)} ctx={CTX} />
        </TransitionLayer>
      </Sequence>
      <Label name={e.name} note={e.note} />
    </AbsoluteFill>
  );
};

const ParallaxBlock: React.FC<{e: Entry; i: number}> = ({e, i}) => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    <TransitionLayer enter={null} exit={null} exitAt={PER} seed={`p${i}`}>
      <SceneContent scene={parallaxScene(i, e.move || 'parallax')} ctx={CTX} />
    </TransitionLayer>
    <Label name={e.name} note={e.note} />
  </AbsoluteFill>
);

/** Every transition (A -> B at its default length), some param variants and the parallax rig moves, 3 s each. Rendered as preview-transitions.mp4. */
export const TransitionPreview: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    {ENTRIES.map((e, i) => (
      <Sequence key={`${e.name}-${i}`} name={`tr:${e.name}`} from={i * PER} durationInFrames={PER}>
        {e.kind === 'parallax' ? <ParallaxBlock e={e} i={i} /> : <TransitionBlock e={e} i={i} />}
      </Sequence>
    ))}
  </AbsoluteFill>
);

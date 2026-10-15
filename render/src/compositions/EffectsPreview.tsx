import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {SceneContent} from '../Video';
import {EFFECTS, EffectsStack, LOOKS, LOOK_IDS, lookEffects, type EffectSpec} from '../effects';
import type {Scene, VideoProps} from '../types';

const PER = 90;

type Entry = {name: string; kind: 'effect' | 'look'; effects: EffectSpec[]; note: string};

const PAPER_VARIANTS = ['grain', 'fibre', 'crumpled', 'newsprint', 'kraft', 'watercolour'];

const DEMO_PARAMS: Record<string, Record<string, any>> = {
  'depth-of-field': {rack: 'in'},
  'chromatic-aberration': {pulse: true},
  embers: {fire: true},
  'money-rain': {symbol: '$'},
};

const ENTRIES: Entry[] = [
  ...Object.values(EFFECTS)
    .filter((d) => d.id !== 'paper-texture')
    .map((d) => ({name: d.id, kind: 'effect' as const, effects: [{id: d.id, intensity: 1, params: DEMO_PARAMS[d.id] || {}}], note: `${d.description} · params: ${d.params}`})),
  {name: 'film-grain coarse', kind: 'effect', effects: [{id: 'film-grain', intensity: 1.4, params: {size: 'coarse'}}], note: 'size coarse, intensity 1.4'},
  {name: 'old-film mono', kind: 'effect', effects: [{id: 'old-film', intensity: 1.3, params: {mono: true}}], note: 'mono, intensity 1.3'},
  {name: 'confetti burst', kind: 'effect', effects: [{id: 'confetti', intensity: 1.5, params: {burst: true}}], note: 'burst: true (one shower from the scene start), intensity 1.5'},
  ...PAPER_VARIANTS.map((v) => ({name: `paper-texture ${v}`, kind: 'effect' as const, effects: [{id: 'paper-texture', intensity: 1.2, params: {variant: v}}], note: `variant ${v}`})),
  ...LOOK_IDS.map((id) => ({name: `look: ${id}`, kind: 'look' as const, effects: lookEffects(id), note: LOOKS[id].length ? LOOKS[id].map((e) => `${e.id}${e.intensity != null && e.intensity !== 1 ? ` ${e.intensity}` : ''}`).join(' + ') : 'no effects (house style)'})),
];

export const EFFECTS_PREVIEW_FRAMES = Math.max(1, PER * ENTRIES.length);

const CTX: VideoProps = {
  slug: 'effects-preview',
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
  title: 'Effects preview',
};

const demoScene = (i: number): Scene => ({
  id: `fx-demo-${i}`,
  kind: 'illustration',
  narration: '',
  visual: {
    background: 'OfficeBackdrop',
    layers: [
      {component: 'Desk', x: 50, y: 74, scale: 1, enter: 'none'},
      {component: 'Contract', x: 56, y: 60, scale: 0.8, enter: 'none'},
      {component: 'FountainPen', x: 64, y: 58, scale: 0.7, enter: 'none'},
      {component: 'Character', props: {pose: 'thinking', costume: 'suit', colour: 'ink'}, x: 28, y: 58, scale: 1, enter: 'none'},
      {component: 'Character', props: {pose: 'arms-crossed', costume: 'suit', colour: 'stamp'}, x: 80, y: 58, scale: 1, enter: 'none'},
    ],
  },
  startFrame: 0,
  durationFrames: PER,
  sentences: [],
});

const Block: React.FC<{entry: Entry; i: number}> = ({entry, i}) => {
  const scene = demoScene(i);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <AbsoluteFill style={{backgroundColor: C.paper, overflow: 'hidden'}}>
        <EffectsStack effects={entry.effects} seed={scene.id} duration={PER}>
          <SceneContent scene={scene} ctx={CTX} />
        </EffectsStack>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, padding: '0 28px', background: C.board, color: C.paper, display: 'flex', alignItems: 'center', gap: 24}}>
        <span style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 44, whiteSpace: 'nowrap'}}>{entry.name}</span>
        <span style={{fontFamily: FONT_MONO, fontSize: 22, opacity: 0.85, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>
          {entry.kind === 'look' ? `spec.look "${entry.name.replace('look: ', '')}" = ` : 'scenes[].effects · '}
          {entry.note}
        </span>
      </div>
    </AbsoluteFill>
  );
};

/** Every effect (incl. particles), paper variant and look on the same demo scene, 3 s each. Rendered as preview-effects.mp4. */
export const EffectsPreview: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    {ENTRIES.map((e, i) => (
      <Sequence key={e.name} name={`fx:${e.name}`} from={i * PER} durationInFrames={PER}>
        <Block entry={e} i={i} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

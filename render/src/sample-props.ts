import type {Scene, VideoProps} from './types';

// Default props for Remotion Studio. Real renders always pass --props from pipeline/build_props.py.
const raw: Array<Omit<Scene, 'startFrame' | 'sentences'>> = [
  {id: 't', kind: 'title', narration: 'Demo', visual: {title: 'Signed or Passed', subtitle: 'Studio demo'}, durationFrames: 75, dateTag: 'DEMO'},
  {id: 'i', kind: 'illustration', narration: 'Demo', visual: {background: 'OfficeBackdrop', layers: [
    {component: 'Person', props: {pose: 'sitting'}, x: 50, y: 58, enter: 'fade'},
    {component: 'Desk', x: 50, y: 80, scale: 1.2, enter: 'slide-up'},
    {component: 'Contract', props: {label: 'AGREEMENT'}, x: 44, y: 70, scale: 0.6, enter: 'drop', delaySec: 0.4},
    {component: 'NameCard', props: {label: 'THE FOUNDER'}, x: 72, y: 30, enter: 'pop', delaySec: 0.8},
  ]}, durationFrames: 90},
  {id: 'c', kind: 'counter', narration: 'Demo', visual: {from: 0, to: 250000, unit: '$', sourceId: 'demo'}, durationFrames: 75},
  {id: 'q', kind: 'question', narration: 'Demo', visual: {question: 'Sign the demo deal?', options: ['SIGN', 'PASS'], holdSec: 3}, durationFrames: 120},
  {id: 'v', kind: 'verdict', narration: 'Demo', visual: {verdict: 'PASSED'}, durationFrames: 75},
  {id: 'v2', kind: 'verdict', narration: 'Demo', visual: {verdict: 'SIGNED'}, durationFrames: 75},
];

let at = 0;
const scenes: Scene[] = raw.map((s) => {
  const sc = {...s, startFrame: at, sentences: []} as Scene;
  at += s.durationFrames;
  return sc;
});

export const sampleLong: VideoProps = {
  slug: 'studio-demo',
  cut: 'main',
  format: 'long',
  verdict: 'PASSED',
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: at,
  scenes,
  words: [],
  assets: {},
  sources: {demo: {title: 'Studio demo source', url: 'https://example.org'}},
  thumbnail: {bigText: '$250,000', headline: 'The offer they turned down', verdict: 'PASSED', illustration: 'Contract'},
  title: 'Studio demo',
};

export const sampleShort: VideoProps = {
  ...sampleLong,
  cut: 'short-demo',
  format: 'short',
  width: 1080,
  height: 1920,
  words: [
    {text: 'Would', startFrame: 170, endFrame: 180},
    {text: 'you', startFrame: 180, endFrame: 188},
    {text: 'sign?', startFrame: 188, endFrame: 205},
  ],
};

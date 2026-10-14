import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {SceneContent} from '../Video';
import {THEME_LIST, applyTheme} from '../themes';
import {ThemeDefs, ThemeOverlay, themeContentStyle} from '../themes/ThemeLayer';
import type {Scene, VideoProps} from '../types';

const CTX: VideoProps = {
  slug: 'preview-themes',
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
  sources: {src1: {title: 'Theme preview placeholder', url: ''}},
  thumbnail: {},
  title: 'Themes',
};

type Seg = {kind: string; frames: number; visual: any; motion?: any; onScreenText?: string};

const segments = (i: number): Seg[] => [
  {
    kind: 'illustration',
    frames: 120,
    motion: 'push-in',
    visual: {
      background: 'OfficeBackdrop',
      layers: [
        {component: 'Desk', x: 50, y: 74, scale: 1, enter: 'slide-up'},
        {component: 'Person', x: 28, y: 58, scale: 1, enter: 'pop', delaySec: 0.3, props: {pose: 'arms-crossed', colour: 'ink'}},
        {component: 'Contract', x: 50, y: 56, scale: 0.7, enter: 'drop', delaySec: 0.6, props: {label: 'OFFER'}},
        {component: 'MoneyStack', x: 72, y: 60, scale: 0.8, enter: 'pop', delaySec: 0.9},
      ],
    },
  },
  {
    kind: 'chart',
    frames: 80,
    onScreenText: 'Bars in this theme',
    visual: {type: 'bar', unit: 'units', sourceId: 'src1', series: [{label: 'A', value: 12}, {label: 'B', value: 30}, {label: 'C', value: 21}, {label: 'D', value: 44}]},
  },
  {kind: 'verdict', frames: 70, visual: {verdict: i % 2 === 0 ? 'PASSED' : 'SIGNED'}},
];

const PER_THEME = segments(0).reduce((a, s) => a + s.frames, 0);
export const THEME_PREVIEW_FRAMES = PER_THEME * THEME_LIST.length;

/** Applies a theme before its subtree renders (only the active Sequence's subtree is rendered). */
const ThemeScope: React.FC<{id: string; children: React.ReactNode}> = ({id, children}) => {
  applyTheme(id);
  return <>{children}</>;
};

const Label: React.FC<{name: string; id: string; description: string}> = ({name, id, description}) => (
  <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 28px', background: C.board, color: C.paper, display: 'flex', alignItems: 'baseline', gap: 24}}>
    <span style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 44}}>{name}</span>
    <span style={{fontFamily: FONT_MONO, fontSize: 22, opacity: 0.85}}>theme: "{id}" · {description}</span>
  </div>
);

const ThemeBlock: React.FC<{index: number}> = ({index}) => {
  const t = THEME_LIST[index];
  let start = 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <ThemeDefs />
      {segments(index).map((s, k) => {
        const from = start;
        start += s.frames;
        const scene: Scene = {
          id: `theme-${t.id}-${k}`,
          kind: s.kind,
          narration: '',
          onScreenText: s.onScreenText ?? null,
          visual: s.visual,
          motion: s.motion ?? null,
          startFrame: 0,
          durationFrames: s.frames,
          sentences: [{text: '', startFrame: 0, endFrame: Math.max(1, s.frames - 10)}],
        };
        return (
          <Sequence key={k} from={from} durationInFrames={s.frames}>
            <AbsoluteFill style={{backgroundColor: C.paper, overflow: 'hidden', ...themeContentStyle(t)}}>
              <SceneContent scene={scene} ctx={CTX} />
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <ThemeOverlay />
      <Label name={t.name} id={t.id} description={t.description} />
    </AbsoluteFill>
  );
};

/** Every theme with the same mini-story: illustration scene, bar chart, verdict. Rendered as preview-themes.mp4. */
export const ThemePreview: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000000'}}>
    {THEME_LIST.map((t, i) => (
      <Sequence key={t.id} name={`theme:${t.id}`} from={i * PER_THEME} durationInFrames={PER_THEME}>
        <ThemeScope id={t.id}>
          <ThemeBlock index={i} />
        </ThemeScope>
      </Sequence>
    ))}
  </AbsoluteFill>
);

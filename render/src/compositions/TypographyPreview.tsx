import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {SceneContent} from '../Video';
import {TEXT_PRESETS} from '../typography';
import {LOWER_THIRD_STYLES, LowerThird} from '../typography/overlays';
import {CAPTION_STYLES, StyledCaptions} from '../typography/captions';
import {applyTheme} from '../themes';
import type {Scene, VideoProps, Word} from '../types';

/** 4 s per entry. Placeholder texts only (no factual claims). */
const PER = 120;
const THEMES = ['signed-or-passed', 'synthwave'];

const DEMO: Record<string, any> = {
  typewriter: {lines: ['Day 1, 09:00.', 'The offer arrives by fax.']},
  'word-pop': {text: 'Would you sign this deal?', accent: ['sign']},
  'highlighter-marker': {lines: ['The offer was generous.', 'The timing was not.']},
  'strike-then-correct': {wrong: '$1 million', right: '$10 million'},
  'stamp-text': {text: 'Passed'},
  'neon-flicker': {text: 'Open all night'},
  'handwritten-reveal': {text: 'Signed'},
  'newspaper-spin': {text: 'Deal of the century?', date: 'MONDAY'},
  'split-flap': {lines: ['OFFER ACCEPTED', 'GATE 12 ON TIME'], accentRow: 0},
  'scrolling-ticker': {lines: ['Offer on the table', 'Board meets at noon', 'Decision expected today'], label: 'Latest', title: 'Meanwhile...'},
  'quote-card': {text: 'We will never sell this company.', speaker: 'A placeholder founder'},
};

type Entry = {name: string; note: string; theme: string; kind: 'preset' | 'lower-third' | 'chapter' | 'captions'; id: string};

const ENTRIES: Entry[] = [
  ...THEMES.flatMap((t) =>
    Object.keys(TEXT_PRESETS).map((id) => ({name: id, note: `theme ${t} · ${TEXT_PRESETS[id].description} · ${TEXT_PRESETS[id].fields}`, theme: t, kind: 'preset' as const, id})),
  ),
  ...LOWER_THIRD_STYLES.map((s) => ({name: `lower third: ${s}`, note: `scenes[].lowerThird {style: "${s}", title, subtitle?}`, theme: THEMES[0], kind: 'lower-third' as const, id: s})),
  {name: 'chapter', note: 'scene kind chapter {number, title}', theme: THEMES[0], kind: 'chapter', id: 'chapter'},
  ...CAPTION_STYLES.map((s) => ({name: `captions: ${s}`, note: `spec.captionStyle "${s}" (Shorts)`, theme: THEMES[0], kind: 'captions' as const, id: s})),
];

export const TYPOGRAPHY_PREVIEW_FRAMES = Math.max(1, PER * ENTRIES.length);

const CTX: VideoProps = {
  slug: 'typography-preview',
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
  title: 'Typography preview',
};

const base = (id: string, kind: string, visual: any): Scene => ({id, kind, narration: '', onScreenText: null, visual, startFrame: 0, durationFrames: PER, sentences: []});

const illustration = (id: string): Scene => ({
  ...base(id, 'illustration', {
    background: 'OfficeBackdrop',
    layers: [
      {component: 'Desk', x: 55, y: 74, scale: 1, enter: 'none'},
      {component: 'Contract', x: 60, y: 60, scale: 0.8, enter: 'none'},
      {component: 'Character', props: {pose: 'talk', costume: 'suit', colour: 'ink'}, x: 72, y: 58, scale: 1, enter: 'none'},
    ],
  }),
});

const PHRASE = 'This is how captions look in a Short with this style';
const WORDS: Word[] = PHRASE.split(' ').map((t, i) => ({text: t, startFrame: 6 + i * 9, endFrame: 6 + i * 9 + 8}));

const Themed: React.FC<{theme: string; children: React.ReactNode}> = ({theme, children}) => {
  applyTheme(theme);
  return <>{children}</>;
};

const Label: React.FC<{name: string; note: string}> = ({name, note}) => (
  <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, padding: '0 28px', background: C.board, color: C.paper, display: 'flex', alignItems: 'center', gap: 24}}>
    <span style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 44, whiteSpace: 'nowrap'}}>{name}</span>
    <span style={{fontFamily: FONT_MONO, fontSize: 22, opacity: 0.85, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{note}</span>
  </div>
);

const Block: React.FC<{e: Entry; i: number}> = ({e, i}) => {
  if (e.kind === 'preset') {
    return <SceneContent scene={base(`ty-${i}`, 'kinetic-text', {preset: e.id, ...DEMO[e.id]})} ctx={CTX} />;
  }
  if (e.kind === 'lower-third') {
    return (
      <AbsoluteFill>
        <SceneContent scene={illustration(`lt-${i}`)} ctx={CTX} />
        <LowerThird lt={{style: e.id, title: 'Person A', subtitle: 'Founder · placeholder', atSec: 0.3, durationSec: 3.2}} duration={PER} />
      </AbsoluteFill>
    );
  }
  if (e.kind === 'chapter') {
    return <SceneContent scene={base(`ch-${i}`, 'chapter', {number: 2, title: 'The offer'})} ctx={CTX} />;
  }
  return (
    <AbsoluteFill>
      <SceneContent scene={base(`cap-${i}`, 'title', {title: 'Caption style', subtitle: e.id})} ctx={CTX} />
      <StyledCaptions words={WORDS} captionStyle={e.id} />
    </AbsoluteFill>
  );
};

/** Every kinetic-text preset in 2 themes, the lower thirds, the chapter card and the Shorts caption styles. Rendered as preview-typography.mp4. */
export const TypographyPreview: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    {ENTRIES.map((e, i) => (
      <Sequence key={`${e.name}-${e.theme}-${i}`} name={`ty:${e.name}`} from={i * PER} durationInFrames={PER}>
        <Themed theme={e.theme}>
          <AbsoluteFill style={{backgroundColor: C.paper}}>
            <Block e={e} i={i} />
            <Label name={e.name} note={e.note} />
          </AbsoluteFill>
        </Themed>
      </Sequence>
    ))}
  </AbsoluteFill>
);

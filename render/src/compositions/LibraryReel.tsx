import React from 'react';
import {AbsoluteFill, Sequence, Series, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {applyTheme} from '../themes';
import {PREVIEW_FRAMES, Preview} from './Preview';
import {THEME_PREVIEW_FRAMES, ThemePreview} from './ThemePreview';
import {ERA_PREVIEW_FRAMES, EraPreview} from './EraPreview';
import {MOOD_PREVIEW_FRAMES, MoodPreview} from './MoodPreview';
import {CHARACTER_PREVIEW_FRAMES, CharacterPreview} from './CharacterPreview';
import {EFFECTS_PREVIEW_FRAMES, EffectsPreview} from './EffectsPreview';
import {TRANSITION_PREVIEW_FRAMES, TransitionPreview} from './TransitionPreview';
import {INFOGRAPHIC_PREVIEW_FRAMES, InfographicPreview} from './InfographicPreview';
import {TYPOGRAPHY_PREVIEW_FRAMES, TypographyPreview} from './TypographyPreview';
import {TEMPLATE_PREVIEW_FRAMES, TemplatePreview} from './TemplatePreview';

/**
 * LibraryReel: a 2-3 minute showcase of the whole motion-graphics library (release 'library', library-reel.mp4).
 * Every section = a title card + CLIPS excerpts taken evenly spread from that section's preview composition.
 * It reuses the preview compositions (no extra assets), so it always shows the current library.
 */
const FPS = 30;
const CARD = 2 * FPS;
const CLIP = 4 * FPS;
const CLIPS = 3;
const INTRO = 3 * FPS;
const OUTRO = 3 * FPS;

type Section = {title: string; subtitle: string; Comp: React.FC; total: number};

const SECTIONS: Section[] = [
  {title: 'Illustrations', subtitle: 'props, icons, scene kinds — preview.mp4', Comp: Preview, total: PREVIEW_FRAMES},
  {title: 'Themes', subtitle: 'one story, every house style — preview-themes.mp4', Comp: ThemePreview, total: THEME_PREVIEW_FRAMES},
  {title: 'Eras', subtitle: 'backdrops + props from ancient to future — preview-eras.mp4', Comp: EraPreview, total: ERA_PREVIEW_FRAMES},
  {title: 'Moods & shots', subtitle: 'ready-made cinematic shots — preview-moods.mp4', Comp: MoodPreview, total: MOOD_PREVIEW_FRAMES},
  {title: 'Characters', subtitle: 'poses, costumes, hats, crowds — preview-characters.mp4', Comp: CharacterPreview, total: CHARACTER_PREVIEW_FRAMES},
  {title: 'Effects', subtitle: 'overlays, particles, paper, looks — preview-effects.mp4', Comp: EffectsPreview, total: EFFECTS_PREVIEW_FRAMES},
  {title: 'Transitions', subtitle: 'scene changes + parallax moves — preview-transitions.mp4', Comp: TransitionPreview, total: TRANSITION_PREVIEW_FRAMES},
  {title: 'Infographics', subtitle: 'charts, maps, timelines — preview-infographics.mp4', Comp: InfographicPreview, total: INFOGRAPHIC_PREVIEW_FRAMES},
  {title: 'Typography', subtitle: 'kinetic text, lower thirds, captions — preview-typography.mp4', Comp: TypographyPreview, total: TYPOGRAPHY_PREVIEW_FRAMES},
  {title: 'Scene templates', subtitle: 'whole scenes in any era — preview-templates.mp4', Comp: TemplatePreview, total: TEMPLATE_PREVIEW_FRAMES},
];

/** Start frames of the excerpts: evenly spread, never past the end of the preview. */
const clipStarts = (total: number): number[] => {
  const room = Math.max(0, total - CLIP);
  return Array.from({length: CLIPS}, (_, i) => Math.round((room * (i + 0.5)) / CLIPS));
};

export const LIBRARY_REEL_FRAMES = INTRO + OUTRO + SECTIONS.length * (CARD + CLIPS * CLIP);

const Card: React.FC<{kicker: string; title: string; subtitle: string; len: number}> = ({kicker, title, subtitle, len}) => {
  applyTheme(null);
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 8, len - 6, len], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(f, [0, 12], [24, 0], {extrapolateRight: 'clamp'});
  const w = interpolate(f, [4, 20], [0, 420], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: C.paper, justifyContent: 'center', alignItems: 'center', opacity: o}}>
      <div style={{transform: `translateY(${y}px)`, textAlign: 'center'}}>
        <div style={{fontFamily: FONT_MONO, fontSize: 30, letterSpacing: 6, color: C.stamp, textTransform: 'uppercase'}}>{kicker}</div>
        <div style={{fontFamily: FONT_HEAD, fontSize: 120, fontWeight: 800, color: C.board, lineHeight: 1.1}}>{title}</div>
        <div style={{height: 8, width: w, background: C.ink, margin: '18px auto'}} />
        <div style={{fontFamily: FONT_MONO, fontSize: 32, color: C.grey}}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Section label strip under the excerpt (the previews keep their own corner labels visible). */
const STRIP = 64;
const SCALE = (1080 - STRIP - 16) / 1080;

/** Plays frames [start, start + CLIP) of a preview composition, scaled into a frame with a section label strip. */
const Excerpt: React.FC<{Comp: React.FC; start: number; label: string; index: number}> = ({Comp, start, label, index}) => {
  applyTheme(null);
  return (
    <AbsoluteFill style={{background: C.board}}>
      <div style={{position: 'absolute', left: (1920 * (1 - SCALE)) / 2, top: 8, width: 1920, height: 1080, transform: `scale(${SCALE})`, transformOrigin: 'top left', overflow: 'hidden'}}>
        <AbsoluteFill style={{background: C.paper}}>
          <Sequence from={-start}>
            <Comp />
          </Sequence>
        </AbsoluteFill>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: STRIP, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', fontFamily: FONT_MONO, fontSize: 26, color: C.paper}}>
        <span>{label}</span>
        <span style={{color: C.greyLight}}>{`${String(index + 1).padStart(2, '0')} / ${SECTIONS.length}`}</span>
      </div>
    </AbsoluteFill>
  );
};

export const LibraryReel: React.FC = () => (
  <AbsoluteFill style={{background: C.paper}}>
    <Series>
      <Series.Sequence durationInFrames={INTRO}>
        <Card kicker="video factory" title="The Library" subtitle={`${SECTIONS.length} sections · self-made code, procedural audio, CC0 / PD only`} len={INTRO} />
      </Series.Sequence>
      {SECTIONS.flatMap((s, i) => [
        <Series.Sequence key={`c${i}`} durationInFrames={CARD}>
          <Card kicker={`${String(i + 1).padStart(2, '0')} / ${SECTIONS.length}`} title={s.title} subtitle={s.subtitle} len={CARD} />
        </Series.Sequence>,
        ...clipStarts(s.total).map((st, k) => (
          <Series.Sequence key={`s${i}-${k}`} durationInFrames={CLIP}>
            <Excerpt Comp={s.Comp} start={st} label={s.title} index={i} />
          </Series.Sequence>
        )),
      ])}
      <Series.Sequence durationInFrames={OUTRO}>
        <Card kicker="release 'library'" title="Use it in spec.json" subtitle="every preview, board and zip: see docs/library/" len={OUTRO} />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);

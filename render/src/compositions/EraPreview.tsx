import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {ALL_ILLUSTRATIONS, BACKDROPS, Layer} from '../illustrations';
import {ERA_LIST, type EraDef} from '../eras';

const BACK_FRAMES = 90;
const GRID_FRAMES = 150;
const SCENE_FRAMES = 120;
const PER_ERA = BACK_FRAMES + GRID_FRAMES + SCENE_FRAMES;
export const ERA_PREVIEW_FRAMES = Math.max(1, PER_ERA * ERA_LIST.length);

const Label: React.FC<{era: EraDef; part: string}> = ({era, part}) => (
  <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, padding: '0 28px', background: C.board, color: C.paper, display: 'flex', alignItems: 'center', gap: 24}}>
    <span style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 44}}>{era.name}</span>
    <span style={{fontFamily: FONT_MONO, fontSize: 22, opacity: 0.85}}>
      era: "{era.id}" · {era.years} · {part}
    </span>
  </div>
);

const DateTag: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', left: 40, bottom: 110, padding: '6px 14px', background: C.paper, border: `3px solid ${C.board}`, fontFamily: FONT_MONO, fontSize: 28, color: C.board}}>{text}</div>
);

const Grid: React.FC<{names: string[]}> = ({names}) => {
  const n = names.length;
  const cols = Math.min(5, Math.max(1, n));
  const rows = Math.max(1, Math.ceil(n / cols));
  const cw = 1920 / cols;
  const ch = 920 / rows;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      {names.map((name, i) => {
        const e = ALL_ILLUSTRATIONS[name];
        if (!e) return null;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = (col + 0.5) * cw;
        const cy = 20 + (row + 0.45) * ch;
        const fit = Math.min((cw * 0.78) / e.w, (ch * 0.72) / e.h, 1.4);
        return (
          <React.Fragment key={name}>
            <Layer layer={{component: name, x: (cx / 1920) * 100, y: (cy / 1080) * 100, scale: fit, delaySec: i * 0.12}} />
            <div style={{position: 'absolute', left: col * cw, width: cw, top: 20 + (row + 0.92) * ch - 18, textAlign: 'center', fontFamily: FONT_MONO, fontSize: 20, color: C.board}}>{name}</div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

const SceneDemo: React.FC<{era: EraDef}> = ({era}) => {
  const B = BACKDROPS[era.backdrop];
  const picks = era.props.slice(0, 3);
  const pos: Array<[number, number]> = [
    [24, 64],
    [52, 70],
    [78, 62],
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      {B ? <B /> : null}
      {picks.map((name, i) => {
        const e = ALL_ILLUSTRATIONS[name];
        if (!e) return null;
        const s = Math.min(1, 520 / e.w, 440 / e.h);
        return <Layer key={name} layer={{component: name, x: pos[i][0], y: pos[i][1], scale: s, delaySec: 0.2 + i * 0.25}} />;
      })}
      <DateTag text={era.dateTag} />
    </AbsoluteFill>
  );
};

const EraBlock: React.FC<{era: EraDef}> = ({era}) => {
  const B = BACKDROPS[era.backdrop];
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <Sequence from={0} durationInFrames={BACK_FRAMES}>
        <AbsoluteFill style={{backgroundColor: C.paper}}>
          {B ? <B /> : null}
          <Label era={era} part={`backdrop: ${era.backdrop}`} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={BACK_FRAMES} durationInFrames={GRID_FRAMES}>
        <AbsoluteFill>
          <Grid names={era.props} />
          <Label era={era} part={`${era.props.length} props`} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={BACK_FRAMES + GRID_FRAMES} durationInFrames={SCENE_FRAMES}>
        <AbsoluteFill>
          <SceneDemo era={era} />
          <Label era={era} part={`suggested theme: ${era.theme} · ${era.notes}`} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/** Every era pack: its backdrop, a grid of all its props, and a small composed scene. Rendered as preview-eras.mp4. */
export const EraPreview: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    {ERA_LIST.map((era, i) => (
      <Sequence key={era.id} name={`era:${era.id}`} from={i * PER_ERA} durationInFrames={PER_ERA}>
        <EraBlock era={era} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

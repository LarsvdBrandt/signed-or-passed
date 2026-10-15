import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {PaperGrain} from '../components/common';

export type SoundItem = {name: string; category: string; description: string; startFrame: number; endFrame: number; file?: string; credit?: string};
export type SoundBoardProps = {fps?: number; totalFrames: number; title?: string; subtitle?: string; items: SoundItem[]; env: number[]};

/** Studio defaults; CI passes build/sfx-lib/soundboard-props.json (written by pipeline/soundboard.py). */
export const soundBoardDefaults: SoundBoardProps = {
  totalFrames: 90,
  title: 'Sound library',
  subtitle: 'preview',
  items: [{name: 'stamp_thud', category: 'office', description: 'Rubber stamp hitting paper', startFrame: 10, endFrame: 40}],
  env: [],
};

const BARS = 80;
const LIST = 16;

/** Sound board: plays every library sound in a row (audio muxed in CI) and shows its name, category, file, credit and level. */
export const SoundBoard: React.FC<SoundBoardProps> = ({title = 'Sound library', subtitle = '', items = [], env = []}) => {
  const frame = useCurrentFrame();
  let idx = -1;
  for (let i = 0; i < items.length; i++) {
    if (frame >= items[i].startFrame) idx = i;
  }
  const cur = idx >= 0 ? items[idx] : null;
  const playing = cur !== null && frame <= cur.endFrame;
  const level = frame >= 0 && frame < env.length ? env[frame] : 0;
  const bars: number[] = [];
  for (let k = 0; k < BARS; k++) {
    const f = frame - (BARS - 1 - k);
    bars.push(f >= 0 && f < env.length ? env[f] : 0);
  }
  const winStart = Math.max(0, Math.min(items.length - LIST, idx - 7));
  const list = items.slice(winStart, winStart + LIST);
  const recorded = cur !== null && (cur.file || '').startsWith('recorded/');
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <div style={{position: 'absolute', left: 80, top: 60, right: 680}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 56, color: C.board}}>{title}</div>
        <div style={{fontFamily: FONT_MONO, fontSize: 24, color: C.grey, marginTop: 6}}>{subtitle}</div>
      </div>
      {cur ? (
        <div style={{position: 'absolute', left: 80, top: 280, right: 680}}>
          <div style={{fontFamily: FONT_MONO, fontSize: 28, color: C.grey}}>{`#${idx + 1} / ${items.length}`}</div>
          <div style={{display: 'flex', gap: 14, marginTop: 18}}>
            <div style={{padding: '6px 16px', border: `3px solid ${C.stamp}`, color: C.stamp, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 26, letterSpacing: 2, textTransform: 'uppercase'}}>
              {cur.category}
            </div>
            <div style={{padding: '6px 16px', border: `3px solid ${recorded ? C.ink : C.grey}`, color: recorded ? C.ink : C.grey, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 26, letterSpacing: 2, textTransform: 'uppercase'}}>
              {recorded ? 'recorded' : 'procedural'}
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT_HEAD,
              fontWeight: 800,
              fontSize: 104,
              lineHeight: 1.0,
              marginTop: 20,
              color: playing ? C.ink : C.board,
              transform: `scale(${1 + 0.04 * level})`,
              transformOrigin: 'left center',
            }}
          >
            {cur.name.replace(/_/g, ' ')}
          </div>
          <div style={{fontFamily: FONT_MONO, fontSize: 28, color: C.board, marginTop: 18}}>{cur.description}</div>
          <div style={{fontFamily: FONT_MONO, fontSize: 22, color: C.grey, marginTop: 10}}>{`file: ${cur.file || `wav/${cur.name}.wav`}`}</div>
          {cur.credit ? <div style={{fontFamily: FONT_MONO, fontSize: 22, color: C.grey, marginTop: 6}}>{cur.credit}</div> : null}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 80, right: 680, bottom: 90, height: 240, display: 'flex', alignItems: 'center', gap: 4}}>
        {bars.map((v, k) => (
          <div key={k} style={{flex: 1, height: Math.max(4, v * 240), background: k === BARS - 1 ? C.stamp : C.ink, opacity: 0.35 + 0.65 * (k / BARS)}} />
        ))}
      </div>
      <div style={{position: 'absolute', right: 60, top: 60, width: 560, bottom: 60, borderLeft: `3px solid ${C.board}`, paddingLeft: 32, boxSizing: 'border-box'}}>
        {list.map((it, k) => {
          const i = winStart + k;
          const on = i === idx;
          return (
            <div
              key={`${i}-${it.name}`}
              style={{
                fontFamily: FONT_MONO,
                fontSize: 26,
                lineHeight: '56px',
                color: on ? C.paper : i < idx ? C.grey : C.board,
                background: on ? C.ink : 'transparent',
                padding: '0 14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {`${String(i + 1).padStart(2, '0')}  ${it.name}`}
            </div>
          );
        })}
      </div>
      <PaperGrain opacity={0.06} />
    </AbsoluteFill>
  );
};

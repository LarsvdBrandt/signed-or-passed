import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE} from '../constants';
import {PaperGrain} from '../components/common';
import {ILLUSTRATIONS} from '../illustrations';
import {Spotlight} from '../illustrations/Objects';
import {SignatureMark, StampMark} from '../scenes/VerdictScene';
import type {VideoProps} from '../types';

/** 1280x720: dark left half with big figure + headline + verdict mark, illustration on the right. */
export const Thumbnail: React.FC<VideoProps> = (props) => {
  const t = props.thumbnail || {};
  const verdict = t.verdict || props.verdict;
  const entry = ILLUSTRATIONS[t.illustration || 'Contract'] || ILLUSTRATIONS.Contract;
  const big = t.bigText || '';
  const bigSize = Math.min(150, 540 / Math.max(1, big.length * 0.62));
  const fit = Math.min(520 / entry.w, 560 / entry.h);
  const Comp = entry.C;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper, flexDirection: 'row'}}>
      <div style={{width: 640, height: 720, background: C.board, padding: '48px 46px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 26, boxSizing: 'border-box'}}>
        <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: bigSize, lineHeight: 1, color: C.paper, whiteSpace: 'nowrap'}}>{big}</div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 64, lineHeight: 1.0, color: C.paper}}>{t.headline}</div>
        <div style={{alignSelf: 'flex-start', background: C.paper, border: `${STROKE}px solid ${C.paper}`, padding: '6px 10px', transform: 'rotate(-4deg)', marginTop: 6}}>
          {verdict === 'SIGNED' ? <SignatureMark size={0.42} progress={1} /> : <div style={{transform: 'rotate(-4deg)'}}><StampMark size={0.62} /></div>}
        </div>
      </div>
      <div style={{position: 'relative', flex: 1, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: 600, height: 700, opacity: 0.9}}>
          <Spotlight colour="greyLight" />
        </div>
        <div style={{position: 'absolute', left: '50%', top: '52%', width: entry.w, height: entry.h, transform: `translate(-50%, -50%) scale(${fit})`}}>
          <Comp {...(t.illustrationProps || {})} />
        </div>
      </div>
      <PaperGrain opacity={0.08} />
    </AbsoluteFill>
  );
};

import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {PaperGrain} from '../components/common';
import {StampBox} from '../components/brand';
import {ILLUSTRATIONS} from '../illustrations';
import {Spotlight} from '../illustrations/Objects';
import {SignatureMark} from '../scenes/VerdictScene';
import type {VideoProps} from '../types';

/**
 * 1280x720, following brand/Thumbnail-template 1280x720.png:
 * left half Board black with a small mono line (bigText, e.g. "2000 · $50M"), a huge Bricolage 800 headline in
 * Paper, and the verdict mark (orange PASSED stamp box or ink Signed) below; right half Paper with the illustration.
 */
const LEFT_W = 640;
const TEXT_W = LEFT_W - 64 - 40;

const linesAt = (words: string[], size: number): number => {
  const cpl = Math.max(1, TEXT_W / (size * 0.55));
  let lines = 1;
  let cur = 0;
  for (const w of words) {
    if (cur === 0) cur = w.length;
    else if (cur + 1 + w.length <= cpl) cur += 1 + w.length;
    else {
      lines++;
      cur = w.length;
    }
  }
  return lines;
};

export const Thumbnail: React.FC<VideoProps> = (props) => {
  const t = props.thumbnail || {};
  const verdict = t.verdict || props.verdict;
  const entry = ILLUSTRATIONS[t.illustration || 'Contract'] || ILLUSTRATIONS.Contract;
  const meta = t.bigText || '';
  const words = (t.headline || '').split(/\s+/).filter(Boolean);
  const longest = Math.max(3, ...words.map((w) => w.length));
  let hs = Math.min(112, TEXT_W / (longest * 0.55));
  while (hs > 52 && linesAt(words, hs) * hs * 0.95 > 330) hs -= 4;
  const metaSize = Math.min(40, TEXT_W / (Math.max(1, meta.length) * 0.62));
  const fit = Math.min(520 / entry.w, 560 / entry.h);
  const Comp = entry.C;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper, flexDirection: 'row'}}>
      <div style={{position: 'relative', width: LEFT_W, height: 720, background: C.board, padding: '0 40px 0 64px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        {meta ? <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: metaSize, letterSpacing: 2, color: C.paper, whiteSpace: 'nowrap', marginBottom: 26}}>{meta}</div> : null}
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: hs, lineHeight: 0.95, letterSpacing: -hs * 0.02, color: C.paper}}>{t.headline}</div>
        <div style={{marginTop: 40, alignSelf: 'flex-start', marginLeft: -6}}>
          {verdict === 'SIGNED' ? <SignatureMark size={0.5} progress={1} /> : <StampBox size={84} rotate={-7} />}
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

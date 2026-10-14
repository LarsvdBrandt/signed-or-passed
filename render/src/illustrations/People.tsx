import React from 'react';
import {C, FONT_MONO, STROKE, colourOf} from '../constants';

export type IllProps = {colour?: string; label?: string; pose?: string; flip?: boolean; [k: string]: any};

const Limb: React.FC<{d: string; c: string; edge: string; w?: number}> = ({d, c, edge, w = 24}) => (
  <>
    <path d={d} stroke={edge} strokeWidth={w + STROKE * 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d={d} stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </>
);

const ARMS: Record<string, string[]> = {
  standing: ['M66 125 L54 245', 'M134 125 L146 245'],
  'arms-crossed': ['M66 125 L62 182 L140 172', 'M134 125 L138 182 L60 188'],
  pointing: ['M66 125 L54 245', 'M134 125 L196 68'],
  handshake: ['M66 125 L54 245', 'M134 125 L160 200 L198 196'],
  sitting: ['M66 125 L60 215 L112 222', 'M134 125 L146 215 L182 214'],
};

/** Faceless silhouette. pose: standing | sitting | arms-crossed | pointing | handshake. flip mirrors it. */
export const Person: React.FC<IllProps> = ({colour, pose = 'standing', flip}) => {
  const c = colourOf(colour, C.board);
  const edge = c === C.board ? C.grey : C.board;
  const legs = c === C.board ? C.grey : C.board;
  const arms = ARMS[pose] || ARMS.standing;
  const legPaths = pose === 'sitting' ? ['M82 255 L150 262 L150 388', 'M118 255 L182 262 L184 388'] : ['M82 252 L80 386', 'M118 252 L120 386'];
  return (
    <svg width={200} height={400} viewBox="0 0 200 400" overflow="visible">
      <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>
        {legPaths.map((d, i) => (
          <Limb key={'l' + i} d={d} c={legs} edge={C.board} w={30} />
        ))}
        <path d="M58 112 Q100 92 142 112 L150 258 L50 258 Z" fill={c} stroke={edge} strokeWidth={STROKE} strokeLinejoin="round" />
        {arms.map((d, i) => (
          <Limb key={'a' + i} d={d} c={c} edge={edge} />
        ))}
        <circle cx={100} cy={58} r={36} fill={c} stroke={edge} strokeWidth={STROKE} />
      </g>
    </svg>
  );
};

/** Name plate used instead of faces: who is who, set in IBM Plex Mono. */
export const NameCard: React.FC<IllProps> = ({label = 'NAME', colour}) => (
  <div style={{width: 360, height: 90, display: 'flex', alignItems: 'center', background: C.paper, border: `${STROKE}px solid ${C.board}`, boxShadow: `8px 8px 0 ${C.board}`, boxSizing: 'border-box'}}>
    <div style={{width: 18, alignSelf: 'stretch', background: colourOf(colour, C.ink), borderRight: `${STROKE}px solid ${C.board}`}} />
    <div style={{flex: 1, textAlign: 'center', fontFamily: FONT_MONO, fontWeight: 700, fontSize: label.length > 16 ? 22 : 32, letterSpacing: 2, color: C.board, padding: '0 12px', whiteSpace: 'nowrap', overflow: 'hidden'}}>{label}</div>
  </div>
);

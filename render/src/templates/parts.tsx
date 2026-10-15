import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';

/**
 * Extra house-style pieces used by the scene templates (flat, 3px Board-black outlines, brand colours only).
 * They can be used as layers inside templates (visual.props.layers) as well.
 */
const S = STROKE;

/** Open garage with a rolled-up door and a bare bulb; label on the roof. 900x560 */
export const Garage: React.FC<any> = ({label, colour}) => (
  <svg width={900} height={560} viewBox="0 0 900 560">
    <rect x={60} y={150} width={780} height={402} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
    <path d="M20 160 L450 24 L880 160 Z" fill={colourOf(colour, C.stamp)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
    <rect x={130} y={216} width={640} height={336} fill={C.board} stroke={C.board} strokeWidth={S} />
    <rect x={130} y={216} width={640} height={64} fill={C.grey} stroke={C.board} strokeWidth={S} />
    <line x1={130} y1={248} x2={770} y2={248} stroke={C.board} strokeWidth={S} />
    <line x1={450} y1={280} x2={450} y2={318} stroke={C.greyLight} strokeWidth={3} />
    <circle cx={450} cy={330} r={12} fill={C.paper} />
    {label ? (
      <text x={450} y={136} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={String(label).length > 14 ? 24 : 32} letterSpacing={3} fill={C.paper}>
        {String(label).toUpperCase()}
      </text>
    ) : null}
  </svg>
);

/** Press podium with two microphones and a name plate. 360x420 */
export const Podium: React.FC<any> = ({label, colour}) => {
  const c = colourOf(colour, C.ink);
  const text = label ? String(label).toUpperCase() : '';
  return (
    <svg width={360} height={420} viewBox="0 0 360 420" overflow="visible">
      <path d="M150 70 L120 14" stroke={C.board} strokeWidth={6} strokeLinecap="round" />
      <path d="M210 70 L240 14" stroke={C.board} strokeWidth={6} strokeLinecap="round" />
      <circle cx={120} cy={12} r={10} fill={C.board} />
      <circle cx={240} cy={12} r={10} fill={C.board} />
      <rect x={20} y={70} width={320} height={44} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
      <path d="M40 114 L320 114 L300 414 L60 414 Z" fill={c} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      {text ? (
        <>
          <rect x={80} y={170} width={200} height={64} fill={C.paper} stroke={C.board} strokeWidth={S} />
          <text x={180} y={212} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={text.length > 10 ? 18 : 26} fill={C.board}>{text}</text>
        </>
      ) : null}
    </svg>
  );
};

/** Raised judge's bench with a name plate. 900x360 */
export const Bench: React.FC<any> = ({label, colour}) => (
  <svg width={900} height={360} viewBox="0 0 900 360">
    <rect x={10} y={10} width={880} height={50} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
    <rect x={40} y={60} width={820} height={292} fill={colourOf(colour, C.grey)} stroke={C.board} strokeWidth={S} />
    {[110, 230, 670, 790].map((x) => (
      <rect key={x} x={x - 50} y={100} width={100} height={210} fill="none" stroke={C.board} strokeWidth={S} />
    ))}
    <rect x={330} y={130} width={240} height={70} fill={C.paper} stroke={C.board} strokeWidth={S} />
    <text x={450} y={177} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={String(label || 'COURT').length > 10 ? 22 : 34} letterSpacing={4} fill={C.board}>
      {String(label || 'COURT').toUpperCase()}
    </text>
  </svg>
);

/** Stone quay with bollards. 760x140 */
export const Quay: React.FC<any> = ({colour}) => (
  <svg width={760} height={140} viewBox="0 0 760 140">
    <rect x={6} y={40} width={748} height={94} fill={colourOf(colour, C.grey)} stroke={C.board} strokeWidth={S} />
    <line x1={6} y1={70} x2={754} y2={70} stroke={C.board} strokeWidth={S} />
    {[120, 380, 640].map((x) => (
      <rect key={x} x={x - 16} y={10} width={32} height={34} rx={8} fill={C.board} />
    ))}
  </svg>
);

/** Full-width flat sea with rolling crests. 1920x260 */
export const Waves: React.FC<any> = ({colour, speed = 1}) => {
  const frame = useCurrentFrame();
  const off = Math.abs(frame * 1.5 * Number(speed || 1)) % 120;
  let crest = 'M-120 40';
  for (let i = 0; i < 18; i++) crest += ' q30 -22 60 0 q30 22 60 0';
  let foam = 'M-120 120';
  for (let i = 0; i < 18; i++) foam += ' q30 -14 60 0 q30 14 60 0';
  return (
    <svg width={1920} height={260} viewBox="0 0 1920 260" overflow="hidden">
      <g transform={`translate(${off} 0)`}>
        <path d={`${crest} L2040 260 L-120 260 Z`} fill={colourOf(colour, C.ink)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d={foam} fill="none" stroke={C.paper} strokeWidth={4} opacity={0.45} />
      </g>
    </svg>
  );
};

/** Night skyline: dark towers, a moon and windows that switch on and off. 1920x1080 */
export const NightSkyline: React.FC<any> = ({colour, seed = 3}) => {
  const frame = useCurrentFrame();
  const lit = colourOf(colour, C.paper);
  const phase = Math.floor(frame / 60);
  const blds = Array.from({length: 14}).map((_, i) => ({
    x: i * 140 - 10,
    w: 110 + Math.round(random(`nb-w-${seed}-${i}`) * 50),
    h: 260 + Math.round(random(`nb-h-${seed}-${i}`) * 460),
  }));
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080">
      <rect x={0} y={0} width={1920} height={1080} fill={C.board} />
      <circle cx={1580} cy={190} r={70} fill={C.greyLight} stroke={C.grey} strokeWidth={S} />
      {blds.map((b, i) => {
        const top = 1080 - b.h;
        const cols = Math.max(1, Math.floor((b.w - 20) / 30));
        const rows = Math.max(1, Math.floor((b.h - 40) / 46));
        const wins: React.ReactNode[] = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const tick = (phase + i + r) % 7 === 0 ? phase : 0;
            if (random(`nw-${seed}-${i}-${r}-${c}-${tick}`) > 0.62) {
              wins.push(<rect key={`${r}-${c}`} x={b.x + 14 + c * 30} y={top + 26 + r * 46} width={14} height={20} fill={lit} />);
            }
          }
        }
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h + 10} fill={C.board} stroke={C.grey} strokeWidth={S} />
            {wins}
          </g>
        );
      })}
    </svg>
  );
};

/** A big window frame (look out over the city). 1400x860 */
export const WindowFrame: React.FC<any> = ({colour}) => {
  const c = colourOf(colour, C.greyLight);
  return (
    <svg width={1400} height={860} viewBox="0 0 1400 860">
      <rect x={20} y={20} width={1360} height={780} fill="none" stroke={c} strokeWidth={28} />
      <line x1={700} y1={20} x2={700} y2={800} stroke={c} strokeWidth={18} />
      <line x1={20} y1={380} x2={1380} y2={380} stroke={c} strokeWidth={18} />
      <rect x={0} y={800} width={1400} height={50} fill={C.grey} stroke={C.board} strokeWidth={S} />
    </svg>
  );
};

export type PartEntry = {C: React.FC<any>; w: number; h: number; enter: string};

export const PARTS: Record<string, PartEntry> = {
  Garage: {C: Garage, w: 900, h: 560, enter: 'slide-up'},
  Podium: {C: Podium, w: 360, h: 420, enter: 'slide-up'},
  Bench: {C: Bench, w: 900, h: 360, enter: 'slide-up'},
  Quay: {C: Quay, w: 760, h: 140, enter: 'none'},
  Waves: {C: Waves, w: 1920, h: 260, enter: 'none'},
  NightSkyline: {C: NightSkyline, w: 1920, h: 1080, enter: 'none'},
  WindowFrame: {C: WindowFrame, w: 1400, h: 860, enter: 'fade'},
};

import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import type {IllProps} from './People';

const S = STROKE;
const SHEET = '#FBFAF7';

const wrap = (text: string, max: number): string[] => {
  const lines: string[] = [];
  let cur = '';
  for (const w of (text || '').split(/\s+/).filter(Boolean)) {
    if (cur && (cur + ' ' + w).length > max) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
};

export const Desk: React.FC<IllProps> = ({colour}) => {
  const c = colourOf(colour, C.grey);
  return (
    <svg width={600} height={260} viewBox="0 0 600 260">
      <rect x={6} y={6} width={588} height={40} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
      <rect x={30} y={46} width={200} height={200} fill={c} stroke={C.board} strokeWidth={S} />
      <line x1={30} y1={112} x2={230} y2={112} stroke={C.board} strokeWidth={S} />
      <line x1={30} y1={178} x2={230} y2={178} stroke={C.board} strokeWidth={S} />
      {[74, 140, 206].map((y) => (
        <rect key={y} x={105} y={y} width={50} height={10} rx={5} fill={C.paper} stroke={C.board} strokeWidth={S} />
      ))}
      <rect x={536} y={46} width={34} height={200} fill={c} stroke={C.board} strokeWidth={S} />
    </svg>
  );
};

export const Contract: React.FC<IllProps> = ({label = 'CONTRACT', colour}) => (
  <svg width={220} height={290} viewBox="0 0 220 290">
    <path d="M6 6 H170 L214 50 V284 H6 Z" fill={SHEET} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
    <path d="M170 6 V50 H214" fill={C.greyLight} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
    <text x={24} y={44} fontFamily={FONT_HEAD} fontWeight={800} fontSize={20} letterSpacing={2} fill={C.board} {...(label.length > 12 ? {textLength: 140, lengthAdjust: 'spacingAndGlyphs'} : {})}>{label}</text>
    {[72, 94, 116, 138, 160, 182].map((y, i) => (
      <rect key={y} x={24} y={y} width={i % 3 === 2 ? 110 : 170} height={8} fill={C.greyLight} />
    ))}
    <line x1={24} y1={252} x2={160} y2={252} stroke={C.board} strokeWidth={S} />
    <text x={24} y={242} fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={colourOf(colour, C.ink)}>x</text>
  </svg>
);

export const FountainPen: React.FC<IllProps> = ({colour}) => {
  const c = colourOf(colour, C.ink);
  return (
    <svg width={300} height={80} viewBox="0 0 300 80" overflow="visible">
      <g transform="rotate(-18 150 40)">
        <path d="M18 40 L62 27 L62 53 Z" fill={C.board} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <line x1={30} y1={40} x2={58} y2={40} stroke={C.paper} strokeWidth={2} />
        <rect x={62} y={25} width={58} height={30} rx={4} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
        <rect x={120} y={21} width={164} height={38} rx={15} fill={c} stroke={C.board} strokeWidth={S} />
        <rect x={150} y={17} width={9} height={46} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
      </g>
    </svg>
  );
};

export const Stamp: React.FC<IllProps> = ({colour}) => {
  const c = colourOf(colour, C.stamp);
  return (
    <svg width={160} height={220} viewBox="0 0 160 220">
      <circle cx={80} cy={40} r={30} fill={C.board} stroke={C.board} strokeWidth={S} />
      <rect x={66} y={66} width={28} height={66} fill={C.grey} stroke={C.board} strokeWidth={S} />
      <rect x={14} y={130} width={132} height={50} rx={6} fill={c} stroke={C.board} strokeWidth={S} />
      <rect x={22} y={180} width={116} height={22} fill={C.board} stroke={C.board} strokeWidth={S} />
    </svg>
  );
};

export const DecisionChair: React.FC<IllProps> = ({colour}) => {
  const c = colourOf(colour, C.ink);
  return (
    <svg width={240} height={340} viewBox="0 0 240 340">
      <rect x={50} y={10} width={140} height={172} rx={32} fill={c} stroke={C.board} strokeWidth={S} />
      <rect x={18} y={150} width={26} height={70} rx={10} fill={C.board} />
      <rect x={196} y={150} width={26} height={70} rx={10} fill={C.board} />
      <rect x={30} y={180} width={180} height={42} rx={14} fill={c} stroke={C.board} strokeWidth={S} />
      <rect x={110} y={222} width={20} height={62} fill={C.grey} stroke={C.board} strokeWidth={S} />
      <path d="M36 300 L120 284 L204 300" fill="none" stroke={C.board} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
      {[36, 120, 204].map((x) => (
        <circle key={x} cx={x} cy={316} r={13} fill={C.paper} stroke={C.board} strokeWidth={S} />
      ))}
    </svg>
  );
};

export const Phone: React.FC<IllProps> = ({label = 'INCOMING CALL', colour, ringing = true}) => {
  const frame = useCurrentFrame();
  const lines = wrap(label, 10).slice(0, 4);
  const ring = ringing ? (Math.sin(frame / 3) + 1) / 2 : 0;
  return (
    <svg width={160} height={280} viewBox="0 0 160 280" overflow="visible">
      <rect x={10} y={10} width={140} height={260} rx={24} fill={colourOf(colour, C.board)} stroke={C.board} strokeWidth={S} />
      <rect x={22} y={40} width={116} height={190} rx={8} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <rect x={60} y={22} width={40} height={6} rx={3} fill={C.grey} />
      {lines.map((l, i) => (
        <text key={i} x={80} y={110 + i * 26} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board}>{l}</text>
      ))}
      <circle cx={80} cy={250} r={9} fill={C.paper} stroke={C.board} strokeWidth={2} />
      {ringing ? (
        <g opacity={ring} stroke={C.stamp} strokeWidth={6} fill="none" strokeLinecap="round">
          <path d="M160 40 Q178 60 160 80" />
          <path d="M172 26 Q200 60 172 94" />
        </g>
      ) : null}
    </svg>
  );
};

export const Newspaper: React.FC<IllProps> = ({label = 'BIG NEWS', masthead = 'THE DAILY RECORD'}) => (
  <div style={{width: 380, height: 280, background: SHEET, border: `${S}px solid ${C.board}`, boxSizing: 'border-box', padding: '14px 18px', overflow: 'hidden', transform: 'rotate(-3deg)', boxShadow: `8px 8px 0 rgba(20,20,20,0.2)`}}>
    <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 26, letterSpacing: 1, textAlign: 'center', color: C.board, borderBottom: `${S}px solid ${C.board}`, paddingBottom: 6}}>{masthead}</div>
    <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: label.length > 30 ? 26 : 34, lineHeight: 1.05, marginTop: 10, color: C.board}}>{label}</div>
    <div style={{display: 'flex', gap: 12, marginTop: 12}}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{flex: 1}}>
          {[0, 1, 2, 3, 4].map((j) => (
            <div key={j} style={{height: 7, background: C.greyLight, marginBottom: 7}} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const Briefcase: React.FC<IllProps> = ({colour, label}) => {
  const c = colourOf(colour, C.board);
  const edge = c === C.board ? C.grey : C.board;
  return (
    <svg width={260} height={200} viewBox="0 0 260 200">
      <path d="M90 52 V28 Q90 16 102 16 H158 Q170 16 170 28 V52" fill="none" stroke={c} strokeWidth={14} />
      <rect x={10} y={50} width={240} height={140} rx={16} fill={c} stroke={edge} strokeWidth={S} />
      <line x1={10} y1={98} x2={250} y2={98} stroke={edge} strokeWidth={S} />
      <rect x={112} y={86} width={36} height={26} rx={4} fill={C.paper} stroke={C.board} strokeWidth={S} />
      {label ? <text x={130} y={160} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.paper}>{label}</text> : null}
    </svg>
  );
};

export const MoneyStack: React.FC<IllProps> = ({colour}) => {
  const band = colourOf(colour, C.ink);
  return (
    <svg width={260} height={220} viewBox="0 0 260 220">
      {[160, 118, 76, 34].map((y, i) => (
        <g key={y} transform={`translate(${i % 2 ? 14 : 0} 0)`}>
          <rect x={10} y={y} width={220} height={48} rx={4} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
          <rect x={100} y={y} width={40} height={48} fill={band} stroke={C.board} strokeWidth={S} />
        </g>
      ))}
      <circle cx={52} cy={58} r={16} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <text x={52} y={65} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.board}>$</text>
    </svg>
  );
};

export const Clock: React.FC<IllProps> = ({colour, speed = 4}) => {
  const frame = useCurrentFrame();
  const m = frame * Number(speed);
  const h = m / 12 + 300;
  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      <circle cx={110} cy={110} r={100} fill={C.paper} stroke={C.board} strokeWidth={S * 2} />
      {Array.from({length: 12}).map((_, i) => (
        <line key={i} x1={110} y1={22} x2={110} y2={i % 3 === 0 ? 42 : 34} stroke={C.board} strokeWidth={i % 3 === 0 ? 6 : 3} transform={`rotate(${i * 30} 110 110)`} />
      ))}
      <line x1={110} y1={110} x2={110} y2={62} stroke={C.board} strokeWidth={9} strokeLinecap="round" transform={`rotate(${h} 110 110)`} />
      <line x1={110} y1={110} x2={110} y2={36} stroke={colourOf(colour, C.stamp)} strokeWidth={5} strokeLinecap="round" transform={`rotate(${m} 110 110)`} />
      <circle cx={110} cy={110} r={8} fill={C.board} />
    </svg>
  );
};

export const Calendar: React.FC<IllProps> = ({colour, label = 'MAR', day = '1'}) => (
  <svg width={220} height={240} viewBox="0 0 220 240">
    <rect x={10} y={30} width={200} height={200} rx={10} fill={C.paper} stroke={C.board} strokeWidth={S} />
    <path d="M10 86 V40 Q10 30 20 30 H200 Q210 30 210 40 V86 Z" fill={colourOf(colour, C.stamp)} stroke={C.board} strokeWidth={S} />
    <rect x={52} y={14} width={14} height={34} rx={6} fill={C.board} />
    <rect x={154} y={14} width={14} height={34} rx={6} fill={C.board} />
    <text x={110} y={72} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={28} letterSpacing={3} fill={C.paper}>{label}</text>
    <text x={110} y={190} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={96} fill={C.board}>{String(day)}</text>
  </svg>
);

/** Thick arrow that draws itself in. */
export const Arrow: React.FC<IllProps> = ({colour}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 14], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <svg width={300} height={100} viewBox="0 0 300 100" style={{clipPath: `inset(-5% ${100 - p}% -5% -5%)`}}>
      <path d="M10 38 H210 V12 L290 50 L210 88 V62 H10 Z" fill={colourOf(colour, C.stamp)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
    </svg>
  );
};

/** Flat light cone (semi-transparent, no gradient). Best on dark backgrounds. */
export const Spotlight: React.FC<IllProps> = ({colour}) => {
  const c = colourOf(colour, C.paper);
  return (
    <svg width={600} height={700} viewBox="0 0 600 700">
      <polygon points="265,0 335,0 600,640 0,640" fill={c} opacity={0.22} />
      <ellipse cx={300} cy={640} rx={300} ry={52} fill={c} opacity={0.35} />
    </svg>
  );
};

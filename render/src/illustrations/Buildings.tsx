import React from 'react';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import type {IllProps} from './People';

const S = STROKE;

/** Building: type (or pose) = office | factory | store. label = company name as typography (never a logo). */
export const Building: React.FC<IllProps> = ({colour, label, type, pose}) => {
  const kind = type || pose || 'office';
  const c = colourOf(colour, C.greyLight);
  if (kind === 'factory') {
    return (
      <svg width={260} height={380} viewBox="0 0 260 380">
        <rect x={196} y={40} width={32} height={110} fill={C.grey} stroke={C.board} strokeWidth={S} />
        <polygon points="10,370 10,170 70,130 70,170 130,130 130,170 190,130 190,170 250,130 250,370" fill={c} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        {[40, 100, 160, 220].map((x) => (
          <rect key={x} x={x - 18} y={210} width={36} height={44} fill={C.paper} stroke={C.board} strokeWidth={S} />
        ))}
        <rect x={100} y={290} width={60} height={80} fill={C.board} />
        {label ? (
          <text x={130} y={280} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={22} fill={C.board} {...(label.length > 14 ? {textLength: 220, lengthAdjust: 'spacingAndGlyphs'} : {})}>{label}</text>
        ) : null}
      </svg>
    );
  }
  if (kind === 'store') {
    return (
      <svg width={260} height={380} viewBox="0 0 260 380">
        <rect x={20} y={120} width={220} height={250} fill={c} stroke={C.board} strokeWidth={S} />
        <rect x={20} y={56} width={220} height={60} fill={C.paper} stroke={C.board} strokeWidth={S} />
        <text x={130} y={97} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} fill={C.board} {...((label || '').length > 12 ? {textLength: 200, lengthAdjust: 'spacingAndGlyphs'} : {})}>{label || 'STORE'}</text>
        {Array.from({length: 8}).map((_, i) => (
          <rect key={i} x={20 + i * 27.5} y={120} width={27.5} height={46} fill={i % 2 ? C.paper : C.stamp} stroke={C.board} strokeWidth={S} />
        ))}
        <rect x={40} y={196} width={110} height={110} fill={C.paper} stroke={C.board} strokeWidth={S} />
        <rect x={170} y={210} width={50} height={160} fill={C.board} />
      </svg>
    );
  }
  return (
    <svg width={260} height={380} viewBox="0 0 260 380">
      <rect x={30} y={30} width={200} height={340} fill={c} stroke={C.board} strokeWidth={S} />
      <rect x={30} y={30} width={200} height={40} fill={C.board} />
      <text x={130} y={58} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} letterSpacing={2} fill={C.paper} {...((label || '').length > 14 ? {textLength: 180, lengthAdjust: 'spacingAndGlyphs'} : {})}>{label || 'HQ'}</text>
      {Array.from({length: 6}).map((_, r) =>
        Array.from({length: 3}).map((__, k) => (
          <rect key={`${r}-${k}`} x={54 + k * 56} y={88 + r * 42} width={40} height={28} fill={C.paper} stroke={C.board} strokeWidth={2} />
        )),
      )}
      <rect x={104} y={330} width={52} height={40} fill={C.board} />
    </svg>
  );
};

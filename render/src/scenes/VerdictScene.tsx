import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, FONT_SIGN, SIGN_FRAMES, SIGN_START, STAMP_IMPACT, STAMP_START, STROKE} from '../constants';
import {clamp, usePortrait, useUnit} from '../components/common';
import {FountainPen} from '../illustrations/Objects';
import type {SceneProps} from '../types';

/** Orange PASSED stamp with ink-grain erosion. */
export const StampMark: React.FC<{size?: number; text?: string}> = ({size = 1, text = 'PASSED'}) => (
  <svg width={620 * size} height={240 * size} viewBox="0 0 620 240">
    <defs>
      <filter id="sop-ink" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={11} result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3 2.2" result="mask" />
        <feComposite in="SourceGraphic" in2="mask" operator="in" />
      </filter>
    </defs>
    <g filter="url(#sop-ink)">
      <rect x="14" y="14" width="592" height="212" rx="18" fill="none" stroke={C.stamp} strokeWidth="14" />
      <rect x="36" y="36" width="548" height="168" rx="10" fill="none" stroke={C.stamp} strokeWidth="4" />
      <text x="310" y="162" textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize="124" fill={C.stamp} textLength="480" lengthAdjust="spacingAndGlyphs">
        {text}
      </text>
    </g>
  </svg>
);

/** Ink-blue "Signed" in Mrs Saint Delafield, revealed left to right by progress (0..1). */
export const SignatureMark: React.FC<{size?: number; progress?: number}> = ({size = 1, progress = 1}) => (
  <div style={{position: 'relative', display: 'inline-block', clipPath: `inset(-40% ${100 - progress * 100}% -40% -5%)`}}>
    <div style={{fontFamily: FONT_SIGN, fontSize: 280 * size, lineHeight: 1.1, color: C.ink, padding: `0 ${40 * size}px`, whiteSpace: 'nowrap'}}>Signed</div>
  </div>
);

const Sheet: React.FC<{w: number; h: number; u: number; children?: React.ReactNode}> = ({w, h, u, children}) => (
  <div style={{position: 'relative', width: w, height: h, background: '#FBFAF7', border: `${STROKE}px solid ${C.board}`, boxShadow: `${16 * u}px ${16 * u}px 0 rgba(20,20,20,0.15)`}}>
    <div style={{position: 'absolute', left: 60 * u, top: 50 * u, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 44 * u, letterSpacing: 6 * u, color: C.board}}>AGREEMENT</div>
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} style={{position: 'absolute', left: 60 * u, top: (130 + i * 40) * u, width: w - (120 + (i % 2) * 140) * u, height: 12 * u, background: C.greyLight}} />
    ))}
    <div style={{position: 'absolute', left: 60 * u, right: 60 * u, bottom: 90 * u, height: STROKE, background: C.board}} />
    <div style={{position: 'absolute', left: 60 * u, bottom: 50 * u, fontFamily: FONT_MONO, fontSize: 24 * u, color: C.grey}}>SIGNATURE</div>
    {children}
  </div>
);

export const VerdictScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const portrait = usePortrait();
  const verdict = (scene.visual || {}).verdict === 'SIGNED' ? 'SIGNED' : 'PASSED';
  const w = portrait ? 920 * u : 1100 * u;
  const h = portrait ? 680 * u : 620 * u;
  const enter = interpolate(frame, [0, 10], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  let shakeX = 0;
  let shakeY = 0;
  if (verdict === 'PASSED' && frame >= STAMP_IMPACT && frame < STAMP_IMPACT + 10) {
    const d = 1 - (frame - STAMP_IMPACT) / 10;
    shakeX = Math.sin(frame * 2.3) * 16 * d * u;
    shakeY = Math.cos(frame * 3.1) * 11 * d * u;
  }
  const label = interpolate(frame, [STAMP_IMPACT + 6, STAMP_IMPACT + 16], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper, justifyContent: 'center', alignItems: 'center', transform: `translate(${shakeX}px, ${shakeY}px)`}}>
      <div style={{transform: `translateY(${(1 - enter) * 60}px)`, opacity: enter}}>
        <Sheet w={w} h={h} u={u}>
          {verdict === 'SIGNED' ? <Signing u={u} frame={frame} /> : <Stamping u={u} frame={frame} />}
        </Sheet>
      </div>
      <div style={{marginTop: 40 * u, fontFamily: FONT_MONO, fontSize: 32 * u, letterSpacing: 8 * u, color: verdict === 'SIGNED' ? C.ink : C.stamp, opacity: label}}>VERDICT: {verdict}</div>
    </AbsoluteFill>
  );
};

const Signing: React.FC<{u: number; frame: number}> = ({u, frame}) => {
  const p = interpolate(frame, [SIGN_START, SIGN_START + SIGN_FRAMES], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const penX = 80 * u + p * 620 * u;
  const penOn = frame >= SIGN_START - 4 && frame <= SIGN_START + SIGN_FRAMES + 6;
  return (
    <>
      <div style={{position: 'absolute', left: 50 * u, bottom: 60 * u}}>
        <SignatureMark size={0.9 * u} progress={p} />
      </div>
      {penOn ? (
        <div style={{position: 'absolute', left: penX, bottom: 120 * u + Math.sin(frame * 1.7) * 18 * u, width: 300, height: 80, transform: `scale(${u})`, transformOrigin: 'left bottom'}}>
          <FountainPen />
        </div>
      ) : null}
    </>
  );
};

const Stamping: React.FC<{u: number; frame: number}> = ({u, frame}) => {
  const s = interpolate(frame, [STAMP_START, STAMP_IMPACT], [1.6, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const o = interpolate(frame, [STAMP_START, STAMP_START + 2], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) rotate(-8deg) scale(${s})`, opacity: o}}>
      <StampMark size={1.15 * u} />
    </div>
  );
};

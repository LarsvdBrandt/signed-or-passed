import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, FONT_SIGN, TRANSITION_FRAMES} from '../constants';
import {clamp, usePortrait, useUnit} from './common';

/**
 * Brand elements recreated from Lars's files in brand/ (see brand/BRAND-ANALYSIS.md):
 * the lockup  Signed (Mrs Saint Delafield, ink) + "or" (IBM Plex Mono, board) + PASSED stamp (Bricolage 800, stamp,
 * rounded outline box, rotated -6 deg), dashed grey rules from the channel banner, and the round profile mark.
 */

export const TAGLINE = 'One decision. Then history happened.';
export const ENDCARD_LINE = 'The business decisions that changed history.';
export const ENDCARD_SUB = 'Would you have signed? · New story every week';

/** Intro sting timing (frames at 30 fps). Must match BRAND_INTRO_SFX in pipeline/common.py. */
export const INTRO_PEN_FRAME = 6; // pen sfx at 0.2 s
export const INTRO_STAMP_IMPACT = 50; // stamp sfx at 1.667 s

/** Orange rounded stamp box with bold type (as on the brand board and thumbnail template). size = font size. */
export const StampBox: React.FC<{size: number; text?: string; colour?: string; rotate?: number}> = ({size, text = 'PASSED', colour = C.stamp, rotate = -6}) => (
  <div style={{display: 'inline-block', transform: `rotate(${rotate}deg)`}}>
    <div
      style={{
        border: `${size * 0.08}px solid ${colour}`,
        borderRadius: size * 0.09,
        padding: `${size * 0.06}px ${size * 0.22}px ${size * 0.03}px`,
        fontFamily: FONT_HEAD,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: size * 0.03,
        lineHeight: 1.05,
        color: colour,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  </div>
);

/** The logo lockup. size = font size of "Signed". Animation params are 0..1 (stamp = scale). */
export const LogoLockup: React.FC<{size: number; sign?: number; or?: number; stamp?: number; stampOpacity?: number; vertical?: boolean}> = ({
  size,
  sign = 1,
  or = 1,
  stamp = 1,
  stampOpacity = 1,
  vertical = false,
}) => (
  <div style={{display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: size * 0.05}}>
    <div style={{clipPath: `inset(-60% ${100 - sign * 100}% -60% -20%)`}}>
      <div style={{fontFamily: FONT_SIGN, fontSize: size, lineHeight: 1.25, color: C.ink, whiteSpace: 'nowrap', padding: `0 ${size * 0.12}px`}}>Signed</div>
    </div>
    <div style={{fontFamily: FONT_MONO, fontSize: size * 0.16, color: C.board, opacity: or, marginTop: vertical ? 0 : size * 0.1}}>or</div>
    <div style={{opacity: stampOpacity, transform: `scale(${stamp})`, marginLeft: vertical ? 0 : size * 0.04}}>
      <StampBox size={size * 0.4} />
    </div>
  </div>
);

/** Dashed grey rule as in the channel banner. progress 0..100 (% of width). */
export const DashedRule: React.FC<{top: string | number; progress?: number; fromRight?: boolean}> = ({top, progress = 100, fromRight}) => {
  const u = useUnit();
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: fromRight ? undefined : 0,
        right: fromRight ? 0 : undefined,
        width: `${progress}%`,
        height: 0,
        borderTop: `${Math.max(2, 3 * u)}px dashed ${C.greyLight}`,
      }}
    />
  );
};

/** 3 s logo sting at the start of every long video: rules draw, Signed writes on (pen), PASSED stamps down. */
export const BrandIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const portrait = usePortrait();
  const size = (portrait ? 200 : 300) * u;
  const rule = interpolate(frame, [0, 16], [0, 100], {...clamp, easing: Easing.out(Easing.cubic)});
  const sign = interpolate(frame, [INTRO_PEN_FRAME, INTRO_PEN_FRAME + 32], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const or = interpolate(frame, [36, 42], [0, 1], clamp);
  const stampS = interpolate(frame, [INTRO_STAMP_IMPACT - 6, INTRO_STAMP_IMPACT], [1.6, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const stampO = interpolate(frame, [INTRO_STAMP_IMPACT - 6, INTRO_STAMP_IMPACT - 4], [0, 1], clamp);
  let sx = 0;
  let sy = 0;
  if (frame >= INTRO_STAMP_IMPACT && frame < INTRO_STAMP_IMPACT + 8) {
    const d = 1 - (frame - INTRO_STAMP_IMPACT) / 8;
    sx = Math.sin(frame * 2.3) * 12 * d * u;
    sy = Math.cos(frame * 3.1) * 8 * d * u;
  }
  const tag = interpolate(frame, [58, 70], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper, justifyContent: 'center', alignItems: 'center', transform: `translate(${sx}px, ${sy}px)`}}>
      <DashedRule top="27%" progress={rule} />
      <DashedRule top="73%" progress={rule} fromRight />
      <LogoLockup size={size} sign={sign} or={or} stamp={stampS} stampOpacity={stampO} vertical={portrait} />
      <div style={{marginTop: 26 * u, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: (portrait ? 50 : 58) * u, color: C.board, opacity: tag, transform: `translateY(${(1 - tag) * 16 * u}px)`, textAlign: 'center'}}>
        {TAGLINE}
      </div>
    </AbsoluteFill>
  );
};

/** End card (last seconds of a long video): lockup + banner lines; leaves room for YouTube end-screen elements. */
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const portrait = usePortrait();
  const a = interpolate(frame, [TRANSITION_FRAMES, TRANSITION_FRAMES + 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const b = interpolate(frame, [TRANSITION_FRAMES + 10, TRANSITION_FRAMES + 24], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center'}}>
      <DashedRule top="12%" />
      <DashedRule top="88%" />
      <div style={{opacity: a, transform: `scale(${0.94 + 0.06 * a})`}}>
        <LogoLockup size={(portrait ? 170 : 210) * u} vertical={portrait} />
      </div>
      <div style={{marginTop: 36 * u, textAlign: 'center', opacity: b, transform: `translateY(${(1 - b) * 14 * u}px)`}}>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 60 * u, color: C.board, lineHeight: 1.05}}>{ENDCARD_LINE}</div>
        <div style={{fontFamily: FONT_MONO, fontSize: 32 * u, color: C.board, marginTop: 20 * u}}>{ENDCARD_SUB}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Small round mark from the profile picture (orange ring + ink S), low opacity. */
export const Watermark: React.FC<{opacity?: number}> = ({opacity = 0.4}) => {
  const u = useUnit();
  const portrait = usePortrait();
  const s = 84 * u;
  const pos: React.CSSProperties = portrait ? {right: 40 * u, top: 60 * u} : {right: 40 * u, bottom: 36 * u};
  return (
    <div style={{position: 'absolute', ...pos, width: s, height: s, opacity, pointerEvents: 'none'}}>
      <svg width={s} height={s} viewBox="0 0 100 100" style={{position: 'absolute', left: 0, top: 0}}>
        <circle cx="50" cy="50" r="45" fill="none" stroke={C.stamp} strokeWidth="6" />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0, width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_SIGN, fontSize: s * 0.8, lineHeight: 1, color: C.ink, paddingTop: s * 0.1, boxSizing: 'border-box'}}>
        S
      </div>
    </div>
  );
};

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

/** Full sting length in frames; a shorter sting (spec.brandIntro.durationSec) is compressed by introTiming. */
export const INTRO_FULL_FRAMES = 90;

/** Key frames of a sting of `frames` length (compressed from the 3 s version; pipeline/common.brand_intro_sfx). */
export const introTiming = (frames = INTRO_FULL_FRAMES) => {
  const k = Math.min(1, Math.max(1, frames) / INTRO_FULL_FRAMES);
  const r = (f: number) => Math.round(f * k);
  return {k, rule: Math.max(2, r(16)), pen: r(INTRO_PEN_FRAME), sign: Math.max(4, r(32)), or0: r(36), or1: Math.max(r(36) + 1, r(42)), impact: r(INTRO_STAMP_IMPACT), drop: Math.max(2, r(6)), tag: frames >= 75};
};

/**
 * Logo sting: rules draw, Signed writes on (pen), PASSED stamps down. 3 s in previews; in videos a short 1.2 s
 * version right after the hook (RETENTION-3, pipeline/common.brand_intro_plan). The tagline only shows from 2.5 s.
 */
export const BrandIntro: React.FC<{frames?: number}> = ({frames = INTRO_FULL_FRAMES}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const portrait = usePortrait();
  const t = introTiming(frames);
  const size = (portrait ? 200 : 300) * u;
  const rule = interpolate(frame, [0, t.rule], [0, 100], {...clamp, easing: Easing.out(Easing.cubic)});
  const sign = interpolate(frame, [t.pen, t.pen + t.sign], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const or = interpolate(frame, [t.or0, t.or1], [0, 1], clamp);
  const stampS = interpolate(frame, [t.impact - t.drop, t.impact], [1.6, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const stampO = interpolate(frame, [t.impact - t.drop, t.impact - t.drop + 2], [0, 1], clamp);
  let sx = 0;
  let sy = 0;
  if (frame >= t.impact && frame < t.impact + 8) {
    const d = 1 - (frame - t.impact) / 8;
    sx = Math.sin(frame * 2.3) * 12 * d * u;
    sy = Math.cos(frame * 3.1) * 8 * d * u;
  }
  const tag = t.tag ? interpolate(frame, [58, 70], [0, 1], clamp) : 0;
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

export type NextTeaser = {title: string; kicker?: string; verdict?: 'SIGNED' | 'PASSED'} | null | undefined;

/** 'Next story' card on the end card (spec.nextTeaser, RETENTION-3): left half, the right half stays free for the
 * YouTube end-screen video element. */
const TeaserCard: React.FC<{teaser: NonNullable<NextTeaser>}> = ({teaser}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const portrait = usePortrait();
  const p = interpolate(frame, [TRANSITION_FRAMES + 8, TRANSITION_FRAMES + 22], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
  const arrow = Math.sin(frame / 5) * 8 * u;
  return (
    <div
      style={{
        position: 'absolute',
        left: portrait ? '8%' : '6%',
        width: portrait ? '84%' : '46%',
        top: portrait ? '52%' : '40%',
        opacity: p,
        transform: `translateX(${(1 - p) * -60 * u}px) rotate(${-1.2 * p}deg)`,
        background: '#ffffff',
        border: `${4 * u}px solid ${C.board}`,
        boxShadow: `${12 * u}px ${12 * u}px 0 ${C.board}`,
        padding: `${30 * u}px ${36 * u}px`,
      }}
    >
      <div style={{fontFamily: FONT_MONO, fontWeight: 700, fontSize: 28 * u, letterSpacing: 4 * u, color: C.stamp}}>
        {(teaser.kicker || 'NEXT STORY').toUpperCase()} <span style={{display: 'inline-block', transform: `translateX(${arrow}px)`}}>→</span>
      </div>
      <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 56 * u, lineHeight: 1.08, color: C.board, marginTop: 14 * u}}>{teaser.title}</div>
      {teaser.verdict ? (
        <div style={{marginTop: 18 * u}}>
          <StampBox size={40 * u} text={teaser.verdict} colour={teaser.verdict === 'SIGNED' ? C.ink : C.stamp} />
        </div>
      ) : null}
    </div>
  );
};

/** End card (last 6 s of a long video): lockup + banner lines, optional 'next story' teaser (spec.nextTeaser);
 * leaves room for YouTube end-screen elements. */
export const EndCard: React.FC<{teaser?: NextTeaser}> = ({teaser}) => {
  const frame = useCurrentFrame();
  const u = useUnit();
  const portrait = usePortrait();
  const a = interpolate(frame, [TRANSITION_FRAMES, TRANSITION_FRAMES + 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const b = interpolate(frame, [TRANSITION_FRAMES + 10, TRANSITION_FRAMES + 24], [0, 1], clamp);
  if (teaser && teaser.title) {
    return (
      <AbsoluteFill style={{backgroundColor: C.paper}}>
        <DashedRule top="8%" />
        <DashedRule top="92%" />
        <div style={{position: 'absolute', top: portrait ? '14%' : '12%', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: a, transform: `scale(${0.94 + 0.06 * a})`}}>
          <LogoLockup size={(portrait ? 140 : 130) * u} vertical={portrait} />
          <div style={{fontFamily: FONT_MONO, fontSize: 28 * u, color: C.board, marginTop: 10 * u, opacity: b}}>{ENDCARD_SUB}</div>
        </div>
        <TeaserCard teaser={teaser} />
      </AbsoluteFill>
    );
  }
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

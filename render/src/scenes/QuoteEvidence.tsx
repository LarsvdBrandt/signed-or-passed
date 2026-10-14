import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE} from '../constants';
import {Kicker, SourceLine, clamp, usePortrait, useUnit} from '../components/common';
import type {SceneProps} from '../types';

export const QuoteScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const v = scene.visual || {};
  const o = interpolate(frame, [4, 16], [0, 1], clamp);
  const tag = spring({frame: Math.max(0, frame - 24), fps, config: {damping: 10}});
  const disputed = v.status === 'disputed';
  return (
    <AbsoluteFill style={{backgroundColor: C.paper, justifyContent: 'center', alignItems: 'center', padding: 140 * u}}>
      <div style={{position: 'relative', maxWidth: 1400 * u, opacity: o}}>
        <div style={{position: 'absolute', left: -110 * u, top: -120 * u, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 260 * u, color: C.ink, lineHeight: 1}}>{'“'}</div>
        <div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 72 * u, lineHeight: 1.15, color: C.board}}>{v.text}</div>
        <div style={{marginTop: 40 * u, fontFamily: FONT_MONO, fontSize: 34 * u, color: C.board, display: 'flex', alignItems: 'center', gap: 16 * u}}>
          <span style={{display: 'inline-block', width: 60 * u, height: 4 * u, background: C.board}} />
          {v.speaker}
        </div>
        {disputed ? (
          <div style={{position: 'absolute', right: -40 * u, top: -90 * u, transform: `rotate(-6deg) scale(${tag})`, border: `${6 * u}px solid ${C.stamp}`, color: C.stamp, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 40 * u, letterSpacing: 6 * u, padding: `${6 * u}px ${18 * u}px`, background: C.paper}}>DISPUTED</div>
        ) : null}
      </div>
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} />
    </AbsoluteFill>
  );
};

export const EvidenceScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const u = useUnit();
  const portrait = usePortrait();
  const v = scene.visual || {};
  const a = ctx.assets ? ctx.assets[v.assetId] : undefined;
  const kb = interpolate(frame, [0, Math.max(1, scene.durationFrames)], [1, 1.12], clamp);
  const drop = spring({frame: Math.max(0, frame - 2), fps, config: {damping: 15}});
  const fw = portrait ? width * 0.8 : width * 0.52;
  const fh = portrait ? height * 0.4 : height * 0.6;
  return (
    <AbsoluteFill style={{backgroundColor: C.greyLight, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{position: 'relative', transform: `translateY(${(1 - drop) * 90}px) rotate(${-2.5 + (1 - drop) * 4}deg)`, opacity: drop, background: '#FBFAF7', border: `${STROKE}px solid ${C.board}`, padding: `${22 * u}px ${22 * u}px ${92 * u}px`, boxShadow: `${14 * u}px ${14 * u}px 0 rgba(20,20,20,0.2)`}}>
        <div style={{width: fw, height: fh, overflow: 'hidden', border: `${STROKE}px solid ${C.board}`, background: C.grey}}>
          {a ? (
            <Img src={staticFile(a.src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb})`, filter: 'grayscale(1) contrast(1.08)'}} />
          ) : (
            <div style={{width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: FONT_MONO, fontSize: 36 * u, color: C.paper}}>IMAGE MISSING</div>
          )}
        </div>
        <div style={{position: 'absolute', left: 24 * u, right: 24 * u, bottom: 26 * u, fontFamily: FONT_MONO, fontSize: 26 * u, color: C.board, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{v.caption}</div>
        <div style={{position: 'absolute', top: -20 * u, left: '50%', width: 170 * u, height: 42 * u, transform: 'translateX(-50%) rotate(-3deg)', background: 'rgba(207,203,194,0.9)', border: `2px solid ${C.board}`}} />
      </div>
      {a ? (
        <div style={{position: 'absolute', right: 40 * u, bottom: 30 * u, maxWidth: '60%', textAlign: 'right', fontFamily: FONT_MONO, fontSize: 18 * u, color: C.board}}>{a.attribution}</div>
      ) : null}
      <Kicker text={scene.onScreenText} />
    </AbsoluteFill>
  );
};

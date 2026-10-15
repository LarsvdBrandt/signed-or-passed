import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_MONO, colourOf} from '../constants';
import {NO_POINTER, NoiseRect, rgba, rnd, smooth1D} from './util';
import type {OverlayProps} from './types';

/** Animated film grain. params: size fine | coarse, animated (true). */
export const FilmGrain: React.FC<OverlayProps> = ({fx}) => {
  const frame = useCurrentFrame();
  const coarse = fx.params.size === 'coarse';
  const seed = fx.params.animated === false ? 1 : (frame % 16) + 1;
  return (
    <AbsoluteFill style={{...NO_POINTER, mixBlendMode: 'overlay', opacity: Math.min(1, 0.45 * fx.intensity)}}>
      <NoiseRect id={`${fx.uid}-grain`} freq={coarse ? '0.5' : '0.95'} octaves={coarse ? 2 : 3} seed={seed} />
    </AbsoluteFill>
  );
};

/** Dark edges as a flat blurred inner shadow. params: colour (brand name or hex, black). */
export const Vignette: React.FC<OverlayProps> = ({fx}) => {
  const {width, height} = useVideoConfig();
  const m = Math.min(width, height);
  const col = colourOf(fx.params.colour, '#000000');
  return (
    <AbsoluteFill
      style={{...NO_POINTER, boxShadow: `inset 0 0 ${Math.round(m * 0.35)}px ${Math.round(m * 0.06)}px ${rgba(col, Math.min(0.9, 0.45 * fx.intensity))}`}}
    />
  );
};

/** Light leaks: flat brand-coloured shapes, heavily blurred, drifting at the frame edges (screen blend). params: colours (array, stamp/paper/ink), speed (1). */
export const LightLeaks: React.FC<OverlayProps> = ({fx}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const list: string[] = Array.isArray(fx.params.colours) && fx.params.colours.length ? fx.params.colours : ['stamp', 'paper', 'ink'];
  const t = (frame / fps) * 0.25 * (Number(fx.params.speed) || 1);
  const big = Math.max(width, height);
  return (
    <AbsoluteFill style={{...NO_POINTER, mixBlendMode: 'screen', opacity: Math.min(1, 0.4 * fx.intensity), overflow: 'hidden'}}>
      {list.slice(0, 4).map((name, i) => {
        const col = colourOf(name, C.stamp);
        const left = rnd(fx.seed, 'side', i) < 0.5;
        const cx = (left ? 0.06 : 0.94) * width + smooth1D(`${fx.seed}:x${i}`, t + i * 3) * width * 0.12;
        const cy = rnd(fx.seed, 'y', i) * height + smooth1D(`${fx.seed}:y${i}`, t + i * 5) * height * 0.15;
        const r = (0.18 + 0.14 * rnd(fx.seed, 'r', i)) * big;
        const o = Math.max(0, 0.55 + 0.45 * smooth1D(`${fx.seed}:o${i}`, t * 2 + i));
        return (
          <div
            key={i}
            style={{position: 'absolute', left: cx - r, top: cy - r * 0.7, width: r * 2, height: r * 1.4, borderRadius: '50%', backgroundColor: col, opacity: o, filter: `blur(${Math.min(120, Math.round(r * 0.3))}px)`}}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Old film overlay: exposure flicker, vertical scratches, dust and hairs, burnt edges. */
export const OldFilmOverlay: React.FC<OverlayProps> = ({fx}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const k = fx.intensity;
  const flick = (rnd(fx.seed, 'f', frame) - 0.5) * 0.1 * k;
  const b = Math.floor(frame / 3);
  const nScr = rnd(fx.seed, 'ns', b) < 0.55 ? 1 + Math.floor(rnd(fx.seed, 'ns2', b) * 2 * k) : 0;
  const nDust = Math.floor(rnd(fx.seed, 'nd', frame) * 5 * k);
  const m = Math.min(width, height);
  return (
    <AbsoluteFill style={NO_POINTER}>
      <AbsoluteFill style={{backgroundColor: flick >= 0 ? '#FFFFFF' : '#000000', opacity: Math.abs(flick)}} />
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0}} aria-hidden>
        {Array.from({length: nScr}, (_, i) => {
          const x = rnd(fx.seed, 'sx', b, i) * width + (frame % 3) * 0.6;
          const y0 = rnd(fx.seed, 'sy', b, i) * height * 0.4;
          const len = height * (0.5 + 0.5 * rnd(fx.seed, 'sl', b, i));
          const light = rnd(fx.seed, 'sc', b, i) < 0.5;
          return (
            <line
              key={`s${i}`}
              x1={x}
              y1={y0}
              x2={x + (rnd(fx.seed, 'sd', b, i) - 0.5) * 20}
              y2={y0 + len}
              stroke={light ? '#FFFFFF' : '#000000'}
              strokeWidth={1 + rnd(fx.seed, 'sw', b, i) * 1.5}
              opacity={0.35 + 0.3 * rnd(fx.seed, 'so', b, i)}
            />
          );
        })}
        {Array.from({length: nDust}, (_, i) => {
          const x = rnd(fx.seed, 'dx', frame, i) * width;
          const y = rnd(fx.seed, 'dy', frame, i) * height;
          if (rnd(fx.seed, 'dh', frame, i) < 0.3) {
            return <path key={`d${i}`} d={`M${x.toFixed(1)} ${y.toFixed(1)} q 8 -10 18 2 t 14 6`} stroke="#000000" strokeWidth={1.2} fill="none" opacity={0.5} />;
          }
          return <circle key={`d${i}`} cx={x} cy={y} r={1 + rnd(fx.seed, 'dr', frame, i) * 3.5} fill={rnd(fx.seed, 'dc', frame, i) < 0.6 ? '#000000' : '#FFFFFF'} opacity={0.55} />;
        })}
      </svg>
      <AbsoluteFill style={{boxShadow: `inset 0 0 ${Math.round(m * 0.3)}px ${Math.round(m * 0.05)}px rgba(0,0,0,${Math.min(0.8, 0.35 * k).toFixed(2)})`}} />
    </AbsoluteFill>
  );
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** VHS overlay: scanlines, rolling tracking band, on-screen display. params: osd (true), label ('PLAY'), counterStartSec (0), trackingSpeed (1). */
export const VhsOverlay: React.FC<OverlayProps> = ({fx}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const k = fx.intensity;
  const s = Math.min(width, height) / 1080;
  const bandH = Math.round(height * 0.06);
  const bandY = ((frame * 5 * (Number(fx.params.trackingSpeed) || 1)) % (height + bandH * 2)) - bandH;
  const secs = Math.floor(frame / fps) + Math.round(Number(fx.params.counterStartSec) || 0);
  const counter = `${Math.floor(secs / 3600)}:${pad2(Math.floor(secs / 60) % 60)}:${pad2(secs % 60)}`;
  const osd = fx.params.osd !== false;
  const text: React.CSSProperties = {position: 'absolute', fontFamily: FONT_MONO, fontSize: Math.round(44 * s), color: '#FFFFFF', letterSpacing: 2, textShadow: `${Math.round(3 * s)}px ${Math.round(3 * s)}px 0 rgba(0,0,0,0.6)`};
  return (
    <AbsoluteFill style={NO_POINTER}>
      <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, 0.22 * k)}} aria-hidden>
        <defs>
          <pattern id={`${fx.uid}-scan`} width={4} height={4} patternUnits="userSpaceOnUse">
            <rect x={0} y={0} width={4} height={1.5} fill="#000000" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#${fx.uid}-scan)`} />
      </svg>
      <div style={{position: 'absolute', left: 0, top: bandY, width, height: bandH, opacity: Math.min(1, 0.35 * k), mixBlendMode: 'screen', overflow: 'hidden'}}>
        <NoiseRect id={`${fx.uid}-band`} freq="0.9 0.02" octaves={1} seed={(frame % 8) + 1} type="turbulence" />
      </div>
      {osd ? (
        <div style={{...text, left: Math.round(60 * s), top: Math.round(50 * s), display: 'flex', alignItems: 'center', gap: Math.round(14 * s)}}>
          <span>{String(fx.params.label ?? 'PLAY')}</span>
          <svg width={Math.round(30 * s)} height={Math.round(34 * s)} viewBox="0 0 30 34" aria-hidden>
            <polygon points="0,0 30,17 0,34" fill="#FFFFFF" />
          </svg>
        </div>
      ) : null}
      {osd ? <div style={{...text, right: Math.round(60 * s), top: Math.round(50 * s)}}>{`SP ${counter}`}</div> : null}
    </AbsoluteFill>
  );
};

/** Paper textures over the scene. params: variant grain | fibre | crumpled | newsprint | kraft | watercolour. */
export const PaperTexture: React.FC<OverlayProps> = ({fx}) => {
  const {width, height} = useVideoConfig();
  const k = fx.intensity;
  const v = String(fx.params.variant || 'grain');
  const seed = 1 + Math.floor(rnd(fx.seed, 'paper') * 90);
  const id = `${fx.uid}-paper`;
  if (v === 'crumpled') {
    return (
      <AbsoluteFill style={{...NO_POINTER, mixBlendMode: 'multiply', opacity: Math.min(1, 0.5 * k)}}>
        <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0}} aria-hidden>
          <defs>
            <filter id={id} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves={4} seed={seed} result="n" />
              <feDiffuseLighting in="n" surfaceScale={6} diffuseConstant={1.15} lightingColor="#FFFFFF">
                <feDistantLight azimuth={225} elevation={60} />
              </feDiffuseLighting>
            </filter>
          </defs>
          <rect width={width} height={height} filter={`url(#${id})`} />
        </svg>
      </AbsoluteFill>
    );
  }
  if (v === 'newsprint') {
    return (
      <AbsoluteFill style={NO_POINTER}>
        <AbsoluteFill style={{backgroundColor: '#E8DFC8', mixBlendMode: 'multiply', opacity: Math.min(1, 0.35 * k)}} />
        <svg width={width} height={height} style={{position: 'absolute', left: 0, top: 0, opacity: Math.min(1, 0.16 * k), mixBlendMode: 'multiply'}} aria-hidden>
          <defs>
            <pattern id={id} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
              <circle cx={4} cy={4} r={1.6} fill={C.board} />
            </pattern>
          </defs>
          <rect width={width} height={height} fill={`url(#${id})`} />
        </svg>
      </AbsoluteFill>
    );
  }
  if (v === 'kraft') {
    return (
      <AbsoluteFill style={NO_POINTER}>
        <AbsoluteFill style={{backgroundColor: '#B98E5A', mixBlendMode: 'multiply', opacity: Math.min(1, 0.28 * k)}} />
        <AbsoluteFill style={{mixBlendMode: 'multiply', opacity: Math.min(1, 0.3 * k)}}>
          <NoiseRect id={id} freq="0.015 0.35" octaves={3} seed={seed} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  const freq = v === 'fibre' ? '0.02 0.4' : v === 'watercolour' ? '0.006' : '0.85';
  const op = v === 'watercolour' ? 0.22 : v === 'fibre' ? 0.3 : 0.25;
  return (
    <AbsoluteFill style={{...NO_POINTER, mixBlendMode: 'multiply', opacity: Math.min(1, op * k)}}>
      <NoiseRect id={id} freq={freq} octaves={v === 'watercolour' ? 4 : 3} seed={seed} />
    </AbsoluteFill>
  );
};

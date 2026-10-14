import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_MONO, STROKE} from '../constants';
import {Kicker, clamp, useUnit} from '../components/common';
import type {SceneProps} from '../types';

// [lonMin, lonMax, latMin, latMax]
const REGIONS: Record<string, [number, number, number, number]> = {
  world: [-180, 180, -58, 82],
  europe: [-25, 45, 33, 72],
  'north-america': [-170, -50, 5, 75],
  'united-states': [-128, -64, 22, 51],
  'south-america': [-92, -30, -57, 15],
  asia: [40, 150, -10, 60],
  africa: [-25, 58, -38, 38],
  oceania: [105, 180, -50, 5],
};

// Deliberately simplified, stylised land shapes [lon, lat].
const LAND: number[][][] = [
  [[-168, 66], [-162, 70], [-140, 70], [-120, 75], [-95, 72], [-80, 73], [-62, 60], [-55, 52], [-66, 44], [-76, 35], [-81, 25], [-90, 29], [-97, 26], [-97, 20], [-87, 15], [-83, 9], [-78, 8], [-92, 15], [-105, 20], [-112, 30], [-118, 34], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 55]],
  [[-50, 60], [-42, 60], [-20, 70], [-20, 80], [-60, 82], [-70, 77], [-55, 70]],
  [[-78, 8], [-60, 10], [-50, 0], [-35, -5], [-38, -15], [-48, -25], [-58, -35], [-65, -42], [-68, -55], [-74, -50], [-72, -30], [-70, -18], [-80, -5], [-80, 2]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [10, 57], [5, 62], [12, 66], [20, 70], [30, 71], [45, 68], [60, 70], [75, 72], [100, 77], [130, 72], [160, 70], [180, 68], [180, 62], [160, 60], [143, 52], [140, 44], [128, 36], [122, 30], [120, 22], [108, 20], [108, 12], [100, 8], [104, 1], [98, 8], [92, 21], [80, 15], [78, 8], [72, 20], [66, 25], [57, 25], [56, 22], [52, 15], [44, 12], [35, 28], [36, 34], [28, 36], [26, 40], [22, 37], [15, 38], [12, 44], [8, 44], [3, 42], [-2, 37]],
  [[-17, 15], [-17, 21], [-10, 30], [-6, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [40, -5], [40, -15], [35, -25], [20, -35], [18, -30], [12, -18], [14, -5], [9, 4], [-5, 5], [-12, 8]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [140, -38], [131, -31], [115, -34]],
  [[-5, 50], [1, 51], [2, 53], [-3, 56], [-5, 58], [-6, 55], [-3, 54], [-5, 52]],
  [[130, 31], [136, 34], [141, 38], [142, 44], [140, 41], [135, 35]],
  [[95, 5], [105, -6], [120, -9], [130, -8], [118, 0], [105, 2]],
  [[44, -25], [50, -15], [49, -12], [44, -17]],
];

type Pin = {lat: number; lon: number; label: string};

const fitPins = (pins: Pin[]): [number, number, number, number] => {
  if (!pins.length) return REGIONS.world;
  const lons = pins.map((p) => p.lon);
  const lats = pins.map((p) => p.lat);
  const pad = 12;
  return [Math.min(...lons) - pad, Math.max(...lons) + pad, Math.min(...lats) - pad, Math.max(...lats) + pad];
};

export const MapScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const u = useUnit();
  const v = scene.visual || {};
  const pins: Pin[] = v.pins || [];
  const [lo0, lo1, la0, la1] = REGIONS[v.region] || fitPins(pins);
  const s = Math.min(width / (lo1 - lo0), height / (la1 - la0)) * 0.94;
  const cx = (lo0 + lo1) / 2;
  const cy = (la0 + la1) / 2;
  const zoom = interpolate(frame, [0, scene.durationFrames], [1.0, 1.06], clamp);
  const P = (lon: number, lat: number): [number, number] => [width / 2 + (lon - cx) * s * zoom, height / 2 - (lat - cy) * s * zoom];
  const land = LAND.map((poly) => poly.map((pt, i) => `${i ? 'L' : 'M'}${P(pt[0], pt[1]).join(' ')}`).join(' ') + ' Z');
  const grid: string[] = [];
  for (let lon = -180; lon <= 180; lon += 30) grid.push(`M${P(lon, -85).join(' ')} L${P(lon, 85).join(' ')}`);
  for (let lat = -60; lat <= 80; lat += 30) grid.push(`M${P(-180, lat).join(' ')} L${P(180, lat).join(' ')}`);
  const find = (ref: string | number): Pin | undefined => (typeof ref === 'number' ? pins[ref] : pins.find((p) => p.label === ref));
  const arrows: Array<{from: string | number; to: string | number}> = v.arrows || [];
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width={width} height={height} style={{position: 'absolute'}}>
        {grid.map((d, i) => (
          <path key={'g' + i} d={d} stroke={C.greyLight} strokeWidth={1.5} fill="none" />
        ))}
        {land.map((d, i) => (
          <path key={'l' + i} d={d} fill={C.greyLight} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        ))}
        {arrows.map((a, i) => {
          const A = find(a.from);
          const B = find(a.to);
          if (!A || !B) return null;
          const [x1, y1] = P(A.lon, A.lat);
          const [x2, y2] = P(B.lon, B.lat);
          const dist = Math.hypot(x2 - x1, y2 - y1);
          const qx = (x1 + x2) / 2;
          const qy = (y1 + y2) / 2 - dist * 0.28;
          const len = dist * 1.25;
          const p = interpolate(frame, [20 + i * 10, 50 + i * 10], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
          const ang = (Math.atan2(y2 - qy, x2 - qx) * 180) / Math.PI;
          return (
            <g key={'a' + i}>
              <path d={`M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}`} fill="none" stroke={C.ink} strokeWidth={7 * u} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
              {p > 0.97 ? <polygon points="0,0 -26,-13 -26,13" fill={C.ink} transform={`translate(${x2} ${y2}) rotate(${ang}) scale(${u})`} /> : null}
            </g>
          );
        })}
      </svg>
      {pins.map((pin, i) => {
        const [x, y] = P(pin.lon, pin.lat);
        const g = spring({frame: Math.max(0, frame - 8 - i * 8), fps, config: {damping: 12}});
        return (
          <div key={'p' + i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${g})`}}>
            <div style={{width: 30 * u, height: 30 * u, borderRadius: '50%', background: C.stamp, border: `${STROKE}px solid ${C.board}`}} />
            <div style={{position: 'absolute', left: 40 * u, top: -12 * u, whiteSpace: 'nowrap', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 30 * u, color: C.board, background: C.paper, border: `${STROKE}px solid ${C.board}`, padding: `${2 * u}px ${10 * u}px`}}>{pin.label}</div>
          </div>
        );
      })}
      <Kicker text={scene.onScreenText} />
    </AbsoluteFill>
  );
};

import React from 'react';
import {C, FONT_MONO, STROKE} from '../constants';
import {c01, fitText} from '../illustrations/kit';

/** Shared drawing parts for mood shots (1920x1080 ShotSvg coordinates). */

export const Floor: React.FC<{y: number; stroke?: string}> = ({y, stroke = C.board}) => <line x1={0} y1={y} x2={1920} y2={y} stroke={stroke} strokeWidth={STROKE} />;

/** Small IBM Plex Mono caption (props.text of most shots), fades in at `at` seconds. */
export const Caption: React.FC<{text?: unknown; t: number; at?: number; y?: number; fill?: string; size?: number}> = ({text, t, at = 0.6, y = 1040, fill = C.board, size = 44}) => {
  if (text === undefined || text === null || text === '') return null;
  const s = String(text);
  return (
    <text x={960} y={y} textAnchor="middle" fontFamily={FONT_MONO} fontSize={size} fill={fill} opacity={c01((t - at) / 0.4)} {...fitText(s, 40, 1600)}>
      {s}
    </text>
  );
};

/** Flat cartoon cloud: outlined blobs, inner outlines hidden by a second fill pass. */
export const Cloud: React.FC<{x: number; y: number; s?: number; fill?: string}> = ({x, y, s = 1, fill = C.grey}) => {
  const blobs: Array<[number, number, number]> = [
    [-150, 20, 70],
    [-60, -30, 95],
    [60, -20, 85],
    [150, 25, 65],
    [0, 40, 80],
  ];
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})`}>
      {blobs.map(([bx, by, r], i) => (
        <circle key={`o${i}`} cx={bx} cy={by} r={r} fill={fill} stroke={C.board} strokeWidth={STROKE * 2} />
      ))}
      {blobs.map(([bx, by, r], i) => (
        <circle key={`i${i}`} cx={bx} cy={by} r={r - STROKE} fill={fill} />
      ))}
    </g>
  );
};

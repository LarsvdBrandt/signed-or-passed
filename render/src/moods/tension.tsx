import React from 'react';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {c01, easeInOut, fitText, frac} from '../illustrations/kit';
import {Figure, PopText, ShotSvg, snap, type ShotProps} from './kit';
import {Caption, Floor} from './parts';

/** Full-frame clock at 11:59: the second hand ticks towards twelve, the frame pulses on every tick. */
export const TickingClockCloseUp: React.FC<ShotProps> = ({t, p}) => {
  const cx = 960;
  const cy = 520;
  const R = 400;
  const start = typeof p.startSec === 'number' ? p.startSec : 50;
  const sec = start + Math.floor(t) + snap(frac(t) / 0.12);
  const hand = (deg: number, len: number, w: number, col: string) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return <line x1={cx} y1={cy} x2={(cx + len * Math.cos(a)).toFixed(1)} y2={(cy + len * Math.sin(a)).toFixed(1)} stroke={col} strokeWidth={w} strokeLinecap="round" />;
  };
  const beat = 1 - c01(frac(t) / 0.25);
  const z = 1 + 0.02 * beat;
  const marks = Array.from({length: 60}, (_, i) => {
    const a = (i * 6 * Math.PI) / 180;
    const big = i % 5 === 0;
    const r0 = big ? R - 60 : R - 30;
    return <line key={i} x1={(cx + r0 * Math.sin(a)).toFixed(1)} y1={(cy - r0 * Math.cos(a)).toFixed(1)} x2={(cx + (R - 12) * Math.sin(a)).toFixed(1)} y2={(cy - (R - 12) * Math.cos(a)).toFixed(1)} stroke={C.board} strokeWidth={big ? 10 : 4} />;
  });
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <g transform={`translate(${cx} ${cy}) scale(${z.toFixed(4)}) translate(${-cx} ${-cy})`}>
        <circle cx={cx} cy={cy} r={R + 30} fill={C.board} />
        <circle cx={cx} cy={cy} r={R} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
        {marks}
        {hand((11 + 59 / 60) * 30, R * 0.5, 22, C.board)}
        {hand((59 + sec / 60) * 6, R * 0.78, 14, C.board)}
        {hand(sec * 6, R * 0.88, 6, colourOf(p.colour, C.stamp))}
        <circle cx={cx} cy={cy} r={18} fill={C.board} />
      </g>
      <text x={1600} y={540} fontFamily={FONT_MONO} fontSize={56} fill={C.board} opacity={beat}>
        {Math.floor(t) % 2 === 0 ? 'TICK' : 'TOCK'}
      </text>
      <rect width={1920} height={1080} fill={C.stamp} opacity={0.1 * beat} />
      <Caption text={p.text} t={t} y={1055} size={40} />
    </ShotSvg>
  );
};

/** ECG wave on a dark monitor; the pulse climbs from bpmFrom to bpmTo. */
const ecg = (f: number): number => {
  if (f < 0.06) return -14 * Math.sin((Math.PI * f) / 0.06);
  if (f < 0.1) return 0;
  if (f < 0.12) return 18 * ((f - 0.1) / 0.02);
  if (f < 0.145) return 18 - 198 * ((f - 0.12) / 0.025);
  if (f < 0.17) return -180 + 230 * ((f - 0.145) / 0.025);
  if (f < 0.19) return 50 - 50 * ((f - 0.17) / 0.02);
  if (f < 0.3) return 0;
  if (f < 0.42) return -30 * Math.sin((Math.PI * (f - 0.3)) / 0.12);
  return 0;
};

export const HeartbeatLine: React.FC<ShotProps> = ({t, dur, p}) => {
  const b0 = typeof p.bpmFrom === 'number' ? p.bpmFrom : 72;
  const b1 = typeof p.bpmTo === 'number' ? p.bpmTo : 150;
  const bpmAt = (tt: number): number => b0 + (b1 - b0) * c01(tt / Math.max(0.5, dur));
  const phase = (tt: number): number => (Math.max(0, tt) * bpmAt(tt)) / 60;
  const yAt = (tt: number): number => 560 + ecg(frac(phase(tt)));
  const speed = 640;
  const sweep = 1920 / speed;
  const start = Math.floor(t / sweep) * sweep;
  const head = (t - start) * speed;
  const cur: string[] = [];
  for (let x = 0; x < head; x += 6) cur.push(`${x},${yAt(start + x / speed).toFixed(1)}`);
  cur.push(`${head.toFixed(1)},${yAt(t).toFixed(1)}`);
  const old: string[] = [];
  if (start > 0) for (let x = Math.ceil((head + 80) / 6) * 6; x <= 1920; x += 6) old.push(`${x},${yAt(start - sweep + x / speed).toFixed(1)}`);
  const hb = 1 + 0.25 * (1 - c01(frac(phase(t)) / 0.2));
  const grid: React.ReactNode[] = [];
  for (let x = 0; x <= 1920; x += 80) grid.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={1080} stroke={C.grey} strokeWidth={1} opacity={0.35} />);
  for (let y = 0; y <= 1080; y += 80) grid.push(<line key={`h${y}`} x1={0} y1={y} x2={1920} y2={y} stroke={C.grey} strokeWidth={1} opacity={0.35} />);
  const col = colourOf(p.colour, C.stamp);
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.board} />
      {grid}
      {old.length > 1 ? <polyline points={old.join(' ')} fill="none" stroke={col} strokeWidth={5} strokeLinejoin="round" opacity={0.3} /> : null}
      <polyline points={cur.join(' ')} fill="none" stroke={col} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={head.toFixed(1)} cy={yAt(t).toFixed(1)} r={12} fill={C.paper} />
      <g transform={`translate(1520 150) scale(${hb.toFixed(3)})`}>
        <path d="M0 30 C -60 -10, -40 -60, 0 -30 C 40 -60, 60 -10, 0 30 Z" fill={col} stroke={C.paper} strokeWidth={3} />
      </g>
      <text x={1600} y={180} fontFamily={FONT_MONO} fontSize={96} fill={C.paper}>
        {Math.round(bpmAt(t))}
      </text>
      <text x={1610} y={225} fontFamily={FONT_MONO} fontSize={32} fill={C.greyLight}>
        BPM
      </text>
      <Caption text={p.text} t={t} y={1000} fill={C.paper} />
    </ShotSvg>
  );
};

/** Dark room, a swinging lamp over a figure at a table; a question pops in. */
export const InterrogationSpotlight: React.FC<ShotProps> = ({t, p}) => {
  const a = 5 * Math.sin(t * 1.3);
  const flick = Math.sin(t * 31) > 0.93 ? 0.55 : 1;
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.board} />
      <g transform={`rotate(${a.toFixed(2)} 960 0)`}>
        <polygon points="960,270 560,1000 1360,1000" fill={C.paper} opacity={0.16 * flick} />
        <line x1={960} y1={0} x2={960} y2={210} stroke={C.grey} strokeWidth={6} />
        <path d="M880 280 L900 210 L1020 210 L1040 280 Z" fill={C.grey} stroke={C.greyLight} strokeWidth={STROKE} strokeLinejoin="round" />
        <ellipse cx={960} cy={282} rx={80} ry={12} fill={C.paper} opacity={flick} />
      </g>
      <ellipse cx={960} cy={1000} rx={420} ry={50} fill={C.paper} opacity={0.12 * flick} />
      <Figure x={960} y={1000} s={1} colour={p.colour || 'grey'} rot={Math.sin(t * 9)} />
      <rect x={620} y={800} width={680} height={30} fill={C.grey} stroke={C.greyLight} strokeWidth={STROKE} />
      <path d="M660 830 L660 1000 M1260 830 L1260 1000" stroke={C.greyLight} strokeWidth={8} />
      <PopText x={960} y={470} text={String(p.text || 'WHERE WERE YOU?')} t={t} at={1.0} size={96} fill={C.stamp} />
    </ShotSvg>
  );
};

/** Slow ominous push-in on a small figure facing a huge document; the frame closes in. */
export const SlowPushIn: React.FC<ShotProps> = ({t, dur, p}) => {
  const k = easeInOut(c01(t / Math.max(1, dur)));
  const z = 1 + 0.45 * k;
  const v = 30 + 150 * k;
  const word = String(p.text || 'THE OFFER');
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <g transform={`translate(1060 520) scale(${z.toFixed(4)}) translate(-1060 -520)`}>
        <Floor y={900} />
        <rect x={760} y={140} width={600} height={760} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
        <rect x={760} y={140} width={600} height={130} fill={colourOf(p.colour, C.ink)} stroke={C.board} strokeWidth={STROKE} />
        <text x={1060} y={230} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={72} fill={C.paper} {...fitText(word, 14, 540)}>
          {word}
        </text>
        {[330, 380, 430, 480, 530, 580, 630].map((y, i) => (
          <line key={y} x1={810} y1={y} x2={i % 3 === 2 ? 1150 : 1310} y2={y} stroke={C.grey} strokeWidth={8} strokeLinecap="round" />
        ))}
        <line x1={820} y1={800} x2={1100} y2={800} stroke={C.board} strokeWidth={4} strokeDasharray="14 10" />
        <Figure x={500} y={900} s={0.8} colour={p.figureColour || 'board'} />
      </g>
      <rect x={0} y={0} width={1920} height={v * 0.6} fill={C.board} />
      <rect x={0} y={1080 - v * 0.6} width={1920} height={v * 0.6} fill={C.board} />
      <rect x={0} y={0} width={v} height={1080} fill={C.board} />
      <rect x={1920 - v} y={0} width={v} height={1080} fill={C.board} />
    </ShotSvg>
  );
};

/** Alarm: hazard stripes, a rotating beacon, a pulsing orange wash and a big ALERT. */
export const RedAlert: React.FC<ShotProps> = ({t, p}) => {
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 3);
  const word = String(p.text || 'ALERT');
  const off = (t * 160) % 120;
  const stripes = (y: number) => (
    <g>
      <rect x={0} y={y} width={1920} height={80} fill={C.stamp} />
      {Array.from({length: 20}, (_, i) => {
        const x = (i - 1) * 120 - off;
        return <polygon key={i} points={`${x},${y} ${x + 60},${y} ${x + 120},${y + 80} ${x + 60},${y + 80}`} fill={C.board} />;
      })}
      <rect x={0} y={y} width={1920} height={80} fill="none" stroke={C.board} strokeWidth={STROKE} />
    </g>
  );
  const w = Math.cos(t * 6);
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect width={1920} height={1080} fill={C.stamp} opacity={0.22 * pulse} />
      <polygon points={`960,380 ${(960 + 900 * w).toFixed(1)},280 ${(960 + 900 * w).toFixed(1)},480`} fill={C.stamp} opacity={0.3} />
      <polygon points={`960,380 ${(960 - 900 * w).toFixed(1)},280 ${(960 - 900 * w).toFixed(1)},480`} fill={C.stamp} opacity={0.3} />
      <path d="M880 400 Q880 300 960 300 Q1040 300 1040 400 Z" fill={C.stamp} stroke={C.board} strokeWidth={STROKE} />
      <rect x={860} y={400} width={200} height={40} fill={C.board} />
      {stripes(0)}
      {stripes(1000)}
      <PopText x={960} y={700} text={word} t={t} at={0.2} size={200} />
      <Caption text={p.sub} t={t} y={900} at={0.6} />
    </ShotSvg>
  );
};

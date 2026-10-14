import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {Smoke, Wheel, c01, easeOut, fitText, frac, useT} from '../illustrations/kit';

/**
 * Era pack: ROARING TWENTIES / GREAT DEPRESSION (c. 1919 - 1939). House style: flat shapes, live STROKE, brand
 * colours only, faceless people, no logos or real brands (stock symbols and names are fictional typography).
 */
export type DecoProps = {colour?: string; label?: string; pose?: string; [k: string]: any};

const ln = (w?: number) => ({
  stroke: C.board,
  strokeWidth: w ?? STROKE,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

/** Art-deco setback tower: tiers that narrow upward plus a spire; windows on a grid, some lit. */
const Tower: React.FC<{x: number; w: number; h: number; fill: string; seed: number}> = ({x, w, h, fill, seed}) => {
  const base = 1000;
  const tiers = [
    [0, 0.55],
    [0.12, 0.25],
    [0.24, 0.12],
  ];
  const parts: React.ReactNode[] = [];
  let top = base;
  tiers.forEach(([inset, frac2], i) => {
    const th = h * frac2;
    const tx = x + w * inset;
    const tw = w * (1 - 2 * inset);
    top -= th;
    parts.push(<rect key={`t${i}`} x={tx} y={top} width={tw} height={th} fill={fill} {...ln(2.5)} />);
    const cols = Math.max(1, Math.floor(tw / 26));
    const rows = Math.max(1, Math.floor(th / 34));
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        const on = (r * 7 + k * 13 + seed * 5) % 5 < 2;
        parts.push(<rect key={`w${i}-${r}-${k}`} x={tx + 8 + k * 26} y={top + 10 + r * 34} width={10} height={16} fill={on ? C.paper : C.board} opacity={on ? 0.9 : 0.5} />);
      }
    }
  });
  const sx = x + w / 2;
  parts.push(<polygon key="spire" points={`${sx - w * 0.1},${top} ${sx + w * 0.1},${top} ${sx},${top - h * 0.12}`} fill={fill} {...ln(2.5)} />);
  return <g>{parts}</g>;
};

/** Night skyline of art-deco towers with sweeping searchlights. */
export const DecoBackdrop: React.FC<DecoProps> = () => {
  const t = useT();
  const towers: Array<[number, number, number, string]> = [
    [60, 200, 520, C.grey],
    [300, 160, 420, C.greyLight],
    [500, 240, 720, C.grey],
    [800, 180, 480, C.greyLight],
    [1020, 260, 820, C.grey],
    [1330, 170, 460, C.greyLight],
    [1540, 220, 640, C.grey],
    [1780, 160, 400, C.greyLight],
  ];
  const beams = [
    [420, -18, 0.6],
    [1250, 14, 0.45],
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.board}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {beams.map(([x, a0, sp], i) => {
          const a = a0 + 22 * Math.sin(t * sp + i);
          return (
            <polygon key={i} points={`${x - 10},1000 ${x + 10},1000 ${x + 90},0 ${x - 90},0`} fill={C.paper} opacity={0.12} transform={`rotate(${a.toFixed(2)} ${x} 1000)`} />
          );
        })}
        {Array.from({length: 30}, (_, i) => (
          <circle key={i} cx={(i * 397) % 1920} cy={(i * 131) % 380 + 30} r={2} fill={C.paper} opacity={0.4 + 0.4 * frac(Math.sin(i * 12.9 + t) * 43.7)} />
        ))}
        <circle cx={1650} cy={150} r={56} fill={C.paper} {...ln()} />
        {towers.map(([x, w, h, f], i) => (
          <Tower key={i} x={x} w={w} h={h} fill={f} seed={i} />
        ))}
        <rect x={-10} y={1000} width={1940} height={90} fill={C.grey} {...ln()} />
      </svg>
    </AbsoluteFill>
  );
};

/** Stock ticker under a glass dome; the paper tape streams fictional quotes. label = custom tape text. */
export const TickerTape: React.FC<DecoProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.ink);
  const tape = label || 'ACME 104 ↓  RAIL 41 ↑  STEEL 77 ↓  RADIO 12 ↓  MOTOR 58 ↓  ';
  const off = (t * 70) % 600;
  return (
    <svg width={420} height={320} viewBox="0 0 420 320">
      <defs>
        <clipPath id="era-ticker-clip">
          <rect x={150} y={196} width={270} height={30} />
        </clipPath>
      </defs>
      <rect x={60} y={286} width={140} height={22} fill={C.grey} {...ln()} />
      <rect x={110} y={210} width={40} height={78} fill={c} {...ln()} />
      <rect x={70} y={150} width={120} height={64} rx={8} fill={c} {...ln()} />
      <circle cx={130} cy={182} r={18} fill={C.greyLight} {...ln(2.5)} />
      <line x1={130} y1={182} x2={130} y2={168} stroke={C.board} strokeWidth={2.5} transform={`rotate(${((t * 400) % 360).toFixed(1)} 130 182)`} />
      <path d="M76 150 Q76 30 130 30 Q184 30 184 150 Z" fill={C.paper} opacity={0.35} {...ln()} />
      <rect x={150} y={196} width={270} height={30} fill={C.paper} {...ln(2.5)} />
      <g clipPath="url(#era-ticker-clip)">
        <text x={160 - off} y={217} fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.board}>
          {tape + tape + tape}
        </text>
      </g>
    </svg>
  );
};

/** Gramophone: turning record, big horn, music notes drifting up. */
export const Gramophone: React.FC<DecoProps> = ({colour}) => {
  const t = useT();
  const horn = colourOf(colour, C.stamp);
  const notes = [0, 1, 2].map((i) => {
    const p = frac(t * 0.4 + i / 3);
    return {x: 300 + p * 80 + 10 * Math.sin((t + i) * 3), y: 90 - p * 80, o: 1 - p};
  });
  const rot = (t * 200) % 360;
  return (
    <svg width={420} height={380} viewBox="0 0 420 380">
      <rect x={40} y={270} width={240} height={90} rx={6} fill={C.grey} {...ln()} />
      <rect x={60} y={290} width={200} height={50} fill="none" stroke={C.board} strokeWidth={2} />
      <ellipse cx={160} cy={262} rx={110} ry={20} fill={C.board} {...ln()} />
      <ellipse cx={160} cy={262} rx={30} ry={6} fill={horn} />
      <line x1={160 + 80 * Math.cos((rot * Math.PI) / 180)} y1={262 + 14 * Math.sin((rot * Math.PI) / 180)} x2={160 + 50 * Math.cos((rot * Math.PI) / 180)} y2={262 + 9 * Math.sin((rot * Math.PI) / 180)} stroke={C.greyLight} strokeWidth={2} />
      <path d="M230 246 L238 200 L210 170" fill="none" {...ln(STROKE * 2)} />
      <path d="M210 170 L250 140 Q290 40 400 30 Q410 120 300 150 Z" fill={horn} {...ln()} />
      <path d="M260 136 Q300 70 380 50" fill="none" stroke={C.board} strokeWidth={1.5} />
      {notes.map((n, i) => (
        <g key={i} opacity={n.o} transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`}>
          <ellipse cx={0} cy={0} rx={8} ry={6} fill={C.board} />
          <line x1={7} y1={0} x2={7} y2={-26} stroke={C.board} strokeWidth={3} />
          <line x1={7} y1={-26} x2={16} y2={-20} stroke={C.board} strokeWidth={3} />
        </g>
      ))}
    </svg>
  );
};

/** Generic 1920s automobile (no make or badge), wheels turning, exhaust puffs. label = number plate. */
export const VintageCar: React.FC<DecoProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.board);
  const bob = 2 * Math.abs(Math.sin(t * 7));
  return (
    <svg width={560} height={300} viewBox="0 0 560 300">
      <Smoke x={30} y={232} t={t} n={4} dx={-30} rise={40} size={12} fill={C.greyLight} speed={1} />
      <g transform={`translate(0 ${(-bob).toFixed(2)})`}>
        <path d="M150 100 L330 100 L340 170 L140 170 Z" fill={body} {...ln()} />
        <rect x={170} y={112} width={70} height={50} fill={C.paper} {...ln(2.5)} />
        <rect x={256} y={112} width={70} height={50} fill={C.paper} {...ln(2.5)} />
        <path d="M60 170 L520 170 L520 230 L60 230 Z" fill={body} {...ln()} />
        <rect x={340} y={150} width={170} height={24} fill={body} {...ln()} />
        {[360, 380, 400, 420, 440, 460, 480].map((x) => (
          <line key={x} x1={x} y1={154} x2={x} y2={170} stroke={C.greyLight} strokeWidth={2} />
        ))}
        <rect x={510} y={150} width={18} height={60} fill={C.greyLight} {...ln(2.5)} />
        <circle cx={500} cy={140} r={14} fill={C.paper} {...ln(2.5)} />
        <path d="M70 230 Q130 170 200 230" fill={C.grey} {...ln()} />
        <path d="M380 230 Q440 170 510 230" fill={C.grey} {...ln()} />
        <rect x={60} y={196} width={460} height={8} fill={C.stamp} />
        {label ? (
          <g>
            <rect x={22} y={190} width={70} height={26} fill={C.paper} {...ln(2.5)} />
            <text x={57} y={208} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.board} {...fitText(label, 7, 60)}>
              {label}
            </text>
          </g>
        ) : null}
      </g>
      <Wheel x={135} y={240} r={48} t={t} speed={420} fill={C.board} />
      <Wheel x={445} y={240} r={48} t={t} speed={420} fill={C.board} />
      <line x1={0} y1={290} x2={560} y2={290} {...ln()} />
    </svg>
  );
};

/** Queue of faceless figures in coats and caps shuffling towards a sign (label, default 'FREE SOUP'). */
export const Breadline: React.FC<DecoProps> = ({colour, label}) => {
  const t = useT();
  const coat = colourOf(colour, C.grey);
  const sign = label || 'FREE SOUP';
  const fills = [coat, C.board, coat, C.greyLight, C.board, coat];
  return (
    <svg width={640} height={360} viewBox="0 0 640 360">
      <rect x={430} y={20} width={190} height={56} fill={C.paper} {...ln()} />
      <text x={525} y={58} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill={C.board} {...fitText(sign, 11, 170)}>
        {sign}
      </text>
      <rect x={520} y={76} width={10} height={60} fill={C.board} />
      {fills.map((f, i) => {
        const x = 470 - i * 82 + 3 * Math.sin(t * 1.6 + i);
        const g = easeOut(c01((t - i * 0.12) / 0.5));
        const sag = 2 * Math.sin(t * 1.1 + i * 0.7);
        return (
          <g key={i} opacity={g} transform={`translate(${x.toFixed(1)} ${(sag + (1 - g) * 30).toFixed(1)})`}>
            <path d="M-30 350 L-34 210 Q-30 170 0 166 Q30 170 34 210 L30 350 Z" fill={f} {...ln()} />
            <line x1={-12} y1={350} x2={-12} y2={290} stroke={C.board} strokeWidth={2} />
            <circle cx={0} cy={140} r={24} fill={C.greyLight} {...ln()} />
            <path d="M-26 134 Q-24 108 2 110 Q28 112 30 132 L40 136 Z" fill={C.board} {...ln(2)} />
          </g>
        );
      })}
      <line x1={0} y1={352} x2={640} y2={352} {...ln()} />
    </svg>
  );
};

/** Cathedral-style radio with pulsing broadcast waves. label = dial text (e.g. a fictional station). */
export const CathedralRadio: React.FC<DecoProps> = ({colour, label}) => {
  const t = useT();
  const wood = colourOf(colour, C.stamp);
  return (
    <svg width={300} height={360} viewBox="0 0 300 360">
      {[0, 1, 2].map((i) => {
        const p = frac(t * 0.7 + i / 3);
        const r = 40 + p * 70;
        return <path key={i} d={`M${150 - r} ${110 - r * 0.3} A ${r} ${r} 0 0 1 ${150 + r} ${110 - r * 0.3}`} fill="none" stroke={C.board} strokeWidth={3} opacity={1 - p} />;
      })}
      <path d="M50 350 L50 170 Q50 90 150 90 Q250 90 250 170 L250 350 Z" fill={wood} {...ln()} />
      <path d="M80 260 L80 180 Q80 124 150 124 Q220 124 220 180 L220 260 Z" fill={C.board} {...ln(2.5)} />
      {[100, 125, 150, 175, 200].map((x) => (
        <line key={x} x1={x} y1={140} x2={x} y2={258} stroke={wood} strokeWidth={4} />
      ))}
      <rect x={90} y={276} width={120} height={26} rx={4} fill={C.paper} {...ln(2.5)} />
      <text x={150} y={294} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={12} fill={C.board} {...fitText(label || '550 kc', 14, 108)}>
        {label || '550 kc'}
      </text>
      <circle cx={100} cy={326} r={11} fill={C.greyLight} {...ln(2.5)} />
      <circle cx={200} cy={326} r={11} fill={C.greyLight} {...ln(2.5)} transform={`rotate(${(20 * Math.sin(t)).toFixed(1)} 200 326)`} />
    </svg>
  );
};

/** Champagne coupe with rising bubbles; pose 'clink' tilts it in a toast. colour = drink. */
export const CocktailGlass: React.FC<DecoProps> = ({colour, pose}) => {
  const t = useT();
  const drink = colourOf(colour, C.greyLight);
  const tilt = pose === 'clink' ? -12 * Math.max(0, Math.sin(t * 2)) : 0;
  return (
    <svg width={220} height={300} viewBox="0 0 220 300">
      <g transform={`rotate(${tilt.toFixed(2)} 110 280)`}>
        <path d="M30 60 Q110 150 190 60 Z" fill={drink} {...ln()} />
        {[0, 1, 2, 3, 4].map((i) => {
          const p = frac(t * 0.8 + i / 5);
          return <circle key={i} cx={70 + i * 20 + 4 * Math.sin(t * 4 + i)} cy={96 - p * 34} r={3.5} fill={C.paper} stroke={C.board} strokeWidth={1.5} opacity={1 - p} />;
        })}
        <ellipse cx={110} cy={60} rx={80} ry={10} fill="none" {...ln()} />
        <line x1={110} y1={104} x2={110} y2={270} {...ln(STROKE * 1.5)} />
        <ellipse cx={110} cy={276} rx={52} ry={10} fill={C.greyLight} {...ln()} />
      </g>
    </svg>
  );
};

/** Newsboy cap (eight-panel, button, short brim). colour = cloth. */
export const NewsboyCap: React.FC<DecoProps> = ({colour}) => {
  const t = useT();
  const cloth = colourOf(colour, C.grey);
  const wob = 3 * Math.exp(-t * 2) * Math.sin(t * 12);
  return (
    <svg width={300} height={200} viewBox="0 0 300 200">
      <g transform={`rotate(${wob.toFixed(2)} 150 160)`}>
        <path d="M40 150 Q30 60 150 50 Q270 56 266 140 Q200 120 150 150 Z" fill={cloth} {...ln()} />
        <path d="M150 50 L150 150 M90 64 L120 150 M210 62 L190 140" fill="none" stroke={C.board} strokeWidth={1.5} />
        <circle cx={150} cy={50} r={9} fill={cloth} {...ln(2.5)} />
        <path d="M40 150 Q100 136 150 150 Q120 186 30 178 Q20 164 40 150 Z" fill={C.board} {...ln()} />
      </g>
    </svg>
  );
};

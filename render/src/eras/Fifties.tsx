import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {Smoke, Wheel, c01, fitText, frac, useT} from '../illustrations/kit';

/**
 * Era pack: 1950s - 60s (post-war boom). House style: flat shapes, live STROKE, brand colours only, faceless,
 * no logos or real brands (all names are fictional typography).
 */
export type FiftiesProps = {colour?: string; label?: string; pose?: string; [k: string]: any};

const ln = (w?: number) => ({
  stroke: C.board,
  strokeWidth: w ?? STROKE,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

/** Diner interior: window band, blinking sign (label, default 'DINER'), counter with stools, checkerboard floor, wall clock. */
export const DinerBackdrop: React.FC<FiftiesProps> = ({label}) => {
  const t = useT();
  const sign = label || 'DINER';
  const on = Math.sin(t * 3) > -0.6;
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let k = 0; k < 24; k++) {
      if ((r + k) % 2 === 0) tiles.push(<rect key={`t${r}-${k}`} x={k * 80} y={760 + r * 80} width={80} height={80} fill={C.board} />);
    }
  }
  const stools = [220, 500, 780, 1060, 1340, 1620];
  const hand = (t * 30) % 360;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {tiles}
        <line x1={0} y1={760} x2={1920} y2={760} {...ln()} />
        <rect x={80} y={170} width={1760} height={250} fill={C.greyLight} {...ln()} />
        {[1, 2, 3, 4].map((i) => (
          <line key={i} x1={80 + i * 352} y1={170} x2={80 + i * 352} y2={420} {...ln()} />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={`b${i}`} x={130 + i * 352} y={300} width={90 + (i % 2) * 60} height={120} fill={C.grey} opacity={0.6} />
        ))}
        <rect x={740} y={36} width={440} height={116} rx={58} fill={C.board} {...ln()} />
        <text x={960} y={116} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={68} fill={on ? C.stamp : C.grey} {...fitText(sign, 9, 380)}>
          {sign}
        </text>
        <circle cx={1760} cy={490} r={48} fill={C.paper} {...ln()} />
        <line x1={1760} y1={490} x2={1760} y2={456} stroke={C.board} strokeWidth={4} transform={`rotate(${hand.toFixed(1)} 1760 490)`} />
        <line x1={1760} y1={490} x2={1784} y2={490} stroke={C.board} strokeWidth={4} />
        {[300, 640, 1180, 1500].map((x) => (
          <g key={`cup${x}`}>
            <rect x={x} y={524} width={34} height={36} fill={C.paper} {...ln(2.5)} />
            <path d={`M${x + 34} 532 Q${x + 50} 542 ${x + 34} 552`} fill="none" {...ln(2.5)} />
          </g>
        ))}
        <rect x={-10} y={560} width={1940} height={36} fill={C.ink} {...ln()} />
        <rect x={-10} y={596} width={1940} height={164} fill={C.greyLight} {...ln()} />
        <rect x={-10} y={640} width={1940} height={14} fill={C.stamp} />
        {stools.map((x) => (
          <g key={`s${x}`}>
            <rect x={x - 8} y={700} width={16} height={150} fill={C.grey} {...ln(2.5)} />
            <ellipse cx={x} cy={856} rx={50} ry={12} fill={C.grey} {...ln(2.5)} />
            <ellipse cx={x} cy={694} rx={58} ry={18} fill={C.stamp} {...ln()} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** Jukebox with cycling arch lights, a spinning record and drifting notes. label = selection panel text. */
export const Jukebox: React.FC<FiftiesProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.stamp);
  const bands = [C.ink, C.paper, C.greyLight];
  const cycle = Math.floor(t * 4) % 3;
  const panel = label || 'A1  B2  C3';
  const notes = [0, 1, 2].map((i) => {
    const p = frac(t * 0.4 + i / 3);
    return {x: 270 + p * 60 + 8 * Math.sin((t + i) * 3), y: 110 - p * 60, o: 1 - p};
  });
  const rot = (t * 200) % 360;
  const ra = (rot * Math.PI) / 180;
  return (
    <svg width={360} height={480} viewBox="0 0 360 480">
      <path d="M30 470 L30 180 Q30 20 180 20 Q330 20 330 180 L330 470 Z" fill={c} {...ln()} />
      <path d="M58 470 L58 186 Q58 50 180 50 Q302 50 302 186 L302 470" fill="none" stroke={bands[cycle]} strokeWidth={12} />
      <path d="M90 250 L90 190 Q90 90 180 90 Q270 90 270 190 L270 250 Z" fill={C.board} {...ln(2.5)} />
      <ellipse cx={180} cy={205} rx={62} ry={16} fill={C.grey} {...ln(2)} />
      <ellipse cx={180} cy={205} rx={14} ry={4} fill={c} />
      <line x1={180 + 50 * Math.cos(ra)} y1={205 + 12 * Math.sin(ra)} x2={180 + 26 * Math.cos(ra)} y2={205 + 6 * Math.sin(ra)} stroke={C.paper} strokeWidth={2} />
      <rect x={90} y={268} width={180} height={40} fill={C.paper} {...ln(2.5)} />
      <text x={180} y={295} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.board} {...fitText(panel, 14, 160)}>
        {panel}
      </text>
      <rect x={90} y={330} width={180} height={110} rx={10} fill={C.greyLight} {...ln(2.5)} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={102} y1={344 + i * 17} x2={258} y2={344 + i * 17} stroke={C.board} strokeWidth={2} />
      ))}
      {notes.map((n, i) => (
        <g key={`n${i}`} opacity={n.o} transform={`translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})`}>
          <ellipse cx={0} cy={0} rx={8} ry={6} fill={C.board} />
          <line x1={7} y1={0} x2={7} y2={-26} stroke={C.board} strokeWidth={3} />
        </g>
      ))}
    </svg>
  );
};

/** Wooden TV set with rabbit ears; the screen shows flat colour bars (or label as a caption) and flickers. */
export const TVSet: React.FC<FiftiesProps> = ({colour, label}) => {
  const t = useT();
  const wood = colourOf(colour, C.grey);
  const flick = 0.85 + 0.15 * frac(Math.sin(t * 37.1) * 91.3);
  const bars = [C.paper, C.greyLight, C.ink, C.stamp, C.grey, C.board];
  const bw = 212 / bars.length;
  return (
    <svg width={400} height={380} viewBox="0 0 400 380">
      <defs>
        <clipPath id="era-tvset-clip">
          <rect x={56} y={134} width={212} height={172} rx={22} />
        </clipPath>
      </defs>
      <line x1={200} y1={92} x2={130} y2={14} {...ln(3)} />
      <line x1={200} y1={92} x2={272} y2={18} {...ln(3)} />
      <circle cx={130} cy={14} r={6} fill={C.board} />
      <circle cx={272} cy={18} r={6} fill={C.board} />
      <ellipse cx={200} cy={96} rx={32} ry={12} fill={C.board} />
      <line x1={70} y1={336} x2={56} y2={376} {...ln()} />
      <line x1={330} y1={336} x2={344} y2={376} {...ln()} />
      <rect x={20} y={100} width={360} height={240} rx={18} fill={wood} {...ln()} />
      <rect x={44} y={122} width={236} height={196} rx={30} fill={C.board} {...ln(2.5)} />
      <g opacity={flick} clipPath="url(#era-tvset-clip)">
        {bars.map((b, i) => (
          <rect key={i} x={56 + i * bw} y={134} width={bw + 0.5} height={172} fill={b} />
        ))}
        {label ? (
          <g>
            <rect x={56} y={250} width={212} height={40} fill={C.board} />
            <text x={162} y={277} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.paper} {...fitText(label, 16, 196)}>
              {label}
            </text>
          </g>
        ) : null}
      </g>
      <circle cx={330} cy={160} r={18} fill={C.greyLight} {...ln(2.5)} />
      <circle cx={330} cy={215} r={18} fill={C.greyLight} {...ln(2.5)} transform={`rotate(${(25 * Math.sin(t)).toFixed(1)} 330 215)`} />
      {[0, 1, 2, 3].map((i) => (
        <line key={`g${i}`} x1={306} y1={258 + i * 14} x2={354} y2={258 + i * 14} stroke={C.board} strokeWidth={2} />
      ))}
    </svg>
  );
};

/** Generic late-50s car with tail fins, chrome stripe and whitewall tyres (no make or badge). label = number plate. */
export const FinCar: React.FC<FiftiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.ink);
  const bob = 2 * Math.abs(Math.sin(t * 6));
  return (
    <svg width={600} height={280} viewBox="0 0 600 280">
      <Smoke x={22} y={206} t={t} n={4} dx={-24} rise={36} size={11} fill={C.greyLight} speed={1} />
      <g transform={`translate(0 ${(-bob).toFixed(2)})`}>
        <path d="M40 210 L40 152 L66 104 L118 140 L210 140 L258 92 L392 92 L440 140 L540 150 Q578 160 572 210 Z" fill={body} {...ln()} />
        <path d="M268 102 L384 102 L420 140 L236 140 Z" fill={C.paper} {...ln(2.5)} />
        <line x1={326} y1={102} x2={326} y2={140} {...ln(2.5)} />
        <rect x={60} y={168} width={500} height={8} fill={C.paper} />
        <rect x={44} y={146} width={14} height={22} fill={C.stamp} {...ln(2)} />
        <circle cx={556} cy={164} r={10} fill={C.paper} {...ln(2)} />
        <rect x={552} y={194} width={40} height={14} rx={6} fill={C.greyLight} {...ln(2)} />
        <rect x={18} y={194} width={40} height={14} rx={6} fill={C.greyLight} {...ln(2)} />
        <path d="M96 210 Q150 150 204 210" fill={C.board} {...ln()} />
        <path d="M406 210 Q460 150 514 210" fill={C.board} {...ln()} />
        {label ? (
          <g>
            <rect x={60} y={182} width={76} height={24} fill={C.paper} {...ln(2.5)} />
            <text x={98} y={199} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={13} fill={C.board} {...fitText(label, 8, 66)}>
              {label}
            </text>
          </g>
        ) : null}
      </g>
      <Wheel x={150} y={222} r={42} t={t} speed={420} fill={C.board} />
      <circle cx={150} cy={222} r={30} fill="none" stroke={C.paper} strokeWidth={7} />
      <Wheel x={460} y={222} r={42} t={t} speed={420} fill={C.board} />
      <circle cx={460} cy={222} r={30} fill="none" stroke={C.paper} strokeWidth={7} />
      <line x1={0} y1={268} x2={600} y2={268} {...ln()} />
    </svg>
  );
};

/** Rotary desk phone. pose 'ring' = shakes with ring marks, 'dial' = the dial turns. */
export const RotaryPhone: React.FC<FiftiesProps> = ({colour, pose}) => {
  const t = useT();
  const c = colourOf(colour, C.board);
  const ringing = pose === 'ring' && Math.sin(t * 3) > 0;
  const shake = ringing ? 4 * Math.sin(t * 50) : 0;
  const dialRot = pose === 'dial' ? 120 * Math.max(0, Math.sin(t * 2)) : 0;
  const holes = Array.from({length: 10}, (_, i) => {
    const a = ((-60 + i * 28) * Math.PI) / 180;
    return {x: 150 + 31 * Math.cos(a), y: 185 + 31 * Math.sin(a)};
  });
  return (
    <svg width={300} height={260} viewBox="0 0 300 260">
      {ringing ? (
        <g>
          <path d="M20 60 L4 44 M20 80 L0 80 M280 60 L296 44 M280 80 L300 80" fill="none" stroke={C.stamp} strokeWidth={4} strokeLinecap="round" />
        </g>
      ) : null}
      <g transform={`rotate(${shake.toFixed(2)} 150 240)`}>
        <path d="M40 246 L72 122 Q150 104 228 122 L260 246 Z" fill={c} {...ln()} />
        <circle cx={150} cy={185} r={46} fill={C.paper} {...ln(2.5)} />
        <g transform={`rotate(${dialRot.toFixed(1)} 150 185)`}>
          {holes.map((h, i) => (
            <circle key={i} cx={h.x} cy={h.y} r={6} fill={C.greyLight} stroke={C.board} strokeWidth={1.5} />
          ))}
        </g>
        <circle cx={150} cy={185} r={12} fill={C.stamp} {...ln(2)} />
        <path d="M30 104 Q28 70 62 70 L238 70 Q272 70 270 104 L236 110 Q222 92 150 92 Q78 92 64 110 Z" fill={c} {...ln()} />
      </g>
    </svg>
  );
};

/** Typewriter: label is typed onto the sheet character by character while the carriage shifts. colour = body. */
export const Typewriter: React.FC<FiftiesProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.ink);
  const text = (label || 'MEMO: SIGN OR PASS?').toUpperCase();
  const typed = Math.floor(t * 12);
  const n = Math.min(text.length, typed);
  const shown = text.slice(0, n);
  const carriage = -((n % 22) * 3);
  const hit = n < text.length ? typed % 30 : -1;
  const keys: React.ReactNode[] = [];
  for (let r = 0; r < 3; r++) {
    for (let k = 0; k < 10; k++) {
      const id = r * 10 + k;
      const down = id === hit;
      keys.push(<circle key={id} cx={92 + k * 25 + r * 10} cy={196 + r * 30 + (down ? 3 : 0)} r={9} fill={down ? C.stamp : C.paper} stroke={C.board} strokeWidth={2} />);
    }
  }
  return (
    <svg width={420} height={320} viewBox="0 0 420 320">
      <g transform={`translate(${carriage} 0)`}>
        <rect x={110} y={10} width={200} height={112} fill={C.paper} {...ln(2.5)} />
        <text x={120} y={40} fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.board}>
          {shown.slice(0, 22)}
        </text>
        <text x={120} y={62} fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.board}>
          {shown.slice(22, 44)}
        </text>
        <rect x={70} y={110} width={290} height={26} rx={13} fill={C.board} {...ln()} />
        <circle cx={62} cy={123} r={14} fill={C.greyLight} {...ln(2.5)} />
      </g>
      <path d="M40 300 L70 140 L350 140 L380 300 Z" fill={c} {...ln()} />
      {keys}
      <rect x={140} y={282} width={140} height={10} rx={5} fill={C.paper} stroke={C.board} strokeWidth={2} />
    </svg>
  );
};

/** Tin toy rocket hovering on a flickering flame, wind-up key turning. label = text on the band. */
export const RocketToy: React.FC<FiftiesProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.stamp);
  const bob = 6 * Math.sin(t * 2.4);
  const flame = 0.7 + 0.3 * Math.abs(Math.sin(t * 18));
  return (
    <svg width={260} height={400} viewBox="0 0 260 400">
      <ellipse cx={130} cy={390} rx={60} ry={6} fill={C.greyLight} />
      <g transform={`translate(0 ${bob.toFixed(2)})`}>
        <path d={`M106 306 L154 306 L130 ${(316 + 50 * flame).toFixed(1)} Z`} fill={C.stamp} {...ln(2)} />
        <path d={`M118 306 L142 306 L130 ${(312 + 26 * flame).toFixed(1)} Z`} fill={C.paper} />
        <path d="M92 240 L48 318 L104 298 Z" fill={C.ink} {...ln()} />
        <path d="M168 240 L212 318 L156 298 Z" fill={C.ink} {...ln()} />
        <line x1={170} y1={200} x2={186} y2={200} {...ln(3)} />
        <g transform={`rotate(${((t * 180) % 360).toFixed(1)} 190 200)`}>
          <rect x={184} y={178} width={12} height={44} rx={6} fill={C.greyLight} {...ln(2)} />
        </g>
        <path d="M130 20 Q192 110 170 308 L90 308 Q68 110 130 20 Z" fill={c} {...ln()} />
        <circle cx={130} cy={150} r={26} fill={C.paper} {...ln(2.5)} />
        <rect x={88} y={226} width={84} height={18} fill={C.paper} {...ln(2)} />
        {label ? (
          <text x={130} y={240} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={12} fill={C.board} {...fitText(label, 9, 76)}>
            {label}
          </text>
        ) : null}
      </g>
    </svg>
  );
};

/** Diner milkshake: whipped cream, bouncing cherry, straw; the level slowly drops. colour = shake. */
export const Milkshake: React.FC<FiftiesProps> = ({colour}) => {
  const t = useT();
  const shake = colourOf(colour, C.stamp);
  const level = 0.35 + 0.65 * (1 - c01((t - 1) / 8));
  const top = 300 - 170 * level;
  const cherry = 6 * Math.abs(Math.sin(t * 4)) * Math.exp(-t * 0.5);
  return (
    <svg width={200} height={340} viewBox="0 0 200 340">
      <defs>
        <clipPath id="era-shake-clip">
          <path d="M44 120 L156 120 L134 300 L66 300 Z" />
        </clipPath>
      </defs>
      <rect x={118} y={24} width={12} height={170} fill={C.paper} stroke={C.board} strokeWidth={2.5} transform="rotate(14 124 110)" />
      <rect x={44} y={top} width={112} height={300 - top} fill={shake} clipPath="url(#era-shake-clip)" />
      <path d="M44 120 L156 120 L134 300 L66 300 Z" fill="none" {...ln()} />
      {level > 0.9 ? (
        <g>
          {[64, 90, 116, 140].map((x) => (
            <circle key={x} cx={x} cy={112} r={18} fill={C.paper} {...ln(2.5)} />
          ))}
          <circle cx={100} cy={78 - cherry} r={13} fill={C.stamp} {...ln(2.5)} />
          <path d={`M100 ${66 - cherry} Q106 ${48 - cherry} 116 ${44 - cherry}`} fill="none" {...ln(2.5)} />
        </g>
      ) : null}
      <rect x={92} y={300} width={16} height={22} fill={C.greyLight} {...ln(2.5)} />
      <ellipse cx={100} cy={326} rx={46} ry={9} fill={C.greyLight} {...ln(2.5)} />
    </svg>
  );
};

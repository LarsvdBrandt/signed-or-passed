import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {Smoke, c01, easeOut, fitText, useT} from '../illustrations/kit';

/**
 * Era pack: INDUSTRIAL AGE (c. 1850 - 1910). House style: flat shapes, live STROKE, brand colours only, no faces,
 * no logos (company names as typography only).
 */
export type IndProps = {colour?: string; label?: string; pose?: string; [k: string]: any};

const ln = (w?: number) => ({
  stroke: C.board,
  strokeWidth: w ?? STROKE,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

/** Spoked wheel rotated by `deg` degrees. */
const Spoked: React.FC<{cx: number; cy: number; r: number; deg: number; spokes?: number; fill?: string; w?: number}> = ({cx, cy, r, deg, spokes = 8, fill = 'none', w}) => {
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < spokes; i++) {
    const an = (i / spokes) * Math.PI * 2;
    lines.push(<line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(an)} y2={cy + r * Math.sin(an)} stroke={C.board} strokeWidth={2} />);
  }
  return (
    <g transform={`rotate(${(deg % 360).toFixed(1)} ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={r} fill={fill} {...ln(w)} />
      {lines}
      <circle cx={cx} cy={cy} r={Math.max(4, r * 0.1)} fill={C.board} />
    </g>
  );
};

const shedPoints = (x: number): string => {
  const p: string[] = [`${x},780`, `${x},720`];
  for (let k = 0; k < 4; k++) {
    p.push(`${x + k * 60 + 60},668`);
    p.push(`${x + k * 60 + 60},720`);
  }
  p.push(`${x + 240},780`);
  return p.join(' ');
};

/** Smokestack skyline: far blocks, sawtooth sheds, brick chimneys with rising smoke, cobbled street. */
export const IndustrialBackdrop: React.FC<IndProps> = () => {
  const t = useT();
  const far: Array<[number, number, number]> = [
    [40, 160, 260],
    [230, 120, 200],
    [600, 180, 300],
    [1020, 140, 240],
    [1280, 200, 280],
    [1600, 150, 220],
  ];
  const chimneys: Array<[number, number]> = [
    [180, 420],
    [560, 330],
    [930, 470],
    [1380, 360],
    [1720, 430],
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {far.map(([x, w, h], i) => (
          <rect key={i} x={x} y={780 - h} width={w} height={h} fill={C.greyLight} {...ln(2.5)} />
        ))}
        {chimneys.map(([x, h], i) => (
          <g key={i}>
            <Smoke x={x + 22} y={780 - h - 6} t={t + i * 0.37} n={5} dx={70} rise={260} size={22} fill={C.greyLight} speed={0.25} />
            <polygon points={`${x},780 ${x + 44},780 ${x + 38},${780 - h} ${x + 6},${780 - h}`} fill={C.stamp} {...ln()} />
            <rect x={x + 2} y={780 - h - 14} width={40} height={16} fill={C.board} />
            {[0.25, 0.5, 0.75].map((k) => (
              <line key={k} x1={x + 4} y1={780 - h * k} x2={x + 40} y2={780 - h * k} stroke={C.board} strokeWidth={1.5} />
            ))}
          </g>
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <polygon key={i} points={shedPoints(i * 250 - 30)} fill={i % 2 ? C.grey : C.greyLight} {...ln()} />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
          [0, 1, 2, 3].map((k) => <rect key={`${i}-${k}`} x={i * 250 - 30 + k * 60 + 52} y={676} width={6} height={42} fill={C.paper} />),
        )}
        <rect x={-10} y={780} width={1940} height={310} fill={C.grey} {...ln()} />
        {Array.from({length: 24}, (_, i) => (
          <line key={i} x1={i * 84} y1={830 + (i % 3) * 60} x2={i * 84 + 50} y2={830 + (i % 3) * 60} stroke={C.board} strokeWidth={2} opacity={0.5} />
        ))}
        <rect x={-10} y={900} width={1940} height={10} fill={C.board} />
        <rect x={-10} y={960} width={1940} height={10} fill={C.board} />
        {Array.from({length: 40}, (_, i) => (
          <rect key={i} x={i * 50} y={896} width={14} height={78} fill={C.greyLight} stroke={C.board} strokeWidth={1.5} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** Stationary steam engine: boiler, piston, connecting rod and a turning flywheel. label = maker's plate. */
export const SteamEngine: React.FC<IndProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.ink);
  const a = t * 4;
  const wx = 410;
  const wy = 200;
  const cr = 40;
  const pinX = wx + cr * Math.cos(a);
  const pinY = wy + cr * Math.sin(a);
  const headX = 300 + cr * Math.cos(a);
  return (
    <svg width={520} height={360} viewBox="0 0 520 360">
      <Smoke x={86} y={66} t={t} n={4} dx={40} rise={60} size={14} fill={C.greyLight} speed={0.8} />
      <rect x={72} y={66} width={28} height={90} fill={C.board} />
      <rect x={30} y={150} width={150} height={172} rx={20} fill={c} {...ln()} />
      {[190, 240, 290].map((y) => (
        <line key={y} x1={30} y1={y} x2={180} y2={y} stroke={C.board} strokeWidth={2} />
      ))}
      <rect x={50} y={260} width={110} height={34} fill={C.paper} {...ln(2.5)} />
      <text x={105} y={283} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.board} {...fitText(label || 'No. 1889', 12, 96)}>
        {label || 'No. 1889'}
      </text>
      <rect x={180} y={178} width={92} height={44} fill={C.greyLight} {...ln()} />
      <line x1={272} y1={200} x2={headX} y2={200} {...ln(STROKE * 2)} />
      <rect x={headX - 14} y={188} width={28} height={24} fill={C.grey} {...ln(2.5)} />
      <polygon points={`${wx - 70},322 ${wx + 70},322 ${wx + 10},${wy} ${wx - 10},${wy}`} fill={C.grey} {...ln()} />
      <Spoked cx={wx} cy={wy} r={96} deg={(a * 180) / Math.PI} spokes={6} w={STROKE * 2} />
      <line x1={headX} y1={200} x2={pinX} y2={pinY} {...ln(STROKE * 2)} />
      <circle cx={pinX} cy={pinY} r={7} fill={C.stamp} {...ln(2)} />
      <rect x={20} y={320} width={480} height={26} fill={C.grey} {...ln()} />
    </svg>
  );
};

const MORSE = [1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0];

/** Telegraph key tapping a morse rhythm; the paper tape prints label (default '... --- ...'). */
export const TelegraphKey: React.FC<IndProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.stamp);
  const down = MORSE[Math.floor(t / 0.11) % MORSE.length] === 1;
  const msg = label || '... --- ...';
  const shown = msg.slice(0, Math.min(msg.length, Math.floor(t * 6)));
  return (
    <svg width={360} height={240} viewBox="0 0 360 240">
      <rect x={30} y={130} width={300} height={40} rx={6} fill={c} {...ln()} />
      <rect x={60} y={110} width={30} height={22} fill={C.grey} {...ln(2.5)} />
      <rect x={250} y={112} width={20} height={20} fill={C.grey} {...ln(2.5)} />
      <g transform={`rotate(${down ? 4 : 0} 75 110)`}>
        <rect x={70} y={96} width={210} height={14} rx={6} fill={C.greyLight} {...ln(2.5)} />
        <ellipse cx={280} cy={92} rx={26} ry={10} fill={C.board} />
      </g>
      {down ? (
        <g>
          <line x1={300} y1={70} x2={318} y2={56} stroke={C.board} strokeWidth={2.5} />
          <line x1={308} y1={80} x2={330} y2={76} stroke={C.board} strokeWidth={2.5} />
        </g>
      ) : null}
      <rect x={10} y={190} width={340} height={34} fill={C.paper} {...ln(2.5)} />
      <text x={22} y={214} fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board} {...fitText(shown, 30, 316)}>
        {shown}
      </text>
    </svg>
  );
};

/** Top hat. pose 'tip' lifts the hat in a greeting loop. colour = band. */
export const TopHat: React.FC<IndProps> = ({colour, pose}) => {
  const t = useT();
  const band = colourOf(colour, C.stamp);
  const lift = pose === 'tip' ? 24 * Math.max(0, Math.sin(t * 2.5)) : 0;
  const wob = 3 * Math.exp(-t * 2) * Math.sin(t * 12);
  return (
    <svg width={260} height={240} viewBox="0 0 260 240">
      <g transform={`translate(0 ${(-lift).toFixed(1)}) rotate(${wob.toFixed(2)} 130 200)`}>
        <ellipse cx={130} cy={200} rx={118} ry={24} fill={C.board} {...ln()} />
        <path d="M70 200 L74 50 Q130 36 186 50 L190 200 Q130 214 70 200 Z" fill={C.board} {...ln()} />
        <ellipse cx={130} cy={50} rx={56} ry={12} fill={C.grey} {...ln(2.5)} />
        <path d="M72 150 Q130 164 188 150 L189 182 Q130 196 71 182 Z" fill={band} {...ln(2.5)} />
      </g>
    </svg>
  );
};

/** Pocket watch on a swinging chain; hands run fast. label = small text on the dial. */
export const PocketWatch: React.FC<IndProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.greyLight);
  const swing = 7 * Math.sin(t * 2.2);
  return (
    <svg width={240} height={320} viewBox="0 0 240 320">
      <g transform={`rotate(${swing.toFixed(2)} 120 4)`}>
        {Array.from({length: 7}, (_, i) => (
          <ellipse key={i} cx={120} cy={8 + i * 11} rx={4} ry={6} fill="none" stroke={C.board} strokeWidth={2} />
        ))}
        <circle cx={120} cy={92} r={10} fill="none" {...ln()} />
        <rect x={110} y={98} width={20} height={16} fill={c} {...ln(2.5)} />
        <circle cx={120} cy={200} r={90} fill={c} {...ln()} />
        <circle cx={120} cy={200} r={74} fill={C.paper} {...ln(2.5)} />
        {Array.from({length: 12}, (_, i) => {
          const an = (i / 12) * Math.PI * 2;
          const r1 = i % 3 === 0 ? 58 : 64;
          return <line key={i} x1={120 + r1 * Math.sin(an)} y1={200 - r1 * Math.cos(an)} x2={120 + 70 * Math.sin(an)} y2={200 - 70 * Math.cos(an)} stroke={C.board} strokeWidth={i % 3 === 0 ? 3 : 1.5} />;
        })}
        {label ? (
          <text x={120} y={240} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={12} fill={C.board} {...fitText(label, 12, 80)}>
            {label}
          </text>
        ) : null}
        <line x1={120} y1={200} x2={120} y2={160} {...ln(4)} transform={`rotate(${((t * 20) % 360).toFixed(1)} 120 200)`} />
        <line x1={120} y1={200} x2={120} y2={144} {...ln(2.5)} transform={`rotate(${((t * 180) % 360).toFixed(1)} 120 200)`} />
        <circle cx={120} cy={200} r={6} fill={C.stamp} {...ln(2)} />
      </g>
    </svg>
  );
};

/** Gas street lamp with a flickering flame. pose 'off' = unlit. */
export const GasLamp: React.FC<IndProps> = ({colour, pose}) => {
  const t = useT();
  const c = colourOf(colour, C.board);
  const lit = pose !== 'off';
  const fl = 14 + 3 * Math.sin(t * 13) + 2 * Math.sin(t * 7.3);
  const glow = 0.18 + 0.06 * Math.sin(t * 9);
  return (
    <svg width={160} height={420} viewBox="0 0 160 420">
      {lit ? <circle cx={80} cy={76} r={74} fill={C.stamp} opacity={glow} /> : null}
      <polygon points="44,40 116,40 104,118 56,118" fill={lit ? C.paper : C.greyLight} {...ln()} />
      {lit ? <ellipse cx={80} cy={96 - fl / 2} rx={8} ry={fl} fill={C.stamp} {...ln(2)} /> : null}
      <line x1={80} y1={40} x2={80} y2={118} stroke={C.board} strokeWidth={1.5} />
      <polygon points="36,42 124,42 80,10" fill={c} {...ln()} />
      <circle cx={80} cy={8} r={6} fill={c} {...ln(2)} />
      <rect x={50} y={116} width={60} height={12} fill={c} {...ln(2.5)} />
      <line x1={36} y1={150} x2={124} y2={150} {...ln()} />
      <rect x={72} y={128} width={16} height={262} fill={c} {...ln()} />
      <path d="M52 410 L60 384 L100 384 L108 410 Z" fill={c} {...ln()} />
    </svg>
  );
};

/** Brick factory gate: the iron gates swing open. label = name on the arch (default 'WORKS'). */
export const FactoryGate: React.FC<IndProps> = ({colour, label}) => {
  const t = useT();
  const brick = colourOf(colour, C.stamp);
  const open = easeOut(c01((t - 0.5) / 1.2));
  const s = Math.max(0.12, 1 - 0.88 * open);
  const bars = (x0: number, n: number) =>
    Array.from({length: n}, (_, i) => <line key={i} x1={x0 + 12 + i * 22} y1={170} x2={x0 + 12 + i * 22} y2={390} stroke={C.board} strokeWidth={4} />);
  const name = label || 'WORKS';
  return (
    <svg width={480} height={400} viewBox="0 0 480 400">
      <path d="M60 150 Q240 40 420 150" fill="none" {...ln(STROKE * 3)} />
      <rect x={150} y={70} width={180} height={40} fill={C.paper} {...ln()} />
      <text x={240} y={99} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={24} fill={C.board} {...fitText(name, 12, 160)}>
        {name}
      </text>
      <g transform={`translate(90 0) scale(${s.toFixed(3)} 1) translate(-90 0)`}>
        <rect x={90} y={170} width={150} height={10} fill={C.board} />
        <rect x={90} y={280} width={150} height={8} fill={C.board} />
        {bars(90, 7)}
      </g>
      <g transform={`translate(390 0) scale(${s.toFixed(3)} 1) translate(-390 0)`}>
        <rect x={240} y={170} width={150} height={10} fill={C.board} />
        <rect x={240} y={280} width={150} height={8} fill={C.board} />
        {bars(240, 7)}
      </g>
      {[20, 390].map((x) => (
        <g key={x}>
          <rect x={x} y={130} width={70} height={264} fill={brick} {...ln()} />
          {[170, 210, 250, 290, 330, 370].map((y) => (
            <line key={y} x1={x} y1={y} x2={x + 70} y2={y} stroke={C.board} strokeWidth={1.5} />
          ))}
          <rect x={x - 8} y={118} width={86} height={16} fill={C.grey} {...ln(2.5)} />
        </g>
      ))}
      <line x1={0} y1={394} x2={480} y2={394} {...ln()} />
    </svg>
  );
};

/** Penny-farthing bicycle rolling in place. */
export const PennyFarthing: React.FC<IndProps> = ({colour}) => {
  const t = useT();
  const c = colourOf(colour, C.stamp);
  const bob = 1.5 * Math.sin(t * 6);
  return (
    <svg width={420} height={390} viewBox="0 0 420 390">
      <g transform={`translate(0 ${bob.toFixed(2)})`}>
        <Spoked cx={150} cy={236} r={140} deg={t * 70} spokes={16} w={STROKE * 2} />
        <Spoked cx={362} cy={338} r={36} deg={t * 270} spokes={6} w={STROKE * 1.5} />
        <path d="M150 236 L176 86 Q300 110 362 338" fill="none" stroke={c} strokeWidth={STROKE * 3} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M150 236 L176 86 Q300 110 362 338" fill="none" stroke={C.board} strokeWidth={1.5} />
        <path d="M196 70 Q216 64 230 74 L222 84 L196 82 Z" fill={C.board} {...ln(2)} />
        <line x1={150} y1={80} x2={196} y2={90} {...ln(STROKE * 1.5)} />
        <line x1={130} y1={74} x2={170} y2={84} {...ln(STROKE * 1.5)} />
      </g>
    </svg>
  );
};

import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, STROKE, colourOf} from '../constants';
import {Wheel, c01, easeOut, fitText, useT} from '../illustrations/kit';

/**
 * Era pack: MEDIEVAL (c. 500 - 1500). House style: flat shapes, live STROKE, brand colours only, no faces,
 * no real heraldry, banners and signs carry plain shapes or typography only.
 */
export type MedProps = {colour?: string; label?: string; pose?: string; [k: string]: any};

const ln = (w?: number) => ({
  stroke: C.board,
  strokeWidth: w ?? STROKE,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

/** A wall or tower top with crenellations. */
const Crenels: React.FC<{x: number; y: number; w: number; n: number; size: number; fill: string}> = ({x, y, w, n, size, fill}) => {
  const step = w / n;
  return (
    <g>
      {Array.from({length: n}, (_, i) =>
        i % 2 === 0 ? <rect key={i} x={x + i * step} y={y - size} width={step} height={size} fill={fill} {...ln()} /> : null,
      )}
    </g>
  );
};

const Flag: React.FC<{x: number; y: number; t: number; colour: string; h?: number}> = ({x, y, t, colour, h = 70}) => {
  const wv = 6 * Math.sin(t * 5);
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - h} {...ln()} />
      <path d={`M${x} ${y - h} Q ${x + 30} ${y - h - 6 + wv} ${x + 60} ${y - h + 8} Q ${x + 30} ${y - h + 22 + wv} ${x} ${y - h + 30} Z`} fill={colour} {...ln()} />
    </g>
  );
};

export const MedievalBackdrop: React.FC<MedProps> = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <path d="M0 760 Q 400 600 900 700 T 1920 660 L1920 1080 L0 1080 Z" fill={C.greyLight} {...ln()} />
        <path d="M900 640 Q 1200 420 1600 600 L1600 760 L900 760 Z" fill={C.greyLight} {...ln()} />
        <g transform="translate(1000 330)">
          <rect x={60} y={160} width={420} height={200} fill={C.paper} {...ln()} />
          <Crenels x={60} y={160} w={420} n={15} size={22} fill={C.paper} />
          {[[0, 80, 120, 280], [440, 80, 120, 280], [210, 0, 120, 360]].map(([x, y, w, h], i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} fill={C.paper} {...ln()} />
              <Crenels x={x - 6} y={y} w={w + 12} n={5} size={22} fill={C.paper} />
              <rect x={x + w / 2 - 8} y={y + 50} width={16} height={34} fill={C.board} />
            </g>
          ))}
          <path d="M230 360 L230 290 Q270 240 310 290 L310 360 Z" fill={C.board} />
          <Flag x={270} y={-22} t={t} colour={C.stamp} />
          <Flag x={60} y={58} t={t + 0.7} colour={C.ink} h={50} />
          <Flag x={500} y={58} t={t + 1.3} colour={C.ink} h={50} />
        </g>
        <path d="M1270 690 Q 1150 820 960 900 L1080 900 Q 1240 830 1310 690 Z" fill={C.paper} {...ln()} />
        {[180, 320, 460, 1700, 1820].map((x, i) => (
          <g key={x} transform={`translate(${x} ${790 - (i % 2) * 20})`}>
            <rect x={-7} y={0} width={14} height={60} fill={C.board} />
            <circle cx={0} cy={-20} r={50 + (i % 3) * 8} fill={C.grey} {...ln()} />
          </g>
        ))}
        <rect x={-10} y={900} width={1940} height={190} fill={C.greyLight} {...ln()} />
      </svg>
    </AbsoluteFill>
  );
};

/** Castle gate; the portcullis rises. label = banner text above the gate. */
export const CastleGate: React.FC<MedProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.greyLight);
  const lift = easeOut(c01((t - 0.4) / 1.4)) * 110;
  return (
    <svg width={420} height={400} viewBox="0 0 420 400">
      <defs>
        <clipPath id="era-gate-arch">
          <path d="M150 390 L150 250 Q210 180 270 250 L270 390 Z" />
        </clipPath>
      </defs>
      <rect x={60} y={140} width={300} height={250} fill={c} {...ln()} />
      <Crenels x={60} y={140} w={300} n={11} size={24} fill={c} />
      {[0, 300].map((x) => (
        <g key={x}>
          <rect x={x} y={70} width={120} height={320} fill={c} {...ln()} />
          <Crenels x={x - 6} y={70} w={132} n={5} size={24} fill={c} />
          <rect x={x + 52} y={130} width={16} height={40} fill={C.board} />
        </g>
      ))}
      <path d="M150 390 L150 250 Q210 180 270 250 L270 390 Z" fill={C.board} />
      <g clipPath="url(#era-gate-arch)">
        <g transform={`translate(0 ${(-lift).toFixed(1)})`}>
          {[165, 190, 215, 240, 265].map((x) => (
            <line key={x} x1={x} y1={200} x2={x} y2={392} stroke={C.grey} strokeWidth={6} />
          ))}
          {[240, 290, 340].map((y) => (
            <line key={y} x1={150} y1={y} x2={270} y2={y} stroke={C.grey} strokeWidth={6} />
          ))}
        </g>
      </g>
      <path d="M150 390 L150 250 Q210 180 270 250 L270 390" fill="none" {...ln()} />
      {label ? (
        <g>
          <rect x={140} y={160} width={140} height={34} fill={C.stamp} {...ln()} />
          <text x={210} y={184} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={20} fill={C.paper} {...fitText(label, 11, 124)}>
            {label}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

/** Market stall with a striped awning and goods. label = sign text. */
export const MarketStall: React.FC<MedProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.stamp);
  const flap = 3 * Math.sin(t * 4);
  return (
    <svg width={420} height={360} viewBox="0 0 420 360">
      <line x1={50} y1={90} x2={50} y2={350} {...ln(STROKE * 2)} />
      <line x1={370} y1={90} x2={370} y2={350} {...ln(STROKE * 2)} />
      <rect x={40} y={220} width={340} height={120} fill={C.grey} {...ln()} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={40} y1={250 + i * 30} x2={380} y2={250 + i * 30} stroke={C.board} strokeWidth={2} opacity={0.5} />
      ))}
      {[[90, 200, C.stamp], [130, 196, C.greyLight], [170, 202, C.stamp], [250, 198, C.ink], [290, 202, C.greyLight], [330, 196, C.ink]].map(([x, y, f], i) => (
        <circle key={i} cx={x as number} cy={y as number} r={20} fill={f as string} {...ln()} />
      ))}
      <path d={`M20 70 L400 70 L410 ${130 + flap} L10 ${130 + flap} Z`} fill={C.paper} {...ln()} />
      {Array.from({length: 8}, (_, i) => {
        const x0 = 10 + i * 50;
        return i % 2 === 0 ? <path key={i} d={`M${x0 + 12} 70 L${x0 + 48} 70 L${x0 + 50} ${130 + flap} L${x0} ${130 + flap} Z`} fill={c} /> : null;
      })}
      <path d={`M20 70 L400 70 L410 ${130 + flap} L10 ${130 + flap} Z`} fill="none" {...ln()} />
      {Array.from({length: 8}, (_, i) => (
        <path key={i} d={`M${10 + i * 50} ${130 + flap} q25 26 50 0`} fill={i % 2 === 0 ? c : C.paper} {...ln()} />
      ))}
      <rect x={120} y={18} width={180} height={44} fill={C.paper} {...ln()} />
      <text x={210} y={48} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={24} fill={C.board} {...fitText(label, 12, 164)}>
        {label || 'MARKET'}
      </text>
    </svg>
  );
};

/** Parchment being written with a quill; ink pot on the side. label = heading. */
export const QuillParchment: React.FC<MedProps> = ({label}) => {
  const t = useT();
  const rows = [120, 150, 180, 210];
  const lens = [180, 200, 160, 120];
  let rem = Math.max(0, t - 0.3) * 170;
  let tip = {x: 70, y: 120};
  const lines = rows.map((y, i) => {
    const d = Math.min(lens[i], rem);
    rem -= d;
    if (d <= 0) return null;
    tip = {x: 70 + d, y};
    return <path key={y} d={`M70 ${y} q ${d / 4} -6 ${d / 2} 0 t ${d / 2} 0`} fill="none" stroke={C.board} strokeWidth={3} strokeLinecap="round" />;
  });
  return (
    <svg width={360} height={300} viewBox="0 0 360 300">
      <path d="M40 30 L290 30 L290 250 Q270 280 240 262 Q210 246 190 266 L40 266 Z" fill={C.paper} {...ln()} />
      <text x={165} y={86} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill={C.board} {...fitText(label, 14, 220)}>
        {label || 'CHARTER'}
      </text>
      {lines}
      <rect x={300} y={222} width={44} height={40} rx={8} fill={C.board} {...ln()} />
      <rect x={310} y={212} width={24} height={12} fill={C.grey} {...ln(2)} />
      <g transform={`translate(${tip.x} ${tip.y}) rotate(-38)`}>
        <path d="M0 0 L8 -14 C30 -40 70 -70 112 -76 C92 -50 56 -24 14 -10 Z" fill={C.greyLight} {...ln(2.5)} />
        <line x1={4} y1={-6} x2={100} y2={-70} stroke={C.board} strokeWidth={2} />
      </g>
    </svg>
  );
};

/** Wax seal pressed onto a ribbon. label = 1-3 letters (never a real coat of arms). */
export const WaxSeal: React.FC<MedProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.stamp);
  const s = 1 + 0.35 * (1 - easeOut(c01(t / 0.35)));
  const blob = Array.from({length: 18}, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = 78 + (i % 3 === 0 ? 8 : i % 2 === 0 ? -4 : 3);
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      <polygon points="80,140 60,214 86,196 104,214 110,140" fill={C.ink} {...ln()} />
      <polygon points="140,140 160,214 134,196 116,214 110,140" fill={C.ink} {...ln()} />
      <g transform={`translate(110 104) scale(${s.toFixed(3)})`}>
        <polygon points={blob} fill={c} {...ln()} />
        <circle cx={0} cy={0} r={56} fill="none" stroke={C.board} strokeWidth={3} opacity={0.6} />
        <text x={0} y={16} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={46} fill={C.board} opacity={0.75} {...fitText(label, 3, 90)}>
          {label || 'S'}
        </text>
      </g>
    </svg>
  );
};

/** Shield with a plain chevron (no real heraldry) and a sword behind it. */
export const SwordShield: React.FC<MedProps> = ({colour}) => {
  const c = colourOf(colour, C.ink);
  return (
    <svg width={300} height={360} viewBox="0 0 300 360">
      <g transform="rotate(-35 150 180)">
        <rect x={142} y={10} width={16} height={260} fill={C.greyLight} {...ln()} />
        <polygon points="142,10 150,-8 158,10" fill={C.greyLight} {...ln()} />
        <rect x={100} y={268} width={100} height={16} fill={C.grey} {...ln()} />
        <rect x={143} y={284} width={14} height={50} fill={C.board} />
        <circle cx={150} cy={342} r={10} fill={C.grey} {...ln()} />
      </g>
      <path d="M60 70 L240 70 L240 170 Q240 270 150 320 Q60 270 60 170 Z" fill={c} {...ln()} />
      <polygon points="60,190 150,120 240,190 240,226 150,156 60,226" fill={C.paper} />
      <path d="M60 70 L240 70 L240 170 Q240 270 150 320 Q60 270 60 170 Z" fill="none" {...ln()} />
    </svg>
  );
};

/** Wooden hand cart with sacks; the wheel turns. */
export const Cart: React.FC<MedProps> = ({colour}) => {
  const t = useT();
  const c = colourOf(colour, C.grey);
  return (
    <svg width={440} height={260} viewBox="0 0 440 260">
      <line x1={330} y1={150} x2={436} y2={120} {...ln(STROKE * 2)} />
      {[[120, 108, C.greyLight], [190, 100, C.paper], [255, 110, C.greyLight]].map(([x, y, f], i) => (
        <g key={i}>
          <path d={`M${x} ${(y as number) + 50} Q ${(x as number) - 34} ${(y as number) + 50} ${(x as number) - 28} ${(y as number) + 10} Q ${(x as number) - 10} ${(y as number) - 24} ${x} ${(y as number) - 30} Q ${(x as number) + 10} ${(y as number) - 24} ${(x as number) + 28} ${(y as number) + 10} Q ${(x as number) + 34} ${(y as number) + 50} ${x} ${(y as number) + 50} Z`} fill={f as string} {...ln()} />
          <line x1={(x as number) - 10} y1={(y as number) - 18} x2={(x as number) + 10} y2={(y as number) - 18} stroke={C.board} strokeWidth={3} />
        </g>
      ))}
      <rect x={60} y={150} width={280} height={44} fill={c} {...ln()} />
      {[110, 170, 230, 290].map((x) => (
        <line key={x} x1={x} y1={150} x2={x} y2={194} stroke={C.board} strokeWidth={2} />
      ))}
      <Wheel x={200} y={204} r={50} t={t} speed={200} fill={C.greyLight} />
    </svg>
  );
};

/** Hanging lantern with a flickering flame and glow. */
export const Lantern: React.FC<MedProps> = ({colour}) => {
  const t = useT();
  const c = colourOf(colour, C.board);
  const fl = 1 + 0.15 * Math.sin(t * 13) + 0.08 * Math.sin(t * 21 + 2);
  const sw = 3 * Math.sin(t * 1.6);
  return (
    <svg width={160} height={300} viewBox="0 0 160 300">
      <g transform={`rotate(${sw.toFixed(2)} 80 10)`}>
        <circle cx={80} cy={24} r={14} fill="none" {...ln()} />
        <circle cx={80} cy={170} r={64 * fl} fill={C.stamp} opacity={0.18} />
        <polygon points="40,90 80,46 120,90" fill={c} {...ln()} />
        <rect x={44} y={90} width={72} height={140} fill={C.paper} {...ln()} />
        <g transform={`translate(80 196) scale(1 ${fl.toFixed(3)})`}>
          <path d="M0 0 C-12 -10 -8 -30 0 -50 C8 -30 12 -10 0 0 Z" fill={C.stamp} {...ln(2)} />
        </g>
        <line x1={80} y1={90} x2={80} y2={230} stroke={C.board} strokeWidth={STROKE} />
        <line x1={44} y1={160} x2={116} y2={160} stroke={C.board} strokeWidth={2} opacity={0.5} />
        <rect x={36} y={230} width={88} height={18} fill={c} {...ln()} />
      </g>
    </svg>
  );
};

/** Guild sign swinging from a wall bracket. label = guild name (typography only). */
export const GuildSign: React.FC<MedProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.ink);
  const sw = 6 * Math.sin(t * 2.2);
  return (
    <svg width={300} height={320} viewBox="0 0 300 320">
      <rect x={8} y={20} width={24} height={280} fill={C.greyLight} {...ln()} />
      <line x1={32} y1={60} x2={270} y2={60} {...ln(STROKE * 2)} />
      <path d="M32 120 Q 120 110 200 60" fill="none" {...ln()} />
      <g transform={`rotate(${sw.toFixed(2)} 160 60)`}>
        <line x1={90} y1={60} x2={90} y2={110} {...ln()} />
        <line x1={230} y1={60} x2={230} y2={110} {...ln()} />
        <rect x={70} y={110} width={180} height={150} rx={10} fill={c} {...ln()} />
        <rect x={84} y={124} width={152} height={122} rx={6} fill="none" stroke={C.paper} strokeWidth={3} />
        <text x={160} y={198} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} fill={C.paper} {...fitText(label, 8, 136)}>
          {label || 'GUILD'}
        </text>
      </g>
    </svg>
  );
};

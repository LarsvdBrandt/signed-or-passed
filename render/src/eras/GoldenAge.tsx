import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {Waves, c01, easeOut, fitText, useT} from '../illustrations/kit';

/**
 * Era pack: AGE OF EXPLORATION / DUTCH GOLDEN AGE (c. 1500 - 1700). House style: flat shapes, live STROKE, brand
 * colours only, no faces, no company logos or real flags (ships carry plain pennants, names as typography only).
 */
export type GoldProps = {colour?: string; label?: string; pose?: string; [k: string]: any};

const ln = (w?: number) => ({
  stroke: C.board,
  strokeWidth: w ?? STROKE,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

/** Gable outline: 'step' (stepped), 'bell' (neck/bell gable) or 'point' (simple triangle). */
const gablePath = (x: number, y: number, w: number, gh: number, kind: string): string => {
  if (kind === 'point') return `M${x} ${y + gh} L${x + w / 2} ${y} L${x + w} ${y + gh} Z`;
  if (kind === 'bell') {
    return `M${x} ${y + gh} Q${x + w * 0.12} ${y + gh * 0.35} ${x + w * 0.3} ${y + gh * 0.3} L${x + w * 0.3} ${y} L${x + w * 0.7} ${y} L${x + w * 0.7} ${y + gh * 0.3} Q${x + w * 0.88} ${y + gh * 0.35} ${x + w} ${y + gh} Z`;
  }
  const n = 3;
  const sw = w / (2 * n + 2);
  const sh = gh / (n + 1);
  const pts: Array<[number, number]> = [[x, y + gh]];
  for (let i = 0; i < n; i++) {
    pts.push([x + i * sw, y + gh - (i + 1) * sh]);
    pts.push([x + (i + 1) * sw, y + gh - (i + 1) * sh]);
  }
  pts.push([x + n * sw, y]);
  pts.push([x + w - n * sw, y]);
  for (let i = n - 1; i >= 0; i--) {
    pts.push([x + w - (i + 1) * sw, y + gh - (i + 1) * sh]);
    pts.push([x + w - i * sw, y + gh - (i + 1) * sh]);
  }
  pts.push([x + w, y + gh]);
  return 'M' + pts.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join(' L') + ' Z';
};

/** One narrow canal house with gable, window grid and door. */
const House: React.FC<{x: number; y: number; w: number; h: number; fill: string; gable: string}> = ({x, y, w, h, fill, gable}) => {
  const gh = Math.min(110, h * 0.3);
  const cols = w >= 140 ? 3 : 2;
  const ww = w * 0.17;
  const bodyTop = y + gh;
  const rows = Math.max(1, Math.floor((h - gh - 80) / 60));
  const wins: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let j = 0; j < cols; j++) {
      const wx = x + (w * (j + 1)) / (cols + 1) - ww / 2;
      const wy = bodyTop + 22 + r * 60;
      wins.push(
        <g key={`${r}-${j}`}>
          <rect x={wx} y={wy} width={ww} height={34} fill={C.paper} {...ln(2.5)} />
          <line x1={wx + ww / 2} y1={wy} x2={wx + ww / 2} y2={wy + 34} stroke={C.board} strokeWidth={1.5} />
          <line x1={wx} y1={wy + 17} x2={wx + ww} y2={wy + 17} stroke={C.board} strokeWidth={1.5} />
        </g>,
      );
    }
  }
  return (
    <g>
      <path d={gablePath(x, y, w, gh, gable)} fill={fill} {...ln()} />
      <rect x={x} y={bodyTop} width={w} height={h - gh} fill={fill} {...ln()} />
      <rect x={x + w / 2 - ww / 2} y={y + gh * 0.45} width={ww} height={gh * 0.4} fill={C.board} />
      {wins}
      <rect x={x + w / 2 - w * 0.12} y={y + h - 56} width={w * 0.24} height={56} fill={C.board} />
    </g>
  );
};

export const GoldenAgeBackdrop: React.FC<GoldProps> = () => {
  const t = useT();
  const widths = [150, 120, 170, 130, 160, 140, 150, 125, 165];
  const heights = [330, 390, 300, 420, 350, 320, 400, 340, 310];
  const gables = ['step', 'bell', 'point', 'step', 'bell', 'step', 'point', 'bell', 'step'];
  const fills = [C.paper, C.greyLight, C.stamp, C.paper, C.grey, C.greyLight, C.paper, C.ink, C.greyLight];
  let cx = 610;
  const houses = widths.map((w, i) => {
    const x = cx;
    cx += w;
    return <House key={i} x={x} y={760 - heights[i]} w={w} h={heights[i]} fill={fills[i]} gable={gables[i]} />;
  });
  const clouds: Array<[number, number]> = [
    [((t * 14) % 2200) - 200, 190],
    [((t * 10 + 1100) % 2200) - 200, 290],
  ];
  const bx = ((t * 60) % 2300) - 200;
  const bob = 2 * Math.sin(t * 2);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {clouds.map(([x, y], i) => (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y})`}>
            <ellipse cx={40} cy={-20} rx={50} ry={30} fill={C.paper} {...ln()} />
            <ellipse cx={0} cy={0} rx={90} ry={30} fill={C.paper} {...ln()} />
          </g>
        ))}
        <path d="M0 720 Q 300 640 640 700 L640 760 L0 760 Z" fill={C.greyLight} {...ln()} />
        <g transform="translate(330 720)">
          <polygon points="-56,0 56,0 32,-210 -32,-210" fill={C.greyLight} {...ln()} />
          <rect x={-14} y={-50} width={28} height={50} fill={C.board} />
          <polygon points="-42,-208 42,-208 0,-250" fill={C.grey} {...ln()} />
          <g transform={`translate(0 -222) rotate(${((t * 35) % 360).toFixed(1)})`}>
            {[0, 90, 180, 270].map((r) => (
              <g key={r} transform={`rotate(${r})`}>
                <line x1={0} y1={0} x2={0} y2={-180} {...ln()} />
                <rect x={4} y={-176} width={30} height={140} fill={C.paper} {...ln(2.5)} />
                <line x1={4} y1={-130} x2={34} y2={-130} stroke={C.board} strokeWidth={1.5} />
                <line x1={4} y1={-84} x2={34} y2={-84} stroke={C.board} strokeWidth={1.5} />
              </g>
            ))}
            <circle r={10} fill={C.board} />
          </g>
        </g>
        {houses}
        <g transform="translate(0 760)">
          <Waves w={1920} y={14} t={t} h={330} />
        </g>
        <rect x={-10} y={754} width={1940} height={18} fill={C.greyLight} {...ln()} />
        <path d="M60 800 L60 742 Q 290 680 520 742 L520 800 L460 800 Q 290 724 120 800 Z" fill={C.greyLight} {...ln()} />
        <g transform={`translate(${bx.toFixed(1)} ${(840 + bob).toFixed(1)})`}>
          <circle cx={56} cy={-8} r={14} fill={C.grey} {...ln(2.5)} />
          <circle cx={84} cy={-8} r={14} fill={C.greyLight} {...ln(2.5)} />
          <path d="M0 0 L140 0 Q130 30 100 34 L30 34 Q8 30 0 0 Z" fill={C.stamp} {...ln()} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Single canal house. pose = step | bell | point (gable type); label = shop sign above the door. */
export const CanalHouse: React.FC<GoldProps> = ({colour, label, pose}) => {
  const c = colourOf(colour, C.greyLight);
  const g = pose === 'bell' || pose === 'point' ? pose : 'step';
  return (
    <svg width={200} height={420} viewBox="0 0 200 420">
      <House x={20} y={8} w={160} h={400} fill={c} gable={g} />
      {label ? (
        <g>
          <rect x={36} y={318} width={128} height={26} fill={C.paper} {...ln(2.5)} />
          <text x={100} y={337} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={16} fill={C.board} {...fitText(label, 12, 116)}>
            {label}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

/** Three-masted merchant ship (fluyt) with billowing sails and a plain pennant. label = name on the hull band. */
export const Fluyt: React.FC<GoldProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.grey);
  const bob = 3 * Math.sin(t * 1.8);
  const roll = 1.2 * Math.sin(t * 1.3);
  const bil = 8 + 4 * Math.sin(t * 2.4);
  const wv = 5 * Math.sin(t * 5);
  const masts: Array<[number, number, number]> = [
    [170, 90, 0.8],
    [300, 40, 1],
    [420, 100, 0.7],
  ];
  const sail = (x: number, y: number, w: number, h: number, k: string) => (
    <path
      key={k}
      d={`M${x - w / 2} ${y} L${x + w / 2} ${y} Q${x + w / 2 + bil} ${y + h / 2} ${x + w / 2} ${y + h} L${x - w / 2} ${y + h} Q${x - w / 2 + bil} ${y + h / 2} ${x - w / 2} ${y} Z`}
      fill={C.paper}
      {...ln()}
    />
  );
  return (
    <svg width={600} height={420} viewBox="0 0 600 420">
      <g transform={`translate(0 ${bob.toFixed(2)}) rotate(${roll.toFixed(2)} 300 330)`}>
        <line x1={60} y1={298} x2={6} y2={252} {...ln(STROKE * 1.5)} />
        <line x1={300} y1={40} x2={60} y2={296} stroke={C.board} strokeWidth={1.5} />
        <line x1={300} y1={40} x2={540} y2={222} stroke={C.board} strokeWidth={1.5} />
        <line x1={300} y1={14} x2={300} y2={40} {...ln()} />
        <path d={`M300 14 Q 330 ${(10 + wv).toFixed(1)} 360 20 Q 330 ${(26 + wv).toFixed(1)} 300 28 Z`} fill={C.stamp} {...ln(2.5)} />
        {masts.map(([x, top, s], i) => (
          <g key={i}>
            <line x1={x} y1={top} x2={x} y2={300} {...ln(STROKE * 2)} />
            {sail(x, top + 20, 110 * s, 70 * s, `a${i}`)}
            {sail(x, top + 30 + 70 * s, 140 * s, 90 * s, `b${i}`)}
          </g>
        ))}
        <path d="M40 296 L460 292 L460 226 L548 216 L552 290 Q536 350 470 362 L140 364 Q72 352 40 296 Z" fill={c} {...ln()} />
        <rect x={480} y={238} width={18} height={20} fill={C.paper} {...ln(2)} />
        <rect x={512} y={236} width={18} height={20} fill={C.paper} {...ln(2)} />
        <rect x={90} y={344} width={400} height={8} fill={C.stamp} />
        <rect x={120} y={308} width={330} height={28} fill={C.paper} {...ln(2.5)} />
        {label ? (
          <text x={285} y={329} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={18} fill={C.board} {...fitText(label, 18, 300)}>
            {label}
          </text>
        ) : (
          Array.from({length: 7}, (_, i) => <circle key={i} cx={150 + i * 45} cy={322} r={6} fill={C.board} />)
        )}
      </g>
      <Waves w={600} y={356} t={t} h={420} />
    </svg>
  );
};

const PETAL = 'M0 0 C-26 -10 -24 -60 0 -78 C24 -60 26 -10 0 0 Z';

/** Tulip in a pot: the stem grows and the flower opens. label = price tag on the pot. */
export const Tulip: React.FC<GoldProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.stamp);
  const g = easeOut(c01(t / 0.7));
  const open = 6 + 16 * easeOut(c01((t - 0.6) / 0.8));
  const sway = 2 * Math.sin(t * 1.5);
  const top = 252 - 150 * g;
  return (
    <svg width={200} height={320} viewBox="0 0 200 320">
      <g transform={`rotate(${sway.toFixed(2)} 100 252)`}>
        <line x1={100} y1={252} x2={100} y2={top} stroke={C.board} strokeWidth={STROKE * 2} strokeLinecap="round" />
        <ellipse cx={84} cy={214} rx={11} ry={34} fill={C.greyLight} {...ln(2.5)} transform="rotate(-24 84 214)" opacity={g} />
        <ellipse cx={116} cy={222} rx={10} ry={28} fill={C.greyLight} {...ln(2.5)} transform="rotate(24 116 222)" opacity={g} />
        <g transform={`translate(100 ${top.toFixed(1)}) scale(${Math.max(0.01, g).toFixed(3)})`}>
          <path d={PETAL} fill={c} {...ln(2.5)} transform={`translate(-10 0) rotate(${(-open).toFixed(2)})`} />
          <path d={PETAL} fill={c} {...ln(2.5)} transform={`translate(10 0) rotate(${open.toFixed(2)})`} />
          <path d={PETAL} fill={c} {...ln(2.5)} />
        </g>
      </g>
      <rect x={52} y={244} width={96} height={18} fill={C.grey} {...ln()} />
      <polygon points="60,262 140,262 130,314 70,314" fill={C.grey} {...ln()} />
      {label ? (
        <g>
          <line x1={136} y1={280} x2={152} y2={286} stroke={C.board} strokeWidth={2} />
          <rect x={150} y={276} width={46} height={22} fill={C.paper} {...ln(2)} />
          <text x={173} y={292} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={12} fill={C.board} {...fitText(label, 6, 40)}>
            {label}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

/** Three open sacks with spice heaps that pile up. label = word on the middle sack. */
export const SpiceSacks: React.FC<GoldProps> = ({colour, label}) => {
  const t = useT();
  const heap = [colourOf(colour, C.stamp), C.board, C.greyLight];
  const sacks: Array<[number, number]> = [
    [90, 150],
    [190, 138],
    [290, 154],
  ];
  return (
    <svg width={380} height={260} viewBox="0 0 380 260">
      {sacks.map(([x, y], i) => {
        const g = easeOut(c01((t - i * 0.15) / 0.5));
        const hh = 8 + 40 * g;
        return (
          <g key={i}>
            <path d={`M${x - 60} 250 Q ${x - 72} 190 ${x - 50} ${y} L ${x + 50} ${y} Q ${x + 72} 190 ${x + 60} 250 Z`} fill={C.greyLight} {...ln()} />
            <path d={`M${x - 46} ${y} Q ${x} ${(y - hh).toFixed(1)} ${x + 46} ${y} Z`} fill={heap[i]} {...ln(2.5)} />
            <ellipse cx={x} cy={y} rx={54} ry={10} fill="none" stroke={C.board} strokeWidth={STROKE} />
            <line x1={x - 40} y1={y + 24} x2={x + 40} y2={y + 24} stroke={C.grey} strokeWidth={2} />
          </g>
        );
      })}
      {label ? (
        <text x={190} y={214} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={22} fill={C.board} {...fitText(label, 8, 90)}>
          {label}
        </text>
      ) : null}
    </svg>
  );
};

/** Desk globe: abstract land masses drift past (no real map), meridian ring and stand. */
export const Globe: React.FC<GoldProps> = ({colour}) => {
  const t = useT();
  const sea = colourOf(colour, C.ink);
  const blobs: Array<[number, number, number, number]> = [
    [0, -40, 40, 26],
    [90, 10, 34, 44],
    [180, -10, 46, 30],
    [270, 40, 30, 22],
    [330, -60, 24, 14],
  ];
  return (
    <svg width={300} height={340} viewBox="0 0 300 340">
      <defs>
        <clipPath id="era-globe-clip">
          <circle cx={150} cy={150} r={110} />
        </clipPath>
      </defs>
      <rect x={140} y={278} width={20} height={24} fill={C.grey} {...ln()} />
      <rect x={100} y={300} width={100} height={20} fill={C.grey} {...ln()} />
      <circle cx={150} cy={150} r={110} fill={sea} {...ln()} />
      <g clipPath="url(#era-globe-clip)">
        {blobs.map(([bx, by, rx, ry], i) => {
          const x = 150 - 200 + ((((bx + t * 40) % 400) + 400) % 400);
          return <ellipse key={i} cx={x} cy={150 + by} rx={rx} ry={ry} fill={C.greyLight} stroke={C.board} strokeWidth={2.5} />;
        })}
        {[-60, -20, 20, 60].map((dy) => (
          <line key={dy} x1={30} y1={150 + dy} x2={270} y2={150 + dy} stroke={C.paper} strokeWidth={1.5} opacity={0.5} />
        ))}
      </g>
      <circle cx={150} cy={150} r={110} fill="none" {...ln()} />
      <path d="M150 20 A 130 130 0 0 1 150 280" fill="none" {...ln(STROKE * 2)} />
      <circle cx={150} cy={20} r={6} fill={C.board} />
      <circle cx={150} cy={280} r={6} fill={C.board} />
    </svg>
  );
};

/** Compass: the needle swings and settles. */
export const Compass: React.FC<GoldProps> = ({colour}) => {
  const t = useT();
  const c = colourOf(colour, C.stamp);
  const a = 50 * Math.exp(-t * 1.2) * Math.cos(t * 5) + 4 * Math.sin(t * 0.9);
  return (
    <svg width={240} height={240} viewBox="0 0 240 240">
      <circle cx={120} cy={120} r={108} fill={C.greyLight} {...ln()} />
      <circle cx={120} cy={120} r={88} fill={C.paper} {...ln()} />
      {Array.from({length: 16}, (_, i) => {
        const ang = (i / 16) * Math.PI * 2;
        const r1 = i % 4 === 0 ? 72 : 78;
        return (
          <line key={i} x1={120 + r1 * Math.sin(ang)} y1={120 - r1 * Math.cos(ang)} x2={120 + 86 * Math.sin(ang)} y2={120 - 86 * Math.cos(ang)} stroke={C.board} strokeWidth={i % 4 === 0 ? 3 : 1.5} />
        );
      })}
      <polygon points="120,56 130,110 184,120 130,130 120,184 110,130 56,120 110,110" fill={C.greyLight} stroke={C.board} strokeWidth={2} strokeLinejoin="round" />
      <text x={120} y={32} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board}>
        N
      </text>
      <g transform={`rotate(${a.toFixed(2)} 120 120)`}>
        <polygon points="120,40 132,120 108,120" fill={c} {...ln(2.5)} />
        <polygon points="120,200 132,120 108,120" fill={C.board} {...ln(2.5)} />
        <circle cx={120} cy={120} r={8} fill={C.paper} {...ln(2.5)} />
      </g>
    </svg>
  );
};

/** Open ledger: figures appear line by line in IBM Plex Mono. label = heading; lines = up to 6 figures (strings). */
export const Ledger: React.FC<GoldProps> = ({colour, label, lines}) => {
  const t = useT();
  const cover = colourOf(colour, C.ink);
  const rows: string[] = Array.isArray(lines) && lines.length ? lines.slice(0, 6).map((v: any) => String(v)) : ['1.200', '350', '4.075', '980', '6.605'];
  return (
    <svg width={400} height={280} viewBox="0 0 400 280">
      <rect x={10} y={30} width={380} height={240} rx={8} fill={cover} {...ln()} />
      <rect x={24} y={20} width={176} height={236} fill={C.paper} {...ln()} />
      <rect x={200} y={20} width={176} height={236} fill={C.paper} {...ln()} />
      <text x={112} y={52} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={20} fill={C.board} {...fitText(label, 12, 150)}>
        {label || 'LEDGER'}
      </text>
      <line x1={300} y1={36} x2={300} y2={244} stroke={C.stamp} strokeWidth={2} />
      {rows.map((v, i) => {
        const o = c01((t - 0.3 - i * 0.25) / 0.2);
        const y = 84 + i * 28;
        return (
          <g key={i} opacity={o}>
            <rect x={40} y={y - 12} width={110 - (i % 3) * 20} height={8} fill={C.greyLight} />
            <text x={362} y={y} textAnchor="end" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board}>
              {v}
            </text>
          </g>
        );
      })}
      <line x1={310} y1={84 + rows.length * 28 - 14} x2={366} y2={84 + rows.length * 28 - 14} stroke={C.board} strokeWidth={2} opacity={c01((t - 0.3 - rows.length * 0.25) / 0.2)} />
    </svg>
  );
};

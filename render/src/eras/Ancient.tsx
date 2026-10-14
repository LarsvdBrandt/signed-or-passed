import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {Waves, Wheel, c01, easeOut, fitText, useT} from '../illustrations/kit';

/**
 * Era pack: ANTIQUITY (Egypt, Greece, Rome). House style: flat shapes, Board outlines (live STROKE, so every theme
 * applies), brand colours only, no faces, no real rulers, no real coins or seals.
 */
export type EraProps = {colour?: string; label?: string; pose?: string; [k: string]: any};

const ln = (w?: number) => ({
  stroke: C.board,
  strokeWidth: w ?? STROKE,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

/** Classical temple front: pediment, entablature (label as typography), columns, steps. */
const Temple: React.FC<{w: number; h: number; cols: number; fill: string; label?: string}> = ({w, h, cols, fill, label}) => {
  const pedH = h * 0.2;
  const entH = h * 0.12;
  const stepH = h * 0.1;
  const colTop = pedH + entH;
  const colBot = h - stepH;
  const inset = w * 0.1;
  const cw = (w - 2 * inset) / (cols * 1.8);
  const xs = Array.from({length: cols}, (_, i) => inset + ((w - 2 * inset - cw) * i) / Math.max(1, cols - 1));
  return (
    <g>
      <polygon points={`${w * 0.04},${pedH} ${w / 2},4 ${w * 0.96},${pedH}`} fill={fill} {...ln()} />
      <polygon points={`${w * 0.2},${pedH - 8} ${w / 2},${pedH * 0.35} ${w * 0.8},${pedH - 8}`} fill={C.greyLight} {...ln(2)} />
      <rect x={w * 0.04} y={pedH} width={w * 0.92} height={entH} fill={C.paper} {...ln()} />
      {label ? (
        <text x={w / 2} y={pedH + entH * 0.72} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={Math.round(entH * 0.62)} letterSpacing={2} fill={C.board} {...fitText(label, 14, w * 0.8)}>
          {label}
        </text>
      ) : null}
      {xs.map((x, i) => (
        <g key={i}>
          <rect x={x} y={colTop} width={cw} height={colBot - colTop} fill={fill} {...ln()} />
          <line x1={x + cw * 0.35} y1={colTop + 10} x2={x + cw * 0.35} y2={colBot - 10} stroke={C.grey} strokeWidth={2} />
          <line x1={x + cw * 0.65} y1={colTop + 10} x2={x + cw * 0.65} y2={colBot - 10} stroke={C.grey} strokeWidth={2} />
          <rect x={x - cw * 0.18} y={colTop} width={cw * 1.36} height={h * 0.035} fill={fill} {...ln()} />
          <rect x={x - cw * 0.18} y={colBot - h * 0.035} width={cw * 1.36} height={h * 0.035} fill={fill} {...ln()} />
        </g>
      ))}
      <rect x={w * 0.02} y={colBot} width={w * 0.96} height={stepH / 2} fill={C.greyLight} {...ln()} />
      <rect x={0} y={colBot + stepH / 2} width={w} height={stepH / 2 - 2} fill={C.greyLight} {...ln()} />
    </g>
  );
};

export const AncientBackdrop: React.FC<EraProps> = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <circle cx={1560} cy={230} r={100} fill={C.stamp} opacity={0.9} {...ln()} />
        <path d="M0 700 Q 320 560 660 660 T 1320 640 T 1920 620 L1920 1080 L0 1080 Z" fill={C.greyLight} {...ln()} />
        <g transform="translate(1180 470)">
          <polygon points="0,230 210,0 420,230" fill={C.greyLight} {...ln()} />
          <polygon points="210,0 420,230 270,230" fill={C.grey} opacity={0.55} />
          <polygon points="0,230 210,0 420,230" fill="none" {...ln()} />
        </g>
        <g transform="translate(1560 560)">
          <polygon points="0,150 130,0 260,150" fill={C.greyLight} {...ln()} />
          <polygon points="130,0 260,150 165,150" fill={C.grey} opacity={0.55} />
          <polygon points="0,150 130,0 260,150" fill="none" {...ln()} />
        </g>
        <g transform="translate(150 380)">
          <Temple w={520} h={330} cols={6} fill={C.paper} />
        </g>
        {[760, 830, 1010].map((x, i) => (
          <g key={x} transform={`translate(${x} 712)`}>
            <rect x={-5} y={-20} width={10} height={24} fill={C.board} />
            <path d={`M0 -14 C-26 -70 -18 -${150 + i * 30} 0 -${210 + i * 30} C18 -${150 + i * 30} 26 -70 0 -14 Z`} fill={C.grey} {...ln()} />
          </g>
        ))}
        <g transform="translate(0 730)">
          <Waves w={1920} y={20} t={t} h={150} />
        </g>
        <rect x={-10} y={870} width={1940} height={220} fill={C.greyLight} {...ln()} />
        {[[120, 930, 90], [520, 960, 60], [1400, 940, 110], [1750, 980, 70]].map(([x, y, w]) => (
          <rect key={x} x={x} y={y} width={w} height={w * 0.4} fill={C.paper} {...ln()} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/** Temple front. label = inscription on the entablature (typography only). */
export const ColumnTemple: React.FC<EraProps> = ({colour, label}) => (
  <svg width={520} height={400} viewBox="0 0 520 400">
    <g transform="translate(10 6)">
      <Temple w={500} h={388} cols={6} fill={colourOf(colour, C.paper)} label={label} />
    </g>
  </svg>
);

export const Pyramid: React.FC<EraProps> = ({colour, label}) => {
  const c = colourOf(colour, C.greyLight);
  const rows = 7;
  return (
    <svg width={480} height={320} viewBox="0 0 480 320">
      <polygon points="20,296 240,24 460,296" fill={c} {...ln()} />
      <polygon points="240,24 460,296 300,296" fill={C.grey} opacity={0.55} />
      {Array.from({length: rows - 1}, (_, i) => {
        const y = 24 + ((i + 1) * 272) / rows;
        const hw = ((y - 24) / 272) * 220;
        return <line key={i} x1={240 - hw} y1={y} x2={240 + hw} y2={y} stroke={C.board} strokeWidth={1.5} opacity={0.35} />;
      })}
      <line x1={240} y1={24} x2={300} y2={296} stroke={C.board} strokeWidth={STROKE} />
      <polygon points="20,296 240,24 460,296" fill="none" {...ln()} />
      <rect x={0} y={296} width={480} height={20} fill={C.greyLight} {...ln()} />
      {label ? (
        <text x={240} y={312} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.board} {...fitText(label, 30, 440)}>
          {label}
        </text>
      ) : null}
    </svg>
  );
};

const AMPH = 'M72 22 L108 22 L104 52 C158 82 166 170 130 238 L114 278 L66 278 L50 238 C14 170 22 82 76 52 Z';

export const Amphora: React.FC<EraProps> = ({colour}) => {
  const c = colourOf(colour, C.stamp);
  return (
    <svg width={180} height={300} viewBox="0 0 180 300">
      <defs>
        <clipPath id="era-amphora-body">
          <path d={AMPH} />
        </clipPath>
      </defs>
      <path d="M78 58 C38 50 34 104 58 116" fill="none" {...ln(STROKE * 2)} />
      <path d="M102 58 C142 50 146 104 122 116" fill="none" {...ln(STROKE * 2)} />
      <path d={AMPH} fill={c} />
      <g clipPath="url(#era-amphora-body)">
        <rect x={0} y={122} width={180} height={30} fill={C.board} />
        {Array.from({length: 9}, (_, i) => (
          <rect key={i} x={14 + i * 18} y={130} width={9} height={9} fill={C.paper} />
        ))}
        <rect x={0} y={200} width={180} height={8} fill={C.board} />
      </g>
      <path d={AMPH} fill="none" {...ln()} />
      <rect x={64} y={278} width={52} height={14} fill={C.board} />
      <rect x={66} y={14} width={48} height={10} fill={c} {...ln()} />
    </svg>
  );
};

/** Unrolling scroll. label = heading written on it. */
export const Scroll: React.FC<EraProps> = ({colour, label}) => {
  const t = useT();
  const p = easeOut(c01(t / 0.9));
  const W = 30 + 270 * p;
  const x0 = 180 - W / 2;
  const roll = colourOf(colour, C.grey);
  return (
    <svg width={360} height={220} viewBox="0 0 360 220">
      <rect x={x0} y={40} width={W} height={140} fill={C.paper} {...ln()} />
      <g opacity={c01((p - 0.6) / 0.4)}>
        {label ? (
          <text x={180} y={80} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={24} fill={C.board} {...fitText(label, 16, 230)}>
            {label}
          </text>
        ) : (
          <line x1={110} y1={72} x2={250} y2={72} stroke={C.board} strokeWidth={4} />
        )}
        {[100, 122, 144, 162].map((y, i) => (
          <line key={y} x1={70} y1={y} x2={i === 3 ? 200 : 290} y2={y} stroke={C.grey} strokeWidth={3} strokeLinecap="round" />
        ))}
      </g>
      {[x0, x0 + W].map((x, i) => (
        <g key={i}>
          <rect x={x - 13} y={26} width={26} height={168} rx={12} fill={roll} {...ln()} />
          <rect x={x - 6} y={14} width={12} height={14} fill={C.board} />
          <rect x={x - 6} y={192} width={12} height={14} fill={C.board} />
        </g>
      ))}
    </svg>
  );
};

/** Laurel wreath that grows leaf by leaf. label = word in the middle (optional). */
export const Laurel: React.FC<EraProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.greyLight);
  const cx = 150;
  const cy = 136;
  const r = 100;
  const N = 9;
  const pt = (deg: number) => ({x: cx + r * Math.cos((deg * Math.PI) / 180), y: cy + r * Math.sin((deg * Math.PI) / 180)});
  const a0 = pt(100);
  const a1 = pt(100 + (N - 1) * 16);
  const leaves: React.ReactNode[] = [];
  for (let side = 0; side < 2; side++) {
    for (let k = 0; k < N; k++) {
      const deg = 100 + k * 16;
      const p = pt(deg);
      let x = p.x;
      let rot = deg + 90 + 35;
      if (side === 1) {
        x = 300 - x;
        rot = 180 - rot;
      }
      const g = easeOut(c01((t - k * 0.06) / 0.3));
      leaves.push(
        <ellipse key={`${side}-${k}`} cx={0} cy={0} rx={24} ry={9} fill={c} {...ln(2.5)} transform={`translate(${x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${g.toFixed(3)})`} />,
      );
    }
  }
  return (
    <svg width={300} height={260} viewBox="0 0 300 260">
      <path d={`M${a0.x.toFixed(1)} ${a0.y.toFixed(1)} A ${r} ${r} 0 0 1 ${a1.x.toFixed(1)} ${a1.y.toFixed(1)}`} fill="none" {...ln()} />
      <path d={`M${(300 - a0.x).toFixed(1)} ${a0.y.toFixed(1)} A ${r} ${r} 0 0 0 ${(300 - a1.x).toFixed(1)} ${a1.y.toFixed(1)}`} fill="none" {...ln()} />
      {leaves}
      <polygon points="150,236 122,252 126,226" fill={C.stamp} {...ln(2.5)} />
      <polygon points="150,236 178,252 174,226" fill={C.stamp} {...ln(2.5)} />
      <circle cx={150} cy={236} r={7} fill={C.stamp} {...ln(2.5)} />
      {label ? (
        <text x={150} y={146} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} fill={C.board} {...fitText(label, 8, 150)}>
          {label}
        </text>
      ) : null}
    </svg>
  );
};

/** Clay oil lamp with a flickering flame. */
export const OilLamp: React.FC<EraProps> = ({colour}) => {
  const t = useT();
  const c = colourOf(colour, C.greyLight);
  const fl = 1 + 0.14 * Math.sin(t * 14) + 0.07 * Math.sin(t * 23 + 1);
  const sway = 4 * Math.sin(t * 9);
  return (
    <svg width={260} height={180} viewBox="0 0 260 180">
      <path d="M36 112 C4 100 4 146 40 138" fill="none" {...ln(STROKE * 2)} />
      <path d="M186 106 L238 98 Q252 110 238 124 L186 134 Z" fill={c} {...ln()} />
      <ellipse cx={116} cy={122} rx={88} ry={38} fill={c} {...ln()} />
      <ellipse cx={116} cy={110} rx={40} ry={12} fill={C.board} />
      <ellipse cx={116} cy={110} rx={22} ry={6} fill={C.grey} />
      <rect x={86} y={156} width={60} height={12} fill={C.board} />
      <g transform={`translate(244 100) rotate(${sway.toFixed(2)}) scale(1 ${fl.toFixed(3)})`}>
        <path d="M0 0 C-14 -12 -10 -34 0 -58 C10 -34 14 -12 0 0 Z" fill={C.stamp} {...ln(2.5)} />
        <path d="M0 -4 C-6 -12 -4 -24 0 -34 C4 -24 6 -12 0 -4 Z" fill={C.paper} />
      </g>
    </svg>
  );
};

/** Spinning ancient coin. label = 1-4 letters struck on it (never a real ruler or a real coin design). */
export const AncientCoin: React.FC<EraProps> = ({colour, label}) => {
  const t = useT();
  const sx = Math.max(0.06, Math.abs(Math.cos(t * 2.2)));
  const c = colourOf(colour, C.greyLight);
  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      <g transform={`translate(110 110) scale(${sx.toFixed(3)} 1)`}>
        <circle cx={0} cy={0} r={98} fill={c} {...ln()} />
        <circle cx={0} cy={0} r={78} fill="none" stroke={C.grey} strokeWidth={3} />
        {Array.from({length: 28}, (_, i) => {
          const a = (i / 28) * Math.PI * 2;
          return <circle key={i} cx={88 * Math.cos(a)} cy={88 * Math.sin(a)} r={3} fill={C.board} />;
        })}
        <text x={0} y={18} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={56} fill={C.board} {...fitText(label, 4, 130)}>
          {label || 'AV'}
        </text>
        <line x1={-46} y1={38} x2={46} y2={38} stroke={C.board} strokeWidth={3} />
      </g>
    </svg>
  );
};

/** Wax tablet: a stylus scratches lines into dark wax. */
export const WaxTablet: React.FC<EraProps> = ({colour}) => {
  const t = useT();
  const frame = colourOf(colour, C.grey);
  const rows = [74, 104, 134, 164];
  const lens = [170, 150, 176, 110];
  let rem = Math.max(0, t - 0.3) * 160;
  let tip = {x: 52, y: 74};
  const lines = rows.map((y, i) => {
    const d = Math.min(lens[i], rem);
    rem -= d;
    if (d <= 0) return null;
    tip = {x: 52 + d, y};
    return <line key={y} x1={52} y1={y} x2={52 + d} y2={y} stroke={C.paper} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="14 6" />;
  });
  return (
    <svg width={300} height={240} viewBox="0 0 300 240">
      <rect x={16} y={18} width={268} height={204} fill={frame} {...ln()} />
      <rect x={36} y={38} width={228} height={164} fill={C.board} {...ln()} />
      {[70, 170].map((y) => (
        <circle key={y} cx={26} cy={y} r={4} fill={C.board} />
      ))}
      {lines}
      <line x1={tip.x} y1={tip.y} x2={tip.x + 40} y2={tip.y - 70} stroke={C.board} strokeWidth={10} strokeLinecap="round" />
      <line x1={tip.x} y1={tip.y} x2={tip.x + 40} y2={tip.y - 70} stroke={C.greyLight} strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
};

/** Oared galley with a square sail. label = name on the sail (typography only). */
export const Galley: React.FC<EraProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.greyLight);
  const bob = 3 * Math.sin(t * 2);
  const sw = 18 * Math.sin(t * 3.2);
  return (
    <svg width={560} height={320} viewBox="0 0 560 320">
      <g transform={`translate(0 ${bob.toFixed(2)})`}>
        {Array.from({length: 8}, (_, i) => {
          const x = 130 + i * 42;
          const a = ((115 + sw) * Math.PI) / 180;
          return <line key={i} x1={x} y1={226} x2={x + 92 * Math.cos(a)} y2={226 + 92 * Math.sin(a)} {...ln()} />;
        })}
        <line x1={280} y1={34} x2={280} y2={204} {...ln(STROKE * 2)} />
        <line x1={196} y1={50} x2={364} y2={50} {...ln()} />
        <rect x={200} y={50} width={160} height={116} fill={C.paper} {...ln()} />
        <rect x={262} y={104} width={36} height={62} fill={C.stamp} />
        <rect x={200} y={50} width={160} height={116} fill="none" {...ln()} />
        {label ? (
          <text x={280} y={90} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill={C.board} {...fitText(label, 10, 140)}>
            {label}
          </text>
        ) : null}
        <path d="M40 196 L520 196 Q506 246 444 258 L118 258 Q58 248 40 196 Z" fill={c} {...ln()} />
        <path d="M40 196 Q16 158 52 132" fill="none" {...ln(STROKE * 2)} />
        <polygon points="512,222 552,234 512,246" fill={C.board} />
        <rect x={70} y={208} width={420} height={10} fill={C.stamp} />
        {Array.from({length: 8}, (_, i) => (
          <circle key={i} cx={130 + i * 42} cy={234} r={6} fill={C.board} />
        ))}
      </g>
      <Waves w={560} y={262} t={t} h={320} />
    </svg>
  );
};

/** Chariot pulled by a stylised horse (galloping legs, turning wheel). */
export const Chariot: React.FC<EraProps> = ({colour}) => {
  const t = useT();
  const c = colourOf(colour, C.stamp);
  const legs: Array<[number, number]> = [
    [70, 0],
    [86, Math.PI],
    [128, Math.PI / 2],
    [144, Math.PI * 1.5],
  ];
  const bounce = 3 * Math.abs(Math.sin(t * 10));
  return (
    <svg width={460} height={260} viewBox="0 0 460 260">
      <line x1={0} y1={250} x2={460} y2={250} stroke={C.grey} strokeWidth={STROKE} />
      <g transform={`translate(0 ${(-bounce).toFixed(2)})`}>
        {legs.map(([x, ph], i) => {
          const a = 25 * Math.sin(t * 10 + ph);
          return <line key={i} x1={x} y1={160} x2={x} y2={226} {...ln(STROKE * 2.5)} transform={`rotate(${a.toFixed(1)} ${x} 160)`} />;
        })}
        <path d="M150 128 C178 124 196 150 186 176" fill="none" {...ln(STROKE * 2)} />
        <ellipse cx={108} cy={142} rx={58} ry={28} fill={C.greyLight} {...ln()} />
        <polygon points="62,134 40,74 64,64 86,124" fill={C.greyLight} {...ln()} />
        <g transform="translate(36 72) rotate(-28)">
          <rect x={-40} y={-12} width={50} height={26} rx={10} fill={C.greyLight} {...ln()} />
        </g>
        <polygon points="56,62 62,42 70,64" fill={C.greyLight} {...ln(2.5)} />
        <polyline points="66,66 76,84 70,96 82,112 78,124" fill="none" stroke={C.stamp} strokeWidth={STROKE * 2} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={160} y1={150} x2={262} y2={170} {...ln(STROKE * 1.5)} />
        <path d="M250 112 L362 112 L372 196 L254 196 Q236 154 250 112 Z" fill={c} {...ln()} />
        <rect x={262} y={128} width={92} height={10} fill={C.board} />
      </g>
      <Wheel x={316} y={200} r={48} t={t} speed={-420} fill={C.grey} />
    </svg>
  );
};

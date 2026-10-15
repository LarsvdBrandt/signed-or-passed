import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {c01, fitText, frac, useT} from '../illustrations/kit';

/**
 * Era pack: near future (speculative, 2025 - 2050). House style: flat shapes, live STROKE, brand colours only,
 * faceless, no logos, no real brands, no real car, phone, drone or headset designs (all devices are generic).
 */
export type FutureProps = {colour?: string; label?: string; pose?: string; [k: string]: any};

const ln = (w?: number) => ({
  stroke: C.board,
  strokeWidth: w ?? STROKE,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

const rnd = (n: number): number => frac(Math.sin(n * 12.9898) * 43758.5453);

/** Future skyline: slender towers with roof gardens, wind turbines, an elevated rail with a gliding pod train, delivery drones crossing; label = billboard text (default 'TOMORROW'). */
export const FutureSkylineBackdrop: React.FC<FutureProps> = ({label}) => {
  const t = useT();
  const word = label || 'TOMORROW';
  const towers: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const x = 40 + i * 190 + 30 * rnd(i + 3);
    const w = 90 + 50 * rnd(i + 7);
    const h = 320 + 380 * rnd(i + 11);
    const top = 760 - h;
    const bands: React.ReactNode[] = [];
    for (let y = top + 40; y < 740; y += 44) {
      bands.push(<line key={y} x1={x + 12} y1={y} x2={x + w - 12} y2={y} stroke={C.grey} strokeWidth={2} />);
    }
    towers.push(
      <g key={i}>
        <path d={`M${x} 760 L${x} ${top + 30} Q${x + w / 2} ${top - 10} ${x + w} ${top + 30} L${x + w} 760 Z`} fill={i % 3 === 1 ? C.greyLight : C.paper} {...ln()} />
        {bands}
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={x + w * (0.3 + 0.2 * k)} cy={top + 12} r={10} fill={C.ink} stroke={C.board} strokeWidth={2} />
        ))}
      </g>,
    );
  }
  const turbines = [0, 1, 2].map((i) => {
    const x = 260 + i * 640;
    const rot = (t * 70 + i * 40) % 360;
    return (
      <g key={`w${i}`}>
        <line x1={x} y1={220} x2={x} y2={420} {...ln(5)} />
        <g transform={`translate(${x} 220) rotate(${rot.toFixed(1)})`}>
          {[0, 120, 240].map((a) => (
            <path key={a} d="M0 0 L8 -10 L0 -90 L-6 -10 Z" transform={`rotate(${a})`} fill={C.paper} {...ln(2.5)} />
          ))}
          <circle r={8} fill={C.board} />
        </g>
      </g>
    );
  });
  const trainX = -700 + frac(t / 7) * 2800;
  const drones = [0, 1, 2].map((i) => {
    const x = -100 + frac(t / (9 + i * 3) + i * 0.37) * 2120;
    const y = 120 + i * 70 + 10 * Math.sin(t * 3 + i);
    const r = 14 * Math.abs(Math.cos(t * 30 + i));
    return (
      <g key={`d${i}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
        <line x1={-26} y1={0} x2={26} y2={0} stroke={C.board} strokeWidth={4} />
        <ellipse cx={-26} cy={-6} rx={4 + r} ry={3} fill={C.grey} />
        <ellipse cx={26} cy={-6} rx={4 + r} ry={3} fill={C.grey} />
        <rect x={-12} y={-4} width={24} height={12} rx={4} fill={C.ink} stroke={C.board} strokeWidth={2} />
        <line x1={0} y1={8} x2={0} y2={22} stroke={C.board} strokeWidth={2} />
        <rect x={-9} y={22} width={18} height={14} fill={C.stamp} stroke={C.board} strokeWidth={2} />
      </g>
    );
  });
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <circle cx={1560} cy={220} r={110} fill={C.greyLight} />
        {turbines}
        {towers}
        <g>
          <rect x={720} y={300} width={420} height={120} fill={C.ink} {...ln()} />
          <text x={930} y={378} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={56} fill={C.paper} {...fitText(word, 12, 380)}>
            {word}
          </text>
          {Array.from({length: 6}, (_, k) => (
            <line key={k} x1={720} y1={312 + k * 20} x2={1140} y2={312 + k * 20} stroke={C.paper} strokeWidth={1.5} opacity={0.18} />
          ))}
        </g>
        <rect x={0} y={760} width={1920} height={320} fill={C.greyLight} />
        <line x1={0} y1={760} x2={1920} y2={760} {...ln()} />
        {Array.from({length: 9}, (_, k) => (
          <rect key={`p${k}`} x={90 + k * 220} y={700} width={22} height={160} fill={C.grey} {...ln(2.5)} />
        ))}
        <rect x={0} y={690} width={1920} height={18} fill={C.board} />
        <g transform={`translate(${trainX.toFixed(1)} 0)`}>
          {[0, 1, 2].map((k) => (
            <g key={k}>
              <path d={`M${k * 230} 690 L${k * 230} 640 Q${k * 230} 616 ${k * 230 + 30} 616 L${k * 230 + 200} 616 Q${k * 230 + 222} 616 ${k * 230 + 222} 640 L${k * 230 + 222} 690 Z`} fill={C.paper} {...ln()} />
              <rect x={k * 230 + 20} y={630} width={182} height={26} rx={6} fill={C.ink} />
              <line x1={k * 230} y1={672} x2={k * 230 + 222} y2={672} stroke={C.stamp} strokeWidth={6} />
            </g>
          ))}
        </g>
        {drones}
        <path d="M0 900 L1920 900" stroke={C.grey} strokeWidth={4} strokeDasharray="60 40" />
      </svg>
    </AbsoluteFill>
  );
};

/** Smartphone whose app tiles pop in one by one; a notification banner (label, default 'Payment received') slides down. colour = body. */
export const SmartphoneGrid: React.FC<FutureProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.board);
  const txt = label || 'Payment received';
  const fills = [C.ink, C.stamp, C.grey, C.board, C.greyLight];
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c;
      const s = c01((t - i * 0.05) / 0.25);
      if (s <= 0) continue;
      const cx = 84 + c * 44;
      const cy = 160 + r * 52;
      tiles.push(
        <g key={i} transform={`translate(${cx} ${cy}) scale(${s.toFixed(3)})`}>
          <rect x={-16} y={-16} width={32} height={32} rx={9} fill={fills[(i * 3) % fills.length]} stroke={C.board} strokeWidth={2} />
        </g>,
      );
    }
  }
  const by = 60 - 80 * (1 - c01((t - 1.4) / 0.4));
  return (
    <svg width={300} height={520} viewBox="0 0 300 520">
      <defs>
        <clipPath id="era-phonegrid-clip">
          <rect x={54} y={40} width={192} height={440} rx={14} />
        </clipPath>
      </defs>
      <rect x={40} y={20} width={220} height={480} rx={34} fill={body} {...ln()} />
      <rect x={54} y={40} width={192} height={440} rx={14} fill={C.paper} />
      <rect x={124} y={48} width={52} height={12} rx={6} fill={body} />
      <text x={70} y={100} fontFamily={FONT_MONO} fontWeight={700} fontSize={22} fill={C.board}>
        {`09:${String(41 + Math.floor(t / 60)).padStart(2, '0')}`}
      </text>
      {tiles}
      <g clipPath="url(#era-phonegrid-clip)">
        <g transform={`translate(0 ${by.toFixed(1)})`}>
          <rect x={62} y={12} width={176} height={54} rx={12} fill={C.greyLight} stroke={C.board} strokeWidth={2.5} />
          <rect x={72} y={24} width={28} height={28} rx={8} fill={C.ink} />
          <text x={110} y={44} fontFamily={FONT_MONO} fontWeight={700} fontSize={13} fill={C.board} {...fitText(txt, 14, 118)}>
            {txt}
          </text>
        </g>
      </g>
      <rect x={110} y={462} width={80} height={6} rx={3} fill={C.board} />
    </svg>
  );
};

/** Delivery quadcopter: hovers, rotors blur, a parcel (label, default 'PARCEL') swings underneath. colour = body. */
export const Drone: React.FC<FutureProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.ink);
  const txt = label || 'PARCEL';
  const bob = 8 * Math.sin(t * 2.5);
  const swing = 6 * Math.sin(t * 2.5 + 1);
  const rotors = [
    [80, 92],
    [300, 92],
    [128, 76],
    [252, 76],
  ];
  return (
    <svg width={380} height={300} viewBox="0 0 380 300">
      <g transform={`translate(0 ${bob.toFixed(2)})`}>
        {rotors.map(([x, y], i) => (
          <g key={i}>
            <line x1={190} y1={118} x2={x} y2={y + 8} {...ln(i < 2 ? 6 : 4)} />
            <line x1={x} y1={y + 8} x2={x} y2={y} stroke={C.board} strokeWidth={4} />
            <ellipse cx={x} cy={y} rx={6 + 40 * Math.abs(Math.cos(t * 31 + i))} ry={5} fill={C.grey} stroke={C.board} strokeWidth={2} opacity={i < 2 ? 1 : 0.7} />
          </g>
        ))}
        <rect x={146} y={100} width={88} height={40} rx={14} fill={body} {...ln()} />
        <circle cx={190} cy={146} r={10} fill={C.board} />
        <circle cx={222} cy={112} r={4} fill={Math.floor(t * 3) % 2 ? C.stamp : C.paper} />
        <g transform={`rotate(${swing.toFixed(2)} 190 146)`}>
          <line x1={190} y1={146} x2={190} y2={190} stroke={C.board} strokeWidth={3} />
          <rect x={146} y={190} width={88} height={64} fill={C.greyLight} {...ln()} />
          <line x1={146} y1={206} x2={234} y2={206} stroke={C.stamp} strokeWidth={4} />
          <text x={190} y={238} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={15} fill={C.board} {...fitText(txt, 8, 76)}>
            {txt}
          </text>
        </g>
      </g>
    </svg>
  );
};

/** Electric car at a charging post: battery fills, a bolt pulses on the door; label = number plate (default 'EV-2030'). colour = body. */
export const EV: React.FC<FutureProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.ink);
  const txt = label || 'EV-2030';
  const level = 0.2 + 0.8 * c01(t / 5);
  const pulse = 0.5 + 0.5 * Math.abs(Math.sin(t * 3));
  return (
    <svg width={600} height={320} viewBox="0 0 600 320">
      <rect x={30} y={80} width={70} height={210} rx={10} fill={C.greyLight} {...ln()} />
      <rect x={46} y={100} width={38} height={70} rx={4} fill={C.paper} stroke={C.board} strokeWidth={2.5} />
      <rect x={58} y={94} width={14} height={6} fill={C.board} />
      <rect x={50} y={104 + 62 * (1 - level)} width={30} height={62 * level} fill={level > 0.95 ? C.ink : C.stamp} />
      <text x={65} y={196} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.board}>
        {`${Math.round(level * 100)}%`}
      </text>
      <path d="M100 220 Q140 300 178 214" fill="none" stroke={C.board} strokeWidth={6} />
      <path d="M150 260 L150 200 Q160 160 220 152 L300 112 Q330 98 380 98 L460 98 Q500 102 530 142 L570 162 Q586 172 586 200 L586 260 Z" fill={body} {...ln()} />
      <path d="M310 124 Q334 112 380 112 L380 150 L280 150 Z" fill={C.paper} {...ln(2.5)} />
      <path d="M396 112 L456 112 Q484 116 506 150 L396 150 Z" fill={C.paper} {...ln(2.5)} />
      <rect x={170} y={204} width={16} height={20} rx={3} fill={C.board} />
      <path d="M352 176 L336 206 L350 206 L340 234 L370 196 L355 196 L366 176 Z" fill={C.paper} stroke={C.board} strokeWidth={2} opacity={pulse} />
      <rect x={528} y={212} width={52} height={22} fill={C.paper} stroke={C.board} strokeWidth={2} />
      <text x={554} y={228} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={12} fill={C.board} {...fitText(txt, 7, 46)}>
        {txt}
      </text>
      {[240, 500].map((x) => (
        <g key={x}>
          <circle cx={x} cy={262} r={38} fill={C.board} {...ln()} />
          <circle cx={x} cy={262} r={16} fill={C.grey} />
        </g>
      ))}
      <line x1={20} y1={300} x2={590} y2={300} {...ln()} />
    </svg>
  );
};

/** Data centre hall: two rows of racks with blinking lights, cooling air rising from floor vents; label = hall sign (default 'HALL B'). colour = racks. */
export const DataCentre: React.FC<FutureProps> = ({colour, label}) => {
  const t = useT();
  const rack = colourOf(colour, C.board);
  const txt = label || 'HALL B';
  const step = Math.floor(t * 6);
  const back = Array.from({length: 8}, (_, i) => {
    const x = 30 + i * 74;
    return (
      <g key={`b${i}`}>
        <rect x={x} y={120} width={64} height={150} fill={C.grey} {...ln(2)} />
        {[0, 1, 2, 3, 4].map((k) => (
          <circle key={k} cx={x + 50} cy={136 + k * 26} r={3.5} fill={rnd(i * 11 + k + step * 7) > 0.5 ? C.ink : C.greyLight} />
        ))}
      </g>
    );
  });
  const front = Array.from({length: 5}, (_, i) => {
    const x = 20 + i * 122;
    return (
      <g key={`f${i}`}>
        <rect x={x} y={180} width={112} height={210} fill={rack} {...ln()} />
        {Array.from({length: 7}, (_, k) => (
          <g key={k}>
            <line x1={x + 12} y1={198 + k * 27} x2={x + 70} y2={198 + k * 27} stroke={C.grey} strokeWidth={3} />
            <circle cx={x + 90} cy={198 + k * 27} r={4} fill={rnd(i * 17 + k * 3 + step * 5) > 0.45 ? (k % 3 ? C.ink : C.stamp) : C.grey} />
          </g>
        ))}
      </g>
    );
  });
  const air = Array.from({length: 6}, (_, i) => {
    const p = frac(t * 0.6 + i / 6);
    const x = 70 + i * 100;
    const y = 400 - p * 120;
    return <path key={`a${i}`} d={`M${x} ${y} q10 -12 0 -24 q-10 -12 0 -24`} fill="none" stroke={C.ink} strokeWidth={3} opacity={(1 - p) * 0.7} />;
  });
  return (
    <svg width={640} height={420} viewBox="0 0 640 420">
      <rect x={0} y={0} width={640} height={420} fill={C.greyLight} />
      <line x1={320} y1={0} x2={320} y2={24} stroke={C.board} strokeWidth={3} />
      <rect x={250} y={24} width={140} height={44} fill={C.paper} {...ln(2.5)} />
      <text x={320} y={54} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.board} {...fitText(txt, 10, 124)}>
        {txt}
      </text>
      {back}
      {front}
      <rect x={0} y={390} width={640} height={30} fill={C.grey} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={50 + i * 100} y={396} width={40} height={10} fill={C.board} />
      ))}
      {air}
      <rect x={0} y={0} width={640} height={420} fill="none" {...ln()} />
    </svg>
  );
};

/** VR headset with lens glow and orbiting pixel squares; label on the visor (default 'VR'). colour = visor. */
export const VRHeadset: React.FC<FutureProps> = ({colour, label}) => {
  const t = useT();
  const visor = colourOf(colour, C.board);
  const txt = label || 'VR';
  const glow = 0.4 + 0.6 * Math.abs(Math.sin(t * 2));
  const pixels = Array.from({length: 6}, (_, k) => {
    const a = t * 0.8 + (k / 6) * Math.PI * 2;
    const x = 210 + 180 * Math.cos(a);
    const y = 150 + 110 * Math.sin(a);
    const front = Math.sin(a) > 0;
    return <rect key={k} x={x - 9} y={y - 9} width={18} height={18} fill={k % 2 ? C.stamp : C.ink} stroke={C.board} strokeWidth={2} opacity={front ? 1 : 0.4} />;
  });
  return (
    <svg width={420} height={300} viewBox="0 0 420 300">
      {pixels}
      <path d="M80 140 Q30 140 40 200 Q210 260 380 200 Q390 140 340 140" fill="none" stroke={C.grey} strokeWidth={14} strokeLinecap="round" />
      <rect x={80} y={80} width={260} height={130} rx={40} fill={visor} {...ln()} />
      <rect x={100} y={98} width={220} height={94} rx={30} fill={C.grey} {...ln(2.5)} />
      <circle cx={160} cy={145} r={26} fill={C.ink} opacity={glow} />
      <circle cx={260} cy={145} r={26} fill={C.ink} opacity={glow} />
      <text x={210} y={232} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={22} fill={C.board} {...fitText(txt, 10, 200)}>
        {txt}
      </text>
    </svg>
  );
};

/** Industrial robot arm: three joints move in a loop, the gripper carries a box (label, default 'ORDER 42'). colour = arm. */
export const RobotArm: React.FC<FutureProps> = ({colour, label}) => {
  const t = useT();
  const arm = colourOf(colour, C.stamp);
  const txt = label || 'ORDER 42';
  const a1 = -70 + 20 * Math.sin(t * 1.4);
  const a2 = 70 + 25 * Math.sin(t * 1.4 + 1);
  const a3 = 20 * Math.sin(t * 1.4 + 2);
  const sum = a1 + a2 + a3;
  return (
    <svg width={460} height={440} viewBox="0 0 460 440">
      <rect x={50} y={392} width={140} height={36} rx={6} fill={C.board} {...ln()} />
      <path d="M80 392 L90 360 L150 360 L160 392 Z" fill={C.grey} {...ln()} />
      <g transform={`translate(120 362) rotate(${a1.toFixed(2)})`}>
        <rect x={0} y={-16} width={150} height={32} rx={14} fill={arm} {...ln()} />
        <circle cx={0} cy={0} r={18} fill={C.paper} {...ln()} />
        <g transform={`translate(150 0) rotate(${a2.toFixed(2)})`}>
          <rect x={0} y={-12} width={130} height={24} rx={10} fill={arm} {...ln()} />
          <circle cx={0} cy={0} r={14} fill={C.paper} {...ln()} />
          <g transform={`translate(130 0) rotate(${a3.toFixed(2)})`}>
            <circle cx={0} cy={0} r={11} fill={C.paper} {...ln(2.5)} />
            <rect x={6} y={-10} width={26} height={20} fill={C.grey} {...ln(2.5)} />
            <g transform={`translate(32 0) rotate(${(-sum).toFixed(2)})`}>
              <line x1={-10} y1={0} x2={-10} y2={18} {...ln(5)} />
              <line x1={10} y1={0} x2={10} y2={18} {...ln(5)} />
              <rect x={-45} y={18} width={90} height={60} fill={C.greyLight} {...ln()} />
              <line x1={-45} y1={34} x2={45} y2={34} stroke={C.ink} strokeWidth={4} />
              <text x={0} y={64} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.board} {...fitText(txt, 9, 80)}>
                {txt}
              </text>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
};

/** Tilted solar panel under a turning sun, a glint sweeps across; counter below counts energy (label = unit, default 'kWh'). colour = cells. */
export const SolarPanel: React.FC<FutureProps> = ({colour, label}) => {
  const t = useT();
  const cell = colourOf(colour, C.ink);
  const unit = label || 'kWh';
  const A = [60, 180];
  const U = [300, -40];
  const V = [60, 120];
  const px = (u: number, v: number): number => A[0] + u * U[0] + v * V[0];
  const py = (u: number, v: number): number => A[1] + u * U[1] + v * V[1];
  const P = (u: number, v: number): string => `${px(u, v).toFixed(1)},${py(u, v).toFixed(1)}`;
  const g = frac(t / 3) * 1.4 - 0.2;
  const rot = (t * 30) % 360;
  return (
    <svg width={460} height={380} viewBox="0 0 460 380">
      <g transform={`translate(390 64) rotate(${rot.toFixed(1)})`}>
        {Array.from({length: 8}, (_, k) => (
          <line key={k} x1={0} y1={-44} x2={0} y2={-58} transform={`rotate(${k * 45})`} stroke={C.stamp} strokeWidth={5} strokeLinecap="round" />
        ))}
      </g>
      <circle cx={390} cy={64} r={34} fill={C.stamp} {...ln(2.5)} />
      <line x1={180} y1={280} x2={170} y2={330} {...ln(6)} />
      <line x1={330} y1={250} x2={350} y2={330} {...ln(6)} />
      <polygon points={`${P(0, 0)} ${P(1, 0)} ${P(1, 1)} ${P(0, 1)}`} fill={cell} {...ln()} />
      {[1, 2, 3].map((k) => (
        <line key={`u${k}`} x1={px(k / 4, 0)} y1={py(k / 4, 0)} x2={px(k / 4, 1)} y2={py(k / 4, 1)} stroke={C.paper} strokeWidth={2} />
      ))}
      {[1, 2].map((k) => (
        <line key={`v${k}`} x1={px(0, k / 3)} y1={py(0, k / 3)} x2={px(1, k / 3)} y2={py(1, k / 3)} stroke={C.paper} strokeWidth={2} />
      ))}
      {g >= 0 && g <= 0.9 ? <polygon points={`${P(g, 0)} ${P(g + 0.1, 0)} ${P(g + 0.1, 1)} ${P(g, 1)}`} fill={C.paper} opacity={0.45} /> : null}
      <line x1={120} y1={330} x2={400} y2={330} {...ln()} />
      <rect x={140} y={340} width={220} height={34} fill={C.board} />
      <text x={250} y={364} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.paper}>
        {`${String(Math.floor(t * 37)).padStart(5, '0')} ${unit}`}
      </text>
    </svg>
  );
};

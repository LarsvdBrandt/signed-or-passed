import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {c01, fitText, frac, useT} from '../illustrations/kit';

/**
 * Era pack: 2000s (2001 - 2012). House style: flat shapes, live STROKE, brand colours only, faceless, no logos, no
 * real brands, no real phone, music-player, camera or operating-system designs (all devices are generic).
 */
export type NoughtiesProps = {colour?: string; label?: string; pose?: string; [k: string]: any};

const ln = (w?: number) => ({
  stroke: C.board,
  strokeWidth: w ?? STROKE,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

const rnd = (n: number): number => frac(Math.sin(n * 12.9898) * 43758.5453);

const Note: React.FC<{x: number; y: number; o?: number}> = ({x, y, o}) => (
  <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} opacity={o ?? 1}>
    <ellipse cx={0} cy={0} rx={8} ry={6} fill={C.board} />
    <line x1={7} y1={0} x2={7} y2={-26} stroke={C.board} strokeWidth={3} />
    <line x1={7} y1={-26} x2={16} y2={-20} stroke={C.board} strokeWidth={3} />
  </g>
);

/** Open-plan office: window wall with skyline, swinging pendant lamps, whiteboard on a stand (label = heading, default 'GROWTH'; a rising arrow draws itself), bench desks with flat screens, beanbag and plant. */
export const OpenPlanBackdrop: React.FC<NoughtiesProps> = ({label}) => {
  const t = useT();
  const word = label || 'GROWTH';
  const draw = c01(t / 2.5);
  const panes: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const x = 70 + i * 300;
    const towers: React.ReactNode[] = [];
    for (let k = 0; k < 3; k++) {
      const h = 120 + 220 * rnd(i * 3 + k);
      const w = 50 + 30 * rnd(i * 5 + k + 1);
      towers.push(<rect key={k} x={x + 20 + k * 85} y={540 - h} width={w} height={h} fill={C.greyLight} stroke={C.grey} strokeWidth={2} />);
    }
    panes.push(
      <g key={i}>
        <rect x={x} y={100} width={280} height={440} fill={C.paper} />
        {towers}
        <rect x={x} y={100} width={280} height={440} fill="none" {...ln()} />
      </g>,
    );
  }
  const lamps = [0, 1, 2].map((i) => {
    const x = 420 + i * 520;
    const a = 3 * Math.sin(t * 1.2 + i);
    return (
      <g key={`l${i}`} transform={`rotate(${a.toFixed(2)} ${x} 0)`}>
        <line x1={x} y1={0} x2={x} y2={170} stroke={C.board} strokeWidth={3} />
        <path d={`M${x - 60} 220 Q${x - 60} 170 ${x} 170 Q${x + 60} 170 ${x + 60} 220 Z`} fill={C.stamp} {...ln()} />
        <rect x={x - 14} y={220} width={28} height={10} fill={C.paper} {...ln(2)} />
      </g>
    );
  });
  const desks: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const x = 140 + i * 250;
    const bars = [0, 1, 2].map((k) => {
      const h = 18 + 40 * rnd(i * 9 + k + Math.floor(t * 2));
      return <rect key={k} x={x + 26 + k * 30} y={736 - h} width={20} height={h} fill={k === 1 ? C.stamp : C.paper} />;
    });
    desks.push(
      <g key={`d${i}`}>
        <rect x={x + 60} y={744} width={40} height={30} fill={C.grey} {...ln(2.5)} />
        <rect x={x} y={640} width={160} height={104} rx={4} fill={C.board} {...ln()} />
        <rect x={x + 10} y={650} width={140} height={86} fill={C.ink} />
        {bars}
      </g>,
    );
  }
  const arrowLen = 560;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <rect x={0} y={0} width={1920} height={640} fill={C.grey} />
        {panes}
        <rect x={0} y={0} width={1920} height={60} fill={C.greyLight} />
        <line x1={0} y1={60} x2={1920} y2={60} {...ln()} />
        <rect x={0} y={600} width={1920} height={480} fill={C.greyLight} />
        <line x1={0} y1={600} x2={1920} y2={600} {...ln()} />
        {lamps}
        <g>
          <line x1={1380} y1={560} x2={1360} y2={780} {...ln()} />
          <line x1={1720} y1={560} x2={1740} y2={780} {...ln()} />
          <rect x={1300} y={260} width={500} height={300} fill={C.paper} {...ln()} />
          <text x={1550} y={318} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={44} fill={C.board} {...fitText(word, 14, 440)}>
            {word}
          </text>
          <polyline
            points="1340,520 1460,470 1540,490 1640,400 1760,350"
            fill="none"
            stroke={C.ink}
            strokeWidth={8}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={arrowLen}
            strokeDashoffset={arrowLen * (1 - draw)}
          />
          {draw > 0.98 ? <path d="M1760 350 L1728 352 L1748 378 Z" fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" /> : null}
        </g>
        <rect x={100} y={774} width={1100} height={26} fill={C.paper} {...ln()} />
        <line x1={140} y1={800} x2={140} y2={960} {...ln()} />
        <line x1={1160} y1={800} x2={1160} y2={960} {...ln()} />
        {desks}
        <path d="M1440 980 Q1400 860 1500 840 Q1600 820 1640 900 Q1680 980 1600 990 Q1500 1000 1440 980 Z" fill={C.stamp} {...ln()} />
        <path d="M1500 860 Q1540 900 1600 880" fill="none" stroke={C.board} strokeWidth={2.5} />
        <g>
          <path d="M1790 1000 L1780 900 L1880 900 L1870 1000 Z" fill={C.paper} {...ln()} />
          {[-40, -15, 10, 35].map((a, k) => {
            const sway = 3 * Math.sin(t * 1.5 + k);
            return (
              <path
                key={k}
                d="M0 0 Q-18 -60 0 -130 Q18 -60 0 0 Z"
                transform={`translate(1830 900) rotate(${(a + sway).toFixed(1)})`}
                fill={C.ink}
                {...ln(2.5)}
              />
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Clamshell phone that flips open; outer screen shows a blinking envelope and the label (default 'NEW MESSAGE'). colour = body. */
export const FlipPhone: React.FC<NoughtiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.grey);
  const txt = label || 'NEW MESSAGE';
  const open = c01(t / 0.6);
  const ease = Math.max(0.04, 1 - (1 - open) * (1 - open));
  const blink = Math.floor(t * 2.5) % 2 === 0;
  const hinge = 220;
  const keys: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      keys.push(<rect key={`${r}-${c}`} x={76 + c * 38} y={hinge + 56 + r * 28} width={30} height={20} rx={6} fill={C.paper} stroke={C.board} strokeWidth={2} />);
    }
  }
  return (
    <svg width={260} height={420} viewBox="0 0 260 420">
      <rect x={50} y={hinge} width={160} height={180} rx={22} fill={body} {...ln()} />
      <rect x={80} y={hinge + 18} width={100} height={26} rx={10} fill={C.greyLight} stroke={C.board} strokeWidth={2} />
      <circle cx={130} cy={hinge + 31} r={7} fill={C.ink} stroke={C.board} strokeWidth={2} />
      {keys}
      <g transform={`translate(0 ${hinge}) scale(1 ${ease.toFixed(3)}) translate(0 ${-hinge})`}>
        <rect x={54} y={30} width={152} height={190} rx={22} fill={body} {...ln()} />
        <rect x={104} y={42} width={52} height={8} rx={4} fill={C.board} />
        <rect x={72} y={62} width={116} height={128} fill={C.ink} {...ln(2.5)} />
        <rect x={104} y={88} width={52} height={36} fill={blink ? C.paper : C.greyLight} stroke={C.board} strokeWidth={2} />
        <path d="M104 88 L130 110 L156 88" fill="none" stroke={C.board} strokeWidth={2} />
        <text x={130} y={166} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.paper} {...fitText(txt, 12, 104)}>
          {txt}
        </text>
      </g>
      <rect x={62} y={hinge - 8} width={136} height={16} rx={8} fill={C.greyLight} {...ln(2.5)} />
    </svg>
  );
};

/** Generic pocket music player: screen with track name (label, default 'TRACK 01'), progress bar and equaliser, round 4-way pad, earbuds, floating notes. colour = body. */
export const MP3Player: React.FC<NoughtiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.ink);
  const txt = label || 'TRACK 01';
  const prog = frac(t / 8);
  const step = Math.floor(t * 6);
  const lit = Math.floor(t * 2) % 4;
  const arrows = [
    'M120 160 L110 172 L130 172 Z',
    'M160 200 L148 190 L148 210 Z',
    'M120 240 L110 228 L130 228 Z',
    'M80 200 L92 190 L92 210 Z',
  ];
  const wig = 6 * Math.sin(t * 2);
  return (
    <svg width={240} height={400} viewBox="0 0 240 400">
      <path d={`M120 270 Q${100 + wig} 320 70 360 M120 270 Q${140 - wig} 320 170 360`} fill="none" stroke={C.board} strokeWidth={3} />
      <circle cx={70} cy={366} r={13} fill={C.paper} {...ln(2.5)} />
      <circle cx={170} cy={366} r={13} fill={C.paper} {...ln(2.5)} />
      <rect x={50} y={30} width={140} height={240} rx={20} fill={body} {...ln()} />
      <rect x={66} y={46} width={108} height={84} fill={C.greyLight} {...ln(2)} />
      <text x={74} y={70} fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.board} {...fitText(txt, 11, 92)}>
        {txt}
      </text>
      {[0, 1, 2, 3, 4, 5].map((k) => {
        const h = 6 + 22 * rnd(step * 13 + k);
        return <rect key={k} x={76 + k * 15} y={112 - h} width={10} height={h} fill={k % 2 ? C.stamp : C.ink} />;
      })}
      <rect x={74} y={118} width={92} height={6} fill={C.paper} stroke={C.board} strokeWidth={1.5} />
      <rect x={74} y={118} width={92 * prog} height={6} fill={C.board} />
      <circle cx={120} cy={200} r={50} fill={C.paper} {...ln(2.5)} />
      {arrows.map((d, k) => (
        <path key={k} d={d} fill={k === lit ? C.stamp : C.board} />
      ))}
      <circle cx={120} cy={200} r={16} fill={body} {...ln(2.5)} />
      {[0, 1, 2].map((k) => {
        const p = frac(t * 0.5 + k / 3);
        return <Note key={k} x={200 + 12 * Math.sin(p * 6 + k)} y={170 - p * 140} o={1 - p} />;
      })}
    </svg>
  );
};

/** Wide flat-screen TV on a stand: bar chart grows on screen, a ticker band scrolls the label (default 'MARKETS LIVE'). colour = frame. */
export const FlatScreen: React.FC<NoughtiesProps> = ({colour, label}) => {
  const t = useT();
  const frame = colourOf(colour, C.board);
  const txt = label || 'MARKETS LIVE';
  const tick = `${txt}   +++   ${txt}   +++   `;
  const tw = tick.length * 12;
  const sx = 34 - frac(t / 6) * tw;
  const grow = c01(t / 1.5);
  const vals = [0.35, 0.55, 0.45, 0.7, 0.9];
  return (
    <svg width={560} height={400} viewBox="0 0 560 400">
      <defs>
        <clipPath id="era-flat-clip">
          <rect x={34} y={252} width={492} height={40} />
        </clipPath>
      </defs>
      <path d="M220 320 L340 320 L380 380 L180 380 Z" fill={C.grey} {...ln()} />
      <rect x={20} y={20} width={520} height={300} rx={8} fill={frame} {...ln()} />
      <rect x={34} y={34} width={492} height={258} fill={C.paper} />
      <line x1={70} y1={236} x2={500} y2={236} stroke={C.board} strokeWidth={2.5} />
      {vals.map((v, k) => {
        const h = 170 * v * c01(grow * 1.6 - k * 0.12);
        return <rect key={k} x={90 + k * 82} y={236 - h} width={52} height={h} fill={k === 4 ? C.stamp : C.ink} stroke={C.board} strokeWidth={2} />;
      })}
      <rect x={34} y={252} width={492} height={40} fill={C.ink} />
      <g clipPath="url(#era-flat-clip)">
        {[0, 1].map((k) => (
          <text key={k} x={sx + k * tw} y={279} fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.paper}>
            {tick}
          </text>
        ))}
      </g>
      <rect x={34} y={34} width={492} height={258} fill="none" stroke={C.board} strokeWidth={2} />
      <circle cx={500} cy={308} r={4} fill={Math.floor(t * 2) % 2 ? C.stamp : C.grey} />
    </svg>
  );
};

/** Messenger laptop bag with a flap, strap and a swinging luggage tag (label, default 'TRAVEL'); a laptop edge peeks out. colour = bag. */
export const LaptopBag: React.FC<NoughtiesProps> = ({colour, label}) => {
  const t = useT();
  const bag = colourOf(colour, C.board);
  const txt = label || 'TRAVEL';
  const swing = 12 * Math.sin(t * 2.2);
  return (
    <svg width={400} height={340} viewBox="0 0 400 340">
      <path d="M70 150 Q200 -40 330 150" fill="none" stroke={C.board} strokeWidth={14} strokeLinecap="round" />
      <path d="M70 150 Q200 -40 330 150" fill="none" stroke={C.grey} strokeWidth={8} strokeLinecap="round" />
      <rect x={80} y={108} width={240} height={30} rx={4} fill={C.greyLight} {...ln(2.5)} />
      <rect x={40} y={130} width={320} height={190} rx={24} fill={bag} {...ln()} />
      <path d="M40 154 Q40 130 64 130 L336 130 Q360 130 360 154 L360 230 Q200 260 40 230 Z" fill={C.grey} {...ln()} />
      <rect x={120} y={226} width={30} height={40} rx={4} fill={C.paper} {...ln(2.5)} />
      <rect x={250} y={226} width={30} height={40} rx={4} fill={C.paper} {...ln(2.5)} />
      <g transform={`rotate(${swing.toFixed(2)} 320 170)`}>
        <line x1={320} y1={170} x2={320} y2={200} stroke={C.board} strokeWidth={3} />
        <rect x={278} y={200} width={84} height={50} rx={6} fill={C.stamp} {...ln(2.5)} />
        <circle cx={320} cy={210} r={4} fill={C.paper} />
        <text x={320} y={238} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.paper} {...fitText(txt, 8, 72)}>
          {txt}
        </text>
      </g>
    </svg>
  );
};

/** Home router with two antennas, blinking LEDs and pulsing signal arcs; label on the front (default 'NETWORK'). colour = box. */
export const WifiRouter: React.FC<NoughtiesProps> = ({colour, label}) => {
  const t = useT();
  const box = colourOf(colour, C.paper);
  const txt = label || 'NETWORK';
  const cx = 180;
  const cy = 180;
  const arcs = [0, 1, 2].map((k) => {
    const p = frac(t * 0.7 + k / 3);
    const r = 40 + 110 * p;
    const a0 = (-135 * Math.PI) / 180;
    const a1 = (-45 * Math.PI) / 180;
    const d = `M${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)}`;
    return <path key={k} d={d} fill="none" stroke={C.ink} strokeWidth={8} strokeLinecap="round" opacity={1 - p} />;
  });
  const step = Math.floor(t * 8);
  return (
    <svg width={360} height={320} viewBox="0 0 360 320">
      {arcs}
      <line x1={100} y1={210} x2={78} y2={70} {...ln(8)} />
      <line x1={260} y1={210} x2={282} y2={70} {...ln(8)} />
      <rect x={50} y={200} width={260} height={70} rx={16} fill={box} {...ln()} />
      <text x={80} y={244} fontFamily={FONT_HEAD} fontWeight={800} fontSize={24} fill={C.board} {...fitText(txt, 9, 130)}>
        {txt}
      </text>
      {[0, 1, 2, 3].map((k) => {
        const on = rnd(step * 5 + k) > 0.35;
        return <circle key={k} cx={230 + k * 18} cy={236} r={5} fill={on ? (k === 0 ? C.stamp : C.ink) : C.grey} stroke={C.board} strokeWidth={1.5} />;
      })}
      <rect x={80} y={270} width={30} height={12} fill={C.board} />
      <rect x={250} y={270} width={30} height={12} fill={C.board} />
    </svg>
  );
};

/** USB stick: the cap slides off, the LED blinks; label printed on the body (default '2GB'). colour = body. */
export const USBStick: React.FC<NoughtiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.ink);
  const txt = label || '2GB';
  const off = c01((t - 0.3) / 0.6);
  const capX = 34 - 70 * off;
  const led = Math.floor(t * 5) % 2 === 0;
  return (
    <svg width={380} height={200} viewBox="0 0 380 200">
      <rect x={50} y={80} width={60} height={40} fill={C.greyLight} {...ln(2.5)} />
      <rect x={64} y={90} width={10} height={8} fill={C.board} />
      <rect x={86} y={90} width={10} height={8} fill={C.board} />
      <rect x={100} y={66} width={210} height={68} rx={14} fill={body} {...ln()} />
      <text x={130} y={110} fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill={C.paper} {...fitText(txt, 8, 120)}>
        {txt}
      </text>
      <circle cx={280} cy={100} r={6} fill={led ? C.stamp : C.grey} stroke={C.paper} strokeWidth={1.5} />
      <circle cx={334} cy={100} r={18} fill="none" stroke={C.board} strokeWidth={5} />
      {off < 1 ? (
        <g opacity={1 - off * 0.6}>
          <rect x={capX} y={72} width={86} height={56} rx={10} fill={C.grey} {...ln()} />
        </g>
      ) : null}
    </svg>
  );
};

/** Compact digital camera: the lens zooms, the flash fires every 2.5 s; label on the body (default 'ZOOM 3X'). colour = body. */
export const CompactCamera: React.FC<NoughtiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.greyLight);
  const txt = label || 'ZOOM 3X';
  const zoom = 44 + 8 * Math.sin(t * 1.6);
  const f = frac(t / 2.5);
  const flash = f < 0.12 ? 1 - f / 0.12 : 0;
  const star: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 === 0 ? 70 : 26;
    star.push(`${(85 + r * Math.cos(a)).toFixed(1)},${(94 + r * Math.sin(a)).toFixed(1)}`);
  }
  return (
    <svg width={360} height={260} viewBox="0 0 360 260">
      <rect x={244} y={42} width={50} height={20} rx={6} fill={C.stamp} {...ln(2.5)} />
      <rect x={30} y={56} width={300} height={176} rx={20} fill={body} {...ln()} />
      <rect x={58} y={78} width={54} height={32} rx={4} fill={C.paper} {...ln(2.5)} />
      <circle cx={190} cy={150} r={66} fill={C.grey} {...ln()} />
      <circle cx={190} cy={150} r={zoom} fill={C.board} {...ln(2.5)} />
      <circle cx={190} cy={150} r={22} fill={C.ink} />
      <rect x={174} y={130} width={12} height={8} fill={C.paper} />
      <text x={56} y={216} fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.board} {...fitText(txt, 10, 100)}>
        {txt}
      </text>
      {flash > 0 ? <polygon points={star.join(' ')} fill={C.paper} stroke={C.board} strokeWidth={2} opacity={flash} /> : null}
    </svg>
  );
};

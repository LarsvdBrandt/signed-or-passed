import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {c01, fitText, frac, useT} from '../illustrations/kit';

/**
 * Era pack: 1970s - 80s. House style: flat shapes, live STROKE, brand colours only, faceless, no logos, no real
 * brands, no copyrighted game characters (screens show generic pixel blocks).
 */
export type EightiesProps = {colour?: string; label?: string; pose?: string; [k: string]: any};

const ln = (w?: number) => ({
  stroke: C.board,
  strokeWidth: w ?? STROKE,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

const rnd = (n: number): number => frac(Math.sin(n * 12.9898) * 43758.5453);

const Reel: React.FC<{x: number; y: number; r: number; t: number; speed?: number}> = ({x, y, r, t, speed = 160}) => (
  <g transform={`translate(${x} ${y}) rotate(${((t * speed) % 360).toFixed(1)})`}>
    <circle r={r} fill={C.paper} stroke={C.board} strokeWidth={2} />
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <rect key={a} x={-2} y={-r} width={4} height={r * 0.45} fill={C.board} transform={`rotate(${a})`} />
    ))}
  </g>
);

/** Night street: synth grid floor rolling towards the viewer, block skyline, flickering neon signs (label, default 'OPEN 24H'). */
export const NeonBackdrop: React.FC<EightiesProps> = ({label}) => {
  const t = useT();
  const sign = label || 'OPEN 24H';
  const flick = rnd(Math.floor(t * 8) + 1) > 0.12;
  const lines: React.ReactNode[] = [];
  for (let i = -12; i <= 12; i++) {
    lines.push(<line key={`v${i}`} x1={960 + i * 40} y1={700} x2={960 + i * 260} y2={1080} stroke={C.ink} strokeWidth={3} />);
  }
  for (let k = 0; k < 7; k++) {
    const p = frac(k / 7 + t * 0.25);
    const y = 700 + 380 * p * p;
    lines.push(<line key={`h${k}`} x1={0} y1={y} x2={1920} y2={y} stroke={C.ink} strokeWidth={3} />);
  }
  const blocks: Array<[number, number, number]> = [
    [0, 260, 420],
    [250, 200, 300],
    [440, 300, 520],
    [730, 180, 260],
    [1160, 240, 460],
    [1390, 200, 340],
    [1580, 340, 560],
  ];
  return (
    <AbsoluteFill style={{backgroundColor: C.board}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {Array.from({length: 24}, (_, i) => (
          <circle key={`s${i}`} cx={(i * 397) % 1920} cy={(i * 151) % 300 + 20} r={2} fill={C.paper} opacity={0.3 + 0.5 * rnd(i + Math.floor(t * 2))} />
        ))}
        <circle cx={960} cy={600} r={170} fill={C.stamp} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={`sun${i}`} x={780} y={590 + i * 26} width={360} height={8 + i * 3} fill={C.board} />
        ))}
        {blocks.map(([x, w, h], i) => (
          <g key={`b${i}`}>
            <rect x={x} y={700 - h} width={w} height={h} fill={C.grey} {...ln(2.5)} />
            {Array.from({length: Math.floor(h / 50)}, (_, r) =>
              Array.from({length: Math.floor(w / 40)}, (_, k) =>
                rnd(i * 31 + r * 7 + k) > 0.6 ? <rect key={`w${r}-${k}`} x={x + 12 + k * 40} y={700 - h + 16 + r * 50} width={14} height={20} fill={C.paper} opacity={0.85} /> : null,
              ),
            )}
          </g>
        ))}
        <rect x={-10} y={700} width={1940} height={390} fill={C.board} />
        {lines}
        <line x1={0} y1={700} x2={1920} y2={700} stroke={C.stamp} strokeWidth={4} />
        <rect x={470} y={250} width={240} height={90} rx={14} fill={C.board} stroke={flick ? C.stamp : C.grey} strokeWidth={6} />
        <text x={590} y={310} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={44} fill={flick ? C.stamp : C.grey} {...fitText(sign, 8, 210)}>
          {sign}
        </text>
        <rect x={1610} y={210} width={280} height={84} rx={42} fill={C.board} stroke={C.ink} strokeWidth={6} />
        <text x={1750} y={266} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={40} fill={C.ink}>
          ARCADE
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/** Arcade cabinet: marquee (label, default 'HI-SCORE'), screen with generic falling pixel blocks and a paddle, joystick wiggles. */
export const ArcadeCabinet: React.FC<EightiesProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.ink);
  const marquee = label || 'HI-SCORE';
  const paddle = 150 + 50 * Math.sin(t * 2.2);
  const blocks = [0, 1, 2, 3, 4].map((i) => {
    const p = frac(t * 0.5 + i / 5);
    return {x: 100 + ((i * 37) % 5) * 26, y: 130 + p * 150, col: i % 2 ? C.stamp : C.paper};
  });
  const stick = 14 * Math.sin(t * 6);
  return (
    <svg width={320} height={520} viewBox="0 0 320 520">
      <defs>
        <clipPath id="era-arcade-clip">
          <rect x={80} y={120} width={160} height={180} />
        </clipPath>
      </defs>
      <path d="M40 510 L40 40 L280 40 L280 300 L300 330 L300 510 Z" fill={c} {...ln()} />
      <rect x={56} y={50} width={208} height={50} fill={C.board} {...ln(2.5)} />
      <text x={160} y={84} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={22} fill={C.stamp} {...fitText(marquee, 12, 190)}>
        {marquee}
      </text>
      <rect x={70} y={110} width={180} height={200} rx={10} fill={C.board} {...ln(2.5)} />
      <g clipPath="url(#era-arcade-clip)">
        {blocks.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={18} height={18} fill={b.col} />
        ))}
        <rect x={paddle - 26} y={286} width={52} height={8} fill={C.paper} />
        <text x={88} y={140} fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.paper}>
          {String(Math.floor(t * 130) * 10).padStart(6, '0')}
        </text>
      </g>
      <path d="M40 330 L300 330 L300 370 L40 370 Z" fill={C.greyLight} {...ln()} />
      <line x1={110} y1={346} x2={110 + stick} y2={312} {...ln(5)} />
      <circle cx={110 + stick} cy={310} r={11} fill={C.stamp} {...ln(2.5)} />
      <circle cx={190} cy={350} r={9} fill={C.stamp} {...ln(2)} />
      <circle cx={220} cy={344} r={9} fill={C.paper} {...ln(2)} />
      <circle cx={250} cy={350} r={9} fill={C.stamp} {...ln(2)} />
      <rect x={130} y={420} width={60} height={40} fill={C.board} {...ln(2.5)} />
      <rect x={150} y={428} width={20} height={24} fill={C.stamp} />
    </svg>
  );
};

/** Audio cassette with turning reels. label = handwritten-style label text (mono). colour = shell. */
export const Cassette: React.FC<EightiesProps> = ({colour, label}) => {
  const t = useT();
  const shell = colourOf(colour, C.board);
  const txt = label || 'MIXTAPE 1983';
  return (
    <svg width={360} height={240} viewBox="0 0 360 240">
      <rect x={14} y={14} width={332} height={212} rx={14} fill={shell} {...ln()} />
      <rect x={40} y={34} width={280} height={120} rx={8} fill={C.paper} {...ln(2.5)} />
      <rect x={40} y={34} width={280} height={22} fill={C.stamp} />
      <text x={180} y={78} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board} {...fitText(txt, 22, 250)}>
        {txt}
      </text>
      <rect x={90} y={92} width={180} height={48} rx={24} fill={C.board} {...ln(2)} />
      <Reel x={124} y={116} r={18} t={t} />
      <Reel x={236} y={116} r={18} t={t} />
      <path d="M80 226 L100 176 L260 176 L280 226 Z" fill={C.grey} {...ln(2.5)} />
      {[120, 150, 210, 240].map((x) => (
        <circle key={x} cx={x} cy={200} r={6} fill={C.board} />
      ))}
    </svg>
  );
};

/** Boxy CRT television: scanlines, rolling bar, a burst of static, label as on-screen text. colour = case. */
export const CRTTV: React.FC<EightiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.greyLight);
  const roll = 136 + frac(t * 0.4) * 170;
  const staticOn = frac(t * 0.25) > 0.85;
  const noise: React.ReactNode[] = [];
  if (staticOn) {
    for (let i = 0; i < 60; i++) {
      const s = Math.floor(t * 30) * 100 + i;
      noise.push(<rect key={i} x={50 + rnd(s) * 230} y={130 + rnd(s + 0.5) * 170} width={10} height={4} fill={rnd(s + 0.7) > 0.5 ? C.paper : C.grey} />);
    }
  }
  return (
    <svg width={380} height={340} viewBox="0 0 380 340">
      <defs>
        <clipPath id="era-crt-clip">
          <rect x={46} y={126} width={240} height={180} rx={26} />
        </clipPath>
      </defs>
      <rect x={14} y={100} width={352} height={226} rx={16} fill={body} {...ln()} />
      <rect x={32} y={112} width={268} height={206} rx={30} fill={C.board} {...ln(2.5)} />
      <g clipPath="url(#era-crt-clip)">
        <rect x={46} y={126} width={240} height={180} fill={C.ink} />
        {Array.from({length: 18}, (_, i) => (
          <line key={i} x1={46} y1={130 + i * 10} x2={286} y2={130 + i * 10} stroke={C.board} strokeWidth={2} opacity={0.35} />
        ))}
        <rect x={46} y={roll} width={240} height={14} fill={C.paper} opacity={0.18} />
        <text x={166} y={226} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={24} fill={C.paper} {...fitText(label || 'BREAKING', 14, 220)}>
          {label || 'BREAKING'}
        </text>
        {noise}
      </g>
      <circle cx={334} cy={150} r={14} fill={C.grey} {...ln(2.5)} />
      <circle cx={334} cy={196} r={14} fill={C.grey} {...ln(2.5)} />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={`g${i}`} x1={316} y1={236 + i * 14} x2={352} y2={236 + i * 14} stroke={C.board} strokeWidth={2} />
      ))}
      <path d="M150 100 L120 40 M230 100 L262 34" fill="none" {...ln(3)} />
    </svg>
  );
};

/** Boombox: speakers pump to the beat, tape reels turn, antenna. colour = body. */
export const Boombox: React.FC<EightiesProps> = ({colour}) => {
  const t = useT();
  const body = colourOf(colour, C.grey);
  const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 4)), 6);
  const sp = 1 + 0.08 * beat;
  return (
    <svg width={520} height={300} viewBox="0 0 520 300">
      <line x1={420} y1={84} x2={500} y2={8} {...ln(3)} />
      <path d="M150 84 L150 40 Q150 26 164 26 L356 26 Q370 26 370 40 L370 84" fill="none" {...ln(STROKE * 2)} />
      <rect x={14} y={84} width={492} height={200} rx={18} fill={body} {...ln()} />
      {[110, 410].map((x) => (
        <g key={x} transform={`translate(${x} 190) scale(${sp.toFixed(3)})`}>
          <circle r={70} fill={C.board} {...ln()} />
          <circle r={40} fill={C.greyLight} {...ln(2.5)} />
          <circle r={12} fill={C.board} />
        </g>
      ))}
      <rect x={200} y={140} width={120} height={70} rx={6} fill={C.board} {...ln(2.5)} />
      <Reel x={232} y={175} r={14} t={t} />
      <Reel x={288} y={175} r={14} t={t} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={204 + i * 24} y={226} width={18} height={14} fill={i === 1 ? C.stamp : C.paper} {...ln(2)} />
      ))}
      <rect x={200} y={102} width={120} height={22} fill={C.paper} {...ln(2)} />
      <rect x={206 + 100 * frac(t * 0.1)} y={104} width={4} height={18} fill={C.stamp} />
    </svg>
  );
};

/** Pocket calculator: the display counts up to label (a number, default 1,000,000) while keys press. */
export const Calculator: React.FC<EightiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.board);
  const target = Number(String(label || '1000000').replace(/[^0-9.]/g, '')) || 0;
  const p = c01(t / 2.2);
  const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
  const shown = val.toLocaleString('en-US');
  const hit = p < 1 ? Math.floor(t * 8) % 16 : -1;
  const keys: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let k = 0; k < 4; k++) {
      const id = r * 4 + k;
      const down = id === hit;
      keys.push(<rect key={id} x={34 + k * 46} y={150 + r * 46 + (down ? 2 : 0)} width={36} height={34} rx={6} fill={k === 3 ? C.stamp : down ? C.greyLight : C.grey} stroke={C.board} strokeWidth={2} />);
    }
  }
  return (
    <svg width={240} height={360} viewBox="0 0 240 360">
      <rect x={14} y={14} width={212} height={332} rx={18} fill={body} {...ln()} />
      <rect x={30} y={40} width={180} height={70} rx={6} fill={C.greyLight} {...ln(2.5)} />
      <text x={200} y={88} textAnchor="end" fontFamily={FONT_MONO} fontWeight={700} fontSize={30} fill={C.board} {...fitText(shown, 10, 164)}>
        {shown}
      </text>
      <rect x={150} y={122} width={60} height={14} fill={C.ink} />
      {keys}
    </svg>
  );
};

/** Mainframe: a row of cabinets with turning tape reels and blinking lights. label = cabinet plate. */
export const Mainframe: React.FC<EightiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.greyLight);
  const plate = label || 'SYSTEM/80';
  return (
    <svg width={520} height={420} viewBox="0 0 520 420">
      {[0, 1, 2].map((i) => {
        const x = 20 + i * 166;
        return (
          <g key={i}>
            <rect x={x} y={30} width={150} height={370} fill={body} {...ln()} />
            {i === 1 ? (
              <g>
                <rect x={x + 16} y={50} width={118} height={130} fill={C.board} {...ln(2.5)} />
                <Reel x={x + 48} y={100} r={24} t={t} speed={i % 2 ? -120 : 120} />
                <Reel x={x + 102} y={100} r={24} t={t} speed={120} />
                <rect x={x + 16} y={196} width={118} height={30} fill={C.paper} {...ln(2)} />
                <text x={x + 75} y={217} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.board} {...fitText(plate, 12, 108)}>
                  {plate}
                </text>
              </g>
            ) : (
              <g>
                {Array.from({length: 6}, (_, r) =>
                  Array.from({length: 5}, (_, k) => {
                    const on = rnd(i * 97 + r * 13 + k + Math.floor(t * 4) * 7) > 0.5;
                    return <circle key={`${r}-${k}`} cx={x + 27 + k * 24} cy={60 + r * 24} r={6} fill={on ? (k % 2 ? C.stamp : C.ink) : C.grey} stroke={C.board} strokeWidth={1.5} />;
                  }),
                )}
                <rect x={x + 16} y={210} width={118} height={16} fill={C.grey} {...ln(2)} />
              </g>
            )}
            {[0, 1, 2, 3, 4].map((r) => (
              <line key={`v${r}`} x1={x + 20} y1={260 + r * 24} x2={x + 130} y2={260 + r * 24} stroke={C.board} strokeWidth={2} />
            ))}
          </g>
        );
      })}
      <line x1={0} y1={402} x2={520} y2={402} {...ln()} />
    </svg>
  );
};

/** Generic portable cassette player with over-ear headphones and sound waves (no brand). colour = player. */
export const PersonalStereo: React.FC<EightiesProps> = ({colour}) => {
  const t = useT();
  const body = colourOf(colour, C.ink);
  return (
    <svg width={260} height={320} viewBox="0 0 260 320">
      {[0, 1, 2].map((i) => {
        const p = frac(t * 0.8 + i / 3);
        const r = 20 + p * 30;
        return (
          <g key={i} opacity={1 - p}>
            <path d={`M${44 - r * 0.4} ${60 - r} A ${r} ${r} 0 0 0 ${44 - r * 0.4} ${60 + r}`} fill="none" stroke={C.board} strokeWidth={3} />
            <path d={`M${216 + r * 0.4} ${60 - r} A ${r} ${r} 0 0 1 ${216 + r * 0.4} ${60 + r}`} fill="none" stroke={C.board} strokeWidth={3} />
          </g>
        );
      })}
      <path d="M60 70 Q60 10 130 10 Q200 10 200 70" fill="none" {...ln(STROKE * 2)} />
      <rect x={40} y={50} width={36} height={48} rx={14} fill={C.stamp} {...ln(2.5)} />
      <rect x={184} y={50} width={36} height={48} rx={14} fill={C.stamp} {...ln(2.5)} />
      <path d="M58 98 Q60 140 90 150" fill="none" stroke={C.board} strokeWidth={2} />
      <rect x={70} y={140} width={150} height={170} rx={12} fill={body} {...ln()} />
      <rect x={86} y={160} width={118} height={74} rx={6} fill={C.board} {...ln(2)} />
      <Reel x={118} y={197} r={15} t={t} />
      <Reel x={172} y={197} r={15} t={t} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={90 + i * 28} y={252} width={22} height={14} fill={i === 1 ? C.stamp : C.greyLight} stroke={C.board} strokeWidth={2} />
      ))}
      <rect x={86} y={280} width={118} height={12} fill={C.greyLight} stroke={C.board} strokeWidth={2} />
    </svg>
  );
};

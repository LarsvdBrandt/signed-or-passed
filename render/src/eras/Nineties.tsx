import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {c01, fitText, frac, useT} from '../illustrations/kit';

/**
 * Era pack: 1990s / dotcom. House style: flat shapes, live STROKE, brand colours only, faceless, no logos, no real
 * brands, no real browser or operating-system names (screens show generic windows and fictional addresses).
 */
export type NinetiesProps = {colour?: string; label?: string; pose?: string; [k: string]: any};

const ln = (w?: number) => ({
  stroke: C.board,
  strokeWidth: w ?? STROKE,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

const rnd = (n: number): number => frac(Math.sin(n * 12.9898) * 43758.5453);

/** Open-plan cubicle farm: ceiling tiles, fluorescent lights (one flickers), wall clock, motivational poster (label, default 'SYNERGY'), partitions with CRT monitors peeking over. */
export const CubicleBackdrop: React.FC<NinetiesProps> = ({label}) => {
  const t = useT();
  const poster = label || 'SYNERGY';
  const minute = (t * 60) % 360;
  const hour = (t * 5) % 360;
  const back: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const x = 60 + i * 370;
    const glow = rnd(i * 5 + Math.floor(t * 3)) > 0.5 ? 1 : 0.8;
    back.push(
      <g key={`b${i}`}>
        <rect x={x + 110} y={472} width={110} height={70} fill={C.greyLight} {...ln(2.5)} />
        <rect x={x + 120} y={480} width={90} height={56} fill={C.ink} opacity={glow} />
        <rect x={x} y={530} width={340} height={170} fill={C.grey} {...ln(2.5)} />
        <rect x={x} y={522} width={340} height={12} fill={C.greyLight} {...ln(2)} />
      </g>,
    );
  }
  const front: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 480;
    const bx = x + 140 + 60 * frac(t * 0.2 + i * 0.3);
    const by = 730 + 40 * Math.abs(Math.sin(t * 1.3 + i));
    front.push(
      <g key={`f${i}`}>
        <rect x={x + 120} y={690} width={200} height={130} fill={C.greyLight} {...ln()} />
        <rect x={x + 136} y={704} width={168} height={100} fill={C.board} />
        <rect x={bx} y={by} width={26} height={26} fill={i % 2 ? C.stamp : C.ink} />
        <rect x={x} y={800} width={440} height={300} fill={C.grey} {...ln()} />
        <rect x={x} y={790} width={440} height={16} fill={C.greyLight} {...ln(2.5)} />
        {i === 2 ? (
          <g>
            <rect x={x + 340} y={752} width={44} height={40} fill={C.paper} {...ln(2.5)} />
            <path d={`M${x + 384} ${762} q20 0 20 14 q0 14 -20 14`} fill="none" {...ln(2.5)} />
          </g>
        ) : null}
      </g>,
    );
  }
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <rect x={0} y={0} width={1920} height={120} fill={C.greyLight} />
        {Array.from({length: 9}, (_, i) => (
          <line key={`c${i}`} x1={i * 240} y1={0} x2={i * 240} y2={120} stroke={C.grey} strokeWidth={2} />
        ))}
        <line x1={0} y1={60} x2={1920} y2={60} stroke={C.grey} strokeWidth={2} />
        {[0, 1, 2, 3, 4].map((i) => {
          const on = i !== 3 || rnd(Math.floor(t * 10) + 3) > 0.3;
          return <rect key={`l${i}`} x={90 + i * 380} y={40} width={300} height={28} fill={on ? C.paper : C.grey} {...ln(2.5)} />;
        })}
        <line x1={0} y1={120} x2={1920} y2={120} {...ln()} />
        <rect x={0} y={640} width={1920} height={440} fill={C.greyLight} />
        <line x1={0} y1={640} x2={1920} y2={640} {...ln()} />
        <g transform="translate(1200 260)">
          <circle r={56} fill={C.paper} {...ln()} />
          <line x1={0} y1={0} x2={0} y2={-28} transform={`rotate(${hour.toFixed(1)})`} {...ln(5)} />
          <line x1={0} y1={0} x2={0} y2={-44} transform={`rotate(${minute.toFixed(1)})`} {...ln(3)} />
        </g>
        <rect x={1460} y={170} width={260} height={300} fill={C.board} {...ln()} />
        <rect x={1480} y={190} width={220} height={190} fill={C.ink} />
        <path d="M1480 380 L1560 280 L1610 330 L1650 290 L1700 380 Z" fill={C.paper} />
        <text x={1590} y={430} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={36} fill={C.paper} {...fitText(poster, 10, 220)}>
          {poster}
        </text>
        <rect x={260} y={200} width={420} height={200} fill={C.paper} {...ln()} />
        <text x={470} y={260} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={26} fill={C.board}>
          Q3 TARGETS
        </text>
        <polyline points="300,370 380,340 460,350 540,300 640,250" fill="none" stroke={C.stamp} strokeWidth={6} />
        {back}
        {front}
      </svg>
    </AbsoluteFill>
  );
};

/** Beige desktop PC: CRT monitor, desktop case with blinking LED and keyboard. label is typed into a window on screen. colour = case. */
export const BeigePC: React.FC<NinetiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.greyLight);
  const txt = label || 'HELLO WORLD';
  const n = Math.min(txt.length, Math.floor(t * 10));
  const cursor = Math.floor(t * 2.5) % 2 === 0 ? '_' : ' ';
  const fs = Math.min(22, 170 / Math.max(1, txt.length * 0.62));
  const led = Math.floor(t * 4) % 3 !== 0;
  return (
    <svg width={420} height={420} viewBox="0 0 420 420">
      <rect x={80} y={20} width={260} height={230} rx={14} fill={body} {...ln()} />
      <rect x={102} y={40} width={216} height={168} rx={18} fill={C.ink} {...ln(2.5)} />
      <rect x={122} y={64} width={176} height={110} fill={C.paper} stroke={C.board} strokeWidth={2} />
      <rect x={122} y={64} width={176} height={20} fill={C.board} />
      <rect x={278} y={68} width={12} height={12} fill={C.paper} />
      <text x={132} y={132} fontFamily={FONT_MONO} fontWeight={700} fontSize={fs} fill={C.board}>
        {txt.slice(0, n) + cursor}
      </text>
      <rect x={122} y={182} width={40} height={14} fill={C.stamp} />
      <circle cx={310} cy={228} r={6} fill={led ? C.ink : C.grey} />
      <rect x={180} y={250} width={60} height={22} fill={body} {...ln(2.5)} />
      <rect x={40} y={272} width={340} height={70} rx={6} fill={body} {...ln()} />
      <rect x={66} y={292} width={100} height={10} fill={C.board} />
      <circle cx={344} cy={306} r={7} fill={led ? C.stamp : C.grey} stroke={C.board} strokeWidth={2} />
      <path d="M50 404 L80 356 L340 356 L370 404 Z" fill={body} {...ln()} />
      {[0, 1, 2].map((r) =>
        Array.from({length: 10}, (_, k) => {
          const down = Math.floor(t * 10) % 30 === r * 10 + k;
          return <rect key={`${r}-${k}`} x={86 + r * 8 + k * 25} y={364 + r * 12 + (down ? 1 : 0)} width={20} height={9} fill={down ? C.grey : C.paper} stroke={C.board} strokeWidth={1.5} />;
        }),
      )}
    </svg>
  );
};

/** Dial-up modem: blinking status LEDs, label on the front (default '56K'), handshake noise drawn as a jittering line. colour = case. */
export const DialUpModem: React.FC<NinetiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.board);
  const txt = label || '56K';
  const step = Math.floor(t * 12);
  const pts: string[] = [];
  for (let i = 0; i <= 26; i++) {
    const amp = 6 + 22 * rnd(step * 31 + i);
    pts.push(`${50 + i * 10},${54 + (i % 2 ? -amp : amp)}`);
  }
  const leds = ['HS', 'AA', 'CD', 'OH', 'RD', 'SD'];
  return (
    <svg width={380} height={230} viewBox="0 0 380 230">
      <polyline points={pts.join(' ')} fill="none" stroke={C.stamp} strokeWidth={3} strokeLinejoin="round" />
      <path d="M50 110 L330 110 L350 190 L30 190 Z" fill={body} {...ln()} />
      <rect x={30} y={190} width={320} height={20} fill={C.grey} {...ln(2.5)} />
      <text x={70} y={160} fontFamily={FONT_HEAD} fontWeight={800} fontSize={34} fill={C.paper} {...fitText(txt, 6, 120)}>
        {txt}
      </text>
      {leds.map((name, i) => {
        const on = rnd(step * 7 + i * 3) > 0.45 || i === 2;
        return (
          <g key={name}>
            <circle cx={200 + i * 22} cy={150} r={6} fill={on ? (i % 2 ? C.stamp : C.ink) : C.grey} stroke={C.paper} strokeWidth={1.5} />
            <text x={200 + i * 22} y={176} textAnchor="middle" fontFamily={FONT_MONO} fontSize={10} fill={C.paper}>
              {name}
            </text>
          </g>
        );
      })}
      <path d="M350 150 q16 0 16 16 q0 10 -8 12 q-8 2 -6 12 q2 10 12 12" fill="none" stroke={C.board} strokeWidth={3} />
    </svg>
  );
};

/** CD-ROM spinning with flat light wedges; label printed on the disc (default 'INSTALL'). colour = label ring. */
export const CDROM: React.FC<NinetiesProps> = ({colour, label}) => {
  const t = useT();
  const ring = colourOf(colour, C.ink);
  const txt = label || 'INSTALL';
  const rot = (t * 200) % 360;
  return (
    <svg width={320} height={320} viewBox="0 0 320 320">
      <g transform={`rotate(${rot.toFixed(1)} 160 160)`}>
        <circle cx={160} cy={160} r={140} fill={C.greyLight} {...ln()} />
        <path d="M160 160 L160 20 A140 140 0 0 1 259 61 Z" fill={C.paper} opacity={0.8} />
        <path d="M160 160 L160 300 A140 140 0 0 1 61 259 Z" fill={C.paper} opacity={0.8} />
        <path d="M160 160 L299 160 A140 140 0 0 1 280 230 Z" fill={C.ink} opacity={0.25} />
        <circle cx={160} cy={160} r={140} fill="none" {...ln()} />
        <circle cx={160} cy={160} r={56} fill={ring} {...ln(2.5)} />
        <circle cx={160} cy={160} r={24} fill={C.paper} {...ln(2.5)} />
        <text x={160} y={96} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill={C.board} {...fitText(txt, 10, 150)}>
          {txt}
        </text>
      </g>
    </svg>
  );
};

/** Pager on a belt clip: LCD with scrolling label (default 'CALL ME 555-0199'), buzzes every two seconds. colour = body. */
export const Pager: React.FC<NinetiesProps> = ({colour, label}) => {
  const t = useT();
  const body = colourOf(colour, C.board);
  const txt = label || 'CALL ME 555-0199';
  const buzzing = frac(t * 0.5) < 0.25;
  const shake = buzzing ? 4 * Math.sin(t * 90) : 0;
  const tw = txt.length * 13.5;
  const sx = 232 - frac(t * 0.3) * (184 + tw);
  return (
    <svg width={280} height={210} viewBox="0 0 280 210">
      <defs>
        <clipPath id="era-pager-clip">
          <rect x={50} y={76} width={180} height={50} />
        </clipPath>
      </defs>
      {buzzing ? (
        <g>
          <path d="M18 90 q-10 20 0 40 M8 80 q-14 30 0 60" fill="none" stroke={C.board} strokeWidth={3} />
          <path d="M262 90 q10 20 0 40 M272 80 q14 30 0 60" fill="none" stroke={C.board} strokeWidth={3} />
        </g>
      ) : null}
      <g transform={`translate(${shake.toFixed(2)} 0)`}>
        <rect x={110} y={34} width={60} height={26} fill={C.grey} {...ln(2.5)} />
        <rect x={30} y={56} width={220} height={124} rx={22} fill={body} {...ln()} />
        <rect x={50} y={76} width={180} height={50} fill={C.greyLight} {...ln(2.5)} />
        <g clipPath="url(#era-pager-clip)">
          <text x={sx} y={110} fontFamily={FONT_MONO} fontWeight={700} fontSize={22} fill={C.board}>
            {txt}
          </text>
        </g>
        <rect x={70} y={142} width={50} height={18} rx={6} fill={C.grey} stroke={C.paper} strokeWidth={2} />
        <rect x={160} y={142} width={50} height={18} rx={6} fill={C.stamp} stroke={C.paper} strokeWidth={2} />
      </g>
    </svg>
  );
};

/** Early homepage in a generic browser window: address (label, default 'http://www.example.com'), UNDER CONSTRUCTION band, blinking NEW!, hit counter, loading bar. colour = title bar + loading bar. */
export const EarlyWebsite: React.FC<NinetiesProps> = ({colour, label}) => {
  const t = useT();
  const bar = colourOf(colour, C.ink);
  const addr = label || 'http://www.example.com';
  const off = frac(t * 0.8) * 40;
  const hits = String(1000 + Math.floor(t * 37)).padStart(6, '0');
  const blink = Math.floor(t * 3) % 2 === 0;
  const load = frac(t / 6);
  const stripes: React.ReactNode[] = [];
  for (let i = -2; i < 14; i++) {
    const x = 60 + i * 40 + off;
    stripes.push(<path key={i} d={`M${x} 240 L${x + 20} 240 L${x + 70} 190 L${x + 50} 190 Z`} fill={C.board} />);
  }
  return (
    <svg width={560} height={420} viewBox="0 0 560 420">
      <defs>
        <clipPath id="era-web-clip">
          <rect x={60} y={190} width={440} height={50} />
        </clipPath>
      </defs>
      <rect x={10} y={10} width={540} height={400} fill={C.paper} {...ln()} />
      <rect x={10} y={10} width={540} height={36} fill={bar} {...ln()} />
      <text x={24} y={34} fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.paper}>
        Welcome to my homepage
      </text>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={480 + i * 22} y={18} width={16} height={18} fill={C.greyLight} stroke={C.board} strokeWidth={2} />
      ))}
      <rect x={24} y={56} width={440} height={30} fill={C.paper} stroke={C.board} strokeWidth={2} />
      <text x={34} y={77} fontFamily={FONT_MONO} fontSize={16} fill={C.board} {...fitText(addr, 40, 420)}>
        {addr}
      </text>
      <rect x={474} y={56} width={62} height={30} fill={C.greyLight} stroke={C.board} strokeWidth={2} />
      <text x={505} y={77} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.board}>
        GO
      </text>
      <text x={280} y={160} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={44} fill={C.stamp}>
        WELCOME!
      </text>
      {blink ? (
        <g transform="translate(450 130) rotate(-12)">
          <rect x={-40} y={-20} width={80} height={36} fill={C.stamp} {...ln(2.5)} />
          <text x={0} y={7} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={20} fill={C.paper}>
            NEW!
          </text>
        </g>
      ) : null}
      <rect x={60} y={190} width={440} height={50} fill={C.stamp} />
      <g clipPath="url(#era-web-clip)">{stripes}</g>
      <rect x={60} y={190} width={440} height={50} fill="none" {...ln(2.5)} />
      <rect x={150} y={200} width={260} height={30} fill={C.paper} stroke={C.board} strokeWidth={2} />
      <text x={280} y={222} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.board}>
        UNDER CONSTRUCTION
      </text>
      <text x={280} y={290} textAnchor="middle" fontFamily={FONT_MONO} fontSize={16} fill={C.board}>
        VISITORS
      </text>
      {hits.split('').map((d, i) => (
        <g key={i}>
          <rect x={202 + i * 26} y={300} width={22} height={32} fill={C.board} />
          <text x={213 + i * 26} y={324} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.paper}>
            {d}
          </text>
        </g>
      ))}
      <rect x={24} y={372} width={512} height={22} fill={C.greyLight} stroke={C.board} strokeWidth={2} />
      <rect x={26} y={374} width={508 * load} height={18} fill={bar} />
    </svg>
  );
};

/** Server rack: units with vents and blinking LEDs; label = plate on the top unit (default 'WEB-01'). colour = units. */
export const ServerRack: React.FC<NinetiesProps> = ({colour, label}) => {
  const t = useT();
  const unit = colourOf(colour, C.greyLight);
  const plate = label || 'WEB-01';
  const step = Math.floor(t * 6);
  return (
    <svg width={300} height={500} viewBox="0 0 300 500">
      <rect x={30} y={20} width={240} height={460} fill={C.board} {...ln()} />
      <rect x={46} y={36} width={208} height={40} fill={C.paper} {...ln(2)} />
      <text x={150} y={63} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.board} {...fitText(plate, 14, 190)}>
        {plate}
      </text>
      {Array.from({length: 8}, (_, i) => {
        const y = 86 + i * 46;
        return (
          <g key={i}>
            <rect x={46} y={y} width={208} height={38} fill={unit} stroke={C.board} strokeWidth={2} />
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <line key={k} x1={60 + k * 12} y1={y + 9} x2={60 + k * 12} y2={y + 29} stroke={C.board} strokeWidth={2} />
            ))}
            {[0, 1, 2].map((k) => {
              const on = rnd(i * 7 + k * 3 + step * 11) > 0.4;
              return <circle key={`d${k}`} cx={200 + k * 16} cy={y + 19} r={5} fill={on ? (k === 2 ? C.stamp : C.ink) : C.grey} stroke={C.board} strokeWidth={1.5} />;
            })}
          </g>
        );
      })}
      <rect x={40} y={480} width={30} height={14} fill={C.board} />
      <rect x={230} y={480} width={30} height={14} fill={C.board} />
    </svg>
  );
};

/** Two-button computer mouse with a cable; the left button clicks with a ripple. colour = body. */
export const ComputerMouse: React.FC<NinetiesProps> = ({colour}) => {
  const t = useT();
  const body = colourOf(colour, C.greyLight);
  const p = frac(t * 0.8);
  const down = p < 0.12;
  const ripple = c01(p / 0.5);
  return (
    <svg width={220} height={300} viewBox="0 0 220 300">
      <path d="M110 92 Q110 40 150 30 Q190 20 200 2" fill="none" stroke={C.board} strokeWidth={4} />
      {ripple < 1 ? <circle cx={50} cy={70} r={8 + 30 * ripple} fill="none" stroke={C.stamp} strokeWidth={3} opacity={1 - ripple} /> : null}
      <path d="M60 150 Q60 90 110 90 Q160 90 160 150 L160 220 Q160 280 110 280 Q60 280 60 220 Z" fill={body} {...ln()} />
      <path d="M60 150 Q60 90 110 90 L110 160 L60 160 Z" fill={down ? C.grey : body} transform={`translate(0 ${down ? 3 : 0})`} {...ln(2.5)} />
      <line x1={110} y1={90} x2={110} y2={160} stroke={C.board} strokeWidth={2.5} />
      <line x1={60} y1={160} x2={160} y2={160} stroke={C.board} strokeWidth={2.5} />
    </svg>
  );
};

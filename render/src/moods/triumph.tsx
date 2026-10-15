import React from 'react';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {c01, easeInOut, fitText} from '../illustrations/kit';
import {Figure, PopText, ShotSvg, pop, snap, starPath, type ShotProps} from './kit';
import {Caption, Floor} from './parts';

/** Deterministic, endlessly looping confetti rain in brand colours (flat rectangles that flutter). */
const confettiBits = (t: number, n: number, start: number): React.ReactNode[] => {
  const cols = [C.ink, C.stamp, C.board, C.grey];
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const d = t - start - ((i * 37) % 100) / 100;
    if (d <= 0) continue;
    const speed = 320 + ((i * 53) % 220);
    const dd = d % (1160 / speed);
    const y = -40 + dd * speed;
    const x = ((i * 271) % 1920) + 40 * Math.sin(d * 3 + i);
    const rot = (i * 47 + d * 260) % 360;
    const flip = Math.cos(d * 7 + i);
    out.push(
      <g key={`c${i}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${flip.toFixed(3)} 1)`}>
        <rect x={-14} y={-7} width={28} height={14} fill={cols[i % cols.length]} stroke={C.board} strokeWidth={2} />
      </g>,
    );
  }
  return out;
};

/** A figure jumps for joy under a burst of confetti; a big pop word. */
export const Confetti: React.FC<ShotProps> = ({t, p}) => {
  const jump = Math.abs(Math.sin(t * 5)) * 40 * c01(t / 0.4);
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <Floor y={940} />
      <Figure x={960} y={940 - jump} s={1.1} colour={p.colour || 'ink'} arms="up" legs={jump / 80} />
      <PopText x={960} y={240} text={String(p.text || 'DEAL!')} t={t} at={0.3} size={180} />
      {confettiBits(t, 70, 0.2)}
      <Caption text={p.caption} t={t} />
    </ShotSvg>
  );
};

/** Night skyline, rockets rise and burst into flat line-fireworks (loops for long scenes). */
export const Fireworks: React.FC<ShotProps> = ({t, p}) => {
  const bursts: Array<[number, number, number, string]> = [
    [560, 300, 0.2, C.stamp],
    [1340, 240, 0.9, C.paper],
    [960, 420, 1.6, C.ink],
    [1600, 400, 2.3, C.stamp],
  ];
  const sky = bursts.map(([bx, by, at, col], b) => {
    if (t < at) return null;
    const d = (t - at) % 3.2;
    const rise = c01(d / 0.6);
    if (rise < 1) {
      const y = 1000 - (1000 - by) * snap(rise);
      return <line key={b} x1={bx} y1={(y + 60).toFixed(1)} x2={bx} y2={y.toFixed(1)} stroke={C.paper} strokeWidth={6} strokeLinecap="round" />;
    }
    const e = d - 0.6;
    const r = 240 * snap(e / 0.9);
    const op = 1 - c01((e - 0.7) / 0.9);
    if (op <= 0) return null;
    const drop = 30 * e * e;
    const rays = Array.from({length: 16}, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      const x1 = bx + r * 0.55 * Math.cos(a);
      const y1 = by + r * 0.55 * Math.sin(a) + drop;
      const x2 = bx + r * Math.cos(a);
      const y2 = by + r * Math.sin(a) + drop;
      return <line key={i} x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke={i % 2 === 0 ? col : C.greyLight} strokeWidth={10} strokeLinecap="round" />;
    });
    const core = 18 * (1 - c01(e / 0.4));
    return (
      <g key={b} opacity={op.toFixed(3)}>
        {rays}
        {core > 0 ? <circle cx={bx} cy={by} r={core.toFixed(1)} fill={C.paper} /> : null}
      </g>
    );
  });
  const city: Array<[number, number, number]> = [
    [0, 800, 240], [220, 700, 200], [400, 840, 260], [640, 740, 180], [800, 860, 220],
    [1000, 680, 240], [1220, 800, 200], [1400, 720, 220], [1600, 820, 180], [1760, 760, 160],
  ];
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.board} />
      {sky}
      {city.map(([x, y, w], i) => (
        <rect key={i} x={x} y={y} width={w} height={1080 - y} fill={C.grey} stroke={C.board} strokeWidth={STROKE} />
      ))}
      {city.map(([x, y, w], i) => (
        <rect key={`w${i}`} x={x + w * 0.3} y={y + 40} width={w * 0.15} height={30} fill={C.paper} opacity={0.5 + 0.5 * Math.abs(Math.sin(t * 0.7 + i))} />
      ))}
      <Caption text={p.text} t={t} at={1.2} fill={C.paper} />
    </ShotSvg>
  );
};

/** A rocket climbs an exponential growth curve, smoke puffs behind, the value follows it. */
export const RisingRocket: React.FC<ShotProps> = ({t, dur, p}) => {
  const span = Math.max(1.5, dur * 0.7);
  const k = easeInOut(c01((t - 0.3) / span));
  const P = (u: number): [number, number] => [220 + 1400 * u, 940 - 760 * Math.pow(u, 2.2)];
  const N = 48;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const [x, y] = P((k * i) / N);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const [rx, ry] = P(k);
  const [qx, qy] = P(Math.max(0, k - 0.01));
  const ang = k > 0.011 ? (Math.atan2(ry - qy, rx - qx) * 180) / Math.PI : -10;
  const flick = 0.5 + 0.5 * Math.sin(t * 40);
  const puffs = Array.from({length: 8}, (_, i) => {
    const u = k - 0.04 * (i + 1);
    if (u <= 0) return null;
    const [x, y] = P(u);
    return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={14 + i * 5} fill={C.greyLight} stroke={C.board} strokeWidth={3} opacity={(1 - i / 9).toFixed(3)} />;
  });
  const value = p.value === undefined || p.value === null ? '' : String(p.value);
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      {[300, 460, 620, 780].map((y) => (
        <line key={y} x1={200} y1={y} x2={1760} y2={y} stroke={C.greyLight} strokeWidth={4} />
      ))}
      <line x1={200} y1={160} x2={200} y2={960} stroke={C.board} strokeWidth={STROKE * 2} />
      <line x1={200} y1={960} x2={1760} y2={960} stroke={C.board} strokeWidth={STROKE * 2} />
      <polyline points={pts.join(' ')} fill="none" stroke={colourOf(p.colour, C.ink)} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
      {puffs}
      <g transform={`translate(${rx.toFixed(1)} ${ry.toFixed(1)}) rotate(${ang.toFixed(1)})`}>
        <path d={`M-50 -16 L-50 16 L${(-90 - 24 * flick).toFixed(1)} 0 Z`} fill={C.stamp} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        <path d="M-50 -26 L-80 -52 L-28 -26 Z" fill={C.stamp} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        <path d="M-50 26 L-80 52 L-28 26 Z" fill={C.stamp} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        <path d="M64 0 L20 -26 L-50 -26 L-50 26 L20 26 Z" fill={C.paper} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        <circle cx={0} cy={0} r={11} fill={C.ink} stroke={C.board} strokeWidth={3} />
      </g>
      {value ? (
        <text x={(rx + 70).toFixed(1)} y={(ry - 50).toFixed(1)} fontFamily={FONT_MONO} fontSize={56} fill={C.ink} opacity={c01(k / 0.2)} {...fitText(value, 12, 420)}>
          {value}
        </text>
      ) : null}
      <PopText x={760} y={200} text={String(p.text || 'TO THE MOON')} t={t} at={0.3 + span * 0.85} size={120} />
    </ShotSvg>
  );
};

/** A trophy pops up on a plinth, sun rays turn behind it, sparkles twinkle. */
export const TrophyShine: React.FC<ShotProps> = ({t, p}) => {
  const rays = Array.from({length: 12}, (_, i) => {
    const a0 = ((i * 30 + t * 18) * Math.PI) / 180;
    const a1 = a0 + (15 * Math.PI) / 180;
    const R = 1400;
    return (
      <path
        key={i}
        d={`M960 500 L${(960 + R * Math.cos(a0)).toFixed(1)} ${(500 + R * Math.sin(a0)).toFixed(1)} L${(960 + R * Math.cos(a1)).toFixed(1)} ${(500 + R * Math.sin(a1)).toFixed(1)} Z`}
        fill={C.greyLight}
      />
    );
  });
  const cup = colourOf(p.colour, C.stamp);
  const s = pop(t / 0.6);
  const plinth = String(p.text || '#1');
  const sparkles: Array<[number, number]> = [[700, 260], [1230, 300], [640, 620], [1290, 640], [960, 140], [1120, 420]];
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      {rays}
      <Floor y={800} />
      <g transform={`translate(960 520) scale(${s.toFixed(3)})`}>
        <path d="M-150 -180 Q-270 -170 -235 -80 Q-210 -30 -120 -40" fill="none" stroke={C.board} strokeWidth={18} strokeLinecap="round" />
        <path d="M150 -180 Q270 -170 235 -80 Q210 -30 120 -40" fill="none" stroke={C.board} strokeWidth={18} strokeLinecap="round" />
        <path d="M-160 -220 L160 -220 Q150 -20 0 30 Q-150 -20 -160 -220 Z" fill={cup} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        <path d="M-115 -200 L-82 -200 L-100 -70 L-125 -95 Z" fill={C.paper} opacity={0.6} />
        <rect x={-25} y={30} width={50} height={90} fill={cup} stroke={C.board} strokeWidth={STROKE} />
        <rect x={-120} y={120} width={240} height={50} fill={cup} stroke={C.board} strokeWidth={STROKE} />
        <rect x={-180} y={170} width={360} height={110} fill={C.board} stroke={C.board} strokeWidth={STROKE} />
        <text x={0} y={248} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={72} fill={C.paper} {...fitText(plinth, 10, 320)}>
          {plinth}
        </text>
      </g>
      {sparkles.map(([x, y], i) => {
        const sc = Math.max(0, Math.sin(t * 4 + i * 1.3)) * c01((t - 0.4) / 0.3);
        return <path key={i} d={starPath(40, 14, 4)} transform={`translate(${x} ${y}) scale(${sc.toFixed(3)})`} fill={C.paper} stroke={C.board} strokeWidth={3} />;
      })}
      <Caption text={p.caption} t={t} at={0.8} />
    </ShotSvg>
  );
};

/** Two rows of faceless figures cheer and bounce, confetti and pop words. */
export const CheeringCrowd: React.FC<ShotProps> = ({t, p}) => {
  const cols = ['ink', 'stamp', 'board', 'grey'];
  const back = Array.from({length: 8}, (_, i) => {
    const bounce = Math.max(0, Math.sin(t * 5 + i * 1.3)) * 25;
    return <Figure key={`b${i}`} x={260 + i * 200} y={800 - bounce} s={0.55} colour="grey" arms={Math.sin(t * 2.5 + i) > 0 ? 'up' : 'out'} />;
  });
  const front = Array.from({length: 9}, (_, i) => {
    const bounce = Math.max(0, Math.sin(t * 6 + i * 0.9)) * 35;
    const s = 0.75 + ((i * 7) % 3) * 0.08;
    return <Figure key={`f${i}`} x={160 + i * 200} y={1000 - bounce} s={s} colour={cols[i % cols.length]} arms={Math.sin(t * 3 + i) > -0.4 ? 'up' : 'out'} />;
  });
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect x={0} y={1000} width={1920} height={80} fill={C.greyLight} />
      {back}
      {front}
      <Floor y={1000} />
      {confettiBits(t, 40, 0.5)}
      <PopText x={480} y={300} text="YES!" t={t} at={0.4} size={150} rot={-8} />
      <PopText x={1320} y={240} text={String(p.text || 'HOORAY!')} t={t} at={0.8} size={150} rot={6} fill={C.ink} />
      <Caption text={p.caption} t={t} at={1.2} y={1060} />
    </ShotSvg>
  );
};

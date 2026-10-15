import React from 'react';
import {C, FONT_HEAD, STROKE, colourOf} from '../constants';
import {c01, easeInOut, fitText, frac} from '../illustrations/kit';
import {Figure, ShotSvg, TEAR, type ShotProps} from './kit';
import {Caption, Cloud, Floor} from './parts';

/** A grey cloud follows a slumped figure and rains only on them; a puddle grows. */
export const RainCloud: React.FC<ShotProps> = ({t, p}) => {
  const fx = 960;
  const floor = 960;
  const cx = fx + 24 * Math.sin(t * 0.8);
  const cy = 250 + 8 * Math.sin(t * 1.3);
  const top = cy + 80;
  const drops = Array.from({length: 22}, (_, i) => {
    const ph = frac(t * 1.4 + i * 0.173);
    const x = cx - 200 + ((i * 53) % 400);
    const y = top + ph * (floor - top);
    return <path key={i} d={TEAR} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(0.4)`} fill={C.ink} stroke={C.board} strokeWidth={STROKE / 0.4} strokeLinejoin="round" />;
  });
  const rx = 110 + 150 * c01(t / 3);
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <Floor y={floor} />
      <ellipse cx={fx} cy={floor + 4} rx={rx} ry={16} fill={C.ink} opacity={0.3} />
      <Figure x={fx} y={floor} s={1.1} colour={p.colour || 'grey'} rot={-3} squash={0.05} />
      {drops}
      <Cloud x={cx} y={cy} />
      <Caption text={p.text} t={t} />
    </ShotSvg>
  );
};

/** A potted flower droops; petals drop one by one. */
export const WiltingPlant: React.FC<ShotProps> = ({t, dur, p}) => {
  const k = easeInOut(c01((t - 0.3) / Math.max(1, dur * 0.6)));
  const bx = 960;
  const by = 690;
  const a = ((-90 + 125 * k) * Math.PI) / 180;
  const len = 300 - 50 * k;
  const tx = bx + len * Math.cos(a);
  const ty = by + len * Math.sin(a);
  const qx = bx + 30 * k;
  const qy = by - 210 + 70 * k;
  const mx = 0.25 * bx + 0.5 * qx + 0.25 * tx;
  const my = 0.25 * by + 0.5 * qy + 0.25 * ty;
  const pot = colourOf(p.colour, C.ink);
  const petals = Array.from({length: 6}, (_, i) => {
    const ang = i * 60 + 90 * k;
    const r = (ang * Math.PI) / 180;
    const d = t - (1.4 + i * 0.45);
    let px = tx + 40 * Math.cos(r);
    let py = ty + 40 * Math.sin(r);
    let rot = ang;
    if (i % 2 === 0 && d > 0) {
      px += 70 * Math.sin(d * 2.5);
      py = Math.min(938, py + 240 * d);
      rot = ang + 80 * d;
    }
    return <ellipse key={i} cx={px.toFixed(1)} cy={py.toFixed(1)} rx={30} ry={15} transform={`rotate(${rot.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})`} fill={C.stamp} stroke={C.board} strokeWidth={STROKE} />;
  });
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <Floor y={950} />
      <path d={`M${bx} ${by} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`} fill="none" stroke={C.board} strokeWidth={12} strokeLinecap="round" />
      <ellipse cx={(mx - 40).toFixed(1)} cy={my.toFixed(1)} rx={50} ry={20} transform={`rotate(${(-30 + 70 * k).toFixed(1)} ${(mx - 40).toFixed(1)} ${my.toFixed(1)})`} fill={C.grey} stroke={C.board} strokeWidth={STROKE} />
      <ellipse cx={(mx + 40).toFixed(1)} cy={(my + 10).toFixed(1)} rx={50} ry={20} transform={`rotate(${(30 + 40 * k).toFixed(1)} ${(mx + 40).toFixed(1)} ${(my + 10).toFixed(1)})`} fill={C.grey} stroke={C.board} strokeWidth={STROKE} />
      <path d="M830 690 L1090 690 L1050 950 L870 950 Z" fill={pot} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
      <rect x={810} y={670} width={300} height={44} fill={pot} stroke={C.board} strokeWidth={STROKE} />
      {petals}
      <circle cx={tx.toFixed(1)} cy={ty.toFixed(1)} r={26} fill={C.board} stroke={C.board} strokeWidth={STROKE} />
      <Caption text={p.text} t={t} />
    </ShotSvg>
  );
};

/** Shop door: the hanging sign flips from OPEN to CLOSED and swings; the lights inside go out. */
export const ClosedSign: React.FC<ShotProps> = ({t, p}) => {
  const flipAt = 1.0;
  const k = c01((t - flipAt) / 0.5);
  const sx = Math.cos(Math.PI * k);
  const back = sx < 0;
  const d = t - flipAt - 0.5;
  const swing = d > 0 ? 7 * Math.sin(d * 6) * Math.exp(-d * 1.5) : 0;
  const front = String(p.front || 'OPEN');
  const closed = String(p.text || 'CLOSED');
  const shop = String(p.shop || 'THE SHOP');
  const dark = c01((t - flipAt - 0.6) / 0.4);
  const word = back ? closed : front;
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect x={360} y={120} width={1200} height={860} fill={C.greyLight} stroke={C.board} strokeWidth={STROKE} />
      <rect x={360} y={120} width={1200} height={120} fill={colourOf(p.colour, C.ink)} stroke={C.board} strokeWidth={STROKE} />
      <text x={960} y={205} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={72} fill={C.paper} {...fitText(shop, 20, 1100)}>
        {shop}
      </text>
      <rect x={420} y={300} width={300} height={500} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
      <rect x={1200} y={300} width={300} height={500} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
      <rect x={420} y={300} width={300} height={500} fill={C.grey} opacity={dark} />
      <rect x={1200} y={300} width={300} height={500} fill={C.grey} opacity={dark} />
      <rect x={780} y={300} width={360} height={680} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
      <rect x={820} y={560} width={280} height={300} fill={C.greyLight} stroke={C.board} strokeWidth={STROKE} />
      <rect x={820} y={560} width={280} height={300} fill={C.grey} opacity={dark} />
      <circle cx={1105} cy={900} r={12} fill={C.board} />
      <g transform={`rotate(${swing.toFixed(2)} 960 360)`}>
        <path d="M960 360 L830 440 M960 360 L1090 440" stroke={C.board} strokeWidth={4} fill="none" />
        <circle cx={960} cy={360} r={9} fill={C.board} />
        <g transform={`translate(960 510) scale(${Math.max(0.02, Math.abs(sx)).toFixed(3)} 1)`}>
          <rect x={-170} y={-70} width={340} height={140} rx={10} fill={back ? C.stamp : C.paper} stroke={C.board} strokeWidth={STROKE} />
          <text x={0} y={24} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={72} fill={back ? C.paper : C.ink} {...fitText(word, 8, 300)}>
            {word}
          </text>
        </g>
      </g>
      <Floor y={980} />
    </ShotSvg>
  );
};

/** Night office tower: the windows go dark one by one, the last light stays on longest. */
export const LightsOut: React.FC<ShotProps> = ({t, dur, p}) => {
  const cols = 6;
  const rows = 7;
  const n = cols * rows;
  const last = 23;
  const span = Math.max(1.2, dur * 0.55);
  const lastOff = Math.max(span + 0.6, dur * 0.82);
  const wins: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const offAt = i === last ? lastOff : 0.3 + (((i * 7919) % 97) / 97) * span;
    const on = t < offAt;
    wins.push(<rect key={i} x={640 + c * 105} y={260 + r * 100} width={70} height={60} fill={on ? (i === last ? colourOf(p.colour, C.paper) : C.paper) : C.board} stroke={C.board} strokeWidth={3} />);
  }
  const stars: Array<[number, number]> = [[160, 140], [380, 260], [520, 90], [1500, 120], [1720, 300], [1840, 80], [260, 520], [1640, 520]];
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.board} />
      {stars.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3 + (i % 2)} fill={C.paper} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 1.7 + i))} />
      ))}
      <circle cx={1560} cy={200} r={70} fill={C.paper} />
      <circle cx={1592} cy={176} r={62} fill={C.board} />
      <rect x={600} y={200} width={680} height={800} fill={C.grey} stroke={C.greyLight} strokeWidth={STROKE} />
      <rect x={880} y={140} width={120} height={60} fill={C.grey} stroke={C.greyLight} strokeWidth={STROKE} />
      {wins}
      <Floor y={1000} stroke={C.grey} />
      <Caption text={p.text} t={t} at={lastOff + 0.2} fill={C.paper} />
    </ShotSvg>
  );
};

const OfficeDesk: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <line x1={-140} y1={-100} x2={-140} y2={0} stroke={C.board} strokeWidth={6} />
    <line x1={140} y1={-100} x2={140} y2={0} stroke={C.board} strokeWidth={6} />
    <rect x={-160} y={-120} width={320} height={20} fill={C.greyLight} stroke={C.board} strokeWidth={STROKE} />
    <rect x={-10} y={-140} width={20} height={20} fill={C.grey} />
    <rect x={-60} y={-230} width={120} height={90} fill={C.board} stroke={C.board} strokeWidth={STROKE} />
  </g>
);

const OfficeChair: React.FC<{x: number; y: number; s: number; w?: number}> = ({x, y, s, w = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <line x1={0} y1={-70} x2={0} y2={-10} stroke={C.board} strokeWidth={8} />
    <line x1={-40} y1={0} x2={40} y2={0} stroke={C.board} strokeWidth={8} strokeLinecap="round" />
    <g transform={`scale(${w.toFixed(3)} 1)`}>
      <rect x={-50} y={-90} width={100} height={22} rx={8} fill={C.ink} stroke={C.board} strokeWidth={STROKE} />
      <rect x={-45} y={-200} width={90} height={110} rx={14} fill={C.ink} stroke={C.board} strokeWidth={STROKE} />
    </g>
  </g>
);

/** Empty office after the layoffs: a chair still spinning down, a flickering ceiling light, drifting dust. */
export const EmptyOffice: React.FC<ShotProps> = ({t, p}) => {
  const theta = 10 * (1 - Math.exp(-t * 0.8));
  const w = Math.cos(theta * 2);
  const flick = Math.sin(t * 23) > 0.6 || Math.sin(t * 7.3) > 0.9 ? 0.04 : 0.16;
  const dust = Array.from({length: 14}, (_, i) => {
    const x = 200 + ((i * 137) % 1500) + 30 * Math.sin(t * 0.7 + i);
    const y = 260 + ((i * 89) % 520) - 12 * t;
    return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={3 + (i % 3)} fill={C.grey} opacity={0.6} />;
  });
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect x={0} y={760} width={1920} height={320} fill={C.greyLight} />
      <line x1={0} y1={760} x2={1920} y2={760} stroke={C.board} strokeWidth={STROKE} />
      <rect x={1340} y={200} width={360} height={260} fill={C.greyLight} stroke={C.board} strokeWidth={STROKE} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={i} x1={1340} y1={230 + i * 34} x2={1700} y2={230 + i * 34} stroke={C.board} strokeWidth={3} />
      ))}
      <line x1={960} y1={0} x2={960} y2={60} stroke={C.board} strokeWidth={4} />
      <path d="M900 90 L920 60 L1000 60 L1020 90 Z" fill={C.board} />
      <polygon points="905,92 1015,92 1300,760 620,760" fill={C.paper} opacity={flick * 2} />
      <polygon points="905,92 1015,92 1300,760 620,760" fill={C.board} opacity={0.18 - flick} />
      <OfficeDesk x={420} y={770} s={0.7} />
      <OfficeDesk x={1500} y={770} s={0.7} />
      <OfficeChair x={560} y={780} s={0.7} />
      <OfficeDesk x={760} y={930} s={1} />
      <rect x={650} y={720} width={130} height={90} fill={C.greyLight} stroke={C.board} strokeWidth={STROKE} />
      <path d="M650 720 L620 690 M780 720 L810 690" stroke={C.board} strokeWidth={STROKE} />
      <OfficeChair x={1180} y={980} s={1.1} w={w} />
      {dust}
      <Caption text={p.text} t={t} />
    </ShotSvg>
  );
};

/** A single leaf drifts down from a bare branch and settles on the ground. */
export const FallingLeaf: React.FC<ShotProps> = ({t, dur, p}) => {
  const floor = 960;
  const tl = Math.max(1.5, dur * 0.8);
  const k = c01(t / tl);
  const amp = 1 - c01((t - tl + 0.2) / 0.4);
  const x = 620 + 640 * k + 110 * Math.sin(t * 2.4) * amp;
  const y = 160 + (floor - 24 - 160) * easeInOut(k);
  const rot = 50 * Math.sin(t * 2.4) * amp + 80 * (1 - amp);
  const leaf = colourOf(p.colour, C.stamp);
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <rect x={110} y={0} width={90} height={floor} fill={C.board} />
      <path d="M190 150 Q420 90 720 120 M420 108 L500 40 M600 116 L660 60" fill="none" stroke={C.board} strokeWidth={16} strokeLinecap="round" />
      <Floor y={floor} />
      {[[1500, 950, 20], [1620, 952, -30], [380, 952, 60]].map(([lx, ly, lr], i) => (
        <ellipse key={i} cx={lx} cy={ly} rx={34} ry={12} transform={`rotate(${lr / 6} ${lx} ${ly})`} fill={C.grey} stroke={C.board} strokeWidth={STROKE} />
      ))}
      <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})`}>
        <path d="M0 -44 Q34 -10 0 44 Q-34 -10 0 -44 Z" fill={leaf} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        <path d="M0 -40 L0 56" stroke={C.board} strokeWidth={3} />
      </g>
      <Caption text={p.text} t={t} at={tl} />
    </ShotSvg>
  );
};

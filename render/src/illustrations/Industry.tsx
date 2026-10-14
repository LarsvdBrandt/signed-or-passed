import React from 'react';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import type {IllProps} from './People';
import {Smoke, Waves, Wheel, c01, easeInOut, easeOut, fitText, frac, pointAt, useT} from './kit';

const S = STROKE;

/** Factory with a loading hall: conveyor belt carrying crates, smoking chimney. label = company name. */
export const Factory: React.FC<IllProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.greyLight);
  const crates = [C.stamp, C.ink, C.paper, C.greyLight].map((fill, k) => {
    const pos = frac(t * 0.25 + k / 4);
    const o = Math.min(1, pos * 8, (1 - pos) * 8);
    return <rect key={k} x={50 + pos * 400} y={308} width={40} height={36} fill={fill} stroke={C.paper} strokeWidth={2} opacity={o} />;
  });
  const ticks = Array.from({length: 10}, (_, i) => {
    const x = 54 + frac(t * 0.25 + i / 10) * 412;
    return <line key={i} x1={x} y1={348} x2={x} y2={362} stroke={C.board} strokeWidth={2} />;
  });
  return (
    <svg width={520} height={400} viewBox="0 0 520 400" overflow="visible">
      <Smoke x={418} y={36} t={t} n={5} dx={60} rise={150} size={16} />
      <rect x={400} y={40} width={36} height={150} fill={C.stamp} stroke={C.board} strokeWidth={S} />
      <rect x={400} y={60} width={36} height={14} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <polygon points="20,390 20,190 90,140 90,190 160,140 160,190 230,140 230,190 300,140 300,190 500,190 500,390" fill={c} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      <rect x={150} y={206} width={220} height={44} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <text x={260} y={237} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={24} fill={C.board} {...fitText(label, 15, 200)}>
        {label || 'FACTORY'}
      </text>
      <rect x={40} y={268} width={440} height={112} fill={C.board} stroke={C.board} strokeWidth={S} />
      {crates}
      <rect x={50} y={346} width={420} height={18} rx={9} fill={C.grey} stroke={C.paper} strokeWidth={2} />
      {ticks}
    </svg>
  );
};

/** Shop front with striped awning, swinging OPEN sign and a door that opens. */
export const StoreFront: React.FC<IllProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.ink);
  const open = easeOut((t - 0.8) / 0.7);
  const doorW = 70 * (1 - 0.75 * open);
  const sway = Math.sin(t * 2.2) * 6;
  return (
    <svg width={300} height={400} viewBox="0 0 300 400" overflow="visible">
      <rect x={20} y={60} width={260} height={330} fill={c} stroke={C.board} strokeWidth={S} />
      <rect x={30} y={70} width={240} height={50} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <text x={150} y={105} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} fill={C.board} {...fitText(label, 12, 220)}>
        {label || 'STORE'}
      </text>
      {Array.from({length: 8}, (_, i) => (
        <g key={i}>
          <rect x={14 + i * 34} y={130} width={34} height={40} fill={i % 2 ? C.paper : C.stamp} stroke={C.board} strokeWidth={S} />
          <path d={`M${14 + i * 34} 170 a17 14 0 0 0 34 0 z`} fill={i % 2 ? C.paper : C.stamp} stroke={C.board} strokeWidth={S} />
        </g>
      ))}
      <rect x={40} y={200} width={120} height={120} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <rect x={56} y={282} width={26} height={38} fill={C.greyLight} stroke={C.board} strokeWidth={2} />
      <rect x={90} y={268} width={26} height={52} fill={C.stamp} stroke={C.board} strokeWidth={2} />
      <rect x={124} y={290} width={26} height={30} fill={C.ink} stroke={C.board} strokeWidth={2} />
      <g transform={`rotate(${sway} 100 204)`}>
        <line x1={86} y1={204} x2={100} y2={222} stroke={C.board} strokeWidth={2} />
        <line x1={114} y1={204} x2={100} y2={222} stroke={C.board} strokeWidth={2} />
        <rect x={68} y={222} width={64} height={28} fill={C.ink} stroke={C.board} strokeWidth={2} />
        <text x={100} y={242} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.paper}>
          OPEN
        </text>
      </g>
      <rect x={180} y={200} width={80} height={190} fill={C.board} />
      <rect x={185} y={205} width={doorW} height={185} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <circle cx={185 + doorW - 10} cy={300} r={5} fill={C.board} />
      <rect x={170} y={388} width={100} height={8} fill={C.grey} stroke={C.board} strokeWidth={2} />
    </svg>
  );
};

/** Warehouse with a roll-up door that opens on stacked crates. */
export const Warehouse: React.FC<IllProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.greyLight);
  const doorH = 120 * (1 - 0.8 * easeOut((t - 0.6) / 1.2));
  const slats: React.ReactNode[] = [];
  for (let y = 202; y < 190 + doorH; y += 12) slats.push(<line key={y} x1={150} y1={y} x2={330} y2={y} stroke={C.grey} strokeWidth={2} />);
  return (
    <svg width={480} height={320} viewBox="0 0 480 320" overflow="visible">
      <path d="M20 310 L20 120 Q240 30 460 120 L460 310 Z" fill={c} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      <rect x={140} y={110} width={200} height={40} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <text x={240} y={138} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} letterSpacing={2} fill={C.board} {...fitText(label, 15, 180)}>
        {label || 'WAREHOUSE'}
      </text>
      <rect x={50} y={200} width={60} height={40} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <rect x={370} y={200} width={60} height={40} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <rect x={150} y={190} width={180} height={120} fill={C.board} />
      <rect x={164} y={262} width={46} height={46} fill={C.stamp} stroke={C.paper} strokeWidth={2} />
      <rect x={214} y={262} width={46} height={46} fill={C.greyLight} stroke={C.paper} strokeWidth={2} />
      <rect x={189} y={216} width={46} height={46} fill={C.ink} stroke={C.paper} strokeWidth={2} />
      <rect x={270} y={250} width={46} height={58} fill={C.greyLight} stroke={C.paper} strokeWidth={2} />
      <rect x={150} y={190} width={180} height={doorH} fill={C.paper} stroke={C.board} strokeWidth={S} />
      {slats}
    </svg>
  );
};

/** Classical bank: pediment, columns, steps, waving flag. label on the frieze. */
export const Bank: React.FC<IllProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.paper);
  const w1 = Math.sin(t * 4) * 6;
  return (
    <svg width={440} height={400} viewBox="0 0 440 400" overflow="visible">
      <line x1={220} y1={62} x2={220} y2={8} stroke={C.board} strokeWidth={4} />
      <path d={`M220 10 Q245 ${10 + w1} 270 14 L270 38 Q245 ${34 + w1} 220 36 Z`} fill={C.stamp} stroke={C.board} strokeWidth={2} />
      <polygon points="30,140 220,60 410,140" fill={c} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      <circle cx={220} cy={112} r={16} fill={C.ink} stroke={C.board} strokeWidth={S} />
      <rect x={40} y={140} width={360} height={34} fill={C.board} />
      <text x={220} y={164} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} letterSpacing={4} fill={C.paper} {...fitText(label, 20, 320)}>
        {label || 'BANK'}
      </text>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={62 + i * 75} y={174} width={36} height={156} fill={c} stroke={C.board} strokeWidth={S} />
          <rect x={56 + i * 75} y={174} width={48} height={12} fill={c} stroke={C.board} strokeWidth={S} />
          <line x1={74 + i * 75} y1={190} x2={74 + i * 75} y2={326} stroke={C.greyLight} strokeWidth={3} />
          <line x1={86 + i * 75} y1={190} x2={86 + i * 75} y2={326} stroke={C.greyLight} strokeWidth={3} />
        </g>
      ))}
      <rect x={30} y={330} width={380} height={20} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
      <rect x={15} y={350} width={410} height={20} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
      <rect x={0} y={370} width={440} height={22} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
    </svg>
  );
};

type Row = {label: string; value: number};
const normRows = (rows: any): Row[] => {
  const def: Row[] = [
    {label: 'ALPHA', value: 102.4},
    {label: 'BRAVO', value: 48.1},
    {label: 'CHARLIE', value: 230.9},
    {label: 'DELTA', value: 12.75},
  ];
  if (!Array.isArray(rows) || rows.length === 0) return def;
  return rows.slice(0, 5).map((r: any, i: number) => (typeof r === 'string' ? {label: r, value: def[i % 4].value} : {label: String(r.label ?? ''), value: Number(r.value ?? 100)}));
};

/** Stock exchange board: tickers with numbers that tick, plus a scrolling tape. props.rows = [{label, value}] */
export const StockBoard: React.FC<IllProps> = (props) => {
  const t = useT();
  const id = 'sb' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const rows = normRows(props.rows);
  const tq = Math.floor(t * 6) / 6;
  const tape = rows.map((r, i) => `${r.label} ${Math.sin(i * 2.1) > 0 ? '▲' : '▼'} ${Math.abs(Math.sin(i * 2.1) * 3).toFixed(1)}%`).join('    ');
  return (
    <svg width={560} height={320} viewBox="0 0 560 320" overflow="visible">
      <defs>
        <clipPath id={id}>
          <rect x={0} y={280} width={560} height={40} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={560} height={320} fill={C.board} stroke={C.board} strokeWidth={S} />
      <text x={24} y={36} fontFamily={FONT_MONO} fontWeight={700} fontSize={20} letterSpacing={4} fill={C.greyLight}>
        {props.label || 'MARKET'}
      </text>
      <line x1={0} y1={50} x2={560} y2={50} stroke={C.grey} strokeWidth={2} />
      {rows.map((r, i) => {
        const v = r.value * (1 + 0.02 * Math.sin(tq * 1.3 + i * 1.7) + 0.01 * Math.sin(tq * 3.1 + i));
        const d = v / r.value - 1;
        const up = d >= 0;
        const y = 86 + i * 44;
        return (
          <g key={i}>
            <text x={24} y={y} fontFamily={FONT_MONO} fontWeight={700} fontSize={24} fill={C.paper}>
              {r.label}
            </text>
            <text x={380} y={y} textAnchor="end" fontFamily={FONT_MONO} fontSize={24} fill={C.paper}>
              {v.toFixed(2)}
            </text>
            <text x={536} y={y} textAnchor="end" fontFamily={FONT_MONO} fontWeight={700} fontSize={22} fill={up ? C.ink : C.stamp}>
              {(up ? '▲ ' : '▼ ') + Math.abs(d * 100).toFixed(1) + '%'}
            </text>
          </g>
        );
      })}
      <rect x={0} y={280} width={560} height={40} fill={C.ink} stroke={C.board} strokeWidth={S} />
      <g clipPath={`url(#${id})`}>
        <text x={560 - frac(t * 0.12) * 1400} y={307} fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.paper}>
          {tape + '    ' + tape}
        </text>
      </g>
    </svg>
  );
};

const sail = (x: number, top: number, bot: number, hw: number, b: number) => {
  const mid = (top + bot) / 2;
  return `M${x - hw} ${top} L${x + hw} ${top} Q${x + hw + b} ${mid} ${x + hw} ${bot} L${x - hw} ${bot} Q${x - hw + b} ${mid} ${x - hw} ${top} Z`;
};

/** Sailing ship (VOC era) bobbing on animated waves. label = name on the stern. */
export const Ship: React.FC<IllProps> = ({label}) => {
  const t = useT();
  const bob = Math.sin(t * 1.6) * 6;
  const rock = Math.sin(t * 1.1) * 3;
  const b = 14 + 4 * Math.sin(t * 2);
  const fw = Math.sin(t * 5) * 5;
  return (
    <svg width={440} height={400} viewBox="0 0 440 400" overflow="visible">
      <g transform={`translate(0 ${bob}) rotate(${rock} 220 300)`}>
        <line x1={40} y1={290} x2={0} y2={256} stroke={C.board} strokeWidth={6} strokeLinecap="round" />
        {[
          [140, 80],
          [240, 50],
          [330, 120],
        ].map(([x, top]) => (
          <line key={x} x1={x} y1={300} x2={x} y2={top} stroke={C.board} strokeWidth={6} />
        ))}
        <path d={sail(140, 100, 170, 45, b)} fill={C.paper} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d={sail(140, 180, 250, 48, b)} fill={C.paper} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d={sail(240, 70, 150, 55, b)} fill={C.paper} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d={sail(240, 160, 240, 58, b)} fill={C.paper} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d={sail(330, 140, 220, 35, b)} fill={C.paper} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d={`M240 50 L284 ${58 + fw} L240 66 Z`} fill={C.stamp} stroke={C.board} strokeWidth={2} />
        <rect x={330} y={250} width={80} height={42} fill={C.board} stroke={C.board} strokeWidth={S} />
        <path d="M40 290 L410 290 L380 350 Q220 370 80 350 Z" fill={C.board} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <line x1={50} y1={310} x2={400} y2={310} stroke={C.stamp} strokeWidth={5} />
        {[100, 150, 200, 250, 300].map((x) => (
          <rect key={x} x={x} y={320} width={14} height={12} fill={C.paper} />
        ))}
        {label ? (
          <text x={370} y={278} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.paper} {...fitText(label, 9, 72)}>
            {label}
          </text>
        ) : null}
      </g>
      <Waves w={440} y={340} t={t} h={400} />
    </svg>
  );
};

/** Container ship with stacked containers, smoking funnel, on waves. label = name on the hull. */
export const ContainerShip: React.FC<IllProps> = ({label}) => {
  const t = useT();
  const bob = Math.sin(t * 1.2) * 4;
  const stacks = [3, 2, 3, 3, 1, 2, 3, 2, 2];
  const cols = [C.stamp, C.greyLight, C.ink, C.paper, C.grey];
  const boxes: React.ReactNode[] = [];
  stacks.forEach((h, i) => {
    for (let k = 0; k < h; k++) boxes.push(<rect key={`${i}-${k}`} x={50 + i * 42} y={200 - (k + 1) * 28} width={40} height={28} fill={cols[(i * 3 + k) % 5]} stroke={C.board} strokeWidth={S} />);
  });
  return (
    <svg width={560} height={320} viewBox="0 0 560 320" overflow="visible">
      <g transform={`translate(0 ${bob})`}>
        <Smoke x={470} y={78} t={t} n={4} dx={-60} rise={70} size={12} />
        <rect x={455} y={80} width={30} height={32} fill={C.stamp} stroke={C.board} strokeWidth={S} />
        <rect x={440} y={110} width={70} height={90} fill={C.paper} stroke={C.board} strokeWidth={S} />
        <rect x={446} y={122} width={58} height={14} fill={C.board} />
        {boxes}
        <path d="M20 200 L540 200 L510 270 L60 270 Z" fill={C.ink} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <text x={280} y={240} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={22} letterSpacing={3} fill={C.paper} {...fitText(label, 20, 360)}>
          {label || ''}
        </text>
      </g>
      <Waves w={560} y={258} t={t} h={320} />
    </svg>
  );
};

/** Steam train with rotating wheels, piston rod, smoke and scrolling sleepers. label on the carriage. */
export const Train: React.FC<IllProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.stamp);
  const bob = Math.abs(Math.sin(t * 10)) * 2;
  const ang = t * Math.PI * 2;
  const ox = 12 * Math.cos(ang);
  const oy = 12 * Math.sin(ang);
  return (
    <svg width={600} height={260} viewBox="0 0 600 260" overflow="visible">
      <line x1={0} y1={244} x2={600} y2={244} stroke={C.board} strokeWidth={4} />
      {Array.from({length: 15}, (_, i) => (
        <rect key={i} x={frac(-t * 0.8 + i / 15) * 600} y={246} width={14} height={8} fill={C.grey} />
      ))}
      <Smoke x={473} y={64} t={t} n={5} dx={-120} rise={50} size={16} speed={0.9} />
      <g transform={`translate(0 ${-bob})`}>
        <rect x={20} y={100} width={220} height={100} rx={6} fill={C.paper} stroke={C.board} strokeWidth={S} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={36 + i * 50} y={116} width={38} height={34} fill={C.ink} stroke={C.board} strokeWidth={S} />
        ))}
        <text x={130} y={184} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board} {...fitText(label, 16, 190)}>
          {label || ''}
        </text>
        <line x1={240} y1={180} x2={262} y2={180} stroke={C.board} strokeWidth={6} />
        <rect x={330} y={110} width={180} height={84} rx={10} fill={C.board} stroke={C.board} strokeWidth={S} />
        <line x1={380} y1={110} x2={380} y2={194} stroke={C.grey} strokeWidth={3} />
        <line x1={440} y1={110} x2={440} y2={194} stroke={C.grey} strokeWidth={3} />
        <rect x={460} y={70} width={26} height={42} fill={C.board} stroke={C.board} strokeWidth={S} />
        <circle cx={512} cy={132} r={10} fill={C.paper} stroke={C.board} strokeWidth={S} />
        <polygon points="510,194 548,226 510,226" fill={C.grey} stroke={C.board} strokeWidth={S} />
        <rect x={252} y={60} width={106} height={14} fill={C.board} />
        <rect x={260} y={72} width={90} height={128} fill={c} stroke={C.board} strokeWidth={S} />
        <rect x={280} y={90} width={50} height={40} fill={C.paper} stroke={C.board} strokeWidth={S} />
      </g>
      <Wheel x={70} y={220} r={22} t={t} />
      <Wheel x={190} y={220} r={22} t={t} />
      <Wheel x={300} y={216} r={26} t={t} />
      <Wheel x={380} y={216} r={26} t={t} />
      <Wheel x={460} y={216} r={26} t={t} />
      <line x1={300 + ox} y1={216 + oy} x2={460 + ox} y2={216 + oy} stroke={C.stamp} strokeWidth={6} strokeLinecap="round" />
    </svg>
  );
};

/** Lorry with rotating wheels, bouncing body and scrolling road. label on the trailer. */
export const Truck: React.FC<IllProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.paper);
  const bounce = Math.abs(Math.sin(t * 8)) * 2;
  return (
    <svg width={460} height={260} viewBox="0 0 460 260" overflow="visible">
      {Array.from({length: 8}, (_, i) => (
        <rect key={i} x={frac(-t * 1.2 + i / 8) * 460} y={250} width={36} height={6} fill={C.grey} />
      ))}
      <g transform={`translate(0 ${-bounce})`}>
        <rect x={20} y={40} width={290} height={160} fill={c} stroke={C.board} strokeWidth={S} />
        <text x={165} y={135} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={36} fill={C.board} {...fitText(label, 10, 250)}>
          {label || 'CARGO'}
        </text>
        <path d="M320 200 L320 80 L400 80 L440 140 L440 200 Z" fill={C.stamp} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d="M335 92 L395 92 L425 138 L335 138 Z" fill={C.paper} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <rect x={430} y={176} width={20} height={16} fill={C.paper} stroke={C.board} strokeWidth={2} />
        <rect x={20} y={200} width={430} height={14} fill={C.board} />
      </g>
      <Wheel x={80} y={222} r={26} t={t} speed={540} />
      <Wheel x={140} y={222} r={26} t={t} speed={540} />
      <Wheel x={380} y={222} r={26} t={t} speed={540} />
    </svg>
  );
};

/** Aeroplane flying a dashed route between two labelled pins. props.from / props.to = labels. */
export const Airplane: React.FC<IllProps> = (props) => {
  const t = useT();
  const s = easeInOut((t - 0.3) / 2.6);
  const p0 = [60, 260];
  const p1 = [320, 20];
  const p2 = [580, 240];
  const bx = (1 - s) * (1 - s) * p0[0] + 2 * (1 - s) * s * p1[0] + s * s * p2[0];
  const by = (1 - s) * (1 - s) * p0[1] + 2 * (1 - s) * s * p1[1] + s * s * p2[1];
  const tx = 2 * (1 - s) * (p1[0] - p0[0]) + 2 * s * (p2[0] - p1[0]);
  const ty = 2 * (1 - s) * (p1[1] - p0[1]) + 2 * s * (p2[1] - p1[1]);
  const a = (Math.atan2(ty, tx) * 180) / Math.PI;
  const bobY = s >= 1 ? Math.sin(t * 2) * 3 : 0;
  const route = `M${p0[0]} ${p0[1]} Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`;
  return (
    <svg width={640} height={320} viewBox="0 0 640 320" overflow="visible">
      <path d={route} fill="none" stroke={C.greyLight} strokeWidth={4} strokeDasharray="10 10" />
      <path d={route} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${s} 2`} />
      {[
        [p0, props.from],
        [p2, props.to],
      ].map(([p, lab]: any, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r={12} fill={i ? C.stamp : C.ink} stroke={C.board} strokeWidth={S} />
          {lab ? (
            <text x={p[0]} y={p[1] + 40} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.board}>
              {String(lab)}
            </text>
          ) : null}
        </g>
      ))}
      <g transform={`translate(${bx} ${by + bobY}) rotate(${a})`}>
        <polygon points="-5,-6 -20,-38 5,-38 15,-6" fill={C.ink} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <polygon points="-5,6 -20,38 5,38 15,6" fill={C.ink} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <polygon points="-40,-6 -48,-20 -36,-20 -28,-6" fill={C.stamp} stroke={C.board} strokeWidth={2} />
        <polygon points="-40,6 -48,20 -36,20 -28,6" fill={C.stamp} stroke={C.board} strokeWidth={2} />
        <path d="M-44 -7 L30 -8 Q46 0 30 8 L-44 7 Z" fill={C.paper} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      </g>
    </svg>
  );
};

const carBody = 'M0 40 L20 40 L45 10 L110 10 L135 40 L160 40 L160 70 L0 70 Z';

/** Car assembly line: primed bodies roll past a welding robot and leave painted. colour = paint colour. */
export const AssemblyLine: React.FC<IllProps> = ({colour, label}) => {
  const t = useT();
  const paint = colourOf(colour, C.stamp);
  const a1 = 20 * Math.sin(t * 2);
  const a2 = 30 + 25 * Math.sin(t * 2 + 1);
  const sparks = frac(t) < 0.35;
  return (
    <svg width={600} height={340} viewBox="0 0 600 340" overflow="visible">
      {label ? (
        <text x={20} y={40} fontFamily={FONT_MONO} fontWeight={700} fontSize={20} letterSpacing={2} fill={C.board}>
          {label}
        </text>
      ) : null}
      {[0, 1, 2].map((k) => {
        const x = frac(t * 0.12 + k / 3) * 720 - 120;
        const painted = x + 80 > 300;
        return (
          <g key={k} transform={`translate(${x} 200)`}>
            <path d={carBody} fill={painted ? paint : C.greyLight} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
            <path d="M52 16 L104 16 L122 38 L38 38 Z" fill={C.paper} stroke={C.board} strokeWidth={2} />
            <circle cx={36} cy={70} r={14} fill={C.board} />
            <circle cx={124} cy={70} r={14} fill={C.board} />
          </g>
        );
      })}
      <rect x={0} y={282} width={600} height={24} rx={12} fill={C.grey} stroke={C.board} strokeWidth={S} />
      {Array.from({length: 12}, (_, i) => {
        const x = frac(t * 0.12 + i / 12) * 600;
        return <line key={i} x1={x} y1={286} x2={x} y2={302} stroke={C.board} strokeWidth={2} />;
      })}
      <rect x={270} y={0} width={60} height={20} fill={C.board} />
      <g transform={`translate(300 20) rotate(${a1})`}>
        <rect x={-12} y={0} width={24} height={110} rx={10} fill={C.stamp} stroke={C.board} strokeWidth={S} />
        <g transform={`translate(0 110) rotate(${a2})`}>
          <circle r={16} fill={C.board} />
          <rect x={-10} y={0} width={20} height={80} rx={8} fill={C.paper} stroke={C.board} strokeWidth={S} />
          <g transform="translate(0 80)">
            <rect x={-16} y={0} width={32} height={20} fill={C.board} />
            {sparks
              ? [-60, -30, 0, 30, 60].map((d) => {
                  const r = (d * Math.PI) / 180;
                  return <line key={d} x1={Math.sin(r) * 8} y1={24 + Math.cos(r) * 8} x2={Math.sin(r) * 30} y2={24 + Math.cos(r) * 30} stroke={C.stamp} strokeWidth={3} strokeLinecap="round" />;
                })
              : null}
          </g>
        </g>
      </g>
    </svg>
  );
};

/** Office tower whose top floors crack and crumble away (collapse, bankruptcy). label on the base. */
export const CrumblingBuilding: React.FC<IllProps> = ({colour, label}) => {
  const t = useT();
  const c = colourOf(colour, C.greyLight);
  const floors = Array.from({length: 8}, (_, i) => {
    const y = 80 + i * 40;
    const falls = i < 5;
    const ti = 0.9 + (4 - i) * 0.18 * -1 + 0.72;
    const start = falls ? 0.9 + i * 0.18 : 1e9;
    const dt = Math.max(0, t - start);
    const dir = i % 2 ? 1 : -1;
    const dy = 0.5 * 900 * dt * dt;
    const dx = dir * 60 * dt;
    const rot = dir * 80 * dt;
    const o = 1 - c01(dt / 1.0);
    if (o <= 0) return null;
    void ti;
    return (
      <g key={i} opacity={o} transform={`translate(${dx} ${dy}) rotate(${rot} 150 ${y + 20})`}>
        <rect x={40} y={y} width={220} height={40} fill={c} stroke={C.board} strokeWidth={S} />
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={58 + k * 50} y={y + 10} width={34} height={20} fill={C.paper} stroke={C.board} strokeWidth={2} />
        ))}
        {falls && t > 0.4 ? <path d={`M${90 + i * 18} ${y} l8 12 l-10 10 l8 18`} stroke={C.board} strokeWidth={3} fill="none" /> : null}
      </g>
    );
  });
  const dust = [0, 1, 2, 3, 4, 5].map((j) => {
    const d = t - 1.4 - j * 0.1;
    if (d <= 0) return null;
    const o = Math.max(0, 0.8 - d * 0.5);
    if (o <= 0) return null;
    return <circle key={j} cx={40 + j * 44} cy={396 - d * 20} r={20 + d * 40} fill={C.greyLight} stroke={C.grey} strokeWidth={2} opacity={o} />;
  });
  return (
    <svg width={300} height={440} viewBox="0 0 300 440" overflow="visible">
      {floors}
      <rect x={130} y={360} width={40} height={40} fill={C.board} />
      {label ? (
        <text x={150} y={350} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board} {...fitText(label, 16, 200)}>
          {label}
        </text>
      ) : null}
      {dust}
      <line x1={0} y1={400} x2={300} y2={400} stroke={C.board} strokeWidth={4} />
    </svg>
  );
};

/** Rocket with flickering flame; props.launch = true makes it lift off after 1.2 s. */
export const Rocket: React.FC<IllProps> = (props) => {
  const t = useT();
  const lift = props.launch ? -Math.pow(c01((t - 1.2) / 1.5), 2) * 700 : 0;
  const shake = Math.sin(t * 60) * 1.5;
  const fl = 1 + 0.25 * Math.sin(t * 30);
  return (
    <svg width={220} height={460} viewBox="0 0 220 460" overflow="visible">
      <Smoke x={110} y={420} t={t} n={5} dx={50} rise={-30} size={20} speed={1.2} />
      <g transform={`translate(${shake} ${lift})`}>
        <g transform={`translate(110 320) scale(1 ${fl})`}>
          <path d="M-28 0 Q-20 60 0 110 Q20 60 28 0 Z" fill={C.stamp} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
          <path d="M-14 0 Q-8 36 0 64 Q8 36 14 0 Z" fill={C.paper} />
        </g>
        <polygon points="60,230 20,320 60,300" fill={C.stamp} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <polygon points="160,230 200,320 160,300" fill={C.stamp} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <rect x={80} y={300} width={60} height={20} fill={C.grey} stroke={C.board} strokeWidth={S} />
        <path d="M110 20 Q170 90 160 300 L60 300 Q50 90 110 20 Z" fill={C.paper} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d="M110 20 Q140 50 150 90 L70 90 Q80 50 110 20 Z" fill={C.stamp} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <circle cx={110} cy={160} r={26} fill={C.ink} stroke={C.board} strokeWidth={S + 2} />
        <path d="M98 150 Q104 142 114 142" stroke={C.paper} strokeWidth={4} fill="none" strokeLinecap="round" />
        {props.label ? (
          <text x={110} y={250} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.board} transform="rotate(-90 110 250)" {...fitText(props.label, 10, 110)}>
            {props.label}
          </text>
        ) : null}
      </g>
    </svg>
  );
};

const CHART_DOWN: Array<[number, number]> = [
  [40, 250],
  [100, 200],
  [160, 215],
  [220, 140],
  [280, 96],
  [320, 130],
  [360, 230],
  [400, 280],
];
const CHART_UP: Array<[number, number]> = [
  [40, 270],
  [100, 240],
  [160, 250],
  [220, 180],
  [280, 190],
  [340, 110],
  [400, 50],
];

/** Self-drawing line chart with a moving arrow head. props.direction = 'down' (crash, stamp) | 'up' (ink). */
export const FallingChart: React.FC<IllProps> = (props) => {
  const t = useT();
  const up = props.direction === 'up';
  const pts = up ? CHART_UP : CHART_DOWN;
  const col = up ? C.ink : C.stamp;
  const p = easeOut(t / 2.2);
  const head = pointAt(pts, p);
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]} ${q[1]}`).join(' ');
  return (
    <svg width={440} height={320} viewBox="0 0 440 320" overflow="visible">
      <rect x={0} y={0} width={440} height={320} fill={C.paper} stroke={C.board} strokeWidth={S} />
      {[80, 140, 200, 260].map((y) => (
        <line key={y} x1={30} y1={y} x2={420} y2={y} stroke={C.greyLight} strokeWidth={2} />
      ))}
      <line x1={30} y1={20} x2={30} y2={300} stroke={C.board} strokeWidth={S} />
      <line x1={30} y1={300} x2={420} y2={300} stroke={C.board} strokeWidth={S} />
      <path d={d} fill="none" stroke={col} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 2`} />
      <g transform={`translate(${head.x} ${head.y}) rotate(${head.a})`}>
        <polygon points="16,0 -10,-13 -10,13" fill={col} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      </g>
      {props.label ? (
        <text x={44} y={44} fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.board}>
          {props.label}
        </text>
      ) : null}
    </svg>
  );
};

import React from 'react';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {c01, easeInOut, fitText, frac} from '../illustrations/kit';
import {Figure, PopText, ShotSvg, TEAR, snap, starPath, type ShotProps} from './kit';

const Floor: React.FC<{y: number}> = ({y}) => <line x1={0} y1={y} x2={1920} y2={y} stroke={C.board} strokeWidth={STROKE} />;

const Anvil: React.FC = () => (
  <g>
    <path d="M-90 0 L90 0 L70 -30 L40 -40 L40 -70 L110 -80 L125 -110 L-70 -110 L-125 -92 L-60 -70 L-40 -70 L-40 -40 L-70 -30 Z" fill={C.board} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
    <line x1={-50} y1={-100} x2={100} y2={-100} stroke={C.greyLight} strokeWidth={6} strokeLinecap="round" />
  </g>
);

const Book: React.FC = () => (
  <g>
    <rect x={-120} y={-70} width={240} height={70} fill={C.ink} stroke={C.board} strokeWidth={STROKE} />
    <rect x={-108} y={-60} width={216} height={12} fill={C.paper} stroke={C.board} strokeWidth={2} />
    <rect x={-108} y={-36} width={216} height={12} fill={C.paper} stroke={C.board} strokeWidth={2} />
  </g>
);

/** Something heavy drops on a faceless head: squash, bounce, orbiting stars, BONK! */
export const CartoonBonk: React.FC<ShotProps> = ({t, p}) => {
  const hit = 0.7;
  const fx = 960;
  const fy = 1000;
  const s = 1.25;
  const headTop = fy - (358 + 46) * s;
  const dt = t - hit;
  let ox = fx;
  let oy = 0;
  let orot = 0;
  if (dt < 0) {
    const k = c01(t / hit);
    oy = -150 + (headTop + 150) * k * k;
  } else {
    ox = fx + 380 * dt;
    oy = headTop - 520 * dt + 900 * dt * dt;
    orot = 140 * dt;
  }
  const squash = dt > 0 ? 0.28 * Math.exp(-dt * 5) * Math.abs(Math.cos(dt * 18)) : 0;
  const stars: React.ReactNode[] = [];
  if (dt > 0.12) {
    for (let i = 0; i < 4; i++) {
      const a = dt * 4 + (i * Math.PI) / 2;
      stars.push(
        <path key={i} d={starPath(26, 11)} transform={`translate(${(fx + 125 * Math.cos(a)).toFixed(1)} ${(headTop + 6 + 30 * Math.sin(a)).toFixed(1)})`} fill={i % 2 ? C.ink : C.stamp} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />,
      );
    }
  }
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <Floor y={fy} />
      <Figure x={fx} y={fy} s={s} colour={p.colour} squash={squash} />
      {stars}
      {dt < 0 ? (
        <g stroke={C.grey} strokeWidth={6} strokeLinecap="round">
          <line x1={ox - 60} y1={oy - 170} x2={ox - 60} y2={oy - 260} />
          <line x1={ox + 60} y1={oy - 170} x2={ox + 60} y2={oy - 280} />
        </g>
      ) : null}
      <g transform={`translate(${ox.toFixed(1)} ${oy.toFixed(1)}) rotate(${orot.toFixed(1)})`}>{String(p.object || 'anvil') === 'book' ? <Book /> : <Anvil />}</g>
      <PopText x={fx + 360} y={headTop - 90} text={String(p.text || 'BONK!')} t={t} at={hit} size={150} rot={-10} />
    </ShotSvg>
  );
};

/** Close-up of a faceless head; sweat drops slide down both temples while it trembles. */
export const SweatDrop: React.FC<ShotProps> = ({t, p}) => {
  const cx = 960;
  const cy = 560;
  const fill = colourOf(p.colour, C.board);
  const shake = Math.sin(t * 40) * 3;
  const drop = (phase: number, side: 1 | -1, size: number, key: string) => {
    const cyc = frac(t / 1.6 + phase);
    const th = ((-50 + 75 * easeInOut(cyc)) * Math.PI) / 180;
    const x = cx + side * 262 * Math.cos(th);
    const y = cy + 262 * Math.sin(th);
    const o = cyc < 0.85 ? c01(cyc / 0.1) : (1 - cyc) / 0.15;
    return (
      <g key={key} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${size})`} opacity={o}>
        <path d={TEAR} fill={C.ink} stroke={C.board} strokeWidth={STROKE / size} strokeLinejoin="round" />
        <ellipse cx={-6} cy={8} rx={5} ry={9} fill={C.paper} />
      </g>
    );
  };
  const lines = [0, 1, 2].map((i) => {
    const a = ((-150 + i * 18) * Math.PI) / 180;
    const o = 0.5 + 0.5 * Math.sin(t * 12 + i * 2);
    return (
      <line key={i} x1={cx + 290 * Math.cos(a)} y1={cy + 290 * Math.sin(a)} x2={cx + 360 * Math.cos(a)} y2={cy + 360 * Math.sin(a)} stroke={C.board} strokeWidth={8} strokeLinecap="round" opacity={o} />
    );
  });
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      {lines}
      <g transform={`translate(${shake.toFixed(1)} 0)`}>
        <path d="M560 1080 Q560 820 960 800 Q1360 820 1360 1080 Z" fill={fill} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r={250} fill={fill} stroke={C.board} strokeWidth={STROKE} />
      </g>
      {drop(0, 1, 1.8, 'r')}
      {drop(0.45, -1, 1.3, 'l')}
    </ShotSvg>
  );
};

/** A figure scratches its head while question marks pop and wobble above it. */
export const QuestionMarks: React.FC<ShotProps> = ({t, p}) => {
  const marks: Array<[number, number, number, string]> = [
    [800, 340, 150, C.ink],
    [960, 270, 190, C.stamp],
    [1120, 340, 150, C.board],
  ];
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <Floor y={1000} />
      <Figure x={960} y={1000} s={1.25} colour={p.colour} arms="head" rot={3 * Math.sin(t * 2)} />
      {marks.map(([x, y, size, fill], i) => (
        <PopText key={i} x={x} y={y} text="?" t={t} at={0.3 + i * 0.3} size={size} fill={fill} rot={12 * Math.sin(t * 3 + i * 1.7)} />
      ))}
    </ShotSvg>
  );
};

/** Typing indicator: a speech bubble with three bouncing dots; optional props.text replaces the dots at revealSec. */
export const DotsBubble: React.FC<ShotProps> = ({t, dur, p}) => {
  const text = p.text ? String(p.text) : '';
  const revealAt = typeof p.revealSec === 'number' ? p.revealSec : Math.max(1.2, dur * 0.55);
  const revealed = text !== '' && t >= revealAt;
  const dotsO = revealed ? 1 - c01((t - revealAt) / 0.15) : 1;
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <Figure x={560} y={1080} s={0.9} colour={p.colour} />
      <polygon points="760,620 690,770 880,620" fill={C.paper} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
      <rect x={560} y={240} width={900} height={390} rx={80} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
      <polygon points="766,622 704,744 872,622" fill={C.paper} />
      {[0, 1, 2].map((i) => {
        const b = Math.max(0, Math.sin(t * Math.PI * 2 * 1.3 - i * 0.9));
        return <circle key={i} cx={860 + i * 150} cy={445 - 36 * b} r={34} fill={C.board} opacity={dotsO} />;
      })}
      {revealed ? (
        <g transform={`translate(1010 435) scale(${pop((t - revealAt) / 0.3)})`}>
          <text x={0} y={30} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={84} fill={C.board} {...fitText(text, 16, 800)}>
            {text}
          </text>
        </g>
      ) : null}
    </ShotSvg>
  );
};

const Peel: React.FC = () => (
  <g stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" fill={C.stamp}>
    <path d="M-20 -24 Q-70 -70 -110 -30 Q-60 -40 -30 -16 Z" />
    <path d="M20 -24 Q70 -70 110 -30 Q60 -40 30 -16 Z" />
    <path d="M-8 -26 Q0 -90 20 -100 Q14 -60 10 -24 Z" />
    <path d="M-70 0 Q-40 -30 0 -26 Q40 -30 70 0 Z" />
  </g>
);

/** Walks in, steps on a peel, flies up and lands flat. */
export const BananaSlip: React.FC<ShotProps> = ({t, p}) => {
  const floor = 900;
  const slipAt = 1.1;
  let x = 0;
  let y = floor;
  let rot = 0;
  let legs = 0;
  let arms: 'down' | 'up' = 'down';
  if (t < slipAt) {
    x = -120 + (1080 * t) / slipAt;
    legs = Math.sin(t * 12);
    y = floor - Math.abs(Math.sin(t * 12)) * 8;
  } else if (t < slipAt + 0.4) {
    const k = c01((t - slipAt) / 0.4);
    x = 960 + 120 * k;
    y = floor - 160 * Math.sin(k * Math.PI);
    rot = -95 * Math.pow(k, 0.7);
    legs = 1;
    arms = 'up';
  } else {
    const d = t - slipAt - 0.4;
    x = 1080;
    y = floor - 50 - 30 * Math.abs(Math.sin(d * 10)) * Math.exp(-d * 5);
    rot = -95;
    legs = 0.6;
    arms = 'up';
  }
  const pk = c01((t - slipAt) / 0.8);
  const peelX = 1000 + 600 * snap(pk);
  const lying = t >= slipAt + 0.5;
  const hx = x - 357;
  const hy = y + 31;
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <Floor y={floor} />
      {t < slipAt ? (
        <g stroke={C.grey} strokeWidth={6} strokeLinecap="round">
          {[300, 220, 140].map((h, i) => (
            <line key={i} x1={x - 110 - i * 10} y1={floor - h} x2={x - 190 - i * 10} y2={floor - h} />
          ))}
        </g>
      ) : null}
      <g transform={`translate(${peelX.toFixed(1)} ${floor}) rotate(${(540 * snap(pk)).toFixed(1)} 0 -30)`}>
        <Peel />
      </g>
      <Figure x={x} y={y} colour={p.colour} rot={rot} legs={legs} arms={arms} />
      {lying
        ? [0, 1, 2].map((i) => {
            const a = t * 4 + (i * Math.PI * 2) / 3;
            return <path key={i} d={starPath(22, 9)} transform={`translate(${(hx + 90 * Math.cos(a)).toFixed(1)} ${(hy - 70 + 22 * Math.sin(a)).toFixed(1)})`} fill={C.stamp} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />;
          })
        : null}
      <PopText x={960} y={360} text={String(p.text || 'WHOOPS!')} t={t} at={slipAt + 0.4} size={140} rot={-6} />
    </ShotSvg>
  );
};

/** Freeze-frame: flash, a mid-air figure in grey, a record that stops spinning, '*record scratch*' and a caption. */
export const RecordScratch: React.FC<ShotProps> = ({t, p}) => {
  const angle = t < 0.6 ? 720 * (t - (t * t) / 1.2) : 216;
  const flash = 1 - c01(t / 0.15);
  const scratchO = t > 0.1 && t < 0.7 ? 0.5 + 0.5 * Math.sin(t * 50) : 0;
  const caption = String(p.text || "Yep. That's me.");
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.greyLight} />
      <line x1={0} y1={880} x2={1920} y2={880} stroke={C.board} strokeWidth={STROKE} />
      <Figure x={760} y={840} s={1.15} colour={p.colour || 'grey'} rot={12} arms="up" legs={1} />
      <g transform={`translate(1450 330) rotate(${angle.toFixed(1)})`}>
        <circle r={170} fill={C.board} stroke={C.board} strokeWidth={STROKE} />
        {[140, 115, 90].map((r) => (
          <circle key={r} r={r} fill="none" stroke={C.grey} strokeWidth={3} />
        ))}
        <line x1={62} y1={0} x2={160} y2={0} stroke={C.greyLight} strokeWidth={6} strokeLinecap="round" />
        <circle r={52} fill={C.stamp} stroke={C.board} strokeWidth={STROKE} />
        <circle r={7} fill={C.paper} />
      </g>
      <line x1={1680} y1={120} x2={1575} y2={300} stroke={C.board} strokeWidth={14} strokeLinecap="round" />
      <path d="M1210 600 L1250 570 L1290 620 L1330 570 L1370 620 L1410 585" fill="none" stroke={C.stamp} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" opacity={scratchO} />
      <text x={1450} y={580} textAnchor="middle" fontFamily={FONT_MONO} fontSize={40} fill={C.board} opacity={c01((t - 0.2) / 0.2)}>
        *record scratch*
      </text>
      <rect x={70} y={60} width={26} height={80} fill={C.board} />
      <rect x={112} y={60} width={26} height={80} fill={C.board} />
      <text x={160} y={118} fontFamily={FONT_MONO} fontSize={34} fill={C.board}>
        FREEZE FRAME
      </text>
      <g transform={`translate(960 990) scale(${pop((t - 0.7) / 0.3)})`}>
        <text x={0} y={30} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={96} fill={C.board} {...fitText(caption, 26, 1600)}>
          {caption}
        </text>
      </g>
      <rect x={20} y={20} width={1880} height={1040} fill="none" stroke={C.board} strokeWidth={10} />
      <rect width={1920} height={1080} fill={C.paper} opacity={flash} />
    </ShotSvg>
  );
};

/** Crash zoom in two snaps onto a word, with radial speed lines and camera shake. */
export const ExaggeratedZoom: React.FC<ShotProps> = ({t, p}) => {
  const s1 = 0.35;
  const s2 = 0.95;
  const z = 1 + 0.9 * snap((t - s1) / 0.12) + 1.3 * snap((t - s2) / 0.12);
  const amp = (t > s1 ? 14 * Math.exp(-(t - s1) * 8) : 0) + (t > s2 ? 18 * Math.exp(-(t - s2) * 8) : 0);
  const dx = amp * Math.sin(t * 70);
  const dy = amp * Math.cos(t * 63);
  const flash = (s: number) => (t >= s && t < s + 0.35 ? 1 - (t - s) / 0.35 : 0);
  const lineO = Math.max(flash(s1), flash(s2));
  const word = String(p.text || 'THE DEAL');
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < 28; i++) {
    const a = ((i * 360) / 28 + (i % 3) * 4) * (Math.PI / 180);
    lines.push(<line key={i} x1={960 + 430 * Math.cos(a)} y1={540 + 430 * Math.sin(a)} x2={960 + 1200 * Math.cos(a)} y2={540 + 1200 * Math.sin(a)} stroke={C.board} strokeWidth={6} />);
  }
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <g transform={`translate(${(960 + dx).toFixed(1)} ${(540 + dy).toFixed(1)}) scale(${z.toFixed(3)}) translate(-960 -540)`}>
        <Floor y={900} />
        <Figure x={400} y={900} s={0.7} colour="grey" />
        <Figure x={1520} y={900} s={0.7} colour="grey" arms="out" />
        <rect x={660} y={420} width={600} height={260} fill={C.paper} stroke={C.board} strokeWidth={6} />
        <text x={960} y={590} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={110} fill={colourOf(p.colour, C.stamp)} {...fitText(word, 9, 540)}>
          {word}
        </text>
      </g>
      <g opacity={lineO}>{lines}</g>
    </ShotSvg>
  );
};

const Weed: React.FC = () => (
  <g fill="none" stroke={C.board} strokeLinecap="round">
    <circle r={70} strokeWidth={4} />
    {[0, 60, 120].map((a) => (
      <ellipse key={a} rx={70} ry={28} transform={`rotate(${a})`} strokeWidth={3} />
    ))}
    <circle r={36} strokeWidth={3} />
    <path d="M-50 -20 Q0 -60 40 10 M-30 40 Q10 0 55 30" strokeWidth={3} />
  </g>
);

/** Empty desert: a tumbleweed bounces through; optional signpost text (props.text). */
export const Tumbleweed: React.FC<ShotProps> = ({t, p}) => {
  const hop = 0.55;
  const X = (tt: number) => -160 + ((tt * 560) % 2240);
  const ph = frac(t / hop);
  const x = X(t);
  const y = 690 - 560 * ph * (1 - ph);
  const tc = Math.floor(t / hop) * hop;
  const age = t - tc;
  const xc = X(tc);
  const sign = p.text ? String(p.text) : '';
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.paper} />
      <circle cx={1650} cy={200} r={70} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
      <path d="M1180 760 L1240 600 L1460 600 L1520 760 Z" fill={C.grey} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
      <path d="M200 760 L240 660 L360 660 L400 760 Z" fill={C.grey} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
      <rect x={0} y={760} width={1920} height={320} fill={C.greyLight} />
      <line x1={0} y1={760} x2={1920} y2={760} stroke={C.board} strokeWidth={STROKE} />
      <path d="M300 900 l40 20 l-10 30 M900 980 l50 -10 l20 25 M1500 880 l-30 30 l25 20" fill="none" stroke={C.grey} strokeWidth={4} strokeLinecap="round" />
      {[0, 1, 2].map((i) => {
        const lx = ((t * 900 + i * 700) % 2400) - 200;
        return <line key={i} x1={lx} y1={300 + i * 90} x2={lx + 140} y2={300 + i * 90} stroke={C.grey} strokeWidth={4} strokeLinecap="round" />;
      })}
      {sign ? (
        <g transform={`rotate(${(2 * Math.sin(t * 3)).toFixed(2)} 1570 780)`}>
          <rect x={1560} y={600} width={20} height={180} fill={C.grey} stroke={C.board} strokeWidth={STROKE} />
          <rect x={1420} y={540} width={300} height={100} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
          <text x={1570} y={604} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={40} fill={C.board} {...fitText(sign, 12, 270)}>
            {sign}
          </text>
        </g>
      ) : null}
      {age < hop
        ? [0, 1, 2].map((i) => (
            <circle key={i} cx={xc - 30 + i * 30} cy={755 - i * 6} r={10 + 60 * age} fill={C.paper} stroke={C.grey} strokeWidth={2} opacity={0.7 * (1 - age / hop)} />
          ))
        : null}
      <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((t * 420) % 360).toFixed(1)})`}>
        <Weed />
      </g>
    </ShotSvg>
  );
};

/** Night, an empty stage with a microphone; crickets chirp. Optional props.text on the stage edge. */
export const Crickets: React.FC<ShotProps> = ({t, p}) => {
  const stars: Array<[number, number]> = [
    [180, 120], [420, 240], [640, 90], [880, 200], [1120, 110], [1300, 260], [1780, 380], [260, 420], [1700, 90], [1020, 330], [520, 380], [1400, 120],
  ];
  const crickets: Array<[number, number, number]> = [
    [420, 1030, 0],
    [1500, 1040, 0.5],
  ];
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.board} />
      {stars.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3 + (i % 3)} fill={C.paper} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))} />
      ))}
      <circle cx={1560} cy={220} r={90} fill={C.paper} />
      <circle cx={1600} cy={190} r={80} fill={C.board} />
      <path d="M260 1080 L520 780 L1400 780 L1660 1080 Z" fill={C.grey} stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
      <polygon points="960,-20 700,880 1220,880" fill={C.paper} opacity={0.12} />
      <ellipse cx={960} cy={880} rx={260} ry={50} fill={C.paper} opacity={0.22} />
      <line x1={960} y1={880} x2={960} y2={630} stroke={C.greyLight} strokeWidth={8} strokeLinecap="round" />
      <line x1={910} y1={884} x2={1010} y2={884} stroke={C.greyLight} strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={960} cy={600} rx={24} ry={36} fill={C.greyLight} stroke={C.board} strokeWidth={STROKE} />
      {p.text ? (
        <text x={960} y={1000} textAnchor="middle" fontFamily={FONT_MONO} fontSize={44} fill={C.paper} {...fitText(String(p.text), 34, 1000)}>
          {String(p.text)}
        </text>
      ) : null}
      {Array.from({length: 40}).map((_, i) => {
        const x = i * 50 + 10;
        const sway = 10 * Math.sin(t * 1.5 + i * 0.7);
        return <path key={i} d={`M${x} 1080 Q${x + 6} 1035 ${(x + sway).toFixed(1)} ${990 + (i % 4) * 8}`} fill="none" stroke={C.greyLight} strokeWidth={4} strokeLinecap="round" opacity={0.7} />;
      })}
      {crickets.map(([x, y, ph], i) => {
        const c = frac(t / 1.1 + ph);
        const on = c < 0.3;
        const jump = on ? -6 * Math.abs(Math.sin(c * 40)) : 0;
        return (
          <g key={i}>
            <g transform={`translate(${x} ${y + jump})`} stroke={C.greyLight} strokeWidth={3} strokeLinecap="round">
              <line x1={-14} y1={4} x2={-34} y2={22} />
              <line x1={10} y1={4} x2={30} y2={22} />
              <line x1={22} y1={-6} x2={52} y2={-34} />
              <line x1={24} y1={-8} x2={44} y2={-42} />
              <ellipse rx={28} ry={12} fill={C.greyLight} stroke="none" />
            </g>
            <text x={x + 40} y={y - 60} fontFamily={FONT_MONO} fontSize={32} fill={C.paper} opacity={on ? 1 : 0}>
              chirp
            </text>
          </g>
        );
      })}
    </ShotSvg>
  );
};

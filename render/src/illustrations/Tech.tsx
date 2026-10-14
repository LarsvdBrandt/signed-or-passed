import React from 'react';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import type {IllProps} from './People';
import {c01, easeOut, fitText, frac, useT} from './kit';

const S = STROKE;

/** Beige-box CRT computer that types label on screen, with blinking cursor and a scanline. */
export const Computer: React.FC<IllProps> = ({label}) => {
  const t = useT();
  const txt = '> ' + (label || 'HELLO WORLD');
  const n = Math.min(txt.length, Math.floor(t * 12));
  const typed = txt.slice(0, n);
  const cursorOn = frac(t * 2) < 0.5;
  return (
    <svg width={320} height={320} viewBox="0 0 320 320" overflow="visible">
      <rect x={30} y={20} width={260} height={210} rx={18} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
      <rect x={55} y={45} width={210} height={150} rx={10} fill={C.board} stroke={C.board} strokeWidth={S} />
      <text x={70} y={80} fontFamily={FONT_MONO} fontSize={18} fill={C.greyLight}>
        READY.
      </text>
      <text x={70} y={112} fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.paper} {...fitText(typed, 16, 180)}>
        {typed}
      </text>
      {cursorOn ? <rect x={70 + Math.min(180, typed.length * 10.8)} y={98} width={10} height={18} fill={C.paper} /> : null}
      <rect x={55} y={45 + frac(t * 0.5) * 146} width={210} height={4} fill={C.paper} opacity={0.15} />
      <circle cx={262} cy={212} r={6} fill={C.stamp} stroke={C.board} strokeWidth={2} />
      <rect x={130} y={230} width={60} height={20} fill={C.grey} stroke={C.board} strokeWidth={S} />
      <polygon points="40,304 280,304 260,262 60,262" fill={C.greyLight} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      {[274, 286].map((y) => (
        <line key={y} x1={70} y1={y} x2={250} y2={y} stroke={C.grey} strokeWidth={3} strokeDasharray="12 5" />
      ))}
      <line x1={100} y1={296} x2={220} y2={296} stroke={C.grey} strokeWidth={5} />
    </svg>
  );
};

/** Laptop whose lid opens, glowing screen with label. */
export const Laptop: React.FC<IllProps> = ({label, colour}) => {
  const t = useT();
  const open = Math.max(0.02, easeOut(t / 0.6));
  const glow = 0.08 + 0.06 * Math.sin(t * 3);
  return (
    <svg width={380} height={260} viewBox="0 0 380 260" overflow="visible">
      <g transform={`translate(0 200) scale(1 ${open}) translate(0 -200)`}>
        <rect x={60} y={20} width={260} height={180} rx={12} fill={C.board} stroke={C.board} strokeWidth={S} />
        <rect x={74} y={34} width={232} height={152} fill={colourOf(colour, C.ink)} />
        <rect x={74} y={34} width={232} height={152} fill={C.paper} opacity={glow} />
        <text x={190} y={120} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} fill={C.paper} {...fitText(label, 12, 200)}>
          {label || ''}
        </text>
      </g>
      <polygon points="20,200 360,200 380,232 0,232" fill={C.greyLight} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      <rect x={160} y={208} width={60} height={12} rx={3} fill={C.grey} />
    </svg>
  );
};

/** Smartphone: apps pop in, the screen glows, a notification (label) slides in. */
export const Smartphone: React.FC<IllProps> = ({label, colour}) => {
  const t = useT();
  const glow = 0.05 + 0.05 * Math.sin(t * 3);
  const fills = [C.paper, C.stamp, C.greyLight];
  const apps: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let k = 0; k < 3; k++) {
      const idx = r * 3 + k;
      const s = easeOut((t - 0.3 - idx * 0.05) / 0.25);
      const cx = 49 + k * 41;
      const cy = 75 + r * 44;
      apps.push(
        <rect key={idx} x={cx - 15} y={cy - 15} width={30} height={30} rx={8} fill={fills[idx % 3]} stroke={C.board} strokeWidth={2} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`} />,
      );
    }
  }
  const ns = easeOut((t - 1.6) / 0.4);
  return (
    <svg width={180} height={340} viewBox="0 0 180 340" overflow="visible">
      <rect x={10} y={10} width={160} height={320} rx={26} fill={C.board} stroke={C.board} strokeWidth={S} />
      <rect x={22} y={40} width={136} height={260} rx={8} fill={colourOf(colour, C.ink)} />
      <rect x={22} y={40} width={136} height={260} rx={8} fill={C.paper} opacity={glow} />
      <rect x={70} y={22} width={40} height={6} rx={3} fill={C.grey} />
      {apps}
      {label ? (
        <g opacity={ns} transform={`translate(0 ${(1 - ns) * 20})`}>
          <rect x={26} y={240} width={128} height={44} rx={10} fill={C.paper} stroke={C.board} strokeWidth={2} />
          <text x={90} y={268} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.board} {...fitText(label, 13, 116)}>
            {label}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

/** 3.5" floppy disk; the metal shutter slides open. label on the sticker. */
export const FloppyDisk: React.FC<IllProps> = ({label, colour}) => {
  const t = useT();
  const slide = 34 * easeOut((t - 0.5) / 0.4);
  return (
    <svg width={220} height={220} viewBox="0 0 220 220" overflow="visible">
      <path d="M10 10 L180 10 L210 40 L210 210 L10 210 Z" fill={colourOf(colour, C.ink)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      <rect x={98} y={18} width={26} height={50} fill={C.board} />
      <rect x={60 + slide} y={10} width={90} height={64} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
      <rect x={36} y={110} width={148} height={90} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <line x1={50} y1={170} x2={170} y2={170} stroke={C.greyLight} strokeWidth={2} />
      <line x1={50} y1={186} x2={170} y2={186} stroke={C.greyLight} strokeWidth={2} />
      <text x={110} y={148} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board} {...fitText(label, 11, 130)}>
        {label || 'DISK 1'}
      </text>
    </svg>
  );
};

const Reel: React.FC<{cx: number; cy: number; r: number; a: number}> = ({cx, cy, r, a}) => (
  <g transform={`rotate(${a} ${cx} ${cy})`}>
    <circle cx={cx} cy={cy} r={r} fill={C.paper} stroke={C.board} strokeWidth={S} />
    {[0, 60, 120, 180, 240, 300].map((d) => {
      const rad = (d * Math.PI) / 180;
      return <line key={d} x1={cx + Math.cos(rad) * r * 0.3} y1={cy + Math.sin(rad) * r * 0.3} x2={cx + Math.cos(rad) * r * 0.75} y2={cy + Math.sin(rad) * r * 0.75} stroke={C.board} strokeWidth={3} />;
    })}
  </g>
);

/** VHS tape with turning reels. label on the sticker. */
export const VHSTape: React.FC<IllProps> = ({label}) => {
  const t = useT();
  return (
    <svg width={320} height={200} viewBox="0 0 320 200" overflow="visible">
      <rect x={10} y={20} width={300} height={170} rx={8} fill={C.board} stroke={C.board} strokeWidth={S} />
      <rect x={30} y={32} width={260} height={46} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <text x={160} y={64} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={24} fill={C.board} {...fitText(label, 18, 230)}>
        {label || 'VHS'}
      </text>
      <rect x={70} y={100} width={180} height={66} rx={6} fill={C.grey} stroke={C.board} strokeWidth={S} />
      <circle cx={115} cy={133} r={30} fill={C.board} />
      <Reel cx={115} cy={133} r={20} a={t * 140} />
      <Reel cx={205} cy={133} r={20} a={t * 140} />
    </svg>
  );
};

/** DVD in a sleeve; the disc slides out and spins. label on the sleeve. */
export const DVD: React.FC<IllProps> = ({label, colour}) => {
  const t = useT();
  const dx = 70 * easeOut((t - 0.4) / 0.8);
  return (
    <svg width={260} height={260} viewBox="0 0 260 260" overflow="visible">
      <g transform={`translate(${dx} 0) rotate(${t * 90} 130 130)`}>
        <circle cx={130} cy={130} r={100} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
        <circle cx={130} cy={130} r={70} fill="none" stroke={C.paper} strokeWidth={3} />
        <circle cx={130} cy={130} r={36} fill={C.paper} stroke={C.board} strokeWidth={S} />
        <circle cx={130} cy={130} r={12} fill={C.paper} stroke={C.board} strokeWidth={S} />
        <path d="M70 90 A70 70 0 0 1 100 64" stroke={C.paper} strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
      <path d="M20 20 H240 V240 H20 Z M60 130 a70 70 0 1 0 140 0 a70 70 0 1 0 -140 0 Z" fillRule="evenodd" fill={colourOf(colour, C.stamp)} stroke={C.board} strokeWidth={S} />
      <text x={130} y={47} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.paper} {...fitText(label, 16, 190)}>
        {label || 'DVD'}
      </text>
    </svg>
  );
};

/** Vintage film camera on a tripod, reels turning, recording light blinking. */
export const FilmCamera: React.FC<IllProps> = ({label}) => {
  const t = useT();
  const holes = (cx: number, cy: number) => (
    <g transform={`rotate(${t * 150} ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={44} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
      {[0, 120, 240].map((d) => {
        const r = (d * Math.PI) / 180;
        return <circle key={d} cx={cx + Math.cos(r) * 24} cy={cy + Math.sin(r) * 24} r={10} fill={C.board} />;
      })}
      <circle cx={cx} cy={cy} r={7} fill={C.board} />
    </g>
  );
  return (
    <svg width={300} height={300} viewBox="0 0 300 300" overflow="visible">
      <line x1={130} y1={220} x2={80} y2={296} stroke={C.board} strokeWidth={6} strokeLinecap="round" />
      <line x1={130} y1={220} x2={180} y2={296} stroke={C.board} strokeWidth={6} strokeLinecap="round" />
      <line x1={130} y1={220} x2={130} y2={296} stroke={C.board} strokeWidth={6} strokeLinecap="round" />
      {holes(90, 66)}
      {holes(180, 66)}
      <rect x={40} y={110} width={180} height={110} rx={8} fill={C.board} stroke={C.board} strokeWidth={S} />
      <rect x={220} y={140} width={38} height={50} fill={C.grey} stroke={C.board} strokeWidth={S} />
      <rect x={256} y={128} width={30} height={74} rx={4} fill={C.board} stroke={C.board} strokeWidth={S} />
      <circle cx={62} cy={130} r={7} fill={C.stamp} opacity={frac(t) < 0.5 ? 1 : 0.25} />
      {label ? (
        <text x={130} y={180} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.paper} {...fitText(label, 14, 150)}>
          {label}
        </text>
      ) : null}
    </svg>
  );
};

/** Digital camera whose flash fires every few seconds. */
export const DigitalCamera: React.FC<IllProps> = ({colour}) => {
  const t = useT();
  const flash = frac(t / 2.4) > 0.9;
  return (
    <svg width={280} height={200} viewBox="0 0 280 200" overflow="visible">
      {flash ? <polygon points="56,20 66,48 96,40 76,62 104,80 70,78 62,108 50,80 18,86 40,62 14,42 46,46" fill={C.paper} stroke={C.board} strokeWidth={2} strokeLinejoin="round" /> : null}
      <rect x={30} y={22} width={60} height={24} rx={4} fill={C.board} />
      <rect x={200} y={28} width={40} height={14} rx={4} fill={C.stamp} stroke={C.board} strokeWidth={2} />
      <rect x={10} y={40} width={260} height={150} rx={18} fill={colourOf(colour, C.board)} stroke={C.board} strokeWidth={S} />
      <rect x={34} y={58} width={44} height={22} fill={flash ? C.paper : C.greyLight} stroke={C.board} strokeWidth={2} />
      <circle cx={140} cy={115} r={56} fill={C.grey} stroke={C.board} strokeWidth={S} />
      <circle cx={140} cy={115} r={40} fill={C.board} />
      <circle cx={140} cy={115} r={24} fill={C.ink} stroke={C.board} strokeWidth={2} />
      <circle cx={130} cy={105} r={6} fill={C.paper} />
    </svg>
  );
};

/** Acoustic guitar with vibrating strings. */
export const Guitar: React.FC<IllProps> = ({colour}) => {
  const t = useT();
  const amp = frac(t / 2) < 0.6 ? 1.5 : 0.3;
  const v = Math.sin(t * 40) * amp;
  return (
    <svg width={180} height={460} viewBox="0 0 180 460" overflow="visible">
      <rect x={74} y={0} width={32} height={40} rx={6} fill={C.board} />
      {[10, 22, 34].map((y) => (
        <g key={y}>
          <circle cx={68} cy={y} r={4} fill={C.grey} />
          <circle cx={112} cy={y} r={4} fill={C.grey} />
        </g>
      ))}
      <rect x={80} y={36} width={20} height={190} fill={C.board} />
      <path d="M90 205 C140 205 150 245 135 280 C190 300 180 450 90 450 C0 450 -10 300 45 280 C30 245 40 205 90 205 Z" fill={colourOf(colour, C.stamp)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      <circle cx={90} cy={310} r={26} fill={C.board} />
      <rect x={66} y={380} width={48} height={10} fill={C.board} />
      {[0, 1, 2, 3].map((i) => {
        const x = 84 + i * 4;
        return <path key={i} d={`M${x} 30 Q${x + v * (i % 2 ? 1 : -1)} 210 ${x} 385`} stroke={C.paper} strokeWidth={1.5} fill="none" />;
      })}
    </svg>
  );
};

/** Spinning vinyl record; the tone arm swings in. label on the record label. */
export const Record: React.FC<IllProps> = ({label, colour}) => {
  const t = useT();
  const arm = -25 * (1 - easeOut(t / 0.8));
  return (
    <svg width={320} height={320} viewBox="0 0 320 320" overflow="visible">
      <g transform={`rotate(${t * 200} 160 160)`}>
        <circle cx={160} cy={160} r={150} fill={C.board} stroke={C.board} strokeWidth={S} />
        {[130, 110, 90].map((r) => (
          <circle key={r} cx={160} cy={160} r={r} fill="none" stroke={C.grey} strokeWidth={1.5} />
        ))}
        <circle cx={160} cy={160} r={50} fill={colourOf(colour, C.ink)} stroke={C.board} strokeWidth={S} />
        <text x={160} y={150} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={14} fill={C.paper} {...fitText(label, 9, 80)}>
          {label || 'SIDE A'}
        </text>
        <circle cx={160} cy={160} r={6} fill={C.paper} />
      </g>
      <path d="M60 110 A110 110 0 0 1 110 60" stroke={C.paper} strokeWidth={6} fill="none" opacity={0.3} strokeLinecap="round" />
      <g transform={`rotate(${arm} 300 30)`}>
        <line x1={300} y1={30} x2={232} y2={186} stroke={C.board} strokeWidth={14} strokeLinecap="round" />
        <line x1={300} y1={30} x2={232} y2={186} stroke={C.greyLight} strokeWidth={8} strokeLinecap="round" />
        <rect x={220} y={180} width={24} height={20} fill={C.board} />
        <circle cx={300} cy={30} r={16} fill={C.grey} stroke={C.board} strokeWidth={S} />
      </g>
    </svg>
  );
};

/** Sneaker (no logos) bouncing gently above its shadow. */
export const Sneaker: React.FC<IllProps> = ({colour}) => {
  const t = useT();
  const h = Math.abs(Math.sin(t * 3));
  return (
    <svg width={320} height={190} viewBox="0 0 320 190" overflow="visible">
      <ellipse cx={160} cy={182} rx={120 - h * 24} ry={6} fill={C.greyLight} />
      <g transform={`translate(0 ${-h * 14})`}>
        <path d="M20 140 L20 80 Q30 60 70 66 L120 40 Q150 30 170 60 L230 90 Q300 100 300 130 L300 140 Z" fill={colourOf(colour, C.ink)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d="M20 70 Q20 60 34 64 L40 140 L20 140 Z" fill={C.stamp} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={124 + i * 22} y1={50 + i * 10} x2={140 + i * 22} y2={70 + i * 10} stroke={C.paper} strokeWidth={4} strokeLinecap="round" />
        ))}
        <path d="M14 140 L306 140 Q306 160 290 160 L30 160 Q14 160 14 140 Z" fill={C.paper} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      </g>
    </svg>
  );
};

/** Bouncing basketball with squash on impact. */
export const Basketball: React.FC<IllProps> = ({colour}) => {
  const t = useT();
  const ph = frac(t * 1.1);
  const h = 4 * ph * (1 - ph);
  const y = 196 - h * 130;
  const low = h < 0.08;
  return (
    <svg width={220} height={260} viewBox="0 0 220 260" overflow="visible">
      <ellipse cx={110} cy={250} rx={30 + 30 * (1 - h)} ry={6} fill={C.greyLight} />
      <g transform={`translate(110 ${y}) scale(${low ? 1.12 : 1} ${low ? 0.86 : 1}) rotate(${t * 180})`}>
        <circle r={50} fill={colourOf(colour, C.stamp)} stroke={C.board} strokeWidth={S} />
        <line x1={-50} y1={0} x2={50} y2={0} stroke={C.board} strokeWidth={S} />
        <line x1={0} y1={-50} x2={0} y2={50} stroke={C.board} strokeWidth={S} />
        <path d="M-35 -35 Q0 0 -35 35" stroke={C.board} strokeWidth={S} fill="none" />
        <path d="M35 -35 Q0 0 35 35" stroke={C.board} strokeWidth={S} fill="none" />
      </g>
    </svg>
  );
};

/** Vintage microphone on a stand, with pulsing sound waves. */
export const Microphone: React.FC<IllProps> = () => {
  const t = useT();
  const arcs: React.ReactNode[] = [];
  for (let k = 0; k < 3; k++) {
    const ph = frac(t * 0.8 + k / 3);
    const r = 70 + ph * 60;
    const a = (40 * Math.PI) / 180;
    const x1 = r * Math.cos(-a);
    const y1 = r * Math.sin(-a);
    const y2 = r * Math.sin(a);
    arcs.push(<path key={'r' + k} d={`M${90 + x1} ${80 + y1} A${r} ${r} 0 0 1 ${90 + x1} ${80 + y2}`} stroke={C.ink} strokeWidth={4} fill="none" opacity={1 - ph} strokeLinecap="round" />);
    arcs.push(<path key={'l' + k} d={`M${90 - x1} ${80 + y1} A${r} ${r} 0 0 0 ${90 - x1} ${80 + y2}`} stroke={C.ink} strokeWidth={4} fill="none" opacity={1 - ph} strokeLinecap="round" />);
  }
  return (
    <svg width={180} height={380} viewBox="0 0 180 380" overflow="visible">
      {arcs}
      <line x1={90} y1={180} x2={90} y2={346} stroke={C.board} strokeWidth={10} />
      <ellipse cx={90} cy={352} rx={60} ry={14} fill={C.board} />
      <path d="M56 110 Q56 170 90 170 Q124 170 124 110" stroke={C.board} strokeWidth={6} fill="none" />
      <rect x={82} y={164} width={16} height={20} fill={C.board} />
      <rect x={50} y={20} width={80} height={120} rx={40} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
      {[44, 58, 100, 114].map((y) => (
        <line key={y} x1={60} y1={y} x2={120} y2={y} stroke={C.grey} strokeWidth={2} />
      ))}
      <rect x={46} y={74} width={88} height={14} fill={C.board} />
    </svg>
  );
};

/** Rotary telephone that rings in bursts: shakes, handset jumps, ring lines. */
export const OldTelephone: React.FC<IllProps> = ({colour}) => {
  const t = useT();
  const ringing = frac(t / 1.6) < 0.6;
  const shake = ringing ? Math.sin(t * 70) * 4 : 0;
  const jump = ringing ? -Math.abs(Math.sin(t * 35)) * 6 : 0;
  const c = colourOf(colour, C.stamp);
  const holes: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-60 + i * 30) * Math.PI) / 180;
    holes.push(<circle key={i} cx={140 + Math.cos(a) * 28} cy={160 + Math.sin(a) * 28} r={6} fill={C.board} />);
  }
  return (
    <svg width={280} height={240} viewBox="0 0 280 240" overflow="visible">
      {ringing ? (
        <g stroke={C.stamp} strokeWidth={5} strokeLinecap="round">
          <line x1={30} y1={60} x2={10} y2={46} />
          <line x1={26} y1={84} x2={4} y2={84} />
          <line x1={250} y1={60} x2={270} y2={46} />
          <line x1={254} y1={84} x2={276} y2={84} />
        </g>
      ) : null}
      <path d="M240 190 q20 10 10 30 q-10 20 10 30" stroke={C.board} strokeWidth={3} fill="none" />
      <g transform={`rotate(${shake} 140 200)`}>
        <path d="M40 210 L70 110 L210 110 L240 210 Z" fill={c} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <circle cx={140} cy={160} r={42} fill={C.paper} stroke={C.board} strokeWidth={S} />
        {holes}
        <circle cx={140} cy={160} r={12} fill={c} stroke={C.board} strokeWidth={2} />
        <rect x={76} y={98} width={14} height={14} fill={C.board} />
        <rect x={190} y={98} width={14} height={14} fill={C.board} />
        <g transform={`translate(0 ${jump})`}>
          <path d="M40 92 Q30 60 60 56 L220 56 Q250 60 240 92 L215 98 Q205 78 190 78 L90 78 Q75 78 65 98 Z" fill={C.board} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
};

void c01;

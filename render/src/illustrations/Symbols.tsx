import React from 'react';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import type {IllProps} from './People';
import {Newspaper} from './Objects';
import {c01, easeInOut, easeOut, fitText, frac, useT} from './kit';

const S = STROKE;

/** Close-up handshake: two sleeves (leftColour, rightColour) meeting, shaking. */
export const Handshake: React.FC<IllProps> = (props) => {
  const t = useT();
  const shake = Math.sin(t * 7) * (t < 2.5 ? 6 : 2);
  return (
    <svg width={380} height={240} viewBox="0 0 380 240" overflow="visible">
      <g transform={`translate(0 ${shake})`}>
        <rect x={0} y={90} width={130} height={70} fill={colourOf(props.leftColour, C.ink)} stroke={C.board} strokeWidth={S} />
        <rect x={120} y={84} width={24} height={82} fill={C.paper} stroke={C.board} strokeWidth={S} />
        <rect x={250} y={90} width={130} height={70} fill={colourOf(props.rightColour, C.stamp)} stroke={C.board} strokeWidth={S} />
        <rect x={236} y={84} width={24} height={82} fill={C.paper} stroke={C.board} strokeWidth={S} />
        <path d="M142 100 Q190 70 238 96 L238 158 Q190 178 142 158 Z" fill={C.greyLight} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d="M168 104 Q186 124 180 156" stroke={C.board} strokeWidth={S} fill="none" />
        <path d="M186 100 Q204 122 198 158" stroke={C.board} strokeWidth={S} fill="none" />
        <path d="M204 98 Q220 120 216 156" stroke={C.board} strokeWidth={S} fill="none" />
        <path d="M196 96 Q212 78 232 90" stroke={C.board} strokeWidth={S} fill="none" />
      </g>
    </svg>
  );
};

/** Judge's gavel that slams on its block every 1.4 s with impact lines. label under the block. */
export const Gavel: React.FC<IllProps> = ({colour, label}) => {
  const t = useT();
  const ph = frac(t / 1.4);
  const angle = ph < 0.7 ? -35 * easeInOut(ph / 0.7) : ph < 0.8 ? -35 * (1 - (ph - 0.7) / 0.1) : 0;
  const impact = ph >= 0.78 && ph < 0.95;
  return (
    <svg width={320} height={280} viewBox="0 0 320 280" overflow="visible">
      <rect x={170} y={200} width={120} height={34} rx={6} fill={C.board} />
      {impact ? (
        <g stroke={C.board} strokeWidth={4} strokeLinecap="round">
          <line x1={176} y1={194} x2={152} y2={180} />
          <line x1={284} y1={194} x2={308} y2={180} />
          <line x1={230} y1={250} x2={230} y2={266} />
        </g>
      ) : null}
      <g transform={`rotate(${angle} 30 160)`}>
        <rect x={30} y={153} width={182} height={14} rx={6} fill={C.grey} stroke={C.board} strokeWidth={S} />
        <rect x={200} y={110} width={56} height={90} rx={8} fill={colourOf(colour, C.grey)} stroke={C.board} strokeWidth={S} />
        <rect x={200} y={122} width={56} height={10} fill={C.paper} stroke={C.board} strokeWidth={2} />
        <rect x={200} y={178} width={56} height={10} fill={C.paper} stroke={C.board} strokeWidth={2} />
      </g>
      {label ? (
        <text x={230} y={276} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board}>
          {label}
        </text>
      ) : null}
    </svg>
  );
};

/** Light bulb that flickers on at 0.6 s and radiates (idea moment). */
export const Lightbulb: React.FC<IllProps> = () => {
  const t = useT();
  const on = t > 0.9 || (t > 0.6 && frac(t * 15) < 0.5);
  const rays: React.ReactNode[] = [];
  if (on) {
    for (let i = 0; i < 9; i++) {
      const a = ((-180 + i * 22.5) * Math.PI) / 180;
      const r2 = 125 + 6 * Math.sin(t * 6 + i);
      rays.push(<line key={i} x1={100 + Math.cos(a) * 100} y1={95 + Math.sin(a) * 100} x2={100 + Math.cos(a) * r2} y2={95 + Math.sin(a) * r2} stroke={C.stamp} strokeWidth={6} strokeLinecap="round" />);
    }
  }
  return (
    <svg width={200} height={300} viewBox="0 0 200 300" overflow="visible">
      {rays}
      <path d="M100 20 C160 20 180 80 160 120 C150 140 136 150 134 180 L66 180 C64 150 50 140 40 120 C20 80 40 20 100 20 Z" fill={on ? C.paper : C.greyLight} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      <path d="M80 180 L80 120 L90 100 L100 120 L110 100 L120 120 L120 180" stroke={on ? C.stamp : C.grey} strokeWidth={4} fill="none" strokeLinejoin="round" />
      <path d="M70 60 Q76 44 92 40" stroke={C.paper} strokeWidth={6} fill="none" strokeLinecap="round" opacity={on ? 0 : 0.8} />
      <rect x={66} y={180} width={68} height={50} rx={6} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
      <line x1={66} y1={196} x2={134} y2={196} stroke={C.board} strokeWidth={S} />
      <line x1={66} y1={212} x2={134} y2={212} stroke={C.board} strokeWidth={S} />
      <rect x={84} y={230} width={32} height={14} rx={4} fill={C.board} />
    </svg>
  );
};

/** Coins raining down, spinning. */
export const CoinRain: React.FC<IllProps> = () => {
  const t = useT();
  const coins: React.ReactNode[] = [];
  for (let k = 0; k < 14; k++) {
    const x = 20 + frac(k * 0.618) * 380;
    const speed = 140 + (k % 4) * 30;
    const y = frac((t * speed) / 500 + k * 0.37) * 520 - 60;
    const sx = Math.max(0.15, Math.abs(Math.cos(t * 4 + k)));
    const o = 1 - c01((y - 380) / 40);
    coins.push(
      <g key={k} opacity={o} transform={`translate(${x} ${y}) scale(${sx} 1)`}>
        <circle r={22} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
        <circle r={15} fill="none" stroke={C.grey} strokeWidth={2} />
        {sx > 0.4 ? (
          <text y={7} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={20} fill={C.board}>
            $
          </text>
        ) : null}
      </g>,
    );
  }
  return (
    <svg width={420} height={420} viewBox="0 0 420 420" overflow="visible">
      {coins}
    </svg>
  );
};

/** Money bag wobbling; label replaces the $ sign. */
export const MoneyBag: React.FC<IllProps> = ({label, colour}) => {
  const t = useT();
  return (
    <svg width={240} height={280} viewBox="0 0 240 280" overflow="visible">
      <g transform={`rotate(${Math.sin(t * 2) * 3} 120 270)`}>
        <path d="M80 70 Q40 110 30 180 Q20 260 120 266 Q220 260 210 180 Q200 110 160 70 Z" fill={colourOf(colour, C.greyLight)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d="M80 70 L70 40 Q120 56 170 40 L160 70 Z" fill={colourOf(colour, C.greyLight)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <rect x={76} y={64} width={88} height={14} rx={6} fill={C.stamp} stroke={C.board} strokeWidth={S} />
        <text x={120} y={label ? 200 : 215} textAnchor="middle" fontFamily={label ? FONT_MONO : FONT_HEAD} fontWeight={800} fontSize={label ? 34 : 110} fill={C.ink} {...fitText(label, 7, 150)}>
          {label || '$'}
        </text>
      </g>
    </svg>
  );
};

/** Swinging price tag. label = price text. */
export const PriceTag: React.FC<IllProps> = ({label, colour}) => {
  const t = useT();
  return (
    <svg width={300} height={200} viewBox="0 0 300 200" overflow="visible">
      <path d="M55 100 Q20 60 10 10" stroke={C.board} strokeWidth={3} fill="none" />
      <g transform={`rotate(${Math.sin(t * 2.4) * 6} 55 100)`}>
        <path d="M20 100 L70 30 L280 30 L280 170 L70 170 Z" fill={colourOf(colour, C.paper)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <circle cx={55} cy={100} r={10} fill={C.paper} stroke={C.stamp} strokeWidth={5} />
        <text x={178} y={116} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={44} fill={C.board} {...fitText(label, 7, 190)}>
          {label || '$99'}
        </text>
      </g>
    </svg>
  );
};

const Bust: React.FC<{x: number; y: number; s: number; fill: string; bob: number}> = ({x, y, s, fill, bob}) => (
  <g transform={`translate(${x} ${y + bob})`}>
    <path d={`M${-45 * s} 0 Q${-45 * s} ${-60 * s} 0 ${-62 * s} Q${45 * s} ${-60 * s} ${45 * s} 0 Z`} fill={fill} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
    <circle cx={0} cy={-90 * s} r={26 * s} fill={fill} stroke={C.board} strokeWidth={S} />
  </g>
);

/** Crowd of faceless silhouettes, bobbing. props.highlight = index of one front figure drawn in ink. */
export const Crowd: React.FC<IllProps> = (props) => {
  const t = useT();
  const hi = typeof props.highlight === 'number' ? props.highlight : -1;
  return (
    <svg width={640} height={320} viewBox="0 0 640 320" overflow="visible">
      {Array.from({length: 9}, (_, i) => (
        <Bust key={'b' + i} x={30 + i * 72} y={230} s={0.8} fill={C.grey} bob={Math.sin(t * 3 + i * 1.3) * 3} />
      ))}
      {Array.from({length: 8}, (_, i) => (
        <Bust key={'f' + i} x={60 + i * 74} y={320} s={1} fill={i === hi ? C.ink : C.board} bob={Math.sin(t * 2.6 + i * 0.9) * 3} />
      ))}
    </svg>
  );
};

/** Queue of faceless people waiting at a door. label = sign above the door. */
export const Queue: React.FC<IllProps> = ({label}) => {
  const t = useT();
  const fills = [C.board, C.grey, C.ink, C.board, C.grey, C.board];
  return (
    <svg width={680} height={300} viewBox="0 0 680 300" overflow="visible">
      <rect x={600} y={70} width={70} height={220} fill={C.board} />
      <rect x={590} y={30} width={90} height={34} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <text x={635} y={54} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.board} {...fitText(label, 8, 80)}>
        {label || 'OPEN'}
      </text>
      {fills.map((f, i) => {
        const x = 540 - i * 88 + Math.sin(t * 1.5 + i) * 3;
        const bob = -Math.abs(Math.sin(t * 2 + i * 0.8)) * 4;
        return (
          <g key={i} transform={`translate(${x} ${bob})`}>
            <rect x={-16} y={200} width={13} height={90} rx={6} fill={f === C.board ? C.grey : C.board} />
            <rect x={3} y={200} width={13} height={90} rx={6} fill={f === C.board ? C.grey : C.board} />
            <rect x={-28} y={96} width={56} height={116} rx={22} fill={f} stroke={C.board} strokeWidth={S} />
            <circle cx={0} cy={70} r={22} fill={f} stroke={C.board} strokeWidth={S} />
          </g>
        );
      })}
      <line x1={0} y1={290} x2={680} y2={290} stroke={C.board} strokeWidth={4} />
    </svg>
  );
};

/** Flying envelope with speed lines. */
export const Envelope: React.FC<IllProps> = ({colour}) => {
  const t = useT();
  const x = Math.sin(t * 1.5) * 20;
  const y = Math.sin(t * 2.3) * 14;
  const rot = Math.sin(t * 1.5 + 1) * 8;
  return (
    <svg width={300} height={220} viewBox="0 0 300 220" overflow="visible">
      {[90, 115, 140].map((ly, i) => {
        const o = frac(t * 2 + i * 0.3);
        return <line key={ly} x1={10 + o * 10} y1={ly} x2={50 - o * 10} y2={ly} stroke={C.grey} strokeWidth={4} strokeLinecap="round" opacity={1 - o} />;
      })}
      <g transform={`translate(${x} ${y}) rotate(${rot} 160 115)`}>
        <rect x={60} y={50} width={200} height={130} fill={colourOf(colour, C.paper)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        <path d="M60 50 L160 125 L260 50" stroke={C.board} strokeWidth={S} fill="none" strokeLinejoin="round" />
        <path d="M60 180 L135 115" stroke={C.board} strokeWidth={2} />
        <path d="M260 180 L185 115" stroke={C.board} strokeWidth={2} />
        <rect x={220} y={60} width={28} height={32} fill={C.stamp} stroke={C.board} strokeWidth={2} />
      </g>
    </svg>
  );
};

const wrap = (s: string, n: number): string[] => {
  const out: string[] = [];
  let line = '';
  for (const w of s.split(/\s+/)) {
    if (!w) continue;
    if ((line + ' ' + w).trim().length > n && line) {
      out.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out.slice(0, 4);
};

/** Telegram that types itself, then gets a SENT stamp. label = message (use STOP). */
export const Telegram: React.FC<IllProps> = ({label}) => {
  const t = useT();
  const msg = (label || 'MESSAGE RECEIVED STOP REPLY BY RETURN STOP').toUpperCase();
  const shown = msg.slice(0, Math.floor(t * 14));
  const lines = wrap(shown, 24);
  const st = easeOut((t - (msg.length / 14 + 0.3)) / 0.3);
  return (
    <svg width={360} height={240} viewBox="0 0 360 240" overflow="visible">
      <rect x={10} y={10} width={340} height={220} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <rect x={10} y={10} width={340} height={40} fill={C.board} />
      <text x={180} y={38} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={22} letterSpacing={6} fill={C.paper}>
        TELEGRAM
      </text>
      {lines.map((l, i) => (
        <text key={i} x={28} y={86 + i * 30} fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board}>
          {l}
        </text>
      ))}
      {st > 0 ? (
        <g transform={`translate(296 184) scale(${2 - st}) rotate(-12)`} opacity={st}>
          <circle r={34} fill="none" stroke={C.ink} strokeWidth={4} />
          <text y={6} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={16} fill={C.ink}>
            SENT
          </text>
        </g>
      ) : null}
    </svg>
  );
};

/** Desk calendar flipping through pages. props.pages = ['01','02',...], label = month. */
export const FlipCalendar: React.FC<IllProps> = (props) => {
  const t = useT();
  const pages: string[] = Array.isArray(props.pages) && props.pages.length ? props.pages.map(String) : ['01', '02', '03', '04', '05'];
  const per = 0.7;
  const idx = Math.min(pages.length - 1, Math.floor(t / per));
  const local = frac(t / per);
  const flipping = idx < pages.length - 1 && local > 0.6;
  const f = flipping ? (local - 0.6) / 0.4 : 0;
  const under = flipping ? pages[idx + 1] : pages[idx];
  const big = (s: string) => (
    <text x={120} y={200} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={s.length > 3 ? 48 : 90} fill={C.board}>
      {s}
    </text>
  );
  return (
    <svg width={240} height={260} viewBox="0 0 240 260" overflow="visible">
      <rect x={20} y={30} width={200} height={210} rx={10} fill={C.paper} stroke={C.board} strokeWidth={S} />
      {big(under)}
      {flipping ? (
        <g transform={`translate(0 80) scale(1 ${1 - f}) translate(0 -80)`}>
          <rect x={20} y={80} width={200} height={160} fill={C.paper} stroke={C.board} strokeWidth={S} />
          {big(pages[idx])}
        </g>
      ) : null}
      <rect x={20} y={30} width={200} height={50} rx={10} fill={colourOf(props.colour, C.stamp)} stroke={C.board} strokeWidth={S} />
      <text x={120} y={66} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={28} fill={C.paper}>
        {props.label || 'JAN'}
      </text>
      <circle cx={70} cy={30} r={8} fill={C.board} />
      <circle cx={170} cy={30} r={8} fill={C.board} />
    </svg>
  );
};

/** Hourglass running and flipping. props.seconds = cycle length (default 4). */
export const Hourglass: React.FC<IllProps> = (props) => {
  const t = useT();
  const P = typeof props.seconds === 'number' && props.seconds > 0.5 ? props.seconds : 4;
  const ph = frac(t / P);
  const a = 1 - c01(ph / 0.88);
  const rot = ph > 0.88 ? 180 * easeInOut((ph - 0.88) / 0.12) : 0;
  const topY = 60 + (1 - a) * 85;
  const hw = 50 - ((topY - 28) / 122) * 42;
  const h = (1 - a) * 80;
  return (
    <svg width={200} height={300} viewBox="0 0 200 300" overflow="visible">
      <g transform={`rotate(${rot} 100 150)`}>
        <path d="M50 28 L150 28 Q150 110 108 150 Q150 190 150 272 L50 272 Q50 190 92 150 Q50 110 50 28 Z" fill={C.paper} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
        {a > 0.01 ? <polygon points={`${100 - hw},${topY} ${100 + hw},${topY} 104,146 96,146`} fill={colourOf(props.colour, C.stamp)} /> : null}
        {h > 1 ? <polygon points={`56,270 144,270 100,${270 - h}`} fill={colourOf(props.colour, C.stamp)} /> : null}
        {a > 0.01 && ph < 0.88 ? <line x1={100} y1={148} x2={100} y2={270} stroke={colourOf(props.colour, C.stamp)} strokeWidth={3} /> : null}
        <rect x={30} y={10} width={140} height={18} rx={4} fill={C.board} />
        <rect x={30} y={272} width={140} height={18} rx={4} fill={C.board} />
        <line x1={40} y1={28} x2={40} y2={272} stroke={C.board} strokeWidth={6} />
        <line x1={160} y1={28} x2={160} y2={272} stroke={C.board} strokeWidth={6} />
      </g>
    </svg>
  );
};

/** Scales of justice, beam tilting. props.tilt (deg, + = left heavier), props.left / props.right labels. */
export const Scales: React.FC<IllProps> = (props) => {
  const t = useT();
  const a = (typeof props.tilt === 'number' ? -props.tilt : 0) + Math.sin(t * 1.4) * 6;
  const rad = (a * Math.PI) / 180;
  const ends = [-1, 1].map((d) => ({x: 190 + d * 130 * Math.cos(rad), y: 70 + d * 130 * Math.sin(rad)}));
  const labs = [props.left, props.right];
  return (
    <svg width={380} height={320} viewBox="0 0 380 320" overflow="visible">
      <rect x={182} y={60} width={16} height={222} fill={C.board} />
      <path d="M120 300 L260 300 L230 280 L150 280 Z" fill={C.board} />
      <line x1={ends[0].x} y1={ends[0].y} x2={ends[1].x} y2={ends[1].y} stroke={C.board} strokeWidth={12} strokeLinecap="round" />
      <circle cx={190} cy={56} r={12} fill={C.stamp} stroke={C.board} strokeWidth={S} />
      {ends.map((e, i) => (
        <g key={i}>
          <line x1={e.x} y1={e.y} x2={e.x - 40} y2={e.y + 110} stroke={C.board} strokeWidth={2} />
          <line x1={e.x} y1={e.y} x2={e.x + 40} y2={e.y + 110} stroke={C.board} strokeWidth={2} />
          <path d={`M${e.x - 50} ${e.y + 110} Q${e.x} ${e.y + 150} ${e.x + 50} ${e.y + 110} Z`} fill={i ? C.stamp : C.ink} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
          {labs[i] ? (
            <text x={e.x} y={e.y + 166} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board}>
              {String(labs[i])}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
};

/** Magnifying glass sweeping in a small search circle. */
export const MagnifyingGlass: React.FC<IllProps> = ({colour}) => {
  const t = useT();
  const dx = Math.cos(t * 1.6) * 20;
  const dy = Math.sin(t * 1.6) * 16;
  return (
    <svg width={260} height={260} viewBox="0 0 260 260" overflow="visible">
      <g transform={`translate(${dx} ${dy})`}>
        <line x1={160} y1={160} x2={230} y2={230} stroke={C.board} strokeWidth={26} strokeLinecap="round" />
        <line x1={160} y1={160} x2={230} y2={230} stroke={colourOf(colour, C.stamp)} strokeWidth={18} strokeLinecap="round" />
        <circle cx={110} cy={110} r={70} fill={C.greyLight} fillOpacity={0.35} stroke={C.board} strokeWidth={16} />
        <circle cx={110} cy={110} r={70} fill="none" stroke={C.ink} strokeWidth={8} />
        <path d="M70 90 Q78 70 98 64" stroke={C.paper} strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};

/** Padlock: a key slides in, turns and the shackle pops open. props.locked = true keeps it shut. */
export const LockKey: React.FC<IllProps> = (props) => {
  const t = useT();
  const kdx = (1 - easeOut(t / 0.7)) * 200;
  const turn = -90 * easeOut((t - 0.75) / 0.3);
  const up = props.locked ? 0 : easeOut((t - 1.1) / 0.3) * 30;
  return (
    <svg width={260} height={300} viewBox="0 0 260 300" overflow="visible">
      <g transform={`translate(0 ${-up})`}>
        <path d="M80 140 L80 80 A50 50 0 0 1 180 80 L180 140" stroke={C.board} strokeWidth={26} fill="none" />
        <path d="M80 140 L80 80 A50 50 0 0 1 180 80 L180 140" stroke={C.greyLight} strokeWidth={18} fill="none" />
      </g>
      <rect x={50} y={130} width={160} height={140} rx={16} fill={colourOf(props.colour, C.stamp)} stroke={C.board} strokeWidth={S} />
      <circle cx={130} cy={190} r={14} fill={C.board} />
      <rect x={124} y={196} width={12} height={30} fill={C.board} />
      <g opacity={c01(t / 0.3)} transform={`translate(${130 + kdx} 190) rotate(${turn})`}>
        <rect x={0} y={-6} width={100} height={12} fill={C.ink} stroke={C.board} strokeWidth={2} />
        <rect x={12} y={6} width={10} height={12} fill={C.ink} stroke={C.board} strokeWidth={2} />
        <rect x={32} y={6} width={10} height={8} fill={C.ink} stroke={C.board} strokeWidth={2} />
        <circle cx={128} cy={0} r={28} fill={C.ink} stroke={C.board} strokeWidth={S} />
        <circle cx={138} cy={0} r={8} fill={C.paper} stroke={C.board} strokeWidth={2} />
      </g>
    </svg>
  );
};

const STAR = 'M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z';

/** Trophy with twinkling sparkles. label on the plinth. */
export const Trophy: React.FC<IllProps> = ({colour, label}) => {
  const t = useT();
  const stars = [
    [30, 30],
    [210, 50],
    [200, 150],
    [24, 140],
  ];
  return (
    <svg width={240} height={300} viewBox="0 0 240 300" overflow="visible">
      <path d="M50 50 Q10 50 20 90 Q30 120 60 115" stroke={C.board} strokeWidth={10} fill="none" />
      <path d="M190 50 Q230 50 220 90 Q210 120 180 115" stroke={C.board} strokeWidth={10} fill="none" />
      <path d="M50 30 L190 30 Q190 140 120 160 Q50 140 50 30 Z" fill={colourOf(colour, C.stamp)} stroke={C.board} strokeWidth={S} strokeLinejoin="round" />
      <path d="M74 46 Q76 100 102 130" stroke={C.paper} strokeWidth={6} fill="none" strokeLinecap="round" />
      <rect x={108} y={160} width={24} height={40} fill={C.board} />
      <rect x={70} y={200} width={100} height={26} fill={C.board} />
      <rect x={55} y={226} width={130} height={50} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <text x={120} y={258} textAnchor="middle" fontFamily={FONT_MONO} fontWeight={700} fontSize={18} fill={C.board} {...fitText(label, 10, 110)}>
        {label || '#1'}
      </text>
      {stars.map(([x, y], k) => {
        const s = Math.max(0, Math.sin(t * 3 + k * 1.7));
        return s > 0.02 ? <path key={k} d={STAR} transform={`translate(${x} ${y}) scale(${s})`} fill={C.ink} /> : null;
      })}
    </svg>
  );
};

/** Share certificate with ornate border and a rotating seal. label = company; props.number, props.shares. */
export const ShareCertificate: React.FC<IllProps> = (props) => {
  const t = useT();
  const s = easeOut((t - 0.6) / 0.4);
  return (
    <svg width={400} height={280} viewBox="0 0 400 280" overflow="visible">
      <rect x={10} y={10} width={380} height={260} fill={C.paper} stroke={C.board} strokeWidth={S} />
      <rect x={22} y={22} width={356} height={236} fill="none" stroke={C.ink} strokeWidth={3} />
      <rect x={30} y={30} width={340} height={220} fill="none" stroke={C.ink} strokeWidth={1.5} strokeDasharray="6 4" />
      {[
        [22, 22],
        [378, 22],
        [22, 258],
        [378, 258],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={10} fill={C.ink} stroke={C.board} strokeWidth={2} />
      ))}
      <text x={200} y={72} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} letterSpacing={2} fill={C.ink}>
        SHARE CERTIFICATE
      </text>
      <text x={200} y={124} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} fill={C.board} {...fitText(props.label, 18, 300)}>
        {props.label || 'COMPANY LTD'}
      </text>
      <text x={200} y={156} textAnchor="middle" fontFamily={FONT_MONO} fontSize={16} fill={C.board}>
        {props.shares || '100 SHARES'}
      </text>
      <line x1={60} y1={214} x2={180} y2={214} stroke={C.board} strokeWidth={2} />
      <text x={60} y={240} fontFamily={FONT_MONO} fontSize={14} fill={C.grey}>
        {props.number || 'No. 0001'}
      </text>
      {s > 0 ? (
        <g transform={`translate(318 200) scale(${s}) rotate(${t * 20})`}>
          <circle r={36} fill={C.stamp} stroke={C.board} strokeWidth={6} strokeDasharray="4 3" />
          <circle r={24} fill="none" stroke={C.paper} strokeWidth={2} />
        </g>
      ) : null}
    </svg>
  );
};

/** The classic spinning newspaper: spins in from nothing to a headline. Same props as Newspaper. */
export const SpinningNewspaper: React.FC<IllProps> = (props) => {
  const t = useT();
  const p = easeOut(t / 1.2);
  return (
    <div style={{width: 380, height: 280, transform: `rotate(${(1 - p) * 720}deg) scale(${Math.max(0.001, p)})`}}>
      <Newspaper {...props} />
    </div>
  );
};

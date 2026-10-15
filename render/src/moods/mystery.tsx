import React from 'react';
import {C, FONT_HEAD, FONT_MONO, STROKE} from '../constants';
import {c01, easeInOut, fitText} from '../illustrations/kit';
import {Figure, PopText, ShotSvg, pop, type ShotProps} from './kit';
import {Caption, Floor} from './parts';

/** Drifting fog banks hide a lone figure under a street lamp; the fog thins in the second half. */
export const Fog: React.FC<ShotProps> = ({t, dur, p}) => {
  const clear = c01((t - dur * 0.45) / Math.max(0.5, dur * 0.4));
  const band = (L: number): React.ReactNode => {
    const y = 900 - L * 180;
    const speed = 40 + L * 35;
    const dir = L % 2 === 0 ? 1 : -1;
    const op = (0.85 - L * 0.15) * (1 - 0.7 * clear);
    const blobs = Array.from({length: 7}, (_, i) => {
      const raw = i * 380 + t * speed * dir;
      const x = (((raw % 2660) + 2660) % 2660) - 370;
      return <ellipse key={i} cx={x.toFixed(1)} cy={(y + 30 * Math.sin(i + L)).toFixed(1)} rx={300} ry={90} fill={C.paper} />;
    });
    return (
      <g key={L} opacity={op.toFixed(3)}>
        {blobs}
      </g>
    );
  };
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.greyLight} />
      <Floor y={940} stroke={C.grey} />
      <g opacity={(0.35 + 0.65 * clear).toFixed(3)}>
        <rect x={1290} y={420} width={16} height={520} fill={C.board} />
        <path d="M1260 420 L1336 420 L1320 360 L1276 360 Z" fill={C.board} />
        <circle cx={1298} cy={398} r={14} fill={C.paper} />
        <Figure x={900} y={940} s={1} colour="board" />
      </g>
      {[2, 1, 0].map(band)}
      <Caption text={p.text} t={t} at={dur * 0.7} />
    </ShotSvg>
  );
};

/** A grey silhouette under a spotlight, a big question mark; a flash reveals the figure and a name card. */
export const SilhouetteReveal: React.FC<ShotProps> = ({t, dur, p}) => {
  const at = Math.max(1.2, dur * 0.5);
  const revealed = t >= at;
  const beam = c01(t / 0.6);
  const flash = revealed ? 1 - c01((t - at) / 0.35) : 0;
  const card = pop((t - at - 0.2) / 0.35);
  const name = String(p.text || 'THE BUYER');
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.board} />
      <polygon points="900,0 1020,0 1260,960 660,960" fill={C.paper} opacity={((0.1 + (revealed ? 0.12 : 0)) * beam).toFixed(3)} />
      <ellipse cx={960} cy={962} rx={300} ry={36} fill={C.paper} opacity={(0.18 * beam).toFixed(3)} />
      <Figure x={960} y={960} s={1.2} colour={revealed ? p.colour || 'ink' : 'grey'} />
      {!revealed ? <PopText x={960} y={300} text="?" t={t} at={0.4} size={260} fill={C.paper} /> : null}
      {card > 0 ? (
        <g transform={`translate(960 190) scale(${card.toFixed(3)})`}>
          <rect x={-300} y={-62} width={600} height={124} rx={10} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={64} fill={C.board} {...fitText(name, 16, 560)}>
            {name}
          </text>
        </g>
      ) : null}
      {flash > 0 ? <rect width={1920} height={1080} fill={C.paper} opacity={flash.toFixed(3)} /> : null}
    </ShotSvg>
  );
};

/** A magnifying glass sweeps over a document (magnified view inside the lens) and stops on the key words. */
export const MagnifierSweep: React.FC<ShotProps> = ({t, dur, p}) => {
  const clipId = 'mood-magnifier-lens';
  const span = Math.max(1.5, dur * 0.7);
  const k = c01((t - 0.2) / span);
  const e = easeInOut(k);
  const word = String(p.text || 'CLAUSE 7');
  const title = String(p.title || 'AGREEMENT');
  const tx = Math.min(900, 620 + word.length * 10.2);
  const ty = 652;
  const lx = 1100 + (tx - 1100) * e + 220 * Math.sin(k * Math.PI * 3) * (1 - k);
  const ly = 330 + (ty - 330) * e + 50 * Math.sin(k * Math.PI * 5) * (1 - k);
  const found = k >= 1;
  const hl = c01((t - 0.2 - span) / 0.4);
  const hlW = Math.min(680, word.length * 20.4 + 16);
  const doc = (key: string): React.ReactNode => (
    <g key={key}>
      <rect x={560} y={160} width={800} height={800} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
      <text x={960} y={250} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={56} fill={C.board} {...fitText(title, 22, 700)}>
        {title}
      </text>
      {Array.from({length: 12}, (_, i) => (i === 7 ? null : <rect key={i} x={620} y={300 + i * 50} width={520 + ((i * 131) % 160)} height={14} fill={C.grey} />))}
      <rect x={612} y={630} width={hlW} height={44} fill={C.stamp} opacity={(0.35 * hl).toFixed(3)} />
      <text x={620} y={664} fontFamily={FONT_MONO} fontSize={34} fill={found ? C.stamp : C.board} {...fitText(word, 30, 680)}>
        {word}
      </text>
    </g>
  );
  const R = 130;
  return (
    <ShotSvg>
      <rect width={1920} height={1080} fill={C.greyLight} />
      {doc('base')}
      <defs>
        <clipPath id={clipId}>
          <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r={R} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={(lx - R).toFixed(1)} y={(ly - R).toFixed(1)} width={2 * R} height={2 * R} fill={C.greyLight} />
        <g transform={`translate(${lx.toFixed(1)} ${ly.toFixed(1)}) scale(1.9) translate(${(-lx).toFixed(1)} ${(-ly).toFixed(1)})`}>{doc('zoom')}</g>
      </g>
      <line x1={(lx + R * 0.7).toFixed(1)} y1={(ly + R * 0.7).toFixed(1)} x2={(lx + R * 1.9).toFixed(1)} y2={(ly + R * 1.9).toFixed(1)} stroke={C.board} strokeWidth={30} strokeLinecap="round" />
      <circle cx={lx.toFixed(1)} cy={ly.toFixed(1)} r={R} fill="none" stroke={C.board} strokeWidth={16} />
      <Caption text={p.caption} t={t} at={0.2 + span} />
    </ShotSvg>
  );
};

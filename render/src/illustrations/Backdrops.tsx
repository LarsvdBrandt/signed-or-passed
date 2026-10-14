import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, STROKE} from '../constants';

const S = STROKE;

const Full: React.FC<{children: React.ReactNode; bg: string}> = ({children, bg}) => (
  <AbsoluteFill style={{backgroundColor: bg}}>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
      {children}
    </svg>
  </AbsoluteFill>
);

// [x, height, width], bottoms at y = 960
const SKYLINE = [
  [0, 520, 220], [230, 380, 160], [400, 600, 200], [610, 450, 140], [760, 700, 240],
  [1010, 420, 180], [1200, 560, 150], [1360, 340, 210], [1580, 620, 170], [1760, 480, 180],
];

export const CityBackdrop: React.FC = () => (
  <Full bg={C.paper}>
    {SKYLINE.map(([x, h, w], i) => {
      const top = 960 - h;
      const wins = [];
      for (let yy = top + 34; yy < 920; yy += 70) {
        for (let xx = x + 26; xx < x + w - 30; xx += 50) wins.push([xx, yy]);
      }
      return (
        <g key={i}>
          <rect x={x} y={top} width={w} height={h} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
          {wins.map(([wx, wy], k) => (
            <rect key={k} x={wx} y={wy} width={18} height={28} fill={(k + i) % 5 === 0 ? C.paper : C.grey} />
          ))}
        </g>
      );
    })}
    <rect x={-10} y={960} width={1940} height={130} fill={C.grey} stroke={C.board} strokeWidth={S} />
  </Full>
);

export const OfficeBackdrop: React.FC = () => (
  <Full bg={C.paper}>
    <rect x={1200} y={130} width={560} height={420} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
    {[[1240, 380, 90], [1340, 300, 70], [1420, 420, 110], [1540, 340, 80], [1630, 400, 90]].map(([x, top, w], i) => (
      <rect key={i} x={x} y={top} width={w} height={550 - top} fill={C.grey} />
    ))}
    <rect x={1200} y={130} width={560} height={420} fill="none" stroke={C.board} strokeWidth={S * 3} />
    <line x1={1480} y1={130} x2={1480} y2={550} stroke={C.board} strokeWidth={S * 2} />
    <line x1={1200} y1={340} x2={1760} y2={340} stroke={C.board} strokeWidth={S * 2} />
    <rect x={260} y={200} width={260} height={180} fill={C.paper} stroke={C.board} strokeWidth={S * 2} />
    <polyline points="280,360 350,280 400,330 450,260 500,360" fill={C.greyLight} stroke={C.board} strokeWidth={S} />
    <rect x={-10} y={820} width={1940} height={270} fill={C.greyLight} stroke={C.board} strokeWidth={S} />
    <rect x={-10} y={800} width={1940} height={20} fill={C.grey} stroke={C.board} strokeWidth={S} />
  </Full>
);

export const BoardroomBackdrop: React.FC = () => (
  <Full bg={C.board}>
    {[480, 960, 1440].map((x) => (
      <g key={x}>
        <line x1={x} y1={0} x2={x} y2={150} stroke={C.grey} strokeWidth={S} />
        <polygon points={`${x - 70},220 ${x - 30},150 ${x + 30},150 ${x + 70},220`} fill={C.greyLight} stroke={C.grey} strokeWidth={S} />
      </g>
    ))}
    {[260, 520, 780, 1040, 1300, 1560].map((x) => (
      <rect key={x} x={x} y={560} width={110} height={200} rx={24} fill={C.grey} stroke={C.board} strokeWidth={S} />
    ))}
    <rect x={120} y={740} width={1680} height={70} fill={C.greyLight} stroke={C.grey} strokeWidth={S} />
    <rect x={180} y={810} width={1560} height={300} fill={C.grey} stroke={C.board} strokeWidth={S} />
  </Full>
);

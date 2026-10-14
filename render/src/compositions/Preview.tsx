import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_MONO, STROKE} from '../constants';
import {PaperGrain, enterStyle} from '../components/common';
import {ILLUSTRATIONS} from '../illustrations';

const CELLS: Array<{name: string; props?: any; label: string; dark?: boolean}> = [
  {name: 'Desk', label: 'Desk'},
  {name: 'Contract', label: 'Contract', props: {label: 'AGREEMENT'}},
  {name: 'FountainPen', label: 'FountainPen'},
  {name: 'Stamp', label: 'Stamp'},
  {name: 'DecisionChair', label: 'DecisionChair'},
  {name: 'Person', label: 'Person standing', props: {pose: 'standing'}},
  {name: 'Person', label: 'Person sitting', props: {pose: 'sitting', colour: 'ink'}},
  {name: 'Person', label: 'Person arms-crossed', props: {pose: 'arms-crossed', colour: 'stamp'}},
  {name: 'Person', label: 'Person pointing', props: {pose: 'pointing', colour: 'grey'}},
  {name: 'Person', label: 'Person handshake', props: {pose: 'handshake', colour: 'ink'}},
  {name: 'NameCard', label: 'NameCard', props: {label: 'THE FOUNDER'}},
  {name: 'Building', label: 'Building office', props: {type: 'office', label: 'ACME CORP'}},
  {name: 'Building', label: 'Building factory', props: {type: 'factory', label: 'WORKS'}},
  {name: 'Building', label: 'Building store', props: {type: 'store', label: 'SHOP'}},
  {name: 'Phone', label: 'Phone'},
  {name: 'Newspaper', label: 'Newspaper', props: {label: 'Deal of the decade?'}},
  {name: 'Briefcase', label: 'Briefcase'},
  {name: 'MoneyStack', label: 'MoneyStack'},
  {name: 'Clock', label: 'Clock'},
  {name: 'Calendar', label: 'Calendar', props: {label: 'MAR', day: 14}},
  {name: 'Arrow', label: 'Arrow'},
  {name: 'Spotlight', label: 'Spotlight', dark: true},
  {name: 'CityBackdrop', label: 'CityBackdrop'},
  {name: 'OfficeBackdrop', label: 'OfficeBackdrop'},
  {name: 'BoardroomBackdrop', label: 'BoardroomBackdrop'},
];

/** Contact sheet of the whole illustration library. */
export const Preview: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const cols = 5;
  const rows = Math.ceil(CELLS.length / cols);
  const cw = width / cols;
  const ch = height / rows;
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      {CELLS.map((cell, i) => {
        const entry = ILLUSTRATIONS[cell.name];
        const Comp = entry.C;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const isBackdrop = entry.w === 1920;
        const fit = Math.min((cw - 30) / entry.w, (ch - 50) / entry.h);
        const st = enterStyle(entry.enter === 'none' ? 'fade' : entry.enter, frame - i * 3, fps);
        return (
          <div key={i} style={{position: 'absolute', left: col * cw, top: row * ch, width: cw, height: ch, overflow: 'hidden', borderRight: `${STROKE}px solid ${C.greyLight}`, borderBottom: `${STROKE}px solid ${C.greyLight}`, background: cell.dark ? C.board : 'transparent', boxSizing: 'border-box'}}>
            {isBackdrop ? (
              <div style={{position: 'absolute', inset: 0, opacity: st.opacity}}>
                <Comp />
              </div>
            ) : (
              <div style={{position: 'absolute', left: '50%', top: '45%', width: entry.w, height: entry.h, transform: `translate(-50%, -50%) scale(${fit}) ${st.transform}`, opacity: st.opacity}}>
                <Comp {...(cell.props || {})} />
              </div>
            )}
            <div style={{position: 'absolute', left: 10, bottom: 6, fontFamily: FONT_MONO, fontSize: 16, color: cell.dark ? C.paper : C.board, background: cell.dark ? 'transparent' : C.paper, padding: '0 4px'}}>{cell.label}</div>
          </div>
        );
      })}
      <PaperGrain />
    </AbsoluteFill>
  );
};

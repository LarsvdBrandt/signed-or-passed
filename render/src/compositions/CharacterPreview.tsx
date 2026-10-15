import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {Character, POSE_NAMES, type CharacterProps} from '../characters/Rig';
import {COSTUMES, COSTUME_IDS, HAT_IDS, HOLD_IDS} from '../characters/Costumes';
import {Crowd2, type Crowd2Props} from '../characters/Crowd2';

const PER = 120;
const COLS = ['ink', 'stamp', 'board', 'grey'];
const COSTUME_POSES = ['stand', 'talk', 'wave', 'arms-crossed', 'point', 'thinking'];

type Page = {section: string; title: string; note: string; items?: CharacterProps[]; crowd?: Crowd2Props};

function chunk<T>(a: T[], n: number): T[][] {
  const o: T[][] = [];
  for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n));
  return o;
}

const posePages: Page[] = chunk(POSE_NAMES, 6).map((names, i, all) => ({
  section: 'CHARACTERS · POSES',
  title: `Poses ${i + 1}/${all.length}`,
  note: 'component Character, props.pose = <id> (loops; walk / run cycle in place; flip mirrors)',
  items: names.map((p, k) => ({pose: p, colour: COLS[k % COLS.length], label: p})),
}));

const costumePages: Page[] = chunk(COSTUME_IDS, 6).map((ids, i, all) => ({
  section: 'CHARACTERS · COSTUMES',
  title: `Costumes ${i + 1}/${all.length}`,
  note: ids.map((id) => `${id}: ${COSTUMES[id].eras.slice(0, 2).join('/') || 'default'}`).join(' · '),
  items: ids.map((id, k) => ({costume: id, pose: COSTUME_POSES[k % COSTUME_POSES.length], colour: COLS[k % COLS.length], label: id})),
}));

const hatPages: Page[] = chunk(HAT_IDS, 7).map((ids, i, all) => ({
  section: 'CHARACTERS · HATS',
  title: `Hats ${i + 1}/${all.length}`,
  note: "props.hat = <id> | none | auto (auto = the costume's own hat)",
  items: ids.map((id, k) => ({hat: id, pose: 'stand', colour: COLS[k % COLS.length], label: id})),
}));

const holdPages: Page[] = chunk(HOLD_IDS, 5).map((ids, i, all) => ({
  section: 'CHARACTERS · HELD PROPS',
  title: `Held props ${i + 1}/${all.length}`,
  note: 'props.hold / props.holdLeft = <id>; pose phone holds a handset, pose protest a placard (props.holdText)',
  items: ids.map((id, k) => ({
    hold: id,
    costume: 'suit',
    pose: id === 'phone' ? 'phone' : id === 'placard' ? 'protest' : k % 2 ? 'talk' : 'stand',
    holdText: id === 'placard' ? 'SIGN IT' : undefined,
    colour: COLS[k % COLS.length],
    label: id,
  })),
}));

const crowdPages: Page[] = [
  {section: 'CHARACTERS · CROWD2', title: 'Crowd2: office, seed 1', note: "{count: 9, seed: 1, costumes: ['suit','casual','fifties','dress']}", crowd: {count: 9, seed: 1, costumes: ['suit', 'casual', 'fifties', 'dress']}},
  {section: 'CHARACTERS · CROWD2', title: 'Crowd2: medieval market, seed 7', note: "{count: 8, seed: 7, costumes: ['tunic','royal','merchant'], poses: ['talk','point','stand','shrug']}", crowd: {count: 8, seed: 7, costumes: ['tunic', 'royal', 'merchant'], poses: ['talk', 'point', 'stand', 'shrug']}},
  {section: 'CHARACTERS · CROWD2', title: 'Crowd2: applause, 3 rows', note: "{count: 14, seed: 3, rows: 3, era: 'modern', poses: ['applause','celebrate']}", crowd: {count: 14, seed: 3, rows: 3, era: 'modern', poses: ['applause', 'celebrate']}},
];

const PAGES: Page[] = [...posePages, ...costumePages, ...hatPages, ...holdPages, ...crowdPages];

export const CHARACTER_PREVIEW_FRAMES = Math.max(1, PER * PAGES.length);

const PageView: React.FC<{page: Page}> = ({page}) => {
  const items = page.items || [];
  const n = Math.max(1, items.length);
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      <div style={{position: 'absolute', left: 60, top: 36, fontFamily: FONT_MONO, fontSize: 26, color: C.grey, letterSpacing: 4}}>{page.section}</div>
      <div style={{position: 'absolute', left: 60, top: 72, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 64, color: C.board}}>{page.title}</div>
      {items.map((it, i) => (
        <div key={i} style={{position: 'absolute', left: (1920 / n) * (i + 0.5) - 100, top: 330, width: 200, height: 400, transform: 'scale(1.15)', transformOrigin: '100px 386px'}}>
          <Character {...it} phase={i * 0.37} />
        </div>
      ))}
      {page.crowd ? (
        <div style={{position: 'absolute', left: 360, top: 300, width: 1200, height: 520}}>
          <Crowd2 {...page.crowd} />
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, padding: '0 28px', background: C.board, color: C.paper, display: 'flex', alignItems: 'center'}}>
        <span style={{fontFamily: FONT_MONO, fontSize: 21, opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{page.note}</span>
      </div>
    </AbsoluteFill>
  );
};

/** Every pose, costume, hat, held prop and a few Crowd2 crowds, 4 s per page. Rendered as preview-characters.mp4. */
export const CharacterPreview: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    {PAGES.map((p, i) => (
      <Sequence key={i} name={p.title} from={i * PER} durationInFrames={PER}>
        <PageView page={p} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

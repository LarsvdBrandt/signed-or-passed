import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C} from '../constants';
import {TEMPLATES, TEMPLATE_IDS, TemplateScene} from '../templates';

/** preview-templates.mp4: every scene template in its default era + two other eras, 4 s each (silent). */
const SEC = 4;
const FPS = 30;
const LEN = SEC * FPS;

const ENTRIES: Array<{id: string; era: string}> = [];
for (const id of TEMPLATE_IDS) {
  const def = TEMPLATES[id];
  for (const era of [def.defaultEra, ...(def.previewEras || [])]) ENTRIES.push({id, era});
}

export const TEMPLATE_PREVIEW_FRAMES = Math.max(1, ENTRIES.length * LEN);

export const TemplatePreview: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    {ENTRIES.map((e, i) => {
      const scene: any = {
        id: `${e.id}-${e.era}`,
        kind: 'template',
        narration: '',
        onScreenText: `${e.id} · ${e.era}`,
        visual: {template: e.id, era: e.era},
        startFrame: 0,
        durationFrames: LEN,
        sentences: [],
      };
      return (
        <Sequence key={scene.id} name={scene.id} from={i * LEN} durationInFrames={LEN}>
          <TemplateScene scene={scene} ctx={{verdict: 'SIGNED'} as any} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

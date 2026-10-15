import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_MONO} from '../constants';
import {Kicker, SourceLine, useUnit} from '../components/common';
import type {SceneProps} from '../types';
import {BarRace, DonutChart, LineAnnotated, NumberTicker, PercentRing, PieChart, RankingList, StackedArea} from './charts';
import type {InfoProps} from './shared';

export type {InfoProps} from './shared';

/**
 * Infographic registry (scene kind 'infographic', visual {type, title?, unit?, sourceId, data}).
 * Add a type: write a React.FC<InfoProps> and register it here + in schema/spec.schema.json ($defs/infographicType)
 * + docs/library/infographics.md. Data infographics need a sourceId (validate_spec.py).
 */
export const INFOGRAPHICS: Record<string, React.FC<InfoProps>> = {
  'bar-race': BarRace,
  'line-annotated': LineAnnotated,
  pie: PieChart,
  donut: DonutChart,
  'stacked-area': StackedArea,
  ranking: RankingList,
  ticker: NumberTicker,
  'percent-ring': PercentRing,
};

export const INFOGRAPHIC_TYPES = Object.keys(INFOGRAPHICS);

/** Scene kind 'infographic': title as kicker (visual.title or onScreenText), the chart, and the Source line. */
export const InfographicScene: React.FC<SceneProps> = ({scene, ctx}) => {
  const u = useUnit();
  const v = scene.visual || {};
  const Comp = INFOGRAPHICS[String(v.type)];
  return (
    <AbsoluteFill style={{backgroundColor: C.paper}}>
      {Comp ? (
        <Comp v={v} scene={scene} ctx={ctx} />
      ) : (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', fontFamily: FONT_MONO, fontSize: 40 * u, color: C.grey}}>unknown infographic: {String(v.type)}</AbsoluteFill>
      )}
      <Kicker text={v.title || scene.onScreenText} />
      <SourceLine sourceId={v.sourceId} sources={ctx.sources} />
    </AbsoluteFill>
  );
};

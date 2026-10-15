import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT_MONO} from '../constants';
import {Kicker, SourceLine, useUnit} from '../components/common';
import type {SceneProps} from '../types';
import {BarRace, DonutChart, LineAnnotated, NumberTicker, PercentRing, PieChart, RankingList, StackedArea} from './charts';
import {BubbleChart, CalendarHeatmap, Choropleth, ComparisonTable, MoneyStacks, WhatCouldBuy} from './charts2';
import {FamilyTree, FlowDiagram, OrgChart} from './charts3';
import type {InfoProps} from './shared';

export type {InfoProps} from './shared';

/**
 * Infographic registry (scene kind 'infographic', visual {type, title?, unit?, sourceId, data}).
 * Add a type: write a React.FC<InfoProps> and register it here + in schema/spec.schema.json ($defs/infographicType)
 * + docs/library/infographics.md. Data infographics need a sourceId (validate_spec.py); diagrams (org-chart,
 * family-tree, flow) do not.
 */
export const INFOGRAPHICS: Record<string, React.FC<InfoProps>> = {
  // INFOGRAPHICS-1 (charts.tsx)
  'bar-race': BarRace,
  'line-annotated': LineAnnotated,
  pie: PieChart,
  donut: DonutChart,
  'stacked-area': StackedArea,
  ranking: RankingList,
  ticker: NumberTicker,
  'percent-ring': PercentRing,
  // INFOGRAPHICS-2 (charts2.tsx)
  bubble: BubbleChart,
  'comparison-table': ComparisonTable,
  'calendar-heatmap': CalendarHeatmap,
  'map-choropleth': Choropleth,
  'money-stacks': MoneyStacks,
  'what-could-buy': WhatCouldBuy,
  // INFOGRAPHICS-3 (charts3.tsx): diagrams without data
  'org-chart': OrgChart,
  'family-tree': FamilyTree,
  flow: FlowDiagram,
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

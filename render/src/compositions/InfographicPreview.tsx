import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {C, FONT_HEAD, FONT_MONO} from '../constants';
import {INFOGRAPHICS, InfographicScene} from '../infographics';
import type {Scene, VideoProps} from '../types';

/** 6 s per infographic type. All values are PLACEHOLDER demo data (no factual claims). */
const PER = 180;

type Demo = {type: string; title: string; unit?: string; data: any; diagram?: boolean};

const heat: number[] = Array.from({length: 182}, (_, i) => {
  const weekend = i % 7 === 5 || i % 7 === 6;
  return Math.max(0, Math.round((Math.sin(i * 0.31) + 1) * 3 + (weekend ? -2 : 2) + ((i * 7) % 5) - 2));
});

const DEMOS: Demo[] = [
  {
    type: 'bar-race',
    title: 'Bar race',
    data: {
      periods: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
      series: [
        {label: 'Company A', values: [10, 18, 25, 31, 36]},
        {label: 'Company B', values: [22, 24, 26, 27, 29]},
        {label: 'Company C', values: [5, 12, 22, 38, 52]},
        {label: 'Company D', values: [15, 14, 12, 11, 9]},
        {label: 'Company E', values: [8, 10, 15, 21, 26]},
      ],
    },
  },
  {
    type: 'line-annotated',
    title: 'Annotated line',
    unit: '$',
    data: {
      points: [
        {label: 'Q1', value: 12},
        {label: 'Q2', value: 15},
        {label: 'Q3', value: 14},
        {label: 'Q4', value: 22},
        {label: 'Q5', value: 31},
        {label: 'Q6', value: 27},
        {label: 'Q7', value: 40},
      ],
      annotations: [
        {at: 3, text: 'Launch'},
        {at: 5, text: 'Dip'},
      ],
    },
  },
  {type: 'pie', title: 'Pie', unit: '%', data: {slices: [{label: 'Part A', value: 45}, {label: 'Part B', value: 30}, {label: 'Part C', value: 15}, {label: 'Part D', value: 10}], highlight: 1}},
  {type: 'donut', title: 'Donut', unit: '$', data: {slices: [{label: 'Rent', value: 40}, {label: 'Staff', value: 35}, {label: 'Other', value: 25}], centerLabel: 'Total'}},
  {
    type: 'stacked-area',
    title: 'Stacked area',
    data: {
      labels: ['Y1', 'Y2', 'Y3', 'Y4', 'Y5', 'Y6'],
      series: [
        {label: 'Product A', values: [5, 8, 12, 15, 18, 20]},
        {label: 'Product B', values: [3, 4, 6, 9, 13, 18]},
        {label: 'Product C', values: [2, 2, 3, 3, 4, 6]},
      ],
    },
  },
  {
    type: 'ranking',
    title: 'Ranking (countdown)',
    unit: '$',
    data: {
      order: 'countdown',
      items: [
        {label: 'Option A', value: 900, note: 'placeholder'},
        {label: 'Option B', value: 750},
        {label: 'Option C', value: 620},
        {label: 'Option D', value: 410},
        {label: 'Option E', value: 300},
      ],
    },
  },
  {type: 'ticker', title: 'Ticker (odometer)', unit: '$', data: {from: 0, to: 1250000, label: 'demo amount'}},
  {type: 'percent-ring', title: 'Percent rings', unit: '%', data: {rings: [{label: 'Ring A', value: 82}, {label: 'Ring B', value: 54}, {label: 'Ring C', value: 23}]}},
  {
    type: 'bubble',
    title: 'Bubbles',
    unit: '$',
    data: {
      bubbles: [
        {label: 'Alpha', value: 120},
        {label: 'Beta', value: 80},
        {label: 'Gamma', value: 60},
        {label: 'Delta', value: 35},
        {label: 'Epsilon', value: 20},
        {label: 'Zeta', value: 12},
        {label: 'Eta', value: 8},
      ],
    },
  },
  {
    type: 'comparison-table',
    title: 'Comparison table',
    unit: '$',
    data: {
      columns: ['Offer A', 'Offer B', 'Offer C'],
      highlight: 1,
      rows: [
        {label: 'Price', values: [100, 80, 120]},
        {label: 'Equity', values: ['10%', '25%', '5%']},
        {label: 'Board seat', values: [false, true, false]},
        {label: 'Exclusive', values: [true, true, null]},
      ],
    },
  },
  {type: 'calendar-heatmap', title: 'Calendar heatmap', data: {start: '2024-01-01', values: heat}},
  {
    type: 'map-choropleth',
    title: 'Choropleth map',
    data: {
      legend: 'Demo values',
      values: [
        {country: 'USA', value: 90},
        {country: 'BRA', value: 40},
        {country: 'DEU', value: 70},
        {country: 'IND', value: 55},
        {country: 'NGA', value: 20},
        {country: 'AUS', value: 35},
        {country: 'JPN', value: 65},
        {country: 'FRA', value: 50},
        {country: 'CAN', value: 45},
        {country: 'ZAF', value: 15},
      ],
    },
  },
  {type: 'money-stacks', title: 'Money stacks', unit: '$', data: {items: [{label: 'Offer', value: 50000}, {label: 'Counter', value: 120000}, {label: 'Final', value: 85000}]}},
  {type: 'what-could-buy', title: 'What it could buy', unit: '$', data: {amount: 1000000, price: 25000, item: 'cars', icon: 'car'}},
  {
    type: 'org-chart',
    title: 'Org chart',
    diagram: true,
    data: {
      root: {
        label: 'Founder',
        title: 'CEO',
        highlight: true,
        children: [
          {label: 'Person A', title: 'Finance', children: [{label: 'Person D', title: 'Accounts'}]},
          {label: 'Person B', title: 'Product', children: [{label: 'Person E', title: 'Design'}, {label: 'Person F', title: 'Engineering'}]},
          {label: 'Person C', title: 'Sales', children: [{label: 'Person G', title: 'Partnerships'}]},
        ],
      },
    },
  },
  {
    type: 'family-tree',
    title: 'Family tree',
    diagram: true,
    data: {
      root: {
        label: 'Founder',
        years: '1890-1960',
        partner: {label: 'Partner', years: '1895-1970'},
        children: [
          {label: 'Heir A', years: '1920-1990', highlight: true, children: [{label: 'Grandchild A'}, {label: 'Grandchild B'}]},
          {label: 'Heir B', years: '1923-2001', partner: 'Spouse B', children: [{label: 'Grandchild C'}]},
        ],
      },
    },
  },
  {
    type: 'flow',
    title: 'Flow diagram',
    diagram: true,
    data: {
      steps: [
        {id: 'offer', label: 'Offer arrives', shape: 'start'},
        {id: 'review', label: 'Review terms', note: 'lawyers'},
        {id: 'decide', label: 'Sign?', shape: 'decision'},
        {id: 'sign', label: 'Signed', shape: 'end', colour: 'ink'},
        {id: 'pass', label: 'Passed', shape: 'end', colour: 'stamp'},
      ],
      links: [
        {from: 'offer', to: 'review'},
        {from: 'review', to: 'decide'},
        {from: 'decide', to: 'sign', label: 'yes'},
        {from: 'decide', to: 'pass', label: 'no'},
      ],
    },
  },
];

const ENTRIES = DEMOS.filter((d) => !!INFOGRAPHICS[d.type]);

export const INFOGRAPHIC_PREVIEW_FRAMES = Math.max(1, PER * ENTRIES.length);

const CTX: VideoProps = {
  slug: 'infographic-preview',
  cut: 'main',
  format: 'long',
  verdict: 'PASSED',
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: PER,
  scenes: [],
  words: [],
  assets: {},
  sources: {demo: {title: 'Demo data (placeholder values)', url: ''}},
  thumbnail: {},
  title: 'Infographics preview',
};

const sceneOf = (d: Demo, i: number): Scene => ({
  id: `ig-${i}`,
  kind: 'infographic',
  narration: '',
  onScreenText: null,
  visual: {type: d.type, title: d.title, unit: d.unit, sourceId: d.diagram ? undefined : 'demo', data: d.data},
  startFrame: 0,
  durationFrames: PER,
  sentences: [],
});

const Tag: React.FC<{type: string; n: number}> = ({type, n}) => (
  <div style={{position: 'absolute', right: 40, top: 36, display: 'flex', alignItems: 'center', gap: 16, background: C.board, color: C.paper, padding: '8px 18px'}}>
    <span style={{fontFamily: FONT_MONO, fontSize: 22, opacity: 0.8}}>{`${n}/${ENTRIES.length}`}</span>
    <span style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 34}}>{type}</span>
  </div>
);

/** Every infographic type (render/src/infographics) with placeholder data, 6 s each. Rendered as preview-infographics.mp4. */
export const InfographicPreview: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.paper}}>
    {ENTRIES.map((d, i) => (
      <Sequence key={d.type} name={`ig:${d.type}`} from={i * PER} durationInFrames={PER}>
        <AbsoluteFill>
          <InfographicScene scene={sceneOf(d, i)} ctx={CTX} />
          <Tag type={d.type} n={i + 1} />
        </AbsoluteFill>
      </Sequence>
    ))}
  </AbsoluteFill>
);

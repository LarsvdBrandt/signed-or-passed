import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {enterStyle, useUnit} from '../components/common';
import {NameCard, Person} from './People';
import {Arrow, Briefcase, Calendar, Clock, Contract, DecisionChair, Desk, FountainPen, MoneyStack, Newspaper, Phone, Spotlight, Stamp} from './Objects';
import {Building} from './Buildings';
import {BoardroomBackdrop, CityBackdrop, OfficeBackdrop} from './Backdrops';

export type IllEntry = {C: React.FC<any>; w: number; h: number; enter: string};

/** The house-style library. w/h = natural size in px at 1080p; enter = default entrance animation. */
export const ILLUSTRATIONS: Record<string, IllEntry> = {
  Desk: {C: Desk, w: 600, h: 260, enter: 'slide-up'},
  Contract: {C: Contract, w: 220, h: 290, enter: 'drop'},
  FountainPen: {C: FountainPen, w: 300, h: 80, enter: 'slide-left'},
  Stamp: {C: Stamp, w: 160, h: 220, enter: 'drop'},
  DecisionChair: {C: DecisionChair, w: 240, h: 340, enter: 'fade'},
  Person: {C: Person, w: 200, h: 400, enter: 'fade'},
  NameCard: {C: NameCard, w: 360, h: 90, enter: 'pop'},
  Building: {C: Building, w: 260, h: 380, enter: 'slide-up'},
  Phone: {C: Phone, w: 160, h: 280, enter: 'pop'},
  Newspaper: {C: Newspaper, w: 380, h: 280, enter: 'pop'},
  Briefcase: {C: Briefcase, w: 260, h: 200, enter: 'slide-up'},
  MoneyStack: {C: MoneyStack, w: 260, h: 220, enter: 'drop'},
  Clock: {C: Clock, w: 220, h: 220, enter: 'pop'},
  Calendar: {C: Calendar, w: 220, h: 240, enter: 'pop'},
  Arrow: {C: Arrow, w: 300, h: 100, enter: 'none'},
  Spotlight: {C: Spotlight, w: 600, h: 700, enter: 'fade'},
  CityBackdrop: {C: CityBackdrop, w: 1920, h: 1080, enter: 'none'},
  OfficeBackdrop: {C: OfficeBackdrop, w: 1920, h: 1080, enter: 'none'},
  BoardroomBackdrop: {C: BoardroomBackdrop, w: 1920, h: 1080, enter: 'none'},
};

export const BACKDROPS: Record<string, React.FC<any>> = {CityBackdrop, OfficeBackdrop, BoardroomBackdrop};

export type LayerSpec = {component: string; props?: any; x?: number; y?: number; scale?: number; enter?: string; delaySec?: number};

/** One illustration layer: centred at x%/y%, scaled, with its entrance animation after delaySec. */
export const Layer: React.FC<{layer: LayerSpec}> = ({layer}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const entry = ILLUSTRATIONS[layer.component];
  if (!entry) return null;
  const Backdrop = BACKDROPS[layer.component];
  if (Backdrop) return <Backdrop {...(layer.props || {})} />;
  const delay = Math.max(0, Math.round((layer.delaySec || 0) * fps));
  const st = enterStyle(layer.enter || entry.enter, frame - delay, fps);
  const Comp = entry.C;
  return (
    <div style={{position: 'absolute', left: `${layer.x ?? 50}%`, top: `${layer.y ?? 50}%`, width: entry.w, height: entry.h, transform: `translate(-50%, -50%) scale(${(layer.scale ?? 1) * u}) ${st.transform}`, opacity: st.opacity}}>
      <Sequence from={delay} layout="none">
        <Comp {...(layer.props || {})} />
      </Sequence>
    </div>
  );
};

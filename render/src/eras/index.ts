import React from 'react';
import {AncientBackdrop, AncientCoin, Amphora, Chariot, ColumnTemple, Galley, Laurel, OilLamp, Pyramid, Scroll, WaxTablet} from './Ancient';

/**
 * ERA PACKS. Each era = a backdrop + a list of props (illustration components) + typography hints.
 * Era components are ordinary illustration components: use them in any illustration scene layer
 * ({component: 'Pyramid'}) or as visual.background ('AncientBackdrop'). Core components (Factory, Train, ...) can be
 * listed in an era too. See docs/library/eras.md.
 */
export type EraIll = {C: React.FC<any>; w: number; h: number; enter: string; group?: string};

export const ERA_ILLUSTRATIONS: Record<string, EraIll> = {
  // ancient
  AncientBackdrop: {C: AncientBackdrop, w: 1920, h: 1080, enter: 'none', group: 'era:ancient'},
  ColumnTemple: {C: ColumnTemple, w: 520, h: 400, enter: 'slide-up', group: 'era:ancient'},
  Pyramid: {C: Pyramid, w: 480, h: 320, enter: 'slide-up', group: 'era:ancient'},
  Amphora: {C: Amphora, w: 180, h: 300, enter: 'drop', group: 'era:ancient'},
  Scroll: {C: Scroll, w: 360, h: 220, enter: 'pop', group: 'era:ancient'},
  Laurel: {C: Laurel, w: 300, h: 260, enter: 'fade', group: 'era:ancient'},
  OilLamp: {C: OilLamp, w: 260, h: 180, enter: 'pop', group: 'era:ancient'},
  AncientCoin: {C: AncientCoin, w: 220, h: 220, enter: 'drop', group: 'era:ancient'},
  WaxTablet: {C: WaxTablet, w: 300, h: 240, enter: 'pop', group: 'era:ancient'},
  Galley: {C: Galley, w: 560, h: 320, enter: 'slide-right', group: 'era:ancient'},
  Chariot: {C: Chariot, w: 460, h: 260, enter: 'slide-left', group: 'era:ancient'},
};

export const ERA_BACKDROPS: Record<string, React.FC<any>> = {AncientBackdrop};

export type EraDef = {
  id: string;
  name: string;
  years: string;
  /** backdrop component (era pack or core: CityBackdrop, OfficeBackdrop, BoardroomBackdrop) */
  backdrop: string;
  /** illustration components that belong to this era (era pack + suitable core components) */
  props: string[];
  /** example date-tag text in this era's style */
  dateTag: string;
  /** suggested theme (render/src/themes) and music era tag */
  theme: string;
  musicEra: string;
  notes: string;
};

export const ERA_LIST: EraDef[] = [
  {
    id: 'ancient',
    name: 'Antiquity',
    years: '3000 BC - 500 AD',
    backdrop: 'AncientBackdrop',
    props: ['ColumnTemple', 'Pyramid', 'Galley', 'Chariot', 'Amphora', 'Scroll', 'Laurel', 'OilLamp', 'AncientCoin', 'WaxTablet'],
    dateTag: 'c. 50 BC',
    theme: 'engraving',
    musicEra: 'ancient',
    notes: 'Egypt, Greece, Rome. Inscriptions as typography; no real rulers, coins or seals.',
  },
  {
    id: 'industrial',
    name: 'Industrial age',
    years: '1850 - 1910',
    backdrop: 'CityBackdrop',
    props: ['Factory', 'Train', 'Ship', 'Telegram', 'OldTelephone', 'Newspaper', 'Bank', 'MoneyStack'],
    dateTag: '1889',
    theme: 'engraving',
    musicEra: 'ragtime',
    notes: 'Core components for now; the dedicated pack (smokestacks, steam engine, top hat, gas lamp) follows in ERAS-3.',
  },
  {
    id: 'modern',
    name: 'Modern',
    years: '2000 - today',
    backdrop: 'OfficeBackdrop',
    props: ['Smartphone', 'Laptop', 'Computer', 'DigitalCamera', 'StockBoard', 'ContainerShip', 'Airplane', 'Rocket'],
    dateTag: '2024',
    theme: 'signed-or-passed',
    musicEra: 'modern',
    notes: 'Core components; the 2000s and future packs follow in ERAS-6.',
  },
];

export const eraById = (id?: string | null): EraDef | null => ERA_LIST.find((e) => e.id === id) || null;

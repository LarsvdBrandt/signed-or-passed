import React from 'react';
import {AncientBackdrop, AncientCoin, Amphora, Chariot, ColumnTemple, Galley, Laurel, OilLamp, Pyramid, Scroll, WaxTablet} from './Ancient';
import {Cart, CastleGate, GuildSign, Lantern, MarketStall, MedievalBackdrop, QuillParchment, SwordShield, WaxSeal} from './Medieval';
import {CanalHouse, Compass, Fluyt, Globe, GoldenAgeBackdrop, Ledger, SpiceSacks, Tulip} from './GoldenAge';

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
  // medieval
  MedievalBackdrop: {C: MedievalBackdrop, w: 1920, h: 1080, enter: 'none', group: 'era:medieval'},
  CastleGate: {C: CastleGate, w: 420, h: 400, enter: 'slide-up', group: 'era:medieval'},
  MarketStall: {C: MarketStall, w: 420, h: 360, enter: 'slide-up', group: 'era:medieval'},
  QuillParchment: {C: QuillParchment, w: 360, h: 300, enter: 'pop', group: 'era:medieval'},
  WaxSeal: {C: WaxSeal, w: 220, h: 220, enter: 'drop', group: 'era:medieval'},
  SwordShield: {C: SwordShield, w: 300, h: 360, enter: 'pop', group: 'era:medieval'},
  Cart: {C: Cart, w: 440, h: 260, enter: 'slide-left', group: 'era:medieval'},
  Lantern: {C: Lantern, w: 160, h: 300, enter: 'drop', group: 'era:medieval'},
  GuildSign: {C: GuildSign, w: 300, h: 320, enter: 'slide-down', group: 'era:medieval'},
  // age of exploration / dutch golden age
  GoldenAgeBackdrop: {C: GoldenAgeBackdrop, w: 1920, h: 1080, enter: 'none', group: 'era:golden-age'},
  Fluyt: {C: Fluyt, w: 600, h: 420, enter: 'slide-right', group: 'era:golden-age'},
  CanalHouse: {C: CanalHouse, w: 200, h: 420, enter: 'slide-up', group: 'era:golden-age'},
  Tulip: {C: Tulip, w: 200, h: 320, enter: 'fade', group: 'era:golden-age'},
  SpiceSacks: {C: SpiceSacks, w: 380, h: 260, enter: 'slide-up', group: 'era:golden-age'},
  Globe: {C: Globe, w: 300, h: 340, enter: 'pop', group: 'era:golden-age'},
  Compass: {C: Compass, w: 240, h: 240, enter: 'pop', group: 'era:golden-age'},
  Ledger: {C: Ledger, w: 400, h: 280, enter: 'pop', group: 'era:golden-age'},
};

export const ERA_BACKDROPS: Record<string, React.FC<any>> = {AncientBackdrop, MedievalBackdrop, GoldenAgeBackdrop};

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
    id: 'medieval',
    name: 'Middle Ages',
    years: '500 - 1500',
    backdrop: 'MedievalBackdrop',
    props: ['CastleGate', 'MarketStall', 'QuillParchment', 'WaxSeal', 'SwordShield', 'Cart', 'Lantern', 'GuildSign', 'Scales', 'MoneyBag'],
    dateTag: 'Anno 1347',
    theme: 'engraving',
    musicEra: 'medieval',
    notes: 'Castles, markets, guilds. Plain shapes on shields and banners; never real heraldry.',
  },
  {
    id: 'golden-age',
    name: 'Age of Exploration / Dutch Golden Age',
    years: '1500 - 1700',
    backdrop: 'GoldenAgeBackdrop',
    props: ['Fluyt', 'CanalHouse', 'Warehouse', 'Tulip', 'SpiceSacks', 'Globe', 'Compass', 'Ledger', 'Scales', 'ShareCertificate'],
    dateTag: 'Anno 1637',
    theme: 'engraving',
    musicEra: 'baroque',
    notes: 'Trading companies, canals, tulip mania. Ships carry plain pennants; no company logos or real flags.',
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
    notes: 'Core components for now; the dedicated pack (smokestacks, steam engine, top hat, gas lamp) follows in ERAS-3b.',
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

import React from 'react';
import {AncientBackdrop, AncientCoin, Amphora, Chariot, ColumnTemple, Galley, Laurel, OilLamp, Pyramid, Scroll, WaxTablet} from './Ancient';
import {Cart, CastleGate, GuildSign, Lantern, MarketStall, MedievalBackdrop, QuillParchment, SwordShield, WaxSeal} from './Medieval';
import {CanalHouse, Compass, Fluyt, Globe, GoldenAgeBackdrop, Ledger, SpiceSacks, Tulip} from './GoldenAge';
import {FactoryGate, GasLamp, IndustrialBackdrop, PennyFarthing, PocketWatch, SteamEngine, TelegraphKey, TopHat} from './Industrial';
import {Breadline, CathedralRadio, CocktailGlass, DecoBackdrop, Gramophone, NewsboyCap, TickerTape, VintageCar} from './Twenties';
import {DinerBackdrop, FinCar, Jukebox, Milkshake, RocketToy, RotaryPhone, TVSet, Typewriter} from './Fifties';
import {ArcadeCabinet, Boombox, Calculator, Cassette, CRTTV, Mainframe, NeonBackdrop, PersonalStereo} from './Eighties';
import {BeigePC, CDROM, ComputerMouse, CubicleBackdrop, DialUpModem, EarlyWebsite, Pager, ServerRack} from './Nineties';

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
  // industrial age
  IndustrialBackdrop: {C: IndustrialBackdrop, w: 1920, h: 1080, enter: 'none', group: 'era:industrial'},
  SteamEngine: {C: SteamEngine, w: 520, h: 360, enter: 'slide-left', group: 'era:industrial'},
  TelegraphKey: {C: TelegraphKey, w: 360, h: 240, enter: 'pop', group: 'era:industrial'},
  TopHat: {C: TopHat, w: 260, h: 240, enter: 'drop', group: 'era:industrial'},
  PocketWatch: {C: PocketWatch, w: 240, h: 320, enter: 'drop', group: 'era:industrial'},
  GasLamp: {C: GasLamp, w: 160, h: 420, enter: 'slide-up', group: 'era:industrial'},
  FactoryGate: {C: FactoryGate, w: 480, h: 400, enter: 'slide-up', group: 'era:industrial'},
  PennyFarthing: {C: PennyFarthing, w: 420, h: 390, enter: 'slide-right', group: 'era:industrial'},
  // roaring twenties / great depression
  DecoBackdrop: {C: DecoBackdrop, w: 1920, h: 1080, enter: 'none', group: 'era:twenties'},
  TickerTape: {C: TickerTape, w: 420, h: 320, enter: 'pop', group: 'era:twenties'},
  Gramophone: {C: Gramophone, w: 420, h: 380, enter: 'pop', group: 'era:twenties'},
  VintageCar: {C: VintageCar, w: 560, h: 300, enter: 'slide-right', group: 'era:twenties'},
  Breadline: {C: Breadline, w: 640, h: 360, enter: 'fade', group: 'era:twenties'},
  CathedralRadio: {C: CathedralRadio, w: 300, h: 360, enter: 'pop', group: 'era:twenties'},
  CocktailGlass: {C: CocktailGlass, w: 220, h: 300, enter: 'pop', group: 'era:twenties'},
  NewsboyCap: {C: NewsboyCap, w: 300, h: 200, enter: 'drop', group: 'era:twenties'},
  // 1950s - 60s
  DinerBackdrop: {C: DinerBackdrop, w: 1920, h: 1080, enter: 'none', group: 'era:fifties'},
  Jukebox: {C: Jukebox, w: 360, h: 480, enter: 'slide-up', group: 'era:fifties'},
  TVSet: {C: TVSet, w: 400, h: 380, enter: 'pop', group: 'era:fifties'},
  FinCar: {C: FinCar, w: 600, h: 280, enter: 'slide-right', group: 'era:fifties'},
  RotaryPhone: {C: RotaryPhone, w: 300, h: 260, enter: 'pop', group: 'era:fifties'},
  Typewriter: {C: Typewriter, w: 420, h: 320, enter: 'pop', group: 'era:fifties'},
  RocketToy: {C: RocketToy, w: 260, h: 400, enter: 'slide-up', group: 'era:fifties'},
  Milkshake: {C: Milkshake, w: 200, h: 340, enter: 'drop', group: 'era:fifties'},
  // 1970s - 80s
  NeonBackdrop: {C: NeonBackdrop, w: 1920, h: 1080, enter: 'none', group: 'era:eighties'},
  ArcadeCabinet: {C: ArcadeCabinet, w: 320, h: 520, enter: 'slide-up', group: 'era:eighties'},
  Cassette: {C: Cassette, w: 360, h: 240, enter: 'pop', group: 'era:eighties'},
  CRTTV: {C: CRTTV, w: 380, h: 340, enter: 'pop', group: 'era:eighties'},
  Boombox: {C: Boombox, w: 520, h: 300, enter: 'slide-left', group: 'era:eighties'},
  Calculator: {C: Calculator, w: 240, h: 360, enter: 'pop', group: 'era:eighties'},
  Mainframe: {C: Mainframe, w: 520, h: 420, enter: 'slide-up', group: 'era:eighties'},
  PersonalStereo: {C: PersonalStereo, w: 260, h: 320, enter: 'drop', group: 'era:eighties'},
  // 1990s dotcom
  CubicleBackdrop: {C: CubicleBackdrop, w: 1920, h: 1080, enter: 'none', group: 'era:nineties'},
  BeigePC: {C: BeigePC, w: 420, h: 420, enter: 'slide-up', group: 'era:nineties'},
  DialUpModem: {C: DialUpModem, w: 380, h: 230, enter: 'pop', group: 'era:nineties'},
  CDROM: {C: CDROM, w: 320, h: 320, enter: 'pop', group: 'era:nineties'},
  Pager: {C: Pager, w: 280, h: 210, enter: 'drop', group: 'era:nineties'},
  EarlyWebsite: {C: EarlyWebsite, w: 560, h: 420, enter: 'pop', group: 'era:nineties'},
  ServerRack: {C: ServerRack, w: 300, h: 500, enter: 'slide-up', group: 'era:nineties'},
  ComputerMouse: {C: ComputerMouse, w: 220, h: 300, enter: 'drop', group: 'era:nineties'},
};

export const ERA_BACKDROPS: Record<string, React.FC<any>> = {AncientBackdrop, MedievalBackdrop, GoldenAgeBackdrop, IndustrialBackdrop, DecoBackdrop, DinerBackdrop, NeonBackdrop, CubicleBackdrop};

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
    backdrop: 'IndustrialBackdrop',
    props: ['SteamEngine', 'FactoryGate', 'PennyFarthing', 'TelegraphKey', 'TopHat', 'PocketWatch', 'GasLamp', 'Train', 'Telegram', 'ShareCertificate'],
    dateTag: '1889',
    theme: 'engraving',
    musicEra: 'ragtime',
    notes: 'Smokestacks, steam, telegraphs, top hats. Railway and factory names as typography; no real company marks.',
  },
  {
    id: 'twenties',
    name: 'Roaring Twenties / Great Depression',
    years: '1919 - 1939',
    backdrop: 'DecoBackdrop',
    props: ['TickerTape', 'Gramophone', 'VintageCar', 'Breadline', 'CathedralRadio', 'CocktailGlass', 'NewsboyCap', 'OldTelephone', 'SpinningNewspaper', 'FallingChart'],
    dateTag: 'Oct 1929',
    theme: 'documentary-dark',
    musicEra: 'jazz',
    notes: 'Art deco boom, the 1929 crash, breadlines. Stock symbols are fictional; no real car makes or radio brands.',
  },
  {
    id: 'fifties',
    name: '1950s - 60s',
    years: '1945 - 1969',
    backdrop: 'DinerBackdrop',
    props: ['Jukebox', 'TVSet', 'FinCar', 'RotaryPhone', 'Typewriter', 'RocketToy', 'Milkshake', 'VinylRecord', 'StoreFront', 'Newspaper'],
    dateTag: 'Jun 1957',
    theme: 'retro-comic',
    musicEra: 'rock-and-roll',
    notes: 'Post-war boom: diners, TV, suburbs, the space race. Generic cars and TV sets; no real brands or logos.',
  },
  {
    id: 'eighties',
    name: '1970s - 80s',
    years: '1970 - 1989',
    backdrop: 'NeonBackdrop',
    props: ['ArcadeCabinet', 'Cassette', 'CRTTV', 'Boombox', 'Calculator', 'Mainframe', 'PersonalStereo', 'VHSTape', 'FloppyDisk', 'StockBoard'],
    dateTag: 'Oct 1987',
    theme: 'synthwave',
    musicEra: 'synth',
    notes: 'Arcades, mixtapes, mainframes, Black Monday. Screens show generic pixel blocks; no real games, consoles or brands.',
  },
  {
    id: 'nineties',
    name: '1990s dotcom',
    years: '1990 - 2001',
    backdrop: 'CubicleBackdrop',
    props: ['BeigePC', 'DialUpModem', 'CDROM', 'Pager', 'EarlyWebsite', 'ServerRack', 'ComputerMouse', 'FloppyDisk', 'DVD', 'StockBoard'],
    dateTag: 'Mar 2000',
    theme: 'signed-or-passed',
    musicEra: 'electronic',
    notes: 'Cubicles, dial-up, homepages, the dotcom bubble. Fictional web addresses (example.com); no real browsers, OS or company names.',
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

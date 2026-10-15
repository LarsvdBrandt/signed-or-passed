import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {enterStyle, useUnit} from '../components/common';
import {NameCard, Person} from './People';
import {Arrow, Briefcase, Calendar, Clock, Contract, DecisionChair, Desk, FountainPen, MoneyStack, Newspaper, Phone, Spotlight, Stamp} from './Objects';
import {Building} from './Buildings';
import {BoardroomBackdrop, CityBackdrop, OfficeBackdrop} from './Backdrops';
import {AssemblyLine, Airplane, Bank, ContainerShip, CrumblingBuilding, Factory, FallingChart, Rocket, Ship, StockBoard, StoreFront, Train, Truck, Warehouse} from './Industry';
import {Basketball, Computer, DVD, DigitalCamera, FilmCamera, FloppyDisk, Guitar, Laptop, Microphone, OldTelephone, Record as VinylRecord, Smartphone, Sneaker, VHSTape} from './Tech';
import {CoinRain, Crowd, Envelope, FlipCalendar, Gavel, Handshake, Hourglass, Lightbulb, LockKey, MagnifyingGlass, MoneyBag, PriceTag, Queue, Scales, ShareCertificate, SpinningNewspaper, Telegram, Trophy} from './Symbols';
import {Character} from '../characters/Rig';
import {ERA_BACKDROPS, ERA_ILLUSTRATIONS} from '../eras';

export type IllEntry = {C: React.FC<any>; w: number; h: number; enter: string; group?: string};

/** The core house-style library. w/h = natural size in px at 1080p; enter = default entrance animation. */
export const ILLUSTRATIONS: Record<string, IllEntry> = {
  Desk: {C: Desk, w: 600, h: 260, enter: 'slide-up', group: 'office'},
  Contract: {C: Contract, w: 220, h: 290, enter: 'drop', group: 'office'},
  FountainPen: {C: FountainPen, w: 300, h: 80, enter: 'slide-left', group: 'office'},
  Stamp: {C: Stamp, w: 160, h: 220, enter: 'drop', group: 'office'},
  DecisionChair: {C: DecisionChair, w: 240, h: 340, enter: 'fade', group: 'office'},
  Person: {C: Person, w: 200, h: 400, enter: 'fade', group: 'people'},
  Character: {C: Character, w: 200, h: 400, enter: 'fade', group: 'people'},
  NameCard: {C: NameCard, w: 360, h: 90, enter: 'pop', group: 'people'},
  Building: {C: Building, w: 260, h: 380, enter: 'slide-up', group: 'places'},
  Phone: {C: Phone, w: 160, h: 280, enter: 'pop', group: 'office'},
  Newspaper: {C: Newspaper, w: 380, h: 280, enter: 'pop', group: 'office'},
  Briefcase: {C: Briefcase, w: 260, h: 200, enter: 'slide-up', group: 'office'},
  MoneyStack: {C: MoneyStack, w: 260, h: 220, enter: 'drop', group: 'money'},
  Clock: {C: Clock, w: 220, h: 220, enter: 'pop', group: 'time'},
  Calendar: {C: Calendar, w: 220, h: 240, enter: 'pop', group: 'time'},
  Arrow: {C: Arrow, w: 300, h: 100, enter: 'none', group: 'symbols'},
  Spotlight: {C: Spotlight, w: 600, h: 700, enter: 'fade', group: 'symbols'},
  // places & industry
  Factory: {C: Factory, w: 520, h: 400, enter: 'slide-up', group: 'places'},
  StoreFront: {C: StoreFront, w: 300, h: 400, enter: 'slide-up', group: 'places'},
  Warehouse: {C: Warehouse, w: 480, h: 320, enter: 'slide-up', group: 'places'},
  Bank: {C: Bank, w: 440, h: 400, enter: 'slide-up', group: 'places'},
  StockBoard: {C: StockBoard, w: 560, h: 320, enter: 'pop', group: 'money'},
  CrumblingBuilding: {C: CrumblingBuilding, w: 300, h: 440, enter: 'none', group: 'places'},
  AssemblyLine: {C: AssemblyLine, w: 600, h: 340, enter: 'fade', group: 'places'},
  // transport
  Ship: {C: Ship, w: 440, h: 400, enter: 'slide-right', group: 'transport'},
  ContainerShip: {C: ContainerShip, w: 560, h: 320, enter: 'slide-right', group: 'transport'},
  Train: {C: Train, w: 600, h: 260, enter: 'slide-right', group: 'transport'},
  Truck: {C: Truck, w: 460, h: 260, enter: 'slide-right', group: 'transport'},
  Airplane: {C: Airplane, w: 640, h: 320, enter: 'fade', group: 'transport'},
  Rocket: {C: Rocket, w: 220, h: 460, enter: 'slide-up', group: 'transport'},
  // tech & culture
  Computer: {C: Computer, w: 320, h: 320, enter: 'pop', group: 'tech'},
  Laptop: {C: Laptop, w: 380, h: 260, enter: 'slide-up', group: 'tech'},
  Smartphone: {C: Smartphone, w: 180, h: 340, enter: 'pop', group: 'tech'},
  FloppyDisk: {C: FloppyDisk, w: 220, h: 220, enter: 'drop', group: 'tech'},
  VHSTape: {C: VHSTape, w: 320, h: 200, enter: 'drop', group: 'tech'},
  DVD: {C: DVD, w: 260, h: 260, enter: 'pop', group: 'tech'},
  FilmCamera: {C: FilmCamera, w: 300, h: 300, enter: 'slide-up', group: 'tech'},
  DigitalCamera: {C: DigitalCamera, w: 280, h: 200, enter: 'pop', group: 'tech'},
  OldTelephone: {C: OldTelephone, w: 280, h: 240, enter: 'drop', group: 'tech'},
  Guitar: {C: Guitar, w: 180, h: 460, enter: 'slide-up', group: 'culture'},
  VinylRecord: {C: VinylRecord, w: 320, h: 320, enter: 'pop', group: 'culture'},
  Sneaker: {C: Sneaker, w: 320, h: 190, enter: 'drop', group: 'culture'},
  Basketball: {C: Basketball, w: 220, h: 260, enter: 'drop', group: 'culture'},
  Microphone: {C: Microphone, w: 180, h: 380, enter: 'slide-up', group: 'culture'},
  // symbols & money
  Handshake: {C: Handshake, w: 380, h: 240, enter: 'pop', group: 'symbols'},
  Gavel: {C: Gavel, w: 320, h: 280, enter: 'drop', group: 'symbols'},
  Lightbulb: {C: Lightbulb, w: 200, h: 300, enter: 'pop', group: 'symbols'},
  CoinRain: {C: CoinRain, w: 420, h: 420, enter: 'none', group: 'money'},
  MoneyBag: {C: MoneyBag, w: 240, h: 280, enter: 'drop', group: 'money'},
  PriceTag: {C: PriceTag, w: 300, h: 200, enter: 'drop', group: 'money'},
  ShareCertificate: {C: ShareCertificate, w: 400, h: 280, enter: 'pop', group: 'money'},
  FallingChart: {C: FallingChart, w: 440, h: 320, enter: 'pop', group: 'money'},
  Crowd: {C: Crowd, w: 640, h: 320, enter: 'slide-up', group: 'people'},
  Queue: {C: Queue, w: 680, h: 300, enter: 'slide-left', group: 'people'},
  Envelope: {C: Envelope, w: 300, h: 220, enter: 'slide-left', group: 'symbols'},
  Telegram: {C: Telegram, w: 360, h: 240, enter: 'drop', group: 'symbols'},
  FlipCalendar: {C: FlipCalendar, w: 240, h: 260, enter: 'pop', group: 'time'},
  Hourglass: {C: Hourglass, w: 200, h: 300, enter: 'pop', group: 'time'},
  Scales: {C: Scales, w: 380, h: 320, enter: 'fade', group: 'symbols'},
  MagnifyingGlass: {C: MagnifyingGlass, w: 260, h: 260, enter: 'pop', group: 'symbols'},
  LockKey: {C: LockKey, w: 260, h: 300, enter: 'pop', group: 'symbols'},
  Trophy: {C: Trophy, w: 240, h: 300, enter: 'drop', group: 'symbols'},
  SpinningNewspaper: {C: SpinningNewspaper, w: 380, h: 280, enter: 'none', group: 'office'},
  // backdrops
  CityBackdrop: {C: CityBackdrop, w: 1920, h: 1080, enter: 'none', group: 'backdrops'},
  OfficeBackdrop: {C: OfficeBackdrop, w: 1920, h: 1080, enter: 'none', group: 'backdrops'},
  BoardroomBackdrop: {C: BoardroomBackdrop, w: 1920, h: 1080, enter: 'none', group: 'backdrops'},
};

/** Core library + every era pack (render/src/eras). Layers resolve components from here. */
export const ALL_ILLUSTRATIONS: Record<string, IllEntry> = {...ILLUSTRATIONS, ...ERA_ILLUSTRATIONS};

export const BACKDROPS: Record<string, React.FC<any>> = {CityBackdrop, OfficeBackdrop, BoardroomBackdrop, ...ERA_BACKDROPS};

export type LayerSpec = {component: string; props?: any; x?: number; y?: number; scale?: number; enter?: string; delaySec?: number; depth?: number};

/** One illustration layer: centred at x%/y%, scaled, with its entrance animation after delaySec. */
export const Layer: React.FC<{layer: LayerSpec}> = ({layer}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const u = useUnit();
  const entry = ALL_ILLUSTRATIONS[layer.component];
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

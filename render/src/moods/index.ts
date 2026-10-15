import type React from 'react';
import type {ShotProps} from './kit';
import {BananaSlip, CartoonBonk, Crickets, DotsBubble, ExaggeratedZoom, QuestionMarks, RecordScratch, SweatDrop, Tumbleweed} from './funny';
import {ClosedSign, EmptyOffice, FallingLeaf, LightsOut, RainCloud, WiltingPlant} from './sad';
import {HeartbeatLine, InterrogationSpotlight, RedAlert, SlowPushIn, TickingClockCloseUp} from './tension';
import {CheeringCrowd, Confetti, Fireworks, RisingRocket, TrophyShine} from './triumph';
import {Fog, MagnifierSweep, SilhouetteReveal} from './mystery';

export type Mood = 'funny' | 'sad' | 'tension' | 'triumph' | 'mystery';
export const MOODS: Mood[] = ['funny', 'sad', 'tension', 'triumph', 'mystery'];

/**
 * A mood shot: a short, self-contained animated beat (2-5 s) that sets an emotion between story scenes.
 * Used by the scene kind 'shot' {shot, props, label}. Everything is self-drawn SVG in the current theme's tokens.
 */
export type ShotDef = {
  id: string;
  mood: Mood;
  /** Recommended scene length in seconds (the narration still decides the real length). */
  durationSec: number;
  /** Scene background behind the 16:9 drawing (portrait letterbox). */
  bg: 'paper' | 'board' | 'greyLight';
  description: string;
  /** Documented props. */
  props: string;
  /** Suggested sound (pipeline/sfxlib.py name or house sound); not played automatically. */
  sfxHint?: string;
  /** Props used by the MoodPreview. */
  demo?: Record<string, any>;
  component: React.FC<ShotProps>;
};

export const SHOTS: Record<string, ShotDef> = {};
const reg = (d: ShotDef): void => {
  SHOTS[d.id] = d;
};

// funny
reg({id: 'CartoonBonk', mood: 'funny', durationSec: 2.5, bg: 'paper', description: 'an anvil or book drops on a head: squash, stars, BONK!', props: 'object anvil|book, text, colour', sfxHint: 'bonk', demo: {object: 'anvil'}, component: CartoonBonk});
reg({id: 'SweatDrop', mood: 'funny', durationSec: 3, bg: 'paper', description: 'close-up of a trembling faceless head with sliding sweat drops', props: 'colour', component: SweatDrop});
reg({id: 'QuestionMarks', mood: 'funny', durationSec: 2.5, bg: 'paper', description: 'head-scratching figure, three wobbling question marks', props: 'colour', component: QuestionMarks});
reg({id: 'DotsBubble', mood: 'funny', durationSec: 3, bg: 'paper', description: 'typing indicator in a speech bubble, optionally replaced by a reply', props: 'text, revealSec, colour', demo: {text: 'No.', revealSec: 2.2}, component: DotsBubble});
reg({id: 'BananaSlip', mood: 'funny', durationSec: 3, bg: 'paper', description: 'walks in, slips on a peel, lands flat with stars', props: 'text (default WHOOPS!), colour', sfxHint: 'whoosh', component: BananaSlip});
reg({id: 'RecordScratch', mood: 'funny', durationSec: 3, bg: 'greyLight', description: "freeze-frame: flash, figure frozen mid-air, record stops, caption", props: "text (default Yep. That's me.), colour", sfxHint: 'record_scratch', component: RecordScratch});
reg({id: 'ExaggeratedZoom', mood: 'funny', durationSec: 2.5, bg: 'paper', description: 'two snap crash-zooms onto a word with speed lines and shake', props: 'text, colour', demo: {text: 'THE DEAL'}, component: ExaggeratedZoom});
reg({id: 'Tumbleweed', mood: 'funny', durationSec: 4, bg: 'paper', description: 'empty desert, a tumbleweed bounces through (nobody came)', props: 'text (signpost)', demo: {text: 'GRAND OPENING'}, component: Tumbleweed});
reg({id: 'Crickets', mood: 'funny', durationSec: 4, bg: 'board', description: 'night, empty stage and microphone, chirping crickets (awkward silence)', props: 'text (on the stage edge)', demo: {text: 'Any questions?'}, component: Crickets});

// sad
reg({id: 'RainCloud', mood: 'sad', durationSec: 4, bg: 'paper', description: 'a personal rain cloud over a slumped figure, a growing puddle', props: 'text (caption), colour (figure)', demo: {text: 'Q3 results'}, component: RainCloud});
reg({id: 'WiltingPlant', mood: 'sad', durationSec: 4, bg: 'paper', description: 'a potted flower droops and drops its petals', props: 'text (caption), colour (pot)', component: WiltingPlant});
reg({id: 'ClosedSign', mood: 'sad', durationSec: 3.5, bg: 'paper', description: 'shop door sign flips OPEN -> CLOSED and swings, the lights go out', props: 'text (default CLOSED), front (default OPEN), shop (fascia text), colour (fascia)', demo: {shop: 'CORNER VIDEO'}, component: ClosedSign});
reg({id: 'LightsOut', mood: 'sad', durationSec: 4.5, bg: 'board', description: 'night office tower, windows go dark one by one, the last light stays on longest', props: 'text (caption after the last light), colour (last window)', demo: {text: 'Last day.'}, component: LightsOut});
reg({id: 'EmptyOffice', mood: 'sad', durationSec: 4, bg: 'paper', description: 'empty office: a chair spinning down, flickering ceiling light, a packed box, dust', props: 'text (caption)', component: EmptyOffice});
reg({id: 'FallingLeaf', mood: 'sad', durationSec: 4.5, bg: 'paper', description: 'a single leaf drifts from a bare branch and settles on the ground', props: 'text (caption when it lands), colour (leaf)', component: FallingLeaf});

// tension
reg({id: 'TickingClockCloseUp', mood: 'tension', durationSec: 4, bg: 'paper', description: 'full-frame clock at 11:59, the second hand ticks towards twelve, pulse on every tick', props: 'startSec (default 50), text (caption), colour (second hand)', sfxHint: 'clock_tick', component: TickingClockCloseUp});
reg({id: 'HeartbeatLine', mood: 'tension', durationSec: 4, bg: 'board', description: 'ECG monitor, the pulse climbs from bpmFrom to bpmTo', props: 'bpmFrom (72), bpmTo (150), text (caption), colour (trace)', component: HeartbeatLine});
reg({id: 'InterrogationSpotlight', mood: 'tension', durationSec: 4, bg: 'board', description: 'dark room, a swinging lamp over a figure at a table, a question pops in', props: 'text (default WHERE WERE YOU?), colour (figure)', component: InterrogationSpotlight});
reg({id: 'SlowPushIn', mood: 'tension', durationSec: 5, bg: 'paper', description: 'slow ominous push-in on a small figure facing a huge document, the frame closes in', props: 'text (document title, default THE OFFER), colour (header), figureColour', component: SlowPushIn});
reg({id: 'RedAlert', mood: 'tension', durationSec: 3, bg: 'paper', description: 'hazard stripes, rotating beacon, pulsing orange wash and a big ALERT', props: 'text (default ALERT), sub (caption)', sfxHint: 'alarm', demo: {sub: 'Cash runs out in 30 days'}, component: RedAlert});

// triumph
reg({id: 'Confetti', mood: 'triumph', durationSec: 3, bg: 'paper', description: 'a figure jumps for joy under looping brand-colour confetti, big pop word', props: 'text (pop word, default DEAL!), caption, colour (figure)', component: Confetti});
reg({id: 'Fireworks', mood: 'triumph', durationSec: 4, bg: 'board', description: 'night skyline, rockets rise and burst into flat line-fireworks (loops)', props: 'text (caption)', demo: {text: 'Launch night'}, component: Fireworks});
reg({id: 'RisingRocket', mood: 'triumph', durationSec: 4, bg: 'paper', description: 'a rocket climbs an exponential growth curve, smoke puffs, the value rides along', props: 'text (pop word, default TO THE MOON), value (label next to the rocket), colour (curve)', demo: {value: '+900%'}, component: RisingRocket});
reg({id: 'TrophyShine', mood: 'triumph', durationSec: 3.5, bg: 'paper', description: 'a trophy pops up on a plinth, turning sun rays, twinkling sparkles', props: 'text (plinth, default #1), caption, colour (cup)', demo: {caption: 'Market leader'}, component: TrophyShine});
reg({id: 'CheeringCrowd', mood: 'triumph', durationSec: 3.5, bg: 'paper', description: 'two rows of faceless figures cheer and bounce, confetti, YES! and a pop word', props: 'text (pop word, default HOORAY!), caption', component: CheeringCrowd});

// mystery
reg({id: 'Fog', mood: 'mystery', durationSec: 4.5, bg: 'greyLight', description: 'drifting fog banks hide a lone figure under a street lamp; the fog thins', props: 'text (caption late in the shot)', demo: {text: 'Who made the offer?'}, component: Fog});
reg({id: 'SilhouetteReveal', mood: 'mystery', durationSec: 4, bg: 'board', description: 'grey silhouette under a spotlight with a big ?, a flash reveals the figure and a name card', props: 'text (name card, default THE BUYER), colour (revealed figure)', component: SilhouetteReveal});
reg({id: 'MagnifierSweep', mood: 'mystery', durationSec: 4.5, bg: 'greyLight', description: 'a magnifying glass sweeps a document (magnified inside the lens) and stops on the key words', props: 'text (key words, default CLAUSE 7), title (document, default AGREEMENT), caption', demo: {title: 'TERM SHEET', text: 'CLAUSE 7: EXCLUSIVITY'}, component: MagnifierSweep});

export const SHOT_IDS: string[] = Object.keys(SHOTS);

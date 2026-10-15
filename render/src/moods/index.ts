import type React from 'react';
import type {ShotProps} from './kit';
import {BananaSlip, CartoonBonk, Crickets, DotsBubble, ExaggeratedZoom, QuestionMarks, RecordScratch, SweatDrop, Tumbleweed} from './funny';
import {ClosedSign, EmptyOffice, FallingLeaf, LightsOut, RainCloud, WiltingPlant} from './sad';
import {HeartbeatLine, InterrogationSpotlight, RedAlert, SlowPushIn, TickingClockCloseUp} from './tension';

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

export const SHOT_IDS: string[] = Object.keys(SHOTS);

import type React from 'react';
import type {ShotProps} from './kit';
import {BananaSlip, CartoonBonk, Crickets, DotsBubble, ExaggeratedZoom, QuestionMarks, RecordScratch, SweatDrop, Tumbleweed} from './funny';

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

export const SHOT_IDS: string[] = Object.keys(SHOTS);

import {continueRender, delayRender, staticFile} from 'remotion';

/** Every font a theme can use (files downloaded from google/fonts by pipeline/fetch_assets.py, see brand/fonts.json). */
const FONTS = [
  {family: 'Bricolage Grotesque', file: 'BricolageGrotesque.ttf', weight: '200 800'},
  {family: 'Mrs Saint Delafield', file: 'MrsSaintDelafield-Regular.ttf', weight: '400'},
  {family: 'IBM Plex Mono', file: 'IBMPlexMono-Regular.ttf', weight: '400'},
  {family: 'IBM Plex Mono', file: 'IBMPlexMono-Bold.ttf', weight: '700'},
  {family: 'IM Fell English', file: 'IMFellEnglish-Regular.ttf', weight: '400'},
  {family: 'Bangers', file: 'Bangers-Regular.ttf', weight: '400'},
  {family: 'Caveat', file: 'Caveat.ttf', weight: '400 700'},
  {family: 'Fredoka', file: 'Fredoka.ttf', weight: '300 700'},
  {family: 'Oswald', file: 'Oswald.ttf', weight: '200 700'},
];

let started = false;

/** Loads the fonts from public/fonts. A missing file only logs a warning (the CSS fallback stack is used). */
export const loadFonts = () => {
  if (started || typeof document === 'undefined' || typeof FontFace === 'undefined') return;
  started = true;
  const handle = delayRender('Loading brand fonts');
  Promise.all(
    FONTS.map((f) => {
      const face = new FontFace(f.family, `url('${staticFile('fonts/' + f.file)}') format('truetype')`, {weight: f.weight});
      return face
        .load()
        .then((loaded) => {
          (document.fonts as unknown as {add: (f: FontFace) => void}).add(loaded);
        })
        .catch((err) => console.warn('Font failed to load: ' + f.file, err));
    }),
  ).finally(() => continueRender(handle));
};

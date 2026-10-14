import {continueRender, delayRender, staticFile} from 'remotion';

const FONTS = [
  {family: 'Bricolage Grotesque', file: 'BricolageGrotesque.ttf', weight: '200 800'},
  {family: 'Mrs Saint Delafield', file: 'MrsSaintDelafield-Regular.ttf', weight: '400'},
  {family: 'IBM Plex Mono', file: 'IBMPlexMono-Regular.ttf', weight: '400'},
  {family: 'IBM Plex Mono', file: 'IBMPlexMono-Bold.ttf', weight: '700'},
];

let started = false;

/** Loads the brand fonts from public/fonts (downloaded by pipeline/fetch_assets.py). */
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
          document.fonts.add(loaded);
        })
        .catch((err) => console.warn('Font failed to load: ' + f.file, err));
    }),
  ).finally(() => continueRender(handle));
};

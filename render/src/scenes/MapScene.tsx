import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {geoArea, geoBounds, geoCentroid, geoDistance, geoGraticule10, geoInterpolate, geoOrthographic, geoPath} from 'd3-geo';
import {feature, mesh} from 'topojson-client';
import world50 from 'world-atlas/countries-50m.json';
import world110 from 'world-atlas/countries-110m.json';
import {C, FONT_HEAD, FONT_MONO, STROKE, colourOf} from '../constants';
import {Kicker, clamp, useUnit} from '../components/common';
import type {SceneProps} from '../types';

/**
 * MAP v2 "WorldZoom": real geography (Natural Earth via world-atlas, public domain) on an orthographic globe.
 * Starts on a slowly rotating globe, zooms smoothly into the focus country (highlighted), optionally further
 * into a city, then pulls out to show all pins with animated great-circle arrows.
 */

// [lonMin, lonMax, latMin, latMax]
const REGIONS: Record<string, [number, number, number, number]> = {
  world: [-180, 180, -58, 82],
  europe: [-12, 35, 35, 66],
  'north-america': [-170, -50, 5, 75],
  'united-states': [-125, -66, 24, 50],
  'south-america': [-82, -34, -56, 13],
  asia: [60, 145, -10, 55],
  africa: [-18, 52, -35, 37],
  oceania: [110, 180, -48, 0],
};

// ISO 3166-1 alpha-3 -> numeric (world-atlas feature ids). Names (properties.name) also match.
const ISO3: Record<string, string> = {
  AFG: '004', ALB: '008', DZA: '012', AGO: '024', ARG: '032', AUS: '036', AUT: '040', BHS: '044', BHR: '048',
  BGD: '050', ARM: '051', BEL: '056', BOL: '068', BIH: '070', BWA: '072', BRA: '076', BGR: '100', MMR: '104',
  BLR: '112', KHM: '116', CMR: '120', CAN: '124', LKA: '144', CHL: '152', CHN: '156', TWN: '158', COL: '170',
  COG: '178', COD: '180', CRI: '188', HRV: '191', CUB: '192', CYP: '196', CZE: '203', DNK: '208', DOM: '214',
  ECU: '218', SLV: '222', ETH: '231', EST: '233', FIN: '246', FRA: '250', GEO: '268', DEU: '276', GHA: '288',
  GRC: '300', GTM: '320', HTI: '332', HND: '340', HKG: '344', HUN: '348', ISL: '352', IND: '356', IDN: '360',
  IRN: '364', IRQ: '368', IRL: '372', ISR: '376', ITA: '380', CIV: '384', JAM: '388', JPN: '392', KAZ: '398',
  JOR: '400', KEN: '404', PRK: '408', KOR: '410', KWT: '414', LAO: '418', LBN: '422', LVA: '428', LBY: '434',
  LTU: '440', LUX: '442', MDG: '450', MYS: '458', MLI: '466', MEX: '484', MNG: '496', MAR: '504', MOZ: '508',
  NAM: '516', NPL: '524', NLD: '528', NZL: '554', NIC: '558', NER: '562', NGA: '566', NOR: '578', PAK: '586',
  PAN: '591', PRY: '600', PER: '604', PHL: '608', POL: '616', PRT: '620', PRI: '630', QAT: '634', ROU: '642',
  RUS: '643', SAU: '682', SEN: '686', SRB: '688', SGP: '702', SVK: '703', VNM: '704', SVN: '705', ZAF: '710',
  ZWE: '716', ESP: '724', SDN: '729', SWE: '752', CHE: '756', SYR: '760', THA: '764', ARE: '784', TUN: '788',
  TUR: '792', UGA: '800', UKR: '804', EGY: '818', GBR: '826', TZA: '834', USA: '840', URY: '858', UZB: '860',
  VEN: '862', YEM: '887', ZMB: '894',
};

type Atlas = {countries: any[]; land: any; borders: any};
const prep = (topo: any): Atlas => ({
  countries: ((feature(topo, topo.objects.countries) as any).features || []) as any[],
  land: feature(topo, topo.objects.land) as any,
  borders: mesh(topo, topo.objects.countries, (a: any, b: any) => a !== b) as any,
});
const A50 = prep(world50 as any);
const A110 = prep(world110 as any);
const GRATICULE = geoGraticule10();

const findCountry = (ref: any): any | undefined => {
  if (ref === undefined || ref === null || ref === '') return undefined;
  const s = String(ref).trim();
  const num = /^\d+$/.test(s) ? s.padStart(3, '0') : ISO3[s.toUpperCase()];
  const low = s.toLowerCase();
  return A50.countries.find((f) => (num && String(f.id) === num) || String(f.properties?.name || '').toLowerCase() === low);
};

/** Largest polygon of a (Multi)Polygon country, so overseas territories do not blow up the zoom box. */
const mainPart = (f: any): any => {
  const g = f?.geometry;
  if (!g || g.type !== 'MultiPolygon') return f;
  let best = g.coordinates[0];
  let bestA = -1;
  for (const poly of g.coordinates) {
    const a = geoArea({type: 'Polygon', coordinates: poly} as any);
    if (a > bestA) {
      bestA = a;
      best = poly;
    }
  }
  return {type: 'Feature', properties: f.properties, geometry: {type: 'Polygon', coordinates: best}};
};

type Box = [number, number, number, number]; // lon0, lon1 (may exceed 180), lat0, lat1
type View = {lon: number; lat: number; s: number};
type Pin = {lat: number; lon: number; label: string};

const boxOfFeature = (f: any): Box => {
  const [[lo0, la0], [lo1raw, la1]] = geoBounds(f);
  const lo1 = lo1raw < lo0 ? lo1raw + 360 : lo1raw;
  return [lo0, lo1, la0, la1];
};

const boxOfPoints = (pts: Array<[number, number]>): Box | null => {
  if (!pts.length) return null;
  const lons = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  let lo0 = Math.min(...lons);
  let lo1 = Math.max(...lons);
  let la0 = Math.min(...lats);
  let la1 = Math.max(...lats);
  const pl = Math.max(3, (lo1 - lo0) * 0.18);
  const pa = Math.max(3, (la1 - la0) * 0.18);
  lo0 -= pl;
  lo1 += pl;
  la0 = Math.max(-80, la0 - pa);
  la1 = Math.min(84, la1 + pa);
  return [lo0, lo1, la0, la1];
};

const unionBox = (a: Box | null, b: Box | null): Box | null => {
  if (!a) return b;
  if (!b) return a;
  return [Math.min(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[3], b[3])];
};

const wrapLon = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;

export const MapScene: React.FC<SceneProps> = ({scene}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H, fps} = useVideoConfig();
  const u = useUnit();
  const v = scene.visual || {};
  const D = Math.max(1, scene.durationFrames);
  const pins: Pin[] = (v.pins || []).filter((p: any) => p && typeof p.lat === 'number' && typeof p.lon === 'number');
  const arrows: Array<{from: string | number; to: string | number}> = v.arrows || [];
  const city = v.city && typeof v.city.lat === 'number' && typeof v.city.lon === 'number' ? v.city : null;

  const globeS = Math.min(W, H) * 0.42;
  const fit = (b: Box, fill = 0.62): View => {
    const latc = (b[2] + b[3]) / 2;
    const lonc = wrapLon((b[0] + b[1]) / 2);
    const dLon = Math.max(1.2, b[1] - b[0]) * (Math.PI / 180) * Math.max(0.15, Math.cos((latc * Math.PI) / 180));
    const dLat = Math.max(1.2, b[3] - b[2]) * (Math.PI / 180);
    const pw = 2 * Math.sin(Math.min(dLon, Math.PI) / 2);
    const ph = 2 * Math.sin(Math.min(dLat, Math.PI) / 2);
    const s = Math.min((W * fill) / pw, (H * fill) / ph);
    return {lon: lonc, lat: latc, s: Math.max(globeS, Math.min(globeS * 160, s))};
  };

  // --- targets ---
  const focus = findCountry(v.focus);
  const focusMain = focus ? mainPart(focus) : null;
  const focusBox = focusMain ? boxOfFeature(focusMain) : null;
  const highlights: Array<{f: any; colour: string}> = [];
  if (focus) highlights.push({f: focus, colour: colourOf(v.focusColour, C.ink)});
  for (const h of v.highlight || []) {
    const ref = typeof h === 'object' && h ? h.country : h;
    const f = findCountry(ref);
    if (f && f !== focus) highlights.push({f, colour: colourOf(typeof h === 'object' && h ? h.colour : undefined, C.stamp)});
  }
  const pinBox = boxOfPoints([...pins.map((p) => [p.lon, p.lat] as [number, number]), ...(city ? [[city.lon, city.lat] as [number, number]] : [])]);
  const regionBox: Box | null = REGIONS[v.region] && v.region !== 'world' ? REGIONS[v.region] : null;

  const targets: Array<{view: View; kind: string}> = [];
  if (focusBox && v.zoomTo !== 'none') targets.push({view: fit(focusBox, 0.55), kind: 'country'});
  if (city && v.zoomTo === 'city') {
    const base = targets.length ? targets[targets.length - 1].view.s : globeS * 8;
    targets.push({view: {lon: city.lon, lat: city.lat, s: Math.min(globeS * 160, Math.max(base * 3, globeS * 30))}, kind: 'city'});
  }
  const overviewBox = unionBox(pinBox, focusBox);
  if (targets.length && arrows.length && overviewBox) targets.push({view: fit(overviewBox, 0.7), kind: 'overview'});
  if (!targets.length) {
    const b = regionBox || (v.region === 'world' ? null : pinBox);
    targets.push({view: b ? fit(b, 0.75) : {lon: pinBox ? wrapLon((pinBox[0] + pinBox[1]) / 2) : 10, lat: 20, s: globeS}, kind: 'overview'});
  }

  // --- keyframes (frames) ---
  const keys: Array<{f: number; view: View}> = [];
  const first = targets[0].view;
  const useGlobe = v.globe !== false;
  const spin = useGlobe ? 1.1 * fps : 0;
  const zoomF = 1.5 * fps;
  const hold = 0.7 * fps;
  const needed = spin + targets.length * (zoomF + hold);
  const k = Math.max(0.35, Math.min(1, (D - 1.4 * fps) / Math.max(1, needed)));
  let t = 0;
  if (useGlobe) {
    keys.push({f: 0, view: {lon: wrapLon(first.lon + 75), lat: 12, s: globeS}});
    t += spin * k;
    keys.push({f: t, view: {lon: first.lon, lat: Math.max(-35, Math.min(35, first.lat)), s: globeS}});
  } else {
    keys.push({f: 0, view: first});
  }
  const reached: Record<string, number> = {};
  targets.forEach((tg, i) => {
    if (!(i === 0 && !useGlobe)) t += zoomF * k;
    keys.push({f: t, view: tg.view});
    reached[tg.kind] = t;
    if (i < targets.length - 1) {
      t += hold * k;
      keys.push({f: t, view: tg.view});
    }
  });
  const fEnd = t;
  const fCountry = reached.country ?? fEnd;
  const fCity = reached.city ?? fEnd;
  const fPins = targets.length > 1 ? (reached.country ?? reached.city ?? fEnd) : fEnd - 0.4 * fps;

  const ease = Easing.inOut(Easing.cubic);
  let view: View = keys[keys.length - 1].view;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const p = frame <= a.f ? 0 : b.f - a.f < 1e-6 ? 1 : ease((frame - a.f) / (b.f - a.f));
      const [lon, lat] = geoInterpolate([a.view.lon, a.view.lat], [b.view.lon, b.view.lat])(p);
      view = {lon, lat, s: Math.exp(Math.log(a.view.s) + (Math.log(b.view.s) - Math.log(a.view.s)) * p)};
      break;
    }
  }
  // gentle drift after the last keyframe
  const drift = interpolate(frame, [fEnd, Math.max(fEnd + 1, D)], [1, 1.05], clamp);
  view = {...view, s: view.s * drift};

  const proj = geoOrthographic()
    .rotate([-view.lon, -view.lat])
    .scale(view.s)
    .translate([W / 2, H / 2])
    .clipExtent([
      [-20, -20],
      [W + 20, H + 20],
    ]);
  const path = geoPath(proj);
  const atlas = view.s > globeS * 2.5 ? A50 : A110;
  const centre: [number, number] = [view.lon, view.lat];
  const visible = (lon: number, lat: number) => geoDistance([lon, lat], centre) < Math.PI / 2 - 0.03;

  const hiOpacity = interpolate(frame, [Math.max(0, fCountry - 0.5 * fps), fCountry + 0.2 * fps], [0, 1], clamp);
  const findPin = (ref: string | number): Pin | undefined => (typeof ref === 'number' ? pins[ref] : pins.find((p) => p.label === ref));

  return (
    <AbsoluteFill style={{backgroundColor: C.board}}>
      <svg width={W} height={H} style={{position: 'absolute'}}>
        <path d={path({type: 'Sphere'} as any) || ''} fill={C.paper} stroke={C.board} strokeWidth={STROKE} />
        <path d={path(GRATICULE as any) || ''} fill="none" stroke={C.greyLight} strokeWidth={1.2} />
        <path d={path(atlas.land) || ''} fill={C.greyLight} stroke="none" />
        <path d={path(atlas.borders) || ''} fill="none" stroke={C.grey} strokeWidth={1.2} strokeLinejoin="round" />
        {highlights.map((h, i) => (
          <path key={'h' + i} d={path(h.f) || ''} fill={h.colour} fillOpacity={hiOpacity} stroke={C.board} strokeWidth={STROKE * 0.8} strokeOpacity={hiOpacity} strokeLinejoin="round" />
        ))}
        <path d={path(atlas.land) || ''} fill="none" stroke={C.board} strokeWidth={STROKE} strokeLinejoin="round" />
        {arrows.map((a, i) => {
          const A = findPin(a.from);
          const B = findPin(a.to);
          if (!A || !B) return null;
          const start = fEnd + i * 0.35 * fps;
          const p = interpolate(frame, [start, start + 1.0 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
          if (p <= 0) return null;
          const gi = geoInterpolate([A.lon, A.lat], [B.lon, B.lat]);
          const n = 48;
          const coords: Array<[number, number]> = [];
          for (let j = 0; j <= n; j++) coords.push(gi((j / n) * p) as [number, number]);
          const d = path({type: 'LineString', coordinates: coords} as any) || '';
          const end = coords[coords.length - 1];
          const prev = coords[Math.max(0, coords.length - 3)];
          const e = proj(end);
          const q = proj(prev);
          const showHead = p > 0.15 && !!e && !!q && visible(end[0], end[1]);
          const ang = showHead ? (Math.atan2(e![1] - q![1], e![0] - q![0]) * 180) / Math.PI : 0;
          return (
            <g key={'a' + i}>
              <path d={d} fill="none" stroke={C.board} strokeWidth={11 * u} strokeLinecap="round" strokeLinejoin="round" />
              <path d={d} fill="none" stroke={C.stamp} strokeWidth={6 * u} strokeLinecap="round" strokeLinejoin="round" />
              {showHead ? <polygon points="6,0 -24,-14 -24,14" fill={C.stamp} stroke={C.board} strokeWidth={3} transform={`translate(${e![0]} ${e![1]}) rotate(${ang}) scale(${u})`} /> : null}
            </g>
          );
        })}
      </svg>
      {pins.map((pin, i) => {
        if (!visible(pin.lon, pin.lat)) return null;
        const xy = proj([pin.lon, pin.lat]);
        if (!xy) return null;
        const g = spring({frame: Math.max(0, frame - fPins - i * 6), fps, config: {damping: 12}});
        if (g <= 0.001) return null;
        return (
          <div key={'p' + i} style={{position: 'absolute', left: xy[0], top: xy[1], transform: `translate(-50%, -50%) scale(${g})`}}>
            <div style={{width: 28 * u, height: 28 * u, borderRadius: '50%', background: C.stamp, border: `${STROKE}px solid ${C.board}`}} />
            <div style={{position: 'absolute', left: 38 * u, top: -14 * u, whiteSpace: 'nowrap', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 30 * u, color: C.board, background: C.paper, border: `${STROKE}px solid ${C.board}`, padding: `${2 * u}px ${10 * u}px`}}>{pin.label}</div>
          </div>
        );
      })}
      {city && v.zoomTo === 'city' && visible(city.lon, city.lat)
        ? (() => {
            const xy = proj([city.lon, city.lat]);
            if (!xy) return null;
            const g = spring({frame: Math.max(0, frame - fCity + 0.3 * fps), fps, config: {damping: 10}});
            return (
              <div style={{position: 'absolute', left: xy[0], top: xy[1], transform: `translate(-50%, -100%) scale(${g})`, transformOrigin: '50% 100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 52 * u, color: C.paper, background: C.board, padding: `${6 * u}px ${18 * u}px`, whiteSpace: 'nowrap'}}>{city.name || ''}</div>
                <div style={{width: 0, height: 0, borderLeft: `${16 * u}px solid transparent`, borderRight: `${16 * u}px solid transparent`, borderTop: `${26 * u}px solid ${C.board}`}} />
              </div>
            );
          })()
        : null}
      {focus && v.focusLabel
        ? (() => {
            const c = geoCentroid(focusMain);
            if (!visible(c[0], c[1])) return null;
            const xy = proj(c as [number, number]);
            if (!xy) return null;
            const o = interpolate(frame, [fCountry, fCountry + 0.4 * fps], [0, 1], clamp);
            return (
              <div style={{position: 'absolute', left: xy[0], top: xy[1], transform: 'translate(-50%, -50%)', opacity: o, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 64 * u, color: C.paper, WebkitTextStroke: `${3 * u}px ${C.board}`, whiteSpace: 'nowrap', letterSpacing: 2 * u}}>
                {String(v.focusLabel).toUpperCase()}
              </div>
            );
          })()
        : null}
      <Kicker text={scene.onScreenText} />
    </AbsoluteFill>
  );
};

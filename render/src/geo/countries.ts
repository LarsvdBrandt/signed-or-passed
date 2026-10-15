import {feature} from 'topojson-client';
import world110 from 'world-atlas/countries-110m.json';

/**
 * Shared geography helpers (Natural Earth via world-atlas, public domain) for infographics.
 * (scenes/MapScene.tsx keeps its own copy of the tables for now; both use the same world-atlas ids.)
 */

// [lonMin, lonMax, latMin, latMax]
export const REGION_BOXES: Record<string, [number, number, number, number]> = {
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
export const ISO3: Record<string, string> = {
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

let cache110: any[] | null = null;

/** All countries of the 1:110m atlas as GeoJSON features (parsed once). */
export const countries110 = (): any[] => {
  if (!cache110) {
    const topo: any = world110 as any;
    cache110 = (((feature(topo, topo.objects.countries) as any).features || []) as any[]).slice();
  }
  return cache110;
};

/** Country by ISO alpha-3, numeric id or English Natural Earth name. */
export const findCountry110 = (ref: unknown): any | undefined => {
  if (ref === undefined || ref === null || ref === '') return undefined;
  const s = String(ref).trim();
  const n = /^\d+$/.test(s) ? s.padStart(3, '0') : ISO3[s.toUpperCase()];
  const low = s.toLowerCase();
  return countries110().find((f) => (n && String(f.id) === n) || String(f.properties?.name || '').toLowerCase() === low);
};

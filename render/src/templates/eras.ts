/**
 * ERA KITS for scene templates (render/src/templates). A template asks the kit for "the document", "the phone",
 * "the shop" ... and the era decides which illustration component that is (render/src/illustrations + render/src/eras),
 * which backdrop is used and how the Characters are dressed. See docs/library/templates.md.
 */
export type EraKit = {
  id: string;
  /** general backdrop (street / skyline of the era) */
  backdrop: string;
  /** indoor meeting room backdrop */
  room: string;
  /** Character costume (docs/library/characters.md) */
  costume: string;
  /** costume for workers */
  worker: string;
  /** a document / contract component */
  doc: string;
  /** what signs or seals the document */
  seal: string;
  /** communication device in a call */
  comm: string;
  /** Character pose and held prop during a call */
  callPose: string;
  callHold: string;
  /** default banner text of a call */
  callText: string;
  money: string;
  /** what shows prices / a market */
  market: string;
  /** a shop building */
  shop: string;
  /** a workbench device (startup, office) */
  device: string;
  /** a factory machine */
  machine: string;
  ship: string;
  /** a lamp for night scenes */
  light: string;
  /** press camera, null before photography */
  camera: string | null;
};

const MODERN: EraKit = {
  id: 'modern',
  backdrop: 'OfficeBackdrop',
  room: 'BoardroomBackdrop',
  costume: 'suit',
  worker: 'worker',
  doc: 'Contract',
  seal: 'FountainPen',
  comm: 'Smartphone',
  callPose: 'phone',
  callHold: 'smartphone',
  callText: 'INCOMING CALL',
  money: 'MoneyStack',
  market: 'StockBoard',
  shop: 'StoreFront',
  device: 'Laptop',
  machine: 'AssemblyLine',
  ship: 'ContainerShip',
  light: 'Lightbulb',
  camera: 'DigitalCamera',
};

export const ERA_KITS: Record<string, EraKit> = {
  ancient: {
    ...MODERN,
    id: 'ancient',
    backdrop: 'AncientBackdrop',
    room: 'AncientBackdrop',
    costume: 'toga',
    worker: 'plain',
    doc: 'Scroll',
    seal: 'WaxTablet',
    comm: 'Scroll',
    callPose: 'talk',
    callHold: 'contract',
    callText: 'A MESSENGER ARRIVES',
    money: 'AncientCoin',
    market: 'Scales',
    shop: 'MarketStall',
    device: 'WaxTablet',
    machine: 'Amphora',
    ship: 'Galley',
    light: 'OilLamp',
    camera: null,
  },
  medieval: {
    ...MODERN,
    id: 'medieval',
    backdrop: 'MedievalBackdrop',
    room: 'MedievalBackdrop',
    costume: 'tunic',
    worker: 'tunic',
    doc: 'QuillParchment',
    seal: 'WaxSeal',
    comm: 'QuillParchment',
    callPose: 'talk',
    callHold: 'contract',
    callText: 'A MESSENGER ARRIVES',
    money: 'MoneyBag',
    market: 'Scales',
    shop: 'MarketStall',
    device: 'QuillParchment',
    machine: 'Cart',
    ship: 'Ship',
    light: 'Lantern',
    camera: null,
  },
  'golden-age': {
    ...MODERN,
    id: 'golden-age',
    backdrop: 'GoldenAgeBackdrop',
    room: 'GoldenAgeBackdrop',
    costume: 'merchant',
    worker: 'merchant',
    doc: 'Ledger',
    seal: 'WaxSeal',
    comm: 'Envelope',
    callPose: 'talk',
    callHold: 'contract',
    callText: 'A LETTER ARRIVES',
    money: 'SpiceSacks',
    market: 'Ledger',
    shop: 'CanalHouse',
    device: 'Globe',
    machine: 'SpiceSacks',
    ship: 'Fluyt',
    light: 'Lantern',
    camera: null,
  },
  industrial: {
    ...MODERN,
    id: 'industrial',
    backdrop: 'IndustrialBackdrop',
    room: 'IndustrialBackdrop',
    costume: 'victorian',
    worker: 'worker',
    doc: 'Telegram',
    seal: 'FountainPen',
    comm: 'TelegraphKey',
    callPose: 'talk',
    callHold: 'contract',
    callText: 'TELEGRAM',
    money: 'ShareCertificate',
    market: 'ShareCertificate',
    shop: 'StoreFront',
    device: 'TelegraphKey',
    machine: 'SteamEngine',
    ship: 'Ship',
    light: 'GasLamp',
    camera: 'FilmCamera',
  },
  twenties: {
    ...MODERN,
    id: 'twenties',
    backdrop: 'DecoBackdrop',
    room: 'DecoBackdrop',
    costume: 'twenties',
    comm: 'OldTelephone',
    callHold: 'phone',
    callText: 'LONG DISTANCE CALL',
    money: 'MoneyBag',
    market: 'TickerTape',
    device: 'Typewriter',
    ship: 'Ship',
    camera: 'FilmCamera',
  },
  fifties: {
    ...MODERN,
    id: 'fifties',
    backdrop: 'DinerBackdrop',
    costume: 'fifties',
    comm: 'RotaryPhone',
    callHold: 'phone',
    device: 'Typewriter',
    ship: 'Ship',
    camera: 'FilmCamera',
  },
  eighties: {
    ...MODERN,
    id: 'eighties',
    backdrop: 'NeonBackdrop',
    costume: 'eighties',
    comm: 'OldTelephone',
    callHold: 'phone',
    device: 'Computer',
    camera: 'FilmCamera',
  },
  nineties: {
    ...MODERN,
    id: 'nineties',
    backdrop: 'CubicleBackdrop',
    room: 'CubicleBackdrop',
    costume: 'suit',
    comm: 'Pager',
    callHold: 'phone',
    market: 'EarlyWebsite',
    device: 'BeigePC',
    machine: 'ServerRack',
  },
  noughties: {
    ...MODERN,
    id: 'noughties',
    backdrop: 'OpenPlanBackdrop',
    room: 'OpenPlanBackdrop',
    costume: 'casual',
    comm: 'FlipPhone',
    callHold: 'phone',
    market: 'FlatScreen',
    camera: 'CompactCamera',
  },
  modern: MODERN,
  future: {
    ...MODERN,
    id: 'future',
    backdrop: 'FutureSkylineBackdrop',
    room: 'FutureSkylineBackdrop',
    costume: 'future',
    worker: 'future',
    comm: 'SmartphoneGrid',
    device: 'VRHeadset',
    machine: 'RobotArm',
    camera: 'Drone',
  },
};

const ALIASES: Record<string, string> = {
  antiquity: 'ancient', rome: 'ancient', roman: 'ancient', greek: 'ancient', egypt: 'ancient',
  'middle-ages': 'medieval', '1300s': 'medieval', '1400s': 'medieval',
  '1600s': 'golden-age', '1700s': 'golden-age', 'dutch-golden-age': 'golden-age', exploration: 'golden-age', baroque: 'golden-age', voc: 'golden-age',
  victorian: 'industrial', '1800s': 'industrial', '1850s': 'industrial', '1890s': 'industrial', '1900s': 'industrial', '1910s': 'industrial', 'gilded-age': 'industrial',
  '1920s': 'twenties', '1930s': 'twenties', deco: 'twenties', 'art-deco': 'twenties', 'roaring-twenties': 'twenties', depression: 'twenties', 'jazz-age': 'twenties',
  '1940s': 'fifties', '1950s': 'fifties', '1960s': 'fifties', diner: 'fifties', 'mid-century': 'fifties',
  '1970s': 'eighties', '1980s': 'eighties', '80s': 'eighties', neon: 'eighties',
  '1990s': 'nineties', '90s': 'nineties', dotcom: 'nineties', cubicle: 'nineties',
  '2000s': 'noughties', 'open-plan': 'noughties', '2008': 'noughties',
  today: 'modern', '2010s': 'modern', '2020s': 'modern', contemporary: 'modern',
  'near-future': 'future', '2030s': 'future', 'sci-fi': 'future',
};

export const ERA_KIT_IDS = Object.keys(ERA_KITS);

/** The kit of an era id or alias; unknown -> modern. */
export const eraKit = (era?: string | null): EraKit => {
  const k = String(era || 'modern').toLowerCase().trim();
  return ERA_KITS[k] || ERA_KITS[ALIASES[k] || ''] || MODERN;
};

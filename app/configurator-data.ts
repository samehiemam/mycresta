export type ModelKey = "34" | "36" | "43";

/** Gelcoat colours, each with its own studio render. */
export type GelcoatKey =
  | "white"
  | "telegrey"
  | "sportive-grey"
  | "antracite"
  | "elegant-blue";

export type FinishOption = {
  id: string;
  label: string;
  /** Fallback colour, used before the material photo loads. */
  tone: string;
  /** Photograph of the actual material from the Kumbra materials guide. */
  image?: string;
  note?: string;
};

export type EngineOption = {
  id: string;
  label: string;
  family: "Mercury" | "Volvo" | "Yanmar";
  propulsion: "Hidden outboard" | "Outboard" | "Inboard" | "Shafts";
  /** Filled from the server for entitled sessions; null in the bundle. */
  price: number | null;
};

export type EquipmentOption = {
  id: string;
  category: string;
  label: string;
  price: number | "on-request" | null;
  condition?: string;
  exclusiveGroup?: string;
  engineFamily?: EngineOption["family"];
  unavailableWithPropulsion?: EngineOption["propulsion"][];
  requiresAny?: string[];
};

export type ModelConfiguration = {
  name: string;
  spec: string;
  /** Filled from the server for entitled sessions; null in the bundle. */
  basePrice: number | null;
  /** One studio render per gelcoat colour. */
  images: Record<GelcoatKey, string>;
  /**
   * Optional top-down deck render used to preview upholstery, flooring and
   * teak. Not supplied yet — the configurator shows a materials panel in the
   * reserved space until these are added.
   */
  topImages?: Partial<Record<GelcoatKey, string>>;
  engines: EngineOption[];
  includedEquipment: string[];
  equipment: EquipmentOption[];
};

const equipment = (
  id: string,
  category: string,
  label: string,
  price: EquipmentOption["price"],
  extra: Omit<EquipmentOption, "id" | "category" | "label" | "price"> = {},
): EquipmentOption => ({ id, category, label, price, ...extra });

const standardEquipment34 = [
  "Flagpole",
  "Steering wheel",
  "Bathroom with electric toilet, sink and bathroom accessories",
  "LED navigation lights",
  "Horn",
  "LED courtesy lights",
  "Automatic and manual bilge pumps",
  "Extendable anchor with windlass and chain",
  "White hull",
  "USB sockets",
  "Complete upholstery — bow and stern",
  "Simrad 12″ navigation display",
  "Basic interior carpentry and Gray Onyx Corian",
  "Fusion audio system with 4 speakers",
  "Retractable cleats",
  "Deck table",
  "Synthetic Flexiteek with white lines",
  "Battery charger and shore-power cable",
  "Wetbar with sink and 85L electric refrigerator",
  "Main double bed in bow, convertible to sofa",
  "Fresh-water deck shower",
  "Stern cabin with 2 single beds",
  "Premium bathing ladder",
  "Automation control screen",
  "Electric piston and hatch for engine-room access",
  "3 pilot seats",
  "Skylight windows on hull sides",
  "Depth sounder",
];

const standardEquipment36 = [
  "Flagpole",
  "Premium Gussi Italia steering wheel",
  "Bathroom with electric toilet, sink, shower and accessories",
  "LED navigation lights",
  "Horn",
  "LED courtesy lights",
  "Automatic and manual bilge pumps",
  "Extendable anchor with windlass and chain",
  "White hull",
  "USB sockets",
  "Complete upholstery — bow and stern",
  "Simrad 12″ navigation display",
  "Basic interior joinery and Gray Onyx Corian",
  "Fusion audio system with 4 speakers",
  "Retractable cleats",
  "Deck table",
  "Flexiteek synthetic teak with white line",
  "Battery charger and shore-power cable",
  "Wetbar with sink and 85L electric refrigerator",
  "Main double bed in bow, convertible to sofa",
  "Fresh-water deck shower",
  "Stern cabin with 2 single beds",
  "Premium bathing ladder",
  "Home-automation control screen",
  "Skylight windows on hull sides",
  "3 Sport Edition helm seats",
  "XL stern platform",
  "Depth sounder",
];

const standardEquipment43 = [
  "Flagpole",
  "Kumbra premium steering wheel",
  "Full bathroom with electric toilet, sink and separate shower",
  "LED navigation lights",
  "Horn",
  "LED courtesy lights",
  "Automatic and manual bilge pumps",
  "Extendable anchor with windlass and chain",
  "White hull with line design",
  "Type-C and 220V sockets",
  "Complete upholstery — bow and stern",
  "Simrad 12″ navigation display",
  "Essential interior joinery",
  "Fusion audio system with 6 speakers",
  "Retractable cleats",
  "Fixed XL deck table",
  "Synthetic teak with white line",
  "Battery charger and shore-power cable",
  "Wetbar with sink and 85L electric refrigerator",
  "Windshield",
  "Fresh-water deck shower",
  "Bow cabin with double bed, convertible to sofa",
  "XL bathing ladder with handles",
  "Domotic control screen",
  "Electric piston and hatch for engine-room access",
  "Large Edition bathing platform",
  "Side skylights on hull",
  "Depth sounder",
  "Stern sunbed with reclining upholstery and stern bench",
  "Bow sunbed with double divan",
];

const shared34and36: EquipmentOption[] = [
  equipment("antifouling", "Finishes", "Antifouling and anti-osmosis", null),
  equipment(
    "full-colour-change",
    "Finishes",
    "Colour change of hull, deck and hardtop",
    null),
  equipment("hull-colour-change", "Finishes", "Hull colour change", null),
  equipment(
    "upholstery-colour-change",
    "Finishes",
    "Upholstery colour change",
    null),
  equipment(
    "teak-line-colour-change",
    "Finishes",
    "Teak and vinyl-line colour change",
    null),
  equipment(
    "joinery-colour-change",
    "Finishes",
    "Interior joinery colour change",
    null),
  equipment("autopilot", "Navigation & electronics", "Autopilot integrated in display", null),
  equipment(
    "vhf",
    "Navigation & electronics",
    "VHF radio and antenna",
    null,
    { condition: "Mandatory in some navigation areas; your advisor will confirm." }),
  equipment("chain-counter", "Navigation & electronics", "Chain counter", null),
  equipment(
    "zipwake",
    "Navigation & electronics",
    "ZipWake Dynamic Trim System 450S",
    null),
  equipment("radar", "Navigation & electronics", "Radar antenna", null),
  equipment("ais", "Navigation & electronics", "AIS", null),
  equipment(
    "nav-simrad-9-pair",
    "Navigation & electronics",
    "2 × Simrad 9″ navigation displays",
    null,
    {
      exclusiveGroup: "navigation-display",
      condition: "Replaces the standard Simrad 12″ display.",
    }),
  equipment(
    "nav-ultrawide",
    "Navigation & electronics",
    "NSX Ultrawide panoramic display",
    null,
    { exclusiveGroup: "navigation-display" }),
  equipment(
    "nav-simrad-12-second",
    "Navigation & electronics",
    "Second Simrad 12″ navigation display",
    null,
    { exclusiveGroup: "navigation-display" }),
  equipment("interior-fridge", "Electrical", "Interior fridge/freezer 41L", null),
  equipment("outdoor-freezer", "Electrical", "Outdoor freezer", null),
  equipment("lithium-6kwh", "Electrical", "Lithium battery pack 12V 6kWh", null),
  equipment(
    "generator-3-5",
    "Electrical",
    "Generator 3.5kW",
    null,
    {
      exclusiveGroup: "power-supply",
      unavailableWithPropulsion: ["Inboard"],
      condition: "Not compatible with inboard engines.",
    }),
  equipment(
    "inverter",
    "Electrical",
    "12V to 220V inverter with extra battery",
    null,
    { exclusiveGroup: "power-supply" }),
  equipment("solar-hardtop", "Electrical", "Solar panel on hardtop", null),
  equipment("water-heater", "Electrical", "220V water heater 15L", null),
  equipment(
    "stern-220v-socket",
    "Electrical",
    "220V socket in stern sunbed locker",
    null),
  equipment("underwater-led", "Electrical", "Underwater LED lights", null),
  equipment("hardtop-led", "Electrical", "LED lights on hardtop", null),
  equipment("deck-led", "Electrical", "LED lights on deck", null),
  equipment(
    "hydraulic-balconies",
    "Deck",
    "Hydraulic side balconies",
    null,
    {
      condition: "Stern cabin is not included and build time increases by 4 weeks.",
    }),
  equipment("fenders", "Deck", "6 × Kumbra Yachts fenders", null),
  equipment("stern-doors", "Deck", "Stern doors", null),
  equipment("stainless-chain", "Deck", "Stainless steel chain", null),
  equipment("extra-cleats", "Deck", "2 extra retractable cleats", null),
  equipment(
    "premium-synthetic-teak",
    "Deck",
    "Premium synthetic teak with exclusive design",
    null,
    { exclusiveGroup: "deck-finish" }),
  equipment("natural-teak", "Deck", "Natural teak", null, {
    exclusiveGroup: "deck-finish",
  }),
  equipment("teak-gunwale", "Deck", "Teak on gunwale", null),
  equipment("bow-shower", "Deck", "Bow shower (fresh water)", null),
  equipment("waterski-hitch", "Deck", "Wakeboard / water-ski hitch", null),
  equipment("safety-equipment", "Deck", "Safety equipment — navigation area 5", null),
  equipment(
    "wetbar-igloo",
    "Wetbar & table",
    "Igloo pouffe integrated in wetbar",
    null,
    { exclusiveGroup: "wetbar-layout" }),
  equipment(
    "wetbar-gas-stove",
    "Wetbar & table",
    "2-burner gas stove",
    null,
    { exclusiveGroup: "wetbar-layout" }),
  equipment(
    "wetbar-electric-grill",
    "Wetbar & table",
    "Electric grill",
    null,
    {
      exclusiveGroup: "wetbar-layout",
      condition: "Requires a generator or inverter.",
      requiresAny: ["generator-3-5", "inverter"],
    }),
  equipment(
    "wetbar-dry-cooler",
    "Wetbar & table",
    "Dry cooler / built-in ice bucket",
    null,
    { exclusiveGroup: "wetbar-layout" }),
  equipment(
    "table-sunbed",
    "Wetbar & table",
    "Deck table convertible to sunbed + cushion",
    null,
    { exclusiveGroup: "deck-table" }),
  equipment(
    "table-electric-sunbed",
    "Wetbar & table",
    "Electric-pedestal deck table convertible to sunbed + cushion",
    null,
    { exclusiveGroup: "deck-table" }),
  equipment("stern-bimini-carbon", "Biminis & covers", "Stern sunbed bimini with carbon poles", null),
  equipment("stern-side-bimini", "Biminis & covers", "Side bimini at stern", null),
  equipment("stern-bimini-electric", "Biminis & covers", "Electric stern sunbed bimini", null),
  equipment("bow-bimini-carbon", "Biminis & covers", "Bow sunbed bimini with carbon poles", null),
  equipment("full-windbreak-cover", "Biminis & covers", "Full windbreak and helm console cover", null),
  equipment("helm-console-cover", "Biminis & covers", "Helm console cover", null),
  equipment("helm-wetbar-cover", "Biminis & covers", "Helm seats and wetbar cover", null),
  equipment("stern-furniture-cover", "Biminis & covers", "Table, sofas and stern sunbed cover", null),
  equipment("bow-sunbed-cover", "Biminis & covers", "Bow sunbed cover", null),
  equipment("ac-bow", "Interior", "Air conditioning in bow", null, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("ac-bow-stern", "Interior", "Air conditioning in bow and stern", null, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("ac-bow-12v", "Interior", "Air conditioning in bow 12V", null, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("stern-curtains", "Interior", "Divider curtains in stern cabin", null),
  equipment("stern-mattress", "Interior", "Extra mattress for stern cabin", null),
  equipment("linen-kit", "Interior", "Sheet set, bedspreads and pillow kit", null),
  equipment("towel-kit", "Interior", "Towel kit", null),
  equipment("interior-shower", "Interior", "Interior shower", null),
  equipment("oven-microwave", "Interior", "Oven / microwave", null),
  equipment(
    "premium-upholstery",
    "Upgrades",
    "Premium upholstery package",
    null,
    {
      condition:
        "Includes diamond design, bow sunbed curve and armrests, anchor-locker cushion and dining-area side backrests.",
    }),
  equipment(
    "premium-carpentry",
    "Upgrades",
    "Premium carpentry package",
    null,
    {
      condition:
        "Includes upgraded bed sides, bulkhead, nightstand, stern floor, engraved Corian stairs and teak bathroom floor.",
    }),
  equipment("transport-wrap", "Transport", "Shrink-wrapping for transport", null),
  equipment("transport-cradle", "Transport", "Transport cradle", "on-request"),
];

const model34Only: EquipmentOption[] = [
  equipment(
    "mercury-joystick",
    "Control & manoeuvring",
    "Mercury Marine Joystick Piloting System",
    null,
    { engineFamily: "Mercury", exclusiveGroup: "joystick" }),
  equipment(
    "volvo-joystick",
    "Control & manoeuvring",
    "Volvo Penta Motors Joystick",
    null,
    { engineFamily: "Volvo", exclusiveGroup: "joystick" }),
  equipment("bow-thruster", "Control & manoeuvring", "Bow thruster", null),
  equipment("hardtop", "Deck", "Hardtop", null),
  equipment("premium-helm-seats", "Deck", "Premium helm seats", null),
  equipment("premium-wheel", "Deck", "Premium Gussi Italia steering wheel", null),
  equipment("stern-backrest", "Deck", "Folding stern sunbed backrest", null),
  equipment("windshield-wiper", "Deck", "Windshield glass with wiper", null),
  equipment(
    "transparent-windshield-cover",
    "Biminis & covers",
    "Transparent cover between windshield and hardtop",
    null),
  equipment(
    "premium-audio",
    "Upgrades",
    "Fusion Premium audio — 6 Pro speakers + subwoofer",
    null),
];

const model36Only: EquipmentOption[] = [
  equipment(
    "mercury-joystick",
    "Control & manoeuvring",
    "Mercury Marine Joystick Piloting System",
    null,
    { engineFamily: "Mercury", exclusiveGroup: "joystick" }),
  equipment(
    "volvo-joystick",
    "Control & manoeuvring",
    "Volvo Penta Motors Joystick",
    null,
    { engineFamily: "Volvo", exclusiveGroup: "joystick" }),
  equipment("bow-thruster", "Control & manoeuvring", "Bow thruster", null),
  equipment(
    "hardtop-special",
    "Deck",
    "Special Edition hardtop enclosed and anchored to gunwales",
    null),
  equipment("windshield-wiper", "Deck", "Windshield glass with wiper", null),
  equipment("led-tv", "Interior", "LED TV", null),
  equipment(
    "premium-audio",
    "Upgrades",
    "Fusion Premium audio — 6 speakers + amplifier",
    null),
];

const model43Equipment: EquipmentOption[] = [
  equipment(
    "mercury-joystick",
    "Control & manoeuvring",
    "Mercury Marine Joystick Piloting System",
    null,
    { engineFamily: "Mercury", exclusiveGroup: "joystick" }),
  equipment(
    "volvo-joystick",
    "Control & manoeuvring",
    "Volvo Penta Motors Joystick",
    null,
    { engineFamily: "Volvo", exclusiveGroup: "joystick" }),
  equipment("bow-thruster", "Control & manoeuvring", "Bow thruster", null, {
    exclusiveGroup: "thrusters",
  }),
  equipment(
    "bow-stern-thruster",
    "Control & manoeuvring",
    "Bow thruster + stern thruster",
    null,
    { exclusiveGroup: "thrusters" }),
  equipment("antifouling", "Finishes", "Antifouling, anti-osmosis and epoxy treatment", null),
  equipment("full-colour-change", "Finishes", "Colour change of hull, deck and hardtop", null),
  equipment("hull-colour-change", "Finishes", "Hull colour change", null),
  equipment("waterline-lines", "Finishes", "Acrylic-painted waterline lines", null, {
    condition: "Colour is selected with your advisor.",
  }),
  equipment("upholstery-colour-change", "Finishes", "Upholstery colour change", null),
  equipment("teak-line-colour-change", "Finishes", "Teak and vinyl-line colour change", null),
  equipment("joinery-colour-change", "Finishes", "Interior joinery colour change", null),
  equipment("autopilot", "Navigation & electronics", "Autopilot integrated in display", null),
  equipment("vhf", "Navigation & electronics", "VHF radio and antenna", null, {
    condition: "Mandatory in some navigation areas; your advisor will confirm.",
  }),
  equipment("chain-counter", "Navigation & electronics", "Chain counter", null),
  equipment("zipwake", "Navigation & electronics", "ZipWake Dynamic Trim System 450S", null),
  equipment("radar", "Navigation & electronics", "Radar antenna", null),
  equipment("ais", "Navigation & electronics", "AIS", null),
  equipment("nav-simrad-16", "Navigation & electronics", "Simrad 16″ navigation display", null, {
    exclusiveGroup: "navigation-display",
    condition: "Replaces the standard 12″ display.",
  }),
  equipment("nav-ultrawide-15", "Navigation & electronics", "NSX Ultrawide 15″ panoramic display", null, {
    exclusiveGroup: "navigation-display",
    condition: "Replaces the standard 12″ display.",
  }),
  equipment("nav-simrad-12-second", "Navigation & electronics", "Second Simrad 12″ navigation display", null, {
    exclusiveGroup: "navigation-display",
  }),
  equipment("nav-simrad-16-pair", "Navigation & electronics", "2 × Simrad 16″ navigation displays", null, {
    exclusiveGroup: "navigation-display",
    condition: "The standard 12″ display is not included.",
  }),
  equipment("lithium-6kwh", "Electrical", "Lithium battery pack 12V 6kWh", null),
  equipment("generator-3-5", "Electrical", "Generator 3.5kW", null, {
    exclusiveGroup: "power-supply",
  }),
  equipment("generator-6", "Electrical", "Generator 6kW", null, {
    exclusiveGroup: "power-supply",
  }),
  equipment("inverter", "Electrical", "12V to 220V inverter with extra battery", null, {
    exclusiveGroup: "power-supply",
  }),
  equipment("solar-hardtop", "Electrical", "Solar panel on hardtop", null),
  equipment("water-heater", "Electrical", "220V water heater 25L", null),
  equipment("wireless-charger", "Electrical", "Wireless charger in helm console", null),
  equipment("stern-220v-socket", "Electrical", "220V socket in stern sunbed locker", null),
  equipment("underwater-led", "Electrical", "Underwater LED lights", null),
  equipment("hardtop-led", "Electrical", "LED lights on hardtop", null),
  equipment("deck-led", "Electrical", "LED lights on deck", null),
  equipment("hardtop", "Deck", "Hardtop", null),
  equipment("premium-helm-seats", "Deck", "Premium sporty helm-seat upholstery", null),
  equipment("enclosed-windshield", "Deck", "Enclosed windshield glass", null),
  equipment("windshield-wiper", "Deck", "Windshield glass with wiper", null),
  equipment("fenders", "Deck", "8 custom fenders + 4 mooring lines", null),
  equipment("removable-bow-table", "Deck", "Removable bow table", null),
  equipment("stern-doors", "Deck", "Stern doors", null),
  equipment("stainless-chain", "Deck", "Stainless steel chain", null),
  equipment("extra-cleats", "Deck", "2 extra retractable cleats", null),
  equipment("premium-synthetic-teak", "Deck", "Premium synthetic teak with exclusive design", null, {
    exclusiveGroup: "deck-finish",
  }),
  equipment("natural-teak", "Deck", "Natural teak", null, {
    exclusiveGroup: "deck-finish",
  }),
  equipment("teak-gunwale", "Deck", "Teak on gunwale", null),
  equipment("bow-shower", "Deck", "Bow shower (fresh water)", null),
  equipment("waterski-hook", "Deck", "Stainless-steel wakeboard / water-ski hook and pole", null),
  equipment("safety-equipment", "Deck", "Safety equipment — navigation area 5", null),
  equipment("wetbar-igloo", "Wetbar & table", "Igloo pouffe with double bench and cushion", null),
  equipment("second-outdoor-fridge", "Wetbar & table", "Second outdoor fridge 85L", null),
  equipment("outdoor-freezer", "Wetbar & table", "Outdoor freezer", null),
  equipment("wetbar-coffee", "Wetbar & table", "Lift-system coffee machine in wetbar", null),
  equipment("wetbar-tv", "Wetbar & table", "LED TV in wetbar", null, {
    condition: "Price and installation are confirmed on request.",
  }),
  equipment("wetbar-gas-barbecue", "Wetbar & table", "Gas barbecue stove", null, {
    exclusiveGroup: "wetbar-layout",
  }),
  equipment("wetbar-teppanyaki", "Wetbar & table", "TeppanYaki", null, {
    exclusiveGroup: "wetbar-layout",
    condition: "Requires a generator or inverter.",
    requiresAny: ["generator-3-5", "generator-6", "inverter"],
  }),
  equipment("wetbar-electric-grill", "Wetbar & table", "Electric grill", null, {
    exclusiveGroup: "wetbar-layout",
    condition: "Requires a generator or inverter.",
    requiresAny: ["generator-3-5", "generator-6", "inverter"],
  }),
  equipment("wetbar-dry-cooler", "Wetbar & table", "Dry cooler / built-in ice bucket", null, {
    exclusiveGroup: "wetbar-layout",
  }),
  equipment("table-sunbed-pair", "Wetbar & table", "2 retractable deck tables convertible to sunbed + cushions", null, {
    exclusiveGroup: "deck-table",
    condition: "Replaces the standard fixed XL table.",
  }),
  equipment("table-electric-sunbed-pair", "Wetbar & table", "2 electric-pedestal tables convertible to sunbed + cushions", null, {
    exclusiveGroup: "deck-table",
    condition: "Replaces the standard fixed XL table.",
  }),
  equipment("stern-bimini-carbon", "Biminis & covers", "Stern sunbed bimini with carbon poles", null),
  equipment("stern-side-bimini", "Biminis & covers", "Side bimini at stern", null),
  equipment("stern-bimini-electric", "Biminis & covers", "Electric stern sunbed bimini", null),
  equipment("bow-bimini-carbon", "Biminis & covers", "Bow sunbed bimini with carbon poles", null),
  equipment("bow-side-bimini", "Biminis & covers", "Side bimini at bow", null),
  equipment("full-windshield-cover", "Biminis & covers", "Full windshield and helm console cover", null),
  equipment("helm-console-cover", "Biminis & covers", "Helm console cover", null),
  equipment("helm-wetbar-cover", "Biminis & covers", "Helm seats and wetbar cover", null),
  equipment("stern-furniture-cover", "Biminis & covers", "Table, sofas and stern sunbed cover", null),
  equipment("bow-sunbed-cover", "Biminis & covers", "Bow sunbed cover", null),
  equipment("transparent-windshield-cover", "Biminis & covers", "Transparent cover between windshield and hardtop", null),
  equipment("ac-bow", "Interior", "Air conditioning in bow — 16,000 BTU", null, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("ac-bow-stern", "Interior", "Air conditioning in bow and stern — 16,000 BTU", null, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("ac-12v", "Interior", "Air conditioning 12V — 16,000 BTU", null, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("interior-fridge", "Interior", "Interior fridge/freezer", null),
  equipment("interior-coffee", "Interior", "Lift-system coffee machine in main unit", null),
  equipment("oven-microwave", "Interior", "Oven / microwave", null),
  equipment("tv-bow", "Interior", "LED TV — bow cabin", null),
  equipment("tv-guest", "Interior", "LED TV — guest cabin", null),
  equipment("linen-kit", "Interior", "Sheet set, bedspreads and pillow kit", null),
  equipment("towel-kit", "Interior", "Towel kit", null),
  equipment("bathroom-accessories", "Interior", "Premium bathroom accessories", null),
  equipment("stairs-railing", "Interior", "Interior access-stairs railing", null),
  equipment("interior-curtains", "Interior", "Interior curtains", null),
  equipment("cabin-bulkhead", "Interior", "Dividing bulkhead and door between cabins", null),
  equipment("equipped-stern-cabin", "Interior", "Fully equipped stern cabin with two queen beds", null),
  equipment("premium-upholstery", "Upgrades", "Premium upholstery package", null, {
    condition: "Includes the custom-design seating details listed in the official price sheet.",
  }),
  equipment("premium-carpentry", "Upgrades", "Premium carpentry package", null, {
    condition: "Includes upgraded bathroom, cabin, Corian and relief-panel finishes.",
  }),
  equipment("premium-audio", "Upgrades", "Fusion Premium audio — 8 premium speakers + subwoofer", null),
  equipment("hydraulic-balconies", "Upgrades", "Hydraulic side balconies with teak inserts", null),
  equipment("hydraulic-platform", "Upgrades", "Hydraulic bathing platform with integrated ladder", null),
  equipment("seakeeper-4", "Upgrades", "Seakeeper 4 12V", null, {
    unavailableWithPropulsion: ["Shafts"],
    condition: "Not compatible with shaft motorisation.",
  }),
  equipment("transport-wrap", "Transport", "Shrink-wrapping for transport", null),
  equipment("transport-cradle", "Transport", "Transport cradle", "on-request"),
];

export const finishOptions = {
  gelcoat: [
    { id: "white", label: "White", tone: "#eceee9", image: "/images/materials/gelcoat-white.png", note: "Standard" },
    { id: "telegrey", label: "Telegrey", tone: "#c7c7c0", image: "/images/materials/gelcoat-telegrey.png" },
    { id: "sportive-grey", label: "Sportive Grey", tone: "#626b68", image: "/images/materials/gelcoat-sportive-grey.png" },
    { id: "antracite", label: "Antracite", tone: "#263638", image: "/images/materials/gelcoat-antracite.png" },
    { id: "elegant-blue", label: "Elegant Blue", tone: "#1595ca", image: "/images/materials/gelcoat-elegant-blue.png" },
  ] satisfies FinishOption[],
  vinyl: [
    { id: "black", label: "Black", tone: "#101010", image: "/images/materials/vinyl-black.png" },
    { id: "white", label: "White", tone: "#eef4f2", image: "/images/materials/vinyl-white.png", note: "Standard" },
  ] satisfies FinishOption[],
  upholstery: [
    { id: "grey", label: "Grey", tone: "#777a77", image: "/images/materials/upholstery-grey.png", note: "Standard" },
    { id: "white", label: "White", tone: "#dedbd3", image: "/images/materials/upholstery-white.png" },
    { id: "fossil", label: "Fossil", tone: "#aaa7a4", image: "/images/materials/upholstery-fossil.png" },
    { id: "october", label: "October", tone: "#ad2d1f", image: "/images/materials/upholstery-october.png" },
    { id: "cayenne", label: "Cayenne", tone: "#b1132a", image: "/images/materials/upholstery-cayenne.png" },
    { id: "submarine", label: "Submarine", tone: "#435a61", image: "/images/materials/upholstery-submarine.png" },
    { id: "storm", label: "Storm", tone: "#5d6264", image: "/images/materials/upholstery-storm.png" },
  ] satisfies FinishOption[],
  furniture: [
    { id: "wenge", label: "Wenge", tone: "#6d635c", image: "/images/materials/furniture-wenge.png", note: "Standard" },
    { id: "multiplis-nature", label: "Multiplis Nature", tone: "#817b72", image: "/images/materials/furniture-multiplis-nature.png" },
    { id: "pin-iceberg", label: "Pin Iceberg", tone: "#d8d6cf", image: "/images/materials/furniture-pin-iceberg.png" },
    { id: "chene-topia", label: "Chene Topia", tone: "#6c5945", image: "/images/materials/furniture-chene-topia.png" },
  ] satisfies FinishOption[],
  flooring: [
    { id: "chene-topia", label: "Chene Topia", tone: "#6c5945", image: "/images/materials/flooring-chene-topia.png", note: "Standard" },
    { id: "wenge", label: "Wenge", tone: "#6d635c", image: "/images/materials/flooring-wenge.png" },
    { id: "multiplis-nature", label: "Multiplis Nature", tone: "#817b72", image: "/images/materials/flooring-multiplis-nature.png" },
    { id: "pin-iceberg", label: "Pin Iceberg", tone: "#d8d6cf", image: "/images/materials/flooring-pin-iceberg.png" },
  ] satisfies FinishOption[],
  countertop: [
    { id: "multiplis-nature", label: "Multiplis Nature", tone: "#dce2e3", image: "/images/materials/countertop-multiplis-nature.png", note: "Standard" },
    { id: "carbon-concrete", label: "Carbon concrete", tone: "#242829", image: "/images/materials/countertop-carbon-concrete.png" },
  ] satisfies FinishOption[],
  teak: [
    { id: "bleached", label: "Bleached", tone: "#c79d63", image: "/images/materials/teak-bleached.png", note: "Standard" },
    { id: "scrubbed", label: "Scrubbed", tone: "#c3914c", image: "/images/materials/teak-scrubbed.png" },
    { id: "weathered", label: "Weathered", tone: "#756f63", image: "/images/materials/teak-weathered.png" },
    { id: "biscuit", label: "Biscuit", tone: "#b59b76", image: "/images/materials/teak-biscuit.png", note: "Premium" },
    { id: "platinum", label: "Platinum", tone: "#c9c5b8", image: "/images/materials/teak-platinum.png", note: "Premium" },
    { id: "blanc-des-blancs", label: "Blanc des Blancs", tone: "#ebe8dc", image: "/images/materials/teak-blanc-des-blancs.png", note: "Premium" },
    { id: "natural-teak", label: "Natural teak", tone: "#9f692b", image: "/images/materials/teak-natural-teak.png", note: "Natural" },
  ] satisfies FinishOption[],
};

/**
 * Diamonds Design is a premium quilted stitching upgrade applied to the chosen
 * upholstery colour — not a colour of its own, and it is charged as an extra.
 */
export const upholsteryStitching = {
  id: "diamonds",
  label: "Diamonds Design stitching",
  image: "/images/materials/upholstery-diamonds.png",
  note: "Premium",
  description:
    "Quilted diamond stitching applied to your selected upholstery colour.",
  price: "on-request" as const,
};

export const modelOptions: Record<ModelKey, ModelConfiguration> = {
  "34": {
    name: "Kumbra 34",
    spec: "10.40 m · 14 guests · up to 700 hp",
    basePrice: null,
    engines: [
      { id: "34-mercury-250", label: "2 × Mercury V8 250 hp", family: "Mercury", propulsion: "Outboard", price: null },
      { id: "34-mercury-300", label: "2 × Mercury V8 300 hp", family: "Mercury", propulsion: "Outboard", price: null },
      { id: "34-mercury-350", label: "2 × Mercury V10 350 hp", family: "Mercury", propulsion: "Outboard", price: null },
      { id: "34-volvo-280", label: "2 × Volvo Penta V8 280 hp", family: "Volvo", propulsion: "Inboard", price: null },
      { id: "34-volvo-300", label: "2 × Volvo Penta V8 300 hp", family: "Volvo", propulsion: "Inboard", price: null },
      { id: "34-volvo-320", label: "2 × Volvo Penta V8 320 hp", family: "Volvo", propulsion: "Inboard", price: null },
    ],
    images: {
      white: "/images/config/kumbra-34-white.png",
      telegrey: "/images/config/kumbra-34-telegrey.png",
      "sportive-grey": "/images/config/kumbra-34-sportive-grey.png",
      antracite: "/images/config/kumbra-34-antracite.png",
      "elegant-blue": "/images/config/kumbra-34-elegant-blue.png",
    },
    includedEquipment: standardEquipment34,
    equipment: [...model34Only, ...shared34and36],
  },
  "36": {
    name: "Kumbra 36",
    spec: "10.90 m · 14 guests · up to 800 hp",
    basePrice: null,
    engines: [
      { id: "36-mercury-300", label: "2 × Mercury V8 300 hp", family: "Mercury", propulsion: "Outboard", price: null },
      { id: "36-mercury-350", label: "2 × Mercury V10 350 hp", family: "Mercury", propulsion: "Outboard", price: null },
      { id: "36-mercury-400", label: "2 × Mercury V10 400 hp", family: "Mercury", propulsion: "Outboard", price: null },
      { id: "36-volvo-280", label: "2 × Volvo V8 280 hp", family: "Volvo", propulsion: "Inboard", price: null },
      { id: "36-volvo-300", label: "2 × Volvo V8 300 hp", family: "Volvo", propulsion: "Inboard", price: null },
      { id: "36-volvo-350", label: "2 × Volvo V8 350 hp", family: "Volvo", propulsion: "Inboard", price: null },
    ],
    images: {
      white: "/images/config/kumbra-36-white.png",
      telegrey: "/images/config/kumbra-36-telegrey.png",
      "sportive-grey": "/images/config/kumbra-36-sportive-grey.png",
      antracite: "/images/config/kumbra-36-antracite.png",
      "elegant-blue": "/images/config/kumbra-36-elegant-blue.png",
    },
    includedEquipment: standardEquipment36,
    equipment: [...model36Only, ...shared34and36],
  },
  "43": {
    name: "Kumbra 43",
    spec: "13.35 m · 14 guests · up to 1,200 hp",
    basePrice: null,
    engines: [
      { id: "43-hidden-mercury-300", label: "3 × Mercury V8 300 hp — hidden outboard", family: "Mercury", propulsion: "Hidden outboard", price: null },
      { id: "43-hidden-mercury-350", label: "3 × Mercury V10 350 hp — hidden outboard", family: "Mercury", propulsion: "Hidden outboard", price: null },
      { id: "43-hidden-mercury-400", label: "3 × Mercury V10 400 hp — hidden outboard", family: "Mercury", propulsion: "Hidden outboard", price: null },
      { id: "43-mercury-300", label: "3 × Mercury V8 300 hp", family: "Mercury", propulsion: "Outboard", price: null },
      { id: "43-mercury-350", label: "3 × Mercury V10 350 hp", family: "Mercury", propulsion: "Outboard", price: null },
      { id: "43-mercury-400", label: "3 × Mercury V10 400 hp", family: "Mercury", propulsion: "Outboard", price: null },
      { id: "43-mercury-600", label: "2 × Mercury V12 600 hp", family: "Mercury", propulsion: "Outboard", price: null },
      { id: "43-volvo-d6-380-shafts", label: "2 × Volvo Penta D6 380 hp — shafts", family: "Volvo", propulsion: "Shafts", price: null },
      { id: "43-volvo-d6-440-shafts", label: "2 × Volvo Penta D6 440 hp — shafts", family: "Volvo", propulsion: "Shafts", price: null },
      { id: "43-yanmar-400-shafts", label: "2 × Yanmar 6LY400 — shafts", family: "Yanmar", propulsion: "Shafts", price: null },
      { id: "43-yanmar-440-shafts", label: "2 × Yanmar 6LY440 — shafts", family: "Yanmar", propulsion: "Shafts", price: null },
      { id: "43-volvo-v8-430", label: "2 × Volvo Penta V8 DPS 430 hp", family: "Volvo", propulsion: "Inboard", price: null },
      { id: "43-volvo-d6-380", label: "2 × Volvo Penta D6 380 hp", family: "Volvo", propulsion: "Inboard", price: null },
      { id: "43-volvo-d6-440", label: "2 × Volvo Penta D6 440 hp", family: "Volvo", propulsion: "Inboard", price: null },
    ],
    images: {
      white: "/images/config/kumbra-43-white.png",
      telegrey: "/images/config/kumbra-43-telegrey.png",
      "sportive-grey": "/images/config/kumbra-43-sportive-grey.png",
      antracite: "/images/config/kumbra-43-antracite.png",
      "elegant-blue": "/images/config/kumbra-43-elegant-blue.png",
    },
    includedEquipment: standardEquipment43,
    equipment: model43Equipment,
  },
};

export const finishLabels: Record<keyof typeof finishOptions, string> = {
  gelcoat: "Gelcoat",
  vinyl: "Vinyl lines",
  upholstery: "Upholstery",
  furniture: "Furniture",
  flooring: "Flooring",
  countertop: "Countertops",
  teak: "Teak",
};

const gelcoatKeys: GelcoatKey[] = [
  "white",
  "telegrey",
  "sportive-grey",
  "antracite",
  "elegant-blue",
];

/** Every gelcoat has its own render, so this just validates the id. */
export function visualColour(gelcoat: string): GelcoatKey {
  return gelcoatKeys.includes(gelcoat as GelcoatKey)
    ? (gelcoat as GelcoatKey)
    : "white";
}

export type ModelKey = "34" | "36" | "43";

export type FinishOption = {
  id: string;
  label: string;
  tone: string;
  note?: string;
};

export type EngineOption = {
  id: string;
  label: string;
  family: "Mercury" | "Volvo" | "Yanmar";
  propulsion: "Hidden outboard" | "Outboard" | "Inboard" | "Shafts";
  price: number;
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

type ModelConfiguration = {
  name: string;
  spec: string;
  basePrice: number;
  images: Record<"white" | "blue" | "antracite", string>;
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
  equipment("antifouling", "Finishes", "Antifouling and anti-osmosis", 3200),
  equipment(
    "full-colour-change",
    "Finishes",
    "Colour change of hull, deck and hardtop",
    12800,
  ),
  equipment("hull-colour-change", "Finishes", "Hull colour change", 8500),
  equipment(
    "upholstery-colour-change",
    "Finishes",
    "Upholstery colour change",
    1300,
  ),
  equipment(
    "teak-line-colour-change",
    "Finishes",
    "Teak and vinyl-line colour change",
    1600,
  ),
  equipment(
    "joinery-colour-change",
    "Finishes",
    "Interior joinery colour change",
    1900,
  ),
  equipment("autopilot", "Navigation & electronics", "Autopilot integrated in display", 6800),
  equipment(
    "vhf",
    "Navigation & electronics",
    "VHF radio and antenna",
    2200,
    { condition: "Mandatory in some navigation areas; your advisor will confirm." },
  ),
  equipment("chain-counter", "Navigation & electronics", "Chain counter", 1200),
  equipment(
    "zipwake",
    "Navigation & electronics",
    "ZipWake Dynamic Trim System 450S",
    5300,
  ),
  equipment("radar", "Navigation & electronics", "Radar antenna", 3400),
  equipment("ais", "Navigation & electronics", "AIS", 1600),
  equipment(
    "nav-simrad-9-pair",
    "Navigation & electronics",
    "2 × Simrad 9″ navigation displays",
    2000,
    {
      exclusiveGroup: "navigation-display",
      condition: "Replaces the standard Simrad 12″ display.",
    },
  ),
  equipment(
    "nav-ultrawide",
    "Navigation & electronics",
    "NSX Ultrawide panoramic display",
    3200,
    { exclusiveGroup: "navigation-display" },
  ),
  equipment(
    "nav-simrad-12-second",
    "Navigation & electronics",
    "Second Simrad 12″ navigation display",
    4000,
    { exclusiveGroup: "navigation-display" },
  ),
  equipment("interior-fridge", "Electrical", "Interior fridge/freezer 41L", 1950),
  equipment("outdoor-freezer", "Electrical", "Outdoor freezer", 1900),
  equipment("lithium-6kwh", "Electrical", "Lithium battery pack 12V 6kWh", 15000),
  equipment(
    "generator-3-5",
    "Electrical",
    "Generator 3.5kW",
    15900,
    {
      exclusiveGroup: "power-supply",
      unavailableWithPropulsion: ["Inboard"],
      condition: "Not compatible with inboard engines.",
    },
  ),
  equipment(
    "inverter",
    "Electrical",
    "12V to 220V inverter with extra battery",
    6500,
    { exclusiveGroup: "power-supply" },
  ),
  equipment("solar-hardtop", "Electrical", "Solar panel on hardtop", 1450),
  equipment("water-heater", "Electrical", "220V water heater 15L", 1600),
  equipment(
    "stern-220v-socket",
    "Electrical",
    "220V socket in stern sunbed locker",
    550,
  ),
  equipment("underwater-led", "Electrical", "Underwater LED lights", 2200),
  equipment("hardtop-led", "Electrical", "LED lights on hardtop", 1500),
  equipment("deck-led", "Electrical", "LED lights on deck", 1800),
  equipment(
    "hydraulic-balconies",
    "Deck",
    "Hydraulic side balconies",
    49000,
    {
      condition: "Stern cabin is not included and build time increases by 4 weeks.",
    },
  ),
  equipment("fenders", "Deck", "6 × Kumbra Yachts fenders", 1100),
  equipment("stern-doors", "Deck", "Stern doors", 1950),
  equipment("stainless-chain", "Deck", "Stainless steel chain", 1200),
  equipment("extra-cleats", "Deck", "2 extra retractable cleats", 1200),
  equipment(
    "premium-synthetic-teak",
    "Deck",
    "Premium synthetic teak with exclusive design",
    2100,
    { exclusiveGroup: "deck-finish" },
  ),
  equipment("natural-teak", "Deck", "Natural teak", 8000, {
    exclusiveGroup: "deck-finish",
  }),
  equipment("teak-gunwale", "Deck", "Teak on gunwale", 2000),
  equipment("bow-shower", "Deck", "Bow shower (fresh water)", 900),
  equipment("waterski-hitch", "Deck", "Wakeboard / water-ski hitch", 3200),
  equipment("safety-equipment", "Deck", "Safety equipment — navigation area 5", 1200),
  equipment(
    "wetbar-igloo",
    "Wetbar & table",
    "Igloo pouffe integrated in wetbar",
    2500,
    { exclusiveGroup: "wetbar-layout" },
  ),
  equipment(
    "wetbar-gas-stove",
    "Wetbar & table",
    "2-burner gas stove",
    1600,
    { exclusiveGroup: "wetbar-layout" },
  ),
  equipment(
    "wetbar-electric-grill",
    "Wetbar & table",
    "Electric grill",
    1500,
    {
      exclusiveGroup: "wetbar-layout",
      condition: "Requires a generator or inverter.",
      requiresAny: ["generator-3-5", "inverter"],
    },
  ),
  equipment(
    "wetbar-dry-cooler",
    "Wetbar & table",
    "Dry cooler / built-in ice bucket",
    1300,
    { exclusiveGroup: "wetbar-layout" },
  ),
  equipment(
    "table-sunbed",
    "Wetbar & table",
    "Deck table convertible to sunbed + cushion",
    1200,
    { exclusiveGroup: "deck-table" },
  ),
  equipment(
    "table-electric-sunbed",
    "Wetbar & table",
    "Electric-pedestal deck table convertible to sunbed + cushion",
    3400,
    { exclusiveGroup: "deck-table" },
  ),
  equipment("stern-bimini-carbon", "Biminis & covers", "Stern sunbed bimini with carbon poles", 3100),
  equipment("stern-side-bimini", "Biminis & covers", "Side bimini at stern", 850),
  equipment("stern-bimini-electric", "Biminis & covers", "Electric stern sunbed bimini", 14500),
  equipment("bow-bimini-carbon", "Biminis & covers", "Bow sunbed bimini with carbon poles", 3250),
  equipment("full-windbreak-cover", "Biminis & covers", "Full windbreak and helm console cover", 1200),
  equipment("helm-console-cover", "Biminis & covers", "Helm console cover", 750),
  equipment("helm-wetbar-cover", "Biminis & covers", "Helm seats and wetbar cover", 1400),
  equipment("stern-furniture-cover", "Biminis & covers", "Table, sofas and stern sunbed cover", 1900),
  equipment("bow-sunbed-cover", "Biminis & covers", "Bow sunbed cover", 1400),
  equipment("ac-bow", "Interior", "Air conditioning in bow", 8200, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("ac-bow-stern", "Interior", "Air conditioning in bow and stern", 9500, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("ac-bow-12v", "Interior", "Air conditioning in bow 12V", 8600, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("stern-curtains", "Interior", "Divider curtains in stern cabin", 1400),
  equipment("stern-mattress", "Interior", "Extra mattress for stern cabin", 1900),
  equipment("linen-kit", "Interior", "Sheet set, bedspreads and pillow kit", 990),
  equipment("towel-kit", "Interior", "Towel kit", 400),
  equipment("interior-shower", "Interior", "Interior shower", 1100),
  equipment("oven-microwave", "Interior", "Oven / microwave", 990),
  equipment(
    "premium-upholstery",
    "Upgrades",
    "Premium upholstery package",
    2300,
    {
      condition:
        "Includes diamond design, bow sunbed curve and armrests, anchor-locker cushion and dining-area side backrests.",
    },
  ),
  equipment(
    "premium-carpentry",
    "Upgrades",
    "Premium carpentry package",
    6900,
    {
      condition:
        "Includes upgraded bed sides, bulkhead, nightstand, stern floor, engraved Corian stairs and teak bathroom floor.",
    },
  ),
  equipment("transport-wrap", "Transport", "Shrink-wrapping for transport", 3100),
  equipment("transport-cradle", "Transport", "Transport cradle", "on-request"),
];

const model34Only: EquipmentOption[] = [
  equipment(
    "mercury-joystick",
    "Control & manoeuvring",
    "Mercury Marine Joystick Piloting System",
    23500,
    { engineFamily: "Mercury", exclusiveGroup: "joystick" },
  ),
  equipment(
    "volvo-joystick",
    "Control & manoeuvring",
    "Volvo Penta Motors Joystick",
    19000,
    { engineFamily: "Volvo", exclusiveGroup: "joystick" },
  ),
  equipment("bow-thruster", "Control & manoeuvring", "Bow thruster", 6500),
  equipment("hardtop", "Deck", "Hardtop", 14900),
  equipment("premium-helm-seats", "Deck", "Premium helm seats", 1200),
  equipment("premium-wheel", "Deck", "Premium Gussi Italia steering wheel", 450),
  equipment("stern-backrest", "Deck", "Folding stern sunbed backrest", 1250),
  equipment("windshield-wiper", "Deck", "Windshield glass with wiper", 4300),
  equipment(
    "transparent-windshield-cover",
    "Biminis & covers",
    "Transparent cover between windshield and hardtop",
    1100,
  ),
  equipment(
    "premium-audio",
    "Upgrades",
    "Fusion Premium audio — 6 Pro speakers + subwoofer",
    4600,
  ),
];

const model36Only: EquipmentOption[] = [
  equipment(
    "mercury-joystick",
    "Control & manoeuvring",
    "Mercury Marine Joystick Piloting System",
    23500,
    { engineFamily: "Mercury", exclusiveGroup: "joystick" },
  ),
  equipment(
    "volvo-joystick",
    "Control & manoeuvring",
    "Volvo Penta Motors Joystick",
    19000,
    { engineFamily: "Volvo", exclusiveGroup: "joystick" },
  ),
  equipment("bow-thruster", "Control & manoeuvring", "Bow thruster", 6500),
  equipment(
    "hardtop-special",
    "Deck",
    "Special Edition hardtop enclosed and anchored to gunwales",
    24000,
  ),
  equipment("windshield-wiper", "Deck", "Windshield glass with wiper", 4300),
  equipment("led-tv", "Interior", "LED TV", 2000),
  equipment(
    "premium-audio",
    "Upgrades",
    "Fusion Premium audio — 6 speakers + amplifier",
    4600,
  ),
];

const model43Equipment: EquipmentOption[] = [
  equipment(
    "mercury-joystick",
    "Control & manoeuvring",
    "Mercury Marine Joystick Piloting System",
    24500,
    { engineFamily: "Mercury", exclusiveGroup: "joystick" },
  ),
  equipment(
    "volvo-joystick",
    "Control & manoeuvring",
    "Volvo Penta Motors Joystick",
    23900,
    { engineFamily: "Volvo", exclusiveGroup: "joystick" },
  ),
  equipment("bow-thruster", "Control & manoeuvring", "Bow thruster", 7200, {
    exclusiveGroup: "thrusters",
  }),
  equipment(
    "bow-stern-thruster",
    "Control & manoeuvring",
    "Bow thruster + stern thruster",
    12800,
    { exclusiveGroup: "thrusters" },
  ),
  equipment("antifouling", "Finishes", "Antifouling, anti-osmosis and epoxy treatment", 4100),
  equipment("full-colour-change", "Finishes", "Colour change of hull, deck and hardtop", 16500),
  equipment("hull-colour-change", "Finishes", "Hull colour change", 9900),
  equipment("waterline-lines", "Finishes", "Acrylic-painted waterline lines", 3900, {
    condition: "Colour is selected with your advisor.",
  }),
  equipment("upholstery-colour-change", "Finishes", "Upholstery colour change", 1300),
  equipment("teak-line-colour-change", "Finishes", "Teak and vinyl-line colour change", 1600),
  equipment("joinery-colour-change", "Finishes", "Interior joinery colour change", 1900),
  equipment("autopilot", "Navigation & electronics", "Autopilot integrated in display", 6800),
  equipment("vhf", "Navigation & electronics", "VHF radio and antenna", 2200, {
    condition: "Mandatory in some navigation areas; your advisor will confirm.",
  }),
  equipment("chain-counter", "Navigation & electronics", "Chain counter", 1300),
  equipment("zipwake", "Navigation & electronics", "ZipWake Dynamic Trim System 450S", 5800),
  equipment("radar", "Navigation & electronics", "Radar antenna", 3400),
  equipment("ais", "Navigation & electronics", "AIS", 1600),
  equipment("nav-simrad-16", "Navigation & electronics", "Simrad 16″ navigation display", 1900, {
    exclusiveGroup: "navigation-display",
    condition: "Replaces the standard 12″ display.",
  }),
  equipment("nav-ultrawide-15", "Navigation & electronics", "NSX Ultrawide 15″ panoramic display", 5200, {
    exclusiveGroup: "navigation-display",
    condition: "Replaces the standard 12″ display.",
  }),
  equipment("nav-simrad-12-second", "Navigation & electronics", "Second Simrad 12″ navigation display", 4500, {
    exclusiveGroup: "navigation-display",
  }),
  equipment("nav-simrad-16-pair", "Navigation & electronics", "2 × Simrad 16″ navigation displays", 6400, {
    exclusiveGroup: "navigation-display",
    condition: "The standard 12″ display is not included.",
  }),
  equipment("lithium-6kwh", "Electrical", "Lithium battery pack 12V 6kWh", 16500),
  equipment("generator-3-5", "Electrical", "Generator 3.5kW", 18900, {
    exclusiveGroup: "power-supply",
  }),
  equipment("generator-6", "Electrical", "Generator 6kW", 23500, {
    exclusiveGroup: "power-supply",
  }),
  equipment("inverter", "Electrical", "12V to 220V inverter with extra battery", 7900, {
    exclusiveGroup: "power-supply",
  }),
  equipment("solar-hardtop", "Electrical", "Solar panel on hardtop", 2500),
  equipment("water-heater", "Electrical", "220V water heater 25L", 2100),
  equipment("wireless-charger", "Electrical", "Wireless charger in helm console", 550),
  equipment("stern-220v-socket", "Electrical", "220V socket in stern sunbed locker", 550),
  equipment("underwater-led", "Electrical", "Underwater LED lights", 2200),
  equipment("hardtop-led", "Electrical", "LED lights on hardtop", 1900),
  equipment("deck-led", "Electrical", "LED lights on deck", 2100),
  equipment("hardtop", "Deck", "Hardtop", 16900),
  equipment("premium-helm-seats", "Deck", "Premium sporty helm-seat upholstery", 1200),
  equipment("enclosed-windshield", "Deck", "Enclosed windshield glass", 4600),
  equipment("windshield-wiper", "Deck", "Windshield glass with wiper", 2300),
  equipment("fenders", "Deck", "8 custom fenders + 4 mooring lines", 1900),
  equipment("removable-bow-table", "Deck", "Removable bow table", 4500),
  equipment("stern-doors", "Deck", "Stern doors", 1950),
  equipment("stainless-chain", "Deck", "Stainless steel chain", 1200),
  equipment("extra-cleats", "Deck", "2 extra retractable cleats", 1200),
  equipment("premium-synthetic-teak", "Deck", "Premium synthetic teak with exclusive design", 2800, {
    exclusiveGroup: "deck-finish",
  }),
  equipment("natural-teak", "Deck", "Natural teak", 13500, {
    exclusiveGroup: "deck-finish",
  }),
  equipment("teak-gunwale", "Deck", "Teak on gunwale", 2500),
  equipment("bow-shower", "Deck", "Bow shower (fresh water)", 900),
  equipment("waterski-hook", "Deck", "Stainless-steel wakeboard / water-ski hook and pole", 3200),
  equipment("safety-equipment", "Deck", "Safety equipment — navigation area 5", 1200),
  equipment("wetbar-igloo", "Wetbar & table", "Igloo pouffe with double bench and cushion", 5900),
  equipment("second-outdoor-fridge", "Wetbar & table", "Second outdoor fridge 85L", 3100),
  equipment("outdoor-freezer", "Wetbar & table", "Outdoor freezer", 1900),
  equipment("wetbar-coffee", "Wetbar & table", "Lift-system coffee machine in wetbar", 2850),
  equipment("wetbar-tv", "Wetbar & table", "LED TV in wetbar", null, {
    condition: "Price and installation are confirmed on request.",
  }),
  equipment("wetbar-gas-barbecue", "Wetbar & table", "Gas barbecue stove", 1600, {
    exclusiveGroup: "wetbar-layout",
  }),
  equipment("wetbar-teppanyaki", "Wetbar & table", "TeppanYaki", 1550, {
    exclusiveGroup: "wetbar-layout",
    condition: "Requires a generator or inverter.",
    requiresAny: ["generator-3-5", "generator-6", "inverter"],
  }),
  equipment("wetbar-electric-grill", "Wetbar & table", "Electric grill", 1500, {
    exclusiveGroup: "wetbar-layout",
    condition: "Requires a generator or inverter.",
    requiresAny: ["generator-3-5", "generator-6", "inverter"],
  }),
  equipment("wetbar-dry-cooler", "Wetbar & table", "Dry cooler / built-in ice bucket", 1300, {
    exclusiveGroup: "wetbar-layout",
  }),
  equipment("table-sunbed-pair", "Wetbar & table", "2 retractable deck tables convertible to sunbed + cushions", 3900, {
    exclusiveGroup: "deck-table",
    condition: "Replaces the standard fixed XL table.",
  }),
  equipment("table-electric-sunbed-pair", "Wetbar & table", "2 electric-pedestal tables convertible to sunbed + cushions", 6900, {
    exclusiveGroup: "deck-table",
    condition: "Replaces the standard fixed XL table.",
  }),
  equipment("stern-bimini-carbon", "Biminis & covers", "Stern sunbed bimini with carbon poles", 3800),
  equipment("stern-side-bimini", "Biminis & covers", "Side bimini at stern", 950),
  equipment("stern-bimini-electric", "Biminis & covers", "Electric stern sunbed bimini", 14900),
  equipment("bow-bimini-carbon", "Biminis & covers", "Bow sunbed bimini with carbon poles", 3950),
  equipment("bow-side-bimini", "Biminis & covers", "Side bimini at bow", 950),
  equipment("full-windshield-cover", "Biminis & covers", "Full windshield and helm console cover", 1500),
  equipment("helm-console-cover", "Biminis & covers", "Helm console cover", 900),
  equipment("helm-wetbar-cover", "Biminis & covers", "Helm seats and wetbar cover", 1750),
  equipment("stern-furniture-cover", "Biminis & covers", "Table, sofas and stern sunbed cover", 2100),
  equipment("bow-sunbed-cover", "Biminis & covers", "Bow sunbed cover", 1750),
  equipment("transparent-windshield-cover", "Biminis & covers", "Transparent cover between windshield and hardtop", 1200),
  equipment("ac-bow", "Interior", "Air conditioning in bow — 16,000 BTU", 11500, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("ac-bow-stern", "Interior", "Air conditioning in bow and stern — 16,000 BTU", 12800, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("ac-12v", "Interior", "Air conditioning 12V — 16,000 BTU", 10600, {
    exclusiveGroup: "air-conditioning",
  }),
  equipment("interior-fridge", "Interior", "Interior fridge/freezer", 2000),
  equipment("interior-coffee", "Interior", "Lift-system coffee machine in main unit", 2900),
  equipment("oven-microwave", "Interior", "Oven / microwave", 1100),
  equipment("tv-bow", "Interior", "LED TV — bow cabin", 2350),
  equipment("tv-guest", "Interior", "LED TV — guest cabin", 2350),
  equipment("linen-kit", "Interior", "Sheet set, bedspreads and pillow kit", 2800),
  equipment("towel-kit", "Interior", "Towel kit", 800),
  equipment("bathroom-accessories", "Interior", "Premium bathroom accessories", 1400),
  equipment("stairs-railing", "Interior", "Interior access-stairs railing", 2100),
  equipment("interior-curtains", "Interior", "Interior curtains", 2250),
  equipment("cabin-bulkhead", "Interior", "Dividing bulkhead and door between cabins", 3800),
  equipment("equipped-stern-cabin", "Interior", "Fully equipped stern cabin with two queen beds", 8900),
  equipment("premium-upholstery", "Upgrades", "Premium upholstery package", 3900, {
    condition: "Includes the custom-design seating details listed in the official price sheet.",
  }),
  equipment("premium-carpentry", "Upgrades", "Premium carpentry package", 7900, {
    condition: "Includes upgraded bathroom, cabin, Corian and relief-panel finishes.",
  }),
  equipment("premium-audio", "Upgrades", "Fusion Premium audio — 8 premium speakers + subwoofer", 5900),
  equipment("hydraulic-balconies", "Upgrades", "Hydraulic side balconies with teak inserts", 52500),
  equipment("hydraulic-platform", "Upgrades", "Hydraulic bathing platform with integrated ladder", 45900),
  equipment("seakeeper-4", "Upgrades", "Seakeeper 4 12V", 52900, {
    unavailableWithPropulsion: ["Shafts"],
    condition: "Not compatible with shaft motorisation.",
  }),
  equipment("transport-wrap", "Transport", "Shrink-wrapping for transport", 3500),
  equipment("transport-cradle", "Transport", "Transport cradle", "on-request"),
];

export const finishOptions = {
  gelcoat: [
    { id: "white", label: "White", tone: "#eceee9", note: "Standard" },
    { id: "telegrey", label: "Telegrey", tone: "#c7c7c0" },
    { id: "sportive-grey", label: "Sportive Grey", tone: "#626b68" },
    { id: "antracite", label: "Antracite", tone: "#263638" },
    { id: "elegant-blue", label: "Elegant Blue", tone: "#1595ca" },
  ] satisfies FinishOption[],
  vinyl: [
    { id: "black", label: "Black", tone: "#101010" },
    { id: "white", label: "White", tone: "#eef4f2", note: "Standard" },
  ] satisfies FinishOption[],
  upholstery: [
    { id: "grey", label: "Grey", tone: "#777a77", note: "Standard" },
    { id: "white", label: "White", tone: "#dedbd3" },
    { id: "fossil", label: "Fossil", tone: "#aaa7a4" },
    { id: "october", label: "October", tone: "#ad2d1f" },
    { id: "cayenne", label: "Cayenne", tone: "#b1132a" },
    { id: "submarine", label: "Submarine", tone: "#435a61" },
    { id: "storm", label: "Storm", tone: "#5d6264" },
    {
      id: "diamonds",
      label: "Diamonds Design",
      tone: "linear-gradient(135deg, #aaa 25%, #d1d1d1 25% 50%, #999 50% 75%, #c7c7c7 75%)",
      note: "Premium",
    },
  ] satisfies FinishOption[],
  furniture: [
    { id: "wenge", label: "Wenge", tone: "#6d635c", note: "Standard" },
    { id: "multiplis-nature", label: "Multiplis Nature", tone: "#817b72" },
    { id: "pin-iceberg", label: "Pin Iceberg", tone: "#d8d6cf" },
    { id: "chene-topia", label: "Chene Topia", tone: "#6c5945" },
  ] satisfies FinishOption[],
  flooring: [
    { id: "chene-topia", label: "Chene Topia", tone: "#6c5945", note: "Standard" },
    { id: "wenge", label: "Wenge", tone: "#6d635c" },
    { id: "multiplis-nature", label: "Multiplis Nature", tone: "#817b72" },
    { id: "pin-iceberg", label: "Pin Iceberg", tone: "#d8d6cf" },
  ] satisfies FinishOption[],
  countertop: [
    { id: "multiplis-nature", label: "Multiplis Nature", tone: "#dce2e3", note: "Standard" },
    { id: "carbon-concrete", label: "Carbon concrete", tone: "#242829" },
  ] satisfies FinishOption[],
  teak: [
    { id: "bleached", label: "Bleached", tone: "#c79d63", note: "Standard" },
    { id: "scrubbed", label: "Scrubbed", tone: "#c3914c" },
    { id: "weathered", label: "Weathered", tone: "#756f63" },
    { id: "biscuit", label: "Biscuit", tone: "#b59b76", note: "Premium" },
    { id: "platinum", label: "Platinum", tone: "#c9c5b8", note: "Premium" },
    { id: "blanc-des-blancs", label: "Blanc des Blancs", tone: "#ebe8dc", note: "Premium" },
    { id: "natural-teak", label: "Natural teak", tone: "#9f692b", note: "Natural" },
  ] satisfies FinishOption[],
};

export const modelOptions: Record<ModelKey, ModelConfiguration> = {
  "34": {
    name: "Kumbra 34",
    spec: "10.40 m · 14 guests · up to 700 hp",
    basePrice: 240000,
    engines: [
      { id: "34-mercury-250", label: "2 × Mercury V8 250 hp", family: "Mercury", propulsion: "Outboard", price: 64500 },
      { id: "34-mercury-300", label: "2 × Mercury V8 300 hp", family: "Mercury", propulsion: "Outboard", price: 69900 },
      { id: "34-mercury-350", label: "2 × Mercury V10 350 hp", family: "Mercury", propulsion: "Outboard", price: 84900 },
      { id: "34-volvo-280", label: "2 × Volvo Penta V8 280 hp", family: "Volvo", propulsion: "Inboard", price: 85000 },
      { id: "34-volvo-300", label: "2 × Volvo Penta V8 300 hp", family: "Volvo", propulsion: "Inboard", price: 89900 },
      { id: "34-volvo-320", label: "2 × Volvo Penta V8 320 hp", family: "Volvo", propulsion: "Inboard", price: 94500 },
    ],
    images: {
      white: "/images/kumbra-34-config-white-clean-i39J1gHM.png",
      blue: "/images/kumbra-34-config-blue-clean-D80Jclvr.png",
      antracite: "/images/kumbra-34-config-antracite-clean-iuKJbUEt.png",
    },
    includedEquipment: standardEquipment34,
    equipment: [...model34Only, ...shared34and36],
  },
  "36": {
    name: "Kumbra 36",
    spec: "10.90 m · 14 guests · up to 800 hp",
    basePrice: 260000,
    engines: [
      { id: "36-mercury-300", label: "2 × Mercury V8 300 hp", family: "Mercury", propulsion: "Outboard", price: 69900 },
      { id: "36-mercury-350", label: "2 × Mercury V10 350 hp", family: "Mercury", propulsion: "Outboard", price: 84900 },
      { id: "36-mercury-400", label: "2 × Mercury V10 400 hp", family: "Mercury", propulsion: "Outboard", price: 95000 },
      { id: "36-volvo-280", label: "2 × Volvo V8 280 hp", family: "Volvo", propulsion: "Inboard", price: 85000 },
      { id: "36-volvo-300", label: "2 × Volvo V8 300 hp", family: "Volvo", propulsion: "Inboard", price: 89900 },
      { id: "36-volvo-350", label: "2 × Volvo V8 350 hp", family: "Volvo", propulsion: "Inboard", price: 110900 },
    ],
    images: {
      white: "/images/k36-white-MY7-V9YH.png",
      blue: "/images/k36-blue-B5XScDbO.png",
      antracite: "/images/k36-antracite-DKZ8lkbi.png",
    },
    includedEquipment: standardEquipment36,
    equipment: [...model36Only, ...shared34and36],
  },
  "43": {
    name: "Kumbra 43",
    spec: "13.35 m · 14 guests · up to 1,200 hp",
    basePrice: 435000,
    engines: [
      { id: "43-hidden-mercury-300", label: "3 × Mercury V8 300 hp — hidden outboard", family: "Mercury", propulsion: "Hidden outboard", price: 110900 },
      { id: "43-hidden-mercury-350", label: "3 × Mercury V10 350 hp — hidden outboard", family: "Mercury", propulsion: "Hidden outboard", price: 124000 },
      { id: "43-hidden-mercury-400", label: "3 × Mercury V10 400 hp — hidden outboard", family: "Mercury", propulsion: "Hidden outboard", price: 143000 },
      { id: "43-mercury-300", label: "3 × Mercury V8 300 hp", family: "Mercury", propulsion: "Outboard", price: 102000 },
      { id: "43-mercury-350", label: "3 × Mercury V10 350 hp", family: "Mercury", propulsion: "Outboard", price: 119000 },
      { id: "43-mercury-400", label: "3 × Mercury V10 400 hp", family: "Mercury", propulsion: "Outboard", price: 137000 },
      { id: "43-mercury-600", label: "2 × Mercury V12 600 hp", family: "Mercury", propulsion: "Outboard", price: 178000 },
      { id: "43-volvo-d6-380-shafts", label: "2 × Volvo Penta D6 380 hp — shafts", family: "Volvo", propulsion: "Shafts", price: 128900 },
      { id: "43-volvo-d6-440-shafts", label: "2 × Volvo Penta D6 440 hp — shafts", family: "Volvo", propulsion: "Shafts", price: 144900 },
      { id: "43-yanmar-400-shafts", label: "2 × Yanmar 6LY400 — shafts", family: "Yanmar", propulsion: "Shafts", price: 128900 },
      { id: "43-yanmar-440-shafts", label: "2 × Yanmar 6LY440 — shafts", family: "Yanmar", propulsion: "Shafts", price: 134900 },
      { id: "43-volvo-v8-430", label: "2 × Volvo Penta V8 DPS 430 hp", family: "Volvo", propulsion: "Inboard", price: 107900 },
      { id: "43-volvo-d6-380", label: "2 × Volvo Penta D6 380 hp", family: "Volvo", propulsion: "Inboard", price: 167900 },
      { id: "43-volvo-d6-440", label: "2 × Volvo Penta D6 440 hp", family: "Volvo", propulsion: "Inboard", price: 203900 },
    ],
    images: {
      white: "/images/k43-white-BYl-9VSX.png",
      blue: "/images/k43-blue-CYylCqls.png",
      antracite: "/images/k43-antracite-D4h5PNjW.png",
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

export function visualColour(gelcoat: string): "white" | "blue" | "antracite" {
  if (gelcoat === "elegant-blue") return "blue";
  if (gelcoat === "antracite" || gelcoat === "sportive-grey") return "antracite";
  return "white";
}

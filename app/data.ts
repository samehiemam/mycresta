export type BoatFeature = {
  title: string;
  description: string;
};

export type BoatSpec = {
  label: string;
  value: string;
};

export type BoatLayout = {
  title: string;
  description: string;
  image: string;
  alt: string;
};

export type BoatGalleryItem = {
  title: string;
  description: string;
  image: string;
  alt: string;
};

export type Boat = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  hero: string;
  profile: string;
  secondary: string;
  length: string;
  beam: string;
  capacity: string;
  power: string;
  speed: string;
  cabins: string;
  storyTitle: string;
  story: string;
  highlights: BoatFeature[];
  gallery: BoatGalleryItem[];
  interiorTitle: string;
  interiorIntro: string;
  interiorFeatures: BoatFeature[];
  performanceFeatures: BoatFeature[];
  dimensions: BoatSpec[];
  propulsion: BoatSpec[];
  onboard: BoatSpec[];
  layouts: BoatLayout[];
  layoutNote: string;
  catalogue: string;
  video?: string;
};

export const boats: Boat[] = [
  {
    slug: "kumbra-34",
    name: "Kumbra 34",
    eyebrow: "Agile walkaround dayboat",
    description:
      "A 10.40 m walkaround built for effortless Red Sea days, with wide passages, generous sunbeds and a versatile interior.",
    hero: "/images/kumbra-34-hero-DHX-GGeO.webp",
    profile: "/images/studio/kumbra-34-white.png",
    secondary: "/images/kumbra-34-aerial-new-DaqHQ-Er.jpg",
    length: "10.40 m",
    beam: "3.50 m",
    capacity: "14 guests",
    power: "700 hp",
    speed: "40 kn",
    cabins: "2 sleeping areas",
    storyTitle: "Big enjoyment, engineered into 10.40 metres.",
    story:
      "The Kumbra 34 combines safe walkaround circulation with open social spaces and a compact interior that changes with the day. High freeboards, a broad beam and quick planing give it a reassuring, responsive character for coastal cruising.",
    highlights: [
      {
        title: "All-day deck",
        description:
          "Outdoor spaces are arranged to make movement, conversation and relaxation feel natural from bow to stern.",
      },
      {
        title: "Safe walkaround",
        description:
          "Wide, high-sided passageways create secure access around the boat, including while underway.",
      },
      {
        title: "Flush swim platforms",
        description:
          "Generous stern platforms provide easy water access and a clear passage between the engines and aft sunbed.",
      },
      {
        title: "Twin sun zones",
        description:
          "Dedicated bow and stern sunbeds create two comfortable places to stretch out.",
      },
      {
        title: "Convertible dining",
        description:
          "U-shaped seating welcomes six to eight guests and converts into an additional relaxation area.",
      },
      {
        title: "Sustainable upholstery",
        description:
          "Heat-resistant, easy-care upholstery is selected for comfort, durability and lower environmental impact.",
      },
      {
        title: "Connected helm",
        description:
          "Modern navigation and onboard technology simplify control and make essential information easy to read.",
      },
      {
        title: "Integrated fender storage",
        description:
          "Six dedicated bow compartments keep fenders secured and the deck free of clutter.",
      },
    ],
    gallery: [
      {
        title: "Convertible social cockpit",
        description:
          "A symmetrical dining lounge turns the aft deck into an easy place to gather, eat and relax.",
        image: "/images/carousel/k34-social-dining.jpg",
        alt: "Kumbra 34 aft dining lounge overlooking turquoise water",
      },
      {
        title: "Safe walkaround",
        description:
          "Deep, wide side decks and high freeboards create a reassuring path from cockpit to bow.",
        image: "/images/carousel/k34-walkaround.jpg",
        alt: "Wide starboard walkaround passage on the Kumbra 34",
      },
      {
        title: "Waterside access",
        description:
          "Flush stern platforms frame the twin outboards and make swimming, boarding and tender access simple.",
        image: "/images/carousel/k34-swim-platform.jpg",
        alt: "Kumbra 34 aft sunbed, cockpit and twin outboard engines from above",
      },
      {
        title: "Bow sun lounge",
        description:
          "A generous forward sunbed creates a private relaxation zone with clear circulation on both sides.",
        image: "/images/carousel/k34-bow-sunbed.jpg",
        alt: "Kumbra 34 bow sunbed photographed from directly above",
      },
      {
        title: "Connected helm",
        description:
          "Three supportive seats, a clear windscreen and integrated navigation keep skipper and guests together.",
        image: "/images/carousel/k34-helm.jpg",
        alt: "Three helm seats and navigation console on the Kumbra 34",
      },
      {
        title: "Convertible main cabin",
        description:
          "The bright forward cabin balances a full double berth with storage and space to move.",
        image: "/images/carousel/k34-main-cabin.jpg",
        alt: "Kumbra 34 main cabin with double berth and light grey cabinetry",
      },
      {
        title: "Private bathroom",
        description:
          "A separate head with window, sink and storage supports longer days and comfortable overnight stays.",
        image: "/images/carousel/k34-bathroom.jpg",
        alt: "Kumbra 34 private bathroom with window, sink and storage",
      },
      {
        title: "Aft sleeping space",
        description:
          "Two generous single berths provide practical additional accommodation for family or guests.",
        image: "/images/carousel/k34-aft-berths.jpg",
        alt: "Twin aft berths in the Kumbra 34",
      },
    ],
    interiorTitle: "A compact interior that works harder.",
    interiorIntro:
      "Below deck, the forward double berth converts to a sofa while two generous single berths sit aft. A separate bathroom and connected onboard controls make longer days—and overnight stays—more comfortable.",
    interiorFeatures: [
      {
        title: "Convertible forward berth",
        description:
          "The main double berth transforms into a lounge, allowing the cabin to move easily between rest and social use.",
      },
      {
        title: "Two aft berths",
        description:
          "Two large single berths extend the practical sleeping accommodation for family or guests.",
      },
      {
        title: "Private bathroom",
        description:
          "A separate enclosed bathroom includes a sink, storage and the privacy expected on longer outings.",
      },
      {
        title: "Smart connectivity",
        description:
          "Integrated smart systems provide simple control of key onboard functions.",
      },
    ],
    performanceFeatures: [
      {
        title: "Confident proportions",
        description:
          "High freeboards and a 3.50 m beam create a secure feeling on deck.",
      },
      {
        title: "Quick to plane",
        description:
          "The hull is designed to rise efficiently and respond quickly to throttle.",
      },
      {
        title: "Stable underway",
        description:
          "The broad beam supports reassuring lateral stability at rest and in motion.",
      },
      {
        title: "Efficient cruising",
        description:
          "A 24-knot catalogue cruising speed balances range, comfort and fuel use.",
      },
    ],
    dimensions: [
      { label: "Overall length", value: "10.40 m" },
      { label: "Waterline length", value: "9.72 m" },
      { label: "Beam", value: "3.50 m" },
      { label: "Maximum height", value: "2.28 m" },
      { label: "Draft", value: "0.65 m" },
      { label: "Displacement", value: "6,000 kg" },
    ],
    propulsion: [
      { label: "Engines", value: "2" },
      { label: "Engine options", value: "Inboard or outboard" },
      { label: "Maximum power", value: "700 hp" },
      { label: "Minimum power", value: "500 hp" },
      { label: "Maximum speed", value: "40 kn" },
      { label: "Cruising speed", value: "24 kn" },
    ],
    onboard: [
      { label: "Fuel tank", value: "650 L" },
      { label: "Fresh-water tank", value: "170 L" },
      { label: "Black-water tank", value: "88 L" },
      { label: "Design category", value: "B" },
      { label: "Maximum capacity", value: "14 people" },
    ],
    layouts: [
      {
        title: "Deck view",
        description:
          "The clean top view shows the hardtop, twin sun zones, walkaround circulation and outboard stern.",
        image: "/images/layouts/kumbra-34-deck.png",
        alt: "Top view of the Kumbra 34 deck and hardtop",
      },
      {
        title: "Interior arrangement",
        description:
          "The transparent view reveals the forward double berth, aft single berths and separate bathroom.",
        image: "/images/layouts/kumbra-34-interior.png",
        alt: "Top view of the Kumbra 34 interior arrangement",
      },
    ],
    layoutNote:
      "These high-resolution manufacturer views show the outboard deck and below-deck accommodation separately for a clearer mobile experience.",
    catalogue: "/brochures/kumbra-34-catalogue.pdf",
  },
  {
    slug: "kumbra-36",
    name: "Kumbra 36",
    eyebrow: "New-generation hardtop",
    description:
      "More deck space, a stronger silhouette and an enclosed hardtop. Designed for long days, quick passages and year-round use.",
    hero: "/images/kumbra-36-hero-DXPqlWPG.jpg",
    profile: "/images/studio/kumbra-36-white.png",
    secondary: "/images/kumbra-36-sunset-CsK9PjdY.jpg",
    length: "10.90 m",
    beam: "3.50 m",
    capacity: "14 guests",
    power: "800 hp",
    speed: "42 kn",
    cabins: "2 sleeping areas",
    storyTitle: "The Kumbra dayboat, with more protection and presence.",
    story:
      "The Kumbra 36 develops the 34-foot platform with a longer, wider hardtop, an extended windscreen and more usable deck space. Its walkaround plan remains open and intuitive while the protected helm supports longer seasons on the water.",
    highlights: [
      {
        title: "More space for the day",
        description:
          "The enlarged deck gives guests more room to circulate, gather and relax without compromising the walkaround layout.",
      },
      {
        title: "New-generation walkaround",
        description:
          "Higher, wider side passages make bow-to-stern movement secure and comfortable.",
      },
      {
        title: "XL swim platform",
        description:
          "A broad, flush stern platform becomes a true waterside terrace with easy access around the propulsion.",
      },
      {
        title: "Hardtop skylight",
        description:
          "An opening hatch brings natural light and air into the protected helm and social zone.",
      },
      {
        title: "Convertible dining",
        description:
          "U-shaped seating hosts six to eight people and transforms into a generous sunbed.",
      },
      {
        title: "Smart safety gate",
        description:
          "An integrated stern gate helps protect children and pets without interrupting the design.",
      },
      {
        title: "Technology at the helm",
        description:
          "Integrated navigation, system controls and modern electronics keep operation clear and intuitive.",
      },
      {
        title: "Signature hardtop",
        description:
          "The sculpted roof and extended windscreen give the 36 its recognisable silhouette and added protection.",
      },
    ],
    gallery: [
      {
        title: "Open-air dining",
        description:
          "The U-shaped cockpit lounge creates a generous social space with uninterrupted views over the water.",
        image: "/images/carousel/k36-social-dining.jpg",
        alt: "Red U-shaped dining lounge on the Kumbra 36",
      },
      {
        title: "Protected command centre",
        description:
          "An extended windscreen, three helm seats and integrated electronics support comfortable passages in changing conditions.",
        image: "/images/carousel/k36-helm.jpg",
        alt: "Kumbra 36 helm with red seats, navigation displays and open sea",
      },
      {
        title: "XL swim platform",
        description:
          "The full-width stern platform becomes a true waterside terrace for swimming, lounging and easy boarding.",
        image: "/images/carousel/k36-swim-platform.jpg",
        alt: "Large white swim platform and red aft sunbed on the Kumbra 36",
      },
      {
        title: "Signature profile",
        description:
          "A long horizontal line, sculpted hull windows and floating hardtop give the 36 a confident silhouette.",
        image: "/images/carousel/k36-profile.jpg",
        alt: "Side profile of a grey Kumbra 36 on calm water",
      },
      {
        title: "Architectural hardtop",
        description:
          "A roof skylight and integrated lighting bring natural air by day and an atmospheric glow after sunset.",
        image: "/images/carousel/k36-hardtop.jpg",
        alt: "Kumbra 36 illuminated hardtop with skylight above red seating",
      },
      {
        title: "Connected deck flow",
        description:
          "Sunbed, dining, galley and helm form one continuous social sequence from stern to bow.",
        image: "/images/carousel/k36-deck-flow.jpg",
        alt: "Aerial stern view showing the full Kumbra 36 deck arrangement",
      },
      {
        title: "Private bow lounge",
        description:
          "The forward sunbed offers a second relaxation zone within the secure walkaround deck.",
        image: "/images/carousel/k36-bow-sunbed.jpg",
        alt: "Aerial bow view of the Kumbra 36 and its red forward sunbed",
      },
      {
        title: "Main cabin",
        description:
          "A bright double berth, integrated storage and natural ventilation create a calm retreat below deck.",
        image: "/images/carousel/k36-main-cabin.jpg",
        alt: "Kumbra 36 main cabin with double berth and light wood cabinetry",
      },
      {
        title: "Private bathroom",
        description:
          "The enclosed head combines a vessel sink, practical storage and a warm teak floor insert.",
        image: "/images/carousel/k36-bathroom.jpg",
        alt: "Kumbra 36 private bathroom with sink, toilet and teak floor",
      },
      {
        title: "Aft guest berths",
        description:
          "Two full single berths extend the 36’s accommodation for family weekends and overnight cruising.",
        image: "/images/carousel/k36-aft-berths.jpg",
        alt: "Twin aft guest berths in the Kumbra 36",
      },
    ],
    interiorTitle: "Versatile spaces below deck.",
    interiorIntro:
      "A convertible forward double berth, two aft single berths and a private bathroom turn the 36 into a capable weekend platform. Natural ventilation, integrated lighting and smart controls keep the interior calm and easy to use.",
    interiorFeatures: [
      {
        title: "Convertible main berth",
        description:
          "The forward double bed changes into a sofa, opening the cabin for daytime use.",
      },
      {
        title: "Aft sleeping space",
        description:
          "Two large single berths sit aft for additional guests or family.",
      },
      {
        title: "Private bathroom",
        description:
          "The enclosed bathroom includes a sink and practical storage for longer days aboard.",
      },
      {
        title: "Smart onboard control",
        description:
          "Connected systems make lighting and essential onboard functions easy to manage.",
      },
    ],
    performanceFeatures: [
      {
        title: "Instant response",
        description:
          "The hull is tuned for fast planing and an agile response when accelerating.",
      },
      {
        title: "42-knot potential",
        description:
          "Up to 800 hp delivers a catalogue maximum speed of 42 knots.",
      },
      {
        title: "Wide-beam stability",
        description:
          "A 3.50 m beam supports a planted, reassuring ride and stable social platform.",
      },
      {
        title: "Long-range rhythm",
        description:
          "A 24-knot cruising speed is designed to balance pace, consumption and comfort.",
      },
    ],
    dimensions: [
      { label: "Overall length", value: "10.90 m" },
      { label: "Waterline length", value: "9.72 m" },
      { label: "Beam", value: "3.50 m" },
      { label: "Maximum height", value: "2.28 m" },
      { label: "Draft", value: "0.65 m" },
      { label: "Displacement", value: "6,300 kg" },
    ],
    propulsion: [
      { label: "Engines", value: "2" },
      { label: "Engine options", value: "Inboard or outboard" },
      { label: "Maximum power", value: "800 hp" },
      { label: "Minimum power", value: "560 hp" },
      { label: "Maximum speed", value: "42 kn" },
      { label: "Cruising speed", value: "24 kn" },
    ],
    onboard: [
      { label: "Fuel tank", value: "650 L" },
      { label: "Fresh-water tank", value: "170 L" },
      { label: "Black-water tank", value: "88 L" },
      { label: "Design category", value: "B" },
      { label: "Maximum capacity", value: "14 people" },
    ],
    layouts: [
      {
        title: "Deck plan",
        description:
          "The hardtop shelters the helm and central social area while leaving the bow, side decks and stern open.",
        image: "/images/layouts/kumbra-36-deck.png",
        alt: "Top view of the Kumbra 36 deck and hardtop",
      },
      {
        title: "Interior plan",
        description:
          "The transparent plan reveals the forward convertible berth, aft sleeping space and private bathroom.",
        image: "/images/layouts/kumbra-36-interior.png",
        alt: "Top view of the Kumbra 36 interior arrangement",
      },
    ],
    layoutNote:
      "These current Kumbra plan views show how the protected deck and below-deck accommodation align within the same walkaround footprint.",
    catalogue: "/brochures/kumbra-36-catalogue.pdf",
  },
  {
    slug: "kumbra-43",
    name: "Kumbra 43",
    eyebrow: "The new reference",
    description:
      "The flagship Kumbra: a 13.35 m performance yacht with exceptional social space, two full cabins and a commanding presence underway.",
    hero: "/images/kumbra-43-hero-new-CHTLJ7cF.jpg",
    profile: "/images/studio/kumbra-43-white.png",
    secondary: "/images/kumbra-43-hero-profile-new-jV4KD9M0.jpg",
    length: "13.35 m",
    beam: "3.99 m",
    capacity: "14 guests",
    power: "1,200 hp",
    speed: "42 kn",
    cabins: "2 cabins · 2 heads",
    storyTitle: "A flagship that opens itself to the sea.",
    story:
      "The Kumbra 43 turns its generous stern into a waterside terrace and carries a clean, uninterrupted line forward. Sculpted volumes guide movement without visual clutter, while the broad deck brings together sunbathing, dining and helm zones for up to 14 guests.",
    highlights: [
      {
        title: "Open stern terrace",
        description:
          "A broad platform sits close to the water and flows directly into the aft social space.",
      },
      {
        title: "Central sun lounge",
        description:
          "The large aft sunbed is integrated into the deck volumes as a calm focal point.",
      },
      {
        title: "Purposeful geometry",
        description:
          "Every curve guides the eye, supports circulation and reinforces the yacht’s distinctive silhouette.",
      },
      {
        title: "Uninterrupted circulation",
        description:
          "Wide side decks connect stern, helm and bow with a clear, confident flow.",
      },
      {
        title: "Generous dining",
        description:
          "A substantial central table and surrounding seating create a true open-air salon.",
      },
      {
        title: "Triple-seat helm",
        description:
          "Three supportive helm seats place skipper and guests together behind an advanced navigation console.",
      },
      {
        title: "Bow sun lounge",
        description:
          "A wide forward sunbed creates a second private relaxation zone away from the stern.",
      },
      {
        title: "Four propulsion concepts",
        description:
          "The platform supports outboard, concealed outboard, shaft-drive and sterndrive configurations, subject to final engineering.",
      },
    ],
    gallery: [
      {
        title: "Private waterside terrace",
        description:
          "Fold-down platforms, a broad sunbed and two dining tables turn the stern into a complete open-air living space.",
        image: "/images/carousel/k43-stern-social.jpg",
        alt: "Aerial view of the Kumbra 43 stern terrace with open side platforms",
      },
      {
        title: "Flagship silhouette",
        description:
          "The 13.35-metre profile combines a deep hull, uninterrupted glazing and a floating architectural hardtop.",
        image: "/images/carousel/k43-profile.jpg",
        alt: "Full side profile of the grey Kumbra 43 on turquoise water",
      },
      {
        title: "Expansive bow lounge",
        description:
          "A wide forward sunbed creates a secluded relaxation zone while preserving safe circulation around it.",
        image: "/images/carousel/k43-bow-lounge.jpg",
        alt: "Aerial bow view of the Kumbra 43 and its large white sunbed",
      },
      {
        title: "Advanced helm",
        description:
          "Twin multifunction displays, integrated controls and a clean black console put essential information within easy reach.",
        image: "/images/carousel/kumbra-43-helm-clean.png",
        alt: "Cleaned Kumbra 43 helm console with twin navigation displays",
      },
      {
        title: "Owner’s suite",
        description:
          "A forward double berth and curved lounge sit within a bright, softly lit cabin designed for genuine time aboard.",
        image: "/images/carousel/k43-main-cabin.jpg",
        alt: "Kumbra 43 owner cabin with double berth and curved lounge seating",
      },
      {
        title: "Full-beam guest cabin",
        description:
          "Two generous aft berths, premium textiles and indirect lighting create a welcoming second cabin.",
        image: "/images/carousel/k43-aft-cabin.jpg",
        alt: "Kumbra 43 aft guest cabin with two beds and branded cushions",
      },
      {
        title: "Enclosed shower",
        description:
          "A rainfall shower, handheld fitting and warm indirect lighting bring residential comfort below deck.",
        image: "/images/carousel/k43-shower.jpg",
        alt: "Black rainfall and handheld shower fittings in the Kumbra 43 bathroom",
      },
      {
        title: "Refined bathroom details",
        description:
          "Backlit surfaces, dark fittings and carefully selected accessories complete the yacht’s calm interior palette.",
        image: "/images/carousel/k43-vanity.jpg",
        alt: "Kumbra 43 bathroom vanity detail with diffuser and dark faucet",
      },
    ],
    interiorTitle: "A genuine home at sea.",
    interiorIntro:
      "The 43 pairs an owner’s cabin, a generous aft guest cabin, a convertible lounge and two full bathrooms. Natural light, indirect LEDs, refined textiles, wood and Dekton surfaces create a calm, residential atmosphere.",
    interiorFeatures: [
      {
        title: "Owner’s cabin",
        description:
          "A forward double bed, curved sofa, side windows and soft ambient lighting create a warm, functional private suite.",
      },
      {
        title: "Aft guest cabin",
        description:
          "Two generous beds—approximately 1.30 m and 1.40 m wide—sit beneath integrated lighting in a full-beam sleeping space.",
      },
      {
        title: "Convertible lounge",
        description:
          "The central salon adds flexible living space and can support additional accommodation when required.",
      },
      {
        title: "Two full bathrooms",
        description:
          "Integrated sinks, built-in storage, backlit mirrors and enclosed showers combine practical use with premium finishes.",
      },
    ],
    performanceFeatures: [
      {
        title: "Up to 1,200 hp",
        description:
          "The flagship power envelope is designed for strong acceleration and confident fast cruising.",
      },
      {
        title: "27-knot cruise",
        description:
          "The catalogue cruising speed keeps long passages purposeful without sacrificing onboard comfort.",
      },
      {
        title: "42-knot maximum",
        description:
          "The published maximum speed gives the 43 genuine performance-yacht capability.",
      },
      {
        title: "Category B",
        description:
          "The design category and high-capacity tankage support ambitious coastal and offshore use.",
      },
    ],
    dimensions: [
      { label: "Overall length", value: "13.35 m" },
      { label: "Waterline length", value: "11.99 m" },
      { label: "Beam", value: "3.99 m" },
      { label: "Maximum height", value: "2.75 m" },
      { label: "Draft", value: "0.80 m" },
      { label: "Displacement without engines", value: "11,500 kg" },
    ],
    propulsion: [
      { label: "Engine arrangement", value: "2 or 3 engines" },
      {
        label: "Propulsion options",
        value: "Outboard, hidden outboard, shafts or sterndrives",
      },
      { label: "Maximum power", value: "1,200 hp" },
      { label: "Minimum power", value: "600 hp" },
      { label: "Maximum speed", value: "42 kn" },
      { label: "Cruising speed", value: "27 kn" },
    ],
    onboard: [
      { label: "Fuel tank", value: "1,200 L" },
      { label: "Fresh-water tank", value: "300 L" },
      { label: "Black-water tank", value: "160 L" },
      { label: "Design category", value: "B" },
      { label: "Maximum capacity", value: "14 people" },
      { label: "Accommodation", value: "2 cabins · 2 bathrooms" },
    ],
    layouts: [
      {
        title: "Deck view",
        description:
          "The canopy view maps the bow lounge, protected helm, central dining and full-width stern terrace.",
        image: "/images/layouts/kumbra-43-deck.png",
        alt: "Top view of the Kumbra 43 deck and hardtop",
      },
      {
        title: "Interior arrangement",
        description:
          "The transparent plan reveals the owner’s suite, guest cabin, convertible salon and two full bathrooms.",
        image: "/images/layouts/kumbra-43-interior.png",
        alt: "Top view of the Kumbra 43 interior arrangement",
      },
    ],
    layoutNote:
      "Separate high-resolution deck and interior views make the flagship arrangement easy to study on every screen size.",
    catalogue: "/brochures/kumbra-43-catalogue.pdf",
    video:
      "https://www.kumbrayachts.com/__l5e/assets-v1/616a7a4c-8e20-4199-99ea-519da91cace8/kumbra-43-discover-video.mp4",
  },
];

export function getBoat(slug: string) {
  return boats.find((boat) => boat.slug === slug);
}

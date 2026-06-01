type Tip = { name: string; note: string };

export type PropertyHouseInfo = {
  propertyName: string;
  wifiNetwork: string;
  wifiPassword: string;
  checkInTime: string;
  checkoutTime: string;
  parking?: string;
  trash?: string;
  address?: string;
  emergencyContact: string;
  notes: string[];
  guideSlug?: string;
  restaurants?: Tip[];
  activities?: Tip[];
  nightlife?: Tip[];
  beaches?: Tip[];
};

// ── Shared guide sets ────────────────────────────────────────────────────────

const ST_PETE_RESTAURANTS: Tip[] = [
  { name: "Il Ritorno", note: "Rustic-modern Italian — consistently excellent date night" },
  { name: "Allelo", note: "Mediterranean on Beach Drive — stunning waterfront patio" },
  { name: "Brick & Mortar", note: "Seasonal American menu — local favorite for a nicer night out" },
  { name: "The Library", note: "Best brunch in St. Pete — sourdough French toast, smooth coffee" },
  { name: "Copa", note: "Latin tapas, espresso martinis, gorgeous outdoor patio" },
  { name: "Fortu", note: "Michelin-recommended Japanese fusion — book ahead, worth it" },
];
const ST_PETE_ACTIVITIES: Tip[] = [
  { name: "St. Pete Pier", note: "Iconic waterfront landmark — shops, restaurants & water views" },
  { name: "The Dali Museum", note: "World-class surrealist art right on the waterfront" },
  { name: "Crescent Lake Park", note: "Beautiful park for walks, picnics & sunsets — nearby" },
  { name: "Sunken Gardens", note: "Historic botanical garden — over 100 years old" },
  { name: "Pinellas Trail", note: "34-mile trail — rent a bike and cruise along the bay" },
  { name: "Central Avenue", note: "St. Pete's coolest strip — galleries, boutiques, bars & street art" },
];
const ST_PETE_NIGHTLIFE: Tip[] = [
  { name: "Stillwaters Tavern", note: "Sophisticated cocktails on Beach Drive" },
  { name: "The Floridian", note: "Local favorite — live music, great food, unpretentious vibe" },
  { name: "Green Bench Brewing", note: "St. Pete's best craft brewery — huge outdoor area" },
  { name: "Noble Tavern", note: "Creative cocktails, small plates, indoor-outdoor" },
];
const ST_PETE_BEACHES: Tip[] = [
  { name: "St. Pete Beach", note: "Gulf Coast beauty — white sand, calm warm water — 13 min" },
  { name: "Indian Rocks Beach", note: "Quieter, locals love it — great for sunset walks — 20 min" },
  { name: "Clearwater Beach", note: "World-famous, Pier 60 sunset festival — 25 min" },
];

const IRB_RESTAURANTS: Tip[] = [
  { name: "Guppy's on the Beach", note: "Best seafood in IRB — grouper piccata, Florida lobster" },
  { name: "Crabby Bill's", note: "IRB institution since 1983 — live music nightly, pure Florida" },
  { name: "Cafe de Paris Bakery", note: "French crepes, quiches, pastries — perfect beachside breakfast" },
  { name: "Kooky Coconut", note: "Cuban sandwiches, tacos, 32 ice cream flavors — steps from beach" },
  { name: "Salt Rock Grill", note: "Legendary date-night — USDA prime steaks, Intracoastal views" },
  { name: "Guilty Sea Sports Pub", note: "Game days, live music, all-day happy hour" },
];
const IRB_ACTIVITIES: Tip[] = [
  { name: "Indian Rocks Beach", note: "Walk right there — free public access, stunning Gulf sunsets" },
  { name: "Pinellas Trail", note: "34-mile coastal trail — access right from the neighborhood" },
  { name: "Public Fishing Pier", note: "Great IRB fishing pier — bring your own gear" },
  { name: "Paddleboard & Kayak Rentals", note: "Multiple rental spots along Gulf Blvd" },
  { name: "Shelling", note: "IRB is known for great shells — walk the beach at low tide" },
];
const IRB_NIGHTLIFE: Tip[] = [
  { name: "Crabby Bill's", note: "Live music every night — the heartbeat of IRB nightlife" },
  { name: "Guilty Sea Sports Pub", note: "All-day happy hour, live entertainment & darts" },
  { name: "Mahuffer's", note: "Beloved dive bar, indoor/outdoor — look for the hearse out front" },
];
const IRB_BEACHES: Tip[] = [
  { name: "Indian Rocks Beach", note: "Walk right there — quiet, beautiful, locals' favorite" },
  { name: "Clearwater Beach", note: "World-famous, Pier 60 sunset festival — 20 min" },
  { name: "Madeira Beach", note: "John's Pass Village — shops, seafood & watersports — 15 min" },
];

// ── Config ───────────────────────────────────────────────────────────────────

export const WIFI_CONFIG: Record<string, PropertyHouseInfo> = {
  tampa: {
    propertyName: "Waterfront 6BR Tampa",
    wifiNetwork: "waterfront",
    wifiPassword: "vacation1",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Park in the driveway or garage — room for multiple cars.",
    address: "Tampa, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "tampa",
    notes: [
      "Quiet hours: 10 PM – 8 AM. Neighbors are sensitive to noise.",
      "Pool is heated to ~88°F and turns on automatically at arrival.",
      "Induction cooktop: place a stainless steel pot on the burner first, then it turns on.",
      "No chores needed at check-out — just be out by 10 AM.",
    ],
    restaurants: [
      { name: "Bern's Steak House", note: "One of the top 5 steakhouses in the USA — legendary Hyde Park institution" },
      { name: "Armature Works", note: "Heights Public Market — multiple food halls, waterfront views, best vibe in Tampa" },
      { name: "Columbia Restaurant (Ybor City)", note: "Florida's oldest restaurant — authentic Cuban, flamenco shows" },
      { name: "Sparkman Wharf", note: "Waterfront food trucks, craft drinks, outdoor seating by the river" },
      { name: "On Swann", note: "Hyde Park's top table — elegant, seasonal American cuisine" },
    ],
    activities: [
      { name: "Florida Aquarium", note: "World-class aquarium right on the waterfront" },
      { name: "Busch Gardens", note: "Theme park + wildlife — roller coasters and African safari animals" },
      { name: "Tampa Riverwalk", note: "2.6-mile waterfront walk connecting parks, restaurants & the aquarium" },
      { name: "Ybor City", note: "Historic cigar district — cobblestone streets, Cuban food & wild nightlife" },
      { name: "Seminole Hard Rock Casino", note: "World-class casino, concerts, live entertainment & dining" },
      { name: "Amalie Arena", note: "Tampa Bay Lightning home — check for concerts & events during your stay" },
    ],
    nightlife: [
      { name: "Gaspar's Grotto (Ybor)", note: "Pirate-themed bar, legendary Cuban sandwiches, always packed" },
      { name: "M. Bird at Armature Works", note: "Best rooftop bar in Tampa — views, cocktails, great crowd" },
      { name: "CW's Gin Joint", note: "1920s speakeasy vibes, smooth jazz, handcrafted gin cocktails" },
      { name: "EDGE Rooftop Bar", note: "Panoramic Tampa skyline views from the Epicurean Hotel" },
    ],
    beaches: [
      { name: "Clearwater Beach", note: "Award-winning white sand — 25 min" },
      { name: "St. Pete Beach", note: "Gorgeous Gulf Coast, great sunset bars — 25 min" },
      { name: "Indian Rocks Beach", note: "Quieter, less crowded, great for families — 30 min" },
    ],
  },

  largo: {
    propertyName: "Luxury Pool Home Largo",
    wifiNetwork: "Oval",
    wifiPassword: "Vacation2",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Park in the driveway — fits several cars.",
    trash: "Trash pickup: Thursdays. Bins on the side of the house — host handles curbside.",
    address: "Largo, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "clearwater-beach",
    notes: [
      "Pool turns on automatically at 9 AM. Heating is free Oct–May.",
      "Pool restart: open the black box by the pump and press Quick Clean.",
      "Fountain/waterfall: twist the left knob to operate; turn off when done.",
      "Gazebo lights: switch on the left outside by the blue chair at the sliding door.",
      "Firepit and charcoal BBQ available — guests supply their own charcoal.",
      "Beach chairs, umbrella, and towels are provided.",
      "Quiet hours: 10 PM – 7 AM.",
    ],
    restaurants: [
      { name: "Roosterfish Grill", note: "Waterfront seafood gem — Canadian sea scallops are legendary" },
      { name: "Forchetta Italian Eatery", note: "Largo's top-rated Italian — homemade pastas, warm atmosphere" },
      { name: "Havana Harry's Market", note: "Best Cuban sandwich in Largo — hot pressed, proper, perfect" },
      { name: "iThai & Sushi", note: "Fresh rolls daily, great duck & seafood dishes — local obsession" },
      { name: "Greek City Cafe", note: "Loaded gyros, fresh Greek salad — generous portions, hidden gem" },
      { name: "Cafe Largo", note: "Fine dining French cuisine with an impressive wine list" },
    ],
    activities: [
      { name: "Florida Botanical Gardens", note: "30 acres of stunning themed gardens — free and beautiful" },
      { name: "Pinellas Trail", note: "Jump on the famous 34-mile coastal trail right from Largo" },
      { name: "Walsingham Park", note: "Great local park with lake, trails & picnic areas" },
      { name: "Pinellas County Heritage Village", note: "Historic buildings and exhibits — fascinating local history" },
    ],
    nightlife: [
      { name: "Brew Garden Taphouse", note: "Great tap list, pizza, family-friendly" },
      { name: "Rumba Island Bar & Grill", note: "Caribbean vibes, island food, tiki bar" },
      { name: "Gigglewaters", note: "Unique spot — daily movie screenings with a full bar" },
    ],
    beaches: [
      { name: "Indian Rocks Beach", note: "5 minutes away — Gulf Coast gem, calm water" },
      { name: "Clearwater Beach", note: "World-famous white sand — 13 min" },
      { name: "Madeira Beach", note: "John's Pass Village, great seafood & watersports — 15 min" },
    ],
  },

  "irb-b": {
    propertyName: "Walk to Beach — IRB (Unit A)",
    wifiNetwork: "spectrum6BFF",
    wifiPassword: "happyspace961",
    checkInTime: "3:00 PM",
    checkoutTime: "11:00 AM",
    parking: "Two spots in front of Unit A (left door). Overflow: by the carport near the hot tub.",
    address: "Indian Rocks Beach, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "clearwater-beach",
    notes: [
      "Beach is a 5-minute walk — fully open.",
      "Beach chairs, umbrella, and beach towels are in the common area.",
      "Hot tub is private to Unit A. Neon sign button is in the closet by the tub.",
      "Keurig coffee maker provided — bring your own pods.",
      "Quiet hours: 10 PM – 7 AM. This is a duplex — please respect the neighbors.",
    ],
    restaurants: IRB_RESTAURANTS,
    activities: IRB_ACTIVITIES,
    nightlife: IRB_NIGHTLIFE,
    beaches: IRB_BEACHES,
  },

  clearwater: {
    propertyName: "Family Pool Home Clearwater",
    wifiNetwork: "Seminole",
    wifiPassword: "vacation1",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Free parking in the driveway and garage — up to 4 vehicles. No street parking.",
    trash: "Garbage bins on the side of the house — host handles pickup.",
    address: "Clearwater, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "clearwater-beach",
    notes: [
      "Clearwater Beach is 9 minutes by car.",
      "Pool is private — maintenance team may stop by unannounced.",
      "Jolley Trolley runs 7 days/week — nearest stop ~1 mile away.",
      "Charcoal BBQ available — utensils provided.",
      "Quiet hours: 10 PM – 7 AM.",
      "No chores needed — just be out by 10 AM.",
    ],
    restaurants: [
      { name: "Island Way Grill", note: "Fresh-caught daily by their own boats — Sunday brunch is exceptional" },
      { name: "Clear Sky on Cleveland", note: "Local favorite — creative global menu, avocado fries, great bar" },
      { name: "Columbia Restaurant", note: "Florida's oldest restaurant — legendary Cuban food & paella" },
      { name: "Lenny's Restaurant", note: "Best breakfast in Clearwater — NY diner vibes, locals swear by it" },
      { name: "Crabby's Dockside", note: "3 floors of stunning beach views, fresh seafood, lively atmosphere" },
      { name: "Bob Heilman's Beachcomber", note: "Classic since 1948 — famous fried chicken & old Florida charm" },
    ],
    activities: [
      { name: "Clearwater Marine Aquarium", note: "Home of Winter the dolphin — incredible rescue & rehab center" },
      { name: "Pier 60", note: "Sunset festival every evening — street performers, crafts & stunning views" },
      { name: "Clearwater Beach", note: "9 minutes away — consistently rated one of the best beaches in the US" },
      { name: "Pirate Water Taxi", note: "Hop-on hop-off boat around Tampa Bay waterways" },
      { name: "Grindhaus Brew Lab", note: "Movie-themed craft brewery — cult film marathons & creative pours" },
    ],
    nightlife: [
      { name: "Shephard's Tiki Beach Bar", note: "Toes in the sand, live music, dancing — iconic Clearwater bar" },
      { name: "Coco's Crush Bar", note: "Live music every night, Maryland-style seafood, great energy" },
      { name: "Hurricane Eddie's", note: "2 bars, tons of TVs, fresh seafood, prime beach location" },
    ],
    beaches: [
      { name: "Clearwater Beach", note: "World-class white sand & turquoise water — 9 min" },
      { name: "Indian Rocks Beach", note: "Quieter alternative, great for families — 15 min" },
      { name: "Caladesi Island State Park", note: "Pristine untouched barrier island — accessible by ferry — 20 min" },
    ],
  },

  "irb-a": {
    propertyName: "Walk to Beach — IRB (Unit B)",
    wifiNetwork: "benchkettle931",
    wifiPassword: "SpectrumSetup-CF",
    checkInTime: "3:00 PM",
    checkoutTime: "11:00 AM",
    parking: "Two spots in front of Unit B (right side).",
    address: "Indian Rocks Beach, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "clearwater-beach",
    notes: [
      "Beach is a 5-minute walk.",
      "Beach essentials: 4 chairs, umbrella, cooler, and wagon — return all before departure.",
      "Hot tub is in the shared area — request setup with host in advance (fee applies).",
      "Keurig coffee maker provided — bring your own pods.",
      "Quiet hours: 10 PM – 7 AM.",
    ],
    restaurants: IRB_RESTAURANTS,
    activities: IRB_ACTIVITIES,
    nightlife: IRB_NIGHTLIFE,
    beaches: IRB_BEACHES,
  },

  "stpete-sunsoaked": {
    propertyName: "Sun-Soaked St. Pete (Apt 1)",
    wifiNetwork: "spectrumD3",
    wifiPassword: "marbletheory468",
    checkInTime: "3:00 PM",
    checkoutTime: "11:00 AM",
    parking: "One designated spot (right side) inside the garage. Free street parking by the lake for extra cars.",
    address: "434 15th Ave N, St. Petersburg, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "st-petersburg",
    notes: [
      "Central Ave restaurants and bars are steps away.",
      "Crescent Lake is 3 blocks away — great for morning walks.",
      "Second floor unit — approximately 20 steps from the ground entrance.",
      "Stove tip: always place a pot or pan on the burner for it to activate.",
      "Quiet hours: 10 PM – 7 AM.",
      "No chores needed — just be out by 11 AM.",
    ],
    restaurants: ST_PETE_RESTAURANTS,
    activities: ST_PETE_ACTIVITIES,
    nightlife: ST_PETE_NIGHTLIFE,
    beaches: ST_PETE_BEACHES,
  },

  "stpete-modern": {
    propertyName: "Modern Retreat St. Pete (Apt 2)",
    wifiNetwork: "spectrumD3",
    wifiPassword: "marbletheory468",
    checkInTime: "3:00 PM",
    checkoutTime: "11:00 AM",
    parking: "One designated garage spot. Close garage from outside: press Enter on the keypad.",
    address: "434 15th Ave N, St. Petersburg, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "st-petersburg",
    notes: [
      "Two bicycles available — use at your own risk.",
      "Downtown St. Pete and Central Ave are a short walk.",
      "Stove tip: always place a pot or pan on the burner for it to activate.",
      "Quiet hours: 10 PM – 7 AM.",
      "No chores needed — dishes in dishwasher, towels in dryer is fine.",
    ],
    restaurants: ST_PETE_RESTAURANTS,
    activities: ST_PETE_ACTIVITIES,
    nightlife: ST_PETE_NIGHTLIFE,
    beaches: ST_PETE_BEACHES,
  },

  "stpete-hottub": {
    propertyName: "Private Hot Tub Bungalow (Apt A)",
    wifiNetwork: "See label on router",
    wifiPassword: "cleanbunny221",
    checkInTime: "3:00 PM",
    checkoutTime: "11:00 AM",
    parking: "Spot marked 'A' in the back alley between 14th and 15th Ave. Free street parking nearby.",
    address: "434 15th Ave N, Unit A, St. Petersburg, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "st-petersburg",
    notes: [
      "Hot tub is in the private fenced backyard. Contact host to request setup (fee applies).",
      "BBQ grill and outdoor seating are yours in the patio.",
      "Central Ave dining and nightlife is a 3-block walk.",
      "Enter via front gate (15th Ave) or back gate (alley between 14th and 15th).",
      "Quiet hours: 10 PM – 7 AM.",
    ],
    restaurants: ST_PETE_RESTAURANTS,
    activities: ST_PETE_ACTIVITIES,
    nightlife: ST_PETE_NIGHTLIFE,
    beaches: ST_PETE_BEACHES,
  },

  "stpete-patio": {
    propertyName: "Art & Character Bungalow (Apt B)",
    wifiNetwork: "Spectrum 83",
    wifiPassword: "cleanbunny221",
    checkInTime: "3:00 PM",
    checkoutTime: "11:00 AM",
    parking: "Spot marked 'B' in the back alley between 14th and 15th Ave. Two compact cars can fit back-to-back.",
    address: "434 15th Ave N, Unit B, St. Petersburg, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "st-petersburg",
    notes: [
      "Dartboard game room — extra darts are in the kitchen drawer.",
      "Charcoal BBQ and outdoor seating in the private fenced yard — bring your own charcoal.",
      "Hot tub available upon request — contact host in advance (fee applies).",
      "Enter via brown gate (front) or white gate in the back alley.",
      "Quiet hours: 10 PM – 7 AM.",
    ],
    restaurants: ST_PETE_RESTAURANTS,
    activities: ST_PETE_ACTIVITIES,
    nightlife: ST_PETE_NIGHTLIFE,
    beaches: ST_PETE_BEACHES,
  },
};

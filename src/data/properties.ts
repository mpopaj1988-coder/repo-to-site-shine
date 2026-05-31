import { galleryManifest } from "./galleryAlts";

const galleryModules = import.meta.glob("@/assets/properties/*/*.{jpg,jpeg,png}", {
  eager: true,
  query: { format: "webp", quality: "85", as: "url" },
  import: "default",
}) as Record<string, string>;

function galleryFor(slug: string): { src: string; alt: string }[] {
  // Build map of available files for this slug -> URL.
  const available = new Map<string, string>();
  for (const [k, v] of Object.entries(galleryModules)) {
    const m = k.match(new RegExp(`/properties/${slug}/([^/]+)$`));
    if (m) available.set(m[1], v);
  }
  const manifest = galleryManifest[slug] ?? [];
  const used = new Set<string>();
  const ordered: { src: string; alt: string }[] = [];
  for (const entry of manifest) {
    const src = available.get(entry.file);
    if (!src || used.has(entry.file)) continue;
    used.add(entry.file);
    ordered.push({ src, alt: entry.alt });
  }
  // Append any remaining files (not yet listed) at the end with a generic alt.
  const remaining = [...available.entries()]
    .filter(([f]) => !used.has(f))
    .sort(([a], [b]) => a.localeCompare(b));
  for (const [, src] of remaining) {
    ordered.push({ src, alt: "" }); // alt filled per-property below
  }
  return ordered;
}

export type Category = "Beach" | "City" | "Large Groups";

export type Property = {
  slug: string;
  hospitableId?: string;
  airbnbUrl?: string;
  lat?: number;
  lng?: number;
  image: string;
  images: string[];
  imageAlts: string[];
  alt: string;
  location: string;
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  feature: string;
  rating: number;
  reviews: number;
  categories: Category[];
  badge?: string;
  href: string;
  directBookingUrl: string;
  tagline: string;
  longDescription: string;
  amenities: string[];
  highlights: { icon: string; title: string; body: string }[];
};

const data: Omit<Property, "image" | "images" | "imageAlts">[] = [
  {
    slug: "tampa",
    hospitableId: "0024b4b4-526d-4103-adf4-78665e48fe7d",
    airbnbUrl: "https://www.airbnb.com/rooms/1583296551133303414",
    lat: 27.98832102, lng: -82.5822876,
    alt: "Tampa Florida waterfront luxury 6-bedroom home with heated pool and private dock",
    location: "Tampa, FL",
    title: "Waterfront 6BR | Heated Pool + Dock | Sleeps 15",
    description: "Waterfront Tampa vacation rental with heated pool, private dock and two master suites — sleeps 15 in luxury. Book direct and save.",
    bedrooms: 6, bathrooms: 4, sleeps: 15,
    feature: "Pool + Dock",
    rating: 5.0, reviews: 6,
    categories: ["Large Groups"],
    badge: "Guest Favorite",
    href: "https://seaandcityrentals.hospitable.rentals/",
    directBookingUrl: "https://seaandcityrentals.hospitable.rentals/listings/2f0af99d-80ac-502b-9208-a38d81729b6c",
    tagline: "Waterfront luxury for unforgettable group escapes.",
    longDescription: "Escape to one of Tampa's most photographed waterfront vacation rentals — a 6-bedroom, 4-bath estate built for large families, milestone trips and reunions of up to 15 guests. Wake up in one of two oversized master suites, brew coffee on a sun-drenched lanai, then step from your private dock straight into the bay. Afternoons drift between the heated pool, the outdoor kitchen and the fire pit; evenings end with sunset cocktails over open water. Inside, a chef's kitchen, multiple living areas and resort-grade beds make group travel effortless. Five minutes to dining, twenty to Tampa International — the rare home where everyone gets their own space without ever leaving the property.",
    amenities: ["Heated pool","Private dock","Outdoor kitchen","Fire pit","Two master suites","Smart TVs throughout","Fast Wi-Fi","Washer & dryer","Central A/C","Free parking"],
    highlights: [
      { icon: "🛥️", title: "Private dock", body: "Step right onto the water from your backyard." },
      { icon: "🏊", title: "Heated pool", body: "Resort-style pool deck with seating for the group." },
      { icon: "👨‍🍳", title: "Chef kitchen", body: "Gourmet kitchen with island, ideal for cooking together." },
    ],
  },
  {
    slug: "largo",
    hospitableId: "eb384a9c-3877-4628-ae9b-f4f0d39ed132",
    airbnbUrl: "https://www.airbnb.com/rooms/50323601",
    lat: 27.87888145, lng: -82.82595825,
    alt: "Largo Florida designer pool home with gazebo, fire pit and covered patio near Indian Rocks Beach",
    location: "Largo, FL",
    title: "Luxury 3BR 3BA | Heated Pool | Sleeps 11",
    description: "Largo pool home 5 minutes from Indian Rocks Beach — heated pool, lit gazebo, fire pit and 3 spa baths. Sleeps 11. Book direct.",
    bedrooms: 3, bathrooms: 3, sleeps: 11,
    feature: "Heated Pool",
    rating: 4.96, reviews: 184,
    categories: ["Beach", "Large Groups"],
    href: "https://seaandcityrentals.hospitable.rentals/",
    directBookingUrl: "https://seaandcityrentals.hospitable.rentals/listings/f4aa7002-c774-5f9f-bda5-07da36ac4224",
    tagline: "Resort-style backyard, five minutes from the Gulf.",
    longDescription: "A designer Largo pool estate that lives larger than its three bedrooms — sleeping 11 across one king, three queens and a bunk room dialed in for kids. The backyard is the headline: heated pool with cascading waterfall, lit gazebo dining for 4, fire pit circle wrapped in Adirondack chairs, and an outdoor patio with couch and BBQ for long, easy nights. Inside, an open-plan great room flows into a renovated quartz-island kitchen with double oven, while three spa-style bathrooms keep mornings drama-free. Five minutes to Indian Rocks Beach and the Gulf, twenty to Clearwater — your group's home base for sun-drenched Florida days and resort-quality nights at home.",
    amenities: ["Heated pool with waterfall","Lit gazebo + dining for 4","Fire pit","Outdoor patio + couch","BBQ grill","Three spa-style baths","Quartz chef kitchen","Smart TVs","Fast Wi-Fi","Washer & dryer"],
    highlights: [
      { icon: "🏊", title: "Resort-style pool", body: "Heated pool with stunning waterfall feature." },
      { icon: "🔥", title: "Fire pit + gazebo", body: "Lit gazebo and Adirondack fire circle for evenings." },
      { icon: "🏖️", title: "5 min to IRB", body: "Five minutes from Indian Rocks Beach." },
    ],
  },
  {
    slug: "irb-b",
    hospitableId: "9aebd9d3-14e5-4dce-a80f-d8fb22c2f15a",
    airbnbUrl: "https://www.airbnb.com/rooms/1205753692890892812",
    lat: 27.90795729, lng: -82.84534257,
    alt: "Indian Rocks Beach Florida 2-bedroom coastal vacation home with private hot tub",
    location: "Indian Rocks Beach, FL",
    title: "Walk to Beach | Hot Tub | 2BR Coastal House",
    description: "Walk to Indian Rocks Beach in seconds — 2BR coastal home with private hot tub, sunny deck and beach gear included. Sleeps 6.",
    bedrooms: 2, bathrooms: 2, sleeps: 6,
    feature: "Hot Tub",
    rating: 4.96, reviews: 79,
    categories: ["Beach"],
    href: "https://seaandcityrentals.hospitable.rentals/",
    directBookingUrl: "https://seaandcityrentals.hospitable.rentals/listings/d6509a01-5557-50cd-b5bd-2e9db649f1c3",
    tagline: "Beach house bliss — steps from the Gulf.",
    longDescription: "The Indian Rocks Beach hideaway you picture when you daydream about Florida — a 2-bedroom coastal cottage where you can leave your shoes at the door and walk to the white sand in under a minute. A private hot tub bubbles under string lights on a sunny deck stocked with rocking chairs, a gas grill and palm-shaded views. Two bedrooms — each with two beds — plus a queen sofa bed comfortably sleep six, while marble counters, designer baths and premium linens elevate every quiet morning. Walkable dining and ice cream are at your door; sunset over the Gulf is your nightly tradition.",
    amenities: ["Private hot tub","Sunny deck + grill","Steps to the beach","Beach essentials provided","Marble kitchen","Two designer baths","Premium linens","Fast Wi-Fi","Washer & dryer","Central A/C"],
    highlights: [
      { icon: "🛁", title: "Private hot tub", body: "Soak under string lights every night." },
      { icon: "🏖️", title: "Walk to Gulf", body: "White sand and warm water just steps away." },
      { icon: "🌅", title: "Sunset deck", body: "Rocking chairs and palm tree views." },
    ],
  },
  {
    slug: "clearwater",
    hospitableId: "ed98cca4-b91c-4dc0-9883-397a7dfb38b2",
    airbnbUrl: "https://www.airbnb.com/rooms/43372143",
    lat: 27.97304916, lng: -82.78588867,
    alt: "Clearwater Florida 4-bedroom family pool home with fenced yard and fire pit",
    location: "Clearwater, FL",
    title: "Family Pool Getaway | 9 Min to Clearwater Beach",
    description: "4BR Clearwater pool home, 9 minutes to the beach — heated pool, fire pit, fenced yard and bunk room. Sleeps 14. 279+ five-star stays.",
    bedrooms: 4, bathrooms: 2, sleeps: 14,
    feature: "Heated Pool",
    rating: 4.94, reviews: 279,
    categories: ["Beach", "Large Groups"],
    badge: "Most Reviewed",
    href: "https://seaandcityrentals.hospitable.rentals/",
    directBookingUrl: "https://seaandcityrentals.hospitable.rentals/listings/47118bd2-8b40-5d57-a2e2-9dca8557177f",
    tagline: "Our most-reviewed home — 279 stays and counting.",
    longDescription: "Our most-reviewed Clearwater vacation rental — and it earns it. A beautifully styled 4-bedroom, 2-bath family home that sleeps 14, just nine minutes from Clearwater Beach and twenty from Tampa airport. The fenced backyard centers on a heated pool ringed with string lights, a stone fire pit with teal Adirondack chairs and outdoor dining for eight. Inside, four uniquely designed bedrooms — including a kid-favorite bunk room — surround a stainless chef's kitchen and a wide open living space built for board games, group dinners and movie nights. With 279 five-star stays on the books, it's the home repeat guests rebook a year out.",
    amenities: ["Heated pool","Stone fire pit","Large fenced yard","Outdoor dining for 8","Stainless kitchen","Smart TVs throughout","Fast Wi-Fi","Washer & dryer","Central A/C","Free parking"],
    highlights: [
      { icon: "🏊", title: "Heated pool", body: "Glowing pool with string lights and lounge." },
      { icon: "🔥", title: "Fire pit", body: "Stone fire pit with teal Adirondack chairs." },
      { icon: "🏖️", title: "9 min to beach", body: "Minutes from Clearwater Beach." },
    ],
  },
  {
    slug: "irb-a",
    hospitableId: "c95444d7-c292-48e8-a124-921f2322d1f6",
    airbnbUrl: "https://www.airbnb.com/rooms/1299344547038307200",
    lat: 27.9079573, lng: -82.8453425,
    alt: "Indian Rocks Beach Florida vacation rental with deck at sunset, hot tub and Gulf views",
    location: "Indian Rocks Beach, FL",
    title: "Walk to Beach | Hot Tub | 2BR · Sleeps 6",
    description: "Steps from Indian Rocks Beach — 2BR Gulf-side home with private hot tub, sunset deck and Insta-ready interiors. Sleeps 6.",
    bedrooms: 2, bathrooms: 2, sleeps: 6,
    feature: "Hot Tub",
    rating: 4.88, reviews: 67,
    categories: ["Beach"],
    href: "https://seaandcityrentals.hospitable.rentals/",
    directBookingUrl: "https://seaandcityrentals.hospitable.rentals/listings/845626c9-0ff3-5e54-b949-500d0d23ae1f",
    tagline: "The perfect place on the beach.",
    longDescription: "The IRB beach house your feed has been waiting for — a 2-bedroom Gulf-side retreat designed for groups of six who want sand under their toes by minute two. A fully enclosed private hot tub glows under string lights and a custom neon sign; the deck holds a gas grill, lounge seating and uninterrupted sunset views. Two bedrooms each pack two beds plus a queen sofa bed, so cousins, couples and best friends all have a place to land. Inside: a designer kitchen, premium linens, smart TVs and a LOVE wall that's launched a thousand vacation photos. Beach essentials, chairs and umbrellas included.",
    amenities: ["Private hot tub","Deck + grill","Steps to the Gulf","Beach essentials provided","Designer kitchen","Premium linens","Fast Wi-Fi","Smart TV","Washer & dryer","Central A/C"],
    highlights: [
      { icon: "🛁", title: "Private hot tub", body: "Enclosed spa with neon sign and string lights." },
      { icon: "🌅", title: "Sunset deck", body: "Private deck with gas grill and Gulf views." },
      { icon: "📸", title: "Insta-worthy", body: "LOVE wall, neon signs, curated decor." },
    ],
  },
  {
    slug: "stpete-sunsoaked",
    hospitableId: "a47c8440-1ab4-4619-981d-cb2dfb682304",
    airbnbUrl: "https://www.airbnb.com/rooms/1059505409560170081",
    lat: 27.78670054, lng: -82.6392708,
    alt: "St Petersburg Florida sun-soaked designer 2-bedroom condo near downtown",
    location: "St. Petersburg, FL",
    title: "Sun-Soaked | 2BR · 1BA · Sleeps 6",
    description: "Walk to downtown St. Pete — light-filled 2BR designer condo with two king beds, sleeps 6. Steps to Central Ave restaurants and Crescent Lake.",
    bedrooms: 2, bathrooms: 1, sleeps: 6,
    feature: "Sofa Bed Incl.",
    rating: 4.9, reviews: 78,
    categories: ["City"],
    href: "https://seaandcityrentals.hospitable.rentals/",
    directBookingUrl: "https://seaandcityrentals.hospitable.rentals/listings/119e8731-1dec-5f42-ad4d-c62951cb0b37",
    tagline: "Stylish downtown condo, walk to Central Ave.",
    longDescription: "A sun-soaked 2-bedroom designer condo in the heart of downtown St. Petersburg — and one of the easiest yes-trips you'll book all year. Floor-to-ceiling light pours across white oak, soft linen and curated mid-century pieces, while two plush king beds and a queen sofa bed comfortably sleep six. Roll out of bed and walk to Central Avenue's coffee bars, breweries and chef-driven restaurants, jog the path around Crescent Lake or Uber five minutes to the St. Pete Pier and waterfront museums. An updated kitchen, premium linens, smart TV and fast Wi-Fi cover every base, whether you're planning a girls' weekend, a foodie escape or a remote-work refresh.",
    amenities: ["Two king beds + sofa bed","Designer interiors","Walk to Central Ave","Walk to Crescent Lake","Updated kitchen","Premium linens","Smart TV","Fast Wi-Fi","Washer & dryer","Central A/C"],
    highlights: [
      { icon: "🌞", title: "Sun-soaked", body: "Light-filled designer interiors." },
      { icon: "🍽️", title: "Walk everywhere", body: "Top restaurants and bars steps away." },
      { icon: "🛏️", title: "Sleeps 6", body: "Two king beds plus a sofa bed." },
    ],
  },
  {
    slug: "stpete-modern",
    hospitableId: "a6a553e4-e627-4431-a41a-36e62a267ba6",
    airbnbUrl: "https://www.airbnb.com/rooms/1059509222873395071",
    lat: 27.78670054, lng: -82.6392708,
    alt: "St Petersburg Florida modern 1-bedroom designer retreat with private balcony",
    location: "St. Petersburg, FL",
    title: "Modern Retreat | 1BR · Balcony · Sleeps 2",
    description: "Editorial 1BR St. Pete retreat with king bed, private balcony and chef kitchen — minutes to the waterfront. Adults-only escape for 2.",
    bedrooms: 1, bathrooms: 1, sleeps: 2,
    feature: "Private Balcony",
    rating: 4.86, reviews: 90,
    categories: ["City"],
    href: "https://seaandcityrentals.hospitable.rentals/",
    directBookingUrl: "https://seaandcityrentals.hospitable.rentals/listings/91ba6ef0-48c1-5fa2-a98c-20b9079cdec9",
    tagline: "Editorial luxury minutes from the waterfront.",
    longDescription: "A magazine-shoot of a 1-bedroom retreat tucked into one of St. Petersburg's most-loved neighborhoods — sage green walls, curated art, soft linen bedding and warm-wood accents make this the kind of stay couples extend by a night. A king bed anchors the bedroom, a spa-style bath invites long soaks, and the chef's kitchen is fully outfitted for slow espresso mornings and wine-and-charcuterie evenings. Step onto your private balcony for coffee under the palms, then walk or drive minutes to the St. Pete Pier, Crescent Lake, Central Avenue dining and the waterfront museums. Designed for two — anniversaries, babymoons, working creatives — and quietly perfect for every one of those.",
    amenities: ["King bed","Private balcony","Chef kitchen","Spa bath","Designer interiors","Smart TV","Fast Wi-Fi","Washer & dryer","Central A/C","Free parking"],
    highlights: [
      { icon: "🎨", title: "Designer spaces", body: "Sage green walls and curated art." },
      { icon: "🌿", title: "Private balcony", body: "Serene balcony with garden views." },
      { icon: "🌊", title: "Near waterfront", body: "Minutes from the St. Pete Pier." },
    ],
  },
  {
    slug: "stpete-hottub",
    hospitableId: "a581de1a-6c11-46ea-b8ce-73183ad2dd4e",
    airbnbUrl: "https://www.airbnb.com/rooms/1648677049685478716",
    lat: 27.78652257, lng: -82.63916485,
    alt: "St Petersburg Florida vacation rental with private outdoor hot tub and bamboo garden",
    location: "St. Petersburg, FL",
    title: "Private Hot Tub | 1BR · Sleeps 4",
    description: "St. Pete bungalow with private outdoor hot tub, bamboo garden and BBQ — sleeps 4, walk to downtown. King bed plus sofa bed.",
    bedrooms: 1, bathrooms: 1, sleeps: 4,
    feature: "Hot Tub + Sofa Bed",
    rating: 4.67, reviews: 9,
    categories: ["City"],
    href: "https://seaandcityrentals.hospitable.rentals/",
    directBookingUrl: "https://seaandcityrentals.hospitable.rentals/listings/6c832fe5-90a4-51eb-b382-13bb35b2c139",
    tagline: "Private hot tub and bamboo garden in the city.",
    longDescription: "A hidden-garden bungalow in the heart of St. Petersburg — picture a private outdoor hot tub bubbling beneath mature bamboo, a sun-warmed patio with BBQ, and just enough birdsong to forget you're three blocks from Central Avenue. Inside, a king bed and queen sofa bed sleep four across a thoughtfully renovated 1-bedroom layout with updated kitchen, smart TV, fast Wi-Fi and crisp white linens. Walk to downtown St. Pete restaurants, jog around Crescent Lake or drive twenty minutes to the Gulf beaches. The kind of small home that makes guests rebook the same week next year.",
    amenities: ["Private outdoor hot tub","Bamboo garden","BBQ","King bed + sofa bed","Updated kitchen","Walk to downtown","Smart TV","Fast Wi-Fi","Washer & dryer","Central A/C"],
    highlights: [
      { icon: "🛁", title: "Outdoor hot tub", body: "Soak under the stars in your bamboo garden." },
      { icon: "🎋", title: "Bamboo oasis", body: "Secluded backyard enclosed in mature bamboo." },
      { icon: "🍽️", title: "Walk downtown", body: "Minutes from St. Pete's best restaurants." },
    ],
  },
  {
    slug: "stpete-patio",
    hospitableId: "865c1555-746e-4496-8b2c-20f45659d020",
    airbnbUrl: "https://www.airbnb.com/rooms/1533433121539399451",
    lat: 27.7867277, lng: -82.6393307,
    alt: "St Petersburg Florida 1-bedroom rental with bold art, game room and open plan living",
    location: "St. Petersburg, FL",
    title: "Art & Character | 1BR · 3 Beds · Sleeps 6",
    description: "Bold St. Pete 1BR with statement art, dartboard game room and 3 beds — sleeps 6. Walk to downtown nightlife and Central Ave.",
    bedrooms: 1, bathrooms: 1, sleeps: 6,
    feature: "Game Room · 3 Beds",
    rating: 0, reviews: 0,
    categories: ["City"],
    badge: "New Listing",
    href: "https://seaandcityrentals.hospitable.rentals/",
    directBookingUrl: "https://seaandcityrentals.hospitable.rentals/listings/d60f44e9-181c-5c24-b9ca-ebf65a8d776e",
    tagline: "Bold art, game room, downtown charm.",
    longDescription: "A character-packed St. Pete bungalow that turns a 1-bedroom footprint into a six-guest playground — built for friend groups, bachelorettes and creative weekends downtown. Oversized abstract paintings climb the walls of an open-plan living room that flows into a custom dartboard game room and an updated kitchen ready for late dinners and morning mimosas. A king bed, queen sofa bed and futon comfortably sleep six, with smart TVs, fast Wi-Fi and crisp linens throughout. Walk to St. Pete's nightlife, Central Avenue restaurants and craft cocktail bars in minutes — Uber to the Pier or the Gulf in under twenty.",
    amenities: ["Game room with dartboard","Statement art throughout","Open plan living","King + sofa bed + futon","Updated kitchen","Walk to downtown","Smart TV","Fast Wi-Fi","Washer & dryer","Central A/C"],
    highlights: [
      { icon: "🎨", title: "Statement art", body: "Oversized abstract paintings throughout." },
      { icon: "🎯", title: "Game room", body: "Custom dartboard and lounge for groups." },
      { icon: "🍸", title: "Walk to bars", body: "Steps from St. Pete nightlife and dining." },
    ],
  },
];

export const properties: Property[] = data.map((p) => {
  const imgs = galleryFor(p.slug);
  const fallbackAlt = p.alt;
  const images = imgs.map((x) => x.src);
  const imageAlts = imgs.map((x) => x.alt || fallbackAlt);
  return { ...p, image: images[0] ?? "", images, imageAlts };
});

export const BOOK_DIRECT_URL = "https://seaandcityrentals.hospitable.rentals/";
export const HOSPITABLE_INQUIRY_URL = "https://seaandcityrentals.hospitable.rentals/";
export const PHONE = "248-766-2957";
export const BLOG_URL = "https://www.seaandcityrentals.com/blog";
export const SITE_URL = "https://www.seaandcityrentals.com";

import guideTampa from "@/assets/guide-tampa.jpg?format=webp&quality=85&as=url";
import guideStpete from "@/assets/guide-stpete.jpg?format=webp&quality=85&as=url";
import guideClearwater from "@/assets/guide-clearwater.jpg?format=webp&quality=85&as=url";

export type GuideItem = {
  type: string;
  name: string;
  desc: string;
  detail?: string;
};

export type GuideTip = {
  title: string;
  body: string;
};

export type GuideSection = {
  heading: string;
  items: GuideItem[];
  tip?: GuideTip;
};

export type Guide = {
  slug: string;
  city: string;
  state: string;
  tagline: string;
  hero: string;
  heroAlt: string;
  intro: string;
  knownFor: string[];
  sections: GuideSection[];
  driveTimes: { label: string; minutes: number }[];
};

export const guides: Guide[] = [
  {
    slug: "tampa",
    city: "Tampa",
    state: "FL",
    tagline: "Florida's bold city — waterfront dining, electric nightlife, world-class sports, and a thriving food scene.",
    hero: guideTampa,
    heroAlt: "Tampa Florida waterfront downtown skyline at golden hour",
    intro: "Florida's bold city — waterfront dining, electric nightlife, world-class sports, and a thriving food scene",
    knownFor: [
      "Tampa Riverwalk",
      "Ybor City historic district",
      "Bayshore Boulevard (longest continuous sidewalk in the U.S.)",
      "Amalie Arena & Raymond James Stadium",
      "Busch Gardens & ZooTampa",
      "Armature Works food hall",
    ],
    sections: [
      {
        heading: "Where to Eat",
        items: [
          {
            type: "Legendary Steakhouse",
            name: "Bern's Steak House",
            desc: "One of America's most famous steakhouses — dry-aged beef, an extraordinary wine cellar, and a legendary dessert room upstairs.",
            detail: "📍 1208 S Howard Ave",
          },
          {
            type: "Historic Cuban — Since 1905",
            name: "Columbia Restaurant",
            desc: "Florida's oldest restaurant in Ybor City. Flamenco shows, legendary Cuban sandwich, and incredible sangria.",
            detail: "📍 2117 E 7th Ave, Ybor City",
          },
          {
            type: "Food Hall",
            name: "Armature Works",
            desc: "Tampa's premier food hall in a stunning historic building on the Riverwalk. Dozens of top chef concepts in one place.",
            detail: "📍 1910 N Ola Ave",
          },
          {
            type: "Native Florida Cuisine",
            name: "Ulele",
            desc: "Farm-to-table Florida cuisine in a beautifully restored historic water works building on the Hillsborough River.",
            detail: "📍 1810 N Highland Ave",
          },
          {
            type: "Brunch & Coffee",
            name: "Oxford Exchange",
            desc: "Tampa's most beautiful cafe — stunning interior, bookstore, excellent brunch, and specialty coffee.",
            detail: "📍 420 W Kennedy Blvd",
          },
          {
            type: "Fine Dining",
            name: "Mise en Place",
            desc: "Tampa's most celebrated fine dining restaurant — elegant, locally-sourced tasting menus in a sophisticated setting.",
            detail: "📍 442 W Kennedy Blvd",
          },
        ],
        tip: {
          title: "🥙 Local Tip",
          body: "Tampa invented the Cuban sandwich — don't leave without trying one. La Segunda Central Bakery and the Columbia Restaurant are the gold standards. Ybor City's 7th Avenue is a must for food, culture, and people-watching.",
        },
      },
      {
        heading: "Nearest Beaches",
        items: [
          {
            type: "#1 US Beach — 45 min",
            name: "Clearwater Beach",
            desc: "Consistently America's top-rated beach. Stunning white sand, Pier 60, sunsets, and a lively beachfront strip.",
            detail: "🚗 45 min via Courtney Campbell Causeway",
          },
          {
            type: "Local Gem — 50 min",
            name: "Indian Rocks Beach",
            desc: "Quieter, more residential Gulf beach with great restaurants and gorgeous sunsets. Where some of our properties are!",
            detail: "🚗 50 min",
          },
          {
            type: "Classic Florida — 40 min",
            name: "St. Pete Beach",
            desc: "Wide sandy beach with a vibrant strip of bars and restaurants. Great for a full beach day with nightlife options.",
            detail: "🚗 40 min",
          },
          {
            type: "Pristine — 1 hr",
            name: "Caladesi Island",
            desc: "Accessible only by ferry — one of the most unspoiled beaches in Florida.",
            detail: "🚗 + Ferry, about 1 hr total",
          },
          {
            type: "Nature Beach — 55 min",
            name: "Fort De Soto",
            desc: "Stunning barrier island park with crystal water, kayaking, camping, and a beloved dog beach.",
            detail: "🚗 55 min",
          },
          {
            type: "State Park — 50 min",
            name: "Honeymoon Island",
            desc: "Beautiful state park beach with nature trails, osprey nests, and a calm family-friendly atmosphere.",
            detail: "🚗 50 min",
          },
        ],
        tip: {
          title: "🌊 Beach Tip",
          body: "Tampa Bay itself is not ideal for swimming but the Gulf beaches are world-class and within 45–60 minutes. Beat traffic by leaving before 9am or after 2pm. The Courtney Campbell Causeway offers stunning bay views on the way to Clearwater.",
        },
      },
      {
        heading: "Nightlife",
        items: [
          {
            type: "Historic Entertainment District",
            name: "Ybor City",
            desc: "Tampa's Latin Quarter transforms at night — dozens of bars, live music, clubs, and restaurants in historic brick buildings.",
            detail: "📍 7th Ave, Ybor City",
          },
          {
            type: "Waterfront Bars & Restaurants",
            name: "The Riverwalk",
            desc: "Tampa's stunning waterfront promenade lined with bars, restaurants, and venues. Beautiful at night.",
            detail: "📍 Downtown Tampa waterfront",
          },
          {
            type: "Upscale Neighborhood",
            name: "Hyde Park Village",
            desc: "Charming outdoor shopping and dining district with excellent cocktail bars for a sophisticated evening.",
            detail: "📍 S Dakota Ave & Swan Ave",
          },
          {
            type: "Dive Bar Legend",
            name: "The Hub",
            desc: "Tampa's most beloved dive bar — cheap drinks, friendly crowd, and a true local institution since 1947.",
            detail: "📍 719 N Franklin St",
          },
          {
            type: "Casual Bar & Grill",
            name: "Green Iguana",
            desc: "Multiple locations, great happy hours, and a lively crowd. A Tampa staple for casual drinks and food.",
            detail: "📍 Multiple Tampa locations",
          },
          {
            type: "Live Events",
            name: "Amalie Arena District",
            desc: "Home of the Tampa Bay Lightning. Dozens of bars cluster around the arena on game nights — electric atmosphere.",
            detail: "📍 401 Channelside Dr",
          },
        ],
        tip: {
          title: "🎉 Nightlife Tip",
          body: "Ybor City is Tampa's nightlife heartbeat — especially Thursday through Saturday. It's walkable, affordable, and has something for everyone from dive bars to dance clubs. Download the Lime scooter app for easy transport between Ybor, downtown, and the Riverwalk.",
        },
      },
      {
        heading: "Fitness & Wellness",
        items: [
          {
            type: "Running & Walking — Free",
            name: "Tampa Riverwalk",
            desc: "Tampa's stunning 2.4-mile waterfront trail connecting museums, parks, and restaurants along the Hillsborough River.",
            detail: "📍 Downtown Tampa",
          },
          {
            type: "Iconic Run — Free",
            name: "Bayshore Boulevard",
            desc: "The world's longest continuous sidewalk — 4.5 miles of waterfront running and walking with stunning bay views.",
            detail: "📍 Bayshore Blvd",
          },
          {
            type: "Park & Trails — Free",
            name: "Al Lopez Park",
            desc: "Beautiful 132-acre park with a lake, trails, sports facilities, and a public pool.",
            detail: "📍 4810 N Himes Ave",
          },
          {
            type: "Rock Climbing Gym",
            name: "Elevate Climbing",
            desc: "Tampa's premier indoor climbing gym with bouldering, top rope, lead walls, and fitness equipment.",
            detail: "📍 4421 N Himes Ave",
          },
          {
            type: "Yoga — Drop-In Friendly",
            name: "YogaSix Tampa",
            desc: "Modern yoga studio offering multiple styles with drop-in options. Great for stretching out after travel.",
            detail: "📍 Multiple Tampa locations",
          },
          {
            type: "Soccer & Sports Complex",
            name: "Rowdies Training Ground",
            desc: "Multiple sports courts and fields available for public use. Great for active groups.",
            detail: "📍 Al Lang Stadium area",
          },
        ],
        tip: {
          title: "🚴 Active Tip",
          body: "Bayshore Boulevard is a Tampa institution — locals run, walk, and bike it daily. At 4.5 miles one way it's perfect for a longer workout with stunning views of Tampa Bay. Go early morning to beat the Florida heat.",
        },
      },
      {
        heading: "Things To Do",
        items: [
          {
            type: "Theme Park & Zoo",
            name: "Busch Gardens Tampa",
            desc: "World-class theme park with thrilling roller coasters, African animals, and live entertainment. All ages.",
            detail: "📍 10165 N McKinley Dr",
          },
          {
            type: "Marine Life",
            name: "Florida Aquarium",
            desc: "One of the top aquariums in the US with sharks, rays, otters, and daily dive shows.",
            detail: "📍 701 Channelside Dr",
          },
          {
            type: "Culture & History",
            name: "Ybor City Historic District",
            desc: "Tampa's landmark Latin Quarter with cigar factories, museums, street art, and incredible food and nightlife.",
            detail: "📍 7th Ave, Ybor City",
          },
          {
            type: "Scenic Boat Tour",
            name: "Tampa Bay Water Taxi",
            desc: "Hop-on hop-off water taxi connecting downtown Tampa, Channelside, Hyde Park, and the Riverwalk.",
            detail: "📍 Multiple stops downtown",
          },
          {
            type: "Families",
            name: "Glazer Children's Museum",
            desc: "Award-winning hands-on museum for kids with 170 interactive exhibits across 53,000 sq ft.",
            detail: "📍 110 W Gasparilla Plaza",
          },
          {
            type: "Wildlife",
            name: "ZooTampa at Lowry Park",
            desc: "One of the top-rated zoos in the US with manatees, Florida wildlife, and incredible exhibits.",
            detail: "📍 1101 W Sligh Ave",
          },
        ],
        tip: {
          title: "⚡ Local Tip",
          body: "Check the Tampa Bay Lightning, Rays, and Buccaneers schedules — catching a game is one of the best Tampa experiences. Amalie Arena is electric on Lightning game nights. Book tickets early as popular games sell out fast.",
        },
      },
    ],
    driveTimes: [
      { label: "Tampa International Airport", minutes: 15 },
      { label: "St. Petersburg Pier", minutes: 30 },
      { label: "Clearwater Beach", minutes: 45 },
      { label: "Indian Rocks Beach", minutes: 40 },
    ],
  },
  {
    slug: "st-petersburg",
    city: "St. Petersburg",
    state: "FL",
    tagline: "The Sunshine City — arts, beaches, world-class food, and some of the best sunsets in America.",
    hero: guideStpete,
    heroAlt: "St. Petersburg Florida pier and waterfront at sunset",
    intro: "The Sunshine City — arts, beaches, world-class food, and some of the best sunsets in America",
    knownFor: [
      "The St. Pete Pier (1,800-ft destination pier)",
      "Salvador Dalí Museum",
      "Central Avenue dining & nightlife",
      "Florida Holocaust Museum & Museum of Fine Arts",
      "Crescent Lake & Old Northeast neighborhood",
      "Tropicana Field (Tampa Bay Rays)",
    ],
    sections: [
      {
        heading: "Where to Eat",
        items: [
          {
            type: "Waterfront Dining",
            name: "Postcard Inn Beach Resort",
            desc: "Classic Florida beach vibes with cold drinks and fresh seafood right on the water.",
            detail: "📍 6300 Gulf Blvd, St. Pete Beach",
          },
          {
            type: "Mexican / Cocktails",
            name: "Red Mesa Cantina",
            desc: "Vibrant downtown cantina with creative tacos, killer margaritas, and a buzzy atmosphere.",
            detail: "📍 128 3rd St S, Downtown",
          },
          {
            type: "Rooftop Bar & Restaurant",
            name: "The Birchwood",
            desc: "Elegant rooftop with sweeping bay views, craft cocktails, and an upscale menu.",
            detail: "📍 340 Beach Dr NE",
          },
          {
            type: "Food Hall / Gourmet",
            name: "Locale Market",
            desc: "St. Pete's premier food hall — chefs, artisan goods, fresh pastries, and coffee all under one roof.",
            detail: "📍 179 2nd Ave N",
          },
          {
            type: "Italian Fine Dining",
            name: "Il Ritorno",
            desc: "Intimate and elegant Italian with housemade pasta and impeccable service. One of St. Pete's finest.",
            detail: "📍 1001 S Howard Ave",
          },
          {
            type: "French-American Bistro",
            name: "Cassis American Brasserie",
            desc: "Sophisticated brasserie on Beach Drive with a beautiful patio overlooking the waterfront park.",
            detail: "📍 170 Beach Dr NE",
          },
        ],
        tip: {
          title: "🍳 Local Tip",
          body: "Beach Drive is St. Pete's most scenic dining corridor — perfect for a leisurely stroll with cocktail in hand. Go weekday evenings to avoid weekend crowds. The Saturday Morning Market (Oct–May) on the waterfront is a must for local food and coffee.",
        },
      },
      {
        heading: "Nearest Beaches",
        items: [
          {
            type: "Classic Gulf Beach — 10 min",
            name: "St. Pete Beach",
            desc: "One of America's most consistently rated beaches. Wide white sand, calm warm water, and a lively strip of bars and restaurants.",
            detail: "🚗 10 min from downtown",
          },
          {
            type: "Nature Beach — 25 min",
            name: "Fort De Soto Park",
            desc: "Stunning undeveloped barrier island with crystal water, kayaking, camping, and a dog beach. Rated #1 in the US.",
            detail: "🚗 25 min south",
          },
          {
            type: "Quiet & Historic — 20 min",
            name: "Pass-a-Grille Beach",
            desc: "Quaint historic village at the southern tip of St. Pete Beach. Less crowded, charming Old Florida feel.",
            detail: "🚗 20 min",
          },
          {
            type: "Lively Beach Town — 15 min",
            name: "Treasure Island",
            desc: "Vibrant beach community with great restaurants, beach bars, and a wide sandy shore. Great for groups.",
            detail: "🚗 15 min",
          },
          {
            type: "Gulf Gem — 30 min",
            name: "Indian Rocks Beach",
            desc: "Where several of our properties are located! Quieter, local feel with gorgeous sunsets and walkable dining.",
            detail: "🚗 30 min",
          },
          {
            type: "Award-Winning — 35 min",
            name: "Clearwater Beach",
            desc: "TripAdvisor's #1 US beach. Stunning white sand, Pier 60, and plenty of water sports and dining.",
            detail: "🚗 35 min",
          },
        ],
        tip: {
          title: "🌅 Sunset Tip",
          body: "St. Pete sunsets are legendary. Head to the St. Pete Pier, Spa Beach, or any Gulf-facing beach around 7–8pm in summer. Fort De Soto's north beach faces west and is one of the best sunset spots in the entire state.",
        },
      },
      {
        heading: "Nightlife",
        items: [
          {
            type: "The Main Strip",
            name: "Central Avenue",
            desc: "St. Pete's heartbeat — over 30 bars, restaurants, and live music venues stretching from downtown to the beach.",
            detail: "📍 Central Ave, Downtown",
          },
          {
            type: "Craft Beer Bar",
            name: "The Ale and the Witch",
            desc: "Over 300 craft beers, great outdoor seating, and a relaxed vibe. A local institution on Beach Drive.",
            detail: "📍 111 2nd Ave NE",
          },
          {
            type: "Outdoor Concert Venue",
            name: "Jannus Live",
            desc: "Iconic open-air venue hosting national acts in an intimate courtyard setting. Check their calendar.",
            detail: "📍 200 1st Ave N",
          },
          {
            type: "Rooftop Bar",
            name: "The Floridian Social Club",
            desc: "Stunning rooftop with panoramic city and bay views. Great craft cocktails and weekend DJs.",
            detail: "📍 515 Central Ave",
          },
          {
            type: "Cocktail Bar",
            name: "Mandarin Hide",
            desc: "Moody speakeasy-style cocktail bar known for expertly crafted drinks and an intimate atmosphere.",
            detail: "📍 231 Central Ave",
          },
          {
            type: "Craft Brewery",
            name: "Green Bench Brewing",
            desc: "St. Pete's beloved neighborhood brewery with a huge outdoor beer garden.",
            detail: "📍 1133 Baum Ave N",
          },
        ],
        tip: {
          title: "🍸 Nightlife Tip",
          body: "The Grand Central District on Central Ave between 16th and 31st streets is more local and less touristy than downtown. Uber/Lyft are easy and affordable — don't drive after a night out.",
        },
      },
      {
        heading: "Fitness & Wellness",
        items: [
          {
            type: "Running & Walking — Free",
            name: "Crescent Lake Park",
            desc: "Beautiful lakeside park with a 1-mile loop, fitness equipment, and tennis courts. A neighborhood gem.",
            detail: "📍 Crescent Lake Dr NE",
          },
          {
            type: "Public Pool — Affordable",
            name: "North Shore Aquatic Complex",
            desc: "Olympic-size outdoor pool with lap swimming and classes open to the public.",
            detail: "📍 901 N Shore Dr NE",
          },
          {
            type: "Yoga Studio",
            name: "Yoga Birds",
            desc: "Welcoming community yoga studio offering drop-in classes for all levels.",
            detail: "📍 Multiple St. Pete locations",
          },
          {
            type: "Walk / Run / Bike — Free",
            name: "The St. Pete Pier",
            desc: "The iconic pier offers a stunning half-mile walk over the bay. Bike rentals available on site.",
            detail: "📍 800 2nd Ave NE",
          },
          {
            type: "CrossFit — Drop-In Friendly",
            name: "CrossFit St. Pete",
            desc: "Drop-in friendly CrossFit box with experienced coaches and a welcoming community.",
            detail: "📍 Multiple locations",
          },
          {
            type: "Cycling & Running — Free",
            name: "Pinellas Trail",
            desc: "75-mile paved trail connecting St. Pete to Clearwater and beyond. Perfect for cyclists and runners.",
            detail: "📍 Multiple access points",
          },
        ],
        tip: {
          title: "💪 Active Tip",
          body: "The Pinellas Trail runs 75 miles and is perfect for cycling, running, or skating. The St. Pete segment is beautiful and connects all the way to Clearwater. Rent bikes from local shops for $20–30/day.",
        },
      },
      {
        heading: "Things To Do",
        items: [
          {
            type: "World-Class Art",
            name: "The Dali Museum",
            desc: "Home to the largest Dali collection outside Europe. Stunning building, mind-bending art — a must-see.",
            detail: "📍 1 Dali Blvd",
          },
          {
            type: "Waterfront Destination",
            name: "St. Pete Pier",
            desc: "Reimagined waterfront destination with restaurants, shops, an aquarium, kayak rentals, and incredible views.",
            detail: "📍 800 2nd Ave NE",
          },
          {
            type: "Historic Botanical Garden",
            name: "Sunken Gardens",
            desc: "One of Florida's oldest roadside attractions — lush tropical gardens with exotic plants and flamingos.",
            detail: "📍 1825 4th St N",
          },
          {
            type: "Farmers Market — Seasonal",
            name: "Saturday Morning Market",
            desc: "Florida's largest outdoor market (Oct–May) with 150+ vendors, live music, fresh food, and artisan goods.",
            detail: "📍 Al Lang Field, waterfront",
          },
          {
            type: "Water Sports",
            name: "Kayaking & Paddleboarding",
            desc: "Explore the mangroves and bay by kayak or SUP. Several outfitters offer guided tours near the Pier.",
            detail: "📍 Multiple launch points",
          },
          {
            type: "Art & Culture",
            name: "Museum of Fine Arts",
            desc: "Spanning 5,000 years of art history with rotating exhibitions and a beautiful permanent collection.",
            detail: "📍 255 Beach Dr NE",
          },
        ],
        tip: {
          title: "🎨 Local Tip",
          body: "St. Pete is Florida's arts capital — the SHINE Mural Festival has painted hundreds of murals across the city. Pick up a mural map at the Visitor Center or just wander the Grand Central and Warehouse Districts for incredible street art.",
        },
      },
    ],
    driveTimes: [
      { label: "St. Pete-Clearwater Airport (PIE)", minutes: 20 },
      { label: "Tampa International Airport", minutes: 30 },
      { label: "Clearwater Beach", minutes: 35 },
      { label: "Pass-a-Grille Beach", minutes: 25 },
    ],
  },
  {
    slug: "clearwater-beach",
    city: "Clearwater Beach",
    state: "FL",
    tagline: "America's best beaches, world-famous sunsets, fresh seafood, and the ultimate Gulf-coast escape.",
    hero: guideClearwater,
    heroAlt: "Aerial view of Clearwater Beach Florida with Pier 60, white sand and Gulf hotels",
    intro: "America's best beaches, world-famous sunsets, fresh seafood, and the ultimate Gulf Coast lifestyle",
    knownFor: [
      "Pier 60 (sunset festival, fishing pier)",
      "Sugar-white sand & shallow Gulf",
      "Frenchy's Original Cafe",
      "Caladesi Island (ferry from Honeymoon Island)",
      "Sand Key Park",
      "Clearwater Marine Aquarium (Winter the dolphin)",
    ],
    sections: [
      {
        heading: "Where to Eat",
        items: [
          {
            type: "Iconic Beach Bar",
            name: "Frenchy's Rockaway Grill",
            desc: "Clearwater Beach institution since 1981. Fresh grouper sandwiches, cold beer, and feet-in-the-sand dining.",
            detail: "📍 7 Rockaway St, Clearwater Beach",
          },
          {
            type: "Waterfront Seafood",
            name: "The Salty Pelican",
            desc: "Relaxed waterfront bar with excellent fresh seafood and gorgeous sunset views over the Intracoastal.",
            detail: "📍 Georgia Ave, Indian Rocks Beach",
          },
          {
            type: "Seafood Landmark",
            name: "Crabby Bill's",
            desc: "A Gulf Coast tradition — fresh local seafood, stone crab claws in season, and ice cold beer on the water.",
            detail: "📍 401 Gulf Blvd, Indian Rocks Beach",
          },
          {
            type: "Beachfront Dining",
            name: "Palm Pavilion",
            desc: "Clearwater Beach's oldest beach bar (1926) with a full menu, frozen drinks, and you can't get closer to the sand.",
            detail: "📍 10 Bay Esplanade, Clearwater Beach",
          },
          {
            type: "Italian on the Beach",
            name: "Sea-Guini",
            desc: "Upscale Italian right on Clearwater Beach — housemade pasta, fresh seafood, and a romantic atmosphere.",
            detail: "📍 483 Mandalay Ave",
          },
          {
            type: "Beach Casual",
            name: "Clear Sky Cafe",
            desc: "Beloved local spot with a great breakfast, fresh seafood, and a wraparound porch perfect for people-watching.",
            detail: "📍 490 Mandalay Ave, Clearwater Beach",
          },
        ],
        tip: {
          title: "🦞 Local Tip",
          body: "Stone crab season runs October through May — don't miss it. Crabby Bill's and The Salty Pelican serve them fresh. For the ultimate Clearwater experience, grab a grouper sandwich from Frenchy's and eat it with your feet in the sand.",
        },
      },
      {
        heading: "The Beaches",
        items: [
          {
            type: "#1 Rated US Beach",
            name: "Clearwater Beach",
            desc: "Powder-white sand, warm clear Gulf water, Pier 60, and a lively beachfront strip. Consistently America's top beach.",
            detail: "📍 Clearwater Beach island",
          },
          {
            type: "Local Favorite",
            name: "Indian Rocks Beach",
            desc: "Quieter, more residential feel with gorgeous sunsets, walkable dining, and a relaxed Old Florida vibe. Our home turf!",
            detail: "📍 Gulf Blvd, Indian Rocks Beach",
          },
          {
            type: "Hidden Gem",
            name: "Indian Shores",
            desc: "Less crowded neighbor to IRB with beautiful wide beach and great shelling. Locals' favorite secret.",
            detail: "📍 Gulf Blvd, Indian Shores",
          },
          {
            type: "Pristine Wilderness",
            name: "Caladesi Island",
            desc: "Accessible by ferry only — one of Florida's last untouched barrier islands with crystal water and no crowds.",
            detail: "Ferry from Honeymoon Island",
          },
          {
            type: "State Park Beach",
            name: "Honeymoon Island",
            desc: "Gorgeous state park with nature trails, osprey nests, a dog beach, and beautiful Gulf swimming.",
            detail: "📍 #1 Causeway Blvd, Dunedin",
          },
          {
            type: "Local Beach — Free Parking",
            name: "Sand Key Park",
            desc: "Beautiful county park beach with free parking (rare!), calm water, and a much more local crowd.",
            detail: "📍 1060 Gulf Blvd",
          },
        ],
        tip: {
          title: "🌅 Sunset Tip",
          body: "Pier 60 at Clearwater Beach hosts a nightly sunset celebration with street performers, artisans, and musicians — it starts 2 hours before sunset and is completely free. Indian Rocks Beach sunsets are equally stunning with far fewer crowds.",
        },
      },
      {
        heading: "Nightlife",
        items: [
          {
            type: "Beachfront Club",
            name: "Shephard's Beach Resort",
            desc: "Clearwater Beach's premier outdoor entertainment venue — live music, beach bar, and dancing with Gulf views.",
            detail: "📍 619 S Gulfview Blvd",
          },
          {
            type: "Nightly Free Event",
            name: "Pier 60 Sunset Celebration",
            desc: "Street performers, live music, and artists every evening starting 2 hours before sunset. Totally free.",
            detail: "📍 Pier 60, Clearwater Beach",
          },
          {
            type: "Beach Bar",
            name: "The Beachcomber",
            desc: "Laid-back beach bar with live music, great cocktails, and a crowd that knows how to have fun.",
            detail: "📍 1390 Gulf Blvd, Clearwater Beach",
          },
          {
            type: "Indian Rocks Bar",
            name: "Sandbar Grille IRB",
            desc: "IRB's best local bar — cold drinks, live music on weekends, and a no-pretense relaxed vibe.",
            detail: "📍 Gulf Blvd, Indian Rocks Beach",
          },
          {
            type: "Craft Beer Town — 20 min",
            name: "Dunedin Downtown",
            desc: "Charming walkable downtown with Dunedin Brewery, 7venth Sun, wine bars, and a fantastic local food scene.",
            detail: "🚗 20 min north",
          },
          {
            type: "Waterfront Bar",
            name: "Whiskey Joe's",
            desc: "Lively waterfront bar with live entertainment, great happy hour specials, and a fun outdoor deck.",
            detail: "📍 Tampa Bay area",
          },
        ],
        tip: {
          title: "🍺 Nightlife Tip",
          body: "For something more local and less touristy than Clearwater Beach bars, head to Dunedin — one of Florida's most charming small towns just 20 minutes north. The craft beer scene there is excellent.",
        },
      },
      {
        heading: "Fitness & Wellness",
        items: [
          {
            type: "Cycling & Running — Free",
            name: "Pinellas Trail",
            desc: "75-mile paved trail running the length of Pinellas County. Perfect for cycling, running, or skating.",
            detail: "📍 Multiple access points",
          },
          {
            type: "Shoreline Workouts — Free",
            name: "Beach Running",
            desc: "Both Clearwater Beach and Indian Rocks Beach offer beautiful hard-packed shoreline for morning runs.",
            detail: "📍 Any beach access point",
          },
          {
            type: "Water Sports",
            name: "Paddleboard & Kayak Rentals",
            desc: "Rent paddleboards or kayaks and explore the calm Intracoastal waterway for a great full-body workout.",
            detail: "📍 Multiple IRB & Clearwater locations",
          },
          {
            type: "Beach Yoga — Seasonal",
            name: "Clearwater Beach Yoga",
            desc: "Local instructors offer beachfront yoga sessions around sunrise. Check local Facebook groups for schedules.",
            detail: "📍 Various beach locations",
          },
          {
            type: "Full Gym — Day Pass",
            name: "Gold's Gym Clearwater",
            desc: "Full-service gym with day passes available. Modern equipment and classes.",
            detail: "📍 Multiple Clearwater locations",
          },
          {
            type: "Kayak Launch — Free",
            name: "Dunedin Causeway",
            desc: "Free public beach and kayak launch connecting to Caladesi and Honeymoon Islands.",
            detail: "📍 Dunedin Causeway Blvd",
          },
        ],
        tip: {
          title: "🏄 Water Sports Tip",
          body: "The calm Intracoastal waters behind the beach islands are perfect for paddleboarding and kayaking — much easier than ocean paddling. Several outfitters near Indian Rocks Beach offer hourly rentals for $15–25/hr.",
        },
      },
      {
        heading: "Things To Do",
        items: [
          {
            type: "Marine Life & Rescue",
            name: "Clearwater Marine Aquarium",
            desc: "Home of Winter the Dolphin. Inspiring marine rescue facility with up-close animal encounters.",
            detail: "📍 249 Windward Passage",
          },
          {
            type: "Waterfront Hub",
            name: "Pier 60",
            desc: "Clearwater's iconic pier with shops, food, fishing, bait, and the famous nightly Sunset Celebration.",
            detail: "📍 1 Causeway Blvd",
          },
          {
            type: "Gulf Adventures",
            name: "Dolphin & Boat Tours",
            desc: "Multiple operators offer dolphin watching, snorkeling, and sunset cruises from Clearwater Beach marina.",
            detail: "📍 Clearwater Beach Marina",
          },
          {
            type: "Day Trip — 30 min",
            name: "Tarpon Springs Sponge Docks",
            desc: "Florida's fascinating Greek heritage sponge fishing village with authentic restaurants, shops, and boat tours.",
            detail: "🚗 30 min north",
          },
          {
            type: "Beach & Nature",
            name: "Dunedin Causeway",
            desc: "Free public beach and kayak launch with stunning views toward Caladesi and Honeymoon Islands.",
            detail: "📍 Dunedin Causeway Blvd",
          },
          {
            type: "Eco Education",
            name: "Moccasin Lake Nature Park",
            desc: "Beautiful nature center with rescued wildlife, nature trails, and educational programs. A local gem.",
            detail: "📍 2750 Park Trail Ln, Clearwater",
          },
        ],
        tip: {
          title: "🐬 Local Tip",
          body: "Dolphins are everywhere in the Gulf and Intracoastal — you will likely spot them from the beach or on any boat tour. For the best chance, take a morning kayak on the Intracoastal behind Indian Rocks Beach around sunrise. They are incredibly active in the early hours.",
        },
      },
    ],
    driveTimes: [
      { label: "St. Pete-Clearwater Airport (PIE)", minutes: 15 },
      { label: "Tampa International Airport", minutes: 35 },
      { label: "St. Petersburg downtown", minutes: 35 },
      { label: "Indian Rocks Beach", minutes: 15 },
    ],
  },
];

export const guideBySlug = (slug: string) => guides.find((g) => g.slug === slug);

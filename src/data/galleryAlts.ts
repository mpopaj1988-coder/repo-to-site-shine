// Per-property gallery: conversion-optimized order + SEO alt text.
// Each entry references the source filename in src/assets/properties/<slug>/.
// Files not listed here are appended at the end with a generic alt.

export type GalleryEntry = { file: string; alt: string };

export const galleryManifest: Record<string, GalleryEntry[]> = {
  // ===================== TAMPA =====================
  tampa: [
    // 1. HERO — illuminated palms reflected in pool at night, most dramatic shot
    { file: "IMG_7271.png", alt: "Three illuminated palm trees reflected in the heated pool at night at Tampa waterfront vacation rental" },
    // 2. EXTERIOR — property at sunset with pink sky, circular driveway and palms
    { file: "IMG_7270.png", alt: "Tampa vacation home exterior at sunset with pink and purple sky, circular driveway and palm trees" },
    // 3. OUTDOOR LIFESTYLE — freeform pool with paver deck, blue lounge chairs and tropical landscaping
    { file: "IMG_7268.png", alt: "Heated freeform pool with paver deck, blue lounge chairs and lush tropical landscaping at Tampa rental" },
    // 4. FEATURE — dedicated workspace with desk, smart TV and palm tree window views
    { file: "IMG_7269.png", alt: "Dedicated workspace with modern desk, wall-mounted smart TV and palm tree views at Tampa vacation rental" },
  ],

  // ===================== CLEARWATER =====================
  clearwater: [
    // 1. HERO — daytime pool, bright and inviting, reliable render
    { file: "01.jpg", alt: "Sparkling pool with striped lounge chairs and blue sky at Clearwater 4-bedroom pool home" },
    // 2. DECISION: master bedroom with dramatic floral accent wall — most distinctive room, pull up for CTR
    { file: "04.jpg", alt: "Master bedroom with dramatic floral accent wall, tufted headboard, mirrored nightstands and crystal chandelier at Clearwater rental" },
    // 3. OUTDOOR: daytime pool, bright and inviting
    { file: "06.jpg", alt: "Daytime pool with lounge chairs, outdoor sofa, al-fresco dining table and palm tree at Clearwater 4-bedroom home" },
    // 4. DECISION: open living room with sectional
    { file: "13.jpg", alt: "Bright open living room with large sectional, teal drapes and smart TV at Clearwater 4-bedroom rental" },
    // 5. DECISION: sage king bedroom
    { file: "20.jpg", alt: "Spacious king bedroom with sage green walls, tufted headboard, gold accents and sitting chair at Clearwater vacation home" },
    // 6. DECISION: full kitchen with stainless appliances
    { file: "26.jpg", alt: "Full kitchen with stainless appliances, wooden cabinetry and barn door at Clearwater vacation home" },
    // 7. LIFESTYLE: outdoor patio at dusk with sectional and dining
    { file: "10.jpg", alt: "Outdoor patio at dusk with dark sectional, teal cushions, dining table and French doors lit from inside at Clearwater rental" },
    // 8. OUTDOOR: pool with lounge seating and dining umbrella
    { file: "28.jpg", alt: "Private pool and patio with lounge chairs, outdoor sofa and dining umbrella at Clearwater vacation home" },
    // 9. CONTEXT: front exterior at pink and purple sunset
    { file: "11.jpg", alt: "Front exterior of Clearwater 4-bedroom pool home at pink and purple sunset" },
    // 10. DECISION: dining nook with six-seat table and pool view
    { file: "15.jpg", alt: "Dining nook with six-seat table, kitchen and French door pool view at Clearwater family home" },
    // 11. DECISION: open dining and living with coastal art
    { file: "12.jpg", alt: "Open dining and living area with coastal art at Clearwater 4-bedroom rental" },
    // 12. DECISION: second king bedroom with green velvet duvet
    { file: "21.jpg", alt: "King bedroom with tufted headboard, green velvet duvet, gold pillow and round mirrors at Clearwater family rental" },
    // 13. DECISION: twin queen family bedroom
    { file: "18.jpg", alt: "Twin queen bedroom with green bedspreads and beach boardwalk artwork at Clearwater rental" },
    // 14. DECISION: floral queen bedroom
    { file: "05.jpg", alt: "Queen bedroom with bold floral wallpaper accent wall and pink accents at Clearwater vacation home" },
    // 15. DECISION: blue accent wall bedroom with workspace
    { file: "25.jpg", alt: "Blue accent wall bedroom with workspace desk and white dresser at Clearwater family home" },
    // 16. DETAIL: gallery wall and kitchen view
    { file: "14.jpg", alt: "Open living area with gallery wall and kitchen view at Clearwater vacation home" },
    // 17. OUTDOOR: pool at twilight with string lights and dining
    { file: "02.jpg", alt: "Heated pool glowing at twilight with string lights, outdoor dining and lounge chairs at Clearwater family rental" },
    // 18. OUTDOOR: pool at dusk with teal umbrella
    { file: "07.jpg", alt: "Pool and patio at dusk with lounge seating, dining and teal umbrella at Clearwater rental" },
    // 19. OUTDOOR: daytime pool with palm tree and OJ on lounge
    { file: "09.jpg", alt: "Daytime pool view with palm trees and orange juice on lounge at Clearwater family vacation home" },
    // 20. UTILITY: bathroom with round mirror and seashell curtain
    { file: "27.jpg", alt: "Bathroom with round mirror, pendant lights, natural light and seashell shower curtain at Clearwater rental" },
    // 21. UTILITY: guest bathroom with modern vanity
    { file: "23.jpg", alt: "Guest bathroom with modern vanity and oval mirror at Clearwater 4-bedroom pool home" },
  ],

  // ===================== LARGO =====================
  largo: [
    // 1. HERO — fire pit at night showing fire pit + lit gazebo + glowing pool in one frame
    { file: "02.jpg", alt: "Fire pit with red Adirondack chairs, lit gazebo and glowing pool at twilight at Largo rental" },
    // 2. KEY FEATURE: pool with cascading waterfall feature
    { file: "01.jpg", alt: "Heated pool with cascading waterfall feature and tropical palms at Largo vacation home" },
    // 3. DECISION: king bedroom with navy velvet headboard — pull up from position 10
    { file: "14.jpg", alt: "King bedroom with navy velvet headboard and gold frame at Largo vacation rental" },
    { file: "IMG_3856.jpeg", alt: "Coastal bunk and twin room with nautical art, striped rug and beach decor at Largo home" },
    // 4. DECISION: designer kitchen with gray cabinetry and rattan stools
    { file: "12.jpg", alt: "Designer kitchen with gray cabinetry, quartz island and rattan stools at Largo home" },
    // 5. DECISION: open living room with large sectional
    { file: "04.jpg", alt: "Open living room with large sectional sofas and smart TV at Largo 3-bedroom home" },
    // 6. LIFESTYLE: gazebo breakfast with string lights and croissants
    { file: "06.jpg", alt: "Gazebo breakfast table with string lights, croissants and fresh juice at Largo rental" },
    // 7. LIFESTYLE: pink flamingo float in pool at dusk
    { file: "10.jpg", alt: "Pink flamingo float in glowing pool at dusk with palm tree at Largo vacation home" },
    // 8. LIFESTYLE: kitchen island breakfast spread
    { file: "07.jpg", alt: "Chef kitchen island with croissant breakfast spread and quartz counters at Largo rental" },
    // 9. LIFESTYLE: dining with charcuterie and wine
    { file: "09.jpg", alt: "Open dining and living area with charcuterie, wine and coastal art at Largo vacation home" },
    // 10. LIFESTYLE: candlelit dinner table
    { file: "08.jpg", alt: "Candlelit dining table with wine, flowers and cozy living room at Largo family rental" },
    // 11. DECISION: twin queen bedroom with green velvet headboards
    { file: "IMG_3851.png", alt: "Twin queen bedroom with dark green velvet headboards and blush bedding at Largo rental" },
    // 12. OUTDOOR: covered lanai with pool view
    { file: "03.jpg", alt: "Covered lanai with coastal sectional and pool view through sliding door at Largo home" },
    // 14. OUTDOOR: covered patio with blue lounge seating
    { file: "05.jpg", alt: "Covered outdoor patio with blue lounge seating and pool access at Largo rental" },
  ],

  // ===================== IRB-A =====================
  "irb-a": [
    // 1. HERO — hot tub with neon sign, champagne, lifestyle magic
    { file: "01.jpg", alt: "Private hot tub with neon The Perfect Place sign, champagne, candles and flower wall at Indian Rocks Beach rental" },
    // 2. BEACH USP: sunset deck with cocktails — pull up dramatically from position 17
    { file: "F2CA30AB-7AC0-488C-A950-F6B0DF50CD03.png", alt: "Sunset deck with grill, cocktails, food and string lights at Indian Rocks Beach rental" },
    // 3. BEACH USP: beach chairs and umbrella steps from the Gulf — pull up from position 18
    { file: "E7270DEA-D439-47E4-AA79-37F96A90CA1A.png", alt: "Beach chairs and umbrella steps from Indian Rocks Beach Gulf shore vacation rental" },
    // 4. DECISION: open-plan dining and kitchen with lotus chandelier
    { file: "IMG_3214.jpeg", alt: "Open-plan dining and kitchen with blue toile chairs, lotus chandelier, marble backsplash and coastal living room at IRB beach house" },
    // 5. DECISION: dining close-up with gold lotus chandelier
    { file: "IMG_3205.jpeg", alt: "Dining area with gold lotus chandelier, blue toile chairs and white kitchen with marble backsplash at IRB vacation home" },
    // 6. DECISION: primary bedroom
    { file: "AAF38287-D5E4-4FF6-9BA5-ADDD91281130.png", alt: "Primary bedroom with wood headboard, mirrored wardrobe and tropical window light at Indian Rocks Beach vacation home" },
    // 7. DECISION: spa bathroom with navy tile and gold fixtures
    { file: "IMG_3207.jpeg", alt: "Luxury bathroom with navy blue tile walls, gold fixtures, marble vanity and glass walk-in shower at Indian Rocks Beach rental" },
    // 8. LIFESTYLE: LOVE wall photo moment
    { file: "D6E0639F-15A2-4D1F-B007-BB945C0F2190.png", alt: "LOVE wall with red rose letters, swing chair, hanging vines and lanterns at Indian Rocks Beach rental" },
    // 9. LIFESTYLE: hot tub with bougainvillea from outside
    { file: "IMG_3218.jpeg", alt: "Private hot tub with neon The Perfect Place sign surrounded by pink bougainvillea at Indian Rocks Beach rental" },
    // 10. DECISION: bright coastal living room
    { file: "IMG_3211.jpeg", alt: "Bright coastal living room with white rattan TV cabinet, beach art and fresh pink hydrangeas at Indian Rocks Beach rental" },
    // 11. DECISION: second bedroom
    { file: "C7C224BA-FC54-4A48-95D3-A4A5423BF343.png", alt: "Second bedroom with wood headboard, blue accent bedding and tropical natural light at IRB beach house" },
    // 12. DECISION: marble spa bathroom
    { file: "IMG_3215.jpeg", alt: "Spa bathroom with white marble vanity, round mirror, gold sconce, glass shower and fresh flowers at IRB vacation home" },
    // 13. DETAIL: entry view into kitchen and living room
    { file: "IMG_3219.jpeg", alt: "Entry view into white kitchen with brass pendants, stainless appliances and coastal living room at Indian Rocks Beach rental" },
    // 14. LIFESTYLE: boardwalk at sunset
    { file: "04.jpg", alt: "Sunset over the boardwalk to Indian Rocks Beach with Please Leave Nothing But Footprints sign and string lights" },
    // 15. DETAIL: living room additional angle
    { file: "AD8DF012-611A-48A4-8465-CE12427AB071.png", alt: "Coastal living room with light blue sectional, white rattan media cabinet and beach art at IRB beach house" },
    // 16. DETAIL: white kitchen with brass pendants
    { file: "06.jpg", alt: "White kitchen with marble counters, brass pendants and blue toile dining area at Indian Rocks Beach rental" },
    // 17. UTILITY: in-unit washer and dryer
    { file: "IMG_3220.png", alt: "In-unit washer and dryer laundry area at Indian Rocks Beach vacation home" },
  ],

  // ===================== IRB-B =====================
  "irb-b": [
    // 1. HERO — hot tub with Relax & Unwind sign, swing chair, styled spa room
    { file: "02.jpg", alt: "Private hot tub with Relax and Unwind sign, hanging swing chair and lounge chairs at Indian Rocks Beach rental" },
    // 2. LIFESTYLE: LOVE wall photo moment
    { file: "D6E0639F-15A2-4D1F-B007-BB945C0F2190.png", alt: "LOVE wall with swing chair, string lights and floral letters at IRB beach house" },
    // 3. OUTDOOR: sunny deck with rocking chairs — pull up for beach-home feel
    { file: "01.jpg", alt: "Sunny deck with rocking chairs, grill and tropical plants at Indian Rocks Beach 2-bedroom rental" },
    // 4. BEACH USP: boardwalk at sunset — pull up to show beach proximity
    { file: "D418CD98-830A-4162-98E1-5F36F1745A96.png", alt: "Sunset beach boardwalk with colorful footprints sign and string lights at Indian Rocks Beach" },
    // 5. BEACH USP: beach chairs and umbrella included
    { file: "03.jpg", alt: "Beach chairs, umbrella and essentials included at Indian Rocks Beach rental" },
    // 6. DECISION: white kitchen with teal dishwasher and marble counters
    { file: "34E5FEBF-2DA2-4C93-B2B2-C01604D0E790.png", alt: "Bright white kitchen with teal dishwasher, marble counters and palm tree views at Indian Rocks Beach rental" },
    // 7. DECISION: coastal living room with blue sectional
    { file: "E81C752F-60B6-4601-A9F6-294225D83DD2.png", alt: "Coastal living room with blue sectional, Beach House sign and smart TV at IRB vacation home" },
    // 8. DECISION: bright dining nook with gold chandelier
    { file: "B7604E1F-97BB-4EAA-9C6A-8463DC7C8722.png", alt: "Bright dining nook with round white table and gold chandelier at Indian Rocks Beach rental" },
    // 9. DECISION: primary bedroom with wicker headboard
    { file: "29-DSC_9367.jpg", alt: "Primary bedroom with wicker headboard, floral coastal bedding and mirrored wardrobe at IRB beach house" },
    // 10. DECISION: queen bedroom with smart TV
    { file: "31-DSC_9381 2.jpg", alt: "Queen bedroom with smart TV and coastal bedding at Indian Rocks Beach vacation home" },
    // 11. DETAIL: hallway view of both bedrooms
    { file: "04.jpg", alt: "Hallway view of both bedroom suites with coastal bedding at Indian Rocks Beach 2-bedroom rental" },
    // 12. DECISION: designer bathroom with marble vanity and scallop tile floor
    { file: "07.jpg", alt: "Designer bathroom with marble vanity, oval mirror, gold fixtures and scallop tile floor at IRB rental" },
    // 13. DECISION: dark hexagonal mosaic tile shower
    { file: "08.jpg", alt: "Dramatic dark hexagonal mosaic tile shower with gold mirror vanity at Indian Rocks Beach beach house" },
    // 14. DECISION: second bathroom with white marble and mosaic tile
    { file: "32-DSC_9402.jpg", alt: "Second bathroom with white marble vanity and mosaic tile walk-in shower at IRB rental" },
    // 15. DETAIL: mosaic shower close-up with rain head
    { file: "09.jpg", alt: "Mosaic tile walk-in shower with rain head at IRB 2-bedroom beach house" },
    // 16. DETAIL: hot tub room additional angle
    { file: "10.jpg", alt: "Private hot tub room with hanging chair and lounge seating at Indian Rocks Beach coastal home" },
  ],

  // ===================== STPETE-HOTTUB =====================
  "stpete-hottub": [
    // 1. HERO — outdoor hot tub with red neon sign and champagne
    { file: "01.jpg", alt: "Private hot tub with red neon The Perfect Place sign, champagne bucket and bamboo garden at St. Pete bungalow" },
    // 2. DECISION: living room with gray sectional
    { file: "04.jpg", alt: "Living room with gray sectional, teal accent cushions and smart TV at downtown St. Pete bungalow" },
    // 3. DECISION: updated white kitchen
    { file: "05.jpg", alt: "Updated white kitchen with granite counters and stainless appliances at St. Pete vacation rental" },
    // 4. CONTEXT: twilight exterior with green uplighting — moved up from position 4
    { file: "03.jpg", alt: "Twilight exterior of St. Pete vacation rental with palm trees and green uplighting" },
    // 5. DECISION: king bedroom with blue duvet
    { file: "06.jpg", alt: "King bedroom with blue duvet, landscape art and smart TV at St. Pete hot tub rental" },
    // 6. LIFESTYLE: bamboo-enclosed garden patio with bistro seating
    { file: "02.jpg", alt: "Bamboo-enclosed garden patio with polka-dot bistro table and chairs at St. Pete bungalow" },
    // 7. DECISION: marble walk-in shower
    { file: "07.jpg", alt: "Marble walk-in shower with glass enclosure and modern vanity at St. Pete 1-bedroom rental" },
    // 8. UTILITY: kitchen and stacked washer-dryer
    { file: "08.jpg", alt: "Kitchen and stacked washer-dryer laundry area at St. Pete bungalow rental" },
    // 9. LIFESTYLE/NEIGHBORHOOD: Crescent Lake park at sunset
    { file: "09.jpg", alt: "Crescent Lake park at sunset with bench and water reflections near St. Pete vacation rental" },
  ],

  // ===================== STPETE-MODERN =====================
  "stpete-modern": [
    // 1. HERO — sage green living room with cloud sectional and built-in TV wall
    { file: "03.jpg", alt: "Luxury living room with sage green walls, cloud sectional, built-in wood TV wall and mountain art at St. Pete modern retreat" },
    // 2. LIFESTYLE: private balcony — defining feature, moved up from position 6
    { file: "02.jpg", alt: "Private balcony with daybed bench, snake plant and yellow flowers overlooking tree canopy at St. Pete rental" },
    // 3. DECISION: king bedroom with peach accent wall and balcony access
    { file: "08.jpg", alt: "King bedroom with peach accent wall, pink blossom art, balcony access and morning light at St. Pete retreat" },
    // 4. DECISION: living room with balcony door open to tree views
    { file: "04.jpg", alt: "Sage living room with cloud sectional, balcony door open to tree views and palm plant at St. Pete modern retreat" },
    // 5. DECISION: high-end black and white kitchen with island
    { file: "05.jpg", alt: "High-end black and white kitchen with large island, gold bar stools and professional range hood at St. Pete rental" },
    // 6. DECISION: designer bathroom with charcoal tile and walk-in shower
    { file: "06.jpg", alt: "Designer bathroom with charcoal tile, wood-plank wall, vessel sink and walk-in shower at St. Pete retreat" },
    // 7. DETAIL: galley kitchen with Amalfi Coast art
    { file: "07.jpg", alt: "Galley kitchen with white marble counters, induction cooktop and Amalfi Coast art at St. Pete modern rental" },
  ],

  // ===================== STPETE-PATIO =====================
  "stpete-patio": [
    // 1. HERO — living room with oversized abstract painting, bold USP for this "art & character" listing
    { file: "08.jpg", alt: "Living room with oversized abstract painting, blue accent chair and smart TV at St. Pete downtown rental" },
    // 2. CONTEXT: twilight exterior showing distinctive arched doorway and green uplighting
    { file: "02.jpg", alt: "Twilight exterior of St. Pete bungalow with palm trees, arched doorway and green uplighting" },
    // 3. DECISION: open living and dining with blue sofa
    { file: "01.jpg", alt: "Open living and dining with blue sofa, abstract art and kitchen view at St. Pete bungalow" },
    // 4. DECISION: king bedroom with blue velvet headboard
    { file: "06.jpg", alt: "King bedroom with blue velvet headboard and burgundy bedding at St. Pete downtown rental" },
    // 5. DECISION: bright sitting nook with purple chaise — distinctive feature
    { file: "04.jpg", alt: "Bright sitting nook with purple chaise, gallery wall and arched window at St. Pete rental" },
    // 6. CONTEXT: wide exterior shot at night showing full building
    { file: "05.jpg", alt: "Twilight exterior of St. Pete bungalow with palm trees and uplighting" },
    // 7. DECISION: walk-in shower with dark granite vanity
    { file: "07.jpg", alt: "Walk-in shower with glass enclosure and dark granite vanity at St. Pete bungalow" },
    // 8. DETAIL: custom dartboard game room — deprioritized (tight crop, show last)
    { file: "03.jpg", alt: "Custom dartboard game room with scoreboards at St. Pete 1-bedroom vacation rental" },
  ],

  // ===================== STPETE-SUNSOAKED =====================
  "stpete-sunsoaked": [
    // 1. HERO — luxury living room: first impression, shows full scale of the space
    { file: "01.jpg", alt: "Luxury living room with cream sectional, sage drapes, gallery wall and balcony access at downtown St. Pete condo" },
    // 2. DECISION: primary king bedroom — sleep quality is the #1 booking decision
    { file: "05.jpg", alt: "King bedroom with white bedding, city skyline TV art and workspace desk at St. Pete sun-soaked condo" },
    // 3. DECISION: second king bedroom — two kings is the key differentiator for couples/groups
    { file: "08.jpg", alt: "Second king bedroom with wood accent wall, city skyline art, St. Pete travel vibes at downtown condo" },
    // 4. DECISION: spa bathroom — premium bath converts luxury seekers
    { file: "06.jpg", alt: "Spa bathroom with backlit LED mirror, dark tile, wood plank wall and rain shower at St. Pete condo" },
    // 5. LIFESTYLE: balcony — the "sunsoaked" promise, aspirational close
    { file: "03.jpg", alt: "Private balcony with bistro seating and downtown St. Pete neighbourhood views" },
    // 6. SUPPORTING: second living room angle with sage green accent wall
    { file: "04.jpg", alt: "Modern living room with sage green accent walls, built-in shelving and St. Pete skyline art at downtown rental" },
    // 7. DETAIL: built-in workspace for remote workers
    { file: "07.jpg", alt: "Built-in workspace with wood wall, city skyline TV and storage at St. Pete sun-soaked rental" },
  ],
};

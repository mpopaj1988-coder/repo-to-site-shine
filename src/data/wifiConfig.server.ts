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
};

export const WIFI_CONFIG: Record<string, PropertyHouseInfo> = {
  tampa: {
    propertyName: "Waterfront 6BR Tampa",
    wifiNetwork: "SeaCity_Tampa",
    wifiPassword: "FILL_IN_PASSWORD",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Free parking in the driveway — room for 4 cars.",
    trash: "Trash pickup: Mondays. Bins are in the garage.",
    address: "Tampa, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "tampa",
    notes: [
      "Please lock all doors and windows when you leave.",
      "Pool heat is on and ready to enjoy — dial on the pool box if you'd like to adjust.",
      "Leave all keys on the kitchen counter at checkout.",
      "BBQ propane is pre-filled — just turn the knob and ignite.",
    ],
  },
  largo: {
    propertyName: "Luxury Pool Home Largo",
    wifiNetwork: "SeaCity_Largo",
    wifiPassword: "FILL_IN_PASSWORD",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Park in the driveway — fits 3 cars.",
    trash: "Trash pickup: Tuesdays. Bins along the side of the house.",
    address: "Largo, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "clearwater-beach",
    notes: [
      "Lock the front door and back gate at checkout.",
      "Pool heat is on — the waterfall can be toggled from the pool panel.",
      "Leave keys on the kitchen island.",
      "Indian Rocks Beach is 5 minutes away — beach chairs are in the garage.",
    ],
  },
  "irb-b": {
    propertyName: "Walk to Beach — IRB Cottage",
    wifiNetwork: "SeaCity_IRB_B",
    wifiPassword: "FILL_IN_PASSWORD",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Two parking spots in the carport.",
    trash: "Trash pickup: Wednesdays. Bin on the left side of the property.",
    address: "Indian Rocks Beach, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "clearwater-beach",
    notes: [
      "Beach access is straight down the street — 45 seconds on foot.",
      "Beach chairs, umbrellas, and toys are in the storage closet on the deck.",
      "Hot tub temp is set to 102°F — turn the jets on with the button on the tub.",
      "Please rinse sandy feet at the outdoor shower before coming inside.",
      "Leave keys in the lockbox at checkout.",
    ],
  },
  clearwater: {
    propertyName: "Family Pool Home Clearwater",
    wifiNetwork: "SeaCity_Clearwater",
    wifiPassword: "FILL_IN_PASSWORD",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Driveway accommodates 4 vehicles.",
    trash: "Trash pickup: Thursdays. Bins are in the side yard.",
    address: "Clearwater, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "clearwater-beach",
    notes: [
      "Pool heat is on — thermometer is in the equipment box on the side of the house.",
      "Clearwater Beach is 9 minutes by car.",
      "Lock the front door and back gate at checkout — leave keys on the counter.",
      "The bunk room TV remote is on the bedside shelf.",
    ],
  },
  "irb-a": {
    propertyName: "Walk to Beach — IRB Retreat",
    wifiNetwork: "SeaCity_IRB_A",
    wifiPassword: "FILL_IN_PASSWORD",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Two parking spots in the designated spots.",
    trash: "Trash pickup: Wednesdays.",
    address: "Indian Rocks Beach, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "clearwater-beach",
    notes: [
      "Gulf access is steps away — beach essentials are in the storage area.",
      "The hot tub is enclosed on the deck — jets button is on the side panel.",
      "Please rinse off at the outdoor shower after the beach.",
      "Leave keys in the lockbox at checkout.",
    ],
  },
  "stpete-sunsoaked": {
    propertyName: "Sun-Soaked St. Pete Condo",
    wifiNetwork: "SeaCity_StPete_Sun",
    wifiPassword: "FILL_IN_PASSWORD",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "One assigned parking space — #12 in the lot.",
    address: "St. Petersburg, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "st-petersburg",
    notes: [
      "Central Ave restaurants are a 2-minute walk.",
      "Crescent Lake Park is 3 blocks away — great for a morning jog.",
      "Leave all keys on the kitchen counter at checkout.",
      "Building entrance code: check your booking confirmation.",
    ],
  },
  "stpete-modern": {
    propertyName: "Modern Retreat St. Pete",
    wifiNetwork: "SeaCity_StPete_Modern",
    wifiPassword: "FILL_IN_PASSWORD",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "One parking space — labeled in the lot.",
    address: "St. Petersburg, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "st-petersburg",
    notes: [
      "Step onto the balcony for morning coffee — palms and garden views.",
      "St. Pete Pier is a 5-minute drive or 15-minute walk.",
      "Leave keys on the entry table at checkout.",
    ],
  },
  "stpete-hottub": {
    propertyName: "Private Hot Tub Bungalow",
    wifiNetwork: "SeaCity_StPete_HotTub",
    wifiPassword: "FILL_IN_PASSWORD",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Street parking is free in front of the home.",
    trash: "Trash pickup: Fridays. Bin on the right side of the yard.",
    address: "St. Petersburg, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "st-petersburg",
    notes: [
      "Hot tub is pre-heated — the bamboo garden is yours all night.",
      "BBQ is in the backyard — propane is ready to go.",
      "Central Ave is a 3-block walk.",
      "Leave keys in the lockbox at checkout.",
    ],
  },
  "stpete-patio": {
    propertyName: "Art & Character Bungalow",
    wifiNetwork: "SeaCity_StPete_Patio",
    wifiPassword: "FILL_IN_PASSWORD",
    checkInTime: "4:00 PM",
    checkoutTime: "10:00 AM",
    parking: "Street parking directly in front.",
    address: "St. Petersburg, FL",
    emergencyContact: "248-766-2957",
    guideSlug: "st-petersburg",
    notes: [
      "Dartboard and game room are all yours — extra darts in the kitchen drawer.",
      "Downtown St. Pete nightlife is a short walk.",
      "Leave keys on the kitchen counter at checkout.",
    ],
  },
};

import QRCode from "qrcode";
import { mkdirSync } from "fs";

const SLUGS = {
  "tampa": "Waterfront 6BR Tampa",
  "largo": "Luxury Pool Home Largo",
  "irb-b": "Walk to Beach — IRB (Unit A)",
  "clearwater": "Family Pool Home Clearwater",
  "irb-a": "Walk to Beach — IRB (Unit B)",
  "stpete-sunsoaked": "Sun-Soaked St. Pete (Apt 1)",
  "stpete-modern": "Modern Retreat St. Pete (Apt 2)",
  "stpete-hottub": "Private Hot Tub Bungalow (Apt A)",
  "stpete-patio": "Art & Character Bungalow (Apt B)",
};

const BASE_URL = "https://seaandcityrentals.com/wifi";
const OUT = "/tmp/qr-codes";
mkdirSync(OUT, { recursive: true });

for (const [slug, name] of Object.entries(SLUGS)) {
  const url = `${BASE_URL}/${slug}`;
  const file = `${OUT}/${slug}.png`;
  await QRCode.toFile(file, url, {
    width: 600,
    margin: 2,
    color: { dark: "#1A3A4A", light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  });
  console.log(`✓ ${name}  →  ${url}`);
}

console.log(`\nDone — PNGs in ${OUT}`);

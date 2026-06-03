import * as React from "react";
import { render } from "@react-email/components";
import { writeFileSync, mkdirSync } from "fs";
import { WIFI_CONFIG } from "../src/data/wifiConfig.server";
import { template } from "../src/lib/email-templates/wifi-info";

const OUT = "/tmp/email-previews";
mkdirSync(OUT, { recursive: true });

for (const [slug, config] of Object.entries(WIFI_CONFIG)) {
  const data = {
    propertyName: config.propertyName,
    wifiNetwork: config.wifiNetwork,
    wifiPassword: config.wifiPassword,
    checkInTime: config.checkInTime,
    checkoutTime: config.checkoutTime,
    parking: config.parking,
    trash: config.trash,
    emergencyContact: config.emergencyContact,
    notes: config.notes,
    guideSlug: config.guideSlug,
    listingSlug: slug,
  };

  const html = await render(React.createElement(template.component, data));
  const subject = typeof template.subject === "function" ? template.subject(data) : template.subject;
  const file = `${OUT}/${slug}.html`;
  writeFileSync(file, html);
  console.log(`✓ ${slug} — ${subject}`);
}

console.log(`\nDone — files in ${OUT}`);

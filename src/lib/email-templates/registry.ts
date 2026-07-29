import type { ComponentType } from "react";
import { template as welcomeDiscount } from "./welcome-discount";
import { template as bookingConfirmation } from "./booking-confirmation";
import { template as bookingCancellation } from "./booking-cancellation";
import { template as wifiInfo } from "./wifi-info";
import { template as returningGuestCode } from "./returning-guest-code";
import { template as marketingWhyBookDirect } from "./marketing-why-book-direct";
import { template as marketingPropertyShowcase } from "./marketing-property-showcase";
import { template as marketingLastMinute } from "./marketing-last-minute";
import { template as marketingWeeklyReminder } from "./marketing-weekly-reminder";
import { template as postStayReview } from "./post-stay-review";
import { template as localTips } from "./local-tips";
import { template as guestgrowthLeadNotify } from "./guestgrowth-lead-notify";
import { template as bookingOwnerNotification } from "./booking-owner-notification";
import { template as pricelabsReport } from "./pricelabs-report";

export interface TemplateEntry {
  component: ComponentType<any>;
  subject: string | ((data: Record<string, any>) => string);
  displayName?: string;
  previewData?: Record<string, any>;
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string;
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  "welcome-discount": welcomeDiscount,
  "booking-confirmation": bookingConfirmation,
  "booking-cancellation": bookingCancellation,
  "wifi-info": wifiInfo,
  "returning-guest-code": returningGuestCode,
  "marketing-why-book-direct": marketingWhyBookDirect,
  "marketing-property-showcase": marketingPropertyShowcase,
  "marketing-last-minute": marketingLastMinute,
  // Registered under 8 distinct keys (all pointing to the same component) so
  // the drip loop's per-template "already sent" check tracks each week's
  // send separately instead of blocking every week after the first.
  "marketing-weekly-reminder-1": marketingWeeklyReminder,
  "marketing-weekly-reminder-2": marketingWeeklyReminder,
  "marketing-weekly-reminder-3": marketingWeeklyReminder,
  "marketing-weekly-reminder-4": marketingWeeklyReminder,
  "marketing-weekly-reminder-5": marketingWeeklyReminder,
  "marketing-weekly-reminder-6": marketingWeeklyReminder,
  "marketing-weekly-reminder-7": marketingWeeklyReminder,
  "marketing-weekly-reminder-8": marketingWeeklyReminder,
  "post-stay-review": postStayReview,
  "local-tips": localTips,
  "guestgrowth-lead-notify": guestgrowthLeadNotify,
  "booking-owner-notification": bookingOwnerNotification,
  "pricelabs-report": pricelabsReport,
};

import type { ComponentType } from "react";
import { template as welcomeDiscount } from "./welcome-discount";
import { template as bookingConfirmation } from "./booking-confirmation";
import { template as balanceReminder } from "./balance-reminder";

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
  "balance-reminder": balanceReminder,
};

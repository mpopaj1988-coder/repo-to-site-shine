import type { ComponentType } from 'react'
import { template as welcomeDiscount } from './welcome-discount'
import { template as bookingConfirmation } from './booking-confirmation'
import { template as bookingCancellation } from './booking-cancellation'
import { template as wifiInfo } from './wifi-info'
import { template as returningGuestCode } from './returning-guest-code'
import { template as marketingWhyBookDirect } from './marketing-why-book-direct'
import { template as marketingPropertyShowcase } from './marketing-property-showcase'
import { template as marketingLastMinute } from './marketing-last-minute'
import { template as guestgrowthLeadNotify } from './guestgrowth-lead-notify'
import { template as bookingOwnerNotification } from './booking-owner-notification'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome-discount': welcomeDiscount,
  'booking-confirmation': bookingConfirmation,
  'booking-cancellation': bookingCancellation,
  'wifi-info': wifiInfo,
  'returning-guest-code': returningGuestCode,
  'marketing-why-book-direct': marketingWhyBookDirect,
  'marketing-property-showcase': marketingPropertyShowcase,
  'marketing-last-minute': marketingLastMinute,
  'guestgrowth-lead-notify': guestgrowthLeadNotify,
  'booking-owner-notification': bookingOwnerNotification,
}

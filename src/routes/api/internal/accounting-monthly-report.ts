/**
 * Monthly P&L email — computes last month's numbers from
 * `accounting_transactions`, emails the owner, and stores a snapshot in
 * `accounting_monthly_reports`. Triggered from the 1st-of-month cron in
 * server.ts; also safe to call by hand with ?month=YYYY-MM to regenerate
 * or backfill a report.
 */

import * as React from "react";
import { render } from "@react-email/components";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { sendLovableEmail } from "@lovable.dev/email-js";
import { sendResendEmail } from "@/lib/resend-email";
import { TEMPLATES } from "@/lib/email-templates/registry";
import type { MonthlyPlReportProps } from "@/lib/email-templates/monthly-pl-report";
import {
  computeMonthlyPL,
  previousMonthString,
  monthLabel,
  saveMonthlyReportSnapshot,
} from "@/lib/accounting/pl.server";

const SUPABASE_URL = "https://bgollemualqrwfrxrmwx.supabase.co";
const SITE_NAME = "Sea & City Rentals";
const FROM_DOMAIN = "seaandcityrentals.com";
const SENDER_DOMAIN = "notify.seaandcityrentals.com";
const OWNER_EMAIL = "mpopaj1988@gmail.com";

function fmtMoney(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export const Route = createFileRoute("/api/internal/accounting-monthly-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          return Response.json({ error: "Server misconfigured" }, { status: 500 });
        }

        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
        if (token !== serviceKey) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const url = new URL(request.url);
        const month = url.searchParams.get("month") ?? previousMonthString();

        try {
          const pl = await computeMonthlyPL(month);

          const props: MonthlyPlReportProps = {
            monthLabel: monthLabel(month),
            totalIncome: fmtMoney(pl.totalIncome),
            totalExpenses: fmtMoney(pl.totalExpenses),
            netProfit: fmtMoney(pl.netProfit),
            income: pl.income.map((c) => ({ category: c.category, amount: fmtMoney(c.total) })),
            expenses: pl.expenses.map((c) => ({ category: c.category, amount: fmtMoney(c.total) })),
            transactionCount: pl.transactionCount,
            excludedTransferCount: pl.excludedTransferCount,
          };

          const emailTemplate = TEMPLATES["monthly-pl-report"];
          const element = React.createElement(emailTemplate.component, props);
          const html = await render(element);
          const text = await render(element, { plainText: true });
          const subject =
            typeof emailTemplate.subject === "function"
              ? emailTemplate.subject(props as Record<string, any>)
              : emailTemplate.subject;
          const messageId = crypto.randomUUID();

          const sb = createClient(SUPABASE_URL, serviceKey);
          const lovableApiKey = process.env.LOVABLE_API_KEY;
          const resendApiKey = process.env.RESEND_API_KEY;
          let emailed = false;

          if (lovableApiKey) {
            await sendLovableEmail(
              {
                to: OWNER_EMAIL,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                sender_domain: SENDER_DOMAIN,
                subject,
                html,
                text,
                purpose: "transactional",
                label: "monthly-pl-report",
                idempotency_key: `monthly-pl-${pl.month}`,
                message_id: messageId,
              },
              { apiKey: lovableApiKey, sendUrl: process.env.LOVABLE_SEND_URL },
            );
            emailed = true;
          } else if (resendApiKey) {
            await sendResendEmail(
              {
                to: OWNER_EMAIL,
                from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
                subject,
                html,
                text,
                reply_to: `vacation@${FROM_DOMAIN}`,
                idempotency_key: `monthly-pl-${pl.month}`,
                message_id: messageId,
              },
              { apiKey: resendApiKey },
            );
            emailed = true;
          } else {
            console.error(
              "No email provider configured (LOVABLE_API_KEY / RESEND_API_KEY) — monthly P&L not sent",
            );
          }

          if (emailed) {
            await sb.from("email_send_log").insert({
              message_id: messageId,
              template_name: "monthly-pl-report",
              recipient_email: OWNER_EMAIL,
              status: "sent",
            });
          }

          await saveMonthlyReportSnapshot(pl, emailed);

          return Response.json({ month: pl.month, emailed, netProfit: pl.netProfit });
        } catch (err) {
          console.error("Monthly P&L report failed", err);
          return Response.json({ error: "Report generation failed" }, { status: 500 });
        }
      },
    },
  },
});

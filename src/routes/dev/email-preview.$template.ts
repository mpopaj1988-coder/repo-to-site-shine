import * as React from "react";
import { render } from "@react-email/components";
import { createFileRoute } from "@tanstack/react-router";
import { TEMPLATES } from "@/lib/email-templates/registry";

export const Route = createFileRoute("/dev/email-preview/$template")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const entry = TEMPLATES[params.template];
        if (!entry) {
          const list = Object.keys(TEMPLATES).join(", ");
          return new Response(`Template "${params.template}" not found. Available: ${list}`, {
            status: 404,
            headers: { "Content-Type": "text/plain" },
          });
        }
        if (!entry.previewData) {
          return new Response(`Template "${params.template}" has no previewData defined.`, {
            status: 422,
            headers: { "Content-Type": "text/plain" },
          });
        }
        const html = await render(React.createElement(entry.component, entry.previewData));
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});

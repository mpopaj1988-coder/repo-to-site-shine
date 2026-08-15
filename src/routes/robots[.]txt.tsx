import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /api/",
          "Disallow: /admin/",
          "Disallow: /captions/",
          "Disallow: /guestgrowth-30day-captions.html",
          "Disallow: /*?*",
          "",
          "User-agent: GPTBot",
          "Disallow: /",
          "",
          "User-agent: CCBot",
          "Disallow: /",
          "",
          "Sitemap: https://www.seaandcityrentals.com/sitemap.xml",
          "",
        ].join("\n");
        return new Response(body, { headers: { "Content-Type": "text/plain" } });
      },
    },
  },
});

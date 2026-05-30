import { createFileRoute } from "@tanstack/react-router";
import { properties } from "@/data/properties";
import { getPublishedPostsForSitemap } from "@/lib/blog";

const SITE = "https://www.seaandcityrentals.com";

// Pages whose content rarely changes — use a stable date so crawlers can
// tell what actually changed vs. what is just dynamic output.
const STABLE_DATE = "2025-06-01";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const today = new Date().toISOString().split("T")[0];

        const staticUrls = [
          { path: "/", lastmod: today, freq: "daily", priority: "1.0" },
          { path: "/properties", lastmod: today, freq: "daily", priority: "0.9" },
          { path: "/reviews", lastmod: today, freq: "weekly", priority: "0.7" },
          { path: "/about", lastmod: STABLE_DATE, freq: "monthly", priority: "0.6" },
          { path: "/contact", lastmod: STABLE_DATE, freq: "monthly", priority: "0.6" },
          { path: "/explore", lastmod: STABLE_DATE, freq: "monthly", priority: "0.6" },
          { path: "/map", lastmod: STABLE_DATE, freq: "monthly", priority: "0.6" },
          { path: "/blog", lastmod: today, freq: "weekly", priority: "0.7" },
        ];

        const urls = [
          ...staticUrls.map(
            (u) =>
              `<url><loc>${SITE}${u.path}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.priority}</priority></url>`,
          ),
          ...properties.map(
            (p) =>
              `<url><loc>${SITE}/listings/${p.slug}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
          ),
          ...getPublishedPostsForSitemap().map(
            ({ slug, publishDate }) =>
              `<url><loc>${SITE}/blog/${slug}</loc><lastmod>${publishDate}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
          ),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});

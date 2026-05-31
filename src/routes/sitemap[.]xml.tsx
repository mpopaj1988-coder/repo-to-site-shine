import { createFileRoute } from "@tanstack/react-router";
import { properties } from "@/data/properties";
import { getAllPostSlugsForSitemap } from "@/lib/blog";

const SITE = "https://www.seaandcityrentals.com";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const staticPaths = [
          "/",
          "/properties",
          "/about",
          "/contact",
          "/explore",
          "/reviews",
          "/blog",
        ];
        const today = new Date().toISOString().split("T")[0];
        const urls = [
          ...staticPaths.map(
            (p) =>
              `<url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${p === "/" ? "1.0" : "0.7"}</priority></url>`,
          ),
          ...properties.map(
            (p) =>
              `<url><loc>${SITE}/listings/${p.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
          ),
          ...getAllPostSlugsForSitemap().map(
            (slug) =>
              `<url><loc>${SITE}/blog/${slug}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
          ),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { getPublishedPosts, getPostBySlug } from "@/lib/blog";
import { SITE_URL } from "@/data/properties";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/blog/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const posts = getPublishedPosts();
        const items = posts
          .map((meta) => {
            const post = getPostBySlug(meta.slug);
            const link = `${SITE_URL}/blog/${meta.slug}`;
            const pubDate = new Date(meta.publishDate).toUTCString();
            const html = post?.html ?? "";
            return `    <item>
      <title>${escapeXml(meta.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      ${meta.author ? `<author>${escapeXml(meta.author)}</author>` : ""}
      <description>${escapeXml(meta.description)}</description>
      ${meta.cover ? `<enclosure url="${escapeXml(meta.cover.startsWith("http") ? meta.cover : `${SITE_URL}${meta.cover}`)}" type="image/jpeg" />` : ""}
      <content:encoded><![CDATA[${html}]]></content:encoded>
    </item>`;
          })
          .join("\n");

        const lastBuild = posts[0]
          ? new Date(posts[0].publishDate).toUTCString()
          : new Date().toUTCString();

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Sea &amp; City Rentals — Travel Guides &amp; Local Tips</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Local guides, neighborhood picks and travel tips for Tampa, St. Petersburg, Clearwater and the Gulf beaches.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
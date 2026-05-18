import { createFileRoute, Link } from "@tanstack/react-router";
import { getPublishedPosts } from "@/lib/blog";
import { SITE_URL } from "@/data/properties";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/blog")({
  head: () => {
    const title = "Blog — Sea & City Rentals | Tampa Bay & Gulf Beach Travel Guides";
    const description =
      "Local guides, neighborhood picks and travel tips for Tampa, St. Petersburg, Clearwater and the Gulf beaches — written by Sea & City Rentals hosts.";
    const url = `${SITE_URL}/blog`;
    const image = `${SITE_URL}/og.jpg`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        // Open Graph
        { property: "og:type", content: "website" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "Sea & City Rentals" },
        { property: "og:locale", content: "en_US" },
        { property: "og:image", content: image },
        { property: "og:image:secure_url", content: image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: "Sea & City Rentals — Florida vacation rental travel guides" },
        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        { name: "twitter:image:alt", content: "Sea & City Rentals — Florida vacation rental travel guides" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": `${url}#blog`,
            url,
            name: "Sea & City Rentals Blog",
            description,
            inLanguage: "en-US",
            publisher: { "@id": `${SITE_URL}/#organization` },
            mainEntityOfPage: url,
          }),
        },
      ],
    };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const posts = getPublishedPosts();

  return (
    <div className="min-h-screen bg-background">
      <Header tone="light" />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            The Sea & City Blog
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Travel guides, neighborhood picks and local tips for your next Florida getaway.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">New posts coming soon — check back next week.</p>
        ) : (
          <ul className="grid gap-8">
            {posts.map((p) => (
              <li key={p.slug} className="border-b border-border pb-8 last:border-0">
                <Link to="/blog/$slug" params={{ slug: p.slug }} className="group block">
                  <time className="text-sm text-muted-foreground">
                    {new Date(p.publishDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                  <h2 className="mt-2 text-2xl font-semibold text-foreground group-hover:text-primary">
                    {p.title}
                  </h2>
                  {p.description && (
                    <p className="mt-2 text-muted-foreground">{p.description}</p>
                  )}
                  <span className="mt-3 inline-block text-sm font-medium text-primary">
                    Read more →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
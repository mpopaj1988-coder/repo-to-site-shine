import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPostBySlug } from "@/lib/blog";
import { SITE_URL } from "@/data/properties";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return {};
    const url = `${SITE_URL}/blog/${post.slug}`;
    return {
      meta: [
        { title: `${post.title} — Sea & City Rentals` },
        { name: "description", content: post.description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.description },
        { property: "og:url", content: url },
        { property: "og:site_name", content: "Sea & City Rentals" },
        { property: "og:locale", content: "en_US" },
        { property: "og:image", content: post.cover || `${SITE_URL}/og.jpg` },
        { property: "og:image:secure_url", content: post.cover || `${SITE_URL}/og.jpg` },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: post.title },
        { property: "article:published_time", content: post.publishDate },
        ...(post.author ? [{ property: "article:author", content: post.author }] : []),
        { property: "article:section", content: "Travel" },
        ...(post.tags ?? []).map((tag) => ({ property: "article:tag", content: tag })),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: post.description },
        { name: "twitter:image", content: post.cover || `${SITE_URL}/og.jpg` },
        { name: "twitter:image:alt", content: post.title },
        { name: "twitter:label1", content: "Published" },
        {
          name: "twitter:data1",
          content: new Date(post.publishDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
        ...(post.author
          ? [
              { name: "twitter:label2", content: "Written by" },
              { name: "twitter:data2", content: post.author },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "@id": `${url}#article`,
            headline: post.title,
            description: post.description,
            datePublished: post.publishDate,
            author: { "@type": "Organization", name: post.author ?? "Sea & City Rentals" },
            publisher: { "@id": `${SITE_URL}/#organization` },
            mainEntityOfPage: url,
            ...(post.cover ? { image: post.cover } : {}),
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header tone="light" />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-foreground">Post not found</h1>
        <p className="mt-3 text-muted-foreground">
          This post may not be published yet — check back soon.
        </p>
        <Link to="/blog" className="mt-6 inline-block text-primary hover:underline">
          ← Back to the blog
        </Link>
      </div>
    </div>
  ),
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <Header tone="light" />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary">
          ← All posts
        </Link>
        <article className="mt-6">
          <header className="mb-8 border-b border-border pb-8">
            <time className="text-sm text-muted-foreground">
              {new Date(post.publishDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {post.title}
            </h1>
            {post.description && (
              <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>
            )}
          </header>
          <div
            className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>
      </main>
    </div>
  );
}

import { marked } from "marked";

// Lightweight YAML-frontmatter parser (avoids gray-matter's Node Buffer dep).
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, content: raw };
  const [, yaml, content] = match;
  const data: Record<string, unknown> = {};
  for (const line of yaml.split(/\r?\n/)) {
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1];
    let value: unknown = m[2].trim();
    if (typeof value === "string") {
      const arr = /^\[(.*)\]$/.exec(value);
      if (arr) {
        value = arr[1]
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else {
        value = (value as string).replace(/^["']|["']$/g, "");
      }
    }
    data[key] = value;
  }
  return { data, content };
}

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  publishDate: string; // ISO date (YYYY-MM-DD)
  author?: string;
  cover?: string;
  tags?: string[];
  readingTime: number; // minutes, rounded up
};

export type BlogPost = BlogPostMeta & {
  html: string;
};

const rawModules = import.meta.glob("@/content/blog/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function slugFromPath(path: string): string {
  return path.split("/").pop()!.replace(/\.md$/, "");
}

function parseAll(): BlogPost[] {
  const posts: BlogPost[] = [];
  for (const [path, raw] of Object.entries(rawModules)) {
    const { data, content } = parseFrontmatter(raw);
    const slug = slugFromPath(path);
    const wordCount = content.trim().split(/\s+/).length;
    posts.push({
      slug,
      title: String(data.title ?? slug),
      description: String(data.description ?? ""),
      publishDate: String(data.publishDate ?? "1970-01-01"),
      author: data.author ? String(data.author) : undefined,
      cover: data.cover ? String(data.cover) : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
      readingTime: Math.max(1, Math.ceil(wordCount / 200)),
      html: marked.parse(content, { async: false }) as string,
    });
  }
  return posts;
}

const ALL_POSTS = parseAll();

function isPublished(p: BlogPostMeta, now = new Date()): boolean {
  return new Date(p.publishDate).getTime() <= now.getTime();
}

export function getPublishedPosts(): BlogPostMeta[] {
  return ALL_POSTS
    .filter((p) => isPublished(p))
    .sort((a, b) => b.publishDate.localeCompare(a.publishDate))
    .map(({ html: _html, ...meta }) => meta);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const post = ALL_POSTS.find((p) => p.slug === slug);
  if (!post || !isPublished(post)) return undefined;
  return post;
}

export function getAllPostSlugsForSitemap(): string[] {
  return ALL_POSTS.filter((p) => isPublished(p)).map((p) => p.slug);
}
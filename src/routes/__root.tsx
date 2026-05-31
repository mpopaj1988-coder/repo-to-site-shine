import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SITE_URL, PHONE } from "@/data/properties";
import { GA4_MEASUREMENT_ID } from "@/lib/analytics";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sea & City Rentals — Florida Vacation Rentals in Tampa, St. Pete & the Beaches" },
      {
        name: "description",
        content:
          "Beautifully furnished Florida vacation rentals in Tampa Bay, St. Petersburg, Clearwater, Largo and Indian Rocks Beach. Book direct and save up to 15% — no Airbnb fees.",
      },
      { name: "author", content: "Sea & City Rentals" },
      { name: "theme-color", content: "#152238" },
      { property: "og:site_name", content: "Sea & City Rentals" },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content: "Sea & City Rentals — Florida Vacation Rentals in Tampa, St. Pete & the Beaches",
      },
      {
        property: "og:description",
        content:
          "Beach escapes, waterfront homes and vibrant city retreats across Florida. Book direct & skip the platform fees.",
      },
      { property: "og:image", content: "https://www.seaandcityrentals.com/og.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Sea & City Rentals — Florida Vacation Rentals in Tampa, St. Pete & the Beaches",
      },
      {
        name: "twitter:description",
        content:
          "Hand-picked vacation rentals in Tampa Bay, St. Pete and the Gulf beaches. Book direct & save.",
      },
      { name: "twitter:image", content: "https://www.seaandcityrentals.com/og.jpg" },
      { name: "robots", content: "index,follow" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: "Sea & City Rentals",
              url: `${SITE_URL}/`,
              logo: `${SITE_URL}/og.jpg`,
              telephone: PHONE,
              areaServed: [
                "Tampa, FL",
                "St. Petersburg, FL",
                "Clearwater, FL",
                "Largo, FL",
                "Indian Rocks Beach, FL",
              ],
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              url: `${SITE_URL}/`,
              name: "Sea & City Rentals",
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
          ],
        }),
      },
      ...(GA4_MEASUREMENT_ID
        ? [
            {
              src: `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`,
              async: true,
            },
            {
              children: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${GA4_MEASUREMENT_ID}');`,
            },
          ]
        : []),
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

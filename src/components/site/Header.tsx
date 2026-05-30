import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BOOK_DIRECT_URL, PHONE } from "@/data/properties";
import { track } from "@/lib/analytics";

const links = [
  { to: "/properties", label: "Properties" },
  { to: "/map", label: "Map" },
  { to: "/about", label: "About" },
  { to: "/explore", label: "Explore" },
  { to: "/reviews", label: "Reviews" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

export function Header({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [open, setOpen] = useState(false);
  // "dark" = sits over a dark hero (default) → white text
  // "light" = sits over a light page (blog, etc.) → navy text on a sand strip
  const isLight = tone === "light";
  const wrapperClass = isLight
    ? "border-b border-border bg-[var(--color-sand)]"
    : "absolute inset-x-0 top-0 z-30";
  const logoClass = isLight
    ? "font-display text-2xl tracking-wide text-[var(--color-deep)]"
    : "font-display text-2xl tracking-wide text-white drop-shadow-md";
  const ampClass = isLight
    ? "italic text-[var(--color-gold)]"
    : "italic text-[var(--color-sea)]";
  const subClass = isLight
    ? "ml-1 text-sm font-sans uppercase tracking-[0.3em] text-[var(--color-deep)]/60"
    : "ml-1 text-sm font-sans uppercase tracking-[0.3em] text-white/70";
  const linkClass = isLight
    ? "text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-deep)]/75 transition hover:text-[var(--color-deep)]"
    : "text-xs font-medium uppercase tracking-[0.18em] text-white/85 transition hover:text-white";
  const linkActive = isLight
    ? { className: "text-[var(--color-deep)]" }
    : { className: "text-white" };
  const menuBtnClass = isLight ? "lg:hidden text-[var(--color-deep)]" : "lg:hidden text-white";

  return (
    <header className={wrapperClass}>
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10"
      >
        <Link to="/" data-testid="site-logo" className={logoClass}>
          Sea <span className={ampClass}>&amp;</span> City
          <span className={subClass}>Rentals</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={linkClass}
              activeProps={linkActive}
            >
              {l.label}
            </Link>
          ))}
          <a
            href={`tel:${PHONE.replace(/[^0-9]/g, "")}`}
            className={`hidden xl:block ${linkClass}`}
          >
            {PHONE}
          </a>
          <a
            href={BOOK_DIRECT_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("book_direct_click", { surface: "header_desktop" })}
            data-testid="header-book-direct-desktop"
            className="rounded-sm bg-[var(--color-gold)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-deep)] shadow-md transition hover:brightness-105"
          >
            Book Direct
          </a>
        </div>

        <button
          type="button"
          className={menuBtnClass}
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-7" />
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 bg-[var(--color-deep)]/97 lg:hidden">
          <div className="flex items-center justify-between px-6 py-6">
            <span className="font-display text-2xl text-white">Sea &amp; City</span>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-white">
              <X className="size-7" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-7 pt-12">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-[0.25em] text-white"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={BOOK_DIRECT_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("book_direct_click", { surface: "header_mobile" })}
              data-testid="header-book-direct-mobile"
              className="mt-4 rounded-sm bg-[var(--color-gold)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-deep)]"
            >
              Book Direct
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
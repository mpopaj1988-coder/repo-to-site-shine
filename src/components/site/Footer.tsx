import { Link } from "@tanstack/react-router";
import { BOOK_DIRECT_URL } from "@/data/properties";
import { track } from "@/lib/analytics";
import { FooterEmailSignup } from "./FooterEmailSignup";

export function Footer() {
  return (
    <footer className="bg-[var(--color-deep)] text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-5 lg:px-10">
        <div className="lg:col-span-2">
          <p className="font-display text-3xl">
            Sea <span className="italic text-[var(--color-sea)]">&amp;</span> City Rentals
          </p>
          <p className="mt-4 max-w-md text-sm text-white/70">
            Beautifully furnished vacation rentals across the Sunshine State — beach escapes,
            waterfront homes and vibrant city retreats. Personally hosted with heart.
          </p>
          <a
            href={BOOK_DIRECT_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => track("book_direct_click", { surface: "footer" })}
            data-testid="footer-book-direct"
            className="mt-6 inline-block rounded-sm bg-[var(--color-gold)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-deep)]"
          >
            Book Direct
          </a>
        </div>
        <nav aria-label="Footer navigation">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Explore</p>
          <ul className="mt-5 space-y-3 text-sm text-white/85">
            <li>
              <Link to="/properties" className="hover:text-[var(--color-sea)]">
                All Properties
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-[var(--color-sea)]">
                About
              </Link>
            </li>
            <li>
              <Link to="/explore" className="hover:text-[var(--color-sea)]">
                Neighborhood Guides
              </Link>
            </li>
            <li>
              <Link to="/reviews" className="hover:text-[var(--color-sea)]">
                Reviews
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-[var(--color-sea)]">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
            Locations
          </p>
          <ul className="mt-5 space-y-3 text-sm text-white/85">
            <li>Tampa, FL</li>
            <li>St. Petersburg, FL</li>
            <li>Clearwater, FL</li>
            <li>Largo, FL</li>
            <li>Indian Rocks Beach, FL</li>
          </ul>
        </div>
        <FooterEmailSignup />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-white/50 sm:flex-row lg:px-10">
          <p>© {new Date().getFullYear()} Sea &amp; City Rentals. All rights reserved.</p>
          <p>Florida vacation rentals · Tampa Bay · St. Pete · Gulf Beaches</p>
        </div>
      </div>
    </footer>
  );
}

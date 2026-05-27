import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyGalleryProps {
  images: string[];
  alts: string[];
  propertyAlt: string;
}

const SWIPE_THRESHOLD = 48;

// ─── drag / swipe hook ───────────────────────────────────────────────────────

function useSwipe(onPrev: () => void, onNext: () => void) {
  const drag = useRef<{ startX: number; active: boolean } | null>(null);
  const [delta, setDelta] = useState(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, active: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current?.active) return;
    setDelta(e.clientX - drag.current.startX);
  }, []);

  const commit = useCallback(
    (clientX: number) => {
      if (!drag.current) return;
      const d = clientX - drag.current.startX;
      drag.current = null;
      setDelta(0);
      if (d < -SWIPE_THRESHOLD) onNext();
      else if (d > SWIPE_THRESHOLD) onPrev();
    },
    [onNext, onPrev],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => commit(e.clientX), [commit]);
  const onPointerCancel = useCallback(() => {
    drag.current = null;
    setDelta(0);
  }, []);

  return { delta, isDragging: !!drag.current, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}

// ─── nav state ───────────────────────────────────────────────────────────────

function useNav(count: number) {
  const [idx, setIdx] = useState(0);
  const prev = useCallback(() => setIdx((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIdx((i) => (i + 1) % count), [count]);
  const goto = useCallback((i: number) => setIdx(i), []);
  return { idx, prev, next, goto };
}

// ─── thumbnail strip ─────────────────────────────────────────────────────────

function Thumbs({ images, active, onSelect }: { images: string[]; active: number; onSelect: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  return (
    <div
      ref={ref}
      className="flex gap-1.5 overflow-x-auto pb-0.5"
      style={{ scrollbarWidth: "none" }}
    >
      {images.map((src, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          aria-label={`Go to photo ${i + 1}`}
          className={cn(
            "h-14 w-[72px] shrink-0 overflow-hidden rounded-[2px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]",
            i === active ? "ring-2 ring-[var(--color-gold)] opacity-100" : "opacity-55 hover:opacity-85",
          )}
        >
          <img src={src} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}

// ─── nav buttons ─────────────────────────────────────────────────────────────

function NavBtn({ dir, onClick }: { dir: "prev" | "next"; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous photo" : "Next photo"}
      className={cn(
        "absolute top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full",
        "bg-black/40 text-white backdrop-blur-[3px] transition-colors hover:bg-black/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        dir === "prev" ? "left-3" : "right-3",
      )}
    >
      {dir === "prev" ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
    </button>
  );
}

// ─── inline gallery ──────────────────────────────────────────────────────────

function InlineGallery({
  images,
  alts,
  propertyAlt,
  idx,
  prev,
  next,
  goto,
  onExpand,
}: {
  images: string[];
  alts: string[];
  propertyAlt: string;
  idx: number;
  prev: () => void;
  next: () => void;
  goto: (i: number) => void;
  onExpand: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { delta, isDragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useSwipe(prev, next);

  const pct = isDragging && trackRef.current ? (delta / trackRef.current.offsetWidth) * 100 : 0;

  return (
    <div className="select-none">
      {/* Main frame */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-sm bg-[var(--color-deep)]">
        {/* Drag surface */}
        <div
          ref={trackRef}
          className="absolute inset-0 z-10 cursor-grab touch-pan-y active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          role="presentation"
        />

        {/* Slides — render index ±1 only */}
        {images.map((src, i) => {
          const offset = i - idx;
          if (Math.abs(offset) > 1) return null;
          return (
            <img
              key={src}
              src={src}
              alt={alts[i] ?? `${propertyAlt} — photo ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              style={{
                transform: `translateX(calc(${offset * 100}% + ${pct}%))`,
                transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          );
        })}

        <NavBtn dir="prev" onClick={(e) => { e.stopPropagation(); prev(); }} />
        <NavBtn dir="next" onClick={(e) => { e.stopPropagation(); next(); }} />

        {/* Counter */}
        <div className="absolute bottom-3 right-4 z-20 rounded-full bg-black/50 px-2.5 py-[3px] text-[11px] font-medium tracking-wider text-white backdrop-blur-[2px]">
          {idx + 1} / {images.length}
        </div>

        {/* Expand */}
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          aria-label="View fullscreen"
          className="absolute bottom-3 left-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-[2px] transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Maximize2 className="size-[15px]" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="mt-2.5">
        <Thumbs images={images} active={idx} onSelect={goto} />
      </div>
    </div>
  );
}

// ─── fullscreen modal ─────────────────────────────────────────────────────────

function FullscreenModal({
  images,
  alts,
  propertyAlt,
  idx,
  prev,
  next,
  goto,
  onClose,
}: {
  images: string[];
  alts: string[];
  propertyAlt: string;
  idx: number;
  prev: () => void;
  next: () => void;
  goto: (i: number) => void;
  onClose: () => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { delta, isDragging, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useSwipe(prev, next);

  const pct = isDragging && trackRef.current ? (delta / trackRef.current.offsetWidth) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery fullscreen"
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between px-5 py-3">
        <span className="text-[11px] uppercase tracking-[0.3em] text-white/50">
          {idx + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Close fullscreen gallery"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="size-6" />
        </button>
      </div>

      {/* Image area — fills remaining space */}
      <div className="relative min-h-0 flex-1 overflow-hidden select-none">
        <div
          ref={trackRef}
          className="absolute inset-0 z-10 cursor-grab touch-pan-y active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          role="presentation"
        />

        {images.map((src, i) => {
          const offset = i - idx;
          if (Math.abs(offset) > 1) return null;
          return (
            <div
              key={src}
              style={{
                transform: `translateX(calc(${offset * 100}% + ${pct}%))`,
                transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <img
                src={src}
                alt={alts[i] ?? `${propertyAlt} — photo ${i + 1}`}
                loading={i <= 1 ? "eager" : "lazy"}
                draggable={false}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          );
        })}

        <NavBtn dir="prev" onClick={(e) => { e.stopPropagation(); prev(); }} />
        <NavBtn dir="next" onClick={(e) => { e.stopPropagation(); next(); }} />
      </div>

      {/* Thumbnails */}
      <div className="shrink-0 px-4 pb-4 pt-3">
        <Thumbs images={images} active={idx} onSelect={goto} />
      </div>
    </div>
  );
}

// ─── public component ─────────────────────────────────────────────────────────

export function PropertyGallery({ images, alts, propertyAlt }: PropertyGalleryProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const inline = useNav(images.length);
  const modal = useNav(images.length);

  const openFullscreen = useCallback(() => {
    modal.goto(inline.idx);
    setFullscreen(true);
  }, [inline.idx, modal]);

  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  // Global keyboard for fullscreen modal
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
      else if (e.key === "ArrowRight") modal.next();
      else if (e.key === "ArrowLeft") modal.prev();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [fullscreen, closeFullscreen, modal]);

  // Keyboard for inline gallery (when fullscreen is closed)
  useEffect(() => {
    if (fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") inline.next();
      else if (e.key === "ArrowLeft") inline.prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen, inline]);

  return (
    <>
      <InlineGallery
        images={images}
        alts={alts}
        propertyAlt={propertyAlt}
        idx={inline.idx}
        prev={inline.prev}
        next={inline.next}
        goto={inline.goto}
        onExpand={openFullscreen}
      />

      {fullscreen && (
        <FullscreenModal
          images={images}
          alts={alts}
          propertyAlt={propertyAlt}
          idx={modal.idx}
          prev={modal.prev}
          next={modal.next}
          goto={modal.goto}
          onClose={closeFullscreen}
        />
      )}
    </>
  );
}

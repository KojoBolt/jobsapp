import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Pause, Play, Quote } from "lucide-react";
import Title from "./Title";
import { successStories, shortReviews } from "../../assets/dummy-data";

interface TestimonialsProps {
  /** Only pass these once they come from a real review platform. */
  rating?: number;
  reviewCount?: number;
  ratingSource?: string;
  ratingUrl?: string;
}

const spring = { type: "spring" as const, stiffness: 250, damping: 70, mass: 1 };

/* Monogram tones. All sit in the same muted register against the dark
   background, so a row of them reads as one designed set rather than a
   rainbow. Picked by name hash, so a person always gets the same one. */
const TONES = [
  "bg-indigo-500/15 text-indigo-300",
  "bg-violet-500/15 text-violet-300",
  "bg-sky-500/15 text-sky-300",
  "bg-teal-500/15 text-teal-300",
  "bg-amber-500/15 text-amber-300",
  "bg-rose-500/15 text-rose-300",
];

const toneFor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
};

/**
 * Headshot when the entry has one, monogram otherwise.
 *
 * The monogram isn't a gap waiting for any face: only three photographs ship
 * with the project and two are already on the story cards, so filling these
 * from the same pool would show one person as two different customers. Give an
 * entry a real `avatar` and it takes over; a failed load falls back here too.
 */
const Avatar = ({ name, src }: { name: string; src?: string }) => {
  const [broken, setBroken] = useState(false);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        onError={() => setBroken(true)}
        className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
      />
    );
  }

  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10
                  text-[12px] font-semibold ${toneFor(name)}`}
    >
      {initials}
    </span>
  );
};

const Stars = ({ rating }: { rating: number }) => (
  <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${
          i < rating ? "fill-indigo-400 text-indigo-400" : "text-white/15"
        }`}
      />
    ))}
  </span>
);

export default function Testimonials({
  rating,
  reviewCount,
  ratingSource,
  ratingUrl,
}: TestimonialsProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Auto-advance the strip. Pauses on hover and on the explicit control, and
  // wraps back to the start when it reaches the end.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + 300, behavior: "smooth" });
    }, 3500);
    return () => clearInterval(id);
  }, [paused]);

  const nudge = (dir: -1 | 1) =>
    trackRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  const showRating =
    typeof rating === "number" && typeof reviewCount === "number" && reviewCount > 0;

  return (
    <section id="testimonials" className="py-20 2xl:py-32">
      <div className="max-w-6xl mx-auto px-4">
        <Title
          title="Success Stories"
          heading="Real results from real people"
          description="Job seekers who stopped spending their evenings on applications — and started spending them preparing for interviews."
        />

        {/* Rendered only when real figures are supplied. */}
        {showRating && (
          <motion.a
            href={ratingUrl || undefined}
            target={ratingUrl ? "_blank" : undefined}
            rel="noreferrer"
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: 0.15 }}
            className="mx-auto -mt-10 mb-12 flex w-fit items-center gap-2.5 rounded-full border
                       border-white/6 bg-white/3 px-4 py-2"
          >
            <Stars rating={Math.round(rating)} />
            <span className="text-sm font-semibold text-white">{rating}/5</span>
            <span className="text-xs text-gray-400">
              {reviewCount.toLocaleString()} reviews{ratingSource ? ` on ${ratingSource}` : ""}
            </span>
          </motion.a>
        )}

        {/* ── Long-form stories ──────────────────────────────────────────── */}
        <div className="grid gap-6 md:grid-cols-2">
          {successStories.map((story, i) => (
            <motion.article
              key={story.name}
              initial={{ y: 100, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ...spring, delay: 0.1 + i * 0.1 }}
              className="flex flex-col rounded-2xl border border-white/6 bg-white/3 p-6
                         transition duration-300 hover:border-white/15 hover:-translate-y-1"
            >
              <Quote className="mb-4 h-6 w-6 text-indigo-400/60" />

              <p className="text-[15px] leading-relaxed text-gray-300">
                {story.lead}{" "}
                <span className="font-semibold text-white">{story.emphasis}</span>
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {story.stats.map((stat) => (
                  <span
                    key={stat}
                    className="rounded-full border border-white/6 bg-white/5 px-3 py-1
                               text-[11.5px] text-gray-300"
                  >
                    {stat}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-white/6 pt-5">
                <Avatar name={story.name} src={story.avatar} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{story.name}</p>
                  <p className="truncate text-xs text-gray-400">{story.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* ── Short reviews strip ────────────────────────────────────────── */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => nudge(-1)}
              aria-label="Previous reviews"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/6
                         bg-white/3 text-gray-300 transition hover:border-white/15 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              aria-label="Next reviews"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/6
                         bg-white/3 text-gray-300 transition hover:border-white/15 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="ml-1.5 flex items-center gap-1.5 rounded-full border border-white/6
                         bg-white/3 px-3 py-1.5 text-[11.5px] text-gray-300 transition
                         hover:border-white/15 hover:text-white"
            >
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              {paused ? "Play" : "Pause"}
            </button>
          </div>

          <div
            ref={trackRef}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
          >
            {shortReviews.map((review) => (
              <div
                key={review.name}
                className="w-[260px] shrink-0 snap-start rounded-2xl border border-white/6
                           bg-white/3 p-5 transition duration-300 hover:border-white/15"
              >
                <Stars rating={review.rating} />
                <p className="mt-3 text-[13px] leading-relaxed text-gray-300">{review.text}</p>
                <div className="mt-4 flex items-center gap-2.5 border-t border-white/6 pt-4">
                  <Avatar name={review.name} src={(review as { avatar?: string }).avatar} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">{review.name}</p>
                    <p className="truncate text-[11.5px] text-gray-400">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

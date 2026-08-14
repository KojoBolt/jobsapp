import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import SoftBackdrop from "@/components/hompage/SoftBackdrop";

const spring = { type: "spring" as const, stiffness: 250, damping: 70, mass: 1 };

/* ── The vortex ────────────────────────────────────────────────────────
   A torus of dots seen at an angle, generated rather than drawn: each ring
   is an ellipse, rotated a little further than the last so the whole thing
   reads as a swirl. Opacity falls off around the back of each ring to fake
   depth. Cheap — it's one SVG, no canvas and no animation library. */
const CX = 300;
const CY = 300;
const RINGS = 9;
const DOTS_PER_RING = 68;

const dots: { x: number; y: number; r: number; o: number }[] = [];

for (let ring = 0; ring < RINGS; ring++) {
  const t = ring / (RINGS - 1);
  const rx = 150 + t * 130;               
  const ry = rx * 0.94;
  const twist = t * 0.9;                 
  const fade = 1 - t * 0.45;              

  for (let i = 0; i < DOTS_PER_RING; i++) {
    const a = (i / DOTS_PER_RING) * Math.PI * 2 + twist;
    const depth = (Math.sin(a - 0.6) + 1) / 2;
    dots.push({
      x: CX + rx * Math.cos(a),
      y: CY + ry * Math.sin(a) * 0.82,
      r: 1.1 + depth * 1.5,
      o: (0.06 + depth * 0.5) * fade,
    });
  }
}


const ZeroMark = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden>
    <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="12" />
    <path
      d="M50 27 A23 23 0 1 0 73 50"
      fill="none"
      stroke="currentColor"
      strokeWidth="9"
      strokeLinecap="round"
    />
  </svg>
);

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <SoftBackdrop />

     
      <style>{`
        @keyframes nf-drift { to { transform: rotate(360deg); } }
        .nf-vortex { animation: nf-drift 90s linear infinite; transform-origin: 50% 50%; }
        @media (prefers-reduced-motion: reduce) { .nf-vortex { animation: none; } }
      `}</style>

      {/* ── Vortex ─────────────────────────────────────────────────────── */}
      <motion.svg
        viewBox="0 0 600 600"
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="pointer-events-none absolute w-[min(120vw,860px)] max-w-none"
      >
        <defs>
          <linearGradient id="nf-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>

        <g className="nf-vortex">
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#7c8cf8" opacity={d.o} />
          ))}

          {/* Sweeping arcs with lit endpoints, as in the reference. */}
          <ellipse
            cx={CX}
            cy={CY}
            rx="212"
            ry="196"
            fill="none"
            stroke="url(#nf-arc)"
            strokeWidth="1.6"
            strokeDasharray="620 700"
            opacity="0.85"
          />
          <ellipse
            cx={CX}
            cy={CY}
            rx="256"
            ry="238"
            fill="none"
            stroke="url(#nf-arc)"
            strokeWidth="1.2"
            strokeDasharray="420 1000"
            strokeDashoffset="240"
            opacity="0.6"
          />
          <circle cx={CX + 212} cy={CY} r="4" fill="#818cf8" />
          <circle cx={CX - 256} cy={CY} r="4" fill="#8b5cf6" />
        </g>
      </motion.svg>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={spring}
          className="flex items-center gap-1 text-white sm:gap-2"
        >
          <span className="text-[88px] font-bold leading-none tracking-tight sm:text-[132px]">
            4
          </span>
          <ZeroMark className="h-[74px] w-[74px] sm:h-[112px] sm:w-[112px]" />
          <span className="text-[88px] font-bold leading-none tracking-tight sm:text-[132px]">
            4
          </span>
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.1 }}
          className="mt-8 text-2xl font-bold text-white sm:text-3xl"
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.2 }}
          className="mt-2 max-w-sm text-sm text-gray-400"
        >
          Sorry, we couldn't find the page you're looking for.
        </motion.p>

        {/* Showing the path turns a support message from "a page is broken"
            into something actionable. */}
        <motion.code
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 max-w-[min(90vw,420px)] truncate rounded-lg border border-white/8
                     bg-white/3 px-3 py-1.5 text-[11.5px] text-gray-500"
        >
          {location.pathname}
        </motion.code>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.3 }}
          className="mt-8 flex flex-col items-center gap-2 sm:flex-row"
        >
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full
                       bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 py-2.5 text-sm
                       font-medium text-white transition hover:opacity-90 active:scale-95 sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back To Home
          </Link>

          <Link
            to="/contact"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border
                       border-white/10 bg-white/3 px-5 py-2.5 text-sm font-medium text-gray-300
                       transition hover:bg-white/6 hover:text-white active:scale-95 sm:w-auto"
          >
            <LifeBuoy className="h-4 w-4" />
            Contact us
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/hompage/Navbar";
import Footer from "@/components/hompage/Footer";
import SoftBackdrop from "@/components/hompage/SoftBackdrop";
import Logo from "@/assets/images/job-logo.png";

const spring = { type: "spring" as const, stiffness: 250, damping: 70, mass: 1 };

const META = [
  { label: "Record status", value: "Active" },
  { label: "Version", value: "2.1" },
  { label: "Last updated", value: "February 2026" },
  { label: "Compliance", value: "GDPR & CCPA" },
];

interface Section {
  n: string;
  heading: string;
  intro?: string;
  bullets?: { lead?: string; text: string }[];
  body?: string;
}

const SECTIONS: Section[] = [
  {
    n: "01",
    heading: "Information we collect",
    intro: "We collect information you give us directly, and only what the service needs to run:",
    bullets: [
      { lead: "Identifiers —", text: "your name, email address and phone number." },
      { lead: "Professional information —", text: "your resume, LinkedIn profile and work history." },
      { lead: "Preferences —", text: "target roles, industries, salary expectations and tone of voice." },
      { lead: "Payment details —", text: "handled by our payment provider. Card numbers never touch our servers." },
    ],
  },
  {
    n: "02",
    heading: "How AI processes your data",
    intro: "Applications are drafted by AI. That processing runs under fixed limits:",
    bullets: [
      { lead: "Purpose limitation —", text: "your data is used to write and improve your own applications, and nothing else." },
      { lead: "No model training —", text: "your personal data is never used to train AI models, ours or anyone else's." },
      { lead: "Encryption —", text: "encrypted in transit with TLS 1.3 and at rest with AES-256." },
      { lead: "Access control —", text: "role-based access. Staff see your data only when their job requires it." },
      { lead: "Third-party models —", text: "where an external model is used, it runs under agreements that forbid retention of your data." },
    ],
  },
  {
    n: "03",
    heading: "Human review",
    intro:
      "A trained career specialist reads applications before they are sent, which means a person may see your materials. Every reviewer:",
    bullets: [
      { text: "Is bound by a confidentiality agreement and has passed a background check." },
      { text: "Works inside a secure, audited environment." },
      { text: "Cannot download, copy or export your personal data." },
    ],
  },
  {
    n: "04",
    heading: "How long we keep it",
    bullets: [
      { text: "Account data is kept for as long as your subscription is active, plus 90 days." },
      { text: "Application records are kept for 12 months after submission." },
      { text: "When you delete your account, personal data is purged within 30 days." },
      { text: "AI processing logs are anonymised within 7 days." },
    ],
  },
  {
    n: "05",
    heading: "Your rights",
    intro: "Whatever your jurisdiction, you can ask us to:",
    bullets: [
      { text: "Show you every piece of personal data we hold about you." },
      { text: "Correct anything that is wrong." },
      { text: "Delete your data, at any time, without giving a reason." },
      { text: "Export your data in a portable format." },
      { text: "Stop AI processing entirely — applications continue human-only, at lower volume." },
    ],
    body: "We answer rights requests within 30 days, and there is no charge.",
  },
  {
    n: "06",
    heading: "Who we share it with",
    intro: "We do not sell your personal data, and we never have. It goes to three places:",
    bullets: [
      { lead: "Employers —", text: "as part of the applications you asked us to send." },
      { lead: "Service providers —", text: "infrastructure and payment processing, under strict data processing agreements." },
      { lead: "Legal authorities —", text: "only where the law requires it." },
    ],
  },
  {
    n: "07",
    heading: "Cookies and tracking",
    body:
      "We use cookies to keep you signed in and to understand which parts of the product get used. We do not run advertising trackers, and we do not sell audience data to anyone. You can clear or block cookies in your browser; sign-in will stop working if you do.",
  },
  {
    n: "08",
    heading: "Changes to this policy",
    body:
      "If this policy changes in a way that affects how we handle your data, we will email you before it takes effect rather than quietly updating the page. Every version carries the number and date shown on this record.",
  },
  {
    n: "09",
    heading: "Contact",
    body:
      "For any privacy question or data request, write to our Data Protection Officer at privacy@jobapp.com. A person reads that inbox.",
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SoftBackdrop />
      <Navbar />

      <main className="px-4 pb-20 pt-28 sm:pt-32">
        {/* The framed record card, matching the reference's bordered sheet. */}
        <motion.article
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={spring}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/6
                     bg-white/3 backdrop-blur"
        >
          {/* Faint engineering grid, the reference's paper texture. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]
                       [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]
                       [background-size:56px_56px]"
          />

          {/* ── Sheet header ───────────────────────────────────────────── */}
          <div className="relative flex items-center justify-between gap-4 border-b border-white/6 px-5 py-4 sm:px-8">
            <Link to="/" className="flex items-center gap-2.5">
              {/* <img src={Logo} alt="" className="h-7 w-7 rounded-md object-contain" /> */}
              <span className="text-sm font-semibold text-white">JobApp</span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5
                         text-xs font-medium text-gray-300 transition hover:border-white/25 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to site
            </Link>
          </div>

          {/* ── Title block ────────────────────────────────────────────── */}
          <div className="relative px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16 lg:px-14">
            {/* Oversized index numeral, bleeding off the top-right. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-2 right-4 select-none text-[110px]
                         font-extrabold leading-none text-white/[0.03] sm:right-8 sm:text-[180px]
                         lg:text-[220px]"
            >
              01
            </span>

            <div className="relative flex items-center gap-4">
              <span className="hidden h-px w-16 bg-white/15 sm:block lg:w-28" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Legal / 01
              </span>
            </div>

            <h1 className="relative mt-5 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Privacy
            </h1>
          </div>

          {/* ── Metadata + body ────────────────────────────────────────── */}
          <div className="relative grid gap-10 border-t border-white/6 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[220px_1fr] lg:gap-16 lg:px-14">
            {/* Left rail. The reference repeated "RECORD STATUS" on all three
                rows, which is plainly a slip — each field is labelled here. */}
            <aside className="grid grid-cols-2 gap-x-6 gap-y-7 self-start sm:grid-cols-4 lg:grid-cols-1 lg:gap-y-8">
              {META.map((m) => (
                <div key={m.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                    {m.label}
                  </p>
                  <p className="mt-1.5 text-sm text-gray-200">{m.value}</p>
                </div>
              ))}
            </aside>

            <div className="max-w-2xl">
              <p className="text-lg leading-relaxed text-gray-300 sm:text-xl">
                This policy explains what we collect when you use JobApp, what we do with it, and
                what you can ask us to do about it. It covers the website and every application we
                send on your behalf.
              </p>

              <div className="mt-12 space-y-12">
                {SECTIONS.map((section) => (
                  <motion.section
                    key={section.n}
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={spring}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="text-[11px] font-semibold tracking-[0.14em] text-indigo-400">
                        {section.n}
                      </span>
                      <h2 className="text-xl font-semibold text-white sm:text-2xl">
                        {section.heading}
                      </h2>
                    </div>

                    {section.intro && (
                      <p className="mt-3 text-[15px] leading-relaxed text-gray-400">
                        {section.intro}
                      </p>
                    )}

                    {section.bullets && (
                      <ul className="mt-4 space-y-2.5">
                        {section.bullets.map((b) => (
                          <li key={b.text} className="flex gap-3">
                            <span
                              aria-hidden
                              className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-indigo-400"
                            />
                            <span className="text-[15px] leading-relaxed text-gray-400">
                              {b.lead && <span className="text-gray-200">{b.lead} </span>}
                              {b.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.body && (
                      <p className="mt-4 text-[15px] leading-relaxed text-gray-400">
                        {section.body}
                      </p>
                    )}
                  </motion.section>
                ))}
              </div>

              <p className="mt-14 border-t border-white/6 pt-6 text-xs text-gray-500">
                Version 2.1 · Last updated August 2026 · Questions to{" "}
                <a
                  href="mailto:privacy@jobapp.com"
                  className="text-gray-300 underline decoration-white/20 underline-offset-4 hover:text-white"
                >
                  privacy@jobapp.com
                </a>
              </p>
            </div>
          </div>
        </motion.article>
      </main>

      <Footer />
    </div>
  );
}

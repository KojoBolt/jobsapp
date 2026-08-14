import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, ShieldCheck, LifeBuoy, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/hompage/Navbar";
import Footer from "@/components/hompage/Footer";
import SoftBackdrop from "@/components/hompage/SoftBackdrop";

const spring = { type: "spring" as const, stiffness: 250, damping: 70, mass: 1 };

const META = [
  { label: "Record status", value: "Active" },
  { label: "Typical reply", value: "Within 24 hours" },
  { label: "Data requests", value: "Within 30 days" },
  { label: "Fastest route", value: "Support Hub" },
];

/**
 * Only addresses that already exist in the product are listed here. An
 * inbox nobody reads is worse than one fewer option, so anything without a
 * dedicated address routes to support.
 */
const CHANNELS = [
  {
    icon: LifeBuoy,
    title: "Support Hub",
    detail: "In your dashboard",
    note: "Fastest, because we can see your campaign while we read your message.",
    href: "/support",
    internal: true,
  },
  {
    icon: Mail,
    title: "support@jobapp.com",
    detail: "General support",
    note: "Accounts, campaigns, billing and anything you're not sure where to send.",
    href: "mailto:support@jobapp.com",
    internal: false,
  },
  {
    icon: ShieldCheck,
    title: "privacy@jobapp.com",
    detail: "Data protection",
    note: "Access, correction, export and deletion requests. Read by our DPO.",
    href: "mailto:privacy@jobapp.com",
    internal: false,
  },
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
    heading: "Your account or a running campaign",
    body:
      "If you already have an account, the Support Hub in your dashboard is the quickest route — your campaign, credits and application history are attached to the message, so nobody has to ask you for them first. Otherwise, email support@jobapp.com and mention the address you signed up with.",
  },
  {
    n: "02",
    heading: "Before you buy",
    intro:
      "Questions about whether this fits your search are welcome, and you do not need an account to ask. The ones we get most often:",
    bullets: [
      { text: "Whether we source in your country or for your profession." },
      { text: "What happens to your resume and who reads it." },
      { text: "How credits work, and what happens to the ones you don't use." },
      { text: "What we can and cannot promise about outcomes." },
    ],
    body: "Send those to support@jobapp.com. A person answers, not an autoresponder.",
  },
  {
    n: "03",
    heading: "Privacy and your data",
    body:
      "Access, correction, export and deletion requests go to privacy@jobapp.com and are handled within 30 days at no charge. You do not have to give a reason for a deletion request. Our Privacy Policy sets out exactly what we hold and for how long.",
  },
  {
    n: "04",
    heading: "Billing and refunds",
    body:
      "Payment questions go to support@jobapp.com. Refund eligibility, timing and how to raise a quality claim are set out in the Refund & Satisfaction Policy — worth reading first, since it answers most billing questions faster than we can.",
  },
  {
    n: "05",
    heading: "What helps us answer faster",
    intro: "None of this is required, but a reply that solves it first time usually includes:",
    bullets: [
      { lead: "The email on your account —", text: "we cannot look you up without it." },
      { lead: "What you expected to happen", text: "and what happened instead." },
      { lead: "A job title or company", text: "if it concerns a specific application." },
      { lead: "A screenshot", text: "if something on screen looks wrong." },
    ],
  },
  {
    n: "06",
    heading: "What we can't do",
    intro: "So nobody waits on a reply that was never coming:",
    bullets: [
      { text: "We can't contact an employer on your behalf outside of the application itself." },
      { text: "We can't chase or escalate an application once it has been submitted." },
      { text: "We can't guarantee an interview, an offer, or a reply from any employer." },
    ],
  },
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <SoftBackdrop />
      <Navbar />

      <main className="px-4 pb-20 pt-28 sm:pt-32">
        {/* Record 03, same framed sheet as /privacy and /terms. */}
        <motion.article
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={spring}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/6
                     bg-white/3 backdrop-blur"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]
                       [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]
                       [background-size:56px_56px]"
          />

          {/* ── Sheet header ───────────────────────────────────────────── */}
          <div className="relative flex items-center justify-between gap-4 border-b border-white/6 px-5 py-4 sm:px-8">
            <Link to="/" className="flex items-center gap-2.5">
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
            <span
              aria-hidden
              className="pointer-events-none absolute -top-2 right-4 select-none text-[110px]
                         font-extrabold leading-none text-white/[0.03] sm:right-8 sm:text-[180px]
                         lg:text-[220px]"
            >
              03
            </span>

            <div className="relative flex items-center gap-4">
              <span className="hidden h-px w-16 bg-white/15 sm:block lg:w-28" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Contact / 03
              </span>
            </div>

            <h1 className="relative mt-5 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Contact
            </h1>
          </div>

          {/* ── Metadata + body ────────────────────────────────────────── */}
          <div className="relative grid gap-10 border-t border-white/6 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[220px_1fr] lg:gap-16 lg:px-14">
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
                Write to the address that fits and a person will answer — usually
                the same working day, always within 24 hours.
              </p>

              {/* Channels, as links rather than a form. */}
              <div className="mt-10 space-y-3">
                {CHANNELS.map((c, i) => {
                  const Icon = c.icon;
                  const inner = (
                    <>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-indigo-500/15">
                        <Icon className="h-4 w-4 text-indigo-300" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-[15px] font-semibold text-white">{c.title}</span>
                          <span className="text-[11px] uppercase tracking-[0.1em] text-gray-500">
                            {c.detail}
                          </span>
                        </span>
                        <span className="mt-1 block text-[13px] leading-relaxed text-gray-400">
                          {c.note}
                        </span>
                      </span>

                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-gray-500 transition group-hover:text-white" />
                    </>
                  );

                  const cls =
                    "group flex items-start gap-4 rounded-2xl border border-white/8 bg-white/3 p-4 transition hover:border-white/20";

                  return (
                    <motion.div
                      key={c.title}
                      initial={{ y: 24, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ ...spring, delay: 0.05 * i }}
                    >
                      {c.internal ? (
                        <Link to={c.href} className={cls}>
                          {inner}
                        </Link>
                      ) : (
                        <a href={c.href} className={cls}>
                          {inner}
                        </a>
                      )}
                    </motion.div>
                  );
                })}
              </div>

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

              {/* Cross-links to the other records in the set. */}
              <div className="mt-14 flex flex-wrap gap-2 border-t border-white/6 pt-6">
                <Link
                  to="/privacy"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium
                             text-gray-300 transition hover:border-white/25 hover:text-white"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium
                             text-gray-300 transition hover:border-white/25 hover:text-white"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/refund-policy"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium
                             text-gray-300 transition hover:border-white/25 hover:text-white"
                >
                  Refund &amp; Satisfaction Policy
                </Link>
              </div>
            </div>
          </div>
        </motion.article>
      </main>

      <Footer />
    </div>
  );
}

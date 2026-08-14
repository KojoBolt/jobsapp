import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/hompage/Navbar";
import Footer from "@/components/hompage/Footer";
import SoftBackdrop from "@/components/hompage/SoftBackdrop";

const spring = { type: "spring" as const, stiffness: 250, damping: 70, mass: 1 };

const META = [
  { label: "Record status", value: "Active" },
  { label: "Version", value: "2.1" },
  { label: "Last updated", value: "February 2026" },
  { label: "Governs", value: "All accounts" },
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
    heading: "Accepting these terms",
    body:
      "By creating an account or using JobApp, you agree to these terms. If you do not agree with them, do not use the service. This is a binding agreement between you and JobApp.",
  },
  {
    n: "02",
    heading: "What the service does",
    body:
      "JobApp sources job openings that match your profile, drafts an application for each one, has a career specialist review it, and submits it on your behalf. Everything it writes comes from the resume and preferences you supply through the Identity Vault.",
  },
  {
    n: "03",
    heading: "Your account and your content",
    intro: "You keep ownership of everything you upload. In return, you agree that:",
    bullets: [
      { text: "The information you provide is accurate and genuinely yours to submit." },
      { text: "You will not use the service to apply on behalf of another person." },
      { text: "You are responsible for keeping your login credentials secure." },
      { text: "You grant us permission to send applications containing your materials to employers." },
    ],
  },
  {
    n: "04",
    heading: "AI processing",
    intro: "Applications are drafted by AI. By using the service you accept that:",
    bullets: [
      { text: "Your resume and preferences are processed by AI models to generate tailored content." },
      { text: "Every AI draft is read by a human reviewer before it is submitted." },
      { text: "No AI model is trained on your personal data." },
      { text: "Generated text is a draft written from your materials — it cannot add experience you do not have." },
    ],
  },
  {
    n: "05",
    heading: "Human review",
    intro: "No application leaves without a person reading it first. Reviewers:",
    bullets: [
      { text: "Check accuracy, tone and relevance to the specific role." },
      { text: "May edit wording to better fit the employer and the posting." },
      { text: "Are bound by confidentiality agreements and background-checked." },
    ],
  },
  {
    n: "06",
    heading: "Credits and campaigns",
    intro: "The service runs on credits. One credit sends one application.",
    bullets: [
      { text: "Credits are added to your account when payment clears." },
      { text: "A campaign sources and sends up to the number of credits you hold, capped at 200 per campaign." },
      { text: "Applications go out in batches over several days rather than all at once." },
      { text: "Unused credits roll over between campaigns and do not expire." },
    ],
  },
  {
    n: "07",
    heading: "Payment and refunds",
    body:
      "Payments are processed by our payment provider; we never see or store your card details. Refunds are governed by our separate Refund & Satisfaction Policy, which sets out eligibility, timing and how to raise a quality claim. Read it before purchasing.",
  },
  {
    n: "08",
    heading: "What we do not promise",
    body:
      "We do not guarantee interviews, offers, or any hiring outcome. What we control is the volume and the quality of what goes out on your behalf; whether an employer replies depends on the market, the role and their own process. Any figures shown on our marketing pages are illustrative unless explicitly stated otherwise.",
  },
  {
    n: "09",
    heading: "Acceptable use",
    intro: "You may not use JobApp to:",
    bullets: [
      { text: "Misrepresent your identity, qualifications or work history." },
      { text: "Submit applications you are not legally entitled to make." },
      { text: "Attempt to access other users' data or interfere with the service." },
      { text: "Resell or redistribute the service without our written agreement." },
    ],
    body: "We may suspend or close accounts that breach this section, without a refund of used credits.",
  },
  {
    n: "10",
    heading: "Ending your account",
    body:
      "You can close your account at any time from the dashboard. Doing so stops any running campaign immediately. Data handling after closure is covered by our Privacy Policy. We may end an account for breach of these terms, or with reasonable notice if we discontinue the service.",
  },
  {
    n: "11",
    heading: "Changes to these terms",
    body:
      "If we change these terms in a way that materially affects you, we will email you before the change takes effect. Continuing to use the service after that date means you accept the revised terms.",
  },
  {
    n: "12",
    heading: "Contact",
    body:
      "Questions about these terms go to support@jobapp.com, or through the Support Hub in your dashboard.",
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <SoftBackdrop />
      <Navbar />

      <main className="px-4 pb-20 pt-28 sm:pt-32">
        {/* Same framed record sheet as /privacy — this is record 02 in the set. */}
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
              02
            </span>

            <div className="relative flex items-center gap-4">
              <span className="hidden h-px w-16 bg-white/15 sm:block lg:w-28" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Legal / 02
              </span>
            </div>

            <h1 className="relative mt-5 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Terms
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
                These terms set out what JobApp does for you, what we ask of you in return, and what
                happens if either side wants to stop. They apply from the moment you create an
                account.
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

              {/* Cross-links to the other two records in the set. */}
              <div className="mt-14 flex flex-wrap gap-2 border-t border-white/6 pt-6">
                <Link
                  to="/privacy"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium
                             text-gray-300 transition hover:border-white/25 hover:text-white"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/refund-policy"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium
                             text-gray-300 transition hover:border-white/25 hover:text-white"
                >
                  Refund &amp; Satisfaction Policy
                </Link>
              </div>

              <p className="mt-6 text-xs text-gray-500">
                Version 2.1 · Last updated August 2026 · Questions to{" "}
                <a
                  href="mailto:support@jobapp.com"
                  className="text-gray-300 underline decoration-white/20 underline-offset-4 hover:text-white"
                >
                  support@jobapp.com
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

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Link2, UserPlus, Coins, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/hompage/Navbar";
import Footer from "@/components/hompage/Footer";
import SoftBackdrop from "@/components/hompage/SoftBackdrop";

/**
 * Public explainer for the referral programme. Record 04 in the same set as
 * /privacy, /terms and /contact.
 *
 * Not to be confused with src/pages/Referrals.tsx, which is the logged-in
 * "Referral Network" contact tool at /referrals.
 *
 * ⚠️ BEFORE PUBLISHING: referral payout is not implemented.
 *   · Signup.tsx inserts a `referrals` row with status 'pending' and
 *     credits_earned 0, and sets profiles.referred_by. That part works.
 *   · Nothing anywhere sets status to 'rewarded', increments credits_earned,
 *     or grants credits to the referrer. Neither paystack-webhook nor
 *     cryptomus-webhook mentions referrals — the comment in Signup.tsx saying
 *     "granted later by the payment webhook" describes code never written.
 *   · The referred friend's discount is not implemented either; `referred_by`
 *     is stored but no checkout or payment path reads it.
 *
 * This page is a public offer. Shipping it before fulfilment exists means
 * people share links and earn nothing. Build the payout, then link it.
 */

const spring = { type: "spring" as const, stiffness: 250, damping: 70, mass: 1 };

/** Single place to change the offer. Keep in step with REFERRAL_REWARD in
 *  src/pages/RewardsCenter.tsx and whatever the payout code grants. */
const REWARD = 15;

const META = [
  { label: "Record status", value: "Active" },
  { label: "Reward", value: `$${REWARD} per friend` },
  { label: "Paid in", value: "Account credits" },
  { label: "Referral cap", value: "None" },
];

const STEPS = [
  {
    icon: Link2,
    title: "Share your link",
    body: "Every account gets its own link in the Rewards Center. Send it however you like — one link, unlimited uses.",
  },
  {
    icon: UserPlus,
    title: "Your friend signs up",
    body: `They create an account through your link and get $${REWARD} off their first pack. We record the referral as pending.`,
  },
  {
    icon: Coins,
    title: "You're paid on their first purchase",
    body: `When they buy their first pack, $${REWARD} in credits lands on your account and the referral flips to rewarded.`,
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
    heading: "What you earn",
    body: `$${REWARD} in account credits for every friend who signs up through your link and makes their first purchase. There's no limit on how many people you refer, and credits don't expire.`,
  },
  {
    n: "02",
    heading: "What your friend gets",
    body: `$${REWARD} off their first pack, applied at checkout. They don't need a code and they don't have to ask for it — the link does the work.`,
  },
  {
    n: "03",
    heading: "Why the reward lands on purchase, not signup",
    body:
      "Paying on signup would reward anyone who could create email addresses faster than they could tell friends about us. Waiting for a real purchase means every reward paid corresponds to a real customer. It also means a referral can sit pending for a while — that's normal, not a fault.",
  },
  {
    n: "04",
    heading: "Credits, not cash",
    intro: "Rewards are paid as account credits, which behave exactly like purchased ones:",
    bullets: [
      { text: "One credit sends one application." },
      { text: "They apply automatically to your next pack." },
      { text: "Unused credits roll over between campaigns." },
      { text: "They never expire." },
    ],
    body:
      "Cash payouts aren't available. We'd rather say that plainly than list an option that quietly never pays.",
  },
  {
    n: "05",
    heading: "What doesn't count",
    intro: "So there are no surprises when a referral doesn't convert:",
    bullets: [
      { text: "Referring yourself, or a second account you control." },
      { text: "Someone who already had an account before clicking your link." },
      { text: "A signup where the link wasn't used — attribution happens at signup and can't be added afterwards." },
      { text: "A referral that never makes a purchase. It stays pending until they do." },
    ],
  },
  {
    n: "06",
    heading: "Tracking your referrals",
    body:
      "The Rewards Center in your dashboard lists every referral, whether it's pending or rewarded, and what each one has earned you. Nothing is hidden behind a support request.",
  },
  {
    n: "07",
    heading: "Fair use",
    body:
      "Share your link with people you think it will help. Don't buy ads against our brand name, spam it, or post it where it breaks someone else's rules. We may withhold rewards or close accounts for abuse, and we'll tell you why if we do.",
  },
  {
    n: "08",
    heading: "Changes to the programme",
    body:
      "We can change or end this programme, but rewards already earned stay earned. If the amount changes, referrals made before the change are honoured at the old rate.",
  },
];

export default function ReferralProgram() {
  return (
    <div className="min-h-screen bg-background">
      <SoftBackdrop />
      <Navbar />

      <main className="px-4 pb-20 pt-28 sm:pt-32">
        {/* Record 04, same framed sheet as /privacy, /terms and /contact. */}
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
              04
            </span>

            <div className="relative flex items-center gap-4">
              <span className="hidden h-px w-16 bg-white/15 sm:block lg:w-28" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Referrals / 04
              </span>
            </div>

            <h1 className="relative mt-5 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Referrals
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
                Know someone stuck in application hell? Send them your link. They get ${REWARD} off
                their first pack, and you get ${REWARD} in credits when they buy it.
              </p>

              {/* Three steps */}
              <div className="mt-10 space-y-3">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.div
                      key={s.title}
                      initial={{ y: 24, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ ...spring, delay: 0.05 * i }}
                      className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/3 p-4"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-indigo-500/15">
                        <Icon className="h-4 w-4 text-indigo-300" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-[11px] font-semibold tracking-[0.14em] text-indigo-400">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[15px] font-semibold text-white">{s.title}</span>
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed text-gray-400">{s.body}</p>
                      </div>
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

              {/* Where the link actually lives. */}
              <div className="mt-14 rounded-2xl border border-indigo-500/25 bg-indigo-500/8 p-5">
                <p className="text-[15px] font-semibold text-white">Ready to share?</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-gray-300">
                  Your link lives in the Rewards Center. If you don't have an account yet, you'll
                  get one the moment you sign up.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/rewards"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br
                               from-indigo-500 to-indigo-600 px-4 py-2 text-xs font-semibold
                               text-white transition hover:opacity-90"
                  >
                    Open Rewards Center
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to="/sign-up"
                    className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium
                               text-gray-300 transition hover:border-white/25 hover:text-white"
                  >
                    Create an account
                  </Link>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 border-t border-white/6 pt-6">
                <Link
                  to="/terms"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium
                             text-gray-300 transition hover:border-white/25 hover:text-white"
                >
                  Terms of Service
                </Link>
                <Link
                  to="/privacy"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium
                             text-gray-300 transition hover:border-white/25 hover:text-white"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/contact"
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium
                             text-gray-300 transition hover:border-white/25 hover:text-white"
                >
                  Contact
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

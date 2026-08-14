import { motion } from 'framer-motion';
import {
    FileText, Check, Search, ShieldCheck, Send, Sparkles, Star,
} from 'lucide-react';
import Title from './Title';
import { journeySteps } from '../../assets/dummy-data';


const spring = { type: 'spring' as const, stiffness: 250, damping: 70, mass: 1 };

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl border border-white/8 bg-[#0f1225]/80 p-4 backdrop-blur ${className}`}>
        {children}
    </div>
);

const Micro = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">{children}</p>
);

/* ── Stage previews ──────────────────────────────────────────────────────── */

const VaultMock = () => (
    <div className="space-y-3">
        <Card>
            <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/8 bg-indigo-500/15">
                    <FileText className="h-4 w-4 text-indigo-300" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-[12px] font-semibold text-white">
                        resume-2026.pdf
                        <span className="flex items-center gap-1 rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[9.5px] text-indigo-200">
                            <Star className="h-2.5 w-2.5" />
                            Primary
                        </span>
                    </p>
                    <p className="truncate text-[10.5px] text-gray-500">Uploaded just now · </p>
                </div>
            </div>
        </Card>

        <Card>
            <Micro>Target roles</Micro>
            <div className="mt-2 flex flex-wrap gap-1.5">
                {['Backend', 'Full-stack', 'DevOps'].map((r) => (
                    <span
                        key={r}
                        className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-0.5 text-[10.5px] text-indigo-200"
                    >
                        {r}
                    </span>
                ))}
            </div>

            <div className="mt-3.5">
                <Micro>Tone of voice</Micro>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {['Technical', 'Creative', 'Executive'].map((t, i) => (
                        <span
                            key={t}
                            className={`rounded-full px-2.5 py-0.5 text-[10.5px] ${i === 0
                                    ? 'border border-indigo-500/30 bg-indigo-500/15 text-indigo-200'
                                    : 'border border-white/8 text-gray-400'
                                }`}
                        >
                            {t}
                        </span>
                    ))}
                </div>
            </div>
        </Card>
    </div>
);

/* The real source list, from supabase/functions/_shared/sourcing.ts. */
const SOURCES = ['Adzuna', 'Reed', 'Remotive', 'The Muse', 'Arbeitnow', 'Findwork', 'JSearch', 'Greenhouse'];

const ScanMock = () => (
    <div className="space-y-3">
        <Card>
            <div className="flex items-center justify-between">
                <Micro>Scanning 8 sources</Micro>
                <span className="flex items-center gap-1.5 text-[10.5px] text-gray-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Live
                </span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
                {SOURCES.map((s) => (
                    <span
                        key={s}
                        className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[10px] text-gray-300"
                    >
                        {s}
                    </span>
                ))}
            </div>
        </Card>

        <Card className="space-y-2.5">
            {[
                { title: 'Senior Backend Engineer', meta: 'Remote · UK', score: 92 },
                { title: 'Platform Engineer', meta: 'Hybrid · London', score: 85 },
                { title: 'Full-Stack Developer', meta: 'Remote · Europe', score: 78 },
            ].map((j) => (
                <div key={j.title} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-white">{j.title}</p>
                        <p className="truncate text-[10.5px] text-gray-500">{j.meta}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-indigo-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-indigo-200">
                        {j.score}%
                    </span>
                </div>
            ))}
            <p className="border-t border-white/8 pt-2.5 text-[10.5px] text-gray-500">
                Anything scoring below your floor never reaches you.
            </p>
        </Card>
    </div>
);

const WriteMock = () => (
    <div className="space-y-3">
        <Card>
            <Micro>
                <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                    Drafted for this posting
                </span>
            </Micro>
            <p className="mt-2 text-[11.5px] italic leading-relaxed text-gray-300">
                “Your posting asks for someone who has run migrations under load. I have run three,
                and only the third one went smoothly — which is the one worth talking about…”
            </p>
        </Card>

        <Card className="space-y-2.5">
            {[
                { label: 'Matched to the posting', done: true },
                { label: 'Written from your CV', done: true },
                { label: 'Read by a career specialist', done: true },
            ].map((row) => (
                <div key={row.label} className="flex items-center gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-indigo-500/30 bg-indigo-500/15">
                        <Check className="h-2.5 w-2.5 text-indigo-300" />
                    </span>
                    <span className="text-[11.5px] text-gray-300">{row.label}</span>
                </div>
            ))}
            <p className="flex items-start gap-1.5 border-t border-white/8 pt-2.5 text-[10.5px] leading-relaxed text-gray-500">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-indigo-400" />
                No application leaves without a human reading it first.
            </p>
        </Card>
    </div>
);

const DeployMock = () => (
    <div className="space-y-3">
        <Card>
            <div className="flex items-center justify-between">
                <Micro>Campaign progress</Micro>
                <span className="text-[11.5px] font-semibold text-white">143 / 200</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                    className="h-full rounded-full bg-indigo-400"
                    initial={{ width: 0 }}
                    whileInView={{ width: '71.5%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                />
            </div>
            <p className="mt-2.5 text-[10.5px] text-gray-500">
                Sent in batches across the week, not dumped in one afternoon.
            </p>
        </Card>

        <Card className="space-y-2.5">
            {[
                { title: 'Senior Backend Engineer', status: 'Submitted', tone: 'text-emerald-300' },
                { title: 'Platform Engineer', status: 'In review', tone: 'text-indigo-300' },
                { title: 'Full-Stack Developer', status: 'Drafting', tone: 'text-gray-400' },
            ].map((row) => (
                <div key={row.title} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/5">
                        <Send className="h-3 w-3 text-gray-400" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-[11.5px] text-gray-300">{row.title}</p>
                    <span className={`shrink-0 text-[10.5px] font-semibold ${row.tone}`}>{row.status}</span>
                </div>
            ))}
        </Card>
    </div>
);

const MOCKS: Record<string, React.ReactNode> = {
    vault: <VaultMock />,
    scan: <ScanMock />,
    write: <WriteMock />,
    deploy: <DeployMock />,
};

const STEP_ICONS: Record<string, React.ElementType> = {
    vault: FileText,
    scan: Search,
    write: ShieldCheck,
    deploy: Send,
};

export default function Features() {
    return (
        <section id="features" className="py-20 2xl:py-32">
            <div className="max-w-6xl mx-auto px-4">
                <Title
                    title="How it works"
                    heading="How AI job search actually works"
                    description="Four stops. One path to interviews."
                />

                <div className="relative">
                    {/* The path. Runs behind everything, centred on desktop and
                        tucked to the left where the layout stacks. */}
                    <span
                        aria-hidden
                        className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b
                                   from-transparent via-white/10 to-transparent md:left-1/2 md:-translate-x-1/2"
                    />

                    <div className="space-y-16 md:space-y-24">
                        {journeySteps.map((step, i) => {
                            const flipped = i % 2 === 1;
                            const Icon = STEP_ICONS[step.id] ?? FileText;

                            return (
                                <div key={step.id} className="relative">
                                    {/* Stage label, sitting on the rail. */}
                                    <motion.div
                                        initial={{ y: 30, opacity: 0 }}
                                        whileInView={{ y: 0, opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={spring}
                                        className="flex items-center gap-2 md:justify-center"
                                    >
                                        <span
                                            className="flex items-center gap-2 rounded-full border border-indigo-500/30
                                                       bg-indigo-500/15 px-3 py-1.5 text-xs font-semibold text-indigo-100
                                                       backdrop-blur"
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            {step.pill}
                                        </span>
                                    </motion.div>

                                    <div className="mt-8 grid items-center gap-8 pl-9 md:gap-12 md:pl-0 md:grid-cols-2">
                                        {/* Copy */}
                                        <motion.div
                                            initial={{ y: 60, opacity: 0 }}
                                            whileInView={{ y: 0, opacity: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ ...spring, delay: 0.1 }}
                                            className={flipped ? 'md:order-2 md:pl-6' : 'md:order-1 md:pr-6 md:text-right'}
                                        >
                                            <h3 className="text-lg font-semibold text-white md:text-xl">
                                                {step.heading}
                                            </h3>
                                            <p className="mt-2 text-sm leading-relaxed text-gray-400">
                                                {step.body}
                                            </p>

                                            <div
                                                className={`mt-5 flex gap-8 ${flipped ? '' : 'md:justify-end'}`}
                                            >
                                                {step.stats.map((s) => (
                                                    <div key={s.label}>
                                                        <p className="text-2xl font-extrabold text-white">{s.value}</p>
                                                        <p className="text-[11px] text-gray-500">{s.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        {/* Preview */}
                                        <motion.div
                                            initial={{ y: 80, opacity: 0 }}
                                            whileInView={{ y: 0, opacity: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ ...spring, delay: 0.2 }}
                                            className={`rounded-2xl border border-white/6 bg-gradient-to-br
                                                        from-indigo-500/10 via-white/3 to-transparent p-4
                                                        ${flipped ? 'md:order-1' : 'md:order-2'}`}
                                        >
                                            {MOCKS[step.id]}
                                        </motion.div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

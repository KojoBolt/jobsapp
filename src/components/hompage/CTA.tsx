import { ArrowRightIcon } from 'lucide-react';
import { GhostButton } from './Buttons';
import { motion } from 'framer-motion';

const spring = { type: 'spring' as const, stiffness: 250, damping: 70, mass: 1 };

export default function CTA() {
    return (
        <section className="px-4 py-20 2xl:pb-32">
            <div className="mx-auto max-w-3xl">
                {/* p-12 on mobile left roughly 250px of usable width inside a
                    375px screen. Padding now scales with the viewport. */}
                <div
                    className="relative overflow-hidden rounded-3xl border border-violet-500/20
                               bg-gradient-to-b from-violet-900/20 to-violet-900/5
                               p-6 text-center sm:p-10 md:p-16"
                >
                    {/* Soft glow instead of the old /noise.svg overlay, which
                        isn't in public/ and 404'd on every page load. */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48
                                   -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl"
                    />

                    <div className="relative z-10">
                        <motion.h2
                            className="mb-4 text-2xl font-semibold sm:mb-6 sm:text-4xl"
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={spring}
                        >
                            Ready to Land Your Next Job?
                        </motion.h2>

                        <motion.p
                            className="mx-auto mb-8 max-w-xl text-sm text-slate-400 sm:mb-10 sm:text-base"
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: 0.2 }}
                        >
                            Let AI do the hard work while you focus on preparing for interviews.
                        </motion.p>

                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ ...spring, delay: 0.3 }}
                        >
                            {/* GhostButton's own `to` prop routes through react-router.
                                The <a href> this replaced forced a full page reload. */}
                            <GhostButton
                                to="/sign-up"
                                className="w-full justify-center gap-2 px-6 py-3 sm:w-auto sm:px-8"
                            >
                                Start Matching Jobs Now
                                <ArrowRightIcon size={18} className="shrink-0" />
                            </GhostButton>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

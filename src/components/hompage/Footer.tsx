import { footerLinks } from '../../assets/dummy-data';
import { motion } from 'framer-motion';
import Logo from '../../assets/images/job-logo.png';

export default function Footer() {

    return (
        <motion.footer className="bg-white/6 border-t border-white/6 pt-10 text-gray-300"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.5 }}
        >
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-white/10">
                    <div>
                        <img src={Logo} alt="logo" className="h-8" />
                        <p className="max-w-[410px] mt-6 text-sm leading-relaxed">
                        Our platform uses advanced AI to analyze your resume or LinkedIn profile and connect you with opportunities that truly match your skills and goals. Instead of endless searching, we bring the right jobs directly to you—fast, accurate, and personalized.                        </p>
                    </div>

                    <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5">
                        {footerLinks.map((section, index) => (
                            <div key={index}>
                                <h3 className="font-semibold text-base text-white md:mb-5 mb-2">
                                    {section.title}
                                </h3>
                                <ul className="text-sm space-y-1">
                                    {section.links.map(
                                        (link: { name: string; url: string }, i) => (
                                            <li key={i}>
                                                <a
                                                    href={link.url}
                                                    className="hover:text-white transition"
                                                >
                                                    {link.name}
                                                </a>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="py-4 text-center text-sm text-gray-400">
                    © {new Date().getFullYear()} {' '}
                    <a href="/">
                        Job app
                    </a>
                    . All rights reserved.
                </p>
            </div>
        </motion.footer>
    );
};
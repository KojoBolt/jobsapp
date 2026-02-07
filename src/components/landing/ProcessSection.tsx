import { motion } from "framer-motion";
import { FileText, Sparkles, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Data Entry",
    description:
      "Upload your resume, LinkedIn, and preferences. Our Identity Vault securely stores everything needed to represent you perfectly.",
    detail: "5-minute setup",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "AI + Human Optimization",
    description:
      "Our AI drafts tailored cover letters and application responses. A human reviewer then personalizes each one to match the company culture.",
    detail: "Quality guaranteed",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Massive Deployment",
    description:
      "We submit 200 applications to matching roles across your target industries. Track every submission in real-time from your dashboard.",
    detail: "200 applications",
  },
];

const ProcessSection = () => {
  return (
    <section id="process" className="relative py-24 md:py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
            The Process
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            From upload to interviews in <span className="gradient-text">3 simple steps</span>
          </h2>
        </motion.div>

        {/* Horizontal steps */}
        <div className="relative grid gap-6 md:grid-cols-3 md:gap-8">
          {/* Connector line (desktop) */}
          <div className="absolute top-24 left-[16.67%] right-[16.67%] hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative"
            >
              <div className="glass-card rounded-xl p-8 transition-all duration-300 hover:border-primary/30">
                {/* Step number */}
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-5xl font-bold text-muted/80">{step.number}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <step.icon className="h-6 w-6" />
                  </div>
                </div>

                <h3 className="mb-3 text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>

                <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {step.detail}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;

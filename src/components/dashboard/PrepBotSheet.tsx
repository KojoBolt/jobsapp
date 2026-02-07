import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Brain, Building2, Newspaper, HelpCircle, Lock, ShieldCheck } from "lucide-react";

interface PrepBotSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: string;
  role: string;
}

const cheatSheetSections = [
  {
    icon: Building2,
    title: "Company Culture Keywords",
    items: [
      "Innovation-driven, fast-paced environment",
      "Collaborative, cross-functional teams",
      "Customer obsession & data-informed decisions",
      "Growth mindset, continuous learning culture",
    ],
  },
  {
    icon: Newspaper,
    title: "Recent News & Funding",
    items: [
      "Series D funding — $250M raised (Q4 2025)",
      "Launched new enterprise product line",
      "Named 'Best Place to Work' by Glassdoor 2025",
      "Expanding engineering team by 40% in 2026",
    ],
  },
  {
    icon: HelpCircle,
    title: "Top 3 Likely Interview Questions",
    items: [
      "Tell us about a time you led a cross-functional project under tight deadlines.",
      "How do you approach system design for a product serving millions of users?",
      "Describe a technical challenge you overcame and what you learned.",
    ],
  },
];

const PrepBotSheet = ({ open, onOpenChange, company, role }: PrepBotSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-border/50 bg-card sm:max-w-lg overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg">Prep-Bot Intel</SheetTitle>
              <SheetDescription className="text-xs">
                Company Cheat Sheet — Confidential
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Company Header */}
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">{company}</h3>
              <p className="text-sm text-muted-foreground">{role}</p>
            </div>
            <Badge variant="interview" className="gap-1 text-[10px]">
              <ShieldCheck className="h-3 w-3" />
              Verified Data
            </Badge>
          </div>
        </div>

        {/* Confidential Stamp */}
        <div className="mb-5 flex items-center gap-2 rounded-md border border-border/30 bg-muted/20 px-3 py-2">
          <Lock className="h-3.5 w-3.5 text-gold" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-gold">
            Confidential — For Your Eyes Only
          </span>
        </div>

        {/* Cheat Sheet Sections */}
        <div className="space-y-5">
          {cheatSheetSections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="rounded-lg border border-border/30 bg-muted/10 p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <section.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  {section.title}
                </h4>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 rounded-lg border border-border/20 bg-muted/10 p-3 text-center">
          <p className="text-[11px] text-muted-foreground">
            Powered by <span className="font-semibold text-primary">Prep-Bot AI</span> · Updated daily with live data
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PrepBotSheet;

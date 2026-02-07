export interface Product {
  id: string;
  title: string;
  category: "E-Book" | "Video Series" | "PDF Bundle" | "Template Kit" | "Video Masterclass";
  description: string;
  longDescription: string;
  originalPrice: number;
  memberPrice: number;
  isFree: boolean;
  recentPurchases: number;
  features: string[];
  deliveryType: "pdf" | "video" | "bundle";
  imageGradient: string;
}

export const products: Product[] = [
  {
    id: "salary-negotiation",
    title: "The 2026 Salary Negotiation Playbook",
    category: "E-Book",
    description:
      "Master the art of negotiation with data-driven strategies used by top earners at Fortune 500 companies.",
    longDescription:
      "This comprehensive 120-page guide covers everything from researching market rates to handling counter-offers. Includes real scripts, email templates, and a step-by-step framework that has helped 3,000+ professionals increase their offers by an average of 18%.",
    originalPrice: 49,
    memberPrice: 19,
    isFree: false,
    recentPurchases: 42,
    features: [
      "120-page comprehensive guide",
      "Real negotiation scripts & email templates",
      "Market rate research framework",
      "Counter-offer handling strategies",
      "Bonus: Benefits negotiation checklist",
    ],
    deliveryType: "pdf",
    imageGradient: "from-primary/30 to-accent/20",
  },
  {
    id: "invisible-networking",
    title: "Invisible Networking: How to Get Referrals Without Asking",
    category: "Video Series",
    description:
      "A 6-part video masterclass on building genuine relationships that naturally lead to career opportunities.",
    longDescription:
      "Stop cold-messaging strangers on LinkedIn. This video series teaches the 'Invisible Networking' method—a system for creating authentic professional relationships that generate referrals organically. Filmed with real case studies and actionable exercises for each module.",
    originalPrice: 79,
    memberPrice: 29,
    isFree: false,
    recentPurchases: 87,
    features: [
      "6 HD video modules (3+ hours)",
      "LinkedIn profile optimization guide",
      "Connection message templates",
      "Weekly networking action plans",
      "Private community access",
    ],
    deliveryType: "video",
    imageGradient: "from-status-interview/30 to-primary/20",
  },
  {
    id: "faang-cheat-sheets",
    title: "Technical Interview Cheat Sheets for FAANG",
    category: "PDF Bundle",
    description:
      "Quick-reference sheets covering algorithms, system design, and behavioral questions for top tech interviews.",
    longDescription:
      "Distilled from 500+ real interview experiences at Google, Meta, Amazon, Apple, and Netflix. These cheat sheets give you the patterns, frameworks, and key talking points you need—organized for quick review before your interview. Perfect for last-minute prep.",
    originalPrice: 39,
    memberPrice: 14,
    isFree: false,
    recentPurchases: 156,
    features: [
      "15 quick-reference cheat sheets",
      "Algorithm pattern recognition guide",
      "System design framework templates",
      "Behavioral answer frameworks (STAR+)",
      "Company-specific question banks",
    ],
    deliveryType: "bundle",
    imageGradient: "from-gold/30 to-status-reviewing/20",
  },
  {
    id: "recruiter-questions",
    title: "Top 10 Questions to Ask Your Recruiter",
    category: "E-Book",
    description:
      "A free quick-start guide with the exact questions that impress recruiters and reveal red flags.",
    longDescription:
      "Most candidates waste their recruiter calls asking the wrong questions. This concise guide gives you 10 power questions that simultaneously demonstrate your professionalism and extract critical information about the role, team, and company culture.",
    originalPrice: 0,
    memberPrice: 0,
    isFree: true,
    recentPurchases: 312,
    features: [
      "10 power questions with explanations",
      "Red flag identification guide",
      "Follow-up email templates",
      "Quick-reference card format",
    ],
    deliveryType: "pdf",
    imageGradient: "from-primary/20 to-muted/30",
  },
];

export const careerBundle = {
  title: "Complete Career Overhaul Bundle",
  description:
    "Get the $99 application service + all 3 premium info products at a massive discount.",
  originalPrice: 266,
  bundlePrice: 149,
  includes: [
    "200 Personalized Applications (Power-Up)",
    "The 2026 Salary Negotiation Playbook",
    "Invisible Networking Video Series",
    "FAANG Technical Interview Cheat Sheets",
  ],
};

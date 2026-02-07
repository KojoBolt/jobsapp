export interface Product {
  id: string;
  title: string;
  category: "E-Book" | "Video Series" | "PDF Bundle" | "Template Kit" | "Video Masterclass";
  headline: string;
  hook: string;
  description: string;
  longDescription: string;
  result: string;
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
    headline: "Don't leave $20k on the table. Speak the language of HR.",
    hook: "Most applicants accept the first offer because they're afraid to lose it. In 2026, companies expect a counter-offer—if you know the right scripts.",
    description:
      "Master the art of negotiation with data-driven strategies used by top earners at Fortune 500 companies.",
    longDescription:
      "This comprehensive 120-page guide covers everything from researching market rates to handling counter-offers. Includes real scripts, email templates, and a step-by-step framework that has helped 3,000+ professionals increase their offers by an average of 18%.",
    result: "Our average reader secures a $12,000–$25,000 increase in their final offer.",
    originalPrice: 49,
    memberPrice: 19,
    isFree: false,
    recentPurchases: 42,
    features: [
      'The "Anchor" Technique: How to set the price range before they do',
      '5 Word-for-Word Scripts for handling "What\'s your current salary?"',
      "How to negotiate remote work, sign-on bonuses, and equity in a tight market",
    ],
    deliveryType: "pdf",
    imageGradient: "from-primary/30 to-accent/20",
  },
  {
    id: "invisible-networking",
    title: "Invisible Networking: The Referral Blueprint",
    category: "Video Series",
    headline: 'Skip the "Black Hole." Get your resume to the top of the pile.',
    hook: '80% of jobs are filled via referrals, but most people ask for them the wrong way. Learn how to get employees to want to refer you without being "cringe" or needy.',
    description:
      "A 6-part video masterclass on building genuine relationships that naturally lead to career opportunities.",
    longDescription:
      "Stop cold-messaging strangers on LinkedIn. This video series teaches the 'Invisible Networking' method—a system for creating authentic professional relationships that generate referrals organically. Filmed with real case studies and actionable exercises for each module.",
    result: "Turn cold applications into warm introductions within 48 hours.",
    originalPrice: 79,
    memberPrice: 29,
    isFree: false,
    recentPurchases: 87,
    features: [
      'The 2-Step LinkedIn Reach-out: A 15-minute video on finding and messaging "Internal Champions"',
      'The "Value First" Framework: How to offer a tiny bit of value that makes a referral inevitable',
      "Copy-paste messages for LinkedIn, Twitter (X), and Email that actually get replies",
    ],
    deliveryType: "video",
    imageGradient: "from-status-interview/30 to-primary/20",
  },
  {
    id: "faang-cheat-sheets",
    title: "The FAANG + High-Growth Tech Cheat Sheets",
    category: "PDF Bundle",
    headline: "The specific questions they ask at Google, Meta, and the Top 50 Startups.",
    hook: "Stop guessing what's on the whiteboard. We've compiled the most frequent technical and behavioral questions asked in 2025 and 2026 for Engineering, Product, and Design roles.",
    description:
      "Quick-reference sheets covering algorithms, system design, and behavioral questions for top tech interviews.",
    longDescription:
      "Distilled from 500+ real interview experiences at Google, Meta, Amazon, Apple, and Netflix. These cheat sheets give you the patterns, frameworks, and key talking points you need—organized for quick review before your interview. Perfect for last-minute prep.",
    result: 'Go into your interview with the "Answer Key" in your pocket.',
    originalPrice: 39,
    memberPrice: 24,
    isFree: false,
    recentPurchases: 156,
    features: [
      "System Design Deep Dives: 10 most common architecture questions",
      'The "Star" Method on Steroids: How to answer behavioral questions using our high-impact formula',
      'The "Culture Fit" Cheat Sheet: What specific values each major tech giant is looking for right now',
    ],
    deliveryType: "bundle",
    imageGradient: "from-gold/30 to-status-reviewing/20",
  },
  {
    id: "recruiter-questions",
    title: "Top 10 Questions to Ask Your Recruiter",
    category: "E-Book",
    headline: "The questions that impress recruiters and reveal red flags.",
    hook: "Most candidates waste their recruiter calls asking the wrong questions. These 10 power questions simultaneously demonstrate your professionalism and extract critical information.",
    description:
      "A free quick-start guide with the exact questions that impress recruiters and reveal red flags.",
    longDescription:
      "Most candidates waste their recruiter calls asking the wrong questions. This concise guide gives you 10 power questions that simultaneously demonstrate your professionalism and extract critical information about the role, team, and company culture.",
    result: "Walk into every recruiter call with the confidence of a seasoned executive.",
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

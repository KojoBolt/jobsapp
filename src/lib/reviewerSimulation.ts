/**
 * Reviewer Status Simulator
 * 
 * MOCK_MODE: When true, generates simulated reviewer activity.
 * Set to false to switch to real backend data.
 */
export const MOCK_MODE = true;

export type ReviewerSpecialty = "tech" | "finance" | "marketing" | "design" | "operations" | "general";

export interface Reviewer {
  name: string;
  title: string;
  specialty: ReviewerSpecialty;
}

// Pool of 15 fictional specialist reviewers
export const REVIEWER_POOL: Reviewer[] = [
  { name: "Marcus", title: "Tech Lead", specialty: "tech" },
  { name: "Sarah", title: "Finance Expert", specialty: "finance" },
  { name: "Elena", title: "Marketing Strategist", specialty: "marketing" },
  { name: "David", title: "Senior Engineer", specialty: "tech" },
  { name: "Priya", title: "UX Design Lead", specialty: "design" },
  { name: "James", title: "Operations Manager", specialty: "operations" },
  { name: "Aisha", title: "Data Scientist", specialty: "tech" },
  { name: "Chen", title: "Product Manager", specialty: "tech" },
  { name: "Olivia", title: "Brand Strategist", specialty: "marketing" },
  { name: "Raj", title: "DevOps Specialist", specialty: "tech" },
  { name: "Fatima", title: "Financial Analyst", specialty: "finance" },
  { name: "Liam", title: "Frontend Architect", specialty: "tech" },
  { name: "Sofia", title: "Growth Hacker", specialty: "marketing" },
  { name: "Kenji", title: "Systems Designer", specialty: "design" },
  { name: "Amara", title: "Talent Specialist", specialty: "general" },
];

// Industry → specialty mapping
const INDUSTRY_SPECIALTY_MAP: Record<string, ReviewerSpecialty[]> = {
  Engineering: ["tech"],
  Technology: ["tech"],
  Finance: ["finance"],
  Marketing: ["marketing"],
  Design: ["design"],
  Operations: ["operations"],
};

export const getReviewersForIndustry = (industry: string): Reviewer[] => {
  const specialties = INDUSTRY_SPECIALTY_MAP[industry] || ["general", "tech"];
  const matched = REVIEWER_POOL.filter(
    (r) => specialties.includes(r.specialty) || r.specialty === "general"
  );
  // Always return at least 5 reviewers — fill with random if needed
  if (matched.length >= 5) return matched;
  const remaining = REVIEWER_POOL.filter((r) => !matched.includes(r));
  return [...matched, ...remaining].slice(0, Math.max(matched.length, 5));
};

const TARGET_COMPANIES = [
  "Google", "SpaceX", "Stripe", "Meta", "Apple", "Notion", "Vercel",
  "Airbnb", "Linear", "Figma", "Netflix", "Shopify", "Coinbase",
  "Datadog", "Snowflake", "Palantir", "Atlassian", "Twilio",
];

// Action phrase templates — {name}, {title}, {company} are replaced
const ACTION_TEMPLATES = [
  "{name} is tailoring your cover letter for {company}...",
  "{name} is verifying the technical stack requirements...",
  "{name} has just stamped your {company} application as 'Human-Verified.' ✓",
  "{name} is cross-referencing your resume with {company}'s JD...",
  "{name} is optimizing keyword density for {company}...",
  "{name} is auditing the LinkedIn URL for {company}...",
  "{name} is adding personal touches to your {company} submission...",
  "{name} is reviewing salary benchmarks for {company}...",
  "{name} is perfecting the formatting for {company}...",
  "{name} is running a final quality check on {company}...",
  "{name} has approved your {company} cover letter ✓",
  "{name} is matching your skills graph to {company}'s role...",
];

export interface ActivityMessage {
  id: string;
  reviewer: Reviewer;
  message: string;
  timestamp: number;
  isVerified: boolean;
}

export const generateActivityMessage = (
  industry: string = "Engineering"
): ActivityMessage => {
  const reviewers = getReviewersForIndustry(industry);
  const reviewer = reviewers[Math.floor(Math.random() * reviewers.length)];
  const company = TARGET_COMPANIES[Math.floor(Math.random() * TARGET_COMPANIES.length)];
  const template = ACTION_TEMPLATES[Math.floor(Math.random() * ACTION_TEMPLATES.length)];

  const message = template
    .replace("{name}", reviewer.name)
    .replace("{title}", reviewer.title)
    .replace(/{company}/g, company);

  const isVerified = template.includes("✓");

  return {
    id: Math.random().toString(36).slice(2),
    reviewer,
    message,
    timestamp: Date.now(),
    isVerified,
  };
};

// Queue reviewer status
export interface QueueReviewer {
  reviewer: Reviewer;
  currentApp: number;
  totalApps: number;
  status: "active" | "reviewing" | "stamping";
}

export const generateQueueReviewers = (
  totalProcessed: number,
  industry: string = "Engineering"
): QueueReviewer[] => {
  const reviewers = getReviewersForIndustry(industry).slice(0, 5);
  return reviewers.map((reviewer, i) => {
    const baseApp = Math.min(totalProcessed + i + 1, 200);
    const statuses: QueueReviewer["status"][] = ["active", "reviewing", "stamping"];
    return {
      reviewer,
      currentApp: baseApp,
      totalApps: 200,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    };
  });
};

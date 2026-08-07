/**
 * One config entry per experience track in the intern/professional funnel.
 * The key matches option.value from quizConfig.js experienceLevel step.
 *
 * Each track defines:
 *  - core product (name, price, features, subtitle)
 *  - order bump (name, price, originalPrice, includes)
 *  - upsell sequence: array of { id, name, price, headline, sub, includes }
 *    The checkout pages iterate this array, so adding a new step is just
 *    adding an object here — no new component or route needed.
 *  - downsell: shown if the last upsell is declined
 */

export const INTERN_FUNNEL_CONFIGS = {
  intern: {
    core: {
      id: 'intern-application-service',
      name: 'Job Application Service',
      subtitle: '200 Internship Applications sent within 24 hours',
      price: 99,
      features: [
        '200 internship applications sent within 24 hours',
        'AI-tailored cover letters for each role',
        'Applications matched to your target sectors',
        'Real-time tracking dashboard',
        '7-day money-back guarantee',
        'Email support throughout',
      ],
    },
    bump: {
      id: 'intern-accelerator-bump',
      name: 'The Internship Application Accelerator',
      price: 19,
      originalPrice: 29,
      description: 'Your applications are going out to 200 companies. Make absolutely sure your resume is optimised and your LinkedIn is set up to attract recruiters.',
      includes: [
        'Student resume templates proven to get callbacks',
        'LinkedIn profile optimisation checklist',
        'Top 50 internship company cold outreach scripts',
        'ATS keyword guide by industry',
      ],
    },
    upsells: [
      {
        id: 'intern-interview-masterclass',
        name: 'Interview Prep Masterclass',
        price: 47,
        headline: 'Your 200 Applications Just Went Out. Are You Ready for the Calls?',
        headlineAccent: 'Are You Ready for the Calls?',
        sub: 'Interview requests start arriving in 3 to 5 days. The students who win internships are not the most qualified. They are the most prepared.',
        badge: 'Wait Before You Go',
        badgeTone: 'amber',
        declineLabel: 'No thanks, I will figure out interviews on my own',
        includes: [
          '8 video modules (1.5 hours total)',
          'The 30 interview questions with frameworks',
          'STAR story templates for students',
          'Virtual interview setup guide',
          'Follow-up email templates',
        ],
      },
      {
        id: 'intern-portfolio-builder',
        name: 'Student Portfolio Builder',
        price: 37,
        headline: 'One More Edge Before the Interviews Start.',
        sub: 'Most students who get interviews lose them when the recruiter asks to see their work and they have nothing to show. Fix that now.',
        badge: 'Applications Submitted',
        badgeTone: 'green',
        declineLabel: 'No thanks, I will skip this',
        includes: [
          '5 video modules on building a portfolio from nothing',
          'Project ideas by major',
          'Case study writing framework',
          'LinkedIn featured section guide',
          'Portfolio PDF template',
        ],
      },
    ],
    downsell: {
      id: 'intern-portfolio-quickstart',
      name: 'The Quick-Start Student Portfolio Kit',
      price: 27,
      headline: 'Before you finish, here is a smaller option that still gives you a real edge.',
      sub: 'The full course is not for everyone. But every intern should have something to show. This kit gets you there in one afternoon.',
      tone: 'amber',
      includes: [
        '5 fill-in-the-blank project case study templates',
        'Personal portfolio website template (no coding required)',
        '20 project ideas for students with no work experience',
        'LinkedIn featured section optimisation guide',
        'One-page portfolio PDF template',
      ],
    },
  },

  entry: {
    core: {
      id: 'entry-application-service',
      name: 'Job Application Service',
      subtitle: '200 tailored entry-level applications in 7 days',
      price: 99,
      features: [
        '200 personalized applications sent in 7 days',
        'AI + human-reviewed cover letters',
        'Matched to entry-level roles in your field',
        'Real-time tracking dashboard',
        '7-day money-back guarantee',
        'Email support throughout',
      ],
    },
    bump: {
      id: 'entry-resume-bump',
      name: 'Entry-Level Resume Power Pack',
      price: 19,
      originalPrice: 29,
      description: 'Before 200 applications go out with your resume attached, make sure it is optimised for ATS systems and recruiter eyes.',
      includes: [
        '3 ATS-optimised resume templates for entry-level roles',
        'Keyword guide by industry sector',
        'LinkedIn headline + summary formulas',
        'Action verb library for limited experience',
      ],
    },
    upsells: [
      {
        id: 'entry-interview-guide',
        name: 'First Job Interview Playbook',
        price: 47,
        headline: 'Applications are going out. Now make sure you nail the interviews.',
        sub: 'Entry-level interviews are different — recruiters expect less experience but more coachability. This guide shows you exactly how to present yourself.',
        badge: 'Wait Before You Go',
        badgeTone: 'amber',
        declineLabel: 'No thanks, I will prepare on my own',
        includes: [
          'The 25 most common entry-level interview questions answered',
          'How to talk about limited experience confidently',
          'Salary negotiation basics for your first offer',
          'Follow-up email templates',
          'Virtual interview setup guide',
        ],
      },
    ],
    downsell: {
      id: 'entry-interview-cheatsheet',
      name: 'Entry-Level Interview Cheat Sheet Bundle',
      price: 17,
      headline: 'At least take this with you.',
      sub: 'A focused two-page reference you can review the night before any interview. No course, no video — just the essentials.',
      tone: 'amber',
      includes: [
        '25 interview questions with answer frameworks',
        'Salary negotiation one-pager',
        'Follow-up email templates',
        'Red flags to avoid in interviews',
      ],
    },
  },

  mid: {
    core: {
      id: 'mid-application-service',
      name: 'Job Application Service',
      subtitle: '200 targeted mid-level applications in 7 days',
      price: 99,
      features: [
        '200 tailored mid-level applications in 7 days',
        'AI-crafted cover letters emphasising your track record',
        'Matched to roles requiring 3-5 years experience',
        'Real-time tracking dashboard',
        '7-day money-back guarantee',
        'Email support throughout',
      ],
    },
    bump: {
      id: 'mid-linkedin-bump',
      name: 'LinkedIn Profile Optimisation Kit',
      price: 19,
      originalPrice: 29,
      description: 'With 200 applications going out, recruiters will be looking you up. Make sure your LinkedIn profile tells the same story your applications do.',
      includes: [
        'Mid-career LinkedIn headline formulas',
        'About section template for 3-5 year professionals',
        'Featured section setup guide',
        'Recommendations request scripts',
      ],
    },
    upsells: [
      {
        id: 'mid-salary-negotiation',
        name: 'Salary Negotiation Masterclass',
        price: 47,
        headline: 'Applications sent. Now make sure you negotiate the offer you deserve.',
        sub: 'Mid-level professionals leave an average of $8,000 on the table per offer. This course gives you the exact scripts and frameworks to close that gap.',
        badge: 'Wait Before You Go',
        badgeTone: 'amber',
        declineLabel: 'No thanks, I will negotiate on my own',
        includes: [
          'The counter-offer script that works in any industry',
          'How to handle "this is our best offer"',
          'Total compensation breakdown — salary vs equity vs benefits',
          'Timing strategies for when to push and when to accept',
          'Email templates for every negotiation scenario',
        ],
      },
    ],
    downsell: {
      id: 'mid-negotiation-scripts',
      name: 'Salary Negotiation Script Pack',
      price: 17,
      headline: 'Just take the scripts.',
      sub: 'No course. Just the five negotiation scripts that have helped mid-level professionals increase their offers by an average of $6,000.',
      tone: 'amber',
      includes: [
        '5 negotiation email scripts',
        'Counter-offer phone call framework',
        'Competing offer leverage guide',
        'Benefits negotiation checklist',
      ],
    },
  },

  senior: {
    core: {
      id: 'senior-application-service',
      name: 'Job Application Service',
      subtitle: '200 senior-level applications crafted for leadership roles',
      price: 99,
      features: [
        '200 senior-level applications in 7 days',
        'Executive-tone cover letters highlighting leadership impact',
        'Targeted at senior IC and management roles',
        'Real-time tracking dashboard',
        '7-day money-back guarantee',
        'Priority email support',
      ],
    },
    bump: {
      id: 'senior-executive-resume-bump',
      name: 'Senior-Level Resume & LinkedIn Audit',
      price: 19,
      originalPrice: 39,
      description: 'At the senior level, your resume needs to lead with impact and numbers. This audit checklist ensures your profile matches the expectations of hiring managers for senior roles.',
      includes: [
        'Senior resume structure checklist',
        'Impact metric formulas (even if you lack direct metrics)',
        'LinkedIn optimisation for senior IC and manager visibility',
        'Executive summary writing guide',
      ],
    },
    upsells: [
      {
        id: 'senior-leadership-interview',
        name: 'Senior Leadership Interview Prep',
        price: 47,
        headline: 'Senior interviews are a different game. Make sure you are ready.',
        sub: 'At the senior level, interviewers are assessing your judgment, leadership presence, and strategic thinking — not just your skills. This course prepares you for exactly that.',
        badge: 'Wait Before You Go',
        badgeTone: 'amber',
        declineLabel: 'No thanks, I will prepare on my own',
        includes: [
          'The senior-level interview framework (strategy, influence, execution)',
          'Behavioural questions for leadership roles with answer structures',
          'How to talk about managing teams, conflict, and failure',
          'Salary and equity negotiation at the senior level',
          'Executive presence techniques for video interviews',
        ],
      },
    ],
    downsell: {
      id: 'senior-interview-framework',
      name: 'Senior Interview Answer Framework',
      price: 17,
      headline: 'At least take the framework.',
      sub: 'A concise guide to answering the 10 hardest senior-level interview questions with confidence and precision.',
      tone: 'amber',
      includes: [
        '10 senior interview questions with full answer guides',
        'Leadership storytelling framework',
        'Salary negotiation at the senior level',
        'Stakeholder management question answers',
      ],
    },
  },

  executive: {
    core: {
      id: 'executive-application-service',
      name: 'Job Application Service',
      subtitle: '200 executive-level applications for C-suite and VP roles',
      price: 99,
      features: [
        '200 executive-level applications in 7 days',
        'C-suite and VP-tier cover letters',
        'Targeted at director, VP, and C-level openings',
        'Real-time tracking dashboard',
        '7-day money-back guarantee',
        'Priority email support',
      ],
    },
    bump: {
      id: 'executive-brand-bump',
      name: 'Executive Personal Brand Kit',
      price: 19,
      originalPrice: 49,
      description: 'Executive search is relationship-driven. Your LinkedIn, your online presence, and how you present yourself beyond the resume all matter significantly at this level.',
      includes: [
        'Executive LinkedIn profile blueprint',
        'Board-ready bio template',
        'Thought leadership content strategy (1-page)',
        'Executive resume headline formulas',
      ],
    },
    upsells: [
      {
        id: 'executive-board-interview',
        name: 'Executive Interview & Offer Negotiation',
        price: 47,
        headline: 'Executive interviews and offers are in a different league. Be ready.',
        sub: 'At the executive level, you are being assessed on vision, board presence, and cultural fit — and offers involve equity, bonuses, and relocation. This course covers all of it.',
        badge: 'Wait Before You Go',
        badgeTone: 'amber',
        declineLabel: 'No thanks, I will handle this on my own',
        includes: [
          'C-suite and VP interview frameworks',
          'Board presentation and panel interview prep',
          'Executive compensation negotiation (base, equity, bonus)',
          'Reference and background check navigation',
          'How to evaluate and compare executive offers',
        ],
      },
    ],
    downsell: {
      id: 'executive-negotiation-guide',
      name: 'Executive Offer Negotiation Guide',
      price: 27,
      headline: 'At least make sure you negotiate the offer correctly.',
      sub: 'Executive offers are complex. This guide walks you through every line item — salary, equity, bonus, and benefits — so you do not leave anything on the table.',
      tone: 'amber',
      includes: [
        'Executive compensation breakdown guide',
        'Equity and RSU negotiation scripts',
        'Bonus structure evaluation framework',
        'Counter-offer email templates for executives',
      ],
    },
  },
};

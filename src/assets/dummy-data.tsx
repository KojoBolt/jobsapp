import ProfileTwo from './images/p1.webp';
import ProfileOne from './images/p2.webp';

/**
 * The four stages of a campaign, as the homepage tells them.
 *
 * Replaces the template agency copy that shipped here ("Discovery & Planning",
 * "Design & Development") — none of which described this product.
 *
 * The figures are countable facts, not marketing volume claims: eight sources
 * is the actual list in supabase/functions/_shared/sourcing.ts, and 200 is the
 * Growth plan. `mock` selects a preview in Features.tsx.
 */
export const journeySteps = [
    {
        id: 'vault',
        pill: 'Share your background',
        heading: 'Fill in one form. Then never again.',
        body: 'Upload your CV, pick the roles and industries you want, and choose how you want to sound. Everything after this runs off that one profile.',
        stats: [
            { value: '1', label: 'form to fill' },
            { value: '5', label: 'CV versions stored' }
        ]
    },
    {
        id: 'scan',
        pill: 'Scan the market',
        heading: 'Eight job boards, checked for you',
        body: "We pull from eight sources at once and score every role against your profile. The ones that don't fit never reach you.",
        stats: [
            { value: '8', label: 'sources searched' },
            { value: '0', label: 'boards you check' }
        ]
    },
    {
        id: 'write',
        pill: 'Write and review',
        heading: 'Written for the job. Checked by a person.',
        body: 'Each application gets its own cover letter, drafted against that specific posting and your CV — then read by a career specialist before it goes anywhere.',
        stats: [
            { value: '100%', label: 'human reviewed' },
            { value: '0', label: 'templates reused' }
        ]
    },
    {
        id: 'deploy',
        pill: 'Deploy and track',
        heading: 'They go out while you get on with your life',
        body: 'Applications send in batches over days, not all at once. You watch it happen from the dashboard, or you close the tab and check back later.',
        stats: [
            { value: '200', label: 'applications' },
            { value: '1', label: 'click to start' }
        ]
    }
];

export const plansData = [
    {
        id: 'job-tracker',
        name: 'Job Tracker',
        price: '$29',
        desc: 'Addon for job seekers who want to track their applications.',
        credits: 'Monthly',
        features: [
            'Personalized job tracking dashboard',
            'AI-generated application insights',
            'Budget-friendly pricing',
            'Email support'
        ]
    },
    {
        id: 'pro',
        name: 'Growth',
        price: '$99',
        desc: ' One price. No Surprises.',
        credits: 'Monthly',
        features: [
            "200 personalized applications",
            "AI-crafted cover letters",
            "Human reviewer on every application",
            "Real-time tracking dashboard",
            "HR contact referral list",
            "Insider email templates",
            "Human-Touch Quality Guarantee",
        ],
        popular: true
    },
    {
        id: 'ultra',
        name: 'Scale',
        price: '?',
        desc: 'Custom solutions for job seekers who want to supercharge their job search with personalized support and unlimited applications.',
        credits: 'Coming soon',
        features: [
            'Unlimited personalized applications',
            'Dedicated career coach',
            'Priority human review',    
        ]
    }
];

export const faqData = [
    {
        question: 'How does the AI job matching work?',
        answer: 'Our AI analyzes your resume and LinkedIn profile to understand your skills, experience, and career goals. It then scans thousands of job listings and matches you with roles that best fit your profile.'
    },
    {
        question: 'Do I need a LinkedIn account to use the platform?',
        answer: 'No, you can simply upload your resume. However, connecting your LinkedIn profile can improve the accuracy of job matches.'
    },
    {
        question: 'Is my data safe?',
        answer: 'Yes, we take data security seriously. Your information is encrypted and stored securely, and we never sell or share your personal data with third parties.'
    },
    {
        question: 'How accurate are the job matches?',
        answer: 'Our AI continuously learns and improves. Most users receive highly relevant job matches based on their skills and experience, reducing the need for endless searching.'
    },
     {
        question: 'Can I edit or update my resume after uploading?',
        answer: 'Absolutely. You can update your resume or profile at any time to receive better and more up-to-date job recommendations.'
    }, 
     {
        question: 'Is this service free?',
        answer: 'No, we offer a subscription-based model with different tiers to suit your needs. You can choose the plan that best fits your job search goals and budget.'
    }
];

export const successStories = [
    {
        lead: 'I was applying after my son went to bed, every night, for four months. Two hours a go and nothing to show for it.',
        emphasis: 'JobApp gave me my evenings back — and the applications kept going out without me.',
        stats: ['275 applications', '14 interviews', '8 weeks to offer'],
        name: 'Tunde A.',
        role: 'Product Manager',
        avatar: ProfileOne
    },
    {
        lead: 'Every evening I had the same impossible choice: send more applications, or actually get better at my craft. I could never do both.',
        emphasis: 'JobApp took the applications off my plate. When the interviews came, I was ready for them.',
        stats: ['Kept learning', 'Landed a senior role', 'Zero burnout'],
        name: 'Sarah M.',
        role: 'Full-Stack Developer',
        avatar: ProfileTwo
    }
];

/**
 * Short reviews for the scrolling strip. `rating` is out of 5.
 *
 * No `avatar` here yet — only three headshots ship with the project and two
 * are on the story cards above. One photo among six initials looks broken, so
 * the row is left consistent. To add them: drop six files in assets/images,
 * import them at the top like ProfileOne, and add `avatar: <Import>` to each
 * entry. The component picks them up with no changes.
 */
export const shortReviews = [
    {
        name: 'Michael K.',
        role: 'Data Analyst',
        rating: 5,
        text: 'Set up my vault on a Sunday, had six interview requests by Friday. I did nothing in between.'
    },
    {
        name: 'Adaeze O.',
        role: 'UX Designer',
        rating: 5,
        text: 'The cover letters actually read like me. I was ready to be embarrassed and I never was.'
    },
    {
        name: 'James R.',
        role: 'DevOps Engineer',
        rating: 4,
        text: 'The match scores are the real feature. I stopped wasting time on roles that were never going to call back.'
    },
    {
        name: 'Chidera N.',
        role: 'Marketing Lead',
        rating: 5,
        text: 'I review each one before it goes out, which takes about a minute. That is the whole job now.'
    },
    {
        name: 'Priya S.',
        role: 'QA Engineer',
        rating: 5,
        text: 'Three months of applying on my own got me two callbacks. Six weeks here got me nine.'
    },
    {
        name: 'Daniel O.',
        role: 'Backend Engineer',
        rating: 4,
        text: 'Worth it for the tracking alone. I finally know what I applied to and what came back.'
    }
];

/**
 * Sample matched applications for the homepage preview card.
 *
 * ILLUSTRATIVE, not live data — the scores, salaries and letter excerpts are
 * written to show the shape of what the product produces. The card renders an
 * "Example" chip so nobody reads them as current openings. Company names are
 * real employers that genuinely sit in the sourcing pool (they're in the
 * Greenhouse board list), not partners or endorsements.
 *
 * `stage` indexes MATCH_PIPELINE in MatchPreview.tsx and mirrors the real
 * application statuses: queued → drafting → pending_review → approved.
 */
export const sampleMatches = [
    {
        score: 92,
        posted: '2 days ago',
        title: 'Senior Full-Stack Engineer',
        company: 'Stripe',
        // Hand-verified, not guessed from the name — see MatchPreview.tsx.
        // To use a local file instead, add `logo: StripeLogo` here.
        domain: 'stripe.com',
        industry: 'Payments & fintech',
        location: 'Remote — UK',
        experience: '5+ yrs',
        salary: '£85k – £110k',
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        extraSkills: 3,
        reasons: ['Matches your target role', 'Remote-first, as you asked'],
        requirements:
            'Strong React and TypeScript across production systems. Comfortable owning services end to end, from schema to deploy. Experience in payments or another regulated domain is a plus.',
        stage: 3,
        letter:
            'Six years building payment-adjacent systems taught me that reliability is a product feature, not an engineering detail. At my last role I cut checkout failures by 40% by rebuilding the retry layer…'
    },
    {
        score: 78,
        posted: '4 days ago',
        title: 'Product Designer, Growth',
        company: 'Figma',
        domain: 'figma.com',
        industry: 'Design tools',
        location: 'Hybrid — London',
        experience: '3+ yrs',
        salary: '£65k – £82k',
        skills: ['Figma', 'Prototyping', 'Design systems', 'User research'],
        extraSkills: 2,
        reasons: ['Design systems experience', 'Within your salary range'],
        requirements:
            'Own growth surfaces end to end — onboarding, activation and upgrade flows. Comfortable running your own research and shipping against measured outcomes rather than opinions.',
        stage: 2,
        letter:
            'Most growth work I have done started with a research call, not a Figma file. Rebuilding onboarding around what new users actually got stuck on lifted activation 18% in a quarter…'
    },
    {
        score: 85,
        posted: '1 day ago',
        title: 'Data Analyst, Marketplace',
        company: 'GitLab',
        domain: 'gitlab.com',
        industry: 'DevOps platform',
        location: 'Remote — Europe',
        experience: '4+ yrs',
        salary: '£70k – £90k',
        skills: ['SQL', 'Python', 'dbt', 'Looker'],
        extraSkills: 4,
        reasons: ['SQL and dbt on your resume', 'Fully remote'],
        requirements:
            'Turn marketplace behaviour into decisions the team acts on. Own the models behind them in dbt, and be able to defend a number when a director pushes back on it.',
        stage: 4,
        letter:
            'The analysis I am proudest of killed a feature. Three weeks of usage data said the thing we planned to build was already being solved by a workaround users preferred…'
    }
];

export const footerLinks = [
    {
        title: "Company",
        links: [
            { name: "Home", url: "/" },
            { name: "Referral Program", url: "/referral-program" },
            // { name: "Work", url: "#" },
            { name: "Contact", url: "/contact" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "/privacy" },
            { name: "Terms of Service", url: "/terms" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" }
            // { name: "GitHub", url: "#" }
        ]
    }
];
import { UploadIcon, VideoIcon, ZapIcon } from 'lucide-react';

export const featuresData = [
    {
        icon: <UploadIcon className="w-6 h-6" />,
        title: 'Discovery & Planning',
        desc: 'We understand your goals, audience and challenges to craft a clear, actionable strategy.'
    },
    {
        icon: <ZapIcon className="w-6 h-6" />,
        title: 'Design & Development',
        desc: 'High-quality design and scalable development focused on performance and usability.'
    },
    {
        icon: <VideoIcon className="w-6 h-6" />,
        title: 'Launch & Growth',
        desc: 'We launch, optimize and continuously improve to drive measurable business growth.'
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

export const footerLinks = [
    {
        title: "Company",
        links: [
            { name: "Home", url: "#" },
            { name: "Services", url: "#" },
            { name: "Work", url: "#" },
            { name: "Contact", url: "#" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" },
            { name: "GitHub", url: "#" }
        ]
    }
];
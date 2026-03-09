export interface Application {
  id: string;
  clientName: string;
  clientAvatar?: string;
  company: string;
  jobTitle: string;
  jobUrl: string;
  jobDescription: string;
  status: 'queued' | 'drafting' | 'pending_review' | 'approved' | 'submitted' | 'completed' | 'failed';
  submittedAt: Date;
  lastUpdated: Date;
  resume: string;
  coverLetter: string;
  reviewerNotes?: string;
}

export interface Activity {
  id: string;
  applicationId: string;
  action: 'approved' | 'rejected';
  timestamp: Date;
  notes?: string;
  application: {
    company: string;
    jobTitle: string;
  };
}

export const mockApplications: Application[] = [
  {
    id: '1',
    clientName: 'Michael Chen',
    company: 'TechCorp Industries',
    jobTitle: 'Senior Software Engineer',
    jobUrl: 'https://techcorp.com/careers/senior-software-engineer-2024',
    jobDescription: 'We are seeking a highly skilled Senior Software Engineer to join our dynamic team. The ideal candidate will have 5+ years of experience in full-stack development, strong knowledge of React, Node.js, and cloud technologies. You will lead technical initiatives, mentor junior developers, and architect scalable solutions.',
    status: 'pending_review',
    submittedAt: new Date('2026-02-23T10:30:00'),
    lastUpdated: new Date('2026-02-23T10:30:00'),
    resume: `Michael Chen
Senior Software Engineer | San Francisco, CA
michael.chen@email.com | (415) 555-0123

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 7+ years of experience building scalable web applications. Proven expertise in React, TypeScript, Node.js, and cloud infrastructure. Strong track record of leading technical initiatives and mentoring development teams.

EXPERIENCE

Senior Software Engineer | DataFlow Inc | 2022 - Present
• Led development of microservices architecture serving 2M+ daily users
• Reduced API response time by 60% through optimization and caching strategies
• Mentored team of 4 junior developers, improving code quality and team velocity
• Implemented CI/CD pipelines reducing deployment time from hours to minutes

Software Engineer | CloudSync Solutions | 2019 - 2022
• Built real-time collaboration features using WebSockets and Redis
• Developed RESTful APIs handling 100K+ requests per day
• Migrated monolithic application to React-based SPA, improving load times by 40%

EDUCATION
BS in Computer Science | Stanford University | 2019

SKILLS
Languages: JavaScript, TypeScript, Python, Go
Frontend: React, Next.js, Vue.js, Tailwind CSS
Backend: Node.js, Express, PostgreSQL, MongoDB, Redis
Cloud: AWS, Docker, Kubernetes, Terraform`,
    coverLetter: `Dear Hiring Manager,

I am writing to express my strong interest in the Senior Software Engineer position at TechCorp Industries. With over 7 years of experience building scalable web applications and a proven track record of technical leadership, I am excited about the opportunity to contribute to your innovative team.

Throughout my career at DataFlow Inc and CloudSync Solutions, I have developed deep expertise in full-stack development, particularly with React, Node.js, and cloud technologies. I successfully led the migration of our microservices architecture to handle 2M+ daily users, reducing API response times by 60% through strategic optimization and caching solutions.

What particularly excites me about TechCorp Industries is your commitment to building cutting-edge solutions that solve real-world problems. Your recent work in AI-powered automation aligns perfectly with my passion for leveraging technology to create meaningful impact.

I am confident that my technical expertise, leadership experience, and collaborative approach would make me a valuable addition to your team. I look forward to the opportunity to discuss how I can contribute to TechCorp's continued success.

Thank you for considering my application.

Sincerely,
Michael Chen`,
  },
  {
    id: '2',
    clientName: 'Sarah Martinez',
    company: 'Global Finance Partners',
    jobTitle: 'Product Manager',
    jobUrl: 'https://globalfinance.com/jobs/product-manager-fintech',
    jobDescription: 'Join our fintech team as a Product Manager. Lead product strategy, work with cross-functional teams, and drive innovation in financial technology solutions.',
    status: 'pending_review',
    submittedAt: new Date('2026-02-23T09:15:00'),
    lastUpdated: new Date('2026-02-23T09:15:00'),
    resume: 'Sarah Martinez - Product Manager with 5 years experience in fintech...',
    coverLetter: 'Dear Hiring Team, I am excited to apply for the Product Manager position...',
  },
  {
    id: '3',
    clientName: 'David Kim',
    company: 'InnovateLab',
    jobTitle: 'UX Designer',
    jobUrl: 'https://innovatelab.io/careers/ux-designer',
    jobDescription: 'We are looking for a talented UX Designer to create intuitive and beautiful user experiences.',
    status: 'pending_review',
    submittedAt: new Date('2026-02-23T08:45:00'),
    lastUpdated: new Date('2026-02-23T08:45:00'),
    resume: 'David Kim - UX Designer specializing in user-centered design...',
    coverLetter: 'Dear InnovateLab Team, As a passionate UX designer with 6 years of experience...',
  },
  {
    id: '4',
    clientName: 'Emily Johnson',
    company: 'DataViz Corp',
    jobTitle: 'Data Scientist',
    jobUrl: 'https://dataviz.com/positions/data-scientist-ml',
    jobDescription: 'Seeking a Data Scientist with expertise in machine learning and statistical analysis.',
    status: 'approved',
    submittedAt: new Date('2026-02-22T15:20:00'),
    lastUpdated: new Date('2026-02-22T16:30:00'),
    resume: 'Emily Johnson - Data Scientist with PhD in Statistics...',
    coverLetter: 'Dear Hiring Manager, I am thrilled to apply for the Data Scientist position...',
  },
  {
    id: '5',
    clientName: 'James Wilson',
    company: 'MediaTech Solutions',
    jobTitle: 'Frontend Developer',
    jobUrl: 'https://mediatech.com/jobs/frontend-dev-react',
    jobDescription: 'Frontend Developer needed for building modern web applications with React and TypeScript.',
    status: 'completed',
    submittedAt: new Date('2026-02-21T11:00:00'),
    lastUpdated: new Date('2026-02-22T09:15:00'),
    resume: 'James Wilson - Frontend Developer specializing in React ecosystem...',
    coverLetter: 'Dear MediaTech Team, I am excited about the Frontend Developer opportunity...',
  },
  {
    id: '6',
    clientName: 'Lisa Anderson',
    company: 'HealthTech Innovations',
    jobTitle: 'DevOps Engineer',
    jobUrl: 'https://healthtech.com/careers/devops-engineer',
    jobDescription: 'DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines.',
    status: 'submitted',
    submittedAt: new Date('2026-02-22T14:30:00'),
    lastUpdated: new Date('2026-02-23T08:00:00'),
    resume: 'Lisa Anderson - DevOps Engineer with AWS and Kubernetes expertise...',
    coverLetter: 'Dear HealthTech Innovations, I am writing to express my interest...',
  },
];

// Add more applications to reach 47 pending
for (let i = 7; i <= 47; i++) {
  mockApplications.push({
    id: String(i),
    clientName: `Client ${i}`,
    company: `Company ${i}`,
    jobTitle: `Position ${i}`,
    jobUrl: `https://company${i}.com/jobs/${i}`,
    jobDescription: `Job description for position ${i}...`,
    status: i % 5 === 0 ? 'approved' : i % 7 === 0 ? 'completed' : 'pending_review',
    submittedAt: new Date(Date.now() - Math.random() * 86400000 * 3),
    lastUpdated: new Date(Date.now() - Math.random() * 86400000),
    resume: `Resume content for client ${i}...`,
    coverLetter: `Cover letter for client ${i}...`,
  });
}

export const mockActivities: Activity[] = [
  {
    id: '1',
    applicationId: '4',
    action: 'approved',
    timestamp: new Date('2026-02-23T09:30:00'),
    notes: 'Excellent cover letter, strong alignment with job requirements.',
    application: {
      company: 'DataViz Corp',
      jobTitle: 'Data Scientist',
    },
  },
  {
    id: '2',
    applicationId: '5',
    action: 'approved',
    timestamp: new Date('2026-02-23T09:15:00'),
    application: {
      company: 'MediaTech Solutions',
      jobTitle: 'Frontend Developer',
    },
  },
  {
    id: '3',
    applicationId: '100',
    action: 'rejected',
    timestamp: new Date('2026-02-23T08:45:00'),
    notes: 'Cover letter needs significant revision. Experience mismatch.',
    application: {
      company: 'TechStart Inc',
      jobTitle: 'Senior Backend Engineer',
    },
  },
  {
    id: '4',
    applicationId: '101',
    action: 'approved',
    timestamp: new Date('2026-02-23T08:30:00'),
    application: {
      company: 'CloudScale Systems',
      jobTitle: 'Cloud Architect',
    },
  },
];

export const getApplicationById = (id: string): Application | undefined => {
  return mockApplications.find(app => app.id === id);
};

export const getPendingApplications = (): Application[] => {
  return mockApplications.filter(app => app.status === 'pending_review');
};

export const getTodayStats = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayActivities = mockActivities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime();
  });
  
  return {
    reviewed: todayActivities.length,
    approved: todayActivities.filter(a => a.action === 'approved').length,
    rejected: todayActivities.filter(a => a.action === 'rejected').length,
  };
};

export const getWeekStats = () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const weekActivities = mockActivities.filter(activity => 
    activity.timestamp >= oneWeekAgo
  );
  
  return weekActivities.length;
};

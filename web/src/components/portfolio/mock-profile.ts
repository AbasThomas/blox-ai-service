
// Mock profile data for live portfolio previews
export const MOCK_PORTFOLIO_PROFILE: any = {
  id: 'mock-preview-id',
  slug: 'preview',
  templateId: 'portfolio-modern-001',
  basic: {
    name: 'Alex Chen',
    tagline: 'Full-Stack Developer & UI Designer',
    about: 'I build accessible, pixel-perfect, and performant web experiences. Currently focused on React, Next.js, and TypeScript ecosystems.',
    location: 'San Francisco, CA',
    availability: 'Open to work',
    avatar: '', // Empty to trigger initials fallback or placeholder
  },
  socials: {
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
    website: 'https://example.com',
  },
  sections: {
    projects: [
      {
        id: 'p1',
        title: 'E-Commerce Dashboard',
        description: 'A comprehensive analytics dashboard for online retailers with real-time data visualization.',
        tags: ['React', 'D3.js', 'Node.js'],
        url: 'https://example.com',
        repoUrl: 'https://github.com',
        images: [],
      },
      {
        id: 'p2',
        title: 'Task Management App',
        description: 'Collaborative task manager with drag-and-drop interface and team features.',
        tags: ['Vue.js', 'Firebase', 'Tailwind'],
        url: 'https://example.com',
        repoUrl: 'https://github.com',
        images: [],
      },
    ],
    work: [
      {
        id: 'w1',
        company: 'TechStart Inc.',
        role: 'Senior Frontend Engineer',
        startDate: '2021-03',
        endDate: 'Present',
        current: true,
        description: 'Leading the frontend team in rebuilding the core product using Next.js.',
      },
      {
        id: 'w2',
        company: 'Creative Agency',
        role: 'Web Developer',
        startDate: '2019-06',
        endDate: '2021-02',
        current: false,
        description: 'Developed custom websites for high-profile clients using modern web technologies.',
      },
    ],
    skills: [
      { id: 's1', name: 'React', level: 'Expert' },
      { id: 's2', name: 'TypeScript', level: 'Advanced' },
      { id: 's3', name: 'Node.js', level: 'Advanced' },
      { id: 's4', name: 'UI/UX Design', level: 'Intermediate' },
      { id: 's5', name: 'GraphQL', level: 'Intermediate' },
    ],
    education: [
      {
        id: 'e1',
        institution: 'University of Technology',
        degree: 'B.S. Computer Science',
        year: '2019',
      },
    ],
    contact: {
      email: 'alex@example.com',
      phone: '+1 (555) 123-4567',
      ctaMessage: 'Interested in working together? Let\'s talk.',
    },
  },
  meta: {
    title: 'Alex Chen - Portfolio',
    description: 'Personal portfolio of Alex Chen, Full-Stack Developer.',
  },
};

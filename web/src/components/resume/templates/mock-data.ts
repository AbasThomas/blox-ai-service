
import { ResumeData } from '../types';

export const MOCK_PREVIEW_DATA: ResumeData = {
  title: 'Preview',
  targetRole: 'Software Engineer',
  persona: 'job-seeker',
  selectedTemplate: 'ats-tech',
  tailorToJob: false,
  pullFromPortfolio: false,
  jobDesc: '',
  contact: {
    name: 'Alex Morgan',
    email: 'alex@example.com',
    phone: '+1 234 567 890',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/alex',
    website: 'alex.dev',
  },
  summary: '<p>Experienced developer with a focus on scalable web applications and modern UI/UX design.</p>',
  experience: [
    {
      id: '1',
      role: 'Senior Developer',
      company: 'Tech Corp',
      startDate: '2020',
      endDate: 'Present',
      current: true,
      bullets: '<ul><li>Led team of 5 engineers</li><li>Optimized CI/CD pipeline</li></ul>',
    },
    {
      id: '2',
      role: 'Web Developer',
      company: 'StartUp Inc',
      startDate: '2018',
      endDate: '2020',
      current: false,
      bullets: '<ul><li>Built React dashboard</li><li>Improved load time by 40%</li></ul>',
    },
  ],
  education: [
    {
      id: '1',
      degree: 'BS Computer Science',
      institution: 'University of Tech',
      year: '2018',
      gpa: '3.8',
    },
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'GraphQL', 'Tailwind CSS'],
  certifications: ['AWS Certified Developer', 'Meta Frontend Pro'],
};

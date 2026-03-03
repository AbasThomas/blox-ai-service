import { TemplateDefinition } from './template-types';

export const CORE_TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: 'portfolio-modern-001',
    name: 'Modern Portfolio',
    category: 'portfolio',
    industry: 'general',
    sections: [
      { id: 'hero', title: 'Hero', required: true, sourceKeys: ['headline', 'summary'] },
      { id: 'about', title: 'About', required: false, sourceKeys: ['bio', 'about'] },
      {
        id: 'work',
        title: 'Work Experience',
        required: false,
        sourceKeys: ['experience', 'workHistory'],
      },
      {
        id: 'projects',
        title: 'Projects',
        required: false,
        sourceKeys: ['projects', 'githubRepos'],
      },
      {
        id: 'certifications',
        title: 'Certifications & Badges',
        required: false,
        sourceKeys: ['certifications', 'badges'],
      },
      { id: 'skills', title: 'Skills', required: false, sourceKeys: ['skills'] },
      { id: 'contact', title: 'Contact', required: false, sourceKeys: ['contact', 'links'] },
    ],
  },
  {
    id: 'resume-ats-001',
    name: 'ATS Resume',
    category: 'resume',
    industry: 'general',
    sections: [
      { id: 'summary', title: 'Summary', required: true, sourceKeys: ['summary'] },
      { id: 'experience', title: 'Experience', required: true, sourceKeys: ['experience'] },
      { id: 'education', title: 'Education', required: true, sourceKeys: ['education'] },
      { id: 'skills', title: 'Skills', required: true, sourceKeys: ['skills'] },
    ],
  },
  {
    id: 'cover-letter-focused-001',
    name: 'Focused Cover Letter',
    category: 'cover-letter',
    industry: 'general',
    sections: [
      { id: 'opening', title: 'Opening', required: true, sourceKeys: ['jobTitle', 'company'] },
      { id: 'body', title: 'Body', required: true, sourceKeys: ['experience', 'achievements'] },
      { id: 'closing', title: 'Closing', required: true, sourceKeys: ['contact'] },
    ],
  },
];


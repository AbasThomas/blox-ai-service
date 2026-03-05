import { TechResumeTemplate } from './TechResumeTemplate';
import { ExecutiveResumeTemplate } from './ExecutiveResumeTemplate';
import { CreativeResumeTemplate } from './CreativeResumeTemplate';
import { AcademicResumeTemplate } from './AcademicResumeTemplate';
import { FreelancerResumeTemplate } from './FreelancerResumeTemplate';
import { MarketingResumeTemplate } from './MarketingResumeTemplate';
import { ModernResumeTemplate } from './ModernResumeTemplate';
import { EntryLevelResumeTemplate } from './EntryLevelResumeTemplate';
import { ResumeTemplateProps } from '../types';

export const RESUME_TEMPLATES: Record<string, React.ComponentType<ResumeTemplateProps>> = {
  'ats-tech': TechResumeTemplate,
  'executive': ExecutiveResumeTemplate,
  'creative': CreativeResumeTemplate,
  'academic': AcademicResumeTemplate,
  'freelance': FreelancerResumeTemplate,
  'marketing': MarketingResumeTemplate,
  'modern': ModernResumeTemplate,
  'entry': EntryLevelResumeTemplate,
};

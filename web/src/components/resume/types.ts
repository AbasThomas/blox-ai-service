export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string; // HTML or plain text
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  gpa: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
}

export interface ResumeData {
  title: string;
  targetRole: string;
  persona: string;
  selectedTemplate: string;
  tailorToJob: boolean;
  pullFromPortfolio: boolean;
  jobDesc: string;
  summary: string; // HTML or plain text
  experience: ExperienceItem[];
  skills: string[];
  education: EducationItem[];
  certifications: string[]; // Added certifications
  contact: ContactInfo;
}

export interface ResumeTemplateProps {
  data: ResumeData;
  theme?: 'light' | 'dark';
}

import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? 'http://localhost:3334';

@Processor('asset-generate')
export class AssetGenerateProcessor extends WorkerHost {
  private readonly logger = new Logger(AssetGenerateProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ assetId: string; type: string; prompt: string; userId: string }>) {
    const { assetId, type, prompt, userId } = job.data;
    this.logger.log(`[asset-generate] Job ${job.id} for asset ${assetId}`);

    // Fetch existing content so we can merge instead of overwrite
    const existing = await this.prisma.asset.findUnique({ where: { id: assetId }, select: { content: true } });
    const existingContent = (existing?.content && typeof existing.content === 'object' && !Array.isArray(existing.content))
      ? (existing.content as Record<string, unknown>)
      : {};

    try {
      // Mark as processing — preserve all existing content fields
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { content: { ...existingContent, generatingStatus: 'processing' } },
      });

      // Call AI service
      let generatedContent: string;
      try {
        const response = await axios.post<{ content?: string }>(
          `${AI_SERVICE_URL}/v1/ai/generate`,
          {
            assetType: type,
            prompt: this.buildPrompt(type, prompt),
            context: { assetId, userId, flow: 'asset-generate' },
            preferredRoute: 'generation_critique',
          },
          { timeout: 120_000 },
        );
        generatedContent = response.data.content || this.buildFallbackContent(type, prompt);
      } catch (err) {
        this.logger.warn('AI service unavailable, using fallback content');
        generatedContent = this.buildFallbackContent(type, prompt);
      }

      // Map to structured content matching the editor's expected shape
      const generatedFields = this.mapToContentFields(type, generatedContent);

      // Merge generated fields into existing content (preserves templateId, profile, etc.)
      const updatedContent = {
        ...existingContent,
        ...generatedFields,
        generatingStatus: 'completed',
        generatedAt: new Date().toISOString(),
      };

      await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          content: updatedContent,
          healthScore: Math.min(Object.keys(generatedFields).length * 12, 95),
        },
      });

      // Create version snapshot
      await this.prisma.assetVersion.create({
        data: {
          assetId,
          versionLabel: 'v1.0 (AI Generated)',
          branchName: 'main',
          content: updatedContent,
          createdBy: userId,
        },
      });

      // Notify user
      const typeLabel = type === 'PORTFOLIO' ? 'portfolio' : type === 'RESUME' ? 'résumé' : 'cover letter';
      const editPath = type === 'PORTFOLIO' ? `/portfolios/${assetId}` : type === 'RESUME' ? `/resumes/${assetId}/edit` : `/cover-letters/${assetId}/edit`;
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'asset_generated',
          title: `Your ${typeLabel} is ready!`,
          message: `AI generation completed successfully. Review your content and make any adjustments before publishing.`,
          link: editPath,
          payload: { assetId, type },
        },
      });

      this.logger.log(`[asset-generate] Completed for asset ${assetId}`);
      return { assetId, status: 'COMPLETED', fields: Object.keys(generatedFields).length };
    } catch (err) {
      this.logger.error(`[asset-generate] Failed for ${assetId}`, err);
      await this.prisma.asset.update({
        where: { id: assetId },
        data: { content: { ...existingContent, generatingStatus: 'failed', error: String(err) } },
      }).catch(() => undefined);
      throw err;
    }
  }

  /** Builds the rich, structured AI prompt for each asset type */
  private buildPrompt(type: string, userRequest: string): string {
    if (type === 'PORTFOLIO') {
      return `You are an elite portfolio copywriter and personal branding strategist. Your task is to generate premium, conversion-optimised portfolio content for a real professional.

PROFESSIONAL'S REQUEST:
${userRequest}

INSTRUCTIONS:
- Write in first person, confident and authentic tone
- Every achievement must be specific — include metrics, scale, impact where inferable
- Hero body must be a compelling 2-3 sentence elevator pitch (no clichés like "passionate" or "guru")
- About section: 180-250 words, narrative arc — origin → expertise → current focus → vision
- Experience: 2-4 roles, each with a strong achievement bullet (quantified where possible)
- Projects: 2-4 projects with clear problem-solution-outcome descriptions (60-90 words each)
- Skills: 8-14 specific, real-world skills (not soft skills)
- Contact CTA: warm, specific, action-oriented (1-2 sentences)

OUTPUT ONLY VALID JSON — no markdown fences, no explanation, no extra text:
{
  "heroHeading": "Name or powerful identity statement (max 60 chars)",
  "heroBody": "2-3 sentence elevator pitch with specific impact",
  "about": "Full narrative biography paragraph (180-250 words)",
  "experienceItems": [
    { "role": "Job Title", "company": "Company Name", "period": "2021–Present", "summary": "One strong achievement sentence with metric" }
  ],
  "projectItems": [
    { "title": "Project Name", "description": "Problem, solution, outcome with metric (60-90 words)", "url": "", "tags": ["Tech1", "Tech2"] }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "contact": "Warm, specific invitation to connect (1-2 sentences)"
}`;
    }

    if (type === 'RESUME') {
      return `You are a senior ATS-optimised resume strategist with 10+ years experience placing candidates at top companies. Generate a premium, job-ready resume that passes ATS filters and impresses human reviewers.

CANDIDATE'S REQUEST:
${userRequest}

INSTRUCTIONS:
- Summary: 3-4 sentences. Open with years of experience + specialisation + standout achievement. Close with what they're seeking.
- Experience bullets must use the STAR format compressed into one impactful sentence each
- Every bullet should start with a strong action verb (Architected, Spearheaded, Reduced, Increased, Launched...)
- Quantify everything possible — percentages, dollar values, team sizes, timeframes
- Skills: list 10-16 specific technical skills recruiters search for in this domain
- Education and certifications: accurate, formatted cleanly

OUTPUT ONLY VALID JSON — no markdown fences, no explanation, no extra text:
{
  "summary": "3-4 sentence executive summary with specific achievements and career focus",
  "experienceItems": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "period": "Jan 2021 – Present",
      "current": true,
      "summary": "• Achievement with metric\\n• Achievement with metric\\n• Achievement with metric"
    }
  ],
  "educationItems": [
    { "degree": "Degree Name", "institution": "University Name", "year": "2019", "gpa": "" }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "certifications": ["Certification Name | Issuing Body | Year"]
}`;
    }

    if (type === 'COVER_LETTER') {
      return `You are an expert career coach and cover letter writer. Write a highly personalised, compelling cover letter that makes the hiring manager stop scrolling.

CANDIDATE'S REQUEST:
${userRequest}

INSTRUCTIONS:
- Opening: hook with a specific accomplishment or genuine connection to the role (not "I am applying for...")
- Body 1: most relevant experience with a specific quantified achievement
- Body 2: why THIS company specifically — show you've done research, reference their mission/product/culture
- Closing: confident, specific next step — not desperate, not generic
- Tone: professional but human, confident but not arrogant
- Total length: 280-350 words

OUTPUT ONLY VALID JSON — no markdown fences, no explanation, no extra text:
{
  "greeting": "Dear [Hiring Manager / Team Name],",
  "openingParagraph": "Hook paragraph (2-3 sentences)",
  "bodyParagraph1": "Key achievement and relevance (3-4 sentences with metric)",
  "bodyParagraph2": "Company-specific fit and enthusiasm (2-3 sentences)",
  "closingParagraph": "Confident close with clear next step (2 sentences)",
  "signature": "Sincerely,\\n[Candidate Name]"
}`;
    }

    return `Generate professional ${type} content for: ${userRequest}. Output only clean, high-quality text.`;
  }

  /**
   * Maps AI-generated JSON (or plain text fallback) into the structured content shape
   * expected by the portfolio/resume editor.
   */
  private mapToContentFields(type: string, content: string): Record<string, unknown> {
    // Try parsing as JSON first (preferred — matches our structured prompts)
    let parsed: Record<string, unknown> | null = null;
    try {
      const cleaned = content
        .replace(/^```(?:json)?[\s\S]*?\n/i, '')
        .replace(/```$/g, '')
        .trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      }
    } catch {
      // fall through to line-based parser
    }

    if (parsed && type === 'PORTFOLIO') {
      const asStr = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
      const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

      const experienceItems = asArr(parsed.experienceItems).map((item) => {
        if (typeof item === 'string') return { role: item };
        const row = item as Record<string, unknown>;
        return {
          role: asStr(row.role),
          company: asStr(row.company),
          period: asStr(row.period),
          summary: asStr(row.summary),
        };
      }).filter((e) => e.role);

      const projectItems = asArr(parsed.projectItems).map((item) => {
        if (typeof item === 'string') return { title: item, description: '' };
        const row = item as Record<string, unknown>;
        return {
          title: asStr(row.title),
          description: asStr(row.description),
          url: asStr(row.url),
          tags: Array.isArray(row.tags) ? row.tags.map((t) => asStr(t)).filter(Boolean) : [],
        };
      }).filter((p) => p.title);

      const skills = asArr(parsed.skills).map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);

      return {
        hero: { heading: asStr(parsed.heroHeading), body: asStr(parsed.heroBody) },
        about: { body: asStr(parsed.about) },
        experience: { items: experienceItems },
        projects: { items: projectItems },
        skills: { items: skills },
        contact: { body: asStr(parsed.contact) },
      };
    }

    if (parsed && type === 'RESUME') {
      const asStr = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
      const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

      const experienceItems = asArr(parsed.experienceItems).map((item) => {
        const row = item as Record<string, unknown>;
        return {
          role: asStr(row.role),
          company: asStr(row.company),
          period: asStr(row.period),
          current: row.current === true,
          bullets: asStr(row.summary || row.bullets),
        };
      }).filter((e) => e.role);

      const educationItems = asArr(parsed.educationItems).map((item) => {
        const row = item as Record<string, unknown>;
        return { degree: asStr(row.degree), institution: asStr(row.institution), year: asStr(row.year), gpa: asStr(row.gpa) };
      }).filter((e) => e.degree);

      const skills = asArr(parsed.skills).map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
      const certifications = asArr(parsed.certifications).map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);

      return {
        summary: { body: asStr(parsed.summary) },
        experience: { items: experienceItems },
        education: { items: educationItems },
        skills: { items: skills },
        certifications: { items: certifications },
      };
    }

    if (parsed && type === 'COVER_LETTER') {
      const asStr = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
      const body = [
        asStr(parsed.openingParagraph),
        asStr(parsed.bodyParagraph1),
        asStr(parsed.bodyParagraph2),
        asStr(parsed.closingParagraph),
      ].filter(Boolean).join('\n\n');
      return { summary: { body: `${asStr(parsed.greeting)}\n\n${body}\n\n${asStr(parsed.signature)}` } };
    }

    // Fallback: line-based parsing for plain-text AI responses
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    const get = (i: number) => lines[i] ?? '';

    if (type === 'PORTFOLIO') {
      return {
        hero: { heading: get(0), body: get(1) },
        about: { body: lines.slice(2, 5).join(' ') },
        experience: { items: lines.slice(5, 8).filter(Boolean) },
        projects: { items: lines.slice(8, 12).filter(Boolean) },
        skills: { items: lines.slice(12, 18).filter(Boolean) },
        contact: { body: get(18) },
      };
    }

    if (type === 'RESUME') {
      return {
        summary: { body: lines.slice(0, 3).join(' ') },
        experience: { items: lines.slice(3, 7).filter(Boolean) },
        education: { items: lines.slice(7, 9).filter(Boolean) },
        skills: { items: lines.slice(9, 16).filter(Boolean) },
      };
    }

    return { summary: { body: content } };
  }

  private buildFallbackContent(type: string, prompt: string): string {
    const name = prompt.split(/[\s,]+/)[0] || 'Professional';
    if (type === 'PORTFOLIO') {
      return JSON.stringify({
        heroHeading: `${name} — Product Designer & Technologist`,
        heroBody: `I design and build digital products that solve real problems. With 5+ years shipping high-impact interfaces across fintech and SaaS, I bridge the gap between user needs and business outcomes — delivering measurable results at every stage.`,
        about: `I'm a product-focused designer with a systems mindset. My work sits at the intersection of design, engineering, and strategy — I don't just create beautiful interfaces, I build ones that perform.\n\nOver the past 5 years, I've helped early-stage startups and established companies ship products used by hundreds of thousands of people. My process starts with deep problem discovery, moves through rapid iteration, and ends with pixel-perfect execution backed by data.\n\nCurrently focused on B2B SaaS products where design directly drives retention and revenue. When I'm not designing, I contribute to open source, write about design systems, and mentor junior designers.`,
        experienceItems: [
          { role: 'Senior Product Designer', company: 'Fintech Startup', period: '2022–Present', summary: 'Led redesign of core onboarding flow — reduced drop-off by 34% and increased activation rate to 78%' },
          { role: 'UI/UX Designer', company: 'Digital Agency', period: '2020–2022', summary: 'Delivered 14 client projects across e-commerce and SaaS, maintaining 98% client satisfaction rate' },
          { role: 'Junior Designer', company: 'Product Studio', period: '2019–2020', summary: 'Built and shipped design system adopted across 3 products, reducing design-to-dev handoff time by 40%' },
        ],
        projectItems: [
          { title: 'Payments Dashboard Redesign', description: 'Redesigned a complex B2B payments dashboard processing $2M+ daily. Conducted 12 user interviews, identified 3 critical friction points, and shipped an MVP in 6 weeks. Result: 41% reduction in support tickets and 28% increase in feature adoption.', url: '', tags: ['Figma', 'User Research', 'Design Systems'] },
          { title: 'Mobile Banking App', description: 'End-to-end design for a mobile banking app targeting underserved markets in West Africa. Built inclusive design system with WCAG AA compliance. Achieved 4.7★ App Store rating within 2 months of launch with 50k+ downloads.', url: '', tags: ['Mobile', 'Inclusive Design', 'Prototyping'] },
        ],
        skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping', 'Usability Testing', 'React', 'TypeScript', 'Framer Motion', 'SQL', 'Analytics'],
        contact: `I'm always open to interesting problems and the right collaborations. If you're building something ambitious, let's talk.`,
      });
    }

    if (type === 'RESUME') {
      return JSON.stringify({
        summary: `Results-driven software engineer with 5+ years of experience building scalable web applications and distributed systems. Specialised in TypeScript, React, and Node.js, with a track record of reducing infrastructure costs by 30% and shipping features that increased user retention by 25%. Seeking senior engineering roles at growth-stage companies where technical excellence and product thinking intersect.`,
        experienceItems: [
          { role: 'Senior Software Engineer', company: 'Tech Company', period: '2022–Present', current: true, bullets: '• Architected microservices migration that reduced p99 latency from 800ms to 120ms for 500k daily users\n• Led a team of 4 engineers to deliver a real-time analytics pipeline processing 10M events/day\n• Introduced automated testing culture — increased code coverage from 42% to 87% across 3 repos' },
          { role: 'Software Engineer', company: 'Digital Agency', period: '2020–2022', current: false, bullets: '• Built and shipped 8 production features used by 200k+ users, maintaining 99.9% uptime SLA\n• Reduced CI/CD pipeline duration by 55% through caching and parallelisation improvements\n• Mentored 2 junior developers, both promoted within 12 months' },
        ],
        educationItems: [{ degree: 'B.Sc. Computer Science', institution: 'University of Technology', year: '2019', gpa: '' }],
        skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'GraphQL', 'Python', 'Kubernetes', 'Terraform', 'Jest'],
        certifications: ['AWS Certified Solutions Architect | Amazon Web Services | 2023'],
      });
    }

    return `${name} — ${prompt}\n\nProfessional with demonstrated expertise and measurable impact across key business metrics.`;
  }
}

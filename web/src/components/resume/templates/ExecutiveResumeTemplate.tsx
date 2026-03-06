import { ResumeTemplateProps } from '../types';

export function ExecutiveResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, certifications } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white p-12 font-serif text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-10 print:shadow-none">
      {/* Header */}
      <header className="mb-8 border-b-2 border-slate-900 pb-6 text-center [print-color-adjust:exact]">
        <h1 className="mb-1.5 font-serif text-4xl font-bold tracking-tight text-slate-900">
          {contact.name || 'Your Name'}
        </h1>
        <p className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {data.targetRole || 'Executive Leadership'}
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-sans text-xs text-slate-500">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span aria-hidden>·</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.location && <span aria-hidden>·</span>}
          {contact.location && <span>{contact.location}</span>}
          {contact.linkedin && <span aria-hidden>·</span>}
          {contact.linkedin && <span>{contact.linkedin}</span>}
        </div>
      </header>

      <div className="grid grid-cols-[1fr_176px] gap-8">
        {/* Main Column */}
        <div>
          {summary && (
            <section className="mb-7" aria-label="Executive Summary">
              <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                Executive Summary
              </h2>
              <div
                className="prose prose-sm max-w-none font-serif text-slate-700 leading-relaxed [&>p]:text-justify [&>p]:mt-0"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </section>
          )}

          {experience.length > 0 && (
            <section aria-label="Professional Experience">
              <h2 className="mb-4 border-b border-slate-200 pb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                Professional Experience
              </h2>
              <div className="space-y-6">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="mb-0.5 flex items-baseline justify-between gap-2">
                      <h3 className="font-serif text-base font-bold text-slate-900">{exp.role}</h3>
                      <span className="shrink-0 font-sans text-[10px] font-medium text-slate-400">
                        {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <div className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {exp.company}
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-slate-700 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-0.5"
                      dangerouslySetInnerHTML={{ __html: exp.bullets }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-7 border-l border-slate-100 pl-7">
          {skills.length > 0 && (
            <section aria-label="Core Competencies">
              <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                Core Competencies
              </h2>
              <ul className="space-y-1.5 font-sans text-[11px] text-slate-600">
                {skills.map((skill, index) => (
                  <li key={index} className="flex items-center gap-2 border-b border-dotted border-slate-100 pb-1 last:border-0">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {education.length > 0 && (
            <section aria-label="Education">
              <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-serif text-sm font-bold text-slate-900">{edu.institution}</div>
                    <div className="mt-0.5 font-sans text-[10px] text-slate-600">{edu.degree}</div>
                    {edu.gpa && <div className="font-sans text-[10px] text-slate-400">GPA: {edu.gpa}</div>}
                    <div className="mt-0.5 font-sans text-[10px] text-slate-400">{edu.year}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {certifications && certifications.length > 0 && (
            <section aria-label="Certifications">
              <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                Certifications
              </h2>
              <ul className="space-y-1.5 font-sans text-[11px] text-slate-600">
                {certifications.map((cert, i) => (
                  <li key={i} className="flex items-center gap-2 border-b border-dotted border-slate-100 pb-1 last:border-0">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    {cert}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

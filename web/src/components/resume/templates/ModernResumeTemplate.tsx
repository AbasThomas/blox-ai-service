import { ResumeTemplateProps } from '../types';

export function ModernResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, certifications } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white p-14 font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-10 print:shadow-none">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-5xl font-extralight tracking-tight text-slate-900">
          {contact.name || 'Your Name'}
        </h1>
        <p className="mt-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          {data.targetRole || 'Professional'}
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-xs font-light text-slate-400">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.location && <span>{contact.location}</span>}
          {contact.linkedin && <span>{contact.linkedin}</span>}
          {contact.website && <span>{contact.website}</span>}
        </div>
      </header>

      <div className="grid grid-cols-[1fr_176px] gap-14">
        {/* MAIN */}
        <main className="space-y-10">
          {summary && (
            <section aria-label="Profile">
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Profile
              </h2>
              <div
                className="prose prose-sm max-w-none text-slate-600 font-light leading-relaxed [&>p]:mt-0"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </section>
          )}

          {experience.length > 0 && (
            <section aria-label="Work Experience">
              <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Experience
              </h2>
              <div className="space-y-8">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="mb-0.5 flex items-baseline justify-between gap-2">
                      <h3 className="text-lg font-medium text-slate-900">{exp.role}</h3>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {exp.company}
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-slate-600 font-light [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-0.5"
                      dangerouslySetInnerHTML={{ __html: exp.bullets }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* SIDEBAR */}
        <aside className="space-y-10 pt-1">
          {skills.length > 0 && (
            <section aria-label="Skills">
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Skills
              </h2>
              <div className="space-y-2">
                {skills.map((skill, i) => (
                  <div key={i} className="border-b border-slate-100 pb-2 text-sm font-light text-slate-700 last:border-0">
                    {skill}
                  </div>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && (
            <section aria-label="Education">
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Education
              </h2>
              <div className="space-y-5">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-semibold text-slate-900 text-sm">{edu.institution}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{edu.degree}</div>
                    {edu.gpa && <div className="text-[10px] text-slate-400">GPA {edu.gpa}</div>}
                    <div className="mt-0.5 text-[10px] text-slate-400">{edu.year}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {certifications && certifications.length > 0 && (
            <section aria-label="Certifications">
              <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Certifications
              </h2>
              <div className="space-y-2">
                {certifications.map((cert, i) => (
                  <div key={i} className="border-b border-slate-100 pb-2 text-xs font-light text-slate-600 last:border-0">
                    {cert}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

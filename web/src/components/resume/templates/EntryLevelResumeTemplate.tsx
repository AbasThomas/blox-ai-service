import { ResumeTemplateProps } from '../types';

export function EntryLevelResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, certifications } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:shadow-none">
      {/* Top accent bar */}
      <div
        className="h-1.5 bg-indigo-500 [print-color-adjust:exact]"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}
      />

      <div className="p-10">
        {/* Header */}
        <header className="mb-8 border-b-2 border-slate-100 pb-6">
          <h1 className="mb-1 text-4xl font-bold tracking-tight text-slate-900">
            {contact.name || 'Your Name'}
          </h1>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">
            {data.targetRole || 'Aspiring Professional'}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>{contact.phone}</span>}
            {contact.location && <span>{contact.location}</span>}
            {contact.linkedin && <span>{contact.linkedin}</span>}
            {contact.website && <span>{contact.website}</span>}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_200px]">
          {/* Main Content */}
          <main className="space-y-7">
            {summary && (
              <section aria-label="Profile">
                <h2 className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">
                  Profile
                </h2>
                <div
                  className="prose prose-sm max-w-none text-slate-700 leading-relaxed [&>p]:mt-0"
                  dangerouslySetInnerHTML={{ __html: summary }}
                />
              </section>
            )}

            {/* Education prominent for entry-level */}
            {education.length > 0 && (
              <section aria-label="Education">
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">
                  Education
                </h2>
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="border-l-2 border-indigo-100 pl-4 [print-color-adjust:exact]">
                      <div className="mb-0.5 flex flex-wrap justify-between gap-2">
                        <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                        <span className="text-xs font-medium text-slate-400">{edu.year}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-700">{edu.degree}</div>
                      {edu.gpa && (
                        <div className="mt-0.5 text-xs text-slate-400">GPA: {edu.gpa}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <section aria-label="Experience">
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">
                  Experience
                </h2>
                <div className="space-y-5">
                  {experience.map((exp) => (
                    <div key={exp.id} className="border-l-2 border-slate-100 pl-4 [print-color-adjust:exact]">
                      <div className="mb-0.5 flex flex-wrap justify-between gap-2">
                        <h3 className="font-bold text-slate-900">{exp.role}</h3>
                        <span className="text-xs font-medium text-slate-400">
                          {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      <div className="mb-2 text-xs italic text-slate-500">{exp.company}</div>
                      <div
                        className="prose prose-sm max-w-none text-slate-600 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-0.5"
                        dangerouslySetInnerHTML={{ __html: exp.bullets }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="space-y-7 border-t-2 border-slate-100 pt-7 md:border-l-2 md:border-t-0 md:pl-7 md:pt-0 [print-color-adjust:exact]">
            {skills.length > 0 && (
              <section aria-label="Skills">
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 [print-color-adjust:exact]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {certifications && certifications.length > 0 && (
              <section aria-label="Certifications">
                <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">
                  Certifications
                </h2>
                <ul className="space-y-1.5">
                  {certifications.map((cert, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                      {cert}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

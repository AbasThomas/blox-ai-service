import { ResumeTemplateProps } from '../types';

export function ModernResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white p-16 font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-0 print:shadow-none">
      <div className="flex h-full flex-col justify-between">
        <header className="mb-12">
          <h1 className="text-5xl font-light tracking-tighter text-slate-900">
            {contact.name}
          </h1>
          <p className="mt-2 text-lg font-medium tracking-wide text-slate-500 uppercase">
            {data.targetRole || 'Professional'}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400 font-light tracking-wider uppercase">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>{contact.phone}</span>}
            {contact.location && <span>{contact.location}</span>}
            {contact.linkedin && <span>{contact.linkedin}</span>}
          </div>
        </header>

        <div className="grid grid-cols-[1fr_200px] gap-16">
          <main className="space-y-12">
            {summary && (
              <section>
                <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Profile
                </h2>
                <div
                  className="prose prose-lg max-w-none text-slate-700 font-light leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: summary }}
                />
              </section>
            )}

            {experience.length > 0 && (
              <section>
                <h2 className="mb-8 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Experience
                </h2>
                <div className="space-y-10">
                  {experience.map((exp) => (
                    <div key={exp.id}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <h3 className="text-xl font-medium text-slate-900">{exp.role}</h3>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      <div className="mb-4 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                        {exp.company}
                      </div>
                      <div
                        className="prose prose-sm max-w-none text-slate-600 font-light [&>ul]:list-disc [&>ul]:pl-4"
                        dangerouslySetInnerHTML={{ __html: exp.bullets }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="space-y-12 pt-2">
            {skills.length > 0 && (
              <section>
                <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Skills
                </h2>
                <div className="space-y-3">
                  {skills.map((skill, i) => (
                    <div key={i} className="text-sm font-medium text-slate-700 border-b border-slate-100 pb-2 last:border-0">
                      {skill}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {education.length > 0 && (
              <section>
                <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Education
                </h2>
                <div className="space-y-6">
                  {education.map((edu) => (
                    <div key={edu.id}>
                      <div className="font-bold text-slate-900">{edu.institution}</div>
                      <div className="text-sm text-slate-600">{edu.degree}</div>
                      <div className="mt-1 text-xs text-slate-400">{edu.year}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

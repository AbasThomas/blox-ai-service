import { ResumeTemplateProps } from '../types';

export function ExecutiveResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white p-12 font-serif text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-0 print:shadow-none">
      {/* Header */}
      <header className="mb-8 border-b-2 border-slate-900 pb-6 text-center">
        <h1 className="mb-2 font-serif text-5xl font-bold tracking-tight text-slate-900 uppercase">
          {contact.name || 'Your Name'}
        </h1>
        <p className="mb-6 font-sans text-sm font-medium tracking-widest text-slate-500 uppercase">
          {data.targetRole || 'Executive Leadership'}
        </p>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-sans text-xs text-slate-600 uppercase tracking-wider">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>• {contact.phone}</span>}
          {contact.location && <span>• {contact.location}</span>}
          {contact.linkedin && <span>• {contact.linkedin}</span>}
        </div>
      </header>

      <div className="grid grid-cols-[1fr_200px] gap-8">
        {/* Main Column */}
        <div>
          {/* Summary */}
          {summary && (
            <section className="mb-8">
              <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-sm font-bold uppercase tracking-widest text-slate-900">
                Executive Summary
              </h2>
              <div
                className="prose prose-sm max-w-none font-serif text-slate-700 leading-relaxed text-justify"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </section>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 border-b border-slate-200 pb-1 font-sans text-sm font-bold uppercase tracking-widest text-slate-900">
                Professional Experience
              </h2>
              <div className="space-y-6">
                {experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="mb-1 flex items-baseline justify-between">
                      <h3 className="font-serif text-lg font-bold text-slate-900">
                        {exp.role}
                      </h3>
                      <span className="font-sans text-xs font-medium text-slate-500">
                        {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <div className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {exp.company}
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-slate-700 [&>ul]:list-disc [&>ul]:pl-4"
                      dangerouslySetInnerHTML={{ __html: exp.bullets }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Column */}
        <aside className="space-y-8 border-l border-slate-100 pl-8">
          {/* Skills */}
          {skills.length > 0 && (
            <section>
              <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-xs font-bold uppercase tracking-widest text-slate-900">
                Core Competencies
              </h2>
              <ul className="space-y-1.5 font-sans text-xs text-slate-600">
                {skills.map((skill, index) => (
                  <li key={index} className="border-b border-dotted border-slate-200 pb-1 last:border-0">
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section>
              <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-xs font-bold uppercase tracking-widest text-slate-900">
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-serif text-sm font-bold text-slate-900">{edu.institution}</div>
                    <div className="mt-0.5 font-sans text-xs text-slate-600">{edu.degree}</div>
                    <div className="mt-0.5 font-sans text-[10px] text-slate-400">{edu.year}</div>
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

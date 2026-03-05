import { ResumeTemplateProps } from '../types';

export function EntryLevelResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white p-12 font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-0 print:shadow-none">
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="mb-8 border-b-2 border-slate-200 pb-6 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900">
            {contact.name}
          </h1>
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-slate-500">
            {data.targetRole || 'Aspiring Professional'}
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>• {contact.phone}</span>}
            {contact.location && <span>• {contact.location}</span>}
            {contact.linkedin && <span>• {contact.linkedin}</span>}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_250px]">
          {/* Main Content */}
          <main className="space-y-8">
            {/* Summary */}
            {summary && (
              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-indigo-600">
                  Profile
                </h2>
                <div
                  className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: summary }}
                />
              </section>
            )}

            {/* Education - Prominent for Entry Level */}
            {education.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-indigo-600">
                  Education
                </h2>
                <div className="space-y-6">
                  {education.map((edu) => (
                    <div key={edu.id} className="border-l-2 border-indigo-100 pl-4">
                      <div className="mb-1 flex flex-wrap justify-between gap-2">
                        <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                        <span className="text-xs font-medium text-slate-500">{edu.year}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-700">{edu.degree}</div>
                      {edu.gpa && (
                        <div className="mt-1 text-xs text-slate-500">GPA: {edu.gpa}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-indigo-600">
                  Experience
                </h2>
                <div className="space-y-6">
                  {experience.map((exp) => (
                    <div key={exp.id} className="border-l-2 border-slate-100 pl-4">
                      <div className="mb-1 flex flex-wrap justify-between gap-2">
                        <h3 className="font-bold text-slate-900">{exp.role}</h3>
                        <span className="text-xs font-medium text-slate-500">
                          {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      <div className="mb-2 text-sm italic text-slate-600">{exp.company}</div>
                      <div
                        className="prose prose-sm max-w-none text-slate-600 [&>ul]:list-disc [&>ul]:pl-4"
                        dangerouslySetInnerHTML={{ __html: exp.bullets }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Sidebar */}
          <aside className="space-y-8 border-t border-slate-100 pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            {/* Skills */}
            {skills.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-indigo-600">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                    >
                      {skill}
                    </span>
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

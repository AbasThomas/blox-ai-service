import { ResumeTemplateProps } from '../types';
import { FaChartLine, FaBullhorn, FaAward } from 'react-icons/fa';

export function MarketingResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white p-12 font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-0 print:shadow-none">
      {/* Header */}
      <header className="mb-10 flex flex-col items-center justify-between border-b-4 border-rose-500 pb-8 text-center sm:flex-row sm:text-left">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tight text-slate-900">
            {contact.name.split(' ')[0]}
            <span className="text-rose-500">{contact.name.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="mt-2 text-xl font-bold uppercase tracking-widest text-slate-500">
            {data.targetRole || 'Marketing Specialist'}
          </p>
        </div>
        <div className="mt-4 flex flex-col items-end gap-1 text-sm font-medium text-slate-600 sm:mt-0">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.location && <span>{contact.location}</span>}
          {contact.linkedin && <span className="text-rose-600">{contact.linkedin}</span>}
        </div>
      </header>

      <div className="grid grid-cols-[1fr_250px] gap-12">
        {/* Main Content */}
        <main>
          {summary && (
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold uppercase tracking-wider text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-rose-100 text-rose-600">
                  <FaBullhorn />
                </span>
                Professional Profile
              </h2>
              <div
                className="prose prose-lg max-w-none text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </section>
          )}

          {experience.length > 0 && (
            <section>
              <h2 className="mb-6 flex items-center gap-3 text-lg font-bold uppercase tracking-wider text-slate-900">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-rose-100 text-rose-600">
                  <FaChartLine />
                </span>
                Performance History
              </h2>
              <div className="space-y-8">
                {experience.map((exp) => (
                  <div key={exp.id} className="relative border-l-4 border-slate-100 pl-6 transition-colors hover:border-rose-200">
                    <div className="mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{exp.role}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
                        <span className="text-rose-600">{exp.company}</span>
                        <span>•</span>
                        <span>{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
                      </div>
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-slate-600 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li::marker]:text-rose-500"
                      dangerouslySetInnerHTML={{ __html: exp.bullets }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="space-y-10 border-l border-slate-100 pl-8">
          {skills.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-900">
                <FaAward className="text-rose-500" /> Key Skills
              </h2>
              <div className="flex flex-col gap-2">
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="border-b border-slate-100 pb-2 text-sm font-medium text-slate-600 last:border-0"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-900">
                Education
              </h2>
              <div className="space-y-6">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-bold text-slate-900">{edu.institution}</div>
                    <div className="text-sm text-rose-600">{edu.degree}</div>
                    <div className="text-xs text-slate-400">{edu.year}</div>
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

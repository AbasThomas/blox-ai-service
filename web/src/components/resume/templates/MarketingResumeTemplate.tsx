import { ResumeTemplateProps } from '../types';
import { FaChartLine, FaBullhorn, FaAward, FaCertificate } from 'react-icons/fa';

export function MarketingResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, certifications } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white p-10 font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-8 print:shadow-none">
      {/* Header */}
      <header className="mb-9 flex flex-col justify-between gap-4 border-b-4 border-rose-500 pb-7 sm:flex-row sm:items-end [print-color-adjust:exact]">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            {contact.name?.split(' ')[0] || 'Your'}
            <span className="text-rose-500 [print-color-adjust:exact]">
              {' '}{contact.name?.split(' ').slice(1).join(' ') || 'Name'}
            </span>
          </h1>
          <p className="mt-1.5 text-sm font-bold uppercase tracking-widest text-slate-400">
            {data.targetRole || 'Marketing Specialist'}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-xs font-medium text-slate-500 sm:items-end sm:text-right">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.location && <span>{contact.location}</span>}
          {contact.linkedin && <span className="text-rose-500">{contact.linkedin}</span>}
        </div>
      </header>

      <div className="grid grid-cols-[1fr_200px] gap-10">
        {/* Main Content */}
        <main>
          {summary && (
            <section className="mb-8" aria-label="Professional Profile">
              <h2 className="mb-4 flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-slate-800">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-rose-50 text-rose-600 [print-color-adjust:exact]">
                  <FaBullhorn className="h-3.5 w-3.5" aria-hidden />
                </span>
                Professional Profile
              </h2>
              <div
                className="prose prose-sm max-w-none text-slate-600 leading-relaxed [&>p]:mt-0"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </section>
          )}

          {experience.length > 0 && (
            <section aria-label="Performance History">
              <h2 className="mb-5 flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-slate-800">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-rose-50 text-rose-600 [print-color-adjust:exact]">
                  <FaChartLine className="h-3.5 w-3.5" aria-hidden />
                </span>
                Performance History
              </h2>
              <div className="space-y-7">
                {experience.map((exp) => (
                  <div key={exp.id} className="relative border-l-4 border-slate-100 pl-5 [print-color-adjust:exact]">
                    <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-rose-400 [print-color-adjust:exact]" />
                    <div className="mb-1">
                      <h3 className="font-bold text-slate-900">{exp.role}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400">
                        <span className="text-rose-500">{exp.company}</span>
                        <span aria-hidden>·</span>
                        <span>{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
                      </div>
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-slate-600 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-0.5 [&>ul>li::marker]:text-rose-400"
                      dangerouslySetInnerHTML={{ __html: exp.bullets }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="space-y-8 border-l border-slate-100 pl-7">
          {skills.length > 0 && (
            <section aria-label="Key Skills">
              <h2 className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                <FaAward className="text-rose-500" aria-hidden /> Key Skills
              </h2>
              <div className="flex flex-col gap-1.5">
                {skills.map((skill, i) => (
                  <div key={i} className="border-b border-slate-100 pb-1.5 text-xs font-medium text-slate-600 last:border-0">
                    {skill}
                  </div>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && (
            <section aria-label="Education">
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                Education
              </h2>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="text-sm font-bold text-slate-900">{edu.institution}</div>
                    <div className="text-xs text-rose-500">{edu.degree}</div>
                    {edu.gpa && <div className="text-[10px] text-slate-400">GPA: {edu.gpa}</div>}
                    <div className="text-[10px] text-slate-400">{edu.year}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {certifications && certifications.length > 0 && (
            <section aria-label="Certifications">
              <h2 className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                <FaCertificate className="text-rose-500" aria-hidden /> Certifications
              </h2>
              <ul className="space-y-1.5">
                {certifications.map((cert, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-rose-400" aria-hidden />
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

import { ResumeTemplateProps } from '../types';
import { FaPaperPlane, FaBriefcase, FaStar, FaAward } from 'react-icons/fa';

export function FreelancerResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, certifications } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-slate-50 font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:shadow-none">
      <div className="grid h-full grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside
          className="bg-slate-900 p-7 text-white [print-color-adjust:exact]"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}
        >
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/20 text-2xl font-bold text-cyan-400 [print-color-adjust:exact]"
              aria-hidden
            >
              {(contact.name || 'A').charAt(0)}
            </div>
            <h1 className="mb-1 text-xl font-extrabold tracking-tight leading-snug">{contact.name || 'Your Name'}</h1>
            <p className="font-mono text-xs text-cyan-400">{data.targetRole || 'Freelance Consultant'}</p>
          </div>

          {/* Contact */}
          <div className="mb-7">
            <h2 className="mb-3 flex items-center gap-1.5 border-b border-slate-700 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              <FaPaperPlane className="text-cyan-400" aria-hidden /> Contact
            </h2>
            <ul className="space-y-2 text-xs text-slate-300">
              {contact.email && <li className="break-all">{contact.email}</li>}
              {contact.phone && <li>{contact.phone}</li>}
              {contact.location && <li>{contact.location}</li>}
              {contact.website && <li className="break-all text-cyan-400">{contact.website}</li>}
              {contact.linkedin && <li className="break-all">{contact.linkedin}</li>}
            </ul>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mb-7">
              <h2 className="mb-3 flex items-center gap-1.5 border-b border-slate-700 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                <FaStar className="text-cyan-400" aria-hidden /> Expertise
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[11px] font-medium text-cyan-200 [print-color-adjust:exact]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div className="mb-7">
              <h2 className="mb-3 flex items-center gap-1.5 border-b border-slate-700 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                <FaBriefcase className="text-cyan-400" aria-hidden /> Education
              </h2>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="text-sm font-bold text-white">{edu.institution}</div>
                    <div className="text-xs text-slate-400">{edu.degree}</div>
                    {edu.gpa && <div className="text-[10px] text-slate-500">GPA: {edu.gpa}</div>}
                    <div className="text-[10px] text-slate-500">{edu.year}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-1.5 border-b border-slate-700 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                <FaAward className="text-cyan-400" aria-hidden /> Certifications
              </h2>
              <ul className="space-y-1.5">
                {certifications.map((cert, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-cyan-400" aria-hidden />
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="p-9">
          {summary && (
            <section className="mb-8 rounded-xl bg-white p-5 shadow-sm" aria-label="About">
              <h2 className="mb-3 text-base font-bold text-slate-900">About Me</h2>
              <div
                className="prose prose-sm max-w-none text-slate-600 [&>p]:mt-0"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </section>
          )}

          {experience.length > 0 && (
            <section aria-label="Project History">
              <h2 className="mb-5 text-base font-bold text-slate-900">Project History</h2>
              <div className="space-y-5">
                {experience.map((exp) => (
                  <div key={exp.id} className="rounded-xl bg-white p-5 shadow-sm">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{exp.role}</h3>
                        <div className="text-xs font-semibold text-cyan-600">{exp.company}</div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                        {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
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
      </div>
    </div>
  );
}

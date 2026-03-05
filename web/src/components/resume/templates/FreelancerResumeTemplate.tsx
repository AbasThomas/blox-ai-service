import { ResumeTemplateProps } from '../types';
import { FaPaperPlane, FaBriefcase, FaStar } from 'react-icons/fa';

export function FreelancerResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-slate-50 font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-0 print:shadow-none">
      <div className="grid h-full grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className="bg-slate-900 p-8 text-white">
          <div className="mb-10 text-center">
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight">{contact.name}</h1>
            <p className="font-mono text-sm text-cyan-400">{data.targetRole || 'Freelance Consultant'}</p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4 flex items-center gap-2 border-b border-slate-700 pb-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                <FaPaperPlane className="text-cyan-400" /> Contact
              </h2>
              <ul className="space-y-3 text-sm text-slate-300">
                {contact.email && <li className="break-all">{contact.email}</li>}
                {contact.phone && <li>{contact.phone}</li>}
                {contact.location && <li>{contact.location}</li>}
                {contact.website && <li className="break-all text-cyan-400">{contact.website}</li>}
                {contact.linkedin && <li className="break-all">{contact.linkedin}</li>}
              </ul>
            </section>

            {skills.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 border-b border-slate-700 pb-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                  <FaStar className="text-cyan-400" /> Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-medium text-cyan-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {education.length > 0 && (
              <section>
                <h2 className="mb-4 flex items-center gap-2 border-b border-slate-700 pb-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                  <FaBriefcase className="text-cyan-400" /> Education
                </h2>
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id}>
                      <div className="font-bold text-white">{edu.institution}</div>
                      <div className="text-xs text-slate-400">{edu.degree}</div>
                      <div className="text-[10px] text-slate-500">{edu.year}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="p-10">
          {summary && (
            <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-slate-900">About Me</h2>
              <div
                className="prose prose-slate max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </section>
          )}

          {experience.length > 0 && (
            <section>
              <h2 className="mb-6 text-xl font-bold text-slate-900">Project History</h2>
              <div className="space-y-6">
                {experience.map((exp) => (
                  <div key={exp.id} className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{exp.role}</h3>
                        <div className="text-sm font-semibold text-cyan-600">{exp.company}</div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
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
      </div>
    </div>
  );
}

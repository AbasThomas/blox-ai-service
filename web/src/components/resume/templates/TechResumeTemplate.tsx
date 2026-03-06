import { ResumeTemplateProps } from '../types';
import { FaGithub, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';

export function TechResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, certifications } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-0 print:shadow-none">
      {/* Left accent bar */}
      <div className="grid grid-cols-[4px_1fr]">
        <div className="bg-indigo-600 print:bg-indigo-600 [print-color-adjust:exact]" />

        <div className="p-10">
          {/* Header */}
          <header className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="mb-1 font-mono text-3xl font-bold tracking-tight text-slate-900">
              {contact.name || 'Your Name'}
            </h1>
            <p className="mb-4 font-mono text-base font-medium text-indigo-600">
              {data.targetRole || 'Software Engineer'}
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
              {contact.email && (
                <div className="flex items-center gap-1.5">
                  <FaEnvelope className="shrink-0 text-slate-400" aria-hidden />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-1.5">
                  <FaPhone className="shrink-0 text-slate-400" aria-hidden />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.location && (
                <div className="flex items-center gap-1.5">
                  <FaMapMarkerAlt className="shrink-0 text-slate-400" aria-hidden />
                  <span>{contact.location}</span>
                </div>
              )}
              {contact.linkedin && (
                <div className="flex items-center gap-1.5">
                  <FaLinkedin className="shrink-0 text-slate-400" aria-hidden />
                  <span>{contact.linkedin}</span>
                </div>
              )}
              {contact.website && (
                <div className="flex items-center gap-1.5">
                  <FaGlobe className="shrink-0 text-slate-400" aria-hidden />
                  <span>{contact.website}</span>
                </div>
              )}
            </div>
          </header>

          {/* Summary */}
          {summary && (
            <section className="mb-7" aria-label="Professional Summary">
              <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-indigo-500 border-b border-slate-100 pb-1">
                Summary
              </h2>
              <div
                className="prose prose-sm max-w-none text-slate-700 leading-relaxed [&>p]:mt-0"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </section>
          )}

          {/* Technical Skills */}
          {skills.length > 0 && (
            <section className="mb-7" aria-label="Technical Skills">
              <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-indigo-500 border-b border-slate-100 pb-1">
                Technical Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-medium text-indigo-700 print:border print:border-indigo-200 print:bg-indigo-50 [print-color-adjust:exact]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <section className="mb-7" aria-label="Work Experience">
              <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-indigo-500 border-b border-slate-100 pb-1">
                Experience
              </h2>
              <div className="space-y-5">
                {experience.map((exp) => (
                  <div key={exp.id} className="relative border-l-2 border-indigo-100 pl-4 print:border-l-2 print:border-indigo-200 [print-color-adjust:exact]">
                    <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-2 ring-white print:hidden [print-color-adjust:exact]" />
                    <div className="mb-0.5 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{exp.role}</h3>
                      <span className="font-mono text-[11px] text-slate-400">
                        {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <div className="mb-2 font-mono text-xs font-medium text-indigo-600">{exp.company}</div>
                    <div
                      className="prose prose-sm max-w-none text-slate-600 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-0.5"
                      dangerouslySetInnerHTML={{ __html: exp.bullets }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section className="mb-7" aria-label="Education">
              <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-indigo-500 border-b border-slate-100 pb-1">
                Education
              </h2>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{edu.institution}</h3>
                      <div className="text-sm text-slate-600">
                        {edu.degree}
                        {edu.gpa && <span className="ml-2 text-slate-400">GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{edu.year}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <section aria-label="Certifications">
              <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-indigo-500 border-b border-slate-100 pb-1">
                Certifications
              </h2>
              <ul className="flex flex-wrap gap-2">
                {certifications.map((cert, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 [print-color-adjust:exact]"
                  >
                    {cert}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

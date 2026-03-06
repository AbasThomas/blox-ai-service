import { ResumeTemplateProps } from '../types';
import { FaGlobe, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

export function CreativeResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, certifications } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:shadow-none">
      <div className="grid h-full grid-cols-[36%_64%]">
        {/* Left Column */}
        <aside
          className="bg-violet-600 p-8 text-white [print-color-adjust:exact]"
          style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}
        >
          {/* Avatar initial */}
          <div className="mb-8 text-center">
            <div
              className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-3xl font-bold [print-color-adjust:exact]"
              aria-hidden
            >
              {(contact.name || 'A').charAt(0)}
            </div>
            <h1 className="mb-1 text-xl font-bold leading-snug">{contact.name || 'Your Name'}</h1>
            <p className="text-sm font-medium text-violet-200">{data.targetRole || 'Creative Professional'}</p>
          </div>

          {/* Contact */}
          <div className="mb-7">
            <h2 className="mb-3 border-b border-violet-400/40 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
              Contact
            </h2>
            <ul className="space-y-2 text-xs text-violet-100">
              {contact.email && (
                <li className="flex items-center gap-2">
                  <FaEnvelope className="shrink-0 text-violet-300" aria-hidden /> {contact.email}
                </li>
              )}
              {contact.phone && (
                <li className="flex items-center gap-2">
                  <FaPhone className="shrink-0 text-violet-300" aria-hidden /> {contact.phone}
                </li>
              )}
              {contact.location && (
                <li className="flex items-center gap-2">
                  <FaMapMarkerAlt className="shrink-0 text-violet-300" aria-hidden /> {contact.location}
                </li>
              )}
              {contact.website && (
                <li className="flex items-center gap-2">
                  <FaGlobe className="shrink-0 text-violet-300" aria-hidden /> {contact.website}
                </li>
              )}
              {contact.linkedin && (
                <li className="flex items-center gap-2">
                  <FaLinkedin className="shrink-0 text-violet-300" aria-hidden /> {contact.linkedin}
                </li>
              )}
            </ul>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mb-7">
              <h2 className="mb-3 border-b border-violet-400/40 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
                Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white [print-color-adjust:exact]"
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
              <h2 className="mb-3 border-b border-violet-400/40 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
                Education
              </h2>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="text-sm font-bold text-white">{edu.institution}</div>
                    <div className="text-xs text-violet-200">{edu.degree}</div>
                    <div className="text-[10px] text-violet-300">{edu.year}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div>
              <h2 className="mb-3 border-b border-violet-400/40 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
                Certifications
              </h2>
              <ul className="space-y-1.5">
                {certifications.map((cert, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-violet-100">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-300" aria-hidden />
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Right Column */}
        <main className="p-9">
          {summary && (
            <section className="mb-9" aria-label="Profile">
              <h2 className="mb-3 text-lg font-bold text-slate-800">Profile</h2>
              <div
                className="prose prose-sm max-w-none text-slate-600 leading-relaxed [&>p]:mt-0"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </section>
          )}

          {experience.length > 0 && (
            <section aria-label="Experience">
              <h2 className="mb-5 text-lg font-bold text-slate-800">Experience</h2>
              <div className="space-y-7">
                {experience.map((exp) => (
                  <div key={exp.id} className="relative border-l-2 border-violet-100 pl-5 [print-color-adjust:exact]">
                    <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-violet-600 [print-color-adjust:exact]" />
                    <div className="mb-0.5 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-bold text-slate-900">{exp.role}</h3>
                      <span className="text-xs font-medium text-violet-500">
                        {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <div className="mb-2 text-xs font-semibold text-slate-500">{exp.company}</div>
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

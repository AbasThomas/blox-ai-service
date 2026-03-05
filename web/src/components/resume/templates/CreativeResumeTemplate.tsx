import { ResumeTemplateProps } from '../types';
import { FaBehance, FaDribbble, FaInstagram, FaGlobe } from 'react-icons/fa';

export function CreativeResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:shadow-none">
      <div className="grid h-full grid-cols-[35%_65%]">
        {/* Left Column (Vibrant) */}
        <div className="bg-purple-600 p-8 text-white print:bg-purple-600 print:text-white print:print-color-adjust-exact">
          <div className="mb-10 text-center">
            {/* Placeholder for Photo/Logo */}
            <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-white/20 text-4xl font-bold">
              {contact.name.charAt(0)}
            </div>
            <h1 className="mb-2 text-2xl font-bold leading-tight">{contact.name}</h1>
            <p className="font-mono text-sm text-purple-200">{data.targetRole}</p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4 border-b border-purple-400/50 pb-2 text-sm font-bold uppercase tracking-widest">
                Contact
              </h2>
              <ul className="space-y-3 text-sm text-purple-100">
                {contact.email && <li>{contact.email}</li>}
                {contact.phone && <li>{contact.phone}</li>}
                {contact.location && <li>{contact.location}</li>}
                {contact.website && (
                  <li className="flex items-center gap-2">
                    <FaGlobe /> {contact.website}
                  </li>
                )}
                {contact.linkedin && <li>{contact.linkedin}</li>}
              </ul>
            </section>

            {skills.length > 0 && (
              <section>
                <h2 className="mb-4 border-b border-purple-400/50 pb-2 text-sm font-bold uppercase tracking-widest">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded bg-white/10 px-2 py-1 text-xs font-medium text-white"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {education.length > 0 && (
              <section>
                <h2 className="mb-4 border-b border-purple-400/50 pb-2 text-sm font-bold uppercase tracking-widest">
                  Education
                </h2>
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id}>
                      <div className="font-bold">{edu.institution}</div>
                      <div className="text-sm text-purple-200">{edu.degree}</div>
                      <div className="text-xs text-purple-300">{edu.year}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Right Column (Clean) */}
        <div className="p-10">
          {summary && (
            <section className="mb-10">
              <h2 className="mb-4 text-2xl font-bold text-slate-800">Profile</h2>
              <div
                className="prose prose-sm max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: summary }}
              />
            </section>
          )}

          {experience.length > 0 && (
            <section>
              <h2 className="mb-6 text-2xl font-bold text-slate-800">Experience</h2>
              <div className="space-y-8">
                {experience.map((exp) => (
                  <div key={exp.id} className="relative border-l-2 border-purple-100 pl-6">
                    <div className="absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-purple-600" />
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{exp.role}</h3>
                      <span className="text-sm font-medium text-purple-600">
                        {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    <div className="mb-3 text-sm font-semibold text-slate-500">{exp.company}</div>
                    <div
                      className="prose prose-sm max-w-none text-slate-600 [&>ul]:list-disc [&>ul]:pl-4"
                      dangerouslySetInnerHTML={{ __html: exp.bullets }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

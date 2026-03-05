import { ResumeTemplateProps } from '../types';
import { FaGithub, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';

export function TechResumeTemplate({ data, theme = 'light' }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills } = data;
  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-[297mm] w-[210mm] overflow-hidden bg-white p-12 font-sans text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-0 print:shadow-none ${
        isDark ? 'bg-slate-900 text-slate-100' : ''
      }`}
    >
      {/* Header */}
      <header className="mb-8 border-b-2 border-slate-800 pb-6">
        <h1 className="mb-2 font-mono text-4xl font-bold tracking-tight text-slate-900">
          {contact.name || 'Your Name'}
        </h1>
        <p className="mb-4 font-mono text-lg text-indigo-600">
          {data.targetRole || 'Full Stack Developer'}
        </p>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          {contact.email && (
            <div className="flex items-center gap-2">
              <FaEnvelope className="text-slate-400" />
              <span>{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2">
              <FaPhone className="text-slate-400" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.location && (
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-slate-400" />
              <span>{contact.location}</span>
            </div>
          )}
          {contact.linkedin && (
            <div className="flex items-center gap-2">
              <FaLinkedin className="text-slate-400" />
              <span>{contact.linkedin}</span>
            </div>
          )}
          {contact.website && (
            <div className="flex items-center gap-2">
              <FaGlobe className="text-slate-400" />
              <span>{contact.website}</span>
            </div>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-8">
          <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-widest text-slate-500">
            // Summary
          </h2>
          <div
            className="prose prose-sm max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: summary }}
          />
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-widest text-slate-500">
            // Technical Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-medium text-slate-700 print:border print:border-slate-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 font-mono text-sm font-bold uppercase tracking-widest text-slate-500">
            // Experience
          </h2>
          <div className="space-y-6">
            {experience.map((exp) => (
              <div key={exp.id} className="relative border-l-2 border-slate-200 pl-4 print:border-l-0 print:pl-0">
                <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-white border-2 border-slate-300 print:hidden" />
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold text-slate-900">{exp.role}</h3>
                  <span className="font-mono text-xs text-slate-500">
                    {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="mb-2 font-mono text-sm text-indigo-600">{exp.company}</div>
                <div
                  className="prose prose-sm max-w-none text-slate-600 [&>ul]:list-disc [&>ul]:pl-4"
                  dangerouslySetInnerHTML={{ __html: exp.bullets }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section>
          <h2 className="mb-4 font-mono text-sm font-bold uppercase tracking-widest text-slate-500">
            // Education
          </h2>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                  <span className="font-mono text-xs text-slate-500">{edu.year}</span>
                </div>
                <div className="text-sm text-slate-700">
                  {edu.degree} {edu.gpa && <span className="text-slate-500">• GPA: {edu.gpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { ResumeTemplateProps } from '../types';

export function AcademicResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white p-12 font-serif text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-0 print:shadow-none">
      {/* Header */}
      <header className="mb-8 border-b-2 border-slate-300 pb-6 text-center">
        <h1 className="mb-2 font-serif text-4xl font-bold tracking-tight text-slate-900">
          {contact.name}
        </h1>
        <p className="mb-4 font-sans text-sm uppercase tracking-widest text-slate-500">
          {data.targetRole || 'Academic Researcher'}
        </p>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-sans text-xs text-slate-600">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span>• {contact.phone}</span>}
          {contact.location && <span>• {contact.location}</span>}
          {contact.linkedin && <span>• {contact.linkedin}</span>}
        </div>
      </header>

      <div className="space-y-8">
        {/* Education (First for Academic) */}
        {education.length > 0 && (
          <section>
            <h2 className="mb-4 border-b border-slate-200 pb-1 font-sans text-sm font-bold uppercase tracking-widest text-slate-900">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                    <div className="text-sm italic text-slate-700">{edu.degree}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-slate-500">{edu.year}</div>
                    {edu.gpa && <div className="text-xs text-slate-500">GPA: {edu.gpa}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Summary (Research Interests) */}
        {summary && (
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-sm font-bold uppercase tracking-widest text-slate-900">
              Research Interests & Summary
            </h2>
            <div
              className="prose prose-sm max-w-none text-slate-700 text-justify leading-relaxed"
              dangerouslySetInnerHTML={{ __html: summary }}
            />
          </section>
        )}

        {/* Experience (Teaching/Research) */}
        {experience.length > 0 && (
          <section>
            <h2 className="mb-4 border-b border-slate-200 pb-1 font-sans text-sm font-bold uppercase tracking-widest text-slate-900">
              Professional Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="mb-1 flex flex-wrap justify-between gap-2">
                    <h3 className="font-bold text-slate-900">{exp.role}</h3>
                    <span className="font-mono text-xs text-slate-500">
                      {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="mb-2 text-sm italic text-slate-600">{exp.company}</div>
                  <div
                    className="prose prose-sm max-w-none text-slate-700 [&>ul]:list-disc [&>ul]:pl-4"
                    dangerouslySetInnerHTML={{ __html: exp.bullets }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section>
            <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-sm font-bold uppercase tracking-widest text-slate-900">
              Skills & Expertise
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-700">
              {skills.map((skill, index) => (
                <span key={index} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

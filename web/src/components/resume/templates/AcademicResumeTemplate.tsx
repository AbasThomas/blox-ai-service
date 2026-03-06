import { ResumeTemplateProps } from '../types';

export function AcademicResumeTemplate({ data }: ResumeTemplateProps) {
  const { contact, summary, experience, education, skills, certifications } = data;

  return (
    <div className="min-h-[297mm] w-[210mm] overflow-hidden bg-white p-12 font-serif text-slate-900 shadow-xl print:m-0 print:h-auto print:w-auto print:overflow-visible print:bg-white print:p-10 print:shadow-none">
      {/* Header */}
      <header className="mb-8 border-b-2 border-slate-300 pb-6 text-center">
        <h1 className="mb-1.5 font-serif text-4xl font-bold tracking-tight text-slate-900">
          {contact.name || 'Your Name'}
        </h1>
        <p className="mb-4 font-sans text-xs uppercase tracking-[0.18em] text-slate-500">
          {data.targetRole || 'Academic Researcher'}
        </p>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 font-sans text-xs text-slate-500">
          {contact.email && <span>{contact.email}</span>}
          {contact.phone && <span aria-hidden>·</span>}
          {contact.phone && <span>{contact.phone}</span>}
          {contact.location && <span aria-hidden>·</span>}
          {contact.location && <span>{contact.location}</span>}
          {contact.linkedin && <span aria-hidden>·</span>}
          {contact.linkedin && <span>{contact.linkedin}</span>}
          {contact.website && <span aria-hidden>·</span>}
          {contact.website && <span>{contact.website}</span>}
        </div>
      </header>

      <div className="space-y-7">
        {/* Education first for Academic */}
        {education.length > 0 && (
          <section aria-label="Education">
            <h2 className="mb-4 border-b border-slate-200 pb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h3 className="font-serif font-bold text-slate-900">{edu.institution}</h3>
                    <div className="text-sm italic text-slate-600">{edu.degree}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-slate-500">{edu.year}</div>
                    {edu.gpa && <div className="text-xs text-slate-400">GPA: {edu.gpa}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Research Interests */}
        {summary && (
          <section aria-label="Research Interests and Summary">
            <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
              Research Interests &amp; Summary
            </h2>
            <div
              className="prose prose-sm max-w-none text-slate-700 leading-relaxed [&>p]:text-justify [&>p]:mt-0"
              dangerouslySetInnerHTML={{ __html: summary }}
            />
          </section>
        )}

        {/* Professional Experience */}
        {experience.length > 0 && (
          <section aria-label="Professional Experience">
            <h2 className="mb-4 border-b border-slate-200 pb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
              Professional Experience
            </h2>
            <div className="space-y-5">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="mb-0.5 flex flex-wrap justify-between gap-2">
                    <h3 className="font-serif font-bold text-slate-900">{exp.role}</h3>
                    <span className="font-mono text-xs text-slate-500">
                      {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="mb-2 text-sm italic text-slate-500">{exp.company}</div>
                  <div
                    className="prose prose-sm max-w-none text-slate-700 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-0.5"
                    dangerouslySetInnerHTML={{ __html: exp.bullets }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills & Expertise */}
        {skills.length > 0 && (
          <section aria-label="Skills and Expertise">
            <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
              Skills &amp; Expertise
            </h2>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
              {skills.map((skill, index) => (
                <span key={index} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Certifications / Publications */}
        {certifications && certifications.length > 0 && (
          <section aria-label="Certifications and Publications">
            <h2 className="mb-3 border-b border-slate-200 pb-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
              Certifications &amp; Publications
            </h2>
            <ul className="space-y-1.5">
              {certifications.map((cert, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                  {cert}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { PlanTier } from '@nextjs-blox/shared-types';

const SKILL_GAPS = [
  { skill: 'System Design', level: 35, target: 80, category: 'Technical' },
  { skill: 'Leadership', level: 55, target: 85, category: 'Soft Skills' },
  { skill: 'Public Speaking', level: 40, target: 75, category: 'Soft Skills' },
  { skill: 'TypeScript', level: 70, target: 90, category: 'Technical' },
  { skill: 'Cloud (AWS/GCP)', level: 45, target: 80, category: 'Technical' },
  { skill: 'Negotiation', level: 30, target: 70, category: 'Career' },
];

const MILESTONES = [
  { title: 'Update resume', done: true, dueDate: '2025-01-15' },
  { title: 'Complete ATS scan', done: true, dueDate: '2025-01-20' },
  { title: 'Apply to 5 target companies', done: false, dueDate: '2025-02-28' },
  { title: 'Complete System Design course', done: false, dueDate: '2025-03-15' },
  { title: 'Mock interview × 3', done: false, dueDate: '2025-03-30' },
  { title: 'Negotiate offer', done: false, dueDate: '2025-04-30' },
];

const LEARNING_PATHS = [
  { title: 'System Design Fundamentals', provider: 'Educative', duration: '12h', link: '#', type: 'Course' },
  { title: 'Leadership in Engineering', provider: 'Coursera', duration: '8h', link: '#', type: 'Course' },
  { title: 'Effective Communication for Engineers', provider: 'LinkedIn Learning', duration: '5h', link: '#', type: 'Video' },
  { title: 'AWS Solutions Architect', provider: 'A Cloud Guru', duration: '40h', link: '#', type: 'Certification' },
];

export default function CoachPage() {
  const [activeTab, setActiveTab] = useState<'skills' | 'milestones' | 'paths'>('skills');
  const [milestones, setMilestones] = useState(MILESTONES);

  const toggleMilestone = (index: number) => {
    setMilestones((prev) => prev.map((m, i) => i === index ? { ...m, done: !m.done } : m));
  };

  const completedCount = milestones.filter((m) => m.done).length;
  const progress = Math.round((completedCount / milestones.length) * 100);

  return (
    <FeaturePage
      title="AI career coach"
      description="Track skill gaps, hit milestones, and follow curated learning paths."
      minTier={PlanTier.PREMIUM}
    >
      {/* Progress bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-900">Career roadmap progress</h2>
          <span className="text-sm font-black text-blue-600">{progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">{completedCount} of {milestones.length} milestones complete</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {([['skills', 'Skill gaps'], ['milestones', 'Milestones'], ['paths', 'Learning paths']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Skill gaps */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          {['Technical', 'Soft Skills', 'Career'].map((cat) => (
            <div key={cat} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">{cat}</h3>
              <div className="space-y-4">
                {SKILL_GAPS.filter((s) => s.category === cat).map((skill) => (
                  <div key={skill.skill}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{skill.skill}</span>
                      <span className="text-xs text-slate-500">{skill.level}% → {skill.target}%</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-slate-100">
                      <div className="absolute h-3 rounded-full bg-blue-200" style={{ width: `${skill.target}%` }} />
                      <div className="absolute h-3 rounded-full bg-blue-600" style={{ width: `${skill.level}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-amber-600">Gap: {skill.target - skill.level} points to target</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Milestones */}
      {activeTab === 'milestones' && (
        <div className="space-y-3">
          {milestones.map((m, i) => (
            <button key={m.title} onClick={() => toggleMilestone(i)}
              className={`w-full rounded-xl border p-4 text-left transition-colors flex items-start gap-3 ${
                m.done ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white hover:border-slate-300'
              }`}>
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                m.done ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300'
              }`}>
                {m.done && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${m.done ? 'line-through text-slate-400' : 'text-slate-900'}`}>{m.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">Due: {new Date(m.dueDate).toLocaleDateString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Learning paths */}
      {activeTab === 'paths' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {LEARNING_PATHS.map((path) => (
            <div key={path.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900 leading-tight">{path.title}</h3>
                <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{path.type}</span>
              </div>
              <p className="text-xs text-slate-500 mb-1">{path.provider}</p>
              <p className="text-xs text-slate-400 mb-3">{path.duration}</p>
              <a href={path.link}
                className="block rounded-md bg-slate-900 px-3 py-1.5 text-center text-xs font-bold text-white hover:bg-slate-700">
                Start learning
              </a>
            </div>
          ))}
        </div>
      )}
    </FeaturePage>
  );
}

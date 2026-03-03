'use client';

import { useState } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { PlanTier } from '@nextjs-blox/shared-types';
import { Target, Milestone, GraduationCap, Check, Zap, ArrowUpRight } from '@/components/ui/icons';

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
      title="Career Coach"
      description="Advanced professional trajectory analysis and milestone tracking."
      minTier={PlanTier.PREMIUM}
      headerIcon={<Target className="h-6 w-6" />}
    >
      <div className="space-y-8 md:space-y-10 animate-in fade-in duration-500">
        {/* Trajectory Progress */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/10 bg-black/40 p-6 md:p-10 shadow-2xl">
          <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-[#1ECEFA]/10 blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1ECEFA]">Trajectory Progress</h2>
                <p className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">Roadmap Completion</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{progress}%</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden border border-white/5 p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-[#1ECEFA] to-blue-600 rounded-full transition-all duration-1000 shadow-sm" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{completedCount} of {milestones.length} Strategic Milestones Finalized</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-sm max-w-fit mx-auto sm:mx-0">
          {[
            { id: 'skills', label: 'Skill Gaps', icon: <Target className="h-4 w-4" /> },
            { id: 'milestones', label: 'Milestones', icon: <Milestone className="h-4 w-4" /> },
            { id: 'paths', label: 'Learning Paths', icon: <GraduationCap className="h-4 w-4" /> }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 md:px-5 md:py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-[#1ECEFA] text-black shadow-sm' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'skills' && (
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {['Technical', 'Soft Skills', 'Career'].map((cat) => (
                <div key={cat} className="rounded-2xl md:rounded-3xl border border-white/10 bg-black/30 p-6 md:p-8 shadow-xl space-y-8">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] border-b border-white/5 pb-4">{cat}</h3>
                  <div className="space-y-8">
                    {SKILL_GAPS.filter((s) => s.category === cat).map((skill) => (
                      <div key={skill.skill} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-300 uppercase tracking-tight">{skill.skill}</span>
                          <span className="text-[10px] font-bold text-slate-500">{skill.level}% / {skill.target}%</span>
                        </div>
                        <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="absolute h-full bg-white/10" style={{ width: `${skill.target}%` }} />
                          <div className="absolute h-full bg-[#1ECEFA] shadow-sm" style={{ width: `${skill.level}%` }} />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/80 flex items-center gap-1">
                          <Zap className="h-2.5 w-2.5 fill-current" /> Delta: {skill.target - skill.level} points
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {milestones.map((m, i) => (
                <button 
                  key={m.title} 
                  onClick={() => toggleMilestone(i)}
                  className={`group w-full rounded-2xl md:rounded-[1.5rem] border p-4 md:p-6 text-left transition-all duration-300 flex items-center gap-4 md:gap-6 ${
                    m.done 
                      ? 'border-green-500/20 bg-green-500/5' 
                      : 'border-white/10 bg-black/40 hover:border-white/20 hover:bg-black/60 shadow-lg'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                    m.done 
                      ? 'bg-green-500 border-green-500 text-white shadow-sm' 
                      : 'bg-black border-white/10 text-slate-600 group-hover:border-white/30'
                  }`}>
                    {m.done ? <Check className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-slate-800" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black uppercase tracking-tight transition-all truncate ${m.done ? 'text-slate-500 line-through' : 'text-white'}`}>{m.title}</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1">Deadline: {new Date(m.dueDate).toLocaleDateString()}</p>
                  </div>
                  {!m.done && <ArrowUpRight className="h-4 w-4 text-slate-700 group-hover:text-white transition-colors" />}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'paths' && (
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {LEARNING_PATHS.map((path) => (
                <div key={path.title} className="group relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-white/10 bg-black/40 p-6 md:p-8 transition-all duration-300 hover:border-[#1ECEFA]/50 hover:bg-black/60 shadow-xl">
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-1">
                        <h3 className="text-lg md:text-xl font-black text-white tracking-tight uppercase group-hover:text-[#1ECEFA] transition-colors leading-tight">{path.title}</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{path.provider} • {path.duration}</p>
                      </div>
                      <span className="hidden sm:block rounded-lg bg-white/5 border border-white/5 px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">{path.type}</span>
                    </div>
                    
                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                      <a 
                        href={path.link}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1ECEFA] group-hover:translate-x-1 transition-transform"
                      >
                        Initialize Module <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  {/* Background glow */}
                  <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-[#1ECEFA]/5 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </FeaturePage>
  );
}


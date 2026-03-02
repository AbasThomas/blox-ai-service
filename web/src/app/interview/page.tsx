'use client';

import { useState, useRef, useEffect } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { PlanTier } from '@nextjs-blox/shared-types';
import { Mic, Video, Settings, Check, Zap, ArrowUpRight, Play, Square, RotateCcw, Shield } from '@/components/ui/icons';

type Phase = 'setup' | 'recording' | 'review';

const QUESTION_BANKS: Record<string, string[]> = {
  behavioral: [
    'Tell me about a time you led a team through a difficult situation.',
    'Describe a project where you had to learn a new technology quickly.',
    'How do you handle disagreements with stakeholders?',
    'Give an example of when you received critical feedback and how you responded.',
    'Tell me about your greatest professional achievement.',
  ],
  technical: [
    'Explain the difference between SQL and NoSQL databases.',
    'How would you design a URL shortener?',
    'What is the CAP theorem?',
    'Explain how React reconciliation works.',
    'How do you approach debugging a production outage?',
  ],
  situational: [
    'You have three deadlines on the same day. How do you prioritize?',
    'How would you handle a teammate who is consistently missing deadlines?',
    'A client requests a feature that conflicts with security best practices. What do you do?',
  ],
};

interface FeedbackScore {
  label: string;
  score: number;
  comment: string;
}

export default function InterviewPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [category, setCategory] = useState('behavioral');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [responses, setResponses] = useState<Array<{ question: string; duration: number; transcript?: string }>>([]);
  const [feedback, setFeedback] = useState<FeedbackScore[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const questions = QUESTION_BANKS[category] ?? [];
  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            stopRecording();
            return 120;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeLeft(120);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = () => { setRecording(true); };

  const stopRecording = () => {
    setRecording(false);
    const duration = 120 - timeLeft;
    setResponses((prev) => [...prev, { question: currentQuestion, duration }]);
  };

  const nextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
    } else {
      generateFeedback();
    }
  };

  const generateFeedback = () => {
    setFeedback([
      { label: 'Content & relevance', score: Math.round(65 + Math.random() * 25), comment: 'Strong STAR methodology application. Consider adding more quantifiable metrics to your outcomes.' },
      { label: 'Clarity & structure', score: Math.round(60 + Math.random() * 30), comment: 'Excellent introduction. Work on creating more concise and punchy conclusions.' },
      { label: 'Confidence', score: Math.round(55 + Math.random() * 35), comment: 'Steady pace maintained throughout. Try to minimize filler words in technical explanations.' },
      { label: 'Response depth', score: Math.round(60 + Math.random() * 25), comment: 'Deep technical insight demonstrated. Could provide more context on team dynamics.' },
    ]);
    setPhase('review');
  };

  const reset = () => {
    setPhase('setup');
    setQuestionIndex(0);
    setResponses([]);
    setFeedback([]);
    setRecording(false);
  };

  const overallScore = feedback.length > 0
    ? Math.round(feedback.reduce((s, f) => s + f.score, 0) / feedback.length)
    : 0;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <FeaturePage
      title="Mock Interview"
      description="Advanced AI-powered simulation to refine your verbal and technical performance."
      minTier={PlanTier.PREMIUM}
      headerIcon={<Mic className="h-6 w-6" />}
    >
      <div className="space-y-10 animate-in fade-in duration-500">
        {/* Setup Phase */}
        {phase === 'setup' && (
          <div className="max-w-2xl space-y-10">
            <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1ECEFA]">Session Parameters</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {Object.keys(QUESTION_BANKS).map((cat) => (
                  <button 
                    key={cat} 
                    onClick={() => setCategory(cat)}
                    className={`group relative flex flex-col items-center rounded-3xl border p-6 transition-all duration-300 ${
                      category === cat 
                        ? 'border-[#1ECEFA] bg-[#1ECEFA]/5 shadow-xl' 
                        : 'border-white/10 bg-black/40 hover:border-white/20'
                    }`}
                  >
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                      category === cat ? 'bg-[#1ECEFA] border-[#1ECEFA] text-black' : 'bg-white/5 border-white/5 text-slate-500 group-hover:text-white'
                    }`}>
                      {cat === 'behavioral' ? <Mic className="h-6 w-6" /> : cat === 'technical' ? <Settings className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
                    </div>
                    <h3 className={`text-xs font-black uppercase tracking-widest transition-colors ${category === cat ? 'text-[#1ECEFA]' : 'text-slate-400'}`}>{cat}</h3>
                    <p className="mt-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{QUESTION_BANKS[cat].length} Nodes</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-8 flex items-center gap-6 backdrop-blur-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Zap className="h-6 w-6 fill-current" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-white uppercase tracking-tight">Simulation Protocol</h4>
                <p className="text-xs text-blue-400/70 leading-relaxed">Questions will be presented sequentially. You have 120 seconds per response. AI analysis will be compiled post-session.</p>
              </div>
            </div>

            <button 
              onClick={() => setPhase('recording')}
              className="group flex items-center justify-center gap-3 rounded-2xl bg-white px-10 py-5 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-[#1ECEFA] hover:shadow-[0_0_30px_rgba(30,206,250,0.5)] active:scale-95"
            >
              Initialize Simulation <Play className="h-5 w-5 fill-current" />
            </button>
          </div>
        )}

        {/* Recording Phase */}
        {phase === 'recording' && (
          <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Session Header */}
            <div className="flex items-center justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1ECEFA]">Active Question</h2>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Node {questionIndex + 1} of {questions.length}</p>
              </div>
              <div className="flex gap-2">
                {questions.map((_, i) => (
                  <div key={i} className={`h-1 w-8 rounded-full transition-all duration-500 ${i < responses.length ? 'bg-green-500' : i === questionIndex ? 'bg-[#1ECEFA] shadow-[0_0_10px_rgba(30,206,250,0.5)]' : 'bg-white/5'}`} />
                ))}
              </div>
            </div>

            {/* Question Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-10 shadow-2xl">
              <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#1ECEFA]/5 blur-[60px] pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{category} Protocol</p>
                <h3 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">{currentQuestion}</h3>
              </div>
            </div>

            {/* Timer & Controls */}
            <div className="flex flex-col items-center gap-10 py-10">
              {recording && (
                <div className="text-center space-y-2 animate-in zoom-in-95 duration-300">
                  <div className={`text-7xl font-black tabular-nums tracking-tighter ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Buffer Remaining</p>
                </div>
              )}

              <div className="flex gap-6 w-full max-w-md">
                {!recording ? (
                  <button 
                    onClick={startRecording}
                    className="flex-1 flex items-center justify-center gap-4 rounded-3xl bg-red-600 px-8 py-6 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-95"
                  >
                    <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                    Begin Response
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="flex-1 flex items-center justify-center gap-4 rounded-3xl bg-white px-8 py-6 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-slate-200 active:scale-95"
                  >
                    <Square className="h-5 w-5 fill-current" />
                    Finalize Node
                  </button>
                )}
              </div>

              {!recording && responses.length > questionIndex && (
                <button 
                  onClick={nextQuestion}
                  className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-[#1ECEFA] hover:translate-x-1 transition-transform"
                >
                  {questionIndex < questions.length - 1 ? 'Next Question Module' : 'Compile AI Feedback'} <ArrowUpRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Review Phase */}
        {phase === 'review' && (
          <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Overall Analysis */}
            <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-black/40 p-12 text-center shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1ECEFA]/5 via-transparent to-purple-500/5 pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500">Consolidated Performance Index</p>
                <h2 className={`text-8xl font-black tracking-tighter ${overallScore >= 75 ? 'text-green-400' : overallScore >= 55 ? 'text-amber-400' : 'text-red-400'}`}>
                  {overallScore}
                </h2>
                <div className="flex items-center justify-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-[#1ECEFA]" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{responses.length} Nodes Analyzed</p>
                </div>
              </div>
            </div>

            {/* Feedback Matrix */}
            <div className="grid gap-6 md:grid-cols-2">
              {feedback.map((f) => (
                <div key={f.label} className="group rounded-[2rem] border border-white/10 bg-black/40 p-8 transition-all hover:border-[#1ECEFA]/30 hover:bg-black/60 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">{f.label}</h4>
                    <span className={`text-2xl font-black ${f.score >= 75 ? 'text-green-400' : f.score >= 55 ? 'text-amber-400' : 'text-red-400'}`}>{f.score}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden mb-6">
                    <div className={`h-full transition-all duration-1000 ${f.score >= 75 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-[#1ECEFA]'}`} style={{ width: `${f.score}%` }} />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed italic">"{f.comment}"</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button 
                onClick={reset}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-10 py-5 text-sm font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-white hover:text-black hover:shadow-2xl active:scale-95"
              >
                <RotateCcw className="h-5 w-5" /> Reset Simulation Protocol
              </button>
            </div>
          </div>
        )}
      </div>
    </FeaturePage>
  );
}

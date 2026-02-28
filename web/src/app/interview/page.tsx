'use client';

import { useState, useRef, useEffect } from 'react';
import { FeaturePage } from '@/components/shared/feature-page';
import { PlanTier } from '@nextjs-blox/shared-types';

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
    // Simulated AI feedback scoring
    setFeedback([
      { label: 'Content & relevance', score: Math.round(65 + Math.random() * 25), comment: 'Good use of the STAR method. Add more quantifiable outcomes.' },
      { label: 'Clarity & structure', score: Math.round(60 + Math.random() * 30), comment: 'Clear introduction. Work on more concise conclusions.' },
      { label: 'Confidence', score: Math.round(55 + Math.random() * 35), comment: 'Steady pace. Avoid filler words.' },
      { label: 'Response depth', score: Math.round(60 + Math.random() * 25), comment: 'Good technical detail. Could include more team context.' },
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
      title="Mock interview simulator"
      description="Practice with real interview questions and get AI feedback on your responses."
      minTier={PlanTier.PREMIUM}
    >
      {/* Setup */}
      {phase === 'setup' && (
        <div className="max-w-lg space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-3">Choose question type</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.keys(QUESTION_BANKS).map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`rounded-xl border p-4 text-center capitalize transition-colors ${
                    category === cat ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                  <p className="text-sm font-semibold">{cat}</p>
                  <p className={`text-xs mt-0.5 ${category === cat ? 'text-slate-300' : 'text-slate-400'}`}>
                    {QUESTION_BANKS[cat].length} questions
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <strong>How it works:</strong> You will be shown one question at a time. Record your answer (up to 2 minutes), then move to the next. AI feedback is generated after all questions.
          </div>

          <button onClick={() => setPhase('recording')}
            className="rounded-md bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
            Start session ({questions.length} questions)
          </button>
        </div>
      )}

      {/* Recording */}
      {phase === 'recording' && (
        <div className="max-w-lg space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Question {questionIndex + 1} of {questions.length}</span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full ${i < responses.length ? 'bg-green-500' : i === questionIndex ? 'bg-blue-500' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>

          {/* Question */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-3 font-semibold capitalize">{category}</p>
            <p className="text-lg font-bold text-slate-900 leading-snug">{currentQuestion}</p>
          </div>

          {/* Timer */}
          {recording && (
            <div className="text-center">
              <div className={`text-4xl font-black tabular-nums ${timeLeft < 30 ? 'text-red-600' : 'text-slate-900'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Time remaining</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {!recording ? (
              <button onClick={startRecording}
                className="flex-1 rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                Start recording
              </button>
            ) : (
              <button onClick={stopRecording}
                className="flex-1 rounded-md bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-slate-700">
                Stop &amp; save
              </button>
            )}
          </div>

          {!recording && responses.length > questionIndex && (
            <button onClick={nextQuestion}
              className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {questionIndex < questions.length - 1 ? 'Next question →' : 'Finish &amp; get feedback'}
            </button>
          )}
        </div>
      )}

      {/* Review */}
      {phase === 'review' && (
        <div className="max-w-2xl space-y-6">
          {/* Overall score */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-center">
            <p className={`text-6xl font-black ${overallScore >= 75 ? 'text-green-600' : overallScore >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
              {overallScore}
            </p>
            <p className="text-slate-500 mt-1">Overall score</p>
            <p className="text-xs text-slate-400 mt-0.5">{responses.length} questions answered</p>
          </div>

          {/* Breakdown */}
          <div className="grid gap-3 sm:grid-cols-2">
            {feedback.map((f) => (
              <div key={f.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-700">{f.label}</p>
                  <p className={`text-lg font-black ${f.score >= 75 ? 'text-green-600' : f.score >= 55 ? 'text-amber-600' : 'text-red-600'}`}>{f.score}</p>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 mb-2">
                  <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${f.score}%` }} />
                </div>
                <p className="text-xs text-slate-500">{f.comment}</p>
              </div>
            ))}
          </div>

          <button onClick={reset}
            className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Start new session
          </button>
        </div>
      )}
    </FeaturePage>
  );
}

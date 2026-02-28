'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useBloxStore } from '@/lib/store/app-store';
import { Persona, PlanTier } from '@nextjs-blox/shared-types';

type SignupPersona =
  | Persona.FREELANCER
  | Persona.JOB_SEEKER
  | Persona.DESIGNER
  | Persona.DEVELOPER
  | Persona.STUDENT
  | Persona.EXECUTIVE;

const PERSONAS: { value: SignupPersona; label: string; desc: string }[] = [
  { value: Persona.FREELANCER, label: 'Freelancer', desc: 'Client work & portfolio' },
  { value: Persona.JOB_SEEKER, label: 'Job Seeker', desc: 'Resumes & applications' },
  { value: Persona.DESIGNER, label: 'Designer', desc: 'Portfolio-first layout' },
  { value: Persona.DEVELOPER, label: 'Developer', desc: 'Projects & technical depth' },
  { value: Persona.STUDENT, label: 'Student', desc: 'First jobs & internships' },
  { value: Persona.EXECUTIVE, label: 'Executive', desc: 'Leadership & outcomes' },
];

export default function SignupPage() {
  const router = useRouter();
  const login = useBloxStore((state) => state.login);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    persona: Persona.JOB_SEEKER as SignupPersona,
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.includes('@')) errs.email = 'Enter a valid email address';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.acceptTerms) errs.acceptTerms = 'You must accept the terms';
    return errs;
  }, [form]);

  const handleChange = useCallback((field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setLoading(true);
      setServerError('');
      try {
        const result = (await authApi.signup({
          fullName: form.name,
          name: form.name,
          email: form.email,
          password: form.password,
          persona: form.persona,
        })) as { accessToken: string; refreshToken: string; user: { id: string; name?: string; fullName?: string; email: string; tier: PlanTier; persona: string } };

        login(
          { accessToken: result.accessToken, refreshToken: result.refreshToken },
          {
            id: result.user.id,
            name: result.user.fullName ?? result.user.name ?? form.name,
            email: result.user.email,
            tier: result.user.tier ?? PlanTier.FREE,
            persona: result.user.persona as SignupPersona,
          },
        );
        router.push('/dashboard');
      } catch (err) {
        setServerError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [form, validate, login, router],
  );

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3333';

  return (
    <div className="mx-auto max-w-xl py-8">
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Start building your professional brand for free.</p>
        </div>

        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {serverError}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} aria-label="Sign up form" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Jane Doe"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="jane@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="At least 8 characters"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Repeat your password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-2">I am a...</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PERSONAS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleChange('persona', p.value)}
                  aria-pressed={form.persona === p.value}
                  className={`rounded-lg border p-2.5 text-left transition-colors ${
                    form.persona === p.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  <p className="text-xs font-semibold">{p.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
              checked={form.acceptTerms}
              onChange={(e) => handleChange('acceptTerms', e.target.checked)}
            />
            <span className="text-slate-600">
              I agree to the{' '}
              <Link href="/terms" className="font-semibold text-slate-900 underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-semibold text-slate-900 underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && <p className="text-xs text-red-600">{errors.acceptTerms}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create free account'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs text-slate-500">
            <span className="bg-white px-2">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={`${apiBase}/v1/auth/google`}
            className="flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            aria-label="Continue with Google"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </a>
          <a
            href={`${apiBase}/v1/auth/linkedin`}
            className="flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            aria-label="Continue with LinkedIn"
          >
            <svg className="h-4 w-4 fill-[#0A66C2]" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </a>
        </div>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-slate-900">
            Log in
          </Link>
        </p>
      </section>
    </div>
  );
}

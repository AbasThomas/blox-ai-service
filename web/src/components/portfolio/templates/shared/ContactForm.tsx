'use client';

import { useState } from 'react';

export interface ContactFormTheme {
  formClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  textareaClassName?: string;
  buttonClassName?: string;
  successClassName?: string;
  errorClassName?: string;
}

interface ContactFormProps {
  recipientEmail?: string;
  theme: ContactFormTheme;
}

const DEFAULT_THEME: Required<ContactFormTheme> = {
  formClassName: 'space-y-4',
  labelClassName: 'mb-1.5 block text-sm font-medium text-slate-300',
  inputClassName:
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20',
  textareaClassName:
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20',
  buttonClassName:
    'inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60',
  successClassName: 'rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200',
  errorClassName: 'mt-1 text-xs text-rose-300',
};

function mergeTheme(theme: ContactFormTheme): Required<ContactFormTheme> {
  return {
    formClassName: theme.formClassName ?? DEFAULT_THEME.formClassName,
    labelClassName: theme.labelClassName ?? DEFAULT_THEME.labelClassName,
    inputClassName: theme.inputClassName ?? DEFAULT_THEME.inputClassName,
    textareaClassName: theme.textareaClassName ?? DEFAULT_THEME.textareaClassName,
    buttonClassName: theme.buttonClassName ?? DEFAULT_THEME.buttonClassName,
    successClassName: theme.successClassName ?? DEFAULT_THEME.successClassName,
    errorClassName: theme.errorClassName ?? DEFAULT_THEME.errorClassName,
  };
}

export function ContactForm({ recipientEmail, theme }: ContactFormProps) {
  const mergedTheme = mergeTheme(theme);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      nextErrors.message = 'Message must be at least 10 characters.';
    }
    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    const fallbackRecipient = form.email;
    const targetEmail = recipientEmail?.trim() || fallbackRecipient;
    const subject = encodeURIComponent(`Portfolio inquiry from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
    );
    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');
    setStatus('success');
    setForm({ name: '', email: '', message: '' });
  };

  if (status === 'success') {
    return (
      <div className={mergedTheme.successClassName} role="status" aria-live="polite">
        <p className="font-semibold">Message ready</p>
        <p className="mt-1 text-sm opacity-80">
          Your email client opened with the message pre-filled.
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-3 inline-flex items-center rounded-lg border border-current/30 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className={mergedTheme.formClassName} onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="contact-name" className={mergedTheme.labelClassName}>
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, name: event.target.value }))
          }
          className={mergedTheme.inputClassName}
          placeholder="Jane Doe"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
        />
        {errors.name ? (
          <p id="contact-name-error" role="alert" className={mergedTheme.errorClassName}>
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="contact-email" className={mergedTheme.labelClassName}>
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, email: event.target.value }))
          }
          className={mergedTheme.inputClassName}
          placeholder="jane@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
        />
        {errors.email ? (
          <p id="contact-email-error" role="alert" className={mergedTheme.errorClassName}>
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="contact-message" className={mergedTheme.labelClassName}>
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          value={form.message}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, message: event.target.value }))
          }
          className={mergedTheme.textareaClassName}
          placeholder="Tell me about your project..."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
        />
        {errors.message ? (
          <p
            id="contact-message-error"
            role="alert"
            className={mergedTheme.errorClassName}
          >
            {errors.message}
          </p>
        ) : null}
      </div>

      <button type="submit" className={mergedTheme.buttonClassName}>
        Send Message
      </button>
    </form>
  );
}

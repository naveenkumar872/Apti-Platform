import { useEffect, useState } from 'react';
import { Sun, Moon, Sparkles, Check, Loader2 } from 'lucide-react';

/**
 * Production-grade auth shell.
 *
 * Design principles:
 *  - Calm, neutral palette with a single violet accent
 *  - One subtle radial backdrop, no animated orbs
 *  - Crisp 1px borders and a single layered shadow on the card
 *  - Two fade-in entries (aside + card) — that's it
 *
 * Props:
 *   - children: form content rendered inside the card
 *   - title, subtitle: header above the form
 *   - showAside: hide the marketing column (for OTP / reset / forgot)
 */
export default function AuthShell({ children, title, subtitle, showAside = true }) {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const html = document.documentElement;
    if (dark) { html.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else      { html.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [dark]);

  return (
    <div className="min-h-screen relative bg-white dark:bg-[#09090d] text-slate-900 dark:text-slate-100 transition-colors">
      {/* One subtle radial accent — top-right corner */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 80% 0%, rgb(139 92 246 / 0.10), transparent 60%)',
        }}
      />
      {/* Hairline at the top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setDark(d => !d)}
        aria-label="Toggle theme"
        className="absolute top-5 right-5 z-30 inline-flex items-center justify-center w-9 h-9 rounded-lg
                   border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03]
                   text-slate-500 dark:text-slate-400
                   hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-12 lg:px-10">
        <div className={`w-full ${showAside ? 'max-w-6xl lg:grid lg:grid-cols-[1fr_440px]' : 'max-w-md'} gap-16 lg:gap-20 items-center`}>

          {/* Marketing aside — production marketing column, no gimmicks */}
          {showAside && (
            <aside className="hidden lg:block animate-fade-in-up">
              <Wordmark />

              <h1 className="mt-14 text-[40px] xl:text-[44px] font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-white">
                Master placement aptitude with focus.
              </h1>
              <p className="mt-5 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 max-w-md">
                AI-personalised study plans, adaptive practice, and proctored mock tests — built for engineering students preparing for top tech placements.
              </p>

              <ul className="mt-12 space-y-3.5">
                {[
                  'Personalised daily plan from your weak topics',
                  'Curated video tutorials & formula sheets',
                  'Live performance analytics, week over week',
                  'Mock tests that mirror real placement rounds',
                ].map(text => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                      <Check size={11} className="text-violet-600 dark:text-violet-400" strokeWidth={3} />
                    </span>
                    <span className="text-[14px] text-slate-700 dark:text-slate-300 leading-snug">{text}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {/* Card */}
          <div
            className="w-full max-w-md mx-auto animate-fade-in-up"
            style={{ animationDelay: '60ms' }}
          >
            <div className="bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06]
                            rounded-2xl
                            shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]
                            dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]">
              <div className="p-8 sm:p-10">
                {/* Mobile-only wordmark */}
                <div className="lg:hidden mb-8">
                  <Wordmark />
                </div>

                {/* Header */}
                {(title || subtitle) && (
                  <div className="mb-7">
                    {title && (
                      <h2 className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-white">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}

                {children}
              </div>
            </div>

            {/* Footer line under card */}
            <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-600">
              © {new Date().getFullYear()} AptitudePrep · All systems operational
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Wordmark (no glow, no animation) ── */
function Wordmark() {
  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 dark:bg-white">
        <Sparkles size={14} className="text-white dark:text-slate-900" strokeWidth={2.5} />
      </div>
      <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
        AptitudePrep
      </span>
    </div>
  );
}

/* ── Shared form primitives ── */

export function AuthLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
      {children}
    </label>
  );
}

export function AuthInput({ icon: Icon, error, className = '', ...props }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
        />
      )}
      <input
        {...props}
        className={
          (Icon ? 'pl-9 ' : 'pl-3 ') +
          'w-full pr-3 py-2.5 rounded-lg text-[14px] ' +
          'bg-white dark:bg-white/[0.025] ' +
          'border border-slate-200 dark:border-white/10 ' +
          'text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 ' +
          'focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 ' +
          'focus:ring-[3px] focus:ring-violet-500/15 ' +
          'transition-[border-color,box-shadow] duration-150 ' +
          (error
            ? 'border-rose-400 dark:border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/15 '
            : '') +
          className
        }
      />
    </div>
  );
}

export function AuthError({ children }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 text-[12px] text-rose-600 dark:text-rose-400 font-medium">
      {children}
    </p>
  );
}

export function AuthSubmit({ loading, loadingText = 'Working…', children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={
        'inline-flex w-full items-center justify-center gap-2 ' +
        'py-2.5 rounded-lg text-[14px] font-semibold text-white ' +
        'bg-violet-600 hover:bg-violet-700 active:bg-violet-700 ' +
        'dark:bg-violet-500 dark:hover:bg-violet-400 ' +
        'shadow-sm shadow-violet-900/10 ' +
        'transition-colors ' +
        'disabled:opacity-60 disabled:cursor-not-allowed ' +
        (props.className || '')
      }
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

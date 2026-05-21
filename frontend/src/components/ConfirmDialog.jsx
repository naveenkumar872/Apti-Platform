import { useCallback, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const TONES = {
  danger:  { iconBg: 'bg-red-50 dark:bg-red-900/30',     iconColor: 'text-red-500',    btn: 'bg-red-600 hover:bg-red-700' },
  warning: { iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-500',  btn: 'bg-amber-600 hover:bg-amber-700' },
  primary: { iconBg: 'bg-violet-50 dark:bg-violet-900/30', iconColor: 'text-violet-500', btn: 'bg-violet-600 hover:bg-violet-700' },
};

function ConfirmModal({ title, message, bullets, confirmLabel, cancelLabel, tone, onConfirm, onCancel }) {
  const t = TONES[tone] || TONES.danger;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}>
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${t.iconBg}`}>
              <AlertTriangle size={20} className={t.iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">{title}</h3>
              {message && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{message}</p>
              )}
              {bullets && bullets.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={onCancel}
              className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {cancelLabel || 'Cancel'}
          </button>
          <button onClick={onConfirm} autoFocus
            className={`px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors ${t.btn}`}>
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook: returns { confirm, dialog }.
 * Render `{dialog}` once in your component tree. Call `await confirm({...})` to ask.
 * Resolves to `true` / `false`.
 */
export function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback((opts = {}) => new Promise((resolve) => {
    setState({
      title: opts.title || 'Are you sure?',
      message: opts.message || '',
      bullets: opts.bullets,
      confirmLabel: opts.confirmLabel || 'Confirm',
      cancelLabel: opts.cancelLabel || 'Cancel',
      tone: opts.tone || 'danger',
      resolve,
    });
  }), []);

  const close = (result) => {
    if (state?.resolve) state.resolve(result);
    setState(null);
  };

  const dialog = state ? (
    <ConfirmModal
      title={state.title}
      message={state.message}
      bullets={state.bullets}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      tone={state.tone}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;

  return { confirm, dialog };
}

import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../../services/api';
import AuthShell, { AuthSubmit } from '../../components/auth/AuthShell';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user_id, email } = location.state || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const refs = useRef([]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = (e.clipboardData || window.clipboardData).getData('text').trim();
    if (!/^\d{6}$/.test(text)) return;
    e.preventDefault();
    setOtp(text.split(''));
    refs.current[5]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { user_id, otp: code });
      toast.success('Email verified. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { user_id });
      toast.success('Code resent to ' + email);
    } catch {
      toast.error('Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={email
        ? <>We sent a 6-digit code to <span className="font-medium text-slate-700 dark:text-slate-200">{email}</span></>
        : 'Enter the 6-digit code we just sent.'
      }
      showAside={false}
    >
      <div className="flex gap-2 justify-between mb-6" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={
              'w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-semibold ' +
              'bg-white dark:bg-white/[0.025] ' +
              'border ' +
              (digit
                ? 'border-violet-500 text-slate-900 dark:text-white'
                : 'border-slate-200 dark:border-white/10 text-slate-900 dark:text-white') +
              ' rounded-lg focus:outline-none focus:border-violet-500 ' +
              'focus:ring-[3px] focus:ring-violet-500/15 ' +
              'transition-[border-color,box-shadow] duration-150'
            }
          />
        ))}
      </div>

      <AuthSubmit onClick={handleVerify} loading={loading} loadingText="Verifying" type="button">
        Verify
      </AuthSubmit>

      <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
        Didn&apos;t get the code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-50"
        >
          {resending && <Loader2 size={11} className="animate-spin" />}
          Resend
        </button>
      </p>
    </AuthShell>
  );
}

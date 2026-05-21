import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import AuthShell, { AuthInput, AuthLabel, AuthError, AuthSubmit } from '../../components/auth/AuthShell';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      toast.success('Password updated. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    }
  };

  if (!token) return (
    <AuthShell title="Reset link invalid" showAside={false}>
      <div className="flex flex-col items-center text-center py-2">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
          <AlertCircle size={22} className="text-rose-500" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-xs">
          This reset link is invalid or has expired. Request a fresh one to continue.
        </p>
        <Link to="/forgot-password"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400 text-white text-sm font-semibold transition-colors">
          Request new link
        </Link>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you haven't used here before."
      showAside={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <AuthLabel>New password</AuthLabel>
          <AuthInput
            type="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Min 8 characters"
            error={!!errors.password}
            {...register('password', {
              required: 'Password required',
              minLength: { value: 8, message: 'Min 8 characters' },
              pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Add upper, lower & digit' },
            })}
          />
          <AuthError>{errors.password?.message}</AuthError>
        </div>

        <div>
          <AuthLabel>Confirm password</AuthLabel>
          <AuthInput
            type="password"
            icon={Lock}
            autoComplete="new-password"
            placeholder="Re-enter"
            error={!!errors.confirm}
            {...register('confirm', {
              required: 'Required',
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })}
          />
          <AuthError>{errors.confirm?.message}</AuthError>
        </div>

        <AuthSubmit loading={isSubmitting} loadingText="Updating" type="submit">
          Update password
        </AuthSubmit>
      </form>

      <Link to="/login"
        className="mt-6 inline-flex items-center justify-center gap-1.5 w-full text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft size={12} />
        Back to sign in
      </Link>
    </AuthShell>
  );
}

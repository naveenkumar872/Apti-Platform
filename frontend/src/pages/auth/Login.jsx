import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import AuthShell, { AuthInput, AuthLabel, AuthError, AuthSubmit } from '../../components/auth/AuthShell';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    if (result.success) {
      toast.success('Welcome back');
      if (result.role === 'student') navigate('/student/dashboard');
      else navigate('/admin/dashboard');
    } else if (result.code === 'EMAIL_NOT_VERIFIED') {
      toast.error('Please verify your email first');
      navigate('/verify-otp', { state: { user_id: result.user_id, email: data.email } });
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Continue your placement preparation."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <AuthLabel htmlFor="email">Email</AuthLabel>
          <AuthInput
            id="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@college.edu"
            error={!!errors.email}
            {...register('email', { required: 'Email is required' })}
          />
          <AuthError>{errors.email?.message}</AuthError>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <AuthLabel htmlFor="password">Password</AuthLabel>
            <Link to="/forgot-password"
              className="text-[12px] font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <AuthInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="pr-10"
              error={!!errors.password}
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              tabIndex={-1}
              className="absolute inset-y-0 right-2.5 inline-flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <AuthError>{errors.password?.message}</AuthError>
        </div>

        <label className="flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-400 select-none cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 dark:border-white/15 bg-white dark:bg-white/[0.04] text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
          />
          Keep me signed in
        </label>

        <AuthSubmit loading={isSubmitting} loadingText="Signing in" type="submit">
          Sign in
          <ArrowRight size={14} />
        </AuthSubmit>
      </form>

      <p className="mt-7 text-center text-[13px] text-slate-500 dark:text-slate-400">
        New to AptitudePrep?{' '}
        <Link to="/register"
          className="font-semibold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User, Mail, Lock, GraduationCap, School, CalendarDays, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import AuthShell, { AuthInput, AuthLabel, AuthError, AuthSubmit } from '../../components/auth/AuthShell';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'Other'];

const selectCls =
  'w-full pl-9 pr-3 py-2.5 rounded-lg text-[14px] ' +
  'bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/10 ' +
  'text-slate-900 dark:text-white ' +
  'focus:outline-none focus:border-violet-500 dark:focus:border-violet-400 focus:ring-[3px] focus:ring-violet-500/15 ' +
  'transition-[border-color,box-shadow] duration-150';

export default function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        college: data.college,
        branch: data.branch,
        year: Number(data.year),
      });
      if (res.data.needs_verification) {
        toast.success('Account already exists. A new OTP has been sent to your email.');
      } else {
        toast.success('Account created. Please verify your email.');
      }
      navigate('/verify-otp', { state: { user_id: res.data.user_id, email: data.email } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your personalised placement prep in under a minute."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <AuthLabel>Full name</AuthLabel>
          <AuthInput
            icon={User}
            autoComplete="name"
            placeholder="Your full name"
            error={!!errors.name}
            {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
          />
          <AuthError>{errors.name?.message}</AuthError>
        </div>

        <div>
          <AuthLabel>Email</AuthLabel>
          <AuthInput
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@college.edu"
            error={!!errors.email}
            {...register('email', { required: 'Email is required' })}
          />
          <AuthError>{errors.email?.message}</AuthError>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <AuthLabel>Password</AuthLabel>
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
            <AuthLabel>Confirm</AuthLabel>
            <AuthInput
              type="password"
              icon={Lock}
              autoComplete="new-password"
              placeholder="Re-enter"
              error={!!errors.confirmPassword}
              {...register('confirmPassword', {
                required: 'Required',
                validate: (v) => v === watch('password') || 'Passwords do not match',
              })}
            />
            <AuthError>{errors.confirmPassword?.message}</AuthError>
          </div>
        </div>

        <div>
          <AuthLabel>College</AuthLabel>
          <AuthInput
            icon={School}
            placeholder="Institute name"
            error={!!errors.college}
            {...register('college', { required: 'College is required' })}
          />
          <AuthError>{errors.college?.message}</AuthError>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <AuthLabel>Branch</AuthLabel>
            <div className="relative">
              <GraduationCap size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <select
                {...register('branch', { required: 'Required' })}
                className={selectCls + (errors.branch ? ' border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : '')}
              >
                <option value="">Select</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <AuthError>{errors.branch?.message}</AuthError>
          </div>
          <div>
            <AuthLabel>Year</AuthLabel>
            <div className="relative">
              <CalendarDays size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <select
                {...register('year', { required: 'Required' })}
                className={selectCls + (errors.year ? ' border-rose-400 focus:border-rose-500 focus:ring-rose-500/15' : '')}
              >
                <option value="">Year</option>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <AuthError>{errors.year?.message}</AuthError>
          </div>
        </div>

        <div className="pt-1">
          <AuthSubmit loading={isSubmitting} loadingText="Creating account" type="submit">
            Create account
            <ArrowRight size={14} />
          </AuthSubmit>
          <p className="mt-3 text-[11.5px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
            By creating an account you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login"
          className="font-semibold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

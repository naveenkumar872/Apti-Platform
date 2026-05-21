import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import AuthShell, { AuthInput, AuthLabel, AuthError, AuthSubmit } from '../../components/auth/AuthShell';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      toast.success('If that email exists, a reset link has been sent.');
      navigate('/login');
    } catch {
      toast.error('Something went wrong');
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email tied to your account and we'll send a secure reset link."
      showAside={false}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <AuthSubmit loading={isSubmitting} loadingText="Sending" type="submit">
          Send reset link
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

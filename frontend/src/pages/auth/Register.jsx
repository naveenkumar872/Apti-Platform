import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';
import api from '../../services/api';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'Other'];
const inputCls = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors";
const labelCls = "block text-sm text-gray-400 font-medium mb-1.5";
const selectCls = "w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors";

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
      toast.success('Account created! Please verify your email.');
      navigate('/verify-otp', { state: { user_id: res.data.user_id, email: data.email } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-8 my-6">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">AptitudePrep</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 chars' } })}
              className={inputCls}
              placeholder="John Doe"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className={inputCls}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Password</label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password required',
                  minLength: { value: 8, message: 'Min 8 chars' },
                  pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Need upper, lower, digit' },
                })}
                className={inputCls}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword', {
                  required: 'Required',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                })}
                className={inputCls}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>College</label>
            <input
              {...register('college', { required: 'College is required' })}
              className={inputCls}
              placeholder="Your college name"
            />
            {errors.college && <p className="text-red-400 text-xs mt-1">{errors.college.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Branch</label>
              <select
                {...register('branch', { required: 'Required' })}
                className={selectCls}
              >
                <option value="">Select branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.branch && <p className="text-red-400 text-xs mt-1">{errors.branch.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Year</label>
              <select
                {...register('year', { required: 'Required' })}
                className={selectCls}
              >
                <option value="">Year</option>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
              {errors.year && <p className="text-red-400 text-xs mt-1">{errors.year.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-400 font-medium hover:text-violet-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';
import api from '../../services/api';

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-colors";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      toast.success('If that email exists, a reset link has been sent');
      navigate('/login');
    } catch {
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4">
            <Zap size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">AptitudePrep</h1>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Forgot password</h2>
        <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send a reset link</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 font-medium mb-1.5">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className={inputCls}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Forgot password</h2>
        <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send a reset link</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          <Link to="/login" className="text-blue-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Zap } from 'lucide-react';
import api from '../../services/api';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user_id, email } = location.state || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
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

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { user_id, otp: code });
      toast.success('Email verified! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post('/auth/resend-otp', { user_id });
      toast.success('OTP resent to ' + email);
    } catch {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-5">
          <Zap size={22} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Verify your email</h1>
        <p className="text-gray-500 text-sm mb-1">We sent a 6-digit code to</p>
        <p className="text-violet-400 text-sm font-semibold mb-7">{email}</p>

        <div className="flex gap-2.5 justify-center mb-7">
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
              className="w-12 h-12 text-center text-xl font-bold bg-gray-800 border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:border-violet-500 transition-colors"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 mb-4"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <button onClick={handleResend} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
          Resend code
        </button>
      </div>
    </div>
  );
}

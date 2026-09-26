import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  Eye,
  EyeOff,
  GraduationCap,
} from 'lucide-react';
import { Role } from '../../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, id, firstName: fName, lastName: lName, role: userRole } = response.data;

      login(token, {
        id,
        email,
        firstName: fName,
        lastName: lName,
        role: userRole as Role,
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          'Invalid credentials. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Animated Background Mesh Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse pointer-events-none delay-1000" />

      {/* Main Login Card */}
      <div className="w-full max-w-5xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 animate-fade-up">
        {/* Left Side: Institutional Showcase */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#047857] p-10 flex-col justify-center relative text-white overflow-hidden">
          {/* Subtle Decorative Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          <div className="space-y-8 relative z-10">
            {/* Crest Brand Header */}
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg shrink-0">
                <GraduationCap className="w-7 h-7 text-emerald-200" />
              </div>
              <div>
                <h1 className="font-extrabold text-3xl text-white tracking-tight leading-none font-display">Mentora</h1>
                <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest mt-1">Academic Portal</p>
              </div>
            </div>

            {/* Hero Copy */}
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold text-white leading-snug font-display tracking-tight">
                Empowering Students, Faculty & Parents.
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Streamline attendance density analytics, coursework lifecycle management, faculty mentorship, and official campus broadcasts.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-8 bg-white">
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Sign In to Your Workspace</h3>
            <p className="text-xs text-slate-500">
              Please enter your institutional email and account password to proceed.
            </p>
          </div>

          {/* Error Alert Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-3 shadow-sm animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50/80 border border-slate-200/90 rounded-xl pl-11 pr-11 py-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                  title="Toggle Password Visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.99] flex items-center justify-center space-x-2 transition-all text-xs cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Credentials...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Institutional Footer Note */}
          <div className="pt-4 border-t border-slate-100 text-center sm:text-left">
            <p className="text-[11px] text-slate-400 leading-normal">
              Need assistance logging in? Contact your institution's System Administrator or IT Support Desk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

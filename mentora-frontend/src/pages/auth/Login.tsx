import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Users,
  CalendarCheck,
  School,
  Award,
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
          'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-1/6 left-1/4 w-[500px] h-[500px] bg-space-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/6 right-1/4 w-[500px] h-[500px] bg-blue-slate-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        {/* Left Side: Institutional Showcase (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-space-indigo-950 via-blue-slate-900 to-space-indigo-950 p-8 flex-col justify-between border-r border-slate-800/80 relative">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-space-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-space-indigo-900/30">
                M
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-tight">Mentora</h1>
                <p className="text-[10px] text-space-indigo-300 font-bold uppercase tracking-wider">Enterprise Academic Hub</p>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <span className="px-3 py-1 bg-space-indigo-500/20 text-space-indigo-300 border border-space-indigo-500/30 rounded-full text-[11px] font-semibold flex items-center space-x-1.5 w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Academic Governance</span>
              </span>
              <h2 className="text-2xl font-bold text-white leading-tight">
                Empowering Students, Faculty & Parents in One Unified Ecosystem.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Streamline attendance density analytics, coursework lifecycle management, faculty mentorship, and institutional communication.
              </p>
            </div>

            {/* Platform Metric Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CalendarCheck className="w-4 h-4" />
                  <span className="text-base font-bold">100%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Automated Attendance</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-base font-bold">1:1</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Faculty Mentorship</p>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center space-x-3 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-[11px] text-slate-400">
              Role-Governed Institutional Access with OAuth2 & JWT Cryptography.
            </span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-2xl font-bold text-white tracking-tight">Sign In to Your Portal</h3>
            <p className="text-xs text-slate-400">
              Enter your verified institutional credentials to continue.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  title="Toggle Password Visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition-all duration-200 mt-2 text-xs cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Accounts Quick-Fill */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Quick Test Portals (Pre-loaded Demo Access):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin@mentora.com', 'Password123!')}
                className="p-2 rounded-xl bg-space-indigo-500/10 hover:bg-space-indigo-500/20 border border-space-indigo-500/30 text-space-indigo-400 text-[11px] font-bold transition-colors cursor-pointer text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('teacher@mentora.com', 'Password123!')}
                className="p-2 rounded-xl bg-blue-slate-500/10 hover:bg-blue-slate-500/20 border border-blue-slate-500/30 text-blue-slate-400 text-[11px] font-bold transition-colors cursor-pointer text-center"
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('student@mentora.com', 'Password123!')}
                className="p-2 rounded-xl bg-dry-sage-500/10 hover:bg-dry-sage-500/20 border border-dry-sage-500/30 text-dry-sage-600 dark:text-dry-sage-400 text-[11px] font-bold transition-colors cursor-pointer text-center"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('parent@mentora.com', 'Password123!')}
                className="p-2 rounded-xl bg-sand-dune-500/10 hover:bg-sand-dune-500/20 border border-sand-dune-500/30 text-sand-dune-600 dark:text-sand-dune-400 text-[11px] font-bold transition-colors cursor-pointer text-center"
              >
                Parent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


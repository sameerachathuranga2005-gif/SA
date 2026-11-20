import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Layers,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User,
  Loader2,
  Video,
  MessageSquare,
  Newspaper,
  CheckCircle2,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, loginWithGoogle, demoLogin, isLoading, error, clearError } =
    useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (mode === 'register' && !name.trim()) {
      setLocalError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setLocalError('Please enter your email address');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (_err: any) {
      // Error handled and set in store
    }
  };

  const handleGoogleClick = async () => {
    setLocalError(null);
    clearError();
    try {
      await loginWithGoogle();
    } catch (_err: any) {
      // Error handled and set in store
    }
  };

  const handleDemoClick = async () => {
    setLocalError(null);
    clearError();
    try {
      await demoLogin();
    } catch (_err: any) {
      // Error handled and set in store
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 via-indigo-600 to-cyan-500 shadow-xl shadow-brand-500/20 mb-2">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            OmniSync
          </h1>
          <p className="text-xs md:text-sm text-zinc-400">
            The Unified SuperApp: Zoom + WhatsApp + Facebook
          </p>
        </div>

        {/* Feature Badges Strip */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <Video className="w-3 h-3 text-cyan-400" /> Meetings
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <MessageSquare className="w-3 h-3 text-emerald-400" /> Chats
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <Newspaper className="w-3 h-3 text-blue-400" /> Social Feed
          </span>
        </div>

        {/* Auth Card */}
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Prominent Recruiter 1-Click Demo Login Button */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
            <button
              onClick={handleDemoClick}
              disabled={isLoading}
              className="relative w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-brand-500/40 text-left hover:border-brand-400 transition-all shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Instant Demo Login</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500 text-white">
                      1-Click
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Browser-native demo with preloaded friends, meetings & requests
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-brand-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 text-white font-medium text-xs transition-all shadow-md group disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-800 w-full" />
            <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 uppercase font-semibold tracking-wider absolute">
              or continue with email
            </span>
          </div>

          {/* Form Mode Toggle */}
          <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearError();
                setLocalError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                clearError();
                setLocalError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {(localError || error) && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Work or Personal Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.johnson@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/25 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' ? 'Sign In to OmniSync' : 'Create Account & Auto-Assign PMI'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & Cloud Badge Footer */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Firebase Auth & Real-Time WebRTC P2P
            </div>
            <p className="text-zinc-500">
              Secure authentication with Google Sign-In, Email/Password, or Instant Offline Demo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

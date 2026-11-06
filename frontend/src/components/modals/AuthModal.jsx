import React, { useEffect, useRef, useState } from 'react';
import { X, Eye, EyeOff, LogOut } from 'lucide-react';
import CodeStreakLogo from '../ui/CodeStreakLogo';
import { api } from '../../services/api';

const field =
  'w-full h-10 px-3 rounded-[10px] bg-ink-900 border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors';

let googleScript = null;
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScript) {
    googleScript = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { googleScript = null; reject(new Error('Could not load Google sign-in')); };
      document.head.appendChild(s);
    });
  }
  return googleScript;
}

export default function AuthModal({ isOpen, onClose, currentUser, onAuthSuccess, onLogout }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [retryIn, setRetryIn] = useState(0);
  const [notice, setNotice] = useState('');
  const googleButton = useRef(null);

  // Countdown until another code can be requested
  useEffect(() => {
    if (retryIn <= 0) return undefined;
    const t = setTimeout(() => setRetryIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [retryIn]);

  const startVerify = (res) => {
    setPendingEmail(res.email);
    setRetryIn(res.retryAfter || 60);
    setNotice(res.notice || '');
    setCode('');
    setError('');
    setMode('verify');
  };

  const signedIn = currentUser?.isAuthenticated;

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setPassword('');
    if (!config) api.getAuthConfig().then(setConfig);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (user) => {
    onAuthSuccess && onAuthSuccess(user);
    onClose();
  };

  // Google button, only when the backend has a client ID
  useEffect(() => {
    if (!isOpen || signedIn || !config?.googleClientId || !googleButton.current) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !googleButton.current) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: async ({ credential }) => {
            setLoading(true);
            setError('');
            const res = await api.loginWithGoogle(credential);
            setLoading(false);
            if (res.success) finish(res.user);
            else setError(res.error);
          },
        });
        googleButton.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButton.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          width: googleButton.current.offsetWidth || 352,
        });
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [isOpen, signedIn, config, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && !name.trim()) return setError('Enter your name');
    if (!email.trim()) return setError('Enter your email');
    if (mode === 'signup' && password.length < 8) return setError('Use at least 8 characters for your password');
    if (!password) return setError('Enter your password');

    setLoading(true);
    const res = mode === 'signup'
      ? await api.register({ name: name.trim(), email: email.trim(), password })
      : await api.login({ email: email.trim(), password });
    setLoading(false);
    if (res.success) finish(res.user);
    else if (res.pending) startVerify(res);
    else setError(res.error);
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6 digit code');
    setLoading(true);
    const res = await api.verifyEmail({ email: pendingEmail, code });
    setLoading(false);
    if (res.success) finish(res.user);
    else setError(res.error);
  };

  const resend = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    const res = await api.resendCode(pendingEmail);
    setLoading(false);
    if (res.pending) {
      setRetryIn(res.retryAfter || 60);
      setNotice(res.notice || 'A new code is on its way');
      setCode('');
    } else {
      setError(res.error);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setPassword('');
  };

  const accountsOff = config && !config.accounts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-ink-850 border border-white/[0.08] p-6 text-slate-100 animate-modalIn"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <CodeStreakLogo size={20} textSize="text-[15px]" />

        {signedIn ? (
          <>
            <h2 id="auth-title" className="mt-6 text-[17px] font-medium text-white">Your account</h2>
            <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-ink-800 border border-white/[0.08]">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="w-10 h-10 rounded-full grid place-items-center bg-white/[0.06] text-sm text-white">
                  {(currentUser.name || '?').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{currentUser.name}</p>
                <p className="text-[13px] text-slate-500 truncate">{currentUser.email}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Signed in with {currentUser.googleLinked && currentUser.hasPassword ? 'email and Google' : currentUser.googleLinked ? 'Google' : 'email'}
            </p>
            <button
              onClick={() => { onLogout && onLogout(); onClose(); }}
              className="mt-6 w-full h-10 rounded-[10px] bg-ink-800 border border-white/[0.08] hover:border-white/[0.14] text-sm text-white flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              Sign out
            </button>
          </>
        ) : mode === 'verify' ? (
          <>
            <h2 id="auth-title" className="mt-6 text-[17px] font-medium text-white">Check your email</h2>
            <p className="mt-1 text-[13px] text-slate-400">
              We sent a 6 digit code to <span className="text-white">{pendingEmail}</span>. Enter it to finish setting up your account.
            </p>

            {config && !config.emailDelivery && (
              <p className="mt-4 p-3 rounded-[10px] border border-white/[0.08] bg-ink-800 text-xs text-slate-400">
                Email sending is not set up on the server yet, so the code is printed in the backend console.
              </p>
            )}

            <form onSubmit={submitCode} noValidate className="mt-6 space-y-4">
              <div>
                <label htmlFor="auth-code" className="block text-[13px] text-slate-300">Verification code</label>
                <input
                  id="auth-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className={`mt-2 ${field} h-12 text-center font-mono text-xl tracking-[0.4em] placeholder:tracking-[0.4em] placeholder-slate-600`}
                />
              </div>

              <p role="alert" aria-live="polite" className={`text-[13px] text-rose-400 ${error ? '' : 'hidden'}`}>{error}</p>
              <p aria-live="polite" className={`text-[13px] text-slate-400 ${notice && !error ? '' : 'hidden'}`}>{notice}</p>

              <button type="submit" disabled={loading || code.length !== 6}
                className="btn-primary-glow w-full h-10 rounded-[10px] text-sm font-medium disabled:opacity-60 active:scale-[0.98]">
                {loading ? 'Checking' : 'Verify and sign in'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-[13px]">
              <button type="button" onClick={() => switchMode('signup')} className="text-slate-400 hover:text-white rounded-sm transition-colors">
                Use a different email
              </button>
              <button type="button" onClick={resend} disabled={retryIn > 0 || loading}
                className="text-white disabled:text-slate-500 underline underline-offset-4 decoration-white/30 hover:decoration-white disabled:no-underline rounded-sm">
                {retryIn > 0 ? `Resend in ${retryIn} s` : 'Resend code'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="auth-title" className="mt-6 text-[17px] font-medium text-white">
              {mode === 'signup' ? 'Create your account' : 'Sign in'}
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              {mode === 'signup' ? 'Your plan, problems and streak are saved to your account' : 'Pick up your plan and streak where you left them'}
            </p>

            {accountsOff ? (
              <p className="mt-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] text-[13px] text-amber-300">
                {config.offline
                  ? 'Can’t reach the server. Start the backend and try again'
                  : 'Accounts are off because the backend has no database. Set DATABASE_URL in backend/.env'}
              </p>
            ) : (
              <>
                {config?.googleClientId && (
                  <>
                    <div ref={googleButton} className="mt-6 w-full min-h-[40px] flex justify-center" />
                    <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex-1 h-px bg-white/[0.08]" />
                      or with email
                      <span className="flex-1 h-px bg-white/[0.08]" />
                    </div>
                  </>
                )}

                <form onSubmit={submit} noValidate className={`${config?.googleClientId ? '' : 'mt-6'} space-y-4`}>
                  {mode === 'signup' && (
                    <div>
                      <label htmlFor="auth-name" className="block text-[13px] text-slate-300">Name</label>
                      <input id="auth-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Rivera" className={`mt-2 ${field}`} />
                    </div>
                  )}
                  <div>
                    <label htmlFor="auth-email" className="block text-[13px] text-slate-300">Email</label>
                    <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" className={`mt-2 ${field}`} autoFocus={mode === 'signin'} />
                  </div>
                  <div>
                    <label htmlFor="auth-password" className="block text-[13px] text-slate-300">Password</label>
                    <div className="mt-2 relative">
                      <input id="auth-password" type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
                        className={`${field} pr-10`} />
                      <button type="button" onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1 top-1 w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                      </button>
                    </div>
                  </div>

                  <p role="alert" aria-live="polite" className={`text-[13px] text-rose-400 ${error ? '' : 'hidden'}`}>{error}</p>

                  <button type="submit" disabled={loading}
                    className="btn-primary-glow w-full h-10 rounded-[10px] text-sm font-medium disabled:opacity-60 active:scale-[0.98]">
                    {loading ? (mode === 'signup' ? 'Creating account' : 'Signing in') : mode === 'signup' ? 'Create account' : 'Sign in'}
                  </button>
                </form>

                <p className="mt-6 text-center text-[13px] text-slate-500">
                  {mode === 'signup' ? 'Already have an account? ' : 'New here? '}
                  <button type="button" onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
                    className="text-white underline underline-offset-4 decoration-white/30 hover:decoration-white rounded-sm">
                    {mode === 'signup' ? 'Sign in' : 'Create an account'}
                  </button>
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

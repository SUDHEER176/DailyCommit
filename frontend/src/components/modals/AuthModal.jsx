import React, { useEffect, useRef, useState } from 'react';
import { X, Eye, EyeOff, LogOut, Check, ArrowLeft } from 'lucide-react';
import CodeStreakLogo from '../ui/CodeStreakLogo';
import { api } from '../../services/api';

const field =
  'w-full h-10 px-3 rounded-[10px] bg-ink-900 border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors';

let googleScript = null;
let googleReady = null; // client ID that google.accounts.id was initialized with
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

// ── Streak panel: a commit graph that has been filling in for a few months ──
const WEEKS = 20;
const TODAY_ROW = 3;
const HEAT = Array.from({ length: WEEKS }, (_, c) =>
  Array.from({ length: 7 }, (_, r) => {
    if (c === WEEKS - 1 && r >= TODAY_ROW) return null; // today and the days after it
    const h = (((c * 7 + r + 1) * 2654435761) >>> 0) % 100;
    if (c >= WEEKS - 4) return 2 + (h % 3); // the current streak, no missed days
    return h < 28 + c * 4 ? 1 + (h % 4) : 0;
  })
);

const PANEL_COPY = {
  signin: {
    title: 'Pick up where you left off',
    body: 'Your plan, solved problems and streak are saved to your account',
  },
  signup: {
    title: 'A plan that follows your target date',
    body: 'Problems for each day, revision days built in and a streak you can see',
  },
  verify: {
    title: 'One step left',
    body: 'Confirm your email and today’s square fills in',
  },
};

function StreakPanel({ mode, codeLength }) {
  const copy = PANEL_COPY[mode] || PANEL_COPY.signin;
  const todayLevel = mode === 'verify' ? Math.min(4, Math.ceil((codeLength / 6) * 4)) : 0;
  return (
    <aside className="hidden md:flex flex-col p-8 bg-ink-900 border-r border-white/[0.06]">
      <CodeStreakLogo size={20} textSize="text-[15px]" />

      {/* Copy and graph sit together, centered in the space under the logo */}
      <div className="my-auto pt-12" aria-hidden="true">
      <div>
        <p className="text-[22px] leading-7 font-medium text-white">{copy.title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{copy.body}</p>
      </div>

      <div className="mt-8 flex gap-1" aria-hidden="true">
        {HEAT.map((week, c) => (
          <div key={c} className="flex flex-col gap-1">
            {week.map((level, r) => {
              const isToday = c === WEEKS - 1 && r === TODAY_ROW;
              if (isToday) {
                return (
                  <span
                    key={r}
                    data-level={todayLevel}
                    className={`cell w-3 h-3 transition-colors duration-200 ${todayLevel ? '' : 'ring-1 ring-inset ring-white/30'}`}
                  />
                );
              }
              return <span key={r} data-level={level ?? 0} className={`cell w-3 h-3 ${level === null ? 'invisible' : ''}`} />;
            })}
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-xs text-slate-500 tabular-nums" aria-hidden="true">
        Day 23 of 90 · 3 problems today
      </p>
      </div>
    </aside>
  );
}

// Six boxes over one real input, so typing, paste and one-time-code autofill all work
function CodeBoxes({ value, onChange, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <input
        id="auth-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
        disabled={disabled}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
      />
      <div className="grid grid-cols-6 gap-2" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => {
          const digit = value[i];
          const active = focused && (i === value.length || (value.length === 6 && i === 5));
          return (
            <span
              key={i}
              className={`h-12 rounded-[10px] grid place-items-center font-mono text-xl tabular-nums border transition-colors ${
                digit
                  ? 'bg-brand-500/[0.14] border-brand-500/50 text-white'
                  : active
                    ? 'bg-ink-900 border-brand-500 text-white'
                    : 'bg-ink-900 border-white/[0.08] text-slate-600'
              }`}
            >
              {digit || ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function AuthModal({ isOpen, onClose, currentUser, onAuthSuccess, onLogout }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'verify'
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
  const googleCallback = useRef(null);

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

  googleCallback.current = async ({ credential }) => {
    setLoading(true);
    setError('');
    const res = await api.loginWithGoogle(credential);
    setLoading(false);
    if (res.success) finish(res.user);
    else setError(res.error);
  };

  // Google button, only when the backend has a client ID
  useEffect(() => {
    if (!isOpen || signedIn || !config?.googleClientId || !googleButton.current) return;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !googleButton.current) return;
        // Initialize once; the button only re-renders when the tab changes
        if (googleReady !== config.googleClientId) {
          window.google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: (response) => googleCallback.current?.(response),
          });
          googleReady = config.googleClientId;
        }
        googleButton.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButton.current, {
          theme: document.documentElement.classList.contains('light') ? 'outline' : 'filled_black',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with', // same for both tabs, so the button is drawn once
          width: Math.min(400, googleButton.current.offsetWidth || 332),
        });
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => { cancelled = true; };
  }, [isOpen, signedIn, config, mode === 'verify']); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

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
    e?.preventDefault();
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
  // The code is in the backend console when the server has no mail set up, or the send failed in development
  const codeInConsole = (config && !config.emailDelivery) || /could not be sent/i.test(notice);
  const showNotice = notice && !error && !/could not be sent/i.test(notice);
  const passwordOk = password.length >= 8;

  const closeButton = (
    <button
      onClick={onClose}
      aria-label="Close"
      className="-my-1 -mr-2 w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
    >
      <X className="w-4 h-4" strokeWidth={1.5} />
    </button>
  );

  // ── Signed in: a small account card, no panel ──
  if (signedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl bg-ink-850 border border-white/[0.08] p-6 text-slate-100 animate-modalIn"
        >
          <div className="flex items-center justify-between h-6">
            <CodeStreakLogo size={20} textSize="text-[15px]" />
            {closeButton}
          </div>
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
        </div>
      </div>
    );
  }

  const copy = PANEL_COPY[mode] || PANEL_COPY.signin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm md:max-w-[760px] max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl bg-ink-850 border border-white/[0.08] text-slate-100 animate-modalIn md:grid md:grid-cols-[minmax(0,1fr)_380px]"
      >
        <StreakPanel mode={mode} codeLength={code.length} />

        <div className="relative p-6 md:p-8">
          {/* Header row: the logo on phones (the panel has it on desktop), close on the right */}
          <div className="flex items-center justify-between h-6">
            <div className="md:hidden">
              <CodeStreakLogo size={20} textSize="text-[15px]" />
            </div>
            <span className="hidden md:block" />
            {closeButton}
          </div>

          {mode === 'verify' ? (
            <>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="mt-6 -ml-1 h-8 px-1 inline-flex items-center gap-2 rounded-md text-[13px] text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                Use a different email
              </button>

              <h2 id="auth-title" className="mt-4 text-[17px] font-medium text-white">
                {codeInConsole ? 'Enter your code' : 'Check your email'}
              </h2>
              <p className="mt-2 text-[13px] leading-5 text-slate-400">
                {codeInConsole ? (
                  <>Email sending is not working right now, so the code for <span className="text-white">{pendingEmail}</span> is printed in the backend console</>
                ) : (
                  <>We sent a 6 digit code to <span className="text-white">{pendingEmail}</span>. It expires in 10 minutes.</>
                )}
              </p>

              <form onSubmit={submitCode} noValidate className="mt-6">
                <label htmlFor="auth-code" className="block text-[13px] text-slate-300">Verification code</label>
                <div className="mt-2">
                  <CodeBoxes value={code} onChange={setCode} disabled={loading} />
                </div>

                <p role="alert" aria-live="polite" className={`mt-4 text-[13px] text-rose-400 ${error ? '' : 'hidden'}`}>{error}</p>
                <p aria-live="polite" className={`mt-4 text-[13px] text-slate-400 ${showNotice ? '' : 'hidden'}`}>{notice}</p>

                <button type="submit" disabled={loading || code.length !== 6}
                  className="mt-6 btn-primary-glow w-full h-10 rounded-[10px] text-sm font-medium transition-colors disabled:opacity-60 active:scale-[0.98]">
                  {loading ? 'Checking' : 'Verify and sign in'}
                </button>
              </form>

              <p className="mt-6 text-[13px] text-slate-500">
                No code?{' '}
                <button type="button" onClick={resend} disabled={retryIn > 0 || loading}
                  className="text-white disabled:text-slate-500 underline underline-offset-4 decoration-white/30 hover:decoration-white disabled:no-underline rounded-sm tabular-nums">
                  {retryIn > 0 ? `Send another in ${retryIn} s` : 'Send another'}
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 id="auth-title" className="mt-6 md:sr-only text-[17px] font-medium text-white">{copy.title}</h2>

              <div className="mt-4 md:mt-6 grid grid-cols-2 p-1 h-10 rounded-[10px] bg-ink-900 border border-white/[0.08]" role="group" aria-label="Account">
                {[['signin', 'Sign in'], ['signup', 'Create account']].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={mode === value}
                    onClick={() => mode !== value && switchMode(value)}
                    className={`rounded-md text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                      mode === value
                        ? 'bg-ink-800 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

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
                      <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex-1 h-px bg-slate-500/20" />
                        or with email
                        <span className="flex-1 h-px bg-slate-500/20" />
                      </div>
                    </>
                  )}

                  <form onSubmit={submit} noValidate className="mt-6 space-y-4">
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
                          aria-describedby={mode === 'signup' ? 'auth-password-hint' : undefined}
                          value={password} onChange={(e) => setPassword(e.target.value)}
                          className={`${field} pr-10`} />
                        <button type="button" onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-1 top-1 w-8 h-8 grid place-items-center rounded-lg text-slate-500 hover:text-white transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                        </button>
                      </div>
                      {mode === 'signup' && (
                        <p id="auth-password-hint" className={`mt-2 flex items-center gap-2 text-xs transition-colors ${passwordOk ? 'text-slate-300' : 'text-slate-500'}`}>
                          <Check className={`w-4 h-4 transition-colors ${passwordOk ? 'text-emerald-400' : 'text-slate-600'}`} strokeWidth={1.5} />
                          At least 8 characters
                        </p>
                      )}
                    </div>

                    <p role="alert" aria-live="polite" className={`text-[13px] text-rose-400 ${error ? '' : 'hidden'}`}>{error}</p>

                    <button type="submit" disabled={loading}
                      className="btn-primary-glow w-full h-10 rounded-[10px] text-sm font-medium transition-colors disabled:opacity-60 active:scale-[0.98]">
                      {loading ? (mode === 'signup' ? 'Creating account' : 'Signing in') : mode === 'signup' ? 'Create account' : 'Sign in'}
                    </button>
                  </form>

                  {mode === 'signup' && (
                    <p className="mt-4 text-xs leading-5 text-slate-500">
                      We’ll email you a 6 digit code to confirm the address
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

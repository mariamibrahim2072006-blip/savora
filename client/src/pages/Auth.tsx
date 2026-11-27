import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

export default function Auth() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const setAuth = useAuth((s) => s.setAuth);
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'register' ? 'register' : 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [token, setToken] = useState(params.get('token') || '');
  const [devToken, setDevToken] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (params.get('token') && mode !== 'reset') setMode('reset');

  const go = (user: any, tok: string) => {
    setAuth(user, tok);
    nav(user.role === 'admin' ? '/admin' : '/dashboard');
  };

  const submit = async () => {
    setErr(''); setMsg(''); setBusy(true);
    try {
      if (mode === 'login') {
        const { data } = await api.post('/auth/login', { email: email.trim(), password });
        go(data.user, data.token);
      } else if (mode === 'register') {
        if (password !== confirm) { setErr(t('auth.confirmPassword')); setBusy(false); return; }
        const { data } = await api.post('/auth/register', { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, password });
        go(data.user, data.token);
      } else if (mode === 'forgot') {
        const { data } = await api.post('/auth/forgot', { email: email.trim() });
        setMsg(t('auth.resetSent'));
        if (data.dev_reset_token) setDevToken(data.dev_reset_token);
      } else {
        await api.post('/auth/reset', { token: token.trim(), password });
        setMsg(t('auth.resetDone')); setMode('login');
      }
    } catch (e: any) {
      const m = e?.response?.data?.error || t('common.error');
      setErr(m.includes('Incorrect') ? t('auth.wrong') : m.includes('already exists') ? t('auth.taken') : m);
    } finally { setBusy(false); }
  };

  const title = mode === 'login' ? t('auth.login') : mode === 'register' ? t('auth.register') : mode === 'reset' ? t('auth.resetTitle') : t('auth.resetTitle');
  const sub = mode === 'login' ? t('auth.loginD') : mode === 'register' ? t('auth.registerD') : t('auth.resetD');

  return (
    <div className="min-h-screen pt-28 pb-24 relative">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img src="/images/site/story-interior.webp" alt="" className="w-full h-full object-cover img-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/80 to-ink-950" />
      </div>
      <div className="relative max-w-[460px] mx-auto px-5">
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}
            className="card-lux p-8 md:p-10 mt-8">
            <p className="eyebrow text-center">SAVORA</p>
            <h1 className="headline text-3xl md:text-4xl text-center mt-3">{title}</h1>
            <p className="text-cream-50/45 text-sm text-center mt-3">{sub}</p>

            <div className="flex flex-col gap-5 mt-8">
              {mode === 'register' && (
                <>
                  <div><span className="field-label">{t('auth.name')}</span><input value={name} onChange={(e) => setName(e.target.value)} className="input-lux" /></div>
                  <div><span className="field-label">{t('auth.phone')}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" className="input-lux text-start" placeholder="01xxxxxxxxx" /></div>
                </>
              )}
              {mode !== 'reset' && (
                <div><span className="field-label">{t('auth.email')}</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" dir="ltr" className="input-lux text-start" /></div>
              )}
              {mode === 'reset' && (
                <div><span className="field-label">Token</span><input value={token} onChange={(e) => setToken(e.target.value)} dir="ltr" className="input-lux text-start" /></div>
              )}
              {mode !== 'forgot' && (
                <div>
                  <span className="field-label">{mode === 'reset' ? t('auth.newPassword') : t('auth.password')}</span>
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" dir="ltr" className="input-lux text-start" />
                  {(mode === 'register' || mode === 'reset') && <p className="text-cream-50/30 text-xs mt-1.5">{t('auth.passwordRules')}</p>}
                </div>
              )}
              {mode === 'register' && (
                <div><span className="field-label">{t('auth.confirmPassword')}</span><input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" dir="ltr" className="input-lux text-start" /></div>
              )}
            </div>

            {err && <p className="text-wine-400 text-sm mt-4">{err}</p>}
            {msg && <p className="text-gold-300 text-sm mt-4">{msg}</p>}
            {devToken && (
              <div className="mt-4 border border-gold-400/30 bg-gold-400/5 p-3 break-all">
                <p className="text-cream-50/50 text-xs mb-1">{t('auth.devToken')}</p>
                <button onClick={() => { setToken(devToken); setMode('reset'); setDevToken(''); setMsg(''); }} className="text-gold-300 text-xs underline underline-offset-2" dir="ltr">{devToken}</button>
              </div>
            )}

            <button onClick={submit} disabled={busy} className="btn-gold w-full justify-center mt-8 disabled:opacity-40">
              <span>{busy ? t('auth.loggingIn') : mode === 'login' ? t('auth.loginBtn') : mode === 'register' ? t('auth.registerBtn') : mode === 'forgot' ? t('auth.resetTitle') : t('auth.resetBtn')}</span>
            </button>

            <div className="flex flex-col gap-2 items-center mt-6 text-[12px] tracking-wide">
              {mode === 'login' && (
                <>
                  <button onClick={() => { setMode('forgot'); setErr(''); setMsg(''); }} className="text-cream-50/45 hover:text-gold-300 transition-colors">{t('auth.forgot')}</button>
                  <button onClick={() => { setMode('register'); setErr(''); }} className="text-gold-300/80 hover:text-gold-300 transition-colors">{t('auth.noAccount')} →</button>
                </>
              )}
              {mode === 'register' && (
                <button onClick={() => { setMode('login'); setErr(''); }} className="text-gold-300/80 hover:text-gold-300 transition-colors">{t('auth.hasAccount')} →</button>
              )}
              {(mode === 'forgot' || mode === 'reset') && (
                <button onClick={() => { setMode('login'); setErr(''); setMsg(''); }} className="text-cream-50/45 hover:text-gold-300 transition-colors">← {t('auth.loginBtn')}</button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
        <p className="text-center mt-6"><Link to="/" className="text-cream-50/30 text-[11px] uppercase tracking-[0.2em] hover:text-gold-300 transition-colors">SAVORA</Link></p>
      </div>
    </div>
  );
}

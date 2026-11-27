import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Check, Minus, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';

type Slot = { time: string; available: boolean };

export default function Reservations() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const { user } = useAuth();
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slot, setSlot] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [requests, setRequests] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ table: string; date: string; time: string; guests: number } | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const maxDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 60); return d.toISOString().slice(0, 10); }, []);

  useEffect(() => {
    setSlot(''); setSlots(null);
    if (!date) return;
    api.get('/reservations/slots', { params: { date } }).then((r) => setSlots(r.data.slots)).catch(() => setSlots([]));
  }, [date]);

  const book = async () => {
    setErr('');
    if (!date || !slot || name.trim().length < 2 || phone.trim().length < 8) { setErr(t('checkout.required')); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/reservations', { name: name.trim(), phone: phone.trim(), email: email.trim() || null, guests, date, time_slot: slot, special_requests: requests.trim() || null });
      setDone({ table: data.reservation.table_label || '', date, time: slot, guests });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setErr(e?.response?.data?.error || t('common.error'));
    } finally { setBusy(false); }
  };

  const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(loc === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0">
        <img src="/images/site/reservation-bg.webp" alt="" className="w-full h-full object-cover img-dark opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/70 to-ink-950" />
      </div>
      <div className="relative max-w-[720px] mx-auto px-5 pt-32 md:pt-40 pb-24">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card-lux p-10 text-center">
              <span className="w-16 h-16 mx-auto border border-gold-400 grid place-items-center mb-6"><Check size={26} className="text-gold-400" /></span>
              <h1 className="headline text-4xl">{t('reservations.confirmedTitle')}</h1>
              <p className="text-cream-50/60 mt-5 leading-relaxed">
                {t('reservations.confirmedD', { table: done.table, guests: done.guests, date: fmtDate(done.date), time: done.time })}
              </p>
              <button onClick={() => { setDone(null); setSlot(''); setRequests(''); }} className="btn-lux mt-8"><span>{t('reservations.another')}</span></button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="eyebrow text-center">SAVORA</p>
              <h1 className="headline text-4xl md:text-6xl text-center mt-4">{t('reservations.title')}</h1>
              <p className="text-cream-50/45 text-center mt-3 font-display italic text-lg">{t('reservations.subtitle')}</p>

              <div className="card-lux p-7 md:p-9 mt-10 flex flex-col gap-7">
                {/* guests */}
                <div>
                  <span className="field-label">{t('reservations.guests')}</span>
                  <div className="flex items-center gap-5">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-11 h-11 border border-cream-50/20 hover:border-gold-400 hover:text-gold-400 transition-colors"><Minus size={14} className="inline" /></button>
                    <span className="flex items-center gap-2 font-display text-2xl w-28 justify-center"><Users size={18} className="text-gold-400" /><span className="tabular-nums">{guests}</span></span>
                    <button onClick={() => setGuests(Math.min(20, guests + 1))} className="w-11 h-11 border border-cream-50/20 hover:border-gold-400 hover:text-gold-400 transition-colors"><Plus size={14} className="inline" /></button>
                    <span className="text-cream-50/35 text-xs">{guests === 1 ? t('reservations.guest') : t('reservations.guestsPlural')}</span>
                  </div>
                </div>
                {/* date */}
                <div>
                  <span className="field-label">{t('reservations.date')}</span>
                  <input type="date" value={date} min={today} max={maxDate} onChange={(e) => setDate(e.target.value)} className="input-lux [color-scheme:dark]" />
                </div>
                {/* slots */}
                <div>
                  <span className="field-label">{t('reservations.time')}</span>
                  {!date && <p className="text-cream-50/35 text-sm italic">{t('reservations.pickSlot')}</p>}
                  {slots && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {slots.map((s) => (
                        <button key={s.time} disabled={!s.available} onClick={() => setSlot(s.time)}
                          title={s.available ? t('reservations.available') : t('reservations.full')}
                          className={`py-2.5 text-[12px] tabular-nums border transition-all ${!s.available ? 'border-cream-50/8 text-cream-50/20 line-through cursor-not-allowed' : slot === s.time ? 'border-gold-400 bg-gold-400/10 text-gold-300' : 'border-cream-50/15 text-cream-50/60 hover:border-gold-400/60 hover:text-cream-50'}`}>
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* contact */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div><span className="field-label">{t('reservations.name')}</span><input value={name} onChange={(e) => setName(e.target.value)} className="input-lux" /></div>
                  <div><span className="field-label">{t('reservations.phone')}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" className="input-lux text-start" placeholder="01xxxxxxxxx" /></div>
                  <div className="sm:col-span-2"><span className="field-label">{t('reservations.email')}</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" dir="ltr" className="input-lux text-start" /></div>
                  <div className="sm:col-span-2"><span className="field-label">{t('reservations.requests')}</span><textarea value={requests} onChange={(e) => setRequests(e.target.value)} rows={2} placeholder={t('reservations.requestsPh')} className="input-lux resize-none" maxLength={500} /></div>
                </div>
                {err && <p className="text-wine-400 text-sm">{err}</p>}
                <button onClick={book} disabled={busy || !slot} className="btn-gold w-full justify-center disabled:opacity-40 disabled:pointer-events-none">
                  <span>{busy ? t('reservations.booking') : t('reservations.book')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

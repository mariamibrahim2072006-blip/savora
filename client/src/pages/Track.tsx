import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Check, Ban } from 'lucide-react';
import { api, formatEGP } from '../lib/api';

const FLOW = ['received', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
const FLOW_PICKUP = ['received', 'confirmed', 'preparing', 'ready_for_pickup', 'delivered'];

export default function Track() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [params] = useSearchParams();
  const [number, setNumber] = useState(params.get('n') || '');
  const [phone, setPhone] = useState('');
  const [data, setData] = useState<{ order: any; items: any[] } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const find = async (n?: string, silent?: boolean) => {
    const num = (n || number).trim();
    if (!num) return;
    if (!silent) { setBusy(true); setErr(''); }
    try {
      const { data } = await api.get(`/orders/track/${encodeURIComponent(num.toUpperCase())}`, { params: { phone: phone || undefined } });
      setData(data);
      if (!silent) setErr('');
    } catch (e: any) {
      if (!silent) { setData(null); setErr(e?.response?.data?.error || t('track.notFound')); }
    } finally { if (!silent) setBusy(false); }
  };

  useEffect(() => { if (params.get('n')) find(params.get('n')!); }, []);
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (data && !['delivered', 'cancelled', 'rejected'].includes(data.order.status)) {
      timer.current = setInterval(() => find(data.order.order_number, true), 15000);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [data?.order?.status]);

  const cancel = async () => {
    try { await api.post(`/orders/${data!.order.id}/cancel`); setCancelled(true); find(data!.order.order_number, true); }
    catch (e: any) { setErr(e?.response?.data?.error || t('common.error')); }
  };

  const flow = data?.order?.order_type === 'pickup' ? FLOW_PICKUP : FLOW;
  const statusIdx = data ? flow.indexOf(data.order.status) : -1;
  const dead = data && ['cancelled', 'rejected'].includes(data.order.status);

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[720px] mx-auto px-5">
        <p className="eyebrow">SAVORA</p>
        <h1 className="headline text-4xl md:text-6xl mt-4 mb-10">{t('track.title')}</h1>

        <div className="card-lux p-6 flex flex-col sm:flex-row gap-4">
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={t('track.orderNumber')} className="input-lux flex-1 uppercase tracking-widest" dir="ltr" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('track.phonePh')} inputMode="tel" className="input-lux flex-1" dir="ltr" />
          <button onClick={() => find()} disabled={busy} className="btn-gold !px-7"><span className="flex items-center gap-2"><Search size={14} />{t('track.find')}</span></button>
        </div>
        {err && <p className="text-wine-400 text-sm mt-4">{err}</p>}

        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-cream-50/40">{t('track.orderNumber')}</span>
                <span className="font-display text-2xl text-gold-300 ms-3" dir="ltr">{data.order.order_number}</span>
              </div>
              <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{t('track.live')}
              </span>
            </div>

            {dead ? (
              <div className="card-lux border-wine-500/40 p-8 text-center">
                <Ban size={28} className="text-wine-400 mx-auto mb-3" />
                <p className="font-display text-2xl text-wine-400">{t(`track.status.${data.order.status}`)}</p>
                {data.order.status_note && <p className="text-cream-50/50 text-sm mt-2">{data.order.status_note}</p>}
              </div>
            ) : (
              <div className="relative">
                <div className="absolute start-[15px] top-2 bottom-2 w-px bg-cream-50/10" />
                <div className="absolute start-[15px] top-2 w-px bg-gold-400 transition-all duration-1000" style={{ height: `${Math.max(0, (statusIdx / (flow.length - 1)) * 100)}%` }} />
                <div className="flex flex-col gap-8">
                  {flow.map((s, idx) => {
                    const reached = idx <= statusIdx;
                    const current = idx === statusIdx;
                    return (
                      <div key={s} className="flex items-center gap-5 relative">
                        <motion.span initial={false} animate={{ scale: current ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.5 }}
                          className={`w-8 h-8 shrink-0 border grid place-items-center z-10 bg-ink-950 transition-colors ${reached ? 'border-gold-400 text-gold-400' : 'border-cream-50/15 text-cream-50/20'}`}>
                          {reached && <Check size={13} />}
                        </motion.span>
                        <div>
                          <p className={`text-sm tracking-wide ${reached ? 'text-cream-50' : 'text-cream-50/35'}`}>{t(`track.status.${s}`)}</p>
                          {current && data.order.status_note && <p className="text-cream-50/40 text-xs mt-0.5">{data.order.status_note}</p>}
                          {current && s === 'out_for_delivery' && <p className="text-gold-300 text-xs mt-0.5">{t('track.eta')} ~{data.order.estimated_minutes} {t('confirmation.minutes')}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card-lux p-6 mt-10">
              <div className="flex flex-col gap-3">
                {data.items.map((i: any) => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-cream-50/70"><span className="text-gold-400/80 tabular-nums">{i.quantity}×</span> {loc === 'ar' ? i.name?.ar : i.name?.en}{i.size ? ` (${loc === 'ar' ? i.size.ar : i.size.en})` : ''}</span>
                    <span className="tabular-nums">{formatEGP(parseFloat(i.line_total), loc)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t border-cream-50/10"><span className="font-display">{t('cart.total')}</span><span className="text-gold-400 tabular-nums">{formatEGP(parseFloat(data.order.total), loc)}</span></div>
              </div>
            </div>

            {!dead && !cancelled && ['received', 'confirmed'].includes(data.order.status) && (
              <button onClick={cancel} className="mt-6 text-[11px] uppercase tracking-[0.2em] text-wine-400 hover:text-wine-300 transition-colors">{t('track.cancel')}</button>
            )}
            <div className="mt-8 text-center"><Link to="/menu" className="btn-lux"><span>{t('cart.browse')}</span></Link></div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

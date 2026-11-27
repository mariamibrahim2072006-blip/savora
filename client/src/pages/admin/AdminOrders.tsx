import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, Mail } from 'lucide-react';
import { api, formatEGP } from '../../lib/api';

const STATUSES = ['received', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'delivered', 'cancelled', 'rejected'];
const STATUS_STYLE: Record<string, string> = {
  received: 'text-sky-300 border-sky-400/30', confirmed: 'text-gold-300 border-gold-400/30', preparing: 'text-amber-300 border-amber-400/30',
  out_for_delivery: 'text-violet-300 border-violet-400/30', ready_for_pickup: 'text-violet-300 border-violet-400/30',
  delivered: 'text-emerald-300 border-emerald-400/30', cancelled: 'text-cream-50/40 border-cream-50/20', rejected: 'text-wine-400 border-wine-400/30',
};

export default function AdminOrders() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [detail, setDetail] = useState<{ order: any; items: any[] } | null>(null);
  const [eta, setEta] = useState('');
  const [note, setNote] = useState('');

  const load = () => api.get('/admin/orders', { params: { status: status || undefined, from: from || undefined, to: to || undefined } }).then((r) => setOrders(r.data.orders)).catch(() => {});
  useEffect(() => { load(); }, [status, from, to]);

  const open = async (id: string) => {
    const { data } = await api.get(`/admin/orders/${id}`);
    setDetail(data); setEta(String(data.order.estimated_minutes || '')); setNote(data.order.status_note || '');
  };
  const patch = async (id: string, body: any) => {
    const { data } = await api.patch(`/admin/orders/${id}`, body);
    setDetail((d) => d ? { ...d, order: data.order } : d);
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <span className="field-label">{t('admin.status')}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-lux !py-2 bg-transparent [&>option]:bg-ink-900 w-44">
            <option value="">{t('admin.allStatuses')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`track.status.${s}`)}</option>)}
          </select>
        </div>
        <div><span className="field-label">{t('admin.from')}</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-lux !py-2 [color-scheme:dark]" /></div>
        <div><span className="field-label">{t('admin.to')}</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-lux !py-2 [color-scheme:dark]" /></div>
      </div>

      <div className="card-lux overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="text-start text-[10px] uppercase tracking-[0.18em] text-cream-50/35 border-b border-cream-50/10">
              {[t('admin.order'), t('admin.customer'), t('checkout.phone'), t('admin.items'), t('admin.total'), t('admin.status'), t('admin.date')].map((h) => <th key={h} className="text-start font-normal px-4 py-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} onClick={() => open(o.id)} className="border-b border-cream-50/5 hover:bg-gold-400/5 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-display text-gold-300" dir="ltr">{o.order_number}</td>
                <td className="px-4 py-3">{o.customer_name}</td>
                <td className="px-4 py-3 tabular-nums" dir="ltr">{o.phone}</td>
                <td className="px-4 py-3 tabular-nums">{o.items_count ?? ''}</td>
                <td className="px-4 py-3 tabular-nums text-gold-400">{formatEGP(parseFloat(o.total), loc)}</td>
                <td className="px-4 py-3"><span className={`chip border ${STATUS_STYLE[o.status] || ''}`}>{t(`track.status.${o.status}`)}</span></td>
                <td className="px-4 py-3 text-cream-50/40 text-xs">{new Date(o.created_at).toLocaleString(loc === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-8 text-center text-cream-50/35">—</p>}
      </div>

      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[900] bg-ink-950/70 backdrop-blur-sm" onClick={() => setDetail(null)}>
            <motion.div initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute end-0 top-0 bottom-0 w-full max-w-lg bg-ink-900 border-s border-cream-50/10 overflow-y-auto p-7" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="font-display text-2xl text-gold-300" dir="ltr">{detail.order.order_number}</span>
                  <p className="text-cream-50/40 text-xs mt-1">{new Date(detail.order.created_at).toLocaleString(loc === 'ar' ? 'ar-EG' : 'en-GB')} · {detail.order.order_type === 'pickup' ? t('checkout.pickup') : t('checkout.delivery')}</p>
                </div>
                <button onClick={() => setDetail(null)} aria-label={t('common.close')}><X size={18} className="text-cream-50/40 hover:text-cream-50" /></button>
              </div>

              <div className="card-lux p-4 mb-5 text-sm flex flex-col gap-1.5">
                <p className="text-cream-50/80">{detail.order.customer_name}</p>
                <p className="text-cream-50/50 flex items-center gap-2" dir="ltr"><Phone size={12} />{detail.order.phone}</p>
                {detail.order.email && <p className="text-cream-50/50 flex items-center gap-2" dir="ltr"><Mail size={12} />{detail.order.email}</p>}
                {detail.order.address && (
                  <p className="text-cream-50/50 flex items-start gap-2 mt-1"><MapPin size={12} className="mt-1 shrink-0" />
                    {[detail.order.address.street, detail.order.address.building, detail.order.address.apartment, detail.order.address.area, detail.order.address.city, detail.order.address.governorate].filter(Boolean).join(', ')}
                    {detail.order.address.instructions ? ` — ${detail.order.address.instructions}` : ''}</p>
                )}
                {detail.order.instructions && <p className="text-cream-50/40 italic mt-1">“{detail.order.instructions}”</p>}
              </div>

              <div className="flex flex-col gap-2.5 mb-5">
                {detail.items.map((i: any) => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-cream-50/75"><span className="text-gold-400/80 tabular-nums">{i.quantity}×</span> {loc === 'ar' ? i.name?.ar : i.name?.en}{i.size ? ` (${loc === 'ar' ? i.size.ar : i.size.en})` : ''}
                      {i.addons?.length > 0 && <span className="block text-cream-50/35 text-xs">+ {i.addons.map((a: any) => loc === 'ar' ? a.ar : a.en).join(', ')}</span>}
                      {i.instructions && <span className="block text-cream-50/30 text-xs italic">“{i.instructions}”</span>}
                    </span>
                    <span className="tabular-nums shrink-0">{formatEGP(parseFloat(i.line_total), loc)}</span>
                  </div>
                ))}
                <div className="border-t border-cream-50/10 pt-3 flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between text-cream-50/50"><span>{t('cart.subtotal')}</span><span className="tabular-nums">{formatEGP(parseFloat(detail.order.subtotal), loc)}</span></div>
                  {parseFloat(detail.order.discount) > 0 && <div className="flex justify-between text-gold-300"><span>{t('cart.discount')} {detail.order.coupon_code ? `(${detail.order.coupon_code})` : ''}</span><span className="tabular-nums">−{formatEGP(parseFloat(detail.order.discount), loc)}</span></div>}
                  <div className="flex justify-between text-cream-50/50"><span>{t('cart.deliveryFee')}</span><span className="tabular-nums">{formatEGP(parseFloat(detail.order.delivery_fee), loc)}</span></div>
                  <div className="flex justify-between text-base pt-2 border-t border-cream-50/10"><span>{t('cart.total')}</span><span className="text-gold-400 tabular-nums">{formatEGP(parseFloat(detail.order.total), loc)}</span></div>
                  <p className="text-cream-50/35 text-xs">{t('checkout.payment')}: {detail.order.payment_method === 'cod' ? t('checkout.cod') : t('checkout.card')}</p>
                </div>
              </div>

              <span className="field-label">{t('admin.status')}</span>
              <div className="flex flex-wrap gap-2 mb-5">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => patch(detail.order.id, { status: s })}
                    className={`chip border transition-all ${detail.order.status === s ? STATUS_STYLE[s] + ' bg-cream-50/5' : 'border-cream-50/15 text-cream-50/45 hover:text-cream-50'}`}>
                    {t(`track.status.${s}`)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="field-label">{t('admin.eta')}</span>
                  <input value={eta} onChange={(e) => setEta(e.target.value)} inputMode="numeric" className="input-lux !py-2" dir="ltr" />
                </div>
                <div className="flex items-end"><button onClick={() => patch(detail.order.id, { estimated_minutes: parseInt(eta) || undefined })} className="btn-lux !px-5 !py-2 text-[11px] w-full justify-center"><span>{t('admin.save')}</span></button></div>
                <div className="col-span-2">
                  <span className="field-label">{t('admin.comment')}</span>
                  <input value={note} onChange={(e) => setNote(e.target.value)} className="input-lux !py-2" />
                </div>
                <div className="col-span-2"><button onClick={() => patch(detail.order.id, { status_note: note || undefined })} className="btn-lux !px-5 !py-2 text-[11px] w-full justify-center"><span>{t('admin.save')}</span></button></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

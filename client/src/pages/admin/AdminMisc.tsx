import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Star, Check } from 'lucide-react';
import { api, formatEGP } from '../../lib/api';

/* ---------- RESERVATIONS ---------- */
export function AdminReservations() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [rows, setRows] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const load = () => {
    api.get('/admin/reservations', { params: { date: date || undefined, status: status || undefined } }).then((r) => setRows(r.data.reservations)).catch(() => {});
    api.get('/admin/tables').then((r) => setTables(r.data.tables)).catch(() => {});
  };
  useEffect(() => { load(); }, [date, status]);
  const patch = async (id: string, body: any) => { await api.patch(`/admin/reservations/${id}`, body).catch(() => {}); load(); };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div><span className="field-label">{t('admin.allDates')}</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-lux !py-2 [color-scheme:dark]" /></div>
        <div>
          <span className="field-label">{t('admin.status')}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-lux !py-2 bg-transparent [&>option]:bg-ink-900 w-44">
            <option value="">{t('admin.allStatuses')}</option>
            {['pending', 'confirmed', 'cancelled', 'completed', 'no_show'].map((s) => <option key={s} value={s}>{t(`reservations.status.${s}`)}</option>)}
          </select>
        </div>
      </div>
      <div className="card-lux overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead><tr className="text-[10px] uppercase tracking-[0.18em] text-cream-50/35 border-b border-cream-50/10">
            {[t('admin.customer'), t('checkout.phone'), t('reservations.date'), t('reservations.time'), t('admin.guests'), t('admin.table'), t('admin.status'), t('admin.actions')].map((h) => <th key={h} className="text-start font-normal px-4 py-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-cream-50/5">
                <td className="px-4 py-3">{r.name}{r.special_requests && <p className="text-cream-50/35 text-xs italic mt-0.5">“{r.special_requests}”</p>}</td>
                <td className="px-4 py-3 tabular-nums" dir="ltr">{r.phone}</td>
                <td className="px-4 py-3 tabular-nums" dir="ltr">{r.date}</td>
                <td className="px-4 py-3 tabular-nums" dir="ltr">{r.time_slot}</td>
                <td className="px-4 py-3 tabular-nums">{r.guests}</td>
                <td className="px-4 py-3">
                  <select value={r.table_id || ''} onChange={(e) => patch(r.id, { table_id: e.target.value || null })} className="bg-transparent border-b border-cream-50/20 text-xs py-1 [&>option]:bg-ink-900">
                    <option value="">{t('admin.noTable')}</option>
                    {tables.map((tb) => <option key={tb.id} value={tb.id}>{tb.label} ({tb.seats})</option>)}
                  </select>
                </td>
                <td className="px-4 py-3"><span className="chip">{t(`reservations.status.${r.status}`)}</span></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {(['confirmed', 'completed', 'no_show', 'cancelled'] as const).map((s) => (
                      <button key={s} onClick={() => patch(r.id, { status: s })} className="text-[10px] uppercase tracking-[0.1em] px-2 py-1 border border-cream-50/15 text-cream-50/50 hover:border-gold-400 hover:text-gold-300 transition-colors">{t(`reservations.status.${s}`)}</button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-cream-50/35">—</p>}
      </div>
    </div>
  );
}

/* ---------- CUSTOMERS ---------- */
export function AdminCustomers() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [rows, setRows] = useState<any[]>([]);
  const [detail, setDetail] = useState<any | null>(null);
  useEffect(() => { api.get('/admin/customers').then((r) => setRows(r.data.customers)).catch(() => {}); }, []);
  const open = async (id: string) => { const { data } = await api.get(`/admin/customers/${id}`); setDetail(data); };

  return (
    <div>
      <div className="card-lux overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead><tr className="text-[10px] uppercase tracking-[0.18em] text-cream-50/35 border-b border-cream-50/10">
            {[t('admin.customer'), t('auth.email'), t('checkout.phone'), t('admin.totalOrders'), t('admin.spent'), t('dash.member')].map((h) => <th key={h} className="text-start font-normal px-4 py-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} onClick={() => open(c.id)} className="border-b border-cream-50/5 hover:bg-gold-400/5 cursor-pointer transition-colors">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3 text-cream-50/60" dir="ltr">{c.email}</td>
                <td className="px-4 py-3 tabular-nums" dir="ltr">{c.phone || '—'}</td>
                <td className="px-4 py-3 tabular-nums">{c.order_count}</td>
                <td className="px-4 py-3 tabular-nums text-gold-400">{formatEGP(parseFloat(c.total_spent), loc)}</td>
                <td className="px-4 py-3 text-cream-50/40 text-xs">{new Date(c.created_at).toLocaleDateString(loc === 'ar' ? 'ar-EG' : 'en-GB')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-cream-50/35">—</p>}
      </div>
      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[900] bg-ink-950/70 backdrop-blur-sm" onClick={() => setDetail(null)}>
            <motion.div initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }} className="absolute end-0 top-0 bottom-0 w-full max-w-lg bg-ink-900 border-s border-cream-50/10 overflow-y-auto p-7" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <div><h3 className="font-display text-2xl">{detail.customer.name}</h3><p className="text-cream-50/40 text-xs mt-1" dir="ltr">{detail.customer.email} · {detail.customer.phone || ''}</p></div>
                <button onClick={() => setDetail(null)} aria-label={t('common.close')}><X size={18} className="text-cream-50/40" /></button>
              </div>
              <span className="field-label">{t('admin.orderHistory')}</span>
              <div className="flex flex-col divide-y divide-cream-50/8 mb-6">
                {detail.orders.map((o: any) => (
                  <div key={o.id} className="py-2.5 flex justify-between text-sm">
                    <span className="font-display text-gold-300" dir="ltr">{o.order_number}</span>
                    <span className="text-cream-50/45 text-xs">{t(`track.status.${o.status}`)}</span>
                    <span className="tabular-nums">{formatEGP(parseFloat(o.total), loc)}</span>
                  </div>
                ))}
                {detail.orders.length === 0 && <p className="text-cream-50/35 text-sm py-3">—</p>}
              </div>
              <span className="field-label">{t('dash.reservations')}</span>
              <div className="flex flex-col divide-y divide-cream-50/8">
                {detail.reservations.map((r: any) => (
                  <div key={r.id} className="py-2.5 flex justify-between text-sm">
                    <span className="tabular-nums" dir="ltr">{String(r.date).slice(0, 10)} {r.time_slot}</span>
                    <span className="text-cream-50/45 text-xs">{r.guests} {t('admin.guests')} · {t(`reservations.status.${r.status}`)}</span>
                  </div>
                ))}
                {detail.reservations.length === 0 && <p className="text-cream-50/35 text-sm py-3">—</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- PROMOTIONS (coupons + offers) ---------- */
export function AdminPromotions() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState({ code: '', kind: 'percent', value: '', min_order: '', expires_at: '' });
  const [offers, setOffers] = useState<any[]>([]);
  const load = () => {
    api.get('/admin/coupons').then((r) => setCoupons(r.data.coupons)).catch(() => {});
    api.get('/admin/settings').then((r) => setOffers(r.data.settings?.offers?.offers || r.data.settings?.offers || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.code || !form.value) return;
    await api.post('/admin/coupons', { code: form.code, kind: form.kind, value: parseFloat(form.value), min_order: parseFloat(form.min_order) || 0, expires_at: form.expires_at || null }).catch(() => {});
    setForm({ code: '', kind: 'percent', value: '', min_order: '', expires_at: '' }); load();
  };
  const toggle = async (c: any) => { await api.patch(`/admin/coupons/${c.id}`, { is_active: !c.is_active }).catch(() => {}); load(); };
  const del = async (id: string) => { await api.delete(`/admin/coupons/${id}`).catch(() => {}); load(); };

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="card-lux p-5 mb-6 grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
          <div><span className="field-label">{t('admin.couponCode')}</span><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-lux !py-2 uppercase" dir="ltr" /></div>
          <div><span className="field-label">{t('admin.kind')}</span>
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className="input-lux !py-2 w-full bg-transparent [&>option]:bg-ink-900">
              <option value="percent">{t('admin.percent')}</option><option value="fixed">{t('admin.fixed')}</option>
            </select></div>
          <div><span className="field-label">{t('admin.value')}</span><input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} inputMode="decimal" className="input-lux !py-2" dir="ltr" /></div>
          <div><span className="field-label">{t('admin.minOrder')}</span><input value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} inputMode="decimal" className="input-lux !py-2" dir="ltr" /></div>
          <div><span className="field-label">{t('admin.expires')}</span><input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="input-lux !py-2 [color-scheme:dark]" /></div>
          <button onClick={add} className="btn-gold !py-2.5 text-[11px] justify-center"><span className="flex items-center gap-1.5"><Plus size={12} />{t('admin.addCoupon')}</span></button>
        </div>
        <div className="card-lux overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-[10px] uppercase tracking-[0.18em] text-cream-50/35 border-b border-cream-50/10">
              {[t('admin.couponCode'), t('admin.kind'), t('admin.value'), t('admin.minOrder'), t('admin.usage'), t('admin.expires'), t('admin.active'), ''].map((h) => <th key={h} className="text-start font-normal px-4 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-cream-50/5">
                  <td className="px-4 py-3 font-display text-gold-300 tracking-wider" dir="ltr">{c.code}</td>
                  <td className="px-4 py-3 text-cream-50/60">{c.kind === 'percent' ? t('admin.percent') : t('admin.fixed')}</td>
                  <td className="px-4 py-3 tabular-nums">{parseFloat(c.value)}{c.kind === 'percent' ? '%' : ` ${t('common.egp')}`}</td>
                  <td className="px-4 py-3 tabular-nums">{formatEGP(parseFloat(c.min_order), loc)}</td>
                  <td className="px-4 py-3 tabular-nums">{c.usage_count}</td>
                  <td className="px-4 py-3 text-cream-50/40 text-xs">{c.expires_at ? new Date(c.expires_at).toLocaleDateString(loc === 'ar' ? 'ar-EG' : 'en-GB') : '—'}</td>
                  <td className="px-4 py-3"><button onClick={() => toggle(c)} className={`w-10 h-5 rounded-full relative transition-colors ${c.is_active ? 'bg-gold-400' : 'bg-cream-50/15'}`} aria-label={t('admin.active')}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-ink-950 transition-all ${c.is_active ? 'start-[22px]' : 'start-0.5'}`} /></button></td>
                  <td className="px-4 py-3"><button onClick={() => del(c.id)} className="text-cream-50/30 hover:text-wine-400" aria-label={t('admin.deleteDish')}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h3 className="font-display text-xl mb-4">{t('admin.offersSettings')}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {(Array.isArray(offers) ? offers : []).map((o: any) => (
            <div key={o.id} className="card-lux overflow-hidden flex">
              {o.image && <img src={o.image} alt="" className="w-28 h-28 object-cover img-dark" />}
              <div className="p-4">
                <p className="text-gold-300 text-[10px] tracking-[0.2em] uppercase">{loc === 'ar' ? o.badge_ar : o.badge_en}</p>
                <p className="font-display text-lg mt-1">{loc === 'ar' ? o.title_ar : o.title_en}</p>
                <p className="text-cream-50/45 text-xs mt-1">{loc === 'ar' ? o.body_ar : o.body_en}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- SETTINGS ---------- */
export function AdminSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<any>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { api.get('/admin/settings').then((r) => setSettings(r.data.settings)).catch(() => {}); }, []);
  if (!settings) return <p className="text-cream-50/40">{t('common.loading')}</p>;
  const rest = settings.restaurant || {};
  const ord = settings.ordering || {};
  const setRest = (k: string, v: any) => setSettings({ ...settings, restaurant: { ...rest, [k]: v } });
  const setOrd = (k: string, v: any) => setSettings({ ...settings, ordering: { ...ord, [k]: v } });
  const save = async (key: string) => {
    await api.put(`/admin/settings/${key}`, settings[key]).catch(() => {});
    setMsg(t('admin.settingsSaved')); setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div className="flex flex-col gap-10 max-w-3xl">
      <div className="card-lux p-6">
        <h3 className="font-display text-xl mb-5">{t('admin.restaurantSettings')}</h3>
        <div className="grid md:grid-cols-2 gap-5">
          <div><span className="field-label">{t('checkout.name')} (EN)</span><input value={rest.name_en || ''} onChange={(e) => setRest('name_en', e.target.value)} className="input-lux" dir="ltr" /></div>
          <div><span className="field-label">{t('checkout.name')} (AR)</span><input value={rest.name_ar || ''} onChange={(e) => setRest('name_ar', e.target.value)} className="input-lux" dir="rtl" /></div>
          <div><span className="field-label">{t('admin.phone')}</span><input value={rest.phone || ''} onChange={(e) => setRest('phone', e.target.value)} className="input-lux" dir="ltr" /></div>
          <div><span className="field-label">{t('admin.hours')}</span><input value={rest.hours_en || ''} onChange={(e) => setRest('hours_en', e.target.value)} className="input-lux" dir="ltr" /></div>
          <div className="md:col-span-2"><span className="field-label">{t('admin.address')} (EN)</span><input value={rest.address_en || ''} onChange={(e) => setRest('address_en', e.target.value)} className="input-lux" dir="ltr" /></div>
          <div className="md:col-span-2"><span className="field-label">{t('admin.address')} (AR)</span><input value={rest.address_ar || ''} onChange={(e) => setRest('address_ar', e.target.value)} className="input-lux" dir="rtl" /></div>
        </div>
        <button onClick={() => save('restaurant')} className="btn-gold mt-6 !px-8 !py-2.5 text-[11px]"><span>{t('admin.save')}</span></button>
      </div>

      <div className="card-lux p-6">
        <h3 className="font-display text-xl mb-5">{t('admin.orderingSettings')}</h3>
        <div className="grid md:grid-cols-3 gap-5 mb-6">
          <div><span className="field-label">{t('admin.minOrderAmount')}</span><input value={ord.min_order ?? ''} onChange={(e) => setOrd('min_order', parseFloat(e.target.value) || 0)} inputMode="decimal" className="input-lux" dir="ltr" /></div>
          <div><span className="field-label">{t('admin.estimatedMinutes')}</span><input value={ord.estimated_minutes ?? ''} onChange={(e) => setOrd('estimated_minutes', parseInt(e.target.value) || 45)} inputMode="numeric" className="input-lux" dir="ltr" /></div>
        </div>
        <span className="field-label">{t('admin.deliveryAreas')}</span>
        <div className="flex flex-col gap-2">
          {(ord.delivery_areas || []).map((a: any, i: number) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_100px_auto] gap-3">
              <input value={a.en} onChange={(e) => { const v = [...ord.delivery_areas]; v[i] = { ...v[i], en: e.target.value }; setOrd('delivery_areas', v); }} className="input-lux !py-2" dir="ltr" placeholder="Cairo" />
              <input value={a.ar} onChange={(e) => { const v = [...ord.delivery_areas]; v[i] = { ...v[i], ar: e.target.value }; setOrd('delivery_areas', v); }} className="input-lux !py-2" dir="rtl" placeholder="القاهرة" />
              <input value={a.fee} onChange={(e) => { const v = [...ord.delivery_areas]; v[i] = { ...v[i], fee: parseFloat(e.target.value) || 0 }; setOrd('delivery_areas', v); }} className="input-lux !py-2" dir="ltr" inputMode="decimal" />
              <button onClick={() => setOrd('delivery_areas', ord.delivery_areas.filter((_: any, j: number) => j !== i))} className="text-cream-50/30 hover:text-wine-400" aria-label={t('cart.remove')}><X size={14} /></button>
            </div>
          ))}
          <button onClick={() => setOrd('delivery_areas', [...(ord.delivery_areas || []), { en: '', ar: '', fee: 40 }])} className="self-start text-[11px] uppercase tracking-[0.15em] text-gold-300 flex items-center gap-1 mt-1"><Plus size={11} />+ {t('admin.deliveryAreas')}</button>
        </div>
        <button onClick={() => save('ordering')} className="btn-gold mt-6 !px-8 !py-2.5 text-[11px]"><span>{t('admin.save')}</span></button>
      </div>
      {msg && <p className="text-gold-300 text-sm flex items-center gap-2"><Check size={14} />{msg}</p>}
    </div>
  );
}

/* ---------- REVIEWS ---------- */
export function AdminReviews() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [rows, setRows] = useState<any[]>([]);
  const load = () => api.get('/admin/reviews').then((r) => setRows(r.data.reviews)).catch(() => {});
  useEffect(() => { load(); }, []);
  const patch = async (id: string, is_approved: boolean) => { await api.patch(`/admin/reviews/${id}`, { is_approved }).catch(() => {}); load(); };

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => (
        <div key={r.id} className="card-lux p-5 flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-gold-300 text-sm">{r.name}</span>
              <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={10} className={s <= r.rating ? 'fill-gold-400 text-gold-400' : 'text-cream-50/20'} />)}</span>
              <span className="text-cream-50/35 text-xs">{t('admin.dishName')}: {loc === 'ar' ? r.product_ar : r.product_en}</span>
            </div>
            {r.comment && <p className="text-cream-50/60 text-sm mt-2">{r.comment}</p>}
            <p className="text-cream-50/30 text-xs mt-1.5">{new Date(r.created_at).toLocaleString(loc === 'ar' ? 'ar-EG' : 'en-GB')}</p>
          </div>
          <button onClick={() => patch(r.id, !r.is_approved)}
            className={`shrink-0 px-4 py-2 text-[11px] uppercase tracking-[0.15em] border transition-all ${r.is_approved ? 'border-emerald-400/40 text-emerald-300' : 'border-cream-50/15 text-cream-50/45 hover:text-cream-50'}`}>
            {r.is_approved ? t('admin.hide') : t('admin.approve')}
          </button>
        </div>
      ))}
      {rows.length === 0 && <p className="p-8 text-center text-cream-50/35">—</p>}
    </div>
  );
}

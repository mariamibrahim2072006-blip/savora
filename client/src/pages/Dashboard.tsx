import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Package, CalendarDays, Heart, MapPin, Settings, LogOut, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { api, formatEGP } from '../lib/api';
import { useAuth } from '../store/auth';
import DishCard, { Product } from '../components/DishCard';

type Tab = 'profile' | 'orders' | 'reservations' | 'favorites' | 'addresses' | 'settings';
const TABS: [Tab, any, string][] = [
  ['profile', User, 'dash.profile'],
  ['orders', Package, 'dash.orders'],
  ['reservations', CalendarDays, 'dash.reservations'],
  ['favorites', Heart, 'dash.favorites'],
  ['addresses', MapPin, 'dash.addresses'],
  ['settings', Settings, 'dash.settings'],
];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const { user, ready, logout, setAuth } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'profile';
  const [orders, setOrders] = useState<any[] | null>(null);
  const [reservations, setReservations] = useState<any[] | null>(null);
  const [favorites, setFavorites] = useState<Product[] | null>(null);
  const [addresses, setAddresses] = useState<any[] | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [addrForm, setAddrForm] = useState<any | null>(null);
  const [addrBusy, setAddrBusy] = useState(false);

  useEffect(() => { if (user) { setName(user.name); setPhone(user.phone || ''); } }, [user]);
  useEffect(() => {
    if (!user) return;
    if (tab === 'orders') api.get('/orders/mine').then((r) => setOrders(r.data.orders)).catch(() => setOrders([]));
    if (tab === 'reservations') api.get('/reservations/mine').then((r) => setReservations(r.data.reservations)).catch(() => setReservations([]));
    if (tab === 'favorites') api.get('/favorites').then((r) => setFavorites(r.data.favorites)).catch(() => setFavorites([]));
    if (tab === 'addresses') api.get('/addresses').then((r) => setAddresses(r.data.addresses)).catch(() => setAddresses([]));
  }, [user, tab]);

  if (ready && !user) return <Navigate to="/auth" replace />;

  const saveProfile = async () => {
    try {
      const { data } = await api.put('/auth/profile', { name: name.trim() || undefined, phone: phone.trim() || undefined });
      setAuth(data.user, localStorage.getItem('savora_token') || '');
      setSaveMsg(t('dash.saved')); setTimeout(() => setSaveMsg(''), 2000);
    } catch { setSaveMsg(t('common.error')); }
  };

  const cancelOrder = async (id: string) => {
    try { await api.post(`/orders/${id}/cancel`); api.get('/orders/mine').then((r) => setOrders(r.data.orders)); } catch { /* ignore */ }
  };
  const cancelRes = async (id: string) => {
    try { await api.post(`/reservations/${id}/cancel`); api.get('/reservations/mine').then((r) => setReservations(r.data.reservations)); } catch { /* ignore */ }
  };
  const saveAddress = async () => {
    setAddrBusy(true);
    try {
      const body = { label: addrForm.label || 'Home', governorate: addrForm.governorate, city: addrForm.city, area: addrForm.area || null, street: addrForm.street, building: addrForm.building || null, apartment: addrForm.apartment || null, instructions: addrForm.instructions || null };
      if (addrForm.id) await api.put(`/addresses/${addrForm.id}`, body); else await api.post('/addresses', body);
      setAddrForm(null);
      api.get('/addresses').then((r) => setAddresses(r.data.addresses));
    } catch { /* ignore */ } finally { setAddrBusy(false); }
  };
  const delAddress = async (id: string) => {
    await api.delete(`/addresses/${id}`).catch(() => {});
    api.get('/addresses').then((r) => setAddresses(r.data.addresses));
  };

  const statusColor = (s: string) => s === 'delivered' || s === 'confirmed' || s === 'completed' ? 'text-emerald-400' : s === 'cancelled' || s === 'rejected' ? 'text-wine-400' : 'text-gold-300';

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[1300px] mx-auto px-5 md:px-10">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="eyebrow">SAVORA</p>
            <h1 className="headline text-4xl md:text-5xl mt-3">{t('dash.title')}</h1>
            {user && <p className="text-cream-50/40 text-sm mt-2">{user.name} · <span dir="ltr">{user.email}</span></p>}
          </div>
          <button onClick={() => { logout(); }} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cream-50/40 hover:text-wine-400 transition-colors"><LogOut size={13} />{t('dash.logout')}</button>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="lg:w-56 shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
              {TABS.map(([k, Icon, label]) => (
                <button key={k} onClick={() => setParams({ tab: k }, { replace: true })}
                  className={`flex items-center gap-3 px-4 py-3 text-[12px] uppercase tracking-[0.18em] whitespace-nowrap border-s-2 transition-all ${tab === k ? 'border-gold-400 text-gold-300 bg-gold-400/5' : 'border-transparent text-cream-50/50 hover:text-cream-50'}`}>
                  <Icon size={14} /> {t(label)}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {tab === 'profile' && user && (
              <div className="card-lux p-7 max-w-lg">
                <h2 className="font-display text-2xl mb-6">{t('dash.profile')}</h2>
                <div className="flex flex-col gap-5">
                  <div><span className="field-label">{t('checkout.name')}</span><input value={name} onChange={(e) => setName(e.target.value)} className="input-lux" /></div>
                  <div><span className="field-label">{t('checkout.phone')}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" className="input-lux text-start" /></div>
                  <div><span className="field-label">{t('auth.email')}</span><input value={user.email} disabled className="input-lux opacity-40 cursor-not-allowed" dir="ltr" /></div>
                  <div className="flex items-center gap-4">
                    <button onClick={saveProfile} className="btn-gold !px-8 !py-2.5 text-[11px]"><span>{t('dash.save')}</span></button>
                    {saveMsg && <span className="text-gold-300 text-xs">{saveMsg}</span>}
                  </div>
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div className="flex flex-col gap-4">
                {!orders && <p className="text-cream-50/40">{t('common.loading')}</p>}
                {orders?.length === 0 && <Empty text={t('dash.noOrders')} />}
                {orders?.map((o) => (
                  <div key={o.id} className="card-lux p-6">
                    <div className="flex justify-between flex-wrap gap-3">
                      <div>
                        <span className="font-display text-xl text-gold-300" dir="ltr">{o.order_number}</span>
                        <p className="text-cream-50/40 text-xs mt-1">{new Date(o.created_at).toLocaleString(loc === 'ar' ? 'ar-EG' : 'en-GB')} · {o.order_type === 'pickup' ? t('checkout.pickup') : t('checkout.delivery')}</p>
                      </div>
                      <div className="text-end">
                        <span className={`text-[12px] uppercase tracking-[0.15em] ${statusColor(o.status)}`}>{t(`track.status.${o.status}`)}</span>
                        <p className="text-gold-400 tabular-nums mt-1">{formatEGP(parseFloat(o.total), loc)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <Link to={`/track?n=${o.order_number}`} className="text-[11px] uppercase tracking-[0.2em] text-gold-300 hover:text-gold-200">{t('dash.trackOrder')}</Link>
                      {['received', 'confirmed'].includes(o.status) && (
                        <button onClick={() => cancelOrder(o.id)} className="text-[11px] uppercase tracking-[0.2em] text-wine-400 hover:text-wine-300">{t('dash.cancelOrder')}</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'reservations' && (
              <div className="flex flex-col gap-4">
                {!reservations && <p className="text-cream-50/40">{t('common.loading')}</p>}
                {reservations?.length === 0 && <Empty text={t('dash.noReservations')} />}
                {reservations?.map((r) => (
                  <div key={r.id} className="card-lux p-6 flex justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-display text-xl">{new Date(r.date + 'T00:00:00').toLocaleDateString(loc === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · <span className="tabular-nums">{r.time_slot}</span></p>
                      <p className="text-cream-50/40 text-xs mt-1">{r.guests} {t('reservations.guestsPlural')}{r.table_label ? ` · ${t('dash.table')} ${r.table_label}` : ''}</p>
                    </div>
                    <div className="text-end">
                      <span className={`text-[12px] uppercase tracking-[0.15em] ${statusColor(r.status)}`}>{t(`reservations.status.${r.status}`)}</span>
                      {!['cancelled', 'completed', 'no_show'].includes(r.status) && (
                        <p><button onClick={() => cancelRes(r.id)} className="text-[11px] uppercase tracking-[0.2em] text-wine-400 hover:text-wine-300 mt-2">{t('reservations.cancel')}</button></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'favorites' && (
              <div>
                {!favorites && <p className="text-cream-50/40">{t('common.loading')}</p>}
                {favorites?.length === 0 && <Empty text={t('dash.noFavorites')} />}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {favorites?.map((p, i) => <DishCard key={p.id} p={p} index={i} />)}
                </div>
              </div>
            )}

            {tab === 'addresses' && (
              <div className="flex flex-col gap-4 max-w-2xl">
                {!addresses && <p className="text-cream-50/40">{t('common.loading')}</p>}
                {addresses?.length === 0 && !addrForm && <Empty text={t('dash.noAddresses')} />}
                {addresses?.map((a) => (
                  <div key={a.id} className="card-lux p-5 flex justify-between items-start gap-4">
                    <div>
                      <p className="text-gold-300 text-sm tracking-wide">{a.label}</p>
                      <p className="text-cream-50/60 text-sm mt-1">{[a.street, a.building, a.apartment, a.area, a.city, a.governorate].filter(Boolean).join(', ')}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setAddrForm(a)} className="w-8 h-8 border border-cream-50/15 text-cream-50/50 hover:border-gold-400 hover:text-gold-400 transition-colors" aria-label={t('dash.editAddress')}><Pencil size={12} className="inline" /></button>
                      <button onClick={() => delAddress(a.id)} className="w-8 h-8 border border-cream-50/15 text-cream-50/50 hover:border-wine-400 hover:text-wine-400 transition-colors" aria-label={t('cart.remove')}><Trash2 size={12} className="inline" /></button>
                    </div>
                  </div>
                ))}
                {!addrForm ? (
                  <button onClick={() => setAddrForm({ label: '', governorate: '', city: '', area: '', street: '', building: '', apartment: '', instructions: '' })}
                    className="btn-lux self-start"><span className="flex items-center gap-2"><Plus size={13} />{t('dash.addAddress')}</span></button>
                ) : (
                  <div className="card-lux p-6">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-display text-xl">{addrForm.id ? t('dash.editAddress') : t('dash.addAddress')}</h3>
                      <button onClick={() => setAddrForm(null)} aria-label={t('common.close')}><X size={16} className="text-cream-50/40 hover:text-cream-50" /></button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {(['label', 'governorate', 'city', 'area', 'street', 'building', 'apartment'] as const).map((f) => (
                        <div key={f}><span className="field-label">{t(`checkout.${f === 'label' ? 'savedAddresses' : f}`) === `checkout.${f === 'label' ? 'savedAddresses' : f}` ? f : t(`checkout.${f}`)}</span>
                          <input value={addrForm[f] || ''} onChange={(e) => setAddrForm({ ...addrForm, [f]: e.target.value })} className="input-lux" /></div>
                      ))}
                      <div className="sm:col-span-2"><span className="field-label">{t('checkout.instructions')}</span><input value={addrForm.instructions || ''} onChange={(e) => setAddrForm({ ...addrForm, instructions: e.target.value })} className="input-lux" /></div>
                    </div>
                    <button onClick={saveAddress} disabled={addrBusy} className="btn-gold mt-6 !px-8 !py-2.5 text-[11px]"><span className="flex items-center gap-2"><Check size={12} />{t('dash.save')}</span></button>
                  </div>
                )}
              </div>
            )}

            {tab === 'settings' && <SettingsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  const { t } = useTranslation();
  return (
    <div className="card-lux p-10 text-center">
      <p className="font-display italic text-xl text-cream-50/40">{text}</p>
      <Link to="/menu" className="btn-lux mt-6 inline-block"><span>{t('cart.browse')}</span></Link>
    </div>
  );
}

function SettingsPanel() {
  const { t, i18n } = useTranslation();
  const setLocale = useUiLocale();
  return (
    <div className="card-lux p-7 max-w-lg">
      <h2 className="font-display text-2xl mb-6">{t('dash.settings')}</h2>
      <span className="field-label">Language / اللغة</span>
      <div className="flex gap-2">
        {(['en', 'ar'] as const).map((l) => (
          <button key={l} onClick={() => setLocale(l)}
            className={`px-6 py-2.5 border text-[12px] uppercase tracking-[0.2em] transition-all ${i18n.language === l ? 'border-gold-400 text-gold-300 bg-gold-400/5' : 'border-cream-50/15 text-cream-50/50'}`}>
            {l === 'en' ? 'English' : 'العربية'}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useUi } from '../store/ui';
function useUiLocale() { return useUi((s) => s.setLocale); }

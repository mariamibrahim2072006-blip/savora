import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bike, Store, Banknote, CreditCard, MapPin, Plus, Clock } from 'lucide-react';
import { api, formatEGP } from '../lib/api';
import { useCart, lineTotal } from '../store/cart';
import { useAuth } from '../store/auth';

type Area = { en: string; ar: string; fee: number };
type Ordering = { min_order: number; estimated_minutes: number; delivery_areas: Area[]; pickup_address_en?: string; pickup_address_ar?: string };
type SavedAddress = { id: string; label: string; governorate: string; city: string; area?: string; street: string; building?: string; apartment?: string; instructions?: string };

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const nav = useNavigate();
  const { items, coupon, clear, subtotal } = useCart();
  const { user } = useAuth();
  const [ordering, setOrdering] = useState<Ordering | null>(null);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gov, setGov] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');
  const [addrInstr, setAddrInstr] = useState('');
  const [orderInstr, setOrderInstr] = useState('');
  const [saveAddr, setSaveAddr] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [payment, setPayment] = useState<'cod' | 'card'>('cod');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);
  const [serverErr, setServerErr] = useState('');

  useEffect(() => {
    api.get('/settings/public').then((r) => setOrdering(r.data.settings.ordering)).catch(() => {});
  }, []);
  useEffect(() => {
    if (user) api.get('/addresses').then((r) => setSaved(r.data.addresses || [])).catch(() => {});
  }, [user]);

  const sub = subtotal();
  const discount = coupon ? Math.min(sub, coupon.discount) : 0;
  const fee = useMemo(() => {
    if (orderType !== 'delivery' || !ordering || !gov) return 0;
    const a = ordering.delivery_areas.find((x) => x.en === gov);
    return a ? a.fee : 0;
  }, [orderType, ordering, gov]);
  const total = Math.round((sub - discount + fee) * 100) / 100;
  const belowMin = ordering ? sub - discount < ordering.min_order : false;

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = t('checkout.required');
    if (!/^01[0-9]{9}$/.test(phone.replace(/\s/g, ''))) e.phone = t('checkout.invalidPhone');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = t('checkout.invalidEmail');
    if (orderType === 'delivery') {
      if (!gov) e.gov = t('checkout.required');
      if (city.trim().length < 2) e.city = t('checkout.required');
      if (street.trim().length < 2) e.street = t('checkout.required');
    }
    if (schedule && !scheduledAt) e.schedule = t('checkout.required');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const useSaved = (a: SavedAddress) => {
    setGov(a.governorate); setCity(a.city); setArea(a.area || ''); setStreet(a.street);
    setBuilding(a.building || ''); setApartment(a.apartment || ''); setAddrInstr(a.instructions || '');
  };

  const place = async () => {
    if (!validate() || placing) return;
    setPlacing(true); setServerErr('');
    try {
      const body: any = {
        order_type: orderType,
        scheduled_at: schedule && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        customer: { name: name.trim(), phone: phone.replace(/\s/g, ''), email: email.trim() || null },
        address: orderType === 'delivery' ? { governorate: gov, city: city.trim(), area: area.trim() || null, street: street.trim(), building: building.trim() || null, apartment: apartment.trim() || null, instructions: addrInstr.trim() || null } : null,
        items: items.map((i) => ({ product_id: i.product_id, size_id: i.size?.id || null, addon_ids: i.addons.map((a) => a.id), quantity: i.quantity, instructions: i.instructions || null })),
        coupon_code: coupon?.code || null,
        payment_method: payment,
        instructions: orderInstr.trim() || null,
      };
      const { data } = await api.post('/orders', body);
      if (user && saveAddr && orderType === 'delivery') {
        api.post('/addresses', { label: city.trim() || gov, governorate: gov, city: city.trim(), area: area.trim() || null, street: street.trim(), building: building.trim() || null, apartment: apartment.trim() || null, instructions: addrInstr.trim() || null }).catch(() => {});
      }
      clear();
      nav('/confirmation', { state: { order: data.order, items: data.items } });
    } catch (e: any) {
      setServerErr(e?.response?.data?.error || t('common.error'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setPlacing(false); }
  };

  if (items.length === 0) return (
    <div className="min-h-screen pt-40 pb-24 text-center px-6">
      <h1 className="headline text-4xl md:text-5xl">{t('cart.empty')}</h1>
      <Link to="/menu" className="btn-gold mt-10 inline-block"><span>{t('cart.browse')}</span></Link>
    </div>
  );

  const err = (k: string) => errors[k] ? <p className="text-wine-400 text-xs mt-1">{errors[k]}</p> : null;

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        <p className="eyebrow">SAVORA</p>
        <h1 className="headline text-4xl md:text-6xl mt-4 mb-10">{t('checkout.title')}</h1>
        {serverErr && <div className="card-lux border-wine-500/40 p-4 mb-8 text-wine-400 text-sm">{serverErr}</div>}

        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          <div className="flex flex-col gap-10">
            {/* order type */}
            <section>
              <div className="grid grid-cols-2 gap-3">
                {([['delivery', Bike, t('checkout.delivery')], ['pickup', Store, t('checkout.pickup')]] as const).map(([k, Icon, label]) => (
                  <button key={k} onClick={() => setOrderType(k)}
                    className={`flex items-center justify-center gap-3 py-4 border text-[12px] uppercase tracking-[0.2em] transition-all ${orderType === k ? 'border-gold-400 text-gold-300 bg-gold-400/5' : 'border-cream-50/15 text-cream-50/55 hover:border-cream-50/35'}`}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
              {orderType === 'pickup' && ordering && (
                <p className="mt-4 text-cream-50/55 text-sm flex items-center gap-2"><MapPin size={14} className="text-gold-400" />{loc === 'ar' ? ordering.pickup_address_ar : ordering.pickup_address_en}</p>
              )}
            </section>

            {/* contact */}
            <section>
              <h2 className="font-display text-2xl mb-5">{t('checkout.contact')}</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div><span className="field-label">{t('checkout.name')}</span><input value={name} onChange={(e) => setName(e.target.value)} className="input-lux" />{err('name')}</div>
                <div><span className="field-label">{t('checkout.phone')}</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" className="input-lux text-start" placeholder="01xxxxxxxxx" />{err('phone')}</div>
                <div className="md:col-span-2"><span className="field-label">{t('checkout.email')}</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" dir="ltr" className="input-lux text-start" />{err('email')}</div>
              </div>
            </section>

            {/* address */}
            {orderType === 'delivery' && (
              <section>
                <h2 className="font-display text-2xl mb-5">{t('checkout.address')}</h2>
                {saved.length > 0 && (
                  <div className="mb-6">
                    <span className="field-label">{t('checkout.savedAddresses')}</span>
                    <div className="flex flex-wrap gap-2">
                      {saved.map((a) => (
                        <button key={a.id} onClick={() => useSaved(a)} className="chip hover:!border-gold-400 hover:!text-gold-300 transition-colors !py-2 !px-4">
                          <MapPin size={11} /> {a.label} — {loc === 'ar' ? (ordering?.delivery_areas.find((x) => x.en === a.governorate)?.ar || a.governorate) : a.governorate}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <span className="field-label">{t('checkout.governorate')}</span>
                    <select value={gov} onChange={(e) => setGov(e.target.value)} className="input-lux w-full bg-transparent [&>option]:bg-ink-900 !py-2.5 border-b border-cream-50/20 focus:border-gold-400 focus:outline-none">
                      <option value="">—</option>
                      {(ordering?.delivery_areas || []).map((a) => <option key={a.en} value={a.en}>{loc === 'ar' ? a.ar : a.en} · {a.fee} {t('common.egp')}</option>)}
                    </select>
                    {err('gov')}
                  </div>
                  <div><span className="field-label">{t('checkout.city')}</span><input value={city} onChange={(e) => setCity(e.target.value)} className="input-lux" />{err('city')}</div>
                  <div><span className="field-label">{t('checkout.area')}</span><input value={area} onChange={(e) => setArea(e.target.value)} className="input-lux" /></div>
                  <div><span className="field-label">{t('checkout.street')}</span><input value={street} onChange={(e) => setStreet(e.target.value)} className="input-lux" />{err('street')}</div>
                  <div><span className="field-label">{t('checkout.building')}</span><input value={building} onChange={(e) => setBuilding(e.target.value)} className="input-lux" /></div>
                  <div><span className="field-label">{t('checkout.apartment')}</span><input value={apartment} onChange={(e) => setApartment(e.target.value)} className="input-lux" /></div>
                  <div className="md:col-span-2"><span className="field-label">{t('checkout.instructions')}</span><input value={addrInstr} onChange={(e) => setAddrInstr(e.target.value)} className="input-lux" /></div>
                </div>
                {user && (
                  <label className="flex items-center gap-3 mt-4 cursor-pointer text-sm text-cream-50/60">
                    <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="accent-[#c9a24b]" />
                    {t('checkout.saveAddress')}
                  </label>
                )}
              </section>
            )}

            {/* schedule */}
            <section>
              <label className="flex items-center gap-3 cursor-pointer text-sm text-cream-50/70">
                <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} className="accent-[#c9a24b]" />
                <Clock size={14} className="text-gold-400" /> {t('checkout.schedule')}
              </label>
              {schedule && (
                <div className="mt-4 max-w-xs">
                  <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                    className="input-lux [color-scheme:dark]" />
                  {err('schedule')}
                </div>
              )}
            </section>

            {/* payment */}
            <section>
              <h2 className="font-display text-2xl mb-5">{t('checkout.payment')}</h2>
              <div className="flex flex-col gap-3">
                <button onClick={() => setPayment('cod')} className={`flex items-center gap-4 p-5 border text-start transition-all ${payment === 'cod' ? 'border-gold-400 bg-gold-400/5' : 'border-cream-50/15 hover:border-cream-50/35'}`}>
                  <Banknote size={20} className="text-gold-400 shrink-0" />
                  <span>
                    <span className={`block text-sm tracking-wide ${payment === 'cod' ? 'text-gold-300' : 'text-cream-50/80'}`}>{t('checkout.cod')}</span>
                    <span className="block text-cream-50/40 text-xs mt-0.5">{t('checkout.codD')}</span>
                  </span>
                </button>
                <button onClick={() => setPayment('card')} className={`flex items-center gap-4 p-5 border text-start transition-all ${payment === 'card' ? 'border-gold-400 bg-gold-400/5' : 'border-cream-50/15 hover:border-cream-50/35'}`}>
                  <CreditCard size={20} className="text-cream-50/40 shrink-0" />
                  <span>
                    <span className={`block text-sm tracking-wide ${payment === 'card' ? 'text-gold-300' : 'text-cream-50/80'}`}>{t('checkout.card')}</span>
                    <span className="block text-cream-50/40 text-xs mt-0.5">{t('checkout.cardD')}</span>
                  </span>
                </button>
              </div>
            </section>

            {/* order instructions */}
            <section>
              <span className="field-label">{t('dish.instructions')}</span>
              <textarea value={orderInstr} onChange={(e) => setOrderInstr(e.target.value)} rows={2} className="input-lux resize-none" placeholder={t('dish.instructionsPh')} maxLength={400} />
            </section>
          </div>

          {/* summary */}
          <aside className="lg:sticky lg:top-28 self-start card-lux p-7">
            <h2 className="font-display text-2xl mb-6">{t('checkout.summary')}</h2>
            <div className="flex flex-col gap-4 max-h-72 overflow-y-auto pe-1 mb-6">
              {items.map((i) => (
                <div key={i.key} className="flex justify-between gap-4 text-sm">
                  <span className="text-cream-50/70 min-w-0">
                    <span className="text-gold-400/80 tabular-nums">{i.quantity}×</span> {loc === 'ar' ? i.name.ar : i.name.en}
                    {i.size && <span className="text-cream-50/35 text-xs"> ({loc === 'ar' ? i.size.ar : i.size.en})</span>}
                    {i.addons.length > 0 && <span className="block text-cream-50/35 text-xs">+ {i.addons.map((a) => loc === 'ar' ? a.ar : a.en).join('، ')}</span>}
                  </span>
                  <span className="tabular-nums text-cream-50/80 shrink-0">{formatEGP(lineTotal(i), loc)}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 text-sm border-t border-cream-50/10 pt-5">
              <div className="flex justify-between text-cream-50/65"><span>{t('cart.subtotal')}</span><span className="tabular-nums">{formatEGP(sub, loc)}</span></div>
              {discount > 0 && <div className="flex justify-between text-gold-300"><span>{t('cart.discount')} ({coupon?.code})</span><span className="tabular-nums">−{formatEGP(discount, loc)}</span></div>}
              <div className="flex justify-between text-cream-50/65"><span>{t('cart.deliveryFee')}</span><span className="tabular-nums">{orderType === 'pickup' ? '—' : formatEGP(fee, loc)}</span></div>
              <div className="flex justify-between text-lg pt-3 border-t border-cream-50/10"><span className="font-display">{t('cart.total')}</span><span className="text-gold-400 font-medium tabular-nums">{formatEGP(total, loc)}</span></div>
            </div>
            {belowMin && <p className="text-wine-400 text-xs mt-4">{t('checkout.minOrder')} {ordering?.min_order} {t('common.egp')}</p>}
            <motion.button whileTap={{ scale: 0.98 }} onClick={place} disabled={placing || belowMin}
              className="btn-gold w-full justify-center mt-7 disabled:opacity-40 disabled:pointer-events-none">
              <span>{placing ? t('checkout.placing') : `${t('checkout.place')} · ${formatEGP(total, loc)}`}</span>
            </motion.button>
          </aside>
        </div>
      </div>
    </div>
  );
}

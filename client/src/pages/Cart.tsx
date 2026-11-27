import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, Tag, X } from 'lucide-react';
import { api, formatEGP } from '../lib/api';
import { useCart, lineTotal, unitPrice } from '../store/cart';
import { DishImage } from '../components/DishCard';

export default function Cart() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const { items, coupon, updateQty, remove, clear, setCoupon, subtotal } = useCart();
  const [code, setCode] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setPromoBusy(true); setPromoMsg('');
    try {
      const { data } = await api.post('/coupons/validate', { code: code.trim(), subtotal: subtotal() });
      setCoupon({ code: data.code, discount: data.discount });
      setPromoMsg(t('cart.promoApplied'));
    } catch (e: any) {
      setCoupon(null);
      setPromoMsg(e?.response?.data?.error || t('common.error'));
    } finally { setPromoBusy(false); }
  };

  const sub = subtotal();
  const discount = coupon ? Math.min(sub, coupon.discount) : 0;

  if (items.length === 0) return (
    <div className="min-h-screen pt-40 pb-24 text-center px-6">
      <p className="eyebrow">SAVORA</p>
      <h1 className="headline text-4xl md:text-6xl mt-4">{t('cart.empty')}</h1>
      <p className="text-cream-50/45 mt-4 font-display italic text-xl">{t('cart.emptyD')}</p>
      <Link to="/menu" className="btn-gold mt-10 inline-block"><span>{t('cart.browse')}</span></Link>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="eyebrow">SAVORA</p>
            <h1 className="headline text-4xl md:text-6xl mt-4">{t('cart.title')}</h1>
          </div>
          <button onClick={clear} className="text-[11px] uppercase tracking-[0.2em] text-cream-50/40 hover:text-wine-400 transition-colors flex items-center gap-2">
            <Trash2 size={13} /> {t('cart.clear')}
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          <div className="flex flex-col divide-y divide-cream-50/10">
            <AnimatePresence initial={false}>
              {items.map((i) => (
                <motion.div key={i.key} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} className="py-6 flex gap-5">
                  <Link to={`/dish/${i.slug}`} className="w-24 h-24 md:w-28 md:h-28 shrink-0 overflow-hidden">
                    <DishImage src={i.image} alt={i.name.en} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <Link to={`/dish/${i.slug}`} className="font-display text-xl hover:text-gold-300 transition-colors line-clamp-1">{loc === 'ar' ? i.name.ar : i.name.en}</Link>
                        <div className="text-cream-50/40 text-xs mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                          {i.size && <span className="chip !py-0.5 !px-2">{loc === 'ar' ? i.size.ar : i.size.en}</span>}
                          {i.addons.map((a) => <span key={a.id} className="chip !py-0.5 !px-2">+ {loc === 'ar' ? a.ar : a.en}</span>)}
                        </div>
                        {i.instructions && <p className="text-cream-50/35 text-xs mt-1.5 italic">“{i.instructions}”</p>}
                        <p className="text-cream-50/40 text-xs mt-2 tabular-nums">{formatEGP(unitPrice(i), loc)} {t('cart.each')}</p>
                      </div>
                      <div className="text-end shrink-0">
                        <div className="text-gold-400 font-medium tabular-nums">{formatEGP(lineTotal(i), loc)}</div>
                        <div className="flex items-center gap-2 mt-3 justify-end">
                          <button onClick={() => updateQty(i.key, i.quantity - 1)} className="w-8 h-8 border border-cream-50/15 text-cream-50/60 hover:border-gold-400 hover:text-gold-400 transition-colors" aria-label="-"><Minus size={12} className="inline" /></button>
                          <span className="w-6 text-center tabular-nums text-sm">{i.quantity}</span>
                          <button onClick={() => updateQty(i.key, i.quantity + 1)} className="w-8 h-8 border border-cream-50/15 text-cream-50/60 hover:border-gold-400 hover:text-gold-400 transition-colors" aria-label="+"><Plus size={12} className="inline" /></button>
                          <button onClick={() => remove(i.key)} className="w-8 h-8 text-cream-50/35 hover:text-wine-400 transition-colors" aria-label={t('cart.remove')}><Trash2 size={13} className="inline" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <aside className="lg:sticky lg:top-28 self-start card-lux p-7">
            <h2 className="font-display text-2xl mb-6">{t('checkout.summary')}</h2>
            <div className="mb-6">
              <span className="field-label">{t('cart.promo')}</span>
              {coupon ? (
                <div className="flex items-center justify-between border border-gold-400/40 bg-gold-400/5 px-4 py-3">
                  <span className="flex items-center gap-2 text-gold-300 text-sm tracking-wider"><Tag size={13} />{coupon.code}</span>
                  <button onClick={() => setCoupon(null)} className="text-cream-50/40 hover:text-wine-400" aria-label={t('cart.remove')}><X size={14} /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('cart.promoPh')} className="input-lux flex-1 uppercase tracking-widest" />
                  <button onClick={applyCoupon} disabled={promoBusy} className="btn-lux !px-5 !py-2 text-[11px]"><span>{t('cart.apply')}</span></button>
                </div>
              )}
              {promoMsg && <p className={`text-xs mt-2 ${coupon ? 'text-gold-300' : 'text-wine-400'}`}>{promoMsg}</p>}
            </div>
            <div className="flex flex-col gap-3 text-sm border-t border-cream-50/10 pt-5">
              <div className="flex justify-between text-cream-50/65"><span>{t('cart.subtotal')}</span><span className="tabular-nums">{formatEGP(sub, loc)}</span></div>
              {discount > 0 && <div className="flex justify-between text-gold-300"><span>{t('cart.discount')} ({coupon?.code})</span><span className="tabular-nums">−{formatEGP(discount, loc)}</span></div>}
              <div className="flex justify-between text-cream-50/40 text-xs"><span>{t('cart.deliveryFee')}</span><span className="tabular-nums">—</span></div>
              <div className="flex justify-between text-lg pt-3 border-t border-cream-50/10"><span className="font-display">{t('cart.total')}</span><span className="text-gold-400 font-medium tabular-nums">{formatEGP(sub - discount, loc)}</span></div>
            </div>
            <Link to="/checkout" className="btn-gold w-full justify-center mt-7"><span>{t('cart.checkout')}</span></Link>
            <Link to="/menu" className="block text-center text-[11px] uppercase tracking-[0.2em] text-cream-50/40 hover:text-gold-300 mt-4 transition-colors">{t('cart.browse')}</Link>
          </aside>
        </div>
      </div>
    </div>
  );
}

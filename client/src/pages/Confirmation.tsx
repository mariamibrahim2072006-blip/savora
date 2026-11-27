import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { formatEGP } from '../lib/api';

export default function Confirmation() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const { state } = useLocation() as any;
  const [copied, setCopied] = useState(false);
  const order = state?.order;
  const items = state?.items || [];

  if (!order) return (
    <div className="min-h-screen pt-40 text-center px-6">
      <h1 className="headline text-4xl">{t('notFound.title')}</h1>
      <Link to="/" className="btn-lux mt-8 inline-block"><span>{t('confirmation.backHome')}</span></Link>
    </div>
  );

  const copy = () => {
    navigator.clipboard?.writeText(order.order_number).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen pt-32 pb-24">
      <div className="max-w-[720px] mx-auto px-5 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 mx-auto border border-gold-400 grid place-items-center mb-8">
          <Check size={32} className="text-gold-400" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h1 className="headline text-4xl md:text-5xl">{t('confirmation.title')}</h1>
          <p className="text-cream-50/60 mt-4 font-display italic text-xl">{t('confirmation.thanks', { name: order.customer_name?.split(' ')[0] || '' })}</p>

          <button onClick={copy} className="mt-8 inline-flex items-center gap-3 border border-gold-400/40 bg-gold-400/5 px-6 py-4 hover:bg-gold-400/10 transition-colors">
            <span className="text-[11px] uppercase tracking-[0.2em] text-cream-50/50">{t('confirmation.number')}</span>
            <span className="font-display text-2xl text-gold-300 tracking-wider" dir="ltr">{order.order_number}</span>
            <Copy size={14} className="text-cream-50/40" />
          </button>
          {copied && <p className="text-gold-300 text-xs mt-2">✓</p>}

          <p className="mt-6 text-cream-50/55 text-sm">
            {t('confirmation.eta')} <span className="text-gold-300 tabular-nums">{order.estimated_minutes || 45} {t('confirmation.minutes')}</span>
          </p>
          <p className="mt-2 text-cream-50/55 text-sm">
            {t('confirmation.codNote')} <span className="text-gold-400 font-medium tabular-nums">{formatEGP(parseFloat(order.total), loc)}</span> {t('confirmation.codNote2')}
          </p>

          {items.length > 0 && (
            <div className="card-lux p-6 mt-10 text-start">
              <span className="field-label">{t('confirmation.summary')}</span>
              <div className="flex flex-col gap-3 mt-3">
                {items.map((i: any, k: number) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-cream-50/70"><span className="text-gold-400/80 tabular-nums">{i.quantity}×</span> {loc === 'ar' ? i.name.ar : i.name.en}{i.size ? ` (${loc === 'ar' ? i.size.ar : i.size.en})` : ''}</span>
                    <span className="tabular-nums">{formatEGP(parseFloat(i.line_total), loc)}</span>
                  </div>
                ))}
                <div className="border-t border-cream-50/10 pt-3 flex flex-col gap-2">
                  <div className="flex justify-between text-cream-50/50 text-sm"><span>{t('cart.subtotal')}</span><span className="tabular-nums">{formatEGP(parseFloat(order.subtotal), loc)}</span></div>
                  {parseFloat(order.discount) > 0 && <div className="flex justify-between text-gold-300 text-sm"><span>{t('cart.discount')}</span><span className="tabular-nums">−{formatEGP(parseFloat(order.discount), loc)}</span></div>}
                  <div className="flex justify-between text-cream-50/50 text-sm"><span>{t('cart.deliveryFee')}</span><span className="tabular-nums">{formatEGP(parseFloat(order.delivery_fee), loc)}</span></div>
                  <div className="flex justify-between text-lg pt-2 border-t border-cream-50/10"><span className="font-display">{t('cart.total')}</span><span className="text-gold-400 tabular-nums">{formatEGP(parseFloat(order.total), loc)}</span></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link to={`/track?n=${order.order_number}`} className="btn-gold"><span>{t('confirmation.track')}</span></Link>
            <Link to="/" className="btn-lux"><span>{t('confirmation.backHome')}</span></Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

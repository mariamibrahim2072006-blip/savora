import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function Contact() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  const [rest, setRest] = useState<any>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { api.get('/settings/public').then((r) => setRest(r.data.settings.restaurant)).catch(() => {}); }, []);

  const phone = rest?.phone || '+20 100 000 0000';
  const waDigits = phone.replace(/\D/g, '');
  const waText = encodeURIComponent(name || message ? `${name ? name + ': ' : ''}${message}` : 'Hello SAVORA');
  const hours: { d: string; en: string; ar: string }[] = rest?.hours || [];

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[1100px] mx-auto px-5 md:px-10">
        <p className="eyebrow">SAVORA</p>
        <h1 className="headline text-5xl md:text-7xl mt-4 mb-14">{t('pages.contactTitle')}</h1>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="flex flex-col gap-4">
            {[
              [MapPin, t('pages.addressT'), ar ? rest?.address_ar : rest?.address_en],
              [Phone, t('admin.phone'), <span dir="ltr">{phone}</span>],
              [Mail, t('auth.email'), <span dir="ltr">{rest?.email}</span>],
            ].map(([Icon, label, val]: any, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card-lux p-6 flex items-start gap-4">
                <Icon size={18} className="text-gold-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-cream-50/40">{label}</p>
                  <p className="text-cream-50/80 mt-1.5">{val || '—'}</p>
                </div>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.24 }} className="card-lux p-6">
              <div className="flex items-center gap-4 mb-3">
                <Clock size={18} className="text-gold-400" />
                <p className="text-[11px] uppercase tracking-[0.2em] text-cream-50/40">{t('pages.hoursT')}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {hours.length === 0 && <p className="text-cream-50/70">{ar ? 'يوميًا ١ ظهرًا — ١٢ منتصف الليل' : 'Daily 1:00 PM — 12:00 AM'}</p>}
                {hours.map((h) => (
                  <div key={h.d} className="flex justify-between text-sm">
                    <span className="text-cream-50/60">{ar ? h.ar : h.en.split('—')[0].trim()}</span>
                    <span className="text-cream-50/80 tabular-nums" dir="ltr">{ar ? h.en : h.en.split('—')[1]?.trim() || h.en}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-lux p-7 md:p-9">
            <h2 className="font-display text-2xl mb-6">{t('pages.message')}</h2>
            <div className="flex flex-col gap-5">
              <div><span className="field-label">{t('checkout.name')}</span><input value={name} onChange={(e) => setName(e.target.value)} className="input-lux" /></div>
              <div><span className="field-label">{t('pages.message')}</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder={t('pages.messagePh')} className="input-lux resize-none" /></div>
              <a href={`https://wa.me/${waDigits}?text=${waText}`} target="_blank" rel="noreferrer" className="btn-gold justify-center">
                <span className="flex items-center gap-2"><MessageCircle size={15} />{t('pages.send')}</span>
              </a>
              <p className="text-cream-50/35 text-xs text-center">WhatsApp · <span dir="ltr">{phone}</span></p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

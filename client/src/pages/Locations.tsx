import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { api } from '../lib/api';

const FALLBACK = {
  address_en: '12 Nile Corniche, Garden City, Cairo',
  address_ar: '١٢ كورنيش النيل، جاردن سيتي، القاهرة',
  phone: '+20 155 555 0110',
  hours: [
    { d: 'sat-thu', ar: 'السبت – الخميس', en: 'Saturday – Thursday', open: '10:00', close: '00:00' },
    { d: 'fri', ar: 'الجمعة', en: 'Friday', open: '13:00', close: '01:00' },
  ],
};

export default function Locations() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  const [rest, setRest] = useState<any>(FALLBACK);
  useEffect(() => {
    api.get('/settings/public').then((r) => {
      const s = r.data?.settings?.restaurant;
      if (s) setRest({ ...FALLBACK, ...s, hours: s.hours?.length ? s.hours : FALLBACK.hours });
    }).catch(() => {});
  }, []);

  const lat = 30.0366, lon = 31.2300;
  const bbox = `${lon - 0.012},${lat - 0.007},${lon + 0.012},${lat + 0.007}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  const address = ar ? rest.address_ar : rest.address_en;

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[1200px] mx-auto px-5 md:px-10">
        <p className="eyebrow">SAVORA</p>
        <h1 className="headline text-5xl md:text-7xl mt-4 mb-14">{t('pages.locationsTitle')}</h1>
        <div className="grid lg:grid-cols-5 gap-6 md:gap-8">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-lux p-7 md:p-9 lg:col-span-2 flex flex-col gap-6">
            <div>
              <p className="eyebrow mb-3">{ar ? 'الفرع الرئيسي' : 'Main branch'}</p>
              <h2 className="font-display text-3xl">{ar ? 'جاردن سيتي' : 'Garden City'}</h2>
            </div>
            <div className="flex items-start gap-4">
              <MapPin size={18} className="text-gold-400 shrink-0 mt-0.5" />
              <p className="text-cream-50/80">{address}</p>
            </div>
            <div className="flex items-start gap-4">
              <Phone size={18} className="text-gold-400 shrink-0 mt-0.5" />
              <p className="text-cream-50/80" dir="ltr">{rest.phone}</p>
            </div>
            <div className="flex items-start gap-4">
              <Clock size={18} className="text-gold-400 shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-col gap-1.5">
                {rest.hours.map((h: any) => (
                  <div key={h.d} className="flex justify-between text-sm gap-4">
                    <span className="text-cream-50/60">{ar ? h.ar : h.en}</span>
                    <span className="text-cream-50/80 tabular-nums" dir="ltr">{h.open} – {h.close}</span>
                  </div>
                ))}
              </div>
            </div>
            <a href={gmaps} target="_blank" rel="noreferrer" className="btn-lux justify-center mt-2">
              <span className="flex items-center gap-2"><Navigation size={15} />{ar ? 'افتح في الخرائط' : 'Open in Maps'}</span>
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-lux lg:col-span-3 overflow-hidden min-h-[320px] md:min-h-[460px]">
            <iframe title="SAVORA map" src={mapSrc} className="w-full h-full min-h-[320px] md:min-h-[460px] border-0" style={{ filter: 'invert(0.92) hue-rotate(180deg) saturate(0.6)' }} loading="lazy" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const IMAGES = [
  { src: '/images/site/gallery-1.webp', en: 'Charcoal, mid-service', ar: 'الفحم وقت الذروة' },
  { src: '/images/site/gallery-2.webp', en: 'The pass, plated', ar: 'التجهيز قبل التقديم' },
  { src: '/images/site/gallery-3.webp', en: 'Dawn delivery', ar: 'توريد الصبح' },
  { src: '/images/site/gallery-4.webp', en: 'Dining room at dusk', ar: 'الصالة وقت الغروب' },
  { src: '/images/site/gallery-5.webp', en: 'Sauce, finished by hand', ar: 'الصوص يتنهي بالإيد' },
  { src: '/images/site/gallery-6.webp', en: 'The oven never sleeps', ar: 'الفرن لا ينام' },
  { src: '/images/site/gallery-7.webp', en: 'Table for the evening', ar: 'ترابيزة المساء' },
  { src: '/images/site/gallery-8.webp', en: 'Last pour of the night', ar: 'آخر كوباية في الليل' },
];

export default function Gallery() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((o) => o === null ? o : (o + 1) % IMAGES.length);
      if (e.key === 'ArrowLeft') setOpen((o) => o === null ? o : (o - 1 + IMAGES.length) % IMAGES.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <p className="eyebrow">SAVORA</p>
        <h1 className="headline text-5xl md:text-7xl mt-4 mb-14">{t('pages.galleryTitle')}</h1>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [&>*]:mb-5">
          {IMAGES.map((img, i) => (
            <motion.button key={img.src} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.08 }}
              onClick={() => setOpen(i)} className="group relative block w-full overflow-hidden break-inside-avoid text-start">
              <img src={img.src} alt={img.en} loading="lazy" className={`w-full object-cover img-dark transition-transform duration-[1.2s] ease-luxury group-hover:scale-105 ${i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-[4/3]'}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="absolute bottom-4 start-4 text-cream-50/90 text-sm font-display italic opacity-0 group-hover:opacity-100 transition-opacity duration-500">{ar ? img.ar : img.en}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* lightbox */}
      <AnimatePresence>
        {open !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[950] bg-ink-950/95 backdrop-blur-md flex items-center justify-center p-5 md:p-14" onClick={() => setOpen(null)}>
            <button className="absolute top-5 end-5 text-cream-50/60 hover:text-cream-50 z-10" onClick={() => setOpen(null)} aria-label={t('common.close')}><X size={26} /></button>
            <button className="absolute start-3 md:start-8 top-1/2 -translate-y-1/2 w-11 h-11 border border-cream-50/20 grid place-items-center text-cream-50/60 hover:border-gold-400 hover:text-gold-300 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + IMAGES.length) % IMAGES.length); }} aria-label={t('common.previous')}>
              <ChevronLeft size={18} className="rtl:-scale-x-100" />
            </button>
            <button className="absolute end-3 md:end-8 top-1/2 -translate-y-1/2 w-11 h-11 border border-cream-50/20 grid place-items-center text-cream-50/60 hover:border-gold-400 hover:text-gold-300 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % IMAGES.length); }} aria-label={t('common.next')}>
              <ChevronRight size={18} className="rtl:-scale-x-100" />
            </button>
            <motion.figure key={open} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
              className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <img src={IMAGES[open].src} alt={IMAGES[open].en} className="w-full max-h-[76vh] object-contain" />
              <figcaption className="text-center mt-4 text-cream-50/60 font-display italic text-lg">{ar ? IMAGES[open].ar : IMAGES[open].en}</figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

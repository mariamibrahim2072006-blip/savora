import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, Plus, Star, Flame, Leaf, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { formatEGP, api } from '../lib/api';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { useUi } from '../store/ui';

export type Product = {
  id: string; slug: string; name_en: string; name_ar: string; description_en: string; description_ar: string;
  price: string; image: string; rating: string; rating_count: number; calories?: number;
  is_vegetarian: boolean; is_spicy: boolean; is_popular: boolean; is_new: boolean; is_available: boolean;
  category_slug: string; category_en: string; category_ar: string; ingredients: { en: string; ar: string }[];
};

export function DishImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} loading="lazy" className={`img-dark ${className || ''}`}
    onError={(e) => { (e.target as HTMLImageElement).src = '/images/site/gallery-1.webp'; }} />;
}

export default function DishCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const add = useCart((s) => s.add);
  const { user } = useAuth();
  const setCartOpen = useUi((s) => s.setCartOpen);
  const [fav, setFav] = useState(false);
  const [added, setAdded] = useState(false);

  const quickAdd = () => {
    add({
      product_id: p.id, slug: p.slug, name: { en: p.name_en, ar: p.name_ar }, image: p.image,
      base_price: parseFloat(p.price), size: null, addons: [], quantity: 1, instructions: null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
    setCartOpen(true);
  };

  const toggleFav = async () => {
    if (!user) return;
    try {
      if (fav) { await api.delete(`/favorites/${p.id}`); setFav(false); }
      else { await api.post(`/favorites/${p.id}`); setFav(true); }
    } catch { /* ignore */ }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative card-lux overflow-hidden">
      <Link to={`/dish/${p.slug}`} className="block relative overflow-hidden aspect-[4/3]">
        <DishImage src={p.image} alt={p.name_en} className="w-full h-full object-cover transition-transform duration-[1.2s] ease-luxury group-hover:scale-[1.07]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-3 start-3 flex gap-2">
          {p.is_popular && <span className="chip !border-gold-400/40 !text-gold-300 bg-ink-950/70"><Sparkles size={10} />{t('menu.popular')}</span>}
          {p.is_new && <span className="chip !border-wine-400/40 !text-wine-400 bg-ink-950/70">{t('menu.new')}</span>}
        </div>
        <div className="absolute top-3 end-3 flex gap-2">
          {p.is_vegetarian && <span className="chip bg-ink-950/70" title={t('menu.vegetarian')}><Leaf size={10} className="text-emerald-400" /></span>}
          {p.is_spicy && <span className="chip bg-ink-950/70" title={t('menu.spicy')}><Flame size={10} className="text-wine-400" /></span>}
        </div>
        {!p.is_available && (
          <div className="absolute inset-0 bg-ink-950/70 grid place-items-center">
            <span className="chip !text-cream-50/80">{t('dish.unavailable')}</span>
          </div>
        )}
      </Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/dish/${p.slug}`} className="min-w-0">
            <h3 className="font-display text-xl leading-tight truncate group-hover:text-gold-300 transition-colors">{loc === 'ar' ? p.name_ar : p.name_en}</h3>
            <p className="text-cream-50/40 text-xs mt-1 line-clamp-2 leading-relaxed">{loc === 'ar' ? p.description_ar : p.description_en}</p>
          </Link>
          <button onClick={toggleFav} aria-label={t('dish.favorite')} className="shrink-0 mt-1">
            <Heart size={16} className={fav ? 'fill-wine-500 text-wine-500' : 'text-cream-50/40 hover:text-wine-400'} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-gold-400 font-medium tabular-nums">{formatEGP(parseFloat(p.price), loc)}</span>
            {parseFloat(p.rating) > 0 && (
              <span className="ms-3 text-[11px] text-cream-50/50 inline-flex items-center gap-1">
                <Star size={10} className="fill-gold-400 text-gold-400" />{p.rating}<span className="text-cream-50/30">({p.rating_count})</span>
              </span>
            )}
          </div>
          <button onClick={quickAdd} disabled={!p.is_available}
            className={`w-9 h-9 grid place-items-center border transition-all duration-300 ${added ? 'bg-gold-400 border-gold-400 text-ink-950' : 'border-gold-400/50 text-gold-400 hover:bg-gold-400 hover:text-ink-950'} disabled:opacity-30 disabled:cursor-not-allowed`}
            aria-label={t('dish.addToCart')}>
            <Plus size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

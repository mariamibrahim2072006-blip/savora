import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, Minus, Plus, Heart, ChevronRight, Flame, Leaf, Sparkles } from 'lucide-react';
import { api, formatEGP } from '../lib/api';
import DishCard, { Product, DishImage } from '../components/DishCard';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { useUi } from '../store/ui';

type Size = { id: string; label_en: string; label_ar: string; price_delta: string; sort: number };
type Addon = { id: string; name_en: string; name_ar: string; price: string };
type Review = { id: string; rating: number; comment: string | null; created_at: string; name: string };

export default function Dish() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [dish, setDish] = useState<Product | null>(null);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Partial<Product>[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [instructions, setInstructions] = useState('');
  const [tab, setTab] = useState<'desc' | 'ing' | 'rev'>('desc');
  const [fav, setFav] = useState(false);
  const [added, setAdded] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [revName, setRevName] = useState('');
  const [revMsg, setRevMsg] = useState('');
  const add = useCart((s) => s.add);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const { user } = useAuth();

  const load = () => {
    api.get(`/products/${slug}`).then((r) => {
      setDish(r.data.product);
      setSizes(r.data.sizes || []);
      setAddons(r.data.addons || []);
      setReviews(r.data.reviews || []);
      setRelated(r.data.related || []);
      setSizeId(r.data.sizes?.[0]?.id ?? null);
    }).catch(() => setNotFound(true));
  };
  useEffect(() => { setDish(null); setNotFound(false); setPicked(new Set()); setQty(1); setInstructions(''); setRevMsg(''); load(); window.scrollTo(0, 0); }, [slug]);
  useEffect(() => {
    if (!user || !dish) { setFav(false); return; }
    api.get('/favorites').then((r) => setFav((r.data.favorites || []).some((f: Product) => f.id === dish.id))).catch(() => {});
  }, [user, dish?.id]);

  const size = sizes.find((s) => s.id === sizeId) || null;
  const unit = useMemo(() => {
    if (!dish) return 0;
    return parseFloat(dish.price) + (size ? parseFloat(size.price_delta) : 0) + addons.filter((a) => picked.has(a.id)).reduce((s, a) => s + parseFloat(a.price), 0);
  }, [dish, size, picked, addons]);

  const toggleFav = async () => {
    if (!user || !dish) return;
    try {
      if (fav) { await api.delete(`/favorites/${dish.id}`); setFav(false); }
      else { await api.post(`/favorites/${dish.id}`); setFav(true); }
    } catch { /* ignore */ }
  };

  const submitReview = async () => {
    if (!dish) return;
    try {
      await api.post(`/products/${dish.id}/reviews`, { rating, comment: comment || undefined, name: user ? undefined : revName || undefined });
      setRevMsg(t('dish.reviewThanks')); setComment(''); setRevName(''); load();
    } catch { setRevMsg(t('toast.err')); }
  };

  if (notFound) return (
    <div className="min-h-screen pt-40 text-center">
      <p className="font-display italic text-3xl text-cream-50/50">{t('notFound.title')}</p>
      <Link to="/menu" className="btn-lux mt-8 inline-block"><span>{t('dish.backToMenu')}</span></Link>
    </div>
  );
  if (!dish) return <div className="min-h-screen pt-40 text-center text-gold-400 font-display italic text-3xl animate-pulse">SAVORA</div>;

  const ing = (dish.ingredients as any) || [];

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cream-50/40 mb-8 flex-wrap">
          <Link to="/menu" className="hover:text-gold-300 transition-colors">{t('menu.title')}</Link>
          <ChevronRight size={12} className="rtl:-scale-x-100" />
          <Link to={`/menu?cat=${dish.category_slug}`} className="hover:text-gold-300 transition-colors">{loc === 'ar' ? dish.category_ar : dish.category_en}</Link>
          <ChevronRight size={12} className="rtl:-scale-x-100" />
          <span className="text-gold-300">{loc === 'ar' ? dish.name_ar : dish.name_en}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative">
            <div className="aspect-square overflow-hidden relative">
              <DishImage src={dish.image} alt={dish.name_en} className="w-full h-full object-cover" />
              <div className="absolute inset-0 border border-cream-50/10 pointer-events-none" />
            </div>
            <div className="absolute top-4 start-4 flex flex-col gap-2">
              {dish.is_popular && <span className="bg-gold-400 text-ink-950 text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 flex items-center gap-1"><Sparkles size={10} />{t('menu.popular')}</span>}
              {dish.is_new && <span className="bg-wine-500 text-cream-50 text-[10px] tracking-[0.2em] uppercase px-3 py-1.5">{t('menu.new')}</span>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
            <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-cream-50/50">
              <span>{loc === 'ar' ? dish.category_ar : dish.category_en}</span>
              {!!dish.calories && <span className="text-cream-50/35">{dish.calories} {t('dish.calories')}</span>}
              {dish.is_spicy && <span className="flex items-center gap-1 text-wine-400"><Flame size={11} />{t('menu.spicy')}</span>}
              {dish.is_vegetarian && <span className="flex items-center gap-1 text-emerald-400"><Leaf size={11} />{t('menu.vegetarian')}</span>}
            </div>
            <h1 className="headline text-4xl md:text-6xl mt-3">{loc === 'ar' ? dish.name_ar : dish.name_en}</h1>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={s <= Math.round(parseFloat(dish.rating)) ? 'fill-gold-400 text-gold-400' : 'text-cream-50/20'} />)}
              </div>
              <span className="text-cream-50/50 text-sm tabular-nums">{dish.rating} · {dish.rating_count} {t('dish.reviews')}</span>
            </div>

            <div className="flex gap-6 mt-8 border-b border-cream-50/10">
              {([['desc', t('dish.description')], ['ing', t('dish.ingredients')], ['rev', t('dish.reviews')]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)} className={`pb-3 text-[12px] uppercase tracking-[0.2em] transition-colors relative ${tab === k ? 'text-gold-300' : 'text-cream-50/45 hover:text-cream-50'}`}>
                  {label}
                  {tab === k && <motion.span layoutId="dish-tab" className="absolute bottom-0 inset-x-0 h-px bg-gold-400" />}
                </button>
              ))}
            </div>
            <div className="py-6 min-h-[120px] text-cream-50/65 leading-relaxed">
              {tab === 'desc' && <p>{loc === 'ar' ? dish.description_ar : dish.description_en}</p>}
              {tab === 'ing' && (
                ing.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {ing.map((x: { en: string; ar: string }, i: number) => (
                      <li key={i} className="chip !text-cream-50/70">{loc === 'ar' ? x.ar : x.en}</li>
                    ))}
                  </ul>
                ) : <p>{loc === 'ar' ? dish.description_ar : dish.description_en}</p>
              )}
              {tab === 'rev' && (
                <div className="flex flex-col gap-5">
                  {reviews.length === 0 && <p className="text-cream-50/35 italic font-display text-lg">{t('dish.noReviews')}</p>}
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-cream-50/10 pb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-gold-300 text-sm">{r.name}</span>
                        <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={10} className={s <= r.rating ? 'fill-gold-400 text-gold-400' : 'text-cream-50/20'} />)}</div>
                        <span className="text-cream-50/30 text-xs">{new Date(r.created_at).toLocaleDateString(loc === 'ar' ? 'ar-EG' : 'en-GB')}</span>
                      </div>
                      {r.comment && <p className="text-cream-50/60 text-sm mt-1.5">{r.comment}</p>}
                    </div>
                  ))}
                  <div className="card-lux p-5">
                    <span className="field-label">{t('dish.writeReview')}</span>
                    <div className="flex gap-1.5 my-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)} aria-label={`${s}`}><Star size={20} className={s <= rating ? 'fill-gold-400 text-gold-400' : 'text-cream-50/20 hover:text-gold-400'} /></button>
                      ))}
                    </div>
                    {!user && <input value={revName} onChange={(e) => setRevName(e.target.value)} placeholder={t('dish.yourName')} className="input-lux mb-3" />}
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('dish.yourReview')} rows={2} className="input-lux resize-none" />
                    <button onClick={submitReview} className="btn-gold mt-4 !px-8 !py-2.5 text-[11px]">{t('dish.submitReview')}</button>
                    {revMsg && <p className="text-gold-300 text-xs mt-3">{revMsg}</p>}
                  </div>
                </div>
              )}
            </div>

            {sizes.length > 0 && (
              <div className="mb-6">
                <span className="field-label">{t('dish.size')}</span>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button key={s.id} onClick={() => setSizeId(s.id)}
                      className={`px-5 py-2.5 border text-[12px] uppercase tracking-[0.15em] transition-all ${sizeId === s.id ? 'border-gold-400 text-gold-300 bg-gold-400/5' : 'border-cream-50/15 text-cream-50/55 hover:border-cream-50/40'}`}>
                      {loc === 'ar' ? s.label_ar : s.label_en}
                      {parseFloat(s.price_delta) !== 0 && <span className="ms-2 text-gold-400/70 tabular-nums">{parseFloat(s.price_delta) > 0 ? '+' : ''}{s.price_delta}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {addons.length > 0 && (
              <div className="mb-6">
                <span className="field-label">{t('dish.addons')}</span>
                <div className="flex flex-col divide-y divide-cream-50/10">
                  {addons.map((a) => {
                    const on = picked.has(a.id);
                    return (
                      <button key={a.id} onClick={() => { const n = new Set(picked); on ? n.delete(a.id) : n.add(a.id); setPicked(n); }}
                        className="flex items-center justify-between py-3 group text-start">
                        <span className="flex items-center gap-3">
                          <span className={`w-4 h-4 border transition-all grid place-items-center ${on ? 'border-gold-400 bg-gold-400' : 'border-cream-50/30 group-hover:border-gold-400/60'}`}>
                            {on && <Plus size={10} className="text-ink-950" />}
                          </span>
                          <span className={`text-sm transition-colors ${on ? 'text-cream-50' : 'text-cream-50/65'}`}>{loc === 'ar' ? a.name_ar : a.name_en}</span>
                        </span>
                        {parseFloat(a.price) > 0 && <span className="text-gold-400/80 text-xs tabular-nums">+{formatEGP(parseFloat(a.price), loc)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-8">
              <span className="field-label">{t('dish.instructions')}</span>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder={t('dish.instructionsPh')} rows={2} className="input-lux resize-none" maxLength={300} />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center border border-cream-50/20">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-12 hover:text-gold-300 transition-colors" aria-label="-"><Minus size={14} className="inline" /></button>
                <span className="w-10 text-center tabular-nums font-medium">{qty}</span>
                <button onClick={() => setQty(Math.min(20, qty + 1))} className="w-11 h-12 hover:text-gold-300 transition-colors" aria-label="+"><Plus size={14} className="inline" /></button>
              </div>
              <button
                disabled={!dish.is_available}
                onClick={() => {
                  add({
                    product_id: dish.id, slug: dish.slug, name: { en: dish.name_en, ar: dish.name_ar }, image: dish.image,
                    base_price: parseFloat(dish.price),
                    size: size ? { id: size.id, en: size.label_en, ar: size.label_ar, delta: parseFloat(size.price_delta) } : null,
                    addons: addons.filter((a) => picked.has(a.id)).map((a) => ({ id: a.id, en: a.name_en, ar: a.name_ar, price: parseFloat(a.price) })),
                    quantity: qty, instructions: instructions || null,
                  });
                  setAdded(true); setTimeout(() => setAdded(false), 1500); setCartOpen(true);
                }}
                className="btn-gold flex-1 min-w-[220px] justify-center disabled:opacity-40 disabled:pointer-events-none">
                <span>{!dish.is_available ? t('dish.unavailable') : added ? t('dish.added') : `${t('dish.addToCart')} · ${formatEGP(unit * qty, loc)}`}</span>
              </button>
              <button onClick={toggleFav} disabled={!user} title={fav ? t('dish.favorited') : t('dish.favorite')}
                className={`w-12 h-12 border transition-all disabled:opacity-30 ${fav ? 'border-wine-400 text-wine-400' : 'border-cream-50/20 text-cream-50/60 hover:border-wine-400 hover:text-wine-400'}`}>
                <Heart size={16} className={`inline ${fav ? 'fill-wine-400' : ''}`} />
              </button>
            </div>
          </motion.div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="headline text-3xl md:text-4xl mb-10">{t('dish.related')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(related as Product[]).map((p, i) => <DishCard key={p.id} p={p} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

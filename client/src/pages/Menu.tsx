import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, SlidersHorizontal, Search, X, Star, Heart, Plus, Flame, Leaf, Sparkles } from 'lucide-react';
import { api, formatEGP } from '../lib/api';
import DishCard, { Product, DishImage } from '../components/DishCard';

type Category = { id: string; slug: string; name_en: string; name_ar: string; image: string };

export default function Menu() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [params, setParams] = useSearchParams();
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const cat = params.get('cat') || '';
  const search = params.get('q') || '';
  const min = params.get('min') || '';
  const max = params.get('max') || '';
  const diet = params.get('diet') || '';
  const spicy = params.get('spicy') || '';
  const popular = params.get('popular') || '';
  const isnew = params.get('new') || '';
  const sort = params.get('sort') || '';

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  useEffect(() => { api.get('/categories').then((r) => setCats(r.data.categories)).catch(() => {}); }, []);
  const mcats = cats.filter((c: any) => c.slug !== 'cold-drinks').map((c: any) => c.slug === 'hot-drinks' ? { ...c, id: 'drinks', slug: 'drinks', name_en: 'Drinks', name_ar: 'المشروبات' } : c);
  const effCat = cat || (search ? '' : (mcats[0]?.slug || ''));

  useEffect(() => {
    setLoading(true);
    Promise.all((effCat === 'drinks' ? ['hot-drinks', 'cold-drinks'] : [effCat]).map((slug) => api.get('/products', { params: { category: slug || undefined, search: search || undefined, min: min || undefined, max: max || undefined, diet: diet || undefined, spicy: spicy || undefined, popular: popular || undefined, isnew: isnew || undefined, sort: sort || undefined } })))
      .then((rs) => setProducts(rs.flatMap((r) => r.data.products)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [effCat, search, min, max, diet, spicy, popular, isnew, sort]);

  const activeFilters = [diet, spicy, popular, isnew, min, max].filter(Boolean).length;

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10">
        <p className="eyebrow">SAVORA</p>
        <h1 className="headline text-5xl md:text-7xl mt-4 mb-10">{t('menu.title')}</h1>

        {/* search + controls */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-0 text-cream-50/40" />
            <input value={search} onChange={(e) => setParam('q', e.target.value)} placeholder={t('menu.searchPh')}
              className="input-lux ps-7" />
          </div>
          <button onClick={() => setFiltersOpen(!filtersOpen)} className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] transition-colors ${filtersOpen || activeFilters ? 'text-gold-400' : 'text-cream-50/60 hover:text-cream-50'}`}>
            <SlidersHorizontal size={14} /> {t('menu.filters')} {activeFilters > 0 && `(${activeFilters})`}
          </button>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)}
            className="bg-transparent border-b border-cream-50/20 py-2 text-[12px] uppercase tracking-[0.15em] text-cream-50/70 focus:outline-none focus:border-gold-400 [&>option]:bg-ink-900">
            <option value="">{t('menu.sortPopular')}</option>
            <option value="price_asc">{t('menu.sortPriceAsc')}</option>
            <option value="price_desc">{t('menu.sortPriceDesc')}</option>
            <option value="rating">{t('menu.sortRating')}</option>
            <option value="newest">{t('menu.sortNewest')}</option>
          </select>
          <div className="flex border border-cream-50/15 ms-auto">
            <button onClick={() => setLayout('grid')} className={`p-2.5 ${layout === 'grid' ? 'text-gold-400' : 'text-cream-50/40'}`} aria-label={t('menu.grid')}><LayoutGrid size={15} /></button>
            <button onClick={() => setLayout('list')} className={`p-2.5 ${layout === 'list' ? 'text-gold-400' : 'text-cream-50/40'}`} aria-label={t('menu.list')}><List size={15} /></button>
          </div>
        </div>

        {/* filter panel */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="card-lux p-6 mb-8 grid grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <span className="field-label">{t('menu.price')}</span>
                  <div className="flex gap-2 items-center">
                    <input value={min} onChange={(e) => setParam('min', e.target.value)} placeholder={t('menu.min')} inputMode="numeric" className="input-lux !py-2 w-20" />
                    <span className="text-cream-50/30">—</span>
                    <input value={max} onChange={(e) => setParam('max', e.target.value)} placeholder={t('menu.max')} inputMode="numeric" className="input-lux !py-2 w-20" />
                  </div>
                </div>
                {[
                  ['diet', 'vegetarian', t('menu.vegetarian')],
                  ['spicy', 'true', t('menu.spicy')],
                  ['popular', 'true', t('menu.popular')],
                  ['new', 'true', t('menu.new')],
                ].map(([k, v, label]) => (
                  <button key={k} onClick={() => setParam(k, params.get(k) === v ? '' : v)}
                    className={`self-end pb-2 text-start text-[12px] uppercase tracking-[0.15em] transition-colors ${params.get(k) === v ? 'text-gold-400 border-b border-gold-400' : 'text-cream-50/50 border-b border-cream-50/15 hover:text-cream-50'}`}>
                    {label}
                  </button>
                ))}
                {activeFilters > 0 && (
                  <button onClick={() => { ['diet', 'spicy', 'popular', 'new', 'min', 'max'].forEach((k) => setParam(k, '')); }}
                    className="self-end pb-2 text-start text-[12px] uppercase tracking-[0.15em] text-wine-400 flex items-center gap-1">
                    <X size={12} /> {t('menu.clear')}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-10">
          {/* category rail */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-28 flex flex-col gap-1">
              {mcats.map((c: any) => (
                <CatLink key={c.id} active={effCat === c.slug} onClick={() => setParam('cat', c.slug)} label={loc === 'ar' ? c.name_ar : c.name_en} />
              ))}
            </div>
          </aside>
          {/* mobile categories */}
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-[800] bg-ink-950/95 backdrop-blur border-t border-cream-50/10 overflow-x-auto">
            <div className="flex gap-1 px-3 py-2 w-max">
              {mcats.map((c: any) => <MobileCat key={c.id} active={effCat === c.slug} onClick={() => setParam('cat', c.slug)} label={loc === 'ar' ? c.name_ar : c.name_en} />)}
            </div>
          </div>

          {/* products */}
          <div className="flex-1 pb-20 lg:pb-0">
            {loading ? (
              <div className={`grid gap-5 ${layout === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card-lux aspect-[4/5] animate-pulse" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24">
                <p className="font-display text-3xl italic text-cream-50/40">{t('menu.empty')}</p>
                <button onClick={() => setParams(new URLSearchParams())} className="btn-lux mt-8"><span>{t('menu.clear')}</span></button>
              </div>
            ) : layout === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {products.map((p, i) => <DishCard key={p.id} p={p} index={i} />)}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-cream-50/8">
                {products.map((p, i) => <ListRow key={p.id} p={p} index={i} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CatLink({ active, onClick, label }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button onClick={onClick}
      className={`group flex items-center justify-between py-2.5 border-b text-start transition-all duration-300 ${active ? 'border-gold-400 text-gold-300' : 'border-cream-50/10 text-cream-50/55 hover:text-cream-50'}`}>
      <span className="text-[13px] uppercase tracking-[0.18em]">{label}</span>
      <span className={`h-px transition-all duration-500 ${active ? 'w-8 bg-gold-400' : 'w-0 bg-cream-50/30 group-hover:w-4'}`} />
    </button>
  );
}
function MobileCat({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-[11px] uppercase tracking-[0.15em] whitespace-nowrap border transition-colors ${active ? 'border-gold-400 text-gold-300' : 'border-cream-50/15 text-cream-50/60'}`}>
      {label}
    </button>
  );
}

function ListRow({ p, index }: { p: Product; index: number }) {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
      <Link to={`/dish/${p.slug}`} className="group flex items-center gap-5 py-5">
        <div className="w-24 h-24 md:w-28 md:h-28 overflow-hidden shrink-0">
          <DishImage src={p.image} alt={p.name_en} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-xl md:text-2xl group-hover:text-gold-300 transition-colors truncate">{loc === 'ar' ? p.name_ar : p.name_en}</h3>
            {p.is_popular && <Sparkles size={13} className="text-gold-400 shrink-0" />}
            {p.is_spicy && <Flame size={13} className="text-wine-400 shrink-0" />}
            {p.is_vegetarian && <Leaf size={13} className="text-emerald-400 shrink-0" />}
          </div>
          <p className="text-cream-50/40 text-sm mt-1 line-clamp-1">{loc === 'ar' ? p.description_ar : p.description_en}</p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-cream-50/40">
            <span className="uppercase tracking-[0.15em]">{loc === 'ar' ? p.category_ar : p.category_en}</span>
            {parseFloat(p.rating) > 0 && <span className="flex items-center gap-1"><Star size={10} className="fill-gold-400 text-gold-400" />{p.rating}</span>}
          </div>
        </div>
        <div className="text-end shrink-0">
          <div className="text-gold-400 font-medium tabular-nums">{formatEGP(parseFloat(p.price), loc)}</div>
          <span className="inline-block mt-2 w-8 h-8 border border-gold-400/40 text-gold-400 place-items-center group-hover:bg-gold-400 group-hover:text-ink-950 transition-all"><Plus size={14} className="inline" /></span>
        </div>
      </Link>
    </motion.div>
  );
}

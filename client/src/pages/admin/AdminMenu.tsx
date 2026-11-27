import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Upload, Check } from 'lucide-react';
import { api, formatEGP } from '../../lib/api';
import { Product, DishImage } from '../../components/DishCard';

type Cat = { id: string; slug: string; name_en: string; name_ar: string };
const emptyDish: any = { category_id: '', name_en: '', name_ar: '', description_en: '', description_ar: '', price: '', calories: '', is_vegetarian: false, is_spicy: false, is_popular: false, is_new: false, is_available: true, ingredients: [], sizes: [], addons: [] };

export default function AdminMenu() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState<any | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    api.get('/products').then((r) => setProducts(r.data.products)).catch(() => {});
    api.get('/categories').then((r) => setCats(r.data.categories)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openEdit = async (p: Product) => {
    const { data } = await api.get(`/products/${p.slug}`);
    setEditId(p.id);
    setForm({
      category_id: data.product.category_id, name_en: data.product.name_en, name_ar: data.product.name_ar,
      description_en: data.product.description_en, description_ar: data.product.description_ar,
      price: String(parseFloat(data.product.price)), calories: data.product.calories ? String(data.product.calories) : '',
      is_vegetarian: data.product.is_vegetarian, is_spicy: data.product.is_spicy, is_popular: data.product.is_popular, is_new: data.product.is_new, is_available: data.product.is_available,
      ingredients: data.product.ingredients || [],
      sizes: (data.sizes || []).map((s: any) => ({ label_en: s.label_en, label_ar: s.label_ar, price_delta: parseFloat(s.price_delta) })),
      addons: (data.addons || []).map((a: any) => ({ name_en: a.name_en, name_ar: a.name_ar, price: parseFloat(a.price) })),
    });
  };

  const save = async () => {
    const body = { ...form, price: parseFloat(form.price), calories: form.calories ? parseInt(form.calories) : null };
    try {
      if (editId) await api.put(`/admin/products/${editId}`, body);
      else { const { data } = await api.post('/admin/products', body); setEditId(data.product.id); }
      setMsg(t('admin.dishSaved')); setTimeout(() => setMsg(''), 2500);
      load();
    } catch (e: any) { setMsg(e?.response?.data?.error || t('common.error')); }
  };

  const uploadImg = async (file: File) => {
    if (!editId) return;
    const fd = new FormData();
    fd.append('image', file);
    await api.post(`/admin/products/${editId}/image`, fd).catch(() => {});
    load(); setMsg(t('admin.dishSaved')); setTimeout(() => setMsg(''), 2500);
  };

  const del = async (id: string) => {
    await api.delete(`/admin/products/${id}`).catch(() => {});
    setConfirmDel(null); load();
  };

  const setList = (k: 'ingredients' | 'sizes' | 'addons', v: any[]) => setForm({ ...form, [k]: v });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-cream-50/40 text-sm tabular-nums">{products.length}</p>
        <button onClick={() => { setEditId(null); setForm({ ...emptyDish, category_id: cats[0]?.id || '' }); }} className="btn-gold !px-6 !py-2.5 text-[11px]"><span className="flex items-center gap-2"><Plus size={13} />{t('admin.addDish')}</span></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => (
          <div key={p.id} className="card-lux overflow-hidden group">
            <div className="aspect-[4/3] overflow-hidden relative">
              <DishImage src={p.image} alt={p.name_en} className="w-full h-full object-cover" />
              {!p.is_available && <span className="absolute top-2 start-2 chip bg-ink-950/80 !text-wine-400">{t('admin.unavailable')}</span>}
            </div>
            <div className="p-4">
              <p className="font-display text-lg truncate">{loc === 'ar' ? p.name_ar : p.name_en}</p>
              <p className="text-cream-50/40 text-xs mt-0.5">{loc === 'ar' ? p.category_ar : p.category_en} · <span className="text-gold-400 tabular-nums">{formatEGP(parseFloat(p.price), loc)}</span></p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(p)} className="flex-1 border border-cream-50/15 py-2 text-[11px] uppercase tracking-[0.15em] text-cream-50/60 hover:border-gold-400 hover:text-gold-300 transition-colors flex items-center justify-center gap-1.5"><Pencil size={11} />{t('admin.editDish')}</button>
                <button onClick={() => setConfirmDel(p.id)} className="w-9 border border-cream-50/15 text-cream-50/50 hover:border-wine-400 hover:text-wine-400 transition-colors" aria-label={t('admin.deleteDish')}><Trash2 size={12} className="inline" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* delete confirm */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[950] bg-ink-950/70 backdrop-blur-sm grid place-items-center p-6" onClick={() => setConfirmDel(null)}>
            <div className="card-lux p-8 max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-cream-50/80">{t('admin.confirmDelete')}</p>
              <div className="flex gap-3 mt-6 justify-center">
                <button onClick={() => del(confirmDel)} className="px-6 py-2.5 bg-wine-500 text-cream-50 text-[11px] uppercase tracking-[0.2em]">{t('admin.confirm')}</button>
                <button onClick={() => setConfirmDel(null)} className="btn-lux !px-6 !py-2.5 text-[11px]"><span>{t('admin.cancel')}</span></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* edit modal */}
      <AnimatePresence>
        {form && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[950] bg-ink-950/70 backdrop-blur-sm overflow-y-auto" onClick={() => setForm(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="max-w-3xl mx-auto my-10 bg-ink-900 border border-cream-50/10 p-7 md:p-9" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-7">
                <h3 className="font-display text-2xl">{editId ? t('admin.editDish') : t('admin.addDish')}</h3>
                <button onClick={() => setForm(null)} aria-label={t('common.close')}><X size={18} className="text-cream-50/40 hover:text-cream-50" /></button>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div><span className="field-label">{t('admin.nameEn')}</span><input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="input-lux" dir="ltr" /></div>
                <div><span className="field-label">{t('admin.nameAr')}</span><input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="input-lux" dir="rtl" /></div>
                <div><span className="field-label">{t('admin.descEn')}</span><textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} rows={2} className="input-lux resize-none" dir="ltr" /></div>
                <div><span className="field-label">{t('admin.descAr')}</span><textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={2} className="input-lux resize-none" dir="rtl" /></div>
                <div><span className="field-label">{t('admin.price')}</span><input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} inputMode="decimal" className="input-lux" dir="ltr" /></div>
                <div><span className="field-label">{t('dish.calories')}</span><input value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} inputMode="numeric" className="input-lux" dir="ltr" /></div>
                <div>
                  <span className="field-label">{t('admin.category')}</span>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-lux w-full bg-transparent [&>option]:bg-ink-900 !py-2.5">
                    {cats.map((c) => <option key={c.id} value={c.id}>{loc === 'ar' ? c.name_ar : c.name_en}</option>)}
                  </select>
                </div>
                <div>
                  <span className="field-label">{t('admin.flags')}</span>
                  <div className="flex flex-wrap gap-2">
                    {(['is_vegetarian', 'is_spicy', 'is_popular', 'is_new', 'is_available'] as const).map((f) => (
                      <button key={f} onClick={() => setForm({ ...form, [f]: !form[f] })}
                        className={`chip transition-all ${form[f] ? '!border-gold-400 !text-gold-300 bg-gold-400/5' : 'text-cream-50/40'}`}>
                        {f === 'is_vegetarian' ? t('menu.vegetarian') : f === 'is_spicy' ? t('menu.spicy') : f === 'is_popular' ? t('menu.popular') : f === 'is_new' ? t('menu.new') : t('admin.available')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ingredients */}
              <div className="mt-7">
                <div className="flex justify-between items-center mb-3">
                  <span className="field-label !mb-0">{t('admin.ingredients')}</span>
                  <button onClick={() => setList('ingredients', [...form.ingredients, { en: '', ar: '' }])} className="text-[11px] uppercase tracking-[0.15em] text-gold-300 flex items-center gap-1"><Plus size={11} />{t('admin.addIngredient')}</button>
                </div>
                {form.ingredients.map((ing: any, i: number) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 mb-2">
                    <input value={ing.en} onChange={(e) => { const v = [...form.ingredients]; v[i] = { ...v[i], en: e.target.value }; setList('ingredients', v); }} placeholder={t('admin.ingredientEn')} className="input-lux !py-2" dir="ltr" />
                    <input value={ing.ar} onChange={(e) => { const v = [...form.ingredients]; v[i] = { ...v[i], ar: e.target.value }; setList('ingredients', v); }} placeholder={t('admin.ingredientAr')} className="input-lux !py-2" dir="rtl" />
                    <button onClick={() => setList('ingredients', form.ingredients.filter((_: any, j: number) => j !== i))} className="text-cream-50/30 hover:text-wine-400" aria-label={t('cart.remove')}><X size={14} /></button>
                  </div>
                ))}
              </div>

              {/* sizes */}
              <div className="mt-7">
                <div className="flex justify-between items-center mb-3">
                  <span className="field-label !mb-0">{t('admin.sizes')}</span>
                  <button onClick={() => setList('sizes', [...form.sizes, { label_en: '', label_ar: '', price_delta: 0 }])} className="text-[11px] uppercase tracking-[0.15em] text-gold-300 flex items-center gap-1"><Plus size={11} />{t('admin.addSize')}</button>
                </div>
                {form.sizes.map((s: any, i: number) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_100px_auto] gap-3 mb-2">
                    <input value={s.label_en} onChange={(e) => { const v = [...form.sizes]; v[i] = { ...v[i], label_en: e.target.value }; setList('sizes', v); }} placeholder={t('admin.labelEn')} className="input-lux !py-2" dir="ltr" />
                    <input value={s.label_ar} onChange={(e) => { const v = [...form.sizes]; v[i] = { ...v[i], label_ar: e.target.value }; setList('sizes', v); }} placeholder={t('admin.labelAr')} className="input-lux !py-2" dir="rtl" />
                    <input value={s.price_delta} onChange={(e) => { const v = [...form.sizes]; v[i] = { ...v[i], price_delta: parseFloat(e.target.value) || 0 }; setList('sizes', v); }} placeholder={t('admin.priceDelta')} inputMode="decimal" className="input-lux !py-2" dir="ltr" />
                    <button onClick={() => setList('sizes', form.sizes.filter((_: any, j: number) => j !== i))} className="text-cream-50/30 hover:text-wine-400" aria-label={t('cart.remove')}><X size={14} /></button>
                  </div>
                ))}
              </div>

              {/* addons */}
              <div className="mt-7">
                <div className="flex justify-between items-center mb-3">
                  <span className="field-label !mb-0">{t('admin.addons')}</span>
                  <button onClick={() => setList('addons', [...form.addons, { name_en: '', name_ar: '', price: 0 }])} className="text-[11px] uppercase tracking-[0.15em] text-gold-300 flex items-center gap-1"><Plus size={11} />{t('admin.addAddon')}</button>
                </div>
                {form.addons.map((a: any, i: number) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_100px_auto] gap-3 mb-2">
                    <input value={a.name_en} onChange={(e) => { const v = [...form.addons]; v[i] = { ...v[i], name_en: e.target.value }; setList('addons', v); }} placeholder={t('admin.nameEn')} className="input-lux !py-2" dir="ltr" />
                    <input value={a.name_ar} onChange={(e) => { const v = [...form.addons]; v[i] = { ...v[i], name_ar: e.target.value }; setList('addons', v); }} placeholder={t('admin.nameAr')} className="input-lux !py-2" dir="rtl" />
                    <input value={a.price} onChange={(e) => { const v = [...form.addons]; v[i] = { ...v[i], price: parseFloat(e.target.value) || 0 }; setList('addons', v); }} placeholder={t('admin.addonPrice')} inputMode="decimal" className="input-lux !py-2" dir="ltr" />
                    <button onClick={() => setList('addons', form.addons.filter((_: any, j: number) => j !== i))} className="text-cream-50/30 hover:text-wine-400" aria-label={t('cart.remove')}><X size={14} /></button>
                  </div>
                ))}
              </div>

              {/* image */}
              {editId && (
                <div className="mt-7">
                  <span className="field-label">{t('admin.image')}</span>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImg(e.target.files[0])} />
                  <button onClick={() => fileRef.current?.click()} className="btn-lux !px-6 !py-2.5 text-[11px]"><span className="flex items-center gap-2"><Upload size={12} />{t('admin.uploadImage')}</span></button>
                </div>
              )}

              <div className="flex items-center gap-4 mt-8">
                <button onClick={save} className="btn-gold !px-10"><span className="flex items-center gap-2"><Check size={13} />{t('admin.save')}</span></button>
                {msg && <span className="text-gold-300 text-xs">{msg}</span>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDown, Star, Leaf, Truck, ChefHat, Gem } from 'lucide-react';
import { api } from '../lib/api';
import DishCard, { Product, DishImage } from '../components/DishCard';
import { gsap, ScrollTrigger, reducedMotion, isTouch } from '../lib/motion';
import Embers from '../components/Embers';

export default function Home() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [best, setBest] = useState<Product[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    api.get('/products', { params: { popular: 'true' } }).then((r) => setBest(r.data.products.slice(0, 8))).catch(() => {});
    api.get('/categories').then((r) => setCats(r.data.categories)).catch(() => {});
    api.get('/settings/public').then((r) => setOffers(r.data.settings?.offers || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (reducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-char', { yPercent: 120 }, { yPercent: 0, duration: 1.1, stagger: 0.03, ease: 'power4.out', delay: 1.6 });
      gsap.to('.hero-bg', {
        yPercent: 18, ease: 'none',
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero-dish', {
        yPercent: -30, rotate: 8, ease: 'none',
        scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.utils.toArray<HTMLElement>('.reveal-up').forEach((el) => {
        gsap.fromTo(el, { y: 60, opacity: 0, clipPath: 'inset(0 0 30% 0)' },
          { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%' } });
      });
      gsap.utils.toArray<HTMLElement>('.sig-img').forEach((el) => {
        gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power4.inOut',
          scrollTrigger: { trigger: el, start: 'top 80%' } });
      });
    }, heroRef);
    return () => ctx.revert();
  }, [loc]);

  const chars = (s: string) => s.split('').map((c, i) => (
    <span key={i} className="inline-block overflow-hidden align-bottom"><span className="hero-char inline-block">{c === ' ' ? ' ' : c}</span></span>
  ));

  return (
    <div>
      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative min-h-[100svh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/site/hero-main.webp" alt="" className="hero-bg w-full h-[115%] object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/40 to-ink-950" />
          <Embers className="absolute inset-0 z-[4] opacity-70 pointer-events-none" />
        </div>
        <div className="relative z-10 max-w-[1500px] mx-auto px-5 md:px-10 w-full pt-24">
          <p className="eyebrow mb-6">{t('sections.featured')} — Cairo</p>
          <h1 ref={titleRef} className="headline text-[13vw] md:text-[8.5vw] text-cream-50">
            <span className="block">{chars(t('hero.headline1'))}</span>
            <span className="block italic text-gold-300">{chars(t('hero.headline2'))}</span>
          </h1>
          <p className="mt-8 max-w-md text-cream-50/60 font-light leading-relaxed">{t('hero.intro')}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/menu" className="btn-solid"><span>{t('nav.orderNow')}</span></Link>
            <Link to="/menu" className="btn-lux"><span>{t('hero.explore')}</span></Link>
          </div>
        </div>
        {!isTouch() && (
          <div className="hero-dish hidden lg:block absolute -bottom-10 end-[6%] w-[30vw] max-w-[480px] z-[5] animate-floaty">
            <img src="/images/site/dish-3d.webp" alt="SAVORA signature burger" className="w-full drop-shadow-[0_60px_80px_rgba(0,0,0,0.8)]" style={{ mixBlendMode: 'screen' }} />
          </div>
        )}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream-50/40">
          <span className="text-[10px] uppercase tracking-mega">{t('hero.scroll')}</span>
          <ArrowDown size={14} className="animate-bounce" />
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="border-y border-cream-50/10 py-4 overflow-hidden bg-ink-950">
        <div className="animate-marquee flex whitespace-nowrap gap-12 w-max">
          {[0, 1].map((n) => (
            <div key={n} className="flex gap-12 items-center">
              {['Charcoal-fired', 'Farm-fresh daily', 'Wood-oven pizza', 'House-made pasta', 'Egyptian soul', '45-min delivery'].map((s) => (
                <span key={s} className="flex items-center gap-12 text-[12px] uppercase tracking-mega text-cream-50/35">
                  {s}<Star size={8} className="fill-gold-400/50 text-gold-400/50" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ============ CATEGORIES ============ */}
      <section className="max-w-[1500px] mx-auto px-5 md:px-10 py-24 md:py-32">
        <p className="eyebrow">{t('sections.categories')}</p>
        <div className="flex items-end justify-between mt-3 mb-12">
          <h2 className="headline text-4xl md:text-6xl reveal-up">{t('sections.categoriesSub')}</h2>
          <Link to="/menu" className="hidden md:inline-block link-underline text-[11px] uppercase tracking-mega text-gold-400">{t('common.seeAll')}</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {cats.slice(0, 8).map((c, i) => (
            <Link key={c.id} to={`/menu?cat=${c.slug}`}
              className={`group relative overflow-hidden card-lux ${i % 5 === 0 ? 'row-span-2 aspect-[3/4] md:aspect-auto' : 'aspect-[4/3]'}`}>
              <DishImage src={c.image || '/images/site/gallery-1.webp'} alt={c.name_en}
                className="absolute inset-0 w-full h-full object-cover opacity-70 transition-all duration-[1.4s] ease-luxury group-hover:scale-110 group-hover:opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-5">
                <h3 className="font-display text-xl md:text-2xl group-hover:text-gold-300 transition-colors">{loc === 'ar' ? c.name_ar : c.name_en}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============ BEST SELLERS ============ */}
      <section className="max-w-[1500px] mx-auto px-5 md:px-10 py-10 md:py-16">
        <p className="eyebrow">{t('sections.bestSellers')}</p>
        <div className="flex items-end justify-between mt-3 mb-12">
          <h2 className="headline text-4xl md:text-6xl reveal-up">{t('sections.bestSellersSub')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {best.map((p, i) => <DishCard key={p.id} p={p} index={i} />)}
        </div>
      </section>

      {/* ============ OFFERS ============ */}
      <section className="max-w-[1500px] mx-auto px-5 md:px-10 py-24 md:py-32">
        <p className="eyebrow">{t('sections.offers')}</p>
        <h2 className="headline text-4xl md:text-6xl mt-3 mb-12 reveal-up">{t('sections.offersSub')}</h2>
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {offers.map((o) => (
            <div key={o.id} className="group relative overflow-hidden card-lux aspect-[16/10] md:aspect-[16/9]">
              <DishImage src={o.image} alt={o.title_en} className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-[1.6s] ease-luxury group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 md:p-10">
                <span className="chip !border-wine-400/50 !text-wine-400 mb-4">{loc === 'ar' ? o.badge_ar : o.badge_en}</span>
                <h3 className="font-display text-3xl md:text-4xl italic">{loc === 'ar' ? o.title_ar : o.title_en}</h3>
                <p className="text-cream-50/60 mt-2 max-w-sm text-sm leading-relaxed">{loc === 'ar' ? o.body_ar : o.body_en}</p>
                <Link to="/menu" className="inline-block mt-5 link-underline text-[11px] uppercase tracking-mega text-gold-400">{t('nav.orderNow')}</Link>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ============ SIGNATURE ============ */}
      <section className="max-w-[1500px] mx-auto px-5 md:px-10 py-24 md:py-32">
        <p className="eyebrow">{t('sections.signature')}</p>
        <h2 className="headline text-4xl md:text-6xl mt-3 mb-16 reveal-up">{t('sections.signatureSub')}</h2>
        <div className="flex flex-col gap-20 md:gap-28">
          {[
            { img: '/images/site/signature-steak.webp', slug: 'ribeye-steak', en: 'The Ribeye, on fire', ar: 'الريب آي على النار', den: '300g ribeye over open flame, truffle butter, roasted garlic and rosemary potatoes.', dar: '٣٠٠ جرام ريب آي على نار مفتوحة، زبدة ترافل، ثوم مشوي وبطاطس بالروزماري.' },
            { img: '/images/site/signature-pasta.webp', slug: 'truffle-alfredo', en: 'Truffle Alfredo', ar: 'ألفريدو بالترافل', den: 'House-made fettuccine folded into cream, black truffle and aged parmesan.', dar: 'فيتوتشيني بيتية الصنع مع كريمة وترافل أسود وبارميزان معتق.' },
            { img: '/images/site/signature-dessert.webp', slug: 'chocolate-fondant', en: 'The Fondant', ar: 'الفوندان', den: 'Molten dark chocolate, Madagascar vanilla ice cream, cocoa soil.', dar: 'شوكولاتة داكنة سايحة، آيس كريم فانيليا مدغشقر، وتربة كاكاو.' },
          ].map((dish, i) => (
            <div key={dish.slug} className={`grid md:grid-cols-2 gap-10 md:gap-16 items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div className="sig-img overflow-hidden">
                <Link to={`/dish/${dish.slug}`}>
                  <img src={dish.img} alt={dish.en} loading="lazy" className="w-full aspect-[4/3] object-cover img-dark hover:scale-105 transition-transform duration-[1.4s] ease-luxury" />
                </Link>
              </div>
              <div className="reveal-up">
                <span className="font-display italic text-6xl md:text-7xl text-gold-400/25">0{i + 1}</span>
                <h3 className="headline text-3xl md:text-5xl mt-2">{loc === 'ar' ? dish.ar : dish.en}</h3>
                <p className="text-cream-50/55 leading-relaxed mt-4 max-w-md">{loc === 'ar' ? dish.dar : dish.den}</p>
                <Link to={`/dish/${dish.slug}`} className="inline-block mt-6 link-underline text-[11px] uppercase tracking-mega text-gold-400">{t('common.viewDish')}</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ STORY ============ */}
      <section className="relative py-24 md:py-40 overflow-hidden">
        <div className="max-w-[1500px] mx-auto px-5 md:px-10 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="relative">
            <div className="relative overflow-hidden aspect-[4/5]">
              <DishImage src="/images/site/story-interior.webp" alt="SAVORA dining room" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-10 -end-4 md:-end-10 w-1/2 overflow-hidden aspect-square border-8 border-ink-950">
              <DishImage src="/images/site/story-chef.webp" alt="Plating at the pass" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <p className="eyebrow">{t('sections.story')}</p>
            <h2 className="headline text-4xl md:text-6xl mt-3 mb-8">{t('pages.aboutTitle')}</h2>
            <p className="text-cream-50/60 leading-relaxed font-light text-lg">{t('story.p1')}</p>
            <p className="text-cream-50/60 leading-relaxed font-light text-lg mt-5">{t('story.p2')}</p>
            <div className="grid grid-cols-2 gap-8 mt-12">
              {[['38+', t('story.stat1')], ['12', t('story.stat2')], ['27', t('story.stat3')], ['4.9', t('story.stat4')]].map(([v, l]) => (
                <div key={l as string}>
                  <div className="font-display text-4xl md:text-5xl text-gold-300 tabular-nums">{v}</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-cream-50/40 mt-2">{l}</div>
                </div>
              ))}
            </div>
            <Link to="/about" className="btn-lux mt-12"><span>{t('nav.about')}</span></Link>
          </div>
        </div>
      </section>

      {/* ============ WHY US ============ */}
      <section className="max-w-[1500px] mx-auto px-5 md:px-10 py-24 md:py-32">
        <p className="eyebrow">{t('sections.why')}</p>
        <h2 className="headline text-4xl md:text-6xl mt-3 mb-16 reveal-up">{t('sections.whySub')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-cream-50/10">
          {[
            { icon: Leaf, title: t('why.fresh'), d: t('why.freshD') },
            { icon: ChefHat, title: t('why.chefs'), d: t('why.chefsD') },
            { icon: Truck, title: t('why.delivery'), d: t('why.deliveryD') },
            { icon: Gem, title: t('why.quality'), d: t('why.qualityD') },
          ].map(({ icon: Icon, title, d }, i) => (
            <div key={title} className="bg-ink-950 p-8 md:p-10 group hover:bg-ink-900 transition-colors duration-500">
              <span className="text-[10px] text-gold-400/50 tabular-nums">0{i + 1}</span>
              <Icon size={28} className="text-gold-400 mt-4 mb-6 transition-transform duration-500 group-hover:-translate-y-1" strokeWidth={1.2} />
              <h3 className="font-display text-2xl mb-3">{title}</h3>
              <p className="text-cream-50/50 text-sm leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ============ GALLERY STRIP ============ */}
      <section className="py-10 md:py-16 overflow-hidden">
        <div className="max-w-[1500px] mx-auto px-5 md:px-10 flex items-end justify-between mb-10">
          <div>
            <p className="eyebrow">{t('sections.gallery')}</p>
            <h2 className="headline text-4xl md:text-6xl mt-3 reveal-up">{t('sections.gallerySub')}</h2>
          </div>
          <Link to="/gallery" className="hidden md:inline-block link-underline text-[11px] uppercase tracking-mega text-gold-400">{t('common.seeAll')}</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 px-5 md:px-10 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <Link to="/gallery" key={n} className="shrink-0 snap-start group overflow-hidden">
              <img src={`/images/site/gallery-${n}.webp`} alt="" loading="lazy"
                className="h-56 md:h-72 w-auto aspect-[4/3] object-cover img-dark transition-transform duration-[1.2s] group-hover:scale-105" />
            </Link>
          ))}
        </div>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <NewsletterSection />
    </div>
  );
}

export function NewsletterSection() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try { await api.post('/newsletter', { email }); setDone(true); }
    catch (e: any) { setErr(e.message); }
  };
  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      <img src="/images/site/reservation-bg.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/70 to-ink-950" />
      <div className="relative max-w-2xl mx-auto px-5 text-center">
        <p className="eyebrow">{t('sections.newsletter')}</p>
        <h2 className="headline text-4xl md:text-6xl mt-4 mb-6">{t('sections.newsletterSub')}</h2>
        {done ? (
          <p className="text-gold-300 font-display italic text-2xl">{t('sections.subscribed')}</p>
        ) : (
          <form onSubmit={submit} className="mt-10 flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('sections.emailPh')} className="input-lux flex-1 text-center sm:text-start" />
            <button className="btn-lux shrink-0"><span>{t('sections.subscribe')}</span></button>
          </form>
        )}
        {err && <p className="text-wine-400 text-sm mt-4">{err}</p>}
      </div>
    </section>
  );
}

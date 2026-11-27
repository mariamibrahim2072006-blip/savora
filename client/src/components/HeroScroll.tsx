import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { gsap } from '../lib/motion';
import { api } from '../lib/api';

const LAYERS = [
  { src: '/images/site/1-burger-l1.webp', top: 8.13, ex: -150, rot: -6 },
  { src: '/images/site/2-burger-l2.webp', top: 31.98, ex: -60, rot: 5 },
  { src: '/images/site/3-burger-l3.webp', top: 49.52, ex: 50, rot: -4 },
  { src: '/images/site/4-burger-l4.webp', top: 68.66, ex: 150, rot: 4 },
];

export default function HeroScroll() {
  const { i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  const root = useRef<HTMLDivElement>(null);
  const [burger, setBurger] = useState<any>(null);
  const [pizza, setPizza] = useState<any>(null);

  useEffect(() => {
    api.get('/products', { params: { category: 'burgers' } }).then((r) => setBurger(r.data.products[0])).catch(() => {});
    api.get('/products', { params: { category: 'pizza' } }).then((r) => setPizza(r.data.products[0])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray<HTMLElement>('.hs-layer');
      layers.forEach((el, i) => gsap.set(el, { y: LAYERS[i].ex * 2.2, rotation: LAYERS[i].rot * 3, opacity: 0, scale: 0.92 }));
      gsap.set('.hs-flame', { opacity: 0 });
      gsap.set('.hs-pizza', { opacity: 0, scale: 0.55, rotation: -40 });
      gsap.set('.hs-t2', { opacity: 0, y: 30 });
      gsap.set('.hs-t1', { opacity: 0, y: 30 });
      gsap.to('.hs-flicker', { scaleY: 1.12, scaleX: 0.94, duration: 0.35, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=320%', pin: '.hs-stage', scrub: 0.7, anticipatePin: 1 },
      });
      layers.forEach((el, i) => tl.to(el, { y: 0, rotation: 0, opacity: 1, scale: 1, duration: 1.4, ease: 'power3.out' }, i * 0.35));
      tl.to('.hs-t1', { opacity: 1, y: 0, duration: 1 }, 2.2);
      tl.to('.hs-flame', { opacity: 1, duration: 1 }, 2.4);
      tl.to({}, { duration: 1.2 });
      tl.to('.hs-flame', { opacity: 0.25, duration: 0.8 }, 4.6);
      tl.to('.hs-burger', { scale: 0.6, opacity: 0, y: -80, rotation: 8, duration: 1.2, ease: 'power2.in' }, 5);
      tl.to('.hs-t1', { opacity: 0, y: -30, duration: 0.8 }, 5);
      tl.to('.hs-pizza', { opacity: 1, scale: 1, rotation: 0, duration: 1.6, ease: 'power3.out' }, 5.8);
      tl.to('.hs-t2', { opacity: 1, y: 0, duration: 1 }, 6.8);
      tl.to({}, { duration: 1 });
    }, root);
    return () => ctx.revert();
  }, [ar]);

  const money = (p: any) => (p ? `${Math.round(Number(p.price))} ${ar ? 'جنيه' : 'EGP'}` : '');
  const name = (p: any, fb: string) => (p ? (ar ? p.name_ar : p.name_en) : fb);

  return (
    <section ref={root} className="relative bg-ink-950">
      <div className="hs-stage relative h-[100svh] overflow-hidden flex items-center">
        <div className="absolute inset-0">
          <img src="/images/site/hero-main.webp" alt="" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/30 to-ink-950" />
        </div>
        <div className="relative z-10 w-full max-w-[1500px] mx-auto px-5 md:px-10 grid md:grid-cols-2 items-center gap-2 md:gap-10 h-full pt-20 pb-8">
          <div className="order-2 md:order-1 relative min-h-[150px] md:min-h-[320px] self-end md:self-center">
            <div className="hs-t1 absolute inset-x-0 top-0">
              <p className="eyebrow mb-3">{ar ? 'طبق التوقيع' : 'Signature dish'}</p>
              <h2 className="headline text-4xl md:text-7xl">{name(burger, 'Savora Signature Burger')}</h2>
              <p className="font-display text-2xl md:text-3xl text-gold-300 mt-3">{money(burger)}</p>
              <Link to={burger ? `/dish/${burger.slug}` : '/menu'} className="btn-solid mt-5"><span>{ar ? 'أضف للطلب' : 'Add to order'}</span></Link>
            </div>
            <div className="hs-t2 absolute inset-x-0 top-0">
              <p className="eyebrow mb-3">{ar ? 'من الفرن' : 'From the oven'}</p>
              <h2 className="headline text-4xl md:text-7xl">{name(pizza, 'Margherita')}</h2>
              <p className="font-display text-2xl md:text-3xl text-gold-300 mt-3">{money(pizza)}</p>
              <Link to={pizza ? `/dish/${pizza.slug}` : '/menu'} className="btn-solid mt-5"><span>{ar ? 'أضف للطلب' : 'Add to order'}</span></Link>
            </div>
          </div>
          <div className="order-1 md:order-2 relative flex items-center justify-center">
            <div className="relative w-[min(80vw,52svh)] md:w-[min(42vw,72svh)] aspect-square">
              <div className="hs-burger absolute inset-0">
                <div className="hs-flame absolute inset-x-[-10%] bottom-[-8%] h-[70%] pointer-events-none">
                  <div className="hs-flicker w-full h-full origin-bottom" style={{ background: 'radial-gradient(ellipse at 50% 80%, rgba(255,150,30,0.85), rgba(255,70,0,0.4) 40%, transparent 70%)', filter: 'blur(28px)' }} />
                </div>
                {LAYERS.map((l) => (
                  <img key={l.src} src={l.src} alt="" className="hs-layer absolute left-0 w-full h-auto will-change-transform" style={{ top: `${l.top}%` }} />
                ))}
              </div>
              <img src="/images/dishes/margherita.webp" alt="" className="hs-pizza absolute inset-0 w-full h-full object-cover"
                style={{ WebkitMaskImage: 'radial-gradient(ellipse at 50% 52%, #000 52%, transparent 74%)', maskImage: 'radial-gradient(ellipse at 50% 52%, #000 52%, transparent 74%)' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

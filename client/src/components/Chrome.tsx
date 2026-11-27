import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Heart, Search, User, Menu as MenuIcon, X, Globe, LogOut, Trash2, Minus, Plus } from 'lucide-react';
import { useUi } from '../store/ui';
import { useCart, lineTotal, unitPrice } from '../store/cart';
import { useAuth } from '../store/auth';
import { formatEGP } from '../lib/api';
import { isTouch, gsap } from '../lib/motion';

/* ================= PRELOADER ================= */
export function Preloader() {
  const [done, setDone] = useState(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('bare'));
  const [pct, setPct] = useState(0);
  const pathRef = useRef<SVGTextElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = performance.now();
    const dur = 1400;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setPct(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        const tl = gsap.timeline({ onComplete: () => setDone(true) });
        tl.to(wrapRef.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power4.inOut' });
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (done) return null;
  return (
    <div ref={wrapRef} className="fixed inset-0 z-[10000] bg-ink-950 flex flex-col items-center justify-center" style={{ clipPath: 'inset(0 0 0% 0)' }}>
      <svg width="280" height="80" viewBox="0 0 280 80" aria-hidden>
        <text ref={pathRef} x="50%" y="58%" textAnchor="middle" className="font-display" fontSize="52" fontStyle="italic"
          fill="none" stroke="#c9a155" strokeWidth="1" style={{ strokeDasharray: 600, strokeDashoffset: Math.max(0, 600 - pct * 6) }}>
          SAVORA
        </text>
      </svg>
      <div className="mt-6 w-56 h-px bg-cream-50/10 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-gold-400 transition-[width] duration-100" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 text-[11px] tracking-mega text-cream-50/40 tabular-nums">{pct}%</div>
    </div>
  );
}

/* ================= CURSOR ================= */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isTouch()) return;
    const dot = dotRef.current!, ring = ringRef.current!;
    let rx = 0, ry = 0, tx = 0, ty = 0, raf = 0;
    const move = (e: MouseEvent) => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate(${tx - 3}px, ${ty - 3}px)`;
      const target = e.target as HTMLElement;
      ring.classList.toggle('is-hover', !!target.closest('a, button, [role=button], input, select, textarea, label'));
    };
    const down = () => ring.classList.add('is-down');
    const up = () => ring.classList.remove('is-down');
    const loop = () => {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16;
      ring.style.transform = `translate(${rx - 18}px, ${ry - 18}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mousedown', down); window.removeEventListener('mouseup', up); cancelAnimationFrame(raf); };
  }, []);
  if (typeof window !== 'undefined' && isTouch()) return null;
  return (<><div ref={ringRef} className="cursor-ring" /><div ref={dotRef} className="cursor-dot" /></>);
}

/* ================= NAVBAR ================= */
const navKeys = ['home', 'menu', 'order', 'reservations', 'about', 'locations', 'contact'] as const;
const navHrefs: Record<string, string> = { home: '/', menu: '/menu', order: '/menu', reservations: '/reservations', about: '/about', locations: '/locations', contact: '/contact' };

export function Navbar() {
  const { t } = useTranslation();
  const { locale, setLocale, navOpen, setNavOpen, setCartOpen } = useUi();
  const count = useCart((s) => s.items.reduce((a, i) => a + i.quantity, 0));
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let last = window.scrollY;
    const on = () => { const y = window.scrollY; setScrolled(y > 40); if (y > last + 4 && y > 80) setHideNav(true); else if (y < last - 4 || y <= 80) setHideNav(false); last = y; };
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-[900] transition-all duration-300 ${hideNav ? '-translate-y-full' : ''} ${scrolled ? 'bg-ink-950/85 backdrop-blur-md border-b border-cream-50/5' : ''}`}>
        <div className="max-w-[1500px] mx-auto px-5 md:px-10 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button aria-label="Open menu" onClick={() => setNavOpen(true)} className="group flex items-center gap-3 text-cream-50/80 hover:text-cream-50">
              <span className="flex flex-col gap-1.5 w-6">
                <span className="h-px bg-current transition-all group-hover:w-3 w-6" />
                <span className="h-px bg-current w-6" />
                <span className="h-px bg-current transition-all group-hover:w-4 w-2" />
              </span>
              <span className="hidden md:block text-[11px] uppercase tracking-mega">{locale === 'ar' ? 'القائمة' : 'Menu'}</span>
            </button>
          </div>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 font-display italic text-xl md:text-[28px] tracking-wide text-cream-50">
            SAVORA<span className="text-gold-400 not-italic">.</span>
          </Link>
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')} className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-cream-50/70 hover:text-gold-400 transition-colors">
              <Globe size={14} /> <span className="hidden sm:inline">{t('common.langName')}</span>
            </button>
            <Link to="/track" className="hidden md:block"><Search size={18} className="text-cream-50/70 hover:text-gold-400 transition-colors" /></Link>
            <Link to="/account/favorites" aria-label={t('nav.wishlist')}><Heart size={18} className="text-cream-50/70 hover:text-gold-400 transition-colors" /></Link>
            <button onClick={() => setCartOpen(true)} className="relative" aria-label={t('nav.cart')}>
              <ShoppingBag size={18} className="text-cream-50/70 hover:text-gold-400 transition-colors" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-2 -end-2 w-4 h-4 rounded-full bg-wine-600 text-[9px] grid place-items-center text-cream-50">{count}</motion.span>
                )}
              </AnimatePresence>
            </button>
            {user ? (
              <Link to={user.role === 'admin' ? '/admin' : '/account'} className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full border border-gold-400/50 grid place-items-center text-[11px] text-gold-400 font-display italic">{user.name[0]}</span>
              </Link>
            ) : (
              <Link to="/auth"><User size={18} className="text-cream-50/70 hover:text-gold-400 transition-colors" /></Link>
            )}
            <Link to="/menu" className="!hidden lg:!inline-flex btn-lux !px-6 !py-2.5"><span>{t('nav.orderNow')}</span></Link>
          </div>
        </div>
      </header>

      <FullscreenNav open={navOpen} onClose={() => setNavOpen(false)} navigate={navigate} />
    </>
  );
}

function FullscreenNav({ open, onClose, navigate }: { open: boolean; onClose: () => void; navigate: (p: string) => void }) {
  const { t, i18n } = useTranslation();
  const [hovered, setHovered] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const imgs: Record<string, string> = {
    home: '/images/site/gallery-4.webp', menu: '/images/site/gallery-1.webp', order: '/images/site/offer-combo.webp',
    reservations: '/images/site/reservation-bg.webp', about: '/images/site/story-interior.webp',
    locations: '/images/site/gallery-8.webp', contact: '/images/site/gallery-6.webp',
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[950] bg-ink-950/98 backdrop-blur-sm flex" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="hidden md:block w-1/2 relative overflow-hidden">
            {Object.entries(imgs).map(([k, src]) => (
              <motion.img key={k} src={src} alt="" className="absolute inset-0 w-full h-full object-cover"
                initial={false} animate={{ opacity: hovered === k ? 1 : 0, scale: hovered === k ? 1 : 1.06 }} transition={{ duration: 0.6 }} />
            ))}
            <div className="absolute inset-0 bg-ink-950/30" />
          </div>
          <div className="flex-1 flex flex-col justify-center px-8 md:px-16 relative">
            <button onClick={onClose} aria-label="Close menu" className="absolute top-6 end-6 md:end-10 group">
              <X size={26} className="text-cream-50/70 group-hover:text-gold-400 transition-colors group-hover:rotate-90 duration-300" />
            </button>
            <nav className="flex flex-col gap-1 md:gap-2">
              {navKeys.map((k, i) => (
                <motion.div key={k} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                  <button
                    onMouseEnter={() => setHovered(k)} onMouseLeave={() => setHovered(null)}
                    onClick={() => { onClose(); navigate(navHrefs[k]); }}
                    className="group flex items-baseline gap-4 text-start">
                    <span className="text-[10px] text-gold-400/60 tabular-nums">0{i + 1}</span>
                    <span className="font-display text-4xl md:text-6xl text-cream-50/85 group-hover:text-gold-300 group-hover:italic transition-all duration-300 leading-[1.15]">
                      {t(`nav.${k}`)}
                    </span>
                  </button>
                </motion.div>
              ))}
            </nav>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/reservations" onClick={onClose} className="btn-lux"><span>{t('nav.reservations')}</span></Link>
              <Link to="/menu" onClick={onClose} className="btn-solid"><span>{t('nav.orderNow')}</span></Link>
              {user ? (
                <button onClick={() => { logout(); onClose(); }} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-cream-50/50 hover:text-cream-50">
                  <LogOut size={14} /> {t('nav.logout')}
                </button>
              ) : (
                <Link to="/auth" onClick={onClose} className="text-[11px] uppercase tracking-[0.2em] text-cream-50/50 hover:text-cream-50">{t('nav.login')}</Link>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================= CART DRAWER ================= */
export function CartDrawer() {
  const { t, i18n } = useTranslation();
  const { cartOpen, setCartOpen } = useUi();
  const { items, updateQty, remove, subtotal } = useCart();
  const navigate = useNavigate();
  const loc = i18n.language as 'en' | 'ar';
  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div className="fixed inset-0 z-[960] bg-ink-950/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} />
          <motion.aside className="fixed top-0 bottom-0 end-0 z-[970] w-full max-w-md bg-ink-900 border-s border-cream-50/10 flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ [document.documentElement.dir === 'rtl' ? 'left' : 'right']: 0 } as any}>
            <div className="flex items-center justify-between p-6 border-b border-cream-50/10">
              <h2 className="font-display text-2xl italic">{t('cart.title')}</h2>
              <button onClick={() => setCartOpen(false)} aria-label={t('common.close')}><X size={20} className="text-cream-50/60 hover:text-gold-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {items.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-cream-50/50 mb-2">{t('cart.empty')}</p>
                  <p className="text-cream-50/30 text-sm mb-6">{t('cart.emptyD')}</p>
                  <button className="btn-lux" onClick={() => { setCartOpen(false); navigate('/menu'); }}><span>{t('cart.browse')}</span></button>
                </div>
              )}
              {items.map((i) => (
                <motion.div layout key={i.key} className="flex gap-4">
                  <img src={i.image} alt={i.name[loc]} className="w-20 h-20 object-cover img-dark" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <Link to={`/dish/${i.slug}`} onClick={() => setCartOpen(false)} className="font-display text-lg leading-tight hover:text-gold-300 truncate">{i.name[loc]}</Link>
                      <button onClick={() => remove(i.key)} aria-label={t('cart.remove')}><Trash2 size={14} className="text-cream-50/40 hover:text-wine-400" /></button>
                    </div>
                    <p className="text-[11px] text-cream-50/40 mt-0.5">{i.size ? i.size[loc] : ''}{i.size && i.addons.length ? ' · ' : ''}{i.addons.map((a) => a[loc]).join(', ')}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-cream-50/15">
                        <button className="px-2 py-1" onClick={() => updateQty(i.key, i.quantity - 1)} aria-label="decrease"><Minus size={12} /></button>
                        <span className="w-6 text-center text-sm tabular-nums">{i.quantity}</span>
                        <button className="px-2 py-1" onClick={() => updateQty(i.key, i.quantity + 1)} aria-label="increase"><Plus size={12} /></button>
                      </div>
                      <span className="text-gold-400 text-sm tabular-nums">{formatEGP(lineTotal(i), loc)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {items.length > 0 && (
              <div className="p-6 border-t border-cream-50/10">
                <div className="flex justify-between mb-4 text-sm">
                  <span className="text-cream-50/60">{t('cart.subtotal')}</span>
                  <span className="text-gold-400 font-medium tabular-nums">{formatEGP(subtotal(), loc)}</span>
                </div>
                <button className="btn-solid w-full" onClick={() => { setCartOpen(false); navigate('/checkout'); }}><span>{t('cart.checkout')}</span></button>
                <button className="w-full text-center mt-3 text-[11px] uppercase tracking-[0.2em] text-cream-50/50 hover:text-cream-50" onClick={() => { setCartOpen(false); navigate('/cart'); }}>{t('cart.title')}</button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ================= FOOTER ================= */
export function Footer() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language !== 'ar';
  const year = new Date().getFullYear();
  const links: [string, string][] = [
    ['nav.home', '/'], ['nav.menu', '/menu'], ['nav.reservations', '/reservations'], ['nav.about', '/about'],
    ['nav.gallery', '/gallery'], ['nav.locations', '/locations'], ['nav.contact', '/contact'], ['nav.faq', '/faq'],
  ];
  const policies: [string, string][] = [
    ['policies.delivery', '/policy/delivery'], ['policies.refund', '/policy/refund'], ['policies.privacy', '/policy/privacy'], ['policies.terms', '/policy/terms'],
  ];
  return (
    <footer className="relative border-t border-cream-50/10 bg-ink-950">
      <div className="max-w-[1500px] mx-auto px-5 md:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="font-display italic text-3xl mb-4">SAVORA<span className="text-gold-400">.</span></div>
          <p className="text-cream-50/40 text-sm leading-relaxed">{t('footer.tagline')}</p>
          <p className="text-cream-50/30 text-xs mt-4">{t('footer.madeWith')}</p>
        </div>
        <div>
          <h4 className="eyebrow mb-5">{t('footer.quickLinks')}</h4>
          <ul className="flex flex-col gap-2.5">
            {links.map(([k, href]) => <li key={k}><NavLink to={href} className="text-sm text-cream-50/60 hover:text-gold-300 transition-colors link-underline">{t(k)}</NavLink></li>)}
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-5">{t('footer.contactT')}</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-cream-50/60">
            <li>{isEn ? '12 Nile Corniche, Garden City, Cairo' : '١٢ كورنيش النيل، جاردن سيتي، القاهرة'}</li>
            <li dir="ltr" className="text-start">+20 155 555 0110</li>
            <li>hello@savora.example</li>
          </ul>
          <h4 className="eyebrow mt-8 mb-5">{t('footer.hoursT')}</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-cream-50/60">
            <li>{isEn ? 'Saturday – Thursday · 10:00 – 00:00' : 'السبت – الخميس · ١٠:٠٠ – ٠٠:٠٠'}</li>
            <li>{isEn ? 'Friday · 13:00 – 01:00' : 'الجمعة · ١٣:٠٠ – ٠١:٠٠'}</li>
          </ul>
        </div>
        <div>
          <h4 className="eyebrow mb-5">{t('footer.policiesT')}</h4>
          <ul className="flex flex-col gap-2.5">
            {policies.map(([k, href]) => <li key={k}><NavLink to={href} className="text-sm text-cream-50/60 hover:text-gold-300 transition-colors link-underline">{t(k)}</NavLink></li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-cream-50/5">
        <div className="max-w-[1500px] mx-auto px-5 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-cream-50/30">© {year} SAVORA. {t('footer.rights')}</p>
          <p className="text-[11px] text-cream-50/30">{t('footer.demo')}</p>
        </div>
      </div>
    </footer>
  );
}

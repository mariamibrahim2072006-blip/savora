import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { initSmoothScroll, scrollTo } from './lib/motion';
import { Navbar, Footer, Cursor, Preloader, CartDrawer } from './components/Chrome';
import Home from './pages/Home';

const Menu = lazy(() => import('./pages/Menu'));
const Dish = lazy(() => import('./pages/Dish'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Confirmation = lazy(() => import('./pages/Confirmation'));
const Track = lazy(() => import('./pages/Track'));
const Reservations = lazy(() => import('./pages/Reservations'));
const About = lazy(() => import('./pages/About'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Contact = lazy(() => import('./pages/Contact'));
const Faq = lazy(() => import('./pages/Faq'));
const Policy = lazy(() => import('./pages/Policy'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Fallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-ink-950">
      <div className="font-display italic text-2xl text-gold-400 animate-pulse">SAVORA</div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  useEffect(() => { initSmoothScroll(); }, []);
  useEffect(() => { scrollTo(0); }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-ink-950 grain">
      <Preloader />
      <Cursor />
      <Navbar />
      <CartDrawer />
      <main>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/dish/:slug" element={<Dish />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:orderNumber" element={<Confirmation />} />
            <Route path="/track" element={<Track />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/about" element={<About />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/policy/:kind" element={<Policy />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/account/*" element={<Dashboard />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

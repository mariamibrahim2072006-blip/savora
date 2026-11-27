import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Package, UtensilsCrossed, CalendarDays, Users, Tag, Settings, Star } from 'lucide-react';
import { useAuth } from '../store/auth';
import AdminOverview from './admin/AdminOverview';
import AdminOrders from './admin/AdminOrders';
import AdminMenu from './admin/AdminMenu';
import { AdminReservations, AdminCustomers, AdminPromotions, AdminSettings, AdminReviews } from './admin/AdminMisc';

type Tab = 'overview' | 'orders' | 'menu' | 'reservations' | 'customers' | 'promotions' | 'reviews' | 'settings';
const TABS: [Tab, any, string][] = [
  ['overview', LayoutDashboard, 'admin.overview'],
  ['orders', Package, 'admin.orders'],
  ['menu', UtensilsCrossed, 'admin.menu'],
  ['reservations', CalendarDays, 'admin.reservations'],
  ['customers', Users, 'admin.customers'],
  ['promotions', Tag, 'admin.promotions'],
  ['reviews', Star, 'admin.reviews'],
  ['settings', Settings, 'admin.settings'],
];

export default function Admin() {
  const { t } = useTranslation();
  const { user, ready } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  if (ready && (!user || user.role !== 'admin')) return (
    <div className="min-h-screen pt-40 text-center px-6">
      <h1 className="headline text-4xl">{t('admin.title')}</h1>
      <p className="text-cream-50/50 mt-4">{t('admin.loginHint')}</p>
      <Navigate to="/auth" replace />
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-[1500px] mx-auto px-4 md:px-8">
        <p className="eyebrow">SAVORA</p>
        <h1 className="headline text-3xl md:text-4xl mt-2 mb-8">{t('admin.title')}</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-52 shrink-0">
            <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:sticky lg:top-24">
              {TABS.map(([k, Icon, label]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`flex items-center gap-3 px-4 py-3 text-[12px] uppercase tracking-[0.15em] whitespace-nowrap border-s-2 transition-all ${tab === k ? 'border-gold-400 text-gold-300 bg-gold-400/5' : 'border-transparent text-cream-50/50 hover:text-cream-50'}`}>
                  <Icon size={14} /> {t(label)}
                </button>
              ))}
            </div>
          </aside>
          <main className="flex-1 min-w-0">
            {tab === 'overview' && <AdminOverview />}
            {tab === 'orders' && <AdminOrders />}
            {tab === 'menu' && <AdminMenu />}
            {tab === 'reservations' && <AdminReservations />}
            {tab === 'customers' && <AdminCustomers />}
            {tab === 'promotions' && <AdminPromotions />}
            {tab === 'reviews' && <AdminReviews />}
            {tab === 'settings' && <AdminSettings />}
          </main>
        </div>
      </div>
    </div>
  );
}

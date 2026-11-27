import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, formatEGP } from '../../lib/api';

type Stats = { revenue: number; orders: number; pending: number; completed: number; customers: number; activeReservations: number; popular: { name_en: string; name_ar: string; sold: string }[]; daily: { day: string; orders: string; revenue: string }[] };

export default function AdminOverview() {
  const { t, i18n } = useTranslation();
  const loc = i18n.language as 'en' | 'ar';
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)).catch(() => {}); }, []);
  if (!s) return <p className="text-cream-50/40">{t('common.loading')}</p>;

  const cards: [string, string][] = [
    [t('admin.revenue'), formatEGP(s.revenue, loc)],
    [t('admin.totalOrders'), String(s.orders)],
    [t('admin.pendingOrders'), String(s.pending)],
    [t('admin.completedOrders'), String(s.completed)],
    [t('admin.totalCustomers'), String(s.customers)],
    [t('admin.activeReservations'), String(s.activeReservations)],
  ];
  const maxRev = Math.max(1, ...s.daily.map((d) => parseFloat(d.revenue)));

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map(([label, v]) => (
          <div key={label} className="card-lux p-5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cream-50/40">{label}</p>
            <p className="font-display text-2xl text-gold-300 mt-2 tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="card-lux p-6">
        <h3 className="font-display text-xl mb-6">{t('admin.salesLast14')}</h3>
        {s.daily.length === 0 ? <p className="text-cream-50/35 text-sm">—</p> : (
          <div className="flex items-end gap-2 h-44">
            {s.daily.map((d) => {
              const h = Math.max(4, (parseFloat(d.revenue) / maxRev) * 100);
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] text-gold-300 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{formatEGP(parseFloat(d.revenue), loc)}</span>
                  <div className="w-full bg-gold-400/20 hover:bg-gold-400/50 transition-colors" style={{ height: `${h}%` }} />
                  <span className="text-[9px] text-cream-50/35 tabular-nums" dir="ltr">{d.day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card-lux p-6">
        <h3 className="font-display text-xl mb-5">{t('admin.popularDishes')}</h3>
        {s.popular.length === 0 ? <p className="text-cream-50/35 text-sm">—</p> : (
          <div className="flex flex-col divide-y divide-cream-50/10">
            {s.popular.map((p, i) => (
              <div key={i} className="flex justify-between py-3 text-sm">
                <span className="text-cream-50/75">{loc === 'ar' ? p.name_ar : p.name_en}</span>
                <span className="text-gold-400 tabular-nums">{p.sold}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

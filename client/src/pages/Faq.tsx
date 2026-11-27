import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const FAQS: { q: [string, string]; a: [string, string] }[] = [
  { q: ['How do I order?', 'إزاي أطلب؟'], a: ['Browse the menu, add dishes to your cart, and check out in under a minute. You can order as a guest or create an account to save addresses and track everything.', 'تصفح المنيو، ضيف الأطباق للسلة، وأكّد الطلب في أقل من دقيقة. تقدر تطلب كضيف أو تعمل حساب يحفظ عناوينك ويتتبع كل حاجة.'] },
  { q: ['Which areas do you deliver to?', 'بتوصلوا لفين؟'], a: ['We deliver across 27 Egyptian governorates. The delivery fee depends on your governorate and is shown clearly at checkout before you pay.', 'بنوصل لـ ٢٧ محافظة في مصر. رسوم التوصيل بتختلف حسب المحافظة وبتظهر لك بوضوح قبل تأكيد الطلب.'] },
  { q: ['What payment methods do you accept?', 'إيه طرق الدفع المتاحة؟'], a: ['Cash on Delivery. You pay in cash when your order arrives — no prepayment needed. Card payment will be added soon.', 'الدفع عند الاستلام كاش. تدفع لما طلبك يوصل — من غير أي دفع مقدم. الدفع بالبطاقة هيضاف قريبًا.'] },
  { q: ['How long does delivery take?', 'التوصيل بياخد قد إيه؟'], a: ['Usually around 45 minutes. The exact estimate is shown on your confirmation screen and on the live tracking page.', 'حوالي ٤٥ دقيقة عادة. التقدير الدقيق بيظهر في صفحة التأكيد وفي صفحة التتبع المباشر.'] },
  { q: ['Can I schedule an order for later?', 'أقدر أحدد ميعاد الطلب بعدين؟'], a: ['Yes — at checkout choose "Schedule for later" and pick your date and time.', 'أيوه — في إتمام الطلب اختار "حدد موعدًا لاحقًا" وحدد اليوم والساعة.'] },
  { q: ['Can I cancel my order?', 'أقدر ألغي طلبي؟'], a: ['Yes, free of charge, as long as the kitchen has not started preparing it. Cancel from the tracking page or your account.', 'أيوه، مجانًا، طالما المطبخ لسه ما بدأش التحضير. الإلغاء من صفحة التتبع أو من حسابك.'] },
  { q: ['Do you have vegetarian options?', 'عندكم أكل نباتي؟'], a: ['Yes — look for the green leaf badge, or filter the menu by Vegetarian.', 'أيوه — دوّر على علامة الورقة الخضرا، أو فلتر المنيو على "نباتي".'] },
  { q: ['How do table reservations work?', 'حجز الترابيزات بيشتغل إزاي؟'], a: ['Pick your date, time and party size — we assign the best fitting table automatically and confirm by phone. You can cancel anytime from your account.', 'اختار اليوم والساعة وعدد الضيوف — إحنا بنعين أنسب ترابيزة أوتوماتيك ونأكد معاك تليفونيًا. تقدر تلغي في أي وقت من حسابك.'] },
  { q: ['Do you offer discounts?', 'في خصومات؟'], a: ['Yes — apply your code in the cart. Watch the home page and our offers section for seasonal codes like SAVORA10.', 'أيوه — طبّق الكود في السلة. تابع الصفحة الرئيسية وقسم العروض لأكواد موسمية زي SAVORA10.'] },
  { q: ['Is the website available in Arabic?', 'الموقع متاح بالعربي؟'], a: ['Fully — switch language from the top bar at any time. The whole experience, including checkout, works right-to-left.', 'بالكامل — بدّل اللغة من الشريط العلوي في أي وقت. التجربة كلها شغالة من اليمين للشمال بما فيها إتمام الطلب.'] },
];

export default function Faq() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[860px] mx-auto px-5 md:px-10">
        <p className="eyebrow">SAVORA</p>
        <h1 className="headline text-4xl md:text-6xl mt-4 mb-12">{t('pages.faqTitle')}</h1>
        <div className="flex flex-col divide-y divide-cream-50/10 border-y border-cream-50/10">
          {FAQS.map((f, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-6 py-6 text-start group">
                <span className={`font-display text-xl md:text-2xl transition-colors ${open === i ? 'text-gold-300' : 'text-cream-50/85 group-hover:text-gold-200'}`}>{f.q[ar ? 1 : 0]}</span>
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} className={`shrink-0 w-9 h-9 border grid place-items-center transition-colors ${open === i ? 'border-gold-400 text-gold-400' : 'border-cream-50/20 text-cream-50/50'}`}>
                  <Plus size={15} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                    <p className="pb-7 text-cream-50/60 leading-relaxed max-w-2xl">{f.a[ar ? 1 : 0]}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

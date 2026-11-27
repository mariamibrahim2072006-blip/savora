import { useTranslation } from 'react-i18next';

const SECTIONS: { h: [string, string]; b: [string, string] }[] = [
  { h: ['Privacy Policy', 'سياسة الخصوصية'], b: [
    'We collect only what your order needs: your name, phone number, and delivery address. Account passwords are stored as one-way hashes and can never be read by anyone. We never sell or share your data with advertisers. Analytics are anonymous. You can delete your account and all saved data at any time by contacting us.',
    'بنجمع بس اللي طلبك محتاجه: اسمك ورقم موبايلك وعنوان التوصيل. كلمات السر بتتخزن مشفرة باتجاه واحد ومحدش يقدر يقراها أبدًا. لا بنبيع ولا بنشارك بياناتك مع معلنين. الإحصائيات مجهولة الهوية. تقدر تمسح حسابك وكل بياناتك في أي وقت بالتواصل معنا.'] },
  { h: ['Ordering & Payment', 'الطلب والدفع'], b: [
    'All prices are in Egyptian Pounds (EGP) and include applicable taxes. Payment is Cash on Delivery: you pay the courier the exact total shown on your confirmation screen. An order is confirmed once it appears on your tracking page with an order number.',
    'كل الأسعار بالجنيه المصري وشاملة الضرائب المطبقة. الدفع كاش عند الاستلام: تدفع للمندوب نفس الإجمالي الظاهر في شاشة التأكيد. الطلب بيتأكد أول ما يظهر في صفحة التتبع برقم طلب.'] },
  { h: ['Delivery', 'التوصيل'], b: [
    'We deliver to the governorates listed at checkout, each with a clearly shown delivery fee. The estimated time (usually ~45 minutes) is an estimate, not a guarantee; live status is always available on your tracking page. If we cannot reach you at the delivery address, the order may be cancelled after two contact attempts.',
    'بنوصل للمحافظات المذكورة في صفحة إتمام الطلب، ولكل محافظة رسوم توصيل ظاهرة بوضوح. الوقت المتوقع (حوالي ٤٥ دقيقة عادة) تقدير مش ضمان؛ الحالة المباشرة متاحة دائمًا في صفحة التتبع. لو مش قدرنا نوصلك على العنوان، ممكن نلغي الطلب بعد محاولتين اتصال.'] },
  { h: ['Cancellation & Refunds', 'الإلغاء والاسترجاع'], b: [
    'You can cancel an order free of charge any time before the kitchen starts preparing it, from your tracking page or account. Once preparation starts, the order can no longer be cancelled. Because payment is cash on delivery, a cancelled order is simply never charged. If something arrives wrong or below our standard, contact us the same day and we will remake it or credit you.',
    'تقدر تلغي طلبك مجانًا في أي وقت قبل ما المطبخ يبدأ التحضير، من صفحة التتبع أو حسابك. بعد بدء التحضير لا يمكن الإلغاء. ولأن الدفع كاش عند الاستلام، الطلب الملغي ببساطة لا يُدفع. لو وصلك حاجة غلط أو أقل من مستوانا، كلمنا في نفس اليوم وهنعيدها لك أو نعملك رصيد.'] },
  { h: ['Table Reservations', 'حجوزات الترابيزات'], b: [
    'Reservations hold your table for 15 minutes past the booked time. Parties larger than 12 should call us directly. You can cancel free of charge from your account up to the reservation time.',
    'الحجز بيحتفظ بترابيزتك لمدة ١٥ دقيقة بعد الميعاد. المجموعات الأكبر من ١٢ فرد يفضل تتصل بينا مباشرة. تقدر تلغي مجانًا من حسابك لحد وقت الحجز.'] },
];

export default function Policy() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-24">
      <div className="max-w-[820px] mx-auto px-5 md:px-10">
        <p className="eyebrow">SAVORA</p>
        <h1 className="headline text-4xl md:text-6xl mt-4 mb-14">{t('footer.policiesT')}</h1>
        <div className="flex flex-col gap-12">
          {SECTIONS.map((s, i) => (
            <section key={i}>
              <h2 className="font-display text-2xl md:text-3xl text-gold-300 mb-4"><span className="text-gold-400/50 me-3 italic">0{i + 1}</span>{s.h[ar ? 1 : 0]}</h2>
              <p className="text-cream-50/60 leading-loose">{s.b[ar ? 1 : 0]}</p>
            </section>
          ))}
        </div>
        <p className="text-cream-50/30 text-xs mt-16 border-t border-cream-50/10 pt-6">{t('footer.demo')}</p>
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CHEFS = [
  { img: '/images/site/chef-1.webp', en: ['Omar El-Sherif', 'Executive Chef'], ar: ['عمر الشريف', 'الشيف التنفيذي'] },
  { img: '/images/site/chef-2.webp', en: ['Layla Mansour', 'Head of Grill'], ar: ['ليلى منصور', 'شيف الشواية'] },
  { img: '/images/site/chef-3.webp', en: ['Youssef Naguib', 'Pastry Chef'], ar: ['يوسف نجيب', 'شيف الحلويات'] },
];

export default function About() {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === 'ar';
  const story = ar
    ? ['سافورا بدأت من مطبخ صغير في جاردن سيتي سنة 2016 — عائلة واحدة، فرن طوبي، ووصفة واحدة ورثناها عن جدتنا: النار لازم تبان في الطعم.', 'اليوم المطبخ بقى أكبر، بس القاعدة ما اتغيرتش. كل طبق بيتعمل من الصفر يوميًا، الخضار من سوق العبور الصبح، واللحوم بتتشوح على فحم طبيعي.', 'إحنا مش بنقدم أكل وخلاص. إحنا بنجهز ذكريات.']
    : ['SAVORA began in a small Garden City kitchen in 2016 — one family, a brick oven, and a single rule inherited from our grandmother: the fire must be tasted.', 'Today the kitchen is larger, but the rule never changed. Every dish is built from scratch each day, produce arrives from El-Obour market at dawn, and meats meet real charcoal.', 'We do not serve food. We prepare memories.'];
  const values = ar
    ? [['نار حقيقية', 'فحم طبيعي وفرن حجري — لا اختصارات.'], ['مكونات اليوم', 'السوق كل صبح، والمنيو يتبع الموسم.'], ['ضيافة مصرية', 'من أول الترحاب لآخر القهوة.'], ['حرفة', 'كل صحن يخرج من إيد شيف باسمه.']]
    : [['Real fire', 'Natural charcoal and a stone oven — no shortcuts.'], ['Today\'s ingredients', 'The market every dawn, the menu follows the season.'], ['Egyptian hospitality', 'From the first welcome to the last coffee.'], ['Craft', 'Every plate leaves a named chef\'s hands.']];

  return (
    <div className="min-h-screen pb-24">
      {/* hero */}
      <div className="relative h-[55vh] min-h-[400px] overflow-hidden">
        <img src="/images/site/about-hero.webp" alt="" className="w-full h-full object-cover img-dark" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/30 to-ink-950" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="eyebrow">SAVORA</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="headline text-4xl md:text-6xl mt-4">{t('pages.aboutTitle')}</motion.h1>
        </div>
      </div>

      {/* story */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 mt-20 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <p className="eyebrow">{t('sections.story')}</p>
          {story.map((p, i) => <p key={i} className={`text-cream-50/65 leading-loose mt-5 ${i === 2 ? 'font-display italic text-xl text-gold-300/90' : ''}`}>{p}</p>)}
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.9 }} className="grid grid-cols-2 gap-4 md:gap-6">
          <img src="/images/site/story-interior.webp" alt="" className="w-full aspect-[3/4] object-cover img-dark" />
          <img src="/images/site/story-chef.webp" alt="" className="w-full aspect-[3/4] object-cover img-dark" />
        </motion.div>
      </div>

      {/* values */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 mt-28">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map(([h, d], i) => (
            <motion.div key={h} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card-lux p-6">
              <span className="font-display italic text-3xl text-gold-400/60">0{i + 1}</span>
              <h3 className="font-display text-xl mt-3">{h}</h3>
              <p className="text-cream-50/50 text-sm mt-2 leading-relaxed">{d}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* chefs */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-10 mt-28">
        <p className="eyebrow">{t('pages.chefsSub')}</p>
        <h2 className="headline text-4xl md:text-5xl mt-3 mb-12">{t('pages.chefsTitle')}</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {CHEFS.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="group relative overflow-hidden card-lux">
              <img src={c.img} alt={c.en[0]} className="w-full aspect-[3/4] object-cover img-dark transition-transform duration-[1.2s] group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent p-5 pt-16">
                <h3 className="font-display text-2xl">{ar ? c.ar[0] : c.en[0]}</h3>
                <p className="text-gold-300/80 text-[11px] uppercase tracking-[0.25em] mt-1">{ar ? c.ar[1] : c.en[1]}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="text-center mt-24">
        <Link to="/reservations" className="btn-gold"><span>{t('nav.reservations')}</span></Link>
      </div>
    </div>
  );
}

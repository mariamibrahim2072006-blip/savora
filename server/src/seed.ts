import bcrypt from 'bcryptjs';
import { q, one } from './db.js';
import catalog from './catalog.json' with { type: 'json' };

const GOVERNORATES: { en: string; ar: string; fee: number }[] = [
  { en: 'Cairo', ar: 'القاهرة', fee: 40 },
  { en: 'Giza', ar: 'الجيزة', fee: 45 },
  { en: 'Alexandria', ar: 'الإسكندرية', fee: 60 },
  { en: 'Dakahlia', ar: 'الدقهلية', fee: 70 },
  { en: 'Sharqia', ar: 'الشرقية', fee: 70 },
  { en: 'Gharbia', ar: 'الغربية', fee: 70 },
  { en: 'Monufia', ar: 'المنوفية', fee: 75 },
  { en: 'Qaliubiya', ar: 'القليوبية', fee: 55 },
  { en: 'Beheira', ar: 'البحيرة', fee: 75 },
  { en: 'Kafr El Sheikh', ar: 'كفر الشيخ', fee: 80 },
  { en: 'Damietta', ar: 'دمياط', fee: 80 },
  { en: 'Port Said', ar: 'بورسعيد', fee: 85 },
  { en: 'Ismailia', ar: 'الإسماعيلية', fee: 80 },
  { en: 'Suez', ar: 'السويس', fee: 85 },
  { en: 'Fayoum', ar: 'الفيوم', fee: 90 },
  { en: 'Beni Suef', ar: 'بني سويف', fee: 90 },
  { en: 'Minya', ar: 'المنيا', fee: 100 },
  { en: 'Assiut', ar: 'أسيوط', fee: 110 },
  { en: 'Sohag', ar: 'سوهاج', fee: 110 },
  { en: 'Qena', ar: 'قنا', fee: 120 },
  { en: 'Luxor', ar: 'الأقصر', fee: 120 },
  { en: 'Aswan', ar: 'أسوان', fee: 130 },
  { en: 'Red Sea', ar: 'البحر الأحمر', fee: 140 },
  { en: 'New Valley', ar: 'الوادي الجديد', fee: 150 },
  { en: 'Matrouh', ar: 'مطروح', fee: 120 },
  { en: 'North Sinai', ar: 'شمال سيناء', fee: 130 },
  { en: 'South Sinai', ar: 'جنوب سيناء', fee: 130 },
];

const REVIEWS: Record<string, { name: string; rating: number; comment: string; commentAr: string }[]> = {
  'signature-burger': [
    { name: 'Ahmed S.', rating: 5, comment: 'Best burger in Cairo, hands down. The secret sauce is unreal.', commentAr: 'أفضل برجر في القاهرة بدون منازع. الصوص السري خيالي.' },
    { name: 'Nour E.', rating: 5, comment: 'Perfect bun, perfect patty. Worth every pound.', commentAr: 'العيش واللحم مثاليين. يستاهل كل جنيه.' },
    { name: 'Karim M.', rating: 4, comment: 'Great flavor, generous portion.', commentAr: 'طعم رائع وحجم كبير.' },
  ],
  'ribeye-steak': [
    { name: 'Omar H.', rating: 5, comment: 'Cooked exactly medium-rare as asked. The truffle butter is a masterpiece.', commentAr: 'مستوى السوى مظبوط بالظبط. زبدة الترافل تحفة.' },
    { name: 'Laila A.', rating: 5, comment: 'Restaurant-quality steak, delivered hot.', commentAr: 'ستيك بجودة مطعم فاخر ووصل ساخن.' },
  ],
  'truffle-alfredo': [
    { name: 'Sara W.', rating: 5, comment: 'So creamy and the truffle aroma fills the room.', commentAr: 'كريمي جداً ورائحة الترافل بتملى المكان.' },
    { name: 'Hassan D.', rating: 4, comment: 'Rich and satisfying.', commentAr: 'غني ومشبع.' },
  ],
  'chocolate-fondant': [
    { name: 'Mariam K.', rating: 5, comment: 'The molten center is pure magic. Order it, thank me later.', commentAr: 'القلب السائل سحر حقيقي. اطلبوه وهتشكروني.' },
    { name: 'Youssef T.', rating: 5, comment: 'Perfect ending to a perfect meal.', commentAr: 'نهاية مثالية لوجبة مثالية.' },
  ],
  'mixed-grill': [
    { name: 'Tamer F.', rating: 5, comment: 'The kofta tastes like a Cairo street classic, elevated.', commentAr: 'الكفتة طعمها زي الكفتة البلدي بس بمستوى أعلى.' },
  ],
  'shakshuka': [
    { name: 'Dina R.', rating: 4, comment: 'Cozy, spicy and the feta on top is a great touch.', commentAr: 'دافية وحراقة والفيتا فوق لمسة جميلة.' },
  ],
  'ful-royale': [
    { name: 'Mona Z.', rating: 5, comment: 'Ful like my grandmother made, but fancier.', commentAr: 'فول زي بتاع تيتة بس أشيك.' },
  ],
  'margherita': [
    { name: 'Ali N.', rating: 4, comment: 'Real wood-fired crust, you can taste the char.', commentAr: 'عجينة مخبوزة على الحطب فعلاً، طعم التحمير واضح.' },
  ],
  'kunafa-cheesecake': [
    { name: 'Rana G.', rating: 5, comment: 'East meets west in the best possible way.', commentAr: 'الشرق والغرب في طبق واحد بأجمل شكل.' },
  ],
  'sea-bass': [
    { name: 'Khaled B.', rating: 5, comment: 'Fresh, flaky, perfectly grilled.', commentAr: 'طازج وطري ومشوي بإتقان.' },
  ],
};

export async function seedIfEmpty() {
  const existing = await one<{ n: string }>('SELECT count(*)::text AS n FROM categories');
  if (existing && parseInt(existing.n, 10) > 0) return false;

  const catIds = new Map<string, string>();
  for (let i = 0; i < catalog.categories.length; i++) {
    const c = catalog.categories[i];
    const row = await one<{ id: string }>(
      'INSERT INTO categories (slug, name_en, name_ar, image, sort) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [c.slug, c.en, c.ar, `/images/dishes/${bestDishImageFor(c.slug)}`, i]
    );
    catIds.set(c.slug, row!.id);
  }

  const prodIds = new Map<string, string>();
  for (const d of catalog.dishes) {
    const row = await one<{ id: string }>(
      `INSERT INTO products (category_id, slug, name_en, name_ar, description_en, description_ar, price, image, calories,
        is_vegetarian, is_spicy, is_popular, is_new, ingredients)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
      [catIds.get(d.category), d.slug, d.en, d.ar, d.descEn, d.descAr, d.price, `/images/dishes/${d.slug}.webp`,
       d.cal, d.veg, d.spicy, d.popular, d.isNew, JSON.stringify(d.ingredients)]
    );
    prodIds.set(d.slug, row!.id);
    let s = 0;
    for (const sz of d.sizes) {
      await q('INSERT INTO product_sizes (product_id, label_en, label_ar, price_delta, sort) VALUES ($1,$2,$3,$4,$5)',
        [row!.id, sz.en, sz.ar, sz.delta, s++]);
    }
    for (const ad of d.addons) {
      await q('INSERT INTO product_addons (product_id, name_en, name_ar, price) VALUES ($1,$2,$3,$4)',
        [row!.id, ad.en, ad.ar, ad.price]);
    }
  }

  for (const [slug, list] of Object.entries(REVIEWS)) {
    const pid = prodIds.get(slug);
    if (!pid) continue;
    for (const r of list) {
      await q('INSERT INTO reviews (product_id, name, rating, comment, is_approved) VALUES ($1,$2,$3,$4,true)',
        [pid, r.name, r.rating, r.comment]);
    }
    const agg = await one<{ avg: string; n: string }>(
      'SELECT round(avg(rating)::numeric,1)::text AS avg, count(*)::text AS n FROM reviews WHERE product_id=$1', [pid]);
    await q('UPDATE products SET rating=$1, rating_count=$2 WHERE id=$3', [agg!.avg, agg!.n, pid]);
  }

  const tables = [
    ['T1', 2], ['T2', 2], ['T3', 4], ['T4', 4], ['T5', 4], ['T6', 6], ['T7', 6], ['T8', 8],
  ];
  for (const [label, seats] of tables) {
    await q('INSERT INTO restaurant_tables (label, seats) VALUES ($1,$2)', [label, seats]);
  }

  await q(`INSERT INTO coupons (code, kind, value, min_order, expires_at) VALUES
    ('SAVORA10','percent',10,200, now() + interval '90 days'),
    ('WELCOME15','percent',15,150, now() + interval '30 days'),
    ('FREEDEL','fixed',50,300, now() + interval '60 days')`);

  const settings: Record<string, unknown> = {
    restaurant: {
      name_en: 'SAVORA', name_ar: 'سافورا',
      tagline_en: 'GOOD FOOD. GREAT MOMENTS.', tagline_ar: 'أكل طيب. لحظات أحلى.',
      phone: '+20 155 555 0110', whatsapp: '+20 155 555 0110', email: 'hello@savora.example',
      address_en: '12 Nile Corniche, Garden City, Cairo', address_ar: '١٢ كورنيش النيل، جاردن سيتي، القاهرة',
      hours: [
        { d: 'sat-thu', en: 'Saturday – Thursday', ar: 'السبت – الخميس', open: '10:00', close: '00:00' },
        { d: 'fri', en: 'Friday', ar: 'الجمعة', open: '13:00', close: '01:00' },
      ],
      socials: { instagram: 'https://instagram.com/savora.example', facebook: 'https://facebook.com/savora.example', tiktok: 'https://tiktok.com/@savora.example' },
    },
    ordering: {
      min_order: 150,
      estimated_minutes: 45,
      pickup_address_en: '12 Nile Corniche, Garden City, Cairo',
      pickup_address_ar: '١٢ كورنيش النيل، جاردن سيتي، القاهرة',
      delivery_areas: GOVERNORATES,
    },
    offers: [
      { id: 'combo-night', title_en: 'Signature Combo Night', title_ar: 'ليلة الكومبو سيغنتشر',
        body_en: 'Any signature burger + fries + drink — save 20% every Tuesday.', body_ar: 'أي برجر سيغنتشر + بطاطس + مشروب — وفر ٢٠٪ كل ثلاثاء.',
        badge_en: '-20% TUESDAYS', badge_ar: 'خصم ٢٠٪ الثلاثاء', image: '/images/site/offer-combo.webp' },
      { id: 'sweet-weekend', title_en: 'Sweet Weekend', title_ar: 'ويك إند حلو',
        body_en: 'Free dessert with every order over 600 EGP, Friday & Saturday.', body_ar: 'حلوى مجانية مع أي طلب فوق ٦٠٠ جنيه يوم الجمعة والسبت.',
        badge_en: 'FREE DESSERT', badge_ar: 'حلوى مجانية', image: '/images/site/offer-dessert.webp' },
    ],
  };
  for (const [key, value] of Object.entries(settings)) {
    await q('INSERT INTO settings (key, value) VALUES ($1,$2)', [key, JSON.stringify(value)]);
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@savora.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Savora@2026';
  const hash = await bcrypt.hash(adminPassword, 10);
  await q('INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,$5)',
    ['SAVORA Admin', adminEmail.toLowerCase(), '+201555550110', hash, 'admin']);

  return true;
}

function bestDishImageFor(cat: string): string {
  const first = catalog.dishes.find((d) => d.category === cat);
  return `${first ? first.slug : 'placeholder'}.webp`;
}

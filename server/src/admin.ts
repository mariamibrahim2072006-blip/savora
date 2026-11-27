import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { q, one } from './db.js';
import { requireAuth, requireAdmin } from './auth.js';
import { bad, num } from './util.js';

export const adminApi = Router();
adminApi.use(requireAuth, requireAdmin);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });

/* ---------- DASHBOARD ---------- */
adminApi.get('/stats', async (_req, res) => {
  const [rev, orders, pending, completed, customers, reservations, popular, daily] = await Promise.all([
    one<{ v: string }>("SELECT COALESCE(sum(total),0)::text v FROM orders WHERE status NOT IN ('cancelled','rejected')"),
    one<{ v: string }>('SELECT count(*)::text v FROM orders'),
    one<{ v: string }>("SELECT count(*)::text v FROM orders WHERE status IN ('received','confirmed','preparing')"),
    one<{ v: string }>("SELECT count(*)::text v FROM orders WHERE status='delivered'"),
    one<{ v: string }>("SELECT count(*)::text v FROM users WHERE role='customer'"),
    one<{ v: string }>("SELECT count(*)::text v FROM reservations WHERE status IN ('pending','confirmed') AND date >= CURRENT_DATE"),
    q('SELECT p.name_en, p.name_ar, sum(oi.quantity)::text AS sold FROM order_items oi JOIN products p ON p.id=oi.product_id GROUP BY p.id ORDER BY sum(oi.quantity) DESC LIMIT 5'),
    q(`SELECT date_trunc('day', created_at)::date::text AS day, count(*)::text AS orders, COALESCE(sum(total),0)::text AS revenue
       FROM orders WHERE created_at > now() - interval '14 days' AND status NOT IN ('cancelled','rejected')
       GROUP BY 1 ORDER BY 1`),
  ]);
  res.json({
    revenue: num(rev?.v), orders: num(orders?.v), pending: num(pending?.v), completed: num(completed?.v),
    customers: num(customers?.v), activeReservations: num(reservations?.v), popular, daily,
  });
});

/* ---------- ORDERS ---------- */
adminApi.get('/orders', async (req, res) => {
  const { status, from, to } = req.query as Record<string, string>;
  const where: string[] = ['1=1']; const params: any[] = [];
  if (status) { params.push(status); where.push(`status=$${params.length}`); }
  if (from) { params.push(from); where.push(`created_at >= $${params.length}::date`); }
  if (to) { params.push(to); where.push(`created_at < ($${params.length}::date + interval '1 day')`); }
  res.json({ orders: await q(`SELECT * FROM orders WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT 300`, params) });
});

adminApi.get('/orders/:id', async (req, res) => {
  const order = await one('SELECT * FROM orders WHERE id=$1', [req.params.id]);
  if (!order) return bad(res, 404, 'Order not found');
  const items = await q('SELECT * FROM order_items WHERE order_id=$1', [req.params.id]);
  res.json({ order, items });
});

adminApi.patch('/orders/:id', async (req, res) => {
  const schema = z.object({
    status: z.enum(['received','confirmed','preparing','out_for_delivery','ready_for_pickup','delivered','cancelled','rejected']).optional(),
    estimated_minutes: z.number().int().min(5).max(240).optional(),
    status_note: z.string().max(300).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid update');
  const o = await one<any>('SELECT * FROM orders WHERE id=$1', [req.params.id]);
  if (!o) return bad(res, 404, 'Order not found');
  const u = parsed.data;
  await q('UPDATE orders SET status=COALESCE($1,status), estimated_minutes=COALESCE($2,estimated_minutes), status_note=COALESCE($3,status_note), updated_at=now() WHERE id=$4',
    [u.status ?? null, u.estimated_minutes ?? null, u.status_note ?? null, o.id]);
  res.json({ order: await one('SELECT * FROM orders WHERE id=$1', [o.id]) });
});

/* ---------- MENU ---------- */
const productSchema = z.object({
  category_id: z.string().uuid(),
  name_en: z.string().min(2).max(100),
  name_ar: z.string().min(2).max(100),
  description_en: z.string().max(600).default(''),
  description_ar: z.string().max(600).default(''),
  price: z.number().positive().max(100000),
  calories: z.number().int().min(0).max(5000).optional().nullable(),
  is_vegetarian: z.boolean().default(false),
  is_spicy: z.boolean().default(false),
  is_popular: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_available: z.boolean().default(true),
  ingredients: z.array(z.object({ en: z.string(), ar: z.string() })).max(30).default([]),
  sizes: z.array(z.object({ label_en: z.string(), label_ar: z.string(), price_delta: z.number().default(0) })).max(8).default([]),
  addons: z.array(z.object({ name_en: z.string(), name_ar: z.string(), price: z.number().min(0) })).max(20).default([]),
});

adminApi.post('/products', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid dish: ' + (parsed.error.issues[0]?.path.join('.') || ''));
  const p = parsed.data;
  const slug = p.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
  const row = await one<any>(
    `INSERT INTO products (category_id, slug, name_en, name_ar, description_en, description_ar, price, calories,
      is_vegetarian, is_spicy, is_popular, is_new, is_available, ingredients)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [p.category_id, slug, p.name_en, p.name_ar, p.description_en, p.description_ar, p.price, p.calories ?? null,
     p.is_vegetarian, p.is_spicy, p.is_popular, p.is_new, p.is_available, JSON.stringify(p.ingredients)]);
  for (const [i, s] of p.sizes.entries())
    await q('INSERT INTO product_sizes (product_id, label_en, label_ar, price_delta, sort) VALUES ($1,$2,$3,$4,$5)', [row!.id, s.label_en, s.label_ar, s.price_delta, i]);
  for (const a of p.addons)
    await q('INSERT INTO product_addons (product_id, name_en, name_ar, price) VALUES ($1,$2,$3,$4)', [row!.id, a.name_en, a.name_ar, a.price]);
  res.status(201).json({ product: row });
});

adminApi.put('/products/:id', async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid dish data');
  const p = parsed.data as any;
  const cur = await one<any>('SELECT * FROM products WHERE id=$1', [req.params.id]);
  if (!cur) return bad(res, 404, 'Dish not found');
  await q(
    `UPDATE products SET category_id=$1, name_en=$2, name_ar=$3, description_en=$4, description_ar=$5, price=$6, calories=$7,
      is_vegetarian=$8, is_spicy=$9, is_popular=$10, is_new=$11, is_available=$12, ingredients=$13 WHERE id=$14`,
    [p.category_id ?? cur.category_id, p.name_en ?? cur.name_en, p.name_ar ?? cur.name_ar,
     p.description_en ?? cur.description_en, p.description_ar ?? cur.description_ar, p.price ?? cur.price,
     p.calories ?? cur.calories, p.is_vegetarian ?? cur.is_vegetarian, p.is_spicy ?? cur.is_spicy,
     p.is_popular ?? cur.is_popular, p.is_new ?? cur.is_new, p.is_available ?? cur.is_available,
     p.ingredients ? JSON.stringify(p.ingredients) : cur.ingredients, cur.id]);
  if (p.sizes) { await q('DELETE FROM product_sizes WHERE product_id=$1', [cur.id]);
    for (const [i, s] of p.sizes.entries()) await q('INSERT INTO product_sizes (product_id,label_en,label_ar,price_delta,sort) VALUES ($1,$2,$3,$4,$5)', [cur.id, s.label_en, s.label_ar, s.price_delta, i]); }
  if (p.addons) { await q('DELETE FROM product_addons WHERE product_id=$1', [cur.id]);
    for (const a of p.addons) await q('INSERT INTO product_addons (product_id,name_en,name_ar,price) VALUES ($1,$2,$3,$4)', [cur.id, a.name_en, a.name_ar, a.price]); }
  res.json({ product: await one('SELECT * FROM products WHERE id=$1', [cur.id]) });
});

adminApi.delete('/products/:id', async (req, res) => {
  const r = await one('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
  if (!r) return bad(res, 404, 'Dish not found');
  res.json({ ok: true });
});

adminApi.post('/products/:id/image', upload.single('image'), async (req, res) => {
  if (!req.file) return bad(res, 400, 'Attach an image file');
  const p = await one<any>('SELECT id FROM products WHERE id=$1', [req.params.id]);
  if (!p) return bad(res, 404, 'Dish not found');
  await q('INSERT INTO product_images (product_id, data, content_type) VALUES ($1,$2,$3) ON CONFLICT (product_id) DO UPDATE SET data=$2, content_type=$3',
    [p.id, req.file.buffer, req.file.mimetype || 'image/jpeg']);
  await q('UPDATE products SET image=$1 WHERE id=$2', [`/api/images/${p.id}`, p.id]);
  res.json({ ok: true, image: `/api/images/${p.id}` });
});

/* ---------- CATEGORIES ---------- */
adminApi.post('/categories', async (req, res) => {
  const { name_en, name_ar } = req.body || {};
  if (!name_en || !name_ar) return bad(res, 400, 'Name in both languages is required');
  const slug = String(name_en).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const row = await one('INSERT INTO categories (slug, name_en, name_ar, sort) VALUES ($1,$2,$3,(SELECT COALESCE(max(sort),0)+1 FROM categories)) RETURNING *', [slug, name_en, name_ar]);
  res.status(201).json({ category: row });
});
adminApi.put('/categories/:id', async (req, res) => {
  const { name_en, name_ar, sort } = req.body || {};
  const row = await one('UPDATE categories SET name_en=COALESCE($1,name_en), name_ar=COALESCE($2,name_ar), sort=COALESCE($3,sort) WHERE id=$4 RETURNING *', [name_en ?? null, name_ar ?? null, sort ?? null, req.params.id]);
  if (!row) return bad(res, 404, 'Category not found');
  res.json({ category: row });
});
adminApi.delete('/categories/:id', async (req, res) => {
  const used = await one('SELECT id FROM products WHERE category_id=$1 LIMIT 1', [req.params.id]);
  if (used) return bad(res, 400, 'Move or delete this category\'s dishes first');
  await q('DELETE FROM categories WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- RESERVATIONS ---------- */
adminApi.get('/reservations', async (req, res) => {
  const { date, status } = req.query as Record<string, string>;
  const where: string[] = ['1=1']; const params: any[] = [];
  if (date) { params.push(date); where.push(`r.date=$${params.length}`); }
  if (status) { params.push(status); where.push(`r.status=$${params.length}`); }
  res.json({ reservations: await q(
    `SELECT r.*, to_char(r.date, $$YYYY-MM-DD$$) AS date, t.label AS table_label, t.seats FROM reservations r LEFT JOIN restaurant_tables t ON t.id=r.table_id
     WHERE ${where.join(' AND ')} ORDER BY r.date DESC, r.time_slot DESC LIMIT 300`, params) });
});
adminApi.patch('/reservations/:id', async (req, res) => {
  const schema = z.object({ status: z.enum(['pending','confirmed','cancelled','completed','no_show']).optional(), table_id: z.string().uuid().nullable().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid update');
  const rv = await one<any>('SELECT * FROM reservations WHERE id=$1', [req.params.id]);
  if (!rv) return bad(res, 404, 'Reservation not found');
  if (parsed.data.table_id) {
    const clash = await one('SELECT id FROM reservations WHERE table_id=$1 AND date=$2 AND time_slot=$3 AND status IN (\'pending\',\'confirmed\') AND id<>$4',
      [parsed.data.table_id, rv.date, rv.time_slot, rv.id]);
    if (clash) return bad(res, 409, 'That table is already booked for this slot');
  }
  await q('UPDATE reservations SET status=COALESCE($1,status), table_id=COALESCE($2,table_id) WHERE id=$3',
    [parsed.data.status ?? null, parsed.data.table_id ?? null, rv.id]);
  res.json({ reservation: await one('SELECT * FROM reservations WHERE id=$1', [rv.id]) });
});

/* ---------- TABLES ---------- */
adminApi.post('/tables', async (req, res) => {
  const { label, seats } = req.body || {};
  if (!label || !seats) return bad(res, 400, 'Label and seats are required');
  const row = await one('INSERT INTO restaurant_tables (label, seats) VALUES ($1,$2) RETURNING *', [label, +seats]);
  res.status(201).json({ table: row });
});
adminApi.patch('/tables/:id', async (req, res) => {
  const { label, seats, is_active } = req.body || {};
  const row = await one('UPDATE restaurant_tables SET label=COALESCE($1,label), seats=COALESCE($2,seats), is_active=COALESCE($3,is_active) WHERE id=$4 RETURNING *',
    [label ?? null, seats ?? null, is_active ?? null, req.params.id]);
  if (!row) return bad(res, 404, 'Table not found');
  res.json({ table: row });
});
adminApi.get('/tables', async (_req, res) => res.json({ tables: await q('SELECT * FROM restaurant_tables ORDER BY seats') }));
adminApi.delete('/tables/:id', async (req, res) => {
  await q('UPDATE restaurant_tables SET is_active=false WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- CUSTOMERS ---------- */
adminApi.get('/customers', async (_req, res) => {
  res.json({ customers: await q(
    `SELECT u.id, u.name, u.email, u.phone, u.created_at,
       (SELECT count(*) FROM orders o WHERE o.user_id=u.id)::text AS order_count,
       (SELECT COALESCE(sum(total),0) FROM orders o WHERE o.user_id=u.id AND o.status NOT IN ('cancelled','rejected'))::text AS total_spent
     FROM users u WHERE u.role='customer' ORDER BY u.created_at DESC LIMIT 500`) });
});
adminApi.get('/customers/:id', async (req, res) => {
  const customer = await one("SELECT id, name, email, phone, created_at FROM users WHERE id=$1 AND role='customer'", [req.params.id]);
  if (!customer) return bad(res, 404, 'Customer not found');
  const orders = await q('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100', [req.params.id]);
  const reservations = await q('SELECT * FROM reservations WHERE user_id=$1 ORDER BY date DESC LIMIT 50', [req.params.id]);
  res.json({ customer, orders, reservations });
});

/* ---------- COUPONS ---------- */
adminApi.get('/coupons', async (_req, res) => res.json({ coupons: await q('SELECT * FROM coupons ORDER BY created_at DESC') }));
adminApi.post('/coupons', async (req, res) => {
  const schema = z.object({
    code: z.string().min(3).max(30), kind: z.enum(['percent', 'fixed']), value: z.number().positive(),
    min_order: z.number().min(0).default(0), expires_at: z.string().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid coupon');
  const c = parsed.data;
  if (c.kind === 'percent' && c.value > 90) return bad(res, 400, 'Percentage discounts are capped at 90%');
  const row = await one(
    'INSERT INTO coupons (code, kind, value, min_order, expires_at) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [c.code.toUpperCase(), c.kind, c.value, c.min_order, c.expires_at ?? null]);
  res.status(201).json({ coupon: row });
});
adminApi.patch('/coupons/:id', async (req, res) => {
  const { value, min_order, expires_at, is_active } = req.body || {};
  const row = await one('UPDATE coupons SET value=COALESCE($1,value), min_order=COALESCE($2,min_order), expires_at=COALESCE($3,expires_at), is_active=COALESCE($4,is_active) WHERE id=$5 RETURNING *',
    [value ?? null, min_order ?? null, expires_at ?? null, is_active ?? null, req.params.id]);
  if (!row) return bad(res, 404, 'Coupon not found');
  res.json({ coupon: row });
});
adminApi.delete('/coupons/:id', async (req, res) => {
  await q('DELETE FROM coupons WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- SETTINGS ---------- */
adminApi.get('/settings', async (_req, res) => {
  const rows = await q<{ key: string; value: any }>('SELECT key, value FROM settings');
  const out: Record<string, any> = {};
  for (const r of rows) out[r.key] = r.value;
  res.json({ settings: out });
});
adminApi.put('/settings/:key', async (req, res) => {
  const allowed = ['restaurant', 'ordering', 'offers'];
  if (!allowed.includes(req.params.key)) return bad(res, 400, 'Unknown settings key');
  await q('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
    [req.params.key, JSON.stringify(req.body)]);
  res.json({ ok: true });
});

/* ---------- REVIEWS ---------- */
adminApi.get('/reviews', async (_req, res) => {
  res.json({ reviews: await q(
    `SELECT r.*, p.name_en AS product_en, p.name_ar AS product_ar FROM reviews r JOIN products p ON p.id=r.product_id ORDER BY r.created_at DESC LIMIT 200`) });
});
adminApi.patch('/reviews/:id', async (req, res) => {
  const { is_approved } = req.body || {};
  const row = await one<any>('UPDATE reviews SET is_approved=$1 WHERE id=$2 RETURNING *', [!!is_approved, req.params.id]);
  if (!row) return bad(res, 404, 'Review not found');
  await q(`UPDATE products SET rating=(SELECT COALESCE(round(avg(rating)::numeric,1),0) FROM reviews WHERE product_id=$1 AND is_approved),
    rating_count=(SELECT count(*) FROM reviews WHERE product_id=$1 AND is_approved) WHERE id=$2`, [row.product_id, row.product_id]);
  res.json({ review: row });
});

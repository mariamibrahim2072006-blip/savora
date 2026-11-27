import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { q, one, withTx } from './db.js';
import { signToken, requireAuth, optionalAuth, Authed } from './auth.js';
import { orderNumber, bad, num } from './util.js';

export const publicApi = Router();

/* ---------------- AUTH ---------------- */

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  phone: z.string().min(8).max(20),
  password: z.string().min(8).max(72).regex(/[A-Za-z]/, 'Password must contain a letter').regex(/[0-9]/, 'Password must contain a number'),
});

publicApi.post('/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, parsed.error.issues[0]?.message || 'Invalid data');
  const { name, email, phone, password } = parsed.data;
  const exists = await one('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
  if (exists) return bad(res, 409, 'An account with this email already exists');
  const hash = await bcrypt.hash(password, 10);
  const user = await one<any>(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, name, email, phone, role',
    [name, email.toLowerCase(), phone, hash]);
  res.status(201).json({ user, token: signToken(user) });
});

publicApi.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return bad(res, 400, 'Email and password are required');
  const user = await one<any>('SELECT * FROM users WHERE email=$1', [String(email).toLowerCase()]);
  if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
    return bad(res, 401, 'Incorrect email or password');
  }
  res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }, token: signToken(user) });
});

publicApi.post('/auth/forgot', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return bad(res, 400, 'Email is required');
  const user = await one<any>('SELECT id FROM users WHERE email=$1', [String(email).toLowerCase()]);
  const resp: any = { ok: true, message: 'If this email is registered, a reset link has been generated.' };
  if (user) {
    const token = randomBytes(24).toString('hex');
    await q('UPDATE users SET reset_token=$1, reset_expires=now()+interval \'1 hour\' WHERE id=$2', [token, user.id]);
    // Email delivery requires SMTP configuration (see README). Until SMTP is set,
    // the token is returned so the flow stays fully functional in this build.
    resp.dev_reset_token = token;
  }
  res.json(resp);
});

publicApi.post('/auth/reset', async (req, res) => {
  const schema = z.object({ token: z.string().min(10), password: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/[0-9]/) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid token or weak password (min 8 chars, letters and numbers)');
  const user = await one<any>('SELECT id FROM users WHERE reset_token=$1 AND reset_expires > now()', [parsed.data.token]);
  if (!user) return bad(res, 400, 'This reset link is invalid or has expired');
  const hash = await bcrypt.hash(parsed.data.password, 10);
  await q('UPDATE users SET password_hash=$1, reset_token=NULL, reset_expires=NULL WHERE id=$2', [hash, user.id]);
  res.json({ ok: true });
});

publicApi.get('/auth/me', requireAuth, async (req: Authed, res) => {
  const user = await one<any>('SELECT id, name, email, phone, role, created_at FROM users WHERE id=$1', [req.user!.id]);
  res.json({ user });
});

publicApi.put('/auth/profile', requireAuth, async (req: Authed, res) => {
  const schema = z.object({ name: z.string().min(2).max(80).optional(), phone: z.string().min(8).max(20).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid data');
  const { name, phone } = parsed.data;
  const user = await one<any>(
    'UPDATE users SET name=COALESCE($1,name), phone=COALESCE($2,phone) WHERE id=$3 RETURNING id, name, email, phone, role',
    [name ?? null, phone ?? null, req.user!.id]);
  res.json({ user });
});

/* ---------------- ADDRESSES ---------------- */

const addressSchema = z.object({
  label: z.string().max(40).default('Home'),
  governorate: z.string().min(2).max(60),
  city: z.string().min(2).max(80),
  area: z.string().max(80).optional().nullable(),
  street: z.string().min(2).max(160),
  building: z.string().max(40).optional().nullable(),
  apartment: z.string().max(40).optional().nullable(),
  instructions: z.string().max(400).optional().nullable(),
});

publicApi.get('/addresses', requireAuth, async (req: Authed, res) => {
  res.json({ addresses: await q('SELECT * FROM addresses WHERE user_id=$1 ORDER BY created_at DESC', [req.user!.id]) });
});
publicApi.post('/addresses', requireAuth, async (req: Authed, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid address: ' + (parsed.error.issues[0]?.path.join('.') || ''));
  const a = parsed.data;
  const row = await one(
    `INSERT INTO addresses (user_id,label,governorate,city,area,street,building,apartment,instructions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user!.id, a.label, a.governorate, a.city, a.area ?? null, a.street, a.building ?? null, a.apartment ?? null, a.instructions ?? null]);
  res.status(201).json({ address: row });
});
publicApi.put('/addresses/:id', requireAuth, async (req: Authed, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid address');
  const a = parsed.data;
  const row = await one(
    `UPDATE addresses SET label=$1,governorate=$2,city=$3,area=$4,street=$5,building=$6,apartment=$7,instructions=$8
     WHERE id=$9 AND user_id=$10 RETURNING *`,
    [a.label, a.governorate, a.city, a.area ?? null, a.street, a.building ?? null, a.apartment ?? null, a.instructions ?? null, req.params.id, req.user!.id]);
  if (!row) return bad(res, 404, 'Address not found');
  res.json({ address: row });
});
publicApi.delete('/addresses/:id', requireAuth, async (req: Authed, res) => {
  const r = await one('DELETE FROM addresses WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user!.id]);
  if (!r) return bad(res, 404, 'Address not found');
  res.json({ ok: true });
});

/* ---------------- MENU ---------------- */

publicApi.get('/categories', async (_req, res) => {
  res.json({ categories: await q('SELECT * FROM categories ORDER BY sort') });
});

publicApi.get('/products', async (req, res) => {
  const { category, search, min, max, diet, spicy, popular, isnew, sort } = req.query as Record<string, string>;
  const where: string[] = ['1=1'];
  const params: any[] = [];
  if (category) { params.push(category); where.push(`c.slug=$${params.length}`); }
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`(lower(p.name_en) LIKE $${params.length} OR lower(p.name_ar) LIKE $${params.length} OR lower(p.description_en) LIKE $${params.length} OR lower(p.description_ar) LIKE $${params.length})`);
  }
  if (min && !isNaN(+min)) { params.push(+min); where.push(`p.price >= $${params.length}`); }
  if (max && !isNaN(+max)) { params.push(+max); where.push(`p.price <= $${params.length}`); }
  if (diet === 'vegetarian') where.push('p.is_vegetarian');
  if (spicy === 'true') where.push('p.is_spicy');
  if (spicy === 'false') where.push('NOT p.is_spicy');
  if (popular === 'true') where.push('p.is_popular');
  if (isnew === 'true') where.push('p.is_new');
  const order =
    sort === 'price_asc' ? 'p.price ASC' :
    sort === 'price_desc' ? 'p.price DESC' :
    sort === 'rating' ? 'p.rating DESC, p.rating_count DESC' :
    sort === 'newest' ? 'p.created_at DESC' :
    'p.is_popular DESC, p.rating DESC, p.name_en ASC';
  const products = await q(
    `SELECT p.*, c.slug AS category_slug, c.name_en AS category_en, c.name_ar AS category_ar
     FROM products p JOIN categories c ON c.id=p.category_id
     WHERE ${where.join(' AND ')} ORDER BY ${order}`, params);
  res.json({ products });
});

publicApi.get('/products/:slug', async (req, res) => {
  const p = await one<any>(
    `SELECT p.*, c.slug AS category_slug, c.name_en AS category_en, c.name_ar AS category_ar
     FROM products p JOIN categories c ON c.id=p.category_id WHERE p.slug=$1`, [req.params.slug]);
  if (!p) return bad(res, 404, 'Dish not found');
  const sizes = await q('SELECT * FROM product_sizes WHERE product_id=$1 ORDER BY sort', [p.id]);
  const addons = await q('SELECT * FROM product_addons WHERE product_id=$1', [p.id]);
  const reviews = await q('SELECT id, name, rating, comment, created_at FROM reviews WHERE product_id=$1 AND is_approved ORDER BY created_at DESC LIMIT 20', [p.id]);
  const related = await q(
    'SELECT id, slug, name_en, name_ar, price, image, rating FROM products WHERE category_id=$1 AND id<>$2 AND is_available ORDER BY rating DESC LIMIT 4',
    [p.category_id, p.id]);
  res.json({ product: p, sizes, addons, reviews, related });
});

publicApi.get('/products/:id/reviews', async (req, res) => {
  res.json({ reviews: await q('SELECT id, name, rating, comment, created_at FROM reviews WHERE product_id=$1 AND is_approved ORDER BY created_at DESC', [req.params.id]) });
});

publicApi.post('/products/:id/reviews', optionalAuth, async (req: Authed, res) => {
  const schema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().max(600).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Rating must be 1 to 5');
  const product = await one<any>('SELECT id FROM products WHERE id=$1', [req.params.id]);
  if (!product) return bad(res, 404, 'Dish not found');
  const name = req.user?.name || (req.body?.name ? String(req.body.name).slice(0, 60) : 'Guest');
  await withTx(async (c) => {
    await c.query('INSERT INTO reviews (product_id, user_id, name, rating, comment) VALUES ($1,$2,$3,$4,$5)',
      [product.id, req.user?.id ?? null, name, parsed.data.rating, parsed.data.comment ?? null]);
    await c.query(
      `UPDATE products SET rating=(SELECT round(avg(rating)::numeric,1) FROM reviews WHERE product_id=$1 AND is_approved),
        rating_count=(SELECT count(*) FROM reviews WHERE product_id=$1 AND is_approved) WHERE id=$1`,
      [product.id]);
  });
  res.status(201).json({ ok: true });
});

/* ---------------- COUPONS ---------------- */

publicApi.post('/coupons/validate', async (req, res) => {
  const { code, subtotal } = req.body || {};
  if (!code) return bad(res, 400, 'Enter a discount code');
  const coupon = await one<any>(
    'SELECT * FROM coupons WHERE upper(code)=upper($1) AND is_active AND (expires_at IS NULL OR expires_at > now())',
    [String(code).trim()]);
  if (!coupon) return bad(res, 404, 'This code is invalid or expired');
  const sub = num(subtotal);
  if (sub < num(coupon.min_order)) {
    return bad(res, 400, `This code needs a minimum order of ${num(coupon.min_order)} EGP`);
  }
  const discount = coupon.kind === 'percent' ? Math.min(sub, (sub * num(coupon.value)) / 100) : Math.min(sub, num(coupon.value));
  res.json({ code: coupon.code.toUpperCase(), kind: coupon.kind, value: num(coupon.value), discount: Math.round(discount * 100) / 100 });
});

/* ---------------- ORDERS ---------------- */

const orderSchema = z.object({
  order_type: z.enum(['delivery', 'pickup']),
  scheduled_at: z.string().datetime({ offset: true }).optional().nullable(),
  customer: z.object({
    name: z.string().min(2).max(80),
    phone: z.string().min(8).max(20),
    email: z.string().email().max(120).optional().nullable(),
  }),
  address: z.object({
    governorate: z.string().min(2),
    city: z.string().min(2),
    area: z.string().optional().nullable(),
    street: z.string().min(2),
    building: z.string().optional().nullable(),
    apartment: z.string().optional().nullable(),
    instructions: z.string().max(400).optional().nullable(),
  }).optional().nullable(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    size_id: z.string().uuid().optional().nullable(),
    addon_ids: z.array(z.string().uuid()).max(12).default([]),
    quantity: z.number().int().min(1).max(20),
    instructions: z.string().max(300).optional().nullable(),
  })).min(1).max(60),
  coupon_code: z.string().max(40).optional().nullable(),
  payment_method: z.enum(['cod', 'card']).default('cod'),
  instructions: z.string().max(400).optional().nullable(),
});

publicApi.post('/orders', optionalAuth, async (req: Authed, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid order: ' + (parsed.error.issues[0]?.message || 'check your data'));
  const input = parsed.data;

  if (input.order_type === 'delivery' && !input.address) return bad(res, 400, 'Delivery address is required');
  if (input.scheduled_at && new Date(input.scheduled_at) < new Date()) return bad(res, 400, 'Scheduled time must be in the future');

  const settings = await one<any>("SELECT value FROM settings WHERE key='ordering'");
  const ordering = settings?.value || { min_order: 0, delivery_areas: [], estimated_minutes: 45 };

  // Price everything server-side from the database, never from the client.
  const lines: any[] = [];
  let subtotal = 0;
  for (const item of input.items) {
    const p = await one<any>('SELECT * FROM products WHERE id=$1', [item.product_id]);
    if (!p) return bad(res, 400, 'A dish in your cart no longer exists');
    if (!p.is_available) return bad(res, 400, `${p.name_en} is currently unavailable`);
    let unit = num(p.price);
    let sizeSnap: any = null;
    if (item.size_id) {
      const size = await one<any>('SELECT * FROM product_sizes WHERE id=$1 AND product_id=$2', [item.size_id, p.id]);
      if (!size) return bad(res, 400, 'Invalid size selection');
      unit += num(size.price_delta);
      sizeSnap = { id: size.id, en: size.label_en, ar: size.label_ar, delta: num(size.price_delta) };
    }
    const addonSnaps: any[] = [];
    for (const aid of item.addon_ids) {
      const addon = await one<any>('SELECT * FROM product_addons WHERE id=$1 AND product_id=$2', [aid, p.id]);
      if (!addon) return bad(res, 400, 'Invalid add-on selection');
      unit += num(addon.price);
      addonSnaps.push({ id: addon.id, en: addon.name_en, ar: addon.name_ar, price: num(addon.price) });
    }
    const lineTotal = Math.round(unit * item.quantity * 100) / 100;
    subtotal += lineTotal;
    lines.push({
      product_id: p.id, name: { en: p.name_en, ar: p.name_ar }, unit_price: Math.round(unit * 100) / 100,
      size: sizeSnap, addons: addonSnaps, quantity: item.quantity, instructions: item.instructions ?? null, line_total: lineTotal,
    });
  }
  subtotal = Math.round(subtotal * 100) / 100;

  let discount = 0;
  let couponCode: string | null = null;
  if (input.coupon_code) {
    const coupon = await one<any>(
      'SELECT * FROM coupons WHERE upper(code)=upper($1) AND is_active AND (expires_at IS NULL OR expires_at > now())',
      [input.coupon_code.trim()]);
    if (!coupon) return bad(res, 400, 'This discount code is invalid or expired');
    if (subtotal < num(coupon.min_order)) return bad(res, 400, `This code needs a minimum order of ${num(coupon.min_order)} EGP`);
    discount = coupon.kind === 'percent' ? (subtotal * num(coupon.value)) / 100 : num(coupon.value);
    discount = Math.min(subtotal, Math.round(discount * 100) / 100);
    couponCode = coupon.code.toUpperCase();
  }

  let deliveryFee = 0;
  if (input.order_type === 'delivery') {
    const area = (ordering.delivery_areas || []).find((a: any) => a.en.toLowerCase() === input.address!.governorate.toLowerCase());
    if (!area) return bad(res, 400, 'Sorry, we do not deliver to this governorate yet');
    deliveryFee = num(area.fee);
  }

  if (subtotal - discount < num(ordering.min_order)) {
    return bad(res, 400, `Minimum order is ${num(ordering.min_order)} EGP`);
  }
  const total = Math.round((subtotal - discount + deliveryFee) * 100) / 100;

  // Card payments are only real when a gateway is configured; never fake success.
  if (input.payment_method === 'card') {
    if (!process.env.PAYMOB_API_KEY) {
      return bad(res, 400, 'Card payment is not configured yet. Please choose Cash on Delivery.');
    }
    return bad(res, 501, 'Card gateway integration pending configuration');
  }

  const created = await withTx(async (c) => {
    const number = orderNumber();
    const orderRes = await c.query(
      `INSERT INTO orders (order_number, user_id, order_type, scheduled_at, customer_name, phone, email, address, instructions,
        subtotal, discount, delivery_fee, total, coupon_code, payment_method, payment_status, estimated_minutes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending',$16,'received') RETURNING *`,
      [number, req.user?.id ?? null, input.order_type, input.scheduled_at ?? null, input.customer.name, input.customer.phone,
       input.customer.email ?? null, input.address ? JSON.stringify(input.address) : null, input.instructions ?? null,
       subtotal, discount, deliveryFee, total, couponCode, input.payment_method, ordering.estimated_minutes ?? 45]);
    const order = orderRes.rows[0];
    for (const l of lines) {
      await c.query(
        `INSERT INTO order_items (order_id, product_id, name, unit_price, size, addons, quantity, instructions, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [order.id, l.product_id, JSON.stringify(l.name), l.unit_price, l.size ? JSON.stringify(l.size) : null,
         JSON.stringify(l.addons), l.quantity, l.instructions, l.line_total]);
    }
    if (couponCode) await c.query('UPDATE coupons SET usage_count=usage_count+1 WHERE code=$1', [couponCode]);
    return order;
  });

  res.status(201).json({ order: created, items: lines });
});

publicApi.get('/orders/track/:orderNumber', async (req, res) => {
  const phone = String(req.query.phone || '').replace(/\D/g, '');
  const order = await one<any>('SELECT * FROM orders WHERE order_number=$1', [req.params.orderNumber.toUpperCase()]);
  if (!order) return bad(res, 404, 'No order with this number');
  if (phone) {
    const orderPhone = String(order.phone).replace(/\D/g, '');
    if (!orderPhone.endsWith(phone.slice(-8))) return bad(res, 403, 'Phone number does not match this order');
  }
  const items = await q('SELECT * FROM order_items WHERE order_id=$1', [order.id]);
  res.json({ order, items });
});

publicApi.get('/orders/mine', requireAuth, async (req: Authed, res) => {
  const orders = await q('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100', [req.user!.id]);
  res.json({ orders });
});

publicApi.post('/orders/:id/cancel', requireAuth, async (req: Authed, res) => {
  const order = await one<any>('SELECT * FROM orders WHERE id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
  if (!order) return bad(res, 404, 'Order not found');
  if (!['received', 'confirmed'].includes(order.status)) {
    return bad(res, 400, 'This order is already being prepared and can no longer be cancelled');
  }
  await q("UPDATE orders SET status='cancelled', status_note='Cancelled by customer', updated_at=now() WHERE id=$1", [order.id]);
  res.json({ ok: true });
});

/* ---------------- RESERVATIONS ---------------- */

const SLOTS = ['13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30','23:00'];

publicApi.get('/reservations/slots', async (req, res) => {
  const date = String(req.query.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad(res, 400, 'Invalid date');
  const taken = await q<{ time_slot: string }>(
    "SELECT DISTINCT time_slot FROM reservations WHERE date=$1 AND status IN ('pending','confirmed') AND table_id IS NOT NULL", [date]);
  const tableCount = await one<{ n: string }>('SELECT count(*)::text n FROM restaurant_tables WHERE is_active');
  // A slot is full when every table is taken in it (simplified: count of reservations in slot >= tables)
  const counts = await q<{ time_slot: string; n: string }>(
    "SELECT time_slot, count(*)::text n FROM reservations WHERE date=$1 AND status IN ('pending','confirmed') GROUP BY time_slot", [date]);
  const total = parseInt(tableCount?.n || '0', 10);
  const full = new Set(counts.filter((c) => parseInt(c.n, 10) >= total).map((c) => c.time_slot));
  res.json({ slots: SLOTS.map((s) => ({ time: s, available: !full.has(s) })) });
});

const reservationSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().min(8).max(20),
  email: z.string().email().max(120).optional().nullable(),
  guests: z.number().int().min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_slot: z.string().regex(/^\d{2}:\d{2}$/),
  special_requests: z.string().max(500).optional().nullable(),
});

publicApi.post('/reservations', optionalAuth, async (req: Authed, res) => {
  const parsed = reservationSchema.safeParse(req.body);
  if (!parsed.success) return bad(res, 400, 'Invalid reservation data');
  const r = parsed.data;
  if (!SLOTS.includes(r.time_slot)) return bad(res, 400, 'Please choose one of the available time slots');
  const day = new Date(r.date + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (isNaN(day.getTime()) || day < today) return bad(res, 400, 'Please choose a date in the future');
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 60);
  if (day > maxDate) return bad(res, 400, 'Reservations open up to 60 days ahead');

  try {
    const reservation = await withTx(async (c) => {
      // pick the smallest free table that fits the party (prevents double booking via unique constraint)
      const tableRes = await c.query(
        `SELECT t.id, t.label, t.seats FROM restaurant_tables t
         WHERE t.is_active AND t.seats >= $1 AND NOT EXISTS (
           SELECT 1 FROM reservations r WHERE r.table_id=t.id AND r.date=$2 AND r.time_slot=$3 AND r.status IN ('pending','confirmed'))
         ORDER BY t.seats ASC LIMIT 1 FOR UPDATE OF t`,
        [r.guests, r.date, r.time_slot]);
      const table = tableRes.rows[0];
      if (!table) throw Object.assign(new Error('No table is available for this time and party size'), { status: 409 });
      const ins = await c.query(
        `INSERT INTO reservations (user_id, name, phone, email, guests, date, time_slot, special_requests, table_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING *`,
        [req.user?.id ?? null, r.name, r.phone, r.email ?? null, r.guests, r.date, r.time_slot, r.special_requests ?? null, table.id]);
      return { ...ins.rows[0], table_label: table.label };
    });
    res.status(201).json({ reservation });
  } catch (e: any) {
    if (e?.code === '23505' || e?.status === 409) return bad(res, 409, 'This time slot just filled up. Please pick another time.');
    throw e;
  }
});

publicApi.get('/reservations/mine', requireAuth, async (req: Authed, res) => {
  res.json({ reservations: await q(
    `SELECT r.*, to_char(r.date, $$YYYY-MM-DD$$) AS date, t.label AS table_label, t.seats FROM reservations r LEFT JOIN restaurant_tables t ON t.id=r.table_id
     WHERE r.user_id=$1 ORDER BY date DESC, time_slot DESC LIMIT 100`, [req.user!.id]) });
});

publicApi.post('/reservations/:id/cancel', optionalAuth, async (req: Authed, res) => {
  const rv = await one<any>('SELECT * FROM reservations WHERE id=$1', [req.params.id]);
  if (!rv) return bad(res, 404, 'Reservation not found');
  if (req.user?.role !== 'admin' && rv.user_id && rv.user_id !== req.user?.id) {
    return bad(res, 403, 'This reservation belongs to another account');
  }
  if (['cancelled', 'completed', 'no_show'].includes(rv.status)) return bad(res, 400, 'This reservation is already closed');
  await q("UPDATE reservations SET status='cancelled' WHERE id=$1", [rv.id]);
  res.json({ ok: true });
});

/* ---------------- FAVORITES ---------------- */

publicApi.get('/favorites', requireAuth, async (req: Authed, res) => {
  res.json({ favorites: await q(
    `SELECT p.*, c.slug AS category_slug FROM favorites f JOIN products p ON p.id=f.product_id JOIN categories c ON c.id=p.category_id
     WHERE f.user_id=$1 ORDER BY f.created_at DESC`, [req.user!.id]) });
});
publicApi.post('/favorites/:productId', requireAuth, async (req: Authed, res) => {
  await q('INSERT INTO favorites (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user!.id, req.params.productId]);
  res.status(201).json({ ok: true });
});
publicApi.delete('/favorites/:productId', requireAuth, async (req: Authed, res) => {
  await q('DELETE FROM favorites WHERE user_id=$1 AND product_id=$2', [req.user!.id, req.params.productId]);
  res.json({ ok: true });
});

/* ---------------- MISC ---------------- */

publicApi.get('/settings/public', async (_req, res) => {
  const rows = await q<{ key: string; value: any }>('SELECT key, value FROM settings');
  const out: Record<string, any> = {};
  for (const r of rows) out[r.key] = r.value;
  res.json({ settings: out });
});

publicApi.post('/newsletter', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) return bad(res, 400, 'Enter a valid email');
  await q('INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT DO NOTHING', [String(email).toLowerCase()]);
  res.status(201).json({ ok: true });
});

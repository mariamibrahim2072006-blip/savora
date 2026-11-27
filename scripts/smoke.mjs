const B = process.env.SMOKE_BASE || 'http://localhost:8091/api';
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name); } };
const j = (r) => r.json();

// health
let r = await fetch(`${B}/health`); ok('health', (await j(r)).ok === true);

// register unique user
const email = `smoke${Date.now()}@test.dev`;
r = await fetch(`${B}/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Smoke Tester', email, phone: '01000000001', password: 'SmokePass1' }) });
const reg = await j(r); ok('register', r.status === 201 && !!reg.token);
const H = { 'content-type': 'application/json', authorization: `Bearer ${reg.token}` };

// login admin
r = await fetch(`${B}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'admin@savora.com', password: process.env.ADMIN_PASSWORD }) });
const adm = await j(r); ok('admin login', r.status === 200 && adm.user?.role === 'admin');
const AH = { 'content-type': 'application/json', authorization: `Bearer ${adm.token}` };

// catalog
r = await fetch(`${B}/products?popular=true`); const prods = (await j(r)).products; ok('products', prods.length >= 5);
const p = prods[0];
r = await fetch(`${B}/products/${p.slug}`); const det = await j(r); ok('product detail', !!det.product?.id);

// coupon
r = await fetch(`${B}/coupons/validate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: 'SAVORA10', subtotal: 500 }) });
const cpn = await j(r); ok('coupon SAVORA10 = 50', Math.abs(cpn.discount - 50) < 0.01);

// order: 2 x product + coupon, delivery to Cairo (fee 40)
const price = parseFloat(p.price);
r = await fetch(`${B}/orders`, { method: 'POST', headers: H, body: JSON.stringify({
  order_type: 'delivery',
  customer: { name: 'Smoke Tester', phone: '01000000001', email },
  address: { governorate: 'Cairo', city: 'Garden City', street: '12 Nile Corniche' },
  items: [{ product_id: p.id, quantity: 2, addon_ids: det.addons?.slice(0, 1).map(a => a.id) || [] }],
  coupon_code: 'SAVORA10', payment_method: 'cod',
})});
const ord = await j(r);
const addonPrice = det.addons?.[0] ? parseFloat(det.addons[0].price) : 0;
const expectedSub = Math.round((price + addonPrice) * 2 * 100) / 100;
const expectedTotal = Math.round((expectedSub * 0.9 + 40) * 100) / 100;
ok('order created', r.status === 201 && !!ord.order?.order_number);
ok(`order math (${ord.order?.total} == ${expectedTotal})`, Math.abs(parseFloat(ord.order?.total) - expectedTotal) < 0.01);

// track
r = await fetch(`${B}/orders/track/${ord.order.order_number}?phone=01000000001`);
ok('track with phone', r.status === 200 && (await j(r)).order.status === 'received');
r = await fetch(`${B}/orders/track/${ord.order.order_number}?phone=01999999999`);
ok('track wrong phone blocked', r.status === 403);

// admin sees and advances it
r = await fetch(`${B}/admin/orders?status=received`, { headers: AH }); const list = (await j(r)).orders;
ok('admin lists order', list.some(o => o.id === ord.order.id));
r = await fetch(`${B}/admin/orders/${ord.order.id}`, { method: 'PATCH', headers: AH, body: JSON.stringify({ status: 'preparing' }) });
ok('admin sets preparing', r.status === 200);

// cancel blocked after preparing
r = await fetch(`${B}/orders/${ord.order.id}/cancel`, { method: 'POST', headers: H });
ok('cancel blocked after preparing', r.status === 400);

// customer cannot access admin
r = await fetch(`${B}/admin/stats`, { headers: H });
ok('role protection', r.status === 403);

// reservation
const d = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
r = await fetch(`${B}/reservations`, { method: 'POST', headers: H, body: JSON.stringify({ name: 'Smoke Tester', phone: '01000000001', guests: 4, date: d, time_slot: '20:00' }) });
const res1 = await j(r); ok('reservation auto-table', r.status === 201 && !!res1.reservation?.table_label);
r = await fetch(`${B}/reservations/slots?date=${d}`); ok('slots', (await j(r)).slots.length === 21);

// favorites
r = await fetch(`${B}/favorites/${p.id}`, { method: 'POST', headers: H }); ok('favorite add', r.status < 300);
r = await fetch(`${B}/favorites`, { headers: H }); ok('favorite list', (await j(r)).favorites.some(f => f.id === p.id));

// review
r = await fetch(`${B}/products/${p.id}/reviews`, { method: 'POST', headers: H, body: JSON.stringify({ rating: 5, comment: 'smoke' }) });
ok('review', r.status === 201);

// card payment honestly rejected (no gateway configured)
r = await fetch(`${B}/orders`, { method: 'POST', headers: H, body: JSON.stringify({
  order_type: 'pickup', customer: { name: 'Smoke Tester', phone: '01000000001' },
  items: [{ product_id: p.id, quantity: 1 }], payment_method: 'card' })});
ok('card gated honestly', r.status === 400);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

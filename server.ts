import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  calculateOrderBreakdown,
  canTransitionOrderStatus,
  filterAndSortProducts,
  PAYMENT_METHOD_LABELS,
  SHIPPING_OPTIONS,
  slugify,
  validateCheckoutInput,
  validateProductInput,
  validateRegistrationInput,
} from './src/lib/marketplace';
import type { OrderStatus, PaymentMethod, SortOption } from './src/types/marketplace';
import {
  createId,
  enrichProducts,
  ensureUserRole,
  getDb,
  hashPassword,
  saveDb,
  toPublicUser,
  verifyPassword,
  type StoredCart,
  type StoredUser,
} from './server/db';

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const SESSION_COOKIE = 'papua_session';
const CART_COOKIE = 'papua_cart_key';
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    try {
      const key = decodeURIComponent(part.slice(0, idx).trim());
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      result[key] = val;
    } catch {
      // Cookie rusak diabaikan agar tidak membuat seluruh API error (penyebab halaman kosong).
    }
  }
  return result;
}

function setCookie(
  res: Response,
  name: string,
  value: string,
  options: { maxAgeSeconds?: number; httpOnly?: boolean } = {},
) {
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    'Path=/',
    'SameSite=Lax',
  ];
  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }
  if (options.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${options.maxAgeSeconds}`);
  }
  const existing = res.getHeader('Set-Cookie');
  const next = parts.join('; ');
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, next]);
  } else if (typeof existing === 'string') {
    res.setHeader('Set-Cookie', [existing, next]);
  } else {
    res.setHeader('Set-Cookie', next);
  }
}

function getAuthenticatedUser(req: Request): StoredUser | null {
  const db = getDb();
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDb();
    return null;
  }
  const user = db.users.find((u) => u.id === session.userId);
  if (!user || !user.isActive) return null;
  return user;
}

function getOrCreateCart(req: Request, res: Response, user: StoredUser | null): StoredCart {
  const db = getDb();
  const cookies = parseCookies(req.headers.cookie);
  let cartKey = cookies[CART_COOKIE];

  if (user) {
    let userCart = db.carts.find((c) => c.userId === user.id);
    if (!userCart && cartKey) {
      const guestCart = db.carts.find((c) => c.sessionKey === cartKey && !c.userId);
      if (guestCart) {
        guestCart.userId = user.id;
        saveDb();
        return guestCart;
      }
    }
    if (!userCart) {
      userCart = {
        id: createId('cart'),
        userId: user.id,
        sessionKey: cartKey || null,
        items: [],
        updatedAt: new Date().toISOString(),
      };
      db.carts.push(userCart);
      saveDb();
    }
    return userCart;
  }

  if (!cartKey) {
    cartKey = crypto.randomBytes(12).toString('hex');
    setCookie(res, CART_COOKIE, cartKey, { maxAgeSeconds: 60 * 60 * 24 * 30 });
  }
  let guestCart = db.carts.find((c) => c.sessionKey === cartKey);
  if (!guestCart) {
    guestCart = {
      id: createId('cart'),
      userId: null,
      sessionKey: cartKey,
      items: [],
      updatedAt: new Date().toISOString(),
    };
    db.carts.push(guestCart);
    saveDb();
  }
  return guestCart;
}

function buildCartResponse(cart: StoredCart) {
  const db = getDb();
  const enriched = enrichProducts(db);
  const productMap = new Map(enriched.map((p) => [p.id, p]));
  const items = cart.items
    .map((ci) => {
      const product = productMap.get(ci.productId);
      if (!product || !product.isActive) return null;
      return {
        productId: ci.productId,
        quantity: Math.min(ci.quantity, Math.max(1, product.stock)),
        product,
        lineTotal: product.price * Math.min(ci.quantity, Math.max(1, product.stock)),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  return { items, subtotal, totalItems };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'papua-market' });
  });

  // Bootstrap application state
  app.get('/api/bootstrap', (req, res) => {
    const db = getDb();
    const user = getAuthenticatedUser(req);
    const cart = getOrCreateCart(req, res, user);
    const cartSummary = buildCartResponse(cart);
    const enriched = enrichProducts(db).filter((p) => p.isActive);
    const seller = user ? db.sellers.find((s) => s.userId === user.id) || null : null;
    const favoriteIds = user
      ? db.favorites.filter((f) => f.userId === user.id).map((f) => f.productId)
      : [];
    const unreadNotifications = user
      ? db.notifications.filter((n) => n.userId === user.id && !n.isRead).length
      : 0;

    res.json({
      user: user ? toPublicUser(user) : null,
      seller,
      categories: db.categories,
      products: enriched,
      commissionRate: db.platformSettings.commissionRate,
      cartCount: cartSummary.totalItems,
      favoriteIds,
      unreadNotifications,
    });
  });

  // Auth: Register Buyer or Seller
  app.post('/api/auth/register', (req, res) => {
    const db = getDb();
    const body = req.body || {};
    const role = body.role === 'seller' ? 'seller' : 'buyer';
    const check = validateRegistrationInput({
      name: body.name,
      email: body.email,
      password: body.password,
      phone: body.phone,
      role,
      storeName: body.storeName,
      originCity: body.originCity,
    });
    if (!check.valid) {
      res.status(400).json({ error: check.error });
      return;
    }

    const email = String(body.email).trim().toLowerCase();
    if (db.users.some((u) => u.email === email)) {
      res.status(409).json({ error: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.' });
      return;
    }

    const now = new Date().toISOString();
    const newUser: StoredUser = {
      id: createId('usr'),
      name: String(body.name).trim(),
      email,
      passwordHash: hashPassword(String(body.password)),
      phone: String(body.phone).trim(),
      role,
      isActive: true,
      createdAt: now,
    };
    db.users.push(newUser);

    let seller = null;
    if (role === 'seller') {
      seller = {
        id: createId('sel'),
        userId: newUser.id,
        storeName: String(body.storeName).trim(),
        originCity: String(body.originCity).trim(),
        description:
          String(body.storeDescription || '').trim() ||
          `UMKM lokal Papua dari ${String(body.originCity).trim()}.`,
        packageTier: 'reguler' as const,
        isVerified: true,
        createdAt: now,
      };
      db.sellers.push(seller);
    }

    // Merge guest cart if present
    const cookies = parseCookies(req.headers.cookie);
    const guestKey = cookies[CART_COOKIE];
    if (guestKey) {
      const guestCart = db.carts.find((c) => c.sessionKey === guestKey && !c.userId);
      if (guestCart) {
        guestCart.userId = newUser.id;
      }
    }

    const token = crypto.randomBytes(24).toString('hex');
    db.sessions.push({
      token,
      userId: newUser.id,
      createdAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    db.notifications.push({
      id: createId('notif'),
      userId: newUser.id,
      title: 'Selamat Datang di PAPUA MARKET',
      message:
        role === 'seller'
          ? `Toko "${seller?.storeName}" berhasil dibuat. Mulai unggah produk lokal Papua Anda!`
          : 'Akun pembeli berhasil dibuat. Selamat berbelanja produk asli UMKM Papua.',
      isRead: false,
      createdAt: now,
    });
    saveDb();

    setCookie(res, SESSION_COOKIE, token, { maxAgeSeconds: 7 * 24 * 60 * 60 });
    res.status(201).json({ user: toPublicUser(newUser), seller });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const db = getDb();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
      return;
    }

    const user = db.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ error: 'Akun ini sedang dinonaktifkan oleh administrator.' });
      return;
    }

    const now = new Date().toISOString();
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions.push({
      token,
      userId: user.id,
      createdAt: now,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Merge guest cart items into user's cart
    const cookies = parseCookies(req.headers.cookie);
    const guestKey = cookies[CART_COOKIE];
    if (guestKey) {
      const guestCart = db.carts.find((c) => c.sessionKey === guestKey && !c.userId);
      if (guestCart && guestCart.items.length > 0) {
        let userCart = db.carts.find((c) => c.userId === user.id);
        if (!userCart) {
          guestCart.userId = user.id;
        } else {
          for (const gi of guestCart.items) {
            const existing = userCart.items.find((ui) => ui.productId === gi.productId);
            if (existing) existing.quantity += gi.quantity;
            else userCart.items.push({ ...gi });
          }
          db.carts = db.carts.filter((c) => c.id !== guestCart.id);
        }
      }
    }

    saveDb();
    setCookie(res, SESSION_COOKIE, token, { maxAgeSeconds: 7 * 24 * 60 * 60 });
    const seller = db.sellers.find((s) => s.userId === user.id) || null;
    res.json({ user: toPublicUser(user), seller });
  });

  // Auth: Logout
  app.post('/api/auth/logout', (req, res) => {
    const db = getDb();
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (token) {
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDb();
    }
    setCookie(res, SESSION_COOKIE, '', { maxAgeSeconds: 0 });
    res.json({ ok: true });
  });

  // Public Catalog
  app.get('/api/products', (req, res) => {
    const db = getDb();
    const enriched = enrichProducts(db);
    const filtered = filterAndSortProducts(enriched, {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : null,
      sortBy: (typeof req.query.sortBy === 'string' ? req.query.sortBy : 'popular') as SortOption,
    });
    res.json({ products: filtered });
  });

  // Product Detail
  app.get('/api/products/:id', (req, res) => {
    const db = getDb();
    const enriched = enrichProducts(db);
    const product = enriched.find((p) => p.id === req.params.id && p.isActive);
    if (!product) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }
    const seller = db.sellers.find((s) => s.id === product.sellerId) || null;
    const reviews = db.reviews
      .filter((r) => r.productId === product.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ product, seller, reviews });
  });

  // Submit Review
  app.post('/api/products/:id/reviews', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Silakan masuk untuk memberikan ulasan produk.' });
      return;
    }
    const db = getDb();
    const product = db.products.find((p) => p.id === req.params.id && p.isActive);
    if (!product) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }
    const rating = Math.min(5, Math.max(1, Math.round(Number(req.body?.rating) || 5)));
    const comment = String(req.body?.comment || '').trim();
    if (comment.length < 5) {
      res.status(400).json({ error: 'Ulasan minimal 5 karakter.' });
      return;
    }
    const review = {
      id: createId('rev'),
      productId: product.id,
      userId: user.id,
      reviewerName: user.name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(review);
    saveDb();
    res.status(201).json({ review });
  });

  // Toggle Favorite
  app.post('/api/favorites/toggle', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Silakan masuk untuk menyimpan produk favorit.' });
      return;
    }
    const productId = String(req.body?.productId || '');
    const db = getDb();
    if (!db.products.some((p) => p.id === productId)) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }
    const existingIdx = db.favorites.findIndex(
      (f) => f.userId === user.id && f.productId === productId,
    );
    let isFavorite = false;
    if (existingIdx >= 0) {
      db.favorites.splice(existingIdx, 1);
      isFavorite = false;
    } else {
      db.favorites.push({
        userId: user.id,
        productId,
        createdAt: new Date().toISOString(),
      });
      isFavorite = true;
    }
    saveDb();
    const favoriteIds = db.favorites.filter((f) => f.userId === user.id).map((f) => f.productId);
    res.json({ isFavorite, favoriteIds });
  });

  // Cart endpoints
  app.get('/api/cart', (req, res) => {
    const user = getAuthenticatedUser(req);
    const cart = getOrCreateCart(req, res, user);
    res.json(buildCartResponse(cart));
  });

  app.post('/api/cart/items', (req, res) => {
    const db = getDb();
    const user = getAuthenticatedUser(req);
    const cart = getOrCreateCart(req, res, user);
    const productId = String(req.body?.productId || '');
    const quantity = Math.max(1, Math.floor(Number(req.body?.quantity) || 1));

    const product = db.products.find((p) => p.id === productId && p.isActive);
    if (!product) {
      res.status(404).json({ error: 'Produk tidak tersedia.' });
      return;
    }
    if (product.stock < 1) {
      res.status(400).json({ error: 'Maaf, stok produk sedang habis.' });
      return;
    }

    const existing = cart.items.find((i) => i.productId === productId);
    const nextQty = (existing ? existing.quantity : 0) + quantity;
    if (nextQty > product.stock) {
      res.status(400).json({ error: `Jumlah melebihi stok tersedia (${product.stock}).` });
      return;
    }
    if (existing) {
      existing.quantity = nextQty;
    } else {
      cart.items.push({ productId, quantity });
    }
    cart.updatedAt = new Date().toISOString();
    saveDb();
    res.json(buildCartResponse(cart));
  });

  app.patch('/api/cart/items/:productId', (req, res) => {
    const db = getDb();
    const user = getAuthenticatedUser(req);
    const cart = getOrCreateCart(req, res, user);
    const productId = req.params.productId;
    const quantity = Math.floor(Number(req.body?.quantity) || 0);

    const product = db.products.find((p) => p.id === productId && p.isActive);
    if (!product) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }
    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.productId !== productId);
    } else if (quantity > product.stock) {
      res.status(400).json({ error: `Stok tersisa hanya ${product.stock} unit.` });
      return;
    } else {
      const existing = cart.items.find((i) => i.productId === productId);
      if (existing) existing.quantity = quantity;
      else cart.items.push({ productId, quantity });
    }
    cart.updatedAt = new Date().toISOString();
    saveDb();
    res.json(buildCartResponse(cart));
  });

  app.delete('/api/cart/items/:productId', (req, res) => {
    const user = getAuthenticatedUser(req);
    const cart = getOrCreateCart(req, res, user);
    cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
    cart.updatedAt = new Date().toISOString();
    saveDb();
    res.json(buildCartResponse(cart));
  });

  // Checkout
  app.post('/api/checkout', (req, res) => {
    const db = getDb();
    const user = getAuthenticatedUser(req);
    const cart = getOrCreateCart(req, res, user);
    const body = req.body || {};

    const validation = validateCheckoutInput({
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerPhone: body.buyerPhone,
      shippingAddress: body.shippingAddress,
      shippingCity: body.shippingCity,
      shippingProvince: body.shippingProvince,
      shippingPostalCode: body.shippingPostalCode,
      shippingMethodId: body.shippingMethodId,
      paymentMethod: body.paymentMethod,
    });
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    if (cart.items.length === 0) {
      res.status(400).json({ error: 'Keranjang belanja masih kosong.' });
      return;
    }

    // Verify stock for every item
    const orderItemsInput: Array<{
      productId: string;
      sellerId: string;
      productName: string;
      imageUrl: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }> = [];

    for (const ci of cart.items) {
      const product = db.products.find((p) => p.id === ci.productId && p.isActive);
      if (!product) {
        res.status(400).json({ error: 'Salah satu produk di keranjang sudah tidak tersedia.' });
        return;
      }
      if (product.stock < ci.quantity) {
        res.status(400).json({
          error: `Stok "${product.name}" tidak mencukupi (tersisa ${product.stock}).`,
        });
        return;
      }
      orderItemsInput.push({
        productId: product.id,
        sellerId: product.sellerId,
        productName: product.name,
        imageUrl: product.imageUrl,
        unitPrice: product.price,
        quantity: ci.quantity,
        subtotal: product.price * ci.quantity,
      });
    }

    const shippingOption = SHIPPING_OPTIONS.find((s) => s.id === body.shippingMethodId)!;
    const paymentMethod = body.paymentMethod as PaymentMethod;
    const breakdown = calculateOrderBreakdown(
      orderItemsInput,
      shippingOption.cost,
      db.platformSettings.commissionRate,
    );

    const now = new Date().toISOString();
    const orderId = createId('ord');
    const dateStamp = now.slice(0, 10).replace(/-/g, '');
    const orderNumber = `PM-${dateStamp}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Deduct stock & increment soldCount
    for (const item of orderItemsInput) {
      const product = db.products.find((p) => p.id === item.productId)!;
      product.stock -= item.quantity;
      product.soldCount += item.quantity;
    }

    const order: (typeof db.orders)[number] = {
      id: orderId,
      orderNumber,
      buyerId: user?.id || null,
      buyerName: String(body.buyerName).trim(),
      buyerEmail: String(body.buyerEmail).trim().toLowerCase(),
      buyerPhone: String(body.buyerPhone).trim(),
      shippingAddress: String(body.shippingAddress).trim(),
      shippingCity: String(body.shippingCity).trim(),
      shippingProvince: String(body.shippingProvince).trim(),
      shippingPostalCode: String(body.shippingPostalCode).trim(),
      shippingMethod: shippingOption.name,
      shippingCost: shippingOption.cost,
      subtotal: breakdown.subtotal,
      commissionRate: breakdown.commissionRate,
      commissionAmount: breakdown.commissionAmount,
      totalAmount: breakdown.totalAmount,
      status: 'menunggu',
      createdAt: now,
      items: orderItemsInput.map((item) => ({
        id: createId('oi'),
        orderId,
        ...item,
      })),
      payment: {
        id: createId('pay'),
        orderId,
        method: paymentMethod,
        amount: breakdown.totalAmount,
        status: paymentMethod === 'cod' ? 'cod_bayar_ditempat' : 'simulasi_terkonfirmasi',
        referenceCode: `SIM-${paymentMethod.toUpperCase()}-${Math.floor(100000 + Math.random() * 899999)}`,
        isSimulated: true,
        createdAt: now,
      },
    };

    db.orders.unshift(order);

    // Save address for logged-in buyer if requested
    if (user && body.saveAddress) {
      db.addresses.push({
        id: createId('addr'),
        userId: user.id,
        recipientName: order.buyerName,
        phone: order.buyerPhone,
        streetAddress: order.shippingAddress,
        city: order.shippingCity,
        province: order.shippingProvince,
        postalCode: order.shippingPostalCode,
        isDefault: db.addresses.filter((a) => a.userId === user.id).length === 0,
      });
    }

    // Create notifications for buyer and involved sellers
    if (user) {
      db.notifications.unshift({
        id: createId('notif'),
        userId: user.id,
        title: `Pesanan ${orderNumber} Dibuat (Simulasi)`,
        message: `Pesanan Anda senilai Rp ${breakdown.totalAmount.toLocaleString('id-ID')} via ${PAYMENT_METHOD_LABELS[paymentMethod]} menunggu diproses penjual.`,
        isRead: false,
        createdAt: now,
      });
    }

    const sellerIds = [...new Set(orderItemsInput.map((i) => i.sellerId))];
    for (const sid of sellerIds) {
      const seller = db.sellers.find((s) => s.id === sid);
      if (seller) {
        db.notifications.unshift({
          id: createId('notif'),
          userId: seller.userId,
          title: `Pesanan Baru ${orderNumber}`,
          message: `Ada pesanan masuk dari ${order.buyerName} (${order.shippingCity}). Segera proses pengemasan.`,
          isRead: false,
          createdAt: now,
        });
      }
    }

    // Clear cart
    cart.items = [];
    cart.updatedAt = now;
    saveDb();

    res.status(201).json({ order });
  });

  // Buyer Dashboard
  app.get('/api/buyer/dashboard', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Silakan masuk untuk membuka Dashboard Pembeli.' });
      return;
    }
    const db = getDb();
    const orders = db.orders.filter(
      (o) => o.buyerId === user.id || o.buyerEmail === user.email,
    );
    const addresses = db.addresses.filter((a) => a.userId === user.id);
    const notifications = db.notifications.filter((n) => n.userId === user.id);
    const favIds = new Set(
      db.favorites.filter((f) => f.userId === user.id).map((f) => f.productId),
    );
    const favorites = enrichProducts(db).filter((p) => favIds.has(p.id) && p.isActive);

    res.json({
      profile: toPublicUser(user),
      orders,
      addresses,
      notifications,
      favorites,
    });
  });

  app.post('/api/buyer/addresses', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Akses ditolak.' });
      return;
    }
    const body = req.body || {};
    if (
      String(body.recipientName || '').trim().length < 3 ||
      String(body.streetAddress || '').trim().length < 8 ||
      String(body.city || '').trim().length < 2 ||
      String(body.province || '').trim().length < 2 ||
      !/^\d{5}$/.test(String(body.postalCode || '').trim())
    ) {
      res.status(400).json({ error: 'Lengkapi data alamat pengiriman dengan kode pos 5 digit.' });
      return;
    }
    const db = getDb();
    const newAddr = {
      id: createId('addr'),
      userId: user.id,
      recipientName: String(body.recipientName).trim(),
      phone: String(body.phone || user.phone).trim(),
      streetAddress: String(body.streetAddress).trim(),
      city: String(body.city).trim(),
      province: String(body.province).trim(),
      postalCode: String(body.postalCode).trim(),
      isDefault: db.addresses.filter((a) => a.userId === user.id).length === 0,
    };
    db.addresses.push(newAddr);
    saveDb();
    res.status(201).json({ address: newAddr });
  });

  app.post('/api/notifications/read', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = getDb();
    for (const n of db.notifications) {
      if (n.userId === user.id) n.isRead = true;
    }
    saveDb();
    res.json({ ok: true });
  });

  app.patch('/api/buyer/orders/:orderId/confirm', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = getDb();
    const order = db.orders.find(
      (o) => o.id === req.params.orderId && (o.buyerId === user.id || o.buyerEmail === user.email),
    );
    if (!order) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      return;
    }
    if (!canTransitionOrderStatus(order.status, 'selesai', 'buyer')) {
      res.status(400).json({ error: 'Pesanan hanya bisa dikonfirmasi selesai setelah dikirim.' });
      return;
    }
    order.status = 'selesai';
    saveDb();
    res.json({ order });
  });

  // Seller Dashboard & CRUD
  app.get('/api/seller/dashboard', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['seller', 'admin'])) {
      res.status(403).json({ error: 'Hanya akun Penjual yang dapat mengakses Dashboard Penjual.' });
      return;
    }
    const db = getDb();
    const seller = db.sellers.find((s) => s.userId === user!.id);
    if (!seller) {
      res.status(404).json({ error: 'Profil toko penjual belum terdaftar.' });
      return;
    }
    const products = enrichProducts(db).filter((p) => p.sellerId === seller.id);
    const sellerOrders = db.orders
      .filter((o) => o.items.some((i) => i.sellerId === seller.id))
      .map((o) => ({
        ...o,
        sellerItems: o.items.filter((i) => i.sellerId === seller.id),
      }));

    const grossRevenue = sellerOrders
      .filter((o) => o.status !== 'dibatalkan')
      .reduce((sum, o) => sum + o.sellerItems.reduce((s, item) => s + item.subtotal, 0), 0);
    const commissionDeducted = Math.round(
      (grossRevenue * db.platformSettings.commissionRate) / 100,
    );
    const netRevenue = grossRevenue - commissionDeducted;
    const totalSold = products.reduce((sum, p) => sum + p.soldCount, 0);

    res.json({
      seller,
      products,
      orders: sellerOrders,
      stats: {
        totalProducts: products.length,
        totalOrders: sellerOrders.length,
        totalSold,
        grossRevenue,
        commissionRate: db.platformSettings.commissionRate,
        commissionDeducted,
        netRevenue,
      },
    });
  });

  app.put('/api/seller/store', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['seller', 'admin'])) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = getDb();
    const seller = db.sellers.find((s) => s.userId === user!.id);
    if (!seller) {
      res.status(404).json({ error: 'Toko tidak ditemukan.' });
      return;
    }
    const storeName = String(req.body?.storeName || '').trim();
    const originCity = String(req.body?.originCity || '').trim();
    const description = String(req.body?.description || '').trim();
    const packageTier = req.body?.packageTier === 'premium' ? 'premium' : 'reguler';
    if (storeName.length < 3 || originCity.length < 3) {
      res.status(400).json({ error: 'Nama toko dan kota asal minimal 3 karakter.' });
      return;
    }
    seller.storeName = storeName;
    seller.originCity = originCity;
    seller.description = description;
    seller.packageTier = packageTier;
    saveDb();
    res.json({ seller });
  });

  // Seller Image Upload (Validated Base64 PNG/JPG/WEBP -> /uploads/)
  app.post('/api/seller/upload', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['seller', 'admin'])) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const dataUrl = String(req.body?.dataUrl || '');
    const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({
        error: 'Format gambar tidak valid. Gunakan file JPG, PNG, atau WEBP.',
      });
      return;
    }
    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 2 * 1024 * 1024) {
      res.status(400).json({ error: 'Ukuran gambar maksimal 2 MB.' });
      return;
    }
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const filename = `product_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
    res.status(201).json({ imageUrl: `/uploads/${filename}` });
  });

  app.post('/api/seller/products', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['seller', 'admin'])) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = getDb();
    const seller = db.sellers.find((s) => s.userId === user!.id);
    if (!seller) {
      res.status(404).json({ error: 'Profil toko penjual tidak ditemukan.' });
      return;
    }
    const body = req.body || {};
    const check = validateProductInput({
      name: body.name,
      description: body.description,
      price: Number(body.price),
      stock: Number(body.stock),
      categoryId: body.categoryId,
      originLocation: body.originLocation,
    });
    if (!check.valid) {
      res.status(400).json({ error: check.error });
      return;
    }
    if (!db.categories.some((c) => c.id === body.categoryId)) {
      res.status(400).json({ error: 'Kategori produk tidak valid.' });
      return;
    }

    const imageUrl =
      String(body.imageUrl || '').trim() ||
      '/src/assets/images/prod_noken_wamena_1794826320314.jpg';

    const newProduct = {
      id: createId('prd'),
      sellerId: seller.id,
      categoryId: String(body.categoryId),
      name: String(body.name).trim(),
      slug: slugify(String(body.name)),
      description: String(body.description).trim(),
      price: Math.round(Number(body.price)),
      stock: Math.round(Number(body.stock)),
      originLocation: String(body.originLocation).trim(),
      weightGram: Math.max(50, Math.round(Number(body.weightGram) || 500)),
      imageUrl,
      soldCount: 0,
      isFeatured: false,
      isPromoted: seller.packageTier === 'premium' && Boolean(body.isPromoted),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.products.unshift(newProduct);
    saveDb();
    res.status(201).json({ product: newProduct });
  });

  app.put('/api/seller/products/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['seller', 'admin'])) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = getDb();
    const seller = db.sellers.find((s) => s.userId === user!.id);
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }
    if (user!.role !== 'admin' && (!seller || product.sellerId !== seller.id)) {
      res.status(403).json({ error: 'Anda tidak memiliki akses ke produk ini.' });
      return;
    }

    const body = req.body || {};
    const check = validateProductInput({
      name: body.name,
      description: body.description,
      price: Number(body.price),
      stock: Number(body.stock),
      categoryId: body.categoryId,
      originLocation: body.originLocation,
    });
    if (!check.valid) {
      res.status(400).json({ error: check.error });
      return;
    }

    product.name = String(body.name).trim();
    product.slug = slugify(product.name);
    product.description = String(body.description).trim();
    product.price = Math.round(Number(body.price));
    product.stock = Math.round(Number(body.stock));
    product.categoryId = String(body.categoryId);
    product.originLocation = String(body.originLocation).trim();
    product.weightGram = Math.max(50, Math.round(Number(body.weightGram) || product.weightGram));
    if (body.imageUrl) {
      product.imageUrl = String(body.imageUrl).trim();
    }
    if (typeof body.isActive === 'boolean') {
      product.isActive = body.isActive;
    }
    saveDb();
    res.json({ product });
  });

  app.delete('/api/seller/products/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['seller', 'admin'])) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = getDb();
    const seller = db.sellers.find((s) => s.userId === user!.id);
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }
    if (user!.role !== 'admin' && (!seller || product.sellerId !== seller.id)) {
      res.status(403).json({ error: 'Anda tidak memiliki akses menghapus produk ini.' });
      return;
    }
    db.products = db.products.filter((p) => p.id !== product.id);
    saveDb();
    res.json({ ok: true });
  });

  app.patch('/api/seller/orders/:orderId/status', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['seller', 'admin'])) {
      res.status(403).json({ error: 'Akses ditolak.' });
      return;
    }
    const db = getDb();
    const seller = db.sellers.find((s) => s.userId === user!.id);
    const order = db.orders.find((o) => o.id === req.params.orderId);
    if (!order) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      return;
    }
    if (
      user!.role !== 'admin' &&
      (!seller || !order.items.some((item) => item.sellerId === seller.id))
    ) {
      res.status(403).json({ error: 'Pesanan ini bukan milik toko Anda.' });
      return;
    }
    const nextStatus = req.body?.status as OrderStatus;
    if (!canTransitionOrderStatus(order.status, nextStatus, user!.role)) {
      res.status(400).json({ error: 'Perubahan status pesanan tidak diizinkan.' });
      return;
    }
    order.status = nextStatus;

    if (order.buyerId) {
      db.notifications.unshift({
        id: createId('notif'),
        userId: order.buyerId,
        title: `Update Pesanan ${order.orderNumber}`,
        message: `Status pesanan Anda kini diperbarui menjadi "${nextStatus.toUpperCase()}".`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
    saveDb();
    res.json({ order });
  });

  // Admin Dashboard & Management
  app.get('/api/admin/dashboard', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['admin'])) {
      res.status(403).json({ error: 'Akses khusus Administrator PAPUA MARKET.' });
      return;
    }
    const db = getDb();
    const validOrders = db.orders.filter((o) => o.status !== 'dibatalkan');
    const totalGmv = validOrders.reduce((sum, o) => sum + o.subtotal, 0);
    const totalCommission = validOrders.reduce((sum, o) => sum + o.commissionAmount, 0);

    res.json({
      stats: {
        totalUsers: db.users.length,
        totalBuyers: db.users.filter((u) => u.role === 'buyer').length,
        totalSellers: db.sellers.length,
        totalProducts: db.products.length,
        totalOrders: db.orders.length,
        totalGmv,
        totalCommission,
        commissionRate: db.platformSettings.commissionRate,
      },
      users: db.users.map(toPublicUser),
      sellers: db.sellers,
      categories: db.categories,
      products: enrichProducts(db),
      orders: db.orders,
    });
  });

  app.put('/api/admin/settings', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['admin'])) {
      res.status(403).json({ error: 'Akses khusus Administrator.' });
      return;
    }
    const rate = Number(req.body?.commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 30) {
      res.status(400).json({ error: 'Persentase komisi harus di antara 0% hingga 30%.' });
      return;
    }
    const db = getDb();
    db.platformSettings.commissionRate = Number(rate.toFixed(1));
    saveDb();
    res.json({ commissionRate: db.platformSettings.commissionRate });
  });

  app.post('/api/admin/categories', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['admin'])) {
      res.status(403).json({ error: 'Akses khusus Administrator.' });
      return;
    }
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    if (name.length < 3) {
      res.status(400).json({ error: 'Nama kategori minimal 3 karakter.' });
      return;
    }
    const db = getDb();
    const category = {
      id: createId('cat'),
      name,
      slug: slugify(name),
      description,
    };
    db.categories.push(category);
    saveDb();
    res.status(201).json({ category });
  });

  app.put('/api/admin/categories/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['admin'])) {
      res.status(403).json({ error: 'Akses khusus Administrator.' });
      return;
    }
    const db = getDb();
    const cat = db.categories.find((c) => c.id === req.params.id);
    if (!cat) {
      res.status(404).json({ error: 'Kategori tidak ditemukan.' });
      return;
    }
    const name = String(req.body?.name || '').trim();
    if (name.length < 3) {
      res.status(400).json({ error: 'Nama kategori minimal 3 karakter.' });
      return;
    }
    cat.name = name;
    cat.slug = slugify(name);
    cat.description = String(req.body?.description || cat.description).trim();
    saveDb();
    res.json({ category: cat });
  });

  app.delete('/api/admin/categories/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['admin'])) {
      res.status(403).json({ error: 'Akses khusus Administrator.' });
      return;
    }
    const db = getDb();
    if (db.products.some((p) => p.categoryId === req.params.id)) {
      res.status(400).json({
        error: 'Kategori masih memiliki produk aktif. Pindahkan atau hapus produk terlebih dahulu.',
      });
      return;
    }
    db.categories = db.categories.filter((c) => c.id !== req.params.id);
    saveDb();
    res.json({ ok: true });
  });

  app.patch('/api/admin/products/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['admin'])) {
      res.status(403).json({ error: 'Akses khusus Administrator.' });
      return;
    }
    const db = getDb();
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return;
    }
    if (typeof req.body?.isFeatured === 'boolean') product.isFeatured = req.body.isFeatured;
    if (typeof req.body?.isPromoted === 'boolean') product.isPromoted = req.body.isPromoted;
    if (typeof req.body?.isActive === 'boolean') product.isActive = req.body.isActive;
    saveDb();
    res.json({ product });
  });

  app.patch('/api/admin/users/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['admin'])) {
      res.status(403).json({ error: 'Akses khusus Administrator.' });
      return;
    }
    const db = getDb();
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
      return;
    }
    if (target.id === user!.id && req.body?.isActive === false) {
      res.status(400).json({ error: 'Tidak dapat menonaktifkan akun admin yang sedang digunakan.' });
      return;
    }
    if (typeof req.body?.isActive === 'boolean') {
      target.isActive = req.body.isActive;
    }
    if (['buyer', 'seller', 'admin'].includes(req.body?.role)) {
      target.role = req.body.role;
    }
    saveDb();
    res.json({ user: toPublicUser(target) });
  });

  app.patch('/api/admin/orders/:id', (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!ensureUserRole(user, ['admin'])) {
      res.status(403).json({ error: 'Akses khusus Administrator.' });
      return;
    }
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      return;
    }
    const nextStatus = req.body?.status as OrderStatus;
    if (!canTransitionOrderStatus(order.status, nextStatus, 'admin')) {
      res.status(400).json({ error: 'Status pesanan tidak valid.' });
      return;
    }
    order.status = nextStatus;
    saveDb();
    res.json({ order });
  });

  // Error guard for API
  app.use('/api', (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server PAPUA MARKET.' });
  });

  if (IS_PRODUCTION) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      console.error('Folder dist belum ada. Jalankan "npm run build" terlebih dahulu.');
      process.exit(1);
    }
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`PAPUA MARKET berjalan di http://localhost:${PORT}`);
  });
  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} sedang dipakai. Tutup program lain atau jalankan dengan PORT=3001.`);
    } else {
      console.error('Server gagal berjalan:', err);
    }
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PAPUA MARKET server:', err);
  process.exit(1);
});

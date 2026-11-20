import type {
  EnrichedProduct,
  OrderStatus,
  PaymentMethod,
  ProductFilterOptions,
  ShippingOption,
  UserRole,
} from '../types/marketplace';

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'jne_reguler',
    name: 'JNE Reguler Papua — Nusantara',
    eta: '3–6 hari kerja',
    cost: 35000,
  },
  {
    id: 'jnt_express',
    name: 'J&T Express Udara',
    eta: '2–4 hari kerja',
    cost: 48000,
  },
  {
    id: 'pos_papua_kargo',
    name: 'Pos Indonesia Kargo UMKM Papua',
    eta: '5–8 hari kerja',
    cost: 24000,
  },
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  menunggu: 'Menunggu Diproses',
  diproses: 'Sedang Dikemas Penjual',
  dikirim: 'Dalam Pengiriman',
  selesai: 'Pesanan Selesai',
  dibatalkan: 'Dibatalkan',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transfer_bank: 'Simulasi Transfer Bank (BRI / Mandiri)',
  qris: 'Simulasi QRIS Nasional',
  cod: 'Simulasi COD (Bayar di Tempat)',
};

export function formatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  return 'Rp ' + safeAmount.toLocaleString('id-ID');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export interface OrderBreakdown {
  subtotal: number;
  shippingCost: number;
  commissionRate: number;
  commissionAmount: number;
  sellerNetPayout: number;
  totalAmount: number;
}

export function calculateOrderBreakdown(
  items: Array<{ unitPrice: number; quantity: number }>,
  shippingCost: number,
  commissionRate: number,
): OrderBreakdown {
  const subtotal = items.reduce((sum, item) => {
    const qty = Math.max(0, Math.floor(item.quantity));
    const price = Math.max(0, Math.round(item.unitPrice));
    return sum + price * qty;
  }, 0);

  const safeShipping = Math.max(0, Math.round(shippingCost));
  const clampedRate = Math.min(30, Math.max(0, Number(commissionRate) || 0));
  const commissionAmount = Math.round((subtotal * clampedRate) / 100);
  const sellerNetPayout = Math.max(0, subtotal - commissionAmount);
  const totalAmount = subtotal + safeShipping;

  return {
    subtotal,
    shippingCost: safeShipping,
    commissionRate: clampedRate,
    commissionAmount,
    sellerNetPayout,
    totalAmount,
  };
}

export function filterAndSortProducts(
  products: EnrichedProduct[],
  options: ProductFilterOptions,
): EnrichedProduct[] {
  const query = (options.search || '').trim().toLowerCase();
  const categoryId = options.categoryId && options.categoryId !== 'all' ? options.categoryId : null;
  const minPrice =
    options.minPrice !== undefined && options.minPrice !== null && options.minPrice > 0
      ? options.minPrice
      : null;
  const maxPrice =
    options.maxPrice !== undefined && options.maxPrice !== null && options.maxPrice > 0
      ? options.maxPrice
      : null;

  const filtered = products.filter((product) => {
    if (!options.includeInactive && !product.isActive) return false;
    if (categoryId && product.categoryId !== categoryId) return false;
    if (minPrice !== null && product.price < minPrice) return false;
    if (maxPrice !== null && product.price > maxPrice) return false;
    if (query) {
      const haystack = [
        product.name,
        product.description,
        product.originLocation,
        product.categoryName,
        product.sellerName,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const sortBy = options.sortBy || 'popular';
  return [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // 'popular': promoted + soldCount + rating
    const scoreA = (a.isPromoted ? 50 : 0) + a.soldCount;
    const scoreB = (b.isPromoted ? 50 : 0) + b.soldCount;
    return scoreB - scoreA;
  });
}

export function canTransitionOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
  actorRole: UserRole,
): boolean {
  if (current === next) return false;
  if (actorRole === 'admin') {
    return ['menunggu', 'diproses', 'dikirim', 'selesai', 'dibatalkan'].includes(next);
  }
  if (actorRole === 'seller') {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      menunggu: ['diproses', 'dibatalkan'],
      diproses: ['dikirim', 'dibatalkan'],
      dikirim: ['selesai'],
      selesai: [],
      dibatalkan: [],
    };
    return allowed[current].includes(next);
  }
  if (actorRole === 'buyer') {
    return current === 'dikirim' && next === 'selesai';
  }
  return false;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateRegistrationInput(input: {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: string;
  storeName?: string;
  originCity?: string;
}): ValidationResult {
  const name = (input.name || '').trim();
  const email = (input.email || '').trim().toLowerCase();
  const password = input.password || '';
  const phone = (input.phone || '').trim();

  if (name.length < 3) {
    return { valid: false, error: 'Nama lengkap minimal 3 karakter.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Format alamat email tidak valid.' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'Kata sandi minimal 6 karakter.' };
  }
  if (phone.length < 8) {
    return { valid: false, error: 'Nomor WhatsApp / telepon minimal 8 digit.' };
  }
  if (input.role === 'seller') {
    if ((input.storeName || '').trim().length < 3) {
      return { valid: false, error: 'Nama toko UMKM minimal 3 karakter.' };
    }
    if ((input.originCity || '').trim().length < 3) {
      return { valid: false, error: 'Kota / kabupaten asal di Papua wajib diisi.' };
    }
  }
  return { valid: true };
}

export function validateProductInput(input: {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  originLocation?: string;
}): ValidationResult {
  if ((input.name || '').trim().length < 3) {
    return { valid: false, error: 'Nama produk minimal 3 karakter.' };
  }
  if ((input.description || '').trim().length < 15) {
    return { valid: false, error: 'Deskripsi produk minimal 15 karakter.' };
  }
  if (!Number.isFinite(input.price) || (input.price ?? 0) < 1000) {
    return { valid: false, error: 'Harga produk minimal Rp 1.000.' };
  }
  if (!Number.isFinite(input.stock) || (input.stock ?? -1) < 0) {
    return { valid: false, error: 'Stok produk tidak boleh negatif.' };
  }
  if (!(input.categoryId || '').trim()) {
    return { valid: false, error: 'Kategori produk wajib dipilih.' };
  }
  if ((input.originLocation || '').trim().length < 3) {
    return { valid: false, error: 'Lokasi asal produk di Papua wajib diisi.' };
  }
  return { valid: true };
}

export function validateCheckoutInput(input: {
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingPostalCode?: string;
  shippingMethodId?: string;
  paymentMethod?: string;
}): ValidationResult {
  if ((input.buyerName || '').trim().length < 3) {
    return { valid: false, error: 'Nama penerima wajib diisi (minimal 3 karakter).' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((input.buyerEmail || '').trim())) {
    return { valid: false, error: 'Email penerima tidak valid.' };
  }
  if ((input.buyerPhone || '').trim().length < 8) {
    return { valid: false, error: 'Nomor telepon penerima minimal 8 digit.' };
  }
  if ((input.shippingAddress || '').trim().length < 10) {
    return { valid: false, error: 'Alamat pengiriman lengkap minimal 10 karakter.' };
  }
  if ((input.shippingCity || '').trim().length < 2) {
    return { valid: false, error: 'Kota / kabupaten tujuan wajib diisi.' };
  }
  if ((input.shippingProvince || '').trim().length < 2) {
    return { valid: false, error: 'Provinsi tujuan wajib diisi.' };
  }
  if (!/^\d{5}$/.test((input.shippingPostalCode || '').trim())) {
    return { valid: false, error: 'Kode pos harus terdiri dari 5 digit angka.' };
  }
  if (!SHIPPING_OPTIONS.some((opt) => opt.id === input.shippingMethodId)) {
    return { valid: false, error: 'Metode pengiriman tidak valid.' };
  }
  if (!['transfer_bank', 'qris', 'cod'].includes(input.paymentMethod || '')) {
    return { valid: false, error: 'Metode pembayaran tidak valid.' };
  }
  return { valid: true };
}

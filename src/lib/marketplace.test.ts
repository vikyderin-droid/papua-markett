import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderBreakdown,
  canTransitionOrderStatus,
  filterAndSortProducts,
  formatRupiah,
  validateCheckoutInput,
  validateProductInput,
  validateRegistrationInput,
} from './marketplace';
import type { EnrichedProduct } from '../types/marketplace';

const SAMPLE_PRODUCTS: EnrichedProduct[] = [
  {
    id: 'p1',
    sellerId: 's1',
    categoryId: 'cat-kopi',
    name: 'Kopi Arabika Wamena Organik 250g',
    slug: 'kopi-arabika-wamena',
    description: 'Kopi dataran tinggi Lembah Baliem Jayawijaya.',
    price: 115000,
    stock: 20,
    originLocation: 'Wamena, Papua Pegunungan',
    weightGram: 250,
    imageUrl: '/img/kopi.jpg',
    soldCount: 85,
    isFeatured: true,
    isPromoted: true,
    isActive: true,
    createdAt: '2026-11-10T10:00:00Z',
    categoryName: 'Kopi dan Hasil Perkebunan',
    sellerName: 'Kebun Baliem',
    sellerCity: 'Wamena',
    sellerPackageTier: 'premium',
    averageRating: 4.9,
    reviewCount: 12,
  },
  {
    id: 'p2',
    sellerId: 's2',
    categoryId: 'cat-noken',
    name: 'Noken Kulit Kayu Anggrek Asli',
    slug: 'noken-kulit-kayu',
    description: 'Tas anyaman tradisional warisan UNESCO.',
    price: 275000,
    stock: 7,
    originLocation: 'Jayapura, Papua',
    weightGram: 400,
    imageUrl: '/img/noken.jpg',
    soldCount: 42,
    isFeatured: true,
    isPromoted: false,
    isActive: true,
    createdAt: '2026-11-14T10:00:00Z',
    categoryName: 'Kerajinan dan Noken',
    sellerName: 'Mama Papua Craft',
    sellerCity: 'Jayapura',
    sellerPackageTier: 'reguler',
    averageRating: 5.0,
    reviewCount: 8,
  },
  {
    id: 'p3',
    sellerId: 's1',
    categoryId: 'cat-sagu',
    name: 'Tepung Sagu Organik Sentani 1kg',
    slug: 'tepung-sagu-sentani',
    description: 'Tepung sagu murni tanpa bahan pengawet.',
    price: 45000,
    stock: 0,
    originLocation: 'Sentani, Jayapura',
    weightGram: 1000,
    imageUrl: '/img/sagu.jpg',
    soldCount: 110,
    isFeatured: false,
    isPromoted: false,
    isActive: false,
    createdAt: '2026-11-01T10:00:00Z',
    categoryName: 'Makanan Khas Papua',
    sellerName: 'Kebun Baliem',
    sellerCity: 'Wamena',
    sellerPackageTier: 'premium',
    averageRating: 4.7,
    reviewCount: 5,
  },
];

test('formatRupiah formats Indonesian currency cleanly', () => {
  assert.equal(formatRupiah(115000), 'Rp 115.000');
  assert.equal(formatRupiah(0), 'Rp 0');
});

test('calculateOrderBreakdown computes subtotal, commission, seller net, and total', () => {
  const breakdown = calculateOrderBreakdown(
    [
      { unitPrice: 100000, quantity: 2 },
      { unitPrice: 50000, quantity: 1 },
    ],
    35000,
    5,
  );
  assert.equal(breakdown.subtotal, 250000);
  assert.equal(breakdown.shippingCost, 35000);
  assert.equal(breakdown.commissionRate, 5);
  assert.equal(breakdown.commissionAmount, 12500);
  assert.equal(breakdown.sellerNetPayout, 237500);
  assert.equal(breakdown.totalAmount, 285000);
});

test('filterAndSortProducts filters by search, category, price, and excludes inactive by default', () => {
  const activeOnly = filterAndSortProducts(SAMPLE_PRODUCTS, {});
  assert.equal(activeOnly.length, 2);

  const byQuery = filterAndSortProducts(SAMPLE_PRODUCTS, { search: 'wamena' });
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].id, 'p1');

  const byPriceDesc = filterAndSortProducts(SAMPLE_PRODUCTS, { sortBy: 'price_desc' });
  assert.deepEqual(
    byPriceDesc.map((p) => p.id),
    ['p2', 'p1'],
  );

  const byMaxPrice = filterAndSortProducts(SAMPLE_PRODUCTS, { maxPrice: 150000 });
  assert.deepEqual(
    byMaxPrice.map((p) => p.id),
    ['p1'],
  );
});

test('canTransitionOrderStatus enforces role permissions', () => {
  assert.equal(canTransitionOrderStatus('menunggu', 'diproses', 'seller'), true);
  assert.equal(canTransitionOrderStatus('menunggu', 'selesai', 'seller'), false);
  assert.equal(canTransitionOrderStatus('dikirim', 'selesai', 'buyer'), true);
  assert.equal(canTransitionOrderStatus('menunggu', 'diproses', 'buyer'), false);
  assert.equal(canTransitionOrderStatus('menunggu', 'selesai', 'admin'), true);
});

test('input validators reject invalid fields and accept valid data', () => {
  assert.equal(
    validateRegistrationInput({
      name: 'Budi',
      email: 'bad-email',
      password: '123',
      phone: '0812',
    }).valid,
    false,
  );
  assert.equal(
    validateRegistrationInput({
      name: 'Yohanes Tabuni',
      email: 'yohanes@papuamarket.id',
      password: 'password123',
      phone: '081248001122',
      role: 'seller',
      storeName: 'Noken Baliem Asli',
      originCity: 'Wamena',
    }).valid,
    true,
  );
  assert.equal(
    validateProductInput({
      name: 'Noken',
      description: 'Terlalu pendek',
      price: 500,
      stock: -1,
      categoryId: '',
      originLocation: '',
    }).valid,
    false,
  );
  assert.equal(
    validateCheckoutInput({
      buyerName: 'Siti Aminah',
      buyerEmail: 'siti@example.com',
      buyerPhone: '081355501122',
      shippingAddress: 'Jl. Merdeka No. 18, Jakarta Pusat',
      shippingCity: 'Jakarta Pusat',
      shippingProvince: 'DKI Jakarta',
      shippingPostalCode: '10110',
      shippingMethodId: 'jne_reguler',
      paymentMethod: 'qris',
    }).valid,
    true,
  );
});

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  Address,
  Category,
  EnrichedProduct,
  NotificationItem,
  Order,
  Product,
  PublicUser,
  Review,
  Seller,
  UserRole,
} from '../src/types/marketplace';

export interface StoredUser extends PublicUser {
  passwordHash: string;
}

export interface StoredCart {
  id: string;
  userId: string | null;
  sessionKey: string | null;
  items: Array<{ productId: string; quantity: number }>;
  updatedAt: string;
}

export interface StoredSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface FavoriteRecord {
  userId: string;
  productId: string;
  createdAt: string;
}

export interface DatabaseState {
  users: StoredUser[];
  sellers: Seller[];
  categories: Category[];
  products: Product[];
  carts: StoredCart[];
  addresses: Address[];
  orders: Order[];
  reviews: Review[];
  notifications: NotificationItem[];
  favorites: FavoriteRecord[];
  sessions: StoredSession[];
  platformSettings: {
    commissionRate: number;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'papua-market-db.json');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(6).toString('hex')}`;
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function buildSeedState(): DatabaseState {
  const now = new Date('2026-11-10T08:00:00.000Z').toISOString();

  const users: StoredUser[] = [
    {
      id: 'usr-buyer-1',
      name: 'Rina Wenda',
      email: 'pembeli@papuamarket.id',
      passwordHash: hashPassword('papua123'),
      phone: '081248001122',
      role: 'buyer',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-seller-1',
      name: 'Yohanes Tabuni',
      email: 'penjual@papuamarket.id',
      passwordHash: hashPassword('papua123'),
      phone: '081344556677',
      role: 'seller',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-seller-2',
      name: 'Martha Rumkorem',
      email: 'martha@batikpapua.id',
      passwordHash: hashPassword('papua123'),
      phone: '081248990011',
      role: 'seller',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-seller-3',
      name: 'Lukas Kaisiepo',
      email: 'lukas@soronglaut.id',
      passwordHash: hashPassword('papua123'),
      phone: '085244118899',
      role: 'seller',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'usr-admin-1',
      name: 'Administrator Papua Market',
      email: 'admin@papuamarket.id',
      passwordHash: hashPassword('admin123'),
      phone: '081148000001',
      role: 'admin',
      isActive: true,
      createdAt: now,
    },
  ];

  const sellers: Seller[] = [
    {
      id: 'sel-1',
      userId: 'usr-seller-1',
      storeName: 'Kriya & Kopi Baliem',
      originCity: 'Wamena, Papua Pegunungan',
      description:
        'Koperasi pengrajin noken kulit kayu dan petani kopi Arabika dataran tinggi Lembah Baliem sejak 2018.',
      packageTier: 'premium',
      isVerified: true,
      createdAt: now,
    },
    {
      id: 'sel-2',
      userId: 'usr-seller-2',
      storeName: 'Galeri Batik Cenderawasih',
      originCity: 'Jayapura, Papua',
      description:
        'Rumah batik tulis dan cap khas Papua dengan motif Cenderawasih, Tifa, dan ukiran Teluk Youtefa.',
      packageTier: 'premium',
      isVerified: true,
      createdAt: now,
    },
    {
      id: 'sel-3',
      userId: 'usr-seller-3',
      storeName: 'Dapur Laut Raja Ampat & Sorong',
      originCity: 'Sorong, Papua Barat Daya',
      description:
        'Olahan hasil laut segar nelayan Sorong dan tepung sagu organik dari pesisir Papua Barat.',
      packageTier: 'reguler',
      isVerified: true,
      createdAt: now,
    },
  ];

  const categories: Category[] = [
    {
      id: 'cat-1',
      name: 'Kerajinan dan Noken',
      slug: 'kerajinan-dan-noken',
      description: 'Noken anyaman serat kayu, ukiran Asmat, dan kriya tradisional Papua.',
    },
    {
      id: 'cat-2',
      name: 'Makanan Khas Papua',
      slug: 'makanan-khas-papua',
      description: 'Olahan sagu, papeda instan, keripik keladi, dan camilan khas Bumi Cenderawasih.',
    },
    {
      id: 'cat-3',
      name: 'Kopi dan Hasil Perkebunan',
      slug: 'kopi-dan-hasil-perkebunan',
      description: 'Kopi Arabika Wamena, Moanemani, kakao Papua, dan rempah pegunungan.',
    },
    {
      id: 'cat-4',
      name: 'Hasil Laut',
      slug: 'hasil-laut',
      description: 'Abon ikan cakalang asap, ikan asar, dan olahan tangkapan nelayan pesisir Papua.',
    },
    {
      id: 'cat-5',
      name: 'Fashion dan Batik Papua',
      slug: 'fashion-dan-batik-papua',
      description: 'Kain batik motif Cenderawasih, Tifa, kemeja tenun, dan busana etnik modern.',
    },
    {
      id: 'cat-6',
      name: 'Aksesoris dan Souvenir',
      slug: 'aksesoris-dan-souvenir',
      description: 'Kalung kerang cowrie, gelang serat pandan, dan cenderamata khas Papua.',
    },
    {
      id: 'cat-7',
      name: 'Produk UMKM',
      slug: 'produk-umkm',
      description: 'Paket oleh-oleh pilihan dan karya unggulan pelaku UMKM binaan Papua.',
    },
    {
      id: 'cat-8',
      name: 'Produk Pertanian',
      slug: 'produk-pertanian',
      description: 'Sagu organik, beras merah Merauke, madu hutan, dan hasil tani lokal.',
    },
  ];

  const products: Product[] = [
    {
      id: 'prd-1',
      sellerId: 'sel-1',
      categoryId: 'cat-1',
      name: 'Noken Serat Kulit Kayu Asli Wamena',
      slug: 'noken-serat-kulit-kayu-asli-wamena',
      description:
        'Tas Noken tradisional yang dirajut tangan oleh mama-mama pengrajin Lembah Baliem menggunakan serat kulit kayu hutan alami dengan aksen garis hijau dan terakota. Kuat, lentur, dan merupakan warisan budaya takbenda UNESCO.',
      price: 285000,
      stock: 14,
      originLocation: 'Wamena, Papua Pegunungan',
      weightGram: 380,
      imageUrl: '/src/assets/images/prod_noken_wamena_1794826320314.jpg',
      soldCount: 94,
      isFeatured: true,
      isPromoted: true,
      isActive: true,
      createdAt: '2026-11-12T09:00:00.000Z',
    },
    {
      id: 'prd-2',
      sellerId: 'sel-1',
      categoryId: 'cat-3',
      name: 'Kopi Arabika Wamena Single Origin 340g',
      slug: 'kopi-arabika-wamena-single-origin-340g',
      description:
        'Biji kopi Arabika pilihan dari ketinggian 1.600 mdpl di Lembah Baliem, diproses secara organik tanpa pestisida. Memiliki karakter cita rasa cokelat hitam, rempah hangat, dan keasaman buah yang bersih.',
      price: 125000,
      stock: 36,
      originLocation: 'Jayawijaya, Papua Pegunungan',
      weightGram: 340,
      imageUrl: '/src/assets/images/prod_kopi_wamena_1794826321967.jpg',
      soldCount: 168,
      isFeatured: true,
      isPromoted: true,
      isActive: true,
      createdAt: '2026-11-14T10:30:00.000Z',
    },
    {
      id: 'prd-3',
      sellerId: 'sel-2',
      categoryId: 'cat-5',
      name: 'Kain Batik Papua Motif Cenderawasih & Tifa (2m)',
      slug: 'kain-batik-papua-motif-cenderawasih-tifa',
      description:
        'Kain batik katun primisima berukuran 200 x 115 cm dengan pewarnaan hijau hutan dan motif emas burung Cenderawasih serta alat musik Tifa. Nyaman dipakai untuk kemeja resmi maupun busana acara adat.',
      price: 340000,
      stock: 19,
      originLocation: 'Jayapura, Papua',
      weightGram: 420,
      imageUrl: '/src/assets/images/prod_batik_papua_1794826321611.jpg',
      soldCount: 77,
      isFeatured: true,
      isPromoted: true,
      isActive: true,
      createdAt: '2026-11-13T11:15:00.000Z',
    },
    {
      id: 'prd-4',
      sellerId: 'sel-3',
      categoryId: 'cat-4',
      name: 'Abon Ikan Cakalang Asap Pedas Sorong (180g)',
      slug: 'abon-ikan-cakalang-asap-pedas-sorong',
      description:
        'Abon ikan cakalang segar hasil tangkapan nelayan Sorong yang diasap perlahan lalu diolah dengan cabai rawit, serai, dan daun jeruk tanpa bahan pengawet. Gurih, renyah, tahan hingga 4 bulan.',
      price: 68000,
      stock: 48,
      originLocation: 'Sorong, Papua Barat Daya',
      weightGram: 220,
      imageUrl: '/src/assets/images/prod_abon_ikan_1794826321864.jpg',
      soldCount: 142,
      isFeatured: true,
      isPromoted: false,
      isActive: true,
      createdAt: '2026-11-15T08:00:00.000Z',
    },
    {
      id: 'prd-5',
      sellerId: 'sel-3',
      categoryId: 'cat-2',
      name: 'Tepung Sagu Organik Sentani & Mutiara Sagu 1kg',
      slug: 'tepung-sagu-organik-sentani-1kg',
      description:
        'Tepung pati sagu murni bebas gluten dari pohon sagu alami kawasan Danau Sentani. Cocok untuk membuat papeda tradisional, kue bagea, maupun pengental masakan nusantara yang sehat.',
      price: 52000,
      stock: 60,
      originLocation: 'Sentani, Jayapura',
      weightGram: 1000,
      imageUrl: '/src/assets/images/prod_tepung_sagu_1794826322863.jpg',
      soldCount: 115,
      isFeatured: false,
      isPromoted: false,
      isActive: true,
      createdAt: '2026-11-11T14:20:00.000Z',
    },
    {
      id: 'prd-6',
      sellerId: 'sel-1',
      categoryId: 'cat-1',
      name: 'Panel Ukiran Kayu Besi Motif Leluhur Asmat',
      slug: 'panel-ukiran-kayu-besi-asmat',
      description:
        'Karya seni pahat tradisional suku Asmat menggunakan kayu besi Papua dengan pewarnaan kapur putih alami. Setiap pahatan dikerjakan manual oleh pemahat berpengalaman dengan detail simbolis yang autentik.',
      price: 690000,
      stock: 5,
      originLocation: 'Agats, Asmat, Papua Selatan',
      weightGram: 1650,
      imageUrl: '/src/assets/images/prod_ukiran_asmat_1794826323358.jpg',
      soldCount: 28,
      isFeatured: true,
      isPromoted: false,
      isActive: true,
      createdAt: '2026-11-09T09:00:00.000Z',
    },
    {
      id: 'prd-7',
      sellerId: 'sel-2',
      categoryId: 'cat-6',
      name: 'Kalung Etnik Kerang Cowrie & Anyaman Pandan Biak',
      slug: 'kalung-etnik-kerang-cowrie-biak',
      description:
        'Aksesori kalung kerajinan pesisir Biak yang memadukan deretan kerang cowrie putih mengkilap dengan tali serat pandan anyaman tangan. Ringan, elegan, dan cocok sebagai cenderamata eksklusif.',
      price: 145000,
      stock: 22,
      originLocation: 'Biak Numfor, Papua',
      weightGram: 180,
      imageUrl: '/src/assets/images/prod_kalung_kerang_1794826324044.jpg',
      soldCount: 64,
      isFeatured: false,
      isPromoted: false,
      isActive: true,
      createdAt: '2026-11-15T12:10:00.000Z',
    },
    {
      id: 'prd-8',
      sellerId: 'sel-1',
      categoryId: 'cat-7',
      name: 'Paket Hampers UMKM Papua (Noken + Kopi + Batik)',
      slug: 'paket-hampers-umkm-papua',
      description:
        'Bingkisan kolaborasi tiga pengrajin Papua: 1 Noken ukuran sedang, 1 kemasan Kopi Arabika Wamena 340g, dan 1 syal Batik Cenderawasih. Dikemas rapi untuk hadiah korporasi maupun keluarga.',
      price: 540000,
      stock: 11,
      originLocation: 'Jayapura & Wamena, Papua',
      weightGram: 1100,
      imageUrl: '/src/assets/images/hero_papua_market_1794826320177.jpg',
      soldCount: 51,
      isFeatured: true,
      isPromoted: true,
      isActive: true,
      createdAt: '2026-11-16T01:00:00.000Z',
    },
    {
      id: 'prd-9',
      sellerId: 'sel-3',
      categoryId: 'cat-8',
      name: 'Biji Sagu Mutiara & Tepung Tani Merauke 1.5kg',
      slug: 'biji-sagu-mutiara-merauke',
      description:
        'Hasil panen petani lokal Papua Selatan berupa butiran sagu mutiara dan pati sagu bersih tanpa pemutih. Kaya serat alami untuk olahan bubur tradisional dan hidangan keluarga.',
      price: 62000,
      stock: 32,
      originLocation: 'Merauke, Papua Selatan',
      weightGram: 1500,
      imageUrl: '/src/assets/images/prod_tepung_sagu_1794826322863.jpg',
      soldCount: 39,
      isFeatured: false,
      isPromoted: false,
      isActive: true,
      createdAt: '2026-11-14T16:40:00.000Z',
    },
  ];

  const addresses: Address[] = [
    {
      id: 'addr-1',
      userId: 'usr-buyer-1',
      recipientName: 'Rina Wenda',
      phone: '081248001122',
      streetAddress: 'Jl. Kemang Selatan No. 42, RT 04/RW 02',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12560',
      isDefault: true,
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord-seed-1',
      orderNumber: 'PM-20261110-1042',
      buyerId: 'usr-buyer-1',
      buyerName: 'Rina Wenda',
      buyerEmail: 'pembeli@papuamarket.id',
      buyerPhone: '081248001122',
      shippingAddress: 'Jl. Kemang Selatan No. 42, RT 04/RW 02',
      shippingCity: 'Jakarta Selatan',
      shippingProvince: 'DKI Jakarta',
      shippingPostalCode: '12560',
      shippingMethod: 'JNE Reguler Papua — Nusantara',
      shippingCost: 35000,
      subtotal: 410000,
      commissionRate: 5,
      commissionAmount: 20500,
      totalAmount: 445000,
      status: 'selesai',
      createdAt: '2026-11-10T11:30:00.000Z',
      items: [
        {
          id: 'oi-1',
          orderId: 'ord-seed-1',
          productId: 'prd-1',
          sellerId: 'sel-1',
          productName: 'Noken Serat Kulit Kayu Asli Wamena',
          imageUrl: '/src/assets/images/prod_noken_wamena_1794826320314.jpg',
          unitPrice: 285000,
          quantity: 1,
          subtotal: 285000,
        },
        {
          id: 'oi-2',
          orderId: 'ord-seed-1',
          productId: 'prd-2',
          sellerId: 'sel-1',
          productName: 'Kopi Arabika Wamena Single Origin 340g',
          imageUrl: '/src/assets/images/prod_kopi_wamena_1794826321967.jpg',
          unitPrice: 125000,
          quantity: 1,
          subtotal: 125000,
        },
      ],
      payment: {
        id: 'pay-seed-1',
        orderId: 'ord-seed-1',
        method: 'transfer_bank',
        amount: 445000,
        status: 'simulasi_terkonfirmasi',
        referenceCode: 'SIM-BRI-884102',
        isSimulated: true,
        createdAt: '2026-11-10T11:30:00.000Z',
      },
    },
  ];

  const reviews: Review[] = [
    {
      id: 'rev-1',
      productId: 'prd-2',
      userId: 'usr-buyer-1',
      reviewerName: 'Rina Wenda',
      rating: 5,
      comment:
        'Aroma kopi Wamena sangat harum saat diseduh pour-over, pengemasan rapi dan pengiriman sampai Jakarta dengan aman.',
      createdAt: '2026-11-12T15:00:00.000Z',
    },
    {
      id: 'rev-2',
      productId: 'prd-1',
      userId: 'usr-buyer-1',
      reviewerName: 'Rina Wenda',
      rating: 5,
      comment:
        'Rajutan noken sangat kuat dan motif seratnya rapi. Bangga memakai karya mama-mama Papua!',
      createdAt: '2026-11-12T15:05:00.000Z',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: 'usr-buyer-1',
      title: 'Pesanan PM-20261110-1042 Selesai',
      message: 'Terima kasih telah berbelanja produk lokal UMKM Papua di PAPUA MARKET.',
      isRead: false,
      createdAt: '2026-11-12T14:00:00.000Z',
    },
  ];

  const favorites: FavoriteRecord[] = [
    {
      userId: 'usr-buyer-1',
      productId: 'prd-3',
      createdAt: now,
    },
  ];

  return {
    users,
    sellers,
    categories,
    products,
    carts: [],
    addresses,
    orders,
    reviews,
    notifications,
    favorites,
    sessions: [],
    platformSettings: {
      commissionRate: 5,
    },
  };
}

let cachedState: DatabaseState | null = null;

export function getDb(): DatabaseState {
  if (cachedState) return cachedState;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      cachedState = JSON.parse(raw) as DatabaseState;
      return cachedState;
    } catch {
      // Fallback to fresh seed if corrupted
    }
  }
  cachedState = buildSeedState();
  saveDb();
  return cachedState;
}

export function saveDb(): void {
  if (!cachedState) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(cachedState, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_FILE);
}

export function enrichProducts(db: DatabaseState): EnrichedProduct[] {
  const categoryMap = new Map(db.categories.map((c) => [c.id, c]));
  const sellerMap = new Map(db.sellers.map((s) => [s.id, s]));

  return db.products.map((product) => {
    const category = categoryMap.get(product.categoryId);
    const seller = sellerMap.get(product.sellerId);
    const productReviews = db.reviews.filter((r) => r.productId === product.id);
    const avg =
      productReviews.length > 0
        ? Number(
            (
              productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
            ).toFixed(1),
          )
        : 4.8;

    return {
      ...product,
      categoryName: category?.name || 'Produk Lokal Papua',
      sellerName: seller?.storeName || 'UMKM Papua',
      sellerCity: seller?.originCity || product.originLocation,
      sellerPackageTier: seller?.packageTier || 'reguler',
      averageRating: avg,
      reviewCount: productReviews.length,
    };
  });
}

export function ensureUserRole(user: StoredUser | null, allowed: UserRole[]): boolean {
  if (!user || !user.isActive) return false;
  return allowed.includes(user.role);
}

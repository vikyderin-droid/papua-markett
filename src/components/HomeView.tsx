import { useState, type FormEvent } from 'react';
import { ArrowRight, Search, ShieldCheck, Store, Truck } from 'lucide-react';
import { filterAndSortProducts } from '../lib/marketplace';
import type { Category, EnrichedProduct } from '../types/marketplace';
import type { AppView } from './Navbar';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';

interface HomeViewProps {
  categories: Category[];
  products: EnrichedProduct[];
  favoriteIds: string[];
  onSearchSubmit: (query: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenProduct: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
  onNavigate: (view: AppView) => void;
}

type HomeTab = 'unggulan' | 'terlaris' | 'terbaru';

export function HomeView({
  categories,
  products,
  favoriteIds,
  onSearchSubmit,
  onSelectCategory,
  onOpenProduct,
  onAddToCart,
  onToggleFavorite,
  onNavigate,
}: HomeViewProps) {
  const [heroSearch, setHeroSearch] = useState('');
  const [activeTab, setActiveTab] = useState<HomeTab>('unggulan');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchSubmit(heroSearch);
  };

  const displayedProducts = (() => {
    if (activeTab === 'unggulan') {
      const featured = products.filter((p) => p.isFeatured);
      return (featured.length > 0 ? featured : products).slice(0, 6);
    }
    if (activeTab === 'terlaris') {
      return filterAndSortProducts(products, { sortBy: 'price_desc' })
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 6);
    }
    return filterAndSortProducts(products, { sortBy: 'newest' }).slice(0, 6);
  })();

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Section 1: Hero & Search Split */}
      <section className="bg-white border-b border-[#E6E4DD]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold tracking-wide text-[#A8730D]">
                Dari Papua untuk Indonesia
              </p>
              <h1
                className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-[#14452F] leading-[1.14] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Karya Asli Pengrajin &amp; Petani Tanah Papua.
              </h1>
              <p className="mt-4 text-base text-[#4B524D] leading-relaxed max-w-xl">
                Temukan noken serat kulit kayu, kopi Arabika Lembah Baliem, batik motif
                Cenderawasih, hingga olahan hasil laut Sorong langsung dari pelaku UMKM Papua.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 text-[#5C665E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <label htmlFor="hero-search-input" className="sr-only">
                    Cari produk lokal Papua
                  </label>
                  <input
                    id="hero-search-input"
                    type="search"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Cari noken, kopi Wamena, batik Papua, abon ikan..."
                    className="w-full h-12 pl-10 pr-4 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm text-[#181A18] placeholder:text-[#737B75] focus:outline-none focus:border-[#14452F] focus:ring-2 focus:ring-[#14452F]/15"
                  />
                </div>
                <button
                  type="submit"
                  className="h-12 px-6 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cari Produk
                </button>
              </form>

              <div className="mt-7 pt-6 border-t border-[#F0EFEA] grid grid-cols-3 gap-4 text-xs sm:text-sm">
                <div>
                  <p className="font-bold text-[#14452F] tabular-nums text-base sm:text-lg">
                    {categories.length} Kategori
                  </p>
                  <p className="text-[#5C665E] mt-0.5">Khas Nusantara Timur</p>
                </div>
                <div>
                  <p className="font-bold text-[#14452F] tabular-nums text-base sm:text-lg">
                    100% UMKM
                  </p>
                  <p className="text-[#5C665E] mt-0.5">Pengrajin &amp; Petani Papua</p>
                </div>
                <div>
                  <p className="font-bold text-[#14452F] tabular-nums text-base sm:text-lg">
                    Seluruh RI
                  </p>
                  <p className="text-[#5C665E] mt-0.5">Pengiriman Terintegrasi</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[280px] sm:min-h-[360px] rounded-xl overflow-hidden bg-[#F0EFEA] border border-[#E6E4DD]">
                <ProductImage
                  src="/src/assets/images/hero_papua_market_1794826320177.jpg"
                  alt="Koleksi produk lokal Papua: Noken, Kopi Arabika Wamena, Batik Cenderawasih, dan Tifa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-5 sm:p-6 text-white">
                  <p className="text-xs font-medium text-[#F5C765]">
                    Kurasi Unggulan Papua Market
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-4">
                    <p className="text-sm sm:text-base font-semibold">
                      Jelajahi Ragam Produk Asli Papua Berkualitas Ekspor
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate('marketplace')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#14452F] hover:bg-[#1D5C3F] px-3.5 py-2 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Belanja</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Kategori Produk Khas Papua */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2
              className="text-2xl sm:text-[1.75rem] font-bold text-[#181A18]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Kategori Produk Lokal Papua
            </h2>
            <p className="mt-1 text-sm text-[#5C665E]">
              Pilih kategori untuk menelusuri produk autentik dari pegunungan hingga pesisir Papua.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('marketplace')}
            className="text-sm font-semibold text-[#14452F] hover:text-[#1D5C3F] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Lihat Semua Katalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
          {categories.map((category) => {
            const count = products.filter((p) => p.categoryId === category.id).length;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className="text-left p-4 bg-white border border-[#E6E4DD] rounded-xl hover:border-[#14452F] hover:bg-[#F2F7F4]/50 transition-colors cursor-pointer group"
              >
                <p className="text-sm font-semibold text-[#181A18] group-hover:text-[#14452F] transition-colors">
                  {category.name}
                </p>
                <p className="mt-1 text-xs text-[#5C665E] line-clamp-2">{category.description}</p>
                <p className="mt-2.5 text-xs font-medium text-[#A8730D] tabular-nums">
                  {count} produk tersedia
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Section 3: Produk Unggulan, Terlaris & Terbaru */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2
              className="text-2xl sm:text-[1.75rem] font-bold text-[#181A18]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Pilihan Terbaik Bumi Cenderawasih
            </h2>
            <p className="mt-1 text-sm text-[#5C665E]">
              Harga transparan langsung dari produsen UMKM tanpa perantara berlebih.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter Etalase Beranda"
            className="inline-flex items-center gap-1 p-1 bg-[#EFECE5] rounded-lg self-start sm:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'unggulan'}
              onClick={() => setActiveTab('unggulan')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'unggulan'
                  ? 'bg-white text-[#14452F] shadow-sm'
                  : 'text-[#4B524D] hover:text-[#181A18]'
              }`}
            >
              Produk Unggulan
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'terlaris'}
              onClick={() => setActiveTab('terlaris')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'terlaris'
                  ? 'bg-white text-[#14452F] shadow-sm'
                  : 'text-[#4B524D] hover:text-[#181A18]'
              }`}
            >
              Terlaris
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'terbaru'}
              onClick={() => setActiveTab('terbaru')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'terbaru'
                  ? 'bg-white text-[#14452F] shadow-sm'
                  : 'text-[#4B524D] hover:text-[#181A18]'
              }`}
            >
              Terbaru
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteIds.includes(product.id)}
              onOpenProduct={onOpenProduct}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* Section 4: Kemitraan UMKM & Kepercayaan Belanja */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="bg-[#14452F] text-white rounded-2xl p-8 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold tracking-wide text-[#E0A833]">
              Ekonomi Digital Masyarakat Papua
            </p>
            <h2
              className="mt-2 text-2xl sm:text-3xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Punya Produk Lokal Papua? Jangkau Pembeli di Seluruh Indonesia.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#D3DDD6] leading-relaxed max-w-2xl">
              Bergabunglah bersama pengrajin noken, petani kopi pegunungan, perajin batik, dan
              pelaku UMKM kuliner Papua. Kelola katalog, stok, foto produk, hingga pesanan dalam satu
              dasbor penjual terpadu.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="px-5 py-3 bg-[#E0A833] hover:bg-[#C88A16] text-[#181A18] text-sm font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Daftar sebagai Penjual UMKM
              </button>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                Pelajari Model Bisnis
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 gap-4">
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 flex items-start gap-3.5">
              <Store className="w-5 h-5 text-[#E0A833] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Etalase UMKM Terverifikasi</p>
                <p className="text-xs text-[#D3DDD6] mt-0.5">
                  Setiap toko menampilkan asal daerah dan informasi pengrajin secara terbuka.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 flex items-start gap-3.5">
              <Truck className="w-5 h-5 text-[#E0A833] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Pilihan Ekspedisi Papua — Nusantara</p>
                <p className="text-xs text-[#D3DDD6] mt-0.5">
                  Perhitungan ongkos kirim transparan menuju Jawa, Sumatera, Kalimantan, hingga Sulawesi.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-[#E0A833] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Transaksi Terpantau &amp; Transparan</p>
                <p className="text-xs text-[#D3DDD6] mt-0.5">
                  Pelacakan status pesanan real-time dan notifikasi otomatis untuk pembeli &amp; penjual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { filterAndSortProducts } from '../lib/marketplace';
import type { Category, EnrichedProduct, SortOption } from '../types/marketplace';
import { ProductCard } from './ProductCard';

interface MarketplaceViewProps {
  categories: Category[];
  products: EnrichedProduct[];
  favoriteIds: string[];
  searchQuery: string;
  selectedCategoryId: string;
  minPrice: string;
  maxPrice: string;
  sortBy: SortOption;
  onSearchChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  onSortChange: (val: SortOption) => void;
  onResetFilters: () => void;
  onOpenProduct: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
}

export function MarketplaceView({
  categories,
  products,
  favoriteIds,
  searchQuery,
  selectedCategoryId,
  minPrice,
  maxPrice,
  sortBy,
  onSearchChange,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onSortChange,
  onResetFilters,
  onOpenProduct,
  onAddToCart,
  onToggleFavorite,
}: MarketplaceViewProps) {
  const parsedMin = minPrice ? Number(minPrice) : null;
  const parsedMax = maxPrice ? Number(maxPrice) : null;

  const filteredProducts = filterAndSortProducts(products, {
    search: searchQuery,
    categoryId: selectedCategoryId,
    minPrice: Number.isFinite(parsedMin) ? parsedMin : null,
    maxPrice: Number.isFinite(parsedMax) ? parsedMax : null,
    sortBy,
  });

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategoryId !== 'all' ||
    minPrice !== '' ||
    maxPrice !== '';

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E6E4DD]">
        <div>
          <h1
            className="text-3xl font-bold text-[#181A18]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Marketplace Produk Lokal Papua
          </h1>
          <p className="mt-1.5 text-sm text-[#5C665E]">
            Menampilkan <span className="font-semibold text-[#181A18] tabular-nums">{filteredProducts.length}</span>{' '}
            produk asli dari pengrajin dan UMKM Papua.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="sort-select" className="text-xs font-medium text-[#5C665E] whitespace-nowrap">
            Urutkan:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="h-10 px-3 bg-white border border-[#D4D1C7] rounded-lg text-sm text-[#181A18] focus:outline-none focus:border-[#14452F]"
          >
            <option value="popular">Paling Populer</option>
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-3 bg-white border border-[#E6E4DD] rounded-xl p-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#181A18] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#14452F]" aria-hidden="true" />
              <span>Filter Katalog</span>
            </h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-semibold text-[#991B1B] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div>
            <label htmlFor="catalog-search" className="block text-xs font-semibold text-[#4B524D] mb-2">
              Kata Kunci Produk / Kota Asal
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#5C665E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="catalog-search"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Noken, Wamena, Batik..."
                className="w-full h-10 pl-9 pr-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm text-[#181A18] focus:outline-none focus:border-[#14452F]"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#4B524D] mb-2.5">Kategori Papua</p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onCategoryChange('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategoryId === 'all'
                    ? 'bg-[#14452F] text-white'
                    : 'text-[#4B524D] hover:bg-[#F3F2EE]'
                }`}
              >
                Semua Kategori ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onCategoryChange(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      selectedCategoryId === cat.id
                        ? 'bg-[#14452F] text-white'
                        : 'text-[#4B524D] hover:bg-[#F3F2EE]'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="tabular-nums opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#4B524D] mb-2">Rentang Harga (Rp)</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="min-price" className="sr-only">
                  Harga Minimum
                </label>
                <input
                  id="min-price"
                  type="number"
                  min={0}
                  step={5000}
                  value={minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  placeholder="Min"
                  className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-xs tabular-nums focus:outline-none focus:border-[#14452F]"
                />
              </div>
              <div>
                <label htmlFor="max-price" className="sr-only">
                  Harga Maksimum
                </label>
                <input
                  id="max-price"
                  type="number"
                  min={0}
                  step={5000}
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  placeholder="Maks"
                  className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-xs tabular-nums focus:outline-none focus:border-[#14452F]"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-[#E6E4DD] rounded-xl p-12 text-center">
              <p
                className="text-xl font-bold text-[#181A18]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Belum Ada Produk yang Cocok
              </p>
              <p className="mt-2 text-sm text-[#5C665E] max-w-md mx-auto">
                Tidak ada produk lokal Papua yang sesuai dengan kata kunci atau filter harga yang
                Anda pilih. Coba ubah pencarian atau tampilkan semua katalog.
              </p>
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-5 px-5 py-2.5 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Tampilkan Semua Produk
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
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
          )}
        </div>
      </div>
    </section>
  );
}

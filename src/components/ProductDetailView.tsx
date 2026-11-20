import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Store,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { formatRupiah } from '../lib/marketplace';
import type { EnrichedProduct, PublicUser, Review, Seller } from '../types/marketplace';
import { ProductImage } from './ProductImage';

interface ProductDetailViewProps {
  productId: string;
  user: PublicUser | null;
  isFavorite: boolean;
  onBack: () => void;
  onAddToCart: (productId: string, quantity: number) => Promise<void>;
  onBuyNow: (productId: string, quantity: number) => Promise<void>;
  onToggleFavorite: (productId: string) => void;
  onRequireAuth: () => void;
}

export function ProductDetailView({
  productId,
  user,
  isFavorite,
  onBack,
  onAddToCart,
  onBuyNow,
  onToggleFavorite,
  onRequireAuth,
}: ProductDetailViewProps) {
  const [product, setProduct] = useState<EnrichedProduct | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submittingAction, setSubmittingAction] = useState(false);

  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSending, setReviewSending] = useState(false);

  const loadDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<{
        product: EnrichedProduct;
        seller: Seller | null;
        reviews: Review[];
      }>(`/api/products/${productId}`);
      setProduct(data.product);
      setSeller(data.seller);
      setReviews(data.reviews);
      setQuantity(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail produk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [productId]);

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    setReviewError('');
    setReviewSending(true);
    try {
      const res = await apiRequest<{ review: Review }>(`/api/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: ratingInput, comment: commentInput }),
      });
      setReviews((prev) => [res.review, ...prev]);
      setCommentInput('');
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Gagal mengirim ulasan.');
    } finally {
      setReviewSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 aspect-[4/3] bg-[#EAE7DF] rounded-xl" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-6 bg-[#EAE7DF] rounded w-1/3" />
            <div className="h-10 bg-[#EAE7DF] rounded w-3/4" />
            <div className="h-8 bg-[#EAE7DF] rounded w-1/2" />
            <div className="h-32 bg-[#EAE7DF] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-lg font-semibold text-[#991B1B]">{error || 'Produk tidak ditemukan.'}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-5 py-2.5 bg-[#14452F] text-white text-sm font-semibold rounded-lg cursor-pointer"
        >
          Kembali ke Marketplace
        </button>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#4B524D] hover:text-[#14452F] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Katalog</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Sticky Product Image Left */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <div className="aspect-[4/3] bg-[#F3F2EE] border border-[#E6E4DD] rounded-xl overflow-hidden">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Contiguous Purchase Module Right */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <p className="text-xs font-medium text-[#5C665E]">
              {product.categoryName} <span aria-hidden="true">·</span> {product.originLocation}
            </p>
            <h1
              className="mt-2 text-2xl sm:text-3xl font-bold text-[#181A18] leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#4B524D] tabular-nums">
              <span className="inline-flex items-center gap-1 font-semibold text-[#181A18]">
                <Star className="w-4 h-4 text-[#C88A16]" fill="#C88A16" aria-hidden="true" />
                {product.averageRating.toFixed(1)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{reviews.length} Ulasan</span>
              <span aria-hidden="true">·</span>
              <span>{product.soldCount} Terjual</span>
              <span aria-hidden="true">·</span>
              <span>Berat {product.weightGram}g</span>
            </div>

            <p className="mt-5 text-3xl font-bold text-[#14452F] tabular-nums">
              {formatRupiah(product.price)}
            </p>
          </div>

          <div className="p-4 bg-white border border-[#E6E4DD] rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#4B524D]">Ketersediaan Stok</span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  outOfStock ? 'text-[#991B1B]' : 'text-[#14452F]'
                }`}
              >
                {outOfStock ? 'Stok Habis' : `${product.stock} unit tersedia`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="qty-display" className="text-sm font-medium text-[#4B524D]">
                Jumlah Pembelian
              </label>
              <div className="inline-flex items-center border border-[#D4D1C7] rounded-lg bg-[#FAFAF8]">
                <button
                  type="button"
                  disabled={quantity <= 1 || outOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Kurangi jumlah pembelian"
                  className="w-10 h-10 flex items-center justify-center text-[#181A18] hover:bg-[#EFECE5] disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  id="qty-display"
                  data-testid="pdp-qty"
                  className="w-12 text-center text-sm font-semibold tabular-nums"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= product.stock || outOfStock}
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  aria-label="Tambah jumlah pembelian"
                  className="w-10 h-10 flex items-center justify-center text-[#181A18] hover:bg-[#EFECE5] disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={outOfStock || submittingAction}
                onClick={async () => {
                  setSubmittingAction(true);
                  await onAddToCart(product.id, quantity);
                  setSubmittingAction(false);
                }}
                className="flex-1 h-12 px-5 bg-[#14452F] hover:bg-[#1D5C3F] disabled:bg-[#C7CEC9] text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Tambah ke Keranjang</span>
              </button>
              <button
                type="button"
                disabled={outOfStock || submittingAction}
                onClick={async () => {
                  setSubmittingAction(true);
                  await onBuyNow(product.id, quantity);
                  setSubmittingAction(false);
                }}
                className="flex-1 h-12 px-5 bg-[#E0A833] hover:bg-[#C88A16] disabled:bg-[#E5E2D9] text-[#181A18] text-sm font-bold rounded-lg transition-colors cursor-pointer"
              >
                Beli Sekarang
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite(product.id)}
                aria-label={isFavorite ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
                className={`h-12 w-12 shrink-0 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  isFavorite
                    ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#B91C1C]'
                    : 'bg-white border-[#D4D1C7] text-[#4B524D] hover:text-[#B91C1C]'
                }`}
              >
                <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* Seller & Origin Card */}
          <div className="p-4 bg-[#F2F7F4] border border-[#D4E2D9] rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-[#14452F]" />
                <span className="text-sm font-bold text-[#14452F]">
                  {seller?.storeName || product.sellerName}
                </span>
              </div>
              <span className="text-xs font-medium text-[#1D5C3F]">
                {seller?.packageTier === 'premium' ? 'Toko UMKM Premium' : 'Mitra UMKM Papua'}
              </span>
            </div>
            <p className="text-xs text-[#3E4C43] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Dikirim dari {seller?.originCity || product.originLocation}</span>
            </p>
            {seller?.description && (
              <p className="text-xs text-[#4B524D] leading-relaxed pt-1">{seller.description}</p>
            )}
          </div>

          {/* Product Description */}
          <div className="pt-2 border-t border-[#E6E4DD]">
            <h2 className="text-base font-bold text-[#181A18] mb-2">Deskripsi Produk</h2>
            <p className="text-sm text-[#4B524D] leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-14 pt-10 border-t border-[#E6E4DD] grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <h2
            className="text-xl font-bold text-[#181A18]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Ulasan Pembeli ({reviews.length})
          </h2>
          <p className="mt-1 text-sm text-[#5C665E]">
            Bagikan pengalaman Anda menggunakan produk lokal Papua ini.
          </p>

          <form
            onSubmit={handleReviewSubmit}
            className="mt-5 p-5 bg-white border border-[#E6E4DD] rounded-xl space-y-4"
          >
            <div>
              <label htmlFor="review-rating" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                Penilaian Bintang
              </label>
              <select
                id="review-rating"
                value={ratingInput}
                onChange={(e) => setRatingInput(Number(e.target.value))}
                className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
              >
                <option value={5}>5 Bintang — Sangat Memuaskan</option>
                <option value={4}>4 Bintang — Bagus</option>
                <option value={3}>3 Bintang — Cukup</option>
                <option value={2}>2 Bintang — Kurang</option>
                <option value={1}>1 Bintang — Tidak Sesuai</option>
              </select>
            </div>
            <div>
              <label htmlFor="review-comment" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                Komentar Ulasan
              </label>
              <textarea
                id="review-comment"
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Ceritakan kualitas produk dan pengemasan dari penjual Papua..."
                className="w-full p-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm focus:outline-none focus:border-[#14452F]"
              />
            </div>
            {reviewError && <p className="text-xs font-medium text-[#991B1B]">{reviewError}</p>}
            <button
              type="submit"
              disabled={reviewSending}
              className="w-full h-10 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {user ? (reviewSending ? 'Mengirim...' : 'Kirim Ulasan') : 'Masuk untuk Mengulas'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {reviews.length === 0 ? (
            <div className="p-8 bg-white border border-[#E6E4DD] rounded-xl text-center text-sm text-[#5C665E]">
              Belum ada ulasan untuk produk ini. Jadilah pembeli pertama yang memberikan ulasan!
            </div>
          ) : (
            reviews.map((rev) => (
              <article key={rev.id} className="p-5 bg-white border border-[#E6E4DD] rounded-xl">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#181A18]">{rev.reviewerName}</p>
                  <span className="text-xs text-[#5C665E] tabular-nums">
                    {new Date(rev.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#A8730D]">
                  <Star className="w-3.5 h-3.5" fill="#C88A16" />
                  <span>{rev.rating}.0 / 5.0</span>
                </div>
                <p className="mt-2.5 text-sm text-[#4B524D] leading-relaxed">{rev.comment}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

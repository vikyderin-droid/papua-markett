import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { formatRupiah } from '../lib/marketplace';
import type { CartItemView } from '../types/marketplace';
import { ProductImage } from './ProductImage';

interface CartViewProps {
  items: CartItemView[];
  subtotal: number;
  loading: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onContinueShopping: () => void;
  onProceedCheckout: () => void;
  onOpenProduct: (productId: string) => void;
}

export function CartView({
  items,
  subtotal,
  loading,
  onUpdateQuantity,
  onRemoveItem,
  onContinueShopping,
  onProceedCheckout,
  onOpenProduct,
}: CartViewProps) {
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <h1
        className="text-3xl font-bold text-[#181A18]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Keranjang Belanja
      </h1>
      <p className="mt-1 text-sm text-[#5C665E]">
        Periksa kembali daftar produk lokal Papua sebelum melanjutkan ke checkout.
      </p>

      {loading ? (
        <div className="mt-8 p-10 bg-white border border-[#E6E4DD] rounded-xl text-center text-sm text-[#5C665E]">
          Memuat keranjang belanja...
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 bg-white border border-[#E6E4DD] rounded-xl p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-[#5C665E] mx-auto mb-3 opacity-60" />
          <h2 className="text-xl font-bold text-[#181A18]">Keranjang Belanja Anda Kosong</h2>
          <p className="mt-2 text-sm text-[#5C665E] max-w-md mx-auto">
            Jelajahi kerajinan noken, kopi Arabika Wamena, batik Papua, dan olahan UMKM lainnya di
            katalog kami.
          </p>
          <button
            type="button"
            onClick={onContinueShopping}
            className="mt-6 px-6 py-3 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Jelajahi Marketplace
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <article
                key={item.productId}
                className="p-4 sm:p-5 bg-white border border-[#E6E4DD] rounded-xl flex flex-col sm:flex-row gap-4 sm:items-center"
              >
                <button
                  type="button"
                  onClick={() => onOpenProduct(item.productId)}
                  className="w-full sm:w-28 aspect-[4/3] rounded-lg overflow-hidden bg-[#F3F2EE] shrink-0 cursor-pointer"
                >
                  <ProductImage
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#5C665E]">
                    {item.product.sellerName} <span aria-hidden="true">·</span>{' '}
                    {item.product.originLocation}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-[#181A18] truncate">
                    <button
                      type="button"
                      onClick={() => onOpenProduct(item.productId)}
                      className="hover:text-[#14452F] cursor-pointer text-left"
                    >
                      {item.product.name}
                    </button>
                  </h2>
                  <p className="mt-1 text-sm font-bold text-[#14452F] tabular-nums">
                    {formatRupiah(item.product.price)}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0EFEA]">
                  <div className="inline-flex items-center border border-[#D4D1C7] rounded-lg bg-[#FAFAF8]">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      aria-label={`Kurangi jumlah ${item.product.name}`}
                      className="w-9 h-9 flex items-center justify-center hover:bg-[#EFECE5] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= item.product.stock}
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      aria-label={`Tambah jumlah ${item.product.name}`}
                      className="w-9 h-9 flex items-center justify-center hover:bg-[#EFECE5] disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[110px]">
                    <p className="text-xs text-[#5C665E]">Subtotal</p>
                    <p className="text-sm font-bold text-[#181A18] tabular-nums">
                      {formatRupiah(item.lineTotal)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.productId)}
                    aria-label={`Hapus ${item.product.name} dari keranjang`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#991B1B] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="lg:col-span-4 bg-white border border-[#E6E4DD] rounded-xl p-6 space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-[#181A18]">Ringkasan Belanja</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-[#4B524D]">
                <span>Total Barang</span>
                <span className="font-semibold tabular-nums">{totalCount} unit</span>
              </div>
              <div className="flex justify-between text-[#4B524D]">
                <span>Subtotal Produk</span>
                <span className="font-semibold tabular-nums">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#5C665E] text-xs">
                <span>Ongkos Kirim</span>
                <span>Dihitung saat Checkout</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6E4DD] flex justify-between items-baseline">
              <span className="text-sm font-semibold text-[#181A18]">Total Sementara</span>
              <span className="text-xl font-bold text-[#14452F] tabular-nums">
                {formatRupiah(subtotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={onProceedCheckout}
              className="w-full h-12 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Lanjut ke Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}

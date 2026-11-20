import { Heart, ShoppingCart, Star } from 'lucide-react';
import { formatRupiah } from '../lib/marketplace';
import type { EnrichedProduct } from '../types/marketplace';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: EnrichedProduct;
  isFavorite: boolean;
  onOpenProduct: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
}

export function ProductCard({
  product,
  isFavorite,
  onOpenProduct,
  onAddToCart,
  onToggleFavorite,
}: ProductCardProps) {
  const outOfStock = product.stock <= 0;

  return (
    <article className="group bg-white border border-[#E6E4DD] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-[#F3F2EE] overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenProduct(product.id)}
          aria-label={`Lihat detail ${product.name}`}
          className="w-full h-full block cursor-pointer"
        >
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>

        {product.isPromoted && (
          <span className="absolute top-3 left-3 bg-[#0E3121]/90 text-[#F5C765] text-[11px] font-semibold px-2.5 py-1 rounded">
            Pilihan UMKM
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleFavorite(product.id)}
          aria-label={
            isFavorite
              ? `Hapus ${product.name} dari favorit`
              : `Simpan ${product.name} ke favorit`
          }
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
            isFavorite
              ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#B91C1C]'
              : 'bg-white/90 border-[#E6E4DD] text-[#4B524D] hover:text-[#B91C1C]'
          }`}
        >
          <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        {/* Zero-Pill unboxed metadata with typographic separator */}
        <p className="text-xs text-[#5C665E] truncate">
          {product.categoryName} <span aria-hidden="true">·</span> {product.originLocation}
        </p>

        <h3 className="mt-1.5 text-base font-semibold text-[#181A18] leading-snug line-clamp-2 min-h-[2.75rem]">
          <button
            type="button"
            onClick={() => onOpenProduct(product.id)}
            className="text-left hover:text-[#14452F] transition-colors cursor-pointer"
          >
            {product.name}
          </button>
        </h3>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p className="text-base font-bold text-[#14452F] tabular-nums">
            {formatRupiah(product.price)}
          </p>
          <div className="flex items-center gap-1 text-xs text-[#5C665E] tabular-nums">
            <Star className="w-3.5 h-3.5 text-[#C88A16]" fill="#C88A16" aria-hidden="true" />
            <span>{product.averageRating.toFixed(1)}</span>
            <span aria-hidden="true">·</span>
            <span>Terjual {product.soldCount}</span>
          </div>
        </div>

        <p className="mt-1 text-xs text-[#5C665E] truncate">
          {product.sellerName} <span aria-hidden="true">·</span>{' '}
          {outOfStock ? (
            <span className="text-[#991B1B] font-medium">Stok Habis</span>
          ) : (
            <span>Stok {product.stock}</span>
          )}
        </p>

        <div className="mt-4 pt-3 border-t border-[#F0EFEA] flex items-center gap-2">
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => onAddToCart(product.id)}
            className="flex-1 inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 text-xs font-semibold text-white bg-[#14452F] hover:bg-[#1D5C3F] disabled:bg-[#C7CEC9] disabled:text-[#5C665E] rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{outOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

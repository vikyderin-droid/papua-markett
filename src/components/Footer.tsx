import type { AppView } from './Navbar';

interface FooterProps {
  onNavigate: (view: AppView) => void;
  onSelectCategory: (categoryId: string) => void;
}

export function Footer({ onNavigate, onSelectCategory }: FooterProps) {
  return (
    <footer className="bg-[#0E3121] text-[#E8ECE9] mt-20 border-t border-[#1D5C3F]/40">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <p
            className="text-xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            PAPUA MARKET
          </p>
          <p className="mt-2 text-sm font-medium text-[#E0A833]">
            Dari Papua untuk Indonesia
          </p>
          <p className="mt-3 text-sm text-[#C7D1CA] leading-relaxed">
            Marketplace digital resmi yang menghubungkan pengrajin, petani, nelayan, dan pelaku
            UMKM asli Tanah Papua dengan pembeli di seluruh Nusantara.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Jelajahi</h3>
          <ul className="space-y-2.5 text-sm text-[#C7D1CA]">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Beranda
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('marketplace')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Semua Produk Lokal
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Kemitraan UMKM & Dokumentasi
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Daftar Penjual Papua
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Kategori Unggulan</h3>
          <ul className="space-y-2.5 text-sm text-[#C7D1CA]">
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('cat-1')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Kerajinan & Noken
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('cat-3')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Kopi & Hasil Perkebunan
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('cat-5')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Fashion & Batik Papua
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onSelectCategory('cat-4')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Hasil Laut Sorong & Biak
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Kontak & Pusat Layanan</h3>
          <ul className="space-y-2.5 text-sm text-[#C7D1CA]">
            <li>Jl. Kamizaum, Merauke, Papua Selatan</li>
            <li><a href="vikyderin@gmail.com" className="hover:text-white transition-colors">vikyderin@gmail.com</a></li>
            <li className="tabular-nums"><a href="tel:+085388699452" className="hover:text-white transition-colors">+085388699452</a></li>
            <li className="text-xs text-[#9AA89F] pt-1">
              Senin – Sabtu, 08.00 – 17.00 WIT
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9AA89F]">
          <p>© 2026 PAPUA MARKET. Pemberdayaan Ekonomi Digital Masyarakat Papua.</p>
          <p>Pembayaran & kurir berjalan dalam mode simulasi aman.</p>
        </div>
      </div>
    </footer>
  );
}

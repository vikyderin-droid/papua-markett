import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import type { PublicUser } from '../types/marketplace';

export type AppView =
  | 'home'
  | 'marketplace'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'auth'
  | 'dashboard'
  | 'about';

interface NavbarProps {
  currentView: AppView;
  user: PublicUser | null;
  cartCount: number;
  unreadNotifications: number;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
}

export function Navbar({
  currentView,
  user,
  cartCount,
  unreadNotifications,
  onNavigate,
  onLogout,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleGo = (view: AppView) => {
    setMobileOpen(false);
    onNavigate(view);
  };

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
      active
        ? 'text-[#14452F] border-[#14452F]'
        : 'text-[#4B524D] border-transparent hover:text-[#181A18]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#E6E4DD]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleGo('home')}
          className="text-lg sm:text-xl font-bold tracking-tight text-[#14452F] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#14452F]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          PAPUA MARKET
        </button>

        {/* Zone 2: 4-5 concise single-line navigation links */}
        <nav aria-label="Navigasi Utama" className="hidden md:flex items-center gap-7">
          <button
            type="button"
            onClick={() => handleGo('home')}
            className={navLinkClass(currentView === 'home')}
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => handleGo('marketplace')}
            className={navLinkClass(currentView === 'marketplace' || currentView === 'product')}
          >
            Marketplace
          </button>
          <button
            type="button"
            onClick={() => handleGo('about')}
            className={navLinkClass(currentView === 'about')}
          >
            Tentang UMKM
          </button>
          <button
            type="button"
            onClick={() => handleGo('cart')}
            className={`${navLinkClass(currentView === 'cart' || currentView === 'checkout')} inline-flex items-center gap-1.5`}
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            <span>Keranjang</span>
            <span className="tabular-nums font-semibold text-[#14452F]" data-testid="nav-cart-count">
              ({cartCount})
            </span>
          </button>
          {user && (
            <button
              type="button"
              onClick={() => handleGo('dashboard')}
              className={navLinkClass(currentView === 'dashboard')}
            >
              Dasbor{unreadNotifications > 0 ? ` (${unreadNotifications})` : ''}
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={() => handleGo('dashboard')}
              className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#14452F] hover:bg-[#1D5C3F] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user.role === 'admin'
                ? 'Panel Admin'
                : user.role === 'seller'
                  ? 'Toko Saya'
                  : user.name.split(' ')[0]}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleGo('auth')}
              className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#14452F] hover:bg-[#1D5C3F] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Masuk / Daftar
            </button>
          )}

          {/* Mobile quick cart + menu trigger */}
          <button
            type="button"
            onClick={() => handleGo('cart')}
            aria-label={`Buka keranjang belanja (${cartCount} item)`}
            className="md:hidden inline-flex items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2 text-sm font-semibold text-[#14452F]"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="tabular-nums">{cartCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-[#181A18] rounded-lg hover:bg-[#F0EFEA]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E6E4DD] bg-[#FAFAF8] px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleGo('home')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#181A18] rounded-lg hover:bg-[#F0EFEA]"
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => handleGo('marketplace')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#181A18] rounded-lg hover:bg-[#F0EFEA]"
          >
            Marketplace Produk Papua
          </button>
          <button
            type="button"
            onClick={() => handleGo('about')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#181A18] rounded-lg hover:bg-[#F0EFEA]"
          >
            Tentang UMKM & Sistem
          </button>
          <button
            type="button"
            onClick={() => handleGo('cart')}
            className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#181A18] rounded-lg hover:bg-[#F0EFEA]"
          >
            Keranjang Belanja ({cartCount})
          </button>
          {user ? (
            <>
              <button
                type="button"
                onClick={() => handleGo('dashboard')}
                className="block w-full text-left px-3 py-2.5 text-sm font-semibold text-[#14452F] rounded-lg bg-[#F2F7F4]"
              >
                Dasbor {user.role === 'admin' ? 'Admin' : user.role === 'seller' ? 'Penjual' : 'Pembeli'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onLogout();
                }}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-[#991B1B] rounded-lg hover:bg-[#FEF2F2]"
              >
                Keluar Akun
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleGo('auth')}
              className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-[#14452F] rounded-lg"
            >
              Masuk / Daftar
            </button>
          )}
        </div>
      )}
    </header>
  );
}

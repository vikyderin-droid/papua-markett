import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { apiRequest } from './lib/api';
import type {
  Address,
  BootstrapResponse,
  CartItemView,
  Category,
  EnrichedProduct,
  Order,
  PaymentMethod,
  PublicUser,
  Seller,
  SortOption,
} from './types/marketplace';
import { Navbar, type AppView } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { MarketplaceView } from './components/MarketplaceView';
import { ProductDetailView } from './components/ProductDetailView';
import { CartView } from './components/CartView';
import { CheckoutView } from './components/CheckoutView';
import { AuthView } from './components/AuthView';
import { BuyerDashboardView } from './components/BuyerDashboardView';
import { SellerDashboardView } from './components/SellerDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AboutView } from './components/AboutView';

interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  text: string;
}

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [user, setUser] = useState<PublicUser | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<EnrichedProduct[]>([]);
  const [commissionRate, setCommissionRate] = useState(5);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [cartItems, setCartItems] = useState<CartItemView[]>([]);
  const [cartSubtotal, setCartSubtotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartLoading, setCartLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  // Marketplace filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    const id = Date.now();
    setToast({ id, type, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3600);
  }, []);

  const loadBootstrap = useCallback(async () => {
    const data = await apiRequest<BootstrapResponse>('/api/bootstrap');
    setUser(data.user);
    setSeller(data.seller);
    setCategories(data.categories);
    setProducts(data.products);
    setCommissionRate(data.commissionRate);
    setCartCount(data.cartCount);
    setFavoriteIds(data.favoriteIds);
    setUnreadNotifications(data.unreadNotifications);
  }, []);

  const loadCart = useCallback(async () => {
    setCartLoading(true);
    try {
      const data = await apiRequest<{
        items: CartItemView[];
        subtotal: number;
        totalItems: number;
      }>('/api/cart');
      setCartItems(data.items);
      setCartSubtotal(data.subtotal);
      setCartCount(data.totalItems);
    } finally {
      setCartLoading(false);
    }
  }, []);

  const loadSavedAddresses = useCallback(async () => {
    try {
      const data = await apiRequest<{ addresses: Address[] }>('/api/buyer/dashboard');
      setSavedAddresses(data.addresses);
    } catch {
      setSavedAddresses([]);
    }
  }, []);

  const loadInitial = useCallback(() => {
    setInitialLoading(true);
    setLoadError('');
    Promise.all([loadBootstrap(), loadCart()])
      .catch((err) => {
        setLoadError(
          err instanceof Error && err.message
            ? err.message
            : 'Server PAPUA MARKET tidak dapat dihubungi.',
        );
      })
      .finally(() => setInitialLoading(false));
  }, [loadBootstrap, loadCart]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (user) {
      void loadSavedAddresses();
    } else {
      setSavedAddresses([]);
    }
  }, [user, loadSavedAddresses]);

  const navigateTo = (nextView: AppView) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProduct = (productId: string) => {
    setSelectedProductId(productId);
    navigateTo('product');
  };

  const handleAddToCart = async (productId: string, quantity = 1) => {
    try {
      const data = await apiRequest<{
        items: CartItemView[];
        subtotal: number;
        totalItems: number;
      }>('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
      setCartItems(data.items);
      setCartSubtotal(data.subtotal);
      setCartCount(data.totalItems);
      showToast('success', 'Produk berhasil ditambahkan ke keranjang belanja.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menambahkan ke keranjang.');
    }
  };

  const handleBuyNow = async (productId: string, quantity = 1) => {
    await handleAddToCart(productId, quantity);
    navigateTo('checkout');
  };

  const handleUpdateCartQuantity = async (productId: string, quantity: number) => {
    try {
      const data = await apiRequest<{
        items: CartItemView[];
        subtotal: number;
        totalItems: number;
      }>(`/api/cart/items/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      setCartItems(data.items);
      setCartSubtotal(data.subtotal);
      setCartCount(data.totalItems);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memperbarui jumlah.');
    }
  };

  const handleRemoveCartItem = async (productId: string) => {
    try {
      const data = await apiRequest<{
        items: CartItemView[];
        subtotal: number;
        totalItems: number;
      }>(`/api/cart/items/${productId}`, { method: 'DELETE' });
      setCartItems(data.items);
      setCartSubtotal(data.subtotal);
      setCartCount(data.totalItems);
      showToast('success', 'Produk dihapus dari keranjang.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menghapus produk.');
    }
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!user) {
      showToast('error', 'Silakan masuk akun untuk menyimpan produk favorit.');
      navigateTo('auth');
      return;
    }
    try {
      const res = await apiRequest<{ isFavorite: boolean; favoriteIds: string[] }>(
        '/api/favorites/toggle',
        {
          method: 'POST',
          body: JSON.stringify({ productId }),
        },
      );
      setFavoriteIds(res.favoriteIds);
      showToast(
        'success',
        res.isFavorite ? 'Produk disimpan ke daftar favorit.' : 'Produk dihapus dari favorit.',
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal memperbarui favorit.');
    }
  };

  const handleCheckoutSubmit = async (payload: {
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingProvince: string;
    shippingPostalCode: string;
    shippingMethodId: string;
    paymentMethod: PaymentMethod;
    saveAddress: boolean;
  }): Promise<Order> => {
    const res = await apiRequest<{ order: Order }>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await Promise.all([loadCart(), loadBootstrap()]);
    showToast('success', `Pesanan ${res.order.orderNumber} berhasil dicatat!`);
    return res.order;
  };

  const handleAuthSuccess = async (loggedUser: PublicUser, loggedSeller: Seller | null) => {
    setUser(loggedUser);
    setSeller(loggedSeller);
    await Promise.all([loadBootstrap(), loadCart()]);
    showToast('success', `Selamat datang, ${loggedUser.name}!`);
    navigateTo('dashboard');
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal keluar dari akun.');
      return;
    }
    setUser(null);
    setSeller(null);
    setFavoriteIds([]);
    setUnreadNotifications(0);
    await loadCart();
    showToast('success', 'Anda telah keluar dari akun.');
    navigateTo('home');
  };

  const handleSearchFromHome = (query: string) => {
    setSearchQuery(query);
    setSelectedCategoryId('all');
    navigateTo('marketplace');
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSearchQuery('');
    navigateTo('marketplace');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategoryId('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('popular');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8] text-[#181A18]">
      <Navbar
        currentView={view}
        user={user}
        cartCount={cartCount}
        unreadNotifications={unreadNotifications}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />

      {/* Non-blocking status toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-20 inset-x-4 sm:top-auto sm:inset-x-auto sm:bottom-5 sm:right-5 z-50 sm:max-w-sm px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-xs sm:text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-[#0E3121] text-white border-[#1D5C3F]'
              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#E0A833] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="flex-1">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup pemberitahuan"
            className="opacity-75 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1">
        {initialLoading ? (
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 text-center text-sm text-[#5C665E]">
            Memuat etalase PAPUA MARKET...
          </div>
        ) : loadError ? (
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 text-center">
            <h2 className="text-xl font-bold text-[#14452F] mb-2">Data belum dapat dimuat</h2>
            <p className="text-sm text-[#5C665E] mb-1">{loadError}</p>
            <p className="text-xs text-[#5C665E] mb-5">
              Pastikan server berjalan dengan perintah <b>npm run dev</b> dan buka alamat{' '}
              <b>http://localhost:3000</b>.
            </p>
            <button
              type="button"
              onClick={loadInitial}
              className="px-5 py-2.5 rounded-xl bg-[#14452F] text-white text-sm font-semibold cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : view === 'home' ? (
          <HomeView
            categories={categories}
            products={products}
            favoriteIds={favoriteIds}
            onSearchSubmit={handleSearchFromHome}
            onSelectCategory={handleSelectCategory}
            onOpenProduct={handleOpenProduct}
            onAddToCart={(pid) => handleAddToCart(pid, 1)}
            onToggleFavorite={handleToggleFavorite}
            onNavigate={navigateTo}
          />
        ) : view === 'marketplace' ? (
          <MarketplaceView
            categories={categories}
            products={products}
            favoriteIds={favoriteIds}
            searchQuery={searchQuery}
            selectedCategoryId={selectedCategoryId}
            minPrice={minPrice}
            maxPrice={maxPrice}
            sortBy={sortBy}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategoryId}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
            onSortChange={setSortBy}
            onResetFilters={handleResetFilters}
            onOpenProduct={handleOpenProduct}
            onAddToCart={(pid) => handleAddToCart(pid, 1)}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : view === 'product' && selectedProductId ? (
          <ProductDetailView
            productId={selectedProductId}
            user={user}
            isFavorite={favoriteIds.includes(selectedProductId)}
            onBack={() => navigateTo('marketplace')}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onToggleFavorite={handleToggleFavorite}
            onRequireAuth={() => navigateTo('auth')}
          />
        ) : view === 'cart' ? (
          <CartView
            items={cartItems}
            subtotal={cartSubtotal}
            loading={cartLoading}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onContinueShopping={() => navigateTo('marketplace')}
            onProceedCheckout={() => navigateTo('checkout')}
            onOpenProduct={handleOpenProduct}
          />
        ) : view === 'checkout' ? (
          <CheckoutView
            user={user}
            items={cartItems}
            addresses={savedAddresses}
            commissionRate={commissionRate}
            onSubmitOrder={handleCheckoutSubmit}
            onGoToOrders={() => navigateTo('dashboard')}
            onContinueShopping={() => navigateTo('marketplace')}
          />
        ) : view === 'auth' ? (
          <AuthView onAuthSuccess={handleAuthSuccess} />
        ) : view === 'dashboard' ? (
          !user ? (
            <AuthView onAuthSuccess={handleAuthSuccess} />
          ) : user.role === 'admin' ? (
            <AdminDashboardView
              user={user}
              onCatalogMutated={loadBootstrap}
              onLogout={handleLogout}
            />
          ) : user.role === 'seller' ? (
            <SellerDashboardView
              user={user}
              categories={categories}
              onCatalogMutated={loadBootstrap}
              onLogout={handleLogout}
            />
          ) : (
            <BuyerDashboardView
              user={user}
              favoriteIds={favoriteIds}
              onOpenProduct={handleOpenProduct}
              onAddToCart={(pid) => handleAddToCart(pid, 1)}
              onToggleFavorite={handleToggleFavorite}
              onLogout={handleLogout}
              onNotificationsCleared={() => setUnreadNotifications(0)}
            />
          )
        ) : (
          <AboutView commissionRate={commissionRate} onNavigate={navigateTo} />
        )}
      </main>

      <Footer onNavigate={navigateTo} onSelectCategory={handleSelectCategory} />
    </div>
  );
}

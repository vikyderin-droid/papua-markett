import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  BarChart3,
  Edit3,
  LogOut,
  Package,
  Plus,
  Store,
  Trash2,
  Upload,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { formatRupiah, ORDER_STATUS_LABELS } from '../lib/marketplace';
import type {
  Category,
  EnrichedProduct,
  Order,
  OrderItem,
  OrderStatus,
  PublicUser,
  Seller,
} from '../types/marketplace';
import { ProductImage } from './ProductImage';

interface SellerOrder extends Order {
  sellerItems: OrderItem[];
}

interface SellerDashboardViewProps {
  user: PublicUser;
  categories: Category[];
  onCatalogMutated: () => Promise<void>;
  onLogout: () => void;
}

type SellerTab = 'overview' | 'products' | 'orders' | 'store';

export function SellerDashboardView({
  user,
  categories,
  onCatalogMutated,
  onLogout,
}: SellerDashboardViewProps) {
  const [tab, setTab] = useState<SellerTab>('overview');
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<EnrichedProduct[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSold: 0,
    grossRevenue: 0,
    commissionRate: 5,
    commissionDeducted: 0,
    netRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Add/Edit Product Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState(categories[0]?.id || 'cat-1');
  const [prodPrice, setProdPrice] = useState('100000');
  const [prodStock, setProdStock] = useState('15');
  const [prodWeight, setProdWeight] = useState('400');
  const [prodOrigin, setProdOrigin] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState(
    '/src/assets/images/prod_noken_wamena_1794826320314.jpg',
  );
  const [prodPromoted, setProdPromoted] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [prodError, setProdError] = useState('');
  const [savingProd, setSavingProd] = useState(false);

  // Store settings form
  const [storeName, setStoreName] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [storeDesc, setStoreDesc] = useState('');
  const [packageTier, setPackageTier] = useState<'reguler' | 'premium'>('reguler');
  const [storeMsg, setStoreMsg] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{
        seller: Seller;
        products: EnrichedProduct[];
        orders: SellerOrder[];
        stats: typeof stats;
      }>('/api/seller/dashboard');
      setSeller(data.seller);
      setProducts(data.products);
      setOrders(data.orders);
      setStats(data.stats);
      setStoreName(data.seller.storeName);
      setOriginCity(data.seller.originCity);
      setStoreDesc(data.seller.description);
      setPackageTier(data.seller.packageTier);
      if (!prodOrigin) setProdOrigin(data.seller.originCity);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const openCreateForm = () => {
    setEditingId(null);
    setProdName('');
    setProdCat(categories[0]?.id || 'cat-1');
    setProdPrice('120000');
    setProdStock('10');
    setProdWeight('400');
    setProdOrigin(seller?.originCity || 'Jayapura, Papua');
    setProdDesc('');
    setProdImageUrl('/src/assets/images/prod_noken_wamena_1794826320314.jpg');
    setProdPromoted(false);
    setProdError('');
    setFormOpen(true);
    setTab('products');
  };

  const openEditForm = (product: EnrichedProduct) => {
    setEditingId(product.id);
    setProdName(product.name);
    setProdCat(product.categoryId);
    setProdPrice(String(product.price));
    setProdStock(String(product.stock));
    setProdWeight(String(product.weightGram));
    setProdOrigin(product.originLocation);
    setProdDesc(product.description);
    setProdImageUrl(product.imageUrl);
    setProdPromoted(product.isPromoted);
    setProdError('');
    setFormOpen(true);
    setTab('products');
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProdError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProdError('Pilih file gambar berformat JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProdError('Ukuran foto maksimal 2 MB.');
      return;
    }
    setUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
        reader.readAsDataURL(file);
      });
      const res = await apiRequest<{ imageUrl: string }>('/api/seller/upload', {
        method: 'POST',
        body: JSON.stringify({ dataUrl }),
      });
      setProdImageUrl(res.imageUrl);
    } catch (err) {
      setProdError(err instanceof Error ? err.message : 'Gagal mengunggah gambar.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setProdError('');
    setSavingProd(true);
    try {
      const payload = {
        name: prodName,
        categoryId: prodCat,
        price: Number(prodPrice),
        stock: Number(prodStock),
        weightGram: Number(prodWeight),
        originLocation: prodOrigin,
        description: prodDesc,
        imageUrl: prodImageUrl,
        isPromoted: prodPromoted,
      };
      if (editingId) {
        await apiRequest(`/api/seller/products/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/seller/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setFormOpen(false);
      await loadDashboard();
      await onCatalogMutated();
    } catch (err) {
      setProdError(err instanceof Error ? err.message : 'Gagal menyimpan produk.');
    } finally {
      setSavingProd(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    await apiRequest(`/api/seller/products/${productId}`, { method: 'DELETE' });
    await loadDashboard();
    await onCatalogMutated();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await apiRequest(`/api/seller/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadDashboard();
  };

  const handleSaveStore = async (e: FormEvent) => {
    e.preventDefault();
    setStoreMsg('');
    await apiRequest('/api/seller/store', {
      method: 'PUT',
      body: JSON.stringify({
        storeName,
        originCity,
        description: storeDesc,
        packageTier,
      }),
    });
    setStoreMsg('Pengaturan toko UMKM berhasil diperbarui.');
    await loadDashboard();
    await onCatalogMutated();
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6E4DD]">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#A8730D]">
            Dashboard Penjual UMKM Papua
          </p>
          <h1
            className="mt-1 text-2xl sm:text-3xl font-bold text-[#181A18]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {seller?.storeName || user.name}
          </h1>
          <p className="text-xs text-[#5C665E] mt-1">
            {seller?.originCity} <span aria-hidden="true">·</span> Paket{' '}
            {seller?.packageTier === 'premium' ? 'Toko Premium UMKM' : 'Toko Reguler'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#14452F] hover:bg-[#1D5C3F] text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#D4D1C7] hover:bg-[#FEF2F2] hover:text-[#991B1B] rounded-lg text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('overview')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            tab === 'overview'
              ? 'bg-[#14452F] text-white'
              : 'bg-white border border-[#E6E4DD] text-[#4B524D]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Statistik Penjualan</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('products')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            tab === 'products'
              ? 'bg-[#14452F] text-white'
              : 'bg-white border border-[#E6E4DD] text-[#4B524D]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produk Saya ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            tab === 'orders'
              ? 'bg-[#14452F] text-white'
              : 'bg-white border border-[#E6E4DD] text-[#4B524D]'
          }`}
        >
          <span>Pesanan Masuk ({orders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('store')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            tab === 'store'
              ? 'bg-[#14452F] text-white'
              : 'bg-white border border-[#E6E4DD] text-[#4B524D]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Informasi &amp; Paket Toko</span>
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="p-10 bg-white border border-[#E6E4DD] rounded-xl text-center text-sm text-[#5C665E]">
            Memuat data toko...
          </div>
        ) : tab === 'overview' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-[#E6E4DD] rounded-xl">
              <p className="text-xs text-[#5C665E]">Pendapatan Kotor Toko</p>
              <p className="mt-2 text-2xl font-bold text-[#181A18] tabular-nums">
                {formatRupiah(stats.grossRevenue)}
              </p>
            </div>
            <div className="p-5 bg-white border border-[#E6E4DD] rounded-xl">
              <p className="text-xs text-[#5C665E]">
                Komisi Platform ({stats.commissionRate}%)
              </p>
              <p className="mt-2 text-2xl font-bold text-[#A8730D] tabular-nums">
                {formatRupiah(stats.commissionDeducted)}
              </p>
            </div>
            <div className="p-5 bg-white border border-[#E6E4DD] rounded-xl">
              <p className="text-xs text-[#5C665E]">Estimasi Pendapatan Bersih</p>
              <p className="mt-2 text-2xl font-bold text-[#14452F] tabular-nums">
                {formatRupiah(stats.netRevenue)}
              </p>
            </div>
            <div className="p-5 bg-white border border-[#E6E4DD] rounded-xl">
              <p className="text-xs text-[#5C665E]">Total Unit Terjual</p>
              <p className="mt-2 text-2xl font-bold text-[#181A18] tabular-nums">
                {stats.totalSold} unit
              </p>
            </div>
          </div>
        ) : tab === 'products' ? (
          <div className="space-y-6">
            {formOpen && (
              <form
                onSubmit={handleSaveProduct}
                className="bg-white border border-[#14452F]/40 rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#181A18]">
                    {editingId ? 'Edit Produk Lokal Papua' : 'Tambah Produk Baru'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="text-xs font-semibold text-[#5C665E] hover:text-[#181A18] cursor-pointer"
                  >
                    Tutup Form
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="sp-name" className="block text-xs font-semibold text-[#4B524D] mb-1">
                      Nama Produk
                    </label>
                    <input
                      id="sp-name"
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="Contoh: Kopi Moanemani 250g"
                      className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="sp-cat" className="block text-xs font-semibold text-[#4B524D] mb-1">
                      Kategori Produk
                    </label>
                    <select
                      id="sp-cat"
                      value={prodCat}
                      onChange={(e) => setProdCat(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="sp-price" className="block text-xs font-semibold text-[#4B524D] mb-1">
                      Harga (Rp)
                    </label>
                    <input
                      id="sp-price"
                      type="number"
                      min={1000}
                      required
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="sp-stock" className="block text-xs font-semibold text-[#4B524D] mb-1">
                      Stok (Unit)
                    </label>
                    <input
                      id="sp-stock"
                      type="number"
                      min={0}
                      required
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="sp-weight" className="block text-xs font-semibold text-[#4B524D] mb-1">
                      Berat (Gram)
                    </label>
                    <input
                      id="sp-weight"
                      type="number"
                      min={50}
                      required
                      value={prodWeight}
                      onChange={(e) => setProdWeight(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="sp-origin" className="block text-xs font-semibold text-[#4B524D] mb-1">
                      Lokasi Asal Papua
                    </label>
                    <input
                      id="sp-origin"
                      type="text"
                      required
                      value={prodOrigin}
                      onChange={(e) => setProdOrigin(e.target.value)}
                      className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sp-desc" className="block text-xs font-semibold text-[#4B524D] mb-1">
                    Deskripsi Produk
                  </label>
                  <textarea
                    id="sp-desc"
                    rows={3}
                    required
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Jelaskan bahan, proses pembuatan tradisional, dan keunggulan produk..."
                    className="w-full p-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-28 aspect-[4/3] rounded-lg overflow-hidden bg-[#F3F2EE] border border-[#E6E4DD] shrink-0">
                    <ProductImage
                      src={prodImageUrl}
                      alt="Pratinjau Foto Produk"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2F7F4] border border-[#14452F]/30 text-[#14452F] text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#E5EFE9]">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingImage ? 'Mengunggah...' : 'Upload Foto Produk (JPG/PNG/WEBP)'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </label>
                    <p className="text-xs text-[#5C665E]">
                      Maksimal 2 MB. Foto tersimpan otomatis di server PAPUA MARKET.
                    </p>
                  </div>
                </div>

                {seller?.packageTier === 'premium' && (
                  <label className="inline-flex items-center gap-2 text-xs text-[#4B524D] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodPromoted}
                      onChange={(e) => setProdPromoted(e.target.checked)}
                    />
                    <span>Tampilkan sebagai Produk Promosi UMKM (Fitur Paket Premium)</span>
                  </label>
                )}

                {prodError && <p className="text-xs font-medium text-[#991B1B]">{prodError}</p>}

                <button
                  type="submit"
                  disabled={savingProd}
                  className="px-6 py-2.5 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-sm font-semibold rounded-lg cursor-pointer"
                >
                  {savingProd ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Terbitkan Produk'}
                </button>
              </form>
            )}

            {products.length === 0 ? (
              <div className="p-10 bg-white border border-[#E6E4DD] rounded-xl text-center text-sm text-[#5C665E]">
                Belum ada produk di etalase toko Anda. Klik &ldquo;Tambah Produk&rdquo; untuk memulai.
              </div>
            ) : (
              <div className="bg-white border border-[#E6E4DD] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAFAF8] border-b border-[#E6E4DD] text-xs text-[#5C665E]">
                      <tr>
                        <th className="py-3 px-4">Produk</th>
                        <th className="py-3 px-4">Harga</th>
                        <th className="py-3 px-4">Stok</th>
                        <th className="py-3 px-4">Terjual</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EFEA]">
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 aspect-[4/3] rounded bg-[#F3F2EE] overflow-hidden shrink-0">
                                <ProductImage
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-[#181A18]">{product.name}</p>
                                <p className="text-xs text-[#5C665E]">{product.categoryName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold tabular-nums">
                            {formatRupiah(product.price)}
                          </td>
                          <td className="py-3 px-4 tabular-nums">{product.stock}</td>
                          <td className="py-3 px-4 tabular-nums">{product.soldCount}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditForm(product)}
                                aria-label={`Edit ${product.name}`}
                                className="p-2 rounded-lg text-[#14452F] hover:bg-[#F2F7F4] cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id)}
                                aria-label={`Hapus ${product.name}`}
                                className="p-2 rounded-lg text-[#991B1B] hover:bg-[#FEF2F2] cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : tab === 'orders' ? (
          orders.length === 0 ? (
            <div className="p-10 bg-white border border-[#E6E4DD] rounded-xl text-center text-sm text-[#5C665E]">
              Belum ada pesanan masuk untuk toko Anda.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="bg-white border border-[#E6E4DD] rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0EFEA]">
                    <div>
                      <p className="text-xs font-mono font-bold text-[#14452F]">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-[#5C665E]">
                        Pembeli: {order.buyerName} · {order.shippingCity}, {order.shippingProvince}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-3 py-1 rounded bg-[#F2F7F4] text-[#14452F]">
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                      {order.status === 'menunggu' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'diproses')}
                          className="px-3 py-1.5 bg-[#14452F] text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Proses Pesanan
                        </button>
                      )}
                      {order.status === 'diproses' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'dikirim')}
                          className="px-3 py-1.5 bg-[#E0A833] text-[#181A18] text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Kirim Pesanan
                        </button>
                      )}
                      {order.status === 'dikirim' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, 'selesai')}
                          className="px-3 py-1.5 bg-[#14452F] text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Tandai Selesai
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {order.sellerItems.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )
        ) : (
          <form
            onSubmit={handleSaveStore}
            className="bg-white border border-[#E6E4DD] rounded-xl p-6 max-w-2xl space-y-4"
          >
            <h2 className="text-base font-bold text-[#181A18]">Pengaturan Toko &amp; Paket UMKM</h2>
            <div>
              <label htmlFor="st-name" className="block text-xs font-semibold text-[#4B524D] mb-1">
                Nama Toko
              </label>
              <input
                id="st-name"
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
              />
            </div>
            <div>
              <label htmlFor="st-city" className="block text-xs font-semibold text-[#4B524D] mb-1">
                Kota Asal Papua
              </label>
              <input
                id="st-city"
                type="text"
                required
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
              />
            </div>
            <div>
              <label htmlFor="st-desc" className="block text-xs font-semibold text-[#4B524D] mb-1">
                Deskripsi Toko
              </label>
              <textarea
                id="st-desc"
                rows={3}
                value={storeDesc}
                onChange={(e) => setStoreDesc(e.target.value)}
                className="w-full p-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
              />
            </div>
            <div>
              <label htmlFor="st-tier" className="block text-xs font-semibold text-[#4B524D] mb-1">
                Paket Keanggotaan Toko
              </label>
              <select
                id="st-tier"
                value={packageTier}
                onChange={(e) => setPackageTier(e.target.value as 'reguler' | 'premium')}
                className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
              >
                <option value="reguler">Paket Reguler UMKM (Gratis)</option>
                <option value="premium">
                  Paket Toko Premium UMKM (Prioritas Promosi Produk Unggulan)
                </option>
              </select>
            </div>
            {storeMsg && <p className="text-xs font-semibold text-[#14452F]">{storeMsg}</p>}
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-sm font-semibold rounded-lg cursor-pointer"
            >
              Simpan Pengaturan Toko
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import {
  BarChart3,
  FolderKanban,
  LogOut,
  PackageCheck,
  ReceiptText,
  Users,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { formatRupiah, ORDER_STATUS_LABELS } from '../lib/marketplace';
import type {
  Category,
  EnrichedProduct,
  Order,
  OrderStatus,
  PublicUser,
  Seller,
  UserRole,
} from '../types/marketplace';

interface AdminDashboardViewProps {
  user: PublicUser;
  onCatalogMutated: () => Promise<void>;
  onLogout: () => void;
}

type AdminTab = 'overview' | 'categories' | 'products' | 'users' | 'orders';

export function AdminDashboardView({
  user,
  onCatalogMutated,
  onLogout,
}: AdminDashboardViewProps) {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalGmv: 0,
    totalCommission: 0,
    commissionRate: 5,
  });
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<EnrichedProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [commissionInput, setCommissionInput] = useState('5');
  const [commissionMsg, setCommissionMsg] = useState('');

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catError, setCatError] = useState('');

  const loadAdmin = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{
        stats: typeof stats;
        users: PublicUser[];
        sellers: Seller[];
        categories: Category[];
        products: EnrichedProduct[];
        orders: Order[];
      }>('/api/admin/dashboard');
      setStats(data.stats);
      setCommissionInput(String(data.stats.commissionRate));
      setUsers(data.users);
      setSellers(data.sellers);
      setCategories(data.categories);
      setProducts(data.products);
      setOrders(data.orders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdmin();
  }, []);

  const handleSaveCommission = async (e: FormEvent) => {
    e.preventDefault();
    setCommissionMsg('');
    const res = await apiRequest<{ commissionRate: number }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ commissionRate: Number(commissionInput) }),
    });
    setCommissionMsg(`Komisi transaksi platform diperbarui menjadi ${res.commissionRate}%.`);
    await loadAdmin();
    await onCatalogMutated();
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    setCatError('');
    try {
      await apiRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: catName, description: catDesc }),
      });
      setCatName('');
      setCatDesc('');
      await loadAdmin();
      await onCatalogMutated();
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Gagal menambah kategori.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setCatError('');
    try {
      await apiRequest(`/api/admin/categories/${id}`, { method: 'DELETE' });
      await loadAdmin();
      await onCatalogMutated();
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Kategori tidak dapat dihapus.');
    }
  };

  const handleToggleProductFlag = async (
    productId: string,
    patch: Partial<Pick<EnrichedProduct, 'isFeatured' | 'isPromoted' | 'isActive'>>,
  ) => {
    await apiRequest(`/api/admin/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    await loadAdmin();
    await onCatalogMutated();
  };

  const handleUpdateUser = async (
    userId: string,
    patch: Partial<{ role: UserRole; isActive: boolean }>,
  ) => {
    await apiRequest(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    await loadAdmin();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await apiRequest(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadAdmin();
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6E4DD]">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#A8730D]">
            Panel Administrator PAPUA MARKET
          </p>
          <h1
            className="mt-1 text-2xl sm:text-3xl font-bold text-[#181A18]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Pengawasan Ekosistem &amp; Komisi
          </h1>
          <p className="text-xs text-[#5C665E] mt-1">
            Masuk sebagai {user.name} ({user.email})
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#D4D1C7] hover:bg-[#FEF2F2] hover:text-[#991B1B] rounded-lg text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>
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
          <span>Ringkasan &amp; Komisi</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('categories')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            tab === 'categories'
              ? 'bg-[#14452F] text-white'
              : 'bg-white border border-[#E6E4DD] text-[#4B524D]'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Kategori ({categories.length})</span>
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
          <PackageCheck className="w-4 h-4" />
          <span>Produk ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('users')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            tab === 'users'
              ? 'bg-[#14452F] text-white'
              : 'bg-white border border-[#E6E4DD] text-[#4B524D]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pengguna ({users.length})</span>
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
          <ReceiptText className="w-4 h-4" />
          <span>Transaksi ({orders.length})</span>
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="p-10 bg-white border border-[#E6E4DD] rounded-xl text-center text-sm text-[#5C665E]">
            Memuat data administrator...
          </div>
        ) : tab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-[#E6E4DD] rounded-xl">
                <p className="text-xs text-[#5C665E]">Total Pengguna / Toko Penjual</p>
                <p className="mt-2 text-2xl font-bold text-[#181A18] tabular-nums">
                  {stats.totalUsers} / {stats.totalSellers}
                </p>
              </div>
              <div className="p-5 bg-white border border-[#E6E4DD] rounded-xl">
                <p className="text-xs text-[#5C665E]">Total Produk &amp; Transaksi</p>
                <p className="mt-2 text-2xl font-bold text-[#181A18] tabular-nums">
                  {stats.totalProducts} produk · {stats.totalOrders} order
                </p>
              </div>
              <div className="p-5 bg-white border border-[#E6E4DD] rounded-xl">
                <p className="text-xs text-[#5C665E]">Nilai Transaksi Bruto (GMV)</p>
                <p className="mt-2 text-2xl font-bold text-[#14452F] tabular-nums">
                  {formatRupiah(stats.totalGmv)}
                </p>
              </div>
              <div className="p-5 bg-white border border-[#E6E4DD] rounded-xl">
                <p className="text-xs text-[#5C665E]">
                  Pendapatan Komisi ({stats.commissionRate}%)
                </p>
                <p className="mt-2 text-2xl font-bold text-[#A8730D] tabular-nums">
                  {formatRupiah(stats.totalCommission)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveCommission}
                className="lg:col-span-6 bg-white border border-[#E6E4DD] rounded-xl p-6 space-y-4"
              >
                <h2 className="text-base font-bold text-[#181A18]">
                  Pengaturan Persentase Komisi Marketplace
                </h2>
                <p className="text-xs text-[#5C665E] leading-relaxed">
                  Komisi platform diterapkan otomatis pada setiap transaksi checkout dan laporan
                  penghasilan penjual UMKM.
                </p>
                <div className="flex items-center gap-3">
                  <label htmlFor="admin-commission" className="text-xs font-semibold text-[#4B524D]">
                    Tarif Komisi (%):
                  </label>
                  <input
                    id="admin-commission"
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(e.target.value)}
                    className="w-28 h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm font-semibold tabular-nums"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Simpan Tarif
                  </button>
                </div>
                {commissionMsg && (
                  <p className="text-xs font-semibold text-[#14452F]">{commissionMsg}</p>
                )}
              </form>

              <div className="lg:col-span-6 bg-white border border-[#E6E4DD] rounded-xl p-6 space-y-3">
                <h2 className="text-base font-bold text-[#181A18]">
                  Daftar Toko UMKM Terdaftar ({sellers.length})
                </h2>
                <div className="divide-y divide-[#F0EFEA] text-xs">
                  {sellers.map((s) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#181A18]">{s.storeName}</p>
                        <p className="text-[#5C665E]">{s.originCity}</p>
                      </div>
                      <span className="font-semibold text-[#14452F] uppercase">
                        {s.packageTier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : tab === 'categories' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleAddCategory}
              className="lg:col-span-4 bg-white border border-[#E6E4DD] rounded-xl p-5 space-y-4"
            >
              <h2 className="text-base font-bold text-[#181A18]">Tambah Kategori Baru</h2>
              <div>
                <label htmlFor="cat-name" className="block text-xs font-semibold text-[#4B524D] mb-1">
                  Nama Kategori
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Rempah & Herbal Papua"
                  className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                />
              </div>
              <div>
                <label htmlFor="cat-desc" className="block text-xs font-semibold text-[#4B524D] mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  id="cat-desc"
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full p-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                />
              </div>
              {catError && <p className="text-xs text-[#991B1B]">{catError}</p>}
              <button
                type="submit"
                className="w-full h-10 bg-[#14452F] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Simpan Kategori
              </button>
            </form>

            <div className="lg:col-span-8 bg-white border border-[#E6E4DD] rounded-xl divide-y divide-[#F0EFEA]">
              {categories.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#181A18]">{c.name}</p>
                    <p className="text-xs text-[#5C665E]">{c.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#991B1B] hover:bg-[#FEF2F2] rounded-lg cursor-pointer shrink-0"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : tab === 'products' ? (
          <div className="bg-white border border-[#E6E4DD] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAFAF8] border-b border-[#E6E4DD] text-xs text-[#5C665E]">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Toko</th>
                  <th className="py-3 px-4">Harga</th>
                  <th className="py-3 px-4">Unggulan</th>
                  <th className="py-3 px-4">Promosi Iklan</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA]">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-semibold text-[#181A18]">{p.name}</td>
                    <td className="py-3 px-4 text-[#5C665E]">{p.sellerName}</td>
                    <td className="py-3 px-4 tabular-nums">{formatRupiah(p.price)}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleProductFlag(p.id, { isFeatured: !p.isFeatured })
                        }
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          p.isFeatured
                            ? 'bg-[#14452F] text-white'
                            : 'bg-[#EFECE5] text-[#4B524D]'
                        }`}
                      >
                        {p.isFeatured ? 'Unggulan' : 'Standar'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleProductFlag(p.id, { isPromoted: !p.isPromoted })
                        }
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          p.isPromoted
                            ? 'bg-[#E0A833] text-[#181A18]'
                            : 'bg-[#EFECE5] text-[#4B524D]'
                        }`}
                      >
                        {p.isPromoted ? 'Dipromosikan' : 'Normal'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleProductFlag(p.id, { isActive: !p.isActive })
                        }
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          p.isActive
                            ? 'bg-[#F2F7F4] text-[#14452F]'
                            : 'bg-[#FEF2F2] text-[#991B1B]'
                        }`}
                      >
                        {p.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tab === 'users' ? (
          <div className="bg-white border border-[#E6E4DD] rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAFAF8] border-b border-[#E6E4DD] text-xs text-[#5C665E]">
                <tr>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Status Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEA]">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-4 font-semibold text-[#181A18]">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[#5C665E]">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        aria-label={`Ubah peran ${u.name}`}
                        value={u.role}
                        disabled={u.id === user.id}
                        onChange={(e) =>
                          handleUpdateUser(u.id, { role: e.target.value as UserRole })
                        }
                        className="h-8 px-2 bg-[#FAFAF8] border border-[#D4D1C7] rounded text-xs"
                      >
                        <option value="buyer">Pembeli</option>
                        <option value="seller">Penjual</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        disabled={u.id === user.id}
                        onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })}
                        className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                          u.isActive
                            ? 'bg-[#F2F7F4] text-[#14452F]'
                            : 'bg-[#FEF2F2] text-[#991B1B]'
                        }`}
                      >
                        {u.isActive ? 'Aktif' : 'Dinonaktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order.id}
                className="bg-white border border-[#E6E4DD] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="text-xs font-mono font-bold text-[#14452F]">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm font-semibold text-[#181A18]">
                    {order.buyerName} · {formatRupiah(order.totalAmount)}
                  </p>
                  <p className="text-xs text-[#5C665E]">
                    Subtotal {formatRupiah(order.subtotal)} · Komisi ({order.commissionRate}%):{' '}
                    {formatRupiah(order.commissionAmount)} · Status:{' '}
                    {ORDER_STATUS_LABELS[order.status]}
                  </p>
                </div>
                <select
                  aria-label={`Status transaksi ${order.orderNumber}`}
                  value={order.status}
                  onChange={(e) =>
                    handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                  }
                  className="h-9 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-xs font-semibold"
                >
                  <option value="menunggu">Menunggu Diproses</option>
                  <option value="diproses">Sedang Dikemas</option>
                  <option value="dikirim">Dalam Pengiriman</option>
                  <option value="selesai">Pesanan Selesai</option>
                  <option value="dibatalkan">Dibatalkan</option>
                </select>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

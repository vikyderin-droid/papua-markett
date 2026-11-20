import { useEffect, useState, type FormEvent } from 'react';
import { Bell, Check, Heart, LogOut, MapPin, Package, User } from 'lucide-react';
import { apiRequest } from '../lib/api';
import {
  formatRupiah,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../lib/marketplace';
import type {
  Address,
  EnrichedProduct,
  NotificationItem,
  Order,
  PublicUser,
} from '../types/marketplace';
import { ProductCard } from './ProductCard';

interface BuyerDashboardViewProps {
  user: PublicUser;
  favoriteIds: string[];
  onOpenProduct: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
  onLogout: () => void;
  onNotificationsCleared: () => void;
}

type BuyerTab = 'orders' | 'favorites' | 'notifications' | 'profile';

export function BuyerDashboardView({
  user,
  favoriteIds,
  onOpenProduct,
  onAddToCart,
  onToggleFavorite,
  onLogout,
  onNotificationsCleared,
}: BuyerDashboardViewProps) {
  const [tab, setTab] = useState<BuyerTab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [favorites, setFavorites] = useState<EnrichedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [addrFormOpen, setAddrFormOpen] = useState(false);
  const [recipientName, setRecipientName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addrError, setAddrError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{
        orders: Order[];
        addresses: Address[];
        notifications: NotificationItem[];
        favorites: EnrichedProduct[];
      }>('/api/buyer/dashboard');
      setOrders(data.orders);
      setAddresses(data.addresses);
      setNotifications(data.notifications);
      setFavorites(data.favorites);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [favoriteIds.length]);

  const handleConfirmDelivered = async (orderId: string) => {
    await apiRequest(`/api/buyer/orders/${orderId}/confirm`, { method: 'PATCH' });
    await loadData();
  };

  const handleMarkRead = async () => {
    await apiRequest('/api/notifications/read', { method: 'POST' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onNotificationsCleared();
  };

  const handleAddAddress = async (e: FormEvent) => {
    e.preventDefault();
    setAddrError('');
    try {
      const res = await apiRequest<{ address: Address }>('/api/buyer/addresses', {
        method: 'POST',
        body: JSON.stringify({
          recipientName,
          phone,
          streetAddress,
          city,
          province,
          postalCode,
        }),
      });
      setAddresses((prev) => [...prev, res.address]);
      setAddrFormOpen(false);
      setStreetAddress('');
      setCity('');
      setProvince('');
      setPostalCode('');
    } catch (err) {
      setAddrError(err instanceof Error ? err.message : 'Gagal menyimpan alamat.');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6E4DD]">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#A8730D]">
            Dashboard Pembeli
          </p>
          <h1
            className="mt-1 text-2xl sm:text-3xl font-bold text-[#181A18]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Halo, {user.name}
          </h1>
          <p className="text-xs text-[#5C665E] mt-1">
            {user.email} <span aria-hidden="true">·</span> {user.phone}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#D4D1C7] hover:bg-[#FEF2F2] hover:border-[#FCA5A5] hover:text-[#991B1B] rounded-lg text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            tab === 'orders'
              ? 'bg-[#14452F] text-white'
              : 'bg-white border border-[#E6E4DD] text-[#4B524D] hover:border-[#14452F]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Riwayat Pesanan ({orders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('favorites')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            tab === 'favorites'
              ? 'bg-[#14452F] text-white'
              : 'bg-white border border-[#E6E4DD] text-[#4B524D] hover:border-[#14452F]'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Produk Favorit ({favorites.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('notifications')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            tab === 'notifications'
              ? 'bg-[#14452F] text-white'
              : 'bg-white border border-[#E6E4DD] text-[#4B524D] hover:border-[#14452F]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifikasi ({unreadCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
            tab === 'profile'
              ? 'bg-[#14452F] text-white'
              : 'bg-white border border-[#E6E4DD] text-[#4B524D] hover:border-[#14452F]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil &amp; Alamat ({addresses.length})</span>
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="p-10 bg-white border border-[#E6E4DD] rounded-xl text-center text-sm text-[#5C665E]">
            Memuat data akun...
          </div>
        ) : tab === 'orders' ? (
          orders.length === 0 ? (
            <div className="p-10 bg-white border border-[#E6E4DD] rounded-xl text-center text-sm text-[#5C665E]">
              Anda belum memiliki riwayat transaksi.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="bg-white border border-[#E6E4DD] rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F0EFEA]">
                    <div>
                      <p className="text-xs font-mono font-semibold text-[#14452F]">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-[#5C665E]">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}{' '}
                        · {PAYMENT_METHOD_LABELS[order.payment.method]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-3 py-1 rounded bg-[#F2F7F4] text-[#14452F]">
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                      {order.status === 'dikirim' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmDelivered(order.id)}
                          className="text-xs font-semibold px-3 py-1.5 rounded bg-[#14452F] text-white hover:bg-[#1D5C3F] cursor-pointer"
                        >
                          Pesanan Diterima
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4">
                        <span className="text-[#4B524D]">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#F0EFEA] flex flex-wrap justify-between gap-2 text-xs text-[#5C665E]">
                    <span>
                      Tujuan: {order.shippingCity}, {order.shippingProvince} ({order.shippingMethod})
                    </span>
                    <span className="text-sm font-bold text-[#14452F] tabular-nums">
                      Total: {formatRupiah(order.totalAmount)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : tab === 'favorites' ? (
          favorites.length === 0 ? (
            <div className="p-10 bg-white border border-[#E6E4DD] rounded-xl text-center text-sm text-[#5C665E]">
              Belum ada produk favorit tersimpan. Tekan ikon hati pada produk yang Anda sukai.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isFavorite={true}
                  onOpenProduct={onOpenProduct}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )
        ) : tab === 'notifications' ? (
          <div className="bg-white border border-[#E6E4DD] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#181A18]">Notifikasi Status Pesanan</h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkRead}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14452F] hover:underline cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-[#5C665E]">Belum ada notifikasi.</p>
            ) : (
              <div className="divide-y divide-[#F0EFEA]">
                {notifications.map((n) => (
                  <div key={n.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#181A18]">
                        {n.title}{' '}
                        {!n.isRead && (
                          <span className="text-[11px] font-semibold text-[#A8730D]">· Baru</span>
                        )}
                      </p>
                      <p className="text-xs text-[#4B524D] mt-0.5">{n.message}</p>
                    </div>
                    <span className="text-xs text-[#5C665E] whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#E6E4DD] rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#181A18]">Daftar Alamat Pengiriman</h2>
              <button
                type="button"
                onClick={() => setAddrFormOpen((v) => !v)}
                className="px-3.5 py-2 bg-[#14452F] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                {addrFormOpen ? 'Batal' : '+ Tambah Alamat'}
              </button>
            </div>

            {addrFormOpen && (
              <form
                onSubmit={handleAddAddress}
                className="p-4 bg-[#FAFAF8] border border-[#E6E4DD] rounded-xl space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Nama Penerima"
                    className="h-10 px-3 bg-white border border-[#D4D1C7] rounded-lg text-sm"
                  />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nomor Telepon"
                    className="h-10 px-3 bg-white border border-[#D4D1C7] rounded-lg text-sm"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Alamat jalan lengkap"
                  className="w-full h-10 px-3 bg-white border border-[#D4D1C7] rounded-lg text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kota / Kab"
                    className="h-10 px-3 bg-white border border-[#D4D1C7] rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    required
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Provinsi"
                    className="h-10 px-3 bg-white border border-[#D4D1C7] rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Kode Pos (5 digit)"
                    className="h-10 px-3 bg-white border border-[#D4D1C7] rounded-lg text-sm"
                  />
                </div>
                {addrError && <p className="text-xs text-[#991B1B]">{addrError}</p>}
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#14452F] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Simpan Alamat
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 border border-[#E6E4DD] rounded-xl text-xs space-y-1"
                >
                  <p className="font-bold text-sm text-[#181A18] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#14452F]" />
                    <span>{addr.recipientName}</span>
                  </p>
                  <p className="text-[#4B524D]">{addr.streetAddress}</p>
                  <p className="text-[#5C665E]">
                    {addr.city}, {addr.province} {addr.postalCode} · {addr.phone}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

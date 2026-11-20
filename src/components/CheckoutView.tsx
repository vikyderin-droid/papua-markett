import { useState, type FormEvent } from 'react';
import { CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import {
  calculateOrderBreakdown,
  formatRupiah,
  PAYMENT_METHOD_LABELS,
  SHIPPING_OPTIONS,
} from '../lib/marketplace';
import type {
  Address,
  CartItemView,
  Order,
  PaymentMethod,
  PublicUser,
} from '../types/marketplace';

interface CheckoutViewProps {
  user: PublicUser | null;
  items: CartItemView[];
  addresses: Address[];
  commissionRate: number;
  onSubmitOrder: (payload: {
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
  }) => Promise<Order>;
  onGoToOrders: () => void;
  onContinueShopping: () => void;
}

export function CheckoutView({
  user,
  items,
  addresses,
  commissionRate,
  onSubmitOrder,
  onGoToOrders,
  onContinueShopping,
}: CheckoutViewProps) {
  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];

  const [buyerName, setBuyerName] = useState(defaultAddr?.recipientName || user?.name || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [buyerPhone, setBuyerPhone] = useState(defaultAddr?.phone || user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(defaultAddr?.streetAddress || '');
  const [shippingCity, setShippingCity] = useState(defaultAddr?.city || '');
  const [shippingProvince, setShippingProvince] = useState(defaultAddr?.province || '');
  const [shippingPostalCode, setShippingPostalCode] = useState(defaultAddr?.postalCode || '');
  const [shippingMethodId, setShippingMethodId] = useState(SHIPPING_OPTIONS[0].id);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer_bank');
  const [saveAddress, setSaveAddress] = useState(Boolean(user && addresses.length === 0));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const selectedShipping =
    SHIPPING_OPTIONS.find((s) => s.id === shippingMethodId) || SHIPPING_OPTIONS[0];
  const breakdown = calculateOrderBreakdown(
    items.map((i) => ({ unitPrice: i.product.price, quantity: i.quantity })),
    selectedShipping.cost,
    commissionRate,
  );

  const applySavedAddress = (addr: Address) => {
    setBuyerName(addr.recipientName);
    setBuyerPhone(addr.phone);
    setShippingAddress(addr.streetAddress);
    setShippingCity(addr.city);
    setShippingProvince(addr.province);
    setShippingPostalCode(addr.postalCode);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const order = await onSubmitOrder({
        buyerName,
        buyerEmail,
        buyerPhone,
        shippingAddress,
        shippingCity,
        shippingProvince,
        shippingPostalCode,
        shippingMethodId,
        paymentMethod,
        saveAddress,
      });
      setConfirmedOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <section className="max-w-[780px] mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-[#E6E4DD] rounded-2xl p-6 sm:p-10 space-y-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-10 h-10 text-[#14452F] shrink-0" />
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#A8730D]">
                Simulasi Transaksi Berhasil Dicatat
              </p>
              <h1
                className="mt-1 text-2xl sm:text-3xl font-bold text-[#181A18]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Pesanan #{confirmedOrder.orderNumber} Diterima
              </h1>
              <p className="mt-2 text-sm text-[#4B524D]">
                Terima kasih, <span className="font-semibold">{confirmedOrder.buyerName}</span>.
                Pesanan Anda telah diteruskan ke penjual UMKM Papua untuk diproses.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#FDF8EC] border border-[#E0A833]/50 flex items-start gap-3 text-xs text-[#6B4A08]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong>Catatan Simulasi:</strong> Pembayaran menggunakan{' '}
              {PAYMENT_METHOD_LABELS[confirmedOrder.payment.method]} dengan kode referensi simulasi{' '}
              <span className="font-mono font-semibold">{confirmedOrder.payment.referenceCode}</span>.
              Tidak ada penarikan dana sungguhan yang terjadi pada mode demo ini.
            </p>
          </div>

          <div className="border-t border-b border-[#E6E4DD] py-4 space-y-3 text-sm">
            {confirmedOrder.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4">
                <span className="text-[#4B524D]">
                  {item.productName} × <span className="tabular-nums">{item.quantity}</span>
                </span>
                <span className="font-semibold text-[#181A18] tabular-nums">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-[#5C665E]">
              <span>Pengiriman ({confirmedOrder.shippingMethod})</span>
              <span className="tabular-nums">{formatRupiah(confirmedOrder.shippingCost)}</span>
            </div>
            <div className="pt-2 border-t border-[#F0EFEA] flex justify-between font-bold text-base text-[#14452F]">
              <span>Total Transaksi (Simulasi)</span>
              <span className="tabular-nums">{formatRupiah(confirmedOrder.totalAmount)}</span>
            </div>
          </div>

          <div className="text-xs text-[#5C665E]">
            <p className="font-semibold text-[#181A18]">Alamat Pengiriman:</p>
            <p className="mt-1">
              {confirmedOrder.shippingAddress}, {confirmedOrder.shippingCity},{' '}
              {confirmedOrder.shippingProvince} {confirmedOrder.shippingPostalCode} · Telp:{' '}
              {confirmedOrder.buyerPhone}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {user && (
              <button
                type="button"
                onClick={onGoToOrders}
                className="px-5 py-2.5 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                Lihat Status Pesanan
              </button>
            )}
            <button
              type="button"
              onClick={onContinueShopping}
              className="px-5 py-2.5 bg-[#F3F2EE] hover:bg-[#E6E4DD] text-[#181A18] text-sm font-semibold rounded-lg cursor-pointer"
            >
              Lanjut Belanja Produk Papua
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="max-w-[780px] mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#181A18]">Keranjang Masih Kosong</h1>
        <p className="mt-2 text-sm text-[#5C665E]">
          Tambahkan produk lokal Papua terlebih dahulu sebelum melakukan checkout.
        </p>
        <button
          type="button"
          onClick={onContinueShopping}
          className="mt-5 px-5 py-2.5 bg-[#14452F] text-white text-sm font-semibold rounded-lg cursor-pointer"
        >
          Ke Marketplace
        </button>
      </section>
    );
  }

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <h1
        className="text-3xl font-bold text-[#181A18]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Checkout Pesanan
      </h1>
      <p className="mt-1 text-sm text-[#5C665E]">
        Lengkapi alamat pengiriman dan pilih metode pembayaran simulasi.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        <div className="lg:col-span-7 space-y-6">
          {addresses.length > 0 && (
            <div className="bg-white border border-[#E6E4DD] rounded-xl p-5">
              <p className="text-sm font-bold text-[#181A18] mb-3">Gunakan Alamat Tersimpan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => applySavedAddress(addr)}
                    className="text-left p-3 rounded-lg border border-[#D4D1C7] hover:border-[#14452F] text-xs space-y-1 cursor-pointer"
                  >
                    <p className="font-semibold text-[#181A18]">{addr.recipientName}</p>
                    <p className="text-[#5C665E] line-clamp-2">{addr.streetAddress}</p>
                    <p className="text-[#5C665E]">
                      {addr.city}, {addr.province} {addr.postalCode}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-[#E6E4DD] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#181A18]">1. Data Pembeli &amp; Alamat Tujuan</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="co-name" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                  Nama Penerima
                </label>
                <input
                  id="co-name"
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                />
              </div>
              <div>
                <label htmlFor="co-phone" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="co-email" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                Email Konfirmasi
              </label>
              <input
                id="co-email"
                type="email"
                required
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
              />
            </div>

            <div>
              <label htmlFor="co-address" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                Alamat Lengkap (Jalan, Nomor Rumah, RT/RW, Kecamatan)
              </label>
              <textarea
                id="co-address"
                rows={2}
                required
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full p-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="co-city" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                  Kota / Kabupaten
                </label>
                <input
                  id="co-city"
                  type="text"
                  required
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                />
              </div>
              <div>
                <label htmlFor="co-province" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                  Provinsi
                </label>
                <input
                  id="co-province"
                  type="text"
                  required
                  value={shippingProvince}
                  onChange={(e) => setShippingProvince(e.target.value)}
                  className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                />
              </div>
              <div>
                <label htmlFor="co-postal" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                  Kode Pos (5 Digit)
                </label>
                <input
                  id="co-postal"
                  type="text"
                  required
                  maxLength={5}
                  value={shippingPostalCode}
                  onChange={(e) => setShippingPostalCode(e.target.value)}
                  placeholder="10110"
                  className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm tabular-nums"
                />
              </div>
            </div>

            {user && (
              <label className="inline-flex items-center gap-2 text-xs text-[#4B524D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="rounded border-[#D4D1C7]"
                />
                <span>Simpan alamat ini ke akun saya</span>
              </label>
            )}
          </div>

          <div className="bg-white border border-[#E6E4DD] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#181A18]">2. Metode Pengiriman</h2>
            <div className="space-y-2.5">
              {SHIPPING_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    shippingMethodId === opt.id
                      ? 'border-[#14452F] bg-[#F2F7F4]'
                      : 'border-[#E6E4DD] hover:border-[#C7CEC9]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={opt.id}
                      checked={shippingMethodId === opt.id}
                      onChange={() => setShippingMethodId(opt.id)}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#181A18]">{opt.name}</p>
                      <p className="text-xs text-[#5C665E]">Estimasi tiba {opt.eta}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#14452F] tabular-nums">
                    {formatRupiah(opt.cost)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E6E4DD] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#181A18]">
              3. Metode Pembayaran (Mode Simulasi)
            </h2>
            <div className="p-3 rounded-lg bg-[#FDF8EC] border border-[#E0A833]/50 text-xs text-[#6B4A08] flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Integrasi payment gateway menggunakan mode simulasi lokal. Pesanan tercatat penuh
                di sistem tanpa memproses transaksi perbankan sungguhan.
              </span>
            </div>
            <div className="space-y-2.5">
              {(['transfer_bank', 'qris', 'cod'] as PaymentMethod[]).map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === method
                      ? 'border-[#14452F] bg-[#F2F7F4]'
                      : 'border-[#E6E4DD] hover:border-[#C7CEC9]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                  />
                  <span className="text-sm font-medium text-[#181A18]">
                    {PAYMENT_METHOD_LABELS[method]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary Right */}
        <aside className="lg:col-span-5 bg-white border border-[#E6E4DD] rounded-xl p-6 space-y-5 sticky top-24">
          <h2 className="text-base font-bold text-[#181A18]">Ringkasan Pesanan</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-[#181A18] truncate">{item.product.name}</p>
                  <p className="text-xs text-[#5C665E] tabular-nums">
                    {item.quantity} × {formatRupiah(item.product.price)}
                  </p>
                </div>
                <p className="font-semibold text-[#181A18] tabular-nums shrink-0">
                  {formatRupiah(item.lineTotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E6E4DD] space-y-2.5 text-sm">
            <div className="flex justify-between text-[#4B524D]">
              <span>Subtotal Produk</span>
              <span className="tabular-nums font-medium">{formatRupiah(breakdown.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#4B524D]">
              <span>Ongkos Kirim</span>
              <span className="tabular-nums font-medium">
                {formatRupiah(breakdown.shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#5C665E]">
              <span>Komisi Platform ({breakdown.commissionRate}% sudah termasuk di harga UMKM)</span>
              <span className="tabular-nums">{formatRupiah(breakdown.commissionAmount)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6E4DD] flex justify-between items-baseline">
            <span className="text-sm font-bold text-[#181A18]">Total Pembayaran</span>
            <span className="text-2xl font-bold text-[#14452F] tabular-nums">
              {formatRupiah(breakdown.totalAmount)}
            </span>
          </div>

          {error && (
            <p className="p-3 rounded-lg bg-[#FEF2F2] text-xs font-medium text-[#991B1B]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-[#14452F] hover:bg-[#1D5C3F] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {submitting ? 'Memproses Pesanan...' : 'Buat Pesanan (Simulasi)'}
          </button>
        </aside>
      </form>
    </section>
  );
}

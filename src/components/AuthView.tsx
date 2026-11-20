import { useState, type FormEvent } from 'react';
import { apiRequest } from '../lib/api';
import type { PublicUser, Seller } from '../types/marketplace';

interface AuthViewProps {
  onAuthSuccess: (user: PublicUser, seller: Seller | null) => void;
}

type AuthTab = 'login' | 'register_buyer' | 'register_seller';

export function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (tab === 'login') {
        const res = await apiRequest<{ user: PublicUser; seller: Seller | null }>(
          '/api/auth/login',
          {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          },
        );
        onAuthSuccess(res.user, res.seller);
      } else {
        const res = await apiRequest<{ user: PublicUser; seller: Seller | null }>(
          '/api/auth/register',
          {
            method: 'POST',
            body: JSON.stringify({
              role: tab === 'register_seller' ? 'seller' : 'buyer',
              name,
              email,
              password,
              phone,
              storeName,
              originCity,
              storeDescription,
            }),
          },
        );
        onAuthSuccess(res.user, res.seller);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Autentikasi gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  const quickDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ user: PublicUser; seller: Seller | null }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email: demoEmail, password: demoPassword }),
        },
      );
      onAuthSuccess(res.user, res.seller);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk dengan akun demo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="max-w-[960px] mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white border border-[#E6E4DD] rounded-2xl p-6 sm:p-8">
          <h1
            className="text-2xl sm:text-3xl font-bold text-[#181A18]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {tab === 'login'
              ? 'Masuk ke PAPUA MARKET'
              : tab === 'register_buyer'
                ? 'Daftar Akun Pembeli'
                : 'Daftar Toko Penjual UMKM Papua'}
          </h1>
          <p className="mt-1.5 text-sm text-[#5C665E]">
            {tab === 'login'
              ? 'Akses riwayat pesanan, produk favorit, toko penjual, atau panel admin.'
              : 'Lengkapi data dengan benar untuk mulai berbelanja atau berjualan.'}
          </p>

          <div
            role="tablist"
            aria-label="Pilih mode autentikasi"
            className="mt-6 grid grid-cols-3 gap-1 p-1 bg-[#EFECE5] rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'login'}
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'login' ? 'bg-white text-[#14452F] shadow-sm' : 'text-[#4B524D]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'register_buyer'}
              onClick={() => {
                setTab('register_buyer');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'register_buyer' ? 'bg-white text-[#14452F] shadow-sm' : 'text-[#4B524D]'
              }`}
            >
              Daftar Pembeli
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'register_seller'}
              onClick={() => {
                setTab('register_seller');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'register_seller' ? 'bg-white text-[#14452F] shadow-sm' : 'text-[#4B524D]'
              }`}
            >
              Daftar Penjual
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {tab !== 'login' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Rina Wenda"
                    className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="auth-phone" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    id="auth-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081248001122"
                    className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                Alamat Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                Kata Sandi
              </label>
              <input
                id="auth-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
              />
            </div>

            {tab === 'register_seller' && (
              <div className="pt-2 border-t border-[#F0EFEA] space-y-4">
                <p className="text-xs font-bold text-[#14452F]">Informasi Toko UMKM Papua</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="auth-store" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                      Nama Toko UMKM
                    </label>
                    <input
                      id="auth-store"
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Contoh: Noken Baliem Craft"
                      className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-city" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                      Kota / Kabupaten Asal
                    </label>
                    <input
                      id="auth-city"
                      type="text"
                      required
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      placeholder="Wamena, Jayapura, Sorong..."
                      className="w-full h-10 px-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="auth-store-desc" className="block text-xs font-semibold text-[#4B524D] mb-1.5">
                    Deskripsi Singkat Usaha
                  </label>
                  <textarea
                    id="auth-store-desc"
                    rows={2}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Ceritakan produk unggulan dan pengrajin di toko Anda..."
                    className="w-full p-3 bg-[#FAFAF8] border border-[#D4D1C7] rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="p-3 rounded-lg bg-[#FEF2F2] text-xs font-medium text-[#991B1B]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-[#14452F] hover:bg-[#1D5C3F] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {submitting
                ? 'Memproses...'
                : tab === 'login'
                  ? 'Masuk ke Akun'
                  : tab === 'register_buyer'
                    ? 'Buat Akun Pembeli'
                    : 'Daftarkan Toko Penjual'}
            </button>
          </form>
        </div>

        {/* Demo Accounts Helper */}
        <aside className="lg:col-span-5 bg-[#F2F7F4] border border-[#D4E2D9] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-[#14452F]">Akun Demo Siap Uji</h2>
          <p className="text-xs text-[#3E4C43] leading-relaxed">
            Gunakan tombol akses cepat di bawah ini untuk menguji seluruh alur Pembeli, Penjual
            UMKM Papua, dan Administrator Platform secara langsung.
          </p>

          <div className="space-y-3">
            <div className="p-4 bg-white border border-[#E6E4DD] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#181A18]">Akun Pembeli</p>
                <span className="text-xs font-mono text-[#5C665E]">Rina Wenda</span>
              </div>
              <p className="text-xs text-[#5C665E] font-mono">
                pembeli@papuamarket.id · papua123
              </p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => quickDemoLogin('pembeli@papuamarket.id', 'papua123')}
                className="w-full h-9 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Masuk sebagai Pembeli
              </button>
            </div>

            <div className="p-4 bg-white border border-[#E6E4DD] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#181A18]">Akun Penjual UMKM</p>
                <span className="text-xs font-mono text-[#5C665E]">Kriya &amp; Kopi Baliem</span>
              </div>
              <p className="text-xs text-[#5C665E] font-mono">
                penjual@papuamarket.id · papua123
              </p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => quickDemoLogin('penjual@papuamarket.id', 'papua123')}
                className="w-full h-9 bg-[#E0A833] hover:bg-[#C88A16] text-[#181A18] text-xs font-bold rounded-lg cursor-pointer"
              >
                Masuk sebagai Penjual
              </button>
            </div>

            <div className="p-4 bg-white border border-[#E6E4DD] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#181A18]">Akun Administrator</p>
                <span className="text-xs font-mono text-[#5C665E]">Pengelola Platform</span>
              </div>
              <p className="text-xs text-[#5C665E] font-mono">
                admin@papuamarket.id · admin123
              </p>
              <button
                type="button"
                disabled={submitting}
                onClick={() => quickDemoLogin('admin@papuamarket.id', 'admin123')}
                className="w-full h-9 bg-[#181A18] hover:bg-[#333834] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Masuk sebagai Admin
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

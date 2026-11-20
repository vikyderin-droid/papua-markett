import { Database, Layers, Percent, ShieldCheck, Store } from 'lucide-react';
import type { AppView } from './Navbar';

interface AboutViewProps {
  commissionRate: number;
  onNavigate: (view: AppView) => void;
}

export function AboutView({ commissionRate, onNavigate }: AboutViewProps) {
  return (
    <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-12 space-y-12">
      <header className="space-y-4">
        <p className="text-xs font-semibold tracking-wide text-[#A8730D]">
          Dari Papua untuk Indonesia
        </p>
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#14452F] leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Tentang PAPUA MARKET &amp; Pemberdayaan UMKM Papua
        </h1>
        <p className="text-base text-[#4B524D] leading-relaxed">
          PAPUA MARKET adalah platform marketplace digital yang mempertemukan mama-mama pengrajin
          noken, petani kopi pegunungan Wamena, perajin batik Cenderawasih, serta nelayan pesisir
          Sorong dan Biak dengan pembeli di seluruh Indonesia secara transparan dan aman.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="p-6 bg-white border border-[#E6E4DD] rounded-xl space-y-2.5">
          <Percent className="w-5 h-5 text-[#14452F]" />
          <h2 className="text-base font-bold text-[#181A18]">
            Komisi Transaksi Adil ({commissionRate}%)
          </h2>
          <p className="text-sm text-[#4B524D] leading-relaxed">
            Komisi penjualan dikelola transparan oleh Administrator untuk pemeliharaan sistem,
            promosi nasional produk Papua, dan pendampingan pengemasan UMKM.
          </p>
        </article>

        <article className="p-6 bg-white border border-[#E6E4DD] rounded-xl space-y-2.5">
          <Store className="w-5 h-5 text-[#14452F]" />
          <h2 className="text-base font-bold text-[#181A18]">
            Paket Toko Premium &amp; Promosi Unggulan
          </h2>
          <p className="text-sm text-[#4B524D] leading-relaxed">
            Penjual UMKM dapat memilih Paket Reguler gratis atau naik ke Paket Premium untuk
            menampilkan produk pada etalase unggulan dan kampanye kurasi nasional.
          </p>
        </article>

        <article className="p-6 bg-white border border-[#E6E4DD] rounded-xl space-y-2.5">
          <ShieldCheck className="w-5 h-5 text-[#14452F]" />
          <h2 className="text-base font-bold text-[#181A18]">
            Keamanan Akun &amp; Validasi Transaksi
          </h2>
          <p className="text-sm text-[#4B524D] leading-relaxed">
            Setiap kata sandi di-hash menggunakan cryptographic salted scrypt, sesi dilindungi
            cookie HttpOnly, dan unggahan foto produk divalidasi format serta ukurannya.
          </p>
        </article>

        <article className="p-6 bg-white border border-[#E6E4DD] rounded-xl space-y-2.5">
          <Database className="w-5 h-5 text-[#14452F]" />
          <h2 className="text-base font-bold text-[#181A18]">
            Arsitektur Relasional &amp; Skema MySQL Siap Ekspor
          </h2>
          <p className="text-sm text-[#4B524D] leading-relaxed">
            Seluruh entitas (users, sellers, products, categories, carts, cart_items, orders,
            order_items, payments, addresses, reviews, notifications) mengikuti rancangan relasional
            lengkap termasuk skrip DDL MySQL di <code>/database/papua_market.sql</code>.
          </p>
        </article>
      </div>

      <div className="p-6 bg-[#F2F7F4] border border-[#D4E2D9] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-[#14452F] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#14452F]">Siap Menjelajahi Produk Asli Papua?</p>
            <p className="text-xs text-[#3E4C43] mt-0.5">
              Dukung ekonomi kreatif Papua dengan berbelanja langsung dari pelaku UMKM lokal.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('marketplace')}
          className="px-5 py-2.5 bg-[#14452F] hover:bg-[#1D5C3F] text-white text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer"
        >
          Buka Marketplace
        </button>
      </div>
    </section>
  );
}

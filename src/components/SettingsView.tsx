import React, { useState } from "react";
import { ShopSettings } from "../types";
import {
  Settings,
  Store,
  Phone,
  Link,
  CheckCircle,
  HelpCircle,
  Upload,
  User,
  AlertTriangle,
  Trash2,
} from "lucide-react";

interface SettingsViewProps {
  settings: ShopSettings;
  onUpdateSettings: (newSettings: ShopSettings) => void;
  user: { email: string; displayName: string } | null;
  onLogout: () => void;
  onDeleteAllTransactions: () => void;
  onDeleteAllInventory: () => void;
  darkMode: boolean;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  user,
  onLogout,
  onDeleteAllTransactions,
  onDeleteAllInventory,
  darkMode,
}: SettingsViewProps) {
  const [shopName, setShopName] = useState(settings.shopName);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [whatsappWebhookUrl, setWhatsappWebhookUrl] = useState(settings.whatsappWebhookUrl || "");
  const [autoSendWhatsapp, setAutoSendWhatsapp] = useState(settings.autoSendWhatsapp);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Read uploaded logo, convert to Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (avoid massive base64 in firestore, recommend < 800kb)
    if (file.size > 800 * 1024) {
      setErrorMsg("Ukuran foto terlalu besar! Maksimal ukuran file logo adalah 800 KB.");
      return;
    }

    setIsUploading(true);
    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
        setIsUploading(false);
        setSuccessMsg("Foto logo berhasil diunggah! Silakan tekan 'Simpan Konfigurasi'.");
      }
    };
    reader.onerror = () => {
      setErrorMsg("Gagal membaca file gambar.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      setErrorMsg("Nama kedai Roti Bakar tidak boleh kosong!");
      return;
    }

    onUpdateSettings({
      shopName,
      logoUrl,
      whatsappNumber,
      whatsappWebhookUrl,
      autoSendWhatsapp,
    });

    setSuccessMsg("Konfigurasi toko berhasil diperbarui!");
    setErrorMsg("");

    setTimeout(() => {
      setSuccessMsg("");
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-sans tracking-tight">
          Dashboard Pengaturan Toko
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ubah nama kedai, unggah foto logo roti bakar Anda, dan atur integrasi WhatsApp otomatis.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Logo & Profile (1 column) */}
        <div
          className={`p-6 rounded-2xl border flex flex-col items-center text-center ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="relative group mb-4">
            <img
              src={logoUrl || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150"}
              alt="Logo Roti Bakar"
              className="w-24 h-24 rounded-full object-cover border-4 border-amber-500/20 shadow-md shadow-amber-500/5"
              referrerPolicy="no-referrer"
            />
            <label className="absolute bottom-0 right-0 p-1.5 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>

          {isUploading ? (
            <span className="text-2xs text-amber-500 animate-pulse font-medium">Mengunggah logo...</span>
          ) : (
            <span className="text-2xs text-slate-400 font-medium">Ketuk tombol kamera untuk ganti logo</span>
          )}

          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 mt-4 leading-tight">
            {shopName || "Roti Bakar Premium"}
          </h3>
          <p className="text-3xs text-slate-400 mt-1 uppercase tracking-wider font-semibold font-mono">
            KEDAI AKTIF
          </p>

          <div className="w-full border-t border-slate-100 dark:border-slate-800 my-4 pt-4 text-left">
            <span className="text-3xs font-extrabold text-slate-400 block uppercase tracking-wider">
              Operator Masuk
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="p-1 bg-slate-100 dark:bg-slate-850 rounded-lg text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <div className="truncate">
                <p className="text-xs font-bold leading-none">{user?.displayName || "Pemilik"}</p>
                <p className="text-4xs text-slate-400 mt-0.5 truncate">{user?.email || "indrostuyul72@gmail.com"}</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full mt-6 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all border border-red-500/25 text-center"
            >
              Keluar Akun (Log Out)
            </button>
          </div>
        </div>

        {/* Right column: Form Details (2 columns) */}
        <div
          className={`md:col-span-2 p-6 rounded-2xl border ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-6 border-b pb-3 dark:border-slate-800">
            <Settings className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-bold">Informasi & Integrasi Kedai</h4>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Shop Name */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">
                Nama Kedai Roti Bakar
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Store className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Contoh: Roti Bakar Bandung 88"
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${
                    darkMode
                      ? "bg-slate-900 border-slate-800 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-950"
                  }`}
                />
              </div>
            </div>

            {/* Destination WhatsApp Number */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">
                Nomor WhatsApp Penerima Laporan
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Contoh: 6281234567890 (Gunakan kode negara)"
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${
                    darkMode
                      ? "bg-slate-900 border-slate-800 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-950"
                  }`}
                />
              </div>
              <p className="text-4xs text-slate-400 mt-1 leading-normal">
                Gunakan format kode negara tanpa spasi atau tanda +. Cth: <strong>6281234567890</strong>.
              </p>
            </div>

            {/* WhatsApp API Webhook URL (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-2xs font-bold text-slate-400 uppercase">
                  Webhook Gateway WhatsApp (Opsional)
                </label>
                <span className="text-4xs text-slate-400 underline cursor-help flex items-center gap-0.5">
                  <HelpCircle className="w-3 h-3" /> Apa ini?
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Link className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  value={whatsappWebhookUrl}
                  onChange={(e) => setWhatsappWebhookUrl(e.target.value)}
                  placeholder="Contoh: https://api.whatsapp-gateway.com/send"
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${
                    darkMode
                      ? "bg-slate-900 border-slate-800 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-950"
                  }`}
                />
              </div>
              <p className="text-4xs text-slate-400 mt-1 leading-normal">
                Sistem akan mengirimkan data JSON laporan keuangan otomatis harian ke URL ini jika dikonfigurasi.
              </p>
            </div>

            {/* Toggle automated notifications */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border dark:border-slate-800">
              <div className="space-y-0.5 pr-4">
                <span className="text-xs font-bold block text-slate-700 dark:text-slate-200">
                  Kirim Laporan Otomatis via Webhook
                </span>
                <span className="text-4xs text-slate-400 block leading-tight">
                  Kirim payload JSON otomatis ke webhook WhatsApp ketika merekam aktivitas.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoSendWhatsapp(!autoSendWhatsapp)}
                className={`w-11 h-6 rounded-full transition-colors relative outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer ${
                  autoSendWhatsapp ? "bg-amber-500" : "bg-slate-350 dark:bg-slate-800"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    autoSendWhatsapp ? "translate-x-5" : ""
                  }`}
                ></span>
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-amber-500/10"
            >
              Simpan Konfigurasi
            </button>
          </form>

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-rose-500/10">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h4 className="text-sm font-bold text-rose-500">Zona Bahaya (Danger Zone)</h4>
            </div>

            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan. Pastikan Anda benar-benar yakin sebelum mengeksekusi.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/40 border dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold block">Hapus Semua Transaksi</span>
                  <span className="text-4xs text-slate-400 block mt-0.5">
                    Kosongkan seluruh riwayat pemasukan dan pengeluaran kedai secara permanen.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Apakah Anda yakin ingin menghapus SELURUH data transaksi? Tindakan ini akan menghapus riwayat penjualan & pengeluaran secara permanen.")) {
                      onDeleteAllTransactions();
                      alert("Semua data transaksi telah berhasil dihapus.");
                    }
                  }}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-3xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shrink-0 border border-rose-500/20"
                >
                  Hapus Transaksi
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/40 border dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold block">Hapus Semua Bahan Baku</span>
                  <span className="text-4xs text-slate-400 block mt-0.5">
                    Kosongkan daftar katalog bahan baku dan persediaan stok gudang secara permanen.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Apakah Anda yakin ingin menghapus SELURUH daftar bahan baku? Tindakan ini akan mengosongkan seluruh stok gudang secara permanen.")) {
                      onDeleteAllInventory();
                      alert("Semua data bahan baku telah berhasil dihapus.");
                    }
                  }}
                  className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg text-3xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shrink-0 border border-rose-500/20"
                >
                  Hapus Bahan Baku
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

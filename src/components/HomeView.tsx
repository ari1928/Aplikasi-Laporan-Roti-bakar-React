import React, { useState } from "react";
import { Transaction, InventoryItem, ShopSettings } from "../types";
import { formatDailyReport, getWhatsappUrl, sendWhatsappWebhook } from "../utils/whatsapp";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  QrCode,
  Share2,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRightLeft,
} from "lucide-react";
import { motion } from "motion/react";

interface HomeViewProps {
  transactions: Transaction[];
  inventory: InventoryItem[];
  settings: ShopSettings;
  onAddTransaction: (tx: Omit<Transaction, "id" | "createdAt" | "userId">) => void;
  darkMode: boolean;
}

export default function HomeView({
  transactions,
  inventory,
  settings,
  onAddTransaction,
  darkMode,
}: HomeViewProps) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [qty, setQty] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Calculate daily values for the selectedDate
  const dailyTx = transactions.filter((t) => t.date === selectedDate);
  const dailyIncomeTx = dailyTx.filter((t) => t.type === "income");
  const dailyExpenseTx = dailyTx.filter((t) => t.type === "expense");

  const dailyCashIncome = dailyIncomeTx
    .filter((t) => t.paymentMethod === "cash")
    .reduce((sum, t) => sum + t.amount, 0);

  const dailyQrisIncome = dailyIncomeTx
    .filter((t) => t.paymentMethod === "qris")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDailyIncome = dailyCashIncome + dailyQrisIncome;
  const totalDailyExpense = dailyExpenseTx.reduce((sum, t) => sum + t.amount, 0);
  const netDailyProfit = totalDailyIncome - totalDailyExpense;

  // Check inventory alert items
  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock);

  // Suggested Roti Bakar list for quick click input
  const defaultRotiCategories = [
    "Roti Bakar Coklat",
    "Roti Bakar Keju",
    "Roti Bakar Coklat Keju",
    "Roti Bakar Stroberi",
    "Roti Bakar Srikaya",
    "Roti Bakar Spesial Komplit",
  ];

  // Suggested Expense Categories
  const defaultExpenseCategories = [
    "Belanja Bahan Baku",
    "Isi Ulang Gas Elpiji",
    "Kantong Plastik / Kotak",
    "Uang Sewa Tempat Harian",
    "Gaji Karyawan / Uang Makan",
  ];

  const handleSubmitTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        type: txType,
        date: selectedDate,
        category,
        amount: Number(amount),
        paymentMethod: txType === "income" ? paymentMethod : undefined,
        quantity: txType === "income" ? Number(qty) : undefined,
        note,
      });

      setSuccessMsg("Transaksi berhasil disimpan!");
      setCategory("");
      setAmount("");
      setQty("1");
      setNote("");

      setTimeout(() => {
        setSuccessMsg("");
      }, 3000);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger sending Daily Report to WhatsApp
  const handleShareDailyReport = () => {
    const reportMsg = formatDailyReport(transactions, selectedDate, settings.shopName);
    const waUrl = getWhatsappUrl(settings.whatsappNumber, reportMsg);
    
    // Automatically trigger Webhook if configured
    if (settings.autoSendWhatsapp && settings.whatsappWebhookUrl) {
      sendWhatsappWebhook(settings.whatsappWebhookUrl, {
        shopName: settings.shopName,
        reportType: "daily_summary",
        date: selectedDate,
        message: reportMsg,
        data: {
          totalIncome: totalDailyIncome,
          totalCash: dailyCashIncome,
          totalQris: dailyQrisIncome,
          totalExpense: totalDailyExpense,
          netProfit: netDailyProfit,
        }
      });
    }
    
    window.open(waUrl, "_blank");
  };

  const rupiah = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  return (
    <div className="space-y-6">
      {/* Upper header section with date selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">
            Menu Mulai (Ringkasan Harian)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pantau total pemasukan dan pengeluaran harian serta catat transaksi baru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500/50 outline-none transition-all font-mono ${
              darkMode
                ? "bg-slate-900 border-slate-800 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          />
        </div>
      </div>

      {/* Warnings alert for low stock */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl text-sm bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse text-amber-500" />
            <span>
              <strong>Perhatian!</strong> Ada {lowStockItems.length} bahan baku yang menyentuh batas minimum stok.
            </span>
          </div>
          <span className="text-xs underline font-medium cursor-pointer">Lihat Stok</span>
        </div>
      )}

      {/* Daily Totals - 3 Beautiful Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Income Card */}
        <div
          className={`p-6 rounded-2xl border relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Total Pemasukan ({selectedDate})
              </span>
              <h3 className="text-2xl font-bold font-mono tracking-tight mt-1 text-emerald-500">
                {rupiah(totalDailyIncome)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">💵 Tunai (Cash)</span>
              <span className="font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5 block">
                {rupiah(dailyCashIncome)}
              </span>
            </div>
            <div className="border-l border-slate-100 dark:border-slate-800/80 pl-4">
              <span className="text-slate-400 block font-medium">📱 QRIS</span>
              <span className="font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5 block">
                {rupiah(dailyQrisIncome)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Expense Card */}
        <div
          className={`p-6 rounded-2xl border relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Total Pengeluaran ({selectedDate})
              </span>
              <h3 className="text-2xl font-bold font-mono tracking-tight mt-1 text-red-500">
                {rupiah(totalDailyExpense)}
              </h3>
            </div>
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <span className="text-slate-400 block font-medium">Beban Harian Terdaftar:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5 block font-mono">
              {dailyExpenseTx.length} Transaksi Pengeluaran
            </span>
          </div>
        </div>

        {/* Net Profit Card */}
        <div
          className={`p-6 rounded-2xl border relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Keuntungan Bersih ({selectedDate})
              </span>
              <h3
                className={`text-2xl font-bold font-mono tracking-tight mt-1 ${
                  netDailyProfit >= 0 ? "text-amber-500" : "text-red-500"
                }`}
              >
                {rupiah(netDailyProfit)}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Kirim ke WhatsApp Pemilik:</span>
            <button
              onClick={handleShareDailyReport}
              className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg flex items-center gap-1 transition-all cursor-pointer text-2xs uppercase tracking-wider"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WA Laporan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Action Board: Quick Transaction Form & Fast Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Quick Entry Form (8 columns) */}
        <div
          className={`lg:col-span-8 p-6 rounded-2xl border ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <PlusCircle className="w-5 h-5 text-amber-500" />
            <h4 className="text-lg font-bold font-sans">Catat Transaksi Cepat</h4>
          </div>

          {successMsg && (
            <div className="p-3 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmitTx} className="space-y-4">
            {/* Form Toggle: Pemasukan vs Pengeluaran */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-850 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setTxType("income");
                  setCategory("");
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  txType === "income"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                📥 Pemasukan (Penjualan)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTxType("expense");
                  setCategory("");
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  txType === "expense"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                📤 Pengeluaran
              </button>
            </div>

            {/* Suggested quick clicks categories */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Pilih atau Ketik Kategori {txType === "income" ? "Roti Bakar" : "Pengeluaran"}
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(txType === "income" ? defaultRotiCategories : defaultExpenseCategories).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        category === item
                          ? "bg-amber-500 border-amber-500 text-white"
                          : darkMode
                          ? "bg-slate-800/40 border-slate-700/80 text-slate-300 hover:bg-slate-850"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <input
                type="text"
                required
                placeholder={txType === "income" ? "Nama Roti Bakar baru..." : "Jenis pengeluaran..."}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500/50 outline-none transition-all ${
                  darkMode
                    ? "bg-slate-900 border-slate-800 text-white focus:border-amber-500"
                    : "bg-white border-slate-200 text-slate-950 focus:border-amber-500"
                }`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <label className="block text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500/50 outline-none transition-all font-mono ${
                    darkMode
                      ? "bg-slate-900 border-slate-800 text-white focus:border-amber-500"
                      : "bg-white border-slate-200 text-slate-950 focus:border-amber-500"
                  }`}
                />
              </div>

              {/* Quantity / Servings (Only for Income) */}
              {txType === "income" ? (
                <div>
                  <label className="block text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Jumlah Porsi
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500/50 outline-none transition-all font-mono ${
                      darkMode
                        ? "bg-slate-900 border-slate-800 text-white focus:border-amber-500"
                        : "bg-white border-slate-200 text-slate-950 focus:border-amber-500"
                    }`}
                  />
                </div>
              ) : (
                /* Date indicator/picker in forms as well to easily check and override */
                <div>
                  <label className="block text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500/50 outline-none transition-all font-mono ${
                      darkMode
                        ? "bg-slate-900 border-slate-800 text-white"
                        : "bg-white border-slate-200 text-slate-950"
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Payment Method - Separated CASH vs QRIS (Only for Income) */}
            {txType === "income" && (
              <div>
                <label className="block text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-semibold text-xs ${
                      paymentMethod === "cash"
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                        : darkMode
                        ? "bg-slate-800/40 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Uang Cash (Tunai)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qris")}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-semibold text-xs ${
                      paymentMethod === "qris"
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                        : darkMode
                        ? "bg-slate-800/40 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Uang QRIS (Non-Tunai)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Note / Keterangan */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Keterangan / Catatan Tambahan
              </label>
              <textarea
                placeholder="Contoh: Ekstra keju parut atau nama pembeli..."
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-amber-500/50 outline-none transition-all ${
                  darkMode
                    ? "bg-slate-900 border-slate-800 text-white focus:border-amber-500"
                    : "bg-white border-slate-200 text-slate-950 focus:border-amber-500"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${
                txType === "income"
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 hover:shadow-emerald-500/20"
                  : "bg-red-500 hover:bg-red-600 shadow-red-500/10 hover:shadow-red-500/20"
              }`}
            >
              {isSubmitting ? "Menyimpan..." : `Simpan ${txType === "income" ? "Pemasukan" : "Pengeluaran"}`}
            </button>
          </form>
        </div>

        {/* Right Side: Quick Logs & WhatsApp Shortcuts (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Logs */}
          <div
            className={`p-6 rounded-2xl border ${
              darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <ArrowRightLeft className="w-4.5 h-4.5 text-amber-500" />
              <h4 className="text-sm font-bold">Aktivitas Hari Ini ({dailyTx.length})</h4>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {dailyTx.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada transaksi terdaftar untuk hari ini.
                </div>
              ) : (
                dailyTx.map((tx) => (
                  <div
                    key={tx.id}
                    className={`p-2.5 rounded-xl border flex justify-between items-center text-xs ${
                      darkMode ? "bg-slate-850/50 border-slate-800" : "bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold truncate max-w-[120px]">{tx.category}</div>
                      <div className="text-slate-400 font-mono text-2xs flex items-center gap-1">
                        {tx.type === "income" ? (
                          <span className="text-emerald-500">📥</span>
                        ) : (
                          <span className="text-red-500">📤</span>
                        )}
                        <span>{tx.type === "income" ? tx.paymentMethod?.toUpperCase() : "KELUAR"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold font-mono ${
                          tx.type === "income" ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {rupiah(tx.amount)}
                      </div>
                      <div className="text-slate-400 text-2xs">
                        {tx.quantity ? `${tx.quantity} pcs` : ""}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Guides & WA Setup info */}
          <div
            className={`p-6 rounded-2xl border ${
              darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <Layers className="w-4.5 h-4.5 text-amber-500" />
              <h4 className="text-sm font-bold">Panduan Operasional</h4>
            </div>

            <div className="text-xs space-y-2.5 text-slate-500 dark:text-slate-400">
              <p>
                <strong>1. Catat Roti Bakar:</strong> Gunakan tombol pilihan menu instan untuk mempercepat entri penjualan.
              </p>
              <p>
                <strong>2. QRIS vs Cash:</strong> Pisahkan uang QRIS agar mempermudah proses rekonsiliasi uang fisik di laci kasir setiap tutup kedai.
              </p>
              <p>
                <strong>3. Integrasi WA:</strong> Sesuaikan nomor tujuan WhatsApp di menu <strong>Dashboard Settings</strong> agar pengiriman laporan berjalan lancar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

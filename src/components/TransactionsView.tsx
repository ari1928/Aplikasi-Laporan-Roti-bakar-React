import React, { useState } from "react";
import { Transaction, ShopSettings } from "../types";
import { formatTransactionMessage, formatDailyReport, getWhatsappUrl, sendWhatsappWebhook } from "../utils/whatsapp";
import {
  Search,
  Filter,
  Trash2,
  Share2,
  Calendar,
  DollarSign,
  QrCode,
  ArrowRightLeft,
  ChevronDown,
  Download,
  AlertCircle,
} from "lucide-react";

interface TransactionsViewProps {
  transactions: Transaction[];
  settings: ShopSettings;
  onAddTransaction: (tx: Omit<Transaction, "id" | "createdAt" | "userId">) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteAllTransactions: () => void;
  darkMode: boolean;
}

export default function TransactionsView({
  transactions,
  settings,
  onAddTransaction,
  onDeleteTransaction,
  onDeleteAllTransactions,
  darkMode,
}: TransactionsViewProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "cash" | "qris">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Quick form state
  const [showForm, setShowForm] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [qty, setQty] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || Number(amount) <= 0) return;

    onAddTransaction({
      type: txType,
      date,
      category,
      amount: Number(amount),
      paymentMethod: txType === "income" ? paymentMethod : undefined,
      quantity: txType === "income" ? Number(qty) : undefined,
      note,
    });

    // Reset Form
    setCategory("");
    setAmount("");
    setQty("1");
    setNote("");
    setShowForm(false);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.note || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || tx.type === typeFilter;

    const matchesMethod =
      methodFilter === "all" ||
      (tx.type === "income" && tx.paymentMethod === methodFilter);

    const matchesStartDate = !startDate || tx.date >= startDate;
    const matchesEndDate = !endDate || tx.date <= endDate;

    return matchesSearch && matchesType && matchesMethod && matchesStartDate && matchesEndDate;
  });

  // Calculate stats for current view filter
  const filteredIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredNet = filteredIncome - filteredExpense;

  const rupiah = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  // WhatsApp individual sharing
  const handleShareIndividual = (tx: Transaction) => {
    const msg = formatTransactionMessage(tx, settings.shopName);
    const waUrl = getWhatsappUrl(settings.whatsappNumber, msg);

    if (settings.autoSendWhatsapp && settings.whatsappWebhookUrl) {
      sendWhatsappWebhook(settings.whatsappWebhookUrl, {
        shopName: settings.shopName,
        reportType: "single_transaction",
        transaction: tx,
        message: msg,
      });
    }

    window.open(waUrl, "_blank");
  };

  // WhatsApp daily report for selected startDate or today
  const handleShareDailyReport = () => {
    const targetDate = startDate || new Date().toISOString().split("T")[0];
    const msg = formatDailyReport(transactions, targetDate, settings.shopName);
    const waUrl = getWhatsappUrl(settings.whatsappNumber, msg);

    if (settings.autoSendWhatsapp && settings.whatsappWebhookUrl) {
      sendWhatsappWebhook(settings.whatsappWebhookUrl, {
        shopName: settings.shopName,
        reportType: "daily_summary",
        date: targetDate,
        message: msg,
      });
    }

    window.open(waUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">
            Manajemen Transaksi Penjualan & Pengeluaran
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Daftar lengkap pemasukan, pengeluaran, filter terperinci, serta integrasi WhatsApp.
          </p>
        </div>

        <div className="flex gap-2">
          {transactions.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Apakah Anda yakin ingin menghapus SELURUH data transaksi? Tindakan ini tidak dapat dibatalkan.")) {
                  onDeleteAllTransactions();
                }
              }}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all border border-rose-500/25 cursor-pointer"
            >
              <Trash2 className="w-4.5 h-4.5" />
              <span>Hapus Semua</span>
            </button>
          )}

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <span>{showForm ? "Tutup Form" : "＋ Tambah Transaksi"}</span>
          </button>
        </div>
      </div>

      {/* Add Transaction Form Drawer/Section */}
      {showForm && (
        <div
          className={`p-6 rounded-2xl border transition-all ${
            darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-md font-bold mb-4 flex items-center gap-2">
            <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs">📝</span>
            <span>Form Transaksi Baru</span>
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">Tipe</label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as "income" | "expense")}
                className={`w-full px-3 py-2 rounded-xl text-sm border outline-none ${
                  darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              >
                <option value="income">📥 Pemasukan (Penjualan)</option>
                <option value="expense">📤 Pengeluaran</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">Tanggal</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm border outline-none font-mono ${
                  darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">
                Kategori / Item
              </label>
              <input
                type="text"
                required
                placeholder={txType === "income" ? "Roti Bakar Keju Coklat" : "Sewa Tempat / Bahan Baku"}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm border outline-none ${
                  darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">Nominal (Rp)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="18000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm border outline-none font-mono ${
                  darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            {/* Quantity / Porsi (Income Only) */}
            {txType === "income" ? (
              <div>
                <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">Jumlah Porsi</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-sm border outline-none font-mono ${
                    darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>
            ) : (
              <div className="opacity-40">
                <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">Jumlah Porsi</label>
                <input
                  type="text"
                  disabled
                  value="N/A"
                  className={`w-full px-3 py-2 rounded-xl text-sm border outline-none cursor-not-allowed ${
                    darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>
            )}

            {/* Payment Method - cash vs qris (Income Only) */}
            {txType === "income" ? (
              <div>
                <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "cash" | "qris")}
                  className={`w-full px-3 py-2 rounded-xl text-sm border outline-none ${
                    darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                >
                  <option value="cash">💵 Uang Cash (Tunai)</option>
                  <option value="qris">📱 Uang QRIS (Non-Tunai)</option>
                </select>
              </div>
            ) : (
              <div className="opacity-40">
                <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">
                  Metode Pembayaran
                </label>
                <input
                  type="text"
                  disabled
                  value="Cash (Default)"
                  className={`w-full px-3 py-2 rounded-xl text-sm border outline-none cursor-not-allowed ${
                    darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                />
              </div>
            )}

            {/* Note */}
            <div className="md:col-span-2">
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">Catatan</label>
              <input
                type="text"
                placeholder="Keterangan tambahan (cth: Keju susu double, tanpa coklat)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm border outline-none ${
                  darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all cursor-pointer h-10 shadow-sm"
              >
                Simpan Transaksi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Toolbar Panel */}
      <div
        className={`p-5 rounded-2xl border ${
          darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Term */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                darkMode
                  ? "bg-slate-850 border-slate-800 text-white focus:border-amber-500"
                  : "bg-slate-50 border-slate-200 text-slate-950 focus:border-amber-500"
              }`}
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none cursor-pointer ${
                darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-950"
              }`}
            >
              <option value="all">📁 Semua Tipe</option>
              <option value="income">📥 Pemasukan</option>
              <option value="expense">📤 Pengeluaran</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              disabled={typeFilter === "expense"}
              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none cursor-pointer ${
                typeFilter === "expense" ? "opacity-40 cursor-not-allowed" : ""
              } ${
                darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-950"
              }`}
            >
              <option value="all">💵 Semua Metode</option>
              <option value="cash">💵 Uang Cash (Tunai)</option>
              <option value="qris">📱 Uang QRIS (Non-Tunai)</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-2xs font-bold text-slate-400 uppercase">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-2 py-1.5 rounded-xl text-xs border outline-none font-mono ${
                darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-950"
              }`}
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-2xs font-bold text-slate-400 uppercase">S/D:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-2 py-1.5 rounded-xl text-xs border outline-none font-mono ${
                darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-950"
              }`}
            />
          </div>
        </div>

        {/* Clear Filters helper */}
        {(searchTerm || typeFilter !== "all" || methodFilter !== "all" || startDate || endDate) && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <div className="text-xs text-slate-400">
              Menampilkan {filteredTransactions.length} dari {transactions.length} total transaksi
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setMethodFilter("all");
                setStartDate("");
                setEndDate("");
              }}
              className="text-xs text-amber-500 hover:underline font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Filter Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-xs font-medium text-slate-400 uppercase">Total Pemasukan Filter</div>
          <div className="text-sm font-bold font-mono text-emerald-500">{rupiah(filteredIncome)}</div>
        </div>
        <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-xs font-medium text-slate-400 uppercase">Total Pengeluaran Filter</div>
          <div className="text-sm font-bold font-mono text-red-500">{rupiah(filteredExpense)}</div>
        </div>
        <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-xs font-medium text-slate-400 uppercase">Keuntungan Bersih Filter</div>
          <div className={`text-sm font-bold font-mono ${filteredNet >= 0 ? "text-amber-500" : "text-red-500"}`}>
            {rupiah(filteredNet)}
          </div>
        </div>
      </div>

      {/* Main Transactions Log Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs uppercase font-bold tracking-wider ${
                darkMode ? "bg-slate-850/80 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
              }`}>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori / Item</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Pembayaran</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    Tidak ada transaksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredTransactions
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
                  .map((tx) => {
                    const isIncome = tx.type === "income";
                    return (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors`}
                      >
                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-350 whitespace-nowrap">
                          {tx.date}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{isIncome ? "🍞" : "💸"}</span>
                            <span>{tx.category}</span>
                            {tx.quantity ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-2xs text-slate-400">
                                {tx.quantity} porsi
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Note */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {tx.note || "-"}
                        </td>

                        {/* Payment Method / Mode */}
                        <td className="py-3.5 px-4">
                          {isIncome ? (
                            tx.paymentMethod === "cash" ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold text-2xs uppercase tracking-wider">
                                💵 Tunai
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold text-2xs uppercase tracking-wider">
                                📱 QRIS
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-semibold text-2xs uppercase tracking-wider">
                              📤 Keluar
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                          isIncome ? "text-emerald-500" : "text-red-500"
                        }`}>
                          {isIncome ? "+" : "-"}
                          {rupiah(tx.amount)}
                        </td>

                        {/* Action buttons (Share WA, Delete) */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* WhatsApp Share */}
                            <button
                              onClick={() => handleShareIndividual(tx)}
                              title="Kirim ke WhatsApp"
                              className="p-1.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-lg transition-all cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
                                  onDeleteTransaction(tx.id);
                                }
                              }}
                              title="Hapus Transaksi"
                              className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fast Daily WhatsApp Summary Generation panel */}
      <div
        className={`p-6 rounded-2xl border text-center ${
          darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <h4 className="font-bold text-sm mb-2">Kirim Laporan Rekap Harian Otomatis</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-lg mx-auto">
          Pilih tanggal di filter pencarian di atas terlebih dahulu, kemudian ketuk tombol di bawah ini
          untuk menyusun rekap keuangan otomatis untuk seluruh transaksi di tanggal tersebut.
        </p>
        <button
          onClick={handleShareDailyReport}
          className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 mx-auto transition-all shadow-md shadow-green-500/15 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Kirim Laporan Harian via WhatsApp</span>
        </button>
      </div>
    </div>
  );
}

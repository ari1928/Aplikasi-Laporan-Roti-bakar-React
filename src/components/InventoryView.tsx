import React, { useState } from "react";
import { InventoryItem, ShopSettings } from "../types";
import { formatStockReport, getWhatsappUrl, sendWhatsappWebhook } from "../utils/whatsapp";
import {
  Package,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  Share2,
  PlusCircle,
  TrendingDown,
  Activity,
} from "lucide-react";

interface InventoryViewProps {
  inventory: InventoryItem[];
  settings: ShopSettings;
  onAddInventory: (item: Omit<InventoryItem, "id" | "lastUpdated" | "userId">) => void;
  onUpdateStock: (id: string, newStock: number) => void;
  onDeleteInventory: (id: string) => void;
  onDeleteAllInventory: () => void;
  darkMode: boolean;
}

export default function InventoryView({
  inventory,
  settings,
  onAddInventory,
  onUpdateStock,
  onDeleteInventory,
  onDeleteAllInventory,
  darkMode,
}: InventoryViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [minStock, setMinStock] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !stock || !unit || !minStock) return;

    onAddInventory({
      name,
      stock: Number(stock),
      unit,
      minStock: Number(minStock),
    });

    // Reset Form
    setName("");
    setStock("");
    setUnit("pcs");
    setMinStock("");
    setShowAddForm(false);
  };

  // WhatsApp Stock Report sharing
  const handleShareStock = () => {
    const reportMsg = formatStockReport(inventory, settings.shopName);
    const waUrl = getWhatsappUrl(settings.whatsappNumber, reportMsg);

    if (settings.autoSendWhatsapp && settings.whatsappWebhookUrl) {
      sendWhatsappWebhook(settings.whatsappWebhookUrl, {
        shopName: settings.shopName,
        reportType: "stock_report",
        message: reportMsg,
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
            Gudang Stok & Bahan Baku Roti Bakar
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola persediaan roti tawar, selai, keju, mentega, dan kirim laporan stok via WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {inventory.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Apakah Anda yakin ingin menghapus SELURUH data stok bahan baku? Tindakan ini tidak dapat dibatalkan.")) {
                  onDeleteAllInventory();
                }
              }}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all border border-rose-500/25 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua</span>
            </button>
          )}

          <button
            onClick={handleShareStock}
            className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-green-500/10 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Kirim Stok ke WA</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <span>{showAddForm ? "Tutup Form" : "＋ Tambah Bahan"}</span>
          </button>
        </div>
      </div>

      {/* Add Inventory Form Drawer */}
      {showAddForm && (
        <div
          className={`p-6 rounded-2xl border transition-all ${
            darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <h3 className="text-md font-bold mb-4 flex items-center gap-2">
            <span className="p-1 bg-amber-500/10 text-amber-500 rounded-lg text-xs">📦</span>
            <span>Bahan Baku Baru</span>
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">Nama Bahan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Roti Tawar Bandung, Ceres Coklat"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm border outline-none ${
                  darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">Stok Awal</label>
              <input
                type="number"
                required
                min="0"
                placeholder="20"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm border outline-none font-mono ${
                  darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">Satuan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm border outline-none ${
                  darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              >
                <option value="pcs">pcs (Bungkus)</option>
                <option value="kg">kg (Kilogram)</option>
                <option value="kaleng">kaleng</option>
                <option value="pack">pack (Kemasan)</option>
                <option value="liter">liter</option>
              </select>
            </div>

            {/* Min Stock Warning */}
            <div>
              <label className="block text-2xs font-bold text-slate-400 uppercase mb-1.5">
                Batas Minim Stok
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="5"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-sm border outline-none font-mono ${
                  darkMode ? "bg-slate-850 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
            </div>

            <div className="md:col-span-3"></div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all cursor-pointer h-10 shadow-sm"
              >
                Simpan Bahan Baku
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Materials (Bento style cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventory.map((item) => {
          const isLow = item.stock <= item.minStock;
          const percentage = Math.min(100, Math.max(0, (item.stock / (item.minStock * 3)) * 100));

          return (
            <div
              key={item.id}
              className={`p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden ${
                darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              {/* Alert Indicator Ribbon */}
              {isLow && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white px-3 py-1 text-3xs font-extrabold uppercase rounded-bl-xl tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>Stok Kritis</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <span className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl inline-block mb-1">
                    <Package className="w-5 h-5" />
                  </span>
                  <h3 className="font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">
                    {item.name}
                  </h3>
                </div>
              </div>

              {/* Stock numbers counters */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">STOK SEKARANG</span>
                  <span className={`text-xl font-bold font-mono ${isLow ? "text-amber-500 animate-pulse" : "text-slate-800 dark:text-slate-100"}`}>
                    {item.stock} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-3xs font-bold text-slate-400 block uppercase">BATAS MINIMUM</span>
                  <span className="text-xl font-bold font-mono text-slate-400 dark:text-slate-500">
                    {item.minStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                  </span>
                </div>
              </div>

              {/* Simple progress track slider */}
              <div className="space-y-1 mb-5">
                <div className="flex justify-between text-3xs font-semibold text-slate-400">
                  <span>PERSENTASE KECUKUPAN</span>
                  <span className={isLow ? "text-amber-500" : "text-emerald-500"}>
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`h-full transition-all duration-500 ${
                      isLow ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  ></div>
                </div>
              </div>

              {/* Adjust Stock Panel Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdateStock(item.id, Math.max(0, item.stock - 1))}
                    title="Kurangi 1"
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer text-slate-600 dark:text-slate-400"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateStock(item.id, item.stock + 1)}
                    title="Tambah 1"
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-lg transition-all cursor-pointer text-slate-600 dark:text-slate-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Apakah Anda yakin ingin menghapus bahan ${item.name} dari gudang?`)) {
                      onDeleteInventory(item.id);
                    }
                  }}
                  title="Hapus Bahan"
                  className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

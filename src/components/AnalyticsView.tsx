import React, { useState } from "react";
import { Transaction, ShopSettings } from "../types";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  DollarSign,
  QrCode,
  FileText,
  PieChart,
} from "lucide-react";

interface AnalyticsViewProps {
  transactions: Transaction[];
  settings: ShopSettings;
  darkMode: boolean;
}

export default function AnalyticsView({ transactions, settings, darkMode }: AnalyticsViewProps) {
  // Date filters defaulting to past 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 29);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  // Quick Month Select helper
  const handleMonthSelect = (monthOffset: number) => {
    const targetMonth = new Date();
    targetMonth.setMonth(targetMonth.getMonth() - monthOffset);
    
    const start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    
    // adjust to timezone offset to get correct split
    const startStr = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const endStr = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().split("T")[0];

    setStartDate(startStr);
    setEndDate(endStr);
  };

  // Filter transactions
  const filteredTx = transactions.filter((tx) => tx.date >= startDate && tx.date <= endDate);

  // Stats
  const totalIncome = filteredTx
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = filteredTx
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalCashIncome = filteredTx
    .filter((tx) => tx.type === "income" && tx.paymentMethod === "cash")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalQrisIncome = filteredTx
    .filter((tx) => tx.type === "income" && tx.paymentMethod === "qris")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Group by date for line/bar trend chart
  const datesArray: string[] = [];
  const curr = new Date(startDate);
  const last = new Date(endDate);
  while (curr <= last) {
    datesArray.push(curr.toISOString().split("T")[0]);
    curr.setDate(curr.getDate() + 1);
  }

  const dailyTrendData = datesArray.map((date) => {
    const dayTx = filteredTx.filter((t) => t.date === date);
    const inc = dayTx.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const exp = dayTx.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    return {
      date,
      displayDate: date.substring(5), // MM-DD format for chart readability
      income: inc,
      expense: exp,
    };
  });

  // Render SVG Chart Parameters
  const chartHeight = 220;
  const chartWidth = 650;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const maxVal = Math.max(
    50000,
    ...dailyTrendData.map((d) => Math.max(d.income, d.expense))
  ) * 1.1; // 10% breathing room

  // Draw Trend Lines
  const getPoints = (key: "income" | "expense") => {
    if (dailyTrendData.length === 0) return "";
    const activeWidth = chartWidth - paddingLeft - paddingRight;
    const activeHeight = chartHeight - paddingTop - paddingBottom;
    const stepX = dailyTrendData.length > 1 ? activeWidth / (dailyTrendData.length - 1) : activeWidth;

    return dailyTrendData
      .map((d, index) => {
        const x = paddingLeft + index * stepX;
        const val = d[key];
        const y = chartHeight - paddingBottom - (val / maxVal) * activeHeight;
        return `${x},${y}`;
      })
      .join(" ");
  };

  const incomePoints = getPoints("income");
  const expensePoints = getPoints("expense");

  // Trigger browser PDF Print mode which utilizes custom `@media print` CSS configurations
  const handlePrintPDF = () => {
    window.print();
  };

  const rupiah = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  return (
    <div className="space-y-6">
      {/* Header (Hidden during Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight">
            Grafik & Analisis Keuangan Penjualan
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visualisasi tren harian, pembagian QRIS vs Tunai, serta cetak laporan PDF bulanan resmi.
          </p>
        </div>

        <button
          onClick={handlePrintPDF}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-amber-500/15 cursor-pointer hover:-translate-y-0.5"
        >
          <Download className="w-4 h-4" />
          <span>Unduh PDF / Cetak Laporan</span>
        </button>
      </div>

      {/* Date Filters Row (Hidden during Print) */}
      <div
        className={`p-5 rounded-2xl border no-print ${
          darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleMonthSelect(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                darkMode ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
              }`}
            >
              📅 Bulan Ini
            </button>
            <button
              onClick={() => handleMonthSelect(1)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                darkMode ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
              }`}
            >
              📅 Bulan Lalu
            </button>
            <button
              onClick={() => {
                const start = new Date();
                start.setDate(start.getDate() - 6);
                setStartDate(start.toISOString().split("T")[0]);
                setEndDate(new Date().toISOString().split("T")[0]);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                darkMode ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
              }`}
            >
              📅 7 Hari Terakhir
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-2xs font-bold text-slate-400 uppercase">Mulai:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`px-2.5 py-1.5 rounded-xl text-xs border outline-none font-mono ${
                  darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-950"
                }`}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xs font-bold text-slate-400 uppercase">S/D:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`px-2.5 py-1.5 rounded-xl text-xs border outline-none font-mono ${
                  darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-950"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="print-only hidden mb-8 text-center border-b pb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          {settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="w-12 h-12 rounded-full object-cover border"
              referrerPolicy="no-referrer"
            />
          )}
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            {settings.shopName.toUpperCase()}
          </h1>
        </div>
        <p className="text-md font-bold text-slate-600">LAPORAN KEUANGAN BULANAN RESMI</p>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Rentang Laporan: {startDate} s/d {endDate}
        </p>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pemasukan */}
        <div
          className={`p-5 rounded-2xl border print-card ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Pemasukan Kotor
            </span>
          </div>
          <h3 className="text-xl font-extrabold font-mono text-emerald-500">{rupiah(totalIncome)}</h3>
          <div className="flex justify-between items-center mt-3 pt-3 border-t text-2xs text-slate-400 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Cash: {rupiah(totalCashIncome)}
            </span>
            <span className="flex items-center gap-1">
              <QrCode className="w-3 h-3" /> QRIS: {rupiah(totalQrisIncome)}
            </span>
          </div>
        </div>

        {/* Pengeluaran */}
        <div
          className={`p-5 rounded-2xl border print-card ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-red-500/10 text-red-500 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </span>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Pengeluaran Operasional
            </span>
          </div>
          <h3 className="text-xl font-extrabold font-mono text-red-500">{rupiah(totalExpense)}</h3>
          <p className="text-2xs text-slate-400 mt-3 pt-3 border-t dark:border-slate-800">
            Mencakup belanja bahan baku dan penunjang kedai.
          </p>
        </div>

        {/* Profit Bersih */}
        <div
          className={`p-5 rounded-2xl border print-card ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              Keuntungan Bersih (Net Profit)
            </span>
          </div>
          <h3
            className={`text-xl font-extrabold font-mono ${
              netProfit >= 0 ? "text-amber-500" : "text-red-500"
            }`}
          >
            {rupiah(netProfit)}
          </h3>
          <p className="text-2xs text-slate-400 mt-3 pt-3 border-t dark:border-slate-800">
            Keuntungan bersih setelah dikurangi semua beban harian.
          </p>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Daily Revenue & Expenses Trend (8 columns) */}
        <div
          className={`lg:col-span-8 p-6 rounded-2xl border print-card overflow-hidden ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
            <span>📈 Grafik Tren Pemasukan vs Pengeluaran</span>
          </h4>

          {/* Render Responsive custom SVG Chart */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[650px] py-2">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                  const y = paddingTop + (1 - p) * (chartHeight - paddingTop - paddingBottom);
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke={darkMode ? "#1e293b" : "#e2e8f0"}
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 4}
                        fill="#94a3b8"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {rupiah(Math.round(maxVal * p))}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Grid Dates */}
                {dailyTrendData.map((d, index) => {
                  const activeWidth = chartWidth - paddingLeft - paddingRight;
                  const stepX = dailyTrendData.length > 1 ? activeWidth / (dailyTrendData.length - 1) : activeWidth;
                  const x = paddingLeft + index * stepX;

                  // Render text label for date only sometimes to avoid clutter
                  const stepLabel = Math.max(1, Math.ceil(dailyTrendData.length / 8));
                  if (index % stepLabel === 0 || index === dailyTrendData.length - 1) {
                    return (
                      <g key={index}>
                        <line
                          x1={x}
                          y1={paddingTop}
                          x2={x}
                          y2={chartHeight - paddingBottom}
                          stroke={darkMode ? "#0f172a" : "#f1f5f9"}
                        />
                        <text
                          x={x}
                          y={chartHeight - paddingBottom + 16}
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {d.displayDate}
                        </text>
                      </g>
                    );
                  }
                  return null;
                })}

                {/* Draw Areas for Income */}
                {incomePoints && (
                  <path
                    d={`M ${paddingLeft},${chartHeight - paddingBottom} L ${incomePoints} L ${
                      chartWidth - paddingRight
                    },${chartHeight - paddingBottom} Z`}
                    fill="url(#incomeGradient)"
                    opacity="0.15"
                  />
                )}

                {/* Draw Line Paths */}
                {incomePoints && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    points={incomePoints}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {expensePoints && (
                  <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    points={expensePoints}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Gradients */}
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-2xs font-semibold uppercase tracking-wider mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span>
              <span className="text-slate-500">Pemasukan Kotor (Tunai + QRIS)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1.5 border-t-2 border-dashed border-red-500 inline-block"></span>
              <span className="text-slate-500">Pengeluaran Operasional</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Cash vs QRIS comparison (4 columns) */}
        <div
          className={`lg:col-span-4 p-6 rounded-2xl border print-card flex flex-col justify-between ${
            darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div>
            <h4 className="font-bold text-sm mb-1.5 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-500" />
              <span>Metode Pembayaran</span>
            </h4>
            <p className="text-2xs text-slate-400">Pembagian pemasukan kotor Cash vs QRIS.</p>
          </div>

          {totalIncome === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Tidak ada data pemasukan untuk divisualisasikan.
            </div>
          ) : (
            <div className="space-y-6 my-6">
              {/* Cash Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">💵 Tunai (Cash)</span>
                  <span className="font-mono text-slate-500">
                    {rupiah(totalCashIncome)} (
                    {Math.round((totalCashIncome / totalIncome) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(totalCashIncome / totalIncome) * 100}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  ></div>
                </div>
              </div>

              {/* QRIS Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">📱 QRIS</span>
                  <span className="font-mono text-slate-500">
                    {rupiah(totalQrisIncome)} (
                    {Math.round((totalQrisIncome / totalIncome) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(totalQrisIncome / totalIncome) * 100}%` }}
                    className="h-full bg-blue-500 rounded-full"
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div className="text-3xs text-center text-slate-400 border-t pt-3 dark:border-slate-800">
            Pemilik disarankan mencocokkan total QRIS dengan mutasi rekening bank secara harian.
          </div>
        </div>
      </div>

      {/* Signature Area (Visible only when Printing) */}
      <div className="print-only hidden mt-16">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-16">Dibuat Oleh,</p>
            <p className="text-sm font-bold border-t pt-1.5 text-slate-800">Kasir Roti Bakar</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-16">Mengetahui,</p>
            <p className="text-sm font-bold border-t pt-1.5 text-slate-800">Pemilik Kedai</p>
          </div>
        </div>
      </div>
    </div>
  );
}

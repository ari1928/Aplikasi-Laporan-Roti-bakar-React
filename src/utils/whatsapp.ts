import { Transaction, InventoryItem, ShopSettings } from "../types";

// Clean phone number format for WhatsApp API (remove +, spaces, leading 0 to 62, etc)
export function cleanPhoneNumber(num: string): string {
  let cleaned = num.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }
  return cleaned || "6281234567890";
}

// Generate deep-link url for WhatsApp
export function getWhatsappUrl(phone: string, text: string): string {
  const formattedPhone = cleanPhoneNumber(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

// Send automated webhook notification if user configured a webhook URL
export async function sendWhatsappWebhook(webhookUrl: string, payload: any): Promise<boolean> {
  if (!webhookUrl) return false;
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.warn("Error sending WhatsApp webhook:", error);
    return false;
  }
}

// 1. Format Single Transaction Notification
export function formatTransactionMessage(transaction: Transaction, shopName: string): string {
  const isIncome = transaction.type === "income";
  const typeText = isIncome ? "📥 PEMASUKAN BARU" : "📤 PENGELUARAN BARU";
  const dateStr = transaction.date;
  const methodText = isIncome ? ` (Metode: ${transaction.paymentMethod?.toUpperCase()})` : "";
  const rupiah = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  return `*🔥 NOTIFIKASI TRANSAKSI - ${shopName.toUpperCase()} *

*Status:* ${typeText}
*Tanggal:* ${dateStr}
*Kategori:* ${transaction.category}
*Jumlah:* ${rupiah(transaction.amount)}${methodText}
${transaction.quantity ? `*Jumlah Porsi:* ${transaction.quantity} porsi\n` : ""}${transaction.note ? `*Catatan:* ${transaction.note}\n` : ""}
_Pesan otomatis dikirim dari sistem Laporan Roti Bakar._`;
}

// 2. Format Stock & Raw Material Status Report
export function formatStockReport(inventory: InventoryItem[], shopName: string): string {
  let message = `*📦 LAPORAN STOK BAHAN BAKU - ${shopName.toUpperCase()}*\n`;
  message += `Tanggal Cetak: ${new Date().toLocaleDateString("id-ID")}\n`;
  message += `=========================\n\n`;

  inventory.forEach((item, index) => {
    const isWarning = item.stock <= item.minStock;
    const warningEmoji = isWarning ? "⚠️ " : "✅ ";
    message += `${warningEmoji}${index + 1}. *${item.name}*\n`;
    message += `   • Stok saat ini: ${item.stock} ${item.unit}\n`;
    message += `   • Batas minimum: ${item.minStock} ${item.unit}\n`;
    message += `   • Status: ${isWarning ? "*Hampir Habis!*" : "Aman"}\n\n`;
  });

  message += `=========================\n`;
  message += `_Silakan segera lakukan pembelian untuk bahan baku bertanda ⚠️._`;
  return message;
}

// 3. Format Daily Report (Financial Summary)
export function formatDailyReport(transactions: Transaction[], date: string, shopName: string): string {
  const dailyTx = transactions.filter((t) => t.date === date);
  const incomeTx = dailyTx.filter((t) => t.type === "income");
  const expenseTx = dailyTx.filter((t) => t.type === "expense");

  const totalCash = incomeTx
    .filter((t) => t.paymentMethod === "cash")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalQris = incomeTx
    .filter((t) => t.paymentMethod === "qris")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = totalCash + totalQris;
  const totalExpense = expenseTx.reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const rupiah = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  let message = `*📊 LAPORAN KEUANGAN HARIAN - ${shopName.toUpperCase()}*\n`;
  message += `Tanggal: *${date}*\n`;
  message += `=========================\n\n`;

  message += `*📥 TOTAL PEMASUKAN:* ${rupiah(totalIncome)}\n`;
  message += `   • Cash/Tunai: ${rupiah(totalCash)}\n`;
  message += `   • QRIS/Non-Tunai: ${rupiah(totalQris)}\n\n`;

  message += `*📤 TOTAL PENGELUARAN:* ${rupiah(totalExpense)}\n`;
  if (expenseTx.length > 0) {
    expenseTx.forEach((e) => {
      message += `   - ${e.category}: ${rupiah(e.amount)} (${e.note || "Tanpa catatan"})\n`;
    });
  } else {
    message += `   (Tidak ada pengeluaran harian)\n`;
  }
  message += `\n`;

  message += `=========================\n`;
  message += `*📈 NET PROFIT (KEUNTUNGAN BERSIH):* *${rupiah(netProfit)}*\n`;
  message += `=========================\n`;
  message += `_Laporan otomatis harian ini dibuat untuk kemudahan pemantauan keuangan._`;

  return message;
}

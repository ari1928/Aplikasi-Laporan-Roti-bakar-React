export interface ShopSettings {
  shopName: string;
  logoUrl: string; // Base64 or image URL
  whatsappNumber: string; // target WhatsApp number to send reports
  whatsappWebhookUrl: string; // optional webhook for automated notifications
  autoSendWhatsapp: boolean; // toggle to auto-trigger sending reports
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  date: string; // YYYY-MM-DD
  category: string; // e.g. "Coklat Keju", "Keju Susu" for Roti Bakar, or "Bahan Baku"
  amount: number;
  paymentMethod?: 'cash' | 'qris'; // for income
  quantity?: number;
  note?: string;
  createdAt: string;
  userId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  unit: string; // "pcs", "kg", "pack", etc.
  minStock: number; // minimum warning threshold
  lastUpdated: string;
  userId: string;
}

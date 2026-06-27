import { Transaction, InventoryItem, ShopSettings } from "./types";

export const defaultSettings: ShopSettings = {
  shopName: "Roti Bakar Premium",
  logoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", // default elegant bread image
  whatsappNumber: "6281234567890",
  whatsappWebhookUrl: "",
  autoSendWhatsapp: false,
};

export const sampleInventory: InventoryItem[] = [
  {
    id: "inv_1",
    name: "Roti Tawar Kasur",
    stock: 45,
    unit: "pcs",
    minStock: 10,
    lastUpdated: "2026-06-26T10:00:00Z",
    userId: "guest",
  },
  {
    id: "inv_2",
    name: "Coklat Ceres",
    stock: 12,
    unit: "kg",
    minStock: 3,
    lastUpdated: "2026-06-26T10:00:00Z",
    userId: "guest",
  },
  {
    id: "inv_3",
    name: "Keju Kraft Cheddar",
    stock: 8,
    unit: "kg",
    minStock: 2,
    lastUpdated: "2026-06-26T10:00:00Z",
    userId: "guest",
  },
  {
    id: "inv_4",
    name: "Susu Kental Manis",
    stock: 24,
    unit: "kaleng",
    minStock: 5,
    lastUpdated: "2026-06-26T10:00:00Z",
    userId: "guest",
  },
  {
    id: "inv_5",
    name: "Selai Stroberi",
    stock: 5,
    unit: "kg",
    minStock: 2,
    lastUpdated: "2026-06-26T09:30:00Z",
    userId: "guest",
  },
  {
    id: "inv_6",
    name: "Mentega Blueband",
    stock: 15,
    unit: "kg",
    minStock: 4,
    lastUpdated: "2026-06-26T10:00:00Z",
    userId: "guest",
  }
];

// Let's generate transactions for the past 30 days to populate charts beautifully
export const generateSampleTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const categories = [
    "Roti Bakar Coklat",
    "Roti Bakar Keju",
    "Roti Bakar Coklat Keju",
    "Roti Bakar Stroberi",
    "Roti Bakar Pisang",
    "Roti Bakar Spesial Komplit"
  ];
  
  const prices = {
    "Roti Bakar Coklat": 15000,
    "Roti Bakar Keju": 17000,
    "Roti Bakar Coklat Keju": 20000,
    "Roti Bakar Stroberi": 14000,
    "Roti Bakar Pisang": 16000,
    "Roti Bakar Spesial Komplit": 25000
  };

  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Income (Sales) - 2 to 6 transactions per day
    const salesCount = Math.floor(Math.random() * 5) + 3;
    for (let s = 0; s < salesCount; s++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const qty = Math.floor(Math.random() * 2) + 1;
      const amount = prices[cat as keyof typeof prices] * qty;
      const method = Math.random() > 0.4 ? 'qris' : 'cash';
      
      transactions.push({
        id: `t_inc_${dateStr}_${s}`,
        type: 'income',
        date: dateStr,
        category: cat,
        amount: amount,
        paymentMethod: method,
        quantity: qty,
        note: `Penjualan ${qty} porsi ${cat}`,
        createdAt: `${dateStr}T${17 + s}:${Math.floor(Math.random() * 60)}:00Z`,
        userId: 'guest'
      });
    }

    // Expense (Pengeluaran) - periodic expenses
    if (i % 3 === 0) {
      // Raw material purchase
      transactions.push({
        id: `t_exp_${dateStr}_1`,
        type: 'expense',
        date: dateStr,
        category: "Bahan Baku",
        amount: 85000 + Math.floor(Math.random() * 50000),
        note: "Belanja roti, mentega, dan susu kental",
        createdAt: `${dateStr}T10:00:00Z`,
        userId: 'guest'
      });
    }
    
    if (i % 10 === 0) {
      // Gas / Utilities
      transactions.push({
        id: `t_exp_${dateStr}_2`,
        type: 'expense',
        date: dateStr,
        category: "Operasional",
        amount: 22000,
        note: "Isi ulang Gas Elpiji 3kg",
        createdAt: `${dateStr}T11:00:00Z`,
        userId: 'guest'
      });
    }
  }

  return transactions;
};

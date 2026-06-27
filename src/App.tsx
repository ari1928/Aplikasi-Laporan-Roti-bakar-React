import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

import {
  LayoutDashboard,
  Receipt,
  Package,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  User,
  Activity,
} from "lucide-react";

// Components
import AuthView from "./components/AuthView";
import HomeView from "./components/HomeView";
import TransactionsView from "./components/TransactionsView";
import InventoryView from "./components/InventoryView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";

// Sample Data
import { ShopSettings, Transaction, InventoryItem } from "./types";
import { defaultSettings, sampleInventory, generateSampleTransactions } from "./sampleData";

export default function App() {
  // Authentication State
  const [user, setUser] = useState<{ uid: string; email: string; displayName: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App settings, transactions, and inventory states
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Layout UI states
  const [activeTab, setActiveTab] = useState<"home" | "transactions" | "inventory" | "analytics" | "settings">("home");
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // 1. Listen for Auth State Changes
  useEffect(() => {
    // Check if there is a simulated guest user in localStorage
    const savedSimulatedUser = localStorage.getItem("roti_bakar_simulated_user");
    if (savedSimulatedUser) {
      setUser(JSON.parse(savedSimulatedUser));
      setAuthLoading(false);
    } else {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "Pemilik Roti Bakar",
          });
        } else {
          setUser(null);
        }
        setAuthLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  // 2. Load settings, transactions, and inventory once user state is ready
  useEffect(() => {
    if (authLoading) return;

    const loadData = async () => {
      setDataLoading(true);
      try {
        if (user) {
          // A. SIGNED IN: Load from Firestore
          const userId = user.uid;

          // 1. Settings Document
          const settingsRef = doc(db, "users", userId, "config", "settings");
          const settingsSnap = await getDoc(settingsRef);

          let currentSettings = defaultSettings;
          if (settingsSnap.exists()) {
            currentSettings = settingsSnap.data() as ShopSettings;
            setSettings(currentSettings);
          } else {
            // First time login - set default settings in Firestore
            await setDoc(settingsRef, defaultSettings);
            setSettings(defaultSettings);
          }
          // Cache settings
          localStorage.setItem(`roti_bakar_settings_${userId}`, JSON.stringify(currentSettings));

          // 2. Transactions Collection
          const txQuery = query(collection(db, "users", userId, "transactions"));
          const txSnap = await getDocs(txQuery);
          const loadedTx: Transaction[] = [];
          
          txSnap.forEach((docSnap) => {
            loadedTx.push({ id: docSnap.id, ...docSnap.data() } as Transaction);
          });

          // 3. Inventory Collection
          const invQuery = query(collection(db, "users", userId, "inventory"));
          const invSnap = await getDocs(invQuery);
          const loadedInv: InventoryItem[] = [];

          invSnap.forEach((docSnap) => {
            loadedInv.push({ id: docSnap.id, ...docSnap.data() } as InventoryItem);
          });

          // Seed default sample data on Firestore if newly registered and empty
          if (loadedTx.length === 0 && loadedInv.length === 0) {
            const batch = writeBatch(db);
            
            // Seed transactions
            const sampleTx = generateSampleTransactions();
            sampleTx.forEach((tx) => {
              const txRef = doc(collection(db, "users", userId, "transactions"));
              batch.set(txRef, { ...tx, userId });
              loadedTx.push({ ...tx, id: txRef.id, userId });
            });

            // Seed inventory
            sampleInventory.forEach((item) => {
              const invRef = doc(collection(db, "users", userId, "inventory"));
              batch.set(invRef, { ...item, userId });
              loadedInv.push({ ...item, id: invRef.id, userId });
            });

            await batch.commit();
          }

          setTransactions(loadedTx);
          setInventory(loadedInv);

          // Cache transactions and inventory
          localStorage.setItem(`roti_bakar_transactions_${userId}`, JSON.stringify(loadedTx));
          localStorage.setItem(`roti_bakar_inventory_${userId}`, JSON.stringify(loadedInv));
          setIsOfflineMode(false);
        } else {
          // B. GUEST MODE: Load from LocalStorage
          const localSettings = localStorage.getItem("roti_bakar_settings");
          const localTx = localStorage.getItem("roti_bakar_transactions");
          const localInv = localStorage.getItem("roti_bakar_inventory");

          if (localSettings) setSettings(JSON.parse(localSettings));
          else setSettings(defaultSettings);

          if (localTx) {
            setTransactions(JSON.parse(localTx));
          } else {
            const initialTx = generateSampleTransactions();
            setTransactions(initialTx);
            localStorage.setItem("roti_bakar_transactions", JSON.stringify(initialTx));
          }

          if (localInv) {
            setInventory(JSON.parse(localInv));
          } else {
            setInventory(sampleInventory);
            localStorage.setItem("roti_bakar_inventory", JSON.stringify(sampleInventory));
          }
          setIsOfflineMode(false);
        }
      } catch (err) {
        console.warn("Error loading application data, switching to offline fallback:", err);
        if (user) {
          const userId = user.uid;
          setIsOfflineMode(true);

          const localSettings = localStorage.getItem(`roti_bakar_settings_${userId}`) || localStorage.getItem("roti_bakar_settings");
          const localTx = localStorage.getItem(`roti_bakar_transactions_${userId}`) || localStorage.getItem("roti_bakar_transactions");
          const localInv = localStorage.getItem(`roti_bakar_inventory_${userId}`) || localStorage.getItem("roti_bakar_inventory");

          if (localSettings) setSettings(JSON.parse(localSettings));
          else setSettings(defaultSettings);

          if (localTx) {
            setTransactions(JSON.parse(localTx));
          } else {
            const initialTx = generateSampleTransactions();
            setTransactions(initialTx);
            localStorage.setItem(`roti_bakar_transactions_${userId}`, JSON.stringify(initialTx));
          }

          if (localInv) {
            setInventory(JSON.parse(localInv));
          } else {
            setInventory(sampleInventory);
            localStorage.setItem(`roti_bakar_inventory_${userId}`, JSON.stringify(sampleInventory));
          }
        } else {
          setSettings(defaultSettings);
          setTransactions(generateSampleTransactions());
          setInventory(sampleInventory);
        }
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user, authLoading]);

  // Handle updates to LocalStorage for Guest mode
  const saveGuestData = (newTx?: Transaction[], newInv?: InventoryItem[], newSettings?: ShopSettings) => {
    if (newTx) {
      setTransactions(newTx);
      localStorage.setItem("roti_bakar_transactions", JSON.stringify(newTx));
    }
    if (newInv) {
      setInventory(newInv);
      localStorage.setItem("roti_bakar_inventory", JSON.stringify(newInv));
    }
    if (newSettings) {
      setSettings(newSettings);
      localStorage.setItem("roti_bakar_settings", JSON.stringify(newSettings));
    }
  };

  // Add a new transaction (Income or Expense)
  const handleAddTransaction = async (txData: Omit<Transaction, "id" | "createdAt" | "userId">) => {
    const newTx: Omit<Transaction, "id"> = {
      ...txData,
      createdAt: new Date().toISOString(),
      userId: user ? user.uid : "guest",
    };

    if (user) {
      const tempId = `tx_temp_${Date.now()}`;
      const tempItem: Transaction = { ...newTx, id: tempId };

      setTransactions((prev) => {
        const updated = [...prev, tempItem];
        localStorage.setItem(`roti_bakar_transactions_${user.uid}`, JSON.stringify(updated));
        return updated;
      });

      try {
        const txCollectionRef = collection(db, "users", user.uid, "transactions");
        const docRef = await addDoc(txCollectionRef, newTx);
        setTransactions((prev) => {
          const updated = prev.map((t) => t.id === tempId ? ({ ...newTx, id: docRef.id } as Transaction) : t);
          localStorage.setItem(`roti_bakar_transactions_${user.uid}`, JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.warn("Firestore save transaction error, continuing offline:", err);
        setIsOfflineMode(true);
        setTransactions((prev) => {
          const updated = prev.map((t) => t.id === tempId ? ({ ...newTx, id: `tx_offline_${Date.now()}` } as Transaction) : t);
          localStorage.setItem(`roti_bakar_transactions_${user.uid}`, JSON.stringify(updated));
          return updated;
        });
      }
    } else {
      // Guest local save
      const item: Transaction = {
        ...newTx,
        id: `tx_${Date.now()}`,
      };
      saveGuestData([...transactions, item], undefined, undefined);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    if (user) {
      setTransactions((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        localStorage.setItem(`roti_bakar_transactions_${user.uid}`, JSON.stringify(updated));
        return updated;
      });

      try {
        if (!id.startsWith("tx_offline_") && !id.startsWith("tx_temp_")) {
          const docRef = doc(db, "users", user.uid, "transactions", id);
          await deleteDoc(docRef);
        }
      } catch (err) {
        console.warn("Firestore delete transaction error, continuing offline:", err);
        setIsOfflineMode(true);
      }
    } else {
      const updated = transactions.filter((t) => t.id !== id);
      saveGuestData(updated, undefined, undefined);
    }
  };

  // Add new raw material to inventory list
  const handleAddInventory = async (itemData: Omit<InventoryItem, "id" | "lastUpdated" | "userId">) => {
    const newItem: Omit<InventoryItem, "id"> = {
      ...itemData,
      lastUpdated: new Date().toISOString(),
      userId: user ? user.uid : "guest",
    };

    if (user) {
      const tempId = `inv_temp_${Date.now()}`;
      const tempItem: InventoryItem = { ...newItem, id: tempId };

      setInventory((prev) => {
        const updated = [...prev, tempItem];
        localStorage.setItem(`roti_bakar_inventory_${user.uid}`, JSON.stringify(updated));
        return updated;
      });

      try {
        const invCollectionRef = collection(db, "users", user.uid, "inventory");
        const docRef = await addDoc(invCollectionRef, newItem);
        setInventory((prev) => {
          const updated = prev.map((item) => item.id === tempId ? ({ ...newItem, id: docRef.id } as InventoryItem) : item);
          localStorage.setItem(`roti_bakar_inventory_${user.uid}`, JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.warn("Firestore inventory save error, continuing offline:", err);
        setIsOfflineMode(true);
        setInventory((prev) => {
          const updated = prev.map((item) => item.id === tempId ? ({ ...newItem, id: `inv_offline_${Date.now()}` } as InventoryItem) : item);
          localStorage.setItem(`roti_bakar_inventory_${user.uid}`, JSON.stringify(updated));
          return updated;
        });
      }
    } else {
      const item: InventoryItem = {
        ...newItem,
        id: `inv_${Date.now()}`,
      };
      saveGuestData(undefined, [...inventory, item], undefined);
    }
  };

  // Update existing inventory item stock
  const handleUpdateStock = async (id: string, newStock: number) => {
    const updatedInv = inventory.map((item) => {
      if (item.id === id) {
        return { ...item, stock: newStock, lastUpdated: new Date().toISOString() };
      }
      return item;
    });

    setInventory(updatedInv);
    if (user) {
      localStorage.setItem(`roti_bakar_inventory_${user.uid}`, JSON.stringify(updatedInv));
      try {
        if (!id.startsWith("inv_offline_") && !id.startsWith("inv_temp_")) {
          const docRef = doc(db, "users", user.uid, "inventory", id);
          await updateDoc(docRef, { stock: newStock, lastUpdated: new Date().toISOString() });
        }
      } catch (err) {
        console.warn("Firestore inventory update error, continuing offline:", err);
        setIsOfflineMode(true);
      }
    } else {
      saveGuestData(undefined, updatedInv, undefined);
    }
  };

  // Delete inventory item from catalog
  const handleDeleteInventory = async (id: string) => {
    const updatedInv = inventory.filter((i) => i.id !== id);

    setInventory(updatedInv);
    if (user) {
      localStorage.setItem(`roti_bakar_inventory_${user.uid}`, JSON.stringify(updatedInv));
      try {
        if (!id.startsWith("inv_offline_") && !id.startsWith("inv_temp_")) {
          const docRef = doc(db, "users", user.uid, "inventory", id);
          await deleteDoc(docRef);
        }
      } catch (err) {
        console.warn("Firestore inventory delete error, continuing offline:", err);
        setIsOfflineMode(true);
      }
    } else {
      saveGuestData(undefined, updatedInv, undefined);
    }
  };

  // Delete all transactions (Delete all)
  const handleDeleteAllTransactions = async () => {
    setTransactions([]);
    if (user) {
      localStorage.removeItem(`roti_bakar_transactions_${user.uid}`);
      try {
        const promises = transactions.map(async (t) => {
          if (!t.id.startsWith("tx_offline_") && !t.id.startsWith("tx_temp_")) {
            const docRef = doc(db, "users", user.uid, "transactions", t.id);
            await deleteDoc(docRef);
          }
        });
        await Promise.all(promises);
      } catch (err) {
        console.warn("Firestore delete all transactions error, continuing offline:", err);
        setIsOfflineMode(true);
      }
    } else {
      saveGuestData([], undefined, undefined);
    }
  };

  // Delete all inventory items (Delete all)
  const handleDeleteAllInventory = async () => {
    setInventory([]);
    if (user) {
      localStorage.removeItem(`roti_bakar_inventory_${user.uid}`);
      try {
        const promises = inventory.map(async (i) => {
          if (!i.id.startsWith("inv_offline_") && !i.id.startsWith("inv_temp_")) {
            const docRef = doc(db, "users", user.uid, "inventory", i.id);
            await deleteDoc(docRef);
          }
        });
        await Promise.all(promises);
      } catch (err) {
        console.warn("Firestore delete all inventory error, continuing offline:", err);
        setIsOfflineMode(true);
      }
    } else {
      saveGuestData(undefined, [], undefined);
    }
  };

  // Update whole shop settings (Logo, Name, WA number, etc.)
  const handleUpdateSettings = async (newSettings: ShopSettings) => {
    setSettings(newSettings);
    if (user) {
      localStorage.setItem(`roti_bakar_settings_${user.uid}`, JSON.stringify(newSettings));
      try {
        const docRef = doc(db, "users", user.uid, "config", "settings");
        await setDoc(docRef, newSettings);
      } catch (err) {
        console.warn("Firestore settings update error, continuing offline:", err);
        setIsOfflineMode(true);
      }
    } else {
      saveGuestData(undefined, undefined, newSettings);
    }
  };

  // Auth Logout handler
  const handleLogout = async () => {
    try {
      // Clear both real & simulated user sessions
      localStorage.removeItem("roti_bakar_simulated_user");
      await signOut(auth);
      setUser(null);
      setActiveTab("home");
    } catch (err) {
      console.warn(err);
    }
  };

  // Login success trigger from Auth component
  const handleLoginSuccess = (userData: { uid: string; email: string; displayName: string }) => {
    // If guest instant simulated session, persist in localStorage
    if (userData.uid.startsWith("sim_")) {
      localStorage.setItem("roti_bakar_simulated_user", JSON.stringify(userData));
    }
    setUser(userData);
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-wide uppercase font-sans animate-pulse text-amber-500">
          Memuat Sistem Roti Bakar...
        </p>
      </div>
    );
  }

  // If user is not authenticated, show Gmail Auth Screen
  if (!user) {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
        darkMode={darkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      
      {/* 1. Mobile Topbar Header (Hidden during Print) */}
      <header className={`md:hidden p-4 flex items-center justify-between border-b no-print ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-2.5">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="w-8 h-8 rounded-full object-cover border"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-xl">🍞</span>
          )}
          <h1 className="font-bold text-sm tracking-tight truncate max-w-[150px]">
            {settings.shopName}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggler */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? "bg-slate-800 text-amber-400" : "bg-slate-100 text-slate-600"}`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Hamburger menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-800"}`}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Responsive Sidebar (Hidden during Print) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 p-6 border-r flex flex-col justify-between transition-all duration-300 no-print shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
      >
        <div className="space-y-8">
          {/* Logo & Shop details */}
          <div className="flex items-center gap-3">
            <img
              src={settings.logoUrl || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150"}
              alt="Logo Roti Bakar"
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-500 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="truncate">
              <h1 className="font-extrabold text-sm tracking-tight truncate leading-tight">
                {settings.shopName}
              </h1>
              <p className="text-4xs text-slate-400 mt-0.5 font-semibold font-mono tracking-wider">
                ROTI BAKAR HUB
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: "home", label: "Menu Mulai", icon: LayoutDashboard },
              { id: "transactions", label: "Daftar Transaksi", icon: Receipt },
              { id: "inventory", label: "Stok Bahan Baku", icon: Package },
              { id: "analytics", label: "Grafik & Laporan", icon: BarChart3 },
              { id: "settings", label: "Pengaturan Toko", icon: Settings },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/10"
                      : darkMode
                      ? "text-slate-400 hover:text-slate-100 hover:bg-slate-850"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer details */}
        <div className="space-y-4 border-t pt-4 dark:border-slate-800">
          {/* Theme Switcher Desktop only */}
          <div className="hidden md:flex items-center justify-between p-1.5 bg-slate-100 dark:bg-slate-850 rounded-xl">
            <button
              onClick={() => setDarkMode(false)}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-3xs font-bold cursor-pointer transition-all ${
                !darkMode ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-350"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setDarkMode(true)}
              className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-3xs font-bold cursor-pointer transition-all ${
                darkMode ? "bg-slate-900 text-amber-400 shadow-sm" : "text-slate-500 hover:text-slate-600"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="p-1 bg-slate-100 dark:bg-slate-850 rounded-lg text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <div className="truncate">
              <p className="text-3xs font-bold truncate leading-none">{user.displayName}</p>
              <p className="text-4xs text-slate-400 mt-0.5 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-3xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-red-500/20 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* 3. Main Workspace Area */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {isOfflineMode && (
          <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-medium">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Sistem berjalan dalam <strong>Sesi Offline (Mode Lokal)</strong>. Seluruh data transaksi & bahan baku disimpan aman di browser ini.</span>
            </div>
            <button 
              onClick={async () => {
                setDataLoading(true);
                try {
                  const settingsRef = doc(db, "users", user.uid, "config", "settings");
                  await getDoc(settingsRef);
                  // Successfully loaded, connection is back!
                  setIsOfflineMode(false);
                  window.location.reload();
                } catch (e) {
                  console.warn("Still offline:", e);
                } finally {
                  setDataLoading(false);
                }
              }}
              className="px-3 py-1.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 active:scale-95 transition-all text-3xs uppercase tracking-wider cursor-pointer"
            >
              Coba Hubungkan Kembali
            </button>
          </div>
        )}
        {dataLoading ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Menyinkronkan data...</p>
          </div>
        ) : (
          <div>
            {activeTab === "home" && (
              <HomeView
                transactions={transactions}
                inventory={inventory}
                settings={settings}
                onAddTransaction={handleAddTransaction}
                darkMode={darkMode}
              />
            )}

            {activeTab === "transactions" && (
              <TransactionsView
                transactions={transactions}
                settings={settings}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onDeleteAllTransactions={handleDeleteAllTransactions}
                darkMode={darkMode}
              />
            )}

            {activeTab === "inventory" && (
              <InventoryView
                inventory={inventory}
                settings={settings}
                onAddInventory={handleAddInventory}
                onUpdateStock={handleUpdateStock}
                onDeleteInventory={handleDeleteInventory}
                onDeleteAllInventory={handleDeleteAllInventory}
                darkMode={darkMode}
              />
            )}

            {activeTab === "analytics" && (
              <AnalyticsView
                transactions={transactions}
                settings={settings}
                darkMode={darkMode}
              />
            )}

            {activeTab === "settings" && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                user={user}
                onLogout={handleLogout}
                onDeleteAllTransactions={handleDeleteAllTransactions}
                onDeleteAllInventory={handleDeleteAllInventory}
                darkMode={darkMode}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

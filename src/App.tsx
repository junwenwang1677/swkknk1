import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  HelpCircle,
  Package,
  ArrowRight,
  Shield,
  CheckCircle,
  Mail,
  MessageCircle,
  LayoutGrid,
  Rows
} from 'lucide-react';
import { InventoryItem, SelectedCartItem, OrderItem, StoreSettings } from './types';
import { api } from './services/api';
import { CATEGORIES } from './utils/imagePresets';
import { TopBar, getCategoryIcon } from './components/TopBar';
import { ItemCard } from './components/ItemCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { CheckoutDrawer } from './components/CheckoutDrawer';
import { AdminPortal } from './components/AdminPortal';
import { UserEmailModal } from './components/UserEmailModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { WeChatModal } from './components/WeChatModal';
import {
  getSavedVisitorEmail,
  getSavedVisitorName,
  saveVisitorInfo,
  hasUserDismissedEmailPrompt,
  markEmailPromptDismissed,
} from './utils/cookie';

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    sellerEmail: 'shiwokakanaka@gmail.com',
    storeName: '个人私物与存货出清集市',
    announcement: '因个人搬家与闲置整理，部分珍藏好物与多余存货好价出清！所有物品支持自由勾选，一键生成邮件直发店主或直接微信扫码发送清单。',
    currency: '¥',
    contactWeChat: '月月鸟 (美国)',
    contactWeChatName: '月月鸟',
    pickupLocation: '自提或在学校领取',
    allowCounterOffer: true,
  });

  const [isWeChatModalOpen, setIsWeChatModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('全部存货');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [mobileLayout, setMobileLayout] = useState<'double' | 'single'>('double');

  // Compute item counts for all categories
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      if (cat === '全部存货') {
        counts[cat] = items.length;
      } else {
        counts[cat] = items.filter((i) => i.category === cat).length;
      }
    });
    return counts;
  }, [items]);

  // Visitor User Email (Persistent 365 days without password via Cookie + localStorage)
  const [visitorEmail, setVisitorEmail] = useState<string>(() => {
    return getSavedVisitorEmail();
  });
  const [visitorName, setVisitorName] = useState<string>(() => {
    return getSavedVisitorName();
  });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Sync with server session cookie on mount
  useEffect(() => {
    fetch('/api/visitor/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.email && !visitorEmail) {
          setVisitorEmail(data.email);
          if (data.name) setVisitorName(data.name);
          saveVisitorInfo(data.email, data.name);
        }
      })
      .catch(() => {});
  }, []);

  // Cart / Want-to-Buy Selection with persistence
  const [cart, setCart] = useState<SelectedCartItem[]>(() => {
    try {
      const saved = localStorage.getItem('visitor_saved_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save cart whenever it changes so user doesn't lose checklist
  useEffect(() => {
    localStorage.setItem('visitor_saved_cart', JSON.stringify(cart));
  }, [cart]);

  // Prompt email modal on first arrival ONLY if no email is remembered AND not dismissed
  useEffect(() => {
    if (!visitorEmail && !hasUserDismissedEmailPrompt()) {
      const timer = setTimeout(() => {
        setIsEmailModalOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [visitorEmail]);

  // Detail Modal
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);

  // Admin View & Owner Authentication
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminAuthModal, setAdminAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  useEffect(() => {
    loadAllData();
    // Verify admin session validity with server
    const verifySession = async () => {
      if (api.hasAdminSession()) {
        const valid = await api.checkAdminSession();
        setIsAuthenticated(valid);
        if (valid) {
          const fetchedOrders = await api.getOrders().catch(() => []);
          setOrders(fetchedOrders);
        } else {
          api.adminLogout();
        }
      }
    };
    verifySession();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [fetchedItems, fetchedSettings] = await Promise.all([
        api.getItems(),
        api.getSettings(),
      ]);
      setItems(fetchedItems);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save visitor info using dual-layer Cookie + localStorage
  const handleSaveVisitorInfo = (email: string, name?: string) => {
    setVisitorEmail(email);
    if (name !== undefined) {
      setVisitorName(name);
    }
    // Save to Cookie (365 days) and localStorage
    saveVisitorInfo(email, name);

    // Sync with server session cookie
    fetch('/api/visitor/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    }).catch(() => {});

    showToast(`Cookie 已成功记住您的邮箱: ${email}`);
  };

  const handleDismissEmailPrompt = () => {
    markEmailPromptDismissed();
  };

  // Cart Handlers
  const handleToggleSelect = (item: InventoryItem) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) {
        showToast(`已从选购清单移除《${item.title}》`);
        return prev.filter((i) => i.id !== item.id);
      } else {
        showToast(`已勾选《${item.title}》`);
        return [...prev, { id: item.id, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter((item): item is SelectedCartItem => item !== null)
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Order submission
  const handleSubmitOrder = async (orderData: Partial<OrderItem>) => {
    try {
      const result = await api.createOrder({
        ...orderData,
        autoReserve: false,
      });

      if (result.success) {
        showToast('选购清单邮件已准备就绪！');
        // Refresh inventory to reflect updated stock immediately
        const updatedItems = await api.getItems();
        setItems(updatedItems);
        if (isAuthenticated) {
          const updatedOrders = await api.getOrders().catch(() => []);
          setOrders(updatedOrders);
        }
        return result.order;
      }
      return null;
    } catch (err: any) {
      showToast(err.message || '选购提交失败，请刷新重试');
      // Refresh items to display up-to-date availability
      const updatedItems = await api.getItems().catch(() => []);
      if (updatedItems.length > 0) setItems(updatedItems);
      return null;
    }
  };

  // Admin Item Operations
  const handleSaveNewItem = async (itemData: Partial<InventoryItem>) => {
    try {
      await api.createItem(itemData);
      const allItems = await api.getItems();
      setItems(allItems);
      showToast('新商品帖子发布成功并已永久保存！');
    } catch (err: any) {
      showToast(err.message || '发布失败');
      if (err.message?.includes('权限') || err.message?.includes('登录')) {
        setIsAuthenticated(false);
        setAdminAuthModal(true);
      }
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      await api.updateItem(id, updates);
      const allItems = await api.getItems();
      setItems(allItems);
      showToast('商品信息更新成功并已同步保存');
    } catch (err: any) {
      showToast(err.message || '更新失败');
      if (err.message?.includes('权限') || err.message?.includes('登录')) {
        setIsAuthenticated(false);
        setAdminAuthModal(true);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await api.deleteItem(id);
      const allItems = await api.getItems();
      setItems(allItems);
      setCart((prev) => prev.filter((item) => item.id !== id));
      showToast('商品已从集市下架删除');
    } catch (err: any) {
      showToast(err.message || '删除失败');
      if (err.message?.includes('权限') || err.message?.includes('登录')) {
        setIsAuthenticated(false);
        setAdminAuthModal(true);
      }
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderItem['status']) => {
    try {
      const updated = await api.updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      showToast('订单处理状态已更新');
    } catch (err: any) {
      showToast(err.message || '更新订单失败');
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
      showToast('店铺基本设置已永久保存生效');
    } catch (err: any) {
      showToast(err.message || '保存设置失败');
      if (err.message?.includes('权限') || err.message?.includes('登录')) {
        setIsAuthenticated(false);
        setAdminAuthModal(true);
      }
    }
  };

  const handleResetData = async () => {
    await api.resetData();
    await loadAllData();
    showToast('已清空并恢复默认状态');
  };

  // Admin Portal Toggle & Owner Auth
  const handleToggleAdmin = () => {
    if (isAdminView) {
      setIsAdminView(false);
    } else {
      if (isAuthenticated) {
        setIsAdminView(true);
      } else {
        setAdminAuthModal(true);
      }
    }
  };

  const handleAdminAuthSuccess = async () => {
    setIsAuthenticated(true);
    setIsAdminView(true);
    try {
      const fetchedOrders = await api.getOrders();
      setOrders(fetchedOrders);
    } catch {}
    showToast('店主管理身份验证成功，已进入后台');
  };

  const handleAdminLogout = async () => {
    await api.adminLogout();
    setIsAuthenticated(false);
    setIsAdminView(false);
    showToast('已安全退出店主后台');
  };

  const handleUpdateWeChatQr = async (url: string) => {
    try {
      const updated = await api.updateSettings({ contactWeChatQr: url });
      setSettings(updated);
      showToast('店主微信名片二维码已更新保存');
    } catch (err: any) {
      showToast(err.message || '更新微信二维码失败');
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === '全部存货' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesAvailability = onlyAvailable ? item.status === 'available' : true;

    return matchesCategory && matchesSearch && matchesAvailability;
  });

  const cartTotal = cart.reduce((sum, cartItem) => {
    const item = items.find((i) => i.id === cartItem.id);
    return sum + (item ? item.price * cartItem.quantity : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#18181B] flex flex-col font-sans">
      {/* 3-Zone Top Navigation Bar */}
      <TopBar
        storeName={settings.storeName}
        cartCount={cart.length}
        cartTotal={cartTotal}
        currency={settings.currency}
        isAdmin={isAdminView}
        isAuthenticated={isAuthenticated}
        visitorEmail={visitorEmail}
        selectedCategory={selectedCategory}
        categories={CATEGORIES}
        categoryCounts={categoryCounts}
        totalItemsCount={items.length}
        onOpenEmailModal={() => setIsEmailModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWeChatModal={() => setIsWeChatModalOpen(true)}
        onToggleAdmin={handleToggleAdmin}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setIsAdminView(false);
        }}
        onScrollToRules={() => {
          setIsAdminView(false);
          document.getElementById('shopping-rules')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {isAdminView && isAuthenticated ? (
          /* Admin Management Mode */
          <AdminPortal
            items={items}
            orders={orders}
            settings={settings}
            currency={settings.currency}
            onSaveItem={handleSaveNewItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onUpdateSettings={handleUpdateSettings}
            onResetData={handleResetData}
            onCloseAdmin={() => setIsAdminView(false)}
            onLogoutAdmin={handleAdminLogout}
          />
        ) : (
          /* Buyer Storefront Mode */
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
            {/* Storefront Hero & Announcement */}
            <section className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-6 md:p-8 shadow-xs">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 mb-2">
                  <span>01. 私物出清 · 存货优选</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700">可多选打包推送</span>
                  <span aria-hidden="true">·</span>
                  <span>自提或在学校领取</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 leading-tight">
                  {settings.storeName}
                </h1>

                <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {settings.announcement}
                </p>

                {/* 3-Step Buyer Guide: Ultra-compact single row on mobile, full grid on desktop */}
                {/* Mobile Compact 3-Step Bar (<640px) */}
                <div className="sm:hidden mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] bg-stone-50/90 px-3 py-2 rounded-xl border border-stone-200/70">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                    <span className="font-semibold text-stone-800 truncate">勾选心仪</span>
                  </div>
                  <span className="text-stone-300 font-bold">→</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                    <span className="font-semibold text-stone-800 truncate">微信/Gmail</span>
                  </div>
                  <span className="text-stone-300 font-bold">→</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                    <span className="font-semibold text-stone-800 truncate">学校/自提</span>
                  </div>
                </div>

                {/* Desktop 3-Step Guide (>=640px) */}
                <div className="hidden sm:grid sm:grid-cols-3 gap-4 text-xs mt-6 pt-5 border-t border-stone-100">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <span className="font-semibold text-stone-800 block">心仪勾选</span>
                      <span className="text-stone-500">点击卡片【我想买】挑选心仪物品，系统自动为您保存。</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <span className="font-semibold text-stone-800 block">发送邮件/微信</span>
                      <span className="text-stone-500">一键在新标签页打开网页版 Gmail 发送，或直接微信发给店主。</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <span className="font-semibold text-stone-800 block">学校或自提</span>
                      <span className="text-stone-500">店主查收后与您约定在学校或方便地点当面验货交接。</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter & Search Bar */}
            <div className="space-y-3">
              {/* Category Segmented Controls - Fluid horizontal pill track */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 p-1 bg-stone-200/50 rounded-2xl max-w-full scrollbar-none scroll-smooth">
                {CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat] ?? 0;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-xl whitespace-nowrap min-h-[38px] sm:min-h-0 flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'bg-white text-stone-900 shadow-xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                      }`}
                    >
                      <span className={isSelected ? 'text-amber-600' : 'text-stone-400'}>
                        {getCategoryIcon(cat)}
                      </span>
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full leading-tight transition-colors ${
                          isSelected
                            ? 'bg-amber-100 text-amber-900 font-bold'
                            : 'bg-stone-300/60 text-stone-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & In-stock toggle + Mobile Layout Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索商品名称、型号、描述、成色..."
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 sm:py-2 bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-stone-900 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
                    >
                      清空
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs w-full sm:w-auto">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-stone-600 hover:text-stone-900 py-1">
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(e) => setOnlyAvailable(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs">仅显示在售</span>
                  </label>

                  <div className="flex items-center gap-2.5">
                    <span className="text-stone-400 text-xs hidden xs:inline">
                      共 <span className="font-mono font-semibold text-stone-800">{filteredItems.length}</span> 件
                    </span>

                    {/* Mobile dual-column vs single-column toggle */}
                    <div className="flex sm:hidden items-center bg-stone-200/70 p-0.5 rounded-lg border border-stone-300/60">
                      <button
                        type="button"
                        onClick={() => setMobileLayout('double')}
                        className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                          mobileLayout === 'double'
                            ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                        title="双列展示"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileLayout('single')}
                        className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                          mobileLayout === 'single'
                            ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                        title="单列大卡片"
                      >
                        <Rows className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div
                className={`grid ${
                  mobileLayout === 'double' ? 'grid-cols-2' : 'grid-cols-1'
                } sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6`}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-xl sm:rounded-2xl border border-stone-200 p-3 sm:p-4 animate-pulse h-64 sm:h-80 flex flex-col justify-between"
                  >
                    <div className="bg-stone-200 aspect-4/3 rounded-lg w-full" />
                    <div className="space-y-2 mt-3">
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 sm:my-12 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3.5 border border-amber-200/70">
                  <Package className="w-7 h-7 stroke-[1.6]" />
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  当前集市暂无上架商品
                </h3>
                <p className="text-xs text-stone-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
                  演示商品已全部清空。店主可点击下方按钮登录后台发布真实好物，买家也可直接通过微信/邮箱提前预约咨询。
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleToggleAdmin}
                    className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    店主登录 · 发布第一件商品
                  </button>
                  <button
                    onClick={() => setIsWeChatModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    联系店主微信
                  </button>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center max-w-md mx-auto my-8 sm:my-12">
                <Package className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-stone-800">
                  没有找到符合条件的存货
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  尝试清除分类或更换搜索关键词。
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('全部存货');
                    setSearchQuery('');
                    setOnlyAvailable(false);
                  }}
                  className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors"
                >
                  重置筛选条件
                </button>
              </div>
            ) : (
              <div
                className={`grid ${
                  mobileLayout === 'double' ? 'grid-cols-2' : 'grid-cols-1'
                } sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6`}
              >
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    currency={settings.currency}
                    isSelected={cart.some((c) => c.id === item.id)}
                    onToggleSelect={handleToggleSelect}
                    onViewDetails={(it) => setDetailItem(it)}
                  />
                ))}
              </div>
            )}

            {/* Shopping & Transaction Rules Section */}
            <section
              id="shopping-rules"
              className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 mt-12"
            >
              <h2 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-stone-400" />
                <span>存货选购与交易说明</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600 leading-relaxed mt-4">
                <div className="p-4 bg-stone-50/70 rounded-xl border border-stone-100">
                  <h3 className="font-bold text-stone-800 mb-1.5">关于物品实况</h3>
                  <p>
                    所有存货均为本人正规渠道购入自用或工作室闲置，实物实拍无滤镜修饰。成色如实说明，发货前会再次拍摄视频/照片与买家确认外观及功能。
                  </p>
                </div>

                <div className="p-4 bg-stone-50/70 rounded-xl border border-stone-100">
                  <h3 className="font-bold text-stone-800 mb-1.5">关于邮件联系与沟通</h3>
                  <p>
                    在心仪的物品上点击【我想买】勾选后，点击发信即可在新标签页打开网页版 Gmail 直发店主，或复制清单微信联系。物品由店主在确认交易后手动在后台标记为已售。
                  </p>
                </div>

                <div className="p-4 bg-stone-50/70 rounded-xl border border-stone-100">
                  <h3 className="font-bold text-stone-800 mb-1.5">关于交付与交接</h3>
                  <p>
                    {settings.pickupLocation}。支持在校园内（如宿舍区、教学楼、图书馆）方便面交验货，或约定地点自提。多件打包购买支持合理小刀或赠送实用小配件。
                  </p>
                </div>
              </div>

              {/* WeChat Contact Info Strip */}
              <div className="mt-5 p-3.5 sm:p-4 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">店主微信联系方式已公开</h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      店主微信号：<strong>{settings.contactWeChatName || '月月鸟'}</strong> · 地区：<strong>美国</strong> · 支持扫码加好友发视频看货与自提沟通
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsWeChatModalOpen(true)}
                  className="w-full sm:w-auto justify-center px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>打开微信二维码名片</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Floating Bottom Bar for Buyer (when items selected) */}
      {!isAdminView && cart.length > 0 && !isCartOpen && (
        <aside
          aria-label="选购清单浮动提醒"
          className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[94%] sm:w-[90%] bg-stone-900 text-white rounded-2xl shadow-xl px-3.5 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-4 duration-200"
        >
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-stone-400 truncate">
              已选 <span className="font-semibold text-white">{cart.length}</span> 件商品
            </div>
            <div className="text-xs sm:text-sm font-bold font-mono tabular-nums text-amber-400 truncate">
              合计: {settings.currency}{cartTotal}
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="px-3 py-2 sm:px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors shrink-0 whitespace-nowrap cursor-pointer"
          >
            <span className="hidden sm:inline">查看并发送邮件给店主</span>
            <span className="sm:hidden">查看清单 / 发送</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={detailItem}
        currency={settings.currency}
        isSelected={detailItem ? cart.some((c) => c.id === detailItem.id) : false}
        sellerEmail={settings.sellerEmail}
        onClose={() => setDetailItem(null)}
        onToggleSelect={handleToggleSelect}
      />

      {/* Checkout & Push Drawer */}
      <CheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        selectedItems={cart}
        allItems={items}
        currency={settings.currency}
        sellerEmail={settings.sellerEmail}
        contactWeChat={settings.contactWeChat || '月月鸟 (美国)'}
        contactWeChatName={settings.contactWeChatName || '月月鸟'}
        contactWeChatQr={settings.contactWeChatQr}
        visitorEmail={visitorEmail}
        visitorName={visitorName}
        onSaveVisitorInfo={handleSaveVisitorInfo}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* WeChat QR Card Modal */}
      <WeChatModal
        isOpen={isWeChatModalOpen}
        onClose={() => setIsWeChatModalOpen(false)}
        customQrUrl={settings.contactWeChatQr || '/wechat_qr.jpg'}
      />

      {/* Visitor User Email Setup Modal */}
      <UserEmailModal
        isOpen={isEmailModalOpen}
        initialEmail={visitorEmail}
        initialName={visitorName}
        onClose={() => setIsEmailModalOpen(false)}
        onDismiss={handleDismissEmailPrompt}
        onSave={handleSaveVisitorInfo}
      />

      {/* Admin Owner Authentication Modal */}
      <AdminAuthModal
        isOpen={adminAuthModal}
        onClose={() => setAdminAuthModal(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-200 bg-white py-8 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">{settings.storeName}</span>
            <span>·</span>
            <span>个人存货出清系统</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <span>通知邮箱: {settings.sellerEmail}</span>
            <span>·</span>
            <button
              onClick={handleToggleAdmin}
              className="text-stone-500 hover:text-stone-900 underline underline-offset-2"
            >
              {isAdminView ? '返回前台' : '店主后台'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

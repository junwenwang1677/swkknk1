import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  ShieldCheck,
  Store,
  Mail,
  Lock,
  MessageCircle,
  Sparkles,
  Camera,
  Laptop,
  ShoppingBag,
  Coffee,
  Home,
  BookOpen,
  Tag,
  ChevronDown,
  Check,
  FileText,
  Layers
} from 'lucide-react';

interface TopBarProps {
  storeName: string;
  cartCount: number;
  cartTotal: number;
  currency: string;
  isAdmin: boolean;
  isAuthenticated?: boolean;
  visitorEmail?: string;
  selectedCategory?: string;
  categories?: string[];
  categoryCounts?: Record<string, number>;
  totalItemsCount?: number;
  onOpenEmailModal: () => void;
  onOpenCart: () => void;
  onOpenWeChatModal: () => void;
  onToggleAdmin: () => void;
  onSelectCategory: (cat: string) => void;
  onScrollToRules: () => void;
}

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case '全部存货':
      return <Sparkles className="w-3.5 h-3.5" />;
    case '数码摄影':
      return <Camera className="w-3.5 h-3.5" />;
    case '电脑外设':
      return <Laptop className="w-3.5 h-3.5" />;
    case '箱包服饰':
      return <ShoppingBag className="w-3.5 h-3.5" />;
    case '生活美学':
      return <Coffee className="w-3.5 h-3.5" />;
    case '家居好物':
      return <Home className="w-3.5 h-3.5" />;
    case '图书手办':
      return <BookOpen className="w-3.5 h-3.5" />;
    case '其他闲置':
    default:
      return <Tag className="w-3.5 h-3.5" />;
  }
};

const DEFAULT_CATEGORIES = [
  '全部存货',
  '数码摄影',
  '生活美学',
  '电脑外设',
  '箱包服饰',
  '家居好物',
  '图书手办',
  '其他闲置'
];

export const TopBar: React.FC<TopBarProps> = ({
  storeName,
  cartCount,
  cartTotal,
  currency,
  isAdmin,
  isAuthenticated = false,
  visitorEmail,
  selectedCategory = '全部存货',
  categories = DEFAULT_CATEGORIES,
  categoryCounts = {},
  totalItemsCount = 0,
  onOpenEmailModal,
  onOpenCart,
  onOpenWeChatModal,
  onToggleAdmin,
  onSelectCategory,
  onScrollToRules,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary visible categories in desktop nav
  const primaryCategories = categories.slice(0, 3);
  const moreCategories = categories.slice(3);
  const isSelectedInMore = moreCategories.includes(selectedCategory);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBFBF9]/95 backdrop-blur-md border-b border-stone-200/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 transition-all duration-300">
        {/* Left Side: Brand Wordmark + Category Navigation (Always aligned to the left) */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Brand Wordmark */}
          <button
            onClick={() => onSelectCategory('全部存货')}
            className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-stone-900 hover:text-stone-700 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer truncate max-w-[125px] sm:max-w-none"
          >
            {storeName || '存货出清集市'}
          </button>

          {/* Category Navigation (Desktop capsule tabs or responsive icon selector, pinned to left) */}
          {/* Desktop (>= xl: 1280px+): Sleek Horizontal Capsule Tabs */}
          <nav className="hidden xl:flex items-center p-1 bg-stone-200/50 rounded-xl border border-stone-200/60 shadow-2xs transition-all duration-300 ease-out shrink-0">
            {primaryCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const isAll = cat === '全部存货';
              const count = categoryCounts[cat] ?? (cat === '全部存货' ? totalItemsCount : 0);
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  title={isAll ? '全部存货' : cat}
                  className={`flex items-center gap-1.5 ${isAll ? 'px-2.5' : 'px-3'} py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  <span className={isSelected ? 'text-amber-600' : 'text-stone-400'}>
                    {getCategoryIcon(cat)}
                  </span>
                  {!isAll && <span>{cat}</span>}
                  {count > 0 && !isAll && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full leading-tight transition-colors ${
                        isSelected
                          ? 'bg-amber-100/80 text-amber-900 font-bold'
                          : 'bg-stone-300/60 text-stone-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More Categories Dropdown Menu */}
            {moreCategories.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isSelectedInMore || isMoreMenuOpen
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  {isSelectedInMore ? (
                    <>
                      <span className="text-amber-600">{getCategoryIcon(selectedCategory)}</span>
                      <span className="text-amber-900 font-semibold">{selectedCategory}</span>
                    </>
                  ) : (
                    <span>更多分类</span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                      isMoreMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-2 py-1">
                      选择分类
                    </div>
                    {moreCategories.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      const count = categoryCounts[cat] ?? 0;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            onSelectCategory(cat);
                            setIsMoreMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50 text-amber-950 font-semibold'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={isSelected ? 'text-amber-600' : 'text-stone-400'}>
                              {getCategoryIcon(cat)}
                            </span>
                            <span>{cat}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {count > 0 && (
                              <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                {count}
                              </span>
                            )}
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Quick Rules Link */}
            <button
              onClick={onScrollToRules}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors whitespace-nowrap ml-0.5 rounded-lg hover:bg-white/60 cursor-pointer"
              title="查看选购与联系说明"
            >
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden lg:inline">选购说明</span>
            </button>
          </nav>

          {/* Compact Category Selector (< xl: tablet, laptop, or resized window) */}
          <div className="xl:hidden relative shrink-0" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200/80 active:scale-95 text-stone-800 rounded-xl text-xs font-medium transition-all duration-200 border border-stone-200/90 shadow-2xs cursor-pointer"
              title={selectedCategory === '全部存货' ? '切换分类' : `当前分类: ${selectedCategory} · 点击切换`}
            >
              <span className="text-amber-600">{getCategoryIcon(selectedCategory)}</span>
              {selectedCategory !== '全部存货' && (
                <span className="font-semibold text-stone-900 truncate max-w-[70px] xs:max-w-[95px] sm:max-w-[120px]">
                  {selectedCategory}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${
                  isMobileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu for Resized & Narrow Screens */}
            {isMobileMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-stone-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                  <span>快速切换分类</span>
                  <Layers className="w-3 h-3 text-stone-400" />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5 scrollbar-none">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const count = categoryCounts[cat] ?? (cat === '全部存货' ? totalItemsCount : 0);
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          onSelectCategory(cat);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 text-amber-950 font-semibold'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={isSelected ? 'text-amber-600' : 'text-stone-400'}>
                            {getCategoryIcon(cat)}
                          </span>
                          <span>{cat}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {count > 0 && (
                            <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                              {count}
                            </span>
                          )}
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-1 pt-1 border-t border-stone-100">
                  <button
                    onClick={() => {
                      onScrollToRules();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <span>查看选购与联系说明</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone 3: Primary Actions (Always shrink-0 to prevent collision) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 transition-all duration-300">
          {/* Visitor Email Button */}
          {!isAdmin && (
            <button
              type="button"
              onClick={onOpenEmailModal}
              className={`group flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium rounded-xl transition-all duration-300 ease-out whitespace-nowrap cursor-pointer border shadow-2xs ${
                visitorEmail
                  ? 'bg-stone-100/90 hover:bg-stone-200/80 text-stone-800 border-stone-200/90'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
              title={visitorEmail ? `买家邮箱: ${visitorEmail} (点击修改)` : '买家邮箱快捷登录 / 登记'}
            >
              {visitorEmail ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 shadow-xs ring-1 ring-emerald-300/60" />
                  <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="inline-block overflow-hidden whitespace-nowrap font-mono transition-all duration-300 ease-out max-w-0 opacity-0 sm:max-w-[110px] sm:opacity-100 sm:ml-1.5">
                    {visitorEmail}
                  </span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                  <span className="inline-block overflow-hidden whitespace-nowrap transition-all duration-300 ease-out max-w-0 opacity-0 sm:max-w-[65px] sm:opacity-100 sm:ml-1.5">
                    邮箱登录
                  </span>
                </>
              )}
            </button>
          )}

          {/* WeChat Contact button */}
          <button
            type="button"
            onClick={onOpenWeChatModal}
            className="group flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl transition-all duration-300 ease-out whitespace-nowrap bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 cursor-pointer shadow-2xs"
            title="查看店主微信名片二维码 (月月鸟)"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="inline-block overflow-hidden whitespace-nowrap transition-all duration-300 ease-out max-w-0 opacity-0 sm:max-w-[60px] sm:opacity-100 sm:ml-1.5">
              店主微信
            </span>
          </button>

          {/* Cart / Want to buy checklist button */}
          <button
            onClick={onOpenCart}
            className={`relative group flex items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold rounded-xl transition-all duration-300 ease-out whitespace-nowrap cursor-pointer ${
              cartCount > 0
                ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-700 active:scale-95'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-transparent'
            }`}
            title={`心仪清单 (${cartCount}件)`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="inline-block overflow-hidden whitespace-nowrap transition-all duration-300 ease-out max-w-0 opacity-0 sm:max-w-[60px] sm:opacity-100 sm:ml-1.5">
              心仪清单
            </span>
            {cartCount > 0 && (
              <span className="font-mono tabular-nums bg-amber-700/80 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] leading-tight ml-1 shrink-0">
                {cartCount}
              </span>
            )}
          </button>

          {/* Admin toggle button */}
          <button
            onClick={onToggleAdmin}
            className={`relative group flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium rounded-xl transition-all duration-300 ease-out whitespace-nowrap border cursor-pointer ${
              isAdmin
                ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                : isAuthenticated
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-stone-600 border-stone-200 hover:text-stone-900 hover:border-stone-300'
            }`}
            title={
              isAdmin
                ? '返回买家集市'
                : isAuthenticated
                ? '已登录店主身份，点击进入管理后台'
                : '后台发布管理 (需输入账号与管理密码)'
            }
          >
            {isAdmin ? (
              <>
                <Store className="w-4 h-4 shrink-0" />
                <span className="inline-block overflow-hidden whitespace-nowrap transition-all duration-300 ease-out max-w-0 opacity-0 sm:max-w-[85px] sm:opacity-100 sm:ml-1.5">
                  返回集市
                </span>
              </>
            ) : (
              <>
                {isAuthenticated ? (
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-stone-400 shrink-0" />
                )}
                <span className="inline-block overflow-hidden whitespace-nowrap transition-all duration-300 ease-out max-w-0 opacity-0 sm:max-w-[60px] sm:opacity-100 sm:ml-1.5">
                  店主后台
                </span>
                {isAuthenticated && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ml-0.5" title="已登录" />
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

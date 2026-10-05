import React from 'react';
import { ShoppingCart, ShieldCheck, Store, Mail, Lock, MessageCircle } from 'lucide-react';

interface TopBarProps {
  storeName: string;
  cartCount: number;
  cartTotal: number;
  currency: string;
  isAdmin: boolean;
  isAuthenticated?: boolean;
  visitorEmail?: string;
  onOpenEmailModal: () => void;
  onOpenCart: () => void;
  onOpenWeChatModal: () => void;
  onToggleAdmin: () => void;
  onSelectCategory: (cat: string) => void;
  onScrollToRules: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  storeName,
  cartCount,
  cartTotal,
  currency,
  isAdmin,
  isAuthenticated = false,
  visitorEmail,
  onOpenEmailModal,
  onOpenCart,
  onOpenWeChatModal,
  onToggleAdmin,
  onSelectCategory,
  onScrollToRules,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBFBF9]/95 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectCategory('全部存货')}
          className="text-base sm:text-lg font-bold tracking-tight text-stone-900 hover:text-stone-700 transition-colors whitespace-nowrap shrink-0 text-left truncate max-w-[110px] xs:max-w-[140px] sm:max-w-none"
        >
          {storeName || '存货出清集市'}
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
          <button
            onClick={() => onSelectCategory('全部存货')}
            className="hover:text-stone-900 transition-colors hover:underline underline-offset-4"
          >
            全部存货
          </button>
          <button
            onClick={() => onSelectCategory('数码摄影')}
            className="hover:text-stone-900 transition-colors hover:underline underline-offset-4"
          >
            数码摄影
          </button>
          <button
            onClick={() => onSelectCategory('生活美学')}
            className="hover:text-stone-900 transition-colors hover:underline underline-offset-4"
          >
            生活美学
          </button>
          <button
            onClick={onScrollToRules}
            className="hover:text-stone-900 transition-colors hover:underline underline-offset-4"
          >
            选购与联系说明
          </button>
        </nav>

        {/* Zone 3: Primary actions + Visitor Email badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Visitor Email Indicator */}
          {!isAdmin && visitorEmail ? (
            <button
              type="button"
              onClick={onOpenEmailModal}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors font-mono cursor-pointer"
              title="已保存买家联系邮箱，点击可修改"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <Mail className="w-3.5 h-3.5 text-stone-500" />
              <span className="truncate max-w-[130px]">{visitorEmail}</span>
            </button>
          ) : null}

          {/* WeChat Contact button */}
          <button
            type="button"
            onClick={onOpenWeChatModal}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 cursor-pointer shadow-2xs"
            title="查看店主微信名片二维码 (月月鸟)"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">店主微信</span>
          </button>

          {/* Cart / Want to buy checklist button */}
          <button
            onClick={onOpenCart}
            className={`relative flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
              cartCount > 0
                ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-700 active:scale-95'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline">心仪清单</span>
            {cartCount > 0 && (
              <span className="font-mono tabular-nums bg-amber-700/60 px-1.5 py-0.5 rounded text-[10px] sm:text-[11px]">
                {cartCount}件
              </span>
            )}
          </button>

          {/* Admin toggle button */}
          <button
            onClick={onToggleAdmin}
            className={`relative flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border cursor-pointer ${
              isAdmin
                ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                : isAuthenticated
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-stone-600 border-stone-200 hover:text-stone-900 hover:border-stone-300'
            }`}
            title={isAuthenticated ? "店主已认证，点击管理后台" : "后台发布管理 (需输入账号与管理密码)"}
          >
            {isAdmin ? (
              <>
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">返回买家集市</span>
                <span className="sm:hidden">返回</span>
              </>
            ) : (
              <>
                {isAuthenticated ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                )}
                <span className="hidden sm:inline">店主后台</span>
                <span className="sm:hidden">后台</span>
                {isAuthenticated && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="已登录" />
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

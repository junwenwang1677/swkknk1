import React from 'react';
import { X, Check } from 'lucide-react';
import { WeChatQrCard } from './WeChatQrCard';

interface WeChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  customQrUrl?: string;
  copyNotice?: boolean;
}

export const WeChatModal: React.FC<WeChatModalProps> = ({
  isOpen,
  onClose,
  customQrUrl,
  copyNotice = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[320px] sm:max-w-[340px] max-h-[92dvh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 border border-stone-200 animate-in zoom-in-95 duration-150 flex flex-col items-center cursor-default overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors z-10"
          title="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Copy Notice Banner if triggered from checkout */}
        {copyNotice && (
          <div className="w-full mb-3 pr-7 pl-1">
            <div className="flex items-center gap-1.5 p-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="leading-tight">清单已复制！扫码添加店主直接粘贴</span>
            </div>
          </div>
        )}

        {/* Pure image display */}
        <WeChatQrCard customQrUrl={customQrUrl} />
      </div>
    </div>
  );
};

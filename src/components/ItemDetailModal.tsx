import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, Mail, MapPin, Tag, ExternalLink, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { InventoryItem } from '../types';
import { ItemImage } from './ItemImage';

interface ItemDetailModalProps {
  item: InventoryItem | null;
  currency: string;
  isSelected: boolean;
  sellerEmail: string;
  onClose: () => void;
  onToggleSelect: (item: InventoryItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  currency,
  isSelected,
  sellerEmail,
  onClose,
  onToggleSelect,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [item?.id]);

  if (!item) return null;

  // Compile full image list, ensuring cover is first
  const allImages: string[] = (
    item.images && item.images.length > 0
      ? item.images
      : item.imageUrl ? [item.imageUrl] : []
  ).filter(Boolean);

  const currentDisplayImage = allImages[activeIdx] || item.imageUrl;

  const isAvailable = item.status === 'available' && item.stock > 0;
  const discountPercent = item.originalPrice && item.originalPrice > item.price
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : 0;

  // Direct quick mailto for single item inquiry
  const directMailSubject = encodeURIComponent(`【存货咨询】关于《${item.title}》的咨询与认购意向`);
  const directMailBody = encodeURIComponent(
    `店主您好：\n\n我在您的存货集市看到了这件商品，希望了解并认购：\n` +
    `商品名称：${item.title}\n` +
    `标价：${currency}${item.price}\n` +
    `成色：${item.condition}\n` +
    `交付意向：自提或在学校面交\n\n` +
    `我的称呼与联系方式：\n` +
    `我的留言/问题：\n`
  );
  const directGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(sellerEmail)}&su=${directMailSubject}&body=${directMailBody}`;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900/80 text-white transition-colors cursor-pointer shadow-sm"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto">
          {/* Multi-Photo Gallery Column */}
          <div className="bg-stone-950/95 flex flex-col justify-between select-none relative min-h-[300px] md:min-h-[460px]">
            {/* Main Stage View */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-[260px] md:min-h-[360px] p-2 bg-stone-900/50">
              <ItemImage
                src={currentDisplayImage}
                alt={`${item.title} - 实拍图 ${activeIdx + 1}`}
                category={item.category}
                aspectRatio="1/1"
                className="w-full h-full object-contain max-h-[360px] md:max-h-[420px]"
              />

              {/* Prev / Next Arrows if multiple photos */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs shadow-md"
                    title="上一张图片"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs shadow-md"
                    title="下一张图片"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Index & Cover Badge */}
              <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-white/90 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  <span>{activeIdx + 1} / {allImages.length}</span>
                </span>
                {activeIdx === 0 && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.5 rounded">
                    封面图
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Navigation Strip */}
            {allImages.length > 1 && (
              <div className="p-3 bg-stone-900 border-t border-stone-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 transition-all cursor-pointer border ${
                      activeIdx === idx
                        ? 'border-amber-500 ring-2 ring-amber-500/60 scale-102 opacity-100'
                        : 'border-stone-700 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`缩略图 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-amber-600/90 text-[8px] text-white font-bold text-center py-0.5 leading-none">
                        封面
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="p-5 sm:p-7 flex flex-col justify-between bg-white overflow-y-auto">
            <div>
              {/* Category & Condition */}
              <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                <span className="font-semibold text-stone-700">{item.category}</span>
                <span aria-hidden="true">·</span>
                <span>{item.condition}</span>
                {item.stock > 1 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>库存: {item.stock}件</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                {item.title}
              </h2>

              {/* Price row */}
              <div className="mt-3 flex items-baseline gap-2.5 flex-wrap">
                <span className="text-2xl font-bold font-mono tabular-nums text-stone-900">
                  {currency}{item.price}
                </span>
                {item.originalPrice && item.originalPrice > item.price && (
                  <>
                    <span className="text-sm text-stone-400 line-through font-mono tabular-nums">
                      {currency}{item.originalPrice}
                    </span>
                    <span className="text-xs text-amber-700 font-medium">
                      立省 {currency}{item.originalPrice - item.price} (约{discountPercent}% OFF)
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="mt-4 pt-4 border-t border-stone-100">
                <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                  物品实况与说明
                </h4>
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                  {item.description || '暂无详细描述，如有疑问可直接发信或勾选后提交询问。'}
                </p>
              </div>

              {/* Logistics & Location */}
              {item.location && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>交接方式：{item.location}</span>
                </div>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                  <Tag className="w-3.5 h-3.5 text-stone-400 shrink-0 mr-1" />
                  {item.tags.map((t, idx) => (
                    <span key={idx} className="text-xs text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Bottom Bar */}
            <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col gap-2">
              {isAvailable ? (
                <>
                  <button
                    onClick={() => {
                      onToggleSelect(item);
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-sm hover:bg-amber-700'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        <span>已在勾选清单中 (点击取消)</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        <span>勾选心仪 · 加入清单</span>
                      </>
                    )}
                  </button>

                  <a
                    href={directGmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-amber-700" />
                    <span>在网页版 Gmail 中单独咨询店主</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </>
              ) : (
                <div className="text-center py-2 text-stone-400 text-sm font-medium bg-stone-50 rounded-xl">
                  {item.status === 'sold' ? '此物品已被其他买家认购售出' : '此物品已被买家预订锁定中'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

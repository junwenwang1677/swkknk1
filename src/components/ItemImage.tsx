import React, { useState } from 'react';
import { Package, Camera, Keyboard, ShoppingBag, Coffee, Headphones, BookOpen, Layers } from 'lucide-react';

interface ItemImageProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
  aspectRatio?: '4/3' | '1/1' | '16/9';
}

function getCategoryIcon(category?: string) {
  switch (category) {
    case '数码摄影':
      return Camera;
    case '电脑外设':
      return Keyboard;
    case '箱包服饰':
      return ShoppingBag;
    case '生活美学':
      return Coffee;
    case '家居好物':
      return Layers;
    case '图书手办':
      return BookOpen;
    default:
      return Package;
  }
}

export const ItemImage: React.FC<ItemImageProps> = ({
  src,
  alt,
  category,
  className = '',
  aspectRatio = '4/3',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const IconComponent = getCategoryIcon(category);

  // If no source or image error, render high-aesthetic CSS fallback
  if (!src || hasError) {
    return (
      <div
        className={`relative w-full overflow-hidden bg-stone-100 flex flex-col items-center justify-center text-stone-400 p-4 select-none ${className}`}
        style={{ aspectRatio }}
      >
        <div className="w-12 h-12 rounded-full bg-stone-200/80 flex items-center justify-center text-stone-500 mb-2">
          <IconComponent className="w-6 h-6 stroke-[1.5]" />
        </div>
        <span className="text-xs font-medium text-stone-500 text-center max-w-[85%] line-clamp-1">
          {alt || category || '商品实拍'}
        </span>
        <span className="text-[11px] text-stone-400 mt-0.5">
          {category || '存货优选'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-stone-100 ${className}`}
      style={{ aspectRatio }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-100 animate-pulse flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-stone-300" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-all duration-300 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      />
    </div>
  );
};

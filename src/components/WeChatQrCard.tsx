import React from 'react';

interface WeChatQrCardProps {
  customQrUrl?: string;
}

export const WeChatQrCard: React.FC<WeChatQrCardProps> = ({
  customQrUrl,
}) => {
  const imageSrc = customQrUrl || '/wechat_qr.jpg';

  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-[300px] sm:max-w-[320px] bg-white rounded-2xl overflow-hidden border border-stone-100 p-1">
        <img
          src={imageSrc}
          alt="店主微信名片二维码"
          className="w-full max-h-[68dvh] sm:max-h-[75dvh] object-contain rounded-xl block mx-auto shadow-2xs"
        />
      </div>
    </div>
  );
};

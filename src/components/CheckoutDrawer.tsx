import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Mail,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import { InventoryItem, SelectedCartItem, OrderItem } from '../types';
import { ItemImage } from './ItemImage';
import { WeChatModal } from './WeChatModal';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: SelectedCartItem[];
  allItems: InventoryItem[];
  currency: string;
  sellerEmail: string;
  contactWeChat?: string;
  contactWeChatName?: string;
  contactWeChatQr?: string;
  visitorEmail?: string;
  visitorName?: string;
  onSaveVisitorInfo?: (email: string, name?: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onSubmitOrder: (orderData: Partial<OrderItem>) => Promise<OrderItem | null>;
}

export const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({
  isOpen,
  onClose,
  selectedItems,
  allItems,
  currency,
  sellerEmail,
  contactWeChat = '月月鸟 (美国)',
  contactWeChatName = '月月鸟',
  contactWeChatQr,
  visitorEmail = '',
  visitorName = '',
  onSaveVisitorInfo,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitOrder,
}) => {
  const [buyerName, setBuyerName] = useState(visitorName);
  const [buyerEmail, setBuyerEmail] = useState(visitorEmail);
  const [buyerContact, setBuyerContact] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('在学校领取');
  const [shippingAddress, setShippingAddress] = useState('');
  const [buyerNote, setBuyerNote] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isWeChatModalOpen, setIsWeChatModalOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<OrderItem | null>(null);

  const handleWeChatSend = () => {
    handleCopyText();
    setIsWeChatModalOpen(true);
  };

  // Persistent record of which item IDs have been sent
  const [sentItemIds, setSentItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('visitor_sent_item_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync if visitor info changes
  useEffect(() => {
    if (visitorEmail && !buyerEmail) {
      setBuyerEmail(visitorEmail);
    }
    if (visitorName && !buyerName) {
      setBuyerName(visitorName);
    }
  }, [visitorEmail, visitorName]);

  // Clean exit: always reset submittedOrder so the drawer never gets stuck
  const handleExitDrawer = () => {
    setSubmittedOrder(null);
    onClose();
  };

  if (!isOpen) return null;

  // Resolve items
  const resolvedItems = selectedItems
    .map((selected) => {
      const found = allItems.find((item) => item.id === selected.id);
      return found ? { ...found, quantity: selected.quantity } : null;
    })
    .filter((item): item is InventoryItem & { quantity: number } => item !== null);

  const totalAmount = resolvedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Check if all items in cart are already marked as sent
  const allItemsSent = resolvedItems.length > 0 && resolvedItems.every((it) => sentItemIds.includes(it.id));

  // Generate plain-text order summary for Email and Clipboard
  const generateOrderSummaryText = (orderId?: string) => {
    const lines = [
      `【存货认购清单】来自买家: ${buyerName || '买家'}`,
      `========================================`,
      `提交时间：${new Date().toLocaleString('zh-CN')}`,
      `买家称呼：${buyerName || '未填写'}`,
      `买家邮箱：${buyerEmail || visitorEmail || '未填写'}`,
      `电话/微信：${buyerContact || '未填写'}`,
      `交付意向：${deliveryMethod}`,
      shippingAddress ? `学校位置/自提说明：${shippingAddress}` : '',
      buyerNote ? `留言/咨询问题：${buyerNote}` : '',
      `========================================`,
      `【选购物品明细】共 ${resolvedItems.length} 项：`,
      ...resolvedItems.map(
        (it, idx) =>
          `${idx + 1}. ${it.title}\n   成色: ${it.condition} | 价格: ${currency}${it.price} | 数量: ${it.quantity}件`
      ),
      `========================================`,
      `合计总金额：${currency}${totalAmount}`,
      `========================================`,
      `（请店主查收邮件后与我联系确认面交/自提事宜，谢谢！）`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const currentEmail = buyerEmail.trim() || visitorEmail.trim();
  const emailSubject = `[存货认购意向] ${buyerName || '买家'} 选购 ${resolvedItems.length} 件物品 (总额 ${currency}${totalAmount})`;
  const emailBodyText = generateOrderSummaryText(submittedOrder?.id);

  // Direct Web Gmail compose URL (always works directly in new tab via native link)
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(sellerEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyText)}`;

  const markCurrentItemsAsSent = () => {
    const updatedSentIds = Array.from(new Set([...sentItemIds, ...resolvedItems.map((i) => i.id)]));
    setSentItemIds(updatedSentIds);
    localStorage.setItem('visitor_sent_item_ids', JSON.stringify(updatedSentIds));
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(emailBodyText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);

    // Save visitor info if provided
    if (currentEmail && onSaveVisitorInfo) {
      onSaveVisitorInfo(currentEmail, buyerName);
    }
    markCurrentItemsAsSent();
  };

  const handleGmailClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buyerName.trim()) {
      e.preventDefault();
      alert('请填写您的称呼或姓名，方便店主与您核对');
      return;
    }
    if (!currentEmail && !buyerContact.trim()) {
      e.preventDefault();
      alert('请填写您的邮箱或微信/电话，方便店主回复确认');
      return;
    }

    // Save email into persistence for future visits
    if (currentEmail && onSaveVisitorInfo) {
      onSaveVisitorInfo(currentEmail, buyerName);
    }

    // Mark current items as sent
    markCurrentItemsAsSent();

    // Submit order payload asynchronously
    onSubmitOrder({
      buyerName: buyerName.trim(),
      buyerEmail: currentEmail,
      buyerContact: buyerContact.trim(),
      deliveryMethod,
      shippingAddress: shippingAddress.trim(),
      note: buyerNote.trim(),
      items: resolvedItems.map((it) => ({
        id: it.id,
        title: it.title,
        price: it.price,
        quantity: it.quantity,
        imageUrl: it.imageUrl,
        condition: it.condition,
      })),
      totalAmount,
      sellerEmail,
    }).then((res) => {
      if (res) setSubmittedOrder(res);
    });

    // Native anchor tag opens Gmail in a new tab without being blocked!
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-stone-900/50 backdrop-blur-xs flex justify-end"
      onClick={(e) => {
        // If clicking the dark backdrop outside drawer, exit cleanly
        if (e.target === e.currentTarget) {
          handleExitDrawer();
        }
      }}
    >
      <div className="w-full max-w-lg bg-white h-[100dvh] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900">
              {submittedOrder ? '订购邮件已准备就绪' : '选购心仪清单'}
            </h2>
            <span className="text-xs text-stone-400">
              ({resolvedItems.length}件商品)
            </span>
          </div>
          <button
            onClick={handleExitDrawer}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="关闭清单"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {submittedOrder ? (
          /* Confirmation State */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-2xs">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                订购清单已生成并弹出 Gmail！
              </h3>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                选购的物品已在您的心仪清单中标记为<strong className="text-emerald-700">「已发送」</strong>。如需再次发送或调整数量，可随时返回清单重新发送。
              </p>

              {/* Order Info Summary */}
              <div className="mt-5 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">买家称呼:</span>
                  <span className="text-stone-900 font-medium">{submittedOrder.buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">联系方式:</span>
                  <span className="text-stone-900">{submittedOrder.buyerContact || submittedOrder.buyerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">交付方式:</span>
                  <span className="text-stone-900">{submittedOrder.deliveryMethod} {submittedOrder.shippingAddress && `(${submittedOrder.shippingAddress})`}</span>
                </div>
                <div className="flex justify-between font-semibold pt-1 border-t border-stone-200">
                  <span className="text-stone-700">总计金额:</span>
                  <span className="font-mono text-amber-700">{currency}{submittedOrder.totalAmount}</span>
                </div>
              </div>

              {/* Action Buttons for Buyer Email & WeChat */}
              <div className="mt-6 space-y-2.5">
                {/* Option 1: Re-open Gmail */}
                <a
                  href={gmailWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>在网页版 Gmail 中再次打开（新标签页）</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                {/* Option 2: Send via WeChat */}
                <button
                  type="button"
                  onClick={handleWeChatSend}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>微信发送 (复制清单并展示店主二维码)</span>
                </button>

                {/* Option 3: Return to Cart directly */}
                <button
                  type="button"
                  onClick={() => setSubmittedOrder(null)}
                  className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>返回查看清单明细 (已标注已发送)</span>
                </button>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-4">
              <button
                onClick={handleExitDrawer}
                className="w-full py-2 text-xs text-stone-500 hover:text-stone-800 transition-colors"
              >
                退出此界面并继续逛集市
              </button>
            </div>
          </div>
        ) : (
          /* Shopping & Inquiry Form */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {resolvedItems.length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <p className="text-sm font-medium">清单暂无选购物品</p>
                <p className="text-xs text-stone-400 mt-1">在集市中点击【我想买】勾选心仪的存货</p>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                    <span>已勾选商品明细</span>
                    <button
                      onClick={onClearCart}
                      className="text-stone-400 hover:text-red-600 transition-colors"
                    >
                      清空全部
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {resolvedItems.map((item) => {
                      const isItemSent = sentItemIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-100 bg-stone-50/50"
                        >
                          <div className="w-12 h-12 rounded overflow-hidden shrink-0">
                            <ItemImage
                              src={item.imageUrl}
                              alt={item.title}
                              category={item.category}
                              aspectRatio="1/1"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-semibold text-stone-900 truncate max-w-[170px]">
                                {item.title}
                              </h4>
                              {isItemSent && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200/80 inline-flex items-center gap-0.5 shrink-0">
                                  <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                  已发送
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                              <span>{item.condition}</span>
                              <span>·</span>
                              <span className="font-mono tabular-nums text-stone-900 font-medium">
                                {currency}{item.price}
                              </span>
                            </div>
                          </div>

                          {/* Quantity and Remove */}
                          <div className="flex items-center gap-2">
                            {item.stock > 1 && (
                              <div className="flex items-center border border-stone-200 rounded text-xs bg-white">
                                <button
                                  onClick={() => onUpdateQuantity(item.id, -1)}
                                  className="px-1.5 py-0.5 hover:bg-stone-100"
                                >
                                  -
                                </button>
                                <span className="px-2 font-mono">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(item.id, 1)}
                                  className="px-1.5 py-0.5 hover:bg-stone-100"
                                >
                                  +
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                              title="移除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Subtotal */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-sm font-semibold text-stone-900">
                    <span>意向总金额</span>
                    <span className="text-lg font-mono tabular-nums text-amber-700">
                      {currency}{totalAmount}
                    </span>
                  </div>
                </div>

                {/* Buyer Information Form */}
                <div className="pt-2 border-t border-stone-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      买家联系与交付意向
                    </h3>
                    {visitorEmail && (
                      <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>已关联进站邮箱</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        您的称呼 / 姓名 <span className="text-amber-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="例如：张同学 / 李学长"
                        className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-stone-700">
                            电子邮箱 <span className="text-amber-600">*</span>
                          </label>
                          {visitorEmail && buyerEmail === visitorEmail && (
                            <span className="text-[10px] text-stone-400">已免填</span>
                          )}
                        </div>
                        <input
                          type="email"
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="例如: your_email@gmail.com"
                          className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          手机号码 / 微信
                        </label>
                        <input
                          type="text"
                          value={buyerContact}
                          onChange={(e) => setBuyerContact(e.target.value)}
                          placeholder="便于即时联系"
                          className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900"
                        />
                      </div>
                    </div>

                    {/* Delivery Method Selector */}
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        期望交付方式
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['在学校领取', '同城自提'].map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setDeliveryMethod(label)}
                            className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                              deliveryMethod === label
                                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        交接地点 / 方便时段说明
                      </label>
                      <input
                        type="text"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="如在学校领取请注明校区/宿舍区/教学楼，自提可填时段"
                        className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        留言 / 心理出价 / 问题咨询 (选填)
                      </label>
                      <textarea
                        rows={2}
                        value={buyerNote}
                        onChange={(e) => setBuyerNote(e.target.value)}
                        placeholder="可多件打包议价，或咨询商品细节..."
                        className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer Actions */}
        {!submittedOrder && resolvedItems.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50/50 space-y-2">
            {/* Direct Native Link to Web Gmail: Always openable, and re-sendable anytime! */}
            <a
              href={gmailWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleGmailClick}
              className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {allItemsSent
                  ? '在网页版 Gmail 中再次发送邮件'
                  : '在网页版 Gmail 中发送给店主'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
            </a>

            {/* Action 2: Send via WeChat */}
            <button
              type="button"
              onClick={handleWeChatSend}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>{isCopied ? '已复制！点击再次查看微信名片' : '微信发送 (复制清单并展示店主二维码)'}</span>
            </button>

            <p className="text-[11px] text-stone-400 text-center">
              支持网页版 Gmail 直接发信，或一键复制发微信给店主
            </p>
          </div>
        )}

        {/* WeChat QR Card Modal popup */}
        <WeChatModal
          isOpen={isWeChatModalOpen}
          onClose={() => setIsWeChatModalOpen(false)}
          customQrUrl={contactWeChatQr}
          copyNotice={true}
        />
      </div>
    </div>
  );
};

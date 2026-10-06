import React, { useState, useRef } from 'react';
import {
  PlusCircle,
  Package,
  Inbox,
  Settings,
  Upload,
  Image as ImageIcon,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Mail,
  Copy,
  Download,
  UploadCloud,
  RefreshCw,
  ExternalLink,
  DollarSign,
  AlertCircle,
  Send,
  MessageCircle,
  Lock,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Camera,
  Star,
  Plus
} from 'lucide-react';
import { InventoryItem, OrderItem, StoreSettings } from '../types';
import { compressImageFile } from '../utils/imageCompress';
import { PRESET_IMAGES, CATEGORIES, CONDITIONS } from '../utils/imagePresets';
import { ItemImage } from './ItemImage';
import { api } from '../services/api';

interface AdminPortalProps {
  items: InventoryItem[];
  orders: OrderItem[];
  settings: StoreSettings;
  currency: string;
  onSaveItem: (item: Partial<InventoryItem>) => Promise<void>;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: OrderItem['status']) => Promise<void>;
  onUpdateSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  onResetData: () => Promise<void>;
  onCloseAdmin: () => void;
  onLogoutAdmin?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  items,
  orders,
  settings,
  currency,
  onSaveItem,
  onUpdateItem,
  onDeleteItem,
  onUpdateOrderStatus,
  onUpdateSettings,
  onResetData,
  onCloseAdmin,
  onLogoutAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'inventory' | 'orders' | 'settings'>('create');

  // Form State for Quick Post Editor
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[1]);
  const [formPrice, setFormPrice] = useState<string>('');
  const [formOriginalPrice, setFormOriginalPrice] = useState<string>('');
  const [formCondition, setFormCondition] = useState(CONDITIONS[2]);
  const [formStock, setFormStock] = useState<string>('1');
  const [formStatus, setFormStatus] = useState<'available' | 'reserved' | 'sold'>('available');
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const formImageUrl = formImages[0] || '';
  const [formLocation, setFormLocation] = useState('自提或在学校领取');
  const [formTags, setFormTags] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // Settings State
  const [sellerEmail, setSellerEmail] = useState(settings.sellerEmail);
  const [storeName, setStoreName] = useState(settings.storeName);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currency);
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || '');
  const [pickupLocation, setPickupLocation] = useState(settings.pickupLocation || '自提或在学校领取');
  const [contactWeChat, setContactWeChat] = useState(settings.contactWeChat || '月月鸟 (美国)');
  const [contactWeChatName, setContactWeChatName] = useState(settings.contactWeChatName || '月月鸟');
  const [contactWeChatQr, setContactWeChatQr] = useState(settings.contactWeChatQr || '');
  const [smtpEnabled, setSmtpEnabled] = useState(settings.smtpConfig?.enabled || false);
  const [smtpHost, setSmtpHost] = useState(settings.smtpConfig?.host || 'smtp.qq.com');
  const [smtpPort, setSmtpPort] = useState(settings.smtpConfig?.port?.toString() || '465');
  const [smtpUser, setSmtpUser] = useState(settings.smtpConfig?.user || '');
  const [smtpPass, setSmtpPass] = useState(settings.smtpConfig?.pass || '');
  const [smtpFromName, setSmtpFromName] = useState(settings.smtpConfig?.fromName || '存货集市订单系统');

  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Source persistence states
  const [isPersisting, setIsPersisting] = useState(false);
  const [persistFeedback, setPersistFeedback] = useState<string | null>(null);
  const [copiedTs, setCopiedTs] = useState(false);

  const getTsCodeString = () => {
    return `import { InventoryItem, StoreSettings } from '../types';

export const INITIAL_SETTINGS: StoreSettings = ${JSON.stringify(settings, null, 2)};

export const INITIAL_ITEMS: InventoryItem[] = ${JSON.stringify(items, null, 2)};
`;
  };

  const handlePersistToSource = async () => {
    setIsPersisting(true);
    setPersistFeedback(null);
    try {
      const res = await api.persistToSource(items, settings);
      setPersistFeedback(res.message || '已成功固化到网页源码！');
      setTimeout(() => setPersistFeedback(null), 5000);
    } catch {
      setPersistFeedback('已更新至本地缓存！');
      setTimeout(() => setPersistFeedback(null), 5000);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleDownloadStoreDataTs = () => {
    const code = getTsCodeString();
    const blob = new Blob([code], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'storeData.ts';
    a.click();
    URL.revokeObjectURL(url);
    setPersistFeedback('已为您下载最新的 storeData.ts 文件！将其放置在项目 src/data/ 目录下重新打包即可永久生效。');
    setTimeout(() => setPersistFeedback(null), 6000);
  };

  const handleCopyTsCode = () => {
    navigator.clipboard.writeText(getTsCodeString());
    setCopiedTs(true);
    setTimeout(() => setCopiedTs(false), 2500);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load item into form for editing
  const handleStartEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormOriginalPrice(item.originalPrice ? item.originalPrice.toString() : '');
    setFormCondition(item.condition);
    setFormStock(item.stock.toString());
    setFormStatus(item.status);
    setFormDescription(item.description);
    const initialImgs = (item.images && item.images.length > 0 ? item.images : [item.imageUrl]).filter(Boolean);
    setFormImages(initialImgs);
    setImageUrlInput('');
    setFormLocation(item.location || '自提或在学校领取');
    setFormTags(item.tags ? item.tags.join(', ') : '');
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetForm = () => {
    setEditingItemId(null);
    setFormTitle('');
    setFormCategory(CATEGORIES[1]);
    setFormPrice('');
    setFormOriginalPrice('');
    setFormCondition(CONDITIONS[2]);
    setFormStock('1');
    setFormStatus('available');
    setFormDescription('');
    setFormImages([]);
    setImageUrlInput('');
    setFormLocation('自提或在学校领取');
    setFormTags('');
    setFormFeedback(null);
  };

  // Handle local file image upload (Supports multiple files)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i]);
        newUrls.push(compressed);
      }
      setFormImages((prev) => [...prev, ...newUrls]);
      setFormFeedback(`已成功添加 ${newUrls.length} 张实拍图片 (排在首位的图片将作为封面)`);
      setTimeout(() => setFormFeedback(null), 3500);
    } catch (err) {
      alert('图片加载压缩失败，请换一张试下');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    setFormImages((prev) => {
      const target = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return [target, ...remaining];
    });
    setFormFeedback('已将选定图片设为封面展示图！');
    setTimeout(() => setFormFeedback(null), 2500);
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (from: number, to: number) => {
    setFormImages((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  };

  const handleAddUrlImage = () => {
    if (imageUrlInput.trim()) {
      setFormImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
      setFormFeedback('已添加图片链接 (已加入相册)');
      setTimeout(() => setFormFeedback(null), 2500);
    }
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('请填写商品标题');
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('请填写有效的商品价格');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formTags
        ? formTags.split(/[,，、 ]+/).filter((t) => t.trim().length > 0)
        : [];

      const payload: Partial<InventoryItem> = {
        title: formTitle.trim(),
        category: formCategory,
        price: priceNum,
        originalPrice: formOriginalPrice ? parseFloat(formOriginalPrice) : undefined,
        condition: formCondition,
        stock: parseInt(formStock, 10) || 1,
        status: formStatus,
        description: formDescription.trim(),
        imageUrl: formImages[0] || '',
        images: formImages.length > 0 ? formImages : [],
        location: formLocation.trim(),
        tags: tagsArray,
      };

      if (editingItemId) {
        await onUpdateItem(editingItemId, payload);
        setFormFeedback('商品已成功更新！');
      } else {
        await onSaveItem(payload);
        setFormFeedback('新商品已发布至集市！');
      }

      setTimeout(() => {
        handleResetForm();
        setActiveTab('inventory');
      }, 700);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      sellerEmail: sellerEmail.trim(),
      storeName: storeName.trim(),
      announcement: announcement.trim(),
      currency: currencySymbol.trim(),
      ...(adminPassword.trim() ? { adminPassword: adminPassword.trim() } : {}),
      pickupLocation: pickupLocation.trim(),
      contactWeChat: contactWeChat.trim(),
      contactWeChatName: contactWeChatName.trim(),
      contactWeChatQr: contactWeChatQr,
      smtpConfig: {
        enabled: smtpEnabled,
        host: smtpHost.trim(),
        port: parseInt(smtpPort, 10) || 465,
        secure: parseInt(smtpPort, 10) === 465,
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        fromName: smtpFromName.trim(),
      }
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setTestEmailResult(null);
    try {
      // First save current smtp config to server
      await onUpdateSettings({
        sellerEmail: sellerEmail.trim(),
        smtpConfig: {
          enabled: smtpEnabled,
          host: smtpHost.trim(),
          port: parseInt(smtpPort, 10) || 465,
          secure: parseInt(smtpPort, 10) === 465,
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
          fromName: smtpFromName.trim(),
        }
      });
      const res = await (window as any).fetch('/api/test-email', { method: 'POST' }).then((r: any) => r.json());
      if (res.success) {
        setTestEmailResult({ success: true, msg: res.message || '测试邮件已发送成功，请查收！' });
      } else {
        setTestEmailResult({ success: false, msg: res.error || '测试发信失败，请检查账号和授权码' });
      }
    } catch (e: any) {
      setTestEmailResult({ success: false, msg: e?.message || '测试请求失败' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Export data as JSON
  const handleExportJson = () => {
    const backup = {
      exportTime: new Date().toISOString(),
      items,
      orders,
      settings,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      {/* Top Banner and Navigation */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                店主管理后台
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-stone-500 font-mono">
                通知邮箱: {settings.sellerEmail}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mt-1">
              存货管理与推送中心
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCloseAdmin}
              className="px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              返回买家前台页面
            </button>
            {onLogoutAdmin && (
              <button
                onClick={onLogoutAdmin}
                className="px-3.5 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
              >
                退出登录
              </button>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{editingItemId ? '编辑商品帖子' : '快速发布商品'}</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'inventory'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>存货管理与改价 ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'settings'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>店铺与邮件通知设置</span>
          </button>
        </div>
      </div>

      {/* TAB 1: QUICK POST EDITOR */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-6 border-b border-stone-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {editingItemId ? '编辑商品详细信息' : '快捷发布新存货'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                上传实拍图片、设置出清价与成色，一键发布即可同步展示给买家。
              </p>
            </div>
            {editingItemId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-stone-500 hover:text-stone-800 underline"
              >
                取消编辑，返回新建
              </button>
            )}
          </div>

          {formFeedback && (
            <div className="mb-6 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{formFeedback}</span>
            </div>
          )}

          <form onSubmit={handleSubmitItem} className="space-y-6">
            {/* Multi-Image Upload & Photo Gallery Management */}
            <div className="bg-stone-50/80 p-4 sm:p-5 rounded-2xl border border-stone-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <label className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      商品实拍相册 (已上传 {formImages.length} 张图片)
                    </label>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    支持上传多张实拍细节照片！<strong>排在第 1 张的图片将作为商品封面</strong>，买家点开商品卡片即可浏览所有实拍大图。
                  </p>
                </div>

                {formImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('确认清空已上传的所有图片吗？')) {
                        setFormImages([]);
                      }
                    }}
                    className="text-[11px] text-red-600 hover:text-red-700 font-medium self-start sm:self-auto cursor-pointer"
                  >
                    清空相册
                  </button>
                )}
              </div>

              {/* Upload Input & Trigger Button */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{isUploadingImage ? '正在处理压缩中...' : '选择本地照片上传 (支持批量多选)'}</span>
                </button>
              </div>

              {/* Photos Gallery Grid */}
              {formImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
                  {formImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`group relative rounded-xl overflow-hidden border bg-white shadow-2xs aspect-square flex items-center justify-center transition-all ${
                        idx === 0
                          ? 'border-amber-500 ring-2 ring-amber-500/40'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`实拍图 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Cover Badge on Index 0 */}
                      {idx === 0 ? (
                        <div className="absolute top-1.5 left-1.5 z-10 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          <span>封面首图</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetAsCover(idx)}
                          className="absolute top-1.5 left-1.5 z-10 bg-black/75 hover:bg-amber-600 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow-xs transition-colors opacity-90 group-hover:opacity-100 flex items-center gap-1 cursor-pointer"
                          title="点击设为封面"
                        >
                          <Star className="w-3 h-3" />
                          <span>设为封面</span>
                        </button>
                      )}

                      {/* Index Tag */}
                      <div className="absolute bottom-1.5 left-1.5 z-10 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        {idx + 1}
                      </div>

                      {/* Controls on Hover */}
                      <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, idx - 1)}
                            className="p-1 bg-black/70 hover:bg-black text-white rounded cursor-pointer"
                            title="向前移"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        )}
                        {idx < formImages.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, idx + 1)}
                            className="p-1 bg-black/70 hover:bg-black text-white rounded cursor-pointer"
                            title="向后移"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 bg-red-600/90 hover:bg-red-700 text-white rounded cursor-pointer"
                          title="删除此图"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add more button tile in grid */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-xl aspect-square flex flex-col items-center justify-center p-3 text-stone-500 hover:text-amber-700 bg-white hover:bg-amber-50/50 transition-all cursor-pointer group"
                  >
                    <Plus className="w-6 h-6 mb-1 text-stone-400 group-hover:text-amber-600 transition-colors" />
                    <span className="text-[11px] font-semibold">继续添加</span>
                    <span className="text-[9px] text-stone-400">支持多选</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-8 text-center bg-white cursor-pointer transition-colors"
                >
                  <Camera className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-stone-700">暂未添加照片，点击选择本地多张实拍照片</p>
                  <p className="text-[11px] text-stone-400 mt-1">支持按住 Shift 或 Ctrl 批量选取多张图片，自动高质量压缩</p>
                </div>
              )}

              {/* Auxiliary: Add via Image URL & Quick Presets */}
              <div className="pt-3 border-t border-stone-200/80 space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="或粘贴外部图片网络链接 (https://...)"
                    className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-hidden focus:border-stone-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrlImage}
                    className="px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    添加此图
                  </button>
                </div>

                <div>
                  <span className="text-[11px] text-stone-500 font-medium block mb-1">
                    快捷添加常用实拍预设图：
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setFormImages((prev) => [...prev, preset.url]);
                          setFormFeedback(`已添加预设图: ${preset.name}`);
                          setTimeout(() => setFormFeedback(null), 2000);
                        }}
                        className="px-2.5 py-1 text-[11px] bg-white hover:bg-stone-100 border border-stone-200 rounded-md text-stone-600 transition-colors cursor-pointer"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  商品标题 / 品名 <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例如：索尼 FE 24-70mm F2.8 GM 镜头 95新箱说全"
                  className="w-full text-sm px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  所属分类
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 bg-white"
                >
                  {CATEGORIES.filter((c) => c !== '全部存货').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  物品成色
                </label>
                <select
                  value={formCondition}
                  onChange={(e) => setFormCondition(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 bg-white"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  出清售价 ({currency}) <span className="text-amber-600">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="例如: 299"
                  className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  参考原价 / 购入价 ({currency}) (选填，用于划线对比)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formOriginalPrice}
                  onChange={(e) => setFormOriginalPrice(e.target.value)}
                  placeholder="例如: 699"
                  className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  存货数量 (件)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  当前状态
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 bg-white"
                >
                  <option value="available">在售展示中 (可勾选)</option>
                  <option value="sold">已售出 (标记已结缘)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                详细描述 (功能状态、使用痕迹、配件情况、出清原因)
              </label>
              <textarea
                rows={4}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="详细说明物品来源、磨损情况、附件包装、使用感受等，越详细买家越放心..."
                className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 leading-relaxed"
              />
            </div>

            {/* Location & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  交付与物流说明
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="例如: 自提或在学校领取 / 校区宿舍面交"
                  className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  特色标签 (用逗号分隔)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="例如: 箱说全, 官方原装, 95新"
                  className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900"
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg transition-colors"
              >
                重置内容
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{editingItemId ? '保存修改并更新' : '立即发布到存货集市'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: INVENTORY LIST & INLINE EDIT */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                商品存货管理列表
              </h2>
              <p className="text-xs text-stone-500">
                支持直接在列表中快速切换在售状态、快速调整价格或进入详细编辑。
              </p>
            </div>

            <button
              onClick={() => {
                handleResetForm();
                setActiveTab('create');
              }}
              className="px-3.5 py-1.5 bg-stone-900 text-white hover:bg-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>添加新商品</span>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-16 text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
              <Package className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="text-sm font-semibold text-stone-700">暂无已上架的商品存货</p>
              <p className="text-xs text-stone-400 mt-1">初始演示商品已全部清空，您可以立即点击上方按钮开始发布您的真实商品！</p>
              <button
                type="button"
                onClick={() => {
                  handleResetForm();
                  setActiveTab('create');
                }}
                className="mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                + 发布第一件商品
              </button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">商品实拍与名称</th>
                  <th className="py-3 px-3">分类/成色</th>
                  <th className="py-3 px-3">价格</th>
                  <th className="py-3 px-3">库存</th>
                  <th className="py-3 px-3">当前状态</th>
                  <th className="py-3 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-3 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                        <ItemImage
                          src={item.imageUrl}
                          alt={item.title}
                          category={item.category}
                          aspectRatio="1/1"
                        />
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <div className="font-semibold text-stone-900 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-stone-400 truncate mt-0.5">
                          {item.description || '无详细描述'}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-stone-600">
                      <div>{item.category}</div>
                      <div className="text-[11px] text-stone-400">{item.condition}</div>
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-stone-900">
                      {currency}{item.price}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {item.stock}件
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          onUpdateItem(item.id, {
                            status: e.target.value as any,
                          })
                        }
                        className={`text-xs px-2 py-1 rounded border font-medium bg-white ${
                          item.status === 'available'
                            ? 'border-emerald-200 text-emerald-700'
                            : 'border-stone-200 text-stone-500'
                        }`}
                      >
                        <option value="available">在售中</option>
                        <option value="sold">已售出</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                          title="编辑帖子"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`确认删除《${item.title}》吗？`)) {
                              onDeleteItem(item.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}

      {/* TAB 3: BUYER ORDERS & PUSHED INQUIRIES */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                买家推送与选购订单 ({orders.length})
              </h2>
              <p className="text-xs text-stone-500">
                前台买家勾选心仪物品并提交后，订单将立即推送至此列表并向您的邮箱发信。
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <Inbox className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="text-sm font-medium">暂无买家推送的选购订单</p>
              <p className="text-xs text-stone-400 mt-1">
                当访客在商品上勾选【我想买】并提交时，会自动汇总显示在这里。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const replySubject = encodeURIComponent(
                  `【存货确认】店主关于您的订购单 (${order.id}) 的回复`
                );
                const replyBody = encodeURIComponent(
                  `${order.buyerName} 您好：\n\n我已收到您在存货集市提交的选购意向（编号 ${order.id}）。\n` +
                  `关于您挑选的 ${order.items.length} 件物品（总金额 ${currency}${order.totalAmount}），确认在库状态如下：\n\n` +
                  `交易方式：${order.deliveryMethod}\n` +
                  `交付地址：${order.shippingAddress || '待确认'}\n\n` +
                  `方便加微信或以此邮件进一步沟通款项与交付事宜。\n祝好！`
                );
                const replyMailto = order.buyerEmail
                  ? `mailto:${order.buyerEmail}?subject=${replySubject}&body=${replyBody}`
                  : null;

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-xl border border-stone-200 bg-stone-50/30 hover:border-stone-300 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-xs text-stone-900 bg-stone-200/70 px-2 py-0.5 rounded">
                          {order.id}
                        </span>
                        <span className="text-xs text-stone-500">
                          {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </span>
                        <span className="text-xs text-stone-500">·</span>
                        <span className="text-xs font-semibold text-stone-800">
                          买家: {order.buyerName}
                        </span>
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-400">处理进度:</span>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            onUpdateOrderStatus(order.id, e.target.value as any)
                          }
                          className="text-xs px-2.5 py-1 rounded-lg border border-stone-300 bg-white font-medium"
                        >
                          <option value="pending">待联系 / 新意向</option>
                          <option value="contacted">已联系买家</option>
                          <option value="confirmed">已收款确认</option>
                          <option value="completed">已发货/自提完成</option>
                          <option value="cancelled">已取消</option>
                        </select>
                      </div>
                    </div>

                    {/* Buyer Contact details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-3 text-xs text-stone-600 bg-white p-3 rounded-lg border border-stone-100 my-3">
                      <div>
                        <span className="text-stone-400 block text-[11px]">买家邮箱</span>
                        <span className="font-mono select-all text-stone-900">
                          {order.buyerEmail || '未填写'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">电话 / 微信</span>
                        <span className="font-mono select-all text-stone-900">
                          {order.buyerContact || '未填写'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">交付方式与地址</span>
                        <span className="text-stone-900">
                          {order.deliveryMethod} {order.shippingAddress && `(${order.shippingAddress})`}
                        </span>
                      </div>
                    </div>

                    {/* Buyer Notes if any */}
                    {order.note && (
                      <div className="mb-3 px-3 py-2 bg-amber-50/70 border border-amber-200/60 rounded-lg text-xs text-amber-900">
                        <span className="font-semibold">买家留言/问询：</span>
                        {order.note}
                      </div>
                    )}

                    {/* Ordered Items Table */}
                    <div className="space-y-1.5 border-t border-stone-100 pt-2">
                      <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                        认购物品明细 ({order.items.length}件)
                      </span>
                      {order.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-stone-100/50"
                        >
                          <span className="text-stone-800">
                            {it.title} <span className="text-stone-400">×{it.quantity}</span>
                          </span>
                          <span className="font-mono tabular-nums text-stone-900 font-medium">
                            {currency}{it.price * it.quantity}
                          </span>
                        </div>
                      ))}

                      <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs font-bold text-stone-900">
                        <span>订单总额</span>
                        <span className="text-sm font-mono text-amber-700">
                          {currency}{order.totalAmount}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-end gap-2 flex-wrap">
                      {replyMailto && (
                        <a
                          href={replyMailto}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>一键发邮件联系买家</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS & BACKUP */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xs">
            <h2 className="text-base font-bold text-stone-900 mb-1">
              店铺基本设置
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              修改买家意向推送的目标邮箱、集市名称和置顶公告。
            </p>

            {settingsSaved && (
              <div className="mb-6 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>店铺设置已成功保存！</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  店主接收推送邮箱 (买家提交意向时直发此地址)
                </label>
                <input
                  type="email"
                  required
                  value={sellerEmail}
                  onChange={(e) => setSellerEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  集市名称 / 网站标题
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  货币符号 (¥ / $ / €)
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-24 text-xs px-3.5 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  默认交付与交接说明
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="例如: 自提或在学校领取"
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  前台横幅公告说明
                </label>
                <textarea
                  rows={3}
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 leading-relaxed"
                />
              </div>

              {/* Admin Security Password */}
              <div className="pt-6 border-t border-stone-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-stone-900">
                    店主后台管理密码设置
                  </h3>
                </div>
                <div className="max-w-md">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    自定义管理密码 (进入后台时验证使用)
                  </label>
                  <input
                    type="text"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="若修改管理密码请输入新密码，不修改请留空"
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono bg-stone-50/50"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    用于保护后台管理安全。他人尝试进入后台时，必须同时输入店主邮箱与此私密密码，严防未授权修改。
                  </p>
                </div>
              </div>

              {/* WeChat Contact Settings */}
              <div className="pt-6 border-t border-stone-200 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-stone-900">
                    店主微信联系方式与二维码名片设置
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      微信号 / 昵称
                    </label>
                    <input
                      type="text"
                      value={contactWeChatName}
                      onChange={(e) => setContactWeChatName(e.target.value)}
                      placeholder="例如: 月月鸟"
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      微信联系显示文字 (含地区)
                    </label>
                    <input
                      type="text"
                      value={contactWeChat}
                      onChange={(e) => setContactWeChat(e.target.value)}
                      placeholder="例如: 月月鸟 (美国)"
                      className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    微信个人二维码名片图片
                  </label>
                  <p className="text-[11px] text-stone-500 mb-2">
                    买家在清单点击「微信发送」时将直接展示该名片。可上传您的微信原图（如相册中的 IMG_5333.JPG）。
                  </p>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="admin-wechat-qr-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setContactWeChatQr(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('admin-wechat-qr-upload')?.click()}
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{contactWeChatQr ? '重新上传原图' : '选择二维码图片上传 (IMG_5333.JPG)'}</span>
                    </button>

                    {contactWeChatQr && (
                      <button
                        type="button"
                        onClick={() => setContactWeChatQr('')}
                        className="text-xs text-red-500 hover:underline"
                      >
                        清除并使用系统默认名片
                      </button>
                    )}
                  </div>

                  {contactWeChatQr && (
                    <div className="mt-3 w-32 h-32 border border-stone-200 rounded-xl overflow-hidden p-1.5 bg-stone-50 shadow-2xs">
                      <img src={contactWeChatQr} alt="微信名片预览" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* SMTP Auto Email Dispatch Configuration */}
              <div className="pt-6 border-t border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-stone-900">
                      系统自动邮件推送服务 (SMTP 配置)
                    </h3>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700 select-none">
                    <input
                      type="checkbox"
                      checked={smtpEnabled}
                      onChange={(e) => setSmtpEnabled(e.target.checked)}
                      className="rounded border-stone-300 text-stone-900 focus:ring-0"
                    />
                    <span>启用服务器自动发信</span>
                  </label>
                </div>

                {/* Helpful guide addressing user question */}
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 leading-relaxed mb-4 space-y-1.5">
                  <div className="font-semibold text-stone-800">
                    💡 您是否需要专门注册新的邮箱？
                  </div>
                  <p>
                    <strong>不需要注册新邮箱！</strong> 系统的邮件通知有两种工作方式：
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-stone-500">
                    <li>
                      <strong className="text-stone-700">方式一（零配置，立即生效）：</strong> 买家提交订单后，可直接点击<strong>「在网页版 Gmail 中打开并发送」</strong>，浏览器会在新标签页自动填充好收件人与全部物品明细，一键发出；同时每一笔订单在买家提交瞬间就已经直接存入您当前后台的<strong>「买家选购推送」</strong>标签页中！
                    </li>
                    <li>
                      <strong className="text-stone-700">方式二（全自动静默发信）：</strong> 如果希望买家点击提交后，服务器<strong>全自动</strong>给您的 <code>{sellerEmail}</code> 投递邮件（买家无需打开任何邮箱），只需在下方开启发信服务，并填入您手头现有的任意邮箱（如 QQ邮箱 / 163邮箱）及它的<strong>SMTP 授权码</strong>作为发信中继即可。
                    </li>
                  </ul>
                </div>

                {smtpEnabled && (
                  <div className="space-y-3 bg-stone-50/50 p-4 rounded-xl border border-stone-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          发件邮箱账号 (例如: your_name@qq.com)
                        </label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          placeholder="例如: 12345678@qq.com"
                          className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          发件邮箱授权码 / 独立密码 (非网页登录密码)
                        </label>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          placeholder="邮箱设置中生成的 16位 SMTP 授权码"
                          className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          SMTP 服务器地址
                        </label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="smtp.qq.com"
                          className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          端口 (SSL 默认 465)
                        </label>
                        <input
                          type="text"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                          placeholder="465"
                          className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 font-mono bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          发件人显示昵称
                        </label>
                        <input
                          type="text"
                          value={smtpFromName}
                          onChange={(e) => setSmtpFromName(e.target.value)}
                          placeholder="存货集市订单通知"
                          className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={isTestingEmail}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isTestingEmail ? '正在测试发信...' : '发送测试邮件至店主邮箱'}</span>
                      </button>

                      {testEmailResult && (
                        <span
                          className={`text-xs ${
                            testEmailResult.success ? 'text-emerald-700 font-medium' : 'text-red-600'
                          }`}
                        >
                          {testEmailResult.msg}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  保存店铺所有设置
                </button>
              </div>
            </form>
          </div>

          {/* Permanent Source Code Baking Section */}
          <div className="bg-amber-50/80 rounded-2xl border border-amber-200/90 p-6 md:p-8 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-200/80 text-amber-900 rounded-md text-[11px] font-semibold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>永久固化为网页源码 (跨设备永久显示)</span>
                </div>
                <h2 className="text-base font-bold text-stone-900">
                  将当前商品与设置直接固化为网页源码的一部分
                </h2>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  想要在换手机、换电脑、换浏览器或分享给买家时<strong>100% 永久显示</strong>您最新编辑的内容？点击下方按钮可直接将数据写入网页源代码（<code>src/data/storeData.ts</code>）。这样无论部署在哪个服务器，所有人打开都直接看到这批数据，彻底摆脱临时缓存！
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePersistToSource}
                disabled={isPersisting}
                className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isPersisting ? '正在固化写入源码...' : '一键固化到网页源码文件'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadStoreDataTs}
                className="px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-amber-300 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-700" />
                <span>下载最新源码文件 (storeData.ts)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyTsCode}
                className="px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-stone-500" />
                <span>{copiedTs ? '已复制到剪贴板！' : '复制代码内容'}</span>
              </button>
            </div>

            {persistFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{persistFeedback}</span>
              </div>
            )}
          </div>

          {/* Backup & Recovery */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-xs">
            <h2 className="text-base font-bold text-stone-900 mb-1">
              数据备份与恢复
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              导出所有发布的商品帖子和订单记录，防止数据丢失；或随时恢复默认初始演示数据。
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>导出完整数据备份 (JSON)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (confirm('确认恢复默认演示数据吗？现有的修改将被重置。')) {
                    await onResetData();
                  }
                }}
                className="px-4 py-2 border border-stone-200 hover:bg-red-50 hover:text-red-700 text-stone-600 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>恢复初始演示数据</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Mail, Check, X, ShieldCheck } from 'lucide-react';

interface UserEmailModalProps {
  isOpen: boolean;
  initialEmail?: string;
  initialName?: string;
  onClose: () => void;
  onDismiss?: () => void;
  onSave: (email: string, name?: string) => void;
}

export const UserEmailModal: React.FC<UserEmailModalProps> = ({
  isOpen,
  initialEmail = '',
  initialName = '',
  onClose,
  onDismiss,
  onSave,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState(initialName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      alert('请填写有效的电子邮箱地址');
      return;
    }
    onSave(email.trim(), name.trim());
    onClose();
  };

  const handleSkip = () => {
    if (onDismiss) {
      onDismiss();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-7 border border-stone-200 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 border border-amber-200/60 shadow-2xs">
          <Mail className="w-6 h-6 stroke-[1.8]" />
        </div>

        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Cookie 长期免密记忆 · 永久生效</span>
        </div>

        <h3 className="text-lg font-bold text-stone-900">
          欢迎光临存货集市
        </h3>
        <p className="mt-1 text-xs text-stone-500 leading-relaxed">
          请输入您的常用邮箱（<strong>免密码快捷登记</strong>）：浏览器将通过安全 Cookie 记住您的身份，下次进站自动登录，心仪清单长期保存，免重复输入。
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              您的常用电子邮箱 <span className="text-amber-600">*</span>
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="例如: your_name@gmail.com 或 qq.com"
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-hidden focus:border-stone-900 font-mono bg-stone-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              您的称呼 / 姓名 (选填)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 张同学"
              className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-hidden focus:border-stone-900 bg-stone-50/50"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>通过 Cookie 记住我并开始浏览</span>
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-2 text-xs text-stone-400 hover:text-stone-700 transition-colors"
            >
              先随便逛逛 (稍后选购时再填)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

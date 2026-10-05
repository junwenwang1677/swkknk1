import React, { useState } from 'react';
import { ShieldCheck, Lock, X, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!inputEmail.trim()) {
      setErrorMsg('请输入管理员绑定邮箱');
      return;
    }

    if (!inputPassword) {
      setErrorMsg('请输入管理密码');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.adminLogin(inputEmail, inputPassword);
      if (res.success) {
        setInputEmail('');
        setInputPassword('');
        setErrorMsg('');
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || '管理员账号或管理密码错误，请核对后重试');
      }
    } catch {
      setErrorMsg('验证请求失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrorMsg('');
    setInputPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-7 border border-stone-200 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          title="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Shield Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 border border-amber-200/80 shadow-2xs">
          <ShieldCheck className="w-6 h-6 stroke-[1.8]" />
        </div>

        <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>店主管理权限验证</span>
        </div>

        <h3 className="text-lg font-bold text-stone-900">
          店主后台管理入口
        </h3>

        <p className="mt-1 text-xs text-stone-500 leading-relaxed">
          为保障商品库存状态与价格安全，进入后台发布管理需验证管理员身份与独立管理密码。
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              管理员绑定邮箱 <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoFocus
                value={inputEmail}
                onChange={(e) => {
                  setInputEmail(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="请输入店主管理邮箱"
                className="w-full text-xs pl-9 pr-3.5 py-2.5 border border-stone-300 rounded-xl focus:outline-hidden focus:border-stone-900 font-mono bg-stone-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              管理访问密码 <span className="text-amber-600">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="请输入管理员密码"
                className="w-full text-xs pl-9 pr-10 py-2.5 border border-stone-300 rounded-xl focus:outline-hidden focus:border-stone-900 font-mono bg-stone-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                title={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200/90 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{isSubmitting ? '正在验证身份...' : '验证密码并进入后台'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

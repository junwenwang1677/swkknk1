import { InventoryItem, StoreSettings } from '../types';

export const DEFAULT_ITEMS: InventoryItem[] = [];

export const DEFAULT_SETTINGS: StoreSettings = {
  sellerEmail: 'shiwokakanaka@gmail.com',
  storeName: '存货出清集市',
  announcement: '因个人搬家与闲置整理，部分珍藏好物与多余存货好价出清！所有物品支持勾选订购，提交后将通过邮件直达我并同步录入后台，成色如实说明，自提或在学校领取均可。',
  currency: '$',
  adminPassword: 'admin888',
  contactWeChat: '月月鸟 (美国)',
  contactWeChatName: '月月鸟',
  contactWeChatQr: '/wechat_qr.jpg',
  pickupLocation: '自提或在学校领取',
  allowCounterOffer: true,
  smtpConfig: {
    enabled: false,
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    fromName: '存货集市订单系统',
  },
};

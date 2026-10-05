export interface InventoryItem {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  condition: string;
  stock: number;
  status: 'available' | 'reserved' | 'sold';
  description: string;
  imageUrl: string;
  images?: string[];
  tags?: string[];
  location?: string;
  createdAt: string;
}

export interface SelectedCartItem {
  id: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  createdAt: string;
  status: 'pending' | 'contacted' | 'confirmed' | 'completed' | 'cancelled';
  buyerName: string;
  buyerEmail: string;
  buyerContact: string;
  deliveryMethod: string;
  shippingAddress?: string;
  note?: string;
  items: {
    id: string;
    title: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    condition?: string;
  }[];
  totalAmount: number;
  sellerEmail: string;
  emailPushed?: boolean;
}

export interface StoreSettings {
  sellerEmail: string;
  storeName: string;
  announcement: string;
  currency: string;
  adminPassword?: string;
  contactWeChat?: string;
  contactWeChatName?: string;
  contactWeChatQr?: string;
  pickupLocation?: string;
  allowCounterOffer?: boolean;
  smtpConfig?: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    fromName?: string;
  };
}

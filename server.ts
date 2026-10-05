import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ITEMS_FILE = path.join(DATA_DIR, 'inventory.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const TOKENS_FILE = path.join(DATA_DIR, 'admin_tokens.json');

function loadAdminTokens(): Set<string> {
  const arr = readJsonFile<string[]>(TOKENS_FILE, []);
  return new Set<string>(arr);
}

function saveAdminTokens(tokens: Set<string>): void {
  writeJsonFile(TOKENS_FILE, Array.from(tokens));
}

// Default initial items (Clean empty state)
const DEFAULT_ITEMS: any[] = [];

const DEFAULT_SETTINGS = {
  sellerEmail: 'shiwokakanaka@gmail.com',
  storeName: '存货出清',
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
    fromName: '存货集市订单系统'
  }
};

function syncToSourceCode(items: any[], settings: any) {
  try {
    const tsContent = `import { InventoryItem, StoreSettings } from '../types';

export const INITIAL_SETTINGS: StoreSettings = ${JSON.stringify(settings, null, 2)};

export const INITIAL_ITEMS: InventoryItem[] = ${JSON.stringify(items, null, 2)};
`;
    const storeDataPath = path.join(__dirname, 'src', 'data', 'storeData.ts');
    fs.writeFileSync(storeDataPath, tsContent, 'utf-8');
  } catch (err) {
    console.error('Failed to sync to storeData.ts:', err);
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Ensure items file exists
if (!fs.existsSync(ITEMS_FILE)) {
  writeJsonFile(ITEMS_FILE, []);
}

if (!fs.existsSync(ORDERS_FILE)) {
  writeJsonFile(ORDERS_FILE, []);
}

if (!fs.existsSync(SETTINGS_FILE)) {
  writeJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
} else {
  const currentSettings = readJsonFile<any>(SETTINGS_FILE, DEFAULT_SETTINGS);
  currentSettings.pickupLocation = '自提或在学校领取';
  if (!currentSettings.adminPassword) {
    currentSettings.adminPassword = 'admin888';
  }
  writeJsonFile(SETTINGS_FILE, currentSettings);
}

// Mailer helper
async function sendNotificationEmail(settings: any, order: any): Promise<{ success: boolean; error?: string }> {
  const smtp = settings?.smtpConfig;
  if (!smtp?.enabled || !smtp?.user || !smtp?.pass) {
    return { success: false, error: 'SMTP 发信服务未配置' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host || 'smtp.qq.com',
      port: Number(smtp.port) || 465,
      secure: smtp.secure !== false,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    const itemsListHtml = order.items.map((it: any, idx: number) =>
      `<tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0;">
          <div style="font-weight: 600; color: #18181b;">${idx + 1}. ${it.title}</div>
          <div style="font-size: 12px; color: #71717a; margin-top: 2px;">成色: ${it.condition || '良好'}</div>
        </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; text-align: center; font-family: monospace;">×${it.quantity}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600; font-family: monospace; color: #b45309;">${settings.currency || '¥'}${it.price * it.quantity}</td>
      </tr>`
    ).join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff; color: #18181b;">
        <div style="border-bottom: 2px solid #f4f4f5; padding-bottom: 16px; margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #d97706; background: #fef3c7; padding: 3px 8px; rounded: 4px;">新存货认购推送</span>
          <h2 style="font-size: 20px; font-weight: 700; margin: 8px 0 0 0; color: #09090b;">订单编号：${order.id}</h2>
        </div>

        <div style="background-color: #fafaf9; border: 1px solid #f5f5f4; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6;">
          <div style="margin-bottom: 6px;"><strong>买家称呼：</strong> ${order.buyerName}</div>
          <div style="margin-bottom: 6px;"><strong>买家邮箱：</strong> <a href="mailto:${order.buyerEmail}" style="color: #2563eb; text-decoration: underline;">${order.buyerEmail || '未填写'}</a></div>
          <div style="margin-bottom: 6px;"><strong>电话 / 微信：</strong> <span style="font-family: monospace; background: #f4f4f5; padding: 2px 6px; border-radius: 4px;">${order.buyerContact || '未填写'}</span></div>
          <div style="margin-bottom: 6px;"><strong>交付方式：</strong> <span style="color: #047857; font-weight: 600;">${order.deliveryMethod}</span> ${order.shippingAddress ? `(${order.shippingAddress})` : ''}</div>
          ${order.note ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e7e5e4; color: #92400e;"><strong>买家留言：</strong> ${order.note}</div>` : ''}
        </div>

        <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #27272a;">认购商品明细 (${order.items.length}件)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <thead>
            <tr style="background: #f4f4f5; color: #52525b; font-size: 12px;">
              <th style="padding: 8px; text-align: left;">物品</th>
              <th style="padding: 8px; text-align: center; width: 60px;">数量</th>
              <th style="padding: 8px; text-align: right; width: 90px;">小计</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 14px 8px; text-align: right; font-weight: 600; font-size: 15px;">合计总额：</td>
              <td style="padding: 14px 8px; text-align: right; font-weight: 700; font-size: 18px; font-family: monospace; color: #b45309;">${settings.currency || '¥'}${order.totalAmount}</td>
            </tr>
          </tfoot>
        </table>

        <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #71717a;">
          <p style="margin: 0;">此邮件已由存货集市自动投递至您的通知邮箱：<strong>${settings.sellerEmail}</strong>。</p>
          <p style="margin: 4px 0 0 0;">您也可以随时登录系统管理后台查看订单处理状态并核销存货。</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${smtp.fromName || settings.storeName || '存货集市'}" <${smtp.user}>`,
      to: settings.sellerEmail,
      subject: `[新存货订单] ${order.buyerName} 订购了 ${order.items.length} 件物品 (总额 ${settings.currency || '¥'}${order.totalAmount})`,
      text: `订单编号: ${order.id}\n买家: ${order.buyerName}\n联系方式: ${order.buyerContact || order.buyerEmail}\n交付方式: ${order.deliveryMethod}\n总额: ${settings.currency || '¥'}${order.totalAmount}`,
      html: htmlContent,
    });

    return { success: true };
  } catch (err: any) {
    console.error('SMTP send error:', err);
    return { success: false, error: err?.message || '发送失败' };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // API Endpoints
  const OWNER_EMAIL = 'shiwokakanaka@gmail.com';
  const requireOwnerAuth = (req: Request, res: Response, next: () => void) => {
    const adminToken = (req.headers['x-admin-token'] as string || '').trim();
    const rawCookies = req.headers.cookie || '';
    let cookieToken = '';
    rawCookies.split(';').forEach((c) => {
      const parts = c.split('=');
      const k = parts[0]?.trim();
      const v = parts.slice(1).join('=').trim();
      if (k === 'admin_session_token') cookieToken = decodeURIComponent(v).trim();
    });

    const activeTokens = loadAdminTokens();
    if ((adminToken && activeTokens.has(adminToken)) || (cookieToken && activeTokens.has(cookieToken))) {
      return next();
    }

    return res.status(403).json({
      error: '权限受限',
      message: '店主管理授权已失效或尚未登录，请重新输入密码登录'
    });
  };

  // Admin Auth APIs
  app.get('/api/admin/check-session', (req: Request, res: Response) => {
    const adminToken = (req.headers['x-admin-token'] as string || '').trim();
    const rawCookies = req.headers.cookie || '';
    let cookieToken = '';
    rawCookies.split(';').forEach((c) => {
      const parts = c.split('=');
      const k = parts[0]?.trim();
      const v = parts.slice(1).join('=').trim();
      if (k === 'admin_session_token') cookieToken = decodeURIComponent(v).trim();
    });

    const activeTokens = loadAdminTokens();
    const isValid = (adminToken && activeTokens.has(adminToken)) || (cookieToken && activeTokens.has(cookieToken));
    res.json({ authenticated: !!isValid });
  });

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    const settings = readJsonFile<any>(SETTINGS_FILE, DEFAULT_SETTINGS);
    const expectedEmail = (settings.sellerEmail || OWNER_EMAIL).toLowerCase().trim();
    const expectedPassword = settings.adminPassword || 'admin888';

    if (
      email &&
      email.toLowerCase().trim() === expectedEmail &&
      password &&
      password === expectedPassword
    ) {
      const token = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const activeTokens = loadAdminTokens();
      activeTokens.add(token);
      saveAdminTokens(activeTokens);

      res.setHeader('Set-Cookie', [
        `admin_session_token=${token}; Max-Age=86400; Path=/; SameSite=Lax`,
      ]);
      return res.json({
        success: true,
        token,
        message: '登录成功'
      });
    }

    return res.status(401).json({
      success: false,
      error: '管理员账号或管理密码错误，请核对后重试'
    });
  });

  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const adminToken = (req.headers['x-admin-token'] as string || '').trim();
    const rawCookies = req.headers.cookie || '';
    let cookieToken = '';
    rawCookies.split(';').forEach((c) => {
      const parts = c.split('=');
      const k = parts[0]?.trim();
      const v = parts.slice(1).join('=').trim();
      if (k === 'admin_session_token') cookieToken = decodeURIComponent(v).trim();
    });

    const activeTokens = loadAdminTokens();
    if (adminToken) activeTokens.delete(adminToken);
    if (cookieToken) activeTokens.delete(cookieToken);
    saveAdminTokens(activeTokens);

    res.setHeader('Set-Cookie', [
      `admin_session_token=; Max-Age=0; Path=/; SameSite=Lax`,
    ]);
    res.json({ success: true });
  });

  // 1. Items API
  app.get('/api/items', (req: Request, res: Response) => {
    const items = readJsonFile<any[]>(ITEMS_FILE, DEFAULT_ITEMS);
    res.json(items);
  });

  app.post('/api/items', requireOwnerAuth, (req: Request, res: Response) => {
    const items = readJsonFile<any[]>(ITEMS_FILE, DEFAULT_ITEMS);
    const rawImages = Array.isArray(req.body.images)
      ? req.body.images
      : req.body.imageUrl
      ? [req.body.imageUrl]
      : [];
    const validImages = rawImages.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
    const coverImage = validImages[0] || req.body.imageUrl || '';

    const newItem = {
      ...req.body,
      id: req.body.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
      status: req.body.status || 'available',
      stock: req.body.stock !== undefined ? Number(req.body.stock) : 1,
      price: Number(req.body.price) || 0,
      originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : undefined,
      location: req.body.location || '自提或在学校领取',
      imageUrl: coverImage,
      images: validImages.length > 0 ? validImages : (coverImage ? [coverImage] : [])
    };
    items.unshift(newItem);
    writeJsonFile(ITEMS_FILE, items);
    const settings = readJsonFile<any>(SETTINGS_FILE, DEFAULT_SETTINGS);
    syncToSourceCode(items, settings);
    res.status(201).json(newItem);
  });

  app.put('/api/items/:id', requireOwnerAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const items = readJsonFile<any[]>(ITEMS_FILE, DEFAULT_ITEMS);
    const index = items.findIndex((i: any) => i.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const rawImages = Array.isArray(req.body.images)
      ? req.body.images
      : req.body.imageUrl
      ? [req.body.imageUrl]
      : (items[index].images || []);
    const validImages = rawImages.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
    const coverImage = validImages[0] || req.body.imageUrl || items[index].imageUrl || '';

    items[index] = {
      ...items[index],
      ...req.body,
      price: Number(req.body.price) || items[index].price,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : items[index].stock,
      imageUrl: coverImage,
      images: validImages.length > 0 ? validImages : (coverImage ? [coverImage] : [])
    };
    writeJsonFile(ITEMS_FILE, items);
    const settings = readJsonFile<any>(SETTINGS_FILE, DEFAULT_SETTINGS);
    syncToSourceCode(items, settings);
    res.json(items[index]);
  });

  app.delete('/api/items/:id', requireOwnerAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const items = readJsonFile<any[]>(ITEMS_FILE, DEFAULT_ITEMS);
    const filtered = items.filter((i: any) => i.id !== id);
    writeJsonFile(ITEMS_FILE, filtered);
    const settings = readJsonFile<any>(SETTINGS_FILE, DEFAULT_SETTINGS);
    syncToSourceCode(filtered, settings);
    res.json({ success: true, id });
  });

  // 2. Orders / Inquiries API
  app.get('/api/orders', (req: Request, res: Response) => {
    const orders = readJsonFile<any[]>(ORDERS_FILE, []);
    res.json(orders);
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    const orders = readJsonFile<any[]>(ORDERS_FILE, []);
    const items = readJsonFile<any[]>(ITEMS_FILE, DEFAULT_ITEMS);
    const settings = readJsonFile<any>(SETTINGS_FILE, DEFAULT_SETTINGS);

    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      status: 'pending', // pending | contacted | confirmed | completed | cancelled
      buyerName: req.body.buyerName || '匿名买家',
      buyerEmail: req.body.buyerEmail || '',
      buyerContact: req.body.buyerContact || '',
      deliveryMethod: req.body.deliveryMethod || '在学校领取',
      shippingAddress: req.body.shippingAddress || '',
      note: req.body.note || '',
      items: req.body.items || [], // array of { id, title, price, quantity, imageUrl }
      totalAmount: req.body.totalAmount || 0,
      sellerEmail: settings.sellerEmail || 'shiwokakanaka@gmail.com',
      emailPushed: true,
      smtpDelivered: false,
      smtpError: null as string | null
    };

    // Attempt automatic server SMTP send if configured
    if (settings.smtpConfig?.enabled) {
      const emailResult = await sendNotificationEmail(settings, newOrder);
      newOrder.smtpDelivered = emailResult.success;
      if (!emailResult.success) {
        newOrder.smtpError = emailResult.error || '发信失败';
      }
    }

    orders.unshift(newOrder);
    writeJsonFile(ORDERS_FILE, orders);

    res.status(201).json({
      success: true,
      order: newOrder,
      message: `意向邮件信息已生成`
    });
  });

  app.patch('/api/orders/:id', requireOwnerAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const orders = readJsonFile<any[]>(ORDERS_FILE, []);
    const index = orders.findIndex((o: any) => o.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    orders[index] = { ...orders[index], ...req.body };
    writeJsonFile(ORDERS_FILE, orders);
    res.json(orders[index]);
  });

  // 3. Settings API
  app.get('/api/settings', (req: Request, res: Response) => {
    const settings = readJsonFile<any>(SETTINGS_FILE, DEFAULT_SETTINGS);
    res.json(settings);
  });

  app.post('/api/settings', requireOwnerAuth, (req: Request, res: Response) => {
    const current = readJsonFile<any>(SETTINGS_FILE, DEFAULT_SETTINGS);
    const updated = { ...current, ...req.body };
    writeJsonFile(SETTINGS_FILE, updated);
    const items = readJsonFile<any[]>(ITEMS_FILE, DEFAULT_ITEMS);
    syncToSourceCode(items, updated);
    res.json(updated);
  });

  // Persist current data directly to source code
  app.post('/api/persist-to-source', requireOwnerAuth, (req: Request, res: Response) => {
    try {
      const { items, settings } = req.body || {};
      const currentItems = items && Array.isArray(items) ? items : readJsonFile(ITEMS_FILE, DEFAULT_ITEMS);
      const currentSettings = settings && typeof settings === 'object' ? settings : readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);

      writeJsonFile(ITEMS_FILE, currentItems);
      writeJsonFile(SETTINGS_FILE, currentSettings);
      syncToSourceCode(currentItems, currentSettings);

      res.json({
        success: true,
        message: '数据已永久固化写入网页源码 (src/data/storeData.ts)！即使更换设备或清除浏览器缓存，所有人打开看到的都是当前最新商品与设置。'
      });
    } catch (err: any) {
      console.error('Persist error:', err);
      res.status(500).json({ success: false, error: err?.message || '写入源码失败' });
    }
  });

  // 4. Test Email API
  app.post('/api/test-email', async (req: Request, res: Response) => {
    const settings = readJsonFile<any>(SETTINGS_FILE, DEFAULT_SETTINGS);
    const testOrder = {
      id: `TEST-${Date.now().toString().slice(-4)}`,
      buyerName: '测试买家 (张同学)',
      buyerEmail: 'buyer-test@example.com',
      buyerContact: '微信: test_buyer_wx',
      deliveryMethod: '在学校领取',
      shippingAddress: '学生公寓3号楼前',
      note: '这是一条自动测试邮件，用于验证发信功能是否正常。',
      items: [
        { title: '测试物品：富士相机', condition: '99新', quantity: 1, price: 1680 }
      ],
      totalAmount: 1680
    };

    const result = await sendNotificationEmail(settings, testOrder);
    if (result.success) {
      res.json({ success: true, message: `测试邮件已成功发送至 ${settings.sellerEmail}，请检查收件箱（或垃圾箱）` });
    } else {
      res.status(400).json({ success: false, error: result.error || '测试发信失败，请检查 SMTP 账号与授权码' });
    }
  });

  // 5. Visitor Cookie Session API (Long-lived 365 days)
  app.get('/api/visitor/session', (req: Request, res: Response) => {
    const rawCookies = req.headers.cookie || '';
    let email = '';
    let name = '';
    rawCookies.split(';').forEach((c) => {
      const parts = c.split('=');
      const k = parts[0]?.trim();
      const v = parts.slice(1).join('=').trim();
      if (k === 'visitor_buyer_email') email = decodeURIComponent(v);
      if (k === 'visitor_buyer_name') name = decodeURIComponent(v);
    });
    res.json({ email, name });
  });

  app.post('/api/visitor/session', (req: Request, res: Response) => {
    const { email, name } = req.body;
    if (email) {
      const maxAgeSeconds = 365 * 24 * 60 * 60;
      res.setHeader('Set-Cookie', [
        `visitor_buyer_email=${encodeURIComponent(email)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`,
        `visitor_buyer_name=${encodeURIComponent(name || '')}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`,
      ]);
    }
    res.json({ success: true, email, name });
  });

  app.delete('/api/visitor/session', (req: Request, res: Response) => {
    res.setHeader('Set-Cookie', [
      `visitor_buyer_email=; Max-Age=0; Path=/; SameSite=Lax`,
      `visitor_buyer_name=; Max-Age=0; Path=/; SameSite=Lax`,
    ]);
    res.json({ success: true });
  });

  // 6. Reset Data API
  app.post('/api/data/reset', (req: Request, res: Response) => {
    writeJsonFile(ITEMS_FILE, DEFAULT_ITEMS);
    writeJsonFile(ORDERS_FILE, []);
    writeJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
    res.json({ success: true, message: '数据已恢复默认初始状态' });
  });

  // Serve static assets from public directory
  app.use(express.static(path.join(__dirname, 'public')));

  // Setup Vite in middleware mode for dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

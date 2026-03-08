/**
 * api/create-invoice.js — Vercel Serverless Function
 * Создаёт платёжный счёт Telegram Stars (XTR) через Bot API.
 *
 * POST /api/create-invoice
 * Body: { productId: string, userId: number }
 * Response: { invoiceLink: string }
 */

const PRODUCTS = {
  hints_pack: {
    title:       'Пакет подсказок ×5',
    description: '5 подсказок для прохождения сложных уровней',
    payload:     'hints_pack_5',
    price:       50,
  },
  no_ads: {
    title:       'Отключение рекламы',
    description: 'Убирает рекламные паузы навсегда',
    payload:     'no_ads_permanent',
    price:       100,
  },
  infinite_lives: {
    title:       'Бесконечные жизни 24ч',
    description: '24 часа игры без ограничений на жизни',
    payload:     'infinite_lives_24h',
    price:       150,
  },
};

export default async function handler(req, res) {
  // CORS — разрешаем только с Telegram Mini App (или .vercel.app домена)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { productId, userId } = req.body ?? {};

  if (!productId || !PRODUCTS[productId]) {
    return res.status(400).json({ error: 'Invalid productId' });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'BOT_TOKEN not configured' });
  }

  const product = PRODUCTS[productId];

  try {
    const apiUrl  = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;
    const payload = JSON.stringify({
      title:       product.title,
      description: product.description,
      payload:     `${product.payload}:${userId ?? 'anon'}`,
      currency:    'XTR',           // Telegram Stars
      prices:      [{ label: product.title, amount: product.price }],
      // Для XTR provider_token не нужен
    });

    const response = await fetch(apiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    payload,
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[Invoice] Telegram API error:', data.description);
      return res.status(502).json({ error: data.description });
    }

    return res.status(200).json({ invoiceLink: data.result });

  } catch (err) {
    console.error('[Invoice] Fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

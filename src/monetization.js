/**
 * monetization.js — Логика Telegram Stars.
 * ПОЛНОСТЬЮ отделена от игровой логики.
 *
 * Флоу покупки:
 *  1. Клиент вызывает purchase(productId)
 *  2. Запрос к /api/create-invoice (Vercel serverless)
 *  3. Получаем invoiceLink от Telegram Bot API
 *  4. Telegram.WebApp.openInvoice(link, callback)
 *  5. При status='paid' → activateProduct() → обновляем Storage
 */

import { SHOP_PRODUCTS } from '../config.js';
import { Storage }        from './storage.js';

// ──────────────────────────────────────
// Вспомогательные функции
// ──────────────────────────────────────

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

async function createInvoiceLink(productId) {
  const resp = await fetch('/api/create-invoice', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      userId: typeof Telegram !== 'undefined'
        ? Telegram.WebApp.initDataUnsafe?.user?.id
        : 'dev_user',
    }),
  });

  if (!resp.ok) throw new Error(`Invoice API error: ${resp.status}`);
  const { invoiceLink } = await resp.json();
  return invoiceLink;
}

// ──────────────────────────────────────
// Активация продукта после оплаты
// ──────────────────────────────────────

async function activateProduct(productId) {
  const product = SHOP_PRODUCTS[productId];
  if (!product) return;

  switch (productId) {
    case 'hints_pack':
      await Storage.addHints(product.quantity);
      showToast(`✅ +${product.quantity} подсказок добавлено!`);
      break;

    case 'no_ads':
      await Storage.activateNoAds();
      showToast('✅ Реклама отключена навсегда!');
      break;

    case 'infinite_lives':
      await Storage.activateInfiniteLives(product.durationHours);
      showToast('✅ Бесконечные жизни на 24 часа!');
      break;
  }

  await Storage.recordPurchase(product.price);

  // Сообщаем Telegram что покупка завершена
  if (typeof Telegram !== 'undefined') {
    Telegram.WebApp.HapticFeedback?.notificationOccurred('success');
  }
}

// ──────────────────────────────────────
// Публичный API монетизации
// ──────────────────────────────────────

export const Monetization = {

  /**
   * Открыть магазин Stars
   * @param {string} productId — ключ из SHOP_PRODUCTS
   */
  async purchase(productId) {
    const product = SHOP_PRODUCTS[productId];
    if (!product) {
      console.error('[Monetization] Unknown product:', productId);
      return;
    }

    // В Telegram Mini App
    if (typeof Telegram !== 'undefined' && Telegram.WebApp?.openInvoice) {
      try {
        const link = await createInvoiceLink(productId);

        Telegram.WebApp.openInvoice(link, async (status) => {
          if (status === 'paid') {
            await activateProduct(productId);
            // Диспатчим кастомное событие — GameScene слушает его
            window.dispatchEvent(new CustomEvent('bolt:purchase', { detail: { productId } }));
          } else if (status === 'cancelled') {
            showToast('Покупка отменена');
          } else if (status === 'failed') {
            showToast('⚠️ Ошибка оплаты. Попробуй ещё раз.');
          }
        });
      } catch (err) {
        console.error('[Monetization] Invoice error:', err);
        showToast('⚠️ Не удалось создать счёт');
      }

    // Режим разработки (не в Telegram)
    } else {
      console.log(`[DEV] Simulating purchase of "${productId}" for ${product.price}⭐`);
      await activateProduct(productId);
      window.dispatchEvent(new CustomEvent('bolt:purchase', { detail: { productId } }));
    }
  },

  /** Показать/спрятать модалку магазина */
  openShopModal() {
    const modal = document.getElementById('shop-modal');
    if (!modal) return;
    this.renderShopItems();
    modal.classList.remove('hidden');
    if (typeof Telegram !== 'undefined') {
      Telegram.WebApp.HapticFeedback?.impactOccurred('medium');
    }
  },

  closeShopModal() {
    document.getElementById('shop-modal')?.classList.add('hidden');
  },

  /** Рендер карточек товаров */
  async renderShopItems() {
    const container = document.getElementById('shop-items');
    if (!container) return;

    const [noAds, infLives] = await Promise.all([
      Storage.hasNoAds(),
      Storage.hasInfLives(),
    ]);

    container.innerHTML = '';

    for (const [id, p] of Object.entries(SHOP_PRODUCTS)) {
      const owned = (id === 'no_ads' && noAds) || (id === 'infinite_lives' && infLives);
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = `
        <div class="shop-item-info">
          <h3>${p.title}</h3>
          <p>${p.description}</p>
        </div>
        <button class="btn-buy" data-product="${id}" ${owned ? 'disabled' : ''}>
          ${owned ? '✓ Куплено' : `${p.price} ⭐`}
        </button>`;
      container.appendChild(div);
    }

    container.querySelectorAll('.btn-buy:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', () => this.purchase(btn.dataset.product));
    });
  },

  /** Инициализация — навешиваем обработчики кнопок */
  init() {
    document.getElementById('btn-shop')?.addEventListener('click', () => this.openShopModal());
    document.getElementById('btn-close-shop')?.addEventListener('click', () => this.closeShopModal());

    // Закрытие по клику на фон
    document.getElementById('shop-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeShopModal();
    });
  },
};

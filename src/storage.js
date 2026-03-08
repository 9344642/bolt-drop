/**
 * storage.js — Обёртка над Telegram.WebApp.CloudStorage
 * Fallback на localStorage для разработки вне Telegram.
 */

const isTelegram = typeof Telegram !== 'undefined' && Telegram.WebApp?.CloudStorage;

// ──────────────────────────────────────
// Примитивы CloudStorage (промисы)
// ──────────────────────────────────────

function csGet(key) {
  return new Promise((resolve, reject) => {
    if (isTelegram) {
      Telegram.WebApp.CloudStorage.getItem(key, (err, val) =>
        err ? reject(err) : resolve(val ?? null));
    } else {
      resolve(localStorage.getItem(key));
    }
  });
}

function csSet(key, value) {
  return new Promise((resolve, reject) => {
    if (isTelegram) {
      Telegram.WebApp.CloudStorage.setItem(key, value, (err) =>
        err ? reject(err) : resolve());
    } else {
      localStorage.setItem(key, value);
      resolve();
    }
  });
}

function csGetMulti(keys) {
  return new Promise((resolve, reject) => {
    if (isTelegram) {
      Telegram.WebApp.CloudStorage.getItems(keys, (err, vals) =>
        err ? reject(err) : resolve(vals));
    } else {
      const result = {};
      keys.forEach(k => { result[k] = localStorage.getItem(k); });
      resolve(result);
    }
  });
}

// ──────────────────────────────────────
// Схема данных пользователя
// ──────────────────────────────────────

const DEFAULT_PROFILE = {
  level:          1,       // текущий уровень (1-100)
  stars3:         [],      // уровни с 3 звёздами [levelId, ...]
  stars2:         [],      // уровни с 2 звёздами
  lives:          3,       // текущие жизни
  livesTs:        0,       // timestamp последней потери жизни
  hints:          0,       // кол-во подсказок
  noAds:          false,   // куплено отключение рекламы
  infiniteLivesTs: 0,      // timestamp покупки ∞ жизней (0 = не куплено)
  totalStarsSpent: 0,
  gamesPlayed:    0,
  achievements:   [],
};

// ──────────────────────────────────────
// Публичный API
// ──────────────────────────────────────

export const Storage = {

  /** Загрузить профиль целиком */
  async loadProfile() {
    const raw = await csGet('profile');
    if (!raw) return { ...DEFAULT_PROFILE };
    try {
      return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  },

  /** Сохранить профиль целиком */
  async saveProfile(profile) {
    await csSet('profile', JSON.stringify(profile));
  },

  /** Патч профиля — передавай только изменённые поля */
  async patchProfile(patch) {
    const profile = await this.loadProfile();
    const updated = { ...profile, ...patch };
    await this.saveProfile(updated);
    return updated;
  },

  // ── Жизни ───────────────────────────

  async getLives() {
    const p = await this.loadProfile();
    return this._calcLives(p);
  },

  /** Рассчитать актуальное кол-во жизней с учётом регенерации */
  _calcLives(profile) {
    const REGEN_MS = 30 * 60 * 1000; // 30 минут
    const MAX = 3;
    if (profile.infiniteLivesTs > Date.now()) return 99;
    const elapsed = Date.now() - profile.livesTs;
    const regened = Math.floor(elapsed / REGEN_MS);
    return Math.min(MAX, profile.lives + regened);
  },

  async loseLife() {
    const p = await this.loadProfile();
    const current = this._calcLives(p);
    if (current <= 0) return 0;
    await this.saveProfile({ ...p, lives: current - 1, livesTs: Date.now() });
    return current - 1;
  },

  // ── Уровни / прогресс ───────────────

  async completeLevel(levelId, starsEarned) {
    const p = await this.loadProfile();
    const nextLevel = Math.max(p.level, levelId + 1);

    let stars3 = [...p.stars3];
    let stars2 = [...p.stars2];

    if (starsEarned === 3 && !stars3.includes(levelId)) stars3.push(levelId);
    if (starsEarned >= 2 && !stars2.includes(levelId)) stars2.push(levelId);

    await this.saveProfile({ ...p, level: nextLevel, stars3, stars2, gamesPlayed: p.gamesPlayed + 1 });
  },

  // ── Монетизация ──────────────────────

  async addHints(qty) {
    const p = await this.loadProfile();
    return this.saveProfile({ ...p, hints: p.hints + qty });
  },

  async useHint() {
    const p = await this.loadProfile();
    if (p.hints <= 0) return false;
    await this.saveProfile({ ...p, hints: p.hints - 1 });
    return true;
  },

  async activateNoAds() {
    return this.patchProfile({ noAds: true });
  },

  async activateInfiniteLives(hours = 24) {
    const ts = Date.now() + hours * 3600 * 1000;
    return this.patchProfile({ infiniteLivesTs: ts, lives: 3 });
  },

  async recordPurchase(stars) {
    const p = await this.loadProfile();
    return this.saveProfile({ ...p, totalStarsSpent: p.totalStarsSpent + stars });
  },

  // ── Утилиты ──────────────────────────

  async getHints()   { return (await this.loadProfile()).hints; },
  async hasNoAds()   { return (await this.loadProfile()).noAds; },
  async hasInfLives(){ const p = await this.loadProfile(); return p.infiniteLivesTs > Date.now(); },
};

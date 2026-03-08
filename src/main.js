/**
 * main.js — Точка входа. Инициализирует Phaser 3 + UI.
 */
import Phaser          from 'phaser';
import { GAME_CONFIG } from '../config.js';
import { Monetization } from './monetization.js';
import { Storage }     from './storage.js';
import { BootScene }   from './scenes/BootScene.js';
import { MenuScene }   from './scenes/MenuScene.js';
import { GameScene }   from './scenes/GameScene.js';

// ── Применяем CSS-переменные темы динамически ────────────────────
import { THEME } from '../config.js';
const root = document.documentElement;
Object.entries(THEME.css).forEach(([prop, val]) => root.style.setProperty(prop, val));

// ── Конфиг Phaser ───────────────────────────────────────────────
const phaserConfig = {
  type:   Phaser.AUTO,
  width:  GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-container',
  transparent: true,
  scale: {
    mode:            Phaser.Scale.FIT,
    autoCenter:      Phaser.Scale.CENTER_BOTH,
    width:           GAME_CONFIG.width,
    height:          GAME_CONFIG.height,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 1 },
      debug:   import.meta.env?.DEV ?? false,  // debug только в dev
      setBounds: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene],
  input: {
    activePointers: 2,
  },
  render: {
    antialias:       true,
    pixelArt:        false,
    roundPixels:     false,
  },
  backgroundColor: '#0a0a1a',
};

// ── Запуск ──────────────────────────────────────────────────────
const game = new Phaser.Game(phaserConfig);

// ── UI: монетизация, HUD жизней ─────────────────────────────────
Monetization.init();

async function initHUD() {
  const profile = await Storage.loadProfile();
  const lives   = Storage._calcLives(profile);

  // Иконки жизней
  const livesEl = document.getElementById('lives-icons');
  if (livesEl) {
    for (let i = 0; i < GAME_CONFIG.maxLives; i++) {
      const span = document.createElement('span');
      span.className = 'life-icon' + (i >= lives ? ' empty' : '');
      span.textContent = '❤️';
      livesEl.appendChild(span);
    }
  }

  // Подсказки
  const hintsEl = document.getElementById('hints-num');
  if (hintsEl) hintsEl.textContent = String(profile.hints);
}

initHUD();

// ── Обработка события back button (Telegram) ────────────────────
if (typeof Telegram !== 'undefined') {
  Telegram.WebApp.BackButton.onClick(() => {
    const activeScene = game.scene.getScenes(true)[0];
    if (activeScene?.scene?.key === 'Game') {
      activeScene.scene.start('Menu');
      Telegram.WebApp.BackButton.hide();
    } else {
      Telegram.WebApp.close();
    }
  });
}

export default game;

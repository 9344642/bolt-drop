/**
 * MenuScene.js — Главное меню с сеткой уровней
 */
import Phaser from 'phaser';
import { THEME, GAME_CONFIG }  from '../../config.js';
import { Storage }              from '../storage.js';
import { LEVELS, TOTAL_LEVELS } from '../levels.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'Menu' }); }

  async create() {
    const { width, height } = this.cameras.main;
    const cx = width / 2;

    // Фон
    this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);
    this._addGrid(width, height);

    // Заголовок
    this.add.text(cx, 60, 'BOLT DROP', {
      fontFamily: 'Orbitron, monospace',
      fontSize: 36,
      fontStyle: 'bold',
      color: '#00fff5',
    }).setOrigin(0.5);

    this.add.text(cx, 100, THEME.name.toUpperCase() + ' — ДЕНЬ ' + THEME.day, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: 12,
      color: '#ff00a8',
      letterSpacing: 3,
    }).setOrigin(0.5);

    // Профиль пользователя
    const profile = await Storage.loadProfile();
    const lives = Storage._calcLives(profile);

    this.add.text(cx - 100, 136, `❤️ ${lives}/${GAME_CONFIG.maxLives}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: 14,
      color: '#ff00a8',
    }).setOrigin(0.5);

    this.add.text(cx + 100, 136, `💡 ${profile.hints}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: 14,
      color: '#00fff5',
    }).setOrigin(0.5);

    // Кнопка "?" — правила
    const helpBtn = this.add.text(cx + 110, 210, '?', {
      fontFamily: 'Orbitron, monospace',
      fontSize: 22,
      fontStyle: 'bold',
      color: '#ff00a8',
      backgroundColor: '#1a1a3e',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', () => this._showRules());

    // Кнопка "Играть" (быстрый старт)
    const playBtn = this.add.container(cx - 15, 210);
    const playBg  = this.add.rectangle(0, 0, 200, 52, 0x00fff5).setOrigin(0.5);
    const playTxt = this.add.text(0, 0, '▶  ИГРАТЬ', {
      fontFamily: 'Orbitron, monospace',
      fontSize: 18,
      fontStyle: 'bold',
      color: '#0a0a1a',
    }).setOrigin(0.5);
    playBtn.add([playBg, playTxt]);
    playBtn.setInteractive(new Phaser.Geom.Rectangle(-100, -26, 200, 52), Phaser.Geom.Rectangle.Contains);
    playBtn.on('pointerdown', () => {
      this._haptic('medium');
      this.scene.start('Game', { levelId: profile.level });
    });
    playBtn.on('pointerover',  () => playBg.setFillStyle(0x00cccc));
    playBtn.on('pointerout',   () => playBg.setFillStyle(0x00fff5));

    // Сетка уровней
    this._renderLevelGrid(profile, width, height);

    // Подсказка прокрутки
    this.add.text(cx, height - 20, 'Нажми на уровень для выбора', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: 10,
      color: '#ffffff',
      alpha: 0.3,
    }).setOrigin(0.5);

    // Показать правила при первом запуске
    if (profile.gamesPlayed === 0 && !profile.tutorialSeen) {
      this.time.delayedCall(400, () => this._showRules(true));
    }
  }

  _showRules(isFirst = false) {
    this._haptic('light');

    // Убираем старый туториал если есть
    document.getElementById('tutorial-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'tutorial-modal';
    modal.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.85);
      z-index:200; display:flex; align-items:flex-end; justify-content:center;
    `;

    modal.innerHTML = `
      <div style="
        width:100%; max-width:450px;
        background:#0f0f2e; border-top:2px solid #00fff5;
        border-radius:20px 20px 0 0; padding:24px 20px 40px;
        font-family:'Share Tech Mono',monospace; color:#e0e0ff;
        animation: slideUp 0.3s ease-out;
      ">
        <h2 style="font-family:'Orbitron',monospace;font-size:18px;color:#00fff5;
          text-align:center;letter-spacing:3px;margin-bottom:20px;">
          КАК ИГРАТЬ
        </h2>

        <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;line-height:1.6;">

          <div style="display:flex;align-items:flex-start;gap:12px;">
            <span style="font-size:28px;min-width:36px;">🔩</span>
            <span><b style="color:#ff00a8;">Нажми на болт</b> — он откручивается.<br>
            Когда все болты платформы сняты — она падает вниз.</span>
          </div>

          <div style="display:flex;align-items:flex-start;gap:12px;">
            <span style="font-size:28px;min-width:36px;">🟡</span>
            <span><b style="color:#ffe600;">Шар</b> падает под действием гравитации.<br>
            Убирай платформы, чтобы расчистить ему путь.</span>
          </div>

          <div style="display:flex;align-items:flex-start;gap:12px;">
            <span style="font-size:28px;min-width:36px;">◉</span>
            <span>Направь шар в <b style="color:#00fff5;">светящуюся цель</b> внизу.<br>
            Попал — уровень пройден!</span>
          </div>

          <div style="display:flex;align-items:flex-start;gap:12px;">
            <span style="font-size:28px;min-width:36px;">⭐</span>
            <span><b style="color:#ffe600;">Звёзды за эффективность:</b><br>
            ⭐⭐⭐ — снял минимум болтов<br>
            ⭐⭐ — чуть больше нормы<br>
            ⭐ — добрался до цели любым путём</span>
          </div>

          <div style="display:flex;align-items:flex-start;gap:12px;">
            <span style="font-size:28px;min-width:36px;">🟥</span>
            <span><b style="color:#ff2222;">Красные платформы</b> — опасные.<br>
            Шар на них — мгновенный проигрыш!</span>
          </div>

          <div style="display:flex;align-items:flex-start;gap:12px;">
            <span style="font-size:28px;min-width:36px;">💡</span>
            <span>Кнопка <b style="color:#00fff5;">💡</b> покажет какой болт снять следующим.<br>
            Подсказки можно купить в магазине ⭐</span>
          </div>
        </div>

        <button id="btn-close-tutorial" style="
          display:block; width:100%; margin-top:24px; padding:14px;
          background:#00fff5; border:none; border-radius:12px;
          font-family:'Orbitron',monospace; font-size:15px; font-weight:bold;
          color:#0a0a1a; cursor:pointer; letter-spacing:2px;
        ">${isFirst ? '▶ НАЧАТЬ ИГРАТЬ' : 'ПОНЯЛ!'}</button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btn-close-tutorial').addEventListener('click', async () => {
      modal.remove();
      if (isFirst) {
        await Storage.patchProfile({ tutorialSeen: true });
      }
    });

    // Закрытие по фону
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  _addGrid(width, height) {
    const g = this.add.graphics();
    g.lineStyle(1, 0x00fff5, 0.05);
    for (let x = 0; x < width; x += 40) { g.moveTo(x, 0); g.lineTo(x, height); }
    for (let y = 0; y < height; y += 40) { g.moveTo(0, y); g.lineTo(width, y); }
    g.strokePath();
  }

  _renderLevelGrid(profile, width) {
    const COLS = 5, CELL = 56, MARGIN = 20;
    const startX = (width - COLS * CELL + (CELL - 44)) / 2 + 22;
    const startY = 260;

    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const lvl  = LEVELS[i];
      const col  = i % COLS;
      const row  = Math.floor(i / COLS);
      const x    = startX + col * CELL;
      const y    = startY + row * CELL;
      const id   = lvl.id;
      const unlocked = id <= profile.level;
      const stars3   = profile.stars3.includes(id);
      const stars2   = profile.stars2.includes(id);

      // Фон ячейки
      const bg = this.add.rectangle(x, y, 44, 44,
        unlocked ? (stars3 ? 0x003333 : 0x1a1a3e) : 0x111118, 1)
        .setStrokeStyle(1, unlocked ? 0x00fff5 : 0x333366);

      // Номер уровня
      this.add.text(x, y - 4, String(id), {
        fontFamily: 'Orbitron, monospace',
        fontSize: unlocked ? 14 : 12,
        color: unlocked ? '#e0e0ff' : '#444488',
      }).setOrigin(0.5);

      // Звёзды
      if (unlocked) {
        const starStr = stars3 ? '⭐⭐⭐' : stars2 ? '⭐⭐' : id < profile.level ? '⭐' : '';
        if (starStr) {
          this.add.text(x, y + 12, starStr, { fontSize: 8 }).setOrigin(0.5);
        }
      } else {
        this.add.text(x, y + 10, '🔒', { fontSize: 12 }).setOrigin(0.5);
      }

      // Клик
      if (unlocked) {
        bg.setInteractive();
        bg.on('pointerdown', () => {
          this._haptic('light');
          this.scene.start('Game', { levelId: id });
        });
        bg.on('pointerover',  () => bg.setFillStyle(0x002244));
        bg.on('pointerout',   () => bg.setFillStyle(stars3 ? 0x003333 : 0x1a1a3e));
      }
    }
  }

  _haptic(type = 'light') {
    if (typeof Telegram !== 'undefined') {
      Telegram.WebApp.HapticFeedback?.impactOccurred(type);
    }
  }
}

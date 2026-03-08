/**
 * BootScene.js — Инициализация Telegram WebApp + загрузка ассетов
 */
import { THEME } from '../../config.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'Boot' }); }

  preload() {
    // ── Telegram WebApp init ──────────────
    if (typeof Telegram !== 'undefined') {
      Telegram.WebApp.ready();
      Telegram.WebApp.expand();
      Telegram.WebApp.disableVerticalSwipes?.();
    }

    // ── Прогресс-бар загрузки ─────────────
    this._createLoadingBar();

    // ── Заглушки ассетов (пока нет реальных файлов) ──
    // В продакшене замени на реальные изображения из THEME.assets
    this._createFallbackTextures();

    // ── Звуки ────────────────────────────
    // this.load.audio('bgMusic',   THEME.assets.bgMusic);
    // this.load.audio('sfxBolt',   THEME.assets.sfxBolt);
    // this.load.audio('sfxWin',    THEME.assets.sfxWin);
    // this.load.audio('sfxLose',   THEME.assets.sfxLose);
  }

  _createLoadingBar() {
    const { width, height } = this.cameras.main;
    const cx = width / 2, cy = height / 2;

    // Фон
    this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

    // Логотип / название
    this.add.text(cx, cy - 80, 'BOLT DROP', {
      fontFamily: 'Orbitron, monospace',
      fontSize:   32,
      color:      '#00fff5',
      stroke:     '#00fff5',
      strokeThickness: 1,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 44, THEME.name.toUpperCase(), {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize:   14,
      color:      '#ff00a8',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // Полоска прогресса
    const barW = 240, barH = 8;
    const barBg = this.add.rectangle(cx, cy + 20, barW, barH, 0x1a1a3e).setOrigin(0.5);
    const barFg = this.add.rectangle(cx - barW / 2, cy + 20, 0, barH, 0x00fff5).setOrigin(0, 0.5);

    this.load.on('progress', v => { barFg.width = barW * v; });
    this.load.on('complete', () => { barFg.width = barW; });
  }

  _createFallbackTextures() {
    // Генерируем процедурные текстуры через Graphics, если реальных нет
    const g = this.make.graphics({ add: false });

    // ball
    g.clear();
    g.fillStyle(0xffe600).fillCircle(20, 20, 18);
    g.strokeCircle(20, 20, 18);
    g.generateTexture('ball', 40, 40);

    // platform plank
    g.clear();
    g.fillStyle(0x1a1a3e).fillRect(0, 0, 160, 16);
    g.lineStyle(2, 0x00fff5).strokeRect(0, 0, 160, 16);
    g.generateTexture('platform', 160, 16);

    // bolt
    g.clear();
    g.fillStyle(0xff00a8).fillCircle(12, 12, 10);
    g.lineStyle(2, 0xff69c8).strokeCircle(12, 12, 10);
    g.generateTexture('bolt', 24, 24);

    // goal cup
    g.clear();
    g.fillStyle(0x00fff5, 0.3).fillCircle(24, 24, 22);
    g.lineStyle(3, 0x00fff5).strokeCircle(24, 24, 22);
    g.generateTexture('goal', 48, 48);

    // danger (красная платформа)
    g.clear();
    g.fillStyle(0x330000).fillRect(0, 0, 160, 16);
    g.lineStyle(2, 0xff2222).strokeRect(0, 0, 160, 16);
    g.generateTexture('danger_platform', 160, 16);

    // частица болта
    g.clear();
    g.fillStyle(0xff00a8).fillRect(0, 0, 4, 4);
    g.generateTexture('particle_bolt', 4, 4);

    // частица победы
    g.clear();
    g.fillStyle(0x00fff5).fillStar(6, 6, 5, 6, 3);
    g.generateTexture('particle_win', 12, 12);

    g.destroy();
  }

  create() {
    this.scene.start('Menu');
  }
}

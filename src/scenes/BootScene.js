/**
 * BootScene.js — Инициализация Telegram WebApp + генерация процедурных текстур
 */
import { THEME } from '../../config.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'Boot' }); }

  preload() {
    if (typeof Telegram !== 'undefined') {
      Telegram.WebApp.ready();
      Telegram.WebApp.expand();
      Telegram.WebApp.disableVerticalSwipes?.();
    }
    this._createLoadingBar();
  }

  create() {
    this._createFallbackTextures();
    this.scene.start('Menu');
  }

  _createLoadingBar() {
    const { width, height } = this.cameras.main;
    const cx = width / 2, cy = height / 2;

    this.add.rectangle(0, 0, width, height, 0x0a0a1a).setOrigin(0);

    this.add.text(cx, cy - 60, 'BOLT DROP', {
      fontFamily: 'monospace',
      fontSize: 32,
      fontStyle: 'bold',
      color: '#00fff5',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 24, THEME.name.toUpperCase(), {
      fontFamily: 'monospace',
      fontSize: 14,
      color: '#ff00a8',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 10, 'Загрузка...', {
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#555599',
    }).setOrigin(0.5);
  }

  _createFallbackTextures() {
    const g = this.make.graphics({ add: false });

    // ── ball (жёлтый круг) ──────────────────
    g.clear();
    g.fillStyle(0xffe600);
    g.fillCircle(20, 20, 18);
    g.lineStyle(2, 0xffaa00);
    g.strokeCircle(20, 20, 18);
    // Блик
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(13, 13, 5);
    g.generateTexture('ball', 40, 40);

    // ── platform (тёмно-синяя планка) ───────
    g.clear();
    g.fillStyle(0x1a1a3e);
    g.fillRect(0, 0, 160, 16);
    g.lineStyle(2, 0x00fff5);
    g.strokeRect(0, 0, 160, 16);
    g.lineStyle(1, 0x00fff5, 0.25);
    for (let x = 20; x < 160; x += 20) {
      g.moveTo(x, 0); g.lineTo(x, 16);
    }
    g.strokePath();
    g.generateTexture('platform', 160, 16);

    // ── danger platform (красная) ────────────
    g.clear();
    g.fillStyle(0x330000);
    g.fillRect(0, 0, 160, 16);
    g.lineStyle(2, 0xff2222);
    g.strokeRect(0, 0, 160, 16);
    g.generateTexture('danger_platform', 160, 16);

    // ── bolt (маджента круг с крестом) ───────
    g.clear();
    g.fillStyle(0xff00a8);
    g.fillCircle(14, 14, 12);
    g.lineStyle(2, 0xff69c8);
    g.strokeCircle(14, 14, 12);
    g.lineStyle(2, 0xffffff, 0.7);
    g.moveTo(9, 14); g.lineTo(19, 14);
    g.moveTo(14, 9); g.lineTo(14, 19);
    g.strokePath();
    g.generateTexture('bolt', 28, 28);

    // ── goal (циановое кольцо) ───────────────
    g.clear();
    g.fillStyle(0x00fff5, 0.15);
    g.fillCircle(28, 28, 26);
    g.lineStyle(3, 0x00fff5, 0.9);
    g.strokeCircle(28, 28, 26);
    g.lineStyle(1, 0x00fff5, 0.4);
    g.strokeCircle(28, 28, 34);
    g.generateTexture('goal', 56, 56);

    // ── particle_bolt (маленькая точка) ──────
    g.clear();
    g.fillStyle(0xff00a8);
    g.fillCircle(3, 3, 3);
    g.generateTexture('particle_bolt', 6, 6);

    // ── particle_win (маленький ромб) ────────
    g.clear();
    g.fillStyle(0x00fff5);
    g.fillTriangle(6, 0, 12, 6, 6, 12);
    g.fillTriangle(6, 12, 0, 6, 6, 0);
    g.generateTexture('particle_win', 12, 12);

    g.destroy();
  }
}

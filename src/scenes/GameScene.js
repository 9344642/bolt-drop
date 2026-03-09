/**
 * GameScene.js — Основная игровая сцена
 * Движок: Phaser 3 + Matter.js
 * Механика: тап по болту → платформа падает → шар катится в цель
 */
import Phaser from 'phaser';
import { THEME, GAME_CONFIG }    from '../../config.js';
import { getLevel, calcStars }   from '../levels.js';
import { Storage }               from '../storage.js';

const C = THEME.colors;
const P = THEME.physics;

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'Game' }); }

  // ── Инициализация ─────────────────────────────────────────────

  init(data) {
    this.levelId   = data.levelId ?? 1;
    this.levelData = getLevel(this.levelId);
    this.boltsUsed = 0;
    this.isOver    = false;
    this.platforms = [];  // { body, boltSprites, remainingBolts, isDanger }
    this.hintMode  = false;
    this.ballBody  = null;
    this.goalZone  = null;
  }

  // ── Загрузка ──────────────────────────────────────────────────

  create() {
    const { width, height } = this.cameras.main;
    this.W = width; this.H = height;

    this._setupPhysics();
    this._drawBackground();
    this._createGoal();
    this._createPlatforms();
    this._createBall();
    this._createBoundaries();
    this._setupCollisions();
    this._renderHUD();

    // Слушаем покупки из магазина
    window.addEventListener('bolt:purchase', this._onPurchase.bind(this), { once: false });

    // Кнопка подсказки
    document.getElementById('btn-hint')?.addEventListener('click', () => this._useHint(), { once: false });

    // Кнопка меню — возврат в MenuScene
    this._menuHandler = () => {
      if (typeof Telegram !== 'undefined') {
        Telegram.WebApp.HapticFeedback?.impactOccurred('light');
      }
      // Убираем result-overlay если есть
      document.querySelector('.result-overlay')?.remove();
      this.scene.start('Menu');
    };
    document.getElementById('btn-menu')?.addEventListener('click', this._menuHandler);
  }

  // ── Физический мир ────────────────────────────────────────────

  _setupPhysics() {
    this.matter.world.setGravity(0, P.gravity);
    this.matter.world.on('collisionstart', this._onCollision.bind(this));
  }

  _createBoundaries() {
    const { W, H } = this;
    // Стены и потолок
    const opts = { isStatic: true, label: 'wall', friction: 0 };
    this.matter.add.rectangle(-10, H / 2, 20, H, opts);   // левая
    this.matter.add.rectangle(W + 10, H / 2, 20, H, opts); // правая
    this.matter.add.rectangle(W / 2, -10, W, 20, opts);    // потолок
    // Дно — сенсор (триггер проигрыша)
    this.matter.add.rectangle(W / 2, H + 10, W, 20, { isStatic: true, isSensor: true, label: 'pit' });
  }

  // ── Фон ───────────────────────────────────────────────────────

  _drawBackground() {
    const { W, H } = this;
    this.add.rectangle(0, 0, W, H, 0x0a0a1a).setOrigin(0);

    // Сетка
    const g = this.add.graphics();
    g.lineStyle(1, 0x00fff5, 0.04);
    for (let x = 0; x < W; x += 40) { g.moveTo(x, 0); g.lineTo(x, H); }
    for (let y = 0; y < H; y += 40) { g.moveTo(0, y); g.lineTo(W, y); }
    g.strokePath();
  }

  // ── Цель (goal) ───────────────────────────────────────────────

  _createGoal() {
    const [gx, gy] = this.levelData.goal;

    // Визуал
    const gfx = this.add.graphics();
    gfx.fillStyle(0x00fff5, 0.15).fillCircle(gx, gy, 28);
    gfx.lineStyle(3, 0x00fff5, 0.9).strokeCircle(gx, gy, 28);
    gfx.lineStyle(1, 0x00fff5, 0.4).strokeCircle(gx, gy, 36);

    this.add.text(gx, gy, '◉', {
      fontFamily: 'monospace',
      fontSize: 20,
      color: '#00fff5',
    }).setOrigin(0.5);

    // Физический сенсор
    this.goalZone = this.matter.add.circle(gx, gy, 28, {
      isStatic: true,
      isSensor: true,
      label: 'goal',
    });

    // Пульсирующая анимация
    this.tweens.add({
      targets: gfx,
      alpha: { from: 0.7, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ── Платформы ─────────────────────────────────────────────────

  _createPlatforms() {
    for (const pd of this.levelData.platforms) {
      this._createPlatform(pd);
    }
  }

  _createPlatform(pd) {
    const angleRad = Phaser.Math.DegToRad(pd.angle ?? 0);
    const color    = pd.danger ? 0x330000 : 0x1a1a3e;
    const border   = pd.danger ? 0xff2222 : 0x00fff5;
    const w        = pd.w ?? 160;
    const h        = THEME.visual.platformH;

    // Физическое тело (статик)
    const body = this.matter.add.rectangle(pd.x, pd.y, w, h, {
      isStatic: true,
      friction: P.platformFriction,
      restitution: P.platformRestitution,
      angle: angleRad,
      label: `platform_${pd.id}`,
    });

    // Визуал платформы
    const gfx = this.add.graphics();
    gfx.fillStyle(color).fillRect(-w / 2, -h / 2, w, h);
    gfx.lineStyle(2, border).strokeRect(-w / 2, -h / 2, w, h);
    // Декоративные рёбра (кибер-панк стиль)
    if (!pd.danger) {
      gfx.lineStyle(1, 0x00fff5, 0.3);
      for (let xi = -w / 2 + 20; xi < w / 2; xi += 20) {
        gfx.moveTo(xi, -h / 2).lineTo(xi, h / 2);
      }
    }
    const container = this.add.container(pd.x, pd.y, [gfx]);
    container.setRotation(angleRad);

    // Болты
    const boltSprites = [];
    const remainingBolts = new Set(pd.bolts);

    pd.bolts.forEach(boltSide => {
      const [bx, by] = this._boltLocalPos(boltSide, w, h);
      const wx = pd.x + bx * Math.cos(angleRad) - by * Math.sin(angleRad);
      const wy = pd.y + bx * Math.sin(angleRad) + by * Math.cos(angleRad);

      const boltGfx = this.add.graphics();
      this._drawBolt(boltGfx, 0, 0, false);
      boltGfx.setPosition(wx, wy);

      const zone = this.add.zone(wx, wy, P.boltRadius * 2.5, P.boltRadius * 2.5)
        .setInteractive();
      zone.on('pointerdown', () => this._removeBolt(pd.id, boltSide, body, remainingBolts, boltGfx, zone, container));

      boltSprites.push({ gfx: boltGfx, zone, side: boltSide });
    });

    this.platforms.push({ id: pd.id, body, container, boltSprites, remainingBolts, isDanger: pd.danger });
  }

  _boltLocalPos(side, w, h) {
    switch (side) {
      case 'left':   return [-w / 2, 0];
      case 'right':  return [ w / 2, 0];
      case 'center': return [0, 0];
      default:       return [0, 0];
    }
  }

  _drawBolt(gfx, x, y, highlighted = false) {
    gfx.clear();
    gfx.fillStyle(highlighted ? 0xffff00 : 0xff00a8);
    gfx.fillCircle(x, y, P.boltRadius);
    gfx.lineStyle(2, highlighted ? 0xffff88 : 0xff69c8);
    gfx.strokeCircle(x, y, P.boltRadius);
    // Крестик болта
    const s = P.boltRadius * 0.4;
    gfx.lineStyle(2, 0xffffff, 0.6);
    gfx.moveTo(x - s, y).lineTo(x + s, y);
    gfx.moveTo(x, y - s).lineTo(x, y + s);
    gfx.strokePath();
  }

  // ── Снятие болта ──────────────────────────────────────────────

  _removeBolt(platformId, boltSide, body, remaining, boltGfx, zone, container) {
    if (this.isOver || !remaining.has(boltSide)) return;

    remaining.delete(boltSide);
    this.boltsUsed++;

    // Анимация удаления болта
    this._spawnBoltParticles(boltGfx.x, boltGfx.y);
    this.tweens.add({
      targets: boltGfx,
      scaleX: 0, scaleY: 0, alpha: 0,
      duration: 200,
      ease: 'Back.In',
      onComplete: () => { boltGfx.destroy(); zone.destroy(); },
    });

    // Вибрация
    if (typeof Telegram !== 'undefined') {
      Telegram.WebApp.HapticFeedback?.impactOccurred('light');
    }

    // Если все болты сняты — платформа падает
    if (remaining.size === 0) {
      this.time.delayedCall(250, () => {
        this.matter.body.setStatic(body, false);
        // Слабый толчок для естественности
        this.matter.body.applyForce(body, body.position, { x: (Math.random() - 0.5) * 0.002, y: 0 });

        // Убрать визуал через 2 секунды
        this.time.delayedCall(2000, () => container.destroy());
      });
    }

    this._updateBoltsHUD();
  }

  // ── Шар ───────────────────────────────────────────────────────

  _createBall() {
    const [bx, by] = this.levelData.ball;

    this.ballBody = this.matter.add.circle(bx, by, P.ballRadius, {
      restitution: P.ballRestitution,
      friction:    P.ballFriction,
      frictionAir: P.airResistance,
      label:       'ball',
      density:     0.005,
    });

    // Визуал шара
    this.ballGfx = this.add.graphics();
    this._drawBallGfx();

    // Трейл (след)
    this.ballTrail = [];
  }

  _drawBallGfx() {
    this.ballGfx.clear();
    this.ballGfx.fillStyle(0xffe600);
    this.ballGfx.fillCircle(0, 0, P.ballRadius);
    this.ballGfx.lineStyle(2, 0xffaa00);
    this.ballGfx.strokeCircle(0, 0, P.ballRadius);
  }

  // ── Обновление ────────────────────────────────────────────────

  update() {
    if (!this.ballBody || this.isOver) return;

    const pos = this.ballBody.position;
    this.ballGfx.setPosition(pos.x, pos.y);

    // Трейл
    this.ballTrail.unshift({ x: pos.x, y: pos.y, alpha: 0.5 });
    if (this.ballTrail.length > 8) this.ballTrail.pop();
    // (рендер трейла опционален)

    // Выпал за нижнюю границу
    if (pos.y > this.H + 50) this._onLose();
  }

  // ── Коллизии ──────────────────────────────────────────────────

  _setupCollisions() {
    this.matter.world.on('collisionstart', (event) => {
      for (const pair of event.pairs) {
        const { bodyA, bodyB } = pair;

        // Шар попал в цель
        if (this._isCollision(bodyA, bodyB, 'ball', 'goal')) {
          this._onWin(); return;
        }

        // Шар попал в опасную платформу
        if (this._isCollision(bodyA, bodyB, 'ball', 'platform_') &&
            this._isDanger(bodyA.label, bodyB.label)) {
          this._onLose(); return;
        }

        // Шар улетел в яму
        if (this._isCollision(bodyA, bodyB, 'ball', 'pit')) {
          this._onLose(); return;
        }
      }
    });
  }

  _isCollision(a, b, labelA, labelB) {
    return (a.label === labelA && b.label?.startsWith(labelB)) ||
           (b.label === labelA && a.label?.startsWith(labelB));
  }

  _isDanger(la, lb) {
    const label = la.startsWith('platform') ? la : lb;
    const pd = this.levelData.platforms.find(p => `platform_${p.id}` === label);
    return pd?.danger === true;
  }

  // ── Победа / Поражение ────────────────────────────────────────

  async _onWin() {
    if (this.isOver) return;
    this.isOver = true;

    if (typeof Telegram !== 'undefined') {
      Telegram.WebApp.HapticFeedback?.notificationOccurred('success');
    }

    const stars = calcStars(this.levelData, this.boltsUsed);
    await Storage.completeLevel(this.levelId, stars);

    this._spawnWinParticles();

    this.time.delayedCall(600, () => {
      this._showResultScreen(true, stars);
    });
  }

  async _onLose() {
    if (this.isOver) return;
    this.isOver = true;

    if (typeof Telegram !== 'undefined') {
      Telegram.WebApp.HapticFeedback?.notificationOccurred('error');
    }

    if (THEME.visual.screenShake) {
      this.cameras.main.shake(300, 0.012);
    }

    const lives = await Storage.loseLife();
    this.time.delayedCall(400, () => {
      this._showResultScreen(false, 0, lives);
    });
  }

  _showResultScreen(won, stars, livesLeft = 3) {
    const overlay = document.createElement('div');
    overlay.className = 'result-overlay';

    if (won) {
      const starsStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      overlay.innerHTML = `
        <div class="result-title win">ЗАЧТЕНО!</div>
        <div style="font-size:32px;margin-bottom:16px">${starsStr}</div>
        <div style="font-size:13px;color:#aaa;margin-bottom:20px">Болтов снято: ${this.boltsUsed} / пар: ${this.levelData.par_bolts}</div>
        <button class="result-btn accent" id="btn-next">Следующий →</button>
        <button class="result-btn" id="btn-menu-r">В меню</button>`;
    } else {
      overlay.innerHTML = `
        <div class="result-title lose">ПРОВАЛ</div>
        <div style="font-size:13px;color:#aaa;margin-bottom:8px">Жизней осталось: ${'❤️'.repeat(livesLeft)}${'🖤'.repeat(Math.max(0,3-livesLeft))}</div>
        ${livesLeft <= 0 ? '<div style="font-size:12px;color:#ff8888;margin-bottom:12px">Жизни закончились! Купи бесконечные или подожди 30 мин.</div>' : ''}
        <button class="result-btn accent" id="btn-retry" ${livesLeft <= 0 ? 'disabled' : ''}>Повтор ↺</button>
        ${livesLeft <= 0 ? '<button class="result-btn" id="btn-buy-lives" style="border-color:#ffe600;color:#ffe600">❤️ 150 ⭐</button>' : ''}
        <button class="result-btn" id="btn-menu-r">В меню</button>`;
    }

    document.body.appendChild(overlay);

    document.getElementById('btn-next')?.addEventListener('click', () => {
      overlay.remove();
      this.scene.start('Game', { levelId: Math.min(this.levelId + 1, 100) });
    });
    document.getElementById('btn-retry')?.addEventListener('click', () => {
      overlay.remove();
      this.scene.restart({ levelId: this.levelId });
    });
    document.getElementById('btn-menu-r')?.addEventListener('click', () => {
      overlay.remove();
      this.scene.start('Menu');
    });
    document.getElementById('btn-buy-lives')?.addEventListener('click', () => {
      import('../monetization.js').then(m => m.Monetization.purchase('infinite_lives'));
    });
  }

  // ── Подсказка ─────────────────────────────────────────────────

  async _useHint() {
    if (this.isOver) return;
    const ok = await Storage.useHint();
    if (!ok) {
      // Нет подсказок — предложить купить
      import('../monetization.js').then(m => m.Monetization.openShopModal());
      return;
    }

    // Подсвечиваем следующий болт из solution
    const sol   = this.levelData.solution;
    const nextAction = sol[this.boltsUsed] ?? sol[sol.length - 1];
    if (!nextAction) return;

    const [pid, side] = nextAction.split(':');
    const plat = this.platforms.find(p => p.id === pid);
    if (!plat) return;

    const boltData = plat.boltSprites.find(b => b.side === side);
    if (!boltData) return;

    // Мигание
    this.tweens.add({
      targets: boltData.gfx,
      alpha: { from: 1, to: 0.2 },
      duration: 300,
      yoyo: true,
      repeat: 5,
    });

    this._updateHintsHUD();
  }

  // ── HUD ───────────────────────────────────────────────────────

  _renderHUD() {
    // Номер уровня
    const el = document.getElementById('level-num');
    if (el) el.textContent = String(this.levelId);
    this._updateBoltsHUD();
    this._updateHintsHUD();
  }

  _updateBoltsHUD() {
    // Дополнительный инфо-текст (встроен в сцену)
    if (this.boltsTxt) this.boltsTxt.destroy();
    this.boltsTxt = this.add.text(10, this.H - 30,
      `Болтов снято: ${this.boltsUsed}  Пар: ${this.levelData.par_bolts}`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 11,
        color: '#555599',
      });
  }

  async _updateHintsHUD() {
    const hints = await Storage.getHints();
    const el = document.getElementById('hints-num');
    if (el) el.textContent = String(hints);
  }

  // ── Частицы ───────────────────────────────────────────────────

  _spawnBoltParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const p = this.add.circle(x, y, 3, 0xff00a8);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  _spawnWinParticles() {
    const [gx, gy] = this.levelData.goal;
    const colors = [0x00fff5, 0xffe600, 0xff00a8];
    for (let i = 0; i < 24; i++) {
      const p = this.add.circle(gx, gy, 4 + Math.random() * 4, colors[i % 3]);
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 140;
      this.tweens.add({
        targets: p,
        x: gx + Math.cos(angle) * speed,
        y: gy + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 800 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  // ── Покупка в магазине (event из monetization.js) ─────────────

  _onPurchase(event) {
    const { productId } = event.detail;
    if (productId === 'infinite_lives') this._updateLivesHUD();
    if (productId === 'hints_pack')     this._updateHintsHUD();
  }

  async _updateLivesHUD() {
    const lives = await Storage.getLives();
    const el = document.getElementById('lives-icons');
    if (el) {
      el.innerHTML = '';
      for (let i = 0; i < GAME_CONFIG.maxLives; i++) {
        const span = document.createElement('span');
        span.className = 'life-icon' + (i >= lives ? ' empty' : '');
        span.textContent = '❤️';
        el.appendChild(span);
      }
    }
  }

  // ── Очистка ───────────────────────────────────────────────────

  shutdown() {
    window.removeEventListener('bolt:purchase', this._onPurchase.bind(this));
    document.getElementById('btn-menu')?.removeEventListener('click', this._menuHandler);
  }
}

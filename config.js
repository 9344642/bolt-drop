/**
 * config.js — Главный конфиг. Обновляется ежедневно скриптом daily-update.js
 * Всё что связано с темой, цветами и физикой — ТОЛЬКО здесь.
 */

export const THEME = {
  name: 'Cyberpunk',
  id: 'cyberpunk',
  day: 1,

  // Цветовая палитра
  colors: {
    background:   '#0a0a1a',
    primary:      '#00fff5',   // неоновый циан
    secondary:    '#ff00a8',   // маджента
    accent:       '#ffe600',   // неоновый жёлтый
    platform:     '#1a1a3e',
    platformEdge: '#00fff5',
    bolt:         '#ff00a8',
    boltGlow:     '#ff69c8',
    ball:         '#ffe600',
    ballGlow:     '#ffaa00',
    goal:         '#00fff5',
    goalGlow:     '#00ffff',
    danger:       '#ff2222',
    text:         '#e0e0ff',
    ui:           '#0f0f2e',
    uiBorder:     '#00fff5',
  },

  // Пути к ассетам (заменяются при смене темы)
  assets: {
    background:    'assets/cyberpunk/bg.png',
    platform:      'assets/cyberpunk/plank.png',
    bolt:          'assets/cyberpunk/bolt.png',
    ball:          'assets/cyberpunk/ball.png',
    goal:          'assets/cyberpunk/goal.png',
    particleBolt:  'assets/cyberpunk/particle_bolt.png',
    particleWin:   'assets/cyberpunk/particle_win.png',
    bgMusic:       'assets/cyberpunk/ambient.ogg',
    sfxBolt:       'assets/cyberpunk/sfx_bolt.ogg',
    sfxWin:        'assets/cyberpunk/sfx_win.ogg',
    sfxLose:       'assets/cyberpunk/sfx_lose.ogg',
  },

  // CSS переменные (генерируются в main.css)
  css: {
    '--color-bg':           '#0a0a1a',
    '--color-primary':      '#00fff5',
    '--color-secondary':    '#ff00a8',
    '--color-accent':       '#ffe600',
    '--color-text':         '#e0e0ff',
    '--color-ui-bg':        '#0f0f2e',
    '--color-ui-border':    '#00fff5',
    '--font-display':       '"Orbitron", "Share Tech Mono", monospace',
    '--font-body':          '"Share Tech Mono", monospace',
    '--glow-primary':       '0 0 12px #00fff5, 0 0 24px #00fff5',
    '--glow-secondary':     '0 0 12px #ff00a8, 0 0 24px #ff00a8',
    '--glow-ball':          '0 0 16px #ffe600, 0 0 32px #ffaa00',
  },

  // Параметры физики Matter.js
  physics: {
    gravity:         1.2,
    ballRestitution: 0.35,   // прыгучесть шара
    ballFriction:    0.08,
    platformFriction: 0.4,
    platformRestitution: 0.1,
    airResistance:   0.01,
    boltRadius:      14,
    ballRadius:      18,
  },

  // Параметры визуала
  visual: {
    platformH:       16,
    boltRemoveAnim:  'sparks',   // sparks | smoke | crack
    winParticles:    'stars',    // stars | coins | sparks
    screenShake:     true,
    glowEffects:     true,
  },
};

// Продукты магазина Telegram Stars
export const SHOP_PRODUCTS = {
  hints_pack: {
    id:          'hints_pack',
    title:       '💡 Пакет подсказок ×5',
    description: '5 подсказок — покажут оптимальный болт для снятия',
    price:       50,   // Telegram Stars
    currency:    'XTR',
    payload:     'hints_pack_5',
    quantity:    5,
  },
  no_ads: {
    id:          'no_ads',
    title:       '🚫 Отключение рекламы',
    description: 'Убирает рекламные паузы навсегда',
    price:       100,
    currency:    'XTR',
    payload:     'no_ads_permanent',
    duration:    -1,  // -1 = навсегда
  },
  infinite_lives: {
    id:          'infinite_lives',
    title:       '❤️ Бесконечные жизни 24ч',
    description: '24 часа без ограничений — проходи любые уровни',
    price:       150,
    currency:    'XTR',
    payload:     'infinite_lives_24h',
    durationHours: 24,
  },
};

// Конфиг игры
export const GAME_CONFIG = {
  width:         450,
  height:        800,
  maxLives:      3,
  livesRegenMin: 30,  // минуты до восстановления 1 жизни
  adsEvery:      3,   // показывать рекламу каждые N уровней
};

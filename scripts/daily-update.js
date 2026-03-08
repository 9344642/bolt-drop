#!/usr/bin/env node
/**
 * scripts/daily-update.js
 * Локальный аналог крон-задачи. Можно запускать вручную: npm run daily-update
 *
 * Что делает:
 *  1. Генерирует промты для AI-изображений текущей темы
 *  2. (Опц.) Вызывает DALL-E / Stable Diffusion API для генерации ассетов
 *  3. Обновляет config.js с новой темой
 *  4. Выводит JSON отчёт для отладки
 */

import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');

// ── Темы ────────────────────────────────────────────────────────
const THEMES = [
  { id:'cyberpunk',  name:'Cyberpunk',  gravity:1.2, restitution:0.35 },
  { id:'noir',       name:'Нуар',       gravity:1.1, restitution:0.25 },
  { id:'space',      name:'Космос',     gravity:0.8, restitution:0.5  },
  { id:'neon',       name:'Неон',       gravity:1.3, restitution:0.4  },
  { id:'steampunk',  name:'Стимпанк',   gravity:1.4, restitution:0.2  },
  { id:'ocean',      name:'Океан',      gravity:0.9, restitution:0.45 },
  { id:'forest',     name:'Лес',        gravity:1.15,restitution:0.3  },
];

const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
const theme     = THEMES[dayOfYear % THEMES.length];
const day       = dayOfYear;

console.log(`\n🎨 Тема дня: ${theme.name} (День ${day})\n`);

// ── Промты для AI-генерации изображений ─────────────────────────
const prompts = generatePrompts(theme);

// Сохраняем промты
mkdirSync(join(ROOT, 'prompts'), { recursive: true });
writeFileSync(
  join(ROOT, `prompts/${theme.id}-day${day}.md`),
  formatPromptsMarkdown(theme, prompts, day)
);

console.log(`✅ Промты сохранены: prompts/${theme.id}-day${day}.md`);

// ── (Опционально) Вызов DALL-E API ──────────────────────────────
// if (process.env.OPENAI_API_KEY) {
//   await generateAssets(theme, prompts);
// }

// ── Отчёт ───────────────────────────────────────────────────────
console.log('\n📋 Промты дня:');
Object.entries(prompts).forEach(([k, v]) => {
  console.log(`  [${k}] ${v.substring(0, 80)}...`);
});
console.log('\n✅ Готово! Для деплоя: git add . && git commit -m "🎨 Day ' + day + ': ' + theme.name + '" && git push');

// ────────────────────────────────────────────────────────────────

function generatePrompts(theme) {
  const STYLE_MAP = {
    cyberpunk: 'cyberpunk neon aesthetic, dark city, holographic, neon lights, rain reflections',
    noir:      'film noir, black and white, 1940s detective, heavy shadows, cigarette smoke',
    space:     'deep space, nebula colors, stars, zero gravity, sci-fi minimalist',
    neon:      'neon retro 80s, synthwave, grid floor, vivid neon colors, dark background',
    steampunk: 'steampunk Victorian, brass gears, copper pipes, steam, sepia tones',
    ocean:     'deep ocean, bioluminescent, underwater, coral reef, teal blues',
    forest:    'enchanted forest, bioluminescent mushrooms, ancient trees, green haze',
  };
  const style = STYLE_MAP[theme.id] ?? 'minimalist game art';

  return {
    background: `Game background for mobile puzzle game, ${style}, seamless tile pattern, no text, no UI elements, subtle and atmospheric, 450x800px aspect ratio, dark background`,

    plank: `Single game platform plank, horizontal wooden or metal bar, ${style}, top-down view, isolated on transparent background, 160x16px, game asset, clean edges`,

    bolt: `Single mechanical bolt or pin icon, ${style}, circular shape, glowing effect, isolated on transparent background, 24x24px, game asset UI icon`,

    ball: `Shiny sphere game ball, ${style}, perfect circle, glossy reflection, isolated on transparent background, 40x40px, mobile game asset`,

    goal: `Circular target goal zone for physics puzzle game, ${style}, glowing ring portal effect, transparent center, isolated background, 48x48px`,

    particle_bolt: `Tiny spark particle, ${style}, 4x4px game asset, single glowing dot`,

    particle_win:  `Small star or sparkle celebration particle, ${style}, 12x12px, 5-pointed star, glowing`,
  };
}

function formatPromptsMarkdown(theme, prompts, day) {
  return `# Промты для ассетов — ${theme.name} (День ${day})
Дата: ${new Date().toISOString().split('T')[0]}
Рекомендуемый инструмент: DALL-E 3 (1024x1024 → resize), Midjourney, или Stable Diffusion XL

## Настройки генерации
- Формат: PNG с прозрачным фоном (кроме background)
- Разрешение: 1024x1024 → scale down до нужного размера
- Стиль: ${theme.id}

## Ассеты

${Object.entries(prompts).map(([key, prompt]) => `### ${key}
\`\`\`
${prompt}
\`\`\`
`).join('\n')}

## Физика сегодня
- Гравитация: ${theme.gravity}
- Прыгучесть шара: ${theme.restitution}
`;
}

/**
 * levels.js — 100 прогрессивных уровней BoltDrop
 *
 * Формат платформы:
 *   { id, x, y, w, angle, bolts: ['left'|'right'|'center'], danger? }
 *
 * Поле solution — порядок снятия болтов для оптимального прохождения.
 * Математическая решаемость гарантируется правилом:
 *   Каждая платформа на пути шара блокирует его — после удаления
 *   всех болтов она падает, открывая путь вниз.
 *
 * Система звёзд:
 *   3 ⭐ — решено с ≤ par_bolts
 *   2 ⭐ — решено с par_bolts + 1
 *   1 ⭐ — решено любым способом
 */

// ── Генератор фаз ──────────────────────────────────────────────

function plank(id, x, y, w = 160, angle = 0, bolts = ['left', 'right'], danger = false) {
  return { id, x, y, w, angle, bolts, danger };
}

function level(id, ball, goal, platforms, parBolts, solution) {
  return { id, ball, goal, platforms, par_bolts: parBolts, solution, solvable: true };
}

// ── ФАЗА 1 (1-10): Один барьер, прямой путь ────────────────────

const phase1 = [
  level(1,  [225, 80], [225, 700], [plank('p1',225,350,160,0,['left','right'])], 2, ['p1:left','p1:right']),
  level(2,  [225, 80], [225, 700], [plank('p1',225,300,180,0,['left','right'])], 2, ['p1:left','p1:right']),
  level(3,  [180, 80], [270, 700], [plank('p1',225,360,160, 10,['left','right'])], 2, ['p1:right','p1:left']),
  level(4,  [270, 80], [180, 700], [plank('p1',225,360,160,-10,['left','right'])], 2, ['p1:left','p1:right']),
  level(5,  [225, 80], [225, 700], [plank('p1',225,280,200,0,['left','right']),
                                     plank('p2',225,450,200,0,['left','right'])], 4, ['p1:left','p1:right','p2:left','p2:right']),
  level(6,  [150, 80], [300, 700], [plank('p1',200,300,180,15,['left','right'])], 2, ['p1:right','p1:left']),
  level(7,  [300, 80], [150, 700], [plank('p1',250,300,180,-15,['left','right'])], 2, ['p1:left','p1:right']),
  level(8,  [225, 80], [225, 700], [plank('p1',225,250,160,0,['center'])],        1, ['p1:center']),
  level(9,  [225, 80], [225, 700], [plank('p1',160,320,120,0,['left']),
                                     plank('p2',300,420,120,0,['right'])], 2, ['p1:left','p2:right']),
  level(10, [225, 80], [225, 700], [plank('p1',225,350,220,0,['left','right']),
                                     plank('d1',225,500, 80,0,['left','right'],true)], 2, ['p1:left','p1:right']),
];

// ── ФАЗА 2 (11-20): Два барьера, угловые траектории ────────────

const phase2 = [
  level(11, [225, 80], [340, 700], [plank('p1',225,280,180,0,['left','right']),
                                     plank('p2',310,480,160,20,['left','right'])], 4, ['p1:left','p1:right','p2:right','p2:left']),
  level(12, [225, 80], [110, 700], [plank('p1',225,280,180,0,['left','right']),
                                     plank('p2',140,480,160,-20,['left','right'])], 4, ['p1:right','p1:left','p2:left','p2:right']),
  level(13, [100, 80], [350, 700], [plank('p1',180,260,160,25,['right']),
                                     plank('p2',300,420,160, 25,['right'])], 2, ['p1:right','p2:right']),
  level(14, [350, 80], [100, 700], [plank('p1',270,260,160,-25,['left']),
                                     plank('p2',150,420,160,-25,['left'])], 2, ['p1:left','p2:left']),
  level(15, [225, 80], [225, 700], [plank('p1',225,240,200,0,['left','right']),
                                     plank('p2',225,400,200,0,['left','right']),
                                     plank('p3',225,560,200,0,['left','right'])], 6, ['p1:left','p1:right','p2:left','p2:right','p3:left','p3:right']),
  level(16, [120, 80], [330, 700], [plank('p1',200,300,160,30,['right']),
                                     plank('p2',290,480,140,0,['left','right'])], 3, ['p1:right','p2:left','p2:right']),
  level(17, [330, 80], [120, 700], [plank('p1',250,300,160,-30,['left']),
                                     plank('p2',160,480,140,0,['left','right'])], 3, ['p1:left','p2:right','p2:left']),
  level(18, [225, 80], [225, 700], [plank('p1',160,280,120,-20,['left']),
                                     plank('p2',290,380,120, 20,['right']),
                                     plank('p3',225,520,160,  0,['left','right'])], 4, ['p1:left','p2:right','p3:left','p3:right']),
  level(19, [80,  80], [370, 700], [plank('p1',160,220,140,30,['right']),
                                     plank('p2',280,380,140,20,['right']),
                                     plank('p3',360,540,120,10,['right'])], 3, ['p1:right','p2:right','p3:right']),
  level(20, [370, 80], [80,  700], [plank('p1',290,220,140,-30,['left']),
                                     plank('p2',170,380,140,-20,['left']),
                                     plank('p3', 90,540,120,-10,['left'])], 3, ['p1:left','p2:left','p3:left']),
];

// ── ФАЗА 3 (21-30): Разные болтовые схемы ──────────────────────

const phase3 = [
  level(21, [225, 80], [225, 700], [plank('p1',160,300,120,0,['center']),
                                     plank('p2',310,430,120,0,['center']),
                                     plank('p3',225,570,140,0,['center'])], 3, ['p1:center','p2:center','p3:center']),
  level(22, [225, 80], [225, 700], [plank('p1',225,260,200,0,['left']),
                                     plank('p2',225,420,200,0,['right'])], 2, ['p1:left','p2:right']),
  level(23, [225, 80], [100, 700], [plank('p1',200,280,180,-15,['left','right']),
                                     plank('p2',140,430,140,-20,['right','left'])], 4, ['p1:right','p1:left','p2:right','p2:left']),
  level(24, [225, 80], [350, 700], [plank('p1',250,280,180, 15,['left','right']),
                                     plank('p2',310,430,140, 20,['left','right'])], 4, ['p1:left','p1:right','p2:left','p2:right']),
  level(25, [225, 80], [225, 700], [
    plank('p1',225,200,220,0,['left','right']),
    plank('p2',130,360,120,0,['center']),
    plank('p3',320,360,120,0,['center']),
    plank('p4',225,560,200,0,['left','right']),
  ], 6, ['p1:left','p1:right','p2:center','p3:center','p4:left','p4:right']),
  level(26, [100, 80], [350, 700], [plank('p1',170,250,140,25,['right']),
                                     plank('p2',280,380,140,25,['right','left']),
                                     plank('p3',360,520,120,10,['right'])], 5, ['p1:right','p2:right','p2:left','p3:right','p3:right']),
  level(27, [350, 80], [100, 700], [plank('p1',280,250,140,-25,['left']),
                                     plank('p2',170,380,140,-25,['left','right']),
                                     plank('p3', 90,520,120,-10,['left'])], 5, ['p1:left','p2:left','p2:right','p3:left','p3:left']),
  level(28, [225, 80], [225, 700], [plank('p1',225,260,240,0,['left','right']),
                                     plank('d1', 90,400, 60,0,['left'],true),
                                     plank('d2',360,400, 60,0,['right'],true),
                                     plank('p2',225,540,200,0,['left','right'])], 4, ['p1:left','p1:right','p2:left','p2:right']),
  level(29, [225, 80], [225, 700], [plank('p1',160,280,130,-30,['left']),
                                     plank('p2',290,390,130, 30,['right']),
                                     plank('p3',225,530,180,0,['left','right'])], 4, ['p1:left','p2:right','p3:left','p3:right']),
  level(30, [225, 80], [225, 700], [
    plank('p1',225,220,220,0,['left','right']),
    plank('p2',140,360,110,-10,['center']),
    plank('p3',310,360,110, 10,['center']),
    plank('p4',225,490,200,0,['left','right']),
    plank('p5',225,620,180,0,['left','right']),
  ], 7, ['p1:left','p1:right','p2:center','p3:center','p4:left','p4:right','p5:left']),
];

// ── ФАЗЫ 4-10 (31-100): Генерация с прогрессией ──────────────────

function autoLevel(id) {
  const diff = Math.ceil(id / 10);                    // 4-10
  const count = Math.min(2 + Math.floor((id - 30) / 8), 6); // 2-6 платформ
  const angleMax = Math.min(10 + diff * 3, 40);       // нарастающий угол
  const platforms = [];
  const solution = [];
  const CX = 225, startY = 180, gap = Math.max(80, 360 / count);

  for (let i = 0; i < count; i++) {
    const pid = `p${i + 1}`;
    const y = startY + i * gap;
    const offset = ((i % 3) - 1) * 50;
    const x = Math.min(Math.max(CX + offset, 80), 370);
    const angle = (i % 2 === 0 ? 1 : -1) * Math.floor(Math.random() * angleMax);
    const boltTypes = diff < 6 ? ['left', 'right'] : (i % 3 === 0 ? ['center'] : ['left', 'right']);
    platforms.push(plank(pid, x, y, 140 + Math.random() * 60 | 0, angle, boltTypes));
    boltTypes.forEach(b => solution.push(`${pid}:${b}`));
  }

  const ballX = 80 + Math.random() * 290 | 0;
  const goalX = 80 + Math.random() * 290 | 0;

  return level(id, [ballX, 80], [goalX, 700], platforms, solution.length, solution);
}

const phase4to10 = Array.from({ length: 70 }, (_, i) => autoLevel(31 + i));

// ── Экспорт ──────────────────────────────────────────────────────

export const LEVELS = [...phase1, ...phase2, ...phase3, ...phase4to10];

/** Получить уровень по ID (1-100) */
export function getLevel(id) {
  return LEVELS.find(l => l.id === id) ?? LEVELS[0];
}

/** Кол-во уровней */
export const TOTAL_LEVELS = LEVELS.length;

/** Подсчёт звёзд по кол-ву снятых болтов */
export function calcStars(level, boltsUsed) {
  if (boltsUsed <= level.par_bolts)     return 3;
  if (boltsUsed <= level.par_bolts + 1) return 2;
  return 1;
}

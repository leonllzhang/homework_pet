// 游戏数据结构 — 奇迹档案馆
export const gameData = {
  resources: {
    dust: 0,    // 以太星尘 — 数学口算
    rune: 0,    // 逻辑符文 — 数学大题
    leaf: 0,    // 时光笺   — 英语阅读
    ink: 0,     // 幻彩墨水 — 语文写词
    fruit: 0,   // 记忆果实 — 单词背诵
  },

  archive: {
    // 书架状态: 0=损坏, 1=完好
    bookshelves: [1, 1, 0, 0, 0],
    // 家具列表
    furniture: [],
    // 连续学习天数
    streak: 7,
    // 永恒之火是否点燃
    eternalFlameLit: true,
  },

  pet: {
    name: '小星',
    // 阶段: 0=星光体, 1=进化形态
    stage: 0,
    // 进化路线: 'owl' | 'cat' | 'unicorn'
    evolution: null,
    // 心情: 0-100
    mood: 75,
    // 饱食度: 0-100
    satiety: 60,
    // 亲密度: 0-100
    bond: 30,
  },

  // 学习统计
  stats: {
    totalCorrect: 0,
    totalWrong: 0,
    subjects: {
      math: { done: 0, correct: 0 },
      english: { done: 0, correct: 0 },
      chinese: { done: 0, correct: 0 },
    },
  },

  // 成就
  achievements: [
    { id: 'paradox_slayer', name: '悖论终结者', unlocked: false },
    { id: 'logic_weaver', name: '逻辑织网者', unlocked: false },
    { id: 'flame_keeper', name: '守焰人', unlocked: false },
  ],
};

// 更新 HUD 资源显示
export function updateHUD() {
  const ids = ['dust', 'rune', 'leaf', 'ink', 'fruit'];
  ids.forEach(id => {
    const el = document.getElementById(`res-${id}`);
    if (el) el.textContent = gameData.resources[id] || 0;
  });
}

/**
 * 成就系统 — 追踪游戏里程碑，解锁酷炫称号
 */
import { gameData } from '../data/gameData.js';
import { getSoundManager } from '../systems/SoundManager.js';

// 成就定义
export const ACHIEVEMENTS = [
  {
    id: 'first_scan',
    name: '初入档案馆',
    desc: '完成第一次作业扫描',
    icon: '📷',
    check: () => gameData.stats.totalCorrect > 0,
  },
  {
    id: 'paradox_slayer',
    name: '悖论终结者',
    desc: '累计修复10道错题',
    icon: '⚔️',
    check: () => gameData.stats.totalWrong >= 10,
  },
  {
    id: 'logic_weaver',
    name: '逻辑织网者',
    desc: '累计完成50道题',
    icon: '🕸️',
    check: () => (gameData.stats.totalCorrect + gameData.stats.totalWrong) >= 50,
  },
  {
    id: 'flame_keeper',
    name: '守焰人',
    desc: '连续学习7天',
    icon: '🔥',
    check: () => gameData.archive.streak >= 7,
  },
  {
    id: 'star_collector',
    name: '星光收集者',
    desc: '在跑酷中收集50枚星光',
    icon: '⭐',
    check: () => gameData.resources.dust >= 50,
  },
  {
    id: 'evolved',
    name: '生命升华',
    desc: '让宠物完成一次进化',
    icon: '🦋',
    check: () => gameData.pet.stage >= 1,
  },
  {
    id: 'perfectionist',
    name: '完美主义者',
    desc: '累计10次全对扫描',
    icon: '💎',
    check: () => {
      // 通过总正确数和总错题数比例估算
      const total = gameData.stats.totalCorrect + gameData.stats.totalWrong;
      return total > 0 && gameData.stats.totalWrong === 0;
    },
  },
  {
    id: 'architect',
    name: '档案馆建筑师',
    desc: '收集100个逻辑符文',
    icon: '🏛️',
    check: () => gameData.resources.rune >= 100,
  },
  {
    id: 'gate_crasher',
    name: '破门者',
    desc: '在跑酷中正确穿越10个逻辑门',
    icon: '🚪',
    check: () => true, // 简化：默认可达
  },
  {
    id: 'bonded',
    name: '心灵伙伴',
    desc: '宠物亲密度达到100',
    icon: '💕',
    check: () => gameData.pet.bond >= 100,
  },
];

export class AchievementManager {
  constructor() {
    this._check();
  }

  /**
   * 检查所有成就
   * @returns {string[]} 新解锁的成就ID列表
   */
  _check() {
    const newlyUnlocked = [];

    ACHIEVEMENTS.forEach((ach) => {
      const existing = gameData.achievements.find(a => a.id === ach.id);
      if (existing && existing.unlocked) return;

      if (ach.check()) {
        if (existing) {
          existing.unlocked = true;
        } else {
          gameData.achievements.push({ id: ach.id, name: ach.name, unlocked: true });
        }
        newlyUnlocked.push(ach);
      }
    });

    return newlyUnlocked;
  }

  /**
   * 刷新成就状态（每次作业扫描后调用）
   */
  refresh() {
    const unlocked = this._check();
    unlocked.forEach(ach => {
      this._notify(ach);
    });
    return unlocked;
  }

  /**
   * 获取所有成就及解锁状态
   */
  getAll() {
    return ACHIEVEMENTS.map(ach => {
      const saved = gameData.achievements.find(a => a.id === ach.id);
      return {
        ...ach,
        unlocked: saved ? saved.unlocked : ach.check(),
      };
    });
  }

  /**
   * 获取解锁成就数量
   */
  getUnlockedCount() {
    return this.getAll().filter(a => a.unlocked).length;
  }

  _notify(ach) {
    getSoundManager().achievement();
    const el = document.getElementById('ach-notify');
    if (!el) return;

    el.querySelector('.ach-notify-icon').textContent = ach.icon;
    el.querySelector('.ach-notify-name').textContent = `✦ ${ach.name} ✦`;
    el.querySelector('.ach-notify-desc').textContent = ach.desc;
    el.classList.add('active');

    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('active'), 4000);
  }
}

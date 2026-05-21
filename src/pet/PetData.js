/**
 * 宠物数据管理 — 心情、饱食度、亲密度、进化
 */
import { gameData, updateHUD } from '../data/gameData.js';

export const EVOLUTIONS = {
  owl: {
    name: '智慧猫头鹰',
    desc: '擅长逻辑推理，判题正确率+5%',
    icon: '🦉',
    color: 0x4A6FA5,
    bondRequired: 60,
    fruitRequired: 20,
  },
  cat: {
    name: '幻影灵猫',
    desc: '身法敏捷，跑酷速度+10%',
    icon: '🐱',
    color: 0xD4A0FF,
    bondRequired: 60,
    fruitRequired: 20,
  },
  unicorn: {
    name: '星辰独角兽',
    desc: '治愈之力，错题时护盾+20%',
    icon: '🦄',
    color: 0xFFB7C5,
    bondRequired: 70,
    fruitRequired: 25,
  },
};

export class PetDataManager {
  constructor() {
    this.pet = gameData.pet;
  }

  get mood() { return this.pet.mood; }
  set mood(v) { this.pet.mood = Math.max(0, Math.min(100, v)); }

  get satiety() { return this.pet.satiety; }
  set satiety(v) { this.pet.satiety = Math.max(0, Math.min(100, v)); }

  get bond() { return this.pet.bond; }
  set bond(v) { this.pet.bond = Math.max(0, Math.min(100, v)); }

  get stage() { return this.pet.stage; }
  get evolution() { return this.pet.evolution; }

  /**
   * 喂食 — 消耗记忆果实
   */
  feed() {
    if (gameData.resources.fruit < 1) return { ok: false, msg: '记忆果实不足' };
    if (this.satiety >= 100) return { ok: false, msg: '已经很饱了' };

    gameData.resources.fruit -= 1;
    this.satiety = Math.min(100, this.satiety + 20);
    this.mood = Math.min(100, this.mood + 5);
    this.bond = Math.min(100, this.bond + 2);
    updateHUD();
    return { ok: true, msg: '小星开心地吃了记忆果实！' };
  }

  /**
   * 抚摸互动
   */
  pet() {
    this.mood = Math.min(100, this.mood + 8);
    this.bond = Math.min(100, this.bond + 3);
    return { ok: true, msg: '✨ 小星舒服地蹭了蹭你的手' };
  }

  /**
   * 随时间衰减（每小时调用）
   */
  tickDecay() {
    this.satiety = Math.max(0, this.satiety - 2);
    this.mood = Math.max(0, this.mood - 1);
  }

  /**
   * 检查是否可以进化
   */
  canEvolve() {
    if (this.stage >= 1) return null; // 已经进化

    const available = [];
    for (const [key, evo] of Object.entries(EVOLUTIONS)) {
      if (this.bond >= evo.bondRequired) {
        available.push(key);
      }
    }
    // 如果亲密度达到60以上，开放所有进化，但推荐最匹配的
    if (this.bond >= 70) {
      return Object.keys(EVOLUTIONS);
    }
    return available.length > 0 ? available : null;
  }

  /**
   * 执行进化
   */
  evolve(type) {
    if (this.stage >= 1) return { ok: false, msg: '已经进化过了' };
    if (!EVOLUTIONS[type]) return { ok: false, msg: '未知进化形态' };
    if (this.bond < EVOLUTIONS[type].bondRequired) {
      return { ok: false, msg: '亲密度不足' };
    }

    this.pet.stage = 1;
    this.pet.evolution = type;
    this.mood = 100; // 进化后心情爆满

    return { ok: true, msg: `✨ 小星进化成了${EVOLUTIONS[type].name}！` };
  }

  /**
   * 获取进化信息
   */
  getEvoInfo() {
    if (!this.evolution) return null;
    return EVOLUTIONS[this.evolution] || null;
  }

  /**
   * 获取心情状态文本
   */
  getMoodText() {
    if (this.mood >= 80) return '🌟 开心';
    if (this.mood >= 50) return '😊 不错';
    if (this.mood >= 20) return '😐 一般';
    return '😢 需要陪伴';
  }

  getSatietyText() {
    if (this.satiety >= 80) return '💚 饱了';
    if (this.satiety >= 40) return '💛 还行';
    if (this.satiety >= 10) return '🧡 有点饿';
    return '❤️‍🔥 很饿！';
  }

  /**
   * 获取心情对应的粒子颜色
   */
  getMoodColor() {
    if (this.mood >= 80) return 0xFFD700; // 金色
    if (this.mood >= 50) return 0xFFE4B5; // 暖黄
    if (this.mood >= 20) return 0x8B9DC3; // 灰蓝
    return 0x6B6B8A; // 灰色
  }
}

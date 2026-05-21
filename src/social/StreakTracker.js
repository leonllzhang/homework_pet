/**
 * 连续学习追踪 — Streak 记录，与永恒之火联动
 */
import { gameData } from '../data/gameData.js';

const STREAK_KEY = 'miracle_archive_streak';

export class StreakTracker {
  constructor() {
    this._load();
  }

  _load() {
    try {
      const saved = localStorage.getItem(STREAK_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const today = this._today();

        if (data.date === today) {
          // 今天已经记录过
          return;
        }

        const yesterday = this._daysAgo(1);
        if (data.date === yesterday) {
          // 连续
          gameData.archive.streak = data.streak + 1;
        } else {
          // 断掉了
          gameData.archive.streak = 1;
        }

        this._save();
      } else {
        // 首次使用
        gameData.archive.streak = 1;
        this._save();
      }
    } catch (e) {
      console.warn('Streak load error:', e);
    }
  }

  /**
   * 记录一次学习（每日首次扫描时调用）
   */
  recordStudy() {
    const data = this._getData();
    const today = this._today();

    if (data.date === today) return; // 已记录

    const yesterday = this._daysAgo(1);
    if (data.date === yesterday) {
      gameData.archive.streak = data.streak + 1;
    } else {
      gameData.archive.streak = 1;
    }

    // 永恒之火：连续7天点亮
    gameData.archive.eternalFlameLit = gameData.archive.streak >= 7;

    this._save();
  }

  /**
   * 获取当前 streak
   */
  getStreak() {
    return gameData.archive.streak || 0;
  }

  /**
   * 永恒之火是否点燃
   */
  isFlameLit() {
    return this.getStreak() >= 7;
  }

  _today() {
    return new Date().toISOString().split('T')[0];
  }

  _daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }

  _getData() {
    try {
      const saved = localStorage.getItem(STREAK_KEY);
      return saved ? JSON.parse(saved) : { date: '', streak: 0 };
    } catch {
      return { date: '', streak: 0 };
    }
  }

  _save() {
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify({
        date: this._today(),
        streak: gameData.archive.streak || 0,
      }));
    } catch (e) {
      console.warn('Streak save error:', e);
    }
  }
}

/**
 * 判题流程管理 — 学科选择 + 题数录入 + 资源结算
 */
import { gameData, updateHUD } from '../data/gameData.js';

// 学科 → 资源映射
const SUBJECT_REWARDS = {
  math_oral: { primary: 'dust', label: '以太星尘', emoji: '✨' },
  math_written: { primary: 'rune', label: '逻辑符文', emoji: '🔮' },
  english: { primary: 'leaf', label: '时光笺', emoji: '🍃' },
  chinese: { primary: 'ink', label: '幻彩墨水', emoji: '🎨' },
};

const SUBJECT_NAMES = {
  math_oral: '数学口算',
  math_written: '数学大题',
  english: '英语阅读',
  chinese: '语文写词',
};

// 额外产出规则
const BONUS_MAP = {
  math_oral: { fruit: 1 },        // 口算额外给记忆果实
  math_written: { dust: 2 },      // 大题额外给星尘
  english: { ink: 1 },            // 阅读额外给墨水
  chinese: { rune: 1 },           // 写词额外给符文
};

export class GradingFlow {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.selectedSubject = null;
    this.correct = 5;
    this.total = 10;

    this._bindEvents();
  }

  _bindEvents() {
    // 学科选择
    document.querySelectorAll('.subject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedSubject = btn.dataset.subject;
      });
    });

    // 加减按钮
    document.querySelectorAll('.g-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (target === 'correct' && this.correct > 0) this.correct--;
        if (target === 'total' && this.total > 1) this.total--;
        if (this.correct > this.total) this.correct = this.total;
        this._updateDisplay();
      });
    });
    document.querySelectorAll('.g-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        if (target === 'correct' && this.correct < 99) this.correct++;
        if (target === 'total' && this.total < 99) this.total++;
        this._updateDisplay();
      });
    });

    // 确认提交
    document.getElementById('grade-confirm').addEventListener('click', () => {
      this._submit();
    });
  }

  _updateDisplay() {
    document.getElementById('g-correct').textContent = this.correct;
    document.getElementById('g-total').textContent = this.total;
  }

  /**
   * 打开判题面板
   */
  open(subject) {
    this.selectedSubject = subject || null;
    this.correct = 5;
    this.total = 10;
    this._updateDisplay();

    if (subject) {
      document.querySelectorAll('.subject-btn').forEach(b => {
        b.classList.toggle('selected', b.dataset.subject === subject);
      });
    }

    document.getElementById('grade-panel').classList.add('active');
  }

  _submit() {
    if (!this.selectedSubject) {
      this._flash('请选择学科！');
      return;
    }
    if (this.correct > this.total) {
      this._flash('做对的题数不能超过总题数！');
      return;
    }

    document.getElementById('grade-panel').classList.remove('active');

    // 计算结果
    const wrong = this.total - this.correct;
    const accuracy = this.total > 0 ? this.correct / this.total : 0;
    const subject = this.selectedSubject;
    const rewardDef = SUBJECT_REWARDS[subject];
    const bonusDef = BONUS_MAP[subject] || {};

    // 计算资源产出
    const rewards = {};
    // 主资源：按正确量给
    const primaryAmount = Math.max(1, Math.floor(this.correct * 0.8));
    rewards[rewardDef.primary] = primaryAmount;
    // 额外产出
    for (const [res, amount] of Object.entries(bonusDef)) {
      rewards[res] = (rewards[res] || 0) + amount;
    }

    // 全对额外奖励
    const isPerfect = wrong === 0;
    if (isPerfect) {
      // 全对：所有资源类型+1
      ['dust', 'rune', 'leaf', 'ink', 'fruit'].forEach(r => {
        rewards[r] = (rewards[r] || 0) + 1;
      });
    }

    // 更新游戏数据
    for (const [res, amount] of Object.entries(rewards)) {
      if (gameData.resources[res] !== undefined) {
        gameData.resources[res] += amount;
      }
    }

    // 更新学习统计
    gameData.stats.totalCorrect += this.correct;
    gameData.stats.totalWrong += wrong;

    // 更新 HUD
    updateHUD();

    // 显示结果
    this._showResult({
      subject: SUBJECT_NAMES[subject],
      correct: this.correct,
      total: this.total,
      wrong,
      accuracy,
      isPerfect,
      rewards,
    });

    // 回调
    if (this.onComplete) {
      this.onComplete({ wrong, isPerfect, subject, rewards });
    }
  }

  _showResult(data) {
    const panel = document.getElementById('result-panel');
    document.getElementById('result-title').textContent = data.isPerfect ? '✦ 完美扫描 ✦' : '扫描完成';
    document.getElementById('result-sub').textContent =
      data.isPerfect ? '金光闪烁，档案馆因你而辉煌！' : '奇迹档案馆已记录你的努力';
    document.getElementById('result-score').textContent = `${data.correct}/${data.total}`;

    const list = document.getElementById('reward-list');
    list.innerHTML = '';
    for (const [res, amount] of Object.entries(data.rewards)) {
      const names = { dust: '以太星尘', rune: '逻辑符文', leaf: '时光笺', ink: '幻彩墨水', fruit: '记忆果实' };
      const item = document.createElement('div');
      item.className = 'reward-item';
      item.innerHTML = `<span class="r-name">+ ${names[res] || res}</span><span class="r-val">+${amount}</span>`;
      list.appendChild(item);
    }

    // 如果有错题，显示提示
    if (data.wrong > 0) {
      const warn = document.createElement('div');
      warn.style.cssText = 'color: #FFB7C5; font-size: 12px; margin-top: 8px; text-align: center;';
      warn.textContent = `⚠ ${data.wrong} 道错题在档案馆中引发了悖论裂痕，订正后扫描可修复`;
      list.appendChild(warn);
    }

    panel.classList.add('active');

    document.getElementById('result-close').onclick = () => {
      panel.classList.remove('active');
    };
  }

  _flash(msg) {
    const el = document.getElementById('interact-prompt');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 2000);
  }

  close() {
    document.getElementById('grade-panel').classList.remove('active');
    document.getElementById('result-panel').classList.remove('active');
  }
}

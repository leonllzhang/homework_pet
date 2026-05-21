/**
 * 逻辑辩论 — 周常宠物发起世界观纠错
 */
export class LogicDebate {
  constructor() {
    this.isActive = false;

    // 辩论题库：宠物故意说错，玩家纠正
    this.debates = [
      {
        question: '小星说：「我觉得独角兽是跑得最快的进化形态！」',
        options: [
          { text: '对呀，独角兽最厉害', correct: false, feedback: '不对哦～独角兽擅长治愈，幻影猫才是敏捷最快的' },
          { text: '不对，幻影猫才是敏捷型的', correct: true, feedback: '没错！幻影猫身法敏捷，跑酷最快！' },
          { text: '那猫头鹰呢？', correct: false, feedback: '猫头鹰是智慧型，擅长判题加成' },
        ],
        reward: { rune: 5, fruit: 2 },
      },
      {
        question: '小星说：「以太星尘可以用来修复档案馆的建筑！」',
        options: [
          { text: '是的，星尘是建筑材料', correct: false, feedback: '其实修复建筑用的是逻辑符文哦' },
          { text: '不对，逻辑符文才是建材', correct: true, feedback: '正确！逻辑符文才是修复档案馆的材料' },
          { text: '星尘只能用来跑步', correct: false, feedback: '星尘是跑酷的动力来源～你说对了一半！' },
        ],
        reward: { rune: 3, leaf: 3 },
      },
      {
        question: '小星说：「语文作业可以获得幻彩墨水，英语可以获得时光笺。」',
        options: [
          { text: '完全正确！', correct: true, feedback: '没错！语文→墨水，英语→时光笺，记得很牢！' },
          { text: '语文是时光笺才对', correct: false, feedback: '再想想～语文写词对应的是幻彩墨水哦' },
          { text: '英语是记忆果实', correct: false, feedback: '记忆果实是单词背诵的奖励哦' },
        ],
        reward: { ink: 3, dust: 5 },
      },
      {
        question: '小星说：「跑酷时撞到障碍物会扣护盾，护盾归零游戏就结束了。」',
        options: [
          { text: '说得对，所以要注意闪避', correct: true, feedback: '完全正确！护盾归零就要重新开始了' },
          { text: '护盾会自己恢复', correct: false, feedback: '护盾确实会缓慢恢复，但撞到还是会扣的' },
          { text: '护盾是无限的', correct: false, feedback: '护盾有限哦，要好好珍惜！' },
        ],
        reward: { dust: 8 },
      },
    ];

    this.currentDebate = null;
    this.weeklyUsed = false;
    this._loadState();
  }

  _loadState() {
    try {
      const saved = localStorage.getItem('miracle_debate');
      if (saved) {
        const data = JSON.parse(saved);
        const week = this._getWeekKey();
        this.weeklyUsed = data.week === week;
      }
    } catch { /* ignore */ }
  }

  _saveState() {
    try {
      localStorage.setItem('miracle_debate', JSON.stringify({
        week: this._getWeekKey(),
      }));
    } catch { /* ignore */ }
  }

  _getWeekKey() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${week}`;
  }

  /**
   * 是否可以辩论
   */
  canDebate() {
    return !this.weeklyUsed;
  }

  /**
   * 开始辩论
   */
  start() {
    if (this.weeklyUsed) return { ok: false, msg: '本周已经辩论过了，下周再来吧！' };

    this.isActive = true;
    this.currentDebate = this.debates[Math.floor(Math.random() * this.debates.length)];
    return { ok: true, debate: this.currentDebate };
  }

  /**
   * 提交答案
   */
  answer(optionIndex) {
    if (!this.currentDebate) return { ok: false, msg: '没有进行中的辩论' };

    const option = this.currentDebate.options[optionIndex];
    if (!option) return { ok: false, msg: '无效选项' };

    this.isActive = false;
    this.weeklyUsed = true;
    this._saveState();

    if (option.correct) {
      return {
        ok: true,
        correct: true,
        feedback: option.feedback,
        rewards: this.currentDebate.reward,
      };
    } else {
      return {
        ok: true,
        correct: false,
        feedback: option.feedback,
        rewards: null,
      };
    }
  }
}

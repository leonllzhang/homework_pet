/**
 * 资源雨粒子动画 — 金色粒子从屏幕顶部洒落
 * 与 Three.js 场景独立，使用 2D Canvas 叠加层
 */
export class ResourceRain {
  constructor() {
    this.canvas = document.getElementById('rain-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.isRunning = false;
    this.animId = null;

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * 播放资源雨效果
   * @param {string} type 资源类型 — 决定粒子颜色
   * @param {number} count 粒子数量
   * @param {number} duration 持续时间(ms)
   */
  play(type = 'dust', count = 60, duration = 2000) {
    const colorMap = {
      dust: ['#FFE4B5', '#FFD700', '#D4A057'],
      rune: ['#7EB8E8', '#4A6FA5', '#B0D4FF'],
      leaf: ['#A8D8A8', '#6BA86B', '#D0F0C0'],
      ink: ['#FFB7C5', '#D4879A', '#FFD1DC'],
      fruit: ['#F0C080', '#D09040', '#FFE0A0'],
    };
    const colors = colorMap[type] || colorMap.dust;
    const emojis = { dust: '✨', rune: '🔮', leaf: '🍃', ink: '🎨', fruit: '⭐' };

    // 生成粒子
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -20 - Math.random() * 100,
        size: 3 + Math.random() * 6,
        speedY: 1.5 + Math.random() * 2.5,
        speedX: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 0.7 + Math.random() * 0.3,
        life: 1,
        decay: 0.003 + Math.random() * 0.003,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 1 + Math.random() * 2,
        wobbleAmp: 0.3 + Math.random() * 0.5,
        icon: Math.random() > 0.7 ? emojis[type] : null,
      });
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this._animate();
    }

    // 自动停止
    setTimeout(() => {
      this.isRunning = false;
    }, duration);
  }

  /**
   * 播放全对金色暴雨
   */
  playPerfect() {
    // 多种资源混合 + 更多粒子
    ['dust', 'ink', 'rune'].forEach(type => {
      this.play(type, 40, 3000);
    });
  }

  _animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter(p => p.life > 0 && p.y < this.canvas.height + 20);

    for (const p of this.particles) {
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.wobble) * p.wobbleAmp;
      p.wobble += p.wobbleSpeed * 0.02;
      p.rotation += p.rotSpeed;
      p.life -= p.decay;

      if (p.life <= 0) continue;

      this.ctx.save();
      this.ctx.globalAlpha = p.life * p.opacity;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);

      // 绘制星形粒子
      this.ctx.fillStyle = p.color;
      const s = p.size;
      if (p.icon) {
        this.ctx.font = `${s * 3}px serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(p.icon, 0, 0);
      } else {
        // 四角星形
        this._drawStar(this.ctx, 0, 0, s * 0.3, s, 4);
        this.ctx.fill();
        // 发光光晕
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 10;
        this._drawStar(this.ctx, 0, 0, s * 0.2, s * 0.6, 4);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    if (this.isRunning || this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this._animate());
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.animId = null;
    }
  }

  _drawStar(ctx, cx, cy, innerR, outerR, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = [];
  }
}

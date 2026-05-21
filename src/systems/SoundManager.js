/**
 * 音效管理器 — 使用 Web Audio API 合成所有音效
 * 无需外部音频文件，纯代码生成
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this._muted = false;
    this._bgmNodes = [];
    this._bgmPlaying = false;
    this._initOnInteraction = null;
  }

  /**
   * 初始化 AudioContext（必须在用户交互后调用）
   */
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.12;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }

  _ensure() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  get muted() { return this._muted; }

  toggleMute() {
    this._muted = !this._muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this._muted ? 0 : 0.5;
    }
    return this._muted;
  }

  // ==================== BGM ====================

  playArchiveBGM() {
    this._ensure();
    this._stopBGM();
    this._bgmPlaying = true;
    // 温暖的 C 大调和弦铺垫
    this._createPad([261.63, 329.63, 392.00], 0.10); // C4 E4 G4
    this._createPad([523.25, 659.25, 783.99], 0.035); // C5 E5 G5 高音 shimmer
  }

  playParkourBGM() {
    this._ensure();
    this._stopBGM();
    this._bgmPlaying = true;
    // 更有活力的 D 大调
    this._createPad([293.66, 369.99, 440.00], 0.08); // D4 F#4 A4
    this._createPulse();
  }

  _stopBGM() {
    this._bgmPlaying = false;
    this._bgmNodes.forEach(n => {
      try { n.stop?.(); } catch (e) { /* ignore */ }
      try { n.disconnect?.(); } catch (e) { /* ignore */ }
    });
    this._bgmNodes = [];
  }

  _createPad(freqs, volume) {
    if (!this.ctx) return;
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoAmp = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq + (Math.random() - 0.5) * 0.5;

      // 极慢的 LFO 制造梦幻呼吸感
      lfo.frequency.value = 0.08 + Math.random() * 0.15;
      lfoAmp.gain.value = volume * 0.4;

      lfo.connect(lfoAmp);
      lfoAmp.connect(gain.gain);
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start();
      lfo.start();

      this._bgmNodes.push(osc, gain, lfo, lfoAmp);
    });
  }

  _createPulse() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start();
    this._bgmNodes.push(osc, gain);

    const pulse = () => {
      if (!this._bgmPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      this._pulseTimer = setTimeout(pulse, 480);
    };
    pulse();
  }

  stopBGM() {
    this._stopBGM();
  }

  // ==================== SFX 基础方法 ====================

  _tone(freq, duration, type = 'sine', gainVal = 0.3) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) { /* ignore */ }
  }

  _chord(freqs, duration, type = 'sine', gainVal = 0.2) {
    freqs.forEach(f => this._tone(f, duration, type, gainVal / freqs.length));
  }

  _sweep(fromFreq, toFreq, duration, type = 'sine', gainVal = 0.2) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(fromFreq, now);
      osc.frequency.linearRampToValueAtTime(toFreq, now + duration);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) { /* ignore */ }
  }

  _noise(duration, gainVal = 0.08) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      if (bufferSize <= 0) return;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      src.connect(gain);
      gain.connect(this.sfxGain);
      src.start(now);
    } catch (e) { /* ignore */ }
  }

  _bell(freq, duration, gainVal = 0.15) {
    // 带泛音的钟声音色
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [1, 2.01, 3.02, 4.03].forEach((mul, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'sine';
        osc.frequency.setValueAtTime(freq * mul, now);
        const v = gainVal / (i + 1);
        gain.gain.setValueAtTime(v, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / (i + 0.5));
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      });
    } catch (e) { /* ignore */ }
  }

  // ==================== 场景音效 ====================

  /** 开始扫描 — 上升琶音 */
  scanStart() {
    this._tone(523.25, 0.12, 'sine', 0.15);
    setTimeout(() => this._tone(659.25, 0.12, 'sine', 0.15), 80);
    setTimeout(() => this._tone(783.99, 0.15, 'sine', 0.15), 160);
  }

  /** 全对 — 金色 fanfare */
  scanPerfect() {
    this._chord([523.25, 659.25, 783.99, 1046.5], 0.8, 'triangle', 0.3);
    setTimeout(() => this._bell(1318.5, 0.6, 0.12), 150);
  }

  /** 扫描完成 — 柔和和弦 */
  scanComplete() {
    this._chord([392.0, 523.25, 659.25], 0.5, 'sine', 0.18);
  }

  /** 悖论 — 低沉不协和 */
  paradox() {
    this._tone(150, 0.4, 'sawtooth', 0.12);
    setTimeout(() => this._tone(142, 0.35, 'sawtooth', 0.1), 80);
    this._noise(0.25, 0.06);
  }

  /** 悖论修复 — 上升扫频 + 明亮和弦 */
  repair() {
    this._sweep(200, 800, 0.4, 'sine', 0.15);
    setTimeout(() => this._chord([523.25, 783.99, 1046.5], 0.6, 'sine', 0.18), 250);
  }

  /** 资源雨 — 随机叮当声 */
  resourceRain() {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this._bell(600 + Math.random() * 1000, 0.12, 0.06);
      }, i * 120 + Math.random() * 60);
    }
  }

  /** 收集星光（跑酷金币） */
  coinCollect() {
    this._tone(1318.5, 0.08, 'sine', 0.12);
    setTimeout(() => this._tone(1568.0, 0.1, 'triangle', 0.08), 40);
  }

  /** 跑酷碰撞 */
  parkourHit() {
    this._tone(80, 0.25, 'sine', 0.25);
    this._noise(0.12, 0.08);
  }

  /** 跑酷游戏结束 */
  gameOver() {
    this._tone(523.25, 0.4, 'sine', 0.15);
    setTimeout(() => this._tone(466.16, 0.4, 'sine', 0.15), 350);
    setTimeout(() => this._tone(392.0, 0.4, 'sine', 0.15), 700);
    setTimeout(() => this._tone(311.13, 0.6, 'sine', 0.12), 1050);
  }

  /** 逻辑门答对 */
  gateCorrect() {
    this._tone(659.25, 0.12, 'triangle', 0.15);
    setTimeout(() => this._tone(783.99, 0.2, 'triangle', 0.12), 80);
  }

  /** 逻辑门答错 */
  gateWrong() {
    this._tone(220, 0.2, 'square', 0.08);
    this._tone(208, 0.2, 'square', 0.06);
  }

  /** 喂食 */
  petFeed() {
    this._tone(523.25, 0.15, 'sine', 0.15);
    setTimeout(() => this._tone(659.25, 0.25, 'sine', 0.12), 120);
  }

  /** 抚摸 */
  petStroke() {
    this._tone(330, 0.3, 'sine', 0.08);
    this._tone(332, 0.3, 'sine', 0.06);
  }

  /** 进化 */
  evolution() {
    this._sweep(400, 1200, 0.6, 'sine', 0.18);
    setTimeout(() => this._chord([523.25, 783.99, 1046.5, 1318.5], 0.8, 'triangle', 0.2), 400);
    setTimeout(() => this._bell(1568.0, 0.8, 0.15), 600);
  }

  /** 成就解锁 */
  achievement() {
    this._chord([523.25, 659.25, 783.99], 0.12, 'triangle', 0.12);
    setTimeout(() => this._chord([659.25, 783.99, 1046.5], 0.12, 'triangle', 0.12), 120);
    setTimeout(() => this._chord([783.99, 1046.5, 1318.5], 0.5, 'triangle', 0.18), 240);
  }

  /** 辩论答对 */
  debateCorrect() {
    this._tone(523.25, 0.15, 'sine', 0.15);
    setTimeout(() => this._tone(783.99, 0.25, 'triangle', 0.12), 120);
  }

  /** 辩论答错 */
  debateWrong() {
    this._tone(180, 0.25, 'square', 0.07);
    setTimeout(() => this._tone(170, 0.3, 'square', 0.05), 100);
  }

  /** UI 按钮点击 */
  click() {
    this._tone(1200, 0.025, 'sine', 0.05);
  }

  /** 面板打开 — 嗖声 */
  panelOpen() {
    this._sweep(400, 1200, 0.15, 'sine', 0.06);
    this._noise(0.12, 0.02);
  }

  /** 面板关闭 */
  panelClose() {
    this._sweep(1200, 300, 0.12, 'sine', 0.04);
  }
}

// 全局单例
let instance = null;
export function getSoundManager() {
  if (!instance) instance = new SoundManager();
  return instance;
}

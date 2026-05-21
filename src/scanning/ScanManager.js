/**
 * 扫描管理器 — 协调摄像头、判题、奖励、悖论修复的完整流程
 */
import { CameraManager } from './CameraManager.js';
import { GradingFlow } from './GradingFlow.js';
import { ResourceRain } from '../animations/ResourceRain.js';
import { ParadoxEvent } from '../events/ParadoxEvent.js';
import { interactWithPet } from '../models/Pet.js';
import { getSoundManager } from '../systems/SoundManager.js';
import { gameData } from '../data/gameData.js';

export class ScanManager {
  /**
   * @param {import('../scene/ArchiveScene.js').ArchiveScene} archiveScene
   */
  constructor(archiveScene) {
    this.archiveScene = archiveScene;
    this.camera = new CameraManager();
    this.rain = new ResourceRain();
    this.paradox = new ParadoxEvent(archiveScene);

    this.processingEl = document.getElementById('scan-processing');
    this.processingText = document.getElementById('scan-processing-text');
    this.processingPet = document.getElementById('scan-processing-pet');
    this.cameraOverlay = document.getElementById('camera-overlay');
    this.petAvatar = document.getElementById('scan-pet-avatar');
    this.petBubble = document.getElementById('scan-pet-bubble');
    this.scanPetEl = document.getElementById('scan-pet');

    this._petEmojis = { base: '🌟', owl: '🦉', cat: '🐱', unicorn: '🦄' };
    this._bubbleMessages = [
      '让我看看今天的作业~',
      '又有新作业啦！',
      '准备好学习了吗？',
      '今天也要加油哦！',
    ];
    this._captureMessages = [
      '嗯...让我看看...',
      '这道题有点意思！',
      '正在检查中...',
      '魔法扫描启动！',
    ];

    this._bindUI();
  }

  _bindUI() {
    // 扫描按钮
    document.getElementById('scan-btn').addEventListener('click', () => {
      this._startScan();
    });

    // 摄像头关闭
    document.getElementById('camera-close').addEventListener('click', () => {
      this._closeCamera();
    });

    // 拍摄按钮
    document.getElementById('capture-btn').addEventListener('click', () => {
      this._onCapture();
    });
  }

  async _startScan() {
    this.cameraOverlay.classList.add('active');
    // 显示宠物
    const msg = this._bubbleMessages[Math.floor(Math.random() * this._bubbleMessages.length)];
    this._updatePetAvatar(null, msg);
    getSoundManager().scanStart();
    const ok = await this.camera.start();
    if (!ok) {
      this.cameraOverlay.classList.remove('active');
      this._showPrompt('⚠️ 无法启动摄像头，请在浏览器中允许相机权限');
      // 直接打开判题面板（降级模式）
      this._openGrading(null);
    }
  }

  async _onCapture() {
    // 捕获帧
    const frame = this.camera.captureFrame();

    // 关闭摄像头
    this._closeCamera();

    // 显示处理动画（带宠物）
    this.processingEl.classList.add('active');
    if (this.processingPet) this.processingPet.textContent = this._getPetEmoji();
    if (this.processingText) this.processingText.textContent = '小星正在检查你的作业...';

    // 扫描处理音效
    getSoundManager().scanStart();

    // 模拟 OCR 处理延迟（1.5 秒）
    await new Promise(r => setTimeout(r, 1500));

    this.processingEl.classList.remove('active');

    // 打开判题面板
    this._openGrading(null);
  }

  _openGrading(subject) {
    if (!this.grading) {
      this.grading = new GradingFlow((result) => this._onGradingComplete(result));
    }
    this.grading.open(subject);
  }

  /**
   * 判题完成回调
   */
  _onGradingComplete(result) {
    const { wrong, isPerfect, subject, rewards } = result;

    // 1. 播放资源雨动画
    this._playRewardAnimation(isPerfect, rewards);

    // 2. 如果有错题，触发悖论损坏
    if (wrong > 0) {
      this.paradox.trigger(wrong);
    }

    // 3. 宠物反应
    if (isPerfect) {
      this._updatePetAvatar(null, '太棒了！全对！🌟');
      setTimeout(() => this._updatePetAvatar(null, '档案馆因你而闪耀！'), 1500);
      if (this.archiveScene.pet) {
        interactWithPet(this.archiveScene.pet);
      }
    } else if (wrong > 0) {
      this._updatePetAvatar(null, `有 ${wrong} 道错题呢，我们一起订正吧！`);
    } else {
      this._updatePetAvatar(null, '完成啦！继续加油~');
    }
  }

  _playRewardAnimation(isPerfect, rewards) {
    if (isPerfect) {
      this.rain.playPerfect();
    } else {
      // 找第一个有奖励的资源类型播放
      const types = Object.keys(rewards);
      if (types.length > 0) {
        this.rain.play(types[0], 40, 2000);
        // 如果有第二个资源，也播放
        if (types.length > 1) {
          setTimeout(() => this.rain.play(types[1], 25, 1500), 500);
        }
      }
    }
  }

  _getPetEmoji() {
    const evo = gameData.pet.evolution;
    return this._petEmojis[evo] || this._petEmojis.base;
  }

  _updatePetAvatar(emoji, msg) {
    if (this.petAvatar) this.petAvatar.textContent = emoji || this._getPetEmoji();
    if (this.petBubble) this.petBubble.textContent = msg || '...';
  }

  _closeCamera() {
    this.camera.stop();
    this.cameraOverlay.classList.remove('active');
  }

  _showPrompt(text) {
    const el = document.getElementById('interact-prompt');
    if (!el) return;
    el.textContent = text;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 3000);
  }
}

import * as THREE from 'three';
import { TrackGenerator } from './TrackGenerator.js';
import { PlayerController } from './PlayerController.js';
import { ObstacleManager } from './ObstacleManager.js';
import { LogicGateManager } from './LogicGate.js';
import { gameData, updateHUD } from '../data/gameData.js';
import { getSoundManager } from '../systems/SoundManager.js';

/**
 * 星光回廊跑酷 — 主游戏管理器
 */
export class ParkourGame {
  constructor(container) {
    this.container = container;
    this.isRunning = false;
    this.isPaused = false;
    this.animId = null;

    // 音效
    this.sound = getSoundManager();

    // 游戏参数
    this.score = 0;
    this.distance = 0;
    this.speed = 8;
    this.baseSpeed = 8;
    this.maxSpeed = 20;
    this.shield = 100;
    this.maxShield = 100;
    this.coins = 0;
    this.gatesPassed = 0;

    // 场景主题循环
    this.biomes = ['library', 'starry', 'deepsea', 'cloud'];
    this.currentBiome = 0;
    this.nextBiomeChange = 200; // 每200单位切换

    // 场景背景
    this.bgColor = new THREE.Color(0x1B1F3B);
    this.fogColor = new THREE.Color(0x1B1F3B);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    // 场景 / 相机
    this.scene = new THREE.Scene();
    this.scene.background = this.bgColor;
    this.scene.fog = new THREE.Fog(this.fogColor, 15, 35);

    this.camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 80);
    this.camera.position.set(0, 2.5, 3.5);
    this.camera.lookAt(0, 0, -10);

    container.appendChild(this.renderer.domElement);

    // 灯光
    const ambient = new THREE.AmbientLight(0x8B9DC3, 0.8);
    this.scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xFFD700, 1.0);
    mainLight.position.set(0, 5, -5);
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xFFB7C5, 0.4);
    fillLight.position.set(-3, 2, 5);
    this.scene.add(fillLight);

    // 子系统
    this.track = new TrackGenerator(this.scene);
    this.player = new PlayerController(this.scene);
    this.obstacles = new ObstacleManager(this.scene, this.track);
    this.gateManager = new LogicGateManager(this.scene, this.track);

    // 键盘控制
    this.keys = {};
    this._bindControls();

    // 窗口调整
    window.addEventListener('resize', this._onResize.bind(this));
  }

  _bindControls() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (this.isRunning) {
        switch (e.key) {
          case 'ArrowLeft': this.player.moveLeft(); break;
          case 'ArrowRight': this.player.moveRight(); break;
          case 'ArrowUp': case ' ': this.player.jump(); break;
          case 'ArrowDown': this.player.slide(); break;
        }
      }
    });
    document.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });

    // 触摸控制
    let touchStartX = 0, touchStartY = 0;
    this.container.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    }, { passive: true });

    this.container.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.isRunning) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) > 20) {
        dx > 0 ? this.player.moveRight() : this.player.moveLeft();
        touchStartX = t.clientX;
      }
      if (dy < -20) { this.player.jump(); touchStartY = t.clientY; }
      if (dy > 20) { this.player.slide(); touchStartY = t.clientY; }
    }, { passive: false });
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /**
   * 开始游戏
   */
  start() {
    this.isRunning = true;
    this.score = 0;
    this.distance = 0;
    this.shield = 100;
    this.coins = 0;
    this.gatesPassed = 0;
    this.speed = this.baseSpeed;
    this.currentBiome = 0;
    this.nextBiomeChange = 200;

    // 根据学习进度调整速度和护盾
    this._applyLearningStats();

    this.player.reset(0);
    this.sound.playParkourBGM();
    this._showHUD();
    this._animate();
  }

  _applyLearningStats() {
    // 速度 = 基础速度 + 口算完成量 * 0.1
    const oralDone = gameData.stats.subjects.math?.done || 0;
    this.baseSpeed = 8 + Math.min(oralDone * 0.05, 4);
    this.speed = this.baseSpeed;

    // 护盾 = 基础护盾 + 数学正确率 * 20
    const mathStats = gameData.stats.subjects.math;
    if (mathStats && mathStats.done > 0) {
      const accuracy = mathStats.correct / mathStats.done;
      this.shield = 50 + accuracy * 50;
      this.maxShield = 100;
    }
  }

  /**
   * 停止游戏
   */
  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this._hideHUD();
  }

  /**
   * 游戏结束
   */
  gameOver(reason) {
    this.isRunning = false;
    this.sound.gameOver();
    this.sound.stopBGM();

    // 结算资源奖励
    const coinReward = Math.floor(this.coins * 0.5);
    const distReward = Math.floor(this.distance / 30);
    gameData.resources.dust += coinReward + distReward;
    gameData.resources.rune += Math.floor(this.gatesPassed * 2);
    updateHUD();

    // 显示结算面板
    this._showGameOver(coinReward + distReward, reason);
  }

  _animate() {
    if (!this.isRunning) return;

    const delta = Math.min(this.clock ? this.clock.getDelta() : 0.016, 0.033);
    if (!this.clock) this.clock = new THREE.Clock();

    // 速度逐渐提升
    this.speed = Math.min(this.speed + delta * 0.15, this.maxSpeed);

    // 更新玩家
    this.player.update(delta, this.speed);

    // 更新赛道
    this.track.update(this.player.z);

    // 生成障碍物和门
    this.obstacles.spawn(this.player.z);
    this.gateManager.spawn(this.player.z);

    // 碰撞检测
    const collision = this.obstacles.checkCollisions(this.player);
    if (collision) {
      if (collision.hit) {
        this._onHit(collision.type);
      } else if (collision.type === 'coin') {
        this.coins++;
        this.sound.coinCollect();
        this._updateScore();
      }
    }

    // 逻辑门检测
    const gateResult = this.gateManager.checkPass(this.player);
    if (gateResult) {
      this._onGatePass(gateResult);
    }

    // 清理
    this.obstacles.cleanup(this.player.z);
    this.gateManager.cleanup(this.player.z);

    // 距离
    this.distance += this.speed * delta;
    this._updateScore();

    // 场景主题切换
    if (this.distance > this.nextBiomeChange) {
      this._changeBiome();
    }

    // 相机跟随
    this.camera.position.set(
      this.player.x * 0.3,
      2.5 + (this.player.isJumping ? Math.abs(this.player.y) * 0.3 : 0),
      this.player.z + 3.5
    );
    this.camera.lookAt(this.player.x * 0.3, 0.3, this.player.z - 8);

    // 护盾自然恢复
    if (this.shield < this.maxShield) {
      this.shield = Math.min(this.shield + delta * 0.5, this.maxShield);
      this._updateShield();
    }

    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(() => this._animate());
  }

  _onHit(type) {
    const damage = type === 'wall' ? 20 : 10;
    this.shield = Math.max(0, this.shield - damage);
    this._updateShield();

    this.sound.parkourHit();

    // 无敌
    this.player.setInvincible(0.8);

    // 屏幕震动效果
    this._screenShake();

    if (this.shield <= 0) {
      this.gameOver('护盾耗尽');
    }
  }

  _onGatePass(result) {
    this.gatesPassed++;

    if (result.wentThroughCorrect) {
      // 答对：加速
      this.speed = Math.min(this.speed + 1.5, this.maxSpeed);
      this.score += 50;
      this.sound.gateCorrect();
      this._showFloatingText('✓ 正确!', 0x00FF88);
    } else {
      // 答错：减速 + 扣护盾
      this.speed = Math.max(this.baseSpeed, this.speed - 2);
      this.shield = Math.max(0, this.shield - 15);
      this.sound.gateWrong();
      this._showFloatingText('✗ 错误!', 0xFF6B6B);
      this._screenShake();

      if (this.shield <= 0) {
        this.gameOver('悖论冲击');
      }
    }
  }

  _changeBiome() {
    this.currentBiome = (this.currentBiome + 1) % this.biomes.length;
    this.nextBiomeChange += 200;

    const biome = this.biomes[this.currentBiome];
    const colors = {
      library: { bg: 0x1B1F3B, fog: 0x1B1F3B },
      starry: { bg: 0x0A0A2A, fog: 0x0A0A2A },
      deepsea: { bg: 0x051A2A, fog: 0x051A2A },
      cloud: { bg: 0x2A1A3A, fog: 0x2A1A3A },
    };
    const c = colors[biome];
    this.bgColor.setHex(c.bg);
    this.fogColor.setHex(c.fog);
    this.scene.background = this.bgColor;
    this.scene.fog.color = this.fogColor;
    this.track.setTheme(biome);

    this._showFloatingText(`✦ ${this._biomeName(biome)} ✦`, 0xFFD700);
  }

  _biomeName(biome) {
    const names = {
      library: '无限书馆',
      starry: '星河深处',
      deepsea: '深海秘境',
      cloud: '云端仙境',
    };
    return names[biome] || biome;
  }

  _showFloatingText(text, color) {
    // 通过UI显示浮动文字
    const el = document.getElementById('pk-floating');
    if (!el) return;
    el.textContent = text;
    el.style.color = `#${color.toString(16).padStart(6, '0')}`;
    el.classList.add('visible');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('visible'), 1200);
  }

  _screenShake() {
    // 简单CSS屏幕震动
    const el = this.renderer.domElement;
    el.style.transition = 'transform 0.05s';
    el.style.transform = 'translate(3px, -2px)';
    setTimeout(() => { el.style.transform = 'translate(-2px, 1px)'; }, 50);
    setTimeout(() => { el.style.transform = 'translate(1px, -1px)'; }, 100);
    setTimeout(() => { el.style.transform = ''; }, 150);
  }

  _showHUD() {
    const hud = document.getElementById('pk-hud');
    if (hud) hud.classList.add('active');
  }

  _hideHUD() {
    const hud = document.getElementById('pk-hud');
    if (hud) hud.classList.remove('active');
  }

  _updateScore() {
    const el = document.getElementById('pk-score');
    if (el) el.textContent = Math.floor(this.distance);
    const coinEl = document.getElementById('pk-coins');
    if (coinEl) coinEl.textContent = this.coins;
    const speedEl = document.getElementById('pk-speed');
    if (speedEl) speedEl.textContent = Math.floor(this.speed * 10);
  }

  _updateShield() {
    const fill = document.getElementById('pk-shield-fill');
    if (fill) fill.style.width = `${(this.shield / this.maxShield) * 100}%`;
  }

  _showGameOver(reward, reason) {
    const panel = document.getElementById('pk-gameover');
    if (!panel) return;

    document.getElementById('pk-go-score').textContent = Math.floor(this.distance);
    document.getElementById('pk-go-coins').textContent = this.coins;
    document.getElementById('pk-go-gates').textContent = this.gatesPassed;
    document.getElementById('pk-go-reward').textContent = `+${reward} 以太星尘`;

    panel.classList.add('active');
    document.getElementById('pk-hud')?.classList.remove('active');
  }

  restart() {
    document.getElementById('pk-gameover')?.classList.remove('active');
    this.sound.playParkourBGM();
    this.track.dispose();
    this.obstacles.dispose();
    this.gateManager.dispose();

    // 重建
    this.scene = new THREE.Scene();
    this.scene.background = this.bgColor;
    this.scene.fog = new THREE.Fog(this.fogColor, 15, 35);

    // 重新添加灯光
    const ambient = new THREE.AmbientLight(0x8B9DC3, 0.8);
    this.scene.add(ambient);
    const mainLight = new THREE.DirectionalLight(0xFFD700, 1.0);
    mainLight.position.set(0, 5, -5);
    this.scene.add(mainLight);

    this.track = new TrackGenerator(this.scene);
    this.player = new PlayerController(this.scene);
    this.obstacles = new ObstacleManager(this.scene, this.track);
    this.gateManager = new LogicGateManager(this.scene, this.track);

    this.clock = null;
    this.start();
  }

  dispose() {
    this.stop();
    this.sound.playArchiveBGM();
    this.track.dispose();
    this.obstacles.dispose();
    this.gateManager.dispose();
    this.player.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

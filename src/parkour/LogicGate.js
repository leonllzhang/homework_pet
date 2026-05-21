import * as THREE from 'three';

/**
 * 逻辑门户系统 — 分叉路口数学题
 */
export class LogicGateManager {
  constructor(scene, trackGenerator) {
    this.scene = scene;
    this.track = trackGenerator;
    this.gates = [];
    this.spawnDistance = 60; // 每隔60单位生成
    this.nextSpawnZ = -60;

    // 门户材质
    this.gateMat = new THREE.MeshStandardMaterial({
      color: 0x4A6FA5,
      emissive: 0x4A6FA5,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    this.frameMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.9,
    });

    // 问题池
    this.questionPool = this._generateQuestions(30);
  }

  _generateQuestions(count) {
    const questions = [];
    for (let i = 0; i < count; i++) {
      const a = 2 + Math.floor(Math.random() * 12);
      const b = 2 + Math.floor(Math.random() * 9);
      const result = a * b;
      const wrongResult = result + (Math.random() > 0.5 ? a : -b);
      questions.push({
        text: `${a} × ${b} = ?`,
        correctAnswer: result,
        wrongAnswer: wrongResult > 0 ? wrongResult : result + a,
      });
    }
    return questions;
  }

  /**
   * 生成逻辑门户
   */
  spawn(playerZ) {
    if (this.nextSpawnZ > playerZ - 20) return;

    const z = this.nextSpawnZ;
    this.nextSpawnZ -= this.spawnDistance;

    const q = this.questionPool[Math.floor(Math.random() * this.questionPool.length)];

    // 随机排列左右答案
    const leftCorrect = Math.random() > 0.5;
    const leftAnswer = leftCorrect ? q.correctAnswer : q.wrongAnswer;
    const rightAnswer = leftCorrect ? q.wrongAnswer : q.correctAnswer;

    const group = new THREE.Group();
    group.position.z = z;

    // 构建两个门户
    const portalData = [];
    for (let side = -1; side <= 1; side += 2) {
      const isCorrect = (side === -1) ? leftCorrect : !leftCorrect;
      const answer = side === -1 ? leftAnswer : rightAnswer;

      const portalGroup = this._createPortal(side * 1.8, answer, isCorrect);
      group.add(portalGroup);
      portalData.push({ side, isCorrect, answer });
    }

    // 顶部问题显示（用 Sprite）
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 256, 64);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px Georgia, serif';
    ctx.shadowColor = 'rgba(255,215,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(q.text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, 2.2, 0);
    sprite.scale.set(3, 0.75, 1);
    group.add(sprite);

    this.scene.add(group);

    this.gates.push({
      group,
      z,
      leftCorrect,
      rightCorrect: !leftCorrect,
      leftAnswer,
      rightAnswer,
      q,
      passed: false,
    });
  }

  _createPortal(x, answerText, isCorrect) {
    const group = new THREE.Group();
    group.position.x = x;
    group.position.y = 0.3;

    // 拱形门框
    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.06, 8, 16, Math.PI),
      this.frameMat
    );
    frame.position.y = 0.6;
    frame.rotation.y = 0;
    group.add(frame);

    // 门柱
    for (let side = -1; side <= 1; side += 2) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6),
        this.frameMat
      );
      pillar.position.set(side * 0.36, 0.3, 0);
      group.add(pillar);
    }

    // 门内光幕
    const portalPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.7),
      this.gateMat.clone()
    );
    portalPlane.position.set(0, 0.35, 0);
    portalPlane.material.color.setHex(isCorrect ? 0x00FF88 : 0xFF6B6B);
    portalPlane.material.emissive.setHex(isCorrect ? 0x00FF88 : 0xFF6B6B);
    portalPlane.material.emissiveIntensity = 0.4;
    group.add(portalPlane);

    // 答案文字精灵
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.shadowColor = isCorrect ? 'rgba(0,255,136,0.8)' : 'rgba(255,107,107,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = isCorrect ? '#00FF88' : '#FF6B6B';
    ctx.fillText(answerText.toString(), 32, 24);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, 1.1, 0);
    sprite.scale.set(0.6, 0.45, 1);
    group.add(sprite);

    return group;
  }

  /**
   * 检测玩家是否穿过某个门
   */
  checkPass(player) {
    for (const gate of this.gates) {
      if (gate.passed) continue;

      const dz = Math.abs(player.z - gate.z);

      if (dz < 0.6) {
        gate.passed = true;
        const playerLaneX = player.x;

        // 判断玩家在左还是右
        const side = playerLaneX > 0 ? 1 : -1;
        const wentThroughCorrect = (side === -1) ? gate.leftCorrect : gate.rightCorrect;

        return {
          gate,
          wentThroughCorrect,
          correctAnswer: gate.q.correctAnswer,
          question: gate.q.text,
        };
      }
    }
    return null;
  }

  /**
   * 移除后方门
   */
  cleanup(playerZ) {
    this.gates = this.gates.filter(gate => {
      if (gate.z > playerZ + 10) {
        this.scene.remove(gate.group);
        return false;
      }
      return true;
    });
  }

  setQuestionDifficulty(level) {
    // 可以逐步提高难度
  }

  reset() {
    this.gates.forEach(gate => this.scene.remove(gate.group));
    this.gates = [];
    this.nextSpawnZ = -60;
  }

  dispose() {
    this.reset();
    this.gateMat.dispose();
    this.frameMat.dispose();
  }
}

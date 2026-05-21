import * as THREE from 'three';

/**
 * 玩家控制器 — 三车道移动、跳跃、滑铲
 */
export class PlayerController {
  constructor(scene) {
    this.scene = scene;

    // 三车道位置
    this.lanePositions = [-2.5, 0, 2.5];
    this.currentLane = 1; // 中间车道
    this.targetX = 0;

    // 移动参数
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.gravity = -20;
    this.jumpSpeed = 7;
    this.laneSwitchSpeed = 8;
    this.groundY = 0;

    // 无敌帧
    this.invincible = false;
    this.invincibleTimer = 0;

    // 创建宠物模型（简化版适配跑酷）
    this._createModel();

    // 拖尾粒子
    this._createTrail();
  }

  _createModel() {
    const group = new THREE.Group();

    // 发光主体
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xFFE4B5,
      emissive: 0xFFD700,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.3,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), bodyMat);
    body.position.y = 0.2;
    group.add(body);

    // 头部
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xFFF0E0,
      emissive: 0xFFD700,
      emissiveIntensity: 0.15,
      roughness: 0.2,
    });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), headMat);
    head.position.set(0, 0.35, 0.08);
    group.add(head);

    // 眼睛
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    for (let side = -1; side <= 1; side += 2) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMat);
      eye.position.set(side * 0.06, 0.36, 0.14);
      group.add(eye);
    }

    // 翅膀
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.25,
      roughness: 0.3,
      metalness: 0.5,
      side: THREE.DoubleSide,
    });
    for (let side = -1; side <= 1; side += 2) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(side * 0.2, 0.08, side * 0.12, 0.2);
      shape.quadraticCurveTo(0, 0.15, 0, 0);
      const wing = new THREE.Mesh(new THREE.ShapeGeometry(shape), wingMat);
      wing.position.set(0, 0.25, 0);
      wing.rotation.y = side * 0.4;
      wing.rotation.z = side * 0.3;
      group.add(wing);
    }

    this.model = group;
    this.model.position.set(0, 0, 0);
    this.scene.add(this.model);

    // 保存翅膀引用用于动画
    this.wings = group.children.filter(c => c.geometry && c.geometry.type === 'ShapeGeometry');
  }

  _createTrail() {
    const count = 30;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const opacities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] = -i * 0.03;
      sizes[i] = 0.06 - i * 0.002;
      opacities[i] = 1 - i / count;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      color: 0xFFD700,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.trail = new THREE.Points(geo, mat);
    this.trailCount = count;
    this.scene.add(this.trail);
  }

  /**
   * 切换到指定车道
   */
  setLane(laneIndex) {
    if (laneIndex < 0 || laneIndex > 2) return;
    this.currentLane = laneIndex;
    this.targetX = this.lanePositions[laneIndex];
  }

  /**
   * 向左移
   */
  moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetX = this.lanePositions[this.currentLane];
    }
  }

  /**
   * 向右移
   */
  moveRight() {
    if (this.currentLane < 2) {
      this.currentLane++;
      this.targetX = this.lanePositions[this.currentLane];
    }
  }

  /**
   * 跳跃
   */
  jump() {
    if (!this.isJumping && !this.isSliding) {
      this.isJumping = true;
      this.velocityY = this.jumpSpeed;
    }
  }

  /**
   * 滑铲
   */
  slide() {
    if (!this.isJumping && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = 0.6;
      this.model.scale.y = 0.3;
      this.model.position.y = -0.15;
    }
  }

  /**
   * 设置无敌
   */
  setInvincible(duration = 0.5) {
    this.invincible = true;
    this.invincibleTimer = duration;
  }

  /**
   * 获取碰撞体积（用于检测）
   */
  getCollider() {
    return {
      x: this.x,
      y: this.isSliding ? 0.1 : (this.isJumping ? 0.3 + Math.max(0, this.y) : 0.3),
      z: this.z,
      radius: 0.25,
      height: this.isSliding ? 0.2 : 0.5,
    };
  }

  update(delta, forwardSpeed) {
    const dt = Math.min(delta, 0.05);

    // 横向车道切换（平滑）
    const diff = this.targetX - this.x;
    if (Math.abs(diff) > 0.01) {
      this.x += Math.sign(diff) * Math.min(Math.abs(diff), this.laneSwitchSpeed * dt);
    } else {
      this.x = this.targetX;
    }

    // 跳跃物理
    if (this.isJumping) {
      this.velocityY += this.gravity * dt;
      this.y += this.velocityY * dt;
      if (this.y <= this.groundY) {
        this.y = this.groundY;
        this.isJumping = false;
        this.velocityY = 0;
      }
    }

    // 滑铲计时
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.model.scale.y = 1;
        this.model.position.y = 0;
      }
    }

    // 前进
    this.z -= forwardSpeed * dt;

    // 无敌计时
    if (this.invincible) {
      this.invincibleTimer -= dt;
      this.model.visible = Math.floor(this.invincibleTimer * 20) % 2 === 0;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.model.visible = true;
      }
    }

    // 更新模型位置
    this.model.position.set(this.x, this.y, this.z);

    // 模型倾斜
    const leanAngle = (this.x - this.targetX) * 0.3;
    this.model.rotation.z = -leanAngle;
    this.model.rotation.x = this.velocityY * 0.01;

    // 翅膀拍动
    const wingPhase = performance.now() * 0.005;
    this.wings.forEach((wing, i) => {
      const side = i === 0 ? -1 : 1;
      const flap = Math.sin(wingPhase + i) * 0.15;
      wing.rotation.z = side * (0.3 + flap);
    });

    // 拖尾更新
    this._updateTrail(dt);
  }

  _updateTrail(dt) {
    const pos = this.trail.geometry.attributes.position.array;

    // 向后移动拖尾点
    for (let i = this.trailCount - 1; i > 0; i--) {
      pos[i * 3] = pos[(i - 1) * 3];
      pos[i * 3 + 1] = pos[(i - 1) * 3 + 1];
      pos[i * 3 + 2] = pos[(i - 1) * 3 + 2];
    }

    // 第一个点跟随玩家
    pos[0] = this.x;
    pos[1] = this.y + 0.1;
    pos[2] = this.z;

    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.position.set(0, 0, 0);
  }

  reset(startZ) {
    this.x = 0;
    this.y = 0;
    this.z = startZ || 0;
    this.currentLane = 1;
    this.targetX = 0;
    this.velocityY = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.invincible = false;
    this.model.scale.y = 1;
    this.model.position.y = 0;
    this.model.visible = true;
  }

  dispose() {
    this.scene.remove(this.model);
    this.scene.remove(this.trail);
    this.trail.geometry.dispose();
    this.trail.material.dispose();
  }
}

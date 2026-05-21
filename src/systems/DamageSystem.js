import * as THREE from 'three';

/**
 * 建筑损坏系统 — 与错题联动的可视化损坏
 */
export class DamageSystem {
  constructor(scene) {
    this.scene = scene;
    this.damagedObjects = [];
    this.activeCracks = [];
  }

  /**
   * 在指定位置创建损坏效果
   * @param {THREE.Vector3} position 损坏位置
   * @param {number} severity 损坏程度 0-1
   */
  addDamage(position, severity = 0.5) {
    // 灰色裂痕粒子
    const crackCount = Math.floor(20 + severity * 40);
    const positions = new Float32Array(crackCount * 3);
    const sizes = new Float32Array(crackCount);

    for (let i = 0; i < crackCount; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.3;
      sizes[i] = 0.01 + Math.random() * 0.03;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      color: 0x666677,
      size: 0.02,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const crackParticles = new THREE.Points(geo, mat);
    crackParticles.position.copy(position);
    this.scene.add(crackParticles);
    this.activeCracks.push({
      mesh: crackParticles,
      life: 1.0,
      severity,
    });

    // 损坏指示器 — 半透明灰色球体
    const indicatorMat = new THREE.MeshBasicMaterial({
      color: 0x666677,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    });
    const indicator = new THREE.Mesh(
      new THREE.SphereGeometry(0.2 + severity * 0.2, 8, 8),
      indicatorMat
    );
    indicator.position.copy(position);
    this.scene.add(indicator);
    this.damagedObjects.push({
      mesh: indicator,
      life: 1.0,
      severity,
    });

    // 创建后立即触发损坏事件动画
    this._emitDamageParticles(position, severity);
  }

  /**
   * 修复指定位置的损坏
   */
  repairAt(position, range = 0.5) {
    const repaired = [];

    // 修复裂痕粒子
    this.activeCracks = this.activeCracks.filter((c) => {
      const dist = c.mesh.position.distanceTo(position);
      if (dist < range) {
        this.scene.remove(c.mesh);
        c.mesh.geometry.dispose();
        c.mesh.material.dispose();
        repaired.push(c);
        return false;
      }
      return true;
    });

    // 修复指示器
    this.damagedObjects = this.damagedObjects.filter((d) => {
      const dist = d.mesh.position.distanceTo(position);
      if (dist < range) {
        this.scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mesh.material.dispose();
        repaired.push(d);
        return false;
      }
      return true;
    });

    // 修复特效 — 金色粒子爆发
    if (repaired.length > 0) {
      this._emitRepairParticles(position);
    }

    return repaired.length > 0;
  }

  /**
   * 更新损坏效果（淡出等）
   */
  update(delta) {
    // 更新裂痕
    this.activeCracks.forEach((c) => {
      c.life -= delta * 0.1;
      c.mesh.material.opacity = c.life * 0.7;
    });

    // 更新指示器
    this.damagedObjects.forEach((d) => {
      d.life -= delta * 0.05;
      d.mesh.material.opacity = d.life * 0.15;
    });
  }

  _emitDamageParticles(position, severity) {
    const count = Math.floor(10 + severity * 20);
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random(),
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(0.1 + Math.random() * 0.3);
      pos[i * 3] = dir.x;
      pos[i * 3 + 1] = dir.y;
      pos[i * 3 + 2] = dir.z;
      colors[i * 3] = 0.4;
      colors[i * 3 + 1] = 0.4;
      colors[i * 3 + 2] = 0.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const burst = new THREE.Points(geo, mat);
    burst.position.copy(position);
    this.scene.add(burst);

    // 1 秒后自动消失
    setTimeout(() => {
      this.scene.remove(burst);
      burst.geometry.dispose();
      burst.material.dispose();
    }, 1000);
  }

  _emitRepairParticles(position) {
    const count = 30;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 0.1 + Math.random() * 0.2;
      pos[i * 3] = Math.cos(angle) * rad;
      pos[i * 3 + 1] = Math.random() * 0.4;
      pos[i * 3 + 2] = Math.sin(angle) * rad;
      colors[i * 3] = 0.8 + Math.random() * 0.2;
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.2 + Math.random() * 0.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const burst = new THREE.Points(geo, mat);
    burst.position.copy(position);
    this.scene.add(burst);

    setTimeout(() => {
      this.scene.remove(burst);
      burst.geometry.dispose();
      burst.material.dispose();
    }, 1500);
  }

  /**
   * 根据错题数触发损坏
   */
  triggerParadox(wrongCount) {
    if (wrongCount <= 0) return;

    // 在书架位置随机选择损坏点
    const positions = [
      new THREE.Vector3(-2.5, 2, -3),
      new THREE.Vector3(2.5, 1.5, -3.5),
      new THREE.Vector3(-3, 2.5, 2),
      new THREE.Vector3(3.5, 2, 2.5),
    ];

    const count = Math.min(wrongCount, positions.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * positions.length);
      this.addDamage(positions[idx], 0.3 + Math.random() * 0.4);
    }
  }
}

import * as THREE from 'three';

/**
 * 障碍物管理器 — 生成和管理跑道上的障碍物
 */
export class ObstacleManager {
  constructor(scene, trackGenerator) {
    this.scene = scene;
    this.track = trackGenerator;
    this.obstacles = [];
    this.spawnInterval = 8; // 每多少单位生成一个
    this.lastSpawnZ = 0;

    // 障碍物材质池
    this.wallMat = new THREE.MeshStandardMaterial({
      color: 0x6B3A7A,
      emissive: 0x6B3A7A,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.7,
    });

    this.barrierMat = new THREE.MeshStandardMaterial({
      color: 0x4A6FA5,
      emissive: 0x4A6FA5,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.5,
    });

    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.3,
    });
  }

  /**
   * 生成新障碍物（在玩家前方）
   */
  spawn(playerZ) {
    const spawnZ = playerZ - 30;
    if (this.lastSpawnZ - spawnZ < this.spawnInterval) return;

    this.lastSpawnZ = spawnZ;

    const type = Math.random();
    if (type < 0.4) {
      this._spawnWallGap(spawnZ);
    } else if (type < 0.7) {
      this._spawnBarrier(spawnZ);
    } else {
      this._spawnCoin(spawnZ);
    }
  }

  /**
   * 墙+缺口：必须切换到正确车道
   */
  _spawnWallGap(z) {
    const safeLane = Math.floor(Math.random() * 3);
    const group = new THREE.Group();

    for (let lane = 0; lane < 3; lane++) {
      if (lane === safeLane) continue;
      const x = this.track.getLaneX(lane);
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(this.track.getLaneWidth() - 0.3, 0.8, 0.4),
        this.wallMat
      );
      wall.position.set(x, 0.4, 0);
      group.add(wall);
    }

    // 发光标记提示安全车道
    const hint = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.3, 12),
      new THREE.MeshBasicMaterial({
        color: 0x00FF88,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      })
    );
    hint.rotation.x = -Math.PI / 2;
    hint.position.set(this.track.getLaneX(safeLane), 0.02, 0);
    group.add(hint);

    group.position.z = z;
    this.scene.add(group);
    this.obstacles.push({
      group,
      z,
      type: 'wall',
      safeLane,
      passed: false,
    });
  }

  /**
   * 低栏：必须跳跃
   */
  _spawnBarrier(z) {
    const lane = Math.floor(Math.random() * 3);
    const group = new THREE.Group();

    const barrier = new THREE.Mesh(
      new THREE.BoxGeometry(this.track.getLaneWidth() - 0.5, 0.25, 0.3),
      this.barrierMat
    );
    barrier.position.set(this.track.getLaneX(lane), 0.125, 0);
    group.add(barrier);

    // 上方警告标记
    const warn = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xFF4444 })
    );
    warn.position.set(this.track.getLaneX(lane), 0.5, 0);
    group.add(warn);

    group.position.z = z;
    this.scene.add(group);
    this.obstacles.push({
      group,
      z,
      type: 'barrier',
      lane,
      passed: false,
    });
  }

  /**
   * 金币（收集物）
   */
  _spawnCoin(z) {
    const lane = Math.floor(Math.random() * 3);
    const group = new THREE.Group();

    // 发光金币
    const coin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.03, 12),
      this.goldMat
    );
    coin.position.set(this.track.getLaneX(lane), 0.25, 0);
    coin.rotation.x = Math.PI / 2;
    group.add(coin);

    // 光晕
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.15,
      })
    );
    glow.position.set(this.track.getLaneX(lane), 0.25, 0);
    group.add(glow);

    group.position.z = z;
    this.scene.add(group);
    this.obstacles.push({
      group,
      z,
      type: 'coin',
      lane,
      collected: false,
    });
  }

  /**
   * 碰撞检测
   */
  checkCollisions(player) {
    const collider = player.getCollider();

    for (const obs of this.obstacles) {
      if (obs.passed || obs.collected) continue;

      const dx = Math.abs(collider.x - obs.group.position.x);
      const dz = Math.abs(collider.z - obs.group.position.z);

      if (dz > 0.5) continue;

      switch (obs.type) {
        case 'wall': {
          // 如果玩家不在安全车道且距离够近
          const laneX = this.track.getLaneX(obs.safeLane);
          if (dx > 0.6 && dz < 0.5) {
            obs.passed = true;
            return { hit: true, type: 'wall' };
          }
          if (dz < 0.3) obs.passed = true;
          break;
        }
        case 'barrier': {
          // 低栏：如果在同一车道且没在跳跃
          const barLaneX = this.track.getLaneX(obs.lane);
          if (Math.abs(collider.x - barLaneX) < 0.6 && dz < 0.4) {
            if (player.isJumping && player.y > 0.3) {
              obs.passed = true; // 跳过
            } else {
              obs.passed = true;
              return { hit: true, type: 'barrier' };
            }
          }
          break;
        }
        case 'coin': {
          const coinLaneX = this.track.getLaneX(obs.lane);
          if (Math.abs(collider.x - coinLaneX) < 0.6 && dz < 0.4) {
            obs.collected = true;
            this._collectCoin(obs);
            return { hit: false, type: 'coin', lane: obs.lane };
          }
          break;
        }
      }
    }
    return null;
  }

  _collectCoin(obs) {
    this.scene.remove(obs.group);
  }

  /**
   * 移除玩家后方障碍物
   */
  cleanup(playerZ) {
    this.obstacles = this.obstacles.filter(obs => {
      if (obs.z > playerZ + 10) {
        this.scene.remove(obs.group);
        return false;
      }
      return true;
    });
  }

  reset() {
    this.obstacles.forEach(obs => this.scene.remove(obs.group));
    this.obstacles = [];
    this.lastSpawnZ = 0;
  }

  dispose() {
    this.reset();
    this.wallMat.dispose();
    this.barrierMat.dispose();
    this.goldMat.dispose();
  }
}

import * as THREE from 'three';

const SEGMENT_LENGTH = 20;
const LANE_WIDTH = 2.5;
const TRACK_WIDTH = LANE_WIDTH * 3 + 1;

/**
 * 赛道生成器 — 程序化生成无限跑道路段
 */
export class TrackGenerator {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.lastZ = 0;
    this.segmentPool = [];

    // 路段材质
    this.roadMat = new THREE.MeshStandardMaterial({
      color: 0x2A2F4A,
      roughness: 0.6,
      metalness: 0.3,
      transparent: true,
      opacity: 0.6,
    });

    this.laneMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.3,
    });

    this.barrierMat = new THREE.MeshStandardMaterial({
      color: 0x4A6FA5,
      emissive: 0x4A6FA5,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.2,
    });

    // 初始生成
    this.generateInitial(6);
  }

  generateInitial(count) {
    for (let i = 0; i < count; i++) {
      this._addSegment(-i * SEGMENT_LENGTH);
    }
  }

  /**
   * 更新赛道（保持玩家前方有足够路段）
   */
  update(playerZ) {
    const aheadZ = playerZ - 40; // 玩家前方需要40单位
    const behindZ = playerZ + 30; // 玩家后方30单位外回收

    // 添加新段
    while (this.lastZ > aheadZ) {
      this._addSegment(this.lastZ - SEGMENT_LENGTH);
    }

    // 回收后面的段
    this.segments = this.segments.filter(seg => {
      if (seg.z > behindZ) {
        this._recycleSegment(seg);
        return false;
      }
      return true;
    });
  }

  _addSegment(z) {
    const seg = this._createSegment(z);
    this.segments.push(seg);
    this.lastZ = Math.min(this.lastZ, z);
  }

  _createSegment(z) {
    const group = new THREE.Group();
    group.position.z = z;

    // 路面
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(TRACK_WIDTH, SEGMENT_LENGTH),
      this.roadMat
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.05;
    road.receiveShadow = true;
    group.add(road);

    // 车道线（三条发光条）
    for (let lane = -1; lane <= 1; lane++) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.03, SEGMENT_LENGTH - 1),
        this.laneMat
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(lane * LANE_WIDTH, 0.01, 0);
      group.add(line);
    }

    // 两侧护栏
    for (let side = -1; side <= 1; side += 2) {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.3, SEGMENT_LENGTH),
        this.barrierMat
      );
      barrier.position.set(side * (TRACK_WIDTH / 2 + 0.1), 0.15, 0);
      group.add(barrier);
    }

    // 两侧装饰柱
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6),
          new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.4,
          })
        );
        pillar.position.set(
          side * (TRACK_WIDTH / 2 + 0.5),
          0.4,
          -SEGMENT_LENGTH / 2 + i * (SEGMENT_LENGTH / 3)
        );
        group.add(pillar);
      }
    }

    this.scene.add(group);
    return { group, z, obstacles: [] };
  }

  _recycleSegment(seg) {
    this.scene.remove(seg.group);
    // 简单清理：移除子对象
    seg.group.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
    });
  }

  /**
   * 获取当前赛道上的位置信息
   */
  getLaneX(laneIndex) {
    return (laneIndex - 1) * LANE_WIDTH;
  }

  getLaneWidth() {
    return LANE_WIDTH;
  }

  getTrackWidth() {
    return TRACK_WIDTH;
  }

  /**
   * 应用场景主题颜色
   */
  setTheme(theme) {
    const themes = {
      library: { road: 0x2A2F4A, lane: 0xFFD700, barrier: 0x4A6FA5 },
      starry: { road: 0x1A1A3A, lane: 0xB0C4FF, barrier: 0x6B6FA5 },
      deepsea: { road: 0x0A2A3A, lane: 0x7EB8E8, barrier: 0x2A6B8A },
      cloud: { road: 0x3A2A4A, lane: 0xFFB7C5, barrier: 0xA06BA8 },
    };
    const t = themes[theme] || themes.library;

    this.roadMat.color.setHex(t.road);
    this.laneMat.color.setHex(t.lane);
    this.laneMat.emissive.setHex(t.lane);
    this.barrierMat.color.setHex(t.barrier);
    this.barrierMat.emissive.setHex(t.barrier);
  }

  dispose() {
    this.segments.forEach(seg => this._recycleSegment(seg));
    this.segments = [];
    this.roadMat.dispose();
    this.laneMat.dispose();
    this.barrierMat.dispose();
  }
}

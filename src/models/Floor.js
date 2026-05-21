import * as THREE from 'three';

/**
 * 地面魔法阵 — 浅色大理石地面 + 明亮的金色符文环
 */
export function createFloor() {
  const group = new THREE.Group();

  // 主地面 — 浅色大理石（深蓝灰但更亮）
  const floorGeo = new THREE.CircleGeometry(8, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x2A2F4A,
    roughness: 0.6,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.05;
  floor.receiveShadow = true;
  group.add(floor);

  // 内圈金色环纹（更亮更粗）
  const ringGeo = new THREE.RingGeometry(2.6, 3.4, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    emissive: 0xFFD700,
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.9,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  group.add(ring);

  // 外圈金色符文环（更亮）
  const outerRingGeo = new THREE.RingGeometry(5.3, 5.9, 64);
  const outerRingMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    emissive: 0xFFD700,
    emissiveIntensity: 0.25,
    roughness: 0.3,
    metalness: 0.8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.01;
  group.add(outerRing);

  // 中间装饰环（新增 — 粉色魔法纹路）
  const midRingGeo = new THREE.RingGeometry(1.2, 1.4, 48);
  const midRingMat = new THREE.MeshStandardMaterial({
    color: 0xFFB7C5,
    emissive: 0xFFB7C5,
    emissiveIntensity: 0.2,
    roughness: 0.3,
    metalness: 0.5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
  });
  const midRing = new THREE.Mesh(midRingGeo, midRingMat);
  midRing.rotation.x = -Math.PI / 2;
  midRing.position.y = 0.015;
  group.add(midRing);

  // 地面微光 — 从中心发出的柔和光线（更亮）
  const glowGeo = new THREE.RingGeometry(0.1, 2.2, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x8B9DC3,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.02;
  group.add(glow);

  // 12个金色符文点围绕外圈（更大更亮）
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 5.6;
    const dotGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xFFD700,
      emissive: 0xFFD700,
      emissiveIntensity: 1.0,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius);
    group.add(dot);
  }

  // 内圈6个粉色符文点（新增）
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const radius = 1.3;
    const dotGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xFFB7C5,
      emissive: 0xFFB7C5,
      emissiveIntensity: 0.8,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(Math.cos(angle) * radius, 0.02, Math.sin(angle) * radius);
    group.add(dot);
  }

  return group;
}

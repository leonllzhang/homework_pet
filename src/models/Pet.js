import * as THREE from 'three';

/**
 * 守护灵宠物 — 星光体形态（几何风格，后续可替换 glTF）
 */
export function createPet(stage = 0) {
  const group = new THREE.Group();

  // 主体 — 发光球体
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xE8D5B7,
    emissive: 0xC9A84C,
    emissiveIntensity: 0.2,
    roughness: 0.2,
    metalness: 0.3,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), bodyMat);
  body.position.y = 0.3;
  group.add(body);

  // 头部 — 稍小球体
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xF0E6D0,
    emissive: 0xC9A84C,
    emissiveIntensity: 0.15,
    roughness: 0.2,
    metalness: 0.2,
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 24), headMat);
  head.position.set(0, 0.48, 0);
  group.add(head);

  // 眼睛 — 金色亮点
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xC9A84C });
  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    eye.position.set(side * 0.08, 0.49, 0.12);
    group.add(eye);
  }

  // 星尘光环 — 围绕身体的粒子环
  const ringParticles = 40;
  const rPos = new Float32Array(ringParticles * 3);
  for (let i = 0; i < ringParticles; i++) {
    const angle = (i / ringParticles) * Math.PI * 2;
    const rad = 0.35 + Math.random() * 0.1;
    rPos[i * 3] = Math.cos(angle) * rad;
    rPos[i * 3 + 1] = 0.3 + Math.sin(angle * 2) * 0.05;
    rPos[i * 3 + 2] = Math.sin(angle) * rad;
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
  const ringMat = new THREE.PointsMaterial({
    color: 0xC9A84C,
    size: 0.015,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Points(ringGeo, ringMat);
  ring.userData.ringParticles = ringParticles;
  group.add(ring);

  // 小翅膀 — 半透明平面
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xC9A84C,
    transparent: true,
    opacity: 0.2,
    roughness: 0.3,
    metalness: 0.5,
    side: THREE.DoubleSide,
  });

  for (let side = -1; side <= 1; side += 2) {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(side * 0.15, 0.1, side * 0.1, 0.2);
    wingShape.quadraticCurveTo(0, 0.15, 0, 0);
    const wingGeo = new THREE.ShapeGeometry(wingShape);
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, 0.35, 0);
    wing.rotation.y = side * 0.3;
    wing.rotation.z = side * 0.2;
    group.add(wing);
  }

  // 存储引用以便动画
  group.userData = {
    body,
    head,
    ring,
    wings: group.children.filter(c => c.geometry && c.geometry.type === 'ShapeGeometry'),
    floatTime: 0,
    petStage: stage,
    isInteracting: false,
    interactionTimer: 0,
  };

  return group;
}

export function updatePet(petGroup, delta) {
  const data = petGroup.userData;
  data.floatTime += delta;

  // 上下浮动
  petGroup.position.y = Math.sin(data.floatTime * 1.2) * 0.04;

  // 轻微旋转
  petGroup.rotation.y += delta * 0.3;

  // 星尘光环旋转
  const ring = data.ring;
  if (ring) {
    ring.rotation.y += delta * 0.8;
    ring.rotation.x = Math.sin(data.floatTime * 0.5) * 0.05;
  }

  // 翅膀拍动
  data.wings.forEach((wing, i) => {
    const side = i === 0 ? -1 : 1;
    wing.rotation.z = side * (0.2 + Math.sin(data.floatTime * 3 + i) * 0.1);
  });

  // 互动动画（点击后放大并闪烁）
  if (data.isInteracting) {
    data.interactionTimer -= delta;
    const pulse = 1 + Math.sin(data.interactionTimer * 20) * 0.05;
    petGroup.scale.setScalar(pulse);
    if (data.interactionTimer <= 0) {
      data.isInteracting = false;
      petGroup.scale.setScalar(1);
    }
  }
}

export function interactWithPet(petGroup) {
  const data = petGroup.userData;
  data.isInteracting = true;
  data.interactionTimer = 0.6;
}

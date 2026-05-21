import * as THREE from 'three';

/**
 * 幻影灵猫 — 进化形态：紫色系，LatheGeometry 身体，TubeGeometry 弯尾/腿
 */
export function createCatForm() {
  const group = new THREE.Group();

  // === 颜色 ===
  const primary = 0xD4A0FF;
  const primaryEmissive = 0xB470E0;
  const lightPurple = 0xE8C8FF;
  const pink = 0xFF8CA8;

  // === 身体（LatheGeometry — 猫科修长身形） ===
  const bodyPoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.10, 0.005),
    new THREE.Vector2(0.13, 0.02),
    new THREE.Vector2(0.15, 0.05),
    new THREE.Vector2(0.155, 0.09),
    new THREE.Vector2(0.15, 0.13),
    new THREE.Vector2(0.135, 0.17),
    new THREE.Vector2(0.11, 0.20),
    new THREE.Vector2(0.08, 0.22),
    new THREE.Vector2(0.06, 0.235),
    new THREE.Vector2(0.001, 0.24),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: primary,
    emissive: primaryEmissive,
    emissiveIntensity: 0.12,
    roughness: 0.25,
    metalness: 0.15,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.09;
  group.add(body);

  // === 头部（LatheGeometry 圆头） ===
  const headPoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.095, 0.005),
    new THREE.Vector2(0.115, 0.02),
    new THREE.Vector2(0.12, 0.05),
    new THREE.Vector2(0.115, 0.08),
    new THREE.Vector2(0.095, 0.10),
    new THREE.Vector2(0.07, 0.115),
    new THREE.Vector2(0.001, 0.12),
  ];
  const headGeo = new THREE.LatheGeometry(headPoints, 28);
  const headMat = new THREE.MeshPhysicalMaterial({
    color: lightPurple,
    emissive: primaryEmissive,
    emissiveIntensity: 0.07,
    roughness: 0.2,
    metalness: 0.1,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0.34, 0);
  group.add(head);

  // === 耳朵（锥体，高分） ===
  const earMat = new THREE.MeshPhysicalMaterial({
    color: primary,
    emissive: primaryEmissive,
    emissiveIntensity: 0.06,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.2,
  });
  const earInnerMat = new THREE.MeshBasicMaterial({
    color: pink, transparent: true, opacity: 0.5,
  });
  for (let side = -1; side <= 1; side += 2) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.06, 10), earMat);
    ear.position.set(side * 0.075, 0.42, 0.01);
    ear.rotation.z = side * 0.35;
    ear.rotation.x = 0.1;
    group.add(ear);

    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.03, 8), earInnerMat);
    inner.position.set(side * 0.075, 0.415, 0.01);
    inner.rotation.z = side * 0.35;
    inner.rotation.x = 0.1;
    inner.userData.dyeable = false;
    group.add(inner);
  }

  // === 眼睛（黄绿色，杏仁形） ===
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xCCFF66 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1A1A2E });
  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), eyeMat);
    eye.position.set(side * 0.045, 0.36, 0.09);
    eye.scale.set(1.2, 0.8, 0.8);
    eye.userData.dyeable = false;
    group.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), pupilMat);
    pupil.position.set(side * 0.045, 0.36, 0.105);
    pupil.userData.dyeable = false;
    group.add(pupil);
  }

  // === 鼻子 ===
  const noseMat = new THREE.MeshBasicMaterial({ color: pink });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), noseMat);
  nose.position.set(0, 0.33, 0.095);
  nose.userData.dyeable = false;
  group.add(nose);

  // === 胡须 ===
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  for (let side = -1; side <= 1; side += 2) {
    for (let j = 0; j < 3; j++) {
      const whisker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.002, 0.002, 0.065, 4),
        whiskerMat
      );
      whisker.position.set(side * 0.05, 0.33 - j * 0.015, 0.10);
      whisker.rotation.z = side * (0.3 + j * 0.15);
      whisker.rotation.x = -0.2;
      whisker.userData.dyeable = false;
      group.add(whisker);
    }
  }

  // === 尾巴（TubeGeometry 自然弯曲） ===
  const tailMat = new THREE.MeshPhysicalMaterial({
    color: primary,
    emissive: primaryEmissive,
    emissiveIntensity: 0.08,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.3,
  });
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.02, 0.02, -0.02),
    new THREE.Vector3(0.03, 0.06, -0.03),
    new THREE.Vector3(0.01, 0.10, -0.02),
    new THREE.Vector3(-0.02, 0.12, 0),
    new THREE.Vector3(-0.04, 0.11, 0.02),
  ]);
  const tail = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 12, 0.015, 8, false),
    tailMat
  );
  tail.position.set(0, 0.15, -0.14);
  group.add(tail);

  // === 腿（TubeGeometry 微弯） ===
  const legMat = new THREE.MeshPhysicalMaterial({
    color: primary,
    roughness: 0.35,
    metalness: 0,
    clearcoat: 0.2,
  });
  const legPositions = [
    [-0.065, 0.08, 0.06],
    [0.065, 0.08, 0.06],
    [-0.065, 0.08, -0.06],
    [0.065, 0.08, -0.06],
  ];
  legPositions.forEach(pos => {
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(pos[0] * 0.1, -0.025, 0),
      new THREE.Vector3(0, -0.055, 0),
    ]);
    const leg = new THREE.Mesh(
      new THREE.TubeGeometry(legCurve, 6, 0.013, 6, false),
      legMat
    );
    leg.position.set(pos[0], pos[1], pos[2]);
    group.add(leg);
  });

  // === 翅膀（ShapeGeometry 紧凑型） ===
  const wingMat = new THREE.MeshPhysicalMaterial({
    color: primary,
    emissive: primaryEmissive,
    emissiveIntensity: 0.10,
    transparent: true,
    opacity: 0.3,
    roughness: 0.3,
    metalness: 0.15,
    clearcoat: 0.2,
    side: THREE.DoubleSide,
  });
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.quadraticCurveTo(0.10, 0.03, 0.10, 0.09);
  wingShape.quadraticCurveTo(0.07, 0.13, 0, 0.10);
  wingShape.quadraticCurveTo(0.03, 0.05, 0, 0);

  const wings = [];
  for (let side = -1; side <= 1; side += 2) {
    const wing = new THREE.Mesh(new THREE.ShapeGeometry(wingShape), wingMat);
    wing.position.set(side * 0.10, 0.26, 0);
    wing.rotation.y = side * -0.3;
    wing.rotation.z = side * 0.2;
    group.add(wing);
    wings.push(wing);
  }

  // === 星尘环（50 粒子，波浪形） ===
  const nParticles = 50;
  const positions = new Float32Array(nParticles * 3);
  const colorsArr = new Float32Array(nParticles * 3);
  const purple = new THREE.Color(0xD4A0FF);
  const gold = new THREE.Color(0xC9A84C);

  for (let i = 0; i < nParticles; i++) {
    const angle = (i / nParticles) * Math.PI * 2;
    const radius = 0.28 + Math.sin(angle * 3) * 0.04;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.18 + Math.sin(angle * 2) * 0.03;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    const c = i % 2 === 0 ? purple : gold;
    colorsArr[i * 3] = c.r;
    colorsArr[i * 3 + 1] = c.g;
    colorsArr[i * 3 + 2] = c.b;
  }

  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  ringGeo.setAttribute('color', new THREE.BufferAttribute(colorsArr, 3));

  const ringMat2 = new THREE.PointsMaterial({
    size: 0.015,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });
  const ring = new THREE.Points(ringGeo, ringMat2);
  group.add(ring);

  // === userData ===
  group.userData = {
    body, head, ring,
    wings,
    floatTime: 0,
    petStage: 1,
    isInteracting: false,
    interactionTimer: 0,
    evolutionType: 'cat',
  };

  return group;
}

import * as THREE from 'three';

/**
 * 星辰独角兽 — 进化形态：粉色系，LatheGeometry 身体，TubeGeometry 脖子/鬃毛/尾巴/腿
 */
export function createUnicornForm() {
  const group = new THREE.Group();

  // === 颜色 ===
  const pink = 0xFFB7C5;
  const pinkEmissive = 0xFF87A8;
  const lightPink = 0xFFCAD5;
  const gold = 0xFFD700;
  const lavender = 0xD4A0FF;
  const skyBlue = 0x80E0FF;

  // === 身体（LatheGeometry — 马科修长身形） ===
  const bodyPoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.10, 0.005),
    new THREE.Vector2(0.14, 0.02),
    new THREE.Vector2(0.165, 0.05),
    new THREE.Vector2(0.175, 0.09),
    new THREE.Vector2(0.17, 0.14),
    new THREE.Vector2(0.15, 0.18),
    new THREE.Vector2(0.12, 0.22),
    new THREE.Vector2(0.09, 0.24),
    new THREE.Vector2(0.06, 0.255),
    new THREE.Vector2(0.001, 0.26),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: pink,
    emissive: pinkEmissive,
    emissiveIntensity: 0.12,
    roughness: 0.2,
    metalness: 0.2,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.10;
  group.add(body);

  // === 脖子（TubeGeometry 自然前弯） ===
  const neckMat = new THREE.MeshPhysicalMaterial({
    color: pink,
    emissive: pinkEmissive,
    emissiveIntensity: 0.10,
    roughness: 0.25,
    metalness: 0.05,
    clearcoat: 0.4,
  });
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.01, 0.04, 0.02),
    new THREE.Vector3(0, 0.08, 0.04),
    new THREE.Vector3(-0.01, 0.12, 0.05),
  ]);
  const neck = new THREE.Mesh(
    new THREE.TubeGeometry(neckCurve, 8, 0.05, 10, false),
    neckMat
  );
  neck.position.set(0, 0.30, 0.02);
  group.add(neck);

  // === 头部（LatheGeometry 锥形长脸） ===
  const headPoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.065, 0.005),
    new THREE.Vector2(0.09, 0.025),
    new THREE.Vector2(0.095, 0.055),
    new THREE.Vector2(0.09, 0.08),
    new THREE.Vector2(0.075, 0.10),
    new THREE.Vector2(0.05, 0.11),
    new THREE.Vector2(0.001, 0.115),
  ];
  const headGeo = new THREE.LatheGeometry(headPoints, 24);
  const headMat = new THREE.MeshPhysicalMaterial({
    color: lightPink,
    emissive: pinkEmissive,
    emissiveIntensity: 0.08,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.4,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0.38, 0.09);
  group.add(head);

  // === 口鼻部 ===
  const snoutMat = new THREE.MeshPhysicalMaterial({
    color: pink,
    emissive: pinkEmissive,
    emissiveIntensity: 0.06,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.2,
  });
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.05, 8), snoutMat);
  snout.position.set(0, 0.365, 0.175);
  snout.rotation.x = 0.5;
  group.add(snout);

  // === 角（金色锥体） ===
  const hornMat = new THREE.MeshPhysicalMaterial({
    color: gold,
    emissive: gold,
    emissiveIntensity: 0.3,
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 0.3,
  });
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.09, 10), hornMat);
  horn.position.set(0, 0.46, 0.10);
  horn.userData.dyeable = false;
  group.add(horn);

  // === 耳朵 ===
  const earMat = new THREE.MeshPhysicalMaterial({
    color: pink,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.2,
  });
  for (let side = -1; side <= 1; side += 2) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.03, 8), earMat);
    ear.position.set(side * 0.04, 0.42, 0.08);
    group.add(ear);
  }

  // === 眼睛（天蓝色） ===
  const eyeMat = new THREE.MeshBasicMaterial({ color: skyBlue });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1A1A2E });
  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), eyeMat);
    eye.position.set(side * 0.04, 0.39, 0.12);
    eye.userData.dyeable = false;
    group.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 8), pupilMat);
    pupil.position.set(side * 0.04, 0.39, 0.13);
    pupil.userData.dyeable = false;
    group.add(pupil);
  }

  // === 鬃毛（TubeGeometry 垂坠曲线，3条） ===
  const maneColors = [pink, lavender, gold];
  const maneEmissives = [pinkEmissive, 0xB470E0, gold];
  const manePositions = [-0.04, -0.055, -0.07];
  const maneHeights = [0.38, 0.34, 0.30];
  for (let m = 0; m < 3; m++) {
    const maneMat2 = new THREE.MeshPhysicalMaterial({
      color: maneColors[m % 3],
      emissive: maneEmissives[m % 3],
      emissiveIntensity: 0.12,
      roughness: 0.4,
      metalness: 0,
      clearcoat: 0.2,
    });
    const maneCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.01, -0.015, 0.005),
      new THREE.Vector3(-0.005, -0.035, 0.01),
      new THREE.Vector3(0.01, -0.055, 0.005),
      new THREE.Vector3(0.005, -0.075, -0.005),
    ]);
    const mane = new THREE.Mesh(
      new THREE.TubeGeometry(maneCurve, 8, 0.012, 6, false),
      maneMat2
    );
    mane.position.set(manePositions[m], maneHeights[m], 0.08);
    group.add(mane);
  }

  // === 腿（TubeGeometry 修长） ===
  const legMat = new THREE.MeshPhysicalMaterial({
    color: pink,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.25,
  });
  const hoofMat = new THREE.MeshPhysicalMaterial({
    color: gold,
    metalness: 0.7,
    roughness: 0.2,
    clearcoat: 0.3,
  });
  const legPositions = [
    [-0.07, 0.08, 0.07],
    [0.07, 0.08, 0.07],
    [-0.07, 0.08, -0.07],
    [0.07, 0.08, -0.07],
  ];
  legPositions.forEach(pos => {
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.035, 0),
      new THREE.Vector3(0, -0.065, 0),
    ]);
    const leg = new THREE.Mesh(
      new THREE.TubeGeometry(legCurve, 6, 0.014, 7, false),
      legMat
    );
    leg.position.set(pos[0], pos[1], pos[2]);
    group.add(leg);

    const hoof = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.018, 8), hoofMat);
    hoof.position.set(pos[0], 0.035, pos[2]);
    hoof.userData.dyeable = false;
    group.add(hoof);
  });

  // === 尾巴（TubeGeometry 弯曲） ===
  const tailMat = new THREE.MeshPhysicalMaterial({
    color: pink,
    emissive: pinkEmissive,
    emissiveIntensity: 0.10,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.2,
  });
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.01, -0.02, -0.02),
    new THREE.Vector3(0.02, -0.05, -0.03),
    new THREE.Vector3(0.01, -0.08, -0.02),
    new THREE.Vector3(-0.01, -0.10, 0),
    new THREE.Vector3(-0.02, -0.09, 0.02),
  ]);
  const tail = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 10, 0.016, 7, false),
    tailMat
  );
  tail.position.set(0, 0.22, -0.18);
  group.add(tail);

  // === 翅膀（ShapeGeometry 大型羽翼） ===
  const wingMat = new THREE.MeshPhysicalMaterial({
    color: pink,
    emissive: pinkEmissive,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 0.3,
    roughness: 0.2,
    metalness: 0.2,
    clearcoat: 0.3,
    side: THREE.DoubleSide,
  });
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.quadraticCurveTo(0.18, 0.04, 0.22, 0.16);
  wingShape.quadraticCurveTo(0.18, 0.28, 0.08, 0.30);
  wingShape.quadraticCurveTo(0.02, 0.26, 0, 0.18);
  wingShape.quadraticCurveTo(0.05, 0.09, 0, 0);

  const wings = [];
  for (let side = -1; side <= 1; side += 2) {
    const wing = new THREE.Mesh(new THREE.ShapeGeometry(wingShape), wingMat);
    wing.position.set(side * 0.14, 0.28, 0);
    wing.rotation.y = side * -0.35;
    wing.rotation.z = side * 0.3;
    group.add(wing);
    wings.push(wing);
  }

  // === 星尘环（双螺旋，80 粒子） ===
  const nParticles = 80;
  const positions = new Float32Array(nParticles * 3);
  const colors = new Float32Array(nParticles * 3);
  const pinkCol = new THREE.Color(0xFFB7C5);
  const goldCol = new THREE.Color(0xFFD700);

  for (let i = 0; i < nParticles; i++) {
    const t = i / nParticles;
    const angle = t * Math.PI * 4;
    const radius = 0.30 + Math.sin(angle * 0.5) * 0.04;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.08 + t * 0.30;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    const c = i % 2 === 0 ? pinkCol : goldCol;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  ringGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const ringMat = new THREE.PointsMaterial({
    size: 0.016,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });
  const ring = new THREE.Points(ringGeo, ringMat);
  group.add(ring);

  // === userData ===
  group.userData = {
    body, head, ring,
    wings,
    floatTime: 0,
    petStage: 1,
    isInteracting: false,
    interactionTimer: 0,
    evolutionType: 'unicorn',
  };

  return group;
}

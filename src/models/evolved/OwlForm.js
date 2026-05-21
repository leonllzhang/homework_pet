import * as THREE from 'three';

/**
 * 智慧猫头鹰 — 进化形态：蓝色系，LatheGeometry 圆润身体，TubeGeometry 弯爪
 */
export function createOwlForm() {
  const group = new THREE.Group();

  // === 颜色 ===
  const blue = 0x4A6FA5;
  const blueEmissive = 0x2A4F85;
  const lightBlue = 0x8BADE0;
  const midBlue = 0x6B8EC4;
  const orange = 0xFFA500;
  const orangeEmissive = 0xFF6600;

  // === 身体（LatheGeometry — 圆润猫头鹰轮廓） ===
  const bodyPoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.13, 0.002),
    new THREE.Vector2(0.17, 0.015),
    new THREE.Vector2(0.195, 0.04),
    new THREE.Vector2(0.205, 0.08),
    new THREE.Vector2(0.20, 0.12),
    new THREE.Vector2(0.18, 0.16),
    new THREE.Vector2(0.15, 0.20),
    new THREE.Vector2(0.11, 0.23),
    new THREE.Vector2(0.08, 0.25),
    new THREE.Vector2(0.001, 0.26),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 32);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: blue,
    emissive: blueEmissive,
    emissiveIntensity: 0.12,
    roughness: 0.3,
    metalness: 0.15,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.10;
  group.add(body);

  // === 胸部（浅色肚皮） ===
  const chestPoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.07, 0.005),
    new THREE.Vector2(0.10, 0.02),
    new THREE.Vector2(0.115, 0.05),
    new THREE.Vector2(0.11, 0.09),
    new THREE.Vector2(0.095, 0.12),
    new THREE.Vector2(0.07, 0.14),
    new THREE.Vector2(0.001, 0.15),
  ];
  const chestGeo = new THREE.LatheGeometry(chestPoints, 24);
  const chestMat = new THREE.MeshPhysicalMaterial({
    color: lightBlue,
    emissive: blueEmissive,
    emissiveIntensity: 0.05,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.5,
  });
  const chest = new THREE.Mesh(chestGeo, chestMat);
  chest.position.set(0, 0.12, 0.11);
  chest.scale.set(1, 1, 0.55);
  group.add(chest);

  // === 头部（LatheGeometry 圆头） ===
  const headPoints = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.095, 0.005),
    new THREE.Vector2(0.12, 0.025),
    new THREE.Vector2(0.125, 0.055),
    new THREE.Vector2(0.12, 0.085),
    new THREE.Vector2(0.10, 0.11),
    new THREE.Vector2(0.07, 0.13),
    new THREE.Vector2(0.001, 0.14),
  ];
  const headGeo = new THREE.LatheGeometry(headPoints, 28);
  const headMat = new THREE.MeshPhysicalMaterial({
    color: midBlue,
    emissive: blueEmissive,
    emissiveIntensity: 0.08,
    roughness: 0.25,
    metalness: 0.05,
    clearcoat: 0.3,
    clearcoatRoughness: 0.35,
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0.35, 0);
  group.add(head);

  // === 面部圆盘（浅色平面区域） ===
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: 0xDCE8F5,
    emissive: blueEmissive,
    emissiveIntensity: 0.03,
    roughness: 0.3,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const faceShape = new THREE.Shape();
  faceShape.moveTo(0, 0);
  faceShape.quadraticCurveTo(0.08, 0.01, 0.09, 0.05);
  faceShape.quadraticCurveTo(0.08, 0.09, 0, 0.10);
  const faceGeo = new THREE.ShapeGeometry(faceShape);
  for (let side = -1; side <= 1; side += 2) {
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(side * 0.04, 0.355, 0.08);
    face.rotation.y = side * 0.15;
    group.add(face);
  }

  // === 耳羽簇（锥体，高分段） ===
  const earMat = new THREE.MeshPhysicalMaterial({
    color: blue,
    emissive: blueEmissive,
    emissiveIntensity: 0.08,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.2,
  });
  for (let side = -1; side <= 1; side += 2) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.05, 10), earMat);
    ear.position.set(side * 0.075, 0.44, 0.005);
    ear.rotation.z = side * 0.3;
    ear.rotation.x = -0.1;
    group.add(ear);
  }

  // === 眼睛 ===
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1A1A2E });
  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 14), eyeWhiteMat);
    eye.position.set(side * 0.055, 0.375, 0.10);
    eye.userData.dyeable = false;
    group.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), pupilMat);
    pupil.position.set(side * 0.055, 0.375, 0.115);
    pupil.userData.dyeable = false;
    group.add(pupil);
  }

  // === 喙 ===
  const beakMat = new THREE.MeshPhysicalMaterial({
    color: orange,
    emissive: orangeEmissive,
    emissiveIntensity: 0.08,
    roughness: 0.6,
    metalness: 0.05,
    clearcoat: 0.1,
  });
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.035, 8), beakMat);
  beak.position.set(0, 0.34, 0.11);
  beak.rotation.x = 0.35;
  beak.userData.dyeable = false;
  group.add(beak);

  // === 翅膀（ShapeGeometry 改进弧线） ===
  const wingMat = new THREE.MeshPhysicalMaterial({
    color: blue,
    emissive: blueEmissive,
    emissiveIntensity: 0.10,
    transparent: true,
    opacity: 0.4,
    roughness: 0.3,
    metalness: 0.15,
    clearcoat: 0.25,
    side: THREE.DoubleSide,
  });
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.quadraticCurveTo(0.15, 0.03, 0.17, 0.12);
  wingShape.quadraticCurveTo(0.15, 0.20, 0.07, 0.22);
  wingShape.quadraticCurveTo(0.02, 0.20, 0, 0.14);
  wingShape.quadraticCurveTo(0.04, 0.07, 0, 0);

  const wings = [];
  for (let side = -1; side <= 1; side += 2) {
    const wing = new THREE.Mesh(new THREE.ShapeGeometry(wingShape), wingMat);
    wing.position.set(side * 0.11, 0.24, 0);
    wing.rotation.y = side * -0.35;
    wing.rotation.z = side * 0.3;
    group.add(wing);
    wings.push(wing);
  }

  // === 脚（TubeGeometry 弯爪） ===
  const footMat = new THREE.MeshPhysicalMaterial({
    color: orange,
    emissive: orangeEmissive,
    emissiveIntensity: 0.04,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.1,
  });
  for (let side = -1; side <= 1; side += 2) {
    for (let toe = 0; toe < 3; toe++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.008, -0.005, 0.008 + toe * 0.004),
        new THREE.Vector3(side * 0.015 + toe * 0.003, -0.012, 0.018 + toe * 0.006),
      ]);
      const claw = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 5, 0.005, 5, false),
        footMat
      );
      claw.position.set(side * 0.045, 0.035, -0.01 + toe * 0.018);
      group.add(claw);
    }
  }

  // === 尾巴（三片短羽） ===
  const tailMat = new THREE.MeshPhysicalMaterial({
    color: midBlue,
    emissive: blueEmissive,
    emissiveIntensity: 0.05,
    roughness: 0.4,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.quadraticCurveTo(0.03, -0.03, 0.025, -0.065);
  tailShape.quadraticCurveTo(0, -0.08, -0.025, -0.065);
  tailShape.quadraticCurveTo(-0.03, -0.03, 0, 0);
  for (let i = -1; i <= 1; i++) {
    const tail = new THREE.Mesh(new THREE.ShapeGeometry(tailShape), tailMat);
    tail.position.set(i * 0.025, 0.14, -0.18);
    tail.rotation.x = -0.5;
    tail.rotation.z = i * 0.2;
    group.add(tail);
  }

  // === 星尘环（60 粒子，金蓝交替） ===
  const nParticles = 60;
  const positions = new Float32Array(nParticles * 3);
  const colors = new Float32Array(nParticles * 3);
  const goldCol = new THREE.Color(0xFFD700);
  const blueCol = new THREE.Color(0x6B8EC4);

  for (let i = 0; i < nParticles; i++) {
    const t = i / nParticles;
    const angle = t * Math.PI * 2;
    const radius = 0.30 + (i % 2 === 0 ? 0.03 : -0.03);

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.16 + Math.sin(angle * 2) * 0.035;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    const c = i % 2 === 0 ? goldCol : blueCol;
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
    evolutionType: 'owl',
  };

  return group;
}

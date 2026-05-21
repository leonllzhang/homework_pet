import * as THREE from 'three';

/**
 * 维多利亚风格拱形窗 — 透出星空背景
 */
export function createWindows() {
  const group = new THREE.Group();

  // 窗玻璃 — 透出星河夜景（更亮更蓝）
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x4A6FA5,
    emissive: 0x6B8FC8,
    emissiveIntensity: 0.35,
    roughness: 0.1,
    metalness: 0.0,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x5C4033,
    roughness: 0.6,
    metalness: 0.3,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0xFFD700,
    emissiveIntensity: 0.3,
  });

  // 在档案馆周围创建6扇窗 (六边形布局)
  const radius = 7.5;
  const windowCount = 6;

  for (let i = 0; i < windowCount; i++) {
    const angle = (i / windowCount) * Math.PI * 2;
    const wx = Math.cos(angle) * radius;
    const wz = Math.sin(angle) * radius;

    const winGroup = new THREE.Group();
    winGroup.position.set(wx, 2.5, wz);
    winGroup.lookAt(0, 2.5, 0);

    // 拱形窗玻璃 (用平面+圆顶组合)
    const archShape = new THREE.Shape();
    const w = 0.6;
    const h = 1.0;
    const archR = 0.3;

    archShape.moveTo(-w, -h / 2);
    archShape.lineTo(-w, h / 2 - archR);
    archShape.quadraticCurveTo(-w, h / 2, -w + archR, h / 2);
    archShape.lineTo(w - archR, h / 2);
    archShape.quadraticCurveTo(w, h / 2, w, h / 2 - archR);
    archShape.lineTo(w, -h / 2);
    archShape.lineTo(-w, -h / 2);

    const archGeo = new THREE.ShapeGeometry(archShape);
    const glass = new THREE.Mesh(archGeo, windowMat);
    winGroup.add(glass);

    // 窗框
    const frameShape = new THREE.Shape();
    const margin = 0.04;
    frameShape.moveTo(-w + margin, -h / 2 + margin);
    frameShape.lineTo(-w + margin, h / 2 - archR);
    frameShape.quadraticCurveTo(-w + margin, h / 2 - margin, -w + archR, h / 2 - margin);
    frameShape.lineTo(w - archR, h / 2 - margin);
    frameShape.quadraticCurveTo(w - margin, h / 2 - margin, w - margin, h / 2 - archR);
    frameShape.lineTo(w - margin, -h / 2 + margin);
    frameShape.lineTo(-w + margin, -h / 2 + margin);

    // 十字窗棂
    const crossMat = frameMat;
    // 竖棂
    const vertBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, h * 0.8, 0.02),
      crossMat
    );
    vertBar.position.y = 0.05;
    winGroup.add(vertBar);

    // 横棂
    const horBar = new THREE.Mesh(
      new THREE.BoxGeometry(w * 1.3, 0.02, 0.02),
      crossMat
    );
    horBar.position.y = 0.1;
    winGroup.add(horBar);

    // 金色拱顶装饰
    const archDecor = new THREE.Mesh(
      new THREE.TorusGeometry(archR + margin, 0.015, 8, 16, Math.PI),
      goldMat
    );
    archDecor.position.set(0, h / 2 - archR + 0.02, 0.01);
    archDecor.rotation.x = 0;
    archDecor.rotation.y = 0;
    winGroup.add(archDecor);

    group.add(winGroup);
  }

  return group;
}

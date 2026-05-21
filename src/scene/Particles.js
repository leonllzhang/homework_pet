import * as THREE from 'three';

/**
 * 星尘粒子系统 — 档案馆环境中漂浮的闪烁光点
 * 包含金色、粉色、淡紫色，更亮更梦幻
 */
export function createStardust() {
  const count = 800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const speeds = new Float32Array(count);

  // 多彩色盘
  const palette = [
    new THREE.Color(0xFFE4B5), // 暖金
    new THREE.Color(0xFFD1DC), // 粉红
    new THREE.Color(0xD4A0FF), // 淡紫
    new THREE.Color(0xE8D5B7), // 米金
    new THREE.Color(0xB0E0FF), // 淡蓝
    new THREE.Color(0xFFF0F5), // 白粉
  ];

  for (let i = 0; i < count; i++) {
    const radius = 1.5 + Math.random() * 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.6 + 2;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    const color = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = 0.02 + Math.random() * 0.04;
    speeds[i] = 0.05 + Math.random() * 0.15;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // 星形发光纹理
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.15, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.5, 'rgba(255,220,180,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);

  const mat = new THREE.PointsMaterial({
    size: 0.08,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.7,
    vertexColors: true,
  });

  const particles = new THREE.Points(geo, mat);
  particles.userData = { speeds, count, basePositions: new Float32Array(positions), baseSizes: new Float32Array(sizes) };

  return particles;
}

export function updateStardust(particles, time) {
  const pos = particles.geometry.attributes.position.array;
  const sizes = particles.geometry.attributes.size.array;
  const basePos = particles.userData.basePositions;
  const baseSizes = particles.userData.baseSizes;
  const speeds = particles.userData.speeds;
  const count = particles.userData.count;

  for (let i = 0; i < count; i++) {
    // 缓慢上下漂浮
    const drift = Math.sin(time * speeds[i] + i * 0.1) * 0.15;
    pos[i * 3 + 1] = basePos[i * 3 + 1] + drift;

    // 缓慢水平旋转漂移
    const rotDrift = Math.sin(time * speeds[i] * 0.3 + i * 0.05) * 0.1;
    pos[i * 3] = basePos[i * 3] + rotDrift;
    pos[i * 3 + 2] = basePos[i * 3 + 2] + Math.cos(time * speeds[i] * 0.3 + i * 0.05) * 0.1;

    // 每颗粒子独立闪烁
    const twinkle = 0.5 + Math.sin(time * speeds[i] * 2 + i * 0.7) * 0.5;
    sizes[i] = baseSizes[i] * (0.6 + twinkle * 0.4);
  }

  particles.geometry.attributes.position.needsUpdate = true;
  particles.geometry.attributes.size.needsUpdate = true;

  // 整体柔和脉冲
  const pulse = 0.8 + Math.sin(time * 0.2) * 0.2;
  particles.material.opacity = 0.7 * pulse;
}

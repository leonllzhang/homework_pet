import * as THREE from 'three';

/**
 * 永恒之火 — 粒子喷射火焰特效（更亮更温暖）
 */
export function createEternalFlame() {
  const group = new THREE.Group();
  group.position.set(0, 0.1, 0);

  // --- 火焰粒子系统（更多粒子）---
  const particleCount = 500;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const velocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    resetParticle(i, positions, colors, sizes, velocities, true);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const texture = createFlameTexture();
  const mat = new THREE.PointsMaterial({
    size: 0.2,
    map: texture,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    vertexColors: true,
    opacity: 0.9,
  });

  const particles = new THREE.Points(geo, mat);
  particles.userData = { velocities, particleCount };
  group.add(particles);

  // --- 底部金色光晕（更亮）---
  const glowGeo = new THREE.SphereGeometry(0.5, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0.3,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = -0.1;
  glow.scale.set(1, 0.3, 1);
  group.add(glow);

  // --- 外围光环（更亮）---
  const haloGeo = new THREE.RingGeometry(0.7, 1.0, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xFFB7C5,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.01;
  group.add(halo);

  // 外层金色光环（新增）
  const outerHaloGeo = new THREE.RingGeometry(1.1, 1.3, 32);
  const outerHaloMat = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
  });
  const outerHalo = new THREE.Mesh(outerHaloGeo, outerHaloMat);
  outerHalo.rotation.x = -Math.PI / 2;
  outerHalo.position.y = 0.01;
  group.add(outerHalo);

  return group;
}

function resetParticle(i, positions, colors, sizes, velocities, initial = false) {
  const radius = initial ? Math.random() * 0.4 : 0;
  const angle = Math.random() * Math.PI * 2;
  const height = initial ? Math.random() * 0.6 : 0;

  positions[i * 3] = Math.cos(angle) * radius;
  positions[i * 3 + 1] = height;
  positions[i * 3 + 2] = Math.sin(angle) * radius;

  // 颜色: 从亮金色到底部到粉色/淡紫顶部
  const t = initial ? Math.random() : 0;
  const c = new THREE.Color();
  if (t < 0.4) {
    c.setHSL(0.1 - t * 0.15, 0.8, 0.6 + t * 0.4); // 金→橙
  } else if (t < 0.7) {
    c.setHSL(0.03, 0.7, 0.65); // 暖橙
  } else {
    c.setHSL(0.75 - (t - 0.7) * 0.2, 0.6, 0.5 + (t - 0.7) * 0.3); // 粉→淡紫
  }
  colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
  colors[i * 3 + 2] = c.b;

  sizes[i] = 0.06 + Math.random() * 0.14;

  velocities[i * 3] = (Math.random() - 0.5) * 0.3;
  velocities[i * 3 + 1] = 0.3 + Math.random() * 0.6;
  velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
}

function createFlameTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,230,150,0.9)');
  gradient.addColorStop(0.5, 'rgba(255,180,80,0.5)');
  gradient.addColorStop(0.7, 'rgba(255,100,50,0.2)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function updateEternalFlame(flameGroup, delta) {
  const particles = flameGroup.children.find(c => c.isPoints);
  if (!particles) return;

  const geo = particles.geometry;
  const pos = geo.attributes.position.array;
  const colors = geo.attributes.color.array;
  const sizes = geo.attributes.size.array;
  const { velocities, particleCount } = particles.userData;

  for (let i = 0; i < particleCount; i++) {
    pos[i * 3] += velocities[i * 3] * delta;
    pos[i * 3 + 1] += velocities[i * 3 + 1] * delta;
    pos[i * 3 + 2] += velocities[i * 3 + 2] * delta;

    velocities[i * 3] += (Math.random() - 0.5) * 0.5 * delta;
    velocities[i * 3 + 2] += (Math.random() - 0.5) * 0.5 * delta;

    if (pos[i * 3 + 1] > 1.5 || Math.abs(pos[i * 3]) > 0.7) {
      resetParticle(i, pos, colors, sizes, velocities);
    }

    const h = pos[i * 3 + 1] / 1.5;
    const c = new THREE.Color();
    if (h < 0.4) {
      c.setHSL(0.1 - h * 0.15, 0.8, 0.6 + h * 0.4);
    } else if (h < 0.7) {
      c.setHSL(0.03, 0.7, 0.65);
    } else {
      c.setHSL(0.75 - (h - 0.7) * 0.2, 0.6, 0.5 + (h - 0.7) * 0.3);
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = (0.06 + Math.random() * 0.02) * (1 - h * 0.5);
  }

  geo.attributes.position.needsUpdate = true;
  geo.attributes.color.needsUpdate = true;
  geo.attributes.size.needsUpdate = true;

  // 两个光环旋转
  const halos = flameGroup.children.filter(c => c.isMesh && c.geometry.type === 'RingGeometry');
  halos.forEach((halo, idx) => {
    halo.rotation.z += delta * (0.2 + idx * 0.1);
    halo.rotation.x += delta * 0.05;
  });
}

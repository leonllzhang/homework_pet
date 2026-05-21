import * as THREE from 'three';

/**
 * 浮空魔法光球 — 温暖的金色/粉色光球在场景中漂浮
 * 增加梦幻氛围，让场景更明亮温馨
 */
export function createFloatingLights() {
  const group = new THREE.Group();
  const count = 12;
  const lightData = [];

  // 光晕纹理
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,220,180,0.8)');
  gradient.addColorStop(0.6, 'rgba(255,180,100,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);

  const colors = [
    0xFFE4B5, // 暖金
    0xFFD1DC, // 粉红
    0xE8D5B7, // 米金
    0xFFB7C5, // 浅粉
    0xD4A0FF, // 淡紫
  ];

  for (let i = 0; i < count; i++) {
    // 分布在圆形大厅的四周，高度错落
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 2.5 + Math.random() * 3.5;
    const height = 0.5 + Math.random() * 3.5;
    const color = colors[i % colors.length];

    // 发光粒子
    const mat = new THREE.PointsMaterial({
      size: 0.2 + Math.random() * 0.15,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.7 + Math.random() * 0.3,
      color,
    });
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array([0, 0, 0]);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mesh = new THREE.Points(geo, mat);

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    mesh.position.set(x, height, z);

    group.add(mesh);

    // 对应的实际点光源（仅部分光球有光源，节省性能）
    let light = null;
    if (i % 2 === 0) {
      const lightColor = i % 3 === 0 ? 0xFFD1DC : 0xFFE4B5;
      light = new THREE.PointLight(lightColor, 0.3, 4);
      light.position.set(x, height, z);
      group.add(light);
    }

    lightData.push({
      mesh,
      light,
      baseX: x,
      baseZ: z,
      baseY: height,
      floatSpeed: 0.3 + Math.random() * 0.4,
      floatAmplitude: 0.15 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
      rotSpeed: 0.2 + Math.random() * 0.3,
      pulseSpeed: 1 + Math.random() * 0.5,
    });
  }

  group.userData.lightData = lightData;
  return group;
}

export function updateFloatingLights(group, time) {
  const data = group.userData.lightData;
  if (!data) return;

  data.forEach((item) => {
    // 上下浮动
    const float = Math.sin(time * item.floatSpeed + item.phase) * item.floatAmplitude;
    item.mesh.position.y = item.baseY + float;

    // 微微水平漂移
    const drift = Math.sin(time * item.floatSpeed * 0.5 + item.phase) * 0.1;
    item.mesh.position.x = item.baseX + drift;

    // 光晕脉冲
    const pulse = 0.6 + Math.sin(time * item.pulseSpeed + item.phase) * 0.4;
    item.mesh.material.opacity = pulse;

    // 大小脉动
    const sizePulse = 0.8 + Math.sin(time * item.pulseSpeed * 0.7 + item.phase) * 0.2;
    item.mesh.material.size = 0.2 * sizePulse;

    // 同步更新点光源
    if (item.light) {
      item.light.position.copy(item.mesh.position);
      item.light.intensity = 0.2 + pulse * 0.2;
    }
  });
}

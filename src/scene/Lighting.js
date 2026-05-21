import * as THREE from 'three';

/**
 * 档案馆灯光系统 — 明亮、温暖、梦幻的魔法氛围
 */
export function createLighting(scene) {
  // 环境光 — 温暖的紫蓝色基调（大幅提升亮度）
  const ambient = new THREE.AmbientLight(0x8B9DC3, 0.9);
  scene.add(ambient);

  // 额外暖色环境光，让场景更温馨
  const warmAmbient = new THREE.AmbientLight(0xFFE4B5, 0.4);
  scene.add(warmAmbient);

  // 主光源 — 金色顶光（模拟永恒之火照明）
  const mainLight = new THREE.PointLight(0xFFD700, 2.5, 20);
  mainLight.position.set(0, 4, 0);
  mainLight.castShadow = true;
  scene.add(mainLight);

  // 辅助暖光 — 粉色侧光（少女感）
  const pinkLight = new THREE.DirectionalLight(0xFFB7C5, 0.8);
  pinkLight.position.set(-4, 2, 4);
  scene.add(pinkLight);

  // 辅助冷光 — 淡紫色补光
  const purpleLight = new THREE.DirectionalLight(0xD4A0FF, 0.6);
  purpleLight.position.set(5, 2, -3);
  scene.add(purpleLight);

  // 金色背光
  const rimLight = new THREE.DirectionalLight(0xFFE4B5, 1.0);
  rimLight.position.set(3, 3, -6);
  scene.add(rimLight);

  // 环境光晕 — 底部金色氛围
  const bottomGlow = new THREE.PointLight(0xFFD700, 0.8, 12);
  bottomGlow.position.set(0, -0.3, 0);
  scene.add(bottomGlow);

  // 四周温暖壁灯效果
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.3;
    const wallLight = new THREE.PointLight(0xFFE4B5, 0.4, 5);
    wallLight.position.set(Math.cos(angle) * 6.5, 1.2, Math.sin(angle) * 6.5);
    scene.add(wallLight);
  }

  return { mainLight, pinkLight, purpleLight, rimLight, bottomGlow };
}

export function updateLighting(lights, time) {
  // 永恒之火柔和闪烁，更温暖的颜色
  const flicker = 1.2 + Math.sin(time * 2.5) * 0.15 + Math.sin(time * 6) * 0.08 + Math.sin(time * 11) * 0.05;
  lights.mainLight.intensity = 2.5 * flicker;

  // 粉色光微微脉动
  lights.pinkLight.intensity = 0.8 + Math.sin(time * 0.5) * 0.1;

  // 紫色光缓慢变化
  lights.purpleLight.intensity = 0.6 + Math.sin(time * 0.7 + 1) * 0.1;
}

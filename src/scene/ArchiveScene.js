import * as THREE from 'three';
import { createFloor } from '../models/Floor.js';
import { createBookshelf, updateBookshelves } from '../models/Bookshelf.js';
import { createEternalFlame, updateEternalFlame } from '../models/EternalFlame.js';
import { createWindows } from '../models/Windows.js';
import { createPet, updatePet, interactWithPet } from '../models/Pet.js';
import { createEvolvedPet } from '../models/evolved/index.js';
import { createStardust, updateStardust } from './Particles.js';
import { createFloatingLights, updateFloatingLights } from './FloatingLights.js';
import { createLighting, updateLighting } from './Lighting.js';
import { CameraControl } from './CameraControl.js';
import { DamageSystem } from '../systems/DamageSystem.js';

/**
 * 档案馆主场景 — 管理所有 3D 对象和游戏循环
 */
export class ArchiveScene {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.onEnterParkour = null;
    this.onOpenPetCare = null; // 回调：打开宠物护理

    this._initRenderer();
    this._initScene();
    this._initPostProcessing();

    // 灯光
    this.lights = createLighting(this.scene);

    // 地面
    this.scene.add(createFloor());

    // 窗户
    this.scene.add(createWindows());

    // 书架
    this.bookshelves = [];
    this._createBookshelves();

    // 永恒之火
    this.eternalFlame = createEternalFlame();
    this.scene.add(this.eternalFlame);

    // 宠物
    this.pet = createPet(0);
    this.pet.position.set(0, 0.2, 0);
    this.scene.add(this.pet);

    // 粒子
    this.stardust = createStardust();
    this.scene.add(this.stardust);

    // 浮空魔法光球
    this.floatingLights = createFloatingLights();
    this.scene.add(this.floatingLights);

    // 相机控制
    this.cameraControl = new CameraControl(this.camera);

    // 损坏系统
    this.damageSystem = new DamageSystem(this.scene);

    // 射线检测（点击互动）
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 绑定点击事件
    this._bindEvents();

    // 自动旋转标志
    this.autoRotate = true;
  }

  _initRenderer() {
    const { width, height } = this.container.getBoundingClientRect();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4, 3, 5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);
  }

  _initScene() {
    this.scene = new THREE.Scene();
    // 温暖的深蓝紫色背景，带一丝星空气息
    this.scene.background = new THREE.Color(0x1B1F3B);
    this.scene.fog = new THREE.Fog(0x1B1F3B, 10, 18);
  }

  _initPostProcessing() {
    // 窗口大小调整
    window.addEventListener('resize', () => {
      const { width, height } = this.container.getBoundingClientRect();
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  _createBookshelves() {
    const layouts = [
      { x: -3.5, y: 0.8, z: -4, rot: 0.3 },
      { x: 3.5, y: 0.8, z: -4, rot: -0.3 },
      { x: -4.5, y: 1.0, z: 2, rot: 0.8 },
      { x: 4.5, y: 1.0, z: 2, rot: -0.8 },
      { x: -2, y: 1.2, z: 5, rot: 2.5 },
    ];

    layouts.forEach((layout) => {
      const shelf = createBookshelf(layout.x, layout.y, layout.z, layout.rot);
      this.scene.add(shelf);
      this.bookshelves.push(shelf);
    });
  }

  _bindEvents() {
    const canvas = this.renderer.domElement;

    // 点击检测
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);

      for (const hit of intersects) {
        // 检测是否点击到宠物
        if (this._isChildOf(hit.object, this.pet)) {
          interactWithPet(this.pet);
          if (this.onOpenPetCare) {
            this._showPrompt('✨ 点击小星打开护理面板');
            setTimeout(() => this.onOpenPetCare(), 200);
          } else {
            this._showPrompt('✨ 小星开心地蹭了蹭你！');
          }
          return;
        }

        // 检测是否点击到永恒之火
        if (this._isChildOf(hit.object, this.eternalFlame)) {
          this._showPrompt(`🔥 永恒之火已燃烧 ${7} 天`);
          return;
        }

        // 检测是否点击到书架
        for (const shelf of this.bookshelves) {
          if (this._isChildOf(hit.object, shelf)) {
            this._showPrompt('📚 收集更多逻辑符文来修复书架');
            return;
          }
        }

        // 检测是否点击中心魔法阵 — 进入跑酷（仅限中心半径2单位内）
        if (hit.object.geometry && hit.object.geometry.type === 'CircleGeometry' && hit.point.y < 0.1) {
          const dist = Math.sqrt(hit.point.x * hit.point.x + hit.point.z * hit.point.z);
          if (dist < 2.0 && this.onEnterParkour) {
            this._showPrompt('✨ 踏入星光回廊...');
            setTimeout(() => this.onEnterParkour(), 500);
          }
          return;
        }
      }
    });

    // 键盘快捷键：P 进入跑酷
    document.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        if (this.onEnterParkour) {
          this._showPrompt('✨ 踏入星光回廊...');
          setTimeout(() => this.onEnterParkour(), 300);
        }
      }
    });

    // 绑定相机控制
    this.cameraControl.attach(canvas);

    // 移除 loading
    setTimeout(() => {
      document.getElementById('loading')?.classList.add('hidden');
    }, 500);
  }

  /**
   * 更新宠物模型（进化后调用）
   */
  updatePetModel(evolutionType) {
    // 移除旧宠物
    this.scene.remove(this.pet);

    // 创建进化形态 3D 模型
    if (evolutionType === 'owl' || evolutionType === 'cat' || evolutionType === 'unicorn') {
      this.pet = createEvolvedPet(evolutionType);
    } else {
      this.pet = createPet(1);
    }
    this.pet.position.set(0, 0.2, 0);
    this.scene.add(this.pet);

    this._showPrompt(`🌟 小星完成了进化！`);
  }

  _isChildOf(object, parent) {
    let current = object;
    while (current) {
      if (current === parent) return true;
      current = current.parent;
    }
    return false;
  }

  _showPrompt(text) {
    const el = document.getElementById('interact-prompt');
    if (!el) return;
    el.textContent = text;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 2500);
  }

  /**
   * 主循环
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // 更新各系统
    this.cameraControl.update(delta);
    updateBookshelves(this.bookshelves, elapsed);
    updateEternalFlame(this.eternalFlame, delta);
    updatePet(this.pet, delta);
    updateStardust(this.stardust, elapsed);
    updateFloatingLights(this.floatingLights, elapsed);
    updateLighting(this.lights, elapsed);
    this.damageSystem.update(delta);

    this.renderer.render(this.scene, this.camera);
  }
}

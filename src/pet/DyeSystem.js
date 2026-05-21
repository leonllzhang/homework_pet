import * as THREE from 'three';
import { gameData, updateHUD } from '../data/gameData.js';

/**
 * 幻彩涂装系统 — 使用墨水为宠物染色
 */
export class DyeSystem {
  constructor(archiveScene) {
    this.archiveScene = archiveScene;
    this.isOpen = false;

    // 预设颜色方案
    this.palettes = [
      { name: '星辉金', color: '#FFD700', emissive: '#FFA500', cost: 2 },
      { name: '樱花粉', color: '#FFB7C5', emissive: '#FF69B4', cost: 2 },
      { name: '月光银', color: '#E8E8FF', emissive: '#B0C4FF', cost: 2 },
      { name: '薰衣草', color: '#D4A0FF', emissive: '#9B59B6', cost: 2 },
      { name: '薄荷绿', color: '#A8E8C8', emissive: '#6BC89A', cost: 2 },
      { name: '琥珀橙', color: '#FFD4A0', emissive: '#FF8C00', cost: 3 },
      { name: '极光蓝', color: '#80E0FF', emissive: '#4A9FFF', cost: 3 },
      { name: '玫瑰红', color: '#FF6B8A', emissive: '#E8305A', cost: 3 },
      { name: '暗夜紫', color: '#8B6BC8', emissive: '#6A3FA8', cost: 3 },
      { name: '彩虹', color: '#FFFFFF', emissive: '#FFD700', cost: 5 },
    ];

    this._bindEvents();
  }

  _bindEvents() {
    document.getElementById('dye-open').addEventListener('click', () => {
      this.open();
    });

    document.getElementById('dye-close').addEventListener('click', () => {
      this.close();
    });

    document.getElementById('dye-grid').addEventListener('click', (e) => {
      const swatch = e.target.closest('.dye-swatch');
      if (!swatch) return;

      const idx = parseInt(swatch.dataset.idx);
      this._applyDye(idx);
    });
  }

  open() {
    this.isOpen = true;
    document.getElementById('pet-panel').classList.remove('active');
    document.getElementById('dye-panel').classList.add('active');
    this._renderPalette();

    document.getElementById('dye-ink-count').textContent = gameData.resources.ink || 0;
  }

  close() {
    this.isOpen = false;
    document.getElementById('dye-panel').classList.remove('active');
  }

  _renderPalette() {
    const grid = document.getElementById('dye-grid');
    grid.innerHTML = this.palettes.map((p, i) => `
      <div class="dye-swatch" data-idx="${i}">
        <div class="dye-swatch-color" style="background: ${p.color}; box-shadow: 0 0 12px ${p.color}40;"></div>
        <div class="dye-swatch-name">${p.name}</div>
        <div class="dye-swatch-cost">🖌️ ×${p.cost}</div>
      </div>
    `).join('');
  }

  _applyDye(idx) {
    const palette = this.palettes[idx];
    if (!palette) return;

    const inkCost = palette.cost;
    if ((gameData.resources.ink || 0) < inkCost) {
      this._showPrompt('🎨 幻彩墨水不足！完成语文作业获取更多');
      return;
    }

    gameData.resources.ink -= inkCost;
    updateHUD();

    // 应用到3D宠物模型
    const pet = this.archiveScene.pet;
    if (pet) {
      this._colorPetModel(pet, palette);
    }

    // 更新墨水显示
    document.getElementById('dye-ink-count').textContent = gameData.resources.ink;

    this._showPrompt(`✨ 已为小星染上${palette.name}！`);
  }

  _colorPetModel(petGroup, palette) {
    const color = new THREE.Color(palette.color);
    const emissive = new THREE.Color(palette.emissive);

    petGroup.children.forEach(child => {
      if (child.isMesh && child.material && child.userData.dyeable !== false) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => this._applyColor(mat, color, emissive));
        } else {
          this._applyColor(child.material, color, emissive);
        }
      }
    });
  }

  _applyColor(material, color, emissive) {
    if (material.color) material.color.copy(color);
    if (material.emissive) {
      material.emissive.copy(emissive);
      material.emissiveIntensity = 0.3;
    }
  }

  _showPrompt(text) {
    const el = document.getElementById('interact-prompt');
    if (!el) return;
    el.textContent = text;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 2500);
  }
}

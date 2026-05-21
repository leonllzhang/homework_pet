/**
 * 宠物护理界面 — 喂食、抚摸、查看状态
 */
import { PetDataManager, EVOLUTIONS } from './PetData.js';
import { interactWithPet } from '../models/Pet.js';

export class PetCareUI {
  constructor(archiveScene) {
    this.archiveScene = archiveScene;
    this.petData = new PetDataManager();
    this.isOpen = false;

    this._bindEvents();
  }

  _bindEvents() {
    // 喂食按钮
    document.getElementById('pet-feed').addEventListener('click', () => {
      const result = this.petData.feed();
      this._showResult(result);
      this._updatePanel();
    });

    // 抚摸按钮
    document.getElementById('pet-stroke').addEventListener('click', () => {
      const result = this.petData.pet();
      this._showResult(result);
      this._updatePanel();

      // 触发3D宠物互动
      if (this.archiveScene.pet) {
        interactWithPet(this.archiveScene.pet);
      }
    });

    // 关闭面板
    document.getElementById('pet-close').addEventListener('click', () => {
      this.close();
    });

    // 进化按钮（动态绑定）
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.evo-btn');
      if (btn) {
        const type = btn.dataset.evo;
        const result = this.petData.evolve(type);
        this._showResult(result);
        this._updatePanel();
        if (result.ok) {
          // 更新宠物模型
          this.archiveScene.updatePetModel(this.petData.pet.evolution);
        }
      }
    });
  }

  open() {
    this.isOpen = true;
    document.getElementById('pet-panel').classList.add('active');
    this._updatePanel();
  }

  close() {
    this.isOpen = false;
    document.getElementById('pet-panel').classList.remove('active');
  }

  _updatePanel() {
    const d = this.petData;

    // 基本属性
    document.getElementById('pet-name').textContent = d.pet.name || '小星';
    document.getElementById('pet-mood-text').textContent = d.getMoodText();
    document.getElementById('pet-sat-text').textContent = d.getSatietyText();
    document.getElementById('pet-bond-text').textContent = `${d.bond}/100`;
    document.getElementById('pet-stage-text').textContent =
      d.stage === 0 ? '星光体' : (d.getEvoInfo()?.name || '已进化');

    // 进度条
    this._setBar('pet-mood-bar', d.mood, d.getMoodColor());
    this._setBar('pet-sat-bar', d.satiety);
    this._setBar('pet-bond-bar', d.bond);
    this._setBar('pet-evo-bar', d.bond, 0xFFD700, 100);

    // 资源显示
    document.getElementById('pet-fruit-count').textContent =
      this.archiveScene._gameData?.resources?.fruit || 0;

    // 进化选项
    this._updateEvolutionOptions();

    // 进化后样式变化
    if (d.stage >= 1) {
      document.getElementById('pet-evo-section').style.display = 'none';
      document.getElementById('pet-evolved-info').style.display = 'block';
      document.getElementById('pet-evolved-name').textContent =
        d.getEvoInfo()?.name || '已进化';
    } else {
      document.getElementById('pet-evo-section').style.display = '';
      document.getElementById('pet-evolved-info').style.display = 'none';
    }

    // 宠物心情表情
    const faceEl = document.getElementById('pet-face');
    if (faceEl) {
      if (d.mood >= 80) faceEl.textContent = '🌟';
      else if (d.mood >= 50) faceEl.textContent = '😊';
      else if (d.mood >= 20) faceEl.textContent = '😐';
      else faceEl.textContent = '😢';
    }
  }

  _setBar(id, value, color = null, max = 100) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.width = `${(value / max) * 100}%`;
    if (color) {
      el.style.background = `linear-gradient(90deg, ${this._hexToCSS(color)}, #FFD700)`;
    }
  }

  _updateEvolutionOptions() {
    const container = document.getElementById('pet-evo-options');
    if (!container) return;

    const available = this.petData.canEvolve();
    if (!available || available.length === 0) {
      container.innerHTML = `<div class="pet-evo-locked">
        🔒 亲密度达到60解锁进化<br/>
        <small>当前亲密度: ${this.petData.bond}/100</small>
      </div>`;
      return;
    }

    container.innerHTML = available.map(key => {
      const evo = EVOLUTIONS[key];
      const unlocked = this.petData.bond >= evo.bondRequired;
      return `<div class="pet-evo-card ${unlocked ? '' : 'locked'}">
        <div class="evo-icon">${evo.icon}</div>
        <div class="evo-name">${evo.name}</div>
        <div class="evo-desc">${evo.desc}</div>
        <div class="evo-req">需要: 亲密度${evo.bondRequired}</div>
        ${unlocked ? `<button class="evo-btn" data-evo="${key}">✦ 进化 ✦</button>` :
          `<div class="evo-locked-label">🔒 未解锁</div>`}
      </div>`;
    }).join('');
  }

  _showResult(result) {
    const el = document.getElementById('interact-prompt');
    if (!el) return;
    el.textContent = result.msg;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 2500);
  }

  _hexToCSS(hex) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    return `rgb(${r},${g},${b})`;
  }
}

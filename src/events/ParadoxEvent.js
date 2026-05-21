/**
 * 悖论修复事件 — 错题触发场景损坏，订正后修复得双倍奖励
 */
import * as THREE from 'three';
import { getSoundManager } from '../systems/SoundManager.js';

export class ParadoxEvent {
  /**
   * @param {import('../scene/ArchiveScene.js').ArchiveScene} archiveScene
   */
  constructor(archiveScene) {
    this.archiveScene = archiveScene;
    this.activeParadoxes = [];
  }

  /**
   * 触发悖论事件（扫描发现错题时调用）
   * @param {number} wrongCount 错题数
   * @returns {boolean} 是否触发
   */
  trigger(wrongCount) {
    if (wrongCount <= 0) return false;

    this.archiveScene.damageSystem.triggerParadox(wrongCount);

    this._showParadoxAlert(wrongCount);

    this.activeParadoxes.push({
      wrongCount,
      timestamp: Date.now(),
      repaired: false,
    });

    return true;
  }

  /**
   * 执行修复（订正后再次扫描时调用）
   * @param {number} wrongCount 修复的错题数
   * @returns {{ rewards: Record<string, number>, isDouble: boolean }}
   */
  repair(wrongCount = 1) {
    // 在场景中修复损坏
    const positions = [
      new THREE.Vector3(-2.5, 2, -3),
      new THREE.Vector3(2.5, 1.5, -3.5),
      new THREE.Vector3(-3, 2.5, 2),
      new THREE.Vector3(3.5, 2, 2.5),
    ];

    let repairedCount = 0;
    for (const pos of positions) {
      if (this.archiveScene.damageSystem.repairAt(pos, 1.5)) {
        repairedCount++;
        if (repairedCount >= wrongCount) break;
      }
    }

    // 双倍奖励
    const rewards = {
      dust: wrongCount * 2,
      rune: wrongCount * 2,
      ink: wrongCount * 1,
    };

    // 从已触发列表移除
    this.activeParadoxes = this.activeParadoxes.filter(p => {
      if (!p.repaired && p.wrongCount > 0) {
        p.wrongCount -= wrongCount;
        if (p.wrongCount <= 0) return false;
      }
      return true;
    });

    getSoundManager().repair();
    this._showRepairAlert(wrongCount);

    return { rewards, isDouble: true };
  }

  _showParadoxAlert(count) {
    const el = document.getElementById('interact-prompt');
    if (!el) return;
    el.textContent = `🌊 悖论冲击！${count} 道错题在档案馆中引发了空间裂痕！请订正后重新扫描修复`;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 4000);
  }

  _showRepairAlert(count) {
    const el = document.getElementById('interact-prompt');
    if (!el) return;
    el.textContent = `✨ 悖论已修复！时间线复原，获得双倍补偿！`;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 3000);
  }
}

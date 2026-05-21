import { ArchiveScene } from './scene/ArchiveScene.js';
import { ScanManager } from './scanning/ScanManager.js';
import { ParkourGame } from './parkour/ParkourGame.js';
import { PetCareUI } from './pet/PetCareUI.js';
import { DyeSystem } from './pet/DyeSystem.js';
import { AchievementManager, ACHIEVEMENTS } from './social/AchievementSystem.js';
import { StreakTracker } from './social/StreakTracker.js';
import { LogicDebate } from './social/LogicDebate.js';
import { getSoundManager } from './systems/SoundManager.js';
import { updateHUD } from './data/gameData.js';
import { gameData } from './data/gameData.js';

/**
 * 奇迹档案馆 — 入口
 */
function init() {
  const container = document.getElementById('app');

  if (!container) {
    console.error('找不到 #app 容器');
    return;
  }

  // 初始化 3D 场景
  const archive = new ArchiveScene(container);
  archive.animate();

  // 初始化音效系统（AudioContext 会在首次用户交互时激活）
  const sound = getSoundManager();
  const activateAudio = () => {
    sound.init();
    sound.playArchiveBGM();
    document.removeEventListener('click', activateAudio);
    document.removeEventListener('touchstart', activateAudio);
    document.removeEventListener('keydown', activateAudio);
  };
  document.addEventListener('click', activateAudio, { once: true });
  document.addEventListener('touchstart', activateAudio, { once: true });
  document.addEventListener('keydown', activateAudio, { once: true });

  // 初始化扫描系统
  const scanManager = new ScanManager(archive);

  // 初始化宠物系统
  const petCareUI = new PetCareUI(archive);
  const dyeSystem = new DyeSystem(archive);

  // 点击宠物打开护理面板
  archive.onOpenPetCare = () => petCareUI.open();

  // 初始化成就系统
  const achManager = new AchievementManager();

  // 初始化连续学习追踪
  const streakTracker = new StreakTracker();

  // 每次扫描后刷新成就
  const origComplete = scanManager.grading?.onComplete;
  scanManager.grading = scanManager.grading || { onComplete: null };
  const origOnGradingComplete = scanManager._onGradingComplete.bind(scanManager);
  const origCompleteHandler = scanManager._onGradingComplete;
  scanManager._onGradingComplete = (result) => {
    origCompleteHandler(result);
    // 记录学习
    streakTracker.recordStudy();
    // 刷新成就
    achManager.refresh();

    // 音效
    if (result.isPerfect) {
      sound.scanPerfect();
    } else {
      sound.scanComplete();
    }
    sound.resourceRain();
    if (result.wrong > 0) {
      sound.paradox();
    }
  };

  // 初始化跑酷系统
  let parkour = null;
  let isParkourActive = false;

  const enterParkour = () => {
    if (isParkourActive) return;
    isParkourActive = true;

    archive.renderer.domElement.style.display = 'none';
    document.getElementById('scan-btn').style.display = 'none';
    document.getElementById('scan-btn-label').style.display = 'none';
    document.getElementById('pk-btn').style.display = 'none';
    document.getElementById('pk-btn-label').style.display = 'none';
    document.getElementById('ach-btn').style.display = 'none';
    document.getElementById('debate-btn').style.display = 'none';

    parkour = new ParkourGame(container);
    parkour.start();
  };

  archive.onEnterParkour = enterParkour;
  document.getElementById('pk-btn').addEventListener('click', enterParkour);

  const setupParkourExit = () => {
    document.getElementById('pk-exit')?.addEventListener('click', () => {
      if (parkour) {
        parkour.dispose();
        parkour = null;
      }
      isParkourActive = false;

      archive.renderer.domElement.style.display = 'block';
      document.getElementById('scan-btn').style.display = '';
      document.getElementById('scan-btn-label').style.display = '';
      document.getElementById('pk-btn').style.display = '';
      document.getElementById('pk-btn-label').style.display = '';
      document.getElementById('ach-btn').style.display = '';
      document.getElementById('debate-btn').style.display = '';
      document.getElementById('pk-gameover')?.classList.remove('active');

      streakTracker.recordStudy();
      achManager.refresh();
      archive._showPrompt('🌟 欢迎回到档案馆');
    });

    document.getElementById('pk-restart')?.addEventListener('click', () => {
      if (parkour) parkour.restart();
    });
  };
  setupParkourExit();

  // 静音切换按钮
  document.getElementById('mute-btn').addEventListener('click', () => {
    const muted = sound.toggleMute();
    document.getElementById('mute-btn').textContent = muted ? '🔇' : '🔊';
  });

  // 按钮点击音效（全局）
  document.querySelectorAll('#scan-btn, #pk-btn, #ach-btn, #debate-btn').forEach(btn => {
    btn.addEventListener('click', () => sound.click());
  });

  // 宠物互动音效
  document.getElementById('pet-feed').addEventListener('click', () => sound.petFeed());
  document.getElementById('pet-stroke').addEventListener('click', () => sound.petStroke());

  // 成就面板
  const achPanel = document.getElementById('ach-panel');
  const achGrid = document.getElementById('ach-grid');
  const achCount = document.getElementById('ach-count');

  const renderAchievements = () => {
    const all = achManager.getAll();
    const unlocked = all.filter(a => a.unlocked).length;
    achCount.textContent = `已解锁 ${unlocked}/${all.length}`;

    achGrid.innerHTML = all.map(a => `
      <div class="ach-item ${a.unlocked ? 'unlocked' : 'locked'}">
        <div class="ach-item-icon">${a.icon}</div>
        <div class="ach-item-name">${a.name}</div>
        <div class="ach-item-desc">${a.desc}</div>
        <div class="ach-item-status ${a.unlocked ? 'done' : 'locked'}">
          ${a.unlocked ? '✦ 已解锁' : '🔒 未解锁'}
        </div>
      </div>
    `).join('');
  };

  document.getElementById('ach-btn').addEventListener('click', () => {
    renderAchievements();
    achPanel.classList.add('active');
    sound.panelOpen();
  });

  document.getElementById('ach-close').addEventListener('click', () => {
    achPanel.classList.remove('active');
    sound.panelClose();
  });

  // 初始化逻辑辩论
  const debateManager = new LogicDebate();
  const debateBtn = document.getElementById('debate-btn');
  const debatePanel = document.getElementById('debate-panel');
  const debateQuestion = document.getElementById('debate-question');
  const debateOptions = document.getElementById('debate-options');
  const debateFeedback = document.getElementById('debate-feedback');
  const debateFeedbackText = document.getElementById('debate-feedback-text');
  const debateRewards = document.getElementById('debate-rewards');

  if (!debateManager.canDebate()) debateBtn.classList.add('hidden');

  debateBtn.addEventListener('click', () => {
    const result = debateManager.start();
    if (!result.ok) {
      debateBtn.classList.add('hidden');
      return;
    }
    const debate = result.debate;
    debateQuestion.textContent = debate.question;
    debateOptions.innerHTML = debate.options.map((opt, i) =>
      `<button class="debate-opt" data-index="${i}">${opt.text}</button>`
    ).join('');
    debateFeedback.style.display = 'none';
    debatePanel.classList.add('active');
    sound.panelOpen();
  });

  debateOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('.debate-opt');
    if (!btn || btn.disabled) return;

    const index = parseInt(btn.dataset.index);
    const allOpts = debateOptions.querySelectorAll('.debate-opt');
    allOpts.forEach(o => o.disabled = true);

    const result = debateManager.answer(index);
    if (!result.ok) return;

    // 标记正确/错误
    allOpts.forEach((o, i) => {
      const optData = debateManager.debates.find(
        d => d.question === debateQuestion.textContent
      )?.options[i];
      if (optData?.correct) o.classList.add('highlight-correct');
    });
    if (result.correct) {
      btn.classList.add('selected-correct');
      sound.debateCorrect();
    } else {
      btn.classList.add('selected-wrong');
      sound.debateWrong();
    }

    // 显示反馈
    debateFeedbackText.textContent = result.feedback;
    debateFeedback.style.display = 'block';

    if (result.correct && result.rewards) {
      // 发放奖励
      const rewardEntries = Object.entries(result.rewards);
      rewardEntries.forEach(([key, val]) => {
        if (gameData.resources[key] !== undefined) {
          gameData.resources[key] += val;
        }
      });
      updateHUD();

      debateRewards.innerHTML = rewardEntries.map(([key, val]) => {
        const labels = { rune: '🧱 逻辑符文', fruit: '🍎 记忆果实', ink: '🖌️ 幻彩墨水', dust: '✨ 以太星尘', leaf: '🍃 时光笺' };
        return `<div class="debate-reward">+${val} ${labels[key] || key}</div>`;
      }).join('');
    } else {
      debateRewards.innerHTML = '<div class="debate-reward" style="color:rgba(255,255,255,0.4);">没有获得奖励</div>';
    }

    debateBtn.classList.add('hidden');
  });

  document.getElementById('debate-close').addEventListener('click', () => {
    debatePanel.classList.remove('active');
    sound.panelClose();
  });

  // 初始化 HUD
  updateHUD();

  // 开发用
  if (import.meta.env.DEV) {
    window.archive = archive;
    window.scanManager = scanManager;
    window.parkour = parkour;
    window.achManager = achManager;
  }

  console.log('🌟 奇迹档案馆已加载');
}

// DOM 就绪后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

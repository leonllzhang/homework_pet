/**
 * 摄像头管理器 — 调用设备相机
 */
export class CameraManager {
  constructor() {
    this.stream = null;
    this.video = document.getElementById('camera-feed');
  }

  /**
   * 启动摄像头
   */
  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 后置摄像头
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      return true;
    } catch (err) {
      console.warn('摄像头启动失败:', err.message);
      // 降级：尝试前置摄像头
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        this.video.srcObject = this.stream;
        await this.video.play();
        return true;
      } catch (e) {
        console.error('摄像头不可用:', e.message);
        return false;
      }
    }
  }

  /**
   * 拍摄当前帧（从视频中捕获）
   */
  captureFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = this.video.videoWidth || 640;
    canvas.height = this.video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0);
    return canvas;
  }

  /**
   * 停止摄像头
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }
}

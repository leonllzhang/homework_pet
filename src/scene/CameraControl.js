import * as THREE from 'three';

/**
 * 视角控制器 — 环绕档案馆的优雅镜头
 */
export class CameraControl {
  constructor(camera, target = new THREE.Vector3(0, 1.2, 0)) {
    this.camera = camera;
    this.target = target;

    // 球面坐标参数
    this.radius = 6;
    this.theta = 0.3;     // 水平角
    this.phi = 0.6;       // 俯仰角 (0=top, PI/2=eye)

    // 自动旋转
    this.autoRotate = true;
    this.autoRotateSpeed = 0.08;

    // 交互状态
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };

    // 缩放限制
    this.minRadius = 3;
    this.maxRadius = 10;
    this.minPhi = 0.2;
    this.maxPhi = 1.2;

    // 缓动参数
    this.targetRadius = this.radius;
    this.targetTheta = this.theta;
    this.targetPhi = this.phi;
    this.easing = 0.08;

    this._updateCamera();
  }

  /**
   * 绑定交互事件
   */
  attach(element) {
    element.addEventListener('mousedown', this._onMouseDown.bind(this));
    element.addEventListener('mousemove', this._onMouseMove.bind(this));
    element.addEventListener('mouseup', this._onMouseUp.bind(this));
    element.addEventListener('wheel', this._onWheel.bind(this), { passive: false });

    // 触摸支持
    element.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
    element.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
    element.addEventListener('touchend', this._onTouchEnd.bind(this));
  }

  /**
   * 更新视角（每帧调用）
   */
  update(delta) {
    if (!this.isDragging && this.autoRotate) {
      this.targetTheta += this.autoRotateSpeed * delta;
    }

    // 缓动插值
    this.radius += (this.targetRadius - this.radius) * this.easing;
    this.theta += (this.targetTheta - this.theta) * this.easing;
    this.phi += (this.targetPhi - this.phi) * this.easing;

    this._updateCamera();
  }

  /**
   * 聚焦到特定物体
   */
  focusOn(position, duration = 1.0) {
    const offset = new THREE.Vector3().copy(position);
    const dir = offset.clone().normalize();
    this.targetTheta = Math.atan2(dir.x, dir.z);
    this.targetPhi = Math.acos(dir.y / dir.length());
    this.targetRadius = offset.length();
  }

  _updateCamera() {
    const x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.target.y + this.radius * Math.cos(this.phi);
    const z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);

    this.camera.position.set(x, y, z);
    this.camera.lookAt(this.target);
  }

  _onMouseDown(e) {
    this.isDragging = true;
    this.prevMouse.x = e.clientX;
    this.prevMouse.y = e.clientY;
    this.autoRotate = false;
  }

  _onMouseMove(e) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.prevMouse.x;
    const dy = e.clientY - this.prevMouse.y;

    this.targetTheta -= dx * 0.005;
    this.targetPhi += dy * 0.005;
    this.targetPhi = Math.max(this.minPhi, Math.min(this.maxPhi, this.targetPhi));

    this.prevMouse.x = e.clientX;
    this.prevMouse.y = e.clientY;
  }

  _onMouseUp() {
    this.isDragging = false;
    // 停止拖动后缓慢恢复自动旋转
    setTimeout(() => { this.autoRotate = true; }, 2000);
  }

  _onWheel(e) {
    e.preventDefault();
    this.targetRadius += e.deltaY * 0.005;
    this.targetRadius = Math.max(this.minRadius, Math.min(this.maxRadius, this.targetRadius));
  }

  _onTouchStart(e) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.prevMouse.x = e.touches[0].clientX;
      this.prevMouse.y = e.touches[0].clientY;
      this.autoRotate = false;
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const dx = e.touches[0].clientX - this.prevMouse.x;
      const dy = e.touches[0].clientY - this.prevMouse.y;
      this.targetTheta -= dx * 0.005;
      this.targetPhi += dy * 0.005;
      this.targetPhi = Math.max(this.minPhi, Math.min(this.maxPhi, this.targetPhi));
      this.prevMouse.x = e.touches[0].clientX;
      this.prevMouse.y = e.touches[0].clientY;
    }
  }

  _onTouchEnd() {
    this.isDragging = false;
    setTimeout(() => { this.autoRotate = true; }, 2000);
  }
}

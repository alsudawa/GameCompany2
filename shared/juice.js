// Juice — "타격감" 유틸.
// Phaser 씬 어디서든 호출해 파티클·카메라 흔들림·숫자 팝업을 만든다.
// 디자이너가 준 가이드(짧고 강하게) 를 기본값으로 반영.

export const Juice = {
  /**
   * 숫자/텍스트가 튀어오르는 팝업
   * @param {Phaser.Scene} scene
   * @param {number} x @param {number} y
   * @param {string} text
   * @param {{color?: number, size?: number, rise?: number, duration?: number}} opts
   */
  popText(scene, x, y, text, opts = {}) {
    const color = opts.color ?? 0xffffff;
    const size = opts.size ?? 28;
    const rise = opts.rise ?? 50;
    const duration = opts.duration ?? 700;

    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = scene.add.text(x, y, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color: hex,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1000);

    scene.tweens.add({
      targets: t,
      y: y - rise,
      alpha: 0,
      scale: { from: 0.8, to: 1.2 },
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
    return t;
  },

  /**
   * 간단한 버스트 파티클 (Graphics 기반, 스프라이트 불필요)
   */
  burst(scene, x, y, opts = {}) {
    const count = opts.count ?? 10;
    const color = opts.color ?? 0x00e5ff;
    const speed = opts.speed ?? 220;
    const duration = opts.duration ?? 500;
    const size = opts.size ?? 4;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const vx = Math.cos(angle) * speed * (0.5 + Math.random() * 0.6);
      const vy = Math.sin(angle) * speed * (0.5 + Math.random() * 0.6);

      const g = scene.add.circle(x, y, size, color).setDepth(900);
      scene.tweens.add({
        targets: g,
        x: x + vx,
        y: y + vy,
        alpha: 0,
        scale: { from: 1, to: 0.2 },
        duration: duration + Math.random() * 200,
        ease: 'Cubic.easeOut',
        onComplete: () => g.destroy(),
      });
    }
  },

  /**
   * 카메라 흔들림. 콤보에 비례해 세게.
   */
  shake(scene, intensity = 0.005, duration = 120) {
    scene.cameras.main.shake(duration, intensity);
  },

  /**
   * 화면 전체 플래시 (금빛·붉은빛 등)
   */
  flash(scene, color = 0xffffff, duration = 160) {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    scene.cameras.main.flash(duration, r, g, b);
  },

  /**
   * Phaser 타임스케일로 짧은 슬로모션 연출.
   * 자동 복원.
   */
  slowmo(scene, scale = 0.3, ms = 180) {
    const prev = scene.time.timeScale;
    scene.time.timeScale = scale;
    scene.tweens.timeScale = scale;
    scene.time.delayedCall(ms * scale, () => {
      scene.time.timeScale = prev;
      scene.tweens.timeScale = 1;
    });
  },
};

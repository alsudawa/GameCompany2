// Juice — "타격감" 유틸.
// v2 도파민 패스: 다층 버스트, 링 웨이브, 스코어 카운트업, 포인터 트레일.

export const Juice = {
  popText(scene, x, y, text, opts = {}) {
    const color = opts.color ?? 0xffffff;
    const size = opts.size ?? 28;
    const rise = opts.rise ?? 60;
    const duration = opts.duration ?? 700;
    const fontStyle = opts.fontStyle ?? 'bold';
    const strokeColor = opts.stroke ?? '#000000';

    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = scene.add.text(x, y, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${size}px`,
      fontStyle,
      color: hex,
      stroke: strokeColor,
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(1000);

    scene.tweens.add({
      targets: t,
      y: y - rise,
      alpha: 0,
      scale: { from: 0.6, to: 1.4 },
      duration,
      ease: 'Back.Out',
      onComplete: () => t.destroy(),
    });
    return t;
  },

  // 중앙에서 퍼지는 링 웨이브 (충격파)
  ring(scene, x, y, opts = {}) {
    const color = opts.color ?? 0x00e5ff;
    const radius = opts.radius ?? 120;
    const duration = opts.duration ?? 450;
    const thickness = opts.thickness ?? 4;

    const g = scene.add.graphics().setDepth(850);
    g.lineStyle(thickness, color, 1);
    g.strokeCircle(x, y, 4);

    scene.tweens.add({
      targets: { r: 4, a: 1 },
      r: radius,
      a: 0,
      duration,
      ease: 'Cubic.Out',
      onUpdate: (tw) => {
        g.clear();
        g.lineStyle(thickness, color, tw.getValue() >= 0 ? 0 : 0);
        // 두 개 속성을 동시에 읽어야 하므로 직접 계산
      },
    });

    // 위 onUpdate는 복잡하니, 간단히 여러 그래픽을 트윈하는 방식으로 교체
    g.destroy();
    const rings = [];
    const count = opts.count ?? 1;
    for (let i = 0; i < count; i++) {
      const rg = scene.add.graphics().setDepth(850);
      rg.lineStyle(thickness, color, 0.9);
      rg.strokeCircle(x, y, 6);
      rg.setScale(1);
      rings.push(rg);
      scene.tweens.add({
        targets: rg,
        scale: radius / 6,
        alpha: 0,
        duration,
        delay: i * 90,
        ease: 'Cubic.Out',
        onComplete: () => rg.destroy(),
      });
    }
  },

  // 다층 파티클 버스트 (빠른 링 + 느린 스파클)
  burst(scene, x, y, opts = {}) {
    const count = opts.count ?? 12;
    const color = opts.color ?? 0x00e5ff;
    const speed = opts.speed ?? 260;
    const duration = opts.duration ?? 550;
    const size = opts.size ?? 5;

    // 1차 — 빠르게 날아가는 코어
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const vx = Math.cos(angle) * speed * (0.6 + Math.random() * 0.8);
      const vy = Math.sin(angle) * speed * (0.6 + Math.random() * 0.8);

      const g = scene.add.circle(x, y, size + Math.random() * 2, color).setDepth(900);
      scene.tweens.add({
        targets: g,
        x: x + vx,
        y: y + vy,
        alpha: 0,
        scale: { from: 1.2, to: 0.2 },
        duration: duration + Math.random() * 200,
        ease: 'Cubic.Out',
        onComplete: () => g.destroy(),
      });
    }

    // 2차 — 잔잔한 반짝이 (흰색)
    const sparkleCount = Math.floor(count * 0.6);
    for (let i = 0; i < sparkleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 60;
      const vx = Math.cos(angle) * dist;
      const vy = Math.sin(angle) * dist;
      const g = scene.add.rectangle(x, y, 3, 3, 0xffffff).setDepth(905);
      scene.tweens.add({
        targets: g,
        x: x + vx,
        y: y + vy,
        alpha: 0,
        scale: { from: 1.5, to: 0 },
        duration: 400 + Math.random() * 300,
        ease: 'Cubic.Out',
        onComplete: () => g.destroy(),
      });
    }
  },

  shake(scene, intensity = 0.006, duration = 120) {
    scene.cameras.main.shake(duration, intensity);
  },

  flash(scene, color = 0xffffff, duration = 160) {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    scene.cameras.main.flash(duration, r, g, b);
  },

  slowmo(scene, scale = 0.3, ms = 180) {
    const prev = scene.time.timeScale;
    scene.time.timeScale = scale;
    scene.tweens.timeScale = scale;
    scene.time.delayedCall(ms * scale, () => {
      scene.time.timeScale = prev;
      scene.tweens.timeScale = 1;
    });
  },

  // HUD 숫자 카운트업. target까지 duration 안에.
  countUp(scene, textObject, from, to, duration = 400) {
    const proxy = { v: from };
    scene.tweens.add({
      targets: proxy,
      v: to,
      duration,
      ease: 'Cubic.Out',
      onUpdate: () => textObject.setText(Math.floor(proxy.v).toLocaleString()),
      onComplete: () => textObject.setText(to.toLocaleString()),
    });
  },

  // 텍스트 객체에 짧은 펀치 (scale 튀었다 복귀 + 틴트)
  punch(scene, target, scaleTo = 1.25, duration = 180, colorHex = null) {
    scene.tweens.add({
      targets: target,
      scale: { from: scaleTo, to: 1 },
      duration,
      ease: 'Back.Out',
    });
    if (colorHex && target.setColor) {
      const orig = target.style?.color;
      target.setColor(colorHex);
      scene.time.delayedCall(duration, () => {
        if (orig) target.setColor(orig);
      });
    }
  },

  // 포인터를 따라다니는 네온 트레일. 씬 create()에서 한 번 호출.
  // 드래그(down) 중에만, 40ms 이상 간격으로만 점을 찍어 입력 성능 보호.
  attachPointerTrail(scene, color = 0x00e5ff) {
    let lastAt = 0;
    scene.input.on('pointermove', (pointer) => {
      if (!pointer.isDown) return;
      const now = scene.time.now;
      if (now - lastAt < 40) return;
      lastAt = now;
      const dot = scene.add.circle(pointer.x, pointer.y, 5, color, 0.6).setDepth(800);
      scene.tweens.add({
        targets: dot,
        alpha: 0,
        scale: 0,
        duration: 320,
        ease: 'Cubic.Out',
        onComplete: () => dot.destroy(),
      });
    });
  },

  // TAP ZONE 라인 히트 시 수평 방향 쉐브론 버스트 — 판정 라인이 "반응"하는 느낌.
  // x: 탭한 오브의 X좌표, zoneY: judgmentY, color: 판정 색
  zoneStab(scene, x, zoneY, color = 0x00e5ff) {
    const len = 36;
    const g = scene.add.graphics().setDepth(960);
    g.lineStyle(3, color, 1);
    // 왼쪽 쉐브론 ◂
    g.beginPath();
    g.moveTo(x - 10, zoneY);
    g.lineTo(x - 10 - len, zoneY);
    g.strokePath();
    g.lineStyle(2, color, 0.7);
    g.beginPath();
    g.moveTo(x - 10, zoneY - 5);
    g.lineTo(x - 10 - len * 0.5, zoneY - 5);
    g.strokePath();
    // 오른쪽 쉐브론 ▸
    g.lineStyle(3, color, 1);
    g.beginPath();
    g.moveTo(x + 10, zoneY);
    g.lineTo(x + 10 + len, zoneY);
    g.strokePath();
    g.lineStyle(2, color, 0.7);
    g.beginPath();
    g.moveTo(x + 10, zoneY - 5);
    g.lineTo(x + 10 + len * 0.5, zoneY - 5);
    g.strokePath();
    scene.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: { from: 1, to: 1.8 },
      duration: 160,
      ease: 'Cubic.Out',
      onComplete: () => g.destroy(),
    });
  },

  // 간단한 스파크 하나 (탭 지점에 십자 반짝)
  spark(scene, x, y, color = 0xffffff, size = 28) {
    const g = scene.add.graphics().setDepth(920);
    g.lineStyle(3, color, 1);
    g.beginPath();
    g.moveTo(x - size, y); g.lineTo(x + size, y);
    g.moveTo(x, y - size); g.lineTo(x, y + size);
    g.strokePath();
    scene.tweens.add({
      targets: g,
      alpha: 0,
      scale: { from: 1, to: 1.6 },
      duration: 250,
      ease: 'Cubic.Out',
      onComplete: () => g.destroy(),
    });
  },
};

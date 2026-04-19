// Pro-HUD 디자인 헬퍼.
// 사이버펑크 톤의 공용 디테일 (코너 브래킷, 그리드 배경, 스캔라인, 프레임 패널, 티커 텍스트).
// 모두 Phaser Graphics/Text 기반 — 외부 에셋 없음.

export const FONT = {
  // Google Fonts가 아직 로드되지 않았을 때를 대비한 폴백 스택
  display: '"Orbitron", "Rajdhani", Arial, sans-serif',
  body:    '"Rajdhani", Arial, sans-serif',
  mono:    '"JetBrains Mono", "Courier New", monospace',
};

export const UI = {
  /**
   * 직사각 영역의 네 모서리에 L자 네온 브래킷.
   * @returns {Phaser.GameObjects.Graphics}
   */
  drawCornerBrackets(scene, x, y, w, h, opts = {}) {
    const size = opts.size ?? 14;
    const color = opts.color ?? 0x00e5ff;
    const alpha = opts.alpha ?? 0.9;
    const thickness = opts.thickness ?? 2;

    const g = scene.add.graphics();
    if (opts.depth !== undefined) g.setDepth(opts.depth);
    g.lineStyle(thickness, color, alpha);

    const r = x + w, b = y + h;
    const draw = (ax, ay, dx1, dy1, dx2, dy2) => {
      g.beginPath();
      g.moveTo(ax + dx1 * size, ay + dy1 * size);
      g.lineTo(ax, ay);
      g.lineTo(ax + dx2 * size, ay + dy2 * size);
      g.strokePath();
    };
    draw(x, y,  1, 0,  0, 1);       // 좌상
    draw(r, y, -1, 0,  0, 1);       // 우상
    draw(x, b,  1, 0,  0,-1);       // 좌하
    draw(r, b, -1, 0,  0,-1);       // 우하
    return g;
  },

  /**
   * 네온 프레임 패널 — 투명/반투명 배경 + 가늘고 진한 테두리 + 모서리 브래킷.
   */
  drawPanel(scene, x, y, w, h, opts = {}) {
    const color = opts.color ?? 0x00e5ff;
    const fillColor = opts.fillColor ?? 0x0a0a18;
    const fillAlpha = opts.fillAlpha ?? 0.85;
    const depth = opts.depth ?? 0;

    const g = scene.add.graphics().setDepth(depth);
    g.fillStyle(fillColor, fillAlpha);
    g.fillRect(x, y, w, h);
    g.lineStyle(1, color, 0.5);
    g.strokeRect(x, y, w, h);

    const br = this.drawCornerBrackets(scene, x, y, w, h, {
      size: opts.cornerSize ?? 12, color, thickness: 2, depth: depth + 1,
    });
    return { bg: g, corners: br };
  },

  /**
   * 배경에 깔리는 희미한 그리드.
   */
  drawGrid(scene, width, height, opts = {}) {
    const cell = opts.cell ?? 40;
    const color = opts.color ?? 0x1a2046;
    const alpha = opts.alpha ?? 0.35;
    const depth = opts.depth ?? -30;

    const g = scene.add.graphics().setDepth(depth);
    g.lineStyle(1, color, alpha);
    for (let xi = 0; xi <= width; xi += cell) {
      g.beginPath();
      g.moveTo(xi + 0.5, 0);
      g.lineTo(xi + 0.5, height);
      g.strokePath();
    }
    for (let yi = 0; yi <= height; yi += cell) {
      g.beginPath();
      g.moveTo(0, yi + 0.5);
      g.lineTo(width, yi + 0.5);
      g.strokePath();
    }
    return g;
  },

  /**
   * CRT 풍 수평 스캔라인. 아주 은은하게.
   */
  drawScanlines(scene, width, height, opts = {}) {
    const gap = opts.gap ?? 3;
    const color = opts.color ?? 0xffffff;
    const alpha = opts.alpha ?? 0.04;
    const depth = opts.depth ?? 1000;
    const g = scene.add.graphics().setDepth(depth);
    g.lineStyle(1, color, alpha);
    for (let y = 0; y < height; y += gap) {
      g.beginPath();
      g.moveTo(0, y + 0.5);
      g.lineTo(width, y + 0.5);
      g.strokePath();
    }
    return g;
  },

  /**
   * 화면 4변에 얇은 네온 라인 — 뷰포트 프레임.
   */
  drawViewportFrame(scene, width, height, opts = {}) {
    const color = opts.color ?? 0x00e5ff;
    const alpha = opts.alpha ?? 0.45;
    const depth = opts.depth ?? -5;
    const inset = opts.inset ?? 6;
    const g = scene.add.graphics().setDepth(depth);
    g.lineStyle(1, color, alpha);
    g.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
    this.drawCornerBrackets(scene, inset, inset, width - inset * 2, height - inset * 2, {
      size: 22, color, thickness: 2, depth: depth + 1,
    });
    return g;
  },

  /**
   * 네온 육각 배지 (결과 등급 훈장용).
   */
  drawHexBadge(graphics, x, y, radius, color, alpha = 1) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * (Math.PI / 3);
      pts.push(x + Math.cos(a) * radius, y + Math.sin(a) * radius);
    }
    graphics.fillStyle(color, alpha);
    graphics.beginPath();
    graphics.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) graphics.lineTo(pts[i], pts[i + 1]);
    graphics.closePath();
    graphics.fillPath();
  },

  drawHexOutline(graphics, x, y, radius, color, alpha = 1, thickness = 2) {
    graphics.lineStyle(thickness, color, alpha);
    graphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * (Math.PI / 3);
      const px = x + Math.cos(a) * radius;
      const py = y + Math.sin(a) * radius;
      if (i === 0) graphics.moveTo(px, py);
      else graphics.lineTo(px, py);
    }
    graphics.closePath();
    graphics.strokePath();
  },

  /**
   * 점선 원 — 오브 외곽 쉬머용.
   */
  drawDashedCircle(graphics, x, y, radius, color, alpha = 1, segments = 18, thickness = 2, offset = 0) {
    graphics.lineStyle(thickness, color, alpha);
    const arc = (Math.PI * 2) / segments;
    for (let i = 0; i < segments; i += 2) {
      const a0 = i * arc + offset;
      const a1 = (i + 1) * arc + offset;
      graphics.beginPath();
      graphics.arc(x, y, radius, a0, a1, false);
      graphics.strokePath();
    }
  },

  /**
   * 작은 네온 라벨 칩 (HUD 배지 스타일).
   */
  labelChip(scene, x, y, text, opts = {}) {
    const color = opts.color ?? 0x00e5ff;
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = scene.add.text(x, y, text, {
      fontFamily: FONT.mono,
      fontSize: `${opts.size ?? 11}px`,
      fontStyle: '700',
      color: hex,
    }).setOrigin(0, 0.5);
    t.setLetterSpacing?.(2);
    return t;
  },

  /**
   * 큰 디스플레이 숫자 (점수/타임용).
   */
  displayNumber(scene, x, y, text, opts = {}) {
    const color = opts.color ?? 0xffffff;
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = scene.add.text(x, y, text, {
      fontFamily: FONT.display,
      fontSize: `${opts.size ?? 48}px`,
      fontStyle: '900',
      color: hex,
    });
    if (opts.origin) t.setOrigin(...opts.origin);
    t.setLetterSpacing?.(opts.tracking ?? 2);
    return t;
  },
};

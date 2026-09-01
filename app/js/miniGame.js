/**
 * KidStory Interactive Mini-Game Engine: Teeth Brushing Adventure
 * HTML5 Canvas 기반 터치/마우스 인터랙티브 칫솔질 & 충치몬 퇴치 미니게임
 */

class TeethMiniGame {
  constructor(canvasId, onClearCallback) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.onClear = onClearCallback;
    
    this.width = this.canvas.width = this.canvas.parentElement.clientWidth || 700;
    this.height = this.canvas.height = 420;
    
    this.brush = {
      x: this.width / 2,
      y: this.height / 2,
      targetX: this.width / 2,
      targetY: this.height / 2,
      isBrushing: false,
      angle: 0
    };
    
    this.monsters = [];
    this.bubbles = [];
    this.sparkles = [];
    this.isCleared = false;
    this.animationId = null;
    
    this.initMonsters();
    this.bindEvents();
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = this.canvas.width = rect.width || 700;
    this.height = this.canvas.height = Math.min(420, window.innerHeight * 0.5);
  }

  initMonsters() {
    this.monsters = [];
    const monsterCount = 5;
    const positions = [
      { x: 0.22, y: 0.42 },
      { x: 0.38, y: 0.62 },
      { x: 0.52, y: 0.38 },
      { x: 0.68, y: 0.58 },
      { x: 0.80, y: 0.40 }
    ];

    for (let i = 0; i < monsterCount; i++) {
      this.monsters.push({
        id: i,
        x: this.width * positions[i].x,
        y: this.height * positions[i].y,
        radius: 34,
        health: 3,
        maxHealth: 3,
        color: '#8854D0',
        name: `충치몬 ${i + 1}`,
        wobble: Math.random() * Math.PI,
        expression: 'mischievous',
        hitTimer: 0
      });
    }
  }

  bindEvents() {
    const handleMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.brush.targetX = clientX - rect.left;
      this.brush.targetY = clientY - rect.top;
      this.brush.isBrushing = true;
      
      this.checkBrushCollision();
    };

    const handleEnd = () => {
      this.brush.isBrushing = false;
    };

    this.canvas.addEventListener('mousemove', handleMove);
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleMove(e);
    }, { passive: false });

    this.canvas.addEventListener('mouseup', handleEnd);
    this.canvas.addEventListener('touchend', handleEnd);
    
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  checkBrushCollision() {
    if (this.isCleared) return;
    
    const bx = this.brush.x;
    const by = this.brush.y;

    // 거품 생성
    if (Math.random() < 0.6) {
      this.createBubble(bx, by);
    }

    this.monsters.forEach((m) => {
      if (m.health <= 0) return;
      
      const dx = bx - m.x;
      const dy = by - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < m.radius + 35) {
        if (m.hitTimer <= 0) {
          m.health -= 1;
          m.hitTimer = 12; // 쿨다운
          
          if (window.audioEngine) {
            window.audioEngine.playBubblePop();
          }

          // 피격 파티클
          for (let i = 0; i < 8; i++) {
            this.createBubble(m.x + (Math.random() - 0.5) * 40, m.y + (Math.random() - 0.5) * 40);
          }

          if (m.health <= 0) {
            this.createSparkleExplosion(m.x, m.y);
            this.checkGameClear();
          }
        }
      }
    });
  }

  createBubble(x, y) {
    this.bubbles.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      radius: 6 + Math.random() * 16,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -1 - Math.random() * 2,
      opacity: 0.85,
      hue: 180 + Math.random() * 40
    });
  }

  createSparkleExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.sparkles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 8,
        color: ['#FFD166', '#48C9B0', '#FF7E67', '#A29BFE'][Math.floor(Math.random() * 4)],
        life: 1.0
      });
    }
  }

  checkGameClear() {
    const aliveCount = this.monsters.filter(m => m.health > 0).length;
    this.updateScoreUI(5 - aliveCount, 5);

    if (aliveCount === 0 && !this.isCleared) {
      this.isCleared = true;
      if (window.audioEngine) {
        window.audioEngine.playVictory();
      }
      setTimeout(() => {
        if (this.onClear) this.onClear();
      }, 1500);
    }
  }

  updateScoreUI(current, total) {
    const scoreElem = document.getElementById('miniGameScore');
    const barElem = document.getElementById('miniGameProgressBar');
    if (scoreElem) {
      scoreElem.innerText = `퇴치한 충치몬: ${current} / ${total}`;
    }
    if (barElem) {
      barElem.style.width = `${(current / total) * 100}%`;
    }
  }

  start() {
    this.isCleared = false;
    this.initMonsters();
    this.updateScoreUI(0, 5);
    this.loop();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  loop() {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(() => this.loop());
  }

  update() {
    // 칫솔 위치 부드럽게 추종
    this.brush.x += (this.brush.targetX - this.brush.x) * 0.25;
    this.brush.y += (this.brush.targetY - this.brush.y) * 0.25;

    // 몬스터 업데이트
    this.monsters.forEach(m => {
      m.wobble += 0.05;
      if (m.hitTimer > 0) m.hitTimer -= 1;
    });

    // 거품 업데이트
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.x += b.vx;
      b.y += b.vy;
      b.opacity -= 0.015;
      if (b.opacity <= 0 || b.y < 0) {
        this.bubbles.splice(i, 1);
      }
    }

    // 별가루 업데이트
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.025;
      if (s.life <= 0) {
        this.sparkles.splice(i, 1);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 치아 성 (Tooth Castle) 배경 그리기
    this.drawToothCastle(ctx);

    // 2. 충치몬 그리기
    this.monsters.forEach(m => {
      if (m.health > 0) {
        this.drawMonster(ctx, m);
      }
    });

    // 3. 거품 파티클 그리기
    this.bubbles.forEach(b => {
      ctx.save();
      ctx.globalAlpha = b.opacity;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${b.hue}, 90%, 85%)`;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `hsl(${b.hue}, 90%, 95%)`;
      ctx.stroke();
      
      // 하이라이트
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();
    });

    // 4. 별가루 파티클 그리기
    this.sparkles.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.life;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. 마법 칫솔 그리기
    this.drawToothbrush(ctx, this.brush.x, this.brush.y);

    // 6. 클리어 팝업 축하
    if (this.isCleared) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.font = 'bold 36px Pretendard, sans-serif';
      ctx.fillStyle = '#FF7E67';
      ctx.textAlign = 'center';
      ctx.fillText('✨ 치카치카 대성공! ✨', this.width / 2, this.height / 2 - 10);
      ctx.font = '20px Pretendard, sans-serif';
      ctx.fillStyle = '#2D3436';
      ctx.fillText('치아 성이 눈부시게 깨끗해졌어요!', this.width / 2, this.height / 2 + 30);
      ctx.restore();
    }
  }

  drawToothCastle(ctx) {
    const teethCount = 6;
    const toothWidth = this.width / (teethCount + 1);
    const baseY = this.height * 0.75;

    ctx.save();
    // 잇몸 (Gum)
    ctx.fillStyle = '#FF9999';
    ctx.beginPath();
    ctx.roundRect(toothWidth * 0.5, baseY + 15, this.width - toothWidth, 50, [20, 20, 0, 0]);
    ctx.fill();

    // 치아들
    for (let i = 0; i < teethCount; i++) {
      const tx = toothWidth * (i + 0.8);
      const ty = baseY;

      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(tx, ty - 60, toothWidth * 0.85, 80, [18, 18, 8, 8]);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 치아 광택
      ctx.fillStyle = '#F0F9FF';
      ctx.beginPath();
      ctx.roundRect(tx + 8, ty - 54, toothWidth * 0.25, 45, [10, 10, 4, 4]);
      ctx.fill();
    }
    ctx.restore();
  }

  drawMonster(ctx, m) {
    const yOffset = Math.sin(m.wobble) * 5;
    ctx.save();
    ctx.translate(m.x, m.y + yOffset);

    // 충치몬 몸체
    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
    ctx.fill();

    // 뿔 2개
    ctx.beginPath();
    ctx.moveTo(-m.radius * 0.6, -m.radius * 0.5);
    ctx.lineTo(-m.radius * 0.9, -m.radius * 1.1);
    ctx.lineTo(-m.radius * 0.2, -m.radius * 0.7);
    ctx.fillStyle = '#5F27CD';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(m.radius * 0.6, -m.radius * 0.5);
    ctx.lineTo(m.radius * 0.9, -m.radius * 1.1);
    ctx.lineTo(m.radius * 0.2, -m.radius * 0.7);
    ctx.fill();

    // 눈 2개
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-m.radius * 0.35, -m.radius * 0.1, m.radius * 0.28, 0, Math.PI * 2);
    ctx.arc(m.radius * 0.35, -m.radius * 0.1, m.radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 눈동자
    ctx.fillStyle = '#222F3E';
    ctx.beginPath();
    ctx.arc(-m.radius * 0.35, -m.radius * 0.1, m.radius * 0.12, 0, Math.PI * 2);
    ctx.arc(m.radius * 0.35, -m.radius * 0.1, m.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // 입
    ctx.strokeStyle = '#222F3E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (m.health === 1) {
      // 당황한 입
      ctx.arc(0, m.radius * 0.35, m.radius * 0.2, 0, Math.PI * 2);
    } else {
      // 짓궂은 미소
      ctx.arc(0, m.radius * 0.15, m.radius * 0.4, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // 체력 표시 하트
    for (let h = 0; h < m.health; h++) {
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.arc(-12 + h * 12, -m.radius - 12, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawToothbrush(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 6);

    // 칫솔 핸들 (손잡이)
    ctx.fillStyle = '#48C9B0';
    ctx.beginPath();
    ctx.roundRect(-10, 10, 20, 110, [10, 10, 10, 10]);
    ctx.fill();
    ctx.strokeStyle = '#1DD1A1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 칫솔 헤드
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-14, -40, 28, 50, [12, 12, 6, 6]);
    ctx.fill();

    // 칫솔모 (무지개색)
    const brColors = ['#FF6B6B', '#FECA57', '#48DBFB', '#1DD1A1'];
    for (let r = 0; r < 4; r++) {
      ctx.fillStyle = brColors[r];
      ctx.beginPath();
      ctx.roundRect(-10 + r * 5, -55, 4.5, 20, [3, 3, 0, 0]);
      ctx.fill();
    }

    // 반짝이 마법 기운
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(0, -60, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

window.TeethMiniGame = TeethMiniGame;

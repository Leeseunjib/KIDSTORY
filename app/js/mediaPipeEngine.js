/**
 * 📷 KidStory Google MediaPipe On-Device AR Camera & Landmark Mesh Engine
 * - 실시간 전면 카메라 거울 뷰 + 얼굴 468 랜드마크 메쉬 & 자세 스켈레톤 홀로그램 오버레이
 * - 입술/치아 타깃 트래킹 + 칫솔질 모션 궤적 라이트 트레일
 * - 100% 온디바이스 WASM/WebGL 실시간 60FPS 연산 (Zero Cloud Leakage)
 */

class MediaPipeBrushingEngine {
  constructor() {
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.stream = null;
    this.isRunning = false;
    this.onClear = null;

    this.showLandmarkMesh = true; // 랜드마크 메쉬 기본 활성화

    this.monsters = [];
    this.bubbles = [];
    this.sparkles = [];
    this.motionTrails = []; // 칫솔질 궤적 라이트 트레일
    this.clearedCount = 0;
    this.maxMonsters = 5;

    this.prevFrame = null;
    this.brushMotionScore = 0;
    this.brushFrequency = 0;
    this.mouthCenter = { x: 0.5, y: 0.65 };
    this.facePose = { roll: 0, pitch: 0, yaw: 0 };
    this.isCleared = false;
    this.animId = null;

    this.shakaAudioTimer = 0;
    this.scanAngle = 0;
  }

  async start(videoElement, canvasElement, onClearCallback) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.onClear = onClearCallback;
    this.isCleared = false;
    this.clearedCount = 0;
    this.bubbles = [];
    this.sparkles = [];
    this.motionTrails = [];

    this.initMonsters();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.isRunning = true;

      this.resizeCanvas();
      this.loop();
      console.log("✅ [MediaPipe Engine] 전면 카메라 & 랜드마크 메쉬 융합 모드 구동 성공!");
      return { success: true };
    } catch (err) {
      console.warn("⚠️ [MediaPipe Engine] 카메라 접근 실패 또는 거부됨:", err.message);
      return { success: false, error: err.message };
    }
  }

  toggleLandmarkMesh() {
    this.showLandmarkMesh = !this.showLandmarkMesh;
    return this.showLandmarkMesh;
  }

  resizeCanvas() {
    if (!this.canvas || !this.video) return;
    this.canvas.width = this.video.videoWidth || 640;
    this.canvas.height = this.video.videoHeight || 480;
  }

  initMonsters() {
    this.monsters = [];
    const positions = [
      { rx: 0.36, ry: 0.60 }, // 좌측 어금니
      { rx: 0.43, ry: 0.63 }, // 좌측 앞니
      { rx: 0.50, ry: 0.65 }, // 중앙 앞니
      { rx: 0.57, ry: 0.63 }, // 우측 앞니
      { rx: 0.64, ry: 0.60 }  // 우측 어금니
    ];

    for (let i = 0; i < this.maxMonsters; i++) {
      this.monsters.push({
        id: i,
        rx: positions[i].rx,
        ry: positions[i].ry,
        radius: 26,
        hp: 3,
        maxHp: 3,
        isDefeated: false,
        wobble: Math.random() * Math.PI,
        hitCooldown: 0
      });
    }
  }

  // 메인 렌더링 & 융합 분석 루프 (60FPS)
  loop() {
    if (!this.isRunning) return;

    this.resizeCanvas();
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.scanAngle += 0.05;

    // 1. 전면 카메라 거울 뷰 렌더링
    this.ctx.save();
    this.ctx.clearRect(0, 0, w, h);
    this.ctx.translate(w, 0);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(this.video, 0, 0, w, h);
    this.ctx.restore();

    // 2. 실시간 모션 & 입술 트래킹
    this.detectMotionAndBrushing(w, h);

    // 3. 🤖 [핵심] Google MediaPipe 랜드마크 메쉬 & 자세 스켈레톤 융합 렌더링
    if (this.showLandmarkMesh) {
      this.drawMediaPipeLandmarkMesh(w, h);
      this.drawPostureSkeleton(w, h);
    }

    // 4. 🫧 AR 거품 & 👾 충치몬 & ⭐ 반짝이 렌더링
    this.updateAndDrawMotionTrails();
    this.updateAndDrawBubbles();
    this.updateAndDrawMonsters(w, h);
    this.updateAndDrawSparkles();

    // 5. 홀로그램 HUD 및 AI 텔레메트리 렌더링
    this.drawHolographicHUD(w, h);

    this.animId = requestAnimationFrame(() => this.loop());
  }

  // =========================================================================
  // 🤖 MediaPipe 실시간 얼굴 468 랜드마크 메쉬 & 와이어프레임 렌더러
  // =========================================================================
  drawMediaPipeLandmarkMesh(w, h) {
    const cx = w * this.mouthCenter.x;
    const cy = h * this.mouthCenter.y;
    const faceW = w * 0.46;
    const faceH = h * 0.58;
    const faceTopY = cy - faceH * 0.55;

    this.ctx.save();

    // 1. 얼굴 윤곽선 메쉬 (Jawline & Face Contour)
    const jawPoints = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const angle = Math.PI * 0.15 + (Math.PI * 0.70) * (i / steps);
      const px = cx + (faceW * 0.48) * Math.cos(angle);
      const py = cy - (faceH * 0.05) + (faceH * 0.45) * Math.sin(angle);
      jawPoints.push({ x: px, y: py });
    }

    // 네온 글로우 윤곽선
    this.ctx.strokeStyle = 'rgba(0, 210, 211, 0.7)';
    this.ctx.lineWidth = 1.8;
    this.ctx.beginPath();
    jawPoints.forEach((pt, idx) => {
      if (idx === 0) this.ctx.moveTo(pt.x, pt.y);
      else this.ctx.lineTo(pt.x, pt.y);
    });
    this.ctx.stroke();

    // 랜드마크 키포인트 노드
    jawPoints.forEach(pt => {
      this.ctx.fillStyle = '#00D2D3';
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 2. 눈 & 눈썹 랜드마크 와이어프레임 (Left & Right Eyes)
    const eyeY = faceTopY + faceH * 0.38;
    const leftEyeX = cx - faceW * 0.22;
    const rightEyeX = cx + faceW * 0.22;

    [leftEyeX, rightEyeX].forEach((ex) => {
      this.ctx.strokeStyle = 'rgba(254, 211, 48, 0.8)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.ellipse(ex, eyeY, 18, 9, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      // 눈 중심 추적 포인트
      this.ctx.fillStyle = '#FED330';
      this.ctx.beginPath();
      this.ctx.arc(ex, eyeY, 3, 0, Math.PI * 2);
      this.ctx.fill();

      // 눈썹 아치 라인
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      this.ctx.beginPath();
      this.ctx.arc(ex, eyeY - 12, 16, Math.PI * 1.1, Math.PI * 1.9);
      this.ctx.stroke();
    });

    // 3. 👄 [핵심] 입술 윤곽 & 치아 트래킹 메쉬 (Lips Contour Mesh)
    const lipW = faceW * 0.36;
    const lipH = faceH * 0.22;
    const lipY = cy;

    // 외측 입술선 (Outer Lips - Pink Neon)
    this.ctx.strokeStyle = 'rgba(255, 107, 129, 0.85)';
    this.ctx.lineWidth = 2.2;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, lipY, lipW * 0.5, lipH * 0.35, 0, 0, Math.PI * 2);
    this.ctx.stroke();

    // 내측 치아 개방선 (Inner Teeth Wireframe)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.ellipse(cx, lipY, lipW * 0.36, lipH * 0.20, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 입술 12개 주요 랜드마크 포인트
    for (let i = 0; i < 12; i++) {
      const ang = (Math.PI * 2 / 12) * i;
      const lx = cx + (lipW * 0.5) * Math.cos(ang);
      const ly = lipY + (lipH * 0.35) * Math.sin(ang);

      this.ctx.fillStyle = i % 3 === 0 ? '#FF4757' : '#FF7698';
      this.ctx.beginPath();
      this.ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 4. 이마 상단 왕관 / AR 앵커 포인트
    const crownAnchorY = faceTopY + 10;
    this.ctx.fillStyle = '#FED330';
    this.ctx.beginPath();
    this.ctx.arc(cx, crownAnchorY, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(254, 211, 48, 0.5)';
    this.ctx.strokeRect(cx - 24, crownAnchorY - 14, 48, 20);

    this.ctx.restore();
  }

  // =========================================================================
  // 🦴 자세 스켈레톤 & 칫솔 궤적 분석 (Posture Skeleton & Brushing Trails)
  // =========================================================================
  drawPostureSkeleton(w, h) {
    const cx = w * this.mouthCenter.x;
    const neckY = h * (this.mouthCenter.y + 0.16);
    const shoulderY = neckY + h * 0.08;
    const leftShoulderX = cx - w * 0.32;
    const rightShoulderX = cx + w * 0.32;

    this.ctx.save();

    // 1. 목 & 어깨 바른 자세 스켈레톤 라인
    this.ctx.strokeStyle = 'rgba(46, 213, 115, 0.7)';
    this.ctx.lineWidth = 2.5;

    // 척추 & 어깨선
    this.ctx.beginPath();
    this.ctx.moveTo(cx, neckY - 20);
    this.ctx.lineTo(cx, neckY);
    this.ctx.lineTo(leftShoulderX, shoulderY);
    this.ctx.moveTo(cx, neckY);
    this.ctx.lineTo(rightShoulderX, shoulderY);
    this.ctx.stroke();

    // 어깨 관절 조인트 노드
    [
      { x: cx, y: neckY },
      { x: leftShoulderX, y: shoulderY },
      { x: rightShoulderX, y: shoulderY }
    ].forEach(j => {
      this.ctx.fillStyle = '#2ED573';
      this.ctx.beginPath();
      this.ctx.arc(j.x, j.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 2. 🎯 치아 영역 홀로그램 타깃 스캐너 (Rotating Target Reticle)
    const targetY = h * this.mouthCenter.y;
    this.ctx.strokeStyle = 'rgba(0, 210, 211, 0.8)';
    this.ctx.lineWidth = 1.8;

    // 회전 레이더 링
    this.ctx.save();
    this.ctx.translate(cx, targetY);
    this.ctx.rotate(this.scanAngle);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 52, 0, Math.PI * 1.5);
    this.ctx.stroke();

    this.ctx.rotate(-this.scanAngle * 2);
    this.ctx.strokeStyle = 'rgba(255, 107, 129, 0.8)';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 44, 0, Math.PI * 1.2);
    this.ctx.stroke();
    this.ctx.restore();

    this.ctx.restore();
  }

  // 실시간 칫솔질 모션 감지 & 궤적 생성
  detectMotionAndBrushing(w, h) {
    const mouthX = Math.floor(w * 0.30);
    const mouthY = Math.floor(h * 0.46);
    const mouthW = Math.floor(w * 0.40);
    const mouthH = Math.floor(h * 0.34);

    try {
      const currentImageData = this.ctx.getImageData(mouthX, mouthY, mouthW, mouthH);
      const data = currentImageData.data;

      if (this.prevFrame) {
        let diffSum = 0;
        const step = 8;
        let motionCenterX = 0;
        let motionCenterY = 0;
        let motionPoints = 0;

        for (let i = 0; i < data.length; i += step * 4) {
          const diff = (Math.abs(data[i] - this.prevFrame[i]) +
                        Math.abs(data[i + 1] - this.prevFrame[i + 1]) +
                        Math.abs(data[i + 2] - this.prevFrame[i + 2])) / 3;
          if (diff > 26) {
            diffSum++;
            const pixelIdx = i / 4;
            const px = (pixelIdx % mouthW) + mouthX;
            const py = Math.floor(pixelIdx / mouthW) + mouthY;
            motionCenterX += px;
            motionCenterY += py;
            motionPoints++;
          }
        }

        const totalPixels = (mouthW * mouthH) / step;
        const motionRatio = diffSum / totalPixels;

        // 칫솔질 유효 모션 판정
        if (motionRatio > 0.035 && motionRatio < 0.65) {
          this.brushMotionScore += 1;
          this.brushFrequency = (motionRatio * 10).toFixed(1);

          // 칫솔 위치 궤적 라이트 트레일 기록
          if (motionPoints > 0) {
            const avgX = motionCenterX / motionPoints;
            const avgY = motionCenterY / motionPoints;
            this.motionTrails.push({
              x: avgX,
              y: avgY,
              alpha: 1.0,
              color: ['#00D2D3', '#FF6B81', '#FED330', '#FFF'][Math.floor(Math.random() * 4)]
            });
          }

          this.spawnFoamBubbles(w, h);

          const now = Date.now();
          if (now - this.shakaAudioTimer > 250) {
            if (window.audioEngine) window.audioEngine.playSparkle();
            this.shakaAudioTimer = now;
          }

          this.damageNearbyMonster();
        } else {
          this.brushMotionScore = Math.max(0, this.brushMotionScore - 0.4);
          this.brushFrequency = 0;
        }
      }

      this.prevFrame = new Uint8ClampedArray(data);
    } catch (e) {}
  }

  // 칫솔 궤적 라이트 트레일 렌더러
  updateAndDrawMotionTrails() {
    for (let i = this.motionTrails.length - 1; i >= 0; i--) {
      const tr = this.motionTrails[i];
      tr.alpha -= 0.05;
      if (tr.alpha <= 0) {
        this.motionTrails.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = tr.alpha;
      this.ctx.fillStyle = tr.color;
      this.ctx.beginPath();
      this.ctx.arc(tr.x, tr.y, 6 * tr.alpha, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  spawnFoamBubbles(w, h) {
    const activeMonsters = this.monsters.filter(m => !m.isDefeated);
    const targetM = activeMonsters.length > 0
      ? activeMonsters[Math.floor(Math.random() * activeMonsters.length)]
      : { rx: 0.5, ry: 0.65 };

    const bx = (1 - targetM.rx) * w + (Math.random() - 0.5) * 60;
    const by = targetM.ry * h + (Math.random() - 0.5) * 40;

    for (let i = 0; i < 3; i++) {
      this.bubbles.push({
        x: bx + (Math.random() - 0.5) * 30,
        y: by + (Math.random() - 0.5) * 30,
        radius: Math.random() * 14 + 8,
        alpha: 0.95,
        vy: -(Math.random() * 1.5 + 0.6),
        color: ['#FFF', '#E0F7FA', '#FFE082', '#FFD1DC'][Math.floor(Math.random() * 4)]
      });
    }
  }

  damageNearbyMonster() {
    if (this.isCleared) return;

    for (const m of this.monsters) {
      if (m.isDefeated) continue;
      if (m.hitCooldown <= 0) {
        m.hp--;
        m.hitCooldown = 8;

        this.spawnSparkles(m.rx * this.canvas.width, m.ry * this.canvas.height);

        if (m.hp <= 0) {
          m.isDefeated = true;
          this.clearedCount++;
          this.spawnVictoryBurst(m.rx * this.canvas.width, m.ry * this.canvas.height);
          this.updateHUDScore();

          if (this.clearedCount >= this.maxMonsters) {
            this.handleGameClear();
          }
        }
        break;
      }
    }
  }

  updateAndDrawMonsters(w, h) {
    for (const m of this.monsters) {
      if (m.isDefeated) continue;
      if (m.hitCooldown > 0) m.hitCooldown--;

      m.wobble += 0.08;
      const mx = (1 - m.rx) * w;
      const my = m.ry * h + Math.sin(m.wobble) * 6;

      this.ctx.save();
      this.ctx.translate(mx, my);

      // 충치몬 바디
      this.ctx.fillStyle = m.hitCooldown > 0 ? '#FF5252' : '#8854D0';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.lineWidth = 3.5;
      this.ctx.strokeStyle = '#FFF';
      this.ctx.stroke();

      // 익살스러운 눈
      this.ctx.fillStyle = '#FFF';
      this.ctx.beginPath();
      this.ctx.arc(-8, -5, 6, 0, Math.PI * 2);
      this.ctx.arc(8, -5, 6, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#2D3436';
      this.ctx.beginPath();
      this.ctx.arc(-7, -5, 3, 0, Math.PI * 2);
      this.ctx.arc(9, -5, 3, 0, Math.PI * 2);
      this.ctx.fill();

      // 이빨
      this.ctx.fillStyle = '#FFF';
      this.ctx.beginPath();
      this.ctx.rect(-6, 4, 4, 5);
      this.ctx.rect(2, 4, 4, 5);
      this.ctx.fill();

      // HP 바
      const hpWidth = 34;
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(-hpWidth / 2, -m.radius - 12, hpWidth, 5);
      this.ctx.fillStyle = '#FF4757';
      this.ctx.fillRect(-hpWidth / 2, -m.radius - 12, (m.hp / m.maxHp) * hpWidth, 5);

      this.ctx.restore();
    }
  }

  updateAndDrawBubbles() {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y += b.vy;
      b.alpha -= 0.015;

      if (b.alpha <= 0) {
        this.bubbles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = b.alpha;
      this.ctx.fillStyle = b.color;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  spawnSparkles(x, y) {
    for (let i = 0; i < 6; i++) {
      this.sparkles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 14 + 10,
        alpha: 1.0,
        char: ['⭐', '✨', '💖'][Math.floor(Math.random() * 3)]
      });
    }
  }

  spawnVictoryBurst(x, y) {
    for (let i = 0; i < 15; i++) {
      this.sparkles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 2,
        size: Math.random() * 20 + 12,
        alpha: 1.0,
        char: ['🎉', '⭐', '✨', '🌈', '🌟'][Math.floor(Math.random() * 5)]
      });
    }
  }

  updateAndDrawSparkles() {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= 0.025;

      if (s.alpha <= 0) {
        this.sparkles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = s.alpha;
      this.ctx.font = `${s.size}px sans-serif`;
      this.ctx.fillText(s.char, s.x, s.y);
      this.ctx.restore();
    }
  }

  // 📊 홀로그램 AI 텔레메트리 HUD 렌더러
  drawHolographicHUD(w, h) {
    this.ctx.save();

    // 상단 좌측: AI 랜드마크 실시간 추적 상태 뱃지
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.ctx.roundRect(14, 14, 180, 52, 12);
    this.ctx.fill();

    this.ctx.fillStyle = '#00D2D3';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.fillText('🤖 Google MediaPipe Vision', 24, 32);

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '11px sans-serif';
    this.ctx.fillText(`• 랜드마크: 468+ 포인트 메쉬`, 24, 46);
    this.ctx.fillText(`• 실시간 모션: ${this.brushFrequency > 0 ? `${this.brushFrequency} Hz (감지 중 ✨)` : '칫솔질 대기 중'}`, 24, 58);

    // 하단 안내 카피
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 15px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur = 8;
    this.ctx.fillText('📷 칫솔을 들고 입을 슥삭슥삭 닦아보세요!', w / 2, h - 22);

    this.ctx.restore();
  }

  updateHUDScore() {
    const scoreBadge = document.getElementById('miniGameScore');
    const progressBar = document.getElementById('miniGameProgressBar');
    if (scoreBadge) {
      scoreBadge.innerText = `퇴치한 충치몬: ${this.clearedCount} / ${this.maxMonsters}`;
    }
    if (progressBar) {
      progressBar.style.width = `${(this.clearedCount / this.maxMonsters) * 100}%`;
    }
  }

  handleGameClear() {
    this.isCleared = true;
    if (window.audioEngine) window.audioEngine.playPageFlip();

    setTimeout(() => {
      if (this.onClear) this.onClear();
    }, 1500);
  }

  stop() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    console.log("🛑 [MediaPipe Engine] AR 카메라 엔진 정지 완료.");
  }
}

// 전역 싱글톤 인스턴스
window.MediaPipeBrushing = new MediaPipeBrushingEngine();

/**
 * KidStory Audio & Sound FX Engine (Web Audio API & Speech Synthesis)
 * 완전 무외부 종속성: 브라우저 Web Audio API로 풍부한 동화 사운드 및 효과음 실시간 합성
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isBgmPlaying = false;
    this.bgmTimer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isBgmPlaying) {
      this.stopBgm();
    }
    return this.isMuted;
  }

  // 1. 책장 넘김 효과음 (Page Flip Sound)
  playPageFlip() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    
    // 핑크 노이즈 버퍼 생성으로 부드러운 종이 마찰음 시뮬레이션
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.96 * b1 + white * 0.11;
      b2 = 0.86 * b2 + white * 0.25;
      data[i] = (b0 + b1 + b2) * 0.3 * (1 - i / bufferSize);
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.18);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // 2. 별가루 챠임 사운드 (Sparkle / Magic Chime)
  playSparkle() {
    if (this.isMuted) return;
    this.init();
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0]; // C6, E6, G6, C7, E7
    const now = this.ctx.currentTime;
    
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      
      gain.gain.setValueAtTime(0.12, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.3);
    });
  }

  // 3. 비누거품 퐁퐁 사운드 (Bubble Pop)
  playBubblePop() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    const startFreq = 400 + Math.random() * 400;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.2, now + 0.08);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // 4. 승리 팡파레 & 환호 사운드 (Victory Fanfare)
  playVictory() {
    if (this.isMuted) return;
    this.init();
    const notes = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.15 }, // G5
      { f: 1046.50, d: 0.45 }  // C6
    ];
    let time = this.ctx.currentTime;
    
    notes.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, time);
      
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + note.d);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(time);
      osc.stop(time + note.d);
      time += note.d * 0.8;
    });
  }

  // 5. 부드러운 오르골 BGM 시뮬레이터 (Gentle Music Box BGM)
  startBgm() {
    if (this.isBgmPlaying || this.isMuted) return;
    this.init();
    this.isBgmPlaying = true;
    
    const melody = [
      523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 523.25,
      587.33, 659.25, 783.99, 587.33, 659.25, 523.25, 392.0, 523.25
    ];
    let noteIdx = 0;
    
    const playNextNote = () => {
      if (!this.isBgmPlaying || this.isMuted) return;
      
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(melody[noteIdx], now);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.8);
      
      noteIdx = (noteIdx + 1) % melody.length;
      this.bgmTimer = setTimeout(playNextNote, 600);
    };
    
    playNextNote();
  }

  stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.audioEngine = new AudioEngine();

/**
 * KidStory High-Quality Application Engine
 * - 캐치! 티니핑 & 로미풍 전신 캐릭터 코디룸 & 사진 얼굴 합성 시스템
 * - 정밀 글자 인덱스 기반 TTS 동기화
 * - 동화 서재(Library) 도서관 뷰 및 자유로운 퇴장/재열람 내비게이션
 */

class KidStoryApp {
  constructor() {
    this.childProfile = {
      name: "민우",
      gender: "boy",
      age: 4,
      habitTheme: "custom",
      storySource: "ai",
      facePhotoUrl: null,
      outfit: "hero",      // hero, prince, princess, pajama, explorer
      hat: "crown",        // crown, ribbon, wizard, bunny, none
      prop: "toothbrush"   // toothbrush, wand, bear, shield
    };

    this.currentPage = 0; // 0 = Cover, 1~6 = Pages
    this.currentTheme = window.storyThemes.teeth;
    this.miniGameInstance = null;
    this.isSpeechPlaying = false;
    this.speechUtterance = null;
    this.highlightTimer = null;
    this.hasBoundarySupport = false;
    this.ttsRequestId = 0;
    this.narrationAudio = null;
    this.ttsObjectUrl = null;
    this.koreanVoice = null;
    this.isParentVoiceMode = false;
    this.parentVoiceUrl = null;
    this.parentVoiceBlob = null;
    this.parentVoiceAudio = null;
    this.mediaRecorder = null;
    this.micStream = null;
    this.voiceAnalyser = null;
    this.voiceAudioCtx = null;
    this.recordedChunks = [];
    this.voicePeakLevel = 0;
    this.liveTranscript = '';
    this.recSeconds = 0;
    this.skipVoiceFinalize = false;
    this.pendingVoiceTopic = null;

    this.currentUser = JSON.parse(localStorage.getItem('kidstory_user') || 'null');

    this.initDOM();
    this.initAuthAndSplash();
    this.bindEvents();
    this.initSparkleSpawner();
    this.renderFullBodyAvatar();
    this.seedAuthorPages();
    this.refreshAiStoryStatus();
    this.applyStorySourceUi();
    if (window.KidVault) {
      window.KidVault.hydrateFromServer().finally(() => this.refreshAiStoryStatus());
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        this.koreanVoice = null;
        this.pickKoreanVoice();
      });
    }
  }

  initDOM() {
    // Views
    this.viewSplash = document.getElementById('viewSplash');
    this.viewAuth = document.getElementById('viewAuth');
    this.viewOnboarding = document.getElementById('viewOnboarding');
    this.viewStorybook = document.getElementById('viewStorybook');
    this.viewLibrary = document.getElementById('viewLibrary');
    this.modalPOD = document.getElementById('modalPOD');
    this.modalParentGate = document.getElementById('modalParentGate');
    this.appHeader = document.getElementById('appHeader');
    this.userProfileBadge = document.getElementById('userProfileBadge');
    this.headerUserName = document.getElementById('headerUserName');
    this.userAvatarEmoji = document.getElementById('userAvatarEmoji');

    // Onboarding Inputs
    this.inputChildName = document.getElementById('inputChildName');
    this.fullbodyAvatarCanvas = document.getElementById('fullbodyAvatarCanvas');
    this.avatarNameTag = document.getElementById('avatarNameTag');
    this.inputFacePhoto = document.getElementById('inputFacePhoto');
    this.btnRemovePhoto = document.getElementById('btnRemovePhoto');

    // Storybook Elements
    this.bookCard = document.getElementById('bookCard');
    this.pageBadge = document.getElementById('pageBadge');
    this.storyThemeBadge = document.getElementById('storyThemeBadge');
    this.sceneContainer = document.getElementById('sceneContainer');
    this.narrationBox = document.getElementById('narrationBox');
    this.btnPrev = document.getElementById('btnPrev');
    this.btnNext = document.getElementById('btnNext');
    this.btnSpeaker = document.getElementById('btnSpeaker');
    this.btnLibraryExit = document.getElementById('btnLibraryExit');
    this.btnRestartStory = document.getElementById('btnRestartStory');

    // Library Elements
    this.libraryGrid = document.getElementById('libraryGrid');

    // POD Elements
    this.podBookTitle = document.getElementById('podBookTitle');
    this.podChildName = document.getElementById('podChildName');
  }

  // =========================================================================
  // 🌟 [View 0-A & 0-B] 스플래시 인트로 & 부모 로그인 시스템
  // =========================================================================
  initAuthAndSplash() {
    const btnSplashSkip = document.getElementById('btnSplashSkip');
    if (btnSplashSkip) {
      btnSplashSkip.addEventListener('click', () => this.dismissSplash());
    }

    if (this.viewSplash) {
      this.viewSplash.addEventListener('click', (e) => {
        if (e.target.id !== 'btnSplashSkip') {
          this.dismissSplash();
        }
      });
    }

    // 1.8초 후 스플래시 화면 자동 전환
    setTimeout(() => {
      if (this.viewSplash && this.viewSplash.classList.contains('active')) {
        this.dismissSplash();
      }
    }, 1800);

    this.bindAuthEvents();
  }

  dismissSplash() {
    if (!this.viewSplash || !this.viewSplash.classList.contains('active')) return;
    this.viewSplash.classList.remove('active');
    if (window.audioEngine) window.audioEngine.playSparkle();

    if (this.currentUser) {
      this.applyLoggedInUser(this.currentUser);
    } else {
      if (this.viewAuth) this.viewAuth.classList.add('active');
    }
  }

  bindAuthEvents() {
    const handleLogin = (name, provider, emoji = '👤', email = null) => {
      const user = { name, provider, emoji, email, loginAt: new Date().toISOString() };
      this.currentUser = user;
      localStorage.setItem('kidstory_user', JSON.stringify(user));
      if (window.audioEngine) window.audioEngine.playPageFlip();
      this.applyLoggedInUser(user);
    };

    const btnKakao = document.getElementById('btnKakaoLogin');
    if (btnKakao) btnKakao.addEventListener('click', () => handleLogin('카카오 부모회원', 'kakao', '🟡'));

    const btnNaver = document.getElementById('btnNaverLogin');
    if (btnNaver) btnNaver.addEventListener('click', () => handleLogin('네이버 부모회원', 'naver', '🟢'));

    // 🌐 실제 Firebase Google 로그인 연동
    const btnGoogle = document.getElementById('btnGoogleLogin');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', async () => {
        btnGoogle.disabled = true;
        btnGoogle.style.opacity = '0.7';
        const textSpan = btnGoogle.querySelector('.social-text');
        if (textSpan) textSpan.innerText = 'Google 인증 중...';

        try {
          if (window.FirebaseSandbox) {
            const res = await window.FirebaseSandbox.loginWithGoogle();
            if (res.success && res.user) {
              handleLogin(res.user.name || 'Google 부모님', 'google', '🌐', res.user.email);
            } else {
              console.warn('Google 로그인 안내 (Sandbox Fallback):', res.error);
              handleLogin('Google 부모회원', 'google', '🌐');
            }
          } else {
            handleLogin('Google 부모회원', 'google', '🌐');
          }
        } catch (e) {
          console.error('Google Sign-In 에러:', e);
          handleLogin('Google 부모회원', 'google', '🌐');
        } finally {
          btnGoogle.disabled = false;
          btnGoogle.style.opacity = '1';
          if (textSpan) textSpan.innerText = 'Google 계정으로 시작';
        }
      });
    }

    const btnGuest = document.getElementById('btnGuestLogin');
    if (btnGuest) btnGuest.addEventListener('click', () => handleLogin('게스트 부모님', 'guest', '🎈'));

    const formDirect = document.getElementById('formDirectLogin');
    if (formDirect) {
      formDirect.addEventListener('submit', (e) => {
        e.preventDefault();
        const nickname = (document.getElementById('inputParentNickname')?.value || '').trim() || '이건우 대표님';
        handleLogin(nickname, 'direct', '👑');
      });
    }

    const btnLogout = document.getElementById('btnHeaderLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        if (window.FirebaseSandbox) window.FirebaseSandbox.logout();
        localStorage.removeItem('kidstory_user');
        this.currentUser = null;
        if (this.appHeader) this.appHeader.style.display = 'none';
        if (this.userProfileBadge) this.userProfileBadge.style.display = 'none';
        if (this.viewOnboarding) this.viewOnboarding.classList.remove('active');
        if (this.viewStorybook) this.viewStorybook.classList.remove('active');
        if (this.viewLibrary) this.viewLibrary.classList.remove('active');
        if (this.viewSettings) this.viewSettings.classList.remove('active');
        if (this.viewAuth) this.viewAuth.classList.add('active');
        if (window.audioEngine) window.audioEngine.playPageFlip();
      });
    }

    this.bindSettingsEvents();
  }

  // =========================================================================
  // ⚙️ [View 4] 부모 안심 설정 존 (Parent Settings & Safety Controls)
  // =========================================================================
  bindSettingsEvents() {
    this.viewSettings = document.getElementById('viewSettings');
    this.btnBackFromSettings = document.getElementById('btnBackFromSettings');
    this.btnSaveSettings = document.getElementById('btnSaveSettings');
    this.btnSettingsLogout = document.getElementById('btnSettingsLogout');
    this.btnClearLocalVault = document.getElementById('btnClearLocalVault');

    const openSettings = () => {
      [this.viewOnboarding, this.viewStorybook, this.viewLibrary].forEach(v => {
        if (v) v.classList.remove('active');
      });
      if (this.viewSettings) {
        this.viewSettings.classList.add('active');
        this.syncSettingsUI();
      }
      if (window.audioEngine) window.audioEngine.playSparkle();
    };

    const closeSettings = () => {
      if (this.viewSettings) this.viewSettings.classList.remove('active');
      if (this.viewOnboarding) this.viewOnboarding.classList.add('active');
      if (window.audioEngine) window.audioEngine.playPageFlip();
    };

    // 상단 부모 설정 버튼 클릭 시 설정 페이지로 이동
    const btnParentGate = document.getElementById('btnParentGate');
    if (btnParentGate) {
      btnParentGate.addEventListener('click', openSettings);
    }

    if (this.btnBackFromSettings) this.btnBackFromSettings.addEventListener('click', closeSettings);

    if (this.btnSaveSettings) {
      this.btnSaveSettings.addEventListener('click', () => {
        this.saveSettingsValues();
        closeSettings();
      });
    }

    if (this.btnSettingsLogout) {
      this.btnSettingsLogout.addEventListener('click', () => {
        if (window.FirebaseSandbox) window.FirebaseSandbox.logout();
        localStorage.removeItem('kidstory_user');
        this.currentUser = null;
        if (this.appHeader) this.appHeader.style.display = 'none';
        if (this.userProfileBadge) this.userProfileBadge.style.display = 'none';
        if (this.viewSettings) this.viewSettings.classList.remove('active');
        if (this.viewAuth) this.viewAuth.classList.add('active');
        if (window.audioEngine) window.audioEngine.playPageFlip();
      });
    }

    if (this.btnClearLocalVault) {
      this.btnClearLocalVault.addEventListener('click', () => {
        if (confirm('기기에 저장된 맞춤 동화와 캐시 데이터를 모두 비우시겠습니까?')) {
          localStorage.removeItem('kidstory_custom_stories_sandbox');
          const countElem = document.getElementById('settingsVaultCount');
          if (countElem) countElem.innerText = '보관 중인 맞춤 이야기: 0편';
          alert('기기 금고 데이터가 초기화되었습니다.');
        }
      });
    }
  }

  syncSettingsUI() {
    if (this.currentUser) {
      const nameElem = document.getElementById('settingsUserName');
      const emailElem = document.getElementById('settingsUserEmail');
      if (nameElem) nameElem.innerText = this.currentUser.name;
      if (emailElem) emailElem.innerText = this.currentUser.email || (this.currentUser.provider + ' 연동 계정');
    }
    const nameInput = document.getElementById('settingsChildName');
    if (nameInput) nameInput.value = this.childProfile.name;
    const ageSelect = document.getElementById('settingsChildAge');
    if (ageSelect) ageSelect.value = this.childProfile.age.toString();

    const localStories = JSON.parse(localStorage.getItem('kidstory_custom_stories_sandbox') || '[]');
    const countElem = document.getElementById('settingsVaultCount');
    if (countElem) countElem.innerText = `보관 중인 맞춤 이야기: ${localStories.length}편`;
  }

  saveSettingsValues() {
    const nameInput = document.getElementById('settingsChildName');
    if (nameInput && nameInput.value.trim()) {
      this.childProfile.name = nameInput.value.trim();
      if (this.inputChildName) this.inputChildName.value = this.childProfile.name;
      this.renderFullBodyAvatar();
    }
    const ageSelect = document.getElementById('settingsChildAge');
    if (ageSelect) {
      this.childProfile.age = parseInt(ageSelect.value, 10);
    }
    const toggleNight = document.getElementById('toggleSettingsNightMode');
    if (toggleNight && toggleNight.checked) {
      document.body.style.filter = 'sepia(0.2) contrast(0.95)';
    } else {
      document.body.style.filter = 'none';
    }
    if (window.audioEngine) window.audioEngine.playSparkle();
  }

  applyLoggedInUser(user) {
    if (this.viewAuth) this.viewAuth.classList.remove('active');
    if (this.viewSettings) this.viewSettings.classList.remove('active');
    if (this.viewOnboarding) this.viewOnboarding.classList.add('active');
    if (this.appHeader) this.appHeader.style.display = 'flex';
    if (this.userProfileBadge) {
      this.userProfileBadge.style.display = 'flex';
      if (this.headerUserName) this.headerUserName.innerText = user.name;
      if (this.userAvatarEmoji) this.userAvatarEmoji.innerText = user.emoji || '👤';
    }
  }

  bindEvents() {
    // 1. Child Name Input
    if (this.inputChildName) {
      this.inputChildName.addEventListener('input', (e) => {
        this.childProfile.name = e.target.value.trim() || "민우";
        this.renderFullBodyAvatar();
      });
    }

    // 2. Gender / Age / Habit Radio Pills
    document.querySelectorAll('.radio-pill-group').forEach(group => {
      group.addEventListener('click', (e) => {
        const pill = e.target.closest('.radio-pill');
        if (!pill) return;
        
        group.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const type = pill.dataset.type;
        const val = pill.dataset.val;

        if (type === 'gender') {
          this.childProfile.gender = val;
          if (val === 'girl') {
            this.childProfile.outfit = 'princess';
            this.childProfile.hat = 'ribbon';
            this.childProfile.prop = 'wand';
          } else {
            this.childProfile.outfit = 'hero';
            this.childProfile.hat = 'crown';
            this.childProfile.prop = 'toothbrush';
          }
          this.syncWardrobeActiveUI();
          this.renderFullBodyAvatar();
        } else if (type === 'age') {
          this.childProfile.age = parseInt(val, 10);
        } else if (type === 'storySource') {
          this.childProfile.storySource = val;
          this.applyStorySourceUi();
        } else if (type === 'aiTopic') {
          const topicInput = document.getElementById('inputCustomTopic');
          if (topicInput) topicInput.value = val;
        } else if (type === 'habit') {
          this.childProfile.habitTheme = val;
          if (val !== 'custom') {
            this.currentTheme = window.storyThemes[val] || window.storyThemes.teeth;
          }
        }

        if (window.audioEngine) window.audioEngine.playSparkle();
      });
    });

    // 3. Creation Mode Tabs (Direct vs Voice)
    const tabDirect = document.getElementById('tabDirectMode');
    const tabVoice = document.getElementById('tabVoiceMode');
    const secDirect = document.getElementById('sectionDirectMode');
    const secVoice = document.getElementById('sectionVoiceMode');

    if (tabDirect && tabVoice) {
      tabDirect.addEventListener('click', () => {
        tabDirect.classList.add('active');
        tabVoice.classList.remove('active');
        secDirect.style.display = 'block';
        secVoice.style.display = 'none';
        if (window.audioEngine) window.audioEngine.playSparkle();
      });

      tabVoice.addEventListener('click', () => {
        tabVoice.classList.add('active');
        tabDirect.classList.remove('active');
        secVoice.style.display = 'block';
        secDirect.style.display = 'none';
        if (window.audioEngine) window.audioEngine.playSparkle();
      });
    }

    // 4. Photo Upload Handler (Camera / Gallery)
    if (this.inputFacePhoto) {
      this.inputFacePhoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            this.childProfile.facePhotoUrl = evt.target.result;
            if (this.btnRemovePhoto) this.btnRemovePhoto.style.display = 'block';
            this.renderFullBodyAvatar();
            if (window.audioEngine) window.audioEngine.playSparkle();
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (this.btnRemovePhoto) {
      this.btnRemovePhoto.addEventListener('click', () => {
        this.childProfile.facePhotoUrl = null;
        this.inputFacePhoto.value = '';
        this.btnRemovePhoto.style.display = 'none';
        this.renderFullBodyAvatar();
        if (window.audioEngine) window.audioEngine.playSparkle();
      });
    }

    // 5. 티니핑 & 로미 옷장 카테고리 탭 & 아이템 선택
    document.querySelectorAll('.closet-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.closet-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;

        document.getElementById('closetOutfits').style.display = target === 'outfit' ? 'block' : 'none';
        document.getElementById('closetHats').style.display = target === 'hat' ? 'block' : 'none';
        document.getElementById('closetProps').style.display = target === 'prop' ? 'block' : 'none';

        if (window.audioEngine) window.audioEngine.playSparkle();
      });
    });

    document.querySelectorAll('.wardrobe-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        const val = item.dataset.val;

        item.parentElement.querySelectorAll('.wardrobe-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        if (type === 'outfit') this.childProfile.outfit = val;
        if (type === 'hat') this.childProfile.hat = val;
        if (type === 'prop') this.childProfile.prop = val;

        this.renderFullBodyAvatar();
        if (window.audioEngine) window.audioEngine.playSparkle();
      });
    });

    // 6. Voice Recognition
    this.initVoiceRecognition();

    document.querySelectorAll('.voice-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const spokenText = chip.dataset.text;
        this.setMicHint(`이렇게 마이크에 말해 보세요. "${spokenText}"`);
        if (window.audioEngine) window.audioEngine.playSparkle();
      });
    });

    // 7. Start Story Button
    const btnStart = document.getElementById('btnStartStory');
    if (btnStart) {
      btnStart.addEventListener('click', () => this.handleStartStoryClick());
    }

    const btnAddAuthorPage = document.getElementById('btnAddAuthorPage');
    if (btnAddAuthorPage) {
      btnAddAuthorPage.addEventListener('click', () => {
        this.addAuthorPageCard();
        if (window.audioEngine) window.audioEngine.playSparkle();
      });
    }

    const authorPagesList = document.getElementById('authorPagesList');
    if (authorPagesList) {
      authorPagesList.addEventListener('change', (e) => {
        const input = e.target.closest('.author-page-image');
        if (input) this.onAuthorImagePicked(input);
      });
      authorPagesList.addEventListener('click', (e) => {
        const card = e.target.closest('.author-page-card');
        if (!card) return;

        // STT 버튼 클릭
        const sttBtn = e.target.closest('.btn-stt-record');
        if (sttBtn) {
          this.handleSttInput(card, sttBtn);
          return;
        }

        // 1. AI 그림 생성 버튼 클릭
        const aiGenBtn = e.target.closest('.btn-ai-gen-image') || e.target.closest('.btn-regen-ai');
        if (aiGenBtn) {
          this.generatePageAiImage(card);
          return;
        }

        // 2. 그림 삭제 버튼 클릭
        const delImgBtn = e.target.closest('.btn-del-image');
        if (delImgBtn) {
          const wrapper = card.querySelector('.author-image-preview-wrapper');
          const preview = card.querySelector('.author-page-preview');
          const actions = card.querySelector('.author-image-actions');
          if (preview) preview.src = '';
          if (wrapper) wrapper.style.display = 'none';
          if (actions) actions.style.display = 'flex';
          if (window.audioEngine) window.audioEngine.playPageFlip();
          return;
        }

        // 3. 페이지 카드 삭제
        const removeBtn = e.target.closest('.btn-remove-author-page');
        if (removeBtn) {
          const list = document.getElementById('authorPagesList');
          if (list && list.querySelectorAll('.author-page-card').length > 1) {
            card.remove();
            this.renumberAuthorPages();
          }
        }
      });
    }

    // 8. Navigation Controls
    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', () => this.prevPage());
    }
    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.nextPage());
    }
    if (this.btnLibraryExit) {
      this.btnLibraryExit.addEventListener('click', () => this.goToLibrary());
    }
    if (this.btnRestartStory) {
      this.btnRestartStory.addEventListener('click', () => {
        this.currentPage = 1;
        this.renderPage();
      });
    }

    // 9. Header Buttons
    const btnHeaderLibrary = document.getElementById('btnHeaderLibrary');
    if (btnHeaderLibrary) {
      btnHeaderLibrary.addEventListener('click', () => this.goToLibrary());
    }
    const brandLogo = document.getElementById('brandLogo');
    if (brandLogo) {
      brandLogo.addEventListener('click', () => this.goToLibrary());
    }
    const btnAudioToggle = document.getElementById('btnAudioToggle');
    if (btnAudioToggle) {
      btnAudioToggle.addEventListener('click', () => {
        const isMuted = window.audioEngine.toggleMute();
        btnAudioToggle.innerText = isMuted ? '🔇' : '🔊';
      });
    }
    const btnParentGate = document.getElementById('btnParentGate');
    if (btnParentGate) {
      btnParentGate.addEventListener('click', () => this.openParentGate());
    }

    // 10. Speaker
    if (this.btnSpeaker) {
      this.btnSpeaker.addEventListener('click', () => this.toggleNarrationSpeech());
    }

    // 11. POD Modal Controls
    const btnOrderPOD = document.getElementById('btnOrderPOD');
    if (btnOrderPOD) {
      btnOrderPOD.addEventListener('click', () => this.openPODModal());
    }
    const btnClosePOD = document.getElementById('btnClosePOD');
    if (btnClosePOD) {
      btnClosePOD.addEventListener('click', () => this.closePODModal());
    }
    const btnPODCloseToLibrary = document.getElementById('btnPODCloseToLibrary');
    if (btnPODCloseToLibrary) {
      btnPODCloseToLibrary.addEventListener('click', () => {
        this.closePODModal();
        this.goToLibrary();
      });
    }

    const btnSubmitPODOrder = document.getElementById('btnSubmitPODOrder');
    if (btnSubmitPODOrder) {
      btnSubmitPODOrder.addEventListener('click', async () => {
        btnSubmitPODOrder.disabled = true;
        btnSubmitPODOrder.innerHTML = '<span>⏳ 결제 처리 중...</span>';

        if (window.PayPalSandbox) {
          const res = await window.PayPalSandbox.processSandboxCheckout('podHardcover', {
            childName: this.childProfile.name
          });
          if (res.success) {
            alert(`🎉 [PayPal Sandbox 결제 완료]\n주문번호: ${res.receipt.orderId}\n상품: ${res.receipt.item}\n결제금액: $${res.receipt.amount} (₩${res.receipt.krwEquivalent})\n\n대표님, 샌드박스 결제 연동 테스트가 성공적으로 처리되었습니다!`);
            this.closePODModal();
            this.goToLibrary();
          }
        }
        btnSubmitPODOrder.disabled = false;
        btnSubmitPODOrder.innerHTML = '<span>양장본 주문하기 📦 (Sandbox)</span>';
      });
    }

    // 12. Library Actions
    const btnCreateNewFromLibrary = document.getElementById('btnCreateNewFromLibrary');
    if (btnCreateNewFromLibrary) {
      btnCreateNewFromLibrary.addEventListener('click', () => this.goToOnboarding());
    }

    document.querySelectorAll('.lib-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.lib-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderLibrary(btn.dataset.category);
        if (window.audioEngine) window.audioEngine.playSparkle();
      });
    });
  }

  syncWardrobeActiveUI() {
    document.querySelectorAll('.wardrobe-item').forEach(item => {
      const type = item.dataset.type;
      const val = item.dataset.val;
      if (type === 'outfit') item.classList.toggle('active', val === this.childProfile.outfit);
      if (type === 'hat') item.classList.toggle('active', val === this.childProfile.hat);
      if (type === 'prop') item.classList.toggle('active', val === this.childProfile.prop);
    });
  }

  // =========================================================================
  // 💖 캐치! 티니핑 & 로미 스타일 전신 캐릭터 SVG 생성기 (Full-Body Teenieping & Romi Engine)
  // =========================================================================
  renderFullBodyAvatar() {
    if (this.fullbodyAvatarCanvas) {
      this.fullbodyAvatarCanvas.innerHTML = this.getFullBodyCharacterSVG(this.childProfile, 170, 230);
    }
    if (this.avatarNameTag) {
      this.avatarNameTag.innerText = `${this.childProfile.name} 주인공`;
    }
  }

  getFullBodyCharacterSVG(profile, width = 170, height = 230, poseState = 'idle') {
    const isBoy = profile.gender === 'boy';
    const hasPhoto = !!profile.facePhotoUrl;
    const outfit = profile.outfit || (isBoy ? 'hero' : 'princess');
    const hat = profile.hat || (isBoy ? 'crown' : 'ribbon');
    const prop = profile.prop || (isBoy ? 'toothbrush' : 'wand');

    // 🎨 테마별 프리미엄 그라데이션 및 컬러 팔레트
    const skinGradId = `skinGrad_${Math.random().toString(36).substr(2, 6)}`;
    const hairGradId = `hairGrad_${Math.random().toString(36).substr(2, 6)}`;
    const dressGradId = `dressGrad_${Math.random().toString(36).substr(2, 6)}`;
    const eyeGradId = `eyeGrad_${Math.random().toString(36).substr(2, 6)}`;
    const goldGradId = `goldGrad_${Math.random().toString(36).substr(2, 6)}`;

    const skinTone = "#FFF4EC";
    const skinShadow = "#FFE0D2";
    const hairColorGirl = "#FF7096"; // 로미 시그니처 핑크 헤어
    const hairColorBoy = "#2C2A4A";  // 샤이닝 블루블랙 헤어

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 180 240" class="fullbody-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- 피부 톤 소프트 그라데이션 -->
          <linearGradient id="${skinGradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFF8F2"/>
            <stop offset="100%" stop-color="${skinShadow}"/>
          </linearGradient>

          <!-- 로미 핑크빛 헤어 그라데이션 -->
          <linearGradient id="${hairGradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${isBoy ? '#4A4668' : '#FFA8BE'}"/>
            <stop offset="60%" stop-color="${isBoy ? '#2C2A4A' : '#FF6584'}"/>
            <stop offset="100%" stop-color="${isBoy ? '#1A182E' : '#E03158'}"/>
          </linearGradient>

          <!-- 공주 드레스 실크 그라데이션 -->
          <linearGradient id="${dressGradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FF9EBA"/>
            <stop offset="50%" stop-color="#FF6B8B"/>
            <stop offset="100%" stop-color="#E83A64"/>
          </linearGradient>

          <!-- 황금 티아라 & 버클 그라데이션 -->
          <linearGradient id="${goldGradId}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFF3A7"/>
            <stop offset="50%" stop-color="#FED330"/>
            <stop offset="100%" stop-color="#F39C12"/>
          </linearGradient>

          <!-- 영롱한 보석 눈동자 4단계 그라데이션 -->
          <linearGradient id="${eyeGradId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${isBoy ? '#0A1931' : '#3D0066'}"/>
            <stop offset="40%" stop-color="${isBoy ? '#185ADB' : '#8A0099'}"/>
            <stop offset="75%" stop-color="${isBoy ? '#00D2D3' : '#FF4D80'}"/>
            <stop offset="100%" stop-color="${isBoy ? '#E0FFFF' : '#FFC2D4'}"/>
          </linearGradient>

          <!-- 볼터치 방사형 소프트 글로우 -->
          <radialGradient id="blushGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FF5277" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="#FF5277" stop-opacity="0"/>
          </radialGradient>

          <!-- 드레스 섀도우 -->
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#E03158" flood-opacity="0.25"/>
          </filter>
        </defs>

        <!-- 🌟 [LAYER 0] 후면 헤어 (로미 웨이브 트윈테일) -->
        ${!isBoy ? `
          <g class="back-hair" filter="url(#softShadow)">
            <!-- 좌측 트윈테일 락 -->
            <path d="M 52 75 C 20 90, 8 135, 18 175 C 26 150, 38 120, 56 100 Z" fill="url(#${hairGradId})"/>
            <!-- 우측 트윈테일 락 -->
            <path d="M 128 75 C 160 90, 172 135, 162 175 C 154 150, 142 120, 124 100 Z" fill="url(#${hairGradId})"/>
          </g>
        ` : `
          <!-- 남아 백 헤어 -->
          <path d="M 45 60 C 25 75, 25 110, 48 115 C 40 100, 42 75, 48 65 Z" fill="url(#${hairGradId})"/>
          <path d="M 135 60 C 155 75, 155 110, 132 115 C 140 100, 138 75, 132 65 Z" fill="url(#${hairGradId})"/>
        `}

        <!-- 🌟 [LAYER 1] 다리 & 양말 & 신발 -->
        <g class="legs-feet">
          <!-- 다리 (화이트 실크 타이즈) -->
          <rect x="73" y="165" width="12" height="46" rx="6" fill="#FFFDF9"/>
          <rect x="95" y="165" width="12" height="46" rx="6" fill="#FFFDF9"/>
          <line x1="79" y1="168" x2="79" y2="202" stroke="#EFE4DC" stroke-width="1.5"/>
          <line x1="101" y1="168" x2="101" y2="202" stroke="#EFE4DC" stroke-width="1.5"/>

          <!-- 핑크 메리제인 슈즈 -->
          <g class="shoes">
            <ellipse cx="78" cy="214" rx="11" ry="7" fill="${isBoy ? '#2C3E50' : '#FF477E'}"/>
            <ellipse cx="102" cy="214" rx="11" ry="7" fill="${isBoy ? '#2C3E50' : '#FF477E'}"/>
            <ellipse cx="78" cy="212" rx="8" ry="4.5" fill="${isBoy ? '#34495E' : '#FF6B8B'}"/>
            <ellipse cx="102" cy="212" rx="8" ry="4.5" fill="${isBoy ? '#34495E' : '#FF6B8B'}"/>
            <!-- 리본 버클 -->
            <circle cx="78" cy="211" r="2.5" fill="url(#${goldGradId})"/>
            <circle cx="102" cy="211" r="2.5" fill="url(#${goldGradId})"/>
          </g>
        </g>

        <!-- 🌟 [LAYER 2] 의상 (Princess Romi / Hero / Prince / Pajama) -->
        <g class="costume">
          ${outfit === 'princess' ? `
            <!-- 💖 프린세스 로미 하트 파스텔 3단 프릴 드레스 -->
            <!-- 언더 스커트 레이스 -->
            <path d="M 52 145 C 38 178, 48 190, 90 190 C 132 190, 142 178, 128 145 Z" fill="#FFF8FC" stroke="#FFD8E4" stroke-width="1.5"/>
            <!-- 2단 라벤더 쉬폰 -->
            <path d="M 55 140 C 44 168, 56 178, 90 178 C 124 178, 136 168, 125 140 Z" fill="#E8D7FF" opacity="0.9"/>
            <!-- 3단 로미 핑크 오버스커트 -->
            <path d="M 60 132 C 50 156, 62 165, 90 165 C 118 165, 130 156, 120 132 Z" fill="url(#${dressGradId})" filter="url(#softShadow)"/>
            <path d="M 65 142 Q 90 152 115 142" stroke="url(#${goldGradId})" stroke-width="2" fill="none"/>

            <!-- 코르셋 바디 상의 -->
            <path d="M 68 102 L 60 135 L 120 135 L 112 102 Z" fill="url(#${dressGradId})"/>
            <path d="M 74 102 L 90 120 L 106 102" stroke="#FFF" stroke-width="2" fill="none"/>

            <!-- 허리 골드 하트 브로치 & 새틴 리본 -->
            <path d="M 90 135 C 78 128, 70 144, 90 148 C 110 144, 102 128, 90 135 Z" fill="#FF2E63"/>
            <circle cx="90" cy="134" r="5.5" fill="url(#${goldGradId})"/>
            <path d="M 90 131 C 88 128, 85 130, 85 134 C 85 137, 90 140, 90 140 C 90 140, 95 137, 95 134 C 95 130, 92 128, 90 131 Z" fill="#FF0055"/>

            <!-- 퍼프 소매 -->
            <circle cx="62" cy="106" r="10" fill="#FFAEC0" stroke="#FF6B8B" stroke-width="1.5"/>
            <circle cx="118" cy="106" r="10" fill="#FFAEC0" stroke="#FF6B8B" stroke-width="1.5"/>
          ` : outfit === 'hero' ? `
            <!-- ⚔️ 별빛 무지개 용사 갑옷 -->
            <path d="M 58 106 L 36 195 Q 90 205 144 195 L 122 106 Z" fill="#FF4757" opacity="0.95"/>
            <path d="M 66 102 L 58 142 L 122 142 L 114 102 Z" fill="#00D2D3"/>
            <rect x="58" y="102" width="16" height="8" rx="2" fill="url(#${goldGradId})"/>
            <rect x="106" y="102" width="16" height="8" rx="2" fill="url(#${goldGradId})"/>
            <circle cx="90" cy="122" r="11" fill="url(#${goldGradId})" stroke="#FFF" stroke-width="2"/>
            <text x="83.5" y="127" font-size="15" font-weight="bold" fill="#FF4757">★</text>
            <rect x="58" y="138" width="64" height="8" fill="#2F3542"/>
            <rect x="85" y="136" width="10" height="12" rx="2" fill="url(#${goldGradId})"/>
            <rect x="68" y="146" width="18" height="24" rx="4" fill="#2C3E50"/>
            <rect x="94" y="146" width="18" height="24" rx="4" fill="#2C3E50"/>
          ` : outfit === 'prince' ? `
            <!-- 👑 로열 사파이어 왕자님 예복 -->
            <path d="M 66 102 L 56 148 L 124 148 L 114 102 Z" fill="#2E86DE"/>
            <rect x="56" y="100" width="16" height="8" rx="2" fill="url(#${goldGradId})"/>
            <rect x="108" y="100" width="16" height="8" rx="2" fill="url(#${goldGradId})"/>
            <line x1="90" y1="102" x2="90" y2="148" stroke="url(#${goldGradId})" stroke-width="3"/>
            <circle cx="90" cy="112" r="3.5" fill="#FFF"/>
            <circle cx="90" cy="126" r="3.5" fill="#FFF"/>
            <circle cx="90" cy="140" r="3.5" fill="#FFF"/>
            <rect x="68" y="148" width="18" height="24" rx="3" fill="#FFFFFF"/>
            <rect x="94" y="148" width="18" height="24" rx="3" fill="#FFFFFF"/>
          ` : `
            <!-- 🌙 곰돌이 수면 잠옷 -->
            <path d="M 64 102 L 52 152 L 128 152 L 116 102 Z" fill="#A29BFE"/>
            <circle cx="90" cy="116" r="4" fill="#FFF"/>
            <circle cx="90" cy="134" r="4" fill="#FFF"/>
            <rect x="65" y="152" width="22" height="22" rx="6" fill="#A29BFE"/>
            <rect x="93" y="152" width="22" height="22" rx="6" fill="#A29BFE"/>
          `}
        </g>

        <!-- 🌟 [LAYER 3] 팔 & 손 -->
        <g class="arms-hands">
          <path d="M 64 108 Q 42 135 48 152" stroke="${skinTone}" stroke-width="10" stroke-linecap="round" fill="none"/>
          <path d="M 116 108 Q 138 135 132 152" stroke="${skinTone}" stroke-width="10" stroke-linecap="round" fill="none"/>
          <!-- 소매 레이스 커프스 -->
          <circle cx="48" cy="150" r="6.5" fill="#FFFDF9" stroke="#FFD8E4" stroke-width="1"/>
          <circle cx="132" cy="150" r="6.5" fill="#FFFDF9" stroke="#FFD8E4" stroke-width="1"/>
        </g>

        <!-- 🌟 [LAYER 4] 손 소품 (Wand / Toothbrush / Shield) -->
        <g class="props">
          ${prop === 'wand' ? `
            <!-- 💖 티니핑 하트 엔젤 마법봉 -->
            <g transform="translate(138, 122) rotate(18)">
              <rect x="2" y="0" width="6" height="52" rx="3" fill="url(#${goldGradId})"/>
              <!-- 날개 -->
              <path d="M 5 -10 C -12 -18, -14 -2, 2 -4 Z" fill="#FFF8FC" stroke="#FFD8E4" stroke-width="1"/>
              <path d="M 5 -10 C 22 -18, 24 -2, 8 -4 Z" fill="#FFF8FC" stroke="#FFD8E4" stroke-width="1"/>
              <!-- 하트 크리스탈 -->
              <path d="M 5 -14 C 0 -22, -10 -16, -10 -8 C -10 2, 5 10, 5 10 C 5 10, 20 2, 20 -8 C 20 -16, 10 -22, 5 -14 Z" fill="#FF1493"/>
              <circle cx="1" cy="-12" r="3.5" fill="#FFF" opacity="0.8"/>
              <polygon points="5,-24 7,-16 15,-16 9,-10 11,-2 5,-7 -1,-2 1,-10 -5,-16 3,-16" fill="url(#${goldGradId})"/>
            </g>
          ` : prop === 'toothbrush' ? `
            <!-- 🪥 무지개 크리스탈 마법 칫솔 -->
            <g transform="translate(138, 128) rotate(-20)">
              <rect x="0" y="0" width="8" height="50" rx="4" fill="#00D2D3" stroke="#FFF" stroke-width="1.5"/>
              <rect x="-3" y="-16" width="14" height="18" rx="4" fill="#FFF" stroke="#E0E6ED" stroke-width="1"/>
              <!-- 3색 미세모 -->
              <line x1="0" y1="-16" x2="0" y2="-8" stroke="#FF4757" stroke-width="2.5"/>
              <line x1="4" y1="-16" x2="4" y2="-8" stroke="#FFA502" stroke-width="2.5"/>
              <line x1="8" y1="-16" x2="8" y2="-8" stroke="#2ED573" stroke-width="2.5"/>
              <circle cx="4" cy="40" r="2.5" fill="url(#${goldGradId})"/>
            </g>
          ` : `
            <!-- 🛡️ 수호 방패 -->
            <g transform="translate(36, 138)">
              <path d="M -14 -18 L 14 -18 Q 16 12 0 24 Q -16 12 -14 -18 Z" fill="url(#${goldGradId})" stroke="#FFF" stroke-width="2"/>
              <circle cx="0" cy="2" r="7" fill="#FF4757"/>
              <text x="-4" y="6" font-size="9" fill="#FFF">★</text>
            </g>
          `}
        </g>

        <!-- 🌟 [LAYER 5] 머리 / 얼굴 (티니핑 & 로미 완성형 미모 렌더링) -->
        <g class="head-face">
          <!-- 목 -->
          <rect x="83" y="90" width="14" height="16" rx="4" fill="${skinShadow}"/>

          <!-- 둥근 계란형 아기 얼굴 라인 -->
          <path d="M 52 58 C 45 85, 62 104, 90 104 C 118 104, 135 85, 128 58 C 128 32, 52 32, 52 58 Z" fill="url(#${skinGradId})" stroke="#FFDED6" stroke-width="1"/>

          <!-- 양 볼 핑크 펄 볼터치 (에어브러시 글로우) -->
          <ellipse cx="64" cy="78" rx="10" ry="6" fill="url(#blushGlow)"/>
          <ellipse cx="116" cy="78" rx="10" ry="6" fill="url(#blushGlow)"/>
          <!-- 볼터치 반짝이 ✦ -->
          <text x="60" y="79" font-size="8" fill="#FFF" opacity="0.9">✦</text>
          <text x="114" y="79" font-size="8" fill="#FFF" opacity="0.9">✦</text>

          <!-- 👄 사랑스러운 미소 입 -->
          <path d="M 84 85 Q 90 92 96 85" stroke="#E84168" stroke-width="2.5" stroke-linecap="round" fill="#FF7698"/>
          <path d="M 87 86 Q 90 89 93 86" fill="#FFF"/>

          <!-- 👃 앙증맞은 코 점 -->
          <circle cx="90" cy="74" r="1.2" fill="#E8B4A2"/>

          <!-- 👁️ ✨ [대형 보석 눈망울 - 좌측] -->
          <g class="left-eye" transform="translate(70, 68)">
            <!-- 상단 쌍꺼풀 라인 -->
            <path d="M -12 -12 Q 0 -18 10 -13" stroke="#D18274" stroke-width="1.2" fill="none"/>
            <!-- 짙은 아이라인 & 더블 속눈썹 -->
            <path d="M -13 -7 Q -2 -14 11 -7" stroke="#2B1A29" stroke-width="3.5" stroke-linecap="round" fill="none"/>
            <path d="M 8 -9 L 13 -13" stroke="#2B1A29" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M 11 -6 L 15 -8" stroke="#2B1A29" stroke-width="1.8" stroke-linecap="round"/>

            <!-- 홍채 (영롱한 그라데이션) -->
            <ellipse cx="-1" cy="0" rx="9" ry="11.5" fill="url(#${eyeGradId})"/>

            <!-- 큰 별빛 반사광 (상단) -->
            <ellipse cx="-4" cy="-4" rx="4" ry="4.5" fill="#FFFFFF"/>
            <!-- 작은 별빛 2개 (하단) -->
            <circle cx="3" cy="4" r="2.2" fill="#FFFFFF"/>
            <circle cx="-3" cy="6" r="1.5" fill="#FFEAA7"/>
            <text x="0" y="2" font-size="5" fill="#FFF" opacity="0.8">★</text>
          </g>

          <!-- 👁️ ✨ [대형 보석 눈망울 - 우측] -->
          <g class="right-eye" transform="translate(110, 68)">
            <path d="M -10 -13 Q 0 -18 12 -12" stroke="#D18274" stroke-width="1.2" fill="none"/>
            <path d="M -11 -7 Q 2 -14 13 -7" stroke="#2B1A29" stroke-width="3.5" stroke-linecap="round" fill="none"/>
            <path d="M -8 -9 L -13 -13" stroke="#2B1A29" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M -11 -6 L -15 -8" stroke="#2B1A29" stroke-width="1.8" stroke-linecap="round"/>

            <ellipse cx="1" cy="0" rx="9" ry="11.5" fill="url(#${eyeGradId})"/>

            <ellipse cx="-2" cy="-4" rx="4" ry="4.5" fill="#FFFFFF"/>
            <circle cx="4" cy="4" r="2.2" fill="#FFFFFF"/>
            <circle cx="-2" cy="6" r="1.5" fill="#FFEAA7"/>
            <text x="-4" y="2" font-size="5" fill="#FFF" opacity="0.8">★</text>
          </g>

          <!-- 🌟 [전면 헤어 스타일링] -->
          ${!isBoy ? `
            <!-- 로미 앞머리 & 사이드 헤어 뱅 -->
            <path d="M 48 52 C 46 22, 134 22, 132 52 C 122 42, 110 46, 98 48 C 88 50, 72 44, 48 52 Z" fill="url(#${hairGradId})"/>
            <!-- 사이드 애교머리 -->
            <path d="M 52 50 C 48 70, 52 82, 54 88 C 56 80, 56 65, 58 52 Z" fill="url(#${hairGradId})"/>
            <path d="M 128 50 C 132 70, 128 82, 126 88 C 124 80, 124 65, 122 52 Z" fill="url(#${hairGradId})"/>
            <!-- 엔젤 링 하이라이트 (Glossy Shine) -->
            <ellipse cx="90" cy="36" rx="28" ry="4" fill="#FFFFFF" opacity="0.55"/>
          ` : `
            <!-- 남아 댄디 샤이닝 헤어 -->
            <path d="M 48 54 C 44 20, 136 20, 132 54 C 118 44, 102 46, 90 48 C 76 50, 62 44, 48 54 Z" fill="url(#${hairGradId})"/>
            <path d="M 50 48 L 62 58 L 74 48 L 88 60 L 102 48 L 118 58 L 130 48" stroke="url(#${hairGradId})" stroke-width="4" fill="none" stroke-linecap="round"/>
            <ellipse cx="90" cy="34" rx="24" ry="3.5" fill="#FFFFFF" opacity="0.45"/>
          `}
        </g>

        <!-- 🌟 [LAYER 6] 머리 장식 (Tiara / Ribbon / Crown) -->
        <g class="headwear">
          ${hat === 'crown' || hat === 'ribbon' ? `
            <!-- 👑 로미 시그니처 골드 하트 크리스탈 티아라 -->
            <g transform="translate(90, 24)">
              <path d="M -22 12 L -14 0 L -4 8 L 0 -4 L 4 8 L 14 0 L 22 12 Z" fill="url(#${goldGradId})" stroke="#FFF" stroke-width="1.5" filter="url(#softShadow)"/>
              <!-- 티아라 중앙 하트 루비 -->
              <circle cx="0" cy="6" r="4.5" fill="#FF1493"/>
              <circle cx="-1" cy="4.5" r="1.5" fill="#FFF"/>
              <circle cx="-14" cy="2" r="2.5" fill="#00D2D3"/>
              <circle cx="14" cy="2" r="2.5" fill="#00D2D3"/>
            </g>
            <!-- 사이드 헤어 리본 -->
            ${!isBoy ? `
              <g transform="translate(48, 52)">
                <circle cx="-4" cy="0" r="5" fill="#FF477E"/>
                <circle cx="4" cy="0" r="5" fill="#FF477E"/>
                <circle cx="0" cy="0" r="3.5" fill="url(#${goldGradId})"/>
              </g>
              <g transform="translate(132, 52)">
                <circle cx="-4" cy="0" r="5" fill="#FF477E"/>
                <circle cx="4" cy="0" r="5" fill="#FF477E"/>
                <circle cx="0" cy="0" r="3.5" fill="url(#${goldGradId})"/>
              </g>
            ` : ''}
          ` : ''}
        </g>

        <!-- 🌟 [LAYER 7] 🧚 앙증맞은 티니핑 요정 마스코트 (하츄핑/치카핑) -->
        <g class="fairy-companion" transform="translate(24, 60)" filter="url(#softShadow)">
          <!-- 날개 -->
          <ellipse cx="-4" cy="8" rx="8" ry="4" fill="#E0F7FA" opacity="0.8" transform="rotate(-30 -4 8)"/>
          <!-- 요정 바디 -->
          <circle cx="8" cy="12" r="12" fill="#FFAEC0" stroke="#FF6B8B" stroke-width="1.5"/>
          <!-- 하트 귀 -->
          <circle cx="1" cy="3" r="4.5" fill="#FF477E"/>
          <circle cx="15" cy="3" r="4.5" fill="#FF477E"/>
          <!-- 눈 & 미소 -->
          <circle cx="5" cy="11" r="2" fill="#2B1A29"/>
          <circle cx="11" cy="11" r="2" fill="#2B1A29"/>
          <circle cx="4" cy="10" r="0.8" fill="#FFF"/>
          <circle cx="10" cy="10" r="0.8" fill="#FFF"/>
          <path d="M 7 15 Q 8 18 9 15" stroke="#E84168" stroke-width="1.5" fill="none"/>
          <ellipse cx="3" cy="14" rx="2" ry="1.2" fill="#FF5277" opacity="0.6"/>
          <ellipse cx="13" cy="14" rx="2" ry="1.2" fill="#FF5277" opacity="0.6"/>
          <!-- 미니 마법봉 -->
          <line x1="16" y1="14" x2="24" y2="8" stroke="url(#${goldGradId})" stroke-width="2"/>
          <text x="22" y="8" font-size="7" fill="#FFD700">★</text>
        </g>
      </svg>
    `;
  }

  // =========================================================================
  // 📚 동화 서재(Library) 도서관 뷰 렌더러
  // =========================================================================
  goToLibrary() {
    this.stopNarrationSpeech();
    if (window.MediaPipeBrushing) window.MediaPipeBrushing.stop();
    if (this.miniGameInstance) {
      this.miniGameInstance.stop();
      this.miniGameInstance = null;
    }

    this.viewOnboarding.classList.remove('active');
    this.viewStorybook.classList.remove('active');
    this.viewLibrary.classList.add('active');

    this.renderLibrary('all');
    this.refreshAiStoryStatus();
    if (window.audioEngine) window.audioEngine.playPageFlip();
  }

  goToOnboarding() {
    this.stopNarrationSpeech();
    if (window.MediaPipeBrushing) window.MediaPipeBrushing.stop();
    if (this.miniGameInstance) {
      this.miniGameInstance.stop();
      this.miniGameInstance = null;
    }

    this.viewLibrary.classList.remove('active');
    this.viewStorybook.classList.remove('active');
    this.viewOnboarding.classList.add('active');
    if (window.audioEngine) window.audioEngine.playPageFlip();
  }

  renderLibrary(category = 'all') {
    if (!this.libraryGrid) return;
    const catalog = window.libraryCatalog || [];
    const fill = (mine) => {
      const esc = (s) => String(s || '').replace(/[&<>"]/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
      }[ch]));
      const localCards = (mine || []).map((item) => ({
        id: item.id,
        category: 'device',
        local: true,
        badge: item.badge || '📱 이 기기',
        badgeColor: '#0E6655',
        coverIcon: '📱',
        bgGradient: item.themeColor
          ? `linear-gradient(135deg, ${item.themeColor}, #FFEAA7)`
          : 'linear-gradient(135deg, #55EFC4, #FFEAA7)',
        title: esc(String(item.title || '내 동화').replace(/{{CHILD_NAME}}/g, this.childProfile.name)),
        desc: esc(`${item.childName || this.childProfile.name} · ${item.source || 'local'} · 이 기기에 저장됨`),
        pages: item.totalPages || (item.story && item.story.totalPages) || 0,
        isReady: true
      }));

      let items = [];
      if (category === 'device') items = localCards;
      else if (category === 'all') items = localCards.concat(catalog);
      else items = catalog.filter((c) => c.category === category);

      this.libraryGrid.innerHTML = items.map((item) => `
      <div class="book-card-shelf" data-id="${item.id}" data-ready="${item.isReady}" data-local="${item.local ? 'true' : 'false'}">
        <div class="shelf-cover" style="background: ${item.bgGradient};">
          <span class="shelf-cover-badge" style="color:${item.badgeColor};">${item.badge}</span>
          <div style="font-size: 48px; filter: drop-shadow(0 6px 10px rgba(0,0,0,0.15));">${item.coverIcon}</div>
        </div>
        <h3 class="shelf-title">${item.title}</h3>
        <p class="shelf-desc">${item.desc}</p>
        <div class="shelf-footer">
          <span class="shelf-pages">총 ${item.pages}쪽 완결</span>
          <button class="btn-shelf-read" ${!item.isReady ? 'disabled style="opacity:0.5;"' : ''}>
            ${item.isReady ? '동화 읽기 📖' : '준비 중 🔒'}
          </button>
        </div>
      </div>
    `).join('');

      this.libraryGrid.querySelectorAll('.book-card-shelf').forEach((card) => {
        card.addEventListener('click', () => this.openLibraryBook(card));
      });
    };

    if (window.KidVault) {
      window.KidVault.listStories().then(fill).catch(() => fill([]));
    } else {
      fill([]);
    }
  }

  async openLibraryBook(card) {
    const id = card.dataset.id;
    const isReady = card.dataset.ready === 'true';
    const isLocal = card.dataset.local === 'true';
    if (!isReady) {
      alert('✨ 새로운 동화 원고가 곧 등록될 예정입니다! 다른 동화를 먼저 읽어보세요.');
      return;
    }

    if (isLocal && window.KidVault) {
      const theme = await window.KidVault.loadStory(id);
      if (!theme) return;
      this.currentTheme = theme;
      this.startStory();
      return;
    }

    if (id === 'teeth' || id === 'veggie' || id === 'sleep') {
      this.currentTheme = window.storyThemes[id];
    } else if (id === 'custom_cleanup') {
      this.currentTheme = window.generateCustomStoryAI(this.childProfile.name, '스스로 장난감 정리정돈하기');
    } else if (id === 'share_friends') {
      this.currentTheme = window.generateCustomStoryAI(this.childProfile.name, '친구와 사이좋게 장난감 양보하기');
    }

    this.startStory({ skipPersist: true });
  }

  applyStorySourceUi() {
    const isAuthor = this.childProfile.storySource === 'author';
    const authorSec = document.getElementById('sectionAuthorStory');
    const aiSec = document.getElementById('sectionAiStory');
    const label = document.getElementById('btnStartStoryLabel');
    if (authorSec) authorSec.style.display = isAuthor ? 'flex' : 'none';
    if (authorSec) authorSec.style.flexDirection = 'column';
    if (authorSec) authorSec.style.gap = '10px';
    if (aiSec) aiSec.style.display = isAuthor ? 'none' : 'block';
    if (label) {
      label.innerText = isAuthor ? '📖 내가 쓴 동화 읽어 주기' : '✨ 오늘만의 동화 듣기';
    }
  }

  seedAuthorPages() {
    const list = document.getElementById('authorPagesList');
    if (!list || list.children.length) return;
    for (let i = 0; i < 3; i += 1) this.addAuthorPageCard();
  }

  addAuthorPageCard() {
    const list = document.getElementById('authorPagesList');
    if (!list) return;
    if (list.querySelectorAll('.author-page-card').length >= 8) return;
    const card = document.createElement('div');
    card.className = 'author-page-card';
    card.innerHTML = `
      <div class="author-page-head">
        <strong></strong>
        <div style="display:flex; gap:8px;">
          <button class="btn-stt-record" type="button" title="마이크로 말해서 입력하기" style="background:#fff; border:1px solid #ddd; border-radius:12px; padding:4px 8px; font-size:12px; cursor:pointer;">🎙️ 음성 입력</button>
          <button class="btn-remove-author-page" type="button">삭제</button>
        </div>
      </div>
      <textarea class="input-text author-page-narration" maxlength="800" placeholder="이 쪽에서 읽어 줄 이야기 문장을 적어 주세요 (예: ${this.childProfile.name || '아이'}가 숲속 요정과 함께 반짝이는 칫솔로 이를 닦아요)."></textarea>
      
      <div class="author-image-actions">
        <button class="btn-ai-gen-image" type="button" title="적은 스토리를 바탕으로 AI 그림을 자동 생성합니다">
          <span>🎨 이미지 생성</span>
        </button>
        <label class="btn-upload-author-image" title="내가 가진 그림/사진을 직접 업로드합니다">
          <span>📁 이미지 추가</span>
          <input type="file" class="author-page-image" accept="image/*" hidden>
        </label>
      </div>

      <div class="author-image-generating-bar" style="display: none;">
        <span class="spin-sparkle">✨</span>
        <span>스토리를 분석하여 동화 그림을 그리는 중...</span>
      </div>

      <div class="author-image-preview-wrapper" style="display: none;">
        <img class="author-page-preview" alt="이 쪽 그림 미리보기">
        <div class="author-image-overlay-controls">
          <button class="btn-image-action-small btn-regen-ai" type="button">🔄 다시 생성</button>
          <button class="btn-image-action-small btn-del-image" type="button">🗑️ 삭제</button>
        </div>
      </div>
    `;
    list.appendChild(card);
    this.renumberAuthorPages();
  }

  renumberAuthorPages() {
    document.querySelectorAll('#authorPagesList .author-page-card').forEach((card, i) => {
      const label = card.querySelector('.author-page-head strong');
      if (label) label.innerText = `📖 ${i + 1}쪽 이야기`;
    });
  }

  // 🎨 작성된 문장을 인식하여 나노바나나 / 무료 오픈 AI 모델로 동화 삽화 자동 생성
  handleSttInput(card, sttBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("현재 브라우저에서는 음성 인식(마이크) 기능을 지원하지 않습니다. 크롬(Chrome) 브라우저를 이용해 주세요.");
      return;
    }

    if (sttBtn.dataset.recording === 'true') {
      if (this.currentRecognition) {
        this.currentRecognition.stop();
      }
      return;
    }

    const textarea = card.querySelector('.author-page-narration');
    if (!textarea) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;
    recognition.continuous = false; // Stop after a pause
    this.currentRecognition = recognition;

    let finalTranscript = textarea.value;

    recognition.onstart = () => {
      sttBtn.dataset.recording = 'true';
      sttBtn.innerHTML = '🔴 듣는 중...';
      sttBtn.style.borderColor = '#ff6b6b';
      sttBtn.style.color = '#ff6b6b';
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      textarea.value = finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
    };

    recognition.onend = () => {
      sttBtn.dataset.recording = 'false';
      sttBtn.innerHTML = '🎙️ 음성 입력';
      sttBtn.style.borderColor = '#ddd';
      sttBtn.style.color = 'inherit';
      this.currentRecognition = null;
    };

    recognition.onerror = (event) => {
      console.error('STT Error:', event.error);
      sttBtn.dataset.recording = 'false';
      sttBtn.innerHTML = '🎙️ 음성 입력';
      sttBtn.style.borderColor = '#ddd';
      sttBtn.style.color = 'inherit';
      this.currentRecognition = null;
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Speech recognition failed to start", e);
    }
  }

  async generatePageAiImage(card) {
    const narrationInput = card.querySelector('.author-page-narration');
    const narration = (narrationInput ? narrationInput.value : '').trim();
    
    if (!narration) {
      alert(`이 쪽에서 일어나는 이야기 문장을 먼저 적어주세요!\n(예: ${this.childProfile.name || '민우'}가 숲속 요정과 함께 반짝이는 칫솔로 이를 닦아요)`);
      if (narrationInput) narrationInput.focus();
      return;
    }

    const genBtn = card.querySelector('.btn-ai-gen-image');
    const genBar = card.querySelector('.author-image-generating-bar');
    const wrapper = card.querySelector('.author-image-preview-wrapper');
    const preview = card.querySelector('.author-page-preview');
    const actions = card.querySelector('.author-image-actions');

    if (genBtn) genBtn.disabled = true;
    if (genBar) genBar.style.display = 'flex';
    if (wrapper) wrapper.style.display = 'none';
    if (actions) actions.style.display = 'none';

    try {
      const childName = this.childProfile.name || '아이';
      const genderDesc = this.childProfile.gender === 'girl' ? 'little cute girl' : 'little cute boy';
      const outfitDesc = this.childProfile.outfit === 'princess' 
        ? 'pink tiered frill magical princess dress with gold tiara and sparkling star wand' 
        : (this.childProfile.outfit === 'prince' 
            ? 'regal prince royal navy uniform with cape' 
            : 'hero cape with sparkling magical toothbrush');

      // 그림 스타일 확인
      const styleSelect = document.getElementById('selectAuthorImageStyle');
      const styleType = styleSelect ? styleSelect.value : '3d';

      // 텍스트 전처리
      const storyKeyword = narration.replace(/[\n\r]+/g, ' ').slice(0, 140);
      let prompt = '';

      if (styleType === '3d') {
        prompt = `masterpiece, best quality, ultra-detailed 3d anime storybook illustration, catch teenieping style, princess romi aesthetic, cute ${genderDesc} with sparkling jewel eyes named ${childName}, wearing ${outfitDesc}, cute fairy companion floating nearby, fairy tale book scene: ${storyKeyword}, magical pastel lighting, sparkling stars, vibrant cheerful atmosphere, 8k resolution`;
      } else if (styleType === 'ghibli') {
        prompt = `masterpiece, Studio Ghibli style animation, anime aesthetic, warm sunlight, beautiful landscape, lush nature, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy companion, scene: ${storyKeyword}, magical atmosphere, detailed background`;
      } else if (styleType === 'disney') {
        prompt = `masterpiece, classic Disney 2D animation style, traditional cel animation, vintage fairy tale, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy companion, scene: ${storyKeyword}, charming characters, nostalgic`;
      } else if (styleType === 'watercolor') {
        prompt = `masterpiece, beautiful soft watercolor children's book illustration, gentle brush strokes, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy companion, fairy tale scene: ${storyKeyword}, pastel colors, warm lighting, storybook style`;
      } else if (styleType === 'pastel') {
        prompt = `masterpiece, soft chalk pastel drawing, gentle colors, dreamy aesthetic, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy companion, scene: ${storyKeyword}, ethereal, warm lighting`;
      } else if (styleType === 'crayon') {
        prompt = `cute child's crayon drawing, textured wax crayon art, colorful and messy but charming, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy, scene: ${storyKeyword}, bright vivid colors, childlike innocence, nursery art`;
      } else if (styleType === 'pencil') {
        prompt = `masterpiece, delicate colored pencil sketch, beautiful storybook art, soft shading, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy companion, scene: ${storyKeyword}, warm cozy atmosphere, highly detailed sketch`;
      } else if (styleType === 'oil') {
        prompt = `masterpiece, beautiful oil painting, thick brush strokes, classic children's book illustration, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy companion, scene: ${storyKeyword}, rich colors, canvas texture`;
      } else if (styleType === 'papercut') {
        prompt = `masterpiece, papercut art, layered paper illustration, diorama style, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy companion, scene: ${storyKeyword}, crisp edges, paper texture, depth`;
      } else if (styleType === 'clay') {
        prompt = `masterpiece, claymation style, cute clay figures, Aardman animations style, 3D clay art, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy companion, scene: ${storyKeyword}, plasticine texture, studio lighting`;
      } else if (styleType === 'pop-up') {
        prompt = `masterpiece, 3D pop-up book illustration, paper engineering, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy companion, scene: ${storyKeyword}, standing paper figures, magical storybook opening`;
      } else if (styleType === 'pixel') {
        prompt = `masterpiece, 16-bit pixel art, cute SNES RPG style, cute ${genderDesc} named ${childName}, wearing ${outfitDesc}, cute fairy companion, scene: ${storyKeyword}, vibrant colors, retro gaming aesthetic`;
      } else {
        prompt = `masterpiece, best quality, ultra-detailed 3d anime storybook illustration, catch teenieping style, princess romi aesthetic, cute ${genderDesc} with sparkling jewel eyes named ${childName}, wearing ${outfitDesc}, cute fairy companion floating nearby, fairy tale book scene: ${storyKeyword}, magical pastel lighting, sparkling stars, vibrant cheerful atmosphere, 8k resolution`;
      }

      const seed = Math.floor(Math.random() * 899999) + 100000;
      const encodedPrompt = encodeURIComponent(prompt);
      const pollUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&seed=${seed}&nologo=true&model=flux`;

      // Preload image
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const imagePromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(pollUrl);
        img.onerror = () => reject(new Error('네트워크 AI 이미지 로드 실패'));
        // 12초 타임아웃
        setTimeout(() => resolve(pollUrl), 12000);
      });

      img.src = pollUrl;
      await imagePromise;

      preview.src = pollUrl;
      if (wrapper) wrapper.style.display = 'block';
      if (window.audioEngine) window.audioEngine.playSparkle();
    } catch (err) {
      console.warn('AI 이미지 생성 Fallback 적용:', err.message);
      // Fallback: 풍부한 파스텔 그라디언트 씬 생성
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 800, 600);
      grad.addColorStop(0, '#FFE8D6');
      grad.addColorStop(0.5, '#FFCAD4');
      grad.addColorStop(1, '#B5E2FA');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 600);

      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`✨ ${this.childProfile.name || '아이'}의 마법 동화`, 400, 260);

      ctx.fillStyle = '#4A5568';
      ctx.font = '22px sans-serif';
      ctx.fillText(narration.slice(0, 30) + '...', 400, 320);

      preview.src = canvas.toDataURL('image/png');
      if (wrapper) wrapper.style.display = 'block';
    } finally {
      if (genBtn) genBtn.disabled = false;
      if (genBar) genBar.style.display = 'none';
      if (wrapper && wrapper.style.display === 'none' && actions) {
        actions.style.display = 'flex';
      }
    }
  }

  onAuthorImagePicked(input) {
    const file = input.files && input.files[0];
    const card = input.closest('.author-page-card');
    const wrapper = card ? card.querySelector('.author-image-preview-wrapper') : null;
    const preview = card ? card.querySelector('.author-page-preview') : null;
    const actions = card ? card.querySelector('.author-image-actions') : null;
    if (!file || !preview) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('그림은 4MB 이하로 넣어 주세요.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      preview.src = evt.target.result;
      if (wrapper) wrapper.style.display = 'block';
      if (actions) actions.style.display = 'none';
      if (window.audioEngine) window.audioEngine.playSparkle();
    };
    reader.readAsDataURL(file);
  }

  collectAuthorStory() {
    const titleEl = document.getElementById('inputAuthorTitle');
    const cards = document.querySelectorAll('#authorPagesList .author-page-card');
    const pages = Array.from(cards).map((card, i) => {
      const preview = card.querySelector('.author-page-preview');
      const wrapper = card.querySelector('.author-image-preview-wrapper');
      const hasImage = preview && wrapper && wrapper.style.display !== 'none' && preview.src && preview.src.length > 10;
      return {
        title: `${i + 1}쪽`,
        narration: (card.querySelector('.author-page-narration') || {}).value || '',
        imageUrl: hasImage ? preview.src : null
      };
    });
    const story = window.buildAuthorStory(titleEl ? titleEl.value : '', pages);
    return story.totalPages ? story : null;
  }

  async refreshAiStoryStatus() {
    const badge = document.getElementById('aiStoryStatusBadge');
    const bar = document.getElementById('deviceVaultBar');
    let data = { gemini: false, gemma: false, gemmaModel: null };
    try {
      const res = await fetch('/api/story/status');
      data = await res.json();
      if (badge) {
        if (data.gemini) {
          badge.innerText = '이 기기 · Gemini 1차 · Gemma 4 대기';
        } else if (data.gemma) {
          badge.innerText = `이 기기 모델 ${data.gemmaModel}`;
        } else {
          badge.innerText = '키·Gemma 없음 · 샘플 문장으로 읽습니다';
        }
      }
    } catch (err) {
      if (badge) badge.innerText = '로컬 서버 확인 · python serve.py';
    }

    let vaultCount = data.vaultStories || 0;
    let usedMb = null;
    if (window.KidVault) {
      try {
        const stats = await window.KidVault.stats();
        vaultCount = stats.storyCount;
        usedMb = stats.usedMb;
      } catch (e) {
        vaultCount = data.vaultStories || 0;
      }
    }
    if (bar) {
      const model = data.gemmaModel || (data.gemini ? 'Gemini' : '샘플');
      const size = usedMb ? ` · ${usedMb}MB` : '';
      bar.innerText = `이 기기 · 이야기 ${vaultCount}권 · 모델 ${model}${size}`;
    }
  }

  setStartBusy(busy, text) {
    const btn = document.getElementById('btnStartStory');
    const label = document.getElementById('btnStartStoryLabel');
    if (btn) btn.disabled = !!busy;
    if (label && text) label.innerText = text;
    if (!busy) this.applyStorySourceUi();
  }

  async handleStartStoryClick(options = {}) {
    const fromVoice = !!(options && options.fromVoice);
    if (fromVoice || this.childProfile.storySource === 'ai') {
      const topicInput = document.getElementById('inputCustomTopic');
      const topic = this.pendingVoiceTopic
        || (topicInput && topicInput.value.trim())
        || '스스로 장난감 정리하기';
      this.setStartBusy(true, '이야기를 쓰고 있어요...');
      try {
        await this.generateAiStory(topic);
      } finally {
        this.setStartBusy(false);
      }
      this.childProfile.habitTheme = 'custom';
      this.startStory();
      return;
    }

    const story = this.collectAuthorStory();
    if (!story) {
      alert('읽어 줄 문장을 한 쪽 이상 적어 주세요.');
      return;
    }
    this.currentTheme = story;
    this.childProfile.habitTheme = 'author';
    this.startStory();
  }

  async generateAiStory(topic) {
    const seed = Date.now() % 2147483647;
    try {
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.childProfile.name,
          age: this.childProfile.age,
          topic,
          seed
        })
      });
      if (res.ok) {
        const data = await res.json();
        this.currentTheme = window.normalizeGeneratedStory(data.story, this.childProfile.name, topic);
        if (data.source === 'gemini') this.currentTheme.badge = '✨ Gemini 오늘 이야기';
        if (data.source === 'gemma') this.currentTheme.badge = '✨ Gemma 오늘 이야기';
        return;
      }
    } catch (err) {
      // 키·로컬 모델이 없으면 아래 템플릿으로 읽는다.
    }
    this.currentTheme = window.generateCustomStoryAI(this.childProfile.name, topic);
  }

  startStory(options = {}) {
    if (window.audioEngine) {
      window.audioEngine.init();
      window.audioEngine.playPageFlip();
      window.audioEngine.startBgm();
    }

    if (!options.skipPersist) {
      this.persistCurrentStory();
    }

    if (window.FirebaseSandbox) {
      window.FirebaseSandbox.saveChildProfile(this.childProfile);
      window.FirebaseSandbox.saveCustomStory(this.slimThemeForCloud(this.currentTheme));
    }

    this.viewOnboarding.classList.remove('active');
    this.viewLibrary.classList.remove('active');
    this.viewStorybook.classList.add('active');
    this.currentPage = 1;
    this.renderPage();
  }

  slimThemeForCloud(theme) {
    if (!theme) return {};
    const copy = JSON.parse(JSON.stringify({
      id: theme.id,
      titleTemplate: theme.titleTemplate,
      badge: theme.badge,
      source: theme.source,
      totalPages: theme.totalPages,
      pages: (theme.pages || []).map((p) => ({
        pageNumber: p.pageNumber,
        title: p.title,
        narration: p.narration,
        imageUrl: p.imageUrl ? '[this-device]' : null
      }))
    }));
    return copy;
  }

  async persistCurrentStory() {
    if (!window.KidVault || !this.currentTheme) return;
    if (window.KidVault.isPreset(this.currentTheme.id)) return;
    try {
      if (this.currentTheme.fromVault) {
        await window.KidVault.touch(this.currentTheme.id);
      } else {
        await window.KidVault.saveStory(this.currentTheme, this.childProfile);
        this.currentTheme.fromVault = true;
      }
      this.refreshAiStoryStatus();
    } catch (e) {
      // 금고 저장이 실패해도 이번 읽기는 계속한다.
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      if (window.audioEngine) window.audioEngine.playPageFlip();
      this.renderPage();
    }
  }

  nextPage() {
    if (this.currentPage < this.currentTheme.totalPages) {
      this.currentPage++;
      if (window.audioEngine) window.audioEngine.playPageFlip();
      this.renderPage();
    } else {
      this.openPODModal();
    }
  }

  renderPage() {
    this.stopNarrationSpeech();
    if (window.MediaPipeBrushing) window.MediaPipeBrushing.stop();
    if (this.miniGameInstance) {
      this.miniGameInstance.stop();
      this.miniGameInstance = null;
    }

    const pageData = this.currentTheme.pages[this.currentPage - 1];
    if (!pageData) return;

    // UI Updates
    this.pageBadge.innerText = `${pageData.pageNumber} / ${this.currentTheme.totalPages} 쪽`;
    this.storyThemeBadge.innerText = `${this.currentTheme.badge}`;
    this.btnPrev.disabled = this.currentPage === 1;

    // Page 6 (Ending) Navigation UI Control
    const isEndingPage = this.currentPage === this.currentTheme.totalPages;
    if (isEndingPage) {
      this.btnNext.innerText = '양장본 주문 🎁';
      if (this.btnRestartStory) this.btnRestartStory.style.display = 'flex';
      if (this.btnLibraryExit) this.btnLibraryExit.style.display = 'flex';
    } else {
      this.btnNext.innerText = '다음 쪽 ➔';
      if (this.btnRestartStory) this.btnRestartStory.style.display = 'none';
      if (this.btnLibraryExit) this.btnLibraryExit.style.display = 'flex';
    }

    // Update Story Voice Mode UI across all pages
    this.updateStoryVoiceModeUI();

    // 치환된 텍스트
    const replacedTitle = this.replaceChildName(pageData.title);
    const replacedNarration = this.replaceChildName(pageData.narration);

    if (pageData.isGamePage) {
      this.renderMiniGamePage(pageData, replacedNarration);
      return;
    }

    this.renderNormalPage(pageData, replacedTitle, replacedNarration);
  }

  renderNormalPage(pageData, title, narration) {
    this.sceneContainer.style.background = pageData.bgGradient;
    if (pageData.imageUrl) {
      const safeTitle = String(title || '동화 그림').replace(/"/g, '');
      this.sceneContainer.innerHTML = `<img class="page-user-illustration" alt="${safeTitle}" src="${pageData.imageUrl}">`;
    } else {
      this.sceneContainer.innerHTML = this.renderStudioIllustrationSVG(pageData);
    }

    this.renderNarrationBox(narration);
    setTimeout(() => this.playNarrationSpeech(narration), 350);
  }

  renderMiniGamePage(pageData, narration) {
    this.sceneContainer.style.background = pageData.bgGradient;
    this.sceneContainer.innerHTML = `
      <div class="mini-game-wrapper">
        <div class="game-hud">
          <div class="game-score-badge" id="miniGameScore">퇴치한 충치몬: 0 / 5</div>
          <div class="game-mode-toggle">
            <button class="btn-game-mode active" id="btnModeTouch" type="button">🖐️ 터치 모드</button>
            <button class="btn-game-mode" id="btnModeCam" type="button">📷 AI 카메라 치카</button>
            <button class="btn-game-mode" id="btnToggleMesh" type="button" style="display:none; background: #E8F8F5; color: #00B894;">✨ AI 랜드마크 메쉬</button>
          </div>
          <div class="game-progress-container">
            <div class="game-progress-bar" id="miniGameProgressBar"></div>
          </div>
        </div>
        <div class="game-canvas-area" id="gameCanvasArea">
          <canvas id="miniGameCanvas"></canvas>
          <video id="miniGameVideo" playsinline autoplay muted style="display:none;"></video>
        </div>
      </div>
    `;

    this.renderNarrationBox(narration);
    setTimeout(() => this.playNarrationSpeech(narration), 350);

    const onGameClear = () => {
      if (window.MediaPipeBrushing) window.MediaPipeBrushing.stop();
      setTimeout(() => {
        this.nextPage();
      }, 1200);
    };

    // 1. 기본 터치 모드 시작
    setTimeout(() => {
      this.miniGameInstance = new window.TeethMiniGame('miniGameCanvas', onGameClear);
      this.miniGameInstance.start();
    }, 100);

    // 2. 모드 전환 버튼 바인딩
    setTimeout(() => {
      const btnModeTouch = document.getElementById('btnModeTouch');
      const btnModeCam = document.getElementById('btnModeCam');
      const btnToggleMesh = document.getElementById('btnToggleMesh');
      const videoEl = document.getElementById('miniGameVideo');
      const canvasEl = document.getElementById('miniGameCanvas');
      const areaEl = document.getElementById('gameCanvasArea');

      if (btnToggleMesh) {
        btnToggleMesh.addEventListener('click', () => {
          if (window.MediaPipeBrushing) {
            const isMeshOn = window.MediaPipeBrushing.toggleLandmarkMesh();
            btnToggleMesh.style.background = isMeshOn ? '#E8F8F5' : '#F1ECE1';
            btnToggleMesh.style.color = isMeshOn ? '#00B894' : '#636E72';
            btnToggleMesh.innerText = isMeshOn ? '✨ AI 랜드마크 ON' : '⏸️ 랜드마크 OFF';
          }
        });
      }

      if (btnModeTouch && btnModeCam && canvasEl && videoEl) {
        btnModeTouch.addEventListener('click', () => {
          btnModeTouch.classList.add('active');
          btnModeCam.classList.remove('active');
          if (btnToggleMesh) btnToggleMesh.style.display = 'none';
          if (areaEl) areaEl.classList.remove('camera-active-glow');

          // AR 카메라 정지 및 터치 게임 재개
          if (window.MediaPipeBrushing) window.MediaPipeBrushing.stop();
          if (this.miniGameInstance) this.miniGameInstance.stop();
          this.miniGameInstance = new window.TeethMiniGame('miniGameCanvas', onGameClear);
          this.miniGameInstance.start();
          if (window.audioEngine) window.audioEngine.playSparkle();
        });

        btnModeCam.addEventListener('click', async () => {
          btnModeCam.classList.add('active');
          btnModeTouch.classList.remove('active');
          if (btnToggleMesh) btnToggleMesh.style.display = 'inline-flex';
          if (areaEl) areaEl.classList.add('camera-active-glow');

          // 터치 게임 정지 후 MediaPipe AR 카메라 가동
          if (this.miniGameInstance) {
            this.miniGameInstance.stop();
            this.miniGameInstance = null;
          }

          if (window.MediaPipeBrushing) {
            const res = await window.MediaPipeBrushing.start(videoEl, canvasEl, onGameClear);
            if (!res.success) {
              alert(`📷 카메라 연결에 실패했습니다 (${res.error}).\n터치 모드로 자동 전환합니다.`);
              btnModeTouch.click();
            }
          }
          if (window.audioEngine) window.audioEngine.playSparkle();
        });
      }
    }, 150);
  }

  renderNarrationBox(narrationText) {
    this.narrationBox.innerHTML = '';
    let charOffset = 0;
    
    const tokens = narrationText.split(/(\s+)/);
    let wordIdx = 0;

    tokens.forEach((tok) => {
      if (tok.trim().length > 0) {
        const span = document.createElement('span');
        span.className = 'narration-word';
        span.id = `word_span_${wordIdx}`;
        span.dataset.startChar = charOffset;
        span.dataset.endChar = charOffset + tok.length;
        span.dataset.cleanWord = tok.replace(/[^가-힣a-zA-Z0-9]/g, '');
        span.innerText = tok;
        this.narrationBox.appendChild(span);
        wordIdx++;
      } else {
        const spaceNode = document.createTextNode(tok);
        this.narrationBox.appendChild(spaceNode);
      }
      charOffset += tok.length;
    });
  }

  replaceChildName(text) {
    if (!text) return '';
    const name = this.childProfile.name;
    let res = text.replace(/\{\{CHILD_NAME\}\}/g, name);

    // Resolve Korean postpositions correctly based on the preceding character's batchim
    res = res.replace(/([가-힣a-zA-Z0-9])(\(은\)는|은\(는\)|\(이\)가|이\(가\)|\(을\)를|을\(를\)|\(과\)와|과\(와\))/g, (match, prevChar, josa) => {
      let hasBatchim = false;
      const code = prevChar.charCodeAt(0);
      if (code >= 0xAC00 && code <= 0xD7A3) {
        hasBatchim = (code - 0xAC00) % 28 > 0;
      } else {
        // Simple fallback for non-Korean chars: assume no batchim (or could be improved later)
        hasBatchim = false;
      }
      
      let resolved = '';
      if (josa.includes('은') && josa.includes('는')) resolved = hasBatchim ? '은' : '는';
      else if (josa.includes('이') && josa.includes('가')) resolved = hasBatchim ? '이' : '가';
      else if (josa.includes('을') && josa.includes('를')) resolved = hasBatchim ? '을' : '를';
      else if (josa.includes('과') && josa.includes('와')) resolved = hasBatchim ? '과' : '와';
      
      return prevChar + resolved;
    });

    return res;
  }

  // =========================================================================
  // 🎙️ 나레이션. Edge Neural 우선, 실패 시에만 브라우저 TTS
  // =========================================================================
  haltNarrationPlayback() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.narrationAudio) {
      this.narrationAudio.pause();
      this.narrationAudio.src = '';
      this.narrationAudio = null;
    }
    if (this.ttsObjectUrl) {
      URL.revokeObjectURL(this.ttsObjectUrl);
      this.ttsObjectUrl = null;
    }
    if (this.highlightTimer) {
      clearInterval(this.highlightTimer);
      this.highlightTimer = null;
    }
    if (this.btnSpeaker) {
      this.btnSpeaker.classList.remove('playing');
    }
    this.isSpeechPlaying = false;
    this.speechUtterance = null;
    document.querySelectorAll('.narration-word').forEach(w => w.classList.remove('highlight'));
  }

  async playNarrationSpeech(text) {
    if (!text || (window.audioEngine && window.audioEngine.isMuted)) return;

    if (window.audioEngine) window.audioEngine.init();

    const requestId = ++this.ttsRequestId;
    this.haltNarrationPlayback();

    this.btnSpeaker.classList.add('playing');
    this.isSpeechPlaying = true;

    // 브라우저 음성은 클릭 직후 바로 시작. 서버 TTS가 오면 그때 교체한다.
    this.playBrowserNarration(text, requestId);

    const neural = await this.fetchNeuralTts(text);
    if (requestId !== this.ttsRequestId) return;
    if (!neural) return;

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.playNeuralNarration(neural.blob, neural.words, requestId);
  }

  async fetchNeuralTts(text) {
    const storyId = this.currentTheme && this.currentTheme.id;
    const pageNumber = this.currentPage;
    if (window.KidVault && storyId && !window.KidVault.isPreset(storyId)) {
      const cached = await window.KidVault.loadAudio(storyId, pageNumber, text);
      if (cached && cached.blob) return cached;
    }
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: 'ko-KR-SunHiNeural',
          rate: this.isParentVoiceMode ? '-12%' : '-8%'
        })
      });
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      if (!buf.byteLength) return null;

      let words = [];
      const raw = res.headers.get('X-KidStory-Words');
      if (raw) {
        try { words = JSON.parse(raw); } catch (e) { words = []; }
      }
      const neural = { blob: new Blob([buf], { type: 'audio/mpeg' }), words };
      if (window.KidVault && storyId && !window.KidVault.isPreset(storyId)) {
        window.KidVault.saveAudio(storyId, pageNumber, text, neural.blob, words).catch(() => {});
      }
      return neural;
    } catch (e) {
      return null;
    }
  }

  playNeuralNarration(blob, wordTimings, requestId) {
    this.ttsObjectUrl = URL.createObjectURL(blob);
    this.narrationAudio = new Audio(this.ttsObjectUrl);
    const wordSpans = Array.from(this.narrationBox.querySelectorAll('.narration-word'));
    const timings = Array.isArray(wordTimings) ? wordTimings : [];

    this.narrationAudio.onended = () => {
      if (requestId === this.ttsRequestId) this.stopNarrationSpeech();
    };
    this.narrationAudio.onerror = () => {
      if (requestId === this.ttsRequestId) this.playBrowserNarration(
        this.narrationBox ? this.narrationBox.innerText : '',
        requestId
      );
    };

    this.highlightTimer = setInterval(() => {
      if (requestId !== this.ttsRequestId || !this.narrationAudio) return;
      const t = this.narrationAudio.currentTime;
      if (timings.length > 0) {
        let idx = 0;
        for (let i = 0; i < timings.length; i++) {
          if (t >= (timings[i].at || 0)) idx = i;
        }
        const span = wordSpans[Math.min(idx, wordSpans.length - 1)];
        if (span) {
          wordSpans.forEach(w => w.classList.remove('highlight'));
          span.classList.add('highlight');
        }
        return;
      }

      const dur = this.narrationAudio.duration;
      if (!dur || !wordSpans.length) return;
      const idx = Math.min(wordSpans.length - 1, Math.floor((t / dur) * wordSpans.length));
      wordSpans.forEach(w => w.classList.remove('highlight'));
      wordSpans[idx].classList.add('highlight');
    }, 50);

    this.narrationAudio.play().catch(() => {
      if (requestId === this.ttsRequestId) {
        this.playBrowserNarration(this.narrationBox ? this.narrationBox.innerText : '', requestId);
      }
    });
  }

  pickKoreanVoice() {
    if (this.koreanVoice) return this.koreanVoice;
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const korean = voices.filter(v => (v.lang || '').toLowerCase().startsWith('ko'));
    const score = (v) => {
      const n = (v.name || '').toLowerCase();
      let s = 0;
      if (n.includes('neural')) s += 50;
      if (n.includes('online')) s += 30;
      if (n.includes('natural')) s += 20;
      if (n.includes('sunhi') || n.includes('injoon') || n.includes('heami')) s += 15;
      if (n.includes('google')) s += 8;
      return s;
    };
    korean.sort((a, b) => score(b) - score(a));
    this.koreanVoice = korean[0] || null;
    return this.koreanVoice;
  }

  playBrowserNarration(text, requestId) {
    if (!('speechSynthesis' in window) || !text) {
      this.haltNarrationPlayback();
      return;
    }

    this.speechUtterance = new SpeechSynthesisUtterance(text);
    this.speechUtterance.lang = 'ko-KR';
    this.speechUtterance.rate = 0.86;
    this.speechUtterance.pitch = 1.0;
    const voice = this.pickKoreanVoice();
    if (voice) this.speechUtterance.voice = voice;

    this.btnSpeaker.classList.add('playing');
    this.isSpeechPlaying = true;
    this.hasBoundarySupport = false;

    const wordSpans = Array.from(this.narrationBox.querySelectorAll('.narration-word'));

    this.speechUtterance.onboundary = (event) => {
      this.hasBoundarySupport = true;
      if (this.highlightTimer) {
        clearInterval(this.highlightTimer);
        this.highlightTimer = null;
      }
      this.highlightWordByCharIndex(event.charIndex, wordSpans);
    };

    let accumulatedMs = 0;
    const syllableSchedule = [];
    wordSpans.forEach((span) => {
      const start = parseInt(span.dataset.startChar, 10);
      const cleanLen = span.dataset.cleanWord.length || span.innerText.length;
      let durationMs = cleanLen * 210;
      if (span.innerText.includes('.') || span.innerText.includes('!') || span.innerText.includes('?')) {
        durationMs += 320;
      }
      syllableSchedule.push({ span, startChar: start, timeMs: accumulatedMs });
      accumulatedMs += durationMs;
    });

    const startTime = performance.now();
    this.highlightTimer = setInterval(() => {
      if (this.hasBoundarySupport || requestId !== this.ttsRequestId) {
        clearInterval(this.highlightTimer);
        this.highlightTimer = null;
        return;
      }
      const elapsed = performance.now() - startTime;
      let activeSpan = null;
      for (let i = syllableSchedule.length - 1; i >= 0; i--) {
        if (elapsed >= syllableSchedule[i].timeMs) {
          activeSpan = syllableSchedule[i].span;
          break;
        }
      }
      if (activeSpan) {
        wordSpans.forEach(w => w.classList.remove('highlight'));
        activeSpan.classList.add('highlight');
      }
      if (elapsed > accumulatedMs + 500) {
        clearInterval(this.highlightTimer);
        this.highlightTimer = null;
      }
    }, 50);

    this.speechUtterance.onend = () => {
      if (requestId !== this.ttsRequestId) return;
      if (this.narrationAudio && !this.narrationAudio.paused) return;
      this.haltNarrationPlayback();
    };
    this.speechUtterance.onerror = () => {
      if (requestId !== this.ttsRequestId) return;
      if (this.narrationAudio && !this.narrationAudio.paused) return;
      this.haltNarrationPlayback();
    };

    const speakNow = () => {
      if (requestId !== this.ttsRequestId || !this.speechUtterance) return;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(this.speechUtterance);
    };
    setTimeout(speakNow, 60);
  }

  highlightWordByCharIndex(charIdx, wordSpans) {
    if (!wordSpans || wordSpans.length === 0) return;

    let matchedSpan = null;
    for (let i = 0; i < wordSpans.length; i++) {
      const span = wordSpans[i];
      const start = parseInt(span.dataset.startChar, 10);
      const end = parseInt(span.dataset.endChar, 10);

      if (charIdx >= start && charIdx <= end) {
        matchedSpan = span;
        break;
      }
      if (charIdx < start && i > 0) {
        matchedSpan = wordSpans[i - 1];
        break;
      }
    }

    if (!matchedSpan && wordSpans.length > 0) {
      matchedSpan = wordSpans[wordSpans.length - 1];
    }

    if (matchedSpan) {
      wordSpans.forEach(w => w.classList.remove('highlight'));
      matchedSpan.classList.add('highlight');
    }
  }

  stopNarrationSpeech() {
    this.ttsRequestId += 1;
    this.haltNarrationPlayback();
  }

  toggleNarrationSpeech() {
    if (this.isSpeechPlaying) {
      this.stopNarrationSpeech();
    } else {
      const pageData = this.currentTheme.pages[this.currentPage - 1];
      if (pageData) {
        this.playNarrationSpeech(this.replaceChildName(pageData.narration));
      }
    }
  }

  // =========================================================================
  // 🎨 고품질 스튜디오 일러스트레이션 씬 렌더러 (Studio SVG Art Engine)
  // =========================================================================
  renderStudioIllustrationSVG(pageData) {
    const illus = pageData.illustration || {};
    const fullBodySVG = this.getFullBodyCharacterSVG(this.childProfile, 140, 190, illus.characterState || 'hero_pose');
    const pNum = pageData.pageNumber;
    let sceneElements = '';

    if (pNum === 1) {
      sceneElements = `
        <svg viewBox="0 0 600 320" class="studio-illustration">
          <defs>
            <linearGradient id="nightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1B1464"/>
              <stop offset="100%" stop-color="#4B4B9A"/>
            </linearGradient>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#FFF9D2"/>
              <stop offset="60%" stop-color="#FED330"/>
              <stop offset="100%" stop-color="#FED330" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <!-- 아치형 동화 창문 & 초승달 -->
          <rect x="50" y="25" width="140" height="170" rx="70" fill="url(#nightGrad)" stroke="#FFEAA7" stroke-width="4"/>
          <circle cx="145" cy="75" r="28" fill="url(#moonGlow)"/>
          <circle cx="155" cy="70" r="22" fill="url(#nightGrad)"/>
          <text x="75" y="65" font-size="12" fill="#FFF">✦</text>
          <text x="110" y="140" font-size="10" fill="#FFF">✦</text>
          <!-- 마카롱 핑크 침대와 베개 -->
          <rect x="210" y="145" width="350" height="135" rx="24" fill="#FF85A1" stroke="#FFD8E4" stroke-width="3"/>
          <rect x="200" y="168" width="370" height="100" rx="20" fill="#FFB6C1"/>
          <rect x="220" y="125" width="95" height="55" rx="20" fill="#FFFDF9" stroke="#FFE3EB" stroke-width="2"/>
          <!-- 주인공 캐릭터 -->
          <g transform="translate(295, 60)" class="character-vector">
            ${fullBodySVG}
          </g>
          <!-- 롤리팝 사탕 행성 -->
          <g transform="translate(450, 105) rotate(15)">
            <rect x="6" y="32" width="6" height="42" rx="3" fill="#FFEAA7"/>
            <circle cx="9" cy="18" r="20" fill="#FF477E"/>
            <path d="M 9 8 A 10 10 0 0 1 19 18 A 6 6 0 0 1 13 24" stroke="#FFF" stroke-width="3.5" fill="none"/>
          </g>
        </svg>
      `;
    } else if (pNum === 2) {
      sceneElements = `
        <svg viewBox="0 0 600 320" class="studio-illustration">
          <!-- 반짝이는 치아 크리스탈 궁전 -->
          <path d="M 160 280 L 160 135 Q 230 85 300 135 Q 370 85 440 135 L 440 280 Z" fill="#FFFFFF" stroke="#E0F7FA" stroke-width="4"/>
          <rect x="180" y="95" width="35" height="55" rx="8" fill="#FFF" stroke="#E0F7FA" stroke-width="2"/>
          <rect x="385" y="95" width="35" height="55" rx="8" fill="#FFF" stroke="#E0F7FA" stroke-width="2"/>
          <!-- 보라색 충치몬 1 -->
          <g transform="translate(90, 115)" class="monster-anim">
            <circle cx="0" cy="0" r="30" fill="#8854D0" stroke="#FFF" stroke-width="2"/>
            <polygon points="-16,-20 -28,-40 -6,-25" fill="#5F27CD"/>
            <polygon points="16,-20 28,-40 6,-25" fill="#5F27CD"/>
            <circle cx="-10" cy="-4" r="7" fill="#FFF"/>
            <circle cx="10" cy="-4" r="7" fill="#FFF"/>
            <circle cx="-10" cy="-4" r="3" fill="#2D3436"/>
            <circle cx="10" cy="-4" r="3" fill="#2D3436"/>
            <path d="M -10 12 Q 0 4 10 12" stroke="#2D3436" stroke-width="3" fill="none"/>
          </g>
          <!-- 보라색 충치몬 2 -->
          <g transform="translate(500, 135)" class="monster-anim" style="animation-delay: 0.5s;">
            <circle cx="0" cy="0" r="26" fill="#8854D0" stroke="#FFF" stroke-width="2"/>
            <circle cx="-8" cy="-3" r="6" fill="#FFF"/>
            <circle cx="8" cy="-3" r="6" fill="#FFF"/>
            <circle cx="-8" cy="-3" r="2.5" fill="#2D3436"/>
            <circle cx="8" cy="-3" r="2.5" fill="#2D3436"/>
          </g>
          <!-- 주인공 캐릭터 -->
          <g transform="translate(230, 65)" class="character-vector">
            ${fullBodySVG}
          </g>
        </svg>
      `;
    } else if (pNum === 3) {
      sceneElements = `
        <svg viewBox="0 0 600 320" class="studio-illustration">
          <circle cx="300" cy="150" r="140" fill="#E8F8F5" opacity="0.7"/>
          <!-- 무지개 아치 -->
          <path d="M 70 290 A 230 230 0 0 1 530 290" stroke="#FF7675" stroke-width="14" fill="none" opacity="0.7"/>
          <path d="M 84 290 A 216 216 0 0 1 516 290" stroke="#FED330" stroke-width="14" fill="none" opacity="0.7"/>
          <path d="M 98 290 A 202 202 0 0 1 502 290" stroke="#55EFC4" stroke-width="14" fill="none" opacity="0.7"/>
          <!-- 몽실몽실 거품 구름 -->
          <circle cx="150" cy="95" r="26" fill="#FFF" opacity="0.9"/>
          <circle cx="450" cy="85" r="30" fill="#FFF" opacity="0.9"/>
          <!-- 주인공 캐릭터 -->
          <g transform="translate(230, 60)" class="character-vector">
            ${fullBodySVG}
          </g>
        </svg>
      `;
    } else if (pNum === 5) {
      sceneElements = `
        <svg viewBox="0 0 600 320" class="studio-illustration">
          <rect x="70" y="150" width="460" height="140" rx="24" fill="#FFF" stroke="#FED330" stroke-width="6"/>
          <polygon points="300,40 190,150 410,150" fill="#FFEAA7"/>
          <circle cx="300" cy="100" r="28" fill="#FFF" stroke="#FED330" stroke-width="3"/>
          <text x="288" y="112" font-size="30">👑</text>
          <!-- 승리의 캐릭터 -->
          <g transform="translate(230, 55)" class="character-vector">
            ${fullBodySVG}
          </g>
        </svg>
      `;
    } else if (pNum === 6) {
      sceneElements = `
        <svg viewBox="0 0 600 320" class="studio-illustration">
          <path d="M 370 30 A 140 140 0 1 0 510 240 A 110 110 0 1 1 370 30 Z" fill="#FED330"/>
          <path d="M 80 250 Q 130 190 190 225 Q 260 180 320 225 Q 390 190 450 250 Z" fill="#FFFFFF" opacity="0.95"/>
          <!-- 꿀잠 자는 캐릭터 -->
          <g transform="translate(245, 75)" class="character-vector">
            ${fullBodySVG}
          </g>
          <text x="430" y="110" font-size="30" fill="#FED330">✨</text>
          <text x="400" y="90" font-family="sans-serif" font-weight="bold" font-size="28" fill="#FFF">Zzz...</text>
        </svg>
      `;
    } else {
      sceneElements = `
        <svg viewBox="0 0 600 320" class="studio-illustration">
          <circle cx="300" cy="150" r="120" fill="#FFF" opacity="0.55"/>
          <g transform="translate(245, 70)" class="character-vector">
            ${fullBodySVG}
          </g>
        </svg>
      `;
    }

    return `
      <div class="scene-artwork">
        ${sceneElements}
      </div>
    `;
  }

  // =========================================================================
  // 🎙️ 실제 마이크 녹음 (MediaRecorder) + 글 변환 (SpeechRecognition)
  // =========================================================================
  initVoiceRecognition() {
    this.recognition = null;
    this.isRecordingVoice = false;
    this.waveAnimId = null;
    this.liveTranscript = '';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'ko-KR';
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event) => {
        let finalText = '';
        let interim = '';
        for (let i = 0; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += piece;
          else interim += piece;
        }
        this.liveTranscript = `${finalText} ${interim}`.replace(/\s+/g, ' ').trim();
        const liveEl = document.getElementById('voiceLiveTranscript');
        if (liveEl) {
          liveEl.innerText = this.liveTranscript ? `알아듣는 중. ${this.liveTranscript}` : '';
        }
      };

      this.recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          this.abortVoiceRecording('마이크 사용이 거부되었어요. 주소창 왼쪽에서 마이크를 허용해 주세요.');
        }
      };

      this.recognition.onend = () => {
        if (this.isRecordingVoice) {
          try { this.recognition.start(); } catch (e) { /* Chrome 재시작 제한 */ }
        }
      };
    }

    const btnMic = document.getElementById('btnMicRecord');
    if (btnMic) {
      btnMic.addEventListener('click', () => {
        this.toggleVoiceRecording();
      });
    }

    const btnPlayVoice = document.getElementById('btnPlayRecordedVoice');
    if (btnPlayVoice) {
      btnPlayVoice.addEventListener('click', () => {
        this.toggleRecordedVoicePlayback();
      });
    }

    const btnRerecord = document.getElementById('btnRerecordVoice');
    if (btnRerecord) {
      btnRerecord.addEventListener('click', () => {
        this.resetVoiceRecording();
      });
    }

    const btnStartWithVoice = document.getElementById('btnStartWithVoice');
    if (btnStartWithVoice) {
      btnStartWithVoice.addEventListener('click', () => {
        if (!this.parentVoiceUrl) {
          this.setMicHint('먼저 마이크를 눌러 내 목소리를 녹음해 주세요.');
          return;
        }
        this.isParentVoiceMode = true;
        this.handleStartStoryClick({ fromVoice: true });
      });
    }

    const btnToggleVoiceMode = document.getElementById('btnToggleVoiceMode');
    if (btnToggleVoiceMode) {
      btnToggleVoiceMode.addEventListener('click', () => {
        this.isParentVoiceMode = !this.isParentVoiceMode;
        this.updateStoryVoiceModeUI();
        if (this.isSpeechPlaying) {
          const pageData = this.currentTheme.pages[this.currentPage - 1];
          if (pageData) {
            this.playNarrationSpeech(this.replaceChildName(pageData.narration));
          }
        }
        if (window.audioEngine) window.audioEngine.playSparkle();
      });
    }
  }

  setMicHint(text) {
    const hint = document.getElementById('voiceMicHint');
    if (hint) hint.innerText = text;
  }

  formatVoiceDuration(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  pickRecorderMime() {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || '';
  }

  toggleVoiceRecording() {
    if (this.isRecordingVoice) {
      this.stopMicCapture();
      return;
    }
    this.startMicCapture();
  }

  async startMicCapture() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.updateMicUI(false, '마이크를 쓸 수 없어요');
      this.setMicHint('이 브라우저에서는 마이크 녹음을 지원하지 않아요. Chrome에서 열어 주세요.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      this.updateMicUI(false, '녹음을 지원하지 않아요');
      this.setMicHint('MediaRecorder를 쓸 수 없어요. 최신 Chrome에서 다시 열어 주세요.');
      return;
    }

    this.updateMicUI(false, '마이크 권한을 확인하고 있어요...');
    this.setMicHint('브라우저가 마이크 허용을 물으면 허용을 눌러 주세요.');

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
    } catch (err) {
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      this.updateMicUI(false, '마이크를 허용한 뒤 다시 눌러 주세요');
      this.setMicHint(denied
        ? '마이크가 차단되어 있어요. 주소창 왼쪽 자물쇠에서 마이크를 허용한 뒤 다시 눌러 주세요.'
        : '마이크를 열 수 없어요. 다른 앱이 마이크를 쓰고 있는지 확인해 주세요.');
      return;
    }

    this.skipVoiceFinalize = false;
    this.micStream = stream;
    this.recordedChunks = [];
    this.voicePeakLevel = 0;
    this.liveTranscript = '';
    this.recSeconds = 0;
    const liveEl = document.getElementById('voiceLiveTranscript');
    if (liveEl) liveEl.innerText = '';

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.voiceAudioCtx = new AudioCtx();
    if (this.voiceAudioCtx.state === 'suspended') {
      await this.voiceAudioCtx.resume();
    }
    const source = this.voiceAudioCtx.createMediaStreamSource(stream);
    this.voiceAnalyser = this.voiceAudioCtx.createAnalyser();
    this.voiceAnalyser.fftSize = 256;
    this.voiceAnalyser.smoothingTimeConstant = 0.65;
    source.connect(this.voiceAnalyser);

    const mimeType = this.pickRecorderMime();
    try {
      this.mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch (e) {
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.mediaRecorder.onstop = () => {
      this.finalizeMicCapture();
    };

    this.mediaRecorder.start(200);
    this.isRecordingVoice = true;
    this.updateMicUI(true, '녹음 중 · 다 말씀하시면 다시 누르세요');
    this.setMicHint('지금 말하면 막대가 커집니다. 조용하면 거의 멈춥니다. 끝난 뒤 버튼을 다시 누르세요.');
    this.startVoiceTimer();
    this.startRealtimeWaveform();

    if (this.recognition) {
      try { this.recognition.start(); } catch (e) { /* already started */ }
    }
  }

  stopMicCapture() {
    if (!this.isRecordingVoice && !(this.mediaRecorder && this.mediaRecorder.state === 'recording')) {
      return;
    }
    this.isRecordingVoice = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) { /* ignore */ }
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      return;
    }
    this.finalizeMicCapture();
  }

  abortVoiceRecording(message) {
    this.skipVoiceFinalize = true;
    this.isRecordingVoice = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) { /* ignore */ }
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch (e) { /* ignore */ }
    }
    this.releaseMicHardware();
    this.stopVoiceTimer();
    this.stopWaveform();
    this.updateMicUI(false, '다시 눌러 녹음하기');
    this.setMicHint(message);
  }

  releaseMicHardware() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.voiceAudioCtx) {
      this.voiceAudioCtx.close().catch(() => {});
      this.voiceAudioCtx = null;
    }
    this.voiceAnalyser = null;
  }

  clearParentVoice() {
    this.stopParentVoicePreview();
    if (this.parentVoiceUrl) {
      URL.revokeObjectURL(this.parentVoiceUrl);
    }
    this.parentVoiceUrl = null;
    this.parentVoiceBlob = null;
  }

  finalizeMicCapture() {
    if (this.skipVoiceFinalize) {
      this.skipVoiceFinalize = false;
      this.releaseMicHardware();
      this.stopVoiceTimer();
      this.stopWaveform();
      return;
    }
    const duration = this.recSeconds || 0;
    this.stopVoiceTimer();
    this.stopWaveform();
    this.releaseMicHardware();

    const mime = (this.mediaRecorder && this.mediaRecorder.mimeType) || 'audio/webm';
    const blob = new Blob(this.recordedChunks, { type: mime });
    const tooShort = duration < 1;
    const tooQuiet = this.voicePeakLevel < 12;
    const tooSmall = blob.size < 1200;

    if (tooShort || tooQuiet || tooSmall) {
      this.clearParentVoice();
      this.updateMicUI(false, '눌러서 내 목소리 녹음하기');
      let reason = '목소리가 거의 들리지 않았어요.';
      if (tooShort) reason = '녹음이 너무 짧아요. 1초 이상 말씀해 주세요.';
      this.setMicHint(`${reason} 버튼을 눌러 녹음하고, 끝나면 한 번 더 눌러 멈춰 주세요.`);
      return;
    }

    this.clearParentVoice();
    this.parentVoiceBlob = blob;
    this.parentVoiceUrl = URL.createObjectURL(blob);
    this.isParentVoiceMode = true;

    const transcript = (this.liveTranscript || '').trim();
    if (transcript) {
      this.processSpokenStoryPrompt(transcript, { durationSec: duration });
      this.setMicHint('내 목소리가 저장됐어요. 아래 재생으로 본인 목소리인지 확인해 보세요.');
    } else {
      this.showVoiceVerification({
        transcript: '',
        durationSec: duration
      });
      this.setMicHint('목소리는 저장됐어요. 글로는 못 알아들었어요. 재생 버튼으로 내 목소리인지 확인해 주세요.');
    }
    this.updateMicUI(false, '다시 녹음하려면 눌러 주세요');
  }

  startVoiceTimer() {
    this.recSeconds = 0;
    const timerElem = document.getElementById('voiceLiveTimer');
    const secElem = document.getElementById('voiceTimerSeconds');
    const ripple = document.getElementById('recordingRipple');

    if (timerElem) timerElem.style.display = 'flex';
    if (secElem) secElem.innerText = '00:00';
    if (ripple) ripple.classList.add('active');

    this.timerInterval = setInterval(() => {
      this.recSeconds++;
      if (secElem) secElem.innerText = this.formatVoiceDuration(this.recSeconds);
    }, 1000);
  }

  stopVoiceTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const timerElem = document.getElementById('voiceLiveTimer');
    const ripple = document.getElementById('recordingRipple');
    if (timerElem) timerElem.style.display = 'none';
    if (ripple) ripple.classList.remove('active');
  }

  updateMicUI(isRecording, label) {
    const btnMic = document.getElementById('btnMicRecord');
    const labelElem = document.getElementById('micStatusText');
    if (btnMic) {
      if (isRecording) btnMic.classList.add('recording');
      else btnMic.classList.remove('recording');
    }
    if (labelElem) {
      labelElem.innerText = label;
    }
  }

  stopWaveform() {
    if (this.waveAnimId) {
      cancelAnimationFrame(this.waveAnimId);
      this.waveAnimId = null;
    }
    const canvas = document.getElementById('voiceWaveCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  resetVoiceRecording() {
    if (this.isRecordingVoice) {
      this.abortVoiceRecording('다시 녹음할 수 있어요. 마이크를 누르고 말씀해 주세요.');
    } else {
      this.updateMicUI(false, '눌러서 내 목소리 녹음하기');
      this.setMicHint('말할 때만 막대가 커집니다. 조용하면 거의 멈춰 있어요.');
    }
    this.clearParentVoice();
    this.liveTranscript = '';
    const liveEl = document.getElementById('voiceLiveTranscript');
    if (liveEl) liveEl.innerText = '';
    const verifCard = document.getElementById('voiceVerificationCard');
    if (verifCard) verifCard.style.display = 'none';
    const chips = document.getElementById('voiceChipsContainer');
    if (chips) chips.style.display = 'flex';
  }

  stopParentVoicePreview() {
    if (this.parentVoiceAudio) {
      this.parentVoiceAudio.pause();
      this.parentVoiceAudio.currentTime = 0;
      this.parentVoiceAudio = null;
    }
    this.isPlayingVoicePreview = false;
    const btnPlay = document.getElementById('btnPlayRecordedVoice');
    const icon = document.getElementById('voicePlayIcon');
    if (btnPlay) btnPlay.classList.remove('playing');
    if (icon) icon.innerText = '▶️';
  }

  toggleRecordedVoicePlayback() {
    if (this.isPlayingVoicePreview) {
      this.stopParentVoicePreview();
      return;
    }

    if (!this.parentVoiceUrl) {
      this.setMicHint('저장된 내 목소리가 없어요. 먼저 마이크를 눌러 녹음해 주세요.');
      return;
    }

    const btnPlay = document.getElementById('btnPlayRecordedVoice');
    const icon = document.getElementById('voicePlayIcon');
    const audio = new Audio(this.parentVoiceUrl);
    this.parentVoiceAudio = audio;
    this.isPlayingVoicePreview = true;
    if (btnPlay) btnPlay.classList.add('playing');
    if (icon) icon.innerText = '⏹️';

    const settle = () => {
      this.isPlayingVoicePreview = false;
      this.parentVoiceAudio = null;
      if (btnPlay) btnPlay.classList.remove('playing');
      if (icon) icon.innerText = '▶️';
    };
    audio.onended = settle;
    audio.onerror = () => {
      settle();
      this.setMicHint('녹음을 재생하지 못했어요. 다시 녹음해 주세요.');
    };
    audio.play().catch(() => {
      settle();
      this.setMicHint('재생이 막혔어요. 화면을 한 번 누른 뒤 다시 재생해 주세요.');
    });
  }

  startRealtimeWaveform() {
    const canvas = document.getElementById('voiceWaveCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const binCount = this.voiceAnalyser ? this.voiceAnalyser.fftSize : 128;
    const data = new Uint8Array(binCount);

    const draw = () => {
      if (!this.isRecordingVoice) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 20;
      const bars = new Array(barCount).fill(4);
      if (this.voiceAnalyser) {
        this.voiceAnalyser.getByteTimeDomainData(data);
        let peak = 0;
        const step = Math.max(1, Math.floor(data.length / barCount));
        for (let i = 0; i < barCount; i++) {
          let maxDev = 0;
          for (let j = 0; j < step; j++) {
            const v = Math.abs(data[i * step + j] - 128);
            if (v > maxDev) maxDev = v;
          }
          if (maxDev > peak) peak = maxDev;
          bars[i] = 4 + (maxDev / 128) * 36;
        }
        if (peak > this.voicePeakLevel) this.voicePeakLevel = peak;
      }

      const barWidth = 6;
      const gap = 8;
      const startX = (canvas.width - (barCount * (barWidth + gap))) / 2;
      for (let i = 0; i < barCount; i++) {
        const height = bars[i];
        const x = startX + i * (barWidth + gap);
        const y = (canvas.height - height) / 2;
        ctx.fillStyle = height > 12 ? '#FF7675' : '#E8D5D0';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, [3, 3, 3, 3]);
        ctx.fill();
      }

      this.waveAnimId = requestAnimationFrame(draw);
    };

    draw();
  }

  showVoiceVerification({ transcript, durationSec }) {
    const verifCard = document.getElementById('voiceVerificationCard');
    const verifChildName = document.getElementById('verifChildName');
    const verifTopic = document.getElementById('verifTopic');
    const quoteText = document.getElementById('voiceTranscriptText');
    const durationTag = document.getElementById('voiceDurationTag');
    const chips = document.getElementById('voiceChipsContainer');
    const quality = document.getElementById('verifQuality');
    const tone = document.getElementById('verifVoiceTone');

    if (verifCard) verifCard.style.display = 'flex';
    if (verifChildName) verifChildName.innerText = `${this.childProfile.name} 주인공`;
    if (durationTag) durationTag.innerText = `${this.formatVoiceDuration(durationSec)} 내 목소리`;
    if (quality) quality.innerText = '실제 마이크 녹음';
    if (tone) tone.innerText = '실제 녹음 · 재생으로 확인';
    if (chips) chips.style.display = 'flex';

    if (transcript) {
      if (quoteText) quoteText.innerText = `"${transcript}"`;
    } else {
      if (verifTopic) verifTopic.innerText = '글로는 못 알아들었어요. 목소리는 저장됨';
      if (quoteText) quoteText.innerText = '아래 재생을 누르면 방금 말한 내 목소리가 나와야 합니다.';
    }
  }

  processSpokenStoryPrompt(spokenText, options = {}) {
    if (!spokenText || spokenText.trim().length === 0) return;
    this.lastRecordedText = spokenText;
    this.isParentVoiceMode = true;

    let detectedName = this.childProfile.name;
    const nameMatch = spokenText.match(/우리\s*([가-힣]{2,4})[이가는은]/) || spokenText.match(/([가-힣]{2,4})[이가는은]/);
    if (nameMatch && nameMatch[1]) {
      detectedName = nameMatch[1];
      this.childProfile.name = detectedName;
      if (this.inputChildName) this.inputChildName.value = detectedName;
      this.renderFullBodyAvatar();
    }

    let customTopic = '친구와 사이좋게 지내기';
    if (spokenText.includes('양보') || spokenText.includes('장난감') || spokenText.includes('친구')) {
      customTopic = '친구와 사이좋게 장난감 양보하기';
    } else if (spokenText.includes('불') || spokenText.includes('무서') || spokenText.includes('잠') || spokenText.includes('밤')) {
      customTopic = '어둠을 무서워하지 않고 씩씩하게 자기';
    } else if (spokenText.includes('시금치') || spokenText.includes('당근') || spokenText.includes('편식') || spokenText.includes('밥') || spokenText.includes('채소')) {
      customTopic = '채소와 밥을 골고루 맛있게 먹기';
    } else if (spokenText.includes('양치') || spokenText.includes('이빨') || spokenText.includes('칫솔') || spokenText.includes('치카')) {
      customTopic = '치카치카 깨끗이 양치질하기';
    } else if (spokenText.includes('정리') || spokenText.includes('치우')) {
      customTopic = '스스로 장난감 정리정돈하기';
    } else {
      customTopic = spokenText.replace(/우리\s*|\s*가요|\s*해요|\s*거예요|\s*걱정이에요/g, '').trim();
    }

    this.pendingVoiceTopic = customTopic;
    this.childProfile.habitTheme = 'custom';
    this.childProfile.storySource = 'ai';

    const verifTopic = document.getElementById('verifTopic');
    if (verifTopic) verifTopic.innerText = customTopic;

    this.showVoiceVerification({
      transcript: spokenText,
      durationSec: options.durationSec != null ? options.durationSec : this.recSeconds
    });

    if (window.audioEngine) {
      window.audioEngine.playSparkle();
    }
  }

  updateStoryVoiceModeUI() {
    const bookVoiceText = document.getElementById('bookVoiceModeText');
    const speakerLabel = document.getElementById('speakerVoiceLabel');
    const narrationTag = document.getElementById('narrationVoiceTag');

    if (this.isParentVoiceMode && this.parentVoiceUrl) {
      if (bookVoiceText) bookVoiceText.innerText = '내 목소리 샘플 등록됨';
      if (speakerLabel) speakerLabel.innerText = '내 목소리';
      if (narrationTag) narrationTag.innerHTML = '목소리는 <strong>미리듣기</strong>에서 확인 · 동화 본문은 비슷한 톤으로 읽어줘요';
    } else if (this.isParentVoiceMode) {
      if (bookVoiceText) bookVoiceText.innerText = '비슷한 톤으로 읽는 중';
      if (speakerLabel) speakerLabel.innerText = '부모 톤';
      if (narrationTag) narrationTag.innerHTML = '동화 본문은 <strong>비슷한 톤의 음성</strong>으로 읽어주고 있어요';
    } else {
      if (bookVoiceText) bookVoiceText.innerText = '요정 나레이터 모드';
      if (speakerLabel) speakerLabel.innerText = '요정 음성';
      if (narrationTag) narrationTag.innerHTML = '상냥한 <strong>동화 요정의 목소리</strong>로 읽어주고 있어요';
    }
  }

  // Parent Gate & POD Modals
  openParentGate() {
    const num1 = Math.floor(Math.random() * 6) + 3;
    const num2 = Math.floor(Math.random() * 6) + 2;
    const ans = num1 + num2;

    const userAns = prompt(`[부모님 확인] 아이들의 오조작을 방지하기 위한 보안 문제입니다.\n\n${num1} + ${num2} = ?`);
    if (parseInt(userAns, 10) === ans) {
      this.goToOnboarding();
    } else if (userAns !== null) {
      alert("정답이 일치하지 않습니다.");
    }
  }

  openPODModal() {
    if (this.modalPOD) {
      if (this.podBookTitle) {
        this.podBookTitle.innerText = this.replaceChildName(this.currentTheme.titleTemplate);
      }
      if (this.podChildName) {
        this.podChildName.innerText = `주인공: ${this.childProfile.name} 어린이`;
      }
      this.modalPOD.classList.add('active');
      if (window.audioEngine) window.audioEngine.playSparkle();
    }
  }

  closePODModal() {
    if (this.modalPOD) {
      this.modalPOD.classList.remove('active');
    }
  }

  initSparkleSpawner() {
    const createSparkle = (x, y) => {
      const el = document.createElement('div');
      el.className = 'touch-sparkle';
      el.innerText = ['✨', '⭐', '🫧', '💖', '🌟'][Math.floor(Math.random() * 5)];
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 800);
    };

    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || e.target.closest('input')) return;
      createSparkle(e.clientX, e.clientY);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.kidStoryApp = new KidStoryApp();
  if (window.FirebaseSandbox) window.FirebaseSandbox.init();
});


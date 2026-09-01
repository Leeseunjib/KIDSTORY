/**
 * 🧪 KidStory Firebase Sandbox Service (kidstory-sandbox-2026)
 * - 샌드박스 테스트 환경 전용 Firebase 브릿지
 * - Firestore 연동: 사용자 프로필, 생성된 맞춤 동화, 독서 기록 동기화
 * - 오프라인 Fallback: 네트워크 단절 또는 미연결 시 LocalStorage 자동 백업 지원
 */

const FIREBASE_SANDBOX_CONFIG = {
  projectId: "kidstory-sandbox-2026",
  appId: "1:167029280656:web:fcfe7b0c2a92b79a016d15",
  storageBucket: "kidstory-sandbox-2026.firebasestorage.app",
  apiKey: "AIzaSyAvukuHXeD0n_jDANW66V5sCo7PgMbU1BQ",
  authDomain: "kidstory-sandbox-2026.firebaseapp.com",
  messagingSenderId: "167029280656",
  projectNumber: "167029280656",
  isSandbox: true
};

class FirebaseSandboxService {
  constructor() {
    this.config = FIREBASE_SANDBOX_CONFIG;
    this.isInitialized = false;
    this.db = null;
    this.auth = null;
    this.currentUserId = "sandbox_user_" + (localStorage.getItem("kidstory_sandbox_uid") || this.generateUid());
    console.log(`[Firebase Sandbox] 초기화 대기 중... (Active Project: ${this.config.projectId})`);
  }

  generateUid() {
    const uid = Math.random().toString(36).substring(2, 9);
    localStorage.setItem("kidstory_sandbox_uid", uid);
    return uid;
  }

  // Firebase 초기화 (CDN 방식 호환)
  async init() {
    try {
      if (window.firebase) {
        if (!firebase.apps.length) {
          firebase.initializeApp(this.config);
        }
        this.db = firebase.firestore ? firebase.firestore() : null;
        this.auth = firebase.auth ? firebase.auth() : null;
        this.isInitialized = true;
        console.log("✅ [Firebase Sandbox] Firebase SDK 연결 성공 (kidstory-sandbox-2026)");
      } else {
        console.warn("⚠️ [Firebase Sandbox] Firebase CDN 미로드 상태 -> LocalStorage Fallback 모드로 작동합니다.");
      }
    } catch (err) {
      console.warn("⚠️ [Firebase Sandbox] 초기화 경고 (Fallback 모드 작동):", err.message);
    }
  }

  // 1. 아이 프로필 및 커스텀 캐릭터 저장
  async saveChildProfile(profileData) {
    const data = {
      ...profileData,
      updatedAt: new Date().toISOString(),
      environment: "sandbox"
    };

    // 로컬 우선 백업
    localStorage.setItem("kidstory_profile_sandbox", JSON.stringify(data));

    if (this.isInitialized && this.db) {
      try {
        await this.db.collection("users").doc(this.currentUserId).set(data, { merge: true });
        console.log("☁️ [Firebase Sandbox] 아이 프로필 클라우드 동기화 완료:", data);
        return { success: true, cloud: true };
      } catch (e) {
        console.warn("☁️ [Firebase Sandbox] 클라우드 저장 실패, 로컬에 저장됨:", e.message);
      }
    }
    return { success: true, cloud: false };
  }

  // 2. 생성된 맞춤 동화 저장
  async saveCustomStory(storyData) {
    const storyId = storyData.id || "story_" + Date.now();
    const payload = {
      ...storyData,
      storyId,
      userId: this.currentUserId,
      createdAt: new Date().toISOString(),
      environment: "sandbox"
    };

    // 로컬 저장소 캐싱
    const localStories = JSON.parse(localStorage.getItem("kidstory_custom_stories_sandbox") || "[]");
    localStories.unshift(payload);
    localStorage.setItem("kidstory_custom_stories_sandbox", JSON.stringify(localStories.slice(0, 20)));

    if (this.isInitialized && this.db) {
      try {
        await this.db.collection("stories").doc(storyId).set(payload);
        console.log("☁️ [Firebase Sandbox] 맞춤 동화 Firestore 저장 완료:", storyId);
        return { success: true, storyId, cloud: true };
      } catch (e) {
        console.warn("☁️ [Firebase Sandbox] Firestore 저장 실패, 로컬 캐시 사용:", e.message);
      }
    }
    return { success: true, storyId, cloud: false };
  }

  // 3. 서재 목록 가져오기 (클라우드 + 로컬 병합)
  async getCustomStories() {
    let stories = JSON.parse(localStorage.getItem("kidstory_custom_stories_sandbox") || "[]");

    if (this.isInitialized && this.db) {
      try {
        const snapshot = await this.db.collection("stories")
          .where("userId", "==", this.currentUserId)
          .limit(20)
          .get();

        if (!snapshot.empty) {
          const cloudStories = [];
          snapshot.forEach(doc => cloudStories.push(doc.data()));
          // 클라우드 데이터 우선 적용
          stories = cloudStories;
        }
      } catch (e) {
        console.warn("☁️ [Firebase Sandbox] Firestore 조회 실패, 로컬 캐시 반환:", e.message);
      }
    }
  // 4. 구글 실제 로그인 (Google Sign-In with Firebase Auth)
  async loginWithGoogle() {
    await this.init();

    if (window.location.protocol === 'file:') {
      console.warn("⚠️ [Firebase Auth] file:// 프로토콜에서는 Google OAuth 팝업이 차단됩니다. 샌드박스 게스트 또는 호스팅 주소(https://kidstory-sandbox-2026.web.app)에서 실물 로그인이 실행됩니다.");
      const demoUser = {
        name: "구글 부모님 (로컬 테스트)",
        email: "parent@google.com",
        photoURL: null,
        uid: this.currentUserId,
        provider: "google",
        emoji: "🌐"
      };
      return { success: true, user: demoUser, isLocalFallback: true };
    }

    if (!this.auth) {
      return { success: false, error: "Firebase Auth SDK가 로드되지 않았습니다." };
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await this.auth.signInWithPopup(provider);
      const user = result.user;

      const profile = {
        name: user.displayName || "구글 부모님",
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
        provider: "google",
        emoji: "🌐",
        loginAt: new Date().toISOString()
      };

      this.currentUserId = user.uid;
      localStorage.setItem("kidstory_sandbox_uid", user.uid);
      localStorage.setItem("kidstory_user", JSON.stringify(profile));

      // Firestore에 사용자 등록
      if (this.db) {
        await this.db.collection("users").doc(user.uid).set({
          ...profile,
          lastLoginAt: new Date().toISOString()
        }, { merge: true });
      }

      console.log("✅ [Firebase Auth] Google 로그인 성공:", profile);
      return { success: true, user: profile };
    } catch (err) {
      console.error("❌ [Firebase Auth] Google 로그인 에러:", err.message);
      return { success: false, error: err.message };
    }
  }

  // 5. 로그아웃
  async logout() {
    if (this.auth) {
      try {
        await this.auth.signOut();
      } catch (e) {}
    }
    localStorage.removeItem("kidstory_user");
    this.currentUserId = "sandbox_user_" + this.generateUid();
    console.log("👋 [Firebase Auth] 로그아웃 완료");
  }
}

// 전역 인스턴스 등록
window.FirebaseSandbox = new FirebaseSandboxService();

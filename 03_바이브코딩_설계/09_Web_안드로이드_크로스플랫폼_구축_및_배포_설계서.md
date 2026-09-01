# 🚀 KidStory Web & 안드로이드 크로스플랫폼 구축 및 배포 설계서

> **문서 코드.** `KIDSTORY-CROSSPLATFORM-WEB-ANDROID-20260901`  
> **버전.** v1.0 (정본)  
> **총괄 리드.** 이건우 대표님  
> **담당 에이전트.** CTO 거누 (인프라/아키텍처 총괄)  
> **목표 플랫폼.** 🌐 **Web (PWA / Mobile Web)** & 🤖 **Android (Google Play Store / TWA / Native App)**  
> **등록 패키지.** `com.beauscreators.kidstory`  

---

## 1. 🌟 Web & 안드로이드 듀얼 트랙 전략 (Dual-Track Architecture)

KidStory는 **단일 고감도 코드베이스(Single Core Codebase)**를 기반으로, **Web과 Android 두 환경 모두에서 100% 네이티브급 60FPS 성능과 카메라 AR 인터랙션을 즉시 제공**할 수 있도록 설계되었습니다.

```
                  ┌──────────────────────────────────────────────┐
                  │    KidStory Core Interactive Engine (app/)    │
                  │  - HTML5 / CSS3 / Vanilla JS                  │
                  │  - Google MediaPipe Tasks Vision (On-Device) │
                  │  - Web Audio & TTS Highlight Engine          │
                  │  - Firebase Sandbox & PayPal Sandbox SDK     │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
  🌐 [트랙 1: Web / PWA 배포]                     🤖 [트랙 2: Android 앱 패키징]
  • Firebase Hosting (`kidstory-sandbox-2026`)     • Google Play Store 정식 앱 (`.aab`)
  • PWA Standalone (홈 화면 추가)                  • TWA (Trusted Web Activity) / Capacitor
  • Service Worker 오프라인 캐싱                   • Android Camera / Audio 네이티브 권한
  • URL 즉시 공유 및 바이럴 유입                  • 인앱 결제(IAP) & 푸시 알림 연계
```

---

## 2. 🌐 [트랙 1] Web & PWA 구축 명세

### 2-1. PWA Standalone 설정
- **매니페스트 ([`app/manifest.json`](file:///c:/BeausCreators/03.Research/바이브코딩%20연구/KidStory/app/manifest.json))**:
  - `display: standalone`: 브라우저 주소창을 제거하여 100% 전체화면 앱 몰입도 제공
  - `orientation: portrait-primary`: 유아 사용에 최적화된 세로 화면 고정
  - `theme_color: #FF6B6B`: 산뜻한 코랄 핑크 테마 컬러
- **오프라인 서비스 워커 ([`app/sw.js`](file:///c:/BeausCreators/03.Research/바이브코딩%20연구/KidStory/app/sw.js))**:
  - 동화 시나리오, 삽화 SVG, 오디오 효과음, 뷰어 스크립트 사전 캐싱
  - 비행기 모드나 네트워크가 끊긴 환경에서도 동화책과 터치 게임 100% 정상 구동

### 2-2. 클라우드 호스팅 배포
- **호스팅 플랫폼**: Firebase Hosting (`kidstory-sandbox-2026.web.app`)
- **배포 설정 ([`firebase.json`](file:///c:/BeausCreators/03.Research/바이브코딩%20연구/KidStory/firebase.json))**:
  - 정적 루트: `"app"`
  - SPA URL 리라이트 지원: `{"source": "**", "destination": "/index.html"}`

---

## 3. 🤖 [트랙 2] Android 앱 구축 및 패키징 명세

### 3-1. Firebase Android App 등록 현황
- **패키지명 (Package Name)**: `com.beauscreators.kidstory`
- **Firebase App ID**: `1:167029280656:android:4d753fdaeead1b02016d15`
- **프로젝트 ID**: `kidstory-sandbox-2026`
- **SDK 구성 파일**: `google-services.json` 연동 완료

### 3-2. 안드로이드 필수 권한 (AndroidManifest.xml)
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.beauscreators.kidstory">

    <!-- 📷 Google MediaPipe AI 카메라 양치 인터랙션 필수 권한 -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.front" android:required="true" />

    <!-- 🎙️ 부모 음성 녹음 & TTS 음성 인식 권한 -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <!-- 🌐 네트워크 및 클라우드 동기화 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
</manifest>
```

### 3-3. TWA(Trusted Web Activity) / Bubblewrap 원클릭 빌드 파이프라인
1. **Google Bubblewrap CLI를 통한 Android 프로젝트 생성**:
   ```bash
   npx @bubblewrap/cli init --manifest=https://kidstory-sandbox-2026.web.app/manifest.json
   ```
2. **디지털 자산 링크 (`.well-known/assetlinks.json`) 인증**:
   - Google Play 앱 서명 키(SHA-256)와 웹 도메인을 상호 인증하여 주소창 없는 순수 네이티브 윈도우로 실행

---

## 4. ⚡ Android WebView & MediaPipe 하드웨어 가속 최적화

1. **Hardware Acceleration 강제 활성화**:
   - 안드로이드 WebView에서 WebGL 및 WebAssembly GPU 가속을 100% 활용하여 MediaPipe 얼굴 추적 60FPS 보장
2. **미디어 권한 원활 자동 승인 (Permission Request Bridge)**:
   - `WebChromeClient.onPermissionRequest()`를 구현하여 인앱 브라우저에서 카메라/마이크 권한 팝업을 네이티브 스타일로 매끄럽게 처리

---

## 5. 📅 단계별 출시 일정표 (Release Roadmap)

| 단계 | 목표 기간 | 핵심 결과물 | 검증 및 배포 채널 |
| :--- | :--- | :--- | :--- |
| **Phase 1: Web MVP** | **현재 완료** | • PWA & 오프라인 SW 탑재<br>• MediaPipe AI 카메라 치카 게임<br>• Firebase Sandbox 연동 | Firebase Hosting (`kidstory-sandbox-2026.web.app`) |
| **Phase 2: Android Alpha** | 2026-09-02 | • TWA Android 프로젝트 빌드<br>• `com.beauscreators.kidstory.apk`<br>• 안드로이드 폰 카메라 AR 실기 테스트 | 내부 테스터 배포 (Firebase App Distribution) |
| **Phase 3: Play Store Beta** | 2026-09-05 | • Google Play Console 내부 테스트 트랙 등록<br>• 디지털 자산 링크 인증 완료 | Google Play Store Beta |

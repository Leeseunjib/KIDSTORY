# 📚 KidStory: 맞춤형 인터랙티브 키즈 동화 앱 (Research Workspace)

> **프로젝트명.** KidStory (Interactive Kids Playbook)  
> **연구 구분.** `03.Research / 바이브코딩 연구 / KidStory`  
> **총괄 리드.** 이건우 대표님  
> **아이디어 원천.** 스파크(Spark) 브레인스토밍 및 BSC 아이디어 뱅크  
> **포지션.** 세상에 하나뿐인 내 아이 맞춤형 인터랙티브 동화 & 양장본 그림책 플랫폼  

---

## 🗂️ 폴더 구조 및 아카이브 가이드

```
KidStory/
├── README.md                                  # [정본] 프로젝트 인덱스 및 전체 안내
│
├── 01_아이디어/                                # [아이디어 뱅크 원본 복제]
│   ├── 00_아이디어_인덱스.md                   # 아이디어 패키지 목차 및 비교 분석
│   ├── 2026-08-18_맞춤형_인터랙티브_키즈_동화_플랫폼_아이디어_v1.md # [v1] 스파크 원안 & 컨셉 스케치
│   └── 2026-08-20_맞춤형_인터랙티브_키즈_동화_플랫폼_아이디어_v2.md # [v2] 비즈니스 모델 & 실행 정본
│
├── 02_기획안_PRD/                              # [제품 기획 및 서비스 명세서]
│   ├── 02_프로토타입_상세_기획안.md             # MVP 화면별 와이어프레임 & 유저 플로우 & AC
│   ├── 03_Google_MediaPipe_카메라_AR_양치게임_상세기획안.md # [NEW] MediaPipe AR 카메라 기획안
│   └── 2026-08-18_맞춤형_인터랙티브_키즈_동화_플랫폼_PRD_초안.md # 서비스 기능/UX/AC 상세 PRD
│
├── 03_바이브코딩_설계/                         # [실제 구현 및 프로토타이핑 설계]
│   ├── 01_바이브코딩_아키텍처_설계서.md          # 웹/앱 인터랙티브 엔진, 캐릭터, 음성 구조
│   ├── 02_스텝별_구현_로드맵.md               # 단계별 프로토타입 빌드 및 검증 계획
│   ├── 03_디자인_시스템_및_UIUX_가이드.md        # Soft Pastel Storybook 가이드
│   ├── 04_심화_기술_기획서_및_파이프라인.md       # Face-to-Toon, TTS, POD 인쇄 파이프라인
│   ├── 05_음성_사운드_인터랙션_페이지별_활용_매뉴얼.md # 사운드 & 실시간 하이라이트 활용서
│   ├── 06_오픈모델_및_무료_AI_파이프라인_설계서.md # 오픈소스/무료 AI 파이프라인
│   ├── 07_KidStory_MCP_연동_및_인프라_아키텍처.md # Stitch/Firebase/PayPal MCP 연동 정본
│   ├── 08_Google_MediaPipe_카메라_AR_인터랙션_설계서.md # 실시간 카메라 AI 치카치카 AR 설계서
│   ├── 09_Web_안드로이드_크로스플랫폼_구축_및_배포_설계서.md # Web & Android 크로스플랫폼 설계서
│   └── 10_티니핑_로미_스타일_나노바나나_AI_프롬프트_파이프라인.md # [NEW] 티니핑 & 로미풍 AI 프롬프트 정본
│
├── 04_스토리_에셋/                             # [동화 시나리오 및 인터랙션 에셋]
│   └── 01_습관개선_양치모험_샘플스토리.md       # MVP 대표 템플릿: "치카치카 행성의 용사"
│
├── .cursor/                                   # [IDE MCP 설정]
│   └── mcp.json                               # Stitch, Firebase, PayPal, Netlify MCP
│
├── firebase.json                              # [클라우드 샌드박스] Hosting & Firestore 규칙
├── firestore.rules                            # [클라우드 샌드박스] Firestore 테스팅 보안규칙
│
└── app/                                       # 🚀 [실행 가능한 인터랙티브 웹 프로토타입]
    ├── index.html                             # 메인 인터랙티브 앱 화면
    ├── manifest.json                          # [NEW] Web App Manifest (PWA & Android 설치 지원)
    ├── sw.js                                  # [NEW] Service Worker (오프라인 캐싱 엔진)
    ├── css/
    │   └── style.css                          # 3D 양장본 & 파스텔 디자인 시스템
    └── js/
        ├── audioEngine.js                     # Web Audio 실시간 효과음 엔진
        ├── storyData.js                       # 6페이지 시나리오 및 변수 템플릿
        ├── miniGame.js                        # HTML5 Canvas 칫솔 드래그 미니게임
        ├── mediaPipeEngine.js                 # Google MediaPipe 온디바이스 카메라 AR 엔진
        ├── firebaseService.js                 # Firebase Sandbox 클라우드 동기화 모듈
        ├── paypalService.js                   # PayPal Sandbox 결제 모듈
        └── app.js                             # TTS 음성-단어 실시간 동기화 & POD 모달
```

---

## 🌟 핵심 컨셉 요약 (Core Value)

> **"아이 사진 1장으로 동화 속 주인공이 되고, 부모 목소리로 읽어주며, 터치 게임으로 올바른 생활 습관을 기르는 세상에 단 하나뿐인 인터랙티브 동화"**

| 축 | 내용 |
| :--- | :--- |
| **타깃 플랫폼** | 🌐 **Web (PWA / Mobile Web)** & 🤖 **Android (Google Play / TWA `com.beauscreators.kidstory`)** |
| **타깃 고객** | 3~7세 유아를 둔 부모 (양치, 편식, 수면, 정리정돈 등 생활습관 고민) |
| **핵심 경험** | ① 아이 얼굴 파스텔 캐릭터화 ② 실시간 MediaPipe AI 카메라 양치 AR ③ 음성 TTS/클로닝 ④ 실물 양장본 주문 |
| **비즈니스 모델** | 디지털 단건(₩9,900) + 실물 양장본 그림책(₩39,800) + 선물하기 SKU |


---

## 🔌 연동된 MCP (Model Context Protocol) 시스템

1. **🎨 Google Stitch MCP (`https://stitch.googleapis.com/mcp`)**
   - 동화 화면, 캐릭터 드레스업 뷰어, POD 주문서 등 신규 스크린 및 UI 디자인 시스템 자동 생성
2. **🔥 Firebase Sandbox MCP (`kidstory-sandbox-2026`)**
   - 사용자/아이 프로필, 생성된 맞춤 동화의 Firestore 클라우드 동기화 및 Firebase Hosting 배포
3. **💳 PayPal Sandbox MCP (`https://mcp.sandbox.paypal.com/http`)**
   - 디지털 동화 단건 ($7.99 / ₩9,900) 및 양장본 하드커버 POD ($29.99 / ₩39,800) 모의 결제 연동
4. **🌐 Netlify MCP (`@netlify/mcp`)**
   - 연구 프로토타입 브랜치 프리뷰 배포

---

## 🚀 바이브코딩(Vibe Coding) 연구 방향

1. **빠른 프로토타이핑 (Rapid Prototyping)**: 
   - 프론트엔드 인터랙티브 동화 뷰어 (페이지 넘김 효과, 탭 터치 파티클, BGM/보이스 재생)
2. **부모 게이트 & 아이 플레이어 분리**:
   - 부모 설정 모드 (아이 이름, 성별, 습관 고민 선택) vs 아이 몰입 독서 모드
3. **인터랙티브 미니게임 통합**:
   - 동화 씬 중간에 인터랙티브 캔버스/터치 요소(예: 치아 위의 충치 세균 터치하여 거품 내기) 삽입
4. **MCP 기반 자율 에이전트 워크플로우**:
   - Stitch MCP로 디자인 확장, Firebase로 데이터 저장/배포, PayPal로 BM 검증


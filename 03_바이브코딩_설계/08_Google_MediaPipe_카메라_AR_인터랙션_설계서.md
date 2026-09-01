# 📷 Google MediaPipe 온디바이스 카메라 AR 인터랙션 설계서

> **문서 구분.** `03.Research / 바이브코딩 연구 / KidStory`  
> **총괄 리드.** 이건우 대표님  
> **담당 에이전트.** CTO 거누 (AI 비전 & 실시간 인터랙션 엔진)  
> **기반 기술.** Google MediaPipe Solutions (Vision Tasks: Face Landmarker, Gesture, Pose)  
> **공식 레퍼런스.** `https://developers.google.com/edge/mediapipe/solutions/guide`

---

## 1. 🌟 기획 배경 및 핵심 가치 (Core Innovation)

> **"단순히 손가락으로 문지르는 화면 터치 게임을 넘어, 아이가 진짜 칫솔을 들고 카메라 앞에 서면 얼굴을 인식하고 입 주변에 알록달록 거품과 충치몬이 나타나는 마법 같은 실시간 AR 동화 경험"**

| 기존 터치 게임의 한계 | Google MediaPipe 기반 실시간 카메라 AR 혁신 |
| :--- | :--- |
| 스마트폰 화면을 손가락으로 긁는 수동적 조작 | **실제 칫솔을 잡고 입을 닦는 신체 행동 유도 (진짜 습관 형성)** |
| 동화 캐릭터와 현실 아이의 분리 | **아이 본인의 얼굴 위에 직접 씌워지는 3D 파스텔 AR 필터 & 거품 효과** |
| 서버 영상 전송 시 어린이 프라이버시 우려 | **100% 온디바이스 WebAssembly/WebGL 연산 (영상 외부 유출 0%)** |

---

## 2. 🤖 Google MediaPipe Solutions 연동 아키텍처

```
[사용자 기기 (스마트폰 / 태블릿 전면 카메라)]
                  │
                  ▼ (WebRTC 60FPS 스트림)
┌─────────────────────────────────────────────────────────────┐
│  Google MediaPipe Tasks Vision Web SDK (On-Device WASM/GPU) │
│  - Face Landmarker (468+ 3D Face Keypoints)                 │
│  - Blendshapes & Mouth Motion Vector Tracker                │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼ (실시간 랜드마크 추출)
┌─────────────────────────────────────────────────────────────┐
│  KidStory AR Canvas Engine (mediaPipeEngine.js)             │
│  ① 입술(Lips) / 치아 영역 정밀 트래킹                      │
│  ② 칫솔질 모션(Brushing Velocity & Shake) 실시간 감지       │
│  ③ AR 3D 거품 파티클 & 충치몬 퇴치 렌더링                   │
│  ④ 찰칵! 영웅 훈장 기념 셀카 캡처 & 서재 저장              │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼
         [동화 시나리오 자동 연계 클리어]
```

---

## 3. 🎯 핵심 4대 인터랙티브 카메라 모드 설계

### 🪥 모드 1: 실시간 AI 치카치카 AR 모험 (양치질 습관)
- **추적 대상**: 입술 윤곽 랜드마크 (Points 13, 14, 78, 308, 61, 291) 및 입 주변 모션 벡터
- **인터랙션 메커니즘**:
  1. 아이가 카메라를 보면 입 주변에 보랏빛 **장난꾸러기 충치몬(👾)** 5마리가 매달려 있음
  2. 아이가 진짜 칫솔(또는 손)을 입에 대고 슥삭슥삭 문지르면 모션 주파수를 감지
  3. 문지를 때마다 입술 주변에 **뽀글뽀글 파스텔 무지개 거품(🫧)** 생성 & 샤카샤카 실시간 효과음
  4. 3~5회 문지를 때마다 충치몬이 "앗 차가워!" 하며 별똥별(⭐)로 정화되며 점수 획득
  5. 5마리 모두 퇴치 시 하얀 치아 반짝이 이펙트 & "치카 영웅 훈장" 수여

### 🥦 모드 2: 골고루 냠냠 AR 먹방 게임 (편식 습관)
- **추적 대상**: 입 벌림 거리 (Mouth Open Ratio: Upper Lip vs Lower Lip Distance)
- **인터랙션**: 동화 속 편식 요정(당근, 브로콜리)이 날아다니다가, 아이가 "아~~" 하고 입을 크게 벌리면 입 속으로 쏙 들어가며 냠냠 효과음과 함께 건강 에너지 게이지 충전!

### 🌙 모드 3: 스르륵 밤잠 수면 유도 모드 (수면 습관)
- **추적 대상**: 눈 깜빡임 및 눈 감음 지속 시간 (Eye Blink / Eye Aspect Ratio)
- **인터랙션**: 아이가 눈을 감으면 화면이 점차 따뜻한 남색 밤하늘로 디밍되며 별똥별이 쏟아지고 잔잔한 자장가 오르골이 흘러나옴. 5초 이상 감고 있으면 달님이 미소 지으며 잠자리 동화 완료.

### 👑 모드 4: 방긋방긋 영웅 변신 AR 필터 (마음/표정 습관)
- **추적 대상**: 미소 감지 (Smile Blendshape / Mouth Smile Ratio)
- **인터랙션**: 아이가 환하게 활짝 웃으면 머리 위에 반짝이는 황금 왕관이 씌워지고 양 어깨에 마법 날개가 펼쳐짐.

---

## 4. 🔒 어린이 프라이버시 & 성능 최적화 보장 (Zero Leakage)

1. **완전 온디바이스 실행 (100% On-Device)**:
   - `@mediapipe/tasks-vision`을 브라우저의 WebAssembly와 WebGL 가속을 통해 기기 내부에서만 실행합니다.
   - 카메라 스트림 프레임은 절대로 백엔드나 클라우드로 전송되지 않습니다.
2. **카메라 미지원 기기 무중단 Fallback (Seamless Fallback)**:
   - 카메라 권한을 거부하거나 조명이 어두운 환경에서는 0.1초 만에 기존 **터치 드래그 캔버스 모드**로 즉시 전환되어 동화 진행이 중단되지 않습니다.
3. **가벼운 연산 (Mobile 60FPS)**:
   - 모델 경량화(Task Vision Lite) 및 프레임 스킵 최적화로 저사양 스마트폰에서도 부드러운 60FPS를 유지합니다.

---

## 5. 🛠️ 구현 파일 맵

- [`app/js/mediaPipeEngine.js`](file:///c:/BeausCreators/03.Research/바이브코딩%20연구/KidStory/app/js/mediaPipeEngine.js): MediaPipe Face Landmarker 초기화, WebRTC 카메라 바인딩, 모션/입술 감지 및 AR 오버레이 파티클 렌더러
- [`app/js/miniGame.js`](file:///c:/BeausCreators/03.Research/바이브코딩%20연구/KidStory/app/js/miniGame.js): 터치 모드 vs AI 카메라 AR 모드 스위처 통합
- [`app/css/style.css`](file:///c:/BeausCreators/03.Research/바이브코딩%20연구/KidStory/app/css/style.css): 전면 카메라 거울 뷰(Mirrored Video), 둥근 코너 AR 뷰포트, 모드 전환 토글 HUD 스타일

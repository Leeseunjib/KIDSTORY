# 🔌 KidStory MCP 전사 연동 및 샌드박스 인프라 아키텍처

> **연구 구분.** `03.Research / 바이브코딩 연구 / KidStory`  
> **환경 모드.** 🧪 **Sandbox (Testing App Mode)**  
> **총괄 리드.** 이건우 대표님  
> **담당 에이전트.** CTO 거누 (인프라/백엔드/MCP 아키텍처)  
> **연동 대상 MCP.** Google Stitch MCP, Firebase MCP, PayPal MCP, Netlify MCP

---

## 1. 🛡️ 샌드박스(Sandbox) 테스팅 환경 원칙

1. **안전 격리 (Safe Isolation)**: 본 프로젝트는 연구 및 프로토타입 샌드박스(`03.Research`)로 작동하며, 모든 클라우드 DB, 호스팅, 결제 처리는 샌드박스/테스트 계정으로 격리됩니다.
2. **실제 과금 방지 (Zero Charge)**: PayPal 및 Firebase는 무료/샌드박스 티어 및 모의 시뮬레이터를 사용하여 과금 발생을 차단합니다.
3. **데이터 유실 방지 및 오프라인 Fallback**: 네트워크가 없거나 API 토큰이 비활성화된 상태에서도 LocalStorage 기반 Fallback 엔진이 100% 정상 작동합니다.

---

## 2. 🌐 MCP 연동 구성 현황

```
KidStory Research Workspace
├── 🎨 Google Stitch MCP  ───> UI 화면 자동 생성, 디자인 시스템 토큰 추출, 뷰어 베리에이션
├── 🔥 Firebase MCP        ───> kidstory-sandbox-2026 (Auth, Firestore 클라우드 동기화, Hosting)
├── 💳 PayPal Sandbox MCP  ───> 디지털 동화 단건 ($7.99) & POD 양장본 실물 주문 ($29.99) 모의 결제
└── 🌐 Netlify MCP        ───> 정적 프리뷰 배포 및 도메인 바인딩
```

| MCP 서버명 | 연동 방식 | 엔드포인트 / 실행 커맨드 | 주요 역할 및 활용 시나리오 |
| :--- | :--- | :--- | :--- |
| **Stitch MCP** | Remote URL / Antigravity Native | `https://stitch.googleapis.com/mcp` | 동화책 UI 화면, 캐릭터 커스텀 스튜디오 뷰, 독서 인터랙션 화면 프롬프트 생성 |
| **Firebase MCP** | `firebase-tools mcp` | Project: `kidstory-sandbox-2026` | Firestore 아이 프로필 / 맞춤 동화 저장, Firebase Hosting 배포 |
| **PayPal MCP** | `mcp-remote` / Sandbox | `https://mcp.sandbox.paypal.com/http` | 양장본 POD 실물 주문 결제 시뮬레이션, 월간 동화 구독 플랜 생성 |
| **Netlify MCP** | `@netlify/mcp` | npx runner | 연구 프로토타입 브랜치별 프리뷰 배포 |

---

## 3. 🎨 1. Google Stitch MCP 실무 활용 가이드

Stitch MCP는 텍스트 프롬프트만으로 완성도 높은 HTML/CSS UI 스크린과 디자인 시스템을 추출할 수 있습니다.

### 주요 도구
- `generate_screen_from_text`: 새로운 KidStory 화면 생성
- `generate_variants`: 테마별(양치/편식/수면/우주) UI 변형 생성
- `apply_design_system` / `create_design_system`: Soft Pastel Storybook 디자인 토큰 적용

### 프롬프트 템플릿 예시
```text
KidStory Interactive Book Reader:
A 3D hardcover book aesthetic for a 4-year-old child named 'Minwoo'. 
Pastel rainbow gradients, rounded buttons with bouncy micro-animations, 
a character illustration on the left, and a speech-synced text area on the right.
```

---

## 4. 🔥 2. Firebase Sandbox (`kidstory-sandbox-2026`) 연동 가이드

### 환경 정보 (Environment Specs)
- **Active Project ID**: `kidstory-sandbox-2026` (KidStory Sandbox Test)
- **Web App ID**: `1:167029280656:web:fcfe7b0c2a92b79a016d15`
- **Hosting Site**: `kidstory-sandbox-2026`
- **클라이언트 서비스 모듈**: `app/js/firebaseService.js` (`window.FirebaseSandbox`)

### Firestore 데이터 모델 구조 (Sandbox Schema)
```
users/ (Collection)
 └── {userId} (Document)
      ├── name: "민우"
      ├── gender: "boy"
      ├── age: 4
      ├── outfit: "hero"
      ├── habitTheme: "teeth"
      └── updatedAt: "2026-09-01T..."

stories/ (Collection)
 └── {storyId} (Document)
      ├── userId: "sandbox_user_abc123"
      ├── title: "치카치카 별을 구한 용사 민우"
      ├── habitTheme: "teeth"
      ├── totalPages: 6
      └── createdAt: "2026-09-01T..."
```

### Firebase MCP 배포 명령어
```bash
# Antigravity 에이전트 도구 호출
call_mcp_tool -> ServerName: "firebase-mcp-server", ToolName: "firebase_deploy"
```

---

## 5. 💳 3. PayPal Sandbox 결제 시스템 연동

### 가격 정책 & 상품 SKU
| 상품 코드 | 상품명 | 샌드박스 USD | 원화 환산 |
| :--- | :--- | :--- | :--- |
| `digitalSingle` | 맞춤 디지털 동화 1권 영구 소장 | **$7.99** | ₩9,900 |
| `podHardcover` | 세상에 단 한 권뿐인 프리미엄 양장본 그림책 (무료배송) | **$29.99** | ₩39,800 |
| `monthlyClub` | KidStory 스토리북 월간 구독 클럽 (매월 2권) | **$14.99/월** | ₩19,800/월 |

### 클라이언트 호출 인터페이스 (`app/js/paypalService.js`)
```javascript
// 양장본 그림책 샌드박스 모의 결제 실행
const result = await window.PayPalSandbox.processSandboxCheckout('podHardcover', {
  childName: '민우',
  dedication: '사랑하는 우리 아이에게'
});

console.log(result.receipt.orderId); // "SANDBOX_ORDER_XXXX"
```

---

## 6. ⚙️ IDE 설정 파일 연동 현황

### `.cursor/mcp.json`
```json
{
  "mcpServers": {
    "stitch": {
      "url": "https://stitch.googleapis.com/mcp"
    },
    "firebase": {
      "command": "npx",
      "args": ["-y", "firebase-tools", "mcp"]
    },
    "paypal": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.sandbox.paypal.com/http"]
    },
    "netlify": {
      "command": "npx",
      "args": ["-y", "@netlify/mcp"]
    }
  }
}
```

### `firebase.json`
- `hosting.public`: `"app"` (SPA 리라이트 및 로컬 에뮬레이터 포트 5000 바인딩)
- `firestore.rules`: 샌드박스 테스팅 전용 전체 읽기/쓰기 허용 규칙

/**
 * 💳 KidStory PayPal Sandbox Service
 * - 샌드박스 테스트 환경 결제 브릿지
 * - 디지털 동화 단건 ($7.99 / ₩9,900) 및 양장본 POD 실물 주문 ($29.99 / ₩39,800)
 * - Sandbox Client ID & Mock Fallback 결제 시뮬레이션 지원
 */

const PAYPAL_SANDBOX_CONFIG = {
  clientId: "sb", // PayPal Standard Sandbox Client
  currency: "USD",
  environment: "sandbox",
  pricing: {
    digitalSingle: { usd: "7.99", krw: "9,900", name: "KidStory 맞춤 디지털 동화 1권" },
    podHardcover: { usd: "29.99", krw: "39,800", name: "KidStory 세상에 단 하나뿐인 프리미엄 양장본 그림책 (무료배송)" },
    monthlyClub: { usd: "14.99", krw: "19,800", name: "KidStory 스토리북 월간 구독 클럽" }
  }
};

class PayPalSandboxService {
  constructor() {
    this.config = PAYPAL_SANDBOX_CONFIG;
    this.isSdkLoaded = false;
    console.log("[PayPal Sandbox] 샌드박스 결제 모듈 대기 중...");
  }

  // 1. 모의 샌드박스 주문 생성 및 처리 (UI 즉시 반응형)
  async processSandboxCheckout(itemType, customMeta = {}) {
    const item = this.config.pricing[itemType] || this.config.pricing.podHardcover;
    const orderId = "SANDBOX_ORDER_" + Math.random().toString(36).substring(2, 10).toUpperCase();

    console.log(`💳 [PayPal Sandbox] 모의 결제 시작: ${item.name} ($${item.usd} / ₩${item.krw})`);

    return new Promise((resolve) => {
      // 샌드박스 결제 시뮬레이션 지연 (0.8초)
      setTimeout(() => {
        const receipt = {
          orderId,
          status: "COMPLETED",
          item: item.name,
          amount: item.usd,
          currency: "USD",
          krwEquivalent: item.krw,
          environment: "sandbox",
          paidAt: new Date().toISOString(),
          customerName: customMeta.childName || "민우",
          dedication: customMeta.dedication || "사랑하는 우리 아이에게"
        };

        // 로컬 영수증 보관
        const orders = JSON.parse(localStorage.getItem("kidstory_sandbox_orders") || "[]");
        orders.unshift(receipt);
        localStorage.setItem("kidstory_sandbox_orders", JSON.stringify(orders));

        console.log("✅ [PayPal Sandbox] 샌드박스 결제 완료 영수증:", receipt);
        resolve({ success: true, receipt });
      }, 800);
    });
  }

  // 2. 샌드박스 주문 내역 조회
  getSandboxOrders() {
    return JSON.parse(localStorage.getItem("kidstory_sandbox_orders") || "[]");
  }
}

// 전역 인스턴스 등록
window.PayPalSandbox = new PayPalSandboxService();

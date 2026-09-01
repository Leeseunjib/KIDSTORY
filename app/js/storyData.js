/**
 * KidStory Premium Storybook Data Engine
 * 최고급 동화 작가 수준의 자연스러운 한국어 문장과 감성적인 4대 테마 동화
 */

window.storyThemes = {
  teeth: {
    id: "teeth",
    titleTemplate: "치카치카 별을 구한 용사 {{CHILD_NAME}}",
    subTitle: "반짝반짝 하얀 이와 무지개 거품의 비밀",
    themeColor: "#48C9B0",
    badge: "🦷 양치질 습관",
    coverTag: "치카치카 행성 편",
    totalPages: 6,
    pages: [
      {
        pageNumber: 1,
        title: "달콤한 딸기 사탕 나라의 밤",
        sceneType: "bedtime_candy",
        bgGradient: "linear-gradient(135deg, #FFF0DB 0%, #FFD6A5 100%)",
        narration: "오늘 밤에도 {{CHILD_NAME}}(은)는 달콤한 딸기 사탕과 젤리를 맛있게 냠냠 먹었어요. 포근한 이불 속으로 쏙 들어가자 눈꺼풀이 스르륵 무거워졌지요. '에이, 오늘은 졸리니까 하루만 안 닦고 잘래!'",
        illustration: {
          characterState: "eating_candy",
          sceneTheme: "cozy_room",
          primaryProps: ["lollipop", "bed", "moon", "star"]
        }
      },
      {
        pageNumber: 2,
        title: "어둠 속 보라색 충치몬의 습격!",
        sceneType: "cavity_attack",
        bgGradient: "linear-gradient(135deg, #2D1457 0%, #6C5CE7 100%)",
        narration: "앗, 바로 그때였어요! 달콤한 설탕 냄새를 맡고 장난꾸러기 보라색 충치몬들이 우르르 몰려왔어요! '히히히! 반짝이는 치아 성을 까맣게 칠해버리자!' 하얀 치아 요정들이 눈물을 글썽이며 외쳤어요. '용사 {{CHILD_NAME}}님, 우리를 도와주세요!'",
        illustration: {
          characterState: "surprised",
          sceneTheme: "tooth_castle_danger",
          primaryProps: ["monster", "castle", "lightning", "fairy"]
        }
      },
      {
        pageNumber: 3,
        title: "무지개 칫솔 검의 눈부신 각성",
        sceneType: "hero_awaken",
        bgGradient: "linear-gradient(135deg, #00B894 0%, #00CEC9 100%)",
        narration: "요정들의 울음소리에 {{CHILD_NAME}}(은)는 씩씩하게 일어났어요! 딸기 향 치약 마법을 두른 '무지개 칫솔 검'을 높이 치켜들었답니다. '치아 요정들아 걱정 마! 내가 무지개 거품으로 모두 깨끗하게 지켜줄게!'",
        illustration: {
          characterState: "hero_pose",
          sceneTheme: "magic_bubbles",
          primaryProps: ["toothbrush_sword", "rainbow", "bubbles", "sparkles"]
        }
      },
      {
        pageNumber: 4,
        title: "[미니게임] 치카치카 마법으로 충치몬을 물리쳐라!",
        sceneType: "interactive_game",
        isGamePage: true,
        gameType: "brush_teeth",
        bgGradient: "linear-gradient(135deg, #0984E3 0%, #74B9FF 100%)",
        narration: "화면의 마법 칫솔을 손가락으로 슥삭슥삭 문질러서 풍성한 거품을 내고, 나쁜 충치몬 5마리를 모두 물리쳐주세요!",
        illustration: {
          characterState: "gaming",
          sceneTheme: "game_canvas",
          primaryProps: ["game_brush", "foam", "teeth"]
        }
      },
      {
        pageNumber: 5,
        title: "눈부시게 되찾은 반짝반짝 미소",
        sceneType: "victory_teeth",
        bgGradient: "linear-gradient(135deg, #FDCB6E 0%, #FFEAA7 100%)",
        narration: "와아! {{CHILD_NAME}} 용사의 멋진 활약으로 치아 성이 눈부시게 하얗고 깨끗해졌어요! 기뻐하는 치아 요정들이 {{CHILD_NAME}}의 목에 '반짝 용사 황금 메달'을 걸어주었답니다. '고마워요 {{CHILD_NAME}}! 매일 밤 우리를 깨끗하게 지켜줄 거죠?'",
        illustration: {
          characterState: "proud_medal",
          sceneTheme: "victory_palace",
          primaryProps: ["gold_medal", "sparkle_tooth", "crown", "confetti"]
        }
      },
      {
        pageNumber: 6,
        title: "상쾌하고 포근한 꿈나라로",
        sceneType: "peaceful_sleep",
        bgGradient: "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)",
        narration: "입안 가득 상쾌한 민트 향과 딸기 향이 은은하게 퍼져요. '내일도 밥 먹고 나면 꼭 깨끗이 치카치카할 거야!' {{CHILD_NAME}}(은)는 행복한 미소를 지으며 달콤한 꿈나라로 떠났답니다. 잘 자요, 세상에서 제일 멋진 우리 용사님!",
        illustration: {
          characterState: "sleeping_peaceful",
          sceneTheme: "dreamland",
          primaryProps: ["dream_moon", "clouds", "teddy_bear", "warm_hug"]
        }
      }
    ]
  },
  veggie: {
    id: "veggie",
    titleTemplate: "무지개 채소 숲을 구한 모험가 {{CHILD_NAME}}",
    subTitle: "아삭아삭 당근과 초록 브로콜리의 슈퍼 파워",
    themeColor: "#2ECC71",
    badge: "🥦 편식 개선",
    coverTag: "채소 숲 편",
    totalPages: 6,
    pages: [
      {
        pageNumber: 1,
        title: "초록 채소가 싫었던 저녁 식사",
        sceneType: "bedtime_candy",
        bgGradient: "linear-gradient(135deg, #D4EDDA 0%, #C3E6CB 100%)",
        narration: "맛있는 저녁 시간, 식탁 위에 파릇파릇한 브로콜리와 주황빛 당근이 올라왔어요. {{CHILD_NAME}}(은)는 입술을 삐죽 내밀며 말했어요. '으응~ 고기랑 햄만 먹고 채소는 절대 안 먹을래요!'",
        illustration: { characterState: "eating_candy", sceneTheme: "cozy_room", primaryProps: ["plate", "veggies", "kitchen", "child"] }
      },
      {
        pageNumber: 2,
        title: "시들어가는 무지개 숲의 비타민 요정들",
        sceneType: "cavity_attack",
        bgGradient: "linear-gradient(135deg, #856404 0%, #D39E00 100%)",
        narration: "그때, 무지개 채소 숲의 비타민 요정들이 찾아와 눈물을 글썽였어요. '{{CHILD_NAME}} 용사님이 우리 채소를 먹어주지 않으면, 우리 숲의 알록달록한 무지개 빛이 영영 사라져버려요!'",
        illustration: { characterState: "surprised", sceneTheme: "tooth_castle_danger", primaryProps: ["fairy", "wilted_tree", "forest", "rain"] }
      },
      {
        pageNumber: 3,
        title: "아삭! 용기를 낸 첫 한 입의 마법",
        sceneType: "hero_awaken",
        bgGradient: "linear-gradient(135deg, #20BF6B 0%, #26DE81 100%)",
        narration: "요정들을 돕기 위해 {{CHILD_NAME}}(은)는 눈을 꼭 감고 달콤한 당근을 '아삭!' 크게 베어 물었어요. 그러자 씹을수록 달콤하고 고소한 마법의 힘이 온몸으로 퐁퐁 솟아올랐답니다!",
        illustration: { characterState: "hero_pose", sceneTheme: "magic_bubbles", primaryProps: ["carrot_magic", "energy", "glow", "sparkles"] }
      },
      {
        pageNumber: 4,
        title: "[미니게임] 싱그러운 비타민 햇살을 채워라!",
        sceneType: "interactive_game",
        isGamePage: true,
        gameType: "brush_teeth",
        bgGradient: "linear-gradient(135deg, #26DE81 0%, #48DBFB 100%)",
        narration: "화면을 부드럽게 문질러서 시든 숲속 식물들에게 싱그러운 비타민 물방울과 햇살 5개를 모두 선물해 주세요!",
        illustration: { characterState: "gaming", sceneTheme: "game_canvas", primaryProps: ["sun", "water_drop", "sprout"] }
      },
      {
        pageNumber: 5,
        title: "화려하게 피어난 황금 무지개 숲",
        sceneType: "victory_teeth",
        bgGradient: "linear-gradient(135deg, #FED330 0%, #FA8231 100%)",
        narration: "와아! {{CHILD_NAME}} 용사 덕분에 채소 숲이 눈부신 황금빛으로 가득 찼어요! 비타민 요정들이 키를 쑥쑥 자라게 해주는 '황금 성장 메달'을 선물하며 힘차게 손을 흔들었답니다.",
        illustration: { characterState: "proud_medal", sceneTheme: "victory_palace", primaryProps: ["growth_medal", "rainbow_forest", "cheer"] }
      },
      {
        pageNumber: 6,
        title: "쑥쑥 자라나는 건강한 내일로",
        sceneType: "peaceful_sleep",
        bgGradient: "linear-gradient(135deg, #4B6584 0%, #778CA3 100%)",
        narration: "'내일도 골고루 냠냠 맛있게 먹고 튼튼한 어린이가 될 거야!' 씩씩하고 건강해진 {{CHILD_NAME}}(은)는 기분 좋은 웃음을 지으며 편안한 꿈나라로 들어갔답니다. 사랑해요, 씩씩한 용사님!",
        illustration: { characterState: "sleeping_peaceful", sceneTheme: "dreamland", primaryProps: ["dream_moon", "strong_arm", "peaceful"] }
      }
    ]
  },
  sleep: {
    id: "sleep",
    titleTemplate: "별빛 요람으로 여행을 떠난 {{CHILD_NAME}}",
    subTitle: "밤하늘 은하수 열차와 은빛 꿈의 비밀",
    themeColor: "#9B59B6",
    badge: "🌙 수면 습관",
    coverTag: "꿈나라 편",
    totalPages: 6,
    pages: [
      {
        pageNumber: 1,
        title: "장난감을 더 가지고 놀고 싶던 밤",
        sceneType: "bedtime_candy",
        bgGradient: "linear-gradient(135deg, #E0D9F6 0%, #C8B6FF 100%)",
        narration: "시계 바늘이 째깍째깍 밤 9시를 가리켰지만, {{CHILD_NAME}}(은)는 장난감을 들고 더 놀고 싶었어요. '아직 하나도 안 졸려요! 블록 놀이 조금만 더 하면 안 돼요?'",
        illustration: { characterState: "eating_candy", sceneTheme: "cozy_room", primaryProps: ["clock_night", "toys", "cozy_lamp"] }
      },
      {
        pageNumber: 2,
        title: "창가로 찾아온 밤하늘 별빛 요정",
        sceneType: "cavity_attack",
        bgGradient: "linear-gradient(135deg, #1E272E 0%, #485460 100%)",
        narration: "창문 틈으로 은빛 반짝이가 사르르 쏟아지더니 다정한 별빛 요정이 찾아왔어요. '{{CHILD_NAME}} 용사님! 은하수 꿈나라 기차가 곧 출발해요. 어서 침대 요람에 올라타세요!'",
        illustration: { characterState: "surprised", sceneTheme: "tooth_castle_danger", primaryProps: ["star_fairy", "window", "starlight_dust"] }
      },
      {
        pageNumber: 3,
        title: "포근한 구름 베개와 은하수 여행",
        sceneType: "hero_awaken",
        bgGradient: "linear-gradient(135deg, #3867D6 0%, #4B7BEC 100%)",
        narration: "{{CHILD_NAME}}(은)는 푹신한 구름 베개에 머리를 뉘고 향긋한 라벤더 이불을 폭 덮었어요. 눈을 감자 온몸이 따뜻해지며 별빛 하늘을 둥실둥실 떠다니는 기분이었지요.",
        illustration: { characterState: "hero_pose", sceneTheme: "magic_bubbles", primaryProps: ["cloud_bed", "lavender_mist", "floating"] }
      },
      {
        pageNumber: 4,
        title: "[미니게임] 밤하늘에 반짝이는 별자리를 켜라!",
        sceneType: "interactive_game",
        isGamePage: true,
        gameType: "brush_teeth",
        bgGradient: "linear-gradient(135deg, #1E272E 0%, #3867D6 100%)",
        narration: "화면을 부드럽게 쓰다듬어 밤하늘에 잠들어 있는 은하수 별 5개를 환하게 밝혀 꿈나라 길을 비춰주세요!",
        illustration: { characterState: "gaming", sceneTheme: "game_canvas", primaryProps: ["night_sky", "glowing_stars", "comet"] }
      },
      {
        pageNumber: 5,
        title: "신비로운 은하수 꿈나라 궁전 도착",
        sceneType: "victory_teeth",
        bgGradient: "linear-gradient(135deg, #8854D0 0%, #A55EEA 100%)",
        narration: "환하게 켜진 별빛 길을 따라 {{CHILD_NAME}}(은)는 꿈나라 궁전에 도착했어요! 밤하늘 여왕님이 '단잠을 지켜주는 은빛 요람 메달'을 걸어주며 따뜻하게 안아주었답니다.",
        illustration: { characterState: "proud_medal", sceneTheme: "victory_palace", primaryProps: ["dream_castle", "silver_medal", "moon_queen"] }
      },
      {
        pageNumber: 6,
        title: "행복한 아침을 약속하며 새근새근",
        sceneType: "peaceful_sleep",
        bgGradient: "linear-gradient(135deg, #2C3A47 0%, #130F40 100%)",
        narration: "새근새근... 고른 숨소리와 함께 밤하늘의 둥근 달님이 머리맡을 지켜주어요. 내일 아침에는 더 멋진 미소로 눈을 뜰 거예요. 좋은 꿈 꿔요, 사랑하는 우리 아이.",
        illustration: { characterState: "sleeping_peaceful", sceneTheme: "dreamland", primaryProps: ["crescent_moon", "stars", "sleeping_hug"] }
      }
    ]
  }
};

/**
 * 고품질 한국어 자연어 문장 정제 헬퍼 (Natural Korean Morphological Story Generator)
 */
window.generateCustomStoryAI = function(childName, rawTopic) {
  // 자연스러운 한국어 명사형/동사형 변환
  let cleanTopic = rawTopic.trim().replace(/하기$|줄이기$|먹기$|자기$|지내기$/, "");
  if (!cleanTopic) cleanTopic = "스스로 정리정돈";

  return {
    id: "custom_" + Date.now(),
    titleTemplate: `${cleanTopic}의 비밀을 찾아 떠난 용사 {{CHILD_NAME}}`,
    subTitle: `스스로 해내는 기쁨과 자신감을 선물하는 맞춤 모험 동화`,
    themeColor: "#E17055",
    badge: `✨ 맞춤 이야기 (${cleanTopic})`,
    coverTag: "맞춤 모험 편",
    totalPages: 6,
    pages: [
      {
        pageNumber: 1,
        title: `${cleanTopic} 앞에서 멈칫했던 저녁`,
        sceneType: "bedtime_candy",
        bgGradient: "linear-gradient(135deg, #FFEAA7 0%, #FAB1A0 100%)",
        narration: `오늘도 집 안에서 신나게 놀던 {{CHILD_NAME}}(은)는 ${cleanTopic}을(를) 마주하고 깊은 고민에 빠졌어요. '혼자서 하려니 조금 귀찮고 어렵기도 한걸요!'`,
        illustration: { characterState: "eating_candy", sceneTheme: "cozy_room", primaryProps: ["idea_bulb", "thinking", "child_room"] }
      },
      {
        pageNumber: 2,
        title: `도움을 청하러 온 마법 숲의 친구들`,
        sceneType: "cavity_attack",
        bgGradient: "linear-gradient(135deg, #2D1457 0%, #6C5CE7 100%)",
        narration: `바로 그때, 마법 숲의 꼬마 요정들이 찾아와 반짝이며 속삭였어요! '용기 있는 {{CHILD_NAME}} 용사님! 우리 숲 친구들에게 ${cleanTopic}의 멋진 비법을 가르쳐주세요!'`,
        illustration: { characterState: "surprised", sceneTheme: "tooth_castle_danger", primaryProps: ["magic_fairy", "forest", "call_help"] }
      },
      {
        pageNumber: 3,
        title: `가슴속 용기의 불꽃이 활활!`,
        sceneType: "hero_awaken",
        bgGradient: "linear-gradient(135deg, #00CEC9 0%, #0984E3 100%)",
        narration: `{{CHILD_NAME}}(은)는 주먹을 불끈 쥐고 활짝 웃었어요! '좋아, 나만 믿어! 하나씩 차근차근 해내면 ${cleanTopic}도 정말 즐거운 모험이 될 수 있어!'`,
        illustration: { characterState: "hero_pose", sceneTheme: "magic_bubbles", primaryProps: ["courage_flame", "hero_cape", "rainbow_light"] }
      },
      {
        pageNumber: 4,
        title: `[미니게임] 신비로운 마법 에너지를 모아라!`,
        sceneType: "interactive_game",
        isGamePage: true,
        gameType: "brush_teeth",
        bgGradient: "linear-gradient(135deg, #74B9FF 0%, #A29BFE 100%)",
        narration: `화면을 부지런히 문질러서 ${cleanTopic}을(를) 완벽하게 해내는 황금 마법 구슬 5개를 모두 모아주세요!`,
        illustration: { characterState: "gaming", sceneTheme: "game_canvas", primaryProps: ["magic_energy", "golden_orbs", "sparkles"] }
      },
      {
        pageNumber: 5,
        title: `마을 친구들의 뜨거운 환호와 박수`,
        sceneType: "victory_teeth",
        bgGradient: "linear-gradient(135deg, #55EFC4 0%, #FDCB6E 100%)",
        narration: `와아! {{CHILD_NAME}} 용사의 솔선수범 덕분에 마법 숲 전체가 환한 웃음과 빛으로 물들었어요! 요정들이 감사의 마음을 담아 '스스로 해낸 으뜸 용사 메달'을 목에 걸어주었답니다.`,
        illustration: { characterState: "proud_medal", sceneTheme: "victory_palace", primaryProps: ["master_medal", "applause", "golden_palace"] }
      },
      {
        pageNumber: 6,
        title: `자신감으로 가득 찬 행복한 꿈나라`,
        sceneType: "peaceful_sleep",
        bgGradient: "linear-gradient(135deg, #A29BFE 0%, #DFE6E9 100%)",
        narration: `'내일도 무엇이든 씩씩하게 스스로 해낼 수 있어!' 한 뼘 더 자란 {{CHILD_NAME}}(은)는 뿌듯한 마음을 안고 포근한 꿈나라로 떠났답니다. 참 자랑스러워요, 멋진 용사님!`,
        illustration: { characterState: "sleeping_peaceful", sceneTheme: "dreamland", primaryProps: ["sweet_dream", "proud_smile", "warm_blanket"] }
      }
    ]
  };
};

window.buildAuthorStory = function(title, pageInputs) {
  const pages = (pageInputs || [])
    .filter((p) => p && String(p.narration || "").trim())
    .map((p, i) => ({
      pageNumber: i + 1,
      title: String(p.title || `${i + 1}쪽`).trim() || `${i + 1}쪽`,
      narration: String(p.narration).trim(),
      imageUrl: p.imageUrl || null,
      bgGradient: "linear-gradient(135deg, #FFF0DB 0%, #FFD6A5 100%)",
      isGamePage: false,
      illustration: {
        characterState: "hero_pose",
        sceneTheme: "cozy_room",
        primaryProps: []
      }
    }));

  const bookTitle = String(title || "").trim() || "우리 아이가 나온 동화";
  return {
    id: "author_" + Date.now(),
    titleTemplate: bookTitle,
    subTitle: "부모님이 쓴 원고를 그대로 읽어 주는 동화",
    themeColor: "#E17055",
    badge: "📖 내가 쓴 동화",
    coverTag: "원고 낭독",
    totalPages: pages.length,
    source: "author",
    pages
  };
};

window.normalizeGeneratedStory = function(raw, childName, topic) {
  if (!raw || !Array.isArray(raw.pages) || raw.pages.length === 0) {
    return window.generateCustomStoryAI(childName, topic);
  }
  const pages = raw.pages
    .filter((p) => p && String(p.narration || "").trim())
    .map((p, i) => ({
      pageNumber: i + 1,
      title: String(p.title || `${i + 1}쪽`),
      narration: String(p.narration),
      imageUrl: p.imageUrl || null,
      bgGradient: p.bgGradient || "linear-gradient(135deg, #FFEAA7 0%, #FAB1A0 100%)",
      isGamePage: false,
      illustration: p.illustration || {
        characterState: "hero_pose",
        sceneTheme: "cozy_room",
        primaryProps: []
      }
    }));
  if (!pages.length) {
    return window.generateCustomStoryAI(childName, topic);
  }
  return {
    id: raw.id || ("ai_" + Date.now()),
    titleTemplate: raw.titleTemplate || raw.title || topic,
    subTitle: raw.subTitle || "매번 새로 쓰는 맞춤 동화",
    themeColor: raw.themeColor || "#E17055",
    badge: raw.badge || "✨ 오늘만의 이야기",
    coverTag: raw.coverTag || "오늘만의 이야기",
    totalPages: pages.length,
    source: raw.source || "ai",
    model: raw.model || "",
    pages
  };
};

/**
 * KidStory 동화 서재(Library) 도서 카탈로그 (지속 확장형)
 */
window.libraryCatalog = [
  {
    id: "teeth",
    category: "teeth",
    badge: "🦷 생활습관",
    badgeColor: "#48C9B0",
    coverIcon: "🪥",
    bgGradient: "linear-gradient(135deg, #00CEC9, #81ECEC)",
    title: "치카치카 별을 구한 용사",
    desc: "사탕 나라의 밤, 충치몬을 물리치고 하얀 치아 성을 지켜내는 신나는 양치 모험!",
    pages: 6,
    isReady: true
  },
  {
    id: "veggie",
    category: "veggie",
    badge: "🥦 바른식습관",
    badgeColor: "#2ECC71",
    coverIcon: "🥕",
    bgGradient: "linear-gradient(135deg, #26DE81, #A8E6CF)",
    title: "무지개 채소 숲의 모험가",
    desc: "아삭아삭 당근과 브로콜리의 슈퍼 비타민 파워로 시든 무지개 숲을 구하는 이야기!",
    pages: 6,
    isReady: true
  },
  {
    id: "sleep",
    category: "sleep",
    badge: "🌙 수면/마음",
    badgeColor: "#9B59B6",
    coverIcon: "🌙",
    bgGradient: "linear-gradient(135deg, #6C5CE7, #A29BFE)",
    title: "별빛 요람으로 떠난 여행",
    desc: "밤하늘 은하수 열차를 타고 포근한 구름 이불 속 달콤한 꿈나라로 떠나는 감성 동화.",
    pages: 6,
    isReady: true
  },
  {
    id: "custom_cleanup",
    category: "custom",
    badge: "✨ 스스로 습관",
    badgeColor: "#E17055",
    coverIcon: "🧸",
    bgGradient: "linear-gradient(135deg, #FAB1A0, #FFEAA7)",
    title: "장난감 마법 정리 상자의 비밀",
    desc: "어지럽혀진 방을 스스로 척척 정리하고 멋진 모범 용사 메달을 목에 거는 성장 스토리!",
    pages: 6,
    isReady: true
  },
  {
    id: "share_friends",
    category: "custom",
    badge: "🤝 우정/양보",
    badgeColor: "#FF7675",
    coverIcon: "💖",
    bgGradient: "linear-gradient(135deg, #FF7675, #FFAAA5)",
    title: "사이좋게 양보하는 무지개 우정",
    desc: "친구들과 함께 나누고 배려하며 더 큰 행복과 웃음을 발견하는 따뜻한 감동 동화.",
    pages: 6,
    isReady: true
  },
  {
    id: "upcoming_handwash",
    category: "teeth",
    badge: "🫧 청결/위생",
    badgeColor: "#74B9FF",
    coverIcon: "🧼",
    bgGradient: "linear-gradient(135deg, #74B9FF, #A29BFE)",
    title: "보글보글 비누방울 왕국의 모험",
    desc: "손 씻기 요정과 함께 세균 몬스터를 퐁퐁 씻어내는 청결 대작전! (업데이트 예정)",
    pages: 6,
    isReady: false
  }
];

# Gemini(1차)와 로컬 Gemma 4로 아이 동화 JSON을 만드는 모듈
"""키는 KidStory/.env 의 GEMINI_API_KEY 만 읽는다. 코드에 키를 넣지 않는다."""

from __future__ import annotations

import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
ROOT_DIR = APP_DIR.parent

GEMINI_MODELS = (
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-1.5-flash",
)

GEMMA_NAME_PREFIXES = ("gemma4", "gemma3", "gemma2")

PAGE_GRADIENTS = (
    "linear-gradient(135deg, #FFF0DB 0%, #FFD6A5 100%)",
    "linear-gradient(135deg, #2D1457 0%, #6C5CE7 100%)",
    "linear-gradient(135deg, #00B894 0%, #00CEC9 100%)",
    "linear-gradient(135deg, #0984E3 0%, #74B9FF 100%)",
    "linear-gradient(135deg, #FDCB6E 0%, #FFEAA7 100%)",
    "linear-gradient(135deg, #A29BFE 0%, #DFE6E9 100%)",
)

CHAR_STATES = (
    "eating_candy",
    "surprised",
    "hero_pose",
    "gaming",
    "proud_medal",
    "sleeping_peaceful",
)


def load_dotenv() -> None:
    for path in (ROOT_DIR / ".env", APP_DIR / ".env"):
        if not path.is_file():
            continue
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val


def gemini_key() -> str:
    return (os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or "").strip()


def ollama_host() -> str:
    return (os.environ.get("OLLAMA_HOST") or "http://127.0.0.1:11434").rstrip("/")


def _http_json(url: str, payload: dict | None, timeout: float) -> dict:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="GET" if payload is None else "POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8")
    return json.loads(body) if body else {}


def _extract_json(text: str) -> dict:
    raw = (text or "").strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("모델이 JSON을 주지 않았습니다.")
    return json.loads(raw[start : end + 1])


def _story_prompt(child_name: str, age: int, topic: str, seed: int) -> str:
    return (
        "너는 3~7세 한국 아이를 위한 동화 작가다. JSON만 출력한다.\n"
        f"아이 이름: {child_name}\n"
        f"나이: {age}세\n"
        f"주제: {topic}\n"
        f"이번 이야기 씨앗 번호: {seed}\n"
        "씨앗 번호가 다르면 사건·대사·소품을 완전히 다르게 쓴다. 같은 문장을 반복하지 않는다.\n"
        "규칙: 폭력·공포·성인 내용 금지. 짧은 구어체. 한 쪽은 2~4문장. "
        "주인공 이름은 JSON 문장 안에서 {{CHILD_NAME}} 로 쓴다. "
        "미니게임 페이지는 만들지 않는다. pages는 정확히 6개.\n"
        "형식: {\"title\":\"...\",\"badge\":\"...\",\"pages\":[{\"title\":\"...\",\"narration\":\"...\"}]}"
    )


def normalize_story(data: dict, child_name: str, topic: str, source: str, model: str) -> dict:
    pages_in = data.get("pages") if isinstance(data, dict) else None
    if not isinstance(pages_in, list):
        raise ValueError("pages 배열이 없습니다.")

    pages = []
    for item in pages_in[:6]:
        if not isinstance(item, dict):
            continue
        narration = str(item.get("narration") or "").strip()
        if child_name:
            narration = narration.replace(child_name, "{{CHILD_NAME}}")
        if not narration:
            continue
        title = str(item.get("title") or f"{len(pages) + 1}쪽").strip()[:40]
        if child_name:
            title = title.replace(child_name, "{{CHILD_NAME}}")
        idx = len(pages)
        pages.append({
            "pageNumber": idx + 1,
            "title": title or f"{idx + 1}쪽",
            "narration": narration[:800],
            "bgGradient": PAGE_GRADIENTS[idx % len(PAGE_GRADIENTS)],
            "isGamePage": False,
            "illustration": {
                "characterState": CHAR_STATES[idx % len(CHAR_STATES)],
                "sceneTheme": "cozy_room",
                "primaryProps": [],
            },
        })

    if len(pages) < 3:
        raise ValueError("이야기가 너무 짧습니다.")

    book_title = str(data.get("title") or f"{topic} 이야기").strip()[:80]
    if child_name:
        book_title = book_title.replace(child_name, "{{CHILD_NAME}}")
    badge = str(data.get("badge") or "✨ 오늘만의 이야기").strip()[:40]

    return {
        "id": f"ai_{int(time.time())}_{source}",
        "titleTemplate": book_title or "{{CHILD_NAME}}의 모험",
        "subTitle": "매번 새로 쓰는 맞춤 동화",
        "themeColor": "#E17055",
        "badge": badge,
        "coverTag": "오늘만의 이야기",
        "totalPages": len(pages),
        "source": source,
        "model": model,
        "pages": pages,
    }


def _gemini_story(prompt: str) -> tuple[dict, str]:
    key = gemini_key()
    if not key:
        raise RuntimeError("no-gemini-key")
    last_error = "Gemini 호출 실패"
    for model in GEMINI_MODELS:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 1.05,
                "responseMimeType": "application/json",
            },
        }
        try:
            raw = _http_json(url, payload, timeout=45)
            parts = (
                (((raw.get("candidates") or [{}])[0].get("content") or {}).get("parts")) or []
            )
            text = "".join(str(p.get("text") or "") for p in parts)
            return _extract_json(text), model
        except urllib.error.HTTPError as exc:
            last_error = f"Gemini {model}: HTTP {exc.code}"
            continue
        except Exception as exc:
            last_error = f"Gemini {model}: {exc}"
            continue
    raise RuntimeError(last_error)


def list_gemma_models() -> list[str]:
    try:
        raw = _http_json(f"{ollama_host()}/api/tags", None, timeout=1.5)
    except Exception:
        return []
    names = []
    for item in raw.get("models") or []:
        name = str(item.get("name") or "")
        if name:
            names.append(name)
    return names


def pick_gemma_model() -> str | None:
    forced = (os.environ.get("OLLAMA_MODEL") or "").strip()
    names = list_gemma_models()
    if forced:
        return forced if forced in names or not names else forced
    for prefix in GEMMA_NAME_PREFIXES:
        for name in names:
            if name.lower().startswith(prefix):
                return name
    return None


def _gemma_story(prompt: str, seed: int) -> tuple[dict, str]:
    model = pick_gemma_model()
    if not model:
        raise RuntimeError("no-gemma")
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json",
        "options": {"temperature": 1.0, "seed": int(seed) % 2147483647},
    }
    raw = _http_json(f"{ollama_host()}/api/generate", payload, timeout=180)
    text = str(raw.get("response") or "")
    return _extract_json(text), model


def status() -> dict:
    load_dotenv()
    gemma = pick_gemma_model()
    return {
        "ok": True,
        "gemini": bool(gemini_key()),
        "gemma": bool(gemma),
        "gemmaModel": gemma,
    }


def generate_story(child_name: str, age: int, topic: str, seed: int) -> dict:
    load_dotenv()
    prompt = _story_prompt(child_name, age, topic, seed)
    errors = []

    if gemini_key():
        try:
            data, model = _gemini_story(prompt)
            story = normalize_story(data, child_name, topic, "gemini", model)
            return {"ok": True, "source": "gemini", "model": model, "story": story}
        except Exception as exc:
            errors.append(f"gemini:{exc}")

    try:
        data, model = _gemma_story(prompt, seed)
        story = normalize_story(data, child_name, topic, "gemma", model)
        return {"ok": True, "source": "gemma", "model": model, "story": story}
    except Exception as exc:
        errors.append(f"gemma:{exc}")

    return {
        "ok": False,
        "source": "none",
        "message": "Gemini와 로컬 Gemma 모두 이야기를 쓰지 못했습니다.",
        "detail": " | ".join(errors)[:400],
    }

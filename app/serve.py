# KidStory 정적 파일과 Edge 신경망 TTS를 같이 여는 로컬 서버
"""정적 앱 서빙 + Neural TTS + Gemini/Gemma 동화 생성."""

from __future__ import annotations

import asyncio
import hashlib
import json
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import story_llm

APP_DIR = Path(__file__).resolve().parent
DEVICE_DIR = APP_DIR / "device_store"
STORIES_DIR = DEVICE_DIR / "stories"
CACHE_DIR = DEVICE_DIR / "tts"
MAX_TEXT_LEN = 1500
DEFAULT_VOICE = "ko-KR-SunHiNeural"
ALLOWED_VOICES = {
    "ko-KR-SunHiNeural",
    "ko-KR-InJoonNeural",
}


def _synth_sync(text: str, voice: str, rate: str) -> tuple[bytes, list]:
    import edge_tts

    async def _run() -> tuple[bytes, list]:
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        audio = bytearray()
        words: list = []
        async for chunk in communicate.stream():
            kind = chunk.get("type")
            if kind == "audio":
                audio.extend(chunk.get("data") or b"")
            elif kind == "WordBoundary":
                words.append({
                    "at": (chunk.get("offset") or 0) / 1e7,
                    "dur": (chunk.get("duration") or 0) / 1e7,
                })
        return bytes(audio), words

    return asyncio.run(_run())


class KidStoryHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIR), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        print(f"[KidStory] {self.address_string()} {fmt % args}")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path.rstrip("/") or "/"
        if path == "/api/story/status":
            payload = story_llm.status()
            payload.update(_vault_status(payload.get("gemma")))
            self._json_ok(payload)
            return
        if path == "/api/vault/stories":
            self._json_ok({"ok": True, "stories": _list_vault_stories()})
            return
        super().do_GET()

    def do_POST(self) -> None:
        path = urlparse(self.path).path.rstrip("/")
        if path == "/api/story":
            self._handle_story()
            return
        if path == "/api/vault/story":
            self._handle_vault_story()
            return
        if path != "/api/tts":
            self.send_error(404, "Not Found")
            return

        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 20000:
            self._json_error(400, "본문이 비었거나 너무 깁니다.")
            return

        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json_error(400, "JSON을 읽지 못했습니다.")
            return

        text = str(payload.get("text") or "").strip()
        if not text or len(text) > MAX_TEXT_LEN:
            self._json_error(400, "읽을 문장이 없거나 너무 깁니다.")
            return

        voice = str(payload.get("voice") or DEFAULT_VOICE)
        if voice not in ALLOWED_VOICES:
            voice = DEFAULT_VOICE

        rate = str(payload.get("rate") or "-8%")
        if not rate.endswith("%") or len(rate) > 8:
            rate = "-8%"

        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        key = hashlib.sha256(f"{voice}|{rate}|{text}".encode("utf-8")).hexdigest()
        audio_path = CACHE_DIR / f"{key}.mp3"
        words_path = CACHE_DIR / f"{key}.json"

        try:
            if audio_path.exists() and words_path.exists():
                audio = audio_path.read_bytes()
                words = json.loads(words_path.read_text(encoding="utf-8"))
            else:
                audio, words = _synth_sync(text, voice, rate)
                if not audio:
                    self._json_error(502, "신경망 음성을 만들지 못했습니다.")
                    return
                audio_path.write_bytes(audio)
                words_path.write_text(json.dumps(words), encoding="utf-8")
        except ImportError:
            self._json_error(503, "edge-tts가 없습니다. pip install edge-tts")
            return
        except Exception as exc:
            self._json_error(502, f"TTS 실패: {exc}")
            return

        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Expose-Headers", "X-KidStory-Words")
        self.send_header("X-KidStory-Words", json.dumps(words))
        self.send_header("Content-Length", str(len(audio)))
        self.end_headers()
        self.wfile.write(audio)

    def _handle_story(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 12000:
            self._json_error(400, "본문이 비었거나 너무 깁니다.")
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json_error(400, "JSON을 읽지 못했습니다.")
            return

        name = str(payload.get("name") or "아이").strip()[:12] or "아이"
        topic = str(payload.get("topic") or "스스로 해내기").strip()[:80] or "스스로 해내기"
        try:
            age = int(payload.get("age") or 4)
        except (TypeError, ValueError):
            age = 4
        age = min(7, max(3, age))
        try:
            seed = int(payload.get("seed") or time_seed())
        except (TypeError, ValueError):
            seed = time_seed()

        result = story_llm.generate_story(name, age, topic, seed)
        if result.get("ok"):
            self._json_ok(result)
            return
        payload = {
            "ok": False,
            "message": str(result.get("message") or "이야기를 쓰지 못했습니다."),
            "detail": str(result.get("detail") or ""),
        }
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(503)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_vault_story(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > 400000:
            self._json_error(400, "본문이 비었거나 너무 깁니다.")
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json_error(400, "JSON을 읽지 못했습니다.")
            return
        saved = _save_vault_story(payload)
        if not saved:
            self._json_error(400, "이야기 아이디가 없습니다.")
            return
        self._json_ok({"ok": True, "id": saved})

    def _json_ok(self, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json_error(self, code: int, message: str) -> None:
        body = json.dumps({"ok": False, "message": message}).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def _safe_id(raw: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_\-]", "", str(raw or ""))
    return cleaned[:80]


def _save_vault_story(payload: dict) -> str:
    story_id = _safe_id(payload.get("id") or "")
    if not story_id:
        return ""
    STORIES_DIR.mkdir(parents=True, exist_ok=True)
    path = STORIES_DIR / f"{story_id}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return story_id


def _list_vault_stories() -> list:
    if not STORIES_DIR.is_dir():
        return []
    rows = []
    for path in sorted(STORIES_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            rows.append(json.loads(path.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError):
            continue
    return rows


def _vault_status(has_gemma: bool = False) -> dict:
    stories = _list_vault_stories()
    tts_count = len(list(CACHE_DIR.glob("*.mp3"))) if CACHE_DIR.is_dir() else 0
    return {
        "deviceStore": str(DEVICE_DIR),
        "vaultStories": len(stories),
        "ttsFiles": tts_count,
        "onDeviceModel": "gemma4" if has_gemma else None,
    }


def time_seed() -> int:
    import time
    return int(time.time() * 1000) % 2147483647


def main() -> None:
    story_llm.load_dotenv()
    port = 8765
    status = story_llm.status()
    server = ThreadingHTTPServer(("127.0.0.1", port), KidStoryHandler)
    print(f"KidStory 서버 http://127.0.0.1:{port}/")
    print("나레이션은 Microsoft 한국어 Neural 음성입니다.")
    gemini_label = "준비됨" if status["gemini"] else "키 없음(.env 의 GEMINI_API_KEY)"
    gemma_label = status["gemmaModel"] or "없음(ollama pull gemma4)"
    print(f"동화 생성 1차 Gemini: {gemini_label} / 2차 로컬 Gemma: {gemma_label}")
    print(f"이 기기 금고: {DEVICE_DIR}")
    server.serve_forever()


if __name__ == "__main__":
    main()

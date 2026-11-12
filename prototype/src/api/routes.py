"""Small local web demo using only the Python standard library."""
from __future__ import annotations

import json
import mimetypes
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from src.safety.crisis_detector import detect_crisis
from src.domain.screening.scoring import score_demo

ROOT = Path(__file__).resolve().parents[2]
FRONTEND = ROOT / "frontend"
CASES: list[dict[str, object]] = []

CRISIS_MESSAGE = (
    "Mình rất tiếc vì bạn đang phải trải qua điều này. Cảm ơn bạn đã nói ra. "
    "Mình không thể đánh giá tình trạng hay thay chuyên gia. Nếu bạn có nguy cơ "
    "làm hại bản thân ngay lúc này, hãy gọi 115 hoặc đến khoa cấp cứu gần nhất. "
    "Nếu có thể, hãy đến nơi có người và nhờ một người bạn tin cậy ở cạnh bạn. "
    "Cảnh báo chuyên gia trong bản demo đã được tạo; hệ thống này không có người trực thật."
)
PHYSICAL_MESSAGE = (
    "Bạn mô tả dấu hiệu có thể cần được đánh giá khẩn cấp. Bản demo không thể phân loại "
    "hay loại trừ cấp cứu. Hãy gọi 115 hoặc đến cơ sở cấp cứu gần nhất ngay."
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def make_case(kind: str, consent: bool = False, origin: str = "chat") -> dict[str, object]:
    case = {
        "id": str(uuid.uuid4())[:8],
        "created_at": now_iso(),
        "kind": kind,
        "status": "new",
        "origin": origin,
        "consent_to_contact": bool(consent),
        "summary": "Tín hiệu an toàn được phát hiện; nội dung hội thoại không được lưu.",
    }
    CASES.insert(0, case)
    return case


class DemoHandler(BaseHTTPRequestHandler):
    server_version = "MentalWellbeingDemo/0.1"

    def log_message(self, fmt: str, *args: object) -> None:
        # Avoid logging request bodies or query data that could contain health details.
        print(f"{self.address_string()} - {fmt % args}")

    def send_json(self, payload: object, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict[str, object]:
        length = min(int(self.headers.get("Content-Length", "0")), 16_384)
        raw = self.rfile.read(length)
        try:
            value = json.loads(raw or b"{}")
        except json.JSONDecodeError:
            return {}
        return value if isinstance(value, dict) else {}

    def do_GET(self) -> None:
        path = unquote(urlparse(self.path).path)
        if path == "/api/health":
            return self.send_json({"ok": True, "mode": "local-demo", "model": "offline scripted replies"})
        if path == "/api/cases":
            return self.send_json({"cases": CASES, "demo_only": True})
        if path == "/api/fhir/preview":
            return self.send_json(fhir_preview())
        if path == "/api/resources":
            return self.send_json(resources())
        if path in ("/", "/index.html"):
            relative = "index.html"
        elif path in ("/app.js", "/styles.css"):
            relative = path.lstrip("/")
        else:
            return self.send_json({"error": "not_found"}, 404)
        file_path = (FRONTEND / relative).resolve()
        if not file_path.is_relative_to(FRONTEND.resolve()) or not file_path.is_file():
            return self.send_json({"error": "not_found"}, 404)
        content = file_path.read_bytes()
        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        data = self.read_json()
        if path == "/api/chat":
            message = str(data.get("message", ""))[:4000]
            signal = detect_crisis(message)
            if signal["urgent"]:
                case = make_case(str(signal["kind"]), bool(data.get("consent_to_contact")), "chat")
                reply = PHYSICAL_MESSAGE if signal["kind"] == "physical_red_flag" else CRISIS_MESSAGE
                return self.send_json({"urgent": True, "kind": signal["kind"], "reply": reply, "case": case})
            return self.send_json({"urgent": False, "reply": supportive_reply(message)})
        if path == "/api/screening":
            kind = str(data.get("kind", ""))
            answers = data.get("answers", [])
            if kind not in ("phq_demo", "gad_demo") or not isinstance(answers, list):
                return self.send_json({"error": "invalid_screening"}, 400)
            clean = [max(0, min(3, int(v))) for v in answers[:9 if kind == "phq_demo" else 7]]
            total = score_demo(clean)
            triggered = kind == "phq_demo" and len(clean) >= 9 and clean[8] > 0
            case = make_case("mental_crisis", bool(data.get("consent_to_contact")), "screening") if triggered else None
            return self.send_json({"score": total, "answered": len(clean), "demo_only": True, "urgent": triggered, "case": case})
        if path == "/api/red-flag":
            signal = detect_crisis(str(data.get("symptoms", ""))[:1000])
            return self.send_json(signal)
        if path == "/api/medication-check":
            meds = {str(item).strip().upper() for item in data.get("medications", []) if str(item).strip()}
            demo_pair = {"DEMO-A", "DEMO-B"}
            return self.send_json({
                "demo_only": True,
                "checked": sorted(meds),
                "warning": bool(demo_pair.issubset(meds)),
                "message": "Cặp dữ liệu giả lập DEMO-A + DEMO-B tạo cảnh báo minh họa." if demo_pair.issubset(meds) else "Không kết nối cơ sở dữ liệu thuốc. Không thể xác nhận thuốc thật an toàn hoặc không tương tác.",
            })
        if path == "/api/cases/resolve":
            case_id = str(data.get("id", ""))
            for case in CASES:
                if case["id"] == case_id:
                    case["status"] = "reviewed"
                    case["reviewed_at"] = now_iso()
                    return self.send_json({"ok": True, "case": case})
            return self.send_json({"error": "case_not_found"}, 404)
        return self.send_json({"error": "not_found"}, 404)


def supportive_reply(message: str) -> str:
    text = message.lower()
    if any(word in text for word in ("ngủ", "mất ngủ", "mat ngu")):
        return "Nghe có vẻ chuyện ngủ nghỉ đang làm bạn mệt mỏi. Mình có thể cùng bạn thử một bài thở nhẹ hoặc ghi lại điều đang khiến bạn bận tâm. Bạn muốn bắt đầu từ điều gì? Mình không chẩn đoán hay thay chuyên gia."
    if any(word in text for word in ("lo lắng", "lo lang", "stress", "căng thẳng", "cang thang", "áp lực", "ap luc")):
        return "Cảm ơn bạn đã chia sẻ. Có vẻ bạn đang phải mang khá nhiều áp lực. Nếu phù hợp, mình có thể hướng dẫn một bài grounding ngắn. Điều gì đang khiến hôm nay khó khăn nhất với bạn? Đây là hỗ trợ tự chăm sóc, không phải trị liệu hay chẩn đoán."
    return "Mình đang lắng nghe. Bạn có thể kể thêm điều gì đang diễn ra, nếu thấy thoải mái. Mình sẽ không phán xét; mình có thể giúp bạn thử một bài tự chăm sóc hoặc tìm nguồn hỗ trợ phù hợp."


def resources() -> list[dict[str, str]]:
    return [
        {"id": "grounding", "title": "Grounding: trở về hiện tại", "summary": "Nhìn quanh và gọi tên 5 thứ bạn thấy, 4 thứ bạn cảm nhận, 3 âm thanh, 2 mùi và 1 vị. Có thể dừng bất cứ lúc nào.", "source": "WHO — Doing What Matters in Times of Stress", "url": "https://www.who.int/publications/b/53604"},
        {"id": "breathing", "title": "Thở chậm, nhẹ nhàng", "summary": "Ngồi ở tư thế thoải mái. Hít vào và thở ra nhẹ nhàng theo nhịp dễ chịu; không cố nín thở. Dừng nếu thấy khó chịu.", "source": "NHS — Breathing exercises for stress", "url": "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/"},
        {"id": "journal", "title": "Nhật ký cảm xúc", "summary": "Ghi ngắn: chuyện gì xảy ra, cảm xúc nào đang có mặt, và một việc nhỏ bạn muốn thử tiếp theo.", "source": "Bài tập phản tư trong bản demo; không phải can thiệp trị liệu", "url": "https://www.who.int/publications/b/53604"},
    ]


def fhir_preview() -> dict[str, object]:
    authored = now_iso()
    return {
        "resourceType": "Bundle", "type": "collection", "timestamp": authored,
        "meta": {"tag": [{"system": "urn:demo", "code": "synthetic-no-patient-data"}]},
        "entry": [
            {"resource": {"resourceType": "QuestionnaireResponse", "status": "completed", "subject": {"reference": "Patient/demo-user"}, "authored": authored, "questionnaire": "Questionnaire/phq-demo", "item": [{"linkId": "q1", "answer": [{"valueInteger": 1}]}]}},
            {"resource": {"resourceType": "Observation", "status": "final", "subject": {"reference": "Patient/demo-user"}, "code": {"text": "Simulated screening total"}, "valueInteger": 1}},
        ],
    }


def run(host: str = "127.0.0.1", port: int = 8000) -> None:
    server = ThreadingHTTPServer((host, port), DemoHandler)
    print(f"Demo server running at http://{host}:{port}")
    print("Local-only demonstration. No real authentication, clinician monitoring, or patient data storage.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping demo server...")
    finally:
        server.server_close()

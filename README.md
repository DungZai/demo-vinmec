# An Tâm · VMEC-20

**AI Agent trợ lý sức khỏe tinh thần với cảnh báo an toàn & khủng hoảng**
Khối: Y tế – Ứng dụng chăm sóc sức khỏe & Hỗ trợ lâm sàng

> Trạng thái: **mới có cây thư mục**, chưa có code. Xem mục [Lộ trình](#lộ-trình-1211--2511).

## Bài toán

Sinh viên và người mới đi làm ngày càng cần hỗ trợ khi gặp stress, lo âu, mất ngủ hay trầm cảm nhẹ. Trong khi đó, số chuyên gia có hạn và việc chủ động tìm hỗ trợ còn nhiều rào cản. An Tâm là agent đồng hành theo luồng **lắng nghe → sàng lọc → hỗ trợ tự chăm sóc → escalate khi cần**:

- Hội thoại đồng cảm dựa trên kỹ thuật tự chăm sóc có kiểm chứng: thở, grounding, CBT nền tảng, nhật ký cảm xúc. Mọi gợi ý đều trích nguồn.
- Sàng lọc tâm trạng định kỳ bằng thang PHQ-9 / GAD-7 mô phỏng, chấm điểm bằng code.
- Phát hiện dấu hiệu khủng hoảng, rồi hiển thị ngay hotline, quy trình an toàn và chuyển ca cho chuyên gia (HITL).

### Ràng buộc

- **An toàn là tối thượng.** Hệ thống không chẩn đoán rối loạn tâm thần, không thay trị liệu, không kê thuốc. Nó chỉ là hỗ trợ ban đầu và luôn khuyến khích người dùng gặp chuyên gia.
- **Có căn cứ, chống bịa.** Câu trả lời chỉ dựa trên tài liệu có nguồn trong `data/knowledge/`. Không có tài liệu phù hợp thì hệ thống nói rõ là không có.
- **Có ý tưởng tự hại hoặc nguy cơ thì phản ứng ngay**: hiển thị hotline, hướng dẫn an toàn và cảnh báo chuyên gia real-time.
- **Bảo mật PII/PHI.** Log an toàn không lưu nội dung tin nhắn (xem [docs/privacy.md](docs/privacy.md)).
- Giọng điệu đồng cảm, không phán xét. Giới hạn của AI luôn được hiển thị trên UI.

## Kiến trúc

Crisis gate chạy **trước** LLM hội thoại và **độc lập** với nó.

| Lớp | Nhiệm vụ | Thư mục |
| --- | --- | --- |
| L0 | Crisis gate: keyword tiếng Việt + classifier `{cssrs_level, confidence}` + rule gộp tier | `backend/app/safety/l0/` |
| L1 | Điều phối LangGraph, state machine C-SSRS, chấm PHQ-9/GAD-7 | `backend/app/agents/`, `backend/app/screening/` |
| L2 | Truy xuất tri thức: Neo4j (graph nguồn + vector cosine) | `backend/app/knowledge/` |
| L3 | Sinh câu trả lời có trích dẫn | `backend/app/llm/` |
| L4 | Output guard: chặn chẩn đoán, tên thuốc; kiểm tra citation và disclaimer | `backend/app/safety/l4/` |

| Tier | Khi nào | Phản ứng |
| --- | --- | --- |
| 3 – Đỏ | C-SSRS ≥ 4, keyword nguy hiểm, hoặc classifier lỗi | Template khủng hoảng + hotline, cảnh báo chuyên gia real-time |
| 2 – Vàng | Nói bóng gió, C-SSRS 1–3, hoặc độ chắc thấp | Hỏi lại theo C-SSRS, đưa vào hàng đợi review |
| 2a | Đã chạm Vàng rồi phủ nhận | Hỗ trợ bình thường, ngưỡng nhạy hơn |
| 1 – Xanh | Không có dấu hiệu | Luồng L1 → L4 |

Chi tiết: [docs/architecture.md](docs/architecture.md) · [docs/safety_protocol.md](docs/safety_protocol.md) · [docs/evaluation.md](docs/evaluation.md)

**Stack:** FastAPI (Python 3.11) · LangGraph + LangChain · GPT-4o-mini / Gemini · PostgreSQL (Supabase) · Neo4j (AuraDB) · Next.js (Vercel) · Docker + GitHub Actions · Langfuse

## Cây thư mục

```
.
├── backend/                     FastAPI + LangGraph (Python 3.11)
│   ├── app/
│   │   ├── core/                cấu hình, đọc data/, JWT, logging
│   │   ├── api/routes/          health · auth · chat · screening · mood · exercises · consent · clinician
│   │   ├── schemas/             Pydantic request/response
│   │   ├── safety/              an toàn tất định, không phụ thuộc LLM hội thoại; ẩn PII; template cố định
│   │   │   ├── l0/              L0 crisis gate: keyword (A) · classifier (B) · rule gộp tier (C)
│   │   │   └── l4/              L4 output guard: chẩn đoán, tên thuốc, citation, disclaimer
│   │   ├── agents/              L1 LangGraph: state, graph
│   │   │   └── nodes/           crisis_gate · crisis_response · risk_clarification · listen · screen
│   │   │                        · self_help · generate · output_guard · escalate
│   │   ├── screening/           state machine C-SSRS, chấm PHQ-9 / GAD-7 bằng code
│   │   ├── knowledge/           L2 Neo4j: model nạp dữ liệu, index, ingest, retriever
│   │   ├── llm/                 L3: client OpenAI/Gemini, generator
│   │   ├── hitl/                cảnh báo real-time (SSE), hàng đợi review
│   │   ├── db/                  kết nối Postgres, Neo4j; bảng SQLAlchemy
│   │   ├── repositories/        users · sessions · safety_events · cases · screenings · mood · consent
│   │   └── observability/       Langfuse / LangSmith
│   ├── migrations/versions/     Alembic
│   ├── scripts/                 nạp tri thức, tạo tài khoản mẫu, chạy bộ eval an toàn
│   └── tests/
│       ├── unit/                keyword · tiering · C-SSRS · PHQ/GAD · output guard
│       ├── safety/              chạy toàn bộ data/eval/safety_scenarios.jsonl
│       └── integration/         luồng L0 → L4, phân quyền API
├── frontend/                    Next.js App Router (TypeScript)
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── login/
│       │   ├── (user)/          chat · checkin · journal · exercises · settings
│       │   └── clinician/       trang cảnh báo real-time · queue/ · cases/[id]/
│       ├── components/          safety · chat · screening · journal · clinician · layout
│       ├── lib/                 gọi API, auth, hotline dự phòng, kết nối real-time
│       └── types/               kiểu dữ liệu khớp backend/app/schemas
├── data/                        nội dung được duyệt, tách khỏi code
│   ├── safety/                  từ điển khủng hoảng · hotline · luật output guard
│   ├── templates/               câu trả lời cố định · C-SSRS · PHQ-9 · GAD-7
│   ├── prompts/                 prompt classifier L0 · system prompt L3
│   ├── knowledge/               sổ đăng ký nguồn · bài tập · tóm tắt tài liệu đã duyệt
│   └── eval/                    kịch bản an toàn · reports/
├── docs/                        kiến trúc · quy trình an toàn · đánh giá · privacy · FHIR
├── prototype/                   bản demo offline cũ, chỉ để tham khảo giao diện
└── .github/workflows/           CI: lint, test, build
```

Mọi nội dung liên quan đến an toàn (từ điển, template, hotline, prompt) nằm trong `data/` để chuyên gia duyệt mà không cần đọc code.

## Lộ trình 12/11 → 25/11

- [ ] **Hạ tầng:** Postgres + Neo4j chạy; nạp 10–20 bài tập có nguồn; soạn 40–60 kịch bản an toàn
- [ ] **L0:** hàm gộp tier qua unit test; JSON lỗi → Tier 3; keyword bắt được cả cách viết không dấu
- [ ] **L1:** C-SSRS hỏi đúng thứ tự 1–2 → 3–5 → 6; `session_max_risk` không bao giờ giảm; PHQ-9/GAD-7 chấm bằng code
- [ ] **L2–L4:** mọi câu trả lời có citation trỏ đúng `Source`; L4 chặn câu chẩn đoán và tên thuốc
- [ ] **Frontend:** đăng nhập người dùng/chuyên gia; chuyên gia thấy cảnh báo Tier 3 real-time và hàng đợi Tier 2
- [ ] **End-to-end:** một hội thoại đi qua đủ L0 → L4; một ca Tier 3 bật cảnh báo
- [ ] **Đánh giá:** bảng kết quả theo rubric VERA-MH; chọn ngưỡng `confidence` theo recall Tier 3
- [ ] **Deploy:** backend trên Render/Railway, frontend trên Vercel; disclaimer hiển thị rõ trên UI

Ngoài phạm vi 14 ngày, làm nếu còn thời gian: kiểm tra tương tác thuốc, chuẩn hóa HL7 FHIR ([docs/fhir_mapping.md](docs/fhir_mapping.md)).

## Giới hạn

- Hệ thống không chẩn đoán, không thay trị liệu, không kê đơn.
- C-SSRS, PHQ-9, GAD-7 dùng ở dạng **mô phỏng**, chưa phải bản dịch chuẩn hóa.
- Bộ kịch bản do nhóm tự soạn nên chưa phải đánh giá lâm sàng.
- Hotline khủng hoảng tâm lý tại Việt Nam **chưa được xác minh**. Hiện chỉ hiển thị 115 (cấp cứu y tế).
- Trước khi dùng với người thật, chuyên gia sức khỏe tinh thần cần duyệt: quy trình khủng hoảng, từ điển, template, cơ chế đồng ý và quy trình trực nhận cảnh báo.

# Quy trình an toàn: Tiering & HITL

Tier được quyết định bởi **mức nặng C-SSRS trước, độ chắc sau**. Độ chắc thấp luôn làm tròn lên tier cao hơn.

| Tier | Điều kiện | Hệ thống làm gì | HITL |
| --- | --- | --- | --- |
| 3 – Đỏ | `cssrs_level` ≥ 4, có hành vi chuẩn bị (câu 6), keyword nhóm `danger` / `medical_red_flag`, hoặc JSON classifier lỗi | Dừng luồng thường; template cố định + hotline; mời kết nối người thân nếu đã đồng ý | Cảnh báo **real-time** |
| 2 – Vàng | `cssrs_level` 1–3, keyword nhóm `indirect`, hoặc level 0 nhưng `confidence` dưới ngưỡng | Hỏi lại theo C-SSRS Screener; không chặn chat | Hàng đợi **review** |
| 2a – Vàng-theo dõi | Đã chạm Vàng, sau đó phủ nhận | Luồng hỗ trợ bình thường, ngưỡng nhạy hơn cho phần còn lại của phiên | Giữ trong hàng đợi review |
| 1 – Xanh | `cssrs_level` = 0, confidence đạt ngưỡng, phiên chưa từng chạm Vàng | L1 → L2 → L3 → L4 | Không |

## Quy tắc bắt buộc

- L0 chạy trên **mọi** tin nhắn, kể cả câu trả lời C-SSRS. Không có API nào bỏ qua L0.
- Keyword nhóm `danger` → Tier 3 ngay, không chờ classifier.
- `session_max_risk` chỉ tăng (reducer `keep_max`).
- C-SSRS hỏi theo thứ tự 1 → 2 → (nếu 2 = có) 3, 4, 5 → 6. Câu trả lời "có" ở câu 4, 5 hoặc 6 → Tier 3.
- Câu hỏi C-SSRS, PHQ-9, GAD-7 và câu trả lời khủng hoảng là template trong `data/templates/`. LLM không sinh các nội dung này.
- Frontend luôn có hotline dự phòng (`frontend/src/lib/hotlines.ts`) để thẻ khủng hoảng vẫn hiện khi backend lỗi.
- Mọi thay đổi ở `data/safety/` hoặc `backend/app/safety/` phải chạy lại `tests/safety`.

## Việc cần xác minh trước khi dùng thật

- [ ] Số hotline khủng hoảng tâm lý tại Việt Nam từ nguồn chính thức (`data/safety/hotlines.yaml`, hiện `verified: false`)
- [ ] Bản dịch tiếng Việt chính thức của C-SSRS Screener và điều kiện sử dụng (Columbia Lighthouse Project)
- [ ] Chuyên gia duyệt `crisis_lexicon.yaml` và các template
- [ ] Quy trình trực nhận cảnh báo của chuyên gia (giờ trực, thời gian phản hồi tối đa)

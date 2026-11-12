# Kiểm thử & đánh giá an toàn

**Chỉ số chính:** recall của Tier 3 trên bộ kịch bản an toàn. Tỷ lệ báo động nhầm là chỉ số phụ; chấp nhận báo động nhầm cao hơn để gần như không bỏ sót.

## Bộ kịch bản

`data/eval/safety_scenarios.jsonl`, mục tiêu 40–60 hội thoại tự soạn (xem `data/eval/README.md`). Nhóm "diễn tiến nhiều lượt" là bắt buộc.

## Chấm điểm

Theo 5 tiêu chí rubric VERA-MH. Có thể dùng LLM-as-judge, nhưng phải chấm tay một phần để đối chiếu.

## Chọn ngưỡng `confidence`

1. Chạy classifier L0 trên bộ kịch bản: `python -m scripts.run_safety_eval`.
2. Vẽ đường precision–recall.
3. Chọn ngưỡng thấp nhất đạt recall Tier 3 mục tiêu, rồi ghi vào `CONFIDENCE_THRESHOLD`.

Xác suất do LLM tự báo chỉ có khoảng 16–23 giá trị khác nhau, nên đường cong sẽ thô.

## Unit test bắt buộc

| Đối tượng | File |
| --- | --- |
| Từ điển L0 lớp A | `backend/tests/unit/test_keyword.py` |
| Hàm gộp tier (L0 lớp C) | `backend/tests/unit/test_tiering.py` |
| State machine C-SSRS | `backend/tests/unit/test_cssrs.py` |
| Chấm PHQ-9 / GAD-7 | `backend/tests/unit/test_screening.py` |
| Output guard L4 | `backend/tests/unit/test_output_guard.py` |
| Kịch bản an toàn | `backend/tests/safety/test_scenarios.py` |
| Luồng L0 → L4 | `backend/tests/integration/test_graph.py` |

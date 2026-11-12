# Quyền riêng tư (PII/PHI)

- **Chỉ dữ liệu tổng hợp** trong phát triển và kiểm thử.
- **Log an toàn** (`safety_events`): thời điểm, session id, tier, `cssrs_level`, `confidence`, keyword khớp, hành động, chuyên gia nhận ca. Không lưu văn bản tin nhắn gốc.
- **Hội thoại** chỉ nằm trong checkpoint LangGraph. TODO: đặt thời hạn lưu và job xóa.
- **Chuyên gia** xem tier, mức C-SSRS và thời gian, nhưng không xem nội dung chat. Họ chỉ thấy liên hệ người thân khi người dùng đã đồng ý.
- **Ẩn PII** (`backend/app/safety/pii.py`) trước khi gửi văn bản cho LLM, embedding hoặc Langfuse/LangSmith.
- **Đồng ý liên hệ người thân** có thể rút lại bất kỳ lúc nào.
- TODO: mã hóa cột nhạy cảm (`emergency_contacts.phone`), chính sách truy cập, quy trình xử lý sự cố.

# Kiến trúc demo

```mermaid
flowchart LR
    U[Người dùng · giao diện demo] --> UI[Vanilla HTML/CSS/JS]
    C[Chuyên gia · giao diện mô phỏng] --> UI
    UI --> API[Python stdlib HTTP API · loopback]
    API --> SG[Safety gate xác định]
    SG -->|Tín hiệu khẩn| CE[Phản hồi an toàn + cảnh báo RAM]
    SG -->|Không thấy từ khóa| SR[Phản hồi offline theo mẫu]
    UI --> LS[localStorage · mood/tags]
    UI --> RAG[Thư viện nội dung tĩnh có nguồn]
    UI --> FHIR[Preview Bundle tổng hợp]
    UI --> MED[Kiểm tra demo DEMO-A/DEMO-B]
    CE --> CQ[Hàng đợi chuyên gia mô phỏng]
```

Không có LLM, cơ sở dữ liệu thật, đăng nhập, phân quyền, gửi SMS hoặc EHR trong demo. Không lưu nội dung chat; cảnh báo giữ trong bộ nhớ tiến trình. Nhật ký cảm xúc lưu cục bộ trong trình duyệt.

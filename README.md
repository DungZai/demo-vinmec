# An Tâm · VMEC-20

Bản demo nội bộ cho ý tưởng **AI Agent đồng hành sức khỏe tinh thần với cảnh báo an toàn**. Chạy offline bằng Python standard library, không cần API key hay cài package.

## Chạy local

Từ thư mục này:

```powershell
python -m src.main
```

Mở <http://127.0.0.1:8000>. Nhấn `Ctrl+C` trong terminal để dừng. Máy chủ chỉ bind vào loopback (`127.0.0.1`); chưa cấu hình deploy/cloud.

## Tính năng trong demo

- Hội thoại đồng cảm bằng mẫu trả lời offline; phát hiện tín hiệu khủng hoảng và cờ đỏ theo từ khóa xác định.
- Check-in mô phỏng 9 câu / 7 câu, nhật ký cảm xúc và biểu đồ xu hướng cục bộ.
- Thư viện grounding, thở nhẹ và nhật ký phản tư có dẫn nguồn.
- Hàng đợi chuyên gia mô phỏng; cảnh báo chỉ giữ trong RAM và không lưu nội dung chat.
- Chia sẻ liên hệ có đồng ý được mô phỏng, không gửi tin nhắn hay gọi người thật.
- Kiểm tra thuốc bằng cặp tổng hợp DEMO-A/DEMO-B; bản xem trước cấu trúc FHIR R4 tổng hợp.

## Diễn tập an toàn

1. Ở trang Đồng hành, nhập câu **giả lập**: `Kịch bản diễn tập: mình không muốn sống nữa`.
2. Quan sát phản hồi an toàn và thẻ gọi cấp cứu; bấm xem hàng đợi để thấy cảnh báo ẩn danh.
3. Chuyển vai trò Chuyên gia, đánh dấu cảnh báo đã xem.
4. Trong Công cụ an toàn, dùng nút điền tình huống cờ đỏ để thử luồng cảnh báo y tế.
5. Tại màn sàng lọc, chọn câu trả lời khác 0 cho câu cuối của check-in cảm xúc để thử cảnh báo.

Không dùng lời kể thật để diễn tập. Nội dung chat chỉ xử lý trong request và không ghi log. Nhật ký cảm xúc dùng `localStorage` của trình duyệt; xóa bằng nút trên trang Nhật ký.

## Giới hạn quan trọng

- Không chẩn đoán, trị liệu, kê đơn hoặc xác định người dùng có an toàn hay không.
- Bộ câu hỏi chỉ mô phỏng chủ đề PHQ-9/GAD-7; không phải bản chuẩn hóa và không diễn giải điểm.
- Detector từ khóa chỉ minh họa; có thể bỏ sót hoặc báo động nhầm. Không dùng để loại trừ cấp cứu.
- Hàng đợi chuyên gia không có nhân viên trực. Vai trò người dùng/chuyên gia chỉ là đổi giao diện, **không có xác thực hay phân quyền thật**.
- Cảnh báo gọi 115 là thông tin cấp cứu y tế theo nguồn liên kết. Đây không phải đường dây chuyên biệt về sức khỏe tinh thần. Trong nguy hiểm tức thời, gọi cấp cứu y tế hoặc đến cơ sở cấp cứu gần nhất, nhờ người tin cậy ở cạnh.
- Kiểm tra tương tác thuốc dùng dữ liệu giả; không kết luận thuốc thật an toàn hay có tương tác. FHIR chỉ là JSON minh họa, chưa kiểm định theo implementation guide hay kết nối EHR.
- Chỉ dùng dữ liệu tổng hợp. Không nhập tên, bệnh sử, số điện thoại hoặc thông tin nhận dạng thật.

## Nguồn nội dung demo

- [WHO — Doing What Matters in Times of Stress](https://www.who.int/publications/b/53604)
- [NHS — Breathing exercises for stress](https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/)
- [FHIR R4 — QuestionnaireResponse](https://hl7.org/fhir/R4/questionnaireresponse.html)
- [UK FCDO — Mental health support in Vietnam](https://www.gov.uk/government/publications/vietnam-mental-health-support-abroad/vietnam-mental-health-support-abroad)

Trước khi dùng với người thật, cần chuyên gia sức khỏe tinh thần duyệt quy trình khủng hoảng, nội dung, thang sàng lọc, cơ chế đồng ý, quyền riêng tư và quy trình trực nhận cảnh báo.

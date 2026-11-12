# Quy trình an toàn · bản demo

## Phạm vi

Tất cả luồng trong repo là minh họa nội bộ. Chưa có bác sĩ/chuyên gia trực, gọi người thân, xác thực, dịch vụ hotline tích hợp hoặc đánh giá lâm sàng. Không nhập dữ liệu thật.

## Luồng khẩn cấp

- Backend chạy bộ phát hiện từ khóa xác định trước câu trả lời hội thoại; trường hợp trùng tín hiệu chuyển sang phản hồi cố định.
- Khi check-in demo có câu tự hại được chọn khác 0, API tạo cảnh báo ẩn danh.
- Tín hiệu cơ thể như khó thở/đau ngực khẩn cấp chỉ minh họa; hệ thống không phân loại hay loại trừ cấp cứu.
- Giao diện nhắc gọi 115 (cấp cứu y tế) hoặc đến cơ sở cấp cứu gần nhất; nhờ người tin cậy ở cạnh. Nguồn số khẩn cấp: GOV.UK/FCDO, link trong README.
- Hàng đợi chuyên gia là demo trong RAM; cảnh báo mất khi server dừng. Checkbox đồng ý chỉ lưu cờ mô phỏng, không gửi liên hệ.

## Không được hiểu thành đảm bảo

Detector có thể bỏ sót, báo động nhầm hoặc bị diễn đạt vòng tránh. PHQ/GAD trong giao diện không phải công cụ chuẩn hóa. Kết quả “không thấy tín hiệu” không có nghĩa là an toàn. Trước bất kỳ thử nghiệm với người thật, cần quy trình chuyên gia, nguồn trợ giúp đã xác minh theo địa phương, kế hoạch lỗi/dự phòng, quyền riêng tư và giám sát trực tiếp.

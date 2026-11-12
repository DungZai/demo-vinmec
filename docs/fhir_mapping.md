# Ánh xạ FHIR R4 minh họa

`GET /api/fhir/preview` trả về Bundle tổng hợp chỉ để minh họa cấu trúc:

- `QuestionnaireResponse`: câu trả lời giả lập có liên kết tới `Patient/demo-user`.
- `Observation`: tổng điểm mô phỏng.

Đây chưa phải dữ liệu lâm sàng, chưa xác thực theo profile/implementation guide và không được gửi lên EHR. FHIR R4 dùng Questionnaire/QuestionnaireResponse để biểu diễn biểu mẫu và câu trả lời; xem [đặc tả chính thức](https://hl7.org/fhir/R4/questionnaireresponse.html).

# AI Business X-Ray - Định Vị Doanh Nghiệp Kỷ Nguyên Số & AI

Công cụ phân tích và định vị doanh nghiệp thông minh, đồng hành cùng CEO để phát hiện điểm nghẽn chiến lược và lập bản đồ hành động 30 ngày trong kỷ nguyên số.

Thay vì bắt người dùng điền các biểu mẫu tẻ nhạt, ứng dụng sử dụng một **Trợ lý AI Agent** dưới dạng hội thoại (Chatbot) để trò chuyện trực tiếp với CEO qua 8 bước khảo sát định vị (MỞ → HIỂU DN → TÌM TRIỆU CHỨNG → ĐÀO NGUYÊN NHÂN → XÁC NHẬN ĐIỂM NGHẼN → TÌM TÀI SẢN → TÌM CƠ HỘI → CHỐT ƯU TIÊN). Sau khi hoàn thành cuộc trò chuyện (~10 câu), trợ lý AI sẽ tự động phân tích và mở khóa một **Bảng điều khiển kết quả** trực quan với biểu đồ radar, phân tích 8 khía cạnh cốt lõi và lộ trình 30 ngày.

## 🚀 Tính Năng Nổi Bật

1. **Khảo sát định vị tương tác (Chat AI):** Trợ lý ảo đóng vai trò chuyên gia tư vấn chiến lược, liên tục đặt câu hỏi đào sâu nguyên nhân thay vì vội vàng kết luận (ví dụ: truy vấn tận gốc vì sao doanh thu sụt giảm).
2. **Khung lý thuyết định vị chuẩn mực:** Quy trình đi từ Triệu chứng đến Nguyên nhân gốc rễ, rà soát Lợi thế sẵn có và Cơ hội số hóa.
3. **Báo cáo định vị doanh nghiệp toàn diện:**
   - **Điểm định vị tổng thể:** Đánh giá từ Yếu, Đang hình thành, đến Vững vàng, Dẫn đầu.
   - **Radar 4 nhóm năng lực:** Định vị & Giá trị, Tăng trưởng & Dòng tiền, Vận hành & Dữ liệu, Sẵn sàng chuyển đổi số.
   - **Hành động ưu tiên ngay lập tức:** Chỉ ra việc cấp bách nhất cần làm.
   - **Chi tiết 8 khía cạnh cốt lõi:** Điểm số, Bằng chứng thực tế, Rủi ro cảnh báo, Đề xuất hành động thực tiễn.
   - **Lộ trình triển khai 30 ngày:** Phân rã hành động cụ thể theo từng tuần.
4. **Cơ chế dự phòng thông minh (Fallback mechanism):** Nếu chưa cấu hình `GEMINI_API_KEY`, ứng dụng tự động kích hoạt bộ định vị cục bộ để giả lập trò chuyện và lập báo cáo dựa trên phân tích thuật toán ngữ nghĩa, đảm bảo trải nghiệm thông suốt.

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React (Vite), Recharts (Vẽ biểu đồ radar), Lucide React (Bộ icon thiết kế).
- **Backend:** Node.js, Express.js.
- **AI Engine:** Google Gemini AI API (`gemini-1.5-flash` với cơ chế Structured JSON Output).

## 💻 Hướng Dẫn Khởi Chạy

### 1. Cài đặt các gói phụ thuộc

Tại thư mục gốc của dự án, chạy lệnh:
```bash
npm install
```

### 2. Cấu hình biến môi trường

Sao chép file `.env.example` thành `.env`:
```bash
copy .env.example .env
```
Mở file `.env` và nhập khóa API của bạn:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Nếu bỏ trống hoặc giữ nguyên khóa mặc định, hệ thống sẽ tự động chạy ở chế độ **Giả lập cục bộ offline**).*

### 3. Khởi chạy ứng dụng trong chế độ Development

Chạy lệnh duy nhất để khởi chạy đồng thời cả Frontend (Vite) và Backend (Nodemon):
```bash
npm run dev
```

Mở trình duyệt truy cập:
- Frontend: [http://localhost:5173](http://localhost:5173)
- API Backend: [http://localhost:5000](http://localhost:5000)

## 📁 Cấu Trúc Mã Nguồn

```text
├── src/
│   ├── App.jsx          # Giao diện chính: Chatbot khảo sát & Bảng điều khiển kết quả
│   ├── index.css        # Thiết kế hệ thống CSS (Darkmode, bubble chat, timeline, dashboard)
│   └── main.jsx         # Điểm khởi chạy React client
├── server.js            # Server API Express: Xử lý logic Chat AI & Tạo báo cáo định vị
├── vite.config.js       # Cấu hình Vite & Proxy phân luồng API tránh lỗi CORS
├── package.json         # Danh sách thư viện & Lệnh vận hành
└── .env                 # File cấu hình khóa bảo mật
```

---
Phát triển bởi đội ngũ CDO.

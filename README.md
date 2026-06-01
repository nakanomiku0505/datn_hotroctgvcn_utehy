<div align="center">
  <h1>🎓 EduAdviser</h1>
  <p><b>Hệ thống Hỗ trợ công tác Giảng viên Chủ nhiệm & Quản lý Học vụ</b></p>
</div>

EduAdviser là giải pháp chuyển đổi số toàn diện nhằm tối ưu hóa quy trình quản lý sinh viên dành cho Giảng viên chủ nhiệm (GVCN), Ban cán sự lớp và Ban lãnh đạo khoa/bộ môn. Hệ thống tập trung vào việc quản lý chuyên cần, học thuật và rèn luyện trên nền tảng Web đa thiết bị, đồng thời cung cấp khả năng tự động hóa và trích xuất báo cáo mạnh mẽ.

---

## 🚀 Các Tính Năng Nổi Bật

### 1. Quản lý Chuyên cần & Cảnh báo (Attendance & Warning)
- Điểm danh sinh viên theo buổi (Sáng/Chiều) với giao diện dạng thẻ (Card) tối ưu tuyệt đối cho thiết bị di động (Mobile-first).
- Tự động thống kê số buổi vắng (có phép/không phép) và đi muộn theo tháng.
- **Hệ thống Cảnh báo sớm:** Tự động nhận diện sinh viên có nguy cơ thôi học (nghỉ > 3 buổi không phép) và tích hợp nút gọi điện/Zalo hỗ trợ liên hệ nhanh với phụ huynh.
- **Báo cáo động (Dynamic Export):** Kết xuất dữ liệu điểm danh ra file Excel linh hoạt, dựa trên số buổi học thực tế của từng tháng.

### 2. Quản lý Kết quả học tập (Academic Management)
- Hỗ trợ nhập liệu hàng loạt (Bulk Import) từ tệp Excel theo định dạng chuẩn của trường.
- Tự động tính toán GPA hệ 4, hệ 10 và thống kê số tín chỉ nợ.
- Phân loại học lực sinh viên và theo dõi tiến độ học tập qua từng học kỳ một cách trực quan.

### 3. Đánh giá Điểm rèn luyện (Training Points)
- Biểu mẫu đánh giá chi tiết tuân thủ đúng 5 tiêu chí chuẩn của Bộ Giáo dục và Đào tạo.
- Tích hợp logic tự động tính điểm rèn luyện dựa trên kết quả học tập (GPA) từ phân hệ học thuật.
- Ràng buộc điểm tối đa, tự động quy đổi thành chữ (Xuất sắc, Giỏi, Khá, Trung bình...).
- **Xuất báo cáo tự động:** Kết xuất bảng tổng hợp kết quả rèn luyện ra file Excel hoàn chỉnh thông qua việc đọc - ghi đè tự động lên file mẫu (template) tiêu chuẩn của phòng Công tác Sinh viên.

### 4. Quản lý Thông báo (Notifications)
- Truyền tải thông tin từ Khoa đến các lớp hành chính.
- Phân loại thông báo, lên lịch và hỗ trợ sao chép nội dung từ các kỳ trước, giúp giảm thiểu thao tác lặp lại.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

- **Frontend:** React.js, Vite, Lucide Icons, Vanilla CSS (Thiết kế Modern Aesthetics, Glassmorphism). Sử dụng hoàn toàn **Native Fetch API** (không dùng thư viện ngoài như Axios) để tối ưu hiệu năng.
- **Backend:** Node.js, Express.js.
- **Database:** MySQL.
- **Authentication:** JSON Web Token (JWT) & Hệ thống phân quyền dựa trên vai trò Role-Based Access Control (RBAC).

---

## 🔐 Phân Quyền Hệ Thống (RBAC)

Hệ thống được thiết kế với 4 vai trò chính thông qua mã định danh (ID Role):

| ID | Vai trò | Tên Actor | Quyền hạn chính |
|:---:|:---|:---|:---|
| **0** | **Admin** | Quản trị viên | Toàn quyền quản trị hệ thống, quản lý người dùng và cấp tài khoản. |
| **1** | **GVCN** | Giảng viên chủ nhiệm | Quản lý SV, điểm số, rèn luyện lớp phụ trách và xem báo cáo. |
| **2** | **Bộ môn/Khoa** | Trưởng bộ môn/khoa | Quản lý và đẩy thông báo, giám sát tiến độ toàn khoa. |
| **4** | **Lớp trưởng** | Sinh viên BCS | Thực hiện điểm danh sinh viên và xem thông báo của lớp. |

---

## 📦 Cấu Trúc Thư Mục (Folder Structure)

```text
eduadviser/
├── be/ (Backend - Node.js/Express)
│   ├── assets/       # Chứa các file template Excel cố định (VD: Mẫu tổng hợp ĐRL)
│   ├── config/       # Cấu hình Database & Environment Variables
│   ├── controllers/  # Xử lý logic nghiệp vụ, tính toán, kết xuất file Excel
│   ├── middleware/   # Xác thực (JWT Verify) & Kiểm tra phân quyền (Check Role)
│   ├── routes/       # Định nghĩa các Endpoints cho API
│   ├── server.js     # Điểm khởi chạy Server, cấu hình CORS
│   └── package.json  # Khai báo thư viện Backend (exceljs, jsonwebtoken, mysql2,...)
│
├── fe/ (Frontend - Vite + React)
│   ├── src/
│   │   ├── api/      # Các hàm gọi API sử dụng Native Fetch (Interceptor pattern custom)
│   │   ├── components/# Các UI Components dùng chung (Button, Modal, Table...)
│   │   ├── layouts/  # Bố cục hệ thống chính (Sidebar, Header, Dashboard Wrapper)
│   │   ├── pages/    # Các trang giao diện cho nghiệp vụ (Attendance, Grades,...)
│   │   ├── index.css # Global Stylesheet, CSS Variables, Design Tokens
│   │   └── main.jsx  # Điểm mount của React App
│   └── package.json  # Khai báo thư viện Frontend
└── README.md
```

---

## ⚙️ Hướng Dẫn Cài Đặt Và Chạy Hệ Thống (Getting Started)

### Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/en/download/) (Khuyến nghị phiên bản v18.x trở lên)
- [MySQL](https://dev.mysql.com/downloads/installer/) Server đang chạy.

### Bước 1: Khởi tạo Cơ sở dữ liệu (Database Setup)
1. Mở MySQL Client hoặc công cụ như phpMyAdmin, DBeaver, MySQL Workbench.
2. Tạo một schema database mới (ví dụ: `ql_gvcn`).
3. Chạy các file `.sql` (nếu có, như `full_data.sql`, `sinhvien.sql`) được lưu trữ tại root directory để import cấu trúc bảng và dữ liệu mẫu.

### Bước 2: Cấu hình Môi trường (Environment Variables)
Tạo file `.env` nằm trong thư mục `be/` (`be/.env`) và điền các cấu hình dựa vào server CSDL của bạn:

```env
# Port chạy Backend Server
PORT=5000

# Cấu hình kết nối MySQL Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mật_khẩu_mysql_của_bạn # Ví dụ: miku0505
DB_NAME=ql_gvcn

# Chuỗi bí mật dùng để mã hóa JWT Token (bạn có thể thay đổi tùy ý)
JWT_SECRET=supersecretkey_ql_gvcn_2026_tuy_chinh_tai_day
```

### Bước 3: Chạy Backend (API Server)
Mở một cửa sổ Terminal mới:
```bash
cd be
# Cài đặt các thư viện cần thiết
npm install
# Khởi động server (Mặc định sẽ chạy ở http://localhost:5000)
npm run dev
```

### Bước 4: Chạy Frontend (Client)
Mở một cửa sổ Terminal khác:
```bash
cd fe
# Cài đặt thư viện Frontend
npm install
# Khởi động ứng dụng React (Vite sẽ tự khởi chạy trên cổng mặc định)
npm run dev
```
Sau đó truy cập vào trình duyệt tại địa chỉ hiển thị trên terminal (Thường là `http://localhost:5173`).

---

## 💡 Cơ Chế Hoạt Động Của Một Số Flow Chính

1. **Flow Xuất báo cáo (Export Excel):**
   - Khi người dùng bấm "Xuất Excel" trên giao diện, Frontend gửi các tham số lọc (`thang`, `namHoc`, `lopId`...) qua API Fetch.
   - Backend sử dụng thư viện `exceljs` để đọc file template từ thư mục `be/assets/`.
   - Backend query database tổng hợp dữ liệu, tự động thêm/xóa dòng tùy theo số lượng học sinh thực tế, đổ dữ liệu và công thức vào đúng tọa độ các Cell trong Excel, sau đó trả file nhị phân (Blob) về cho Frontend tải xuống.

2. **Flow Đăng nhập & Xác thực:**
   - Hệ thống không sử dụng Cookie mà trả Token về JSON response.
   - Frontend lưu Token vào `localStorage` hoặc state manager và đính kèm vào header `Authorization: Bearer <token>` trên mỗi Fetch Request.
   - Các `middleware` tại Backend sẽ giải mã JWT để biết Actor (ID Role) đang gọi API có được phép thực hiện hành động đó không.

---
© 2026 EduAdviser Project - Đồ án tốt nghiệp Công nghệ thông tin.

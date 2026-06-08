# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG EDUADVISER

> *Tài liệu này trình bày hướng dẫn vận hành chi tiết cho từng phân hệ của hệ thống EduAdviser — sản phẩm được xây dựng trong khuôn khổ Đồ án Tốt nghiệp. Toàn bộ nội dung bám sát mã nguồn thực tế đã được triển khai và kiểm thử.*

---

## 4.1. Giới thiệu tổng quan về sản phẩm

EduAdviser là hệ thống web hỗ trợ công tác cố vấn học tập, được thiết kế nhằm số hóa và tự động hóa các quy trình hành chính thủ công mà Giáo viên Chủ nhiệm (GVCN) phải thực hiện định kỳ tại các trường đại học. Hệ thống giải quyết các bài toán thực tiễn bao gồm: quản lý hồ sơ sinh viên, theo dõi chuyên cần, chấm điểm rèn luyện và sinh tự động báo cáo hành chính.

Trong quá trình thực hiện đồ án, em đã lựa chọn kiến trúc **3 lớp (Three-tier Architecture)**:
- **Lớp Trình diễn (Frontend)**: React + Vite, giao diện Single Page Application (SPA) với ngôn ngữ thiết kế Glassmorphism.
- **Lớp Nghiệp vụ (Backend)**: Node.js + Express.js, xử lý toàn bộ logic và cung cấp RESTful API.
- **Lớp Dữ liệu (Database)**: MySQL, lưu trữ toàn bộ thực thể của hệ thống.

---

## 4.2. Yêu cầu môi trường và hướng dẫn khởi chạy

Để hội đồng có thể chạy thử nghiệm, sinh viên hướng dẫn cài đặt môi trường như sau:

### 4.2.1. Khởi động Backend (Lớp Nghiệp vụ)

```bash
# Di chuyển vào thư mục backend
cd be

# Cài đặt các gói thư viện phụ thuộc (chỉ cần thực hiện lần đầu)
npm install

# Khởi động máy chủ API ở chế độ phát triển
npm run dev
```

Sau khi thực thi, máy chủ sẽ lắng nghe tại `http://localhost:5000`. Server sử dụng `nodemon` để tự động khởi động lại khi có thay đổi mã nguồn trong quá trình phát triển.

### 4.2.2. Khởi động Frontend (Lớp Trình diễn)

```bash
# Di chuyển vào thư mục frontend
cd fe

# Cài đặt các gói thư viện phụ thuộc
npm install

# Khởi động server Vite ở chế độ phát triển
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`. Giao diện người dùng được thiết kế theo hướng Mobile-First, tương thích tốt trên cả màn hình Desktop và thiết bị di động.

> **Lưu ý cho hội đồng:** Cần khởi động Backend trước, sau đó mới khởi động Frontend để đảm bảo các lời gọi API không bị lỗi kết nối.

---

## 4.3. Cơ chế phân quyền và bảo mật điều hướng

Đây là một trong những điểm kỹ thuật em chú trọng nhất trong quá trình thiết kế hệ thống. Hệ thống phân quyền được xây dựng dựa trên **JSON Web Token (JWT)** kết hợp với **React Router v6 Protected Routes**.

### 4.3.1. Ma trận phân quyền

| Role ID | Vai trò | Quyền hạn |
|---|---|---|
| **0** | Quản trị viên (Admin) | Toàn quyền hệ thống: quản lý tài khoản, nhập liệu hàng loạt, cấu hình dữ liệu nền |
| **1** | Giáo viên Chủ nhiệm (GVCN) | Quản lý học vụ, điểm rèn luyện, điểm danh, báo cáo của lớp phụ trách |
| **2** | Trưởng Khoa / Trưởng Bộ môn | Quản lý GVCN, ban hành thông báo, giám sát số liệu toàn Khoa |
| **4** | Lớp trưởng | Chỉ được phép truy cập duy nhất phân hệ Điểm danh |

### 4.3.2. Luồng điều hướng sau đăng nhập

Sau khi xác thực thành công tại `/login`, hệ thống đọc giá trị `role` trong JWT payload và thực hiện điều hướng:

- **Role 4 (Lớp trưởng)**: React Router lập tức **redirect thẳng tới `/attendance`**. Mọi route khác đều bị chặn bởi `ProtectedRoute`. Lớp trưởng không có Sidebar và không có Dashboard — đây là thiết kế có chủ đích nhằm bảo vệ dữ liệu cá nhân của sinh viên trong lớp.
- **Role 0, 1, 2**: Điều hướng về `/dashboard` với đầy đủ Sidebar Menu tương ứng với quyền hạn từng vai trò.

---

## 4.4. Hướng dẫn sử dụng dành cho Giáo viên Chủ nhiệm (Role 1)

GVCN là đối tượng người dùng trung tâm, thực hiện hầu hết các nghiệp vụ cốt lõi của hệ thống.

### 4.4.1. Bảng điều khiển (Dashboard — `/dashboard`)

Khi đăng nhập, GVCN được chuyển đến Dashboard. Tại đây, Frontend gọi API `thongKeAPI.getOverview()` và render dữ liệu lên **4 thẻ thống kê (Stat Cards)**:

- **Tổng số lớp** đang phụ trách.
- **Tổng số sinh viên** trong các lớp đó.
- **Số lớp có sinh viên vắng** trong kỳ.
- **Số sinh viên vắng nhiều** (vượt ngưỡng cảnh báo).

Bên dưới là **Khu vực Cảnh báo** gồm 2 bảng:
1. Bảng cảnh báo các lớp nghỉ học nhiều.
2. Bảng **Sinh viên vắng mặt nhiều nhất** — hiển thị Họ tên, Mã sinh viên và số lượt vắng bằng màu đỏ nổi bật. GVCN có thể nhấn **"Xem tất cả"** để chuyển sang phân hệ điểm danh xử lý.

### 4.4.2. Quản lý Hồ sơ Sinh viên (`/students`)

GVCN chọn lớp cần xem từ Dropdown, danh sách sinh viên sẽ được tải xuống từ API.

**Xem hồ sơ chi tiết:**
- Nhấn nút **Chi tiết** (biểu tượng 👁️) để mở cửa sổ Modal. Modal được chia thành 4 tab thông tin: *Cơ bản*, *Học tập*, *Liên hệ & Địa chỉ*, *Gia đình & Khác*.

**Nghiệp vụ Liên hệ Phụ huynh Khẩn cấp:**
- Nhấn nút **PH** (màu đỏ, biểu tượng điện thoại) tại hàng sinh viên cần liên hệ.
- Cửa sổ popup hiển thị: SĐT Bố, SĐT Mẹ, SĐT Nhà riêng (được trích từ hồ sơ nhập ban đầu).
- Mỗi số điện thoại có 2 nút thao tác nhanh:
  - **Gọi ngay**: Kích hoạt giao thức `tel:` — mở ứng dụng gọi điện của thiết bị.
  - **Nhắn Zalo**: Mở khung chat Zalo qua URL `https://zalo.me/{sdt}`.

> **Ghi chú kỹ thuật:** Tính năng này giúp GVCN liên hệ phụ huynh chỉ trong 2 thao tác, thay vì phải tra cứu thủ công trong sổ danh sách giấy như trước đây.

### 4.4.3. Giám sát Điểm danh (`/attendance`)

> *Lưu ý quan trọng: GVCN **không có quyền nhập/chỉnh sửa** dữ liệu điểm danh. Đây là thiết kế cố ý để phân tách trách nhiệm — dữ liệu do Lớp trưởng nhập, GVCN chỉ giám sát.*

Màn hình Điểm danh của GVCN gồm 2 tab:

**Tab 1 — "Điểm danh buổi học":**
- GVCN chọn *Ngày* và *Buổi* (Sáng / Chiều) để xem kết quả mà Lớp trưởng đã nhập.
- Toàn bộ ô trạng thái sinh viên ở chế độ `disabled` (chỉ đọc).
- Giao diện tự động tính và hiển thị: **Tổng sĩ số**, **Số có mặt**, **Số vắng mặt**.

**Tab 2 — "Tổng kết & Cảnh báo":**
- GVCN chọn **Tháng** cần tổng kết. Hệ thống tổng hợp và phân loại sinh viên theo mức độ vi phạm chuyên cần:
  - 🟡 **Badge Vàng (Cảnh báo)**: Vắng dưới ngưỡng báo động.
  - 🔴 **Badge Đỏ (Nguy hiểm)**: Vắng không phép ≥ 3 buổi (ngưỡng mặc định).
- Tích hợp nút **"Liên hệ PH"** ngay trên dòng của sinh viên vi phạm để GVCN xử lý nhanh.
- Hỗ trợ nút **Xuất Excel** để lưu bằng chứng chuyên cần phục vụ họp xét kỷ luật.

### 4.4.4. Cập nhật Điểm học tập (`/grades`)

Cuối mỗi học kỳ, GVCN cần nhập điểm học tập để hệ thống phục vụ tính điểm rèn luyện tự động.

**Quy trình thực hiện:**
1. Vào trang `/grades`, chọn **Học kỳ** cần cập nhật.
2. Tải lên **file Excel Bảng điểm** (file xuất từ Phòng Đào tạo).
3. Backend phân tích file, trích xuất dữ liệu và tính toán tự động:
   - **Điểm hệ 10** và **GPA hệ 4** cho từng môn học.
   - **Số tín chỉ Đạt** và **Số tín chỉ Nợ** (môn có điểm < 4.0 hoặc điểm chữ F bị tính là nợ).

### 4.4.5. Chấm Điểm Rèn luyện (`/training-points`)

Đây là phân hệ phức tạp nhất, cũng là điểm em đầu tư nhiều công sức nhất trong đồ án.

**Giao diện dạng lưới (Excel-like Grid):**
- Trang hiển thị bảng chấm điểm với các **Tab tiêu chí** tương tự trang tính Excel: *Tổng hợp, TC1, TC2, TC3, TC4, TC5*.

**Thuật toán tự động hóa điểm học lực (TC 1.4 & 1.5):**

Khi GVCN nhấn nút **"Tự động tính từ điểm học tập"**, hệ thống thực hiện chuỗi logic:
- Truy vấn bảng `Grades` để lấy GPA và số tín chỉ nợ của từng sinh viên.
- **TC 1.5 (Kết quả học tập)**:
  - GPA ≥ 3.6 → tự động điền **6 điểm**.
  - GPA < 5.0 → **0 điểm**.
- **TC 1.4 (Vượt khó trong học tập)**: Tính theo tỷ lệ `(Số TC nợ / Tổng TC)` rồi map sang thang điểm tương ứng.
- **TC 5.2**: Tự động điền 10 điểm nếu sinh viên đạt GPA ≥ 9.0.

**Nhập thủ công các tiêu chí còn lại:**
- Tại các ô tiêu chí hoạt động phong trào, GVCN nhập điểm trực tiếp vào ô. Frontend áp dụng hàm `Math.min()` để tự động giới hạn, không cho phép nhập vượt quá điểm tối đa của tiêu chí đó.
- Nhấn **"Lưu ĐRL cho cả lớp"** để ghi toàn bộ dữ liệu xuống Database một lần (Batch Save).

### 4.4.6. Báo cáo Tháng (`/reports`)

**Tính năng Điền nhanh (Smart Auto-fill):**

Đây là tính năng em tâm đắc nhất vì nó giải quyết trực tiếp "nỗi đau" của GVCN: mỗi tháng phải tổng hợp thủ công 4-5 nguồn dữ liệu khác nhau để điền vào mẫu báo cáo.

Quy trình khi nhấn nút **"✨ Điền nhanh từ thông báo"**:
1. Frontend gọi API gom dữ liệu từ 4 bảng: `Classes`, `Students`, `Attendance`, `Notifications`.
2. Tự động lấy: **Sĩ số lớp**, **Họ tên & SĐT Lớp trưởng**, **Tổng số SV vắng** trong tháng.
3. Quét bảng `Notifications`: lấy toàn bộ công văn/thông báo của **tháng hiện tại** điền vào ô *Nội dung phổ biến*; lấy thông báo **tháng kế tiếp** điền vào *Kế hoạch tháng tới*.
4. Form được điền hoàn chỉnh — GVCN chỉ cần kiểm tra và bổ sung nếu cần.

**Xuất văn bản Word:**
- Nhấn **"Sinh file báo cáo (Word)"**.
- Backend sử dụng thư viện `docx` để tạo file `.docx` đúng thể thức văn bản hành chính Nhà nước, có đầy đủ tiêu đề, logo, chữ ký đúng mẫu của trường.

### 4.4.7. Thông báo & Zalo (`/notifications`)

- GVCN xem danh sách thông báo từ Khoa/Trường.
- Nhấn **"Triển khai"** để đánh dấu đã tiếp nhận thông báo (ghi log vào Database).
- Nhấn **"Copy nội dung Zalo"**: hệ thống định dạng nội dung thông báo thành văn bản có icon và xuống dòng phù hợp với Zalo, sau đó ghi vào Clipboard. GVCN chỉ cần `Ctrl+V` vào group lớp trên Zalo.

---

## 4.5. Hướng dẫn sử dụng dành cho Lớp trưởng (Role 4)

Lớp trưởng là đối tượng **nhập liệu chuyên cần thực tế** — người duy nhất có quyền ghi dữ liệu điểm danh. Hệ thống giới hạn hoàn toàn các quyền xem hồ sơ cá nhân sinh viên khác để đảm bảo bảo mật.

### 4.5.1. Thực hiện Điểm danh

**Luồng thao tác:**
1. Đăng nhập → Hệ thống tự động chuyển đến `/attendance` (không qua Dashboard).
2. Chọn **Lớp** (nếu được phân công quản lý nhiều lớp).
3. Chọn **Ngày** và **Buổi học** (Sáng / Chiều).
4. Danh sách sinh viên hiện ra. Tại cột **Trạng thái**, Lớp trưởng dùng Dropdown chọn:
   - `Có mặt` ✅
   - `Nghỉ phép` 📋
   - `Nghỉ không phép` ❌
   - `Đi muộn` ⏰
5. **Mặc định toàn lớp là "Có mặt"** — Lớp trưởng chỉ cần thay đổi trạng thái của những bạn vắng/đi muộn, giúp tiết kiệm thao tác.
6. Nhấn **"Lưu kết quả"** (biểu tượng 💾). Dữ liệu được lưu ngay vào Database và lập tức ảnh hưởng đến badge cảnh báo trên giao diện GVCN.

---

## 4.6. Hướng dẫn sử dụng dành cho Trưởng Khoa / Bộ môn (Role 2)

### 4.6.1. Quản lý Danh sách GVCN (`/teachers`)

Trưởng Khoa được cung cấp giao diện riêng để **Thêm / Sửa / Xóa** tài khoản GVCN trong Khoa mình. Đây là sự khác biệt so với Admin — phân quyền này cho phép Khoa chủ động quản lý nhân sự mà không cần phụ thuộc Admin cấp trường.

### 4.6.2. Ban hành Thông báo (`/notifications`)

1. Nhấn **"Tạo thông báo mới"**, soạn thảo nội dung.
2. Chọn **Phạm vi áp dụng** (Khoa nào nhận thông báo). Thông báo của Trưởng Khoa CNTT sẽ chỉ hiển thị trên bảng tin của GVCN thuộc Khoa CNTT — tránh "loạn thông báo" giữa các Khoa.
3. Theo dõi danh sách lớp đã triển khai thông báo.

### 4.6.3. Giám sát Dashboard & Báo cáo

- Dashboard hiển thị số liệu sinh viên nghỉ học của **toàn Khoa** (thay vì từng lớp như GVCN).

---

## 4.7. Hướng dẫn sử dụng dành cho Quản trị viên (Role 0)

### 4.7.1. Quản trị Tài khoản (`/users`)

- Xem và quản lý toàn bộ danh sách tài khoản hệ thống.
- Phân Role cho từng người dùng: Admin (0), GVCN (1), Trưởng Khoa (2), Lớp trưởng (4).
- Reset mật khẩu khi người dùng quên.

### 4.7.2. Nhập liệu Hàng loạt (Bulk Import)

**Import Lớp học (`/classes`):**
- Tải lên file Excel danh sách lớp.
- Hệ thống tự động chuyển đổi: Năm nhập học (ví dụ: `2022`) → Niên khóa (`K20`).

**Import Sinh viên (`/students`):**
- Tải lên file hồ sơ sinh viên chuẩn của Trường.
- Backend xử lý tự động: chuyển đổi **Excel Serial Date** (ví dụ: `44927`) sang định dạng **ISO 8601** (`2023-01-01`) để lưu đúng ngày sinh vào Database. Đây là một vấn đề kỹ thuật phổ biến khi làm việc với Excel mà em đã giải quyết trong quá trình triển khai.
- Phân bổ chức danh Lớp trưởng cho sinh viên cụ thể trong lớp.

### 4.7.3. Sửa lỗi Dữ liệu Khẩn cấp

Module `/grades` cung cấp nút **"Xóa toàn bộ điểm lớp"** (chỉ hiện với Role 0 và 1) để xử lý tình huống GVCN import nhầm file điểm. Tính năng này giải phóng toàn bộ dữ liệu điểm của lớp trong một thao tác, thay vì phải xóa từng dòng thủ công.

---

## 4.8. Các quy trình tự động hóa nghiệp vụ nổi bật

Phần này tóm tắt 3 luồng xử lý khép kín thể hiện rõ nhất giá trị tự động hóa mà hệ thống mang lại:

### Luồng 1: Cảnh báo Chuyên cần

```
Lớp trưởng chọn "Nghỉ không phép"
  → Lưu vào Database (bảng Attendance)
  → API Backend tổng hợp (SUM) số buổi vắng
  → Frontend so sánh với ngưỡng (≥ 3)
  → Render Badge Đỏ trên giao diện GVCN
  → Hiện nút "Liên hệ PH" → GVCN gọi Zalo cho phụ huynh
```

### Luồng 2: Chấm Điểm Rèn luyện tự động

```
GVCN import file Excel điểm
  → Backend trích xuất mảng [GPA, TínChỉ]
  → Mapping vào Schema Điểm rèn luyện (TC 1.4, 1.5, 5.2)
  → Thực thi hàm getTC1_4(), getTC1_5()
  → Render trực tiếp lên Grid
  → GVCN nhấn "Lưu" → Batch Save xuống Database
```

### Luồng 3: Sinh Báo cáo Hành chính tự động

```
Khoa tạo Thông báo
  → Lớp trưởng điểm danh
  → GVCN mở trang Báo cáo → Click "Điền nhanh"
  → React gọi API gom dữ liệu 4 bảng (Classes, Students, Attendance, Notifications)
  → Điền tự động vào Form State
  → Render Document View
  → Nhấn "Xuất Word" → Backend sinh file .docx chuẩn hành chính
```

---

*Toàn bộ mã nguồn hệ thống, bao gồm Frontend, Backend và tài liệu kỹ thuật, được lưu trữ tại repository của đồ án và sẵn sàng để hội đồng kiểm tra, nghiệm thu.*

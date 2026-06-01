# TÀI LIỆU VẬN HÀNH VÀ KIẾN TRÚC HỆ THỐNG CHI TIẾT (DEEP DIVE)

Tài liệu này cung cấp một cái nhìn giải phẫu chi tiết nhất về cách dữ liệu và luồng điều khiển di chuyển qua 3 tầng kiến trúc của hệ thống: **Tầng Giao diện (Frontend)**, **Tầng Xử lý Nghiệp vụ (Backend/API)**, và **Tầng Dữ liệu (Database)**.

---

## PHẦN 1: TẦNG GIAO DIỆN (PRESENTATION LAYER - REACTJS)

Tầng này chạy hoàn toàn trên trình duyệt của người dùng, chịu trách nhiệm kết xuất giao diện (UI) và phản hồi lại các thao tác của người dùng.

### 1.1. Quản lý Trạng thái (State Management)
*   **Trạng thái Cục bộ (Local State):** Ứng dụng sử dụng mạnh mẽ các React Hooks (`useState`). Thay vì quản lý từng biến lẻ tẻ, các form phức tạp (như form Báo cáo tháng) sử dụng một đối tượng State duy nhất (Ví dụ: `formData`). Bất kỳ khi nào người dùng gõ vào một ô input, sự kiện `onChange` sẽ được kích hoạt, gọi hàm `setFormData` để cập nhật chính xác thuộc tính đó (sử dụng toán tử spread `...prev`).
*   **Vòng đời Component (Lifecycle & Side Effects):** Thông qua `useEffect`, hệ thống "lắng nghe" sự thay đổi. Ví dụ tại trang Reports, mảng phụ thuộc là `[selectedClass, month, year]`. Ngay khi người dùng đổi từ "Tháng 4" sang "Tháng 5", `useEffect` bị trigger, lập tức hiển thị hiệu ứng "Đang tải..." và gọi API xuống Backend để kéo dữ liệu mới lên, đảm bảo giao diện luôn đồng bộ với cấu hình đang chọn.

### 1.2. Tầng Giao tiếp API (API Integration Layer)
*   Tất cả các lệnh gọi API không được viết trực tiếp vào Component mà được gom lại trong file `src/api/index.js` và `src/api/fetchClient.js`.
*   Hệ thống không dùng thư viện ngoài mà tự xây dựng một Custom Client dựa trên **Native Fetch API**. Hàm `fetchClient` sẽ tự động "nhúng" chuỗi `Authorization: Bearer <Token>` (được lấy từ `localStorage`) vào mọi Request Header trước khi gửi đi. Điều này giúp Frontend nhẹ, không phụ thuộc thư viện thứ 3, và tự động xử lý bảo mật cho mọi chức năng.

### 1.3. Logic Hiển thị Động (Conditional Rendering)
*   Giao diện liên tục tự đánh giá quyền hạn và dữ liệu. Nếu `reportData` trả về từ Backend là `null` (chưa có báo cáo), Frontend sẽ tự động gọi logic **Auto-fill**: nó tự động đếm số phần tử trong danh sách sinh viên của lớp để điền vào ô "Sĩ số", tự động tìm tên sinh viên có `id` trùng với `lopTruongId` để điền vào ô "Lớp trưởng". Nếu đã có dữ liệu, nó sẽ fill dữ liệu cũ lên form và đổi nút thành "Cập nhật".

---

## PHẦN 2: TẦNG XỬ LÝ NGHIỆP VỤ (BUSINESS LOGIC LAYER - NODE.JS & EXPRESS)

Đây là "bộ não" trung tâm, nơi đặt toàn bộ các quy tắc nghiệp vụ khắt khe nhất. Quá trình xử lý một Request đi qua các chốt kiểm soát sau:

### 2.1. Chốt chặn Middleware (Xác thực và Ủy quyền)
*   Mọi Request đi vào đều bị chặn lại bởi `auth.middleware.js`.
*   Nó trích xuất Token từ Header, sử dụng thư viện `jsonwebtoken` cùng khóa bí mật (`JWT_SECRET`) để giải mã.
*   Nếu giải mã thành công, nó bóc tách thông tin `userId` và `role` ra, gán ngược lại vào đối tượng `req` (ví dụ `req.userId`, `req.userRole`) và cho phép đi tiếp (`next()`). Từ lúc này, mọi Controller phía sau đều biết chính xác "Ai đang gọi API này và Quyền của họ là gì".

### 2.2. Xử lý Logic Phức tạp tại Controllers
Tầng này chịu trách nhiệm cho các thuật toán khó nhất của hệ thống:

**A. Thuật toán Quét và Import Excel (`ketquahoctap.controller.js`)**
1.  **Nhận File:** API nhận một file nhị phân qua thư viện `multer` và lưu tạm vào ổ cứng (`uploads/`).
2.  **Đọc Ma trận:** Thư viện `xlsx` đọc file và chuyển Sheet đầu tiên thành một ma trận 2 chiều (Mảng của mảng).
3.  **Thuật toán quét tọa độ (Coordinate Scanning):**
    *   Thuật toán duyệt hàng thứ 3 (Index 2) để tìm tên môn học.
    *   Duyệt hàng thứ 4 (Index 3) để lấy số tín chỉ của môn đó.
    *   Duyệt hàng thứ 5 (Index 4) bằng một vòng lặp `while`, tìm chính xác cột nào chứa chữ "H10" (Điểm hệ 10) và cột nào chứa chữ "Chữ" (Điểm chữ) nằm ngay dưới tên môn học đó. Kết quả được lưu vào mảng `subjects = [{ tenMon, soTinChi, h10Idx, chuIdx }]`.
4.  **Ghi dữ liệu:** Bắt đầu từ hàng 6 trở đi (chứa điểm của sinh viên). Hệ thống lấy Mã Sinh Viên ở cột đầu tiên, truy vấn DB lấy `sinhVienId` thật. Sau đó, lặp qua mảng `subjects` ở trên, dùng `h10Idx` và `chuIdx` làm tọa độ để trích xuất đúng điểm của sinh viên đó, tạo lệnh `INSERT` vào bảng `ket_qua_hoc_tap`.
5.  **Dọn rác:** Lệnh `fs.unlink()` được gọi trong khối `finally` để xóa file Excel tạm, đảm bảo không rò rỉ dữ liệu nhạy cảm ra ngoài ổ cứng máy chủ.

**B. Thuật toán Auto-fill & Phân loại Thông báo (`trienkhaithongbao.controller.js` / Frontend Report Logic)**
1.  **Thu thập chéo:** Lấy toàn bộ thông báo của tháng hiện tại (`thang`, `nam`).
2.  **Lọc theo Context:** Kiểm tra thuộc tính `khoaApDung`. Nếu thông báo ghi "ALL" (Toàn trường) hoặc trùng với mã Khoa của lớp đang xét (ví dụ "CNTT"), thông báo đó được giữ lại.
3.  **Phân nhóm (Grouping):** Đưa các thông báo vào một Object dictionary (hoặc mảng 2 chiều) theo key là `loai` (Nhà trường, Khoa, Bộ môn, CVHT).
4.  **Dự báo (Forecasting):** Tính toán tháng tiếp theo (Nếu tháng hiện tại là 12, tự động set tháng sau là 1, năm + 1). Lại gọi một truy vấn vào bảng `thong_bao` cho tháng sau để tự động lấy dữ liệu đắp vào mục "Triển khai tháng sau" trong báo cáo.

**C. Thuật toán Sinh văn bản Word (Docx Rendering)**
1.  **Khởi tạo Cây DOM Word:** Sử dụng thư viện `docx` để tạo đối tượng `Document`.
2.  **Định tuyến Đoạn văn (Paragraph Routing):** Hàm `mkPara` được tạo ra để cấu hình mặc định font "Times New Roman", size 16 (trong code là 32 half-points), và dãn dòng `276` (khoảng 1.15 lines).
3.  **Tách Chuỗi Động (Dynamic Splitting):** Dữ liệu văn bản từ DB (ví dụ: `tomTatHoatDong`) được đưa qua lệnh `split('\n')`. Hệ thống duyệt qua từng dòng. Nếu dòng không bị rỗng, nó kiểm tra xem đã có dấu `- ` ở đầu chưa, nếu chưa thì chèn vào, sau đó bọc dòng đó trong một `Paragraph`.
4.  **Bảng Chữ Ký Tàng Hình:** Tạo một đối tượng `Table` với độ rộng 100%. Bảng có 2 hàng (Hàng 1: Chức danh, Hàng 2: Tên người ký). Bảng được cấu hình `BorderStyle.SINGLE` nhưng trong thực tế thường để trong suốt để người dùng in ra trông giống như dùng tab (Tab stop) căn lề phải/trái.
5.  **Biên dịch:** Đóng gói toàn bộ cây Document thành một luồng Base64, chuyển sang `Buffer` nhị phân, thiết lập MIME type (`application/vnd.openxmlformats...`) và gửi `res.send(buffer)` thẳng về trình duyệt.

---

## PHẦN 3: TẦNG DỮ LIỆU (DATA ACCESS LAYER - MYSQL)

Tầng này là điểm neo cuối cùng, đảm bảo dữ liệu không bị sai lệch, trùng lặp hoặc mất mát.

### 3.1. Quản lý Kết nối (Connection Pooling)
Backend không mở và đóng kết nối CSDL liên tục. Nó sử dụng `mysql2/promise` để tạo ra một **Connection Pool** (Hồ chứa kết nối). Khi có Request, hệ thống "mượn" một kết nối từ Pool, thực hiện truy vấn, rồi trả lại Pool. Điều này giúp hệ thống chịu tải cực tốt mà không bị tràn bộ nhớ.

### 3.2. Cấu trúc Liên kết Dữ liệu (Relational Integrity)
*   **Điểm rèn luyện phân tầng:** Khi GVCN lưu điểm rèn luyện, dữ liệu được băm làm 2 phần. Thông tin chung (tổng điểm, học kỳ, xếp loại) nằm ở bảng `diem_ren_luyen`. 19 điểm chi tiết từng tiêu chí (TC1.1, TC1.2...) nằm ở bảng `chi_tiet_ren_luyen` và nối với nhau qua `diemRenLuyenId`.
*   **Bảo mật Liên kết (Data Isolation):** Tất cả các truy vấn (Queries) đều có hàm ý kiểm tra quyền. Ví dụ truy vấn Lớp học sẽ có mệnh đề: `SELECT * FROM lop WHERE gvcNId = ?` (với `?` là ID của user đang đăng nhập). Điều này khóa chặt dữ liệu ở tầng cơ sở dữ liệu, đảm bảo không có lỗ hổng rò rỉ chéo.

### 3.3. Cơ chế Giao dịch Nguyên tử (ACID Transactions)
Trong các tác vụ nguy hiểm như `Xóa toàn bộ sinh viên trong lớp` (`deleteAllByLop`), hệ thống phải xóa hàng ngàn bản ghi ở nhiều bảng khác nhau. Cơ chế Giao dịch được kích hoạt:
1.  **Bắt đầu (BEGIN):** Gọi `await connection.beginTransaction()`. DB sẽ tạo một bản nháp ảo.
2.  **Chuỗi Thực Thi (Execution Sequence):** Lệnh xóa được thực thi theo thứ tự từ Bảng Con lên Bảng Cha để không vi phạm Khóa Ngoại (Foreign Key Constraints).
    *   Xóa `ket_qua_hoc_tap` (Điểm số).
    *   Xóa `diem_danh` (Điểm danh).
    *   Xóa `chi_tiet_ren_luyen` -> Xóa `diem_ren_luyen`.
    *   Xóa `lop_sinhvien` (Liên kết lớp).
    *   Xóa `sinh_vien`.
    *   Xóa `users` (Tài khoản đăng nhập của sinh viên đó).
3.  **Xác nhận (COMMIT):** Nếu chạy đến dòng cuối cùng thành công, gọi `await connection.commit()`. Bản nháp ảo được ghi chính thức vào đĩa cứng.
4.  **Hoàn tác (ROLLBACK):** Nếu ở bất kỳ bước nào (ví dụ xóa điểm danh bị lỗi), khối `catch (error)` sẽ bắt được. Lập tức lệnh `await connection.rollback()` được thực thi. Toàn bộ các thao tác đã xóa trước đó (điểm số) sẽ được phục hồi lại như chưa có chuyện gì xảy ra. Điều này ngăn chặn triệt để thảm họa "Dữ liệu bị xóa một nửa" làm treo hệ thống.

---

## PHẦN 4: VÍ DỤ CỤ THỂ VỀ LUỒNG HOẠT ĐỘNG CỦA CÁC CHỨC NĂNG

Để hình dung một cách rõ nét nhất về cách 3 tầng trên phối hợp với nhau, dưới đây là mô tả chi tiết từng bước (Step-by-step) của 5 kịch bản sử dụng thực tế.

### Ví dụ 1: Kịch bản GVCN Import Bảng Điểm từ Excel
*Mục tiêu: Đưa bảng điểm của 50 sinh viên từ file Excel vào Database một cách an toàn.*

1. **[Tầng Giao diện]** GVCN truy cập trang Quản lý Điểm (`Grades.jsx`), chọn lớp "12422TN", chọn Học kỳ 1, Năm 2025, và tải lên file `Bang_diem_lop.xlsx`.
2. **[Tầng Giao diện]** Nhấn nút "Import". Mã React đóng gói file vào một `FormData` object và gửi POST request đến `/api/ket-qua-hoc-tap/upload`.
3. **[Tầng Backend]** Middleware `multer` đón file, lưu tạm vào đường dẫn `be/uploads/temp_123.xlsx`.
4. **[Tầng Backend]** Controller `uploadExcel` bắt đầu chạy:
   * Mở file bằng `xlsx.readFile`.
   * Chạy thuật toán "Quét tọa độ" (như mô tả ở mục 2.2.A). Nó phát hiện ra: Môn "Cơ sở Dữ liệu" ở cột E (hệ 10) và cột F (hệ chữ); môn "Mạng Máy tính" ở cột G (hệ 10) và cột H (hệ chữ).
   * Vòng lặp bắt đầu đọc từ hàng thứ 6 (chứa dữ liệu sinh viên). Gặp MSSV `12422001`, nó trích xuất điểm ở cột E, F, G, H.
5. **[Tầng Database]** Với mỗi sinh viên và mỗi môn học, Backend gọi MySQL: `DELETE FROM ket_qua_hoc_tap WHERE sinhVienId = ? AND monHocId = ?` để xóa điểm cũ (nếu có thi lại/học lại), sau đó gọi `INSERT INTO` để chèn điểm mới vừa đọc được.
6. **[Tầng Backend]** Hoàn tất vòng lặp cho 50 sinh viên. Hàm `fs.unlink(req.file.path)` được chạy để xóa file `temp_123.xlsx` khỏi ổ cứng.
7. **[Tầng Giao diện]** Nhận response `HTTP 200 OK`. React hiển thị thông báo "Import thành công", tự động gọi lại API `getAll` để bảng trên màn hình hiển thị ngay lập tức điểm số của 50 sinh viên vừa nhập.

### Ví dụ 2: Kịch bản Tính năng "Điền nhanh" Báo cáo tháng
*Mục tiêu: GVCN không cần gõ lại các thông báo lắt nhắt của Trường/Khoa vào biên bản họp lớp.*

1. **[Tầng Giao diện]** Đầu tháng 5, GVCN mở trang Báo cáo (`Reports.jsx`) và chọn lớp "12422TN", tháng "5".
2. **[Tầng Giao diện]** Hàm `useEffect` phát hiện có sự thay đổi tháng, lập tức gọi hàm `fetchNotificationsAndReport()`.
3. **[Tầng Backend]** Nhận được Request hỏi dữ liệu tháng 5 của lớp 12422TN.
   * Query 1: Lấy thông tin lớp để biết lớp này thuộc Khoa nào (VD: Khoa "CNTT").
   * Query 2: Lấy tất cả thông báo của tháng 5. Lọc bỏ các thông báo của Khoa Điện, Khoa Cơ Khí... chỉ giữ lại thông báo "ALL" (Nhà trường) và "CNTT" (Khoa của lớp).
   * Query 3: Tìm xem đã có báo cáo nào lưu cho tháng 5 chưa. Trả về `null` vì GVCN chưa soạn báo cáo.
4. **[Tầng Giao diện]** Nhận kết quả báo cáo là `null`. React lập tức chạy logic Auto-fill:
   * Tự động đếm mảng sinh viên gán vào biến `autoSiSo`.
   * Lấy danh sách thông báo tháng 5 vừa trả về, format chúng thành các gạch đầu dòng `- Thông báo thu học phí...` và nhét vào trường "Nội dung triển khai của Trường/Khoa".
   * Gọi thêm một API phụ lấy thông báo của **tháng 6** để nhét sẵn vào ô "Kế hoạch tháng tới".
5. **[Tầng Giao diện]** Hàm `setFormData` cập nhật các biến này, các ô input trên màn hình tự động xuất hiện chữ (như có phép thuật) mà GVCN chưa hề gõ một phím nào.

### Ví dụ 3: Kịch bản Phân quyền Tự động - Gán Lớp trưởng
*Mục tiêu: Khi GVCN chỉ định một sinh viên làm lớp trưởng, hệ thống tự cấp tài khoản đăng nhập cho sinh viên đó.*

1. **[Tầng Giao diện]** GVCN vào trang Quản lý Lớp, nhấn Sửa lớp "12422TN", chọn sinh viên Nguyễn Văn A (MSSV: `12422001`) vào dropdown "Lớp trưởng" và nhấn "Lưu".
2. **[Tầng Backend]** Controller `lop.controller.js` hàm `update` nhận request.
3. **[Tầng Database]** Nó kiểm tra DB xem lớp này trước đó có lớp trưởng cũ không.
   * Nếu có lớp trưởng cũ (ví dụ: Lê Văn B): Truy tìm `user_id` của Lê Văn B và thực hiện lệnh `DELETE FROM users WHERE id = ?`. Tài khoản của lớp trưởng cũ bị hủy để bảo mật.
   * Đối với lớp trưởng mới (Nguyễn Văn A): Trích xuất `maSV` và `hoTen`.
4. **[Tầng Backend]** Khởi tạo một câu lệnh tạo người dùng: `INSERT INTO users (username, password, role) VALUES ('12422001', 'sv@12422001', 4)`. (Lưu ý: Role = 4 là quyền Lớp trưởng).
5. **[Tầng Database]** Sau khi tạo xong User, lấy `InsertId` của bảng Users cập nhật ngược lại vào cột `user_id` của sinh viên Nguyễn Văn A trong bảng `sinh_vien`.
6. **[Kết quả]** Lớp được gán lớp trưởng. Đồng thời, sinh viên Nguyễn Văn A ngay lập tức có thể dùng MSSV của mình để đăng nhập vào hệ thống. Mọi luồng API điểm danh của Nguyễn Văn A lúc này sẽ mang `req.userRole = 4` và được phép vượt qua chốt kiểm tra quyền lực ở Backend.

### Ví dụ 4: Kịch bản Thêm và Cập nhật Sinh viên (Create/Update - CRUD)
*Mục tiêu: Xử lý quy trình thêm một sinh viên mới vào lớp và cập nhật thông tin cá nhân của sinh viên.*

1. **[Tầng Giao diện]** GVCN nhấn "Thêm Sinh viên" trên trang `Students.jsx`. Một form Modal (cửa sổ nổi) hiện lên. Người dùng nhập MSSV (`12422002`), Họ tên ("Trần Thị C"), Số điện thoại, và Ngày sinh.
2. **[Tầng Giao diện]** Khi nhấn "Lưu", hàm `handleSubmit` trong React kiểm tra xem form đang ở chế độ "Thêm mới" (không có `id`) hay "Cập nhật" (có `id`).
   * Nếu Thêm mới: Gọi `sinhVienAPI.create()` (tương đương `fetch POST /sinhvien`).
   * Nếu Cập nhật: Gọi `sinhVienAPI.update()` (tương đương `fetch PUT /sinhvien/:id`).
3. **[Tầng Backend]** `sinhvien.controller.js` tiếp nhận dữ liệu. Đối với tính năng Thêm mới, Controller thực hiện 2 thao tác ghi vào DB:
   * Gọi `INSERT INTO sinh_vien` để tạo hồ sơ cá nhân của sinh viên.
   * Lấy `id` của sinh viên vừa tạo ra, gọi tiếp `INSERT INTO lop_sinhvien` để "gắn" sinh viên này vào lớp học hiện tại (tạo quan hệ N-N).
4. **[Tầng Giao diện]** Sau khi Backend trả về `success`, Modal tự động đóng lại (bằng cách set state `setIsModalOpen(false)`). Giao diện gọi hàm `fetchStudents()` để render lại danh sách, người dùng thấy ngay tên Trần Thị C xuất hiện trên bảng.

### Ví dụ 5: Kịch bản Xóa Sinh viên (Cascading Delete - CRUD)
*Mục tiêu: Đảm bảo khi xóa một sinh viên, toàn bộ điểm số, điểm danh, và tài khoản liên quan không trở thành "dữ liệu rác" (Orphaned Data).*

1. **[Tầng Giao diện]** GVCN tìm đến sinh viên "Trần Thị C" và nhấn icon Thùng rác. Trình duyệt hiện popup xác nhận "Bạn có chắc chắn muốn xóa?". Nếu chọn Yes, gọi API `sinhVienAPI.delete()` (tương đương `fetch DELETE /sinhvien/:id`).
2. **[Tầng Backend]** Controller `delete` tiếp nhận yêu cầu. Mở một **Database Transaction** (`await connection.beginTransaction()`) để đảm bảo quá trình xóa phải hoàn tất 100%, nếu không sẽ bị hủy bỏ (rollback).
3. **[Tầng Database]** Backend gửi tuần tự các lệnh xóa (từ dưới lên trên cấu trúc cây) để không bị lỗi khóa ngoại (Foreign Key Constraints):
   * `DELETE FROM ket_qua_hoc_tap WHERE sinhVienId = ?`: Xóa toàn bộ điểm học tập.
   * `DELETE FROM diem_danh WHERE sinhVienId = ?`: Xóa lịch sử điểm danh.
   * Xóa điểm rèn luyện: Do điểm rèn luyện có bảng con (19 tiêu chí chi tiết), hệ thống phải quét tìm tất cả `diemRenLuyenId` của sinh viên này, xóa ở bảng `chi_tiet_ren_luyen` trước, rồi mới xóa ở bảng `diem_ren_luyen`.
   * `DELETE FROM lop_sinhvien WHERE sinhVienId = ?`: Gỡ sinh viên khỏi danh sách lớp.
   * Kiểm tra xem sinh viên này có đang làm Lớp trưởng (có `user_id` không). Nếu có, xóa luôn dòng tương ứng trong bảng `users` để thu hồi quyền đăng nhập.
   * Cuối cùng: `DELETE FROM sinh_vien WHERE id = ?`.
4. **[Tầng Database]** Nếu mọi thứ trơn tru, gọi `await connection.commit()`. Toàn bộ dữ liệu của Trần Thị C biến mất hoàn toàn khỏi hệ thống mà không để lại bất kỳ dữ liệu rác nào.
5. **[Tầng Giao diện]** Khối `catch` của `fetchClient` không bị kích hoạt vì Response trả về HTTP 200. Giao diện hiển thị Toast "Xóa thành công" và tự động lọc sinh viên này ra khỏi State đang hiển thị trên màn hình (`setStudents(prev => prev.filter(s => s.id !== deletedId))`), giúp cập nhật UI tức thì mà không cần load lại trang.


### Module `/auth`
- **[POST]** `/auth/register`
  - **Dữ liệu yêu cầu**: Body: username, password, email, full_name, phone, role
- **[POST]** `/auth/login`
  - **Dữ liệu yêu cầu**: Body: username, password

### Module `/chi-tiet-ren-luyen`
- **[GET]** `/chi-tiet-ren-luyen`
  - **Dữ liệu yêu cầu**: Không yêu cầu field cụ thể (hoặc upload file/FormData)
- **[GET]** `/chi-tiet-ren-luyen/diem-ren-luyen/:drlId`
  - **Dữ liệu yêu cầu**: Params: drlId
- **[POST]** `/chi-tiet-ren-luyen`
  - **Dữ liệu yêu cầu**: Body: diemRenLuyenId, tieuChi, noiDung, diem, diemToiDa
- **[PUT]** `/chi-tiet-ren-luyen/:id`
  - **Dữ liệu yêu cầu**: Body: diemRenLuyenId, tieuChi, noiDung, diem, diemToiDa | Params: id
- **[DELETE]** `/chi-tiet-ren-luyen/:id`
  - **Dữ liệu yêu cầu**: Params: id

### Module `/diem-danh`
- **[GET]** `/diem-danh`
  - **Dữ liệu yêu cầu**: Query: page, limit, sinhVienId, lopId, ngay
- **[GET]** `/diem-danh/export-excel`
  - **Dữ liệu yêu cầu**: Query: nam, lopId, thang
- **[GET]** `/diem-danh/absence-summary`
  - **Dữ liệu yêu cầu**: Query: lopId, tuNgay, denNgay
- **[GET]** `/diem-danh/lop/:lopId`
  - **Dữ liệu yêu cầu**: Params: lopId
- **[GET]** `/diem-danh/sinhvien/:svId`
  - **Dữ liệu yêu cầu**: Params: svId
- **[POST]** `/diem-danh`
  - **Dữ liệu yêu cầu**: Body: sinhVienId, lopId, ngay, thu, buoi, trangThai
- **[PUT]** `/diem-danh/:id`
  - **Dữ liệu yêu cầu**: Body: sinhVienId, lopId, ngay, thu, buoi, trangThai | Params: id
- **[DELETE]** `/diem-danh/:id`
  - **Dữ liệu yêu cầu**: Params: id

### Module `/diem-ren-luyen`
- **[GET]** `/diem-ren-luyen`
  - **Dữ liệu yêu cầu**: Query: page, limit, sinhVienId, hocKy, namHoc, lopId
- **[GET]** `/diem-ren-luyen/export-excel`
  - **Dữ liệu yêu cầu**: Query: lopId, hocKy, namHoc
- **[GET]** `/diem-ren-luyen/sinhvien/:svId`
  - **Dữ liệu yêu cầu**: Params: svId
- **[POST]** `/diem-ren-luyen/batch`
  - **Dữ liệu yêu cầu**: Body: lopId, hocKy, namHoc, data
- **[POST]** `/diem-ren-luyen`
  - **Dữ liệu yêu cầu**: Body: sinhVienId, hocKy, namHoc, tongDiem, xepLoai
- **[PUT]** `/diem-ren-luyen/:id`
  - **Dữ liệu yêu cầu**: Body: sinhVienId, hocKy, namHoc, tongDiem, xepLoai | Params: id
- **[DELETE]** `/diem-ren-luyen/lop/:lopId`
  - **Dữ liệu yêu cầu**: Params: lopId
- **[DELETE]** `/diem-ren-luyen/:id`
  - **Dữ liệu yêu cầu**: Params: id

### Module `/ket-qua-hoc-tap`
- **[GET]** `/ket-qua-hoc-tap`
  - **Dữ liệu yêu cầu**: Query: page, limit, sinhVienId, hocKy, namHoc, lopId
- **[GET]** `/ket-qua-hoc-tap/sinhvien/:svId`
  - **Dữ liệu yêu cầu**: Params: svId
- **[POST]** `/ket-qua-hoc-tap/upload`
  - **Dữ liệu yêu cầu**: Body: namHoc, lopId
- **[POST]** `/ket-qua-hoc-tap`
  - **Dữ liệu yêu cầu**: Body: sinhVienId, monHocId, diem10, diemChu, hocKy, namHoc, hocLai
- **[PUT]** `/ket-qua-hoc-tap/:id`
  - **Dữ liệu yêu cầu**: Body: sinhVienId, monHocId, diem10, diemChu, hocKy, namHoc, hocLai | Params: id
- **[DELETE]** `/ket-qua-hoc-tap/lop/:lopId`
  - **Dữ liệu yêu cầu**: Params: lopId
- **[DELETE]** `/ket-qua-hoc-tap/:id`
  - **Dữ liệu yêu cầu**: Params: id

### Module `/lop`
- **[GET]** `/lop`
  - **Dữ liệu yêu cầu**: Query: page, limit, search, khoa, nganh
- **[GET]** `/lop/:id`
  - **Dữ liệu yêu cầu**: Params: id
- **[POST]** `/lop`
  - **Dữ liệu yêu cầu**: Body: tenLop, khoa, nganh, trangThai, gvcNId, lopTruongId
- **[POST]** `/lop/import-classes`
  - **Dữ liệu yêu cầu**: Body: classes
- **[POST]** `/lop/import-all`
  - **Dữ liệu yêu cầu**: Body: data
- **[POST]** `/lop/:id/import`
  - **Dữ liệu yêu cầu**: Body: students | Params: id
- **[PUT]** `/lop/:id`
  - **Dữ liệu yêu cầu**: Body: tenLop, khoa, nganh, trangThai, gvcNId, lopTruongId | Params: id
- **[DELETE]** `/lop/:id`
  - **Dữ liệu yêu cầu**: Params: id

### Module `/lop-sinhvien`
- **[GET]** `/lop-sinhvien`
  - **Dữ liệu yêu cầu**: Không yêu cầu field cụ thể (hoặc upload file/FormData)
- **[GET]** `/lop-sinhvien/lop/:lopId`
  - **Dữ liệu yêu cầu**: Params: lopId
- **[POST]** `/lop-sinhvien`
  - **Dữ liệu yêu cầu**: Body: lop_id, sinhvien_id
- **[DELETE]** `/lop-sinhvien/:lop_id/:sinhvien_id`
  - **Dữ liệu yêu cầu**: Params: lop_id, sinhvien_id

### Module `/mon-hoc`
- **[GET]** `/mon-hoc`
  - **Dữ liệu yêu cầu**: Query: page, limit, search
- **[GET]** `/mon-hoc/:id`
  - **Dữ liệu yêu cầu**: Params: id
- **[POST]** `/mon-hoc`
  - **Dữ liệu yêu cầu**: Body: tenMon, soTinChi
- **[PUT]** `/mon-hoc/:id`
  - **Dữ liệu yêu cầu**: Body: tenMon, soTinChi | Params: id
- **[DELETE]** `/mon-hoc/:id`
  - **Dữ liệu yêu cầu**: Params: id

### Module `/sinhvien`
- **[GET]** `/sinhvien`
  - **Dữ liệu yêu cầu**: Query: page, limit, search, nganh, trangThai, lopId
- **[GET]** `/sinhvien/:id`
  - **Dữ liệu yêu cầu**: Params: id
- **[POST]** `/sinhvien`
  - **Dữ liệu yêu cầu**: Không yêu cầu field cụ thể (hoặc upload file/FormData)
- **[PUT]** `/sinhvien/:id`
  - **Dữ liệu yêu cầu**: Params: id
- **[DELETE]** `/sinhvien/:id`
  - **Dữ liệu yêu cầu**: Params: id
- **[DELETE]** `/sinhvien/lop/:lopId`
  - **Dữ liệu yêu cầu**: Params: lopId

### Module `/thongbao`
- **[GET]** `/thongbao`
  - **Dữ liệu yêu cầu**: Query: page, limit, loai, nam, thang, search
- **[POST]** `/thongbao/copy-month`
  - **Dữ liệu yêu cầu**: Body: fromMonth, fromYear, toMonth, toYear
- **[GET]** `/thongbao/:id`
  - **Dữ liệu yêu cầu**: Params: id
- **[POST]** `/thongbao`
  - **Dữ liệu yêu cầu**: Không yêu cầu field cụ thể (hoặc upload file/FormData)
- **[PUT]** `/thongbao/:id`
  - **Dữ liệu yêu cầu**: Body: noiDung, loai, khoaApDung, nam, thang | Params: id
- **[DELETE]** `/thongbao/:id`
  - **Dữ liệu yêu cầu**: Params: id

### Module `/thong-bao-da-trien-khai`
- **[GET]** `/thong-bao-da-trien-khai/lop/:lopId`
  - **Dữ liệu yêu cầu**: Params: lopId
- **[POST]** `/thong-bao-da-trien-khai/mark`
  - **Dữ liệu yêu cầu**: Body: thongBaoId, lopId, gvcnId
- **[POST]** `/thong-bao-da-trien-khai/unmark`
  - **Dữ liệu yêu cầu**: Body: thongBaoId, lopId

### Module `/thong-ke`
- **[GET]** `/thong-ke`
  - **Dữ liệu yêu cầu**: Không yêu cầu field cụ thể (hoặc upload file/FormData)

### Module `/trien-khai-thong-bao`
- **[GET]** `/trien-khai-thong-bao/export/word`
  - **Dữ liệu yêu cầu**: Query: lopId, thang, nam
- **[GET]** `/trien-khai-thong-bao`
  - **Dữ liệu yêu cầu**: Query: page, limit, lopId, thang, nam
- **[GET]** `/trien-khai-thong-bao/lop/:lopId`
  - **Dữ liệu yêu cầu**: Params: lopId
- **[POST]** `/trien-khai-thong-bao`
  - **Dữ liệu yêu cầu**: Không yêu cầu field cụ thể (hoặc upload file/FormData)
- **[PUT]** `/trien-khai-thong-bao/:id`
  - **Dữ liệu yêu cầu**: Params: id
- **[DELETE]** `/trien-khai-thong-bao/:id`
  - **Dữ liệu yêu cầu**: Params: id

### Module `/users`
- **[GET]** `/users`
  - **Dữ liệu yêu cầu**: Không yêu cầu field cụ thể (hoặc upload file/FormData)
- **[GET]** `/users/:id`
  - **Dữ liệu yêu cầu**: Params: id
- **[POST]** `/users`
  - **Dữ liệu yêu cầu**: Body: username, password, email, full_name, phone, role
- **[PUT]** `/users/:id`
  - **Dữ liệu yêu cầu**: Body: email, full_name, phone, role, password | Params: id
- **[DELETE]** `/users/:id`
  - **Dữ liệu yêu cầu**: Params: id

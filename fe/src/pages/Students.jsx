import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Phone, Mail, MessageCircle, AlertCircle, Eye, X, Users, Edit2, Trash2, Plus, Save } from 'lucide-react';
import { sinhVienAPI, lopAPI } from '../api';

const Students = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [contactStudent, setContactStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Chuyển năm nhập học → Niên khóa (2022 → K20, 2021 → K19...)
  const getKhoa = (year) => {
    const y = parseInt(year);
    if (!y || isNaN(y)) return year || '---';
    // 2002 là gốc: K1; 2021 → K19, 2022 → K20...
    const k = y - 2002;
    return k > 0 ? `K${k}` : year;
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await sinhVienAPI.getAll({ search, page, limit: 10, lopId: selectedClass });
      setStudents(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
    try {
      const res = await lopAPI.getAll({ limit: 100 });
      let list = res.data || [];
      
      // Nếu là Trưởng bộ môn (2), lọc chỉ lấy các lớp mình trực tiếp làm GVCN để xem danh sách sinh viên
      if (user && parseInt(user.role) === 2) {
        list = list.filter(c => c.gvcNId === user.id);
      }

      setClasses(list);
      if (list.length > 0) setSelectedClass(list[0].id.toString());
    } catch (err) {
      console.error(err);
    }
  };
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, selectedClass]);

  const handleSearch = () => {
    if (page === 1) {
      fetchStudents();
    } else {
      setPage(1);
    }
  };

  const handleSaveStudent = async () => {
    try {
      if (selectedStudent.id) {
        await sinhVienAPI.update(selectedStudent.id, selectedStudent);
        alert('Cập nhật thành công');
      } else {
        // For new student, we should ideally assign them to selectedClass
        await sinhVienAPI.create({ ...selectedStudent, lopId: selectedClass || undefined });
        alert('Thêm sinh viên thành công');
      }
      setIsEditingMode(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu sinh viên');
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) {
      try {
        await sinhVienAPI.delete(id);
        fetchStudents();
      } catch (err) {
        console.error(err);
        alert('Lỗi xóa sinh viên');
      }
    }
  };

  const roleNum = user ? parseInt(user.role) : -1;

  if (classes.length === 0 && !loading && roleNum !== 0) {
    return (
      <div className="d-flex flex-column align-center justify-center" style={{ minHeight: '60vh', textAlign: 'center' }}>
        <div className="glass mb-4" style={{ padding: '40px', borderRadius: '24px', maxWidth: '500px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '20px', 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
          }}>
            <Users size={40} color="var(--primary)" />
          </div>
          <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Chưa có lớp quản lý</h2>
          <p className="text-muted" style={{ marginBottom: '32px', lineHeight: 1.6 }}>
            Bạn hiện không quản lý trực tiếp sinh viên nào. 
            Danh sách sinh viên chỉ hiển thị cho các lớp bạn được phân công.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ padding: '12px 32px' }}>
            Quay lại bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-4 glass page-header">
        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Quản lý danh sách sinh viên</h3>
         <div className="d-flex gap-3 flex-wrap align-center" style={{ width: '100%' }}>
          <div style={{ minWidth: '200px' }}>
            <select 
              className="form-control"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setPage(1);
              }}
            >
              <option value="">-- Tất cả các lớp --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.tenLop}</option>
              ))}
            </select>
          </div>
          <div className="d-flex gap-2" style={{ flex: 1 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm mã SV, họ tên..."
              style={{ flex: 1 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-outline" onClick={handleSearch}>Tìm kiếm</button>
            <button className="btn btn-success" onClick={() => { setSelectedStudent({}); setIsEditingMode(true); }}>
              <Plus size={18} style={{ marginRight: '4px' }} /> Thêm SV
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table-stackable">
            <thead>
              <tr>
                <th>MSV / Họ tên</th>
                <th className="hide-mobile">Cơ bản</th>
                <th className="hide-mobile">Khoá / Ngành</th>
                <th>Liên hệ SV</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Đang tải dữ liệu...</td></tr>
              ) : students.length > 0 ? (
                students.map(sv => (
                  <tr key={sv.id}>
                    <td data-label="Sinh viên">
                      <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{sv.maSV}</div>
                      <div style={{ fontWeight: 500 }}>{sv.hoTen}</div>
                    </td>
                    <td className="hide-mobile" data-label="Cơ bản">
                      <div>{sv.ngaySinh ? new Date(sv.ngaySinh).toLocaleDateString('vi-VN') : '---'}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Quê: {sv.queQuan || '---'}</div>
                    </td>
                    <td className="hide-mobile" data-label="Khoá / Ngành">
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                        {sv.tenKhoa || sv.nganh || '---'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {sv.khoa ? getKhoa(sv.khoa) : '---'}
                        {sv.nganh && sv.tenKhoa ? ` • ${sv.nganh}` : ''}
                      </div>
                    </td>
                    <td data-label="Liên hệ SV">
                      {sv.dienThoaiCaNhan ? (
                        <div className="d-flex align-center gap-2 mb-1" style={{ fontSize: '0.875rem' }}>
                          <Phone size={14} /> {sv.dienThoaiCaNhan}
                        </div>
                      ) : (
                        <div className="d-flex align-center gap-2 text-danger mb-1" style={{ fontSize: '0.75rem' }}>
                          <AlertCircle size={14} /> Thiếu SĐT
                        </div>
                      )}
                      {sv.email ? (
                        <div className="d-flex align-center gap-2 text-muted" style={{ fontSize: '0.75rem', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sv.email}>
                          <Mail size={14} /> {sv.email}
                        </div>
                      ) : (
                        <div className="d-flex align-center gap-2 text-danger" style={{ fontSize: '0.75rem' }}>
                          <AlertCircle size={14} /> Thiếu Email
                        </div>
                      )}
                    </td>
                    <td data-label="Trạng thái">
                      {sv.trangThai === 'Đã xác thực' ? (
                        <span className="badge badge-success">Đã xác thực</span>
                      ) : (
                        <span className="badge badge-warning">{sv.trangThai || 'Chưa xác thực'}</span>
                      )}
                    </td>
                    <td data-label="Hành động">
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline" title="Chi tiết" onClick={() => { setSelectedStudent(sv); setIsEditingMode(false); }} style={{ padding: '6px' }}><Eye size={16} /></button>
                        <button
                          className="btn btn-danger"
                          title="Liên hệ Phụ huynh"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => setContactStudent(sv)}
                        >
                          <Phone size={14} /> PH
                        </button>
                        {roleNum === 0 && (
                          <button className="btn btn-danger" title="Xóa" onClick={() => handleDeleteStudent(sv.id)} style={{ padding: '6px' }}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Chưa có dữ liệu sinh viên nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex" style={{ justifyContent: 'center', padding: '15px', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              className="btn btn-outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Trước
            </button>
            <span style={{ padding: '8px 12px', fontWeight: 'bold' }}>Trang {page} / {totalPages}</span>
            <button
              className="btn btn-outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Modal Chi tiết Sinh viên */}
      {selectedStudent && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card glass animate-fade-in" style={{ width: '700px', maxWidth: '95%', maxHeight: '90vh', height: 'fit-content', overflowY: 'auto', margin: 'auto' }}>
            <div className="d-flex" style={{ justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                {selectedStudent.id ? (isEditingMode ? 'Sửa Sinh viên' : 'Hồ sơ Sinh viên') : 'Thêm Sinh viên'}
                {selectedStudent.hoTen && !isEditingMode && `: `}
                {!isEditingMode && <span style={{ color: 'var(--primary)' }}>{selectedStudent.hoTen}</span>}
              </h3>
              <div className="d-flex gap-2">
                {!isEditingMode && (
                  <button className="btn btn-outline" onClick={() => setIsEditingMode(true)} style={{ padding: '6px' }}>
                    <Edit2 size={18} />
                  </button>
                )}
                <button onClick={() => { setSelectedStudent(null); setIsEditingMode(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '6px' }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '1rem', marginBottom: '10px' }}>Thông tin cơ bản</h4>
                {isEditingMode ? (
                  <>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Mã SV</label><input className="form-control" value={selectedStudent.maSV || ''} onChange={e => setSelectedStudent({...selectedStudent, maSV: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Họ tên</label><input className="form-control" value={selectedStudent.hoTen || ''} onChange={e => setSelectedStudent({...selectedStudent, hoTen: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Ngày sinh</label><input type="date" className="form-control" value={selectedStudent.ngaySinh ? new Date(selectedStudent.ngaySinh).toISOString().split('T')[0] : ''} onChange={e => setSelectedStudent({...selectedStudent, ngaySinh: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Giới tính</label><input className="form-control" value={selectedStudent.gioiTinh || ''} onChange={e => setSelectedStudent({...selectedStudent, gioiTinh: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Dân tộc</label><input className="form-control" value={selectedStudent.danToc || ''} onChange={e => setSelectedStudent({...selectedStudent, danToc: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Tôn giáo</label><input className="form-control" value={selectedStudent.tonGiao || ''} onChange={e => setSelectedStudent({...selectedStudent, tonGiao: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Nơi sinh</label><input className="form-control" value={selectedStudent.noiSinh || ''} onChange={e => setSelectedStudent({...selectedStudent, noiSinh: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Quê quán</label><input className="form-control" value={selectedStudent.queQuan || ''} onChange={e => setSelectedStudent({...selectedStudent, queQuan: e.target.value})} /></div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Mã SV:</strong> {selectedStudent.maSV}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Ngày sinh:</strong> {selectedStudent.ngaySinh ? new Date(selectedStudent.ngaySinh).toLocaleDateString('vi-VN') : '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Giới tính:</strong> {selectedStudent.gioiTinh || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Dân tộc:</strong> {selectedStudent.danToc || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Tôn giáo:</strong> {selectedStudent.tonGiao || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Nơi sinh:</strong> {selectedStudent.noiSinh || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Quê quán:</strong> {selectedStudent.queQuan || '---'}</p>
                  </>
                )}
              </div>

              <div>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '1rem', marginBottom: '10px' }}>Học tập</h4>
                {isEditingMode ? (
                  <>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Trạng thái</label><input className="form-control" value={selectedStudent.trangThai || ''} onChange={e => setSelectedStudent({...selectedStudent, trangThai: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Năm nhập học (để tính khóa)</label><input type="number" className="form-control" value={selectedStudent.khoa || ''} onChange={e => setSelectedStudent({...selectedStudent, khoa: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Tên khoa</label><input className="form-control" value={selectedStudent.tenKhoa || ''} onChange={e => setSelectedStudent({...selectedStudent, tenKhoa: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Ngành</label><input className="form-control" value={selectedStudent.nganh || ''} onChange={e => setSelectedStudent({...selectedStudent, nganh: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Chuyên ngành</label><input className="form-control" value={selectedStudent.chuyenNganh || ''} onChange={e => setSelectedStudent({...selectedStudent, chuyenNganh: e.target.value})} /></div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Trạng thái:</strong> {selectedStudent.trangThai || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Khóa:</strong> {getKhoa(selectedStudent.khoa)}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Khoa:</strong> {selectedStudent.tenKhoa || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Ngành:</strong> {selectedStudent.nganh || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Chuyên ngành:</strong> {selectedStudent.chuyenNganh || '---'}</p>
                  </>
                )}
              </div>

              <div>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '1rem', marginBottom: '10px' }}>Liên hệ & Địa chỉ</h4>
                {isEditingMode ? (
                  <>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>SĐT cá nhân</label><input className="form-control" value={selectedStudent.dienThoaiCaNhan || ''} onChange={e => setSelectedStudent({...selectedStudent, dienThoaiCaNhan: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Email</label><input className="form-control" value={selectedStudent.email || ''} onChange={e => setSelectedStudent({...selectedStudent, email: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>SĐT nhà riêng</label><input className="form-control" value={selectedStudent.dienThoaiNR || ''} onChange={e => setSelectedStudent({...selectedStudent, dienThoaiNR: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Thường trú</label><input className="form-control" value={selectedStudent.diaChiThuongTru || ''} onChange={e => setSelectedStudent({...selectedStudent, diaChiThuongTru: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Đ/c báo tin</label><input className="form-control" value={selectedStudent.diaChiBaoTin || ''} onChange={e => setSelectedStudent({...selectedStudent, diaChiBaoTin: e.target.value})} /></div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>SĐT cá nhân:</strong> {selectedStudent.dienThoaiCaNhan || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Email:</strong> {selectedStudent.email || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>SĐT nhà riêng:</strong> {selectedStudent.dienThoaiNR || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Thường trú:</strong> {selectedStudent.diaChiThuongTru || '---'} {selectedStudent.tinhThuongTru ? `(${selectedStudent.tinhThuongTru})` : ''}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Đ/c báo tin:</strong> {selectedStudent.diaChiBaoTin || '---'}</p>
                  </>
                )}
              </div>

              <div>
                <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '1rem', marginBottom: '10px' }}>Gia đình & Khác</h4>
                {isEditingMode ? (
                  <>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Họ tên Bố</label><input className="form-control" value={selectedStudent.hoTenBo || ''} onChange={e => setSelectedStudent({...selectedStudent, hoTenBo: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>SĐT Bố</label><input className="form-control" value={selectedStudent.dienThoaiBo || ''} onChange={e => setSelectedStudent({...selectedStudent, dienThoaiBo: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Họ tên Mẹ</label><input className="form-control" value={selectedStudent.hoTenMe || ''} onChange={e => setSelectedStudent({...selectedStudent, hoTenMe: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>SĐT Mẹ</label><input className="form-control" value={selectedStudent.dienThoaiMe || ''} onChange={e => setSelectedStudent({...selectedStudent, dienThoaiMe: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Số tài khoản</label><input className="form-control" value={selectedStudent.soTaiKhoan || ''} onChange={e => setSelectedStudent({...selectedStudent, soTaiKhoan: e.target.value})} /></div>
                    <div className="form-group mb-2"><label className="form-label" style={{ fontSize: '0.8rem' }}>Ghi chú</label><input className="form-control" value={selectedStudent.ghiChu || ''} onChange={e => setSelectedStudent({...selectedStudent, ghiChu: e.target.value})} /></div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Họ tên Bố:</strong> {selectedStudent.hoTenBo || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>SĐT Bố:</strong> {selectedStudent.dienThoaiBo || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Họ tên Mẹ:</strong> {selectedStudent.hoTenMe || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>SĐT Mẹ:</strong> {selectedStudent.dienThoaiMe || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Số tài khoản:</strong> {selectedStudent.soTaiKhoan || '---'}</p>
                    <p style={{ margin: '8px 0', fontSize: '0.875rem' }}><strong>Ghi chú:</strong> {selectedStudent.ghiChu || '---'}</p>
                  </>
                )}
              </div>
            </div>

            <div className="d-flex gap-2 justify-end" style={{ marginTop: '20px' }}>
              {isEditingMode ? (
                <>
                  <button className="btn btn-outline" onClick={() => { setIsEditingMode(false); if (!selectedStudent.id) setSelectedStudent(null); }}>Hủy</button>
                  <button className="btn btn-primary" onClick={handleSaveStudent}><Save size={18} style={{ marginRight: '4px' }} /> Lưu thay đổi</button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={() => setSelectedStudent(null)}>Đóng</button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Modal Liên hệ Phụ huynh */}
      {contactStudent && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card animate-fade-in" style={{ width: '400px', maxWidth: '95%', padding: '24px', height: 'fit-content', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-between align-center mb-4">
              <h3 style={{ margin: 0 }}>📞 Liên hệ Phụ huynh</h3>
              <button onClick={() => setContactStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Sinh viên: <strong>{contactStudent.hoTen}</strong> ({contactStudent.maSV})
            </p>
            {/* Thông tin Bố */}
            {(contactStudent.hoTenBo || contactStudent.dienThoaiBo) && (
              <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>👨 Bố: {contactStudent.hoTenBo || 'Không có tên'}</div>
                {contactStudent.dienThoaiBo ? (
                  <div className="d-flex gap-2">
                    <a href={`tel:${contactStudent.dienThoaiBo}`} className="btn btn-primary" style={{ flex: 1, padding: '8px', textDecoration: 'none', fontSize: '0.9rem' }}>
                      <Phone size={14} /> {contactStudent.dienThoaiBo}
                    </a>
                    <a href={`https://zalo.me/${contactStudent.dienThoaiBo}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px 12px', textDecoration: 'none' }}>
                      <MessageCircle size={14} /> Zalo
                    </a>
                  </div>
                ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Không có SĐT</span>}
              </div>
            )}
            {/* Thông tin Mẹ */}
            {(contactStudent.hoTenMe || contactStudent.dienThoaiMe) && (
              <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>👩 Mẹ: {contactStudent.hoTenMe || 'Không có tên'}</div>
                {contactStudent.dienThoaiMe ? (
                  <div className="d-flex gap-2">
                    <a href={`tel:${contactStudent.dienThoaiMe}`} className="btn btn-primary" style={{ flex: 1, padding: '8px', textDecoration: 'none', fontSize: '0.9rem' }}>
                      <Phone size={14} /> {contactStudent.dienThoaiMe}
                    </a>
                    <a href={`https://zalo.me/${contactStudent.dienThoaiMe}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px 12px', textDecoration: 'none' }}>
                      <MessageCircle size={14} /> Zalo
                    </a>
                  </div>
                ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Không có SĐT</span>}
              </div>
            )}
            {!contactStudent.hoTenBo && !contactStudent.hoTenMe && !contactStudent.dienThoaiBo && !contactStudent.dienThoaiMe && !contactStudent.dienThoaiNR && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>⚠️ Chưa có thông tin phụ huynh trong hệ thống.</p>
            )}
            {/* SĐT nhà riêng */}
            {contactStudent.dienThoaiNR && (
              <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>🏠 SĐT nhà riêng</div>
                <div className="d-flex gap-2">
                  <a href={`tel:${contactStudent.dienThoaiNR}`} className="btn btn-primary" style={{ flex: 1, padding: '8px', textDecoration: 'none', fontSize: '0.9rem' }}>
                    <Phone size={14} /> {contactStudent.dienThoaiNR}
                  </a>
                  <a href={`https://zalo.me/${contactStudent.dienThoaiNR}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '8px 12px', textDecoration: 'none' }}>
                    <MessageCircle size={14} /> Zalo
                  </a>
                </div>
              </div>
            )}
            <button className="btn btn-outline" style={{ width: '100%', marginTop: '8px' }} onClick={() => setContactStudent(null)}>Đóng</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Students;

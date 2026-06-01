import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Filter, Edit2, X, Upload, Trash2, Plus } from 'lucide-react';
import { lopAPI, lopSinhVienAPI, userAPI, sinhVienAPI } from '../api';
import * as XLSX from 'xlsx';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [khoa, setKhoa] = useState('');
  const [nganh, setNganh] = useState('');
  const [hideGraduated, setHideGraduated] = useState(true);
  const [availableKhoas, setAvailableKhoas] = useState([]);
  const [availableNganhs, setAvailableNganhs] = useState([]);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = parseInt(user.role);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // Chuyển năm nhập học → Niên khóa (2022 → K20, 2021 → K19...)
  const getKhoa = (yearOrCode) => {
    let y = parseInt(yearOrCode);
    if (isNaN(y)) return yearOrCode || '---';
    
    // Nếu là 2 chữ số (ví dụ 22), chuyển thành 2022
    if (y < 100) {
      y += 2000;
    }
    
    // 2002 là gốc: K1; 2022 → K20
    const k = y - 2002;
    return k > 0 ? `K${k}` : String(y);
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      // Tăng limit để lấy được nhiều lớp hơn (mặc định BE là 10)
      const res = await lopAPI.getAll({ 
        khoa: khoa === 'Tất cả' ? '' : khoa, 
        nganh: nganh === 'Tất cả' ? '' : nganh,
        limit: 100 
      });
      let data = res.data || [];
      
      if (hideGraduated) {
        data = data.filter(c => c.trangThai !== 'Đã tốt nghiệp');
      }
      
      setClasses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Lấy toàn bộ lớp để lấy danh sách lọc đầy đủ
      const res = await lopAPI.getAll();
      const data = res.data || [];
      const khs = [...new Set(data.map(c => c.khoa).filter(Boolean))].sort();
      const ngs = [...new Set(data.map(c => c.nganh).filter(Boolean))].sort();
      setAvailableKhoas(khs);
      setAvailableNganhs(ngs);
    } catch (err) {
      console.error('Lỗi lấy danh sách lọc:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [hideGraduated, khoa, nganh]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const handleFilter = () => {
    fetchClasses();
  };

  const handleEditClick = async (c) => {
    setEditingClass({ ...c });
    try {
      const res = await lopSinhVienAPI.getSinhVienByLop(c.id);
      setStudents(res || []);
      
      const teacherRes = await userAPI.getAll();
      const allUsers = teacherRes || [];
      setTeachers(allUsers.filter(u => String(u.role) === '1'));
    } catch (err) {
      console.error(err);
    }
    setShowEditModal(true);
  };

  const handleSaveClass = async () => {
    try {
      if (editingClass.id) {
        await lopAPI.update(editingClass.id, editingClass);
      } else {
        await lopAPI.create(editingClass);
      }
      setShowEditModal(false);
      fetchClasses();
    } catch (err) {
      console.error(err);
      alert('Lỗi lưu lớp');
    }
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lớp này?')) {
      try {
        await lopAPI.delete(id);
        fetchClasses();
      } catch (err) {
        console.error(err);
        alert('Lỗi xóa lớp');
      }
    }
  };
  
  const handleDeleteAllStudents = async (classId) => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ sinh viên của lớp này? Hành động này sẽ xóa sạch Điểm danh, Kết quả học tập và Điểm rèn luyện của tất cả sinh viên trong lớp. Thao tác này KHÔNG THỂ hoàn tác!')) {
      try {
        setLoading(true);
        const res = await sinhVienAPI.deleteAllByLop(classId);
        alert(res.message || 'Đã xóa toàn bộ sinh viên.');
        
        // Refresh danh sách sinh viên trong modal
        const updatedStudents = await lopSinhVienAPI.getSinhVienByLop(classId);
        setStudents(updatedStudents || []);
      } catch (err) {
        console.error(err);
        alert('Lỗi khi xóa toàn bộ sinh viên');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = async (e, classId) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
          
          if (data.length <= 1) {
            alert('File Excel không có dữ liệu hợp lệ.');
            setLoading(false);
            return;
          }

          const importedStudents = [];
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row[2] || !row[3]) continue; // Skip empty rows or rows without maSV, hoTen

            // Try to parse date correctly (Excel dates might be serial numbers)
            let parsedDate = null;
            if (row[4]) {
              if (typeof row[4] === 'number') {
                const date = new Date(Math.round((row[4] - 25569) * 86400 * 1000));
                parsedDate = date.toISOString().split('T')[0];
              } else if (typeof row[4] === 'string') {
                const parts = row[4].split(/[-/]/);
                if (parts.length === 3) {
                  if (parts[0].length === 4) {
                    parsedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                  } else {
                    parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                  }
                } else {
                  parsedDate = new Date(row[4]).toISOString().split('T')[0];
                }
              }
            }

            importedStudents.push({
              maSV: String(row[2] || '').trim(),
              hoTen: String(row[3] || '').trim(),
              ngaySinh: parsedDate,
              trangThai: String(row[5] || 'Đang học'),
              dienThoaiCaNhan: String(row[6] || '').trim(),
              email: String(row[7] || '').trim(),
              noiSinh: String(row[8] || '').trim(),
              gioiTinh: String(row[9] || '').trim(),
              danToc: String(row[10] || '').trim(),
              nganh: String(row[11] || '').trim(),
              chuyenNganh: String(row[12] || '').trim(),
              queQuan: String(row[13] || '').trim(),
              tonGiao: String(row[14] || '').trim(),
              diaChiThuongTru: String(row[15] || '').trim(),
              diaChiBaoTin: String(row[16] || '').trim(),
              hoTenBo: String(row[17] || '').trim(),
              dienThoaiBo: String(row[18] || '').trim(),
              hoTenMe: String(row[19] || '').trim(),
              dienThoaiMe: String(row[20] || '').trim(),
              soTaiKhoan: String(row[21] || '').trim(),
              tenKhoa: String(row[23] || '').trim(),
              khoa: String(row[24] || '').trim(),
              tinhThuongTru: String(row[25] || '').trim(),
              dienThoaiNR: String(row[26] || '').trim(),
            });
          }

          if (importedStudents.length === 0) {
            alert('Không tìm thấy dữ liệu sinh viên hợp lệ trong file.');
            setLoading(false);
            return;
          }

          const res = await lopAPI.importStudents(classId, { students: importedStudents });
          alert(res.message || 'Import thành công!');
          
          if (editingClass && editingClass.id === classId) {
             const updatedStudents = await lopSinhVienAPI.getSinhVienByLop(classId);
             setStudents(updatedStudents || []);
          }

        } catch (err) {
          console.error(err);
          alert('Lỗi xử lý file Excel.');
        } finally {
          setLoading(false);
          e.target.value = ''; // Reset input
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Lỗi import');
    }
  };

  const handleClassImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const rawData = XLSX.utils.sheet_to_json(ws);

          if (rawData.length === 0) {
            alert('File rỗng hoặc không hợp lệ.');
            setLoading(false);
            return;
          }

          // Phân loại dữ liệu theo lớp
          const classGroups = {};
          
          rawData.forEach(row => {
            const tenLop = String(row['Tên lớp'] || '').trim();
            if (!tenLop) return;

            if (!classGroups[tenLop]) {
              // Lấy thông tin lớp từ dòng đầu tiên gặp
              classGroups[tenLop] = {
                class: {
                  tenLop,
                  khoa: row['Khoá'] ? getKhoa(row['Khoá']) : getKhoa(tenLop),
                  nganh: String(row['Ngành'] || '').trim(),
                },
                students: []
              };
            }

            // Map thông tin sinh viên
            if (row['Mã SV'] && row['Họ và tên']) {
              // Parse ngày sinh (Hỗ trợ cả kiểu Date chuẩn và chuỗi DD/MM/YYYY)
              let parsedDate = null;
              const dateVal = row['Ngày sinh'];
              if (dateVal) {
                if (typeof dateVal === 'number') {
                  // Xử lý số seri của Excel
                  const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
                  if (!isNaN(date.getTime())) {
                    parsedDate = date.toISOString().split('T')[0];
                  }
                } else if (typeof dateVal === 'string') {
                  const parts = dateVal.trim().split(/[-/]/);
                  if (parts.length === 3) {
                    // Nếu là YYYY-MM-DD
                    if (parts[0].length === 4) {
                      parsedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    } 
                    // Nếu là DD/MM/YYYY (Kiểu Việt Nam)
                    else {
                      parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                  } else {
                    // Thử parse thông thường
                    const d = new Date(dateVal);
                    if (!isNaN(d.getTime())) {
                      parsedDate = d.toISOString().split('T')[0];
                    }
                  }
                }
              }

              classGroups[tenLop].students.push({
                maSV: String(row['Mã SV']).trim(),
                hoTen: String(row['Họ và tên']).trim(),
                ngaySinh: parsedDate,
                trangThai: String(row['Trạng thái'] || 'Đang học'),
                dienThoaiCaNhan: String(row['Điện thoại cá nhân'] || '').trim(),
                email: String(row['EMAIL'] || '').trim(),
                noiSinh: String(row['Nơi sinh'] || '').trim(),
                gioiTinh: String(row['Giới tính'] || '').trim(),
                danToc: String(row['Dân tộc'] || '').trim(),
                nganh: String(row['Ngành'] || '').trim(),
                chuyenNganh: String(row['Chuyên ngành'] || '').trim(),
                queQuan: String(row['Quê quán'] || '').trim(),
                tonGiao: String(row['Tôn giáo'] || '').trim(),
                diaChiThuongTru: String(row['Địa chỉ thường trú'] || '').trim(),
                diaChiBaoTin: String(row['Địa chỉ báo tin'] || '').trim(),
                hoTenBo: String(row['Họ và tên bố'] || '').trim(),
                dienThoaiBo: String(row['Điện thoại bố'] || '').trim(),
                hoTenMe: String(row['Họ và tên mẹ'] || '').trim(),
                dienThoaiMe: String(row['Điện thoại mẹ'] || '').trim(),
                soTaiKhoan: String(row['Số tài khoản ngân hàng'] || '').trim(),
                tenKhoa: String(row['Tên khoa'] || '').trim(),
                khoa: row['Khoá'] ? getKhoa(row['Khoá']) : '',
                tinhThuongTru: String(row['Tỉnh thường trú'] || '').trim(),
                dienThoaiNR: String(row['Điện thoại NR'] || '').trim(),
              });
            }
          });

          const importData = Object.values(classGroups);
          if (importData.length === 0) {
            alert('Không tìm thấy dữ liệu lớp hoặc sinh viên hợp lệ.');
            setLoading(false);
            return;
          }

          const res = await lopAPI.importAll({ data: importData });
          alert(res.message || 'Import thành công!');
          fetchClasses();
        } catch (err) {
          console.error(err);
          alert('Lỗi xử lý dữ liệu Import.');
        } finally {
          setLoading(false);
          e.target.value = ''; // Reset input
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Lỗi import');
    }
  };

  return (
    <div>
      <div className="card mb-4 glass page-header">
        <div className="d-flex gap-3 align-center flex-wrap" style={{ width: '100%' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '150px' }}>
            <label className="form-label">Khóa học</label>
            <select className="form-control" value={khoa} onChange={e => setKhoa(e.target.value)}>
              <option value="">Tất cả khóa học</option>
              {availableKhoas.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
            <label className="form-label">Ngành / Chuyên ngành</label>
            <select className="form-control" value={nganh} onChange={e => setNganh(e.target.value)}>
              <option value="">Tất cả ngành</option>
              {availableNganhs.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="d-flex gap-2 align-center" style={{ marginTop: 'auto', marginBottom: '8px' }}>
            <input 
              type="checkbox" 
              id="hideGraduated" 
              checked={hideGraduated}
              onChange={(e) => setHideGraduated(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="hideGraduated" style={{ cursor: 'pointer', fontWeight: 600 }}>Ẩn lớp đã tốt nghiệp</label>
          </div>
          <div className="d-flex gap-2">
            {(userRole === 0 || userRole === 2) && (
              <>
                <input
                  type="file"
                  id="classImportUpload"
                  accept=".xlsx, .xls, .csv"
                  style={{ display: 'none' }}
                  onChange={handleClassImport}
                />
                <label htmlFor="classImportUpload" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  <Upload size={18} /> Import lớp
                </label>
                <button className="btn btn-success" onClick={() => { setEditingClass({}); setStudents([]); setShowEditModal(true); }}>
                  <Plus size={18} /> Thêm lớp
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
            <table className="table-stackable">
              <thead>
                <tr>
                  <th>Lớp</th>
                  <th>Khóa học / Ngành</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>Đang tải dữ liệu...</td></tr>
              ) : classes.length > 0 ? (
                classes.map((c) => (
                    <tr key={c.id} style={{ opacity: c.trangThai === 'Đã tốt nghiệp' ? 0.6 : 1 }}>
                      <td data-label="Lớp">
                        <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{c.tenLop}</div>
                      </td>
                    <td data-label="Khoá/Ngành">
                      <div>{c.khoa}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{c.nganh}</div>
                    </td>
                    <td data-label="Trạng thái">
                      {c.trangThai === 'Đã tốt nghiệp' ? (
                        <span className="badge badge-warning">Đã tốt nghiệp</span>
                      ) : (
                        <span className="badge badge-success">{c.trangThai || 'Đang học'}</span>
                      )}
                    </td>
                    <td data-label="Hành động" style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline" style={{ padding: '6px', marginRight: '8px' }} onClick={() => handleEditClick(c)}>
                        <Edit2 size={16} />
                      </button>
                      {(userRole === 0 || userRole === 2) && (
                        <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDeleteClass(c.id)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center' }}>Không tìm thấy lớp nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingClass && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '600px', maxWidth: '90%', padding: '24px', height: 'fit-content', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-between align-center mb-4">
              <h3 style={{ margin: 0 }}>Cập nhật lớp: {editingClass.tenLop}</h3>
              <button className="btn btn-outline" style={{ padding: '4px' }} onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Tên lớp</label>
              <input 
                type="text" 
                className="form-control" 
                value={editingClass.tenLop || ''} 
                onChange={e => setEditingClass({...editingClass, tenLop: e.target.value})}
                disabled={userRole === 1}
              />
            </div>

            <div className="d-flex gap-3 mb-3">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Khóa học</label>
                 <input 
                  type="text" 
                  className="form-control" 
                  value={editingClass.khoa || ''} 
                  onChange={e => setEditingClass({...editingClass, khoa: e.target.value})}
                  disabled={userRole === 1}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Ngành / Chuyên ngành</label>
                 <input 
                  type="text" 
                  className="form-control" 
                  value={editingClass.nganh || ''} 
                  onChange={e => setEditingClass({...editingClass, nganh: e.target.value})}
                  disabled={userRole === 1}
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Giáo viên chủ nhiệm</label>
               <select 
                className="form-control" 
                value={editingClass.gvcNId || ''} 
                onChange={e => setEditingClass({...editingClass, gvcNId: e.target.value})}
                disabled={userRole === 1}
              >
                <option value="">-- Chọn GVCN --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Trạng thái</label>
              <select 
                className="form-control" 
                value={editingClass.trangThai || 'Đang học'} 
                onChange={e => setEditingClass({...editingClass, trangThai: e.target.value})}
              >
                <option value="Đang học">Đang học</option>
                <option value="Đã tốt nghiệp">Đã tốt nghiệp</option>
              </select>
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Lớp trưởng</label>
              <select 
                className="form-control" 
                value={editingClass.lopTruongId || ''} 
                onChange={e => setEditingClass({...editingClass, lopTruongId: e.target.value})}
              >
                <option value="">-- Chưa chọn lớp trưởng --</option>
                {students.map(sv => (
                  <option key={sv.id} value={sv.id}>{sv.maSV} - {sv.hoTen}</option>
                ))}
              </select>
            </div>

            <div className="form-group mb-4 p-3 rounded" style={{ backgroundColor: 'var(--bg-color)' }}>
              <div className="d-flex justify-between align-center mb-2">
                <label className="form-label mb-0">Danh sách sinh viên ({students.length})</label>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '4px 12px', fontSize: '0.875rem' }} 
                    onClick={() => handleDeleteAllStudents(editingClass.id)}
                  >
                    <Trash2 size={16} /> Xóa toàn bộ SV
                  </button>
                  <input
                    type="file"
                    id="excelUpload"
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(e, editingClass.id)}
                  />
                  <label htmlFor="excelUpload" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <Upload size={16} /> Import Excel
                  </label>
                </div>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                {students.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {students.map(sv => (
                      <li key={sv.id} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{sv.maSV}</span>
                        {sv.hoTen}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có sinh viên nào.</div>
                )}
              </div>
            </div>

            <div className="d-flex justify-end gap-2">
              <button className="btn btn-outline" onClick={() => setShowEditModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveClass}>Lưu thay đổi</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Classes;

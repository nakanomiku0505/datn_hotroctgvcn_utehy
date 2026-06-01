import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, CheckCircle, XCircle, Search, FileText, Eye } from 'lucide-react';
import { ketQuaHocTapAPI, lopAPI, sinhVienAPI } from '../api';

const Grades = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedHocKy, setSelectedHocKy] = useState('');
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState(null);

  const hocKyOptions = [
    { value: '', label: 'Tất cả (GPA Tích luỹ)' },
    { value: '1', label: 'Kỳ 1 (Năm 1)' },
    { value: '2', label: 'Kỳ 2 (Năm 1)' },
    { value: '3', label: 'Kỳ 1 (Năm 2)' },
    { value: '4', label: 'Kỳ 2 (Năm 2)' },
    { value: '5', label: 'Kỳ 1 (Năm 3)' },
    { value: '6', label: 'Kỳ 2 (Năm 3)' },
    { value: '7', label: 'Kỳ 1 (Năm 4)' },
    { value: '8', label: 'Kỳ 2 (Năm 4)' },
    { value: '9', label: 'Kỳ 1 (Năm 5)' },
    { value: '10', label: 'Kỳ 2 (Năm 5)' },
  ];

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await lopAPI.getAll({ limit: 100 });
        const list = res.data || [];
        setClasses(list);
        if (list.length > 0) setSelectedClass(list[0].id.toString());
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch data for selected class
  const fetchClassData = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const svRes = await sinhVienAPI.getAll({ lopId: selectedClass, limit: 1000 });
      setStudents(svRes.data || []);

      const params = { lopId: selectedClass, limit: 5000 };
      if (selectedHocKy) params.hocKy = selectedHocKy;

      const gradeRes = await ketQuaHocTapAPI.getAll(params);
      setGrades(gradeRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassData();
  }, [selectedClass, selectedHocKy]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert('Vui lòng chọn file Excel');
    if (!selectedClass) return alert('Vui lòng chọn lớp học');

    if (Object.keys(studentGrades).length > 0) {
      const c = window.confirm("Lớp này đã có điểm trên hệ thống. Dữ liệu điểm cũ của các sinh viên có trong file sẽ bị ghi đè. Bạn có muốn tiếp tục?");
      if (!c) return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('namHoc', '2025-2026');
    formData.append('lopId', selectedClass);

    try {
      const res = await ketQuaHocTapAPI.uploadExcel(formData);
      setResult(res);
      alert(res.message);
      setFile(null);
      // Reload grades after import
      fetchClassData();
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi upload file: ' + (error.message || ''));
    } finally {
      setUploading(false);
      // Reset input value để có thể chọn lại cùng một file (kể cả cùng tên)
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    }
  };

  const handleDeleteClassGrades = async () => {
    if (!selectedClass) return;
    const confirmDelete = window.confirm("Cảnh báo: Bạn có chắc chắn muốn xoá TOÀN BỘ ĐIỂM của lớp này? Hành động này không thể hoàn tác!");
    if (!confirmDelete) return;

    try {
      const res = await ketQuaHocTapAPI.deleteByLop(selectedClass);
      alert(res.message);
      fetchClassData(); // Reload
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi xoá điểm: ' + (err.message || ''));
    }
  };

  const convertTo4Scale = (diemChu) => {
    if (!diemChu) return 0.0;
    const chu = String(diemChu).toUpperCase().trim();
    if (chu.startsWith('A')) return 4.0;
    if (chu.startsWith('B')) return 3.0;
    if (chu.startsWith('C')) return 2.0;
    if (chu.startsWith('D')) return 1.0;
    return 0.0;
  };

  // Group grades by student
  const studentGrades = {};
  grades.forEach(g => {
    if (!studentGrades[g.sinhVienId]) {
      studentGrades[g.sinhVienId] = [];
    }
    studentGrades[g.sinhVienId].push(g);
  });

  const handleViewDetails = (sv, sg) => {
    setSelectedStudentForDetails({ sv, sg });
    setShowDetailsModal(true);
  };

  return (
    <div>
      <div className="grid-3 mb-4">
        {/* Class Selector & Stats */}
        <div className="card glass" style={{ gridColumn: 'span 2' }}>
          <h3 className="mb-3 d-flex align-center gap-2"><FileText size={20} /> Quản lý điểm học tập</h3>
          <div className="d-flex gap-3 align-center mb-4 flex-wrap">
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label className="text-muted d-block mb-1" style={{ fontSize: '0.875rem' }}>Lớp quản lý</label>
              <select
                className="form-control"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                <option value="">-- Chọn lớp --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.tenLop}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label className="text-muted d-block mb-1" style={{ fontSize: '0.875rem' }}>Học kỳ</label>
              <select
                className="form-control"
                value={selectedHocKy}
                onChange={e => setSelectedHocKy(e.target.value)}
              >
                {hocKyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="d-flex gap-4 p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
            <div>Sĩ số: <strong className="text-primary">{students.length}</strong></div>
            <div>Đã có điểm: <strong className="text-success">{Object.keys(studentGrades).length}</strong></div>
            <div>Chưa có điểm: <strong className="text-warning">{students.length - Object.keys(studentGrades).length}</strong></div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <button
                className="btn btn-outline"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '6px 12px' }}
                onClick={handleDeleteClassGrades}
                disabled={Object.keys(studentGrades).length === 0}
              >
                Xoá điểm lớp này
              </button>
            </div>
          </div>
        </div>

        {/* Small Import UI */}
        <div className="card glass" style={{ border: '1px dashed var(--primary)' }}>
          <h3 className="mb-3 d-flex align-center gap-2"><UploadCloud size={20} /> Import điểm từ Excel</h3>

          <div className="mb-3">
            <label className="btn btn-outline d-block text-center" style={{ cursor: 'pointer', width: '100%' }}>
              {file ? file.name : 'Chọn file Excel (.xlsx)'}
              <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
          </div>

          <button
            className="btn btn-primary d-block"
            style={{ width: '100%' }}
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Đang xử lý...' : 'Upload Data'}
          </button>

          {result && (
            <div className="mt-2 text-success" style={{ fontSize: '0.875rem', textAlign: 'center' }}>
              <CheckCircle size={14} style={{ verticalAlign: 'middle' }} /> {result.message}
            </div>
          )}
        </div>
      </div>

      {/* Grades Table */}
      <div className="card">
        <div className="d-flex justify-between align-center mb-4">
          <h3>Bảng tổng hợp điểm</h3>
          <div className="d-flex gap-2">
            <input type="text" className="form-control" placeholder="Tìm sinh viên..." style={{ width: '250px' }} />
            <button className="btn btn-outline"><Search size={18} /></button>
          </div>
        </div>
        <div className="table-container">
          <table className="table-stackable">
            <thead>
              <tr>
                <th className="hide-mobile">STT</th>
                <th>MSV</th>
                <th>Họ Tên</th>
                <th className="hide-mobile">Tổng TC</th>
                <th className="hide-mobile">Số môn Nợ</th>
                <th>TC Nợ</th>
                <th className="hide-mobile">GPA Hệ 10</th>
                <th>GPA Hệ 4</th>
                <th>Xếp loại</th>
                <th>Đánh giá</th>
                <th style={{ textAlign: 'center' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="text-center">Đang tải dữ liệu...</td></tr>
              ) : students.length > 0 ? (
                students.map((sv, index) => {
                  const sg = studentGrades[sv.id] || [];
                  let totalTC = 0;
                  let totalDiem4TC = 0;
                  let totalDiem10TC = 0;
                  let tCNo = 0;
                  let soMonNo = 0;

                  sg.forEach(g => {
                    const tc = g.soTinChi || 0;
                    totalTC += tc;
                    const d4 = convertTo4Scale(g.diemChu);
                    totalDiem4TC += (d4 * tc);
                    totalDiem10TC += ((g.diem10 || 0) * tc);

                    if (g.diem10 < 4.0 || g.diemChu === 'F') {
                      tCNo += tc;
                      soMonNo += 1;
                    }
                  });

                  const gpa = totalTC > 0 ? parseFloat((totalDiem4TC / totalTC).toFixed(2)) : 0;
                  const gpa10 = totalTC > 0 ? parseFloat((totalDiem10TC / totalTC).toFixed(2)) : 0;
                  const tyLeNo = totalTC > 0 ? (tCNo / totalTC) * 100 : 0;

                  const getXepLoai = (diem) => {
                    if (diem >= 3.6) return 'Xuất sắc';
                    if (diem >= 3.2) return 'Giỏi';
                    if (diem >= 2.5) return 'Khá';
                    if (diem >= 2.0) return 'Trung bình';
                    return 'Yếu';
                  };

                  return (
                    <tr key={sv.id} style={{ backgroundColor: tyLeNo > 20 ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td className="hide-mobile" data-label="STT">{index + 1}</td>
                      <td data-label="MSV"><div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{sv.maSV}</div></td>
                      <td data-label="Họ Tên">
                        <div style={{ fontWeight: 500 }}>{sv.hoTen}</div>
                      </td>
                      <td className="hide-mobile" data-label="Tổng TC">{totalTC}</td>
                      <td className="hide-mobile" data-label="Số môn Nợ">{soMonNo > 0 ? <strong className="text-danger">{soMonNo}</strong> : 0}</td>
                      <td data-label="TC Nợ">{tCNo > 0 ? <strong className="text-danger">{tCNo}</strong> : 0}</td>
                      <td className="hide-mobile" data-label="GPA Hệ 10">
                        <strong>{totalTC > 0 ? gpa10.toFixed(2) : '---'}</strong>
                      </td>
                      <td data-label="GPA Hệ 4">
                        <strong className={gpa >= 3.2 ? 'text-success' : gpa < 2.0 ? 'text-danger' : ''}>
                          {totalTC > 0 ? gpa.toFixed(2) : '---'}
                        </strong>
                      </td>
                      <td data-label="Xếp loại">
                        <span style={{ fontWeight: 500, color: gpa >= 3.2 ? 'var(--primary)' : gpa < 2.0 ? 'var(--danger)' : 'inherit' }}>
                          {totalTC > 0 ? getXepLoai(gpa) : '---'}
                        </span>
                      </td>
                      <td data-label="Đánh giá">
                        {totalTC === 0 ? (
                          <span className="text-muted">Chưa có dữ liệu</span>
                        ) : tyLeNo >= 20 ? (
                          <span className="badge badge-danger"><XCircle size={12} style={{ marginRight: '4px' }} /> Nợ {tyLeNo.toFixed(0)}%</span>
                        ) : tCNo > 0 ? (
                          <span className="badge badge-warning">Cảnh báo</span>
                        ) : (
                          <span className="badge badge-success">Đạt</span>
                        )}
                      </td>
                      <td data-label="Chi tiết" style={{ textAlign: 'center' }}>
                        <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => handleViewDetails(sv, sg)}>
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="10" className="text-center">Không có sinh viên nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedStudentForDetails && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ 
            width: '850px', 
            maxWidth: '100%', 
            maxHeight: '90vh',
            display: 'flex', 
            flexDirection: 'column',
            margin: 0,
            padding: 0,
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div className="d-flex justify-between align-center" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                Chi tiết điểm: <span className="text-primary">{selectedStudentForDetails.sv.hoTen}</span> <span className="text-muted">({selectedStudentForDetails.sv.maSV})</span>
              </h3>
              <button className="btn btn-outline" style={{ padding: '6px', border: 'none' }} onClick={() => setShowDetailsModal(false)}>
                <XCircle size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flexGrow: 1 }}>
              <div className="grid-2" style={{ alignItems: 'start', gap: '24px' }}>
                
                {/* Passed Subjects */}
                <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.03)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid rgba(34, 197, 94, 0.2)', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
                    <h4 className="d-flex align-center gap-2" style={{ color: 'var(--success)', margin: 0, fontSize: '1.05rem' }}>
                      <CheckCircle size={18} /> Các học phần đã qua
                    </h4>
                  </div>
                  <ul style={{ listStyle: 'none', padding: '0 16px', margin: 0, overflowY: 'auto', maxHeight: '400px' }}>
                    {selectedStudentForDetails.sg.filter(g => g.diem10 >= 4.0 && g.diemChu !== 'F').length > 0 ? (
                      selectedStudentForDetails.sg.filter(g => g.diem10 >= 4.0 && g.diemChu !== 'F').map((g, i) => (
                        <li key={i} style={{ padding: '14px 0', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>{g.tenMon}</div>
                          <div className="text-muted d-flex justify-between align-center" style={{ fontSize: '0.85rem' }}>
                            <span>Số TC: {g.soTinChi}</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--success)', fontSize: '1rem' }}>{g.diem10} ({g.diemChu})</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted" style={{ padding: '16px 0', textAlign: 'center' }}>Không có dữ liệu</li>
                    )}
                  </ul>
                </div>

                {/* Failed Subjects */}
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                    <h4 className="d-flex align-center gap-2" style={{ color: 'var(--danger)', margin: 0, fontSize: '1.05rem' }}>
                      <XCircle size={18} /> Các học phần nợ / trượt
                    </h4>
                  </div>
                  <ul style={{ listStyle: 'none', padding: '0 16px', margin: 0, overflowY: 'auto', maxHeight: '400px' }}>
                    {selectedStudentForDetails.sg.filter(g => g.diem10 < 4.0 || g.diemChu === 'F').length > 0 ? (
                      selectedStudentForDetails.sg.filter(g => g.diem10 < 4.0 || g.diemChu === 'F').map((g, i) => (
                        <li key={i} style={{ padding: '14px 0', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>{g.tenMon}</div>
                          <div className="text-muted d-flex justify-between align-center" style={{ fontSize: '0.85rem' }}>
                            <span>Số TC: {g.soTinChi}</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--danger)', fontSize: '1rem' }}>{g.diem10 !== null ? g.diem10 : '--'} ({g.diemChu || 'F'})</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted" style={{ padding: '16px 0', textAlign: 'center' }}>Không có môn nợ</li>
                    )}
                  </ul>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#fcfcfc' }}>
              <button className="btn btn-outline" onClick={() => setShowDetailsModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      , document.body)}

    </div>
  );
};

export default Grades;

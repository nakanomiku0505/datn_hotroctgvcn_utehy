import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Save, Phone, MessageCircle, BarChart2, ClipboardList, X, CalendarCheck, Users, Download } from 'lucide-react';
import { lopAPI, sinhVienAPI, diemDanhAPI } from '../api';

// ─── Component Card cảnh báo nghỉ ───────────────────────────────────────────
const ContactParent = ({ sv }) => {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      {(sv.dienThoaiBo || sv.dienThoaiMe || sv.dienThoaiNR) ? (
        <button
          className="btn btn-danger"
          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
          onClick={() => setShowContact(true)}
        >
          <Phone size={14} /> Liên hệ PH
        </button>
      ) : (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Không có SĐT</span>
      )}

      {showContact && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card animate-fade-in" style={{ width: '400px', maxWidth: '95%', padding: '24px', height: 'fit-content', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-between align-center mb-4">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📞 Liên hệ Phụ huynh</h3>
              <button onClick={() => setShowContact(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-muted)' }}>
              Sinh viên <strong>{sv.hoTen}</strong> ({sv.maSV})
            </p>
            {sv.hoTenBo && (
              <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>👨 Bố: {sv.hoTenBo}</div>
                {sv.dienThoaiBo ? (
                  <div className="d-flex gap-2">
                    <a href={`tel:${sv.dienThoaiBo}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1, textDecoration: 'none' }}>
                      <Phone size={14} /> {sv.dienThoaiBo}
                    </a>
                    <a href={`https://zalo.me/${sv.dienThoaiBo}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', textDecoration: 'none' }}>
                      <MessageCircle size={14} /> Zalo
                    </a>
                  </div>
                ) : <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Không có SĐT</span>}
              </div>
            )}
            {sv.hoTenMe && (
              <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>👩 Mẹ: {sv.hoTenMe}</div>
                {sv.dienThoaiMe ? (
                  <div className="d-flex gap-2">
                    <a href={`tel:${sv.dienThoaiMe}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1, textDecoration: 'none' }}>
                      <Phone size={14} /> {sv.dienThoaiMe}
                    </a>
                    <a href={`https://zalo.me/${sv.dienThoaiMe}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', textDecoration: 'none' }}>
                      <MessageCircle size={14} /> Zalo
                    </a>
                  </div>
                ) : <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Không có SĐT</span>}
              </div>
            )}
            {sv.dienThoaiNR && (
              <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-main)', borderRadius: '12px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>🏠 SĐT nhà riêng</div>
                <div className="d-flex gap-2">
                  <a href={`tel:${sv.dienThoaiNR}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1, textDecoration: 'none' }}>
                    <Phone size={14} /> {sv.dienThoaiNR}
                  </a>
                  <a href={`https://zalo.me/${sv.dienThoaiNR}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', textDecoration: 'none' }}>
                    <MessageCircle size={14} /> Zalo
                  </a>
                </div>
              </div>
            )}
            <button className="btn btn-outline" style={{ width: '100%', marginTop: '8px' }} onClick={() => setShowContact(false)}>Đóng</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// ─── Component Card cảnh báo nghỉ ───────────────────────────────────────────
const AbsenceWarningCard = ({ sv, threshold = 3, index }) => {
  const isWarning = sv.tongNghi >= threshold;
  const isCritical = sv.nghiKhongPhep >= threshold;

  return (
    <tr style={{ backgroundColor: isCritical ? 'rgba(244,63,94,0.07)' : isWarning ? 'rgba(245,158,11,0.07)' : 'transparent' }}>
      <td className="hide-mobile" data-label="STT" style={{ textAlign: 'center' }}>{index + 1}</td>
      <td data-label="Họ Tên">
        <div style={{ fontWeight: 'bold', color: isCritical ? 'var(--danger)' : 'inherit' }}>{sv.hoTen}</div>
      </td>
      <td data-label="Mã SV">
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{sv.maSV}</div>
      </td>
      <td data-label="Đúng giờ" style={{ textAlign: 'center' }}>
        <span style={{ color: 'var(--success)', fontWeight: 600 }}>{sv.coMat || 0}</span>
      </td>
      <td data-label="Nghỉ KP" style={{ textAlign: 'center' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--danger)', fontSize: '1.1rem' }}>{sv.nghiKhongPhep || 0}</span>
      </td>
      <td data-label="Nghỉ phép" style={{ textAlign: 'center' }}>
        <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{sv.nghiPhep || 0}</span>
      </td>
      <td data-label="Đi muộn" style={{ textAlign: 'center' }}>
        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{sv.diMuon || 0}</span>
      </td>
      <td data-label="Trạng thái" style={{ textAlign: 'center' }}>
        {isCritical
          ? <span className="badge badge-danger">🚨 Nguy hiểm</span>
          : isWarning
          ? <span className="badge badge-warning">⚠️ Cảnh báo</span>
          : <span className="badge badge-success">Bình thường</span>
        }
      </td>
      <td data-label="Liên hệ">
        <ContactParent sv={sv} />
      </td>
    </tr>
  );
};


// ─── Main Attendance Component ────────────────────────────────────────────────
const Attendance = () => {
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : {};
  const roleNum = parseInt(currentUser.role);
  
  // GVCN (1), Trưởng bộ môn (2), Admin (0) có quyền xem cảnh báo và báo cáo
  const canViewWarnings = [0, 1, 2].includes(roleNum);
  // Lớp trưởng (4), Admin (0) có quyền thực hiện điểm danh. GVCN chỉ xem tổng kết.
  const canMarkAttendance = [0, 4].includes(roleNum);

  const [tab, setTab] = useState(canMarkAttendance ? 'diemdanh' : 'caobao');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('Sáng');
  
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tab cảnh báo
  const currentDate = new Date();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [absenceList, setAbsenceList] = useState([]);
  const [absenceLoading, setAbsenceLoading] = useState(false);
  const [warningThreshold, setWarningThreshold] = useState(3);
  const [summaryMonth, setSummaryMonth] = useState(currentMonthStr);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await lopAPI.getAll({ limit: 100 });
        let list = res.data || [];
        
        // Nếu là Trưởng bộ môn (2), lọc chỉ lấy các lớp mình trực tiếp làm GVCN để điểm danh
        if (roleNum === 2) {
          list = list.filter(c => c.gvcNId === currentUser.id);
        }

        setClasses(list);
        if (list.length > 0) setSelectedClass(list[0].id.toString());
      } catch (err) { console.error(err); }
    };
    fetchClasses();
  }, []);

  // Fetch students and attendance
  useEffect(() => {
    if (!selectedClass) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const svRes = await sinhVienAPI.getAll({ lopId: selectedClass, limit: 1000 });
        const svList = svRes.data || [];
        setStudents(svList);

        const attRes = await diemDanhAPI.getAll({ lopId: selectedClass, ngay: date, limit: 1000 });
        const attList = attRes.data || [];
        const sessionAtt = attList.filter(a => a.buoi === session);
        setAttendances(sessionAtt);

        const initialData = {};
        svList.forEach(sv => {
          const record = sessionAtt.find(a => a.sinhVienId === sv.id);
          initialData[sv.id] = record ? record.trangThai : 'Có mặt';
        });
        setAttendanceData(initialData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [selectedClass, date, session]);

  // Fetch absence summary khi đổi tab hoặc lớp
  useEffect(() => {
    if (tab !== 'caobao' || !selectedClass) return;
    const fetchAbsence = async () => {
      setAbsenceLoading(true);
      try {
        const [year, month] = summaryMonth.split('-');
        const start = `${year}-${month}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

        const res = await diemDanhAPI.getAbsenceSummary({ 
          lopId: selectedClass,
          tuNgay: start,
          denNgay: end
        });
        setAbsenceList(res.data || []);
      } catch (err) { console.error(err); }
      finally { setAbsenceLoading(false); }
    };
    fetchAbsence();
  }, [tab, selectedClass, summaryMonth]);

  const handleStatusChange = (svId, status) => {
    setAttendanceData(prev => ({ ...prev, [svId]: status }));
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const dayOfWeek = new Date(date).getDay();
      const thu = dayOfWeek === 0 ? 'CN' : `T${dayOfWeek + 1}`;

      const promises = students.map(sv => {
        const status = attendanceData[sv.id];
        const existingRecord = attendances.find(a => a.sinhVienId === sv.id);
        const payload = { sinhVienId: sv.id, lopId: selectedClass, ngay: date, thu, buoi: session, trangThai: status };
        if (existingRecord) {
          return existingRecord.trangThai !== status ? diemDanhAPI.update(existingRecord.id, payload) : Promise.resolve();
        }
        return diemDanhAPI.create(payload);
      });

      await Promise.all(promises);
      alert('Đã lưu điểm danh thành công!');
      const attRes = await diemDanhAPI.getAll({ lopId: selectedClass, ngay: date, limit: 1000 });
      setAttendances(attRes.data.filter(a => a.buoi === session) || []);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi lưu điểm danh.');
    } finally { setSaving(false); }
  };

  const handleExportExcel = async () => {
    try {
      // Use summaryMonth from the "Tháng điểm danh" picker in the Summary tab
      const [yearStr, monthStr] = summaryMonth.split('-');
      const month = parseInt(monthStr, 10);
      const nam = parseInt(yearStr, 10);
      const res = await diemDanhAPI.exportExcel(selectedClass, month, nam);
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Diem_Danh_${classes.find(c => c.id.toString() === selectedClass)?.tenLop}_Thang_${month}_${nam}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Không thể xuất Excel.');
    }
  };

  const total = students.length;
  const present = Object.values(attendanceData).filter(s => s === 'Có mặt').length;
  const absent = Object.values(attendanceData).filter(s => s.startsWith('Nghỉ')).length;

  const warnedStudents = absenceList.filter(sv => sv.tongNghi >= warningThreshold);

  if (!loading && classes.length === 0) {
    return (
      <div className="d-flex flex-column align-center justify-center" style={{ minHeight: '60vh', textAlign: 'center' }}>
        <div className="glass mb-4" style={{ padding: '40px', borderRadius: '24px', maxWidth: '500px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '20px', 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
          }}>
            <CalendarCheck size={40} color="var(--primary)" />
          </div>
          <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Chưa có lớp quản lý</h2>
          <p className="text-muted" style={{ marginBottom: '32px', lineHeight: 1.6 }}>
            Hiện tại bạn chưa được phân công quản lý lớp học nào trong hệ thống. 
            Vui lòng liên hệ Quản trị viên nếu bạn tin rằng đây là một sự nhầm lẫn.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ padding: '12px 32px' }}>
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header controls */}
      <div className="card glass mb-4">
        <div className="d-flex gap-3 align-center" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label className="form-label">Lớp học</label>
            <select className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.tenLop}</option>)}
            </select>
          </div>
          
          {tab === 'diemdanh' && (
            <>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">Ngày điểm danh</label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="form-label">Buổi</label>
                <div className="d-flex gap-4 mt-2">
                  <label className="d-flex align-center gap-2" style={{ cursor: 'pointer' }}>
                    <input type="radio" name="session" checked={session === 'Sáng'} onChange={() => setSession('Sáng')} /> Sáng
                  </label>
                  <label className="d-flex align-center gap-2" style={{ cursor: 'pointer' }}>
                    <input type="radio" name="session" checked={session === 'Chiều'} onChange={() => setSession('Chiều')} /> Chiều
                  </label>
                </div>
              </div>
              {selectedClass && (
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', alignSelf: 'flex-end', paddingBottom: '4px' }}>
                  <span>Sĩ số: <strong>{total}</strong></span>
                  <span className="text-success">Có mặt: <strong>{present}</strong></span>
                  <span className="text-danger">Vắng: <strong>{absent}</strong></span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs - GVCN thấy cả 2 tab, Lớp trưởng chỉ thấy tab điểm danh */}
      <div className="d-flex gap-2 mb-4" style={{ borderBottom: '2px solid var(--border-color)' }}>
        <button
          onClick={() => setTab('diemdanh')}
          style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === 'diemdanh' ? 700 : 500,
            color: tab === 'diemdanh' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: tab === 'diemdanh' ? '3px solid var(--primary)' : '3px solid transparent',
            marginBottom: '-2px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <ClipboardList size={18} /> Điểm danh buổi học
        </button>
        {canViewWarnings && (
          <button
            onClick={() => setTab('caobao')}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: tab === 'caobao' ? 700 : 500,
              color: tab === 'caobao' ? 'var(--danger)' : 'var(--text-muted)',
              borderBottom: tab === 'caobao' ? '3px solid var(--danger)' : '3px solid transparent',
              marginBottom: '-2px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <AlertTriangle size={18} /> Tổng kết & Cảnh báo {warnedStudents.length > 0 && <span className="badge badge-danger" style={{ padding: '2px 8px' }}>{warnedStudents.length}</span>}
          </button>
        )}
      </div>

      {/* Tab: Điểm danh */}
      {tab === 'diemdanh' && (
        <div className="card">
          <div className="d-flex justify-between align-center mb-4">
            <h3>Danh sách điểm danh: {classes.find(c => c.id.toString() === selectedClass)?.tenLop}</h3>
            {canMarkAttendance && (
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || students.length === 0}>
                {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu kết quả</>}
              </button>
            )}
          </div>
          <div className="table-container">
            <table className="table-stackable">
              <thead>
                <tr>
                  <th className="hide-mobile" style={{ width: '50px' }}>STT</th>
                  <th>MSV / Họ Tên</th>
                  <th style={{ width: '200px' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>Đang tải danh sách...</td></tr>
                ) : students.length > 0 ? (
                  students.map((sv, index) => {
                    const status = attendanceData[sv.id] || 'Có mặt';
                    return (
                      <tr key={sv.id} style={{ backgroundColor: status === 'Nghỉ không phép' ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                        <td className="hide-mobile" data-label="STT">{index + 1}</td>
                        <td data-label="Sinh viên">
                          <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{sv.maSV}</div>
                          <div style={{ fontWeight: 500, color: status === 'Nghỉ không phép' ? 'var(--danger)' : 'inherit' }}>{sv.hoTen}</div>
                        </td>
                        <td data-label="Trạng thái">
                          <select
                            className="form-control"
                            style={{ fontWeight: 'bold', color: status === 'Có mặt' ? 'var(--success)' : status === 'Nghỉ không phép' ? 'var(--danger)' : 'var(--warning)' }}
                            value={status}
                            onChange={e => handleStatusChange(sv.id, e.target.value)}
                            disabled={!canMarkAttendance}
                          >
                            <option value="Có mặt">Có mặt</option>
                            <option value="Nghỉ phép">Nghỉ phép</option>
                            <option value="Nghỉ không phép">Nghỉ không phép</option>
                            <option value="Đi muộn">Đi muộn</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>Không có sinh viên nào trong lớp này.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Cảnh báo nghỉ */}
      {tab === 'caobao' && (
        <div>
          <div className="card glass mb-4">
            <div className="d-flex gap-4 align-center" style={{ flexWrap: 'wrap' }}>
              <div>
                <label className="form-label">Ngưỡng cảnh báo (số buổi vắng)</label>
                <input
                  type="number" min="1" max="20"
                  className="form-control"
                  style={{ width: '120px' }}
                  value={warningThreshold}
                  onChange={e => setWarningThreshold(parseInt(e.target.value) || 3)}
                />
              </div>
              <div>
                <label className="form-label">Tháng điểm danh</label>
                <input
                  type="month"
                  className="form-control"
                  value={summaryMonth}
                  onChange={e => setSummaryMonth(e.target.value)}
                />
              </div>
              <div className="d-flex gap-4 mt-4" style={{ fontSize: '0.875rem' }}>
                <div style={{ padding: '8px 16px', background: 'rgba(244,63,94,0.1)', borderRadius: '12px' }}>
                  🚨 Nguy hiểm (≥{warningThreshold} buổi KP): <strong style={{ color: 'var(--danger)' }}>{absenceList.filter(s => s.nghiKhongPhep >= warningThreshold).length} SV</strong>
                </div>
                <div style={{ padding: '8px 16px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px' }}>
                  ⚠️ Cảnh báo (≥{warningThreshold} buổi): <strong style={{ color: 'var(--warning)' }}>{warnedStudents.length} SV</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="d-flex justify-between align-center mb-4">
              <h3 className="d-flex align-center gap-2">
                <BarChart2 size={20} /> Tổng kết điểm danh — {classes.find(c => c.id.toString() === selectedClass)?.tenLop}
              </h3>
              <button className="btn btn-primary btn-outline" onClick={handleExportExcel} disabled={loading || students.length === 0}>
                <Download size={18} /> Xuất Excel
              </button>
            </div>
            <div className="table-container">
              <table className="table-stackable" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th rowSpan="2" className="hide-mobile" style={{ textAlign: 'center', width: '50px', borderBottom: '2px solid var(--border-color)' }}>STT</th>
                    <th rowSpan="2" style={{ borderBottom: '2px solid var(--border-color)' }}>Họ Tên</th>
                    <th rowSpan="2" style={{ borderBottom: '2px solid var(--border-color)' }}>Mã Sinh Viên</th>
                    <th colSpan="4" style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>Tổng kết</th>
                    <th rowSpan="2" style={{ textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>Cảnh báo</th>
                    <th rowSpan="2" style={{ borderBottom: '2px solid var(--border-color)' }}>Liên hệ Phụ huynh</th>
                  </tr>
                  <tr>
                    <th style={{ textAlign: 'center', color: 'var(--success)', borderBottom: '2px solid var(--border-color)' }}>Đi học đúng giờ</th>
                    <th style={{ textAlign: 'center', color: 'var(--danger)', borderBottom: '2px solid var(--border-color)' }}>Nghỉ ko phép</th>
                    <th style={{ textAlign: 'center', color: 'var(--warning)', borderBottom: '2px solid var(--border-color)' }}>Nghỉ có phép</th>
                    <th style={{ textAlign: 'center', color: 'var(--primary)', borderBottom: '2px solid var(--border-color)' }}>Đi muộn</th>
                  </tr>
                </thead>
                <tbody>
                  {absenceLoading ? (
                    <tr><td colSpan="9" style={{ textAlign: 'center' }}>Đang tải...</td></tr>
                  ) : absenceList.length > 0 ? (
                    absenceList.map((sv, index) => (
                      <AbsenceWarningCard key={sv.id} sv={sv} index={index} threshold={warningThreshold} />
                    ))
                  ) : (
                    <tr><td colSpan="9" style={{ textAlign: 'center' }}>Chưa có dữ liệu điểm danh.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;

import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCircle, Save, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import { lopAPI, thongBaoAPI, trienKhaiThongBaoAPI, sinhVienAPI, lopSinhVienAPI } from '../api';
import { Link } from 'react-router-dom';

const Reports = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  
  const [notifications, setNotifications] = useState([]);
  const [undeployedNotis, setUndeployedNotis] = useState([]);
  const [reportData, setReportData] = useState(null);
  
  const [formData, setFormData] = useState({
    siSo: '',
    lopTruong: '',
    sdtLopTruong: '',
    thoiGianHop: '',
    diaDiemHop: '',
    soSVVang: 0,
    tomTatHoatDong: '',
    noiDungCoVan: '',
    keHoachThangSau: '',
    kienNghi: '',
    thayDoiNhanSu: '',
    noiDungKhac: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && month && year) {
      fetchNotificationsAndReport();
    }
  }, [selectedClass, month, year]);

  const fetchClasses = async () => {
    try {
      const res = await lopAPI.getAll({});
      let lopList = res.data || [];
      
      // Nếu là Trưởng bộ môn (2), lọc chỉ lấy các lớp mình trực tiếp làm GVCN để làm báo cáo
      if (user && parseInt(user.role) === 2) {
        lopList = lopList.filter(c => c.gvcNId === user.id);
      }

      setClasses(lopList);
      if (lopList.length > 0) {
        setSelectedClass(lopList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotificationsAndReport = async () => {
    setLoading(true);
    try {
      // 1. Lấy thông báo của tháng được chọn
      const notiRes = await thongBaoAPI.getAll({ thang: month, nam: year });
      let currentNotifications = notiRes.data || [];
      
      // Lọc thông báo theo khoa của lớp
      const currentClass = classes.find(c => String(c.id) === String(selectedClass));
      if (currentClass) {
        const lopKhoa = currentClass.khoa || 'ALL';
        currentNotifications = currentNotifications.filter(n => 
          n.khoaApDung === 'ALL' || n.khoaApDung === lopKhoa
        );
      }
      
      setNotifications(currentNotifications);

      // Kiểm tra thông báo chưa triển khai
      try {
        const deployedRes = await thongBaoAPI.getDeployedByLop(selectedClass);
        const deployedIds = new Set((deployedRes.data || []).map(item => item.thongBaoId));
        const notDeployed = currentNotifications.filter(n => !deployedIds.has(n.id));
        setUndeployedNotis(notDeployed);
      } catch (e) {
        console.error("Lỗi kiểm tra thông báo triển khai:", e);
      }

      // 2. Lấy dữ liệu báo cáo đã lưu (nếu có)
      const repRes = await trienKhaiThongBaoAPI.getAll({ lopId: selectedClass, thang: month, nam: year });
      const repList = repRes.data || [];
      
      if (repList.length > 0) {
        const rep = repList[0];
        setReportData(rep);
        setFormData({
          siSo: rep.siSo || '',
          lopTruong: rep.lopTruong || '',
          sdtLopTruong: rep.sdtLopTruong || '',
          thoiGianHop: rep.thoiGianHop ? rep.thoiGianHop.substring(0, 16) : '',
          diaDiemHop: rep.diaDiemHop || '',
          soSVVang: rep.soSVVang || 0,
          tomTatHoatDong: rep.tomTatHoatDong || '',
          noiDungCoVan: rep.noiDungCoVan || '',
          keHoachThangSau: rep.keHoachThangSau || '',
          kienNghi: rep.kienNghi || '',
          thayDoiNhanSu: rep.thayDoiNhanSu || '',
          noiDungKhac: rep.noiDungKhac || ''
        });
      } else {
        // TRƯỜNG HỢP CHƯA CÓ BÁO CÁO -> TỰ ĐỘNG TỔNG HỢP (AUTO-FILL)
        setReportData(null);
        
        let autoSiSo = '';
        let autoLopTruong = '';
        let autoSdtLopTruong = '';
        let autoNoiDungCoVan = '';
        let autoKeHoachThangSau = '';

        // Lấy thời gian hiện tại cho thời gian họp
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000; // offset in milliseconds
        const localISOTime = (new Date(now - tzOffset)).toISOString().substring(0, 16);
        const autoThoiGianHop = localISOTime;


        // A. Lấy sĩ số và thông tin lớp trưởng
        const currentClass = classes.find(c => String(c.id) === String(selectedClass));
        if (currentClass) {
          // Lấy sĩ số thực tế từ DB
          try {
            const lsRes = await lopSinhVienAPI.getSinhVienByLop(selectedClass);
            autoSiSo = (lsRes || []).length.toString();
          } catch (e) { console.error(e); }

          // Lấy lớp trưởng
          if (currentClass.lopTruongId) {
            try {
              const svInfo = await sinhVienAPI.getById(currentClass.lopTruongId);
              if (svInfo) {
                autoLopTruong = svInfo.hoTen || '';
                autoSdtLopTruong = svInfo.dienThoaiCaNhan || '';
              }
            } catch (e) { console.error(e); }
          }
        }

        // B. Nội dung cố vấn học tập (mục 3) do GVCN tự nhập, không auto-fill từ thông báo

        // C. Tự động lấy kế hoạch tháng sau (nếu có thông báo tháng sau)
        let nextM = parseInt(month) + 1;
        let nextY = parseInt(year);
        if (nextM > 12) { nextM = 1; nextY += 1; }
        try {
          const nextRes = await thongBaoAPI.getAll({ thang: nextM, nam: nextY });
          let nextNotis = nextRes.data || [];
          
          // Lọc theo khóa của lớp
          if (currentClass) {
            const lopKhoa = currentClass.khoa || 'ALL';
            nextNotis = nextNotis.filter(n => n.khoaApDung === 'ALL' || n.khoaApDung === lopKhoa);
          }

          if (nextNotis.length > 0) {
            autoKeHoachThangSau = nextNotis.map(n => `- ${n.noiDung}`).join('\n');
          }
        } catch (e) { console.error(e); }

        setFormData({
          siSo: autoSiSo,
          lopTruong: autoLopTruong,
          sdtLopTruong: autoSdtLopTruong,
          thoiGianHop: autoThoiGianHop,
          diaDiemHop: 'Phòng học của lớp / Trực tuyến',
          soSVVang: 0,
          tomTatHoatDong: '',
          noiDungCoVan: autoNoiDungCoVan,
          keHoachThangSau: autoKeHoachThangSau,
          kienNghi: '',
          thayDoiNhanSu: '',
          noiDungKhac: ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!reportData) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này không?')) return;

    try {
      await trienKhaiThongBaoAPI.delete(reportData.id);
      alert('Xóa báo cáo thành công!');
      // Reset form và reload
      setReportData(null);
      setFormData({
        siSo: '',
        lopTruong: '',
        sdtLopTruong: '',
        thoiGianHop: '',
        diaDiemHop: '',
        tomTatHoatDong: '',
        noiDungCoVan: '',
        keHoachThangSau: ''
      });
      fetchNotificationsAndReport(); // Tải lại danh sách
    } catch (error) {
      console.error('Delete error:', error);
      alert('Lỗi khi xóa báo cáo!');
    }
  };

  const handleSave = async () => {
    if (!selectedClass) return alert('Vui lòng chọn lớp');

    // Các trường bắt buộc điền
    const requiredFields = {
      siSo: 'Sĩ số',
      lopTruong: 'Lớp trưởng',
      sdtLopTruong: 'SĐT Lớp trưởng',
      thoiGianHop: 'Thời gian họp',
      diaDiemHop: 'Địa điểm họp',
      noiDungCoVan: 'Nội dung Cố vấn học tập',
      keHoachThangSau: 'Kế hoạch tháng sau'
    };

    const missingFields = Object.keys(requiredFields).filter(key => !formData[key]);
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(key => requiredFields[key]).join(', ');
      alert(`Vui lòng điền đầy đủ các thông tin: ${fieldNames}`);
      return;
    }

    try {
      const payload = {
        ...formData,
        lopId: selectedClass,
        gvcNId: user?.id,
        thang: month,
        nam: year,
        // Gán thongBaoId nếu có (lấy từ thông báo đầu tiên của tháng nếu có)
        thongBaoId: notifications.length > 0 ? notifications[0].id : null
      };
      
      if (reportData) {
        await trienKhaiThongBaoAPI.update(reportData.id, payload);
        alert('Cập nhật báo cáo thành công!');
      } else {
        await trienKhaiThongBaoAPI.create(payload);
        alert('Tạo báo cáo thành công!');
      }
      fetchNotificationsAndReport();
    } catch (err) {
      console.error(err);
      // Hiển thị lỗi chi tiết từ server nếu có
      const errorMessage = err.message || 'Lỗi khi lưu báo cáo';
      alert(errorMessage);
    }
  };

  const handleAutoCopy = async () => {
    if (notifications.length === 0) {
      return alert('Không có thông báo nào trong tháng này để sao chép!');
    }
    
    // 1. Điền TẤT CẢ thông báo tháng hiện tại vào ô "Nội dung cố vấn" trên web theo ý bạn
    const allNotiText = notifications.map(n => `- ${n.noiDung}`).join('\n');
    
    // 2. Lấy thông báo của tháng tiếp theo (đã lọc theo khóa)
    let nextMonth = parseInt(month) + 1;
    let nextYear = parseInt(year);
    if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
    
    let nextNotiText = '';
    try {
      const nextNotiRes = await thongBaoAPI.getAll({ thang: nextMonth, nam: nextYear });
      let nextNotis = nextNotiRes.data || [];
      const currentClass = classes.find(c => String(c.id) === String(selectedClass));
      if (currentClass) {
        const lopKhoa = currentClass.khoa || 'ALL';
        nextNotis = nextNotis.filter(n => n.khoaApDung === 'ALL' || n.khoaApDung === lopKhoa);
      }
      if (nextNotis.length > 0) {
        nextNotiText = nextNotis.map(n => `- ${n.noiDung}`).join('\n');
      }
    } catch (err) {
      console.error('Lỗi lấy thông báo tháng sau:', err);
    }

    setFormData(prev => ({
      ...prev,
      noiDungCoVan: allNotiText,
      keHoachThangSau: nextNotiText || prev.keHoachThangSau
    }));
  };

  const handleExportWord = async () => {
    if (!selectedClass || !month || !year) {
      return alert('Vui lòng chọn lớp, tháng và năm!');
    }
    // We will call the backend API to generate and download Word
    window.open(`http://localhost:5000/api/trien-khai-thong-bao/export/word?lopId=${selectedClass}&thang=${month}&nam=${year}`, '_blank');
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
            <FileText size={40} color="var(--primary)" />
          </div>
          <h2 style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Chưa có lớp báo cáo</h2>
          <p className="text-muted" style={{ marginBottom: '32px', lineHeight: 1.6 }}>
            Báo cáo tháng chỉ dành cho các giảng viên chủ nhiệm đang quản lý lớp. 
            Vui lòng kiểm tra lại danh sách lớp được phân công.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/'} style={{ padding: '12px 32px' }}>
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card mb-4 glass page-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)' }}>Báo cáo sinh hoạt lớp tháng {month}/{year}</h2>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          <div>
            <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Lớp</label>
            <select className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ minWidth: '120px' }}>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.tenLop}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Tháng</label>
            <select className="form-control" value={month} onChange={e => setMonth(e.target.value)} style={{ minWidth: '100px' }}>
              {[...Array(12).keys()].map(i => (
                <option key={i+1} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Năm học</label>
            <select className="form-control" value={year} onChange={e => setYear(e.target.value)} style={{ minWidth: '100px' }}>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>
      </div>

      {undeployedNotis.length > 0 && (
        <div className="mb-4" style={{ backgroundColor: '#fffbeb', color: '#92400e', padding: '16px', borderRadius: '12px', border: '1px solid #fcd34d', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ marginTop: '2px' }}><AlertTriangle size={20} color="#d97706" /></div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600 }}>Cảnh báo: Có {undeployedNotis.length} thông báo chưa được triển khai</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', marginBottom: '8px' }}>
              Lớp của bạn chưa xác nhận triển khai một số thông báo trong tháng. Vui lòng vào trang <Link to="/notifications" style={{ fontWeight: 600, color: '#b45309', textDecoration: 'underline' }}>Quản lý thông báo</Link> để hoàn tất trước khi báo cáo.
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem' }}>
              {undeployedNotis.slice(0, 3).map(n => (
                <li key={n.id} className="mb-1">{n.noiDung.substring(0, 100)}{n.noiDung.length > 100 ? '...' : ''}</li>
              ))}
              {undeployedNotis.length > 3 && <li>... và {undeployedNotis.length - 3} thông báo khác.</li>}
            </ul>
          </div>
        </div>
      )}

      <div className="grid-3 mb-4">
         <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="d-flex justify-between align-center mb-4">
              <h3 style={{ margin: 0 }}>Thông tin báo cáo (Auto + Nhập tay)</h3>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.875rem' }} onClick={handleAutoCopy}>
                ✨ Điền nhanh từ thông báo
              </button>
            </div>
            
            {loading ? <p>Đang tải dữ liệu...</p> : (
              <>
                <div className="form-group mb-4">
                  <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Nội dung triển khai trong tháng từ Nhà trường / Khoa (Lấy tự động)</label>
                  <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px', fontSize: '0.875rem' }}>
                    {notifications.length > 0 ? (
                      <div>
                        {['Nhà trường', 'Khoa', 'Bộ môn / Đoàn', 'CVHT'].map(loai => {
                          const filtered = notifications.filter(n => n.loai === loai);
                          if (filtered.length === 0) return null;
                          return (
                            <div key={loai} className="mb-2">
                              <div style={{ fontWeight: '600', color: '#4B5563', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                                [{loai}]
                              </div>
                              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                {filtered.map(n => <li key={n.id} className="mb-1">{n.noiDung}</li>)}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted">Không có thông báo nào trong tháng này.</span>
                    )}
                  </div>
                </div>

                <div className="d-flex gap-3 mb-3">
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Sĩ số</label>
                    <input type="number" className="form-control" value={formData.siSo} onChange={e => setFormData({...formData, siSo: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Lớp trưởng</label>
                    <input type="text" className="form-control" value={formData.lopTruong} onChange={e => setFormData({...formData, lopTruong: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">SĐT Lớp trưởng</label>
                    <input type="text" className="form-control" value={formData.sdtLopTruong} onChange={e => setFormData({...formData, sdtLopTruong: e.target.value})} />
                  </div>
                </div>

                <div className="d-flex gap-3 mb-3">
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Thời gian họp</label>
                    <input type="datetime-local" className="form-control" value={formData.thoiGianHop} onChange={e => setFormData({...formData, thoiGianHop: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Địa điểm họp</label>
                    <input type="text" className="form-control" value={formData.diaDiemHop} onChange={e => setFormData({...formData, diaDiemHop: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Số SV vắng</label>
                    <input type="number" className="form-control" value={formData.soSVVang} onChange={e => setFormData({...formData, soSVVang: e.target.value})} />
                  </div>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Tóm tắt các hoạt động của lớp trong tháng</label>
                  <textarea className="form-control" rows="3" value={formData.tomTatHoatDong} onChange={e => setFormData({...formData, tomTatHoatDong: e.target.value})}></textarea>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Nội dung Cố vấn học tập trong tháng</label>
                  <textarea className="form-control" rows="3" value={formData.noiDungCoVan} onChange={e => setFormData({...formData, noiDungCoVan: e.target.value})}></textarea>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Triển khai các hoạt động cho tháng tiếp theo</label>
                  <textarea className="form-control" rows="3" value={formData.keHoachThangSau} onChange={e => setFormData({...formData, keHoachThangSau: e.target.value})}></textarea>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Kiến nghị của lớp (nếu có)</label>
                  <textarea className="form-control" rows="2" value={formData.kienNghi} onChange={e => setFormData({...formData, kienNghi: e.target.value})}></textarea>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Những thay đổi về TT GVCN hoặc cán bộ lớp (nếu có)</label>
                  <textarea className="form-control" rows="2" value={formData.thayDoiNhanSu} onChange={e => setFormData({...formData, thayDoiNhanSu: e.target.value})}></textarea>
                </div>

                <div className="form-group mb-3">
                  <label className="form-label">Nội dung khác</label>
                  <textarea className="form-control" rows="2" value={formData.noiDungKhac} onChange={e => setFormData({...formData, noiDungKhac: e.target.value})}></textarea>
                </div>
              </>
            )}
         </div>

         <div className="d-flex gap-4 flex-column" style={{ flexDirection: 'column' }}>
            <div className="card glass">
              <h3 className="mb-3">Thao tác</h3>
              <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
                Sau khi điền đầy đủ thông tin, bạn có thể lưu lại dữ liệu và xuất báo cáo để nộp cho Khoa.
              </p>
              <div className="d-flex gap-2 flex-column" style={{ flexDirection: 'column' }}>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSave}>
                  <Save size={18} /> Lưu Báo Cáo
                </button>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExportWord}>
                  <FileText size={18} /> Sinh file báo cáo (Word)
                </button>
                {reportData && (
                  <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', color: '#ef4444', borderColor: '#ef4444' }} onClick={handleDelete}>
                    <Trash2 size={18} /> Xóa Báo Cáo
                  </button>
                )}
                <div className="mt-3 text-center">
                  {reportData ? (
                    <span className="badge badge-success" style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px' }}>
                      <CheckCircle size={16} style={{ marginRight: '8px' }} /> Đã nộp báo cáo tháng này
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px' }}>
                      Chưa nộp báo cáo
                    </span>
                  )}
                </div>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Reports;

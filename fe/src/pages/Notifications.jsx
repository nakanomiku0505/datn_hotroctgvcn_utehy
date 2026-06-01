import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Edit2, Trash2, Copy, Search, X } from 'lucide-react';
import { thongBaoAPI } from '../api';

const Notifications = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(currentMonth.toString());
  const [filterYear, setFilterYear] = useState(currentYear.toString());
  const [filterLoai, setFilterLoai] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    noiDung: '',
    loai: 'Nhà trường',
    khoaApDung: 'ALL',
    thang: currentMonth,
    nam: currentYear
  });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await thongBaoAPI.getAll({
        thang: filterMonth,
        nam: filterYear,
        loai: filterLoai
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
      alert('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterMonth, filterYear, filterLoai]);

  const handleOpenModal = (noti = null) => {
    if (noti) {
      setEditingId(noti.id);
      setFormData({
        noiDung: noti.noiDung,
        loai: noti.loai,
        khoaApDung: noti.khoaApDung,
        thang: noti.thang,
        nam: noti.nam
      });
      setSelectedFiles([]);
    } else {
      setEditingId(null);
      setFormData({
        noiDung: '',
        loai: 'Nhà trường',
        khoaApDung: 'ALL',
        thang: parseInt(filterMonth),
        nam: parseInt(filterYear)
      });
      setSelectedFiles([]);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.noiDung && selectedFiles.length === 0) return alert('Vui lòng nhập nội dung hoặc đính kèm file');
    try {
      const data = new FormData();
      data.append('noiDung', formData.noiDung);
      data.append('loai', formData.loai);
      data.append('khoaApDung', formData.khoaApDung);
      data.append('thang', formData.thang);
      data.append('nam', formData.nam);
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          data.append('files', file);
        });
      }

      if (editingId) {
        await thongBaoAPI.update(editingId, data);
      } else {
        await thongBaoAPI.create(data);
      }
      setShowModal(false);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu thông báo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    try {
      await thongBaoAPI.delete(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa');
    }
  };

  const handleCopyMonth = async () => {
    let m = parseInt(filterMonth);
    let y = parseInt(filterYear);
    let fm = m - 1;
    let fy = y;
    if (fm === 0) {
      fm = 12;
      fy = y - 1;
    }
    
    if (!window.confirm(`Bạn có chắc muốn copy thông báo từ tháng ${fm}/${fy} sang tháng ${m}/${y} không?`)) return;
    try {
      const res = await thongBaoAPI.copyFromMonth({
        fromMonth: fm,
        fromYear: fy,
        toMonth: m,
        toYear: y
      });
      alert(res.data.message);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Lỗi khi copy thông báo');
    }
  };

  return (
    <div>
      <div className="card mb-4 page-header glass">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)' }}>Quản lý Thông báo - Tháng {filterMonth} / {filterYear}</h2>
          <p className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>Các thông báo này sẽ được tự động hiển thị trong Biên bản SHL hàng tháng.</p>
        </div>
        <div className="d-flex gap-3 flex-wrap">
          <button className="btn btn-secondary" onClick={handleCopyMonth} style={{ flex: 1 }}>
            <Copy size={18} /> Copy từ tháng trước
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ flex: 1 }}>
            <Plus size={18} /> Thêm thông báo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="page-header mb-4">
          <div className="d-flex gap-3 flex-wrap">
            <div>
              <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Tháng</label>
              <select className="form-control" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ minWidth: '120px' }}>
                {[...Array(12).keys()].map(i => (
                  <option key={i+1} value={i+1}>Tháng {i+1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Năm</label>
              <select className="form-control" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ minWidth: '120px' }}>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div>
              <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Phân loại</label>
              <select className="form-control" value={filterLoai} onChange={e => setFilterLoai(e.target.value)}>
                <option value="">Tất cả phân loại</option>
                <option value="Nhà trường">Nhà trường</option>
                <option value="Khoa">Khoa</option>
                <option value="Bộ môn / Đoàn">Bộ môn / Đoàn</option>
                <option value="CVHT">Nội dung CVHT</option>
              </select>
            </div>
          </div>
          <div className="d-flex gap-2 align-end">
            <button className="btn btn-outline" onClick={fetchNotifications}><Search size={16}/> Tải lại</button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="text-center p-4">Đang tải dữ liệu...</div>
          ) : (
            <table className="table-stackable">
              <thead>
                <tr>
                  <th style={{ width: '50%' }}>Nội dung thông báo</th>
                  <th>Phân loại</th>
                  <th>Đối tượng áp dụng</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-muted">Không có thông báo nào trong tháng này.</td>
                  </tr>
                ) : notifications.map(noti => (
                  <tr key={noti.id}>
                    <td data-label="Nội dung">
                      <div style={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{noti.noiDung}</div>
                      {(() => {
                        if (!noti.fileUrl) return null;
                        let urls = [];
                        let names = [];
                        try {
                          urls = JSON.parse(noti.fileUrl);
                          names = JSON.parse(noti.fileName);
                        } catch (e) {
                          urls = [noti.fileUrl];
                          names = [noti.fileName];
                        }
                        if (!Array.isArray(urls)) return null;
                        
                        return urls.map((url, i) => (
                          <div className="mt-2" key={i}>
                            <a href={`http://localhost:5000${url}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                              📎 {names[i] || 'Tải file đính kèm'}
                            </a>
                          </div>
                        ));
                      })()}
                    </td>
                    <td data-label="Phân loại">
                      <span className={`badge ${noti.loai === 'Nhà trường' ? 'badge-primary' : noti.loai === 'Khoa' ? 'badge-warning' : 'badge-success'}`}>
                        {noti.loai}
                      </span>
                    </td>
                    <td data-label="Đối tượng">{noti.khoaApDung || 'ALL'}</td>
                    <td data-label="Hành động" style={{ textAlign: 'right' }}>
                      <div className="d-flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => handleOpenModal(noti)} title="Sửa"><Edit2 size={16} /></button>
                        <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(noti.id)} title="Xóa"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && ReactDOM.createPortal(
        <div className="modal-overlay">
          <div className="card" style={{ maxWidth: '500px', height: 'fit-content', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div className="d-flex justify-between align-center mb-4">
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>{editingId ? 'Sửa thông báo' : 'Thêm thông báo mới'}</h3>
              <button className="btn btn-outline" style={{ padding: '4px' }} onClick={() => setShowModal(false)}><X size={16}/></button>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Nội dung thông báo</label>
              <textarea 
                className="form-control" 
                rows="4"
                value={formData.noiDung}
                onChange={e => setFormData({...formData, noiDung: e.target.value})}
                placeholder="VD: Nhắc nhở SV trả nợ học phần..."
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">File đính kèm</label>
              <input 
                type="file" 
                multiple
                className="form-control" 
                onChange={e => setSelectedFiles(Array.from(e.target.files))}
              />
            </div>

            <div className="mb-3 d-flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="form-label">Phân loại</label>
                <select className="form-control" value={formData.loai} onChange={e => setFormData({...formData, loai: e.target.value})}>
                  <option value="Nhà trường">Nhà trường</option>
                  <option value="Khoa">Khoa</option>
                  <option value="Bộ môn / Đoàn">Bộ môn / Đoàn</option>
                  <option value="CVHT">Nội dung CVHT</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Khóa áp dụng</label>
                <input 
                  type="text"
                  className="form-control" 
                  value={formData.khoaApDung}
                  onChange={e => setFormData({...formData, khoaApDung: e.target.value})}
                  placeholder="VD: ALL, K20, K21..."
                />
              </div>
            </div>

            <div className="mb-4 d-flex gap-3">
              <div style={{ flex: 1 }}>
                <label className="form-label">Tháng</label>
                <input type="number" className="form-control" value={formData.thang} disabled />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Năm</label>
                <input type="number" className="form-control" value={formData.nam} disabled />
              </div>
            </div>

            <div className="d-flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSave}>Lưu thông tin</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Notifications;

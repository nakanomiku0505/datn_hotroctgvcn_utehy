import React, { useState, useEffect } from 'react';
import { FileText, Search, CheckCircle, XCircle } from 'lucide-react';
import { thongBaoAPI, thongBaoDaTrienKhaiAPI, lopAPI } from '../api';

const DeployNotifications = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  const [filterMonth, setFilterMonth] = useState(currentMonth.toString());
  const [filterYear, setFilterYear] = useState(currentYear.toString());
  
  const [notifications, setNotifications] = useState([]);
  const [deployedIds, setDeployedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

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

  const fetchData = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const [notiRes, deployedRes] = await Promise.all([
        thongBaoAPI.getAll({ thang: filterMonth, nam: filterYear }),
        thongBaoDaTrienKhaiAPI.getByLop(selectedClass)
      ]);
      
      setNotifications(notiRes.data || []);
      
      const ids = new Set((deployedRes || []).map(item => item.thongBaoId));
      setDeployedIds(ids);
    } catch (err) {
      console.error(err);
      alert('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClass, filterMonth, filterYear]);

  const handleToggleDeploy = async (noti) => {
    const isDeployed = deployedIds.has(noti.id);
    
    try {
      if (isDeployed) {
        await thongBaoDaTrienKhaiAPI.unmark({
          thongBaoId: noti.id,
          lopId: selectedClass
        });
        setDeployedIds(prev => {
          const next = new Set(prev);
          next.delete(noti.id);
          return next;
        });
      } else {
        await thongBaoDaTrienKhaiAPI.mark({
          thongBaoId: noti.id,
          lopId: selectedClass,
          gvcnId: currentUser.id
        });
        setDeployedIds(prev => {
          const next = new Set(prev);
          next.add(noti.id);
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  return (
    <div>
      <div className="card mb-4 page-header glass">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)' }}>Triển khai Thông báo</h2>
          <p className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>Quản lý việc gửi thông báo tới các lớp và theo dõi trạng thái triển khai.</p>
        </div>
      </div>

      <div className="card glass mb-4">
        <div className="d-flex gap-3 flex-wrap">
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
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="text-muted d-block mb-1" style={{ fontSize: '0.875rem' }}>Tháng</label>
            <select className="form-control" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              {[...Array(12).keys()].map(i => (
                <option key={i+1} value={i+1}>Tháng {i+1}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="text-muted d-block mb-1" style={{ fontSize: '0.875rem' }}>Năm</label>
            <select className="form-control" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="d-flex justify-between align-center mb-4">
          <h3>Danh sách thông báo tháng {filterMonth}/{filterYear}</h3>
          <div className="d-flex gap-2">
            <button className="btn btn-outline" onClick={fetchData}><Search size={16} /> Tải lại</button>
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
                  <th style={{ textAlign: 'center' }}>Trạng thái triển khai</th>
                  <th style={{ textAlign: 'right' }}>Gửi Zalo</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-muted">Không có thông báo nào trong tháng này.</td>
                  </tr>
                ) : notifications.map(noti => {
                  const isDeployed = deployedIds.has(noti.id);
                  return (
                    <tr key={noti.id} style={{ backgroundColor: isDeployed ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}>
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
                      <td data-label="Trạng thái" style={{ textAlign: 'center' }}>
                        <button 
                          className={`btn ${isDeployed ? 'btn-success' : 'btn-outline'}`}
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleToggleDeploy(noti)}
                        >
                          {isDeployed ? (
                            <><CheckCircle size={14} style={{ marginRight: '4px' }} /> Đã triển khai</>
                          ) : (
                            <><XCircle size={14} style={{ marginRight: '4px' }} /> Chưa triển khai</>
                          )}
                        </button>
                      </td>
                      <td data-label="Gửi Zalo" style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '6px', color: '#0068ff', borderColor: '#0068ff', display: 'inline-block' }}
                          title="Copy nội dung và mở Zalo"
                          onClick={() => {
                            let fileStr = '';
                            if (noti.fileUrl) {
                              try {
                                const urls = JSON.parse(noti.fileUrl);
                                const names = JSON.parse(noti.fileName);
                                fileStr = '\nCác file đính kèm:\n' + urls.map((u, i) => `- ${names[i]}: http://localhost:5000${u}`).join('\n');
                              } catch(e) {
                                fileStr = `\nTải file đính kèm: http://localhost:5000${noti.fileUrl}`;
                              }
                            }
                            const textToCopy = `Thông báo mới:\n${noti.noiDung || ''}\n${fileStr}`;
                            navigator.clipboard.writeText(textToCopy.trim()).then(() => {
                              alert('Đã copy nội dung thông báo vào khay nhớ tạm. Vui lòng dán (Ctrl+V) vào nhóm Zalo của lớp.');
                              window.open('https://chat.zalo.me', '_blank');
                              if (!isDeployed) handleToggleDeploy(noti);
                            }).catch(err => {
                              console.error('Could not copy text: ', err);
                              alert('Không thể copy nội dung. Vui lòng thử lại.');
                            });
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"></path><path d="M22 2L15 22L11 13L2 9L22 2Z"></path></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeployNotifications;

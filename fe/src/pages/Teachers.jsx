import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Edit, Trash2, Eye, X, Users } from 'lucide-react';
import { userAPI } from '../api';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll();
      // Lọc ra những người dùng có role = 1 (GVCN)
      const gvcnList = (res || []).filter(u => u.role === 1);
      setTeachers(gvcnList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredTeachers = teachers.filter(t =>
    (t.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (teacher = null) => {
    if (teacher) {
      setSelectedTeacher({ ...teacher, password: '' });
    } else {
      setSelectedTeacher({
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone: '',
        role: 1
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTeacher(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedTeacher.id) {
        await userAPI.update(selectedTeacher.id, selectedTeacher);
        alert('Cập nhật GVCN thành công!');
      } else {
        await userAPI.create(selectedTeacher);
        alert('Thêm GVCN mới thành công!');
      }
      handleCloseModal();
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa GVCN này?')) {
      try {
        await userAPI.delete(id);
        alert('Đã xóa thành công');
        fetchTeachers();
      } catch (err) {
        alert('Lỗi khi xóa: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-between align-center mb-4">
        <div>
          <h2>Quản lý Giáo Viên Chủ Nhiệm (GVCN)</h2>
        </div>
        <button className="btn btn-primary d-flex align-center gap-2" onClick={() => handleOpenModal()} style={{ padding: '8px 16px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
          <Plus size={18} /> Thêm GVCN
        </button>
      </div>

      <div className="card">
        <div className="d-flex justify-between align-center mb-4">
          <div style={{ position: 'relative', width: '350px', maxWidth: '100%' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <Search size={18} color="var(--text-muted)" />
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm theo Tên, Username, Email..."
              value={search}
              onChange={handleSearch}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="p-4 text-center">Đang tải dữ liệu...</div>
          ) : (
            <table className="table-stackable">
              <thead>
                <tr>
                  <th>Họ và Tên</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id} style={{ transition: 'all 0.2s', '&:hover': { backgroundColor: '#f8fafc' } }}>
                    <td>
                      <div className="d-flex align-center gap-3">
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold', fontSize: '14px'
                        }}>
                          {t.full_name ? t.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{t.full_name || 'Chưa cập nhật'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>ID: {t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>
                        {t.username}
                      </div>
                    </td>
                    <td>
                      {t.email ? (
                        <a href={`mailto:${t.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{t.email}</a>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>
                      )}
                    </td>
                    <td>
                      {t.phone ? (
                        <span style={{ fontWeight: 500 }}>{t.phone}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end', gap: '8px', display: 'flex' }}>
                        <button className="btn btn-outline" style={{ padding: '6px' }} title="Chỉnh sửa" onClick={() => handleOpenModal(t)}>
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px' }} title="Xóa" onClick={() => handleDelete(t.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTeachers.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <div className="d-flex flex-column align-center justify-center p-4" style={{ minHeight: '200px', color: '#94a3b8' }}>
                        <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500, color: '#64748b' }}>Không tìm thấy giáo viên nào</p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>Vui lòng thử lại với từ khóa khác hoặc thêm mới GVCN.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%', padding: '24px', height: 'fit-content', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="d-flex justify-between align-center mb-4">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {selectedTeacher?.id ? 'Chỉnh sửa thông tin GVCN' : 'Thêm mới GVCN'}
              </h3>
              <button className="btn-icon" onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Họ và Tên</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedTeacher?.full_name || ''}
                    onChange={e => setSelectedTeacher({ ...selectedTeacher, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tên đăng nhập (Username)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedTeacher?.username || ''}
                    onChange={e => setSelectedTeacher({ ...selectedTeacher, username: e.target.value })}
                    disabled={!!selectedTeacher?.id}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Mật khẩu {selectedTeacher?.id && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Để trống nếu không đổi)</span>}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={selectedTeacher?.password || ''}
                    onChange={e => setSelectedTeacher({ ...selectedTeacher, password: e.target.value })}
                    required={!selectedTeacher?.id}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={selectedTeacher?.email || ''}
                    onChange={e => setSelectedTeacher({ ...selectedTeacher, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedTeacher?.phone || ''}
                    onChange={e => setSelectedTeacher({ ...selectedTeacher, phone: e.target.value })}
                  />
                </div>

                <div className="d-flex justify-end gap-2 pt-2">
                  <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Hủy bỏ</button>
                  <button type="submit" className="btn btn-primary">Lưu thông tin</button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Teachers;

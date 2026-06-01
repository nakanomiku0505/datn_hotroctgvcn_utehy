import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Edit, Trash2, Eye, X, Users } from 'lucide-react';
import { userAPI } from '../api';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const getRoleName = (role) => {
    switch(parseInt(role)) {
      case 0: return 'Quản trị viên';
      case 1: return 'GVCN';
      case 2: return 'Trưởng bộ môn';
      case 4: return 'Lớp trưởng';
      default: return 'Người dùng';
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch(parseInt(role)) {
      case 0: return { background: '#fef2f2', color: '#ef4444' };
      case 1: return { background: '#eff6ff', color: '#3b82f6' };
      case 2: return { background: '#fdf4ff', color: '#d946ef' };
      case 4: return { background: '#f0fdf4', color: '#22c55e' };
      default: return { background: '#f1f5f9', color: '#64748b' };
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll();
      setUsers(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (user = null) => {
    if (user) {
      setSelectedUser({ ...user, password: '' });
    } else {
      setSelectedUser({
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
    setSelectedUser(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser.id) {
        await userAPI.update(selectedUser.id, selectedUser);
        alert('Cập nhật người dùng thành công!');
      } else {
        await userAPI.create(selectedUser);
        alert('Thêm người dùng mới thành công!');
      }
      handleCloseModal();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await userAPI.delete(id);
        alert('Đã xóa thành công');
        fetchUsers();
      } catch (err) {
        alert('Lỗi khi xóa: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div>
      <div className="d-flex justify-between align-center mb-4">
        <div>
          <h2>Quản lý Người dùng</h2>
        </div>
        <button className="btn btn-primary d-flex align-center gap-2" onClick={() => handleOpenModal()} style={{ padding: '8px 16px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
          <Plus size={18} /> Thêm người dùng
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
                  <th>Vai trò</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th style={{ textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ transition: 'all 0.2s', '&:hover': { backgroundColor: '#f8fafc' } }}>
                    <td>
                      <div className="d-flex align-center gap-3">
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 'bold', fontSize: '14px'
                        }}>
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.full_name || 'Chưa cập nhật'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 500 }}>
                        {u.username}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, ...getRoleBadgeStyle(u.role) }}>
                        {getRoleName(u.role)}
                      </div>
                    </td>
                    <td>
                      {u.email ? (
                        <a href={`mailto:${u.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>{u.email}</a>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>
                      )}
                    </td>
                    <td>
                      {u.phone ? (
                        <span style={{ fontWeight: 500 }}>{u.phone}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end', gap: '8px', display: 'flex' }}>
                        <button className="btn btn-outline" style={{ padding: '6px' }} title="Chỉnh sửa" onClick={() => handleOpenModal(u)}>
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px' }} title="Xóa" onClick={() => handleDelete(u.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="d-flex flex-column align-center justify-center p-4" style={{ minHeight: '200px', color: '#94a3b8' }}>
                        <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                        <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500, color: '#64748b' }}>Không tìm thấy người dùng nào</p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>Vui lòng thử lại với từ khóa khác.</p>
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
                {selectedUser?.id ? 'Chỉnh sửa thông tin người dùng' : 'Thêm người dùng mới'}
              </h3>
              <button className="btn-icon" onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Vai trò</label>
                  <select 
                    className="form-control"
                    value={selectedUser?.role || 1}
                    onChange={e => setSelectedUser({ ...selectedUser, role: parseInt(e.target.value) })}
                    required
                  >
                    <option value={0}>Quản trị viên</option>
                    <option value={1}>GVCN / Giảng viên</option>
                    <option value={2}>Trưởng bộ môn</option>
                    <option value={4}>Lớp trưởng</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Họ và Tên</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedUser?.full_name || ''}
                    onChange={e => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tên đăng nhập (Username)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedUser?.username || ''}
                    onChange={e => setSelectedUser({ ...selectedUser, username: e.target.value })}
                    disabled={!!selectedUser?.id}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Mật khẩu {selectedUser?.id && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>(Để trống nếu không đổi)</span>}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={selectedUser?.password || ''}
                    onChange={e => setSelectedUser({ ...selectedUser, password: e.target.value })}
                    required={!selectedUser?.id}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={selectedUser?.email || ''}
                    onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="form-control"
                    value={selectedUser?.phone || ''}
                    onChange={e => setSelectedUser({ ...selectedUser, phone: e.target.value })}
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

export default UsersManagement;

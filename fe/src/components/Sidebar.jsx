import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bell, Users, GraduationCap,
  CalendarCheck, FileText, UploadCloud, Award, LogOut, X, UserCog
} from 'lucide-react';

// Định nghĩa tất cả menu items với role được phép truy cập
// role: 0 = Admin, 1 = GVCN, 2 = Trưởng bộ môn, 4 = Lớp trưởng
// roles: null = tất cả, array = chỉ những role này
const ALL_NAV_ITEMS = [
  { name: 'Thống kê', path: '/', icon: <LayoutDashboard size={20} />, roles: [0, 1, 2] },
  { name: 'Quản lý thông báo', path: '/notifications', icon: <Bell size={20} />, roles: [0, 2] },
  { name: 'Triển khai thông báo', path: '/deploy-notifications', icon: <Bell size={20} />, roles: [0, 1] },
  { name: 'Quản lý người dùng', path: '/users', icon: <UserCog size={20} />, roles: [0] },
  { name: 'Quản lý GVCN', path: '/teachers', icon: <Users size={20} />, roles: [0, 2] },
  { name: 'Quản lý lớp', path: '/classes', icon: <Users size={20} />, roles: [0, 1, 2] },
  { name: 'Quản lý sinh viên', path: '/students', icon: <GraduationCap size={20} />, roles: [0, 1] },
  { name: 'Điểm danh', path: '/attendance', icon: <CalendarCheck size={20} />, roles: [0, 1, 2, 4] },
  { name: 'Báo cáo tháng', path: '/reports', icon: <FileText size={20} />, roles: [0, 1, 2] },
  { name: 'Quản lý điểm học tập', path: '/grades', icon: <UploadCloud size={20} />, roles: [0, 1] },
  { name: 'Điểm rèn luyện', path: '/training-points', icon: <Award size={20} />, roles: [0, 1] },
];

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  // Map role number → string for display
  const getRoleName = (r) => {
    const role = parseInt(r);
    if (role === 0) return 'Quản trị viên';
    if (role === 1) return 'Giảng viên / GVCN';
    if (role === 2) return 'Trưởng bộ môn/khoa';
    if (role === 4) return 'Lớp trưởng';
    return 'Người dùng';
  };

  const roleNum = parseInt(user.role);

  // Filter menu theo role
  const navItems = ALL_NAV_ITEMS.filter(item =>
    item.roles === null || item.roles.includes(roleNum)
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>
          <GraduationCap size={28} color="var(--primary)" />
          <span>Hệ thống hỗ trợ công tác GVCN</span>
        </h2>
        <button
          onClick={onClose}
          style={{
            display: 'none',
            position: 'absolute', top: '16px', right: '16px',
            background: 'white', border: '2px solid var(--border-color)',
            borderRadius: '10px', width: '36px', height: '36px',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
          className="sidebar-close-btn"
          aria-label="Đóng menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Role badge */}
      <div style={{ padding: '0 16px 12px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', opacity: 0.8 }}>
        {getRoleName(user.role)}
      </div>

      <div className="nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div style={{ marginTop: 'auto', padding: '10px 20px' }}>
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <LogOut size={20} />
          <span style={{ fontSize: '15px', fontWeight: 500 }}>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const MainLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPageTitle = (path) => {
    switch (path) {
      case '/': return 'Thống kê';
      case '/notifications': return 'Quản lý thông báo';
      case '/classes': return 'Quản lý lớp';
      case '/students': return 'Quản lý sinh viên';
      case '/attendance': return 'Điểm danh theo buổi';
      case '/reports': return 'Báo cáo tháng GVCN';
      case '/grades': return 'Quản lý điểm học tập';
      case '/training-points': return 'Quản lý điểm rèn luyện';
      default: return 'Trang quản trị';
    }
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { full_name: 'Giảng viên', role: 'GVCN' };

  const getRoleName = (r) => {
    const role = parseInt(r);
    if (role === 0) return 'Quản trị viên';
    if (role === 1) return 'Giảng viên / GVCN';
    if (role === 2) return 'Trưởng bộ môn/khoa';
    if (role === 4) return 'Lớp trưởng';
    return 'Người dùng';
  };

  return (
    <div className="app-container">
      {/* Overlay for mobile sidebar */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        <div className="topbar animate-fade-in">
          {/* Hamburger button - only shows on mobile */}
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở menu"
          >
            <Menu size={20} />
          </button>

          <h1 className="page-title">{getPageTitle(location.pathname)}</h1>

          <div className="user-profile">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User"
            />
            <div className="user-info">
              <div className="name">{user.full_name}</div>
              <div className="role">{getRoleName(user.role)}</div>
            </div>
          </div>
        </div>

        <div className="page-content animate-fade-in delay-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, UserMinus, ShieldAlert, FileWarning, Users, LayoutDashboard } from 'lucide-react';
import { thongKeAPI } from '../api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    absentClasses: [],
    absentStudents: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'Lớp trưởng') {
        navigate('/attendance');
      }
    }
    
    const fetchStats = async () => {
      try {
        const res = await thongKeAPI.getOverview();
        setStats(res || {
          totalClasses: 0,
          totalStudents: 0,
          absentClasses: [],
          absentStudents: []
        });
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [navigate]);

  if (loading) {
    return <div className="p-4">Đang tải dữ liệu thống kê...</div>;
  }

  return (
    <div>
      <div className="grid-4 mb-4">
        <div className="card stat-card">
          <div className="stat-icon primary" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <LayoutDashboard size={24} />
          </div>
          <div className="stat-details">
            <p>Tổng số lớp</p>
            <h3>{stats.totalClasses || 0}</h3>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Users size={24} />
          </div>
          <div className="stat-details">
            <p>Tổng sinh viên</p>
            <h3>{stats.totalStudents || 0}</h3>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon danger">
            <UserMinus size={24} />
          </div>
          <div className="stat-details">
            <p>Lớp có SV vắng</p>
            <h3>{stats.absentClasses ? stats.absentClasses.length : 0}</h3>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon warning">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <p>Sinh viên vắng nhiều</p>
            <h3>{stats.absentStudents ? stats.absentStudents.length : 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="d-flex justify-between align-center mb-4">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Cảnh báo lớp nghỉ học nhiều</h3>
            <button className="btn btn-outline" style={{ padding: '4px 12px' }} onClick={() => navigate('/classes')}>Xem lớp</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Lớp</th>
                  <th>Số lượt vắng mặt</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {stats.absentClasses && stats.absentClasses.length > 0 ? (
                  stats.absentClasses.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{item.tenLop}</td>
                      <td><span className="badge badge-danger">{item.total_absences} lượt vắng</span></td>
                      <td><button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => navigate('/attendance')}>Kiểm tra</button></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Không có lớp nào vi phạm</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="d-flex justify-between align-center mb-4">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Sinh viên vắng mặt nhiều nhất</h3>
            <button className="btn btn-outline" style={{ padding: '4px 12px' }} onClick={() => navigate('/students')}>Xem tất cả</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Lớp</th>
                  <th>Số lượt vắng</th>
                </tr>
              </thead>
              <tbody>
                {stats.absentStudents && stats.absentStudents.length > 0 ? (
                  stats.absentStudents.map((sv, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: '500' }}>{sv.hoTen}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{sv.maSV}</div>
                      </td>
                      <td>{sv.tenLop}</td>
                      <td><span className="text-danger" style={{ fontWeight: 'bold' }}>{sv.total_absences} lượt</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>Chưa có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

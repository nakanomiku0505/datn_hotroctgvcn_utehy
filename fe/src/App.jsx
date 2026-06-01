import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import DeployNotifications from './pages/DeployNotifications';
import Classes from './pages/Classes';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Grades from './pages/Grades';
import TrainingPoints from './pages/TrainingPoints';
import Teachers from './pages/Teachers';
import UsersManagement from './pages/Users';
import Login from './pages/Login';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token) return <Navigate to="/login" />;
  if (!userStr) return <Navigate to="/login" />;

  const user = JSON.parse(userStr);
  const role = parseInt(user.role);
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Nếu là Lớp trưởng (4) mà vào trang không được phép, đẩy về attendance
    if (role === 4) return <Navigate to="/attendance" />;
    // Mặc định đẩy về trang chủ (Dashboard) cho các role khác
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Layout chính bọc các route bên trong */}
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={
            <PrivateRoute allowedRoles={[0, 1, 2]}>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="notifications" element={
            <PrivateRoute allowedRoles={[0, 2]}>
              <Notifications />
            </PrivateRoute>
          } />
          <Route path="deploy-notifications" element={
            <PrivateRoute allowedRoles={[0, 1]}>
              <DeployNotifications />
            </PrivateRoute>
          } />
          <Route path="users" element={
            <PrivateRoute allowedRoles={[0]}>
              <UsersManagement />
            </PrivateRoute>
          } />
          <Route path="teachers" element={
            <PrivateRoute allowedRoles={[0, 2]}>
              <Teachers />
            </PrivateRoute>
          } />
          <Route path="classes" element={
            <PrivateRoute allowedRoles={[0, 1, 2]}>
              <Classes />
            </PrivateRoute>
          } />
          <Route path="students" element={
            <PrivateRoute allowedRoles={[0, 1]}>
              <Students />
            </PrivateRoute>
          } />
          <Route path="attendance" element={
            <PrivateRoute allowedRoles={[0, 1, 2, 4]}>
              <Attendance />
            </PrivateRoute>
          } />
          <Route path="reports" element={
            <PrivateRoute allowedRoles={[0, 1, 2]}>
              <Reports />
            </PrivateRoute>
          } />
          <Route path="grades" element={
            <PrivateRoute allowedRoles={[0, 1]}>
              <Grades />
            </PrivateRoute>
          } />
          <Route path="training-points" element={
            <PrivateRoute allowedRoles={[0, 1]}>
              <TrainingPoints />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

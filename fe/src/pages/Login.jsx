import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react';

import { authAPI } from '../api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.login({ username: email, password });
      localStorage.setItem('token', res.accessToken);
      
      localStorage.setItem('user', JSON.stringify({
        id: res.id,
        username: res.username,
        full_name: res.full_name || res.username,
        role: res.role,
        managedClassCount: res.managedClassCount
      }));
      
      if (res.role === 4) {
        navigate('/attendance');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Tài khoản hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card-wrapper animate-fade-in">
        <div className="login-header">
          <div className="logo-box">
            <GraduationCap size={28} color="#fff" />
          </div>
          <h1>EduAdviser</h1>
          <p>Hệ thống hỗ trợ công tác Giảng Viên Chủ Nhiệm</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <h2>Đăng nhập</h2>
          <p className="subtitle">Truy cập bằng tài khoản trường cấp</p>
          {errorMsg && <div style={{color: 'red', marginBottom: '15px', fontSize: '14px', background: '#ffebee', padding: '10px', borderRadius: '4px'}}>{errorMsg}</div>}

          <div className="form-group-custom">
            <label>Tài khoản (Email hoặc Mã Sinh Viên)</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input 
                type="text" 
                placeholder="Ví dụ: gvcn@spkt.vn hoặc 10123456" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group-custom">
            <div>
              <label>Mật khẩu</label>
              <a href="#" className="forgot-pass">Quên mật khẩu?</a>
            </div>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-cta">
            <span>Đăng nhập hệ thống</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

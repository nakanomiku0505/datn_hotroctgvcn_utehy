import { api } from './fetchClient';

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
};

export const userAPI = {
  getAll: (params) => api.get('/users', params),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const sinhVienAPI = {
  getAll: (params) => api.get('/sinhvien', params),
  getById: (id) => api.get(`/sinhvien/${id}`),
  create: (data) => api.post('/sinhvien', data),
  update: (id, data) => api.put(`/sinhvien/${id}`, data),
  delete: (id) => api.delete(`/sinhvien/${id}`),
  deleteAllByLop: (lopId) => api.delete(`/sinhvien/lop/${lopId}`),
};

export const lopAPI = {
  getAll: (params) => api.get('/lop', params),
  getById: (id) => api.get(`/lop/${id}`),
  create: (data) => api.post('/lop', data),
  update: (id, data) => api.put(`/lop/${id}`, data),
  delete: (id) => api.delete(`/lop/${id}`),
  importStudents: (id, payload) => api.post(`/lop/${id}/import`, payload),
  importClasses: (payload) => api.post('/lop/import-classes', payload),
  importAll: (payload) => api.post('/lop/import-all', payload)
};

export const thongBaoAPI = {
  getAll: (params) => api.get('/thong-bao', params),
  getById: (id) => api.get(`/thong-bao/${id}`),
  create: (data) => api.post('/thong-bao', data),
  update: (id, data) => api.put(`/thong-bao/${id}`, data),
  delete: (id) => api.delete(`/thong-bao/${id}`),
  copyFromMonth: (data) => api.post('/thong-bao/copy-month', data)
};

export const diemDanhAPI = {
  getAll: (params) => api.get('/diem-danh', params),
  getAbsenceSummary: (params) => api.get('/diem-danh/absence-summary', params),
  getByLop: (lopId) => api.get(`/diem-danh/lop/${lopId}`),
  getBySinhVien: (svId) => api.get(`/diem-danh/sinhvien/${svId}`),
  create: (data) => api.post('/diem-danh', data),
  update: (id, data) => api.put(`/diem-danh/${id}`, data),
  delete: (id) => api.delete(`/diem-danh/${id}`),
  exportExcel: async (lopId, thang, nam) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/diem-danh/export-excel?lopId=${lopId}&thang=${thang || ''}&nam=${nam || ''}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Export failed');
    return await response.blob();
  }
};

export const monHocAPI = {
  getAll: (params) => api.get('/mon-hoc', params),
  getById: (id) => api.get(`/mon-hoc/${id}`),
  create: (data) => api.post('/mon-hoc', data),
  update: (id, data) => api.put(`/mon-hoc/${id}`, data),
  delete: (id) => api.delete(`/mon-hoc/${id}`),
};

export const ketQuaHocTapAPI = {
  getAll: (params) => api.get('/ket-qua-hoc-tap', params),
  getBySinhVien: (svId) => api.get(`/ket-qua-hoc-tap/sinhvien/${svId}`),
  uploadExcel: (formData) => api.post('/ket-qua-hoc-tap/upload', formData),
  create: (data) => api.post('/ket-qua-hoc-tap', data),
  update: (id, data) => api.put(`/ket-qua-hoc-tap/${id}`, data),
  deleteByLop: (lopId) => api.delete(`/ket-qua-hoc-tap/lop/${lopId}`),
  delete: (id) => api.delete(`/ket-qua-hoc-tap/${id}`),
};

export const diemRenLuyenAPI = {
  getAll: (params) => api.get('/diem-ren-luyen', params),
  getBySinhVien: (svId) => api.get(`/diem-ren-luyen/sinhvien/${svId}`),
  saveBatch: (data) => api.post('/diem-ren-luyen/batch', data),
  create: (data) => api.post('/diem-ren-luyen', data),
  update: (id, data) => api.put(`/diem-ren-luyen/${id}`, data),
  deleteByLop: (lopId) => api.delete(`/diem-ren-luyen/lop/${lopId}`),
  delete: (id) => api.delete(`/diem-ren-luyen/${id}`),
  exportExcel: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`http://localhost:5000/api/diem-ren-luyen/export-excel?${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
};

export const chiTietRenLuyenAPI = {
  getAll: (params) => api.get('/chi-tiet-ren-luyen', params),
  getByDiemRenLuyen: (drlId) => api.get(`/chi-tiet-ren-luyen/diem-ren-luyen/${drlId}`),
  create: (data) => api.post('/chi-tiet-ren-luyen', data),
  update: (id, data) => api.put(`/chi-tiet-ren-luyen/${id}`, data),
  delete: (id) => api.delete(`/chi-tiet-ren-luyen/${id}`),
};

export const trienKhaiThongBaoAPI = {
  getAll: (params) => api.get('/trien-khai-thong-bao', params),
  getByLop: (lopId) => api.get(`/trien-khai-thong-bao/lop/${lopId}`),
  create: (data) => api.post('/trien-khai-thong-bao', data),
  update: (id, data) => api.put(`/trien-khai-thong-bao/${id}`, data),
  delete: (id) => api.delete(`/trien-khai-thong-bao/${id}`),
};

export const lopSinhVienAPI = {
  getAll: (params) => api.get('/lop-sinhvien', params),
  getSinhVienByLop: (lopId) => api.get(`/lop-sinhvien/lop/${lopId}`),
  create: (data) => api.post('/lop-sinhvien', data),
  delete: (lopId, svId) => api.delete(`/lop-sinhvien/${lopId}/${svId}`),
};

export const thongKeAPI = {
  getOverview: () => api.get('/thong-ke'),
};

export const thongBaoDaTrienKhaiAPI = {
  getByLop: (lopId) => api.get(`/thong-bao-da-trien-khai/lop/${lopId}`),
  mark: (data) => api.post('/thong-bao-da-trien-khai/mark', data),
  unmark: (data) => api.post('/thong-bao-da-trien-khai/unmark', data),
};

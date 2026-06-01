import React, { useState, useEffect } from 'react';
import { Award, Save, CheckCircle, Search, User, RefreshCw, FileText } from 'lucide-react';
import { diemRenLuyenAPI, lopAPI, sinhVienAPI, ketQuaHocTapAPI } from '../api';

const criteriaSchema = [
  {
    id: 'tc1', name: 'I. Đánh giá về ý thức tham gia học tập', max: 20,
    subs: [
      { id: 'tc1_diemTB', name: 'Điểm TB', max: 10, type: 'float' },
      { id: 'tc1_tongTC', name: 'Tổng số tín chỉ', max: 50 },
      { id: 'tc1_tcNo', name: 'Số TC học lại', max: 50 },
      { id: 'tc1_1', name: 'Ý thức và thái độ trong học tập', max: 5 },
      { id: 'tc1_2', name: 'Ý thức và thái độ tham gia các câu lạc bộ học thuật, các hoạt động học thuật, hoạt động ngoại khóa, hoạt động nghiên cứu khoa học.', max: 3, defaultVal: 0, note: 'Thành viên CLB: max 3; NCKH khoa: 1; NCKH trường: 2-3' },
      { id: 'tc1_3', name: 'Ý thức và thái độ tham gia các kỳ thi, cuộc thi', max: 2, defaultVal: 1, note: 'Tham gia đầy đủ: 1; Olympic trg: 1; Khoá học: 1; Olympic tỉnh: 2' },
      { id: 'tc1_4', name: 'Tinh thần vượt khó, vươn lên trong học tập', max: 4, readonly: true },
      { id: 'tc1_5', name: 'Kết quả học tập', max: 6, readonly: true }
    ]
  },
  {
    id: 'tc2', name: 'II. Đánh giá về ý thức chấp hành nội quy, quy chế', max: 25,
    subs: [
      { id: 'tc2_1', name: 'Ý thức chấp hành văn bản, chỉ đạo của nhà trường', max: 3 },
      { id: 'tc2_2', name: 'ý thức thực hiện quy chế thi, kiểm tra', max: 4 },
      { id: 'tc2_3', name: 'Thực hiện tốt nghĩa vụ của SV trong nhà trường (học phí, BH)', max: 6 },
      { id: 'tc2_4', name: 'Thực hiện tốt quy chế nội trú, ngoại trú', max: 4 },
      { id: 'tc2_5', name: 'Thực hiện tốt vệ sinh môi trường, nơi ở', max: 4 },
      { id: 'tc2_6', name: 'Ý thức học tập, trau dồi kỹ năng sống', max: 4 }
    ]
  },
  {
    id: 'tc3', name: 'III. Đánh giá về ý thức tham gia hoạt động CT-XH', max: 20,
    subs: [
      { id: 'tc3_1', name: 'Tham gia sinh hoạt tuần công dân, các hoạt động nhà trường tổ chức', max: 10, defaultVal: 10, note: 'Tham gia SHCD: 5; tham gia cuộc thi, VHVN, TDTT: 5' },
      { id: 'tc3_2', name: 'Ý thức tham gia các hoạt động công ích, tình nguyện', max: 5, defaultVal: 3, note: 'Like, share: 1; hoạt động cấp khoa: 3; hoạt động cấp trường: 5' },
      { id: 'tc3_3', name: 'Tham gia tuyên truyền, phòng chống tội phạm\'', max: 5, defaultVal: 5, note: 'Không vi phạm: 3; Tuyên truyền: 2' }
    ]
  },
  {
    id: 'tc4', name: 'IV. Đánh giá về ý thức công dân trong cộng đồng', max: 25,
    subs: [
      { id: 'tc4_1', name: 'Ý thức chấp hành, tuyên truyền chủ trương của Đảng', max: 10, defaultVal: 10, note: 'Chấp hành: 8; tham gia tuyên truyền: 2' },
      { id: 'tc4_2', name: 'Ý thức tham gia các hoạt động xã hội', max: 7, defaultVal: 5, note: 'tham gia 1 ngày: 2; tham gia 2-4 ngày: 5; tham gia >5 ngày: 7' },
      { id: 'tc4_3', name: 'Công tác từ thiện', max: 8, defaultVal: 4, note: 'Tham gia hiến máu: 4; tham gia ủng hộ hoạt động thiện nguyện: 4' }
    ]
  },
  {
    id: 'tc5', name: 'V. Đánh giá ý thức và kết quả tham gia công tác lớp', max: 10,
    subs: [
      { id: 'tc5_1', name: 'Cán bộ lớp, cán bộ đoàn', max: 10, defaultVal: 0, note: 'CBL/CBĐ: 5; Mức độ HT: XS(5), tốt (3), hoàn thành (2), không HT (0)' },
      { id: 'tc5_2', name: 'SV đạt thành tích đặc biệt', max: 10, defaultVal: 0, note: 'Xuất sắc; đạt giải kỳ thi tỉnh, bộ, quốc gia; NCKH, khởi nghiệp cấp trường giải ba trở lên; bằng khen của tỉnh, bộ, ngành, đoàn hội; hoạt động địa phương về đổi mới sáng tạo, chuyển đổi số (10)' }
    ]
  }
];

const TrainingPoints = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedHocKy, setSelectedHocKy] = useState('1');
  const [namHoc, setNamHoc] = useState('2025-2026');
  const [students, setStudents] = useState([]);
  const [drls, setDrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, searchQuery, selectedHocKy, namHoc, activeTab]);

  const hocKyOptions = [
    { value: '1', label: 'Kỳ 1 (Năm 1)' }, { value: '2', label: 'Kỳ 2 (Năm 1)' },
    { value: '3', label: 'Kỳ 1 (Năm 2)' }, { value: '4', label: 'Kỳ 2 (Năm 2)' },
    { value: '5', label: 'Kỳ 1 (Năm 3)' }, { value: '6', label: 'Kỳ 2 (Năm 3)' },
    { value: '7', label: 'Kỳ 1 (Năm 4)' }, { value: '8', label: 'Kỳ 2 (Năm 4)' },
    { value: '9', label: 'Kỳ 1 (Năm 5)' }, { value: '10', label: 'Kỳ 2 (Năm 5)' }
  ];

  const getTC1_5 = (d) => {
    if (d < 5) return 0;
    if (d < 6) return 2;
    if (d < 7) return 3;
    if (d < 8) return 4;
    if (d < 9) return 5;
    return 6;
  };

  const getTC1_4 = (tongTC, tcNo) => {
    const p = tongTC > 0 ? (tcNo / tongTC) * 100 : 0;
    if (p === 0) return 4;
    if (p < 10) return 3;
    if (p <= 20) return 2;
    if (p <= 30) return 1;
    return 0;
  };

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

  const fetchClassData = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const svRes = await sinhVienAPI.getAll({ lopId: selectedClass, limit: 1000 });
      const svList = svRes.data || [];
      setStudents(svList);

      const drlRes = await diemRenLuyenAPI.getAll({ lopId: selectedClass, hocKy: selectedHocKy, namHoc, limit: 5000 });
      const drlList = drlRes.data || [];
      setDrls(drlList);

      const kqRes = await ketQuaHocTapAPI.getAll({ lopId: selectedClass, hocKy: selectedHocKy, limit: 5000 });
      const kqList = kqRes.data || [];

      // Calculate GPA and Credits per student
      const studentGrades = {};
      kqList.forEach(k => {
        if (!studentGrades[k.sinhVienId]) {
          studentGrades[k.sinhVienId] = { sumDiem: 0, tongTC: 0, tcNo: 0 };
        }
        const sg = studentGrades[k.sinhVienId];
        const tc = parseInt(k.soTinChi) || 0;
        const d10 = parseFloat(k.diem10);

        sg.tongTC += tc;
        if (!isNaN(d10)) {
          sg.sumDiem += d10 * tc;
          if (d10 < 4.0 || k.diemChu === 'F') {
            sg.tcNo += tc;
          }
        } else if (k.diemChu === 'F') {
          sg.tcNo += tc;
        }
      });

      const newForm = {};
      svList.forEach(sv => {
        const existing = drlList.find(d => d.sinhVienId === sv.id);
        let svData = {};

        const sg = studentGrades[sv.id] || { sumDiem: 0, tongTC: 0, tcNo: 0 };
        const calcDiemTB = sg.tongTC > 0 ? (sg.sumDiem / sg.tongTC).toFixed(2) : 0;

        if (existing && existing.chiTiet && existing.chiTiet.length > 0) {
          criteriaSchema.forEach(tc => {
            tc.subs.forEach(sub => {
              const code = sub.id.toUpperCase().replace('_', '.');
              const ct = existing.chiTiet.find(c => c.tieuChi === code);
              svData[sub.id] = ct ? ct.diem : 0;
            });
          });
          // Overwrite with real grades if any (optional, or just let them sync)
          if (sg.tongTC > 0) {
            svData.tc1_diemTB = parseFloat(calcDiemTB);
            svData.tc1_tongTC = sg.tongTC;
            svData.tc1_tcNo = sg.tcNo;
            // Auto calculate 4 and 5
            svData.tc1_5 = getTC1_5(svData.tc1_diemTB);
            svData.tc1_4 = getTC1_4(svData.tc1_tongTC, svData.tc1_tcNo);
            if (svData.tc1_diemTB >= 9.0) svData.tc5_2 = 10;
          }
        } else {
          // Default max points
          criteriaSchema.forEach(tc => {
            tc.subs.forEach(sub => {
              svData[sub.id] = sub.defaultVal !== undefined ? sub.defaultVal : sub.max;
            });
          });

          // Auto-fill from Grades
          if (sg.tongTC > 0) {
            svData.tc1_diemTB = parseFloat(calcDiemTB);
            svData.tc1_tongTC = sg.tongTC;
            svData.tc1_tcNo = sg.tcNo;
            svData.tc1_5 = getTC1_5(svData.tc1_diemTB);
            svData.tc1_4 = getTC1_4(svData.tc1_tongTC, svData.tc1_tcNo);
            if (svData.tc1_diemTB >= 9.0) svData.tc5_2 = 10;
          } else {
            svData.tc1_diemTB = 0;
            svData.tc1_tongTC = 0;
            svData.tc1_tcNo = 0;
            svData.tc1_4 = 4;
            svData.tc1_5 = 6;
          }
        }
        newForm[sv.id] = svData;
      });
      setFormData(newForm);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassData();
  }, [selectedClass, selectedHocKy, namHoc]);

  const handleInputChange = (svId, subId, max, value, type) => {
    let num;
    if (value === '') {
      num = '';
    } else {
      num = type === 'float' ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(num)) num = Math.min(Math.max(0, num), max);
    }

    setFormData(prev => {
      const stData = { ...prev[svId], [subId]: num };

      // Auto-calculate TC1.4 and TC1.5
      const d = parseFloat(stData.tc1_diemTB) || 0;
      if (d < 5) stData.tc1_5 = 0;
      else if (d < 6) stData.tc1_5 = 2;
      else if (d < 7) stData.tc1_5 = 3;
      else if (d < 8) stData.tc1_5 = 4;
      else if (d < 9) stData.tc1_5 = 5;
      else stData.tc1_5 = 6;

      // Auto-calculate TC5.2
      if (d >= 9.0) {
        stData.tc5_2 = 10;
      }

      const tongTC = parseFloat(stData.tc1_tongTC) || 0;
      const tcNo = parseFloat(stData.tc1_tcNo) || 0;
      const p = tongTC > 0 ? (tcNo / tongTC) * 100 : 0;
      if (p === 0) stData.tc1_4 = 4;
      else if (p < 10) stData.tc1_4 = 3;
      else if (p <= 20) stData.tc1_4 = 2;
      else if (p <= 30) stData.tc1_4 = 1;
      else stData.tc1_4 = 0;

      return {
        ...prev,
        [svId]: stData
      };
    });
  };

  const calculateTCTotal = (svId, tcId) => {
    const fd = formData[svId];
    if (!fd) return 0;
    const tc = criteriaSchema.find(t => t.id === tcId);
    if (!tc) return 0;
    let tcSum = 0;
    tc.subs.forEach(sub => {
      if (!['tc1_diemTB', 'tc1_tongTC', 'tc1_tcNo'].includes(sub.id)) {
        tcSum += (fd[sub.id] || 0);
      }
    });
    return Math.min(tcSum, tc.max);
  };

  const calculateStudentTotal = (svId) => {
    const fd = formData[svId];
    if (!fd) return 0;

    let total = 0;
    criteriaSchema.forEach(tc => {
      let tcSum = 0;
      tc.subs.forEach(sub => {
        if (!sub.id.startsWith('tc1_diemTB') && !sub.id.startsWith('tc1_tongTC') && !sub.id.startsWith('tc1_tcNo')) {
          tcSum += (fd[sub.id] || 0);
        }
      });
      total += Math.min(tcSum, tc.max);
    });
    return total;
  };

  const getXepLoai = (tong) => {
    if (tong >= 90) return 'Xuất sắc';
    if (tong >= 80) return 'Tốt';
    if (tong >= 65) return 'Khá';
    if (tong >= 50) return 'Trung bình';
    if (tong >= 35) return 'Yếu';
    return 'Kém';
  };

  const handleSaveBatch = async () => {
    if (!selectedClass) return;
    setSaving(true);

    const payload = [];
    students.forEach(sv => {
      const tc = formData[sv.id] || {};
      const tongDiem = calculateStudentTotal(sv.id);
      const xepLoai = getXepLoai(tongDiem);

      payload.push({
        sinhVienId: sv.id,
        tc, // passes all tc1_1 ... tc5_2
        tongDiem,
        xepLoai
      });
    });

    try {
      const res = await diemRenLuyenAPI.saveBatch({
        lopId: selectedClass,
        hocKy: selectedHocKy,
        namHoc: namHoc,
        data: payload
      });
      alert(res.message);
      fetchClassData();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi lưu ĐRL: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedClass) return;
    try {
      const response = await diemRenLuyenAPI.exportExcel({
        lopId: selectedClass,
        hocKy: selectedHocKy,
        namHoc: namHoc
      });
      if (!response.ok) throw new Error('Xuất Excel thất bại');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bang_THKQRL_HK${selectedHocKy}_${namHoc}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Lỗi xuất file Excel: ' + err.message);
    }
  };

  const filteredStudents = students.filter(s => s.hoTen.toLowerCase().includes(searchQuery.toLowerCase()) || s.maSV.includes(searchQuery));
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1rem' }}>
      <div className="card glass mb-4 page-header">
        <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} /> Cập nhật Điểm rèn luyện
        </h3>
        <div className="d-flex gap-3 align-center mb-4 flex-wrap" style={{ width: '100%' }}>
          <div style={{ flex: 2, minWidth: '150px' }}>
            <label className="text-muted d-block mb-1" style={{ fontSize: '0.875rem' }}>Lớp quản lý</label>
            <select className="form-control" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.tenLop}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <label className="text-muted d-block mb-1" style={{ fontSize: '0.875rem' }}>Học kỳ</label>
            <select className="form-control" value={selectedHocKy} onChange={e => setSelectedHocKy(e.target.value)}>
              {hocKyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <label className="text-muted d-block mb-1" style={{ fontSize: '0.875rem' }}>Năm học</label>
            <input type="text" className="form-control" value={namHoc} onChange={e => setNamHoc(e.target.value)} />
          </div>
        </div>

        <div className="d-flex justify-between align-center p-3 rounded flex-wrap gap-3" style={{ width: '100%' }}>
          <div className="d-flex gap-4">
            <div>Sĩ số: <strong className="text-primary">{students.length}</strong></div>
            <div>Đã có ĐRL kỳ này: <strong className="text-success">{drls.length}</strong></div>
          </div>
          <div className="d-flex gap-3 align-center">
            <div className="d-flex align-center gap-2" style={{ backgroundColor: 'var(--bg-color)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <Search size={16} className="text-muted" />
              <input
                type="text"
                placeholder="Tìm sinh viên..."
                style={{ border: 'none', background: 'transparent', width: '200px', outline: 'none' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveBatch}
              disabled={loading || saving || students.length === 0}
            >
              {saving ? 'Đang lưu...' : <><Save size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Lưu ĐRL cho cả lớp</>}
            </button>
            <button
              className="btn btn-outline text-primary"
              onClick={handleExportExcel}
              disabled={loading || students.length === 0}
              style={{ borderColor: 'var(--primary)', backgroundColor: 'transparent' }}
              title="Xuất điểm rèn luyện ra file Excel chuẩn"
            >
              <FileText size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="d-flex mb-3" style={{ gap: '4px', overflowX: 'auto', borderBottom: '2px solid var(--border-color)', maxWidth: '100%' }}>
        <button 
          className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', whiteSpace: 'nowrap' }}
          onClick={() => setActiveTab('summary')}
        >
          Tổng hợp
        </button>
        {criteriaSchema.map(tc => (
          <button 
            key={tc.id}
            className={`btn ${activeTab === tc.id ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none', whiteSpace: 'nowrap' }}
            onClick={() => setActiveTab(tc.id)}
            title={tc.name}
          >
            {tc.id.toUpperCase()} ({tc.max}đ)
          </button>
        ))}
      </div>

      {/* Excel-like Data Grid */}
      <div className="card glass" style={{ overflowX: 'auto', padding: 0, width: '100%', maxWidth: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', top: 0, left: 0, zIndex: 11, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>STT</th>
              <th style={{ position: 'sticky', top: 0, left: '46px', zIndex: 11, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>MSV</th>
              <th style={{ position: 'sticky', top: 0, left: '136px', zIndex: 11, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '2px solid var(--border-color)', padding: '12px', minWidth: '180px' }}>Họ Tên</th>
              
              {activeTab === 'summary' && (
                <>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>Điểm TB</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>TC Nợ</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>TC1 (20)</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>TC2 (25)</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>TC3 (20)</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>TC4 (25)</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>TC5 (10)</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', color: 'var(--primary)' }}>Tổng (100)</th>
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', padding: '12px' }}>Xếp loại</th>
                </>
              )}

              {activeTab !== 'summary' && (
                <>
                  {activeTab === 'tc1' && (
                    <>
                      <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>Điểm TB</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>Số TC học lại</th>
                      <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>% học lại</th>
                    </>
                  )}
                  {['tc4', 'tc5'].includes(activeTab) && (
                    <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px' }}>Điểm TB</th>
                  )}
                  {criteriaSchema.find(t => t.id === activeTab).subs
                    .filter(sub => !['tc1_diemTB', 'tc1_tongTC', 'tc1_tcNo'].includes(sub.id))
                    .map(sub => (
                    <th key={sub.id} style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center', verticalAlign: 'top', minWidth: '180px' }}>
                      <div style={{ whiteSpace: 'normal', fontSize: '0.85rem', lineHeight: '1.4' }} title={sub.note || sub.name}>
                        <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>{sub.name}</div>
                        <span className="badge" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px' }}>Tối đa: {sub.max}đ</span>
                      </div>
                    </th>
                  ))}
                  <th style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', padding: '12px', color: 'var(--primary)', verticalAlign: 'top', minWidth: '100px' }}>
                    Tổng {activeTab.toUpperCase()}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="20" className="text-center p-4">Đang tải dữ liệu...</td></tr>
            ) : currentStudents.length === 0 ? (
              <tr><td colSpan="20" className="text-center p-4">Không có sinh viên nào.</td></tr>
            ) : (
              currentStudents.map((sv, index) => {
                const fd = formData[sv.id] || {};
                const tongDiem = calculateStudentTotal(sv.id);
                const isWarning = (fd.tc1_tcNo > 0) || (tongDiem < 50);
                const rowBg = isWarning ? 'rgba(244,63,94,0.02)' : (index % 2 === 0 ? '#fafafa' : '#fff');
                const stickyBg = isWarning ? '#fff5f5' : (index % 2 === 0 ? '#fafafa' : '#fff');
                const stt = (currentPage - 1) * itemsPerPage + index + 1;
                
                return (
                  <tr key={sv.id} style={{ backgroundColor: rowBg }}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 9, backgroundColor: stickyBg, borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>{stt}</td>
                    <td style={{ position: 'sticky', left: '46px', zIndex: 9, backgroundColor: stickyBg, borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', fontFamily: 'monospace' }}>{sv.maSV}</td>
                    <td style={{ position: 'sticky', left: '136px', zIndex: 9, backgroundColor: stickyBg, borderBottom: '1px solid var(--border-color)', borderRight: '2px solid var(--border-color)', padding: '12px', fontWeight: 500 }}>{sv.hoTen}</td>
                    
                    {activeTab === 'summary' && (
                      <>
                        <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>{fd.tc1_diemTB || 0}</td>
                        <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center', color: fd.tc1_tcNo > 0 ? 'var(--danger)' : 'inherit', fontWeight: fd.tc1_tcNo > 0 ? 'bold' : 'normal' }}>{fd.tc1_tcNo || 0}</td>
                        <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>{calculateTCTotal(sv.id, 'tc1')}</td>
                        <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>{calculateTCTotal(sv.id, 'tc2')}</td>
                        <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>{calculateTCTotal(sv.id, 'tc3')}</td>
                        <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>{calculateTCTotal(sv.id, 'tc4')}</td>
                        <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>{calculateTCTotal(sv.id, 'tc5')}</td>
                        <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>{tongDiem}</td>
                        <td style={{ borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'center', fontWeight: 500 }}>
                          <span style={{ color: tongDiem >= 80 ? 'var(--success)' : tongDiem < 50 ? 'var(--danger)' : 'var(--primary)' }}>
                            {getXepLoai(tongDiem)}
                          </span>
                        </td>
                      </>
                    )}

                    {activeTab !== 'summary' && (
                      <>
                        {activeTab === 'tc1' && (
                          <>
                            <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>{fd.tc1_diemTB || 0}</td>
                            <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center', color: fd.tc1_tcNo > 0 ? 'var(--danger)' : 'inherit', fontWeight: fd.tc1_tcNo > 0 ? 'bold' : 'normal' }}>{fd.tc1_tcNo || 0}</td>
                            <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center', backgroundColor: '#ffff00', color: '#000', fontWeight: 'bold' }}>
                              {fd.tc1_tongTC > 0 ? ((fd.tc1_tcNo || 0) / fd.tc1_tongTC * 100).toFixed(0) : 0}
                            </td>
                          </>
                        )}
                        {['tc4', 'tc5'].includes(activeTab) && (
                          <td style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '12px', textAlign: 'center' }}>{fd.tc1_diemTB || 0}</td>
                        )}
                        {criteriaSchema.find(t => t.id === activeTab).subs
                          .filter(sub => !['tc1_diemTB', 'tc1_tongTC', 'tc1_tcNo'].includes(sub.id))
                          .map(sub => (
                          <td key={sub.id} style={{ borderBottom: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', padding: '8px', textAlign: 'center' }}>
                            <input
                              type="number"
                              className="form-control"
                              style={{ width: '70px', textAlign: 'center', padding: '6px', margin: '0 auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                              min="0" max={sub.max}
                              value={fd[sub.id] !== undefined ? fd[sub.id] : ''}
                              onChange={e => handleInputChange(sv.id, sub.id, sub.max, e.target.value, sub.type)}
                              disabled={sub.readonly}
                              title={sub.name}
                            />
                          </td>
                        ))}
                        <td style={{ borderBottom: '1px solid var(--border-color)', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.1rem' }}>
                          {calculateTCTotal(sv.id, activeTab)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="card glass d-flex justify-between align-center p-3" style={{ marginTop: '1rem' }}>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            Hiển thị <strong className="text-primary">{(currentPage - 1) * itemsPerPage + 1}</strong> đến <strong className="text-primary">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</strong> trong tổng số <strong className="text-primary">{filteredStudents.length}</strong> sinh viên
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline" 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page} 
                className={`btn ${currentPage === page ? 'btn-primary' : 'btn-outline'}`} 
                onClick={() => setCurrentPage(page)}
                style={{ minWidth: '40px' }}
              >
                {page}
              </button>
            ))}
            <button 
              className="btn btn-outline" 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


export default TrainingPoints;

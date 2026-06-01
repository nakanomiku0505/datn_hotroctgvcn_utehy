const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const lopId = req.query.lopId || '';
        const thang = req.query.thang || '';
        const nam = req.query.nam || '';

        let query = 'SELECT * FROM trien_khai_thong_bao WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM trien_khai_thong_bao WHERE 1=1';
        const queryParams = [];
        const countParams = [];

        if (lopId) {
            query += ' AND lopId = ?';
            countQuery += ' AND lopId = ?';
            queryParams.push(lopId);
            countParams.push(lopId);
        }

        if (thang) {
            query += ' AND thang = ?';
            countQuery += ' AND thang = ?';
            queryParams.push(thang);
            countParams.push(thang);
        }

        if (nam) {
            query += ' AND nam = ?';
            countQuery += ' AND nam = ?';
            queryParams.push(nam);
            countParams.push(nam);
        }

        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await db.query(query, queryParams);
        const [countResult] = await db.query(countQuery, countParams);
        const total = countResult[0].total;

        res.status(200).json({
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.getByLop = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM trien_khai_thong_bao WHERE lopId = ?', [req.params.lopId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const data = req.body;
        
        // Validation
        if (!data.lopId || !data.thang || !data.nam) {
            return res.status(400).json({ message: 'Thiếu các trường bắt buộc: lopId, thang, nam' });
        }

        const query = `INSERT INTO trien_khai_thong_bao (
            thongBaoId, lopId, gvcNId, thang, nam, siSo, lopTruong, sdtLopTruong, thoiGianHop, 
            diaDiemHop, soSVVang, tomTatHoatDong, noiDungCoVan, keHoachThangSau, 
            kienNghi, thayDoiNhanSu, noiDungKhac
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const values = [
            data.thongBaoId || null, data.lopId, data.gvcNId, data.thang, data.nam, data.siSo, data.lopTruong, data.sdtLopTruong, 
            data.thoiGianHop || null, data.diaDiemHop, data.soSVVang || 0, data.tomTatHoatDong, data.noiDungCoVan, 
            data.keHoachThangSau, data.kienNghi, data.thayDoiNhanSu, data.noiDungKhac
        ];

        const [result] = await db.query(query, values);
        res.status(201).json({ message: 'Lưu báo cáo tháng thành công', id: result.insertId });
    } catch (error) {
        console.error('Create Report Error:', error);
        res.status(500).json({ message: 'Lỗi server khi tạo báo cáo', error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const data = req.body;
        const query = `UPDATE trien_khai_thong_bao SET 
            thongBaoId=?, lopId=?, gvcNId=?, thang=?, nam=?, siSo=?, lopTruong=?, sdtLopTruong=?, thoiGianHop=?, 
            diaDiemHop=?, soSVVang=?, tomTatHoatDong=?, noiDungCoVan=?, keHoachThangSau=?, 
            kienNghi=?, thayDoiNhanSu=?, noiDungKhac=? WHERE id=?`;
        
        const values = [
            data.thongBaoId || null, data.lopId, data.gvcNId, data.thang, data.nam, data.siSo, data.lopTruong, data.sdtLopTruong, 
            data.thoiGianHop || null, data.diaDiemHop, data.soSVVang || 0, data.tomTatHoatDong, data.noiDungCoVan, 
            data.keHoachThangSau, data.kienNghi, data.thayDoiNhanSu, data.noiDungKhac, req.params.id
        ];

        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
        res.status(200).json({ message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Update Report Error:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật báo cáo', error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM trien_khai_thong_bao WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
        res.status(200).json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.exportWord = async (req, res) => {
    try {
        const docx = require('docx');
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = docx;
        const { lopId, thang, nam } = req.query;
        
        if (!lopId || !thang || !nam) {
            return res.status(400).send('Thiếu tham số lopId, thang, nam');
        }

        const [repRows] = await db.query('SELECT * FROM trien_khai_thong_bao WHERE lopId = ? AND thang = ? AND nam = ?', [lopId, thang, nam]);
        const report = repRows[0] || {};
        const [lopRows] = await db.query('SELECT * FROM lop WHERE id = ?', [lopId]);
        const lop = lopRows[0] || {};
        let gvcn = {};
        if (lop.gvcNId) {
            const [uRows] = await db.query('SELECT * FROM users WHERE id = ?', [lop.gvcNId]);
            gvcn = uRows[0] || {};
        }
        // Lấy thông báo áp dụng cho lớp này:
        // - khoaApDung = 'ALL' (tất cả) HOẶC khoaApDung = khóa của lớp (vd: K20)
        const lopKhoa = lop.khoa || 'ALL';
        const [tbRows] = await db.query(
            `SELECT * FROM thong_bao
             WHERE thang = ? AND nam = ?
               AND (khoaApDung = 'ALL' OR khoaApDung = ?)
             ORDER BY FIELD(loai, 'Nhà trường', 'Khoa', 'Bộ môn / Đoàn', 'CVHT'), id`,
            [thang, nam, lopKhoa]
        );

        // Nhóm thông báo theo loại
        const LOAI_ORDER = ['Nhà trường', 'Khoa', 'Bộ môn / Đoàn', 'CVHT'];
        const tbByLoai = {};
        for (const tb of tbRows) {
            const key = tb.loai || 'Khác';
            if (!tbByLoai[key]) tbByLoai[key] = [];
            tbByLoai[key].push(tb);
        }

        // helper: make a paragraph with Times New Roman 16pt
        const mkPara = (text, opts = {}) => new Paragraph({
            children: [new TextRun({
                text: text || '',
                size: 32,
                font: 'Times New Roman',
                bold: opts.bold || false,
                italic: opts.italic || false,
            })],
            alignment: opts.align || AlignmentType.LEFT,
            spacing: { before: opts.before || 0, after: opts.after || 0, line: 276, lineRule: 'auto' },
        });

        const emptyPara = () => new Paragraph({
            children: [],
            spacing: { before: 0, after: 0, line: 276, lineRule: 'auto' },
        });

        // format thoiGianHop
        let thoiGianStr = '................';
        let ngayHop = new Date().getDate();
        if (report.thoiGianHop) {
            const dt = new Date(report.thoiGianHop);
            ngayHop = dt.getDate();
            const hh = String(dt.getHours()).padStart(2, '0');
            const mm = String(dt.getMinutes()).padStart(2, '0');
            thoiGianStr = `${hh}h${mm}, ${dt.getDate()}/${dt.getMonth()+1}/${dt.getFullYear()}`;
        }

        // split multi-line text into bullet paragraphs
        const multiLine = (text) => {
            if (!text || !text.trim()) return [mkPara('- ................')];
            return text.split('\n').filter(l => l.trim()).map(l => {
                const trimmed = l.trim();
                // avoid double dash if the stored value already has '- ' prefix
                return mkPara(trimmed.startsWith('-') ? trimmed : `- ${trimmed}`);
            });
        };

        const solidBorder = { style: BorderStyle.SINGLE, size: 8, color: '000000' };

        const sigCell = (label) => new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({
                children: [new TextRun({ text: label, bold: true, italic: true, size: 32, font: 'Times New Roman' })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0, line: 276, lineRule: 'auto' },
            })],
        });

        const nameCell = (name) => new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
                emptyPara(), emptyPara(), emptyPara(),
                new Paragraph({
                    children: [new TextRun({ text: name || '', bold: true, italic: true, size: 32, font: 'Times New Roman' })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 0, after: 0, line: 276, lineRule: 'auto' },
                }),
            ],
        });

        const children = [
            // Header
            mkPara('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: AlignmentType.CENTER }),
            mkPara('Độc lập - Tự do - Hạnh phúc', { align: AlignmentType.CENTER, after: 280 }),
            // Title
            mkPara('BIÊN BẢN HỌP LỚP', { bold: true, align: AlignmentType.CENTER, before: 400 }),
            mkPara(`Tháng ${thang} năm ${nam}`, { align: AlignmentType.CENTER }),
            // Section I
            mkPara('I. Thời gian, địa điểm, thành phần:'),
            mkPara(`1. Thời gian: ${thoiGianStr}`),
            mkPara(`2. Địa điểm: ${report.diaDiemHop || '................'}`),
            mkPara('3. Thành phần:'),
            mkPara(`- Chủ tọa: ${gvcn.full_name || '................'}`),
            mkPara(`- Thư ký: ${report.lopTruong || '................'}`),
            mkPara(`- Tập thể lớp: ${lop.tenLop || '................'}`),
            // II. Mục đích, nội dung:
            mkPara('II. Mục đích, nội dung:'),
            ...(() => {
                const finalSections = [];
                let secIdx = 1;

                // Section 1: Hoạt động lớp (LUÔN HIỆN)
                const activityLines = report.tomTatHoatDong && report.tomTatHoatDong.trim() 
                    ? report.tomTatHoatDong.split('\n').filter(l => l.trim()) 
                    : [];
                finalSections.push(mkPara(`${secIdx++}. Báo cáo về tình hình học tập và các hoạt động chung của lớp`));
                if (activityLines.length > 0) {
                    finalSections.push(...activityLines.map(l => mkPara(l.trim().startsWith('-') ? l.trim() : `- ${l.trim()}`)));
                } else {
                    finalSections.push(mkPara('- ................'));
                }
                finalSections.push(emptyPara());

                // Section 2: Thông báo Nhà trường/Khoa (LUÔN HIỆN)
                const officialNotis = LOAI_ORDER.slice(0, 2).filter(loai => tbByLoai[loai])
                    .flatMap(loai => tbByLoai[loai].map(tb => tb.noiDung.trim()));
                
                finalSections.push(mkPara(`${secIdx++}. Triển khai các thông báo của Khoa/Nhà trường`));
                if (officialNotis.length > 0) {
                    finalSections.push(...officialNotis.map(text => mkPara(`- ${text}`)));
                } else {
                    finalSections.push(mkPara('- ................'));
                }
                finalSections.push(emptyPara());

                // Section 3: Nội dung khác / CVHT (LUÔN HIỆN)
                const manualLines = report.noiDungCoVan && report.noiDungCoVan.trim() 
                    ? report.noiDungCoVan.split('\n').filter(l => l.trim()) 
                    : [];
                const officialSet = new Set(officialNotis);
                const filteredManual = manualLines.filter(l => {
                    const clean = l.trim().replace(/^- /, '').trim();
                    return !officialSet.has(clean);
                });

                finalSections.push(mkPara(`${secIdx++}. Một số nội dung khác/cố vấn học tập:`));
                if (filteredManual.length > 0) {
                    finalSections.push(...filteredManual.map(l => mkPara(l.trim().startsWith('-') ? l.trim() : `- ${l.trim()}`)));
                } else {
                    finalSections.push(mkPara('- ................'));
                }
                finalSections.push(emptyPara());

                // Section 4: Kiến nghị
                if (report.kienNghi && report.kienNghi.trim()) {
                    finalSections.push(mkPara(`${secIdx++}. Kiến nghị của lớp (nếu có):`));
                    finalSections.push(...report.kienNghi.split('\n').filter(l => l.trim()).map(l => mkPara(l.trim().startsWith('-') ? l.trim() : `- ${l.trim()}`)));
                    finalSections.push(emptyPara());
                }

                // Section 5: Thay đổi nhân sự
                if (report.thayDoiNhanSu && report.thayDoiNhanSu.trim()) {
                    finalSections.push(mkPara(`${secIdx++}. Những thay đổi về TT GVCN hoặc cán bộ lớp (nếu có):`));
                    finalSections.push(...report.thayDoiNhanSu.split('\n').filter(l => l.trim()).map(l => mkPara(l.trim().startsWith('-') ? l.trim() : `- ${l.trim()}`)));
                    finalSections.push(emptyPara());
                }

                // Section 6: Nội dung khác
                if (report.noiDungKhac && report.noiDungKhac.trim()) {
                    finalSections.push(mkPara(`${secIdx++}. Nội dung khác:`));
                    finalSections.push(...report.noiDungKhac.split('\n').filter(l => l.trim()).map(l => mkPara(l.trim().startsWith('-') ? l.trim() : `- ${l.trim()}`)));
                    finalSections.push(emptyPara());
                }

                // Nếu hoàn toàn không có gì trong Mục II thì hiện 1 dòng chấm
                if (finalSections.length === 0) {
                    return [mkPara('1. ................'), mkPara('- ................'), emptyPara()];
                }

                return finalSections;
            })(),

            // Date
            mkPara(`Hưng Yên, ngày ${ngayHop}  tháng ${thang} năm ${nam}`, { italic: true, align: AlignmentType.RIGHT }),
            // Signature table
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: solidBorder, bottom: solidBorder,
                    left: solidBorder, right: solidBorder,
                    insideH: solidBorder, insideV: solidBorder,
                },
                rows: [
                    new TableRow({ children: [sigCell('GVCN/Chủ tọa'), sigCell('Thư ký')] }),
                    new TableRow({ children: [nameCell(gvcn.full_name), nameCell(report.lopTruong)] }),
                ],
            }),
        ];

        const doc = new Document({
            sections: [{
                properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
                children,
            }],
        });

        const b64string = await Packer.toBase64String(doc);
        const buffer = Buffer.from(b64string, 'base64');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="BienBan_Thang${thang}_Nam${nam}_${lop.tenLop || 'Lop'}.docx"`);
        res.send(buffer);
    } catch (error) {
        console.error('exportWord error:', error);
        res.status(500).send('Lỗi xuất file Word');
    }
};

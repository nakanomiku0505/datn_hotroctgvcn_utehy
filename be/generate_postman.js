const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Ensure env vars are loaded if they exist
const db = require('./config/db'); // Load DB

const routesDir = path.join(__dirname, 'routes');
const controllersDir = path.join(__dirname, 'controllers');

const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.routes.js'));

const collection = {
    info: {
        name: "DATN API Collection (Real Data)",
        description: "Tự động generate các endpoints của Backend kèm dữ liệu thật từ Database",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: [],
    variable: [
        {
            key: "url",
            value: "http://localhost:5000/api",
            type: "string"
        },
        {
            key: "token",
            value: "YOUR_TOKEN_HERE",
            type: "string"
        }
    ]
};

(async () => {
    try {
        // Fetch some sample data from the database
        const [[user]] = await db.query('SELECT * FROM users LIMIT 1').catch(() => [[null]]);
        const [[lop]] = await db.query('SELECT * FROM lop LIMIT 1').catch(() => [[null]]);
        const [[sinhVien]] = await db.query('SELECT * FROM sinh_vien LIMIT 1').catch(() => [[null]]);
        const [[monHoc]] = await db.query('SELECT * FROM mon_hoc LIMIT 1').catch(() => [[null]]);
        const [[thongBao]] = await db.query('SELECT * FROM thong_bao LIMIT 1').catch(() => [[null]]);
        const [[diemRenLuyen]] = await db.query('SELECT * FROM diem_ren_luyen LIMIT 1').catch(() => [[null]]);

        const sampleData = {
            userId: user ? user.id : 1,
            username: user ? user.username : 'admin',
            email: user ? user.email : 'admin@test.com',
            full_name: user ? user.full_name : 'Admin',
            role: user ? user.role : 1,
            lopId: lop ? lop.id : 'L01',
            tenLop: lop ? lop.tenLop : '62PM1',
            khoa: lop ? lop.khoa : 'CNTT',
            nganh: lop ? lop.nganh : 'PM',
            sinhVienId: sinhVien ? sinhVien.id : 'SV01',
            hoTen: sinhVien ? sinhVien.hoTen : 'Nguyễn Văn A',
            monHocId: monHoc ? monHoc.id : 1,
            tenMon: monHoc ? monHoc.tenMon : 'Mạng máy tính',
            thongBaoId: thongBao ? thongBao.id : 1,
            drlId: diemRenLuyen ? diemRenLuyen.id : 1
        };

        const getSampleValue = (fieldName) => {
            fieldName = fieldName.toLowerCase();
            
            // Map to real DB samples if possible
            if (fieldName === 'id') return sampleData.userId; // fallback
            if (fieldName === 'lopid' || fieldName === 'lop_id') return sampleData.lopId;
            if (fieldName === 'sinhvienid' || fieldName === 'svid' || fieldName === 'sinhvien_id') return sampleData.sinhVienId;
            if (fieldName === 'monhocid') return sampleData.monHocId;
            if (fieldName === 'thongbaoid') return sampleData.thongBaoId;
            if (fieldName === 'drlid' || fieldName === 'diemrenluyenid') return sampleData.drlId;
            if (fieldName === 'userid' || fieldName === 'gvcnid' || fieldName === 'loptruongid') return sampleData.userId;
            
            if (fieldName === 'username') return sampleData.username;
            if (fieldName === 'password') return '123456';
            if (fieldName === 'email') return sampleData.email;
            if (fieldName === 'full_name' || fieldName === 'hoten') return sampleData.full_name;
            if (fieldName === 'phone' || fieldName === 'dienthoai') return '0123456789';
            if (fieldName === 'role') return sampleData.role;
            
            if (fieldName === 'tenlop') return sampleData.tenLop;
            if (fieldName === 'khoa') return sampleData.khoa;
            if (fieldName === 'nganh') return sampleData.nganh;
            if (fieldName === 'tenmon') return sampleData.tenMon;
            
            // Hardcoded useful fallbacks
            if (fieldName === 'gioitinh') return 'Nam';
            if (fieldName === 'ngaysinh') return '2000-01-01';
            if (fieldName === 'page') return 1;
            if (fieldName === 'limit') return 10;
            if (fieldName === 'search') return '';
            
            if (fieldName === 'ngay' || fieldName === 'tungay' || fieldName === 'denngay') return '2024-05-01';
            if (fieldName === 'thang') return 5;
            if (fieldName === 'nam' || fieldName === 'namhoc') return '2024-2025';
            if (fieldName === 'hocky') return 1;
            if (fieldName === 'frommonth') return 4;
            if (fieldName === 'fromyear') return 2024;
            if (fieldName === 'tomonth') return 5;
            if (fieldName === 'toyear') return 2024;
            if (fieldName === 'thu') return 2;
            if (fieldName === 'buoi') return 1;
        
            if (fieldName === 'sotinchi') return 3;
            if (fieldName === 'diem10' || fieldName === 'diem' || fieldName === 'tongdiem') return 8.5;
            if (fieldName === 'diemtoida') return 10;
            if (fieldName === 'diemchu' || fieldName === 'xeploai') return 'Giỏi';
            if (fieldName === 'trangthai') return 1;
            if (fieldName === 'hoclai') return 0;
            
            if (fieldName === 'data' || fieldName === 'classes' || fieldName === 'students') return [];
        
            if (fieldName === 'tieuchi') return 'Tiêu chí';
            if (fieldName === 'noidung') return 'Nội dung';
            if (fieldName === 'loai') return 1;
            if (fieldName === 'khoaap\u0064ung' || fieldName === 'khoaap\u0064ung') return 'Tất cả';
        
            return "sample_value";
        };
        
        const extractFields = (content, methodPattern) => {
            const methodRegex = new RegExp(`(?:exports\\.)?${methodPattern}\\s*=\\s*(?:async\\s*)?(?:function\\s*)?\\(.*?\\)\\s*(?:=>)?\\s*\\{([\\s\\S]*?)(?:^\\};|^exports\\.|^const\\s+|^let\\s+|^var\\s+)`, 'm');
            const match = content.match(methodRegex);
            if (!match) return { body: [], query: [], params: [] };
            
            const bodyText = match[1];
            
            const bodyFields = [...new Set([...bodyText.matchAll(/req\.body\.([a-zA-Z0-9_]+)/g)].map(m => m[1]))];
            const queryFields = [...new Set([...bodyText.matchAll(/req\.query\.([a-zA-Z0-9_]+)/g)].map(m => m[1]))];
            const paramsFields = [...new Set([...bodyText.matchAll(/req\.params\.([a-zA-Z0-9_]+)/g)].map(m => m[1]))];
            
            const destructureBodyRegex = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*req\.body/g;
            let dbMatch;
            while ((dbMatch = destructureBodyRegex.exec(bodyText)) !== null) {
                bodyFields.push(...dbMatch[1].split(',').map(s => s.split(':')[0].trim()).filter(s => s));
            }
            
            const destructureQueryRegex = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*req\.query/g;
            while ((dbMatch = destructureQueryRegex.exec(bodyText)) !== null) {
                queryFields.push(...dbMatch[1].split(',').map(s => s.trim()).filter(s => s));
            }
        
            const destructureParamsRegex = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*req\.params/g;
            while ((dbMatch = destructureParamsRegex.exec(bodyText)) !== null) {
                paramsFields.push(...dbMatch[1].split(',').map(s => s.trim()).filter(s => s));
            }
            
            return {
                body: [...new Set(bodyFields)],
                query: [...new Set(queryFields)],
                params: [...new Set(paramsFields)]
            };
        };
        
        routeFiles.forEach(file => {
            let moduleName = file.replace('.routes.js', '');
            let baseRoute = moduleName.replace('user', 'users').replace('thongbaodatrienkhai', 'thong-bao-da-trien-khai').replace('trienkhaithongbao', 'trien-khai-thong-bao').replace('thongke', 'thong-ke').replace('chitietrenluyen', 'chi-tiet-ren-luyen').replace('diemrenluyen', 'diem-ren-luyen').replace('diemdanh', 'diem-danh').replace('ketquahoctap', 'ket-qua-hoc-tap').replace('monhoc', 'mon-hoc').replace('lopsinhvien', 'lop-sinhvien');
            
            const folder = {
                name: baseRoute,
                item: []
            };
        
            const routeContent = fs.readFileSync(path.join(routesDir, file), 'utf-8');
            const controllerNameMatch = routeContent.match(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\(['"]\.\.\/controllers\/(.*?)['"]\)/);
            
            let controllerContent = '';
            if (controllerNameMatch) {
                const controllerFile = controllerNameMatch[2].endsWith('.js') ? controllerNameMatch[2] : controllerNameMatch[2] + '.js';
                try {
                    controllerContent = fs.readFileSync(path.join(controllersDir, controllerFile), 'utf-8');
                } catch (e) {}
            }
            
            const endpointRegex = /router\.(get|post|put|delete|patch)\(['"](.*?)['"]\s*,\s*(?:.*?,\s*)*?([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\)/g;
            let match;
            while ((match = endpointRegex.exec(routeContent)) !== null) {
                const method = match[1].toUpperCase();
                let routePath = match[2];
                if (routePath === '/') routePath = '';
                
                let pathParts = ('/' + baseRoute + routePath).split('/').filter(p => p);
                
                let reqData = { body: [], query: [], params: [] };
                if (controllerContent) {
                    reqData = extractFields(controllerContent, match[4]);
                }
                
                const isUpload = routeContent.includes('upload.') && match[0].includes('upload.');
        
                let postmanItem = {
                    name: `[${method}] /${baseRoute}${routePath}`,
                    request: {
                        method: method,
                        header: [
                            {
                                key: "Authorization",
                                value: "Bearer {{token}}",
                                type: "text"
                            }
                        ],
                        url: {
                            raw: `{{url}}/${pathParts.join('/')}` + (reqData.query.length ? '?' + reqData.query.map(q => `${q}=${getSampleValue(q)}`).join('&') : ''),
                            host: ["{{url}}"],
                            path: pathParts.map(p => p.startsWith(':') ? p : p),
                            variable: pathParts.filter(p => p.startsWith(':')).map(p => ({
                                key: p.substring(1),
                                value: getSampleValue(p.substring(1)).toString()
                            })),
                            query: reqData.query.map(q => ({
                                key: q,
                                value: getSampleValue(q).toString()
                            }))
                        }
                    },
                    response: []
                };
        
                if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                    if (isUpload) {
                        postmanItem.request.body = {
                            mode: "formdata",
                            formdata: reqData.body.map(b => ({
                                key: b,
                                value: getSampleValue(b).toString(),
                                type: "text"
                            })).concat([{ key: "file", type: "file", src: [] }])
                        };
                    } else {
                        let rawBodyObj = {};
                        reqData.body.forEach(b => rawBodyObj[b] = getSampleValue(b));
                        postmanItem.request.body = {
                            mode: "raw",
                            raw: JSON.stringify(rawBodyObj, null, 4),
                            options: { raw: { language: "json" } }
                        };
                    }
                }
        
                folder.item.push(postmanItem);
            }
            
            if (folder.item.length > 0) {
                collection.item.push(folder);
            }
        });

        fs.writeFileSync(path.join(__dirname, 'DATN_API_Collection.json'), JSON.stringify(collection, null, 4));
        console.log('Collection created at DATN_API_Collection.json with real database data!');
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();

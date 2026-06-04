const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const controllersDir = path.join(__dirname, 'controllers');

const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.routes.js'));

let result = '';

const extractFields = (content, methodPattern) => {
    // try to find the method in the controller file
    const methodRegex = new RegExp(`(?:exports\\.)?${methodPattern}\\s*=\\s*(?:async\\s*)?(?:function\\s*)?\\(.*?\\)\\s*(?:=>)?\\s*\\{([\\s\\S]*?)(?:^\\};|^exports\\.|^const\\s+|^let\\s+|^var\\s+)`, 'm');
    const match = content.match(methodRegex);
    if (!match) return 'No data fields explicitly extracted (could not find method body).';
    
    const bodyText = match[1];
    
    // find req.body.xxx
    const bodyFields = [...new Set([...bodyText.matchAll(/req\.body\.([a-zA-Z0-9_]+)/g)].map(m => m[1]))];
    const queryFields = [...new Set([...bodyText.matchAll(/req\.query\.([a-zA-Z0-9_]+)/g)].map(m => m[1]))];
    const paramsFields = [...new Set([...bodyText.matchAll(/req\.params\.([a-zA-Z0-9_]+)/g)].map(m => m[1]))];
    
    // find destructuring from req.body, e.g. const { name, age } = req.body;
    const destructureBodyRegex = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*req\.body/g;
    let dbMatch;
    while ((dbMatch = destructureBodyRegex.exec(bodyText)) !== null) {
        const fields = dbMatch[1].split(',').map(s => s.split(':')[0].trim()).filter(s => s);
        bodyFields.push(...fields);
    }
    
    const destructureQueryRegex = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*req\.query/g;
    while ((dbMatch = destructureQueryRegex.exec(bodyText)) !== null) {
        const fields = dbMatch[1].split(',').map(s => s.trim()).filter(s => s);
        queryFields.push(...fields);
    }

    const destructureParamsRegex = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*req\.params/g;
    while ((dbMatch = destructureParamsRegex.exec(bodyText)) !== null) {
        const fields = dbMatch[1].split(',').map(s => s.trim()).filter(s => s);
        paramsFields.push(...fields);
    }
    
    let res = [];
    if(bodyFields.length) res.push(`Body: ${[...new Set(bodyFields)].join(', ')}`);
    if(queryFields.length) res.push(`Query: ${[...new Set(queryFields)].join(', ')}`);
    if(paramsFields.length) res.push(`Params: ${[...new Set(paramsFields)].join(', ')}`);
    
    return res.length ? res.join(' | ') : 'Không yêu cầu field cụ thể (hoặc upload file/FormData)';
};

routeFiles.forEach(file => {
    let moduleName = file.replace('.routes.js', '');
    let baseRoute = '/' + moduleName.replace('user', 'users').replace('thongbaodatrienkhai', 'thong-bao-da-trien-khai').replace('trienkhaithongbao', 'trien-khai-thong-bao').replace('thongke', 'thong-ke').replace('chitietrenluyen', 'chi-tiet-ren-luyen').replace('diemrenluyen', 'diem-ren-luyen').replace('diemdanh', 'diem-danh').replace('ketquahoctap', 'ket-qua-hoc-tap').replace('monhoc', 'mon-hoc').replace('lopsinhvien', 'lop-sinhvien');
    
    const routeContent = fs.readFileSync(path.join(routesDir, file), 'utf-8');
    const controllerNameMatch = routeContent.match(/const\s+([a-zA-Z0-9_]+)\s*=\s*require\(['"]\.\.\/controllers\/(.*?)['"]\)/);
    
    let controllerContent = '';
    if (controllerNameMatch) {
        const controllerFile = controllerNameMatch[2].endsWith('.js') ? controllerNameMatch[2] : controllerNameMatch[2] + '.js';
        try {
            controllerContent = fs.readFileSync(path.join(controllersDir, controllerFile), 'utf-8');
        } catch (e) {}
    }
    
    result += `\n### Module \`${baseRoute}\`\n`;
    
    const endpointRegex = /router\.(get|post|put|delete|patch)\(['"](.*?)['"]\s*,\s*(?:.*?,\s*)*?([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\)/g;
    let match;
    while ((match = endpointRegex.exec(routeContent)) !== null) {
        const method = match[1].toUpperCase();
        let routePath = match[2];
        if (routePath === '/') routePath = '';
        const ctrlFunc = match[4];
        
        let fields = 'Không tìm thấy data yêu cầu.';
        if (controllerContent) {
            fields = extractFields(controllerContent, ctrlFunc);
        }
        
        result += `- **[${method}]** \`${baseRoute}${routePath}\`\n`;
        result += `  - **Dữ liệu yêu cầu**: ${fields}\n`;
    }
});

fs.writeFileSync(path.join(__dirname, 'api_endpoints.md'), result);
console.log('Done.');

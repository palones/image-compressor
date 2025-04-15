// 更新当前时间
function updateCurrentTime() {
    const currentTime = new Date();
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    document.getElementById('currentTime').textContent = currentTime.toLocaleString('zh-CN', options);
}

// 每秒更新时间
setInterval(updateCurrentTime, 1000);
updateCurrentTime();

// 模拟数据（实际应该从服务器获取）
let mockData = {
    todayVisits: 0,
    totalVisits: 0,
    totalImages: 0,
    savedSpace: 0,
    records: []
};

// 更新统计数据
function updateStats() {
    document.getElementById('todayVisits').textContent = mockData.todayVisits;
    document.getElementById('totalVisits').textContent = mockData.totalVisits;
    document.getElementById('totalImages').textContent = mockData.totalImages;
    document.getElementById('savedSpace').textContent = formatSize(mockData.savedSpace);
}

// 更新使用记录表格
function updateRecordsTable() {
    const tbody = document.getElementById('recordsTable');
    tbody.innerHTML = '';
    
    mockData.records.forEach(record => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(record.time).toLocaleString('zh-CN')}</td>
            <td>${record.ip}</td>
            <td>${record.imageCount}</td>
            <td>${formatSize(record.originalSize)}</td>
            <td>${formatSize(record.compressedSize)}</td>
            <td>${Math.round((1 - record.compressedSize / record.originalSize) * 100)}%</td>
            <td>${formatSize(record.originalSize - record.compressedSize)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 格式化文件大小
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 模拟获取数据（实际应该从服务器API获取）
function fetchData() {
    // 模拟API调用
    setTimeout(() => {
        // 模拟今日数据
        mockData.todayVisits = Math.floor(Math.random() * 100);
        mockData.totalVisits = mockData.todayVisits + Math.floor(Math.random() * 1000);
        mockData.totalImages = Math.floor(Math.random() * 500);
        mockData.savedSpace = Math.floor(Math.random() * 1024 * 1024 * 1024); // 随机GB级别的节省空间
        
        // 模拟使用记录
        mockData.records = Array(10).fill(null).map((_, index) => ({
            time: new Date(Date.now() - index * 3600000).getTime(),
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
            imageCount: Math.floor(Math.random() * 5) + 1,
            originalSize: Math.floor(Math.random() * 1024 * 1024 * 50), // 随机50MB以内
            compressedSize: Math.floor(Math.random() * 1024 * 1024 * 20), // 随机20MB以内
        }));
        
        // 更新显示
        updateStats();
        updateRecordsTable();
    }, 1000);
}

// 初始化
fetchData();

// 每5分钟刷新一次数据
setInterval(fetchData, 5 * 60 * 1000);

// 添加简单的登录验证（实际应用中应该使用更安全的方式）
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) {
        const password = prompt('请输入管理员密码：');
        if (password === 'admin123') { // 实际应用中应该使用更安全的验证方式
            sessionStorage.setItem('adminAuthenticated', 'true');
        } else {
            alert('密码错误！');
            window.location.href = 'index.html';
        }
    }
}

// 页面加载时检查认证
checkAuth(); 
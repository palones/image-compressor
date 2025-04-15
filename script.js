// 获取DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const compressionRatio = document.getElementById('compressionRatio');
const ratioValue = document.getElementById('ratioValue');
const previewContainer = document.getElementById('previewContainer');
const downloadAllBtn = document.getElementById('downloadAllBtn');

// 存储所有图片信息
const images = new Map();
const MAX_IMAGES = 10;

// 更新压缩比例显示
compressionRatio.addEventListener('input', (e) => {
    ratioValue.textContent = `${e.target.value}%`;
    const quality = e.target.value / 100;
    images.forEach((imageData, file) => {
        compressImage(file, quality, imageData.previewId);
    });
});

// 处理文件上传
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-color)';
    uploadArea.style.backgroundColor = 'rgba(0, 113, 227, 0.05)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.backgroundColor = 'white';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.backgroundColor = 'white';
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    handleFiles(files);
    e.target.value = ''; // 清空input，允许重复选择相同文件
});

// 处理文件
function handleFiles(files) {
    if (files.length === 0) return;
    
    // 检查是否超过最大数量限制
    const remainingSlots = MAX_IMAGES - images.size;
    if (remainingSlots <= 0) {
        alert(`最多只能上传${MAX_IMAGES}张图片`);
        return;
    }
    
    const filesToProcess = files.slice(0, remainingSlots);
    filesToProcess.forEach(file => {
        const previewId = Date.now() + Math.random();
        images.set(file, { previewId, compressedBlob: null });
        createPreviewBox(file, previewId);
    });
    
    updateDownloadButton();
}

// 创建预览框
function createPreviewBox(file, previewId) {
    const previewBox = document.createElement('div');
    previewBox.className = 'preview-box';
    previewBox.id = `preview-${previewId}`;
    
    previewBox.innerHTML = `
        <h3>
            ${file.name}
            <button class="delete-btn" onclick="deleteImage('${previewId}')">×</button>
        </h3>
        <div class="image-container">
            <img id="original-${previewId}" src="" alt="原始图片预览">
            <div class="image-info">
                <span class="file-size" id="original-size-${previewId}">-</span>
            </div>
        </div>
        <div class="image-container">
            <img id="compressed-${previewId}" src="" alt="压缩后图片预览">
            <div class="image-info">
                <span class="file-size" id="compressed-size-${previewId}">-</span>
            </div>
        </div>
    `;
    
    previewContainer.appendChild(previewBox);
    
    // 显示原始图片预览
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById(`original-${previewId}`).src = e.target.result;
        document.getElementById(`original-size-${previewId}`).textContent = formatFileSize(file.size);
        compressImage(file, compressionRatio.value / 100, previewId);
    };
    reader.readAsDataURL(file);
}

// 删除图片
function deleteImage(previewId) {
    const previewBox = document.getElementById(`preview-${previewId}`);
    previewBox.remove();
    
    // 从images中删除对应的文件
    for (const [file, data] of images.entries()) {
        if (data.previewId === previewId) {
            images.delete(file);
            break;
        }
    }
    
    updateDownloadButton();
}

// 记录使用统计
function recordUsage(originalSize, compressedSize) {
    // 在实际应用中，这里应该发送数据到服务器
    const usageData = {
        time: new Date().getTime(),
        imageCount: 1,
        originalSize: originalSize,
        compressedSize: compressedSize
    };
    
    // 这里模拟发送数据，实际应用中应该使用fetch或axios发送到服务器
    console.log('记录使用数据:', usageData);
}

// 压缩图片
function compressImage(file, quality, previewId) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            ctx.drawImage(img, 0, 0);
            
            // 如果是100%质量，直接使用原始文件
            if (quality >= 1) {
                const imageData = images.get(file);
                imageData.compressedBlob = file;
                images.set(file, imageData);
                
                document.getElementById(`compressed-${previewId}`).src = URL.createObjectURL(file);
                document.getElementById(`compressed-size-${previewId}`).textContent = formatFileSize(file.size);
                
                // 记录统计数据
                recordUsage(file.size, file.size);
                
                updateDownloadButton();
                return;
            }
            
            // 进行压缩
            canvas.toBlob((blob) => {
                // 如果压缩后大小大于原图，则使用原图
                if (blob.size > file.size) {
                    const imageData = images.get(file);
                    imageData.compressedBlob = file;
                    images.set(file, imageData);
                    
                    document.getElementById(`compressed-${previewId}`).src = URL.createObjectURL(file);
                    document.getElementById(`compressed-size-${previewId}`).textContent = formatFileSize(file.size);
                    
                    // 记录统计数据
                    recordUsage(file.size, file.size);
                } else {
                    const imageData = images.get(file);
                    imageData.compressedBlob = blob;
                    images.set(file, imageData);
                    
                    document.getElementById(`compressed-${previewId}`).src = URL.createObjectURL(blob);
                    document.getElementById(`compressed-size-${previewId}`).textContent = formatFileSize(blob.size);
                    
                    // 记录统计数据
                    recordUsage(file.size, blob.size);
                }
                
                updateDownloadButton();
            }, file.type, quality);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 更新下载按钮状态
function updateDownloadButton() {
    downloadAllBtn.disabled = images.size === 0 || Array.from(images.values()).some(data => !data.compressedBlob);
}

// 下载所有压缩后的图片
downloadAllBtn.addEventListener('click', () => {
    images.forEach((imageData, file) => {
        if (imageData.compressedBlob) {
            // 创建一个新的 Blob，确保数据完整性
            const blob = new Blob([imageData.compressedBlob], { type: imageData.compressedBlob.type });
            
            // 创建下载链接
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = `compressed_${file.name}`;
            
            // 触发下载
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    });
});

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 
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

// 压缩图片
function compressImage(file, quality, previewId) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置canvas尺寸为图片原始尺寸
            canvas.width = img.width;
            canvas.height = img.height;
            
            // 在canvas上绘制图片
            ctx.drawImage(img, 0, 0);

            // 创建Blob并更新预览
            const processImage = (blob) => {
                const imageData = images.get(file);
                imageData.compressedBlob = blob;
                images.set(file, imageData);
                
                document.getElementById(`compressed-${previewId}`).src = URL.createObjectURL(blob);
                document.getElementById(`compressed-size-${previewId}`).textContent = formatFileSize(blob.size);
                updateDownloadButton();
            };

            // 如果是100%质量，尝试直接从canvas获取原始质量的blob
            if (quality >= 1) {
                canvas.toBlob((blob) => {
                    // 如果生成的blob大于原文件，则直接使用原文件
                    if (blob.size > file.size) {
                        processImage(file);
                    } else {
                        processImage(blob);
                    }
                }, file.type, 1.0);
                return;
            }
            
            // 其他质量值的处理
            canvas.toBlob((blob) => {
                // 如果压缩后反而变大，则使用原文件
                if (blob.size > file.size) {
                    processImage(file);
                } else {
                    processImage(blob);
                }
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
            const link = document.createElement('a');
            link.href = URL.createObjectURL(imageData.compressedBlob);
            link.download = `compressed_${file.name}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
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
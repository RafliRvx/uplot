// Drag and drop functionality
const dropArea = document.querySelector('.file-drop-area');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropArea.classList.add('dragover');
}

function unhighlight() {
    dropArea.classList.remove('dragover');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

fileInput.addEventListener('change', function() {
    handleFiles(this.files);
});

let selectedFiles = [];

function handleFiles(files) {
    selectedFiles = [...selectedFiles, ...files];
    updateFileList();
}

function updateFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const fileElement = document.createElement('div');
        fileElement.className = 'flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-3';
        fileElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas fa-file text-white text-xl"></i>
                <div>
                    <div class="text-white font-medium">${file.name}</div>
                    <div class="text-white text-opacity-70 text-sm">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button onclick="removeFile(${index})" class="text-white hover:text-red-300">
                <i class="fas fa-times"></i>
            </button>
        `;
        fileList.appendChild(fileElement);
    });
    
    uploadBtn.disabled = selectedFiles.length === 0;
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Upload functionality
uploadBtn.addEventListener('click', async function() {
    if (selectedFiles.length === 0) return;
    
    const expiry = document.querySelector('input[name="expiry"]:checked').value;
    
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';
    uploadBtn.disabled = true;
    
    try {
        for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('expiry', expiry);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showResult(result.url);
            } else {
                alert('Upload failed: ' + result.error);
            }
        }
    } catch (error) {
        alert('Upload error: ' + error.message);
    } finally {
        uploadBtn.innerHTML = '<i class="fas fa-rocket mr-2"></i>Launch Upload!';
        uploadBtn.disabled = false;
        selectedFiles = [];
        updateFileList();
    }
});

function showResult(url) {
    document.getElementById('fileUrl').textContent = url;
    document.getElementById('resultModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('resultModal').classList.add('hidden');
}

function copyUrl() {
    const url = document.getElementById('fileUrl').textContent;
    navigator.clipboard.writeText(url).then(() => {
        alert('URL copied to clipboard!');
    });
}

// Expiry option selection
document.querySelectorAll('.expiry-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.expiry-option').forEach(opt => {
            opt.querySelector('div').classList.remove('bg-opacity-40', 'ring-2', 'ring-white');
        });
        this.querySelector('div').classList.add('bg-opacity-40', 'ring-2', 'ring-white');
    });
});
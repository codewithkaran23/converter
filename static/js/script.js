document.addEventListener('DOMContentLoaded', () => {

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const mainSelectBtn = document.getElementById('main-select-btn');
    const addMoreBtn = document.getElementById('add-more-btn');
    const fileListContainer = document.getElementById('file-list-container');
    const fileList = document.getElementById('file-list');
    const readyCount = document.getElementById('ready-count');
    const convertAllBtn = document.getElementById('convert-all-btn');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const globalFormatSelect = document.getElementById('global-format-select');
    const downloadConfirmModal = document.getElementById('download-confirm-modal');
    const downloadConfirmCancel = document.getElementById('download-confirm-cancel');
    const downloadConfirmOkay = document.getElementById('download-confirm-okay');

    function confirmDownloadAgain() {
        return new Promise((resolve) => {
            if (!downloadConfirmModal || !downloadConfirmCancel || !downloadConfirmOkay) {
                resolve(window.confirm('You have already downloaded this file. Do you want to download it again?'));
                return;
            }

            const close = (answer) => {
                downloadConfirmModal.hidden = true;
                downloadConfirmCancel.onclick = null;
                downloadConfirmOkay.onclick = null;
                resolve(answer);
            };

            downloadConfirmModal.hidden = false;
            downloadConfirmCancel.onclick = () => close(false);
            downloadConfirmOkay.onclick = () => close(true);
            downloadConfirmOkay.focus();
        });
    }
    
    // Robot Mascot & Jokes (DO NOT TOUCH - USER LIKES THIS)
    const robotContainer = document.getElementById('robot-mascot');
    const jokeBubble = document.getElementById('joke-bubble');
    const robotMascot = robotContainer ? robotContainer.querySelector('.clock-body') : null;

    const DIALOGUE = {
        HOVER: [
            "Hey there! Ready to make some magic happen, sugar? ✨",
            "Tick-tock! Time is money, let's get to work! 💸",
            "Don't just stand there, those files won't convert themselves! 🕒",
            "I'm a clock... but I never take a 'second' off! 🕒😂",
            "You look like you've got some important work to do. 💼",
            "Precision is my middle name. Actually, it's Minutes! 🕒🔥",
            "I'm feeling wound up and ready to go! ⚙️🔋",
            "Everything's lookin' mighty fine in your timeline today. 🌤️",
            "Welcome to Fileonix! I'm here to save you some time. ⚡",
            "Need a hand? Well, I've got two, but they only move in circles! 🕒🤣"
        ],
        UPLOAD: [
            "Ooh, look at all those files! Let's get 'em sorted. 📂✨",
            "Solid choice, sugar. I'll take good care of these. 🤝",
            "Fresh data! My favorite snack. 🍪💻",
            "Human paperwork detected... don't worry, I've got this. 📄⚡",
            "Nice selection! Let's make 'em even better. 🎨",
            "Target acquired. Stand back, I'm workin'! 🎯⚡"
        ],
        CONVERTING: [
            "Crunchin' those bits... almost there! 🦷💻",
            "Bending reality slightly... stay still! 🌀✨",
            "Mixing the pixels with a dash of southern charm. 🍯🎨",
            "Crunching numbers... they taste like electricity! ⚡😋",
            "Just a second! The gears are turnin'! ⚙️💨",
            "Quantum bits are a bit tangled, let me just... there! 🧶✨"
        ],
        SUCCESS: [
            "Boom! Done and dusted, sugar. 💥✅",
            "I make this look easy, don't I? 😎✨",
            "Another masterpiece delivered. ✨🎨",
            "Perfectly converted! You're welcome. 😇",
            "Success! Your files are back in balance, honey. ⚖️🍯"
        ],
        ERROR: [
            "Well, sugar, that's a glitch in the timeline. 🌪️🛑",
            "Something went wrong. Let's try that again, honey. 🍯🩹",
            "Oh my! That wasn't supposed to happen at all. 🙊💥",
            "Error detected! Don't you worry, just try again. 🛠️✨",
            "The gears got a bit jammed. Let's give it another go! ⚙️⚠️"
        ],
        IDLE: [
            "File convert fast, but brain still loading 😴",
            "Net slow hai but hope fast hai 😂",
            "Converting files faster than you can say ‘where did I save it?’ 💾",
            "JPG and PNG had a fight… WEBP won. 🥊",
            "Uploading... my patience along with the file. ⏳",
            "I’m still here… just keepin' time, sugar. 🕒",
            "You can convert something whenever you're ready! ✨",
            "I wonder what pixels dream about... 🌈",
            "Thinking about the vastness of the digital void. 🌌",
            "Waiting for files... tick-tock, sugar! 🕒🍯",
            "I could be countin' atoms, but I’m here for you. ⚛️",
            "Time is relative, sugar. But these files aren't! ⏳✨"
        ]
    };

    let lastMessages = [];
    let isTyping = false;
    let idleTimer = null;

    function speak(category, customText = null) {
        if (isTyping || !jokeBubble) return;
        let pool = DIALOGUE[category] || DIALOGUE.HOVER;
        let line = customText || pool[Math.floor(Math.random() * pool.length)];
        while (lastMessages.includes(line) && pool.length > 5) {
            line = pool[Math.floor(Math.random() * pool.length)];
        }
        lastMessages.push(line);
        if (lastMessages.length > 5) lastMessages.shift();
        typeMessage(line);
        resetIdleTimer();
    }

    function typeMessage(text) {
        isTyping = true;
        jokeBubble.textContent = "";
        jokeBubble.classList.add('active');
        let i = 0;
        const speed = 40;
        function type() {
            if (i < text.length) {
                jokeBubble.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                isTyping = false;
                setTimeout(() => { if (!isTyping) jokeBubble.classList.remove('active'); }, 4000);
            }
        }
        type();
    }

    function resetIdleTimer() {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { speak('IDLE'); }, 20000);
    }

    if (robotContainer) {
        robotContainer.addEventListener('mouseenter', () => {
            if (!jokeBubble.classList.contains('active')) speak('HOVER');
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (!robotContainer || !robotMascot) return;
        const rect = robotContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const moveX = (e.clientX - centerX) / 40;
        const moveY = (e.clientY - centerY) / 40;
        robotMascot.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    // --- APP LOGIC ---
    let filesData = []; 
    let nextId = 0;
    let currentEditingId = null;

    if (mainSelectBtn) mainSelectBtn.addEventListener('click', () => fileInput.click());
    if (addMoreBtn) addMoreBtn.addEventListener('click', () => fileInput.click());
    if (dropzone) {
        dropzone.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'INPUT' && !e.target.closest('button') && !e.target.closest('a')) {
                fileInput.click();
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                addFiles(e.target.files);
                speak('UPLOAD');
            }
            fileInput.value = '';
        });
    }

    const prevents = (e) => { e.preventDefault(); e.stopPropagation(); };
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
        if (dropzone) dropzone.addEventListener(ev, prevents, false);
        document.body.addEventListener(ev, prevents, false);
    });

    if (dropzone) {
        dropzone.addEventListener('dragenter', () => dropzone.classList.add('dragover'));
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                addFiles(e.dataTransfer.files);
                speak('UPLOAD');
            }
        });
    }

    document.body.addEventListener('drop', (e) => {
        if (fileListContainer && (fileListContainer.style.display !== 'none' || !fileListContainer.hidden) && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
            speak('UPLOAD');
        }
    });

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function safeText(value) {
        const element = document.createElement('span');
        element.textContent = String(value);
        return element.innerHTML;
    }

    function getActiveTool() {
        const path = window.location.pathname.toLowerCase();
        const heroTitle = document.querySelector('.hero-section h1');
        const heroText = heroTitle ? heroTitle.textContent.toLowerCase() : '';
        
        if (path.includes('bg-remover') || heroText.includes('bg remover')) return 'bgrem';
        if (path.includes('watermark') || heroText.includes('watermark')) return 'watermark';
        if (path.includes('word-to-pdf') || heroText.includes('document') || heroText.includes('word')) return 'word';
        if (path.includes('pdf-to-image') || path.includes('pdf-to-img') || heroText.includes('pdf')) return 'pdf';
        return 'image';
    }

    function addFiles(newFiles) {
        const tool = getActiveTool();
        if (tool === 'bgrem') {
            const ext = newFiles[0] ? newFiles[0].name.toLowerCase().split('.').pop() : '';
            const isValidImg = newFiles[0] && (newFiles[0].type.startsWith('image/') || ['jpg','jpeg','png','webp','gif','bmp'].includes(ext));
            if (!isValidImg) {
                alert("Please select a valid image file (PNG, JPG, WEBP).");
                return;
            }
            
            // Clear previous preview URLs
            filesData.forEach(f => { if(f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
            filesData = [];
            
            const file = newFiles[0];
            const previewUrl = URL.createObjectURL(file);
            
            filesData.push({
                id: nextId++,
                file: file,
                previewUrl: previewUrl,
                targetFormat: 'PNG',
                quality: 80,
                targetSizeKb: null,
                status: 'uploading',
                url: null,
                newSize: null,
                downloaded: false
            });
            
            render();
            handleBgRemoveUpload(file);
            return;
        }

        let valid = Array.from(newFiles).filter(f => {
            const ext = f.name.toLowerCase().split('.').pop();
            if (tool === 'bgrem' || tool === 'watermark') {
                return f.type.startsWith('image/') || ['jpg','jpeg','png','webp','gif','bmp'].includes(ext);
            }
            if (tool === 'word') {
                return ext === 'docx' || ext === 'doc' || ext === 'pdf';
            }
            if (tool === 'pdf') {
                return ext === 'pdf' || f.type.startsWith('image/') || ['jpg','jpeg','png','webp','gif','bmp'].includes(ext);
            }
            return f.type.startsWith('image/') || ['jpg','jpeg','png','webp','gif','bmp', 'pdf', 'docx', 'doc'].includes(ext);
        });
        
        if (valid.length === 0) return;

        valid.forEach(file => {
            const ext = file.name.toLowerCase().split('.').pop();
            let targetFormat = 'WEBP';
            const gfs = document.getElementById('global-format-select');
            const ps = document.getElementById('pdf-format-select');
            const ds = document.getElementById('doc-direction-select');

            if (tool === 'bgrem') {
                targetFormat = 'PNG';
            } else if (tool === 'watermark') {
                targetFormat = 'PNG';
            } else if (tool === 'word') {
                targetFormat = (ext === 'pdf') ? 'DOCX' : 'PDF';
            } else if (tool === 'pdf') {
                targetFormat = (ext === 'pdf') ? (ps ? ps.value : 'PNG') : 'PDF';
                if (targetFormat === 'PDF' && ext === 'pdf') targetFormat = 'PNG';
            } else {
                if (ext === 'pdf') {
                    targetFormat = 'DOCX';
                } else if (ext === 'docx' || ext === 'doc') {
                    targetFormat = 'PDF';
                } else {
                    targetFormat = gfs ? gfs.value : (ps ? ps.value : 'WEBP');
                    if (ext === 'pdf' && targetFormat === 'PDF') targetFormat = 'PNG';
                }
            }

            const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

            filesData.push({
                id: nextId++,
                file: file,
                previewUrl: previewUrl,
                targetFormat: targetFormat,
                quality: 80,
                targetSizeKb: null,
                status: 'ready', 
                url: null,
                newSize: null,
                downloaded: false
            });
        });
        render();
    }

    function removeFile(id) {
        const file = filesData.find(f => f.id === id);
        if (file && file.previewUrl) URL.revokeObjectURL(file.previewUrl);
        filesData = filesData.filter(f => f.id !== id);
        render();
    }

    let bgRemProcessedBlob = null;
    let bgRemFilename = "";

    function renderBgRemDropzone() {
        if (filesData.length === 0) {
            dropzone.innerHTML = `
                <div class="flex flex-col items-center justify-center">
                    <div class="w-16 h-16 rounded-full bg-[#ffedd5] dark:bg-[#ffedd5]/10 flex items-center justify-center mb-6 text-[#f97316] text-3xl">
                        <i class="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <h3 class="text-2xl font-extrabold text-[#18181b] dark:text-white mb-2">Drag & drop image</h3>
                    <p class="text-sm text-[#71717a] dark:text-white/40 mb-8">Supports PNG, JPG, WEBP (Max 15MB)</p>
                    <button type="button" class="btn-orange text-base font-bold px-8 py-3.5" id="main-select-btn">Browse Files</button>
                </div>
            `;
            const mainBtn = document.getElementById('main-select-btn');
            if (mainBtn) mainBtn.onclick = () => fileInput.click();
        } else {
            const data = filesData[0];
            if (data.status === 'uploading') {
                dropzone.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-8">
                        <div class="w-12 h-12 rounded-full border-4 border-[#f97316]/20 border-t-[#f97316] animate-spin mb-4"></div>
                        <h3 class="text-lg font-bold text-[#18181b] dark:text-white">Removing background...</h3>
                        <p class="text-xs text-[#71717a] dark:text-white/40 mt-1">Our AI neural engine is processing your image</p>
                    </div>
                `;
            } else if (data.status === 'done') {
                dropzone.innerHTML = `
                    <div class="flex flex-col items-center justify-center">
                        <div class="bg-checkered p-1.5 rounded-2xl border border-[#e4e4e7] dark:border-white/5 shadow-sm bg-white dark:bg-white/5 w-20 h-20 overflow-hidden flex items-center justify-center mb-4">
                            <img src="${data.previewUrl}" class="w-full h-full object-cover rounded-xl select-none">
                        </div>
                        <h4 class="text-lg font-extrabold text-[#18181b] dark:text-white mb-1">${safeText(data.file.name)}</h4>
                        <p class="text-xs font-bold text-[#71717a] dark:text-white/40 mb-4 flex items-center gap-1.5 justify-center">
                            <span class="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> Uploaded successfully</span> 
                            <span>•</span> 
                            <span>${formatBytes(data.file.size)}</span>
                        </p>
                        <button type="button" class="btn-border text-xs px-5 py-2 font-bold" id="change-file-btn">Change File</button>
                    </div>
                `;
                const changeBtn = document.getElementById('change-file-btn');
                if (changeBtn) changeBtn.onclick = () => fileInput.click();
            }
        }
    }

    function handleBgRemoveUpload(file) {
        bgRemFilename = file.name.split('.').slice(0, -1).join('.') + "_nobg.png";
        
        // Update slider original image immediately
        const originalImg = document.querySelector('.comparison-original img');
        if (originalImg) {
            originalImg.src = URL.createObjectURL(file);
        }
        
        const successAlert = document.getElementById('bg-success-alert');
        if (successAlert) successAlert.style.display = 'none';
        
        const formData = new FormData();
        formData.append('files', file);
        formData.append('high_precision', document.getElementById('bg-refine-edges') ? document.getElementById('bg-refine-edges').checked.toString() : 'false');
        
        fetch('/remove-bg', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || 'Failed to process image'); });
            }
            return response.blob();
        })
        .then(blob => {
            bgRemProcessedBlob = blob;
            
            // Update slider processed image
            const processedImg = document.querySelector('.comparison-processed img');
            if (processedImg) {
                processedImg.src = URL.createObjectURL(blob);
            }
            
            if (filesData.length > 0) {
                filesData[0].status = 'done';
                filesData[0].newSize = blob.size;
            }
            
            if (successAlert) successAlert.style.display = 'flex';
            speak('SUCCESS');
            render();
        })
        .catch(err => {
            console.error(err);
            if (filesData.length > 0) {
                filesData[0].status = 'error';
            }
            speak('ERROR', err.message);
            alert("Error removing background: " + err.message);
            filesData = [];
            render();
        });
    }

    function render() {
        if (!fileList || !dropzone || !fileListContainer) return;

        const tool = getActiveTool();
        if (tool === 'bgrem') {
            dropzone.hidden = false;
            fileListContainer.hidden = true;
            renderBgRemDropzone();
            return;
        }
        const isToolPage = tool !== 'image';
        const heroTitle = document.querySelector('.hero-section h1');
        const heroDesc = document.querySelector('.hero-section p');
        const globalFormatDiv = document.querySelector('.global-format');

        if (globalFormatDiv) {
            if (tool === 'bgrem') {
                globalFormatDiv.innerHTML = `
                    <span style="font-size: 0.8rem; color: #10b981; font-weight: 700;"><i class="fa-solid fa-wand-magic-sparkles" style="margin-right: 4px;"></i> OUTPUT: PNG (Transparent)</span>
                `;
                globalFormatDiv.style.display = 'flex';
            } else if (tool === 'watermark') {
                globalFormatDiv.innerHTML = `
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">FORMAT</span>
                    <select id="wmark-format-select" style="background: transparent; border: none; color: white; font-weight: 800; cursor: pointer; outline: none; margin-left: 5px;">
                        <option value="PNG">PNG</option>
                        <option value="JPEG">JPG</option>
                        <option value="WEBP">WEBP</option>
                    </select>
                `;
                globalFormatDiv.style.display = 'flex';
                const wfs = document.getElementById('wmark-format-select');
                if (wfs) wfs.onchange = (e) => {
                    filesData.forEach(f => { if(f.status === 'ready') f.targetFormat = e.target.value; });
                    render();
                };
            } else if (tool === 'word') {
                const ds = document.getElementById('doc-direction-select');
                let currentFormat = filesData.length > 0 ? filesData[0].targetFormat : (ds ? ds.value : 'PDF');
                const isWordToPdf = (currentFormat === 'PDF');

                if (heroTitle) heroTitle.textContent = 'Document Converter';
                if (heroDesc) heroDesc.textContent = 'Convert between Word (DOCX) and PDF seamlessly while preserving formatting.';

                globalFormatDiv.innerHTML = `
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">CONVERT TO</span>
                    <select id="doc-direction-select" style="background: transparent; border: none; color: white; font-weight: 800; cursor: pointer; outline: none; margin-left: 5px;">
                        <option value="PDF" ${isWordToPdf?'selected':''}>PDF Document</option>
                        <option value="DOCX" ${!isWordToPdf?'selected':''}>Word File</option>
                    </select>
                `;
                globalFormatDiv.style.display = 'flex';
                const newDs = document.getElementById('doc-direction-select');
                if (newDs) newDs.onchange = function(e) {
                    filesData.forEach(f => { if(f.status === 'ready') f.targetFormat = e.target.value; });
                    render();
                    speak('UPLOAD', "Mode updated.");
                };
            } else if (tool === 'pdf') {
                const ps = document.getElementById('pdf-format-select');
                let currentFormat = filesData.length > 0 ? filesData[0].targetFormat : (ps ? ps.value : 'PNG');
                const isImgToPdf = (currentFormat === 'PDF');

                if (heroTitle) heroTitle.textContent = 'PDF Converter';
                if (heroDesc) heroDesc.textContent = 'Convert between PDF and Images instantly with high quality.';

                globalFormatDiv.innerHTML = `
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">CONVERT TO</span>
                    <select id="pdf-format-select" style="background: transparent; border: none; color: white; font-weight: 800; cursor: pointer; outline: none; margin-left: 5px;">
                        <option value="PNG" ${currentFormat==='PNG'?'selected':''}>PNG Image</option>
                        <option value="JPEG" ${currentFormat==='JPEG'?'selected':''}>JPG Image</option>
                        <option value="WEBP" ${currentFormat==='WEBP'?'selected':''}>WEBP Image</option>
                        <option value="PDF" ${isImgToPdf?'selected':''}>PDF Document</option>
                    </select>
                `;
                globalFormatDiv.style.display = 'flex';
                const newPs = document.getElementById('pdf-format-select');
                if (newPs) newPs.onchange = function(e) {
                    filesData.forEach(f => { if(f.status === 'ready') f.targetFormat = e.target.value; });
                    render();
                    speak('UPLOAD', "Mode updated.");
                };
            } else {
                const gfs = document.getElementById('global-format-select');
                let currentFormat = filesData.length > 0 ? filesData[0].targetFormat : (gfs ? gfs.value : 'WEBP');
                
                globalFormatDiv.innerHTML = `
                    <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">CONVERT ALL TO</span>
                    <select id="global-format-select" style="background: transparent; border: none; color: white; font-weight: 800; cursor: pointer; outline: none;">
                        <option value="WEBP" ${currentFormat==='WEBP'?'selected':''}>WEBP</option>
                        <option value="PNG" ${currentFormat==='PNG'?'selected':''}>PNG</option>
                        <option value="JPEG" ${currentFormat==='JPEG'?'selected':''}>JPG</option>
                        <option value="PDF" ${currentFormat==='PDF'?'selected':''}>PDF</option>
                    </select>
                `;
                globalFormatDiv.style.display = 'flex';
                const newGfs = document.getElementById('global-format-select');
                if (newGfs) newGfs.onchange = (e) => {
                    filesData.forEach(f => { if(f.status === 'ready') f.targetFormat = e.target.value; });
                    render();
                    speak('UPLOAD', "Format updated.");
                };
            }
        }

        if (filesData.length === 0) {
            dropzone.hidden = false;
            fileListContainer.hidden = !isToolPage;
            if (isToolPage) {
                fileList.innerHTML = '';
                if (convertAllBtn) convertAllBtn.hidden = true;
                if (downloadAllBtn) downloadAllBtn.style.display = 'none';
                if (readyCount) readyCount.textContent = 'No files selected';
            }
            return;
        }

        dropzone.hidden = true;
        fileListContainer.hidden = false;
        
        const doneFiles = filesData.filter(f => f.status === 'done');
        const pendingFiles = filesData.filter(f => f.status === 'ready' || f.status === 'converting');

        if (doneFiles.length > 0 && pendingFiles.length === 0) {
            if (convertAllBtn) convertAllBtn.style.display = 'none';
            if (downloadAllBtn) downloadAllBtn.style.display = 'flex';
        } else {
            if (convertAllBtn) {
                convertAllBtn.style.display = '';
                convertAllBtn.hidden = false;
            }
            if (downloadAllBtn) downloadAllBtn.style.display = 'none';
        }
        
        const count = pendingFiles.length;
        if (readyCount) readyCount.textContent = `${count} file${count !== 1 ? 's' : ''} ready`;

        fileList.innerHTML = '';
        filesData.forEach(data => {
            const row = document.createElement('div');
            row.className = 'file-row';
            const origExt = data.file.name.split('.').pop().toUpperCase();
            const sizeStr = formatBytes(data.newSize || data.file.size);

            let displayName = data.file.name;
            let displayExt = origExt;
            if (data.status === 'done') {
                const baseName = data.file.name.split('.').slice(0, -1).join('.');
                displayExt = data.targetFormat.toUpperCase();
                displayName = `${baseName}.${data.targetFormat.toLowerCase()}`;
            }

            let actionHtml = '';
            if (data.status === 'ready') {
                if (tool === 'bgrem') {
                    actionHtml = `<div class="format-container flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/10"><span class="text-[0.7rem] text-emerald-400 font-bold uppercase"><i class="fa-solid fa-wand-magic-sparkles" style="margin-right: 4px;"></i>REMOVE BG</span></div>`;
                } else if (tool === 'watermark') {
                    actionHtml = `<div class="format-container flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/10"><span class="text-[0.7rem] text-indigo-400 font-bold uppercase"><i class="fa-solid fa-stamp" style="margin-right: 4px;"></i>WATERMARK</span></div>`;
                } else if (tool === 'word') {
                    const isToPdf = (data.targetFormat === 'PDF');
                    actionHtml = `<div class="format-container flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/10"><span class="text-[0.7rem] text-zinc-500 font-bold uppercase">TO &rarr;</span><span class="text-white font-extrabold text-xs uppercase">${isToPdf ? 'PDF' : 'DOCX'}</span></div>`;
                } else if (tool === 'pdf' && data.targetFormat === 'PDF') {
                    actionHtml = `<div class="format-container flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/10"><span class="text-[0.7rem] text-zinc-500 font-bold uppercase">TO &rarr;</span><span class="text-white font-extrabold text-xs uppercase">PDF</span></div>`;
                } else {
                    const fileExt = origExt.toLowerCase();
                    let selectOptions = '';
                    if (fileExt === 'pdf') {
                        selectOptions = `
                            <option value="DOCX" ${data.targetFormat==='DOCX'?'selected':''}>Word File (DOCX)</option>
                            <option value="PNG" ${data.targetFormat==='PNG'?'selected':''}>PNG Image</option>
                            <option value="JPEG" ${data.targetFormat==='JPEG'?'selected':''}>JPG Image</option>
                            <option value="WEBP" ${data.targetFormat==='WEBP'?'selected':''}>WEBP Image</option>
                        `;
                    } else if (fileExt === 'docx' || fileExt === 'doc') {
                        selectOptions = `
                            <option value="PDF" ${data.targetFormat==='PDF'?'selected':''}>PDF Document</option>
                        `;
                    } else {
                        selectOptions = `
                            <option value="WEBP" ${data.targetFormat==='WEBP'?'selected':''}>WEBP</option>
                            <option value="PNG" ${data.targetFormat==='PNG'?'selected':''}>PNG</option>
                            <option value="JPEG" ${data.targetFormat==='JPEG'?'selected':''}>JPG</option>
                            <option value="PDF" ${data.targetFormat==='PDF'?'selected':''}>PDF</option>
                        `;
                    }
                    actionHtml = `
                        <div class="format-container flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/10">
                            <span class="text-[0.7rem] text-zinc-500 font-bold uppercase">TO &rarr;</span>
                            <select class="format-select bg-transparent border-none text-white font-bold cursor-pointer outline-none text-xs">
                                ${selectOptions}
                            </select>
                        </div>
                        ${['WEBP','PNG','JPEG','JPG'].includes(data.targetFormat) ? '<button class="btn-opt text-zinc-500 hover:text-white transition-colors" title="Adjust Quality"><i class="fa-solid fa-sliders"></i></button>' : ''}
                    `;
                }
                actionHtml += `<button class="btn-rm" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;margin-left:10px;">&times;</button>`;
            } else if (data.status === 'converting') {
                actionHtml = `<div style="font-size:0.8rem;font-weight:700;color:var(--primary);"><i class="fa-solid fa-spinner spin"></i> CONVERTING...</div>`;
            } else if (data.status === 'done') {
                const statusText = data.downloaded ? 'DOWNLOADED' : 'DONE';
                actionHtml = `
                    <div class="text-[0.7rem] font-extrabold text-emerald-500 flex items-center gap-1"><i class="fa-solid fa-check"></i> ${statusText}</div>
                    <a href="${data.url}" download="${safeText(displayName)}" class="btn-dl bg-emerald-500 hover:bg-emerald-600 text-white text-[0.7rem] font-bold py-1.5 px-3 rounded-md transition-all">DOWNLOAD</a>
                    <button class="btn-rm text-zinc-500 hover:text-white text-xl ml-2">&times;</button>
                `;
            } else if (data.status === 'error') {
                actionHtml = `
                    <div style="font-size:0.8rem;font-weight:700;color:var(--primary);"><i class="fa-solid fa-circle-exclamation"></i> ERROR</div>
                    <button class="btn-rm" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;margin-left:10px;">&times;</button>
                `;
            }

            let iconHtml = `<i class="fa-solid ${displayExt==='PDF'?'fa-file-pdf':(displayExt==='DOCX'||displayExt==='DOC')?'fa-file-word':['PNG','JPG','JPEG','WEBP','GIF','BMP'].includes(displayExt)?'fa-file-image':'fa-file-code'}"></i>`;
            if (data.previewUrl) {
                iconHtml = `<img src="${data.previewUrl}" class="w-full h-full object-cover rounded" style="width: 40px; height: 40px; min-width: 40px;">`;
            }

            row.className = 'file-row flex flex-col sm:flex-row items-center p-5 border-b border-white/5 bg-white/5 gap-4';
            row.innerHTML = `
                <div class="file-icon text-zinc-500 text-xl w-10 h-10 flex items-center justify-center bg-white/5 rounded overflow-hidden">${iconHtml}</div>
                <div class="file-info flex-1 w-full text-center sm:text-left">
                    <div class="file-name font-bold text-sm truncate max-w-[200px] mx-auto sm:mx-0">${safeText(displayName)}</div>
                    <div class="file-meta text-xs text-zinc-500">${sizeStr}</div>
                </div>
                <div class="file-actions flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">${actionHtml}</div>
            `;
            
            const fs = row.querySelector('.format-select');
            if (fs) fs.onchange = (e) => data.targetFormat = e.target.value;
            const db = row.querySelector('.btn-dl');
            if (db) {
                db.onclick = (e) => {
                    if (data.downloaded) {
                        e.preventDefault();
                        confirmDownloadAgain().then((downloadAgain) => {
                            if (!downloadAgain) return;
                            const tempLink = document.createElement('a');
                            tempLink.href = data.url;
                            tempLink.download = displayName;
                            document.body.appendChild(tempLink);
                            tempLink.click();
                            setTimeout(() => document.body.removeChild(tempLink), 1000);
                        });
                    } else {
                        data.downloaded = true;
                        setTimeout(() => render(), 1000);
                    }
                };
            }
            const ob = row.querySelector('.btn-opt');
            if (ob) ob.onclick = () => openOptions(data.id);
            const rb = row.querySelector('.btn-rm');
            if (rb) rb.onclick = () => removeFile(data.id);
            fileList.appendChild(row);
        });
    }

    if (convertAllBtn) {
        convertAllBtn.onclick = async function() {
            const ready = filesData.filter(f => f.status === 'ready');
            if (ready.length === 0) return;

            const originalText = convertAllBtn.textContent;
            convertAllBtn.textContent = 'Converting...';
            convertAllBtn.disabled = true;
            convertAllBtn.style.opacity = '0.7';

            if (robotContainer) robotContainer.classList.add('thinking');
            speak('CONVERTING');

            for (let d of ready) {
                try {
                    d.status = 'converting'; render();
                    const fd = new FormData();
                    fd.append('files', d.file);
                    fd.append('format', d.targetFormat);
                    fd.append('quality', d.quality);
                    if (d.targetSizeKb) fd.append('target_size_kb', d.targetSizeKb);
                    
                    let ep = '/convert';
                    const tool = getActiveTool();
                    const ext = d.file.name.toLowerCase().split('.').pop();
                    
                    if (tool === 'bgrem') {
                        ep = '/remove-bg';
                        const hpToggle = document.getElementById('bg-high-precision');
                        if (hpToggle) fd.append('high_precision', hpToggle.checked);
                    } else if (tool === 'watermark') {
                        ep = '/add-watermark';
                        // Read watermark options from the panel
                        const wmPanel = document.getElementById('watermark-options-panel');
                        if (wmPanel) {
                            const wText = document.getElementById('wm-text');
                            const wOpacity = document.getElementById('wm-opacity');
                            const wFontSize = document.getElementById('wm-fontsize');
                            const wPosition = document.getElementById('wm-position');
                            const wColor = document.getElementById('wm-color');
                            if (wText) fd.append('watermark_text', wText.value || 'Fileonix');
                            if (wOpacity) fd.append('opacity', wOpacity.value);
                            if (wFontSize) fd.append('font_size', wFontSize.value);
                            if (wPosition) fd.append('position', wPosition.value);
                            if (wColor) fd.append('color', wColor.value);
                        }
                    } else if (tool === 'word' || (tool === 'image' && (ext === 'docx' || ext === 'doc' || (ext === 'pdf' && d.targetFormat === 'DOCX')))) {
                        ep = '/convert-docx';
                        fd.delete('format'); // Use target_ext instead
                        fd.append('target_ext', d.targetFormat.toLowerCase());
                    } else if (tool === 'pdf' || (tool === 'image' && ext === 'pdf' && d.targetFormat !== 'DOCX')) {
                        ep = '/convert-pdf';
                    }

                    const res = await fetch(ep, { method: 'POST', body: fd });
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.error || 'File convert nahi ho paayi. Dobara try karo.');
                    }
                    const blob = await res.blob();
                    d.url = window.URL.createObjectURL(blob);
                    d.newSize = blob.size;
                    d.status = 'done';
                } catch(e) {
                    d.status = 'error';
                    speak('ERROR');
                    alert(e.message);
                }
                render();
            }
            if (robotContainer) robotContainer.classList.remove('thinking');
            speak('SUCCESS');
            
            convertAllBtn.textContent = originalText;
            convertAllBtn.disabled = false;
            convertAllBtn.style.opacity = '1';
        };
    }

    if (downloadAllBtn) {
        downloadAllBtn.onclick = function() {
            const doneFiles = filesData.filter(f => f.status === 'done');
            doneFiles.forEach((data, index) => {
                setTimeout(() => {
                    const origExt = data.file.name.split('.').pop().toUpperCase();
                    const baseName = data.file.name.split('.').slice(0, -1).join('.');
                    const displayName = `${baseName}.${data.targetFormat.toLowerCase()}`;
                    
                    const tempLink = document.createElement('a');
                    tempLink.href = data.url;
                    tempLink.download = displayName;
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    setTimeout(() => {
                        document.body.removeChild(tempLink);
                    }, 1000);
                    
                    data.downloaded = true;
                }, index * 400);
            });
            
            setTimeout(() => {
                render();
            }, doneFiles.length * 400 + 100);
        };
    }

    render();
    resetIdleTimer();

    // --- MODAL LOGIC ---
    const modal = document.getElementById('options-modal');
    const targetSizeInput = document.getElementById('modal-target-size');
    const targetSizeVal = document.getElementById('modal-target-size-val');
    const targetSizeNote = document.getElementById('modal-target-size-note');
    const btnSave = document.getElementById('save-modal');
    const btnApplyAll = document.getElementById('apply-all-modal');
    const btnClose = document.getElementById('close-modal');

    function openOptions(id) {
        currentEditingId = id;
        const data = filesData.find(f => f.id === id);
        if (data && modal && targetSizeInput && targetSizeVal) {
            const supportsTargetSize = ['JPEG', 'JPG', 'WEBP'].includes(data.targetFormat);
            targetSizeInput.disabled = !supportsTargetSize;
            targetSizeInput.value = data.targetSizeKb || '';
            targetSizeVal.textContent = data.targetSizeKb ? `${data.targetSizeKb} KB` : 'Not set';
            if (targetSizeNote) targetSizeNote.textContent = supportsTargetSize
                ? 'JPG aur WEBP me output is size ke aas-paas rakha jayega.'
                : 'Target size JPG aur WEBP ke liye hi available hai.';
            modal.hidden = false;
        }
    }

    if (targetSizeInput) {
        targetSizeInput.oninput = (e) => {
            const size = parseInt(e.target.value);
            if (targetSizeVal) targetSizeVal.textContent = size ? `${size} KB` : 'Not set';
        };
    }

    if (btnSave) {
        btnSave.onclick = () => {
            const data = filesData.find(f => f.id === currentEditingId);
            if (data && targetSizeInput && !targetSizeInput.disabled) {
                data.targetSizeKb = targetSizeInput.value ? parseInt(targetSizeInput.value) : null;
            }
            if (modal) modal.hidden = true;
        };
    }

    if (btnApplyAll) {
        btnApplyAll.onclick = () => {
            if (targetSizeInput && !targetSizeInput.disabled) {
                const size = targetSizeInput.value ? parseInt(targetSizeInput.value) : null;
                filesData.forEach(f => {
                    if (f.status === 'ready' && ['JPEG', 'JPG', 'WEBP'].includes(f.targetFormat)) f.targetSizeKb = size;
                });
            }
            if (modal) modal.hidden = true;
            speak('UPLOAD', "Size applied to all.");
        };
    }

    if (btnClose) btnClose.onclick = () => { if (modal) modal.hidden = true; };
    window.onclick = (e) => { if (e.target === modal) modal.hidden = true; };

    // --- Watermark Panel Sliders ---
    const wmOpacity = document.getElementById('wm-opacity');
    const wmOpacityVal = document.getElementById('wm-opacity-val');
    const wmFontsize = document.getElementById('wm-fontsize');
    const wmFontsizeVal = document.getElementById('wm-fontsize-val');

    if (wmOpacity && wmOpacityVal) {
        wmOpacity.oninput = (e) => {
            const pct = Math.round((parseInt(e.target.value) / 255) * 100);
            wmOpacityVal.textContent = pct + '%';
        };
    }
    if (wmFontsize && wmFontsizeVal) {
        wmFontsize.oninput = (e) => {
            wmFontsizeVal.textContent = e.target.value + 'px';
        };
    }

    // --- AI BACKGROUND REMOVER INTERACTION LOGIC ---
    // Comparison Slider Dragging
    const sliderContainer = document.querySelector('.comparison-slider-container');
    const sliderBar = document.querySelector('.slider-bar');
    const processedImg = document.querySelector('.comparison-processed');
    
    if (sliderContainer && sliderBar && processedImg) {
        let isDragging = false;
        
        function updateSlider(clientX) {
            const rect = sliderContainer.getBoundingClientRect();
            const posX = clientX - rect.left;
            let pct = (posX / rect.width) * 100;
            if (pct < 0) pct = 0;
            if (pct > 100) pct = 100;
            
            sliderBar.style.left = `${pct}%`;
            processedImg.style.clipPath = `inset(0 0 0 ${pct}%)`;
        }
        
        sliderBar.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
        });
        window.addEventListener('mouseup', () => { isDragging = false; });
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            updateSlider(e.clientX);
        });
        
        // Touch support
        sliderBar.addEventListener('touchstart', (e) => {
            isDragging = true;
        });
        window.addEventListener('touchend', () => { isDragging = false; });
        window.addEventListener('touchmove', (e) => {
            if (!isDragging || e.touches.length === 0) return;
            updateSlider(e.touches[0].clientX);
        });
    }

    // Settings panel UI interactions
    const bgFeather = document.getElementById('bg-feather');
    const bgFeatherVal = document.getElementById('bg-feather-val');
    if (bgFeather && bgFeatherVal) {
        bgFeather.oninput = (e) => {
            bgFeatherVal.textContent = e.target.value + '%';
        };
    }

    const bgDenoise = document.getElementById('bg-denoise');
    const bgDenoiseVal = document.getElementById('bg-denoise-val');
    if (bgDenoise && bgDenoiseVal) {
        bgDenoise.oninput = (e) => {
            const val = (parseInt(e.target.value) / 100).toFixed(1);
            bgDenoiseVal.textContent = val;
        };
    }

    const formatButtons = document.querySelectorAll('.export-format-btn');
    formatButtons.forEach(btn => {
        btn.onclick = () => {
            formatButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    const bgDownloadBtn = document.getElementById('bg-download-btn');
    if (bgDownloadBtn) {
        bgDownloadBtn.onclick = () => {
            const activeFile = filesData[0];
            const activeFormatBtn = document.querySelector('.export-format-btn.active');
            const format = activeFormatBtn ? activeFormatBtn.textContent.trim().toUpperCase() : 'PNG';
            
            bgDownloadBtn.disabled = true;
            const originalText = bgDownloadBtn.innerHTML;
            bgDownloadBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-2"></i> Downloading...`;
            
            const triggerDownload = (fileDataBlob, originalName) => {
                const formData = new FormData();
                formData.append('files', fileDataBlob, originalName);
                formData.append('high_precision', document.getElementById('bg-refine-edges') ? document.getElementById('bg-refine-edges').checked.toString() : 'false');
                formData.append('format', format);
                
                fetch('/remove-bg', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to process image');
                    return response.blob();
                })
                .then(blob => {
                    const ext = format.toLowerCase() === 'jpeg' ? 'jpg' : format.toLowerCase();
                    const filename = originalName.split('.').slice(0, -1).join('.') + `_nobg.${ext}`;
                    
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                    }, 1000);
                })
                .catch(err => {
                    alert("Error downloading image: " + err.message);
                })
                .finally(() => {
                    bgDownloadBtn.disabled = false;
                    bgDownloadBtn.innerHTML = originalText;
                });
            };

            if (activeFile) {
                triggerDownload(activeFile.file, activeFile.file.name);
            } else {
                fetch('/static/img/vase_original.png')
                .then(r => r.blob())
                .then(blob => {
                    triggerDownload(blob, 'vase_original.png');
                })
                .catch(err => {
                    const a = document.createElement('a');
                    a.href = "/static/img/vase_processed.png";
                    a.download = "vase_processed.png";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    bgDownloadBtn.disabled = false;
                    bgDownloadBtn.innerHTML = originalText;
                });
            }
        };
    }
});

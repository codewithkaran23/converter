document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const mainSelectBtn = document.getElementById('main-select-btn');
    const addMoreBtn = document.getElementById('add-more-btn');
    const fileListContainer = document.getElementById('file-list-container');
    const fileList = document.getElementById('file-list');
    const readyCount = document.getElementById('ready-count');
    const convertAllBtn = document.getElementById('convert-all-btn');
    const globalFormatSelect = document.getElementById('global-format-select');
    
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

    function getActiveTool() {
        const path = window.location.pathname.toLowerCase();
        const heroTitle = document.querySelector('.hero-section h1');
        const heroText = heroTitle ? heroTitle.textContent.toLowerCase() : '';
        
        if (path.includes('word-to-pdf') || heroText.includes('document') || heroText.includes('word')) return 'word';
        if (path.includes('pdf-to-image') || path.includes('pdf-to-img') || heroText.includes('pdf')) return 'pdf';
        return 'image';
    }

    function addFiles(newFiles) {
        const tool = getActiveTool();
        let valid = Array.from(newFiles).filter(f => {
            const ext = f.name.toLowerCase().split('.').pop();
            if (tool === 'word') {
                const docSelect = document.getElementById('doc-direction-select');
                const mode = docSelect ? docSelect.value : 'PDF';
                if (mode === 'PDF') return ext === 'docx' || ext === 'doc';
                return ext === 'pdf';
            }
            if (tool === 'pdf') {
                const pdfSelect = document.getElementById('pdf-format-select');
                const mode = pdfSelect ? pdfSelect.value : 'PNG';
                if (mode === 'PDF') return f.type.startsWith('image/') || ['jpg','jpeg','png','webp','gif','bmp'].includes(ext);
                return ext === 'pdf';
            }
            return f.type.startsWith('image/') || ['jpg','jpeg','png','webp','gif','bmp'].includes(ext);
        });
        
        if (valid.length === 0) return;

        valid.forEach(file => {
            let targetFormat = 'WEBP';
            if (globalFormatSelect) targetFormat = globalFormatSelect.value;
            
            if (tool === 'word') {
                const ds = document.getElementById('doc-direction-select');
                targetFormat = ds ? ds.value : 'PDF';
            } else if (tool === 'pdf') {
                const ps = document.getElementById('pdf-format-select');
                targetFormat = ps ? ps.value : 'PNG';
            }

            filesData.push({
                id: nextId++,
                file: file,
                targetFormat: targetFormat,
                quality: 80,
                status: 'ready', 
                url: null,
                newSize: null,
                downloaded: false
            });
        });
        render();
    }

    function removeFile(id) {
        filesData = filesData.filter(f => f.id !== id);
        render();
    }

    function render() {
        if (!fileList || !dropzone || !fileListContainer) return;

        const tool = getActiveTool();
        const isToolPage = tool !== 'image';
        const heroTitle = document.querySelector('.hero-section h1');
        const heroDesc = document.querySelector('.hero-section p');
        const globalFormatDiv = document.querySelector('.global-format');

        if (globalFormatDiv) {
            if (tool === 'word') {
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
                if (readyCount) readyCount.textContent = 'No files selected';
            }
            return;
        }

        dropzone.hidden = true;
        fileListContainer.hidden = false;
        if (convertAllBtn) convertAllBtn.hidden = false;
        
        const count = filesData.filter(f => f.status === 'ready' || f.status === 'converting').length;
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
                if (tool === 'word') {
                    const isToPdf = (data.targetFormat === 'PDF');
                    actionHtml = `<div class="format-container flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/10"><span class="text-[0.7rem] text-zinc-500 font-bold uppercase">TO &rarr;</span><span class="text-white font-extrabold text-xs uppercase">${isToPdf ? 'PDF' : 'DOCX'}</span></div>`;
                } else if (tool === 'pdf' && data.targetFormat === 'PDF') {
                    actionHtml = `<div class="format-container flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/10"><span class="text-[0.7rem] text-zinc-500 font-bold uppercase">TO &rarr;</span><span class="text-white font-extrabold text-xs uppercase">PDF</span></div>`;
                } else {
                    actionHtml = `
                        <div class="format-container flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/10">
                            <span class="text-[0.7rem] text-zinc-500 font-bold uppercase">TO &rarr;</span>
                            <select class="format-select bg-transparent border-none text-white font-bold cursor-pointer outline-none text-xs">
                                <option value="WEBP" ${data.targetFormat==='WEBP'?'selected':''}>WEBP</option>
                                <option value="PNG" ${data.targetFormat==='PNG'?'selected':''}>PNG</option>
                                <option value="JPEG" ${data.targetFormat==='JPEG'?'selected':''}>JPG</option>
                            </select>
                        </div>
                        <button class="btn-opt text-zinc-500 hover:text-white transition-colors" title="Adjust Quality"><i class="fa-solid fa-sliders"></i></button>
                    `;
                }
                actionHtml += `<button class="btn-rm" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;margin-left:10px;">&times;</button>`;
            } else if (data.status === 'converting') {
                actionHtml = `<div style="font-size:0.8rem;font-weight:700;color:var(--primary);"><i class="fa-solid fa-spinner spin"></i> CONVERTING...</div>`;
            } else if (data.status === 'done') {
                const statusText = data.downloaded ? 'DOWNLOADED' : 'DONE';
                actionHtml = `
                    <div class="text-[0.7rem] font-extrabold text-emerald-500 flex items-center gap-1"><i class="fa-solid fa-check"></i> ${statusText}</div>
                    <a href="${data.url}" download="${displayName}" class="btn-dl bg-emerald-500 hover:bg-emerald-600 text-white text-[0.7rem] font-bold py-1.5 px-3 rounded-md transition-all">DOWNLOAD</a>
                    <button class="btn-rm text-zinc-500 hover:text-white text-xl ml-2">&times;</button>
                `;
            } else if (data.status === 'error') {
                actionHtml = `
                    <div style="font-size:0.8rem;font-weight:700;color:var(--primary);"><i class="fa-solid fa-circle-exclamation"></i> ERROR</div>
                    <button class="btn-rm" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;margin-left:10px;">&times;</button>
                `;
            }

            row.className = 'file-row flex flex-col sm:flex-row items-center p-5 border-b border-white/5 bg-white/5 gap-4';
            row.innerHTML = `
                <div class="file-icon text-zinc-500 text-xl"><i class="fa-solid ${displayExt==='PDF'?'fa-file-pdf':(displayExt==='DOCX'||displayExt==='DOC')?'fa-file-word':['PNG','JPG','JPEG','WEBP','GIF','BMP'].includes(displayExt)?'fa-file-image':'fa-file-code'}"></i></div>
                <div class="file-info flex-1 w-full text-center sm:text-left">
                    <div class="file-name font-bold text-sm truncate max-w-[200px] mx-auto sm:mx-0">${displayName}</div>
                    <div class="file-meta text-xs text-zinc-500">${sizeStr}</div>
                </div>
                <div class="file-actions flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">${actionHtml}</div>
            `;
            
            const fs = row.querySelector('.format-select');
            if (fs) fs.onchange = (e) => data.targetFormat = e.target.value;
            const db = row.querySelector('.btn-dl');
            if (db) db.onclick = () => { data.downloaded = true; render(); };
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
                    
                    let ep = '/convert';
                    const tool = getActiveTool();
                    if (tool === 'word') {
                        ep = '/convert-docx';
                        fd.delete('format'); // Use target_ext instead
                        fd.append('target_ext', d.targetFormat.toLowerCase());
                    }
                    if (tool === 'pdf') ep = '/convert-pdf';

                    const res = await fetch(ep, { method: 'POST', body: fd });
                    if (!res.ok) throw new Error();
                    const blob = await res.blob();
                    d.url = window.URL.createObjectURL(blob);
                    d.newSize = blob.size;
                    d.status = 'done';
                } catch(e) { d.status = 'error'; speak('ERROR'); }
                render();
            }
            if (robotContainer) robotContainer.classList.remove('thinking');
            speak('SUCCESS');
            
            convertAllBtn.textContent = originalText;
            convertAllBtn.disabled = false;
            convertAllBtn.style.opacity = '1';
        };
    }

    render();
    resetIdleTimer();

    // --- MODAL LOGIC ---
    const modal = document.getElementById('options-modal');
    const qualitySlider = document.getElementById('modal-quality-slider');
    const qualityVal = document.getElementById('modal-quality-val');
    const btnSave = document.getElementById('save-modal');
    const btnApplyAll = document.getElementById('apply-all-modal');
    const btnClose = document.getElementById('close-modal');

    function openOptions(id) {
        currentEditingId = id;
        const data = filesData.find(f => f.id === id);
        if (data && modal && qualitySlider && qualityVal) {
            qualitySlider.value = data.quality;
            qualityVal.textContent = data.quality + '%';
            modal.hidden = false;
        }
    }

    if (qualitySlider) {
        qualitySlider.oninput = (e) => {
            if (qualityVal) qualityVal.textContent = e.target.value + '%';
        };
    }

    if (btnSave) {
        btnSave.onclick = () => {
            const data = filesData.find(f => f.id === currentEditingId);
            if (data && qualitySlider) {
                data.quality = parseInt(qualitySlider.value);
            }
            if (modal) modal.hidden = true;
        };
    }

    if (btnApplyAll) {
        btnApplyAll.onclick = () => {
            if (qualitySlider) {
                const q = parseInt(qualitySlider.value);
                filesData.forEach(f => { if(f.status === 'ready') f.quality = q; });
            }
            if (modal) modal.hidden = true;
            speak('UPLOAD', "Quality applied to all.");
        };
    }

    if (btnClose) btnClose.onclick = () => { if (modal) modal.hidden = true; };
    window.onclick = (e) => { if (e.target === modal) modal.hidden = true; };
});

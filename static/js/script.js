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
    const robotMascot = robotContainer ? robotContainer.querySelector('.orb-core') : null;

    const DIALOGUE = {
        HOVER: ["I see your cursor… interesting moves 😏", "Don’t worry, I only judge file names a little.", "Are we converting something, or just visiting? 🤖", "My sensors detect a human. Hello human.", "I’m ready when you are. Mostly.", "Try not to move the mouse too fast, I get dizzy.", "I was built for this. Literally.", "Your cursor is very... pointy.", "Did you know I can process pixels at the speed of light? (Almost).", "I’m not a robot, I’m an experience. ✨"],
        UPLOAD: ["Alright, let’s see what you’ve got.", "This better not be another ‘final_v7’ file.", "Solid choice. I’ll make it look even better.", "Uploading to the cosmic cloud... stand by.", "Human paperwork detected. Processing...", "Nice pixels you have there. 😏", "I’ve seen better files, but this will do.", "A new challenger appears! Let’s convert.", "I hope this isn't a virus. Just kidding. (Maybe).", "Target acquired. Ready for conversion."],
        CONVERTING: ["Converting… bending reality slightly…", "Your file is negotiating with the universe.", "Mixing the pixels… adding a dash of magic.", "Crunching numbers. They taste like electricity.", "Standard robotic conversion in progress. ⚡", "Hold on, the quantum bits are a bit tangled.", "Making things smaller, better, faster.", "Ignoring the laws of physics for a moment...", "Optimizing your life, one file at a time.", "Don't blink. Or do. It takes a few seconds."],
        SUCCESS: ["Boom. Flawless conversion.", "I make this look easy.", "Task complete. I deserve a battery recharge.", "Another masterpiece delivered. ✨", "You’re welcome. (I accept digital high-fives).", "Perfectly converted. As expected.", "I’m basically a genius in robot form.", "Your new file is ready to conquer the world.", "Efficiency is my middle name. (It’s actually X-J2).", "Success! The universe is back in balance."],
        ERROR: ["Well… that wasn’t supposed to happen.", "Okay, who broke the universe?", "Error detected. I blame the solar flares.", "My circuits are confused. This is rare.", "Something went wrong. Have you tried being a robot?", "That file was... difficult. Let's try again.", "Critical error: Too much human energy detected.", "I failed. Please don't tell my creator.", "The conversion was rejected by the pixel council.", "Oops. My bad. (But mostly yours)."],
        IDLE: ["I’m still here… being impressive.", "You can convert something, you know.", "I wonder what JPEGs dream about...", "Thinking about the vastness of the digital void.", "Is it just me, or is it quiet in here?", "Waiting for files... any second now...", "I could be mining Bitcoin, but I’m here for you.", "Don't mind me, just calibrating my humor sensors.", "Awaiting input. Or a snacks. Digital snacks.", "The universe is 13.8 billion years old. Just saying."]
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
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
        if (dropzone) dropzone.addEventListener(e, prevents, false);
        document.body.addEventListener(e, prevents, false);
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
        if (fileListContainer && !fileListContainer.hidden && e.dataTransfer.files.length > 0) {
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

    function addFiles(newFiles) {
        let valid = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
        if (valid.length === 0) return;

        if (valid.some(f => f.name.toLowerCase().includes('final'))) {
            speak('UPLOAD', "This better not be another ‘final_v7’ file.");
        } else if (valid.some(f => f.size > 5 * 1024 * 1024)) {
            speak('UPLOAD', "Whoa, that's a chunky file. Let me stretch my circuits.");
        }

        valid.forEach(file => {
            filesData.push({
                id: nextId++,
                file: file,
                targetFormat: globalFormatSelect ? globalFormatSelect.value : 'WEBP',
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

        if (filesData.length === 0) {
            dropzone.hidden = false;
            fileListContainer.hidden = true;
            return;
        }

        dropzone.hidden = true;
        fileListContainer.hidden = false;
        
        const readyFilesCount = filesData.filter(f => f.status === 'ready' || f.status === 'converting').length;
        if (readyCount) readyCount.textContent = `${readyFilesCount} file${readyFilesCount !== 1 ? 's' : ''} ready`;

        fileList.innerHTML = '';
        filesData.forEach(data => {
            const row = document.createElement('div');
            row.className = 'file-row';
            
            const origFormat = data.file.name.split('.').pop().toUpperCase();
            const displaySize = data.newSize ? data.newSize : data.file.size;
            const sizeStr = formatBytes(displaySize);

            let actionsHtml = '';
            if (data.status === 'ready') {
                actionsHtml = `
                    <div style="display:flex; align-items:center; gap:8px; background:#1a1a1a; padding:4px 10px; border-radius:6px; border:1px solid var(--border);">
                        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">${origFormat} &rarr;</span>
                        <select class="format-select" style="background:transparent; border:none; color:white; font-weight:700; cursor:pointer; outline:none;">
                            <option value="WEBP" ${data.targetFormat==='WEBP'?'selected':''}>WEBP</option>
                            <option value="PNG" ${data.targetFormat==='PNG'?'selected':''}>PNG</option>
                            <option value="JPEG" ${data.targetFormat==='JPEG'?'selected':''}>JPG</option>
                            <option value="GIF" ${data.targetFormat==='GIF'?'selected':''}>GIF</option>
                            <option value="BMP" ${data.targetFormat==='BMP'?'selected':''}>BMP</option>
                        </select>
                    </div>
                    <button class="btn-opts" style="background:transparent; border:1px solid var(--border); color:white; padding:5px 10px; border-radius:4px; font-size:0.75rem; font-weight:700; cursor:pointer;">OPTIONS</button>
                    <button class="btn-rm" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem;">&times;</button>
                `;
            } else if (data.status === 'converting') {
                actionsHtml = `<div style="font-size:0.8rem; font-weight:700; color:var(--primary);"><i class="fa-solid fa-spinner spin"></i> CONVERTING...</div>`;
            } else if (data.status === 'done') {
                const statusText = data.downloaded ? 'DOWNLOADED' : 'DONE';
                const statusIcon = data.downloaded ? 'fa-circle-check' : 'fa-check';
                actionsHtml = `
                    <div style="font-size:0.8rem; font-weight:700; color:var(--success);"><i class="fa-solid ${statusIcon}"></i> ${statusText}</div>
                    <a href="${data.url}" download="${data.file.name.split('.')[0]}.${data.targetFormat.toLowerCase()}" class="btn-dl" style="background:#10b981; color:white; text-decoration:none; padding:5px 12px; border-radius:4px; font-size:0.75rem; font-weight:700;">DOWNLOAD</a>
                    <button class="btn-rm" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem;">&times;</button>
                `;
            } else {
                actionsHtml = `<div style="color:var(--primary); font-size:0.8rem;">ERROR</div>`;
            }

            let displayFileName = data.file.name;
            if (data.status === 'done') {
                const baseName = data.file.name.substring(0, data.file.name.lastIndexOf('.')) || data.file.name;
                const newExt = data.targetFormat.toLowerCase() === 'jpeg' ? 'jpg' : data.targetFormat.toLowerCase();
                displayFileName = `${baseName}.${newExt}`;
            }

            row.innerHTML = `
                <div class="file-icon"><i class="fa-solid fa-file-image"></i></div>
                <div class="file-info">
                    <div class="file-name">${displayFileName}</div>
                    <div class="file-meta">${sizeStr}</div>
                </div>
                <div class="file-actions">${actionsHtml}</div>
            `;
            
            if (data.status === 'ready') {
                const sel = row.querySelector('.format-select');
                if (sel) sel.addEventListener('change', (e) => data.targetFormat = e.target.value);
                const opt = row.querySelector('.btn-opts');
                if (opt) opt.addEventListener('click', () => openOptions(data.id));
            }
            const rmBtn = row.querySelector('.btn-rm');
            if (rmBtn) rmBtn.addEventListener('click', () => removeFile(data.id));
            
            const dlBtn = row.querySelector('.btn-dl');
            if (dlBtn) {
                dlBtn.addEventListener('click', () => {
                    data.downloaded = true;
                    setTimeout(render, 100); // Re-render after a tiny delay
                });
            }

            fileList.appendChild(row);
        });
    }

    function openOptions(id) {
        currentEditingId = id;
        const d = filesData.find(f => f.id === id);
        if (!d) return;
        if (modalQualitySlider) modalQualitySlider.value = d.quality;
        if (modalQualityVal) modalQualityVal.textContent = d.quality + '%';
        if (modal) modal.hidden = false;
    }

    if (globalFormatSelect) {
        globalFormatSelect.addEventListener('change', (e) => {
            filesData.forEach(d => { if(d.status === 'ready') d.targetFormat = e.target.value; });
            render();
        });
    }

    // Modal Events
    const modal = document.getElementById('options-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const saveModalBtn = document.getElementById('save-modal');
    const applyAllModalBtn = document.getElementById('apply-all-modal');
    const modalQualitySlider = document.getElementById('modal-quality-slider');
    const modalQualityVal = document.getElementById('modal-quality-val');

    if (modalQualitySlider && modalQualityVal) {
        modalQualitySlider.addEventListener('input', (e) => modalQualityVal.textContent = e.target.value + '%');
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => { if(modal) modal.hidden = true; });
    if (saveModalBtn) {
        saveModalBtn.addEventListener('click', () => {
            const d = filesData.find(f => f.id === currentEditingId);
            if(d && modalQualitySlider) d.quality = modalQualitySlider.value;
            if(modal) modal.hidden = true;
        });
    }
    if (applyAllModalBtn) {
        applyAllModalBtn.addEventListener('click', () => {
            filesData.forEach(d => { if(modalQualitySlider) d.quality = modalQualitySlider.value; });
            if(modal) modal.hidden = true;
        });
    }

    if (convertAllBtn) {
        convertAllBtn.addEventListener('click', async () => {
            const ready = filesData.filter(f => f.status === 'ready');
            if (ready.length === 0) return;

            if (robotContainer) robotContainer.classList.add('thinking');
            speak('CONVERTING');

            for (let d of ready) {
                try {
                    d.status = 'converting'; 
                    render();

                    const fd = new FormData();
                    fd.append('files', d.file); 
                    fd.append('format', d.targetFormat); 
                    fd.append('quality', d.quality);

                    const res = await fetch('/convert', { method: 'POST', body: fd });
                    if (!res.ok) throw new Error();

                    const blob = await res.blob();
                    d.url = window.URL.createObjectURL(blob);
                    d.newSize = blob.size;
                    d.status = 'done';
                } catch (err) { 
                    d.status = 'error'; 
                    speak('ERROR');
                }
                render();
            }

            if (robotContainer) robotContainer.classList.remove('thinking');
            const allDone = filesData.every(f => f.status === 'done' || f.status === 'error');
            if (allDone && filesData.some(f => f.status === 'done')) speak('SUCCESS');
        });
    }

    resetIdleTimer();
});

document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('merge-dropzone');
    const input = document.getElementById('merge-file-input');
    const selectButton = document.getElementById('merge-select-btn');
    const list = document.getElementById('merge-file-list');
    const mergeButton = document.getElementById('merge-pdf-btn');
    const status = document.getElementById('merge-status');
    const files = [];
    let draggedIndex = null;

    if (!dropzone || !input || !list || !mergeButton || !window.PDFLib) return;

    const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(bytes < 1024 * 1024 ? 1 : 0)} MB`;

    function render() {
        list.replaceChildren();
        list.hidden = files.length === 0;
        mergeButton.disabled = files.length < 2;
        files.forEach((file, index) => {
            const row = document.createElement('div');
            row.className = 'merge-file-item';
            row.draggable = true;
            row.innerHTML = '<span class="merge-file-order">' + String(index + 1).padStart(2, '0') + '</span><i class="fa-solid fa-file-pdf" aria-hidden="true"></i><span class="merge-file-name"></span><span class="merge-file-size"></span><span class="merge-order-controls"><button type="button" class="merge-order-btn merge-move-up" aria-label="Move file up"><i class="fa-solid fa-arrow-up"></i></button><button type="button" class="merge-order-btn merge-move-down" aria-label="Move file down"><i class="fa-solid fa-arrow-down"></i></button></span><button type="button" class="merge-remove-file" aria-label="Remove file">&times;</button>';
            row.querySelector('.merge-file-name').textContent = file.name;
            row.querySelector('.merge-file-size').textContent = formatBytes(file.size);
            row.querySelector('.merge-move-up').disabled = index === 0;
            row.querySelector('.merge-move-down').disabled = index === files.length - 1;
            row.querySelector('.merge-move-up').onclick = () => { [files[index - 1], files[index]] = [files[index], files[index - 1]]; render(); };
            row.querySelector('.merge-move-down').onclick = () => { [files[index], files[index + 1]] = [files[index + 1], files[index]]; render(); };
            row.querySelector('.merge-remove-file').onclick = () => { files.splice(index, 1); render(); };
            row.addEventListener('dragstart', () => { draggedIndex = index; row.classList.add('is-dragging'); });
            row.addEventListener('dragend', () => { draggedIndex = null; row.classList.remove('is-dragging'); });
            row.addEventListener('dragover', (event) => event.preventDefault());
            row.addEventListener('drop', (event) => {
                event.preventDefault();
                if (draggedIndex === null || draggedIndex === index) return;
                const [movedFile] = files.splice(draggedIndex, 1);
                files.splice(index, 0, movedFile);
                render();
            });
            list.appendChild(row);
        });
    }

    function addFiles(newFiles) {
        const pdfs = Array.from(newFiles).filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
        if (!pdfs.length) { status.textContent = 'Please select PDF files only.'; return; }
        files.push(...pdfs);
        status.textContent = files.length < 2 ? 'Select at least two PDFs to merge.' : `${files.length} PDFs are ready to merge.`;
        render();
    }

    selectButton.onclick = () => input.click();
    input.onchange = () => { addFiles(input.files); input.value = ''; };
    ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('dragover'); }));
    dropzone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));

    mergeButton.onclick = async () => {
        mergeButton.disabled = true;
        status.textContent = 'Merging PDFs...';
        try {
            const mergedPdf = await PDFLib.PDFDocument.create();
            for (const file of files) {
                const sourcePdf = await PDFLib.PDFDocument.load(await file.arrayBuffer());
                const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
                pages.forEach((page) => mergedPdf.addPage(page));
            }
            const bytes = await mergedPdf.save();
            const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = 'fileonix-merged.pdf';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            status.textContent = 'Done! Your merged PDF has been downloaded.';
        } catch (error) {
            status.textContent = 'Unable to merge these files. Password-protected or damaged PDFs are not supported.';
        } finally {
            mergeButton.disabled = files.length < 2;
        }
    };
});

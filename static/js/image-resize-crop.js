document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('resize-file-input');
    const selectButton = document.getElementById('resize-select-btn');
    const emptyState = document.getElementById('resize-empty-state');
    const workspace = document.getElementById('resize-workspace');
    const image = document.getElementById('resize-image');
    const widthInput = document.getElementById('resize-width');
    const heightInput = document.getElementById('resize-height');
    const lockRatio = document.getElementById('resize-lock-ratio');
    const outputFormat = document.getElementById('resize-output-format');
    const downloadButton = document.getElementById('resize-download-btn');
    const status = document.getElementById('resize-status');
    let cropper = null;
    let outputRatio = 1;
    let sourceName = 'image';
    let updatingDimensions = false;

    if (!input || !image || !window.Cropper) return;

    function setDimensions(width, height) {
        updatingDimensions = true;
        widthInput.value = Math.max(1, Math.round(width));
        heightInput.value = Math.max(1, Math.round(height));
        outputRatio = width / height;
        updatingDimensions = false;
    }

    function startCropper(url) {
        if (cropper) cropper.destroy();
        image.onload = () => {
            cropper = new Cropper(image, {
                viewMode: 1,
                autoCropArea: 0.9,
                responsive: true,
                background: false,
                crop(event) {
                    if (!updatingDimensions && event.detail.width && event.detail.height) {
                        outputRatio = event.detail.width / event.detail.height;
                    }
                },
                ready() {
                    const data = cropper.getData(true);
                    setDimensions(data.width, data.height);
                    status.textContent = 'Drag the crop box to choose the area you want to keep.';
                }
            });
        };
        image.src = url;
    }

    function loadFile(file) {
        if (!file || !file.type.startsWith('image/')) { status.textContent = 'Please select a valid image file.'; return; }
        sourceName = file.name.replace(/\.[^/.]+$/, '') || 'image';
        emptyState.hidden = true;
        workspace.hidden = false;
        startCropper(URL.createObjectURL(file));
    }

    selectButton.onclick = () => input.click();
    input.onchange = () => { loadFile(input.files[0]); input.value = ''; };
    document.getElementById('resize-change-image').onclick = () => input.click();

    document.querySelectorAll('.resize-presets button').forEach((button) => {
        button.onclick = () => {
            if (!cropper) return;
            document.querySelectorAll('.resize-presets button').forEach((item) => item.classList.remove('active'));
            button.classList.add('active');
            const aspect = Number(button.dataset.aspect);
            cropper.setAspectRatio(Number.isNaN(aspect) ? NaN : aspect);
        };
    });
    document.getElementById('resize-rotate-left').onclick = () => cropper && cropper.rotate(-90);
    document.getElementById('resize-rotate-right').onclick = () => cropper && cropper.rotate(90);
    document.getElementById('resize-reset').onclick = () => {
        if (!cropper) return;
        cropper.reset();
        const data = cropper.getData(true);
        setDimensions(data.width, data.height);
        status.textContent = 'Edits have been reset.';
    };

    widthInput.oninput = () => {
        if (!lockRatio.checked || updatingDimensions || !widthInput.value) return;
        updatingDimensions = true;
        heightInput.value = Math.max(1, Math.round(Number(widthInput.value) / outputRatio));
        updatingDimensions = false;
    };
    heightInput.oninput = () => {
        if (!lockRatio.checked || updatingDimensions || !heightInput.value) return;
        updatingDimensions = true;
        widthInput.value = Math.max(1, Math.round(Number(heightInput.value) * outputRatio));
        updatingDimensions = false;
    };

    downloadButton.onclick = () => {
        if (!cropper) return;
        const width = Number(widthInput.value);
        const height = Number(heightInput.value);
        if (!width || !height || width < 1 || height < 1) { status.textContent = 'Enter a valid width and height.'; return; }
        downloadButton.disabled = true;
        status.textContent = 'Preparing your image...';
        const canvas = cropper.getCroppedCanvas({ width, height, imageSmoothingEnabled: true, imageSmoothingQuality: 'high' });
        const format = outputFormat.value;
        const extension = format === 'image/jpeg' ? 'jpg' : format.split('/')[1];
        canvas.toBlob((blob) => {
            if (!blob) { status.textContent = 'Unable to create the image. Please try again.'; downloadButton.disabled = false; return; }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${sourceName}-edited.${extension}`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            status.textContent = 'Done! Your edited image has been downloaded.';
            downloadButton.disabled = false;
        }, format, format === 'image/png' ? undefined : 0.92);
    };
});

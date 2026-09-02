document.addEventListener('DOMContentLoaded', () => {
    const type = document.getElementById('qr-type');
    const phoneGroup = document.getElementById('qr-phone-group');
    const phone = document.getElementById('qr-phone');
    const contentLabel = document.getElementById('qr-content-label');
    const content = document.getElementById('qr-content');
    const helper = document.getElementById('qr-helper');
    const size = document.getElementById('qr-size');
    const darkColor = document.getElementById('qr-dark-color');
    const lightColor = document.getElementById('qr-light-color');
    const preview = document.getElementById('qr-preview');
    const generateButton = document.getElementById('qr-generate-btn');
    const downloadButton = document.getElementById('qr-download-btn');
    const status = document.getElementById('qr-status');

    if (!type || !preview || !window.QRCode) return;

    const typeCopy = {
        url: { label: 'Website link', placeholder: 'https://example.com', helper: 'Paste any website link.' },
        'google-review': { label: 'Google Review link', placeholder: 'https://g.page/r/your-review-link/review', helper: 'Paste your business\'s direct Google Review link. Scanning the QR opens that review page.' },
        text: { label: 'Text', placeholder: 'Write any text here', helper: 'Create a QR code for any short text.' },
        phone: { label: 'Phone number', placeholder: '919876543210', helper: 'Scanning the QR opens the phone dialer.' },
        whatsapp: { label: 'WhatsApp message', placeholder: 'Write your WhatsApp message', helper: 'Enter a WhatsApp number and an optional pre-filled message.' }
    };

    function updateType() {
        const config = typeCopy[type.value];
        contentLabel.textContent = config.label;
        content.placeholder = config.placeholder;
        helper.textContent = config.helper;
        phoneGroup.hidden = type.value !== 'whatsapp';
        content.value = '';
    }

    function getQrValue() {
        const value = content.value.trim();
        if (type.value === 'phone') return value ? `tel:${value.replace(/\s/g, '')}` : '';
        if (type.value === 'whatsapp') {
            const number = phone.value.replace(/\D/g, '');
            return number ? `https://wa.me/${number}${value ? `?text=${encodeURIComponent(value)}` : ''}` : '';
        }
        return value;
    }

    type.onchange = updateType;
    generateButton.onclick = () => {
        const value = getQrValue();
        if (!value) {
            status.textContent = type.value === 'whatsapp' ? 'Enter a WhatsApp phone number first.' : 'Enter something to generate a QR code.';
            return;
        }
        preview.replaceChildren();
        new QRCode(preview, {
            text: value,
            width: Number(size.value),
            height: Number(size.value),
            colorDark: darkColor.value,
            colorLight: lightColor.value,
            correctLevel: QRCode.CorrectLevel.M
        });
        downloadButton.disabled = false;
        status.textContent = 'Your QR code is ready to download.';
    };

    downloadButton.onclick = () => {
        const canvas = preview.querySelector('canvas');
        const image = preview.querySelector('img');
        if (!canvas && !image) return;
        const link = document.createElement('a');
        link.download = 'fileonix-qr-code.png';
        link.href = canvas ? canvas.toDataURL('image/png') : image.src;
        link.click();
        status.textContent = 'PNG download started.';
    };

    updateType();
});

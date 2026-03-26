import { toPng } from 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm';
import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

const EXPORT_SIZES = {
    'ig-portrait': { width: 1080, height: 1350 },
    'ig-square':   { width: 1080, height: 1080 },
    'ig-stories':  { width: 1080, height: 1920 },
    'facebook':    { width: 1920, height: 1005 }
};

async function captureSlide(slideEl, format) {
    await document.fonts.ready;

    const size = EXPORT_SIZES[format] || EXPORT_SIZES['ig-portrait'];
    const previewW = slideEl.offsetWidth;
    const previewH = slideEl.offsetHeight;
    const scaleX = size.width / previewW;
    const scaleY = size.height / previewH;

    return toPng(slideEl, {
        width: size.width,
        height: size.height,
        pixelRatio: 1,
        style: {
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'top left',
            width: previewW + 'px',
            height: previewH + 'px'
        },
        skipFonts: false
    });
}

export async function exportSlide(slideEl, format, index, prefix = '') {
    const dataUrl = await captureSlide(slideEl, format);
    const link = document.createElement('a');
    const p = prefix ? prefix + '-' : '';
    link.download = `${p}slide-${String(index + 1).padStart(2, '0')}.png`;
    link.href = dataUrl;
    link.click();
}

export async function exportAllSlides(slideEls, format, onProgress, prefix = '') {
    const zip = new JSZip();
    const p = prefix ? prefix + '-' : '';

    for (let i = 0; i < slideEls.length; i++) {
        onProgress?.(i, slideEls.length);
        const dataUrl = await captureSlide(slideEls[i], format);
        const base64 = dataUrl.split(',')[1];
        zip.file(`${p}slide-${String(i + 1).padStart(2, '0')}.png`, base64, { base64: true });
    }

    onProgress?.(slideEls.length, slideEls.length);

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.download = `${p}carousel.zip`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
}

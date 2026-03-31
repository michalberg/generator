import { renderStripes } from './stripes.js';

const DEFAULT_LOGO_URL = 'assets/logos/logo-zeleni-brno.png';

const FONT_CSS = {
    TuskerGrotesk: "'TuskerGrotesk', sans-serif",
    SVGDEurotype:  "'SVGDEurotype', serif",
    UrbanGrotesk:  "'UrbanGrotesk', sans-serif"
};

// Default font sizes (px) for the 420px-wide preview element
const DEFAULT_SIZES = {
    hero:    { title: 60, subtitle: 26 },
    content: { title: 36, body: 26 },
    quote:   { quote: 26, author: 16, role: 13 },
    stat:    { number: 80, unit: 26, description: 26 },
    cta:     { cta: 60, url: 26 },
    image:       { title: 38, caption: 16 },
    beforeafter: { title: 32, labelBefore: 16, labelAfter: 16 }
};

// Overrides for Stories format (narrower preview, overlay at top/bottom)
const STORIES_SIZES = {
    hero:        { title: 40, subtitle: 20 },
    content:     { title: 40, body: 20 },
    stat:        { number: 40, unit: 20, description: 20 },
    cta:         { cta: 40, url: 20 },
    image:       { title: 28, caption: 14 },
    beforeafter: { title: 26, labelBefore: 14, labelAfter: 14 }
};

// Default text alignment per field
const DEFAULT_ALIGNS = {
    hero:    { title: 'left', subtitle: 'left' },
    content: { title: 'left', body: 'left' },
    quote:   { quote: 'left', author: 'left', role: 'left' },
    stat:    { number: 'center', unit: 'center', description: 'center' },
    cta:     { cta: 'center', url: 'center' },
    image:       { title: 'left', caption: 'left' },
    beforeafter: { title: 'left', labelBefore: 'left', labelAfter: 'right' }
};

// text color that contrasts with given background key
function textColor(bg) {
    return bg === 'black' || bg === 'gradient' ? '#ffffff' : '#000000';
}

// border-stripe colors [color1, color2] contrasting with background
function borderStripeColors(bg) {
    switch (bg) {
        case 'green':    return ['#000000', '#ffa6d1'];
        case 'white':    return ['#000000', '#ffa6d1'];
        case 'pink':     return ['#0bd26f', '#000000'];
        case 'black':    return ['#0bd26f', '#ffa6d1'];
        case 'gradient': return ['#ffa6d1', '#ffffff'];
        default:         return ['#000000', '#ffa6d1'];
    }
}

function applyBackground(el, bg) {
    const map = {
        green:    '#0bd26f',
        white:    '#ffffff',
        pink:     '#ffa6d1',
        black:    '#000000',
        gradient: 'linear-gradient(160deg, #0bd26f 0%, #067a40 100%)'
    };
    const val = map[bg] || map.green;
    if (val.startsWith('linear')) {
        el.style.background = val;
    } else {
        el.style.background = val;
    }
}

function createLogo(logoUrl) {
    const wrap = document.createElement('div');
    wrap.className = 'slide-logo';
    const img = document.createElement('img');
    img.className = 'slide-logo-img';
    img.src = logoUrl || DEFAULT_LOGO_URL;
    img.alt = 'Logo';
    img.onerror = () => {
        img.style.display = 'none';
        const fb = document.createElement('div');
        fb.className = 'slide-logo-fallback';
        fb.innerHTML = '<span class="slide-logo-zeleni">ZELENÍ</span>';
        wrap.appendChild(fb);
    };
    wrap.appendChild(img);
    return wrap;
}

function createArrow(bg) {
    const wrap = document.createElement('div');
    wrap.className = 'slide-arrow';
    const c = textColor(bg);
    wrap.innerHTML = `
        <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
            <line x1="6" y1="26" x2="38" y2="26" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>
            <polyline points="28,14 42,26 28,38" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    return wrap;
}

function createBorderStripes(bg) {
    const [c1, c2] = borderStripeColors(bg);
    const gradient = `repeating-linear-gradient(90deg, ${c1} 0px, ${c1} 20px, ${c2} 20px, ${c2} 40px)`;

    const top = document.createElement('div');
    top.className = 'border-stripe border-stripe-top';
    top.style.background = gradient;

    const bot = document.createElement('div');
    bot.className = 'border-stripe border-stripe-bottom';
    bot.style.background = gradient;

    return [top, bot];
}

function applyFieldStyle(el, slide, fieldName, defaultSize) {
    const type = slide.type;
    const fs = (slide.fieldStyles || {})[fieldName] || {};
    const size         = fs.size       ?? defaultSize;
    const font         = fs.font       ?? null;
    const defaultAlign = DEFAULT_ALIGNS[type]?.[fieldName] ?? 'left';
    const align        = fs.align      ?? defaultAlign;
    const lineHeight   = fs.lineHeight ?? null;
    const whiteBg      = fs.whiteBg    ?? false;
    const color        = fs.color      ?? null;

    el.style.fontSize  = size + 'px';
    el.style.width     = '100%';
    el.style.textAlign = align;
    if (lineHeight) el.style.lineHeight = lineHeight;
    if (font && FONT_CSS[font]) {
        el.style.fontFamily = FONT_CSS[font];
        el.style.textTransform = font === 'TuskerGrotesk' ? 'uppercase' : 'none';
    }
    if (color) el.style.color = color;

    if (whiteBg) {
        const inner = el.innerHTML;
        // Wrap each non-empty line individually so empty lines show no background
        const parts = inner.split(/<br\s*\/?>/gi);
        el.innerHTML = parts.map(line => {
            const stripped = line.replace(/<[^>]+>/g, '').trim();
            return stripped ? `<span class="text-white-box-inline">${line}</span>` : '';
        }).join('<br>');
        if (!lineHeight) el.style.lineHeight = font === 'SVGDEurotype' ? '1.00' : '1.75';
        el.style.color = '';
    }
}

function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function renderSlide(container, slide, options = {}) {
    const { stripes = [], showTram = false, forceHideArrow = false, isStories = false, logoUrl = null } = options;
    const { type, fields = {}, background = null, showLogo = true, showOverlay = false,
            quotePosition = 'bottom', quoteBoxBg = 'green' } = slide;
    const showArrow = forceHideArrow ? false : (slide.showArrow ?? true);

    const bg = background || defaultBg(type);
    const tc = textColor(bg);

    container.innerHTML = '';
    container.className = 'slide-el' + (showTram ? ' has-tram' : '') + (isStories ? ' format-stories' : '');
    applyBackground(container, bg);

    const baseSizes = DEFAULT_SIZES[type] || {};
    const sizes = isStories && STORIES_SIZES[type]
        ? { ...baseSizes, ...STORIES_SIZES[type] }
        : baseSizes;

    if (type === 'hero') {
        const content = div('slide-content slide-content-center');

        if (fields.title) {
            const titleEl = div('slide-hero-title');
            titleEl.innerHTML = esc(fields.title).replace(/\n/g, '<br>');
            titleEl.style.color = tc;
            applyFieldStyle(titleEl, slide, 'title', sizes.title);
            content.appendChild(titleEl);
        }

        if (fields.subtitle) {
            const sub = div('slide-hero-subtitle');
            sub.innerHTML = esc(fields.subtitle).replace(/\n/g, '<br>');
            sub.style.color = tc;
            applyFieldStyle(sub, slide, 'subtitle', sizes.subtitle);
            content.appendChild(sub);
        }

        container.appendChild(content);
        if (showLogo) container.appendChild(createLogo(logoUrl));
        if (showArrow) container.appendChild(createArrow(bg));

    } else if (type === 'content') {
        const content = div('slide-content slide-content-top');

        if (fields.title) {
            const titleEl = div('slide-content-title');
            titleEl.textContent = fields.title;
            titleEl.style.color = tc;
            applyFieldStyle(titleEl, slide, 'title', sizes.title);
            content.appendChild(titleEl);
        }

        const bodyEl = div('slide-content-body');
        bodyEl.innerHTML = esc(fields.body || '').replace(/\n/g, '<br>');
        bodyEl.style.color = tc;
        applyFieldStyle(bodyEl, slide, 'body', sizes.body);
        content.appendChild(bodyEl);

        container.appendChild(content);
        if (showLogo) container.appendChild(createLogo(logoUrl));
        if (showArrow) container.appendChild(createArrow(bg));

    } else if (type === 'quote') {
        const BOX_BG_MAP = { green: '#0bd26f', white: '#ffffff', pink: '#ffa6d1', black: '#000000' };
        const boxColor    = BOX_BG_MAP[quoteBoxBg] || '#0bd26f';
        const boxTextColor = quoteBoxBg === 'black' ? '#ffffff' : '#000000';

        // Photo background (full slide)
        const photo = div('slide-quote-photo');
        if (fields.photoData) {
            const img = document.createElement('img');
            img.src = fields.photoData;
            photo.appendChild(img);
        } else {
            photo.appendChild(div('slide-quote-photo-placeholder'));
        }
        if (showOverlay) {
            photo.appendChild(div('slide-quote-overlay'));
        }
        container.appendChild(photo);

        // Helper: build quote content elements
        function appendQuoteContent(parent, textColor) {
            if (fields.quote) {
                const qEl = div('slide-quote-text');
                qEl.innerHTML = esc(fields.quote).replace(/\n/g, '<br>');
                qEl.style.color = textColor;
                applyFieldStyle(qEl, slide, 'quote', sizes.quote);
                parent.appendChild(qEl);
            }
            if (fields.author) {
                const authEl = div('slide-quote-author');
                authEl.textContent = fields.author;
                authEl.style.color = textColor;
                applyFieldStyle(authEl, slide, 'author', sizes.author);
                parent.appendChild(authEl);
            }
            if (fields.role) {
                const roleEl = div('slide-quote-role');
                roleEl.textContent = fields.role;
                roleEl.style.color = textColor;
                applyFieldStyle(roleEl, slide, 'role', sizes.role);
                parent.appendChild(roleEl);
            }
        }

        if (quotePosition === 'left' || quotePosition === 'right') {
            // Side layout: full-height colored box on left or right
            const sideBox = div(`slide-quote-side-box slide-quote-side-${quotePosition}`);
            sideBox.style.background = boxColor;
            appendQuoteContent(sideBox, boxTextColor);
            container.appendChild(sideBox);
        } else {
            // Top / bottom layout — bottom never shows logo, so always use nologos padding
            const logoGap = (showLogo && quotePosition !== 'bottom') ? 'slide-content-bottom-logo' : 'slide-content-bottom-nologos';
            const posCls  = quotePosition === 'top' ? 'slide-content-top-quote' : logoGap;
            const content = div(`slide-content ${posCls}`);
            const box = div('slide-quote-box');
            box.style.background = boxColor;
            appendQuoteContent(box, boxTextColor);
            content.appendChild(box);
            container.appendChild(content);
        }

        const quoteLogo = showLogo && quotePosition !== 'bottom';
        if (quoteLogo) container.appendChild(createLogo(logoUrl));
        if (showArrow) container.appendChild(createArrow(bg));

    } else if (type === 'stat') {
        const content = div('slide-content slide-content-center');

        if (fields.number) {
            const numEl = div('slide-stat-number');
            numEl.textContent = fields.number;
            numEl.style.color = tc;
            applyFieldStyle(numEl, slide, 'number', sizes.number);
            content.appendChild(numEl);
        }

        if (fields.unit) {
            const unitEl = div('slide-stat-unit');
            unitEl.textContent = fields.unit;
            unitEl.style.color = tc;
            applyFieldStyle(unitEl, slide, 'unit', sizes.unit);
            content.appendChild(unitEl);
        }

        if (fields.description) {
            const descEl = div('slide-stat-description');
            descEl.innerHTML = esc(fields.description).replace(/\n/g, '<br>');
            descEl.style.color = tc;
            applyFieldStyle(descEl, slide, 'description', sizes.description);
            content.appendChild(descEl);
        }

        container.appendChild(content);
        if (showLogo) container.appendChild(createLogo(logoUrl));
        if (showArrow) container.appendChild(createArrow(bg));

    } else if (type === 'cta') {
        const content = div('slide-content slide-content-center');

        if (fields.cta) {
            const ctaEl = div('slide-cta-text');
            ctaEl.innerHTML = esc(fields.cta).replace(/\n/g, '<br>');
            ctaEl.style.color = tc;
            applyFieldStyle(ctaEl, slide, 'cta', sizes.cta);
            content.appendChild(ctaEl);
        }

        if (fields.url) {
            const urlEl = div('slide-cta-url');
            urlEl.textContent = fields.url;
            applyFieldStyle(urlEl, slide, 'url', sizes.url);
            content.appendChild(urlEl);
        }

        container.appendChild(content);
        if (showLogo) container.appendChild(createLogo(logoUrl));
        // CTA nikdy nemá šipku

    } else if (type === 'beforeafter') {
        // Optional title
        if (fields.title) {
            const header = document.createElement('div');
            header.className = 'slide-ba-header';
            const titleEl = div('slide-ba-title');
            titleEl.innerHTML = esc(fields.title).replace(/\n/g, '<br>');
            titleEl.style.color = tc;
            applyFieldStyle(titleEl, slide, 'title', sizes.title);
            header.appendChild(titleEl);
            container.appendChild(header);
        }

        // Photos area
        const photosArea = div('slide-ba-photos');

        const before = div('slide-ba-photo slide-ba-before');
        if (fields.photoBefore) {
            const img = document.createElement('img'); img.src = fields.photoBefore; before.appendChild(img);
        } else { before.appendChild(div('slide-ba-photo-placeholder')); }

        const after = div('slide-ba-photo slide-ba-after');
        if (fields.photoAfter) {
            const img = document.createElement('img'); img.src = fields.photoAfter; after.appendChild(img);
        } else { after.appendChild(div('slide-ba-photo-placeholder')); }

        const bgColorMap = { green: '#0bd26f', white: '#ffffff', pink: '#ffa6d1', black: '#000000', gradient: '#0bd26f' };
        const dividerEl = div('slide-ba-divider');
        dividerEl.style.background = bgColorMap[bg] || '#0bd26f';

        photosArea.appendChild(before);
        photosArea.appendChild(after);
        photosArea.appendChild(dividerEl);

        if (fields.labelBefore) {
            const lbl = div('slide-ba-caption slide-ba-caption-before');
            lbl.textContent = fields.labelBefore;
            applyFieldStyle(lbl, slide, 'labelBefore', sizes.labelBefore);
            lbl.style.width = 'auto';
            photosArea.appendChild(lbl);
        }
        if (fields.labelAfter) {
            const lbl = div('slide-ba-caption slide-ba-caption-after');
            lbl.textContent = fields.labelAfter;
            applyFieldStyle(lbl, slide, 'labelAfter', sizes.labelAfter);
            lbl.style.width = 'auto';
            photosArea.appendChild(lbl);
        }

        container.appendChild(photosArea);

        // Footer area so logo/arrow sit in slide background, not over photos
        container.appendChild(div('slide-ba-footer'));

        if (showLogo) container.appendChild(createLogo(logoUrl));
        if (showArrow) container.appendChild(createArrow(bg));

    } else if (type === 'image') {
        const header = document.createElement('div');
        header.className = 'slide-image-header';

        if (fields.title) {
            const titleEl = div('slide-image-title');
            titleEl.innerHTML = esc(fields.title).replace(/\n/g, '<br>');
            titleEl.style.color = tc;
            applyFieldStyle(titleEl, slide, 'title', sizes.title);
            header.appendChild(titleEl);
        }
        container.appendChild(header);

        const photoArea = div('slide-image-photo-area');
        const imgWrap = div('slide-image-img-wrap');

        if (fields.photoData) {
            const img = document.createElement('img');
            img.src = fields.photoData;
            imgWrap.appendChild(img);
        } else {
            imgWrap.appendChild(div('slide-image-photo-placeholder'));
        }
        photoArea.appendChild(imgWrap);

        if (fields.caption) {
            const capEl = div('slide-image-caption');
            capEl.innerHTML = esc(fields.caption).replace(/\n/g, '<br>');
            applyFieldStyle(capEl, slide, 'caption', sizes.caption);
            capEl.style.width = 'auto';
            // Position left/center/right along bottom edge of photo
            const capAlign = (slide.fieldStyles?.caption?.align) || 'left';
            capEl.style.left = '';
            capEl.style.right = '';
            if (capAlign === 'center') {
                capEl.style.left = '50%';
                capEl.style.transform = 'translateX(-50%) translateY(50%)';
            } else if (capAlign === 'right') {
                capEl.style.right = '6%';
                capEl.style.transform = 'translateY(50%)';
            } else {
                capEl.style.left = '6%';
                capEl.style.transform = 'translateY(50%)';
            }
            photoArea.appendChild(capEl);
        }

        container.appendChild(photoArea);
        if (showLogo) container.appendChild(createLogo(logoUrl));
        if (showArrow) container.appendChild(createArrow(bg));
    }

    if (showTram) {
        const [top, bot] = createBorderStripes(bg);
        container.appendChild(top);
        container.appendChild(bot);
    }

    renderStripes(container, stripes);
}

function div(cls) {
    const el = document.createElement('div');
    if (cls) el.className = cls;
    return el;
}

function defaultBg(type) {
    return (type === 'content' || type === 'stat') ? 'green' : 'green';
}

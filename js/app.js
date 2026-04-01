import { renderSlide } from './renderer.js';
import { generateStripes } from './stripes.js';
import { exportSlide, exportAllSlides } from './export.js';

// ── State ──────────────────────────────────────────────────────────────────

const DEFAULT_SEQUENCE = ['hero', 'content', 'quote', 'stat', 'cta'];

const LOGOS = [
    { name: 'Zelení (celostátní)', url: 'assets/logos/logo-zeleni.jpg' },
    { name: 'Zelení Brno',         url: 'assets/logos/logo-zeleni-brno.png' },
    { name: 'Praha',               url: 'assets/logos/logo-praha.jpg' },
    { name: 'Praha 2',             url: 'assets/logos/logo-praha2.jpg' },
    { name: 'Praha 6',             url: 'assets/logos/logo-praha6.jpg' },
    { name: 'Praha 7',             url: 'assets/logos/logo-praha7.jpg' },
    { name: 'Praha 10',            url: 'assets/logos/logo-praha10.jpg' },
    { name: 'Praha 14',            url: 'assets/logos/logo-praha14.jpg' },
    { name: 'Brno střed',          url: 'assets/logos/logo-brno-stred.jpg' },
    { name: 'Ostrava',             url: 'assets/logos/logo-ostrava.jpg' },
    { name: 'Olomouc',             url: 'assets/logos/logo-olomouc.jpg' },
    { name: 'Český Krumlov',       url: 'assets/logos/logo-cesky-krumlov.jpg' },
    { name: 'JMK',                 url: 'assets/logos/logo-jmk.jpg' },
    { name: 'OLK',                 url: 'assets/logos/logo-olk.jpg' },
    { name: 'MSK',                 url: 'assets/logos/logo-msk.jpg' },
    { name: 'PAK',                 url: 'assets/logos/logo-pak.jpg' },
];

const LOGO_COOKIE = 'sg_logo';

function saveLogo(url) {
    document.cookie = `${LOGO_COOKIE}=${encodeURIComponent(url)};path=/;max-age=${60 * 60 * 24 * 365}`;
}

function loadLogo() {
    const match = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(LOGO_COOKIE + '='));
    if (!match) return null;
    const url = decodeURIComponent(match.split('=').slice(1).join('='));
    return LOGOS.find(l => l.url === url) ? url : null;
}

const state = {
    format: 'ig-portrait',
    logo: loadLogo() || LOGOS[0].url,
    slides: [],
    stripes: {},
    showStripes: true,
    showTram: false,
    currentSlide: 0,
    dragging: false,
    dragStartX: 0,
    templates: null
};

const BG_OPTIONS = {
    green:    'Zelená',
    white:    'Bílá',
    pink:     'Růžová',
    black:    'Černá',
    gradient: 'Gradient'
};

// Default font for each slide type / field
const DEFAULT_FONTS = {
    hero:    { title: 'TuskerGrotesk', subtitle: 'UrbanGrotesk' },
    content: { title: 'TuskerGrotesk', body: 'UrbanGrotesk' },
    quote:   { quote: 'SVGDEurotype',  author: 'UrbanGrotesk', role: 'UrbanGrotesk' },
    stat:    { number: 'TuskerGrotesk', unit: 'UrbanGrotesk', description: 'UrbanGrotesk' },
    cta:     { cta: 'TuskerGrotesk',   url: 'SVGDEurotype' },
    image:       { title: 'TuskerGrotesk', caption: 'SVGDEurotype' },
    beforeafter: { title: 'SVGDEurotype', labelBefore: 'SVGDEurotype', labelAfter: 'SVGDEurotype' }
};

const DEFAULT_SIZES = {
    hero:    { title: 50, subtitle: 26 },
    content: { title: 36, body: 26 },
    quote:   { quote: 26, author: 16, role: 13 },
    stat:    { number: 80, unit: 26, description: 26 },
    cta:     { cta: 60, url: 26 },
    image:       { title: 38, caption: 16 },
    beforeafter: { title: 32, labelBefore: 16, labelAfter: 16 }
};

const DEFAULT_ALIGNS = {
    hero:    { title: 'left',   subtitle: 'left' },
    content: { title: 'left',   body: 'left' },
    quote:   { quote: 'left',   author: 'left', role: 'left' },
    stat:    { number: 'center', unit: 'center', description: 'center' },
    cta:     { cta: 'center',   url: 'center' },
    image:       { title: 'left',   caption: 'left' },
    beforeafter: { title: 'left',   labelBefore: 'left', labelAfter: 'right' }
};

// ── Remotion JSON enrichment ────────────────────────────────────────────────

const BG_HEX = { green: '#0bd26f', white: '#ffffff', pink: '#ffa6d1', black: '#000000' };
const BG_GRADIENT = 'linear-gradient(160deg, #0bd26f 0%, #067a40 100%)';

function remotionTextColor(bg) {
    return (bg === 'black' || bg === 'gradient') ? '#ffffff' : '#000000';
}

// Extra per-field defaults not tracked in state (weight, letterSpacing, lineHeight)
const FIELD_EXTRAS = {
    hero:    { title: { weight: 900, lineHeight: 1.33, letterSpacing: '0.02em' }, subtitle: { weight: 500, lineHeight: 1.4 } },
    content: { title: { weight: 900, lineHeight: 1.1,  letterSpacing: '0.02em' }, body:     { weight: 400, lineHeight: 1.6 } },
    quote:   { quote:  { weight: 600, lineHeight: 1.35 }, author: { weight: 600 }, role: { weight: 400 } },
    stat:    { number: { weight: 900, lineHeight: 0.9,  letterSpacing: '0.02em' }, unit: { weight: 600 }, description: { weight: 400, lineHeight: 1.5, maxWidth: 864 } },
    cta:     { cta:    { weight: 900, lineHeight: 1.05, letterSpacing: '0.02em' }, url:  { weight: 600 } },
    image:       { title: { weight: 900, lineHeight: 1.05, letterSpacing: '0.02em' }, caption:     { weight: 600 } },
    beforeafter: { title: { weight: 900, lineHeight: 1.05, letterSpacing: '0.02em' }, labelBefore: { weight: 600 }, labelAfter: { weight: 600 } },
};

// Layout at 1080px reference width (% → px)
const SLIDE_LAYOUT = {
    hero:        { contentAlign: 'center', paddingX: 76, paddingTop: 76,  gap: 12 },
    content:     { contentAlign: 'top',    paddingX: 76, paddingTop: 108, gap: 16 },
    stat:        { contentAlign: 'center', paddingX: 76, paddingTop: 76,  gap: 4  },
    cta:         { contentAlign: 'center', paddingX: 76, paddingTop: 76,  gap: 16 },
    quote:       { contentAlign: 'bottom', paddingX: 76, paddingTop: 76,  gap: 8  },
    image:       { contentAlign: 'top',    paddingX: 65, paddingTop: 65,  gap: 16 },
    beforeafter: { contentAlign: 'top',    paddingX: 65, paddingTop: 54,  gap: 0  },
};

function buildEnrichedSlides(uploadedSlides) {
    return uploadedSlides.map((s, i) => {
        const { type, background: bg } = s;
        const tc = remotionTextColor(bg);
        const extras = FIELD_EXTRAS[type] || {};

        // Enrich fieldStyles
        const fieldStyles = {};
        for (const [fieldName, ext] of Object.entries(extras)) {
            const user = (s.fieldStyles || {})[fieldName] || {};
            const font = user.font ?? DEFAULT_FONTS[type]?.[fieldName] ?? 'UrbanGrotesk';
            const size = user.size ?? DEFAULT_SIZES[type]?.[fieldName] ?? 16;
            const align = user.align ?? DEFAULT_ALIGNS[type]?.[fieldName] ?? 'left';
            const whiteBg = user.whiteBg ?? false;
            const entry = {
                size,
                font,
                weight: ext.weight ?? 400,
                color: whiteBg ? '#000000' : (user.color ?? tc),
                align,
            };
            if (ext.lineHeight)    entry.lineHeight    = user.lineHeight ?? ext.lineHeight;
            if (ext.letterSpacing) entry.letterSpacing = ext.letterSpacing;
            if (whiteBg)           entry.whiteBg = true, entry.bgPadding = [4, 10];
            if (ext.maxWidth)      entry.maxWidth = ext.maxWidth;
            fieldStyles[fieldName] = entry;
        }

        // Layout
        const layout = { ...SLIDE_LAYOUT[type] };
        if (type === 'quote') {
            const pos = s.quotePosition || 'bottom';
            layout.contentAlign = pos === 'top' ? 'top' : pos === 'bottom' ? 'bottom' : 'center';
        }

        // Image layout
        const imageLayout = type === 'quote'       ? { position: s.quotePosition || 'bottom', fullBackground: true }
                          : type === 'image'        ? { heightPercent: 50 }
                          : type === 'beforeafter'  ? { heightPercent: 60 }
                          : null;

        // Background shapes
        const shapes = (state.stripes[i] || []).map(sh => ({
            type:     sh.type,
            x:        sh.x,
            y:        sh.y,
            w:        sh.w,
            h:        sh.h,
            rotation: sh.rotation,
            color:    sh.color === 'pink' ? '#ffa6d1' : '#d9d9d9',
        }));

        const slide = {
            type,
            background:    bg,
            backgroundColor: bg === 'gradient' ? null : (BG_HEX[bg] ?? BG_HEX.green),
            layout,
            fields:        s.fields,
            fieldStyles,
            showLogo:      s.showLogo,
            showArrow:     s.showArrow,
            shapes,
        };
        if (bg === 'gradient') slide.backgroundGradient = BG_GRADIENT;
        if (imageLayout) slide.imageLayout = imageLayout;
        if (type === 'quote') { slide.quotePosition = s.quotePosition; slide.quoteBoxBg = s.quoteBoxBg; }
        return slide;
    });
}

// ── LocalStorage persistence ────────────────────────────────────────────────

const LS_KEY = 'sg_state';

function saveState() {
    try {
        const data = {
            format: state.format,
            logo:   state.logo,
            slides: state.slides.map(s => ({
                type:          s.type,
                background:    s.background,
                fields:        s.fields,
                fieldStyles:   s.fieldStyles,
                showLogo:      s.showLogo,
                showArrow:     s.showArrow,
                quotePosition: s.quotePosition,
                quoteBoxBg:    s.quoteBoxBg,
            })),
        };
        localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch (e) { /* quota exceeded — ignore */ }
}

function loadSavedState() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function clearSavedState() {
    localStorage.removeItem(LS_KEY);
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
    const res = await fetch('templates/templates.json');
    state.templates = await res.json();

    const saved = loadSavedState();
    if (saved) {
        __importState(saved);
    } else {
        initSlides(5);
    }
    buildSidebar();
    buildIgFrame();
    renderAll();
    bindGlobalEvents();
}

function initSlides(count) {
    state.slides = [];
    for (let i = 0; i < count; i++) {
        state.slides.push(makeSlide(DEFAULT_SEQUENCE[i] || 'content', i));
    }
    state.stripes = {};
    for (let i = 0; i < count; i++) state.stripes[i] = generateStripes();
    state.currentSlide = 0;
}

function makeSlide(type, index) {
    const fieldDefaults = {
        hero:    { title: 'ZDE MUSÍ BÝT NĚCO, CO UPOUTÁ POZORNOST', subtitle: '' },
        content: { title: 'Proč je to důležité', body: 'Text slidu...' },
        quote:   { quote: 'Citace osoby...', author: 'Jméno Příjmení', role: 'Funkce', photoData: '' },
        stat:    { number: '42', unit: '%', description: 'Popis statistiky' },
        cta:     { cta: 'Podepište petici a sdílejte!', url: 'Odkaz v biu' },
        image:       { title: 'NADPIS SLIDU', photoData: '', caption: 'Místo' },
        beforeafter: { title: 'Jak může vypadat Brno', photoBefore: '', photoAfter: '', labelBefore: 'Před', labelAfter: 'Po' }
    };
    const bgDefaults = { hero: 'green', content: index % 2 === 0 ? 'green' : 'white', quote: 'green', stat: index % 2 === 0 ? 'white' : 'green', cta: 'green', image: 'green', beforeafter: 'green' };

    const fsDefaults = {
        hero:  {},
        cta:   { url: { whiteBg: true, font: 'SVGDEurotype' } },
        image:       { title: { whiteBg: true, font: 'SVGDEurotype' } },
        beforeafter: { title: { whiteBg: true, font: 'SVGDEurotype' } }
    };

    return {
        type,
        fields: { ...(fieldDefaults[type] || {}) },
        fieldStyles: { ...(fsDefaults[type] || {}) },
        background: bgDefaults[type] || 'green',
        showLogo: true,
        showArrow: true,
        showStripes: true,
        showOverlay: false,
        quotePosition: 'bottom',
        quoteBoxBg: 'green'
    };
}

function getFieldStyle(slide, name) {
    return slide.fieldStyles[name] || {};
}

function setFieldStyle(slide, name, key, value) {
    if (!slide.fieldStyles[name]) slide.fieldStyles[name] = {};
    slide.fieldStyles[name][key] = value;
}

// ── Sidebar ────────────────────────────────────────────────────────────────

function buildSidebar() {
    const sb = document.getElementById('sidebar');
    sb.innerHTML = '';

    // Global
    const globalSec = makeSec('Nastavení');
    const fmtRow = makeRow('Formát');
    const fmtSel = makeSelect({ 'ig-portrait': 'Instagram 4:5', 'ig-square': 'Instagram 1:1', 'ig-stories': 'Stories 9:16', facebook: 'Facebook' }, state.format);
    fmtSel.onchange = () => { state.format = fmtSel.value; updateCarouselFormat(); };
    fmtRow.append(fmtSel);
    globalSec.append(fmtRow);

    const logoRow = makeRow('Organizace');
    const logoLabel = logoRow.querySelector('label');
    logoLabel.dataset.tooltip = 'Pokud chcete aby bylo v nabídce i vaše logo, pošlete na michal.berg@zeleni.cz požadavek o zařazení loga, s odkazem na vaši stránku na instagramu nebo facebooku, kde máte logo v aktuálním designu dle návodu na http://zeleni.cz/grafika';
    const logoHint = el('span');
    logoHint.textContent = 'Není zde vaše logo?';
    logoHint.className = 'logo-hint';
    logoLabel.append(logoHint);
    const logoSel = makeSelect(Object.fromEntries(LOGOS.map(l => [l.url, l.name])), state.logo);
    logoSel.onchange = () => { state.logo = logoSel.value; saveLogo(logoSel.value); renderAll(); };
    logoRow.append(logoSel);
    globalSec.append(logoRow);

    const cntRow = makeRow('Počet slidů');
    const cntInput = el('input');
    Object.assign(cntInput, { type: 'number', min: 1, max: 10, value: state.slides.length });
    cntInput.onchange = () => {
        const n = Math.max(1, Math.min(10, parseInt(cntInput.value) || 1));
        cntInput.value = n;
        if (n < state.slides.length) {
            const toRemove = state.slides.slice(n);
            const modifiedCount = toRemove.filter((slide, i) => isSlideModified(slide, n + i)).length;
            if (modifiedCount > 0) {
                const ok = confirm(`Odstraníte ${modifiedCount === toRemove.length ? '' : modifiedCount + ' z '}${toRemove.length} slide${toRemove.length > 1 ? 'y' : ''} s vlastním obsahem. Tato akce je nevratná. Chcete pokračovat?`);
                if (!ok) { cntInput.value = state.slides.length; return; }
            }
        }
        resizeSlides(n);
        buildSidebar();
        buildCarouselTrack();
        renderAll();
    };
    cntRow.append(cntInput);
    globalSec.append(cntRow);
    sb.append(globalSec);

    // Appearance
    const appSec = makeSec('Vzhled');

    // Elementy na pozadí – checkbox + přegenerovat inline
    const regenBtn = el('button');
    regenBtn.className = 'btn btn-sm btn-regenerate has-tooltip';
    regenBtn.innerHTML = '🎲';
    regenBtn.dataset.tooltip = 'Přegenerovat náhodné elementy na pozadí pro všechny slidy';
    regenBtn.disabled = !state.showStripes;
    regenBtn.onclick = () => {
        for (let i = 0; i < state.slides.length; i++) state.stripes[i] = generateStripes();
        renderAll();
    };

    const stripesRow = makeCheckRow('Elementy na pozadí', state.showStripes, checked => {
        state.showStripes = checked;
        regenBtn.disabled = !checked;
        renderAll();
    });
    stripesRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:6px';
    stripesRow.append(regenBtn);
    appSec.append(stripesRow);

    // Tram stripes (renamed)
    const tramRow = makeCheckRow('Zapnout/vypnout pruhy', state.showTram, checked => {
        state.showTram = checked;
        renderAll();
    });
    tramRow.style.marginTop = '8px';
    appSec.append(tramRow);
    sb.append(appSec);

    // Slide panels
    state.slides.forEach((slide, i) => sb.append(buildSlidePanel(slide, i)));
}

function buildSlidePanel(slide, index) {
    const tmpl = state.templates.templates[0];
    const typeDef = tmpl.slideTypes[slide.type];

    const panel = el('div');
    panel.className = 'slide-panel' + (index !== state.currentSlide ? ' collapsed' : '');

    const header = el('div');
    header.className = 'slide-panel-header';

    const titleEl = el('div');
    titleEl.className = 'slide-panel-title' + (index === state.currentSlide ? ' active-slide' : '');
    titleEl.innerHTML = `SLIDE ${index + 1} <span style="font-weight:400;color:#8e8e8e;font-size:11px">${typeDef?.name || slide.type}</span>`;

    const arrowEl = el('div');
    arrowEl.className = 'slide-panel-arrow';
    arrowEl.textContent = '▼';

    header.append(titleEl, arrowEl);
    header.onclick = () => {
        panel.classList.toggle('collapsed');
        if (!panel.classList.contains('collapsed')) {
            state.currentSlide = index;
            goToSlide(index);
            document.querySelectorAll('.slide-panel-title').forEach((t, i) => {
                t.classList.toggle('active-slide', i === index);
            });
        }
    };

    const body = el('div');
    body.className = 'slide-panel-body';

    // Type
    const typeRow = makeRow('Typ slidu');
    const typeSel = makeSelect(Object.fromEntries(Object.entries(tmpl.slideTypes).map(([k, v]) => [k, v.name])), slide.type);
    typeSel.onchange = () => {
        const newSlide = makeSlide(typeSel.value, index);
        slide.type = typeSel.value;
        slide.fields = newSlide.fields;
        slide.fieldStyles = newSlide.fieldStyles;
        buildSidebar(); buildCarouselTrack(); renderAll();
    };
    typeRow.append(typeSel);
    body.append(typeRow);

    // Background
    const bgRow = makeRow('Pozadí');
    const bgSel = makeSelect(BG_OPTIONS, slide.background);
    bgSel.onchange = () => { slide.background = bgSel.value; renderCurrentSlide(); };
    bgRow.append(bgSel);
    if (slide.type === 'quote') {
        const bgHint = el('div');
        bgHint.style.cssText = 'font-size:11px;color:#8e8e8e;margin-top:3px';
        bgHint.textContent = 'Není vidět, ale určuje případně barvu pruhů';
        bgRow.append(bgHint);
    }
    body.append(bgRow);

    // Per-slide stripes toggle
    const slideStripesRow = makeCheckRow('Elementy na pozadí', slide.showStripes, checked => {
        slide.showStripes = checked;
        renderCurrentSlide();
    });
    body.append(slideStripesRow);

    // Logo toggle
    const logoRow = makeCheckRow('Zobrazit logo', slide.showLogo, checked => {
        slide.showLogo = checked;
        renderCurrentSlide();
    });
    body.append(logoRow);
    if (slide.type === 'quote') {
        const logoHint = el('div');
        logoHint.style.cssText = 'font-size:11px;color:#8e8e8e;margin-top:2px;margin-bottom:4px';
        logoHint.textContent = 'Při citaci dole není logo vidět';
        body.append(logoHint);
    }

    // Arrow toggle (not on CTA – it never has arrow)
    if (slide.type !== 'cta') {
        const arrowRow = makeCheckRow('Zobrazit šipku', slide.showArrow, checked => {
            slide.showArrow = checked;
            renderCurrentSlide();
        });
        body.append(arrowRow);
    }

    // Quote-specific controls
    if (slide.type === 'quote') {
        const overlayRow = makeCheckRow('Overlay přes fotku', slide.showOverlay, checked => {
            slide.showOverlay = checked;
            renderCurrentSlide();
        });
        body.append(overlayRow);

        const posRow = makeRow('Poloha citace');
        const posSel = makeSelect({ bottom: 'Dole', top: 'Nahoře', left: 'Vlevo', right: 'Vpravo' }, slide.quotePosition);
        posSel.onchange = () => {
            const prev = slide.quotePosition;
            slide.quotePosition = posSel.value;
            if (posSel.value === 'bottom') {
                slide.showLogo = false;
            } else if (prev === 'bottom') {
                slide.showLogo = true;
            }
            buildSidebar();
            renderCurrentSlide();
        };
        posRow.append(posSel);
        body.append(posRow);

        const boxBgRow = makeRow('Barva rámečku citace');
        const boxBgSel = makeSelect({ green: 'Zelená', white: 'Bílá', pink: 'Růžová', black: 'Černá' }, slide.quoteBoxBg);
        boxBgSel.onchange = () => { slide.quoteBoxBg = boxBgSel.value; renderCurrentSlide(); };
        boxBgRow.append(boxBgSel);
        body.append(boxBgRow);
    }

    // Fields
    if (typeDef) {
        typeDef.fields.forEach(fd => {
            if (fd.type === 'select') return; // background now handled above
            body.append(buildField(fd, slide, index));
        });

        // AI
        const aiWrap = el('div');
        aiWrap.style.display = 'none';
        aiWrap.style.marginTop = '8px';
        const aiRow = el('div');
        aiRow.className = 'ai-row';

        const aiSel = el('select');
        aiSel.style.cssText = 'flex:1;padding:8px 10px;border:1.5px solid #efefef;border-radius:4px;font-family:inherit;font-size:13px;background:#fff';
        [
            ['Zkrať na maximum znaků', 'zkrať na maximum znaků'],
            ['Přeformuluj úderněji',   'přeformuluj úderněji'],
            ['Udělej z toho otázku',   'udělej z toho otázku'],
            ['Zjednodušuj',            'zjednodušuj'],
            ['Přidej emoji',           'přidej emoji'],
            ['Formální → neformální',  'formální → neformální']
        ].forEach(([label, val]) => {
            const o = el('option');
            o.value = val; o.textContent = label;
            aiSel.append(o);
        });
        aiRow.append(aiSel);
        aiWrap.append(aiRow);

        const aiBtn = el('button');
        aiBtn.className = 'btn btn-ai';
        aiBtn.textContent = '🪄 Vyladit s AI';
        aiBtn.style.display = 'none';
        aiBtn.onclick = async () => {
            await runAiRefine(slide, typeDef, aiSel.value);
            buildSidebar(); buildCarouselTrack(); renderAll();
        };
        aiWrap.append(aiBtn);
        body.append(aiWrap);
    }

    panel.append(header, body);
    return panel;
}

function buildField(fd, slide, index) {
    const group = el('div');
    group.className = 'field-group';

    if (fd.type === 'image') {
        const photoKey = fd.name === 'photo' ? 'photoData' : fd.name;
        const row = makeRow(fd.label);
        const area = el('div');
        area.className = 'image-upload-area';
        if (slide.fields[photoKey]) {
            const img = el('img');
            img.className = 'image-preview-thumb';
            img.src = slide.fields[photoKey];
            area.append(img);
        } else {
            area.textContent = 'Klikněte nebo přetáhněte fotku';
        }
        const fi = el('input');
        fi.type = 'file'; fi.accept = 'image/*';
        fi.onchange = () => {
            const f = fi.files[0]; if (!f) return;
            const r = new FileReader();
            r.onload = e => { slide.fields[photoKey] = e.target.result; buildSidebar(); renderAll(); };
            r.readAsDataURL(f);
        };
        area.append(fi);
        row.append(area);
        const photoHint = el('div');
        photoHint.style.cssText = 'font-size:11px;color:#8e8e8e;margin-top:4px';
        photoHint.textContent = 'Doporučeno: min. šířka 900 px, výška 600–1 200 px';
        row.append(photoHint);
        group.append(row);
        return group;
    }

    // text / textarea
    const row = makeRow(fd.label);
    let input;
    if (fd.type === 'textarea') {
        input = el('textarea');
        input.rows = 3;
    } else {
        input = el('input');
        input.type = 'text';
    }
    input.value = slide.fields[fd.name] ?? '';
    input.placeholder = fd.label;
    input.onfocus = () => input.select();

    const counter = el('div');
    counter.className = 'char-counter';

    const updateCounter = () => {
        const len = input.value.length;
        counter.textContent = `${len}/${fd.maxChars} znaků`;
        counter.className = 'char-counter ' + (len > fd.maxChars ? 'error' : len > fd.maxChars * 0.9 ? 'warning' : 'ok');
        input.classList.toggle('error', len > fd.maxChars);
    };

    input.oninput = () => {
        slide.fields[fd.name] = input.value;
        updateCounter();
        renderCurrentSlide();
    };
    updateCounter();
    row.append(input, counter);
    group.append(row);
    group.append(buildFieldToolbar(slide, fd.name, fd.type));
    return group;
}

function buildFieldToolbar(slide, fieldName, fieldType) {
    const fs = getFieldStyle(slide, fieldName);
    const defaultFont = DEFAULT_FONTS[slide.type]?.[fieldName] || 'UrbanGrotesk';
    const defaultSize = DEFAULT_SIZES[slide.type]?.[fieldName] || 16;
    const defaultAlign  = DEFAULT_ALIGNS[slide.type]?.[fieldName] ?? 'left';
    const currentFont   = fs.font       || defaultFont;
    const currentAlign  = fs.align      || defaultAlign;
    const currentSize   = fs.size       || defaultSize;
    const currentWhtBg  = fs.whiteBg    || false;
    const autoLH        = (currentWhtBg && (fs.font || defaultFont) === 'SVGDEurotype') ? 1.0 : 1.3;
    const currentLH     = fs.lineHeight || autoLH;
    const isTucker      = currentFont === 'TuskerGrotesk';

    const toolbar = el('div');
    toolbar.className = 'field-toolbar';

    // Alignment
    const alignWrap = el('div');
    alignWrap.className = 'toolbar-group';
    [['left', '⇒ Vlevo', '⇒'], ['center', '⇔ Střed', '⇔'], ['right', '⇐ Vpravo', '⇐']].forEach(([val, label, icon]) => {
        const btn = el('button');
        btn.className = 'toolbar-btn' + (currentAlign === val ? ' active' : '');
        btn.title = label;
        btn.textContent = icon;
        btn.onclick = () => {
            setFieldStyle(slide, fieldName, 'align', val);
            alignWrap.querySelectorAll('.toolbar-btn').forEach((b, i) => {
                b.classList.toggle('active', ['left','center','right'][i] === val);
            });
            renderCurrentSlide();
        };
        alignWrap.append(btn);
    });
    toolbar.append(alignWrap);

    // Font picker – wbGroup a wbBtn se odkazují přes closure (jsou vytvořeny níže)
    const fontWrap = el('div');
    fontWrap.className = 'toolbar-group';
    let wbGroup = null;
    let wbBtn = null;
    [['TuskerGrotesk','T'], ['SVGDEurotype','E'], ['UrbanGrotesk','U']].forEach(([val, label]) => {
        const btn = el('button');
        btn.className = 'toolbar-btn' + (currentFont === val ? ' active' : '');
        btn.title = val;
        btn.textContent = label;
        btn.onclick = () => {
            setFieldStyle(slide, fieldName, 'font', val);
            fontWrap.querySelectorAll('.toolbar-btn').forEach((b, i) => {
                b.classList.toggle('active', ['TuskerGrotesk','SVGDEurotype','UrbanGrotesk'][i] === val);
            });
            if (wbGroup) wbGroup.style.display = val === 'SVGDEurotype' ? '' : 'none';
            // Při přepnutí pryč z Euro automaticky vypnout bílé pozadí
            if (val !== 'SVGDEurotype') {
                setFieldStyle(slide, fieldName, 'whiteBg', false);
                if (wbBtn) { wbBtn.classList.remove('active'); wbBtn.textContent = '☐'; }
            }
            renderCurrentSlide();
        };
        fontWrap.append(btn);
    });
    toolbar.append(fontWrap);

    // Font size
    const sizeWrap = el('div');
    sizeWrap.className = 'toolbar-group toolbar-size';

    const minus = el('button');
    minus.className = 'toolbar-btn';
    minus.textContent = '−';

    const sizeLabel = el('span');
    sizeLabel.className = 'toolbar-size-val';
    sizeLabel.textContent = currentSize + 'px';

    const plus = el('button');
    plus.className = 'toolbar-btn';
    plus.textContent = '+';

    minus.onclick = () => {
        const cur = getFieldStyle(slide, fieldName).size || defaultSize;
        const next = Math.max(8, cur - 2);
        setFieldStyle(slide, fieldName, 'size', next);
        sizeLabel.textContent = next + 'px';
        renderCurrentSlide();
    };
    plus.onclick = () => {
        const cur = getFieldStyle(slide, fieldName).size || defaultSize;
        const next = Math.min(200, cur + 2);
        setFieldStyle(slide, fieldName, 'size', next);
        sizeLabel.textContent = next + 'px';
        renderCurrentSlide();
    };

    sizeWrap.append(minus, sizeLabel, plus);
    toolbar.append(sizeWrap);

    // Line-height
    const lhWrap = el('div');
    lhWrap.className = 'toolbar-group toolbar-size';

    const lhLabel0 = el('span');
    lhLabel0.style.cssText = 'font-size:11px;color:#8e8e8e;padding:0 2px';
    lhLabel0.textContent = '↕';

    const lhMinus = el('button');
    lhMinus.className = 'toolbar-btn';
    lhMinus.textContent = '−';

    const lhLabel = el('span');
    lhLabel.className = 'toolbar-size-val';
    lhLabel.textContent = currentLH.toFixed(1);

    const lhPlus = el('button');
    lhPlus.className = 'toolbar-btn';
    lhPlus.textContent = '+';

    lhMinus.onclick = () => {
        const cur = getFieldStyle(slide, fieldName).lineHeight || currentLH;
        const next = Math.max(0.8, Math.round((cur - 0.1) * 10) / 10);
        setFieldStyle(slide, fieldName, 'lineHeight', next);
        lhLabel.textContent = next.toFixed(1);
        renderCurrentSlide();
    };
    lhPlus.onclick = () => {
        const cur = getFieldStyle(slide, fieldName).lineHeight || currentLH;
        const next = Math.min(3.0, Math.round((cur + 0.1) * 10) / 10);
        setFieldStyle(slide, fieldName, 'lineHeight', next);
        lhLabel.textContent = next.toFixed(1);
        renderCurrentSlide();
    };

    lhWrap.append(lhLabel0, lhMinus, lhLabel, lhPlus);
    toolbar.append(lhWrap);

    // White box toggle – pouze pro font E (SVGDEurotype); skryté jinak, aktualizuje se při změně fontu
    wbGroup = el('div');
    wbGroup.className = 'toolbar-group';
    wbGroup.style.display = currentFont === 'SVGDEurotype' ? '' : 'none';
    wbBtn = el('button');
    wbBtn.className = 'toolbar-btn' + (currentWhtBg ? ' active' : '');
    wbBtn.title = 'Bílé pozadí pod textem (jen neprázdné řádky)';
    wbBtn.textContent = currentWhtBg ? '☑' : '☐';
    wbBtn.style.fontSize = '14px';
    wbBtn.onclick = () => {
        const next = !(getFieldStyle(slide, fieldName).whiteBg || false);
        setFieldStyle(slide, fieldName, 'whiteBg', next);
        wbBtn.classList.toggle('active', next);
        wbBtn.textContent = next ? '☑' : '☐';
        renderCurrentSlide();
    };
    wbGroup.append(wbBtn);
    toolbar.append(wbGroup);

    // Text color picker – 4 colors
    const colorWrap = el('div');
    colorWrap.className = 'toolbar-group';
    const currentColor = fs.color || null;
    const colorOptions = [
        ['#000000', 'Černá'],
        ['#ffffff', 'Bílá'],
        ['#0bd26f', 'Zelená'],
        ['#ffa6d1', 'Růžová'],
    ];
    colorOptions.forEach(([hex, name]) => {
        const btn = el('button');
        btn.className = 'toolbar-btn toolbar-color-btn' + (currentColor === hex ? ' active' : '');
        btn.title = name;
        btn.style.cssText = `background:${hex};width:18px;height:18px;border-radius:50%;padding:0;border:2px solid ${currentColor === hex ? '#333' : 'transparent'}`;
        btn.onclick = () => {
            const isSame = getFieldStyle(slide, fieldName).color === hex;
            setFieldStyle(slide, fieldName, 'color', isSame ? null : hex);
            colorWrap.querySelectorAll('.toolbar-color-btn').forEach((b, i) => {
                const isActive = !isSame && colorOptions[i][0] === hex;
                b.classList.toggle('active', isActive);
                b.style.border = `2px solid ${isActive ? '#333' : 'transparent'}`;
            });
            renderCurrentSlide();
        };
        colorWrap.append(btn);
    });
    toolbar.append(colorWrap);

    return toolbar;
}

async function runAiRefine(slide, typeDef, instruction) {
    const mainField = typeDef.fields.find(f => f.type === 'textarea' && f.required);
    if (!mainField || !slide.fields[mainField.name]) return;
    try {
        const res = await fetch('api/ai-refine.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: slide.fields[mainField.name], instruction, maxChars: mainField.maxChars })
        });
        const data = await res.json();
        if (data.refined) slide.fields[mainField.name] = data.refined;
        else if (data.error) alert('AI chyba: ' + data.error);
    } catch { alert('Nepodařilo se kontaktovat AI.'); }
}

// ── IG Frame ───────────────────────────────────────────────────────────────

function buildIgFrame() {
    const frame = document.getElementById('ig-frame');
    frame.innerHTML = `
        <div class="ig-header">
            <div class="ig-avatar"></div>
            <div class="ig-user-info">
                <div class="ig-username">zelenebrno</div>
                <div class="ig-location">Brno</div>
            </div>
            <div class="ig-more">•••</div>
        </div>
        <div class="carousel-wrapper">
            <div class="carousel-viewport" id="carousel-viewport">
                <div class="carousel-track" id="carousel-track"></div>
            </div>
            <div class="carousel-nav">
                <button class="carousel-nav-btn" id="nav-prev">&#8249;</button>
                <button class="carousel-nav-btn" id="nav-next">&#8250;</button>
            </div>
        </div>
        <div class="ig-dots" id="ig-dots"></div>
        <div class="ig-actions">
            <svg class="ig-action-icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            <svg class="ig-action-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <svg class="ig-action-icon" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            <svg class="ig-action-icon ig-action-save" viewBox="0 0 24 24"><polygon points="19 21 12 16 5 21 5 3 19 3 19 21"></polygon></svg>
        </div>
        <div class="ig-caption">
            <span class="ig-handle">zelenebrno</span>
            <span class="ig-text">Nový carousel post...</span>
        </div>`;

    document.getElementById('nav-prev').onclick = () => goToSlide(state.currentSlide - 1);
    document.getElementById('nav-next').onclick = () => goToSlide(state.currentSlide + 1);

    buildCarouselTrack();
    bindSwipe();
}

function buildCarouselTrack() {
    const track = document.getElementById('carousel-track');
    if (!track) return;
    track.innerHTML = '';
    state.slides.forEach((_, i) => {
        const s = el('div');
        s.id = `slide-preview-${i}`;
        s.style.cssText = 'flex-shrink:0;width:100%;height:100%';
        track.append(s);
    });
    buildDots();
    updateNavBtns();
    updateCarouselFormat();
}

function buildDots() {
    const dots = document.getElementById('ig-dots');
    if (!dots) return;
    dots.innerHTML = '';
    state.slides.forEach((_, i) => {
        const d = el('div');
        d.className = 'ig-dot' + (i === state.currentSlide ? ' active' : '');
        d.onclick = () => goToSlide(i);
        dots.append(d);
    });
}

function updateCarouselFormat() {
    const vp = document.getElementById('carousel-viewport');
    const frame = document.getElementById('ig-frame');
    if (!vp) return;
    vp.className = 'carousel-viewport';
    const cls = { 'ig-portrait': '', 'ig-square': 'format-square', 'ig-stories': 'format-stories', facebook: 'format-facebook' }[state.format];
    if (cls) vp.classList.add(cls);
    if (frame) {
        frame.classList.toggle('format-stories', state.format === 'ig-stories');
        if (state.format === 'ig-stories') {
            const previewArea = document.querySelector('.preview-area');
            const availH = (previewArea?.clientHeight || 600) - 32;
            const w = Math.round(availH * 9 / 16);
            frame.style.width = w + 'px';
            frame.style.height = availH + 'px';
        } else {
            frame.style.width = '';
            frame.style.height = '';
        }
    }
    // Swap CTA url default text based on format
    state.slides.forEach(slide => {
        if (slide.type !== 'cta') return;
        if (state.format === 'ig-stories' && slide.fields.url === 'Odkaz v biu') {
            slide.fields.url = 'Odkaz';
        } else if (state.format !== 'ig-stories' && slide.fields.url === 'Odkaz') {
            slide.fields.url = 'Odkaz v biu';
        }
    });
    updateStoriesOverlay();
    renderAll();
}

function updateStoriesOverlay() {
    const wrapper = document.querySelector('.carousel-wrapper');
    if (!wrapper) return;
    const existing = document.getElementById('stories-overlay');
    if (existing) existing.remove();

    if (state.format !== 'ig-stories') return;

    const n = state.slides.length;
    const cur = state.currentSlide;

    const barsHtml = Array.from({ length: n }, (_, i) =>
        `<div class="stories-bar"><div class="stories-bar-fill" style="width:${i < cur ? '100%' : i === cur ? '40%' : '0%'}"></div></div>`
    ).join('');

    const overlay = el('div');
    overlay.id = 'stories-overlay';
    overlay.className = 'stories-overlay';
    overlay.innerHTML = `
        <div class="stories-overlay-top">
            <div class="stories-progress">${barsHtml}</div>
            <div class="stories-user-row">
                <div class="stories-avatar-sm"></div>
                <div class="stories-user-info">
                    <span class="stories-username-sm">zelenebrno</span>
                    <span class="stories-time-sm">Teď</span>
                </div>
                <div class="stories-actions">
                    <span class="stories-more">•••</span>
                    <span class="stories-close">✕</span>
                </div>
            </div>
        </div>
        <div class="stories-overlay-bottom">
            <div class="stories-reply-row">
                <div class="stories-reply-input">Odpovědět zelenebrno...</div>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="white"/></svg>
            </div>
        </div>`;
    wrapper.appendChild(overlay);
}

function goToSlide(i) {
    if (i < 0 || i >= state.slides.length) return;
    state.currentSlide = i;
    const track = document.getElementById('carousel-track');
    if (track) track.style.transform = `translateX(-${i * 100}%)`;
    document.querySelectorAll('.ig-dot').forEach((d, idx) => d.classList.toggle('active', idx === i));
    updateNavBtns();
    if (state.format === 'ig-stories') updateStoriesOverlay();
    renderTipsPanel();
}

function updateNavBtns() {
    const prev = document.getElementById('nav-prev');
    const next = document.getElementById('nav-next');
    if (prev) prev.disabled = state.currentSlide === 0;
    if (next) next.disabled = state.currentSlide === state.slides.length - 1;
}

function bindSwipe() {
    const vp = document.getElementById('carousel-viewport');
    if (!vp) return;
    let startX = 0;

    vp.addEventListener('mousedown', e => { state.dragging = true; startX = e.clientX; });
    vp.addEventListener('mousemove', e => {
        if (!state.dragging) return;
        const diff = e.clientX - startX;
        const track = document.getElementById('carousel-track');
        if (track) { track.style.transition = 'none'; track.style.transform = `translateX(calc(${-state.currentSlide * 100}% + ${diff}px))`; }
    });
    const endDrag = e => {
        if (!state.dragging) return;
        state.dragging = false;
        const diff = (e.clientX ?? e.changedTouches?.[0]?.clientX ?? startX) - startX;
        const track = document.getElementById('carousel-track');
        if (track) track.style.transition = '';
        if (diff < -50) goToSlide(state.currentSlide + 1);
        else if (diff > 50) goToSlide(state.currentSlide - 1);
        else goToSlide(state.currentSlide);
    };
    vp.addEventListener('mouseup', endDrag);
    vp.addEventListener('mouseleave', endDrag);
    vp.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    vp.addEventListener('touchend', e => {
        const diff = e.changedTouches[0].clientX - startX;
        if (diff < -50) goToSlide(state.currentSlide + 1);
        else if (diff > 50) goToSlide(state.currentSlide - 1);
    });
}

// ── Render ─────────────────────────────────────────────────────────────────

function slideStripes(slide, i) {
    return (state.showStripes && slide.showStripes) ? (state.stripes[i] || []) : [];
}

function isFbFormat() {
    return state.format === 'facebook' || state.format === 'ig-stories';
}

function renderAll() {
    const forceHideArrow = isFbFormat();
    const isStories = state.format === 'ig-stories';
    state.slides.forEach((slide, i) => {
        const slideEl = document.getElementById(`slide-preview-${i}`);
        if (!slideEl) return;
        renderSlide(slideEl, slide, { stripes: slideStripes(slide, i), showTram: state.showTram, forceHideArrow, isStories, logoUrl: state.logo });
    });
    goToSlide(state.currentSlide);
    saveState();
}

function renderCurrentSlide() {
    const i = state.currentSlide;
    const slide = state.slides[i];
    const slideEl = document.getElementById(`slide-preview-${i}`);
    if (!slideEl) return;
    renderSlide(slideEl, slide, { stripes: slideStripes(slide, i), showTram: state.showTram, forceHideArrow: isFbFormat(), isStories: state.format === 'ig-stories', logoUrl: state.logo });
}

function isSlideModified(slide, index) {
    const defaults = makeSlide(slide.type, index).fields;
    return Object.entries(slide.fields).some(([key, val]) => {
        if (!val) return false;
        return val !== defaults[key];
    });
}

function resizeSlides(n) {
    const current = state.slides.length;
    if (n > current) {
        for (let i = current; i < n; i++) {
            state.slides.push(makeSlide(DEFAULT_SEQUENCE[i] || 'content', i));
            state.stripes[i] = generateStripes();
        }
    } else {
        state.slides = state.slides.slice(0, n);
    }
    if (state.currentSlide >= n) state.currentSlide = n - 1;
}

// ── Export ─────────────────────────────────────────────────────────────────

function bindGlobalEvents() {
    document.getElementById('btn-export-current').onclick = async () => {
        const slideEl = document.getElementById(`slide-preview-${state.currentSlide}`);
        if (!slideEl) return;
        const btn = document.getElementById('btn-export-current');
        btn.disabled = true; btn.textContent = 'Exportuji...';
        try { await exportSlide(slideEl, state.format, state.currentSlide, exportPrefix()); }
        finally { btn.disabled = false; btn.textContent = 'Exportovat slide'; }
    };

    document.getElementById('btn-export-all').onclick = async () => {
        const slideEls = state.slides.map((_, i) => document.getElementById(`slide-preview-${i}`)).filter(Boolean);
        const btn = document.getElementById('btn-export-all');
        btn.disabled = true;
        try {
            await exportAllSlides(slideEls, state.format, (done, total) => {
                btn.textContent = `Exportuji ${done}/${total}...`;
            }, exportPrefix());
        } finally { btn.disabled = false; btn.textContent = 'Exportovat vše ZIP'; }
    };

    document.getElementById('btn-copy-json').onclick = async () => {
        const btn = document.getElementById('btn-copy-json');
        btn.disabled = true;
        btn.textContent = 'Nahrávám obrázky...';

        async function uploadIfNeeded(dataUrl) {
            if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
            const res = await fetch('upload.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: dataUrl }),
            });
            const json = await res.json();
            return json.url || dataUrl;
        }

        try {
            const FORMAT_SIZES = {
                'ig-portrait': { width: 1080, height: 1350 },
                'ig-square':   { width: 1080, height: 1080 },
                'ig-stories':  { width: 1080, height: 1920 },
                'facebook':    { width: 1200, height: 900  },
            };

            // Upload base64 photos, then enrich all slide data
            const uploadedSlides = await Promise.all(state.slides.map(async s => ({
                ...s,
                fields: {
                    ...s.fields,
                    ...(s.fields.photoData   ? { photoData:   await uploadIfNeeded(s.fields.photoData)   } : {}),
                    ...(s.fields.photoBefore ? { photoBefore: await uploadIfNeeded(s.fields.photoBefore) } : {}),
                    ...(s.fields.photoAfter  ? { photoAfter:  await uploadIfNeeded(s.fields.photoAfter)  } : {}),
                },
            })));

            const payload = {
                format: state.format,
                ...FORMAT_SIZES[state.format],
                logo: state.logo,
                slides: buildEnrichedSlides(uploadedSlides),
            };
            await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
            btn.textContent = '✓ Zkopírováno!';
            setTimeout(() => { btn.textContent = 'Kopírovat JSON pro Remotion'; }, 2000);
        } catch (e) {
            btn.textContent = '✗ Chyba!';
            setTimeout(() => { btn.textContent = 'Kopírovat JSON pro Remotion'; }, 3000);
            console.error('JSON export failed:', e);
        } finally {
            btn.disabled = false;
        }
    };

    document.getElementById('btn-clear-state').onclick = () => {
        if (!confirm('Vymazat celý obsah a začít znovu?')) return;
        clearSavedState();
        initSlides(5);
        buildSidebar();
        buildIgFrame();
        renderAll();
    };

    document.getElementById('input-import-json').onchange = function() {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                __importState(JSON.parse(e.target.result));
            } catch (err) {
                alert('Chyba při načítání JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
        this.value = '';
    };

    window.addEventListener('resize', () => {
        if (state.format === 'ig-stories') updateCarouselFormat();
    });
}

// ── Console import helper ───────────────────────────────────────────────────
// Usage: __importState(jsonString)
window.__importState = function(jsonString) {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    state.format = data.format || state.format;
    state.logo   = data.logo   || state.logo;
    state.slides = data.slides.map((s, i) => {
        const base = makeSlide(s.type, i);
        return {
            ...base,
            ...s,
            fields:      { ...base.fields,      ...s.fields },
            fieldStyles: { ...base.fieldStyles,  ...s.fieldStyles },
        };
    });
    state.stripes = {};
    state.slides.forEach((_, i) => { state.stripes[i] = generateStripes(); });
    state.currentSlide = 0;
    buildIgFrame();
    renderAll();
    buildSidebar();
    console.log(`Načteno ${state.slides.length} slidů.`);
};

function exportPrefix() {
    const first = state.slides[0];
    const raw = first?.fields?.title || first?.fields?.cta || '';
    return raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9áčďéěíňóřšťúůýžäöü ]/gi, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 30)
        .replace(/-+$/, '');
}

// ── Helpers ────────────────────────────────────────────────────────────────

function el(tag) { return document.createElement(tag); }

function makeSec(title) {
    const s = el('div'); s.className = 'sidebar-section';
    const t = el('div'); t.className = 'sidebar-section-title'; t.textContent = title;
    s.append(t);
    return s;
}

function makeRow(label) {
    const r = el('div'); r.className = 'form-row';
    const l = el('label'); l.textContent = label;
    r.append(l);
    return r;
}

function makeSelect(options, selected) {
    const s = el('select');
    Object.entries(options).forEach(([val, label]) => {
        const o = el('option'); o.value = val; o.textContent = label;
        if (val === selected) o.selected = true;
        s.append(o);
    });
    return s;
}

function makeCheckRow(label, checked, onChange) {
    const row = el('label'); row.className = 'checkbox-row';
    const chk = el('input'); chk.type = 'checkbox'; chk.checked = checked;
    chk.onchange = () => onChange(chk.checked);
    row.append(chk, document.createTextNode(label));
    return row;
}

// ── Tips panel ─────────────────────────────────────────────────────────────

const SLIDE_TIPS = {
    hero: {
        title: 'Slide 1: Úvodní hook',
        rules: [
            'Max 8–10 slov v nadpisu',
            'Začněte problémem, NE řešením',
            'Podnadpis přidává napětí',
        ],
        examples: {
            label: 'Návrhy hooků',
            cols: ['Nadpis', 'Podnadpis'],
            rows: [
                ['Víc pruhů, víc aut, stejné kolony',                        'Proč to tak je?'],
                ['30 % rozpočtu na silnice, 2 % na cyklostezky',             'A prý nejsou peníze'],
                ['Co opravdu pomáhá proti hluku',                            'A nejsou to protihluková okna'],
                ['Více než 1000 lidí v Brně podepsalo petici',               'Protože jsme řekli nahlas, co si všichni myslí'],
                ['5 věcí, které jsem zjistila jako zastupitelka',            'Když se jednalo o dopravě'],
                ['Po 4 letech v zastupitelstvu už vím, proč se věci nemění', 'A není to nedostatkem peněz'],
                ['Absurdní nápad na řešení parkování, kterému nikdo nevěřil','Dokud nezačal fungovat v Kodani'],
                ['Děti si prý nehrají venku a sedí jen u počítačů',          'A viděli jste, jak bezpečné jsou ulice?'],
                ['Proč si mladí v Brně nekoupí byt',                         'A není to tím, že málo pracují'],
            ],
        },
    },
    content: {
        title: 'Slide 2: Textový obsah',
        rules: [
            'Jedna myšlenka na slide',
            'Nadpis = tvrzení, text = vysvětlení',
            'Dlouhý text rozdělte na více slidů',
            'Krátké věty, max 3–4 řádky textu',
        ],
        examples: {
            label: 'Příklady (téma: Hluk)',
            cols: ['Nadpis', 'Text'],
            rows: [
                ['Co opravdu pomáhá?',    'Zpomalit auta. 50 km/h je 2× hlasitější než 30 km/h.'],
                ['Proč okna nefungují',   'Okna řeší následky, ne příčinu. A v létě je stejně otevřete.'],
                ['Co funguje jinde',      'Zóny 30, stromy podél silnic, tichý asfalt.'],
                ['Co navrhujeme',         '1. Rozšířit zóny 30\n2. Výsadba stromořadí\n3. Tichý povrch na hlavních tazích'],
            ],
        },
        examples2: {
            label: 'Příklady (téma: Parkování v Kodani)',
            cols: ['Nadpis', 'Text'],
            rows: [
                ['Co udělali?',       'Každý rok ubrali 2–3 % parkovacích míst v centru. Postupně. 40 let.'],
                ['Co se stalo',       'Lidé začali jezdit jinak. MHD, kola, pěšky. Obchody nezkrachovaly.'],
                ['Výsledek',          'O 50 % méně aut v centru. Vyšší tržby obchodů. Čistší vzduch.'],
                ['Proč to funguje',   'Lidé si poradí. Ale musí mít alternativu.'],
            ],
        },
    },
    quote: {
        title: 'Slide 3: Fotka s citací',
        rules: [
            'Citace max 15–20 slov',
            'Fotka z terénu, ne studiový portrét',
            'Uvést jméno + funkci',
        ],
        examples: {
            label: 'Příklady citací',
            cols: ['Typ', 'Příklad'],
            rows: [
                ['Osobní zkušenost',    '"Bydlím tady 20 let a nikdy to nebylo takhle špatné."'],
                ['Motivace kandidáta',  '"Rozhodla jsem se kandidovat, protože jsem už nechtěla jen přihlížet."'],
                ['Reakce na problém',   '"Každé ráno vezeme děti autem, protože jinak to nejde."'],
            ],
        },
    },
    image: {
        title: 'Slide 4: Obrázek s titulkem',
        rules: [
            'Fotka musí být výmluvná sama o sobě',
            'Titulek stručně kontextualizuje',
        ],
        examples: {
            label: 'Příklady',
            cols: ['Typ', 'Titulek', 'Popisek'],
            rows: [
                ['Dokumentace problému', 'Tady stával strom',             'Vykácen kvůli parkování. Náhrada? Žádná.'],
                ['Reportáž',             '200 lidí přišlo na setkání',    'A radnice tvrdí, že to lidi nezajímá.'],
                ['Vizualizace',          'Jak by to mohlo vypadat',       'Návrh od architektů z iniciativy XY.'],
            ],
        },
    },
    beforeafter: {
        title: 'Slide 5: Před / Po',
        rules: [
            'Obě fotky ideálně ze stejného úhlu',
            'Jasně označit PŘED a PO',
            'Nadpis pojmenovává změnu',
        ],
        examples: {
            label: 'Příklady',
            cols: ['Nadpis', 'Před', 'Po'],
            rows: [
                ['Kodaň 1980 vs. 2024',        'Ucpaná auta',      'Cyklostezky, pěší'],
                ['Jak by to mohlo vypadat', 'Současný stav',    'Vizualizace návrhu'],
            ],
        },
    },
    stat: {
        title: 'Slide 6: Statistika',
        rules: [
            'Velké číslo dominuje',
            'Jasná jednotka',
            'Krátký kontext',
        ],
        examples: {
            label: 'Příklady (číslo / jednotka / kontext)',
            cols: ['Číslo', 'Jednotka', 'Kontext'],
            rows: [
                ['8 °C',  'rozdíl teplot', 'mezi ulicí a parkem v létě'],
                ['−50 %', 'méně aut',      'v centru Kodaně za 40 let'],
                ['2×',    'hlasitější',    'je auto při 50 km/h než při 30 km/h'],
            ],
        },
    },
    cta: {
        title: 'Slide 7: Závěrečná výzva (CTA)',
        rules: [
            'Vždy obsahuje výzvu k akci',
            'Buďte konkrétní',
            'Jeden hlavní CTA',
        ],
        examples: {
            label: 'Příklady výzev',
            cols: ['Cíl', 'Text'],
            rows: [
                ['Sdílení',   'Pošli tomu, kdo řeší parkování ve tvé čtvrti'],
                ['Uložení',   'Ulož si, ať víš, co žádat od radnice'],
                ['Kombinace', 'Ulož si a pošli dál, ať to vidí víc lidí'],
                ['Diskuze',   'Napiš do komentáře: Jak to vypadá ve tvé ulici?'],
                ['Petice',    'Podepiš petici: odkaz v biu'],
            ],
        },
    },
};

function renderExamplesTable(ex) {
    if (!ex) return '';
    let html = `<div class="tips-section-title">${ex.label}</div>`;
    html += `<table class="tips-table"><thead><tr>${ex.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
    html += ex.rows.map(row =>
        `<tr>${row.map((cell, i) =>
            `<td class="tips-hook${i > 0 ? ' tips-sub' : ''}">${cell.replace(/\n/g, '<br>')}</td>`
        ).join('')}</tr>`
    ).join('');
    html += '</tbody></table>';
    return html;
}

function renderTipsPanel() {
    const panel = document.getElementById('tips-panel');
    if (!panel) return;
    const slide = state.slides[state.currentSlide];
    const tips = slide ? SLIDE_TIPS[slide.type] : null;

    if (!tips) {
        panel.innerHTML = '<p class="tips-empty">Pro tento typ slidu zatím nejsou tipy k dispozici.</p>';
        return;
    }

    let html = `<div class="tips-header">${tips.title}</div>`;

    if (tips.rules?.length) {
        html += '<div class="tips-section-title">Pravidla</div><ul class="tips-rules">';
        html += tips.rules.map(r => `<li>${r}</li>`).join('');
        html += '</ul>';
    }

    html += renderExamplesTable(tips.examples);
    if (tips.examples2) html += renderExamplesTable(tips.examples2);

    panel.innerHTML = html;
}

init();

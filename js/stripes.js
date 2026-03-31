// Decorative background shapes – dimensions in % of container

const AVOID_ZONES = [
    { x: [12, 88], y: [25, 72] },   // center text area
    { x: [ 0, 35], y: [82, 100] },  // logo bottom-left
    { x: [65, 100], y: [82, 100] }, // arrow bottom-right
];

// Size ranges in %: rect = [minW, maxW, minH, maxH], others = [minS, maxS] (square)
const SIZES = {
    large:  { rect: [20, 30, 5,  9], other: [12, 18] },
    medium: { rect: [12, 20, 3,  6], other: [7,  13] },
    small:  { rect: [7,  13, 2,  4], other: [4,   8] },
};

const COLOR_VALUES = { pink: '#ffa6d1', gray: '#d9d9d9' };

function rInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function weightedChoice(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [key, w] of Object.entries(weights)) {
        r -= w;
        if (r <= 0) return key;
    }
    return Object.keys(weights)[0];
}

function inAvoidZone(cx, cy) {
    return AVOID_ZONES.some(z =>
        cx > z.x[0] && cx < z.x[1] &&
        cy > z.y[0] && cy < z.y[1]
    );
}

// Build a shuffled grid of candidate positions along the edges (not center)
function buildCandidateGrid() {
    const cols = 7, rows = 9;
    const startX = -15, startY = -5;
    const totalW = 130, totalH = 110;
    const cellW = totalW / cols;
    const cellH = totalH / rows;
    const candidates = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cx = startX + (c + 0.5) * cellW;
            const cy = startY + (r + 0.5) * cellH;
            // Skip cells fully inside the center text zone
            if (cx > 14 && cx < 86 && cy > 22 && cy < 78) continue;
            candidates.push({ cx, cy });
        }
    }

    // Fisher-Yates shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates;
}

export function generateStripes() {
    const count = rInt(7, 10);
    const shapes = [];
    const placed = []; // centers of placed shapes for overlap check

    const TYPES   = ['rect', 'rect', 'rect', 'circle', 'triangle'];
    const MIN_DIST = 22; // minimum center-to-center distance in %

    // Pre-build a shuffled color pool: 75 % pink, 25 % gray
    const pinkCount = Math.round(count * 0.75);
    const colorPool = [
        ...Array(pinkCount).fill('pink'),
        ...Array(count - pinkCount).fill('gray'),
    ];
    for (let i = colorPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [colorPool[i], colorPool[j]] = [colorPool[j], colorPool[i]];
    }

    for (const cell of buildCandidateGrid()) {
        if (shapes.length >= count) break;

        // Small jitter within cell so it doesn't look like a rigid grid
        const cx = cell.cx + rFloat(-5, 5);
        const cy = cell.cy + rFloat(-5, 5);

        if (inAvoidZone(cx, cy)) continue;
        if (placed.some(p => Math.hypot(p.x - cx, p.y - cy) < MIN_DIST)) continue;

        const type    = TYPES[Math.floor(Math.random() * TYPES.length)];
        const sizeKey = weightedChoice({ large: 15, medium: 55, small: 30 });
        const sp      = SIZES[sizeKey];

        let w, h;
        if (type === 'rect') {
            w = rInt(sp.rect[0], sp.rect[1]);
            h = rInt(sp.rect[2], sp.rect[3]);
        } else {
            // circle and triangle: use only width, height handled by CSS aspect-ratio
            w = rInt(sp.other[0], sp.other[1]);
            h = w;
        }

        const rotation = type === 'circle' ? 0 : rInt(-45, 45);
        const color    = colorPool[shapes.length];

        shapes.push({ type, w, h, x: cx - w / 2, y: cy - h / 2, rotation, color });
        placed.push({ x: cx, y: cy });
    }

    return shapes;
}

export function renderStripes(container, stripes) {
    container.querySelectorAll('.stripe').forEach(s => s.remove());

    for (const s of stripes) {
        const col = COLOR_VALUES[s.color] || COLOR_VALUES.pink;
        let el;

        el = document.createElement('div');
        el.className = 'stripe stripe-' + s.type;
        el.style.background = col;

        if (s.type === 'circle') {
            el.style.borderRadius = '50%';
            // aspect-ratio ensures a true circle regardless of slide proportions
            el.style.aspectRatio  = '1 / 1';
        } else if (s.type === 'triangle') {
            el.style.clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        }

        el.style.position        = 'absolute';
        el.style.width           = s.w + '%';
        // For circles, height is driven by aspect-ratio; set it for other shapes
        if (s.type !== 'circle') el.style.height = s.h + '%';
        el.style.left            = s.x + '%';
        el.style.top             = s.y + '%';
        el.style.transform       = `rotate(${s.rotation}deg)`;
        el.style.transformOrigin = 'center center';
        el.style.zIndex          = '1';
        el.style.pointerEvents   = 'none';

        container.appendChild(el);
    }
}

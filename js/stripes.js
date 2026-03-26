// All dimensions in % of container so preview and export scale correctly

const stripesConfig = {
    count: { min: 5, max: 8 },
    // width/height in % of container
    sizes: {
        large:  { width: [22, 32], height: [6, 10] },
        medium: { width: [14, 22], height: [4,  7] },
        small:  { width: [ 8, 14], height: [3,  5] }
    },
    rotations: [[-40, -15], [15, 40]],  // two ranges, picked randomly per stripe
    // stripes can appear anywhere except center text zone
    spawnZones: [
        { x: [-20,  8],  y: [ 0, 95] },   // left edge
        { x: [ 75, 108], y: [ 0, 95] },   // right edge
        { x: [  5, 90],  y: [-8, 12] },   // top strip
        { x: [  5, 90],  y: [80, 105] },  // bottom strip
        { x: [-15, 15],  y: [10, 80] },   // left overlap
        { x: [ 70, 105], y: [10, 80] },   // right overlap
    ],
    // center of stripe must not land in text/logo/arrow zones
    avoidZones: [
        { x: [12, 88], y: [25, 72] },    // center text area
        { x: [ 0, 35], y: [82, 100] },   // logo bottom-left
        { x: [65, 100], y: [82, 100] },  // arrow bottom-right
    ]
};

function rInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

function inAvoidZone(cx, cy, avoidZones) {
    return avoidZones.some(z =>
        cx > z.x[0] && cx < z.x[1] &&
        cy > z.y[0] && cy < z.y[1]
    );
}

export function generateStripes() {
    const count = rInt(stripesConfig.count.min, stripesConfig.count.max);
    const stripes = [];
    let attempts = 0;

    while (stripes.length < count && attempts < count * 8) {
        attempts++;
        const zones = stripesConfig.spawnZones;
        const zone = zones[Math.floor(Math.random() * zones.length)];
        const sizeKey = weightedChoice({ large: 20, medium: 50, small: 30 });
        const size = stripesConfig.sizes[sizeKey];

        const w = rInt(size.width[0],  size.width[1]);
        const h = rInt(size.height[0], size.height[1]);
        const x = rInt(zone.x[0], zone.x[1]);
        const y = rInt(zone.y[0], zone.y[1]);
        const rotRange = stripesConfig.rotations[Math.floor(Math.random() * stripesConfig.rotations.length)];
        const rotation = rInt(rotRange[0], rotRange[1]);

        // check center of stripe
        const cx = x + w / 2;
        const cy = y + h / 2;

        if (!inAvoidZone(cx, cy, stripesConfig.avoidZones)) {
            stripes.push({ w, h, x, y, rotation });
        }
    }

    return stripes;
}

export function renderStripes(container, stripes) {
    container.querySelectorAll('.stripe').forEach(s => s.remove());
    for (const s of stripes) {
        const el = document.createElement('div');
        el.className = 'stripe';
        el.style.cssText = `
            width: ${s.w}%;
            height: ${s.h}%;
            left: ${s.x}%;
            top: ${s.y}%;
            transform: rotate(${s.rotation}deg);
            transform-origin: left center;
        `;
        container.appendChild(el);
    }
}

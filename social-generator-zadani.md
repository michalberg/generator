# Social Slides Generator – Finální zadání

## Přehled projektu

Webová aplikace pro generování grafiky na sociální sítě ve vizuálním stylu Zelení Brno. PHP backend, vanilla JS frontend. Umožní vytvářet carousel posty s konzistentní vizuální identitou, živým náhledem ve stylu Instagramu a volitelným AI laděním textů.

---

## Technický stack

- Backend: PHP 8+
- Frontend: Vanilla JS, HTML, CSS
- Export obrázků: html-to-image nebo html2canvas
- ZIP export: JSZip
- Hosting: standardní PHP hosting

---

## Struktura projektu

```
/social-generator/
├── index.php              # Login stránka
├── app.php                # Hlavní aplikace (za heslem)
├── logout.php             # Odhlášení
├── config.php             # Heslo, API klíč (MIMO GIT)
├── api/
│   └── ai-refine.php      # Claude API pro ladění textu
├── assets/
│   └── css/
│       └── styles.css
├── templates/
│   └── templates.json     # Definice šablon a typů slidů
└── js/
    ├── app.js             # Hlavní logika aplikace
    ├── renderer.js        # Renderování slidů
    ├── stripes.js         # Generátor růžových pruhů
    └── export.js          # Export PNG/ZIP
```

---

## Vizuální identita

### Barvy

```css
:root {
    --green-primary: #0bd26f;
    --pink-accent: #ffa6d1;
    --black: #000000;
    --white: #ffffff;
}
```

### Fonty (hostované na petice.online)

Fonty načítat z URL – není třeba uploadovat:

```css
@font-face {
    font-family: 'TuskerGrotesk';
    src: url('https://petice.online/fonty/TuskerGrotesk-3700Bold.woff2') format('woff2'),
         url('https://petice.online/fonty/TuskerGrotesk-3700Bold.woff') format('woff');
    font-weight: 700;
    font-style: normal;
}

@font-face {
    font-family: 'UrbanGrotesk';
    src: url('https://petice.online/fonty/Urban-Grotesk-Regular.otf') format('opentype');
    font-weight: 400;
    font-style: normal;
}

@font-face {
    font-family: 'UrbanGrotesk';
    src: url('https://petice.online/fonty/Urban-Grotesk-Medium.otf') format('opentype');
    font-weight: 500;
    font-style: normal;
}

@font-face {
    font-family: 'UrbanGrotesk';
    src: url('https://petice.online/fonty/Urban-Grotesk-Semibold.otf') format('opentype');
    font-weight: 600;
    font-style: normal;
}

@font-face {
    font-family: 'UrbanGrotesk';
    src: url('https://petice.online/fonty/Urban-Grotesk-Bold.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
}

@font-face {
    font-family: 'SVGDEurotype';
    src: url('https://petice.online/fonty/SVGD-Eurotype-Soft-Demi.otf') format('opentype');
    font-weight: 600;
    font-style: italic;
}
```

### Použití fontů

| Účel | Font | CSS |
|------|------|-----|
| Velké nadpisy | TuskerGrotesk 700 | `font-family: 'TuskerGrotesk'; text-transform: uppercase;` |
| Běžný text | UrbanGrotesk 400/500 | `font-family: 'UrbanGrotesk';` |
| Kurzíva, citace, "Brno" | SVGDEurotype | `font-family: 'SVGDEurotype'; font-style: italic;` |
| Labely, tagy | UrbanGrotesk 600 | `font-family: 'UrbanGrotesk'; font-weight: 600; text-transform: uppercase;` |

### Logo

Načítat z URL: `https://petice.online/logo-zeleni-brno.png`

Alternativně sestavit z fontů:
- "ZELENÍ" = TuskerGrotesk, bílá
- "Brno" = SVGDEurotype italic, černá

---

## Formáty výstupu

| Formát | Rozměry | Poměr |
|--------|---------|-------|
| Instagram post | 1080×1080 px | 1:1 |
| Instagram post (4:5) | 1080×1350 px | 4:5 |
| Instagram Stories | 1080×1920 px | 9:16 |
| Facebook post | 1200×630 px | ~1.9:1 |

Výchozí formát: **Instagram post 4:5 (1080×1350)**

---

## Autentizace

### config.php

```php
<?php
define('APP_PASSWORD', 'tajneheslo123');
define('CLAUDE_API_KEY', 'sk-ant-...');
define('SESSION_TIMEOUT', 1800);
```

### index.php

```php
<?php
session_start();
require_once 'config.php';

$error = '';

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    header('Location: app.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['password']) && $_POST['password'] === APP_PASSWORD) {
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
        header('Location: app.php');
        exit;
    } else {
        $error = 'Nesprávné heslo';
    }
}
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Social Generator – Přihlášení</title>
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body class="login-page">
    <div class="login-box">
        <h1>Social Generator</h1>
        <form method="POST">
            <?php if ($error): ?>
                <div class="error"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>
            <input type="password" name="password" placeholder="Heslo" required autofocus>
            <button type="submit">Vstoupit</button>
        </form>
    </div>
</body>
</html>
```

### Ochrana app.php

```php
<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: index.php');
    exit;
}

if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time'] > SESSION_TIMEOUT)) {
    session_destroy();
    header('Location: index.php?timeout=1');
    exit;
}

$_SESSION['login_time'] = time();
?>
```

### logout.php

```php
<?php
session_start();
session_destroy();
header('Location: index.php');
exit;
```

---

## Hlavní rozhraní

### Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│  Social Generator                                    [Odhlásit se]     │
├─────────────────────────┬──────────────────────────────────────────────┤
│                         │                                              │
│  Formát: [▼ IG 4:5    ] │    ┌─────────────────────────────────┐       │
│                         │    │  ┌─────┐                        │       │
│  Počet slidů: [5]       │    │  │ ava │ zelenibrno             │       │
│                         │    │  └─────┘ Brno                   │       │
│  ───────────────────    │    ├─────────────────────────────────┤       │
│  VZHLED                 │    │                                 │       │
│  ☑ Růžové pruhy         │    │                                 │       │
│  [🎲 Přegenerovat]      │    │      ŽIVÝ NÁHLED SLIDU          │       │
│                         │    │      (Instagram frame)          │       │
│  ☐ Tramvajový pruh      │    │                                 │       │
│                         │    │                                 │       │
│  ───────────────────    │    │                                 │       │
│  SLIDE 1 (hero)         │    ├─────────────────────────────────┤       │
│  Typ: [▼ Hero hook   ]  │    │         ● ○ ○ ○ ○               │       │
│                         │    │  ♡  💬  ➤                       │       │
│  Nadpis:                │    │  zelenibrno Popis...            │       │
│  ┌────────────────────┐ │    └─────────────────────────────────┘       │
│  │ BUDE BRNO BEZ...   │ │                                              │
│  └────────────────────┘ │              ← 1/5 →                         │
│  35/60 znaků ✓          │                                              │
│  [🪄 Vyladit s AI]      │    ──────────────────────────────────────    │
│                         │    [Exportovat slide]  [Exportovat vše ZIP]  │
│  Podnadpis (volitelný): │                                              │
│  ┌────────────────────┐ │                                              │
│  │                    │ │                                              │
│  └────────────────────┘ │                                              │
│  0/100 znaků ✓          │                                              │
│                         │                                              │
│  ───────────────────    │                                              │
│  SLIDE 2 (obsah)        │                                              │
│  ...                    │                                              │
└─────────────────────────┴──────────────────────────────────────────────┘
```

### Levý panel – nastavení

**Globální nastavení:**
- Dropdown: Formát (IG 1:1 / IG 4:5 / IG Stories / Facebook)
- Number input: Počet slidů (1–10)

**Vzhled:**
- Checkbox: "Růžové pruhy" (výchozí: zapnuto)
- Tlačítko: "🎲 Přegenerovat pruhy" (aktivní jen když checkbox zapnut)
- Checkbox: "Tramvajový pruh" (výchozí: vypnuto)

**Pro každý slide:**
- Dropdown: Typ slidu (Hero / Obsah / Citace s fotkou / Statistika / CTA)
- Dynamická pole podle typu (viz níže)
- Počítadlo znaků u každého pole
- Tlačítko "🪄 Vyladit s AI"

### Pravý panel – náhled

**Instagram Frame Preview** – náhled vypadá jako skutečný IG post:
- Header s avatarem a @zelenibrno
- Slide v rámečku
- Tečky indikující počet slidů
- Ikonky (srdce, komentář, sdílet)
- Caption area

**Navigace:**
- Šipky ← → pro přepínání slidů
- Kliknutí na tečky
- Swipe gesto (drag)

### Spodní lišta

- "Exportovat aktuální slide" → PNG
- "Exportovat vše" → ZIP

---

## Typy slidů

### 1. Hero (první slide)

**Účel:** Hook – zastavit scroll

**Pozadí:** Zelená (#0bd26f)

**Prvky:**
- Velký nadpis (TuskerGrotesk, černá, uppercase, centrovaný)
- Volitelně podnadpis
- Logo vlevo dole
- Šipka vpravo dole
- Růžové pruhy (pokud zapnuty)

**Pole:**
| Pole | Max znaků | Povinné |
|------|-----------|---------|
| Nadpis | 60 | Ano |
| Podnadpis | 100 | Ne |

### 2. Obsah (informační slide)

**Účel:** Vysvětlení, argumenty, fakta

**Pozadí:** Bílá (#ffffff) nebo Zelená (#0bd26f)

**Prvky:**
- Nadpis nahoře
- Textový blok nebo seznam bodů
- Logo vlevo dole
- Šipka vpravo dole

**Pole:**
| Pole | Max znaků | Povinné |
|------|-----------|---------|
| Nadpis | 50 | Ano |
| Text | 250 | Ano |
| Pozadí | – | Dropdown: Zelená/Bílá |

### 3. Citace s fotkou

**Účel:** Personalizace, lidský element

**Pozadí:** Zelená s fotkou osoby

**Prvky:**
- Fotka (upload nebo placeholder)
- Citace v zeleném highlight boxu
- Jméno a funkce autora
- Logo vlevo dole
- Šipka vpravo dole

**Pole:**
| Pole | Max znaků | Povinné |
|------|-----------|---------|
| Citace | 150 | Ano |
| Jméno | 40 | Ano |
| Funkce | 50 | Ne |
| Fotka | – | Upload (volitelné) |

### 4. Statistika

**Účel:** Důraz na konkrétní číslo/data

**Pozadí:** Zelená nebo Bílá

**Prvky:**
- Velké číslo (TuskerGrotesk, 80–100px)
- Popisek pod číslem
- Logo vlevo dole
- Šipka vpravo dole

**Pole:**
| Pole | Max znaků | Povinné |
|------|-----------|---------|
| Číslo | 10 | Ano |
| Jednotka | 15 | Ne (např. "%", "tis.") |
| Popisek | 80 | Ano |
| Pozadí | – | Dropdown: Zelená/Bílá |

### 5. CTA (poslední slide)

**Účel:** Výzva k akci

**Pozadí:** Zelená (#0bd26f)

**Prvky:**
- Velký CTA text (TuskerGrotesk)
- URL nebo hashtag v bílém boxu
- Logo vlevo dole
- **BEZ šipky** (signalizuje konec)

**Pole:**
| Pole | Max znaků | Povinné |
|------|-----------|---------|
| CTA text | 80 | Ano |
| URL/hashtag | 50 | Ne |

---

## Růžové pruhy – dynamický systém

### Parametry generátoru

```javascript
const stripesConfig = {
    count: { min: 4, max: 6 },
    
    sizes: {
        large:  { width: [140, 180], height: [45, 60] },
        medium: { width: [100, 140], height: [35, 50] },
        small:  { width: [60, 100],  height: [25, 40] }
    },
    
    rotation: { min: -35, max: -20 },
    
    // Zóny kde se pruhy mohou objevit (% od okraje)
    spawnZones: [
        { side: 'left',   x: [-15, 5],   y: [5, 85] },
        { side: 'right',  x: [85, 115],  y: [5, 85] },
        { side: 'top',    x: [10, 80],   y: [-10, 15] },
        { side: 'bottom', x: [10, 80],   y: [75, 100] }
    ],
    
    // Zóny kam pruhy NESMÍ zasahovat
    avoidZones: [
        { x: [15, 85], y: [20, 75] },   // střed (text)
        { x: [0, 30],  y: [80, 100] },  // logo
        { x: [70, 100], y: [80, 100] }  // šipka
    ]
};
```

### Funkce generátoru

```javascript
function generateStripes(config) {
    const count = randomInt(config.count.min, config.count.max);
    const stripes = [];
    
    for (let i = 0; i < count; i++) {
        // Náhodně vybrat zónu
        const zone = randomChoice(config.spawnZones);
        
        // Náhodně vybrat velikost (více středních)
        const sizeKey = weightedChoice({large: 20, medium: 50, small: 30});
        const size = config.sizes[sizeKey];
        
        const stripe = {
            width: randomInt(size.width[0], size.width[1]),
            height: randomInt(size.height[0], size.height[1]),
            x: randomInt(zone.x[0], zone.x[1]),
            y: randomInt(zone.y[0], zone.y[1]),
            rotation: randomInt(config.rotation.min, config.rotation.max)
        };
        
        // Ověřit že nezasahuje do avoid zones
        if (!intersectsAvoidZones(stripe, config.avoidZones)) {
            stripes.push(stripe);
        }
    }
    
    return stripes;
}
```

### Uložení stavu

Vygenerované pruhy uložit pro každý slide zvlášť, aby zůstaly konzistentní při editaci textu. Přegenerovat jen na explicitní klik.

---

## Instagram Frame Preview

### HTML struktura

```html
<div class="ig-frame">
    <!-- Header -->
    <div class="ig-header">
        <div class="ig-avatar"></div>
        <div class="ig-user-info">
            <div class="ig-username">zelenibrno</div>
            <div class="ig-location">Brno</div>
        </div>
        <div class="ig-more">•••</div>
    </div>
    
    <!-- Carousel viewport -->
    <div class="carousel-viewport">
        <div class="carousel-track">
            <!-- Slidy se renderují zde -->
        </div>
    </div>
    
    <!-- Dots -->
    <div class="ig-dots">
        <!-- Generováno JS podle počtu slidů -->
    </div>
    
    <!-- Actions -->
    <div class="ig-actions">
        <svg class="ig-heart">...</svg>
        <svg class="ig-comment">...</svg>
        <svg class="ig-share">...</svg>
        <svg class="ig-save">...</svg>
    </div>
    
    <!-- Caption -->
    <div class="ig-caption">
        <span class="ig-handle">zelenibrno</span>
        <span class="ig-text">Popis příspěvku...</span>
    </div>
</div>
```

### CSS pro frame

```css
.ig-frame {
    width: 420px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

.ig-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 10px;
    border-bottom: 1px solid #efefef;
}

.ig-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(45deg, #0bd26f, #ffa6d1);
}

.ig-username {
    font-weight: 600;
    font-size: 14px;
}

.ig-location {
    font-size: 12px;
    color: #8e8e8e;
}

.carousel-viewport {
    width: 420px;
    aspect-ratio: 4/5; /* nebo 1/1 podle formátu */
    overflow: hidden;
    position: relative;
}

.carousel-track {
    display: flex;
    height: 100%;
    transition: transform 0.3s ease;
}

.ig-dots {
    display: flex;
    justify-content: center;
    gap: 4px;
    padding: 12px;
}

.ig-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #dbdbdb;
}

.ig-dot.active {
    background: #0095f6;
}

.ig-actions {
    display: flex;
    gap: 16px;
    padding: 8px 16px;
}

.ig-caption {
    padding: 0 16px 16px;
    font-size: 14px;
}

.ig-handle {
    font-weight: 600;
    margin-right: 4px;
}
```

### Swipe interakce

```javascript
let startX = 0;
let isDragging = false;
let currentSlide = 0;

viewport.addEventListener('mousedown', e => {
    startX = e.clientX;
    isDragging = true;
});

viewport.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    track.style.transform = `translateX(${-currentSlide * slideWidth + diff}px)`;
});

viewport.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    const diff = e.clientX - startX;
    
    if (diff < -50 && currentSlide < totalSlides - 1) {
        currentSlide++;
    } else if (diff > 50 && currentSlide > 0) {
        currentSlide--;
    }
    
    goToSlide(currentSlide);
});
```

---

## Export obrázků

### Princip

1. Slide = HTML div s přesnými px rozměry
2. Skrýt IG frame chrome (header, dots, actions)
3. Použít html-to-image pro konverzi na PNG
4. Stáhnout nebo zabalit do ZIP

### Implementace

```javascript
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const exportSizes = {
    'ig-square': { width: 1080, height: 1080 },
    'ig-portrait': { width: 1080, height: 1350 },
    'ig-stories': { width: 1080, height: 1920 },
    'facebook': { width: 1200, height: 630 }
};

async function exportSlide(slideElement, filename, format) {
    await document.fonts.ready;
    
    const size = exportSizes[format];
    const scale = size.width / slideElement.offsetWidth;
    
    const dataUrl = await toPng(slideElement, {
        width: size.width,
        height: size.height,
        pixelRatio: 1,
        style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
        }
    });
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}

async function exportAllSlides(slides, format) {
    await document.fonts.ready;
    
    const zip = new JSZip();
    const size = exportSizes[format];
    
    for (let i = 0; i < slides.length; i++) {
        const dataUrl = await toPng(slides[i], {
            width: size.width,
            height: size.height,
            pixelRatio: 1
        });
        
        const base64 = dataUrl.split(',')[1];
        zip.file(`slide-${String(i + 1).padStart(2, '0')}.png`, base64, { base64: true });
    }
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'carousel.zip');
}
```

---

## AI ladění textu

### api/ai-refine.php

```php
<?php
session_start();
require_once '../config.php';

if (!isset($_SESSION['logged_in'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$text = $input['text'] ?? '';
$instruction = $input['instruction'] ?? 'zkrať';
$maxChars = $input['maxChars'] ?? 200;

if (empty(CLAUDE_API_KEY)) {
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

$systemPrompt = "Jsi copywriter pro sociální sítě politické strany Zelení. 
Upravuješ texty pro Instagram carousel.
Tón: energický, přímý, mladistvý, aktivistický.
Maximální délka výstupu: {$maxChars} znaků.
Vrať POUZE upravený text, nic jiného – žádné uvozovky, vysvětlení ani komentáře.";

$response = file_get_contents('https://api.anthropic.com/v1/messages', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => implode("\r\n", [
            'Content-Type: application/json',
            'x-api-key: ' . CLAUDE_API_KEY,
            'anthropic-version: 2023-06-01'
        ]),
        'content' => json_encode([
            'model' => 'claude-sonnet-4-20250514',
            'max_tokens' => 300,
            'system' => $systemPrompt,
            'messages' => [
                ['role' => 'user', 'content' => "Instrukce: {$instruction}\n\nPůvodní text:\n{$text}"]
            ]
        ])
    ]
]));

if ($response === false) {
    echo json_encode(['error' => 'API request failed']);
    exit;
}

$data = json_decode($response, true);
$refined = $data['content'][0]['text'] ?? $text;

echo json_encode(['refined' => trim($refined)]);
```

### Frontend

```javascript
async function refineText(text, instruction, maxChars) {
    const response = await fetch('api/ai-refine.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, instruction, maxChars })
    });
    
    if (!response.ok) {
        throw new Error('AI refinement failed');
    }
    
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error);
    }
    
    return data.refined;
}
```

### Instrukce pro dropdown

- "Zkrať na maximum znaků"
- "Přeformuluj úderněji"
- "Udělej z toho otázku"
- "Zjednodušuj"
- "Přidej emoji"
- "Formální → neformální"

---

## Validace textu

### Vizuální indikace

```css
.char-counter {
    font-size: 12px;
    margin-top: 4px;
}

.char-counter.ok {
    color: #0bd26f;
}

.char-counter.warning {
    color: #f59e0b;
}

.char-counter.error {
    color: #ef4444;
}

textarea.error {
    border-color: #ef4444;
    background: #fef2f2;
}
```

### Logika

```javascript
function updateCharCounter(textarea, counter, maxChars) {
    const length = textarea.value.length;
    counter.textContent = `${length}/${maxChars} znaků`;
    
    if (length > maxChars) {
        counter.className = 'char-counter error';
        textarea.classList.add('error');
    } else if (length > maxChars * 0.9) {
        counter.className = 'char-counter warning';
        textarea.classList.remove('error');
    } else {
        counter.className = 'char-counter ok';
        textarea.classList.remove('error');
    }
}
```

---

## Definice šablon (templates.json)

```json
{
    "templates": [
        {
            "id": "zeleni-default",
            "name": "Zelení – výchozí",
            "styles": {
                "background": "#0bd26f",
                "backgroundAlt": "#ffffff",
                "accent": "#ffa6d1",
                "text": "#000000",
                "textInverse": "#ffffff"
            },
            "logo": {
                "url": "https://petice.online/logo-zeleni-brno.png",
                "position": "bottom-left"
            },
            "slideTypes": {
                "hero": {
                    "name": "Hero (hook)",
                    "background": "primary",
                    "fields": [
                        { "name": "title", "label": "Nadpis", "type": "textarea", "maxChars": 60, "required": true },
                        { "name": "subtitle", "label": "Podnadpis", "type": "textarea", "maxChars": 100, "required": false }
                    ],
                    "hasArrow": true
                },
                "content": {
                    "name": "Obsah",
                    "background": "selectable",
                    "fields": [
                        { "name": "title", "label": "Nadpis", "type": "text", "maxChars": 50, "required": true },
                        { "name": "body", "label": "Text", "type": "textarea", "maxChars": 250, "required": true },
                        { "name": "background", "label": "Pozadí", "type": "select", "options": ["Zelená", "Bílá"], "required": true }
                    ],
                    "hasArrow": true
                },
                "quote": {
                    "name": "Citace s fotkou",
                    "background": "primary",
                    "fields": [
                        { "name": "quote", "label": "Citace", "type": "textarea", "maxChars": 150, "required": true },
                        { "name": "author", "label": "Jméno", "type": "text", "maxChars": 40, "required": true },
                        { "name": "role", "label": "Funkce", "type": "text", "maxChars": 50, "required": false },
                        { "name": "photo", "label": "Fotka", "type": "image", "required": false }
                    ],
                    "hasArrow": true
                },
                "stat": {
                    "name": "Statistika",
                    "background": "selectable",
                    "fields": [
                        { "name": "number", "label": "Číslo", "type": "text", "maxChars": 10, "required": true },
                        { "name": "unit", "label": "Jednotka", "type": "text", "maxChars": 15, "required": false },
                        { "name": "description", "label": "Popisek", "type": "textarea", "maxChars": 80, "required": true },
                        { "name": "background", "label": "Pozadí", "type": "select", "options": ["Zelená", "Bílá"], "required": true }
                    ],
                    "hasArrow": true
                },
                "cta": {
                    "name": "CTA (závěr)",
                    "background": "primary",
                    "fields": [
                        { "name": "cta", "label": "Výzva k akci", "type": "textarea", "maxChars": 80, "required": true },
                        { "name": "url", "label": "URL / hashtag", "type": "text", "maxChars": 50, "required": false }
                    ],
                    "hasArrow": false
                }
            }
        }
    ]
}
```

---

## Doporučená sekvence slidů

| # | Typ | Pozadí | Účel |
|---|-----|--------|------|
| 1 | Hero | Zelená | Hook – zastavit scroll |
| 2 | Obsah | Bílá | Problém / kontext |
| 3 | Obsah | Zelená | Řešení |
| 4 | Citace | Zelená | Lidský element |
| 5 | Statistika | Bílá | Podpora fakty |
| 6 | CTA | Zelená | Výzva k akci (BEZ šipky) |

**Pravidla:**
- Alternovat barvy pro vizuální rytmus
- Poslední slide vždy CTA (bez šipky)
- Maximum 10 slidů
- Optimum 5–7 slidů

---

## Priorita implementace

1. ✅ Login + session + logout
2. ✅ Základní UI layout
3. ✅ Načtení fontů z URL
4. ✅ Renderování slidu jako HTML/CSS
5. ✅ Instagram Frame Preview s navigací
6. ✅ Dynamické formuláře podle typu slidu
7. ✅ Živý náhled při psaní
8. ✅ Generátor růžových pruhů + přegenerování
9. ✅ Validace délky textu
10. ✅ Export PNG
11. ✅ Export ZIP
12. ✅ AI ladění textu
13. 🔮 (v2) AI ladění designu

---

## Poznámky pro implementaci

- **Fonty:** Vždy čekat na `document.fonts.ready` před exportem
- **Rozměry:** Slide div musí mít fixní px rozměry, ne %
- **Overflow:** Parent kontejner `overflow: hidden` pro pruhy přesahující okraj
- **Z-index:** Pruhy (1) → Obsah (5) → Logo, šipka (10)
- **Export:** Před exportem skrýt IG frame chrome, exportovat jen slide
- **Cross-origin fonty:** Možná bude potřeba CORS header na petice.online

# iOS Glassmorphic Document Scanner

An elegant, client-side document scanner featuring an iOS-inspired "bulged" glassmorphic UI. The platform accepts standard flat images and unselectable PDF documents, running advanced optical character recognition (OCR) natively inside the browser engine while preserving structural spacing, tabs, and columns.

## 🚀 Features

- **iOS Native Glassmorphism Architecture:** Uses advanced CSS backdrops, linear blur limits, and drop-shadow styling to achieve a authentic "bulged" 3D glass slab aesthetic.
- **Micro-Animations:** High-fidelity iOS spring-physics toggle mechanics for system configurations, along with hovering edge-shine reflections on action pill buttons.
- **Client-Side Document Processing:** - **Tesseract.js Engine Integration:** Utilizes automated page segmentation (`PSM.AUTO`) and structural character trackers (`preserve_interword_spaces`) to retain original text layouts.
  - **PDF.js Rasterizer:** Seamlessly renders unselectable binary PDF files into high-resolution viewport canvases directly within browser memory.
- **Persistent State Caching:** Saves systemic themes (Light/Dark mode) and active extracted text data via `localStorage` to safeguard configurations against accidental browser refreshes.
- **Classic Systemic Dark Mode:** Transforms native off-white layout variables to Apple-compliant deep grays (`#1c1c1e`) and dark card variants seamlessly.

## 🛠️ Tech Stack

- **Markup:** Semantic HTML5
- **Styling:** Modern CSS3 Variables / Keyframe Mechanics
- **Scripting:** Vanilla ECMAScript 6+
- **OCR Engine:** [Tesseract.js](https://tesseract.projectnaptha.com/) (v5 via CDN)
- **PDF Engine:** [PDF.js](https://mozilla.github.io/pdf.js/) (v3 via CDN)

## 📁 Repository Structure

```text
├── index.html        # App structure, layout containers, and core CDN integrations
├── style.css         # iOS systemic design framework, custom transitions, and themes
├── script.js        # OCR handlers, PDF processing pipelines, and state tracking
└── .gitignore        # Version control file exclusions

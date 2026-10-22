# MATTER. — AI Material Intelligence

> **"Understand what things are made of."**

MATTER is an architectural-grade, mobile-first web application for material identification and circular design intelligence. Developed for industrial designers, architects, material researchers, design students, and curious makers.

Using smartphone camera optics or image uploads, MATTER analyzes physical objects, furniture, finishes, and everyday hardware. Powered by Google Gemini multimodal vision, it identifies likely materials, explains mechanical and environmental properties, evaluates sustainability and municipal recycling pathways, and suggests creative circular redesign strategies.

---

## 1. Key Features

- **Live Camera Hardware Integration**: Built directly on modern Web APIs (`navigator.mediaDevices.getUserMedia`) with rear-camera default (`facingMode: { ideal: "environment" }`), touch-toggle flashlight support, lens flipping, and native image upload fallbacks for unsupported browsers or denied permissions.
- **Multimodal AI Vision**: Analyzes physical specular reflection, surface grain, mold parting lines, fasteners, and micro-texture using server-side **Google Gemini 3.8 Flash**.
- **Architectural Specification Sheets**:
  - `01 / IDENTIFICATION`: Primary material, secondary coatings/fasteners, broad taxonomy, and qualitative confidence (HIGH / MODERATE / LOW).
  - `02 / MATERIAL PROPERTIES`: Structural behavior, elasticity vs rigidity, tactile surface finish, environmental durability, and manufacturing processes (die casting, extrusion, veneer lamination, compression molding).
  - `03 / SUSTAINABILITY`: Distinguishes standard municipal curbside recycling streams from specialized industrial scrap handlers, longevity ratings, and end-of-life material separation.
  - `04 / REUSE & REDESIGN`: Three context-specific circular actions: **REPAIR** (restoration steps & tools), **REUSE** (repurposing without reprocessing), and **REIMAGINE** (closed-loop design for disassembly).
  - `05 / INDUSTRIAL DESIGN INSIGHT`: Contextual manufacturing rationale and non-destructive physical verification tests (thermal conductivity, tap acoustic resonance, magnetic attraction).
- **Specimen Archive Library**: Persists examined materials in local storage with JSON export, formatted plain-text clipboard copying, and native mobile sharing.
- **Reference Specimen Library**: Pre-loaded with high-grade reference specimens (Molded European Ash Plywood, Aerospace Aluminum 6061-T6, Recycled HDPE 02 Flake, and Venetian Terrazzo Composite) for immediate testing and classroom demonstration.

---

## 2. Design Language & Aesthetics

Inspired by Swiss International Typographic Style, architectural monographs, and contemporary industrial design studios:

- **Color Palette**: Warm off-white background (`#F5F3ED`), deep forest green (`#26352D`), charcoal typography (`#222522`), and muted sage accents.
- **Zero-Pill Discipline**: Technical metadata is styled with clean typographic separators (`·`, `/`) instead of generic candy badges or colorful pills.
- **Architectural Viewfinder**: Minimalist reticle and laser-scanning animations during multimodal processing.
- **Typography**: Geometric sans-serif (`Plus Jakarta Sans`) paired with monospace tabular numerals (`Space Mono`) for technical specifications.

---

## 3. Technology Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons.
- **Backend / API**: Node.js, Express, `@google/genai` TypeScript SDK.
- **AI Model**: `gemini-3.8-flash` with structured JSON schema output (`responseSchema`).
- **Dev Server**: Vite 8 with Express proxy routing (`tsx server.ts`).

---

## 4. Setup & Running Locally

### Prerequisites

- Node.js 20+ installed
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. Clone repository:
   ```bash
   git clone https://github.com/your-username/matter-ai-material-intelligence.git
   cd matter-ai-material-intelligence
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   PORT=3000
   ```

4. Run the unit tests:
   ```bash
   npm test
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your smartphone or desktop browser.

---

## 5. Security & Deployment

- **API Key Protection**: All Gemini calls run strictly on the Node.js / Express server (`server.ts`). The `GEMINI_API_KEY` is **never** bundled or exposed to client-side code.
- **HTTPS Requirement**: Modern mobile browsers (iOS Safari and Android Chrome) require an HTTPS connection to grant camera hardware permissions (`getUserMedia`). When deploying to Cloud Run, Vercel, or custom servers, ensure SSL/TLS is active.
- **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 6. Academic / Classroom Evaluation Criteria

- **Hardware Capability**: Tests real camera hardware, tracks, video frame rasterization, and lighting controls.
- **Real AI Multimodal Processing**: No static mock fallbacks; transmits real images to Gemini 3.8 Flash for structured multi-section inference.
- **Honest Accuracy Disclosure**: Acknowledges the physical boundaries of optical inspection versus spectrometry, providing non-destructive field verification tests.
- **Circular Economy Principles**: Emphasizes the waste hierarchy (Repair > Reuse > Reimagine > Recycle).

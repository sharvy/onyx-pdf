# Onyx PDF

A premium, professional browser-based PDF editor with AI-powered automation. built with Next.js. Onyx allows you to seamlessly annotate, sign, and automate document editing with an intuitive interface.

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

## ✨ Features

- **📄 PDF Upload & Viewing** - High-performance PDF rendering with multi-page support.
- **✨ AI Assistant** - Click anywhere and use natural language to automate tasks:
  - *"Sign this"* - Automatically finds signature lines and places your signature.
  - *"Put date here"* - Detects date fields and fills today's date.
  - Smart context analysis of the entire document for perfect placement.
- **✏️ Professional Annotations** - Add text and images with precision.
- **🎯 Precision Drag & Drop** - High-accuracy coordinate system for perfect alignment.
- **⌨️ Keyboard Shortcuts** - Optimized for speed:
  - `Delete` / `Backspace` for removing items.
  - `Double-click` to edit text content.
- **↩️ Undo/Redo** - Full history support to quickly revert changes.
- **💾 Export** - Professional-grade PDF embedding of all annotations.
- **🎨 Premium UI** - A sleek, dark-themed interface designed for professionals.

## 🚀 Usage Guide

### 1. File Preparation
Launch by uploading any PDF. The sleek Onyx loader will prepare your document for editing.

### 2. Basic Editing
- **Select Tool**: Click and drag any annotation to move it.
- **Edit Text**: **Double-click** any text box to change its content.
- **Delete**: Select an item and press `Delete` or `Backspace`.

### 3. Using the AI Assistant (✨)
- Click the **Magic Wand (✨)** icon in the toolbar.
- Click on the area of the document you want the AI to analyze (e.g., near a signature line).
- Type a command: *"Sign and date this"*.
- (Optional) Upload an image of your signature.
- Click **Run Magic Actions**—Onyx will automatically find the best positions and place the elements while preserving aspect ratios.

### 4. Precision Control
- **Resize**: Use the handles on image corners to resize while automatically locking the aspect ratio.
- **Zoom**: Use the bottom controls to zoom in for pixel-perfect placement.

### 5. Finalize
Click **Download PDF** to export your document with all changes permanently embedded.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **PDF Core**: `react-pdf` & `pdf-lib`
- **Logic**: Custom AI heuristic engine for document context analysis
- **Styling**: Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pdf-editor
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
pdf-editor/
├── app/
│   ├── favicon.ico
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   └── PDFEditor.tsx        # Main PDF editor component
├── public/                  # Static assets
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## 🏗️ Build for Production

```bash
npm run build
npm start
```

## 🧹 Linting

```bash
npm run lint
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📧 Support

If you have any questions or need help, please open an issue in the repository.

---

Built for professionals who value speed and precision. 🖤 Onyx.

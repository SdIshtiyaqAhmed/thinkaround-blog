# ThinkAround

A minimalist, ethical, and distraction-free digital journal designed for high-focus reading and a premium user experience. **ThinkAround** prioritizes accessibility, privacy, and aesthetic tranquility. ThinkAround is a calm, thoughtful, minimalist blog focused on technology, society, productivity, sustainability, AI, education, economics, and everyday observations.

---

## Key Features

### Focus Mode
A dedicated "Zen" reading environment that strips away all navigation and non-essential UI elements, leaving only the content and the reader. 
- **Geometric Exit:** A clean, bottom-left "Exit Focus" button with geometric iconography.

### Advanced Accessibility Suite
A comprehensive accessibility engine (`accessibility.js`) that gives readers full control over their visual experience:
- **Eye Comfort Mode:** A warm, amber-tinted filter to reduce blue light strain.
- **Black & White Mode:** A high-legibility grayscale mode.
- **Font Scaling:** Dynamic font size adjustment with predefined safe limits.
- **High Contrast:** Enhanced text-to-background contrast for better readability.

### Content Protection & Security
State-of-the-art protection layer (`security.js`) to safeguard intellectual property while maintaining developer utility:
- **Anti-Copy Protection:** Globally disabled text selection and `Ctrl+C`.
- **Developer Utility:** Explicitly permitted copying within **Code Blocks**.
- **Inspect Protection:** Disabled right-click, F12, and DevTools shortcuts.
- **Image Safeguards:** Drag-and-drop protection for all visual assets.

### Developer Experience
- **Code Block Utility:** Premium code blocks with "Copy to Clipboard" functionality.
- **Feedback States:** Dynamic "Copied!" confirmation with geometric icons.
- **JetBrains Mono:** High-legibility monospaced font for code snippets.

---

## Technical Architecture

- **Core:** Vanilla JavaScript (ES6+), Semantic HTML5, Modern CSS Variables.
- **Styling:** Custom CSS design system with Glassmorphism and Glass-card layouts.
- **Data:** Dynamic JSON-based post fetching.
- **Parser:** Custom Markdown-to-HTML engine optimized for speed and safety.
- **Persistence:** LocalStorage-based theme and accessibility state management.

---

## Project Structure

```text
/
├── css/
│   ├── style.css         # Main Design System & UI
│   └── accessibility.css # Accessibility Menu Styles
├── js/
│   ├── app.js            # Main Application Logic & Rendering
│   ├── search.js         # Search Engine & Discovery
│   ├── accessibility.js  # Accessibility Suite Engine
│   └── security.js       # Content Protection Layer
├── posts/
│   └── index.json        # Article Database
├── index.html            # Home & Discovery Page
├── search.html           # Advanced Search Page
└── post.html             # Article Reader Page
```

---

## Getting Started

1. Clone the repository.
2. Serve the directory using a local server (e.g., Live Server, Python http.server).
3. Open `index.html` in any modern evergreen browser.

---

## Ethics & Privacy
ThinkAround is built with a "Privacy First" mindset. It uses no external trackers, no cookies, and relies entirely on client-side state for the best possible performance and ethical data handling.

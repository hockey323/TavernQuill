# TavernQuill 🪶

A high-performance, accessible, and privacy-first SillyTavern V3 character card editor. Build and refine your LLM characters with a modern, reactive interface.

## Core Philosophy

- **Zero-Server Privacy**: All card processing (PNG metadata reading/writing) happens entirely in your browser. No data ever leaves your machine.
- **V3 Native**: Full support for the SillyTavern V3 spec, including lorebooks, alternate greetings, and deep integration with modern LLM-agnostic features.
- **Legacy Compatible**: Imports V2 legacy cards and automatically upgrades them to the V3 structure with sensible defaults.
- **Performance First**: Built with Angular 21 (Zoneless) and Signals for a snappy, ultra-responsive editing experience.
- **WCAG Focused**: Designed with accessibility in mind, supporting keyboard navigation and high-contrast dark/light themes.

## Key Features

- **The Four Chapters**: A structured workflow (Soul, Mind, Voice, Ghost) to ensure no character detail is missed.
- **Dual-Chunk Writing**: Exports PNGs with both `ccv3` (native) and `chara` (legacy) chunks for maximum compatibility across tools.
- **Live Mirror**: Real-time rendering of your character card, including field validation and export checklists.
- **Smart Lorebook Support**: Read-only lorebook viewing on import (CRUD support coming soon).
- **PWA Powered**: Install TavernQuill to your desktop or mobile device for offline use.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- Angular CLI installed (`npm install -g @angular/cli`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
4. Build for production:
   ```bash
   npm run prod
   ```

## Development

TavernQuill is built with:
- **Angular 21** (Standalone + Zoneless)
- **Vanilla CSS** (No utility frameworks, pure performance)
- **Vitest** (Blazing fast testing)
- **GitHub Actions** (Automated deployment to GitHub Pages)

## License

This project is intended for public use and will be released under the MIT License on GitHub.

---

*Crafted for the TavernAI ecosystem by TavernQuill Architects.*

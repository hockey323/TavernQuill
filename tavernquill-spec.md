# 📜 Project Spec: "TavernQuill" – SillyTavern V3 Card Architect

> **Status:** Draft v0.4 | **Locale:** `en-CA` | **Last Updated:** 2026-03-15

---

## 1. Executive Summary

**TavernQuill** is a high-performance, privacy-first web utility for creating and editing AI character cards. It targets the **SillyTavern V3 (spec 3.0)** standard, ensuring deep compatibility with modern LLM frontends. The project serves as a technical showcase for **Zoneless Angular 21**, **Modern Vanilla CSS**, and **AODA-compliant** software design.

All processing is performed entirely client-side — no server, no telemetry, no data leaves the browser.

---

## 2. Technical Stack (Non-Negotiable)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Angular 21 | Strictly **Zoneless**; no `zone.js` |
| State Management | Native Signals | `signal()`, `computed()`, `linkedSignal()` only |
| Styling | Vanilla CSS | Native Nesting, Container Queries, CSS Custom Properties. **No** Tailwind or Sass |
| Accessibility | AODA via Angular CDK Aria | Every interactive element keyboard-accessible |
| Testing | Vitest | Unit logic only (no E2E in v1) |
| Deployment | Static (Vercel / GitHub Pages) | Service Worker for PWA offline support |

### 2.1 Constraints

- `zone.js` must **not** be imported anywhere in the project.
- No third-party CSS frameworks. No CSS-in-JS.
- No server-side rendering (SSR). This is a pure SPA/PWA.
- No external API calls at runtime (Zero-Server Policy — see §6).

---

## 3. Core Logic & Domain Constraints

### 3.1 PNG Metadata Engine

The PNG engine is the heart of the application. It must operate entirely on binary data using `Uint8Array` and `ArrayBuffer`.

#### Reading

- On import, check for the `ccv3` chunk first (CCv3 primary chunk). Fall back to `chara` (CCv2 legacy chunk) if `ccv3` is absent.
- Support `tEXt` chunk format on read. Also accept `iTXt` chunks defensively (some third-party exporters use UTF-8 chunks) — but do not write `iTXt`.
- Decode the Base64-encoded JSON payload and validate it against the `chara_card_v3` schema.
- If the card is loaded from a `chara` (V2) chunk, surface a non-blocking warning to the user that the card is being upgraded to V3 format on save.
- Surface a meaningful error to the user if the PNG contains no recognised `chara`/`ccv3` chunk or if the payload fails schema validation.

#### Writing / Export

On export, write **two `tEXt` chunks** for maximum cross-application compatibility:

1. `ccv3` — Primary CCv3 chunk. Contains the full `CharaCardV3` JSON, Base64-encoded. This is what CCv3-aware applications (SillyTavern, etc.) will read.
2. `chara` — Backfill CCv2 chunk. Contains a V2-compatible representation, Base64-encoded. Allows the card to open in V2-only applications with a degraded but functional experience.

- Preserve all original PNG chunks that are not `ccv3` or `chara` (e.g., `IHDR`, `IDAT`, `iCCP`).
- **Do not use the HTML5 Canvas API for export** — it strips binary metadata chunks.
- Write only `tEXt` chunks. Do not write `iTXt`.

#### Binary Safety

- All chunk parsing and construction must use `Uint8Array` manipulation directly.
- CRC32 checksums must be recalculated correctly for any modified or injected chunks.
- The engine must handle large avatar images (up to ~5 MB) without blocking the main thread; use a Web Worker if necessary.

### 3.2 Character Card Schema

All cards must strictly conform to `chara_card_v3` with `spec_version: "3.0"`.

#### Required Top-Level Fields

```typescript
interface CharaCardV3 {
  spec: "chara_card_v3";
  spec_version: "3.0";
  data: CharaCardData;
}

interface CharaCardData {
  // Identity
  name: string;
  description: string;
  personality: string;
  scenario: string;

  // Dialogue
  first_mes: string;         // First message / greeting
  mes_example: string;       // Example dialogue block

  // System
  system_prompt: string;
  post_history_instructions: string;
  creator_notes: string;

  // Metadata
  tags: string[];
  creator: string;
  character_version: string;
  created: number;           // Unix timestamp (ms)
  modified: number;          // Unix timestamp (ms)

  // Alternate greetings (selectable first messages)
  alternate_greetings: string[];

  // Extensions (frontend-specific — contents vary by application)
  extensions: SillyTavernExtensions | Record<string, unknown>;

  // Lorebook (optional)
  character_book?: Lorebook;
}
```

> **Note:** The `extensions` field must always be present as an empty object `{}` even when unused, for forward compatibility.

> **Note on top-level vs. `data` fields:** A real SillyTavern export duplicates several fields (`name`, `description`, `personality`, etc.) at the root level of the JSON alongside the `data` object. These root-level fields are a **V2 legacy backfill** for older readers. TavernQuill must write them on export for compatibility, but must treat `data` as the canonical source of truth on import. See §10 for the full annotated example.

#### SillyTavern Extensions Object

The `extensions` field inside `data` is frontend-specific. TavernQuill should read and round-trip it opaquely (preserve unknown keys), but must be aware of the SillyTavern-specific structure for its own validation and display purposes:

```typescript
// SillyTavern-specific extensions — treat as optional, not part of the base V3 spec
interface SillyTavernExtensions {
  talkativeness?: string;       // "0.0"–"1.0" as string
  fav?: boolean;
  world?: string;               // Linked world/lorebook name
  depth_prompt?: {
    prompt: string;
    depth: number;
    role: "system" | "user" | "assistant";
  };
  [key: string]: unknown;       // Always allow unknown extension keys
}
```

> **Important:** `depth_prompt` and other SillyTavern-specific keys inside `extensions` must **not** be marked as required in validation. Other V3-compatible frontends will not have them.

### 3.3 Service Architecture

#### `EditorService`

- Central orchestrator for the active character card in memory.
- Exposes the card state as a `WritableSignal<CharaCardData>`.
- Provides a **hook interface** (`TokenizerHook`) that a future `TokenizationService` (WASM-based) can implement and register. The hook signature should be:

```typescript
interface TokenizerHook {
  countTokens(text: string): Promise<number>;
}
```

- The future `TokenizationService` should target **`tiktoken`** (GPT-family `cl100k_base` / `o200k_base` encodings) as the primary WASM implementation, as this is the most prevalent tokenizer in the TavernAI ecosystem. The `TokenizerHook` interface is intentionally tokenizer-agnostic to allow a `llama.cpp`-based implementation to be registered later.

#### `PngService`

- Handles all binary PNG read/write operations.
- Exposes `readChara(file: File): Promise<CharaCardV3>` and `writeChara(card: CharaCardV3, avatarFile: File): Promise<Blob>`.
- Runs heavy operations in a `Web Worker` to avoid blocking the UI thread.

#### `LorebookService`

- Scoped as a **separate, modular service** — a deliberate placeholder for a future full-featured Lorebook editor.
- **v1 Scope:** If an imported card contains a `character_book` field, parse and display the lore entries in a read-only view inside the Ghost chapter. No add/edit/delete in v1.
- The module boundary must be clean: `LorebookService` is the sole consumer of the `Lorebook` and `LorebookEntry` types. No other service or component should import them directly.
- The Ghost chapter UI should render a clear **"Lorebook Editor — Coming Soon"** placeholder panel when a card has no lorebook, signalling future capability without implying it is currently available.
- Future scope (out of v1): full CRUD, sorting, keyword management, recursive scanning, standalone Lorebook import/export.

```typescript
interface Lorebook {
  name?: string;
  description?: string;
  entries: LorebookEntry[];
  extensions: Record<string, unknown>;
}

interface LorebookEntry {
  id: number;
  keys: string[];
  content: string;
  enabled: boolean;
  insertion_order: number;
  case_sensitive?: boolean;
  comment?: string;
  extensions: Record<string, unknown>;
}
```

---

## 4. UI/UX: The "Studio" Layout

### 4.1 Layout Structure

The app uses a persistent **three-pane split layout**:

```
┌─────────────────────────────────────────────────────────────┐
│  Left Sidebar        │  Center Workspace   │  Right Mirror  │
│  (Nav / Stepper)     │  (Active Chapter)   │  (Live Preview)│
│  ~220px fixed        │  flex-grow          │  ~340px fixed  │
└─────────────────────────────────────────────────────────────┘
```

- The sidebar and mirror panels collapse responsively on small viewports (mobile: tab-based navigation).
- Container Queries govern each pane's internal layout independently.

### 4.2 The 4-Chapter Wizard (Progressive Disclosure)

Navigation is a linear stepper. Each chapter maps to a logical group of fields:

| # | Chapter | Codename | Fields |
|---|---|---|---|
| 1 | **Soul** | Identity | `name`, `description`, `personality`, `tags`, `creator`, `character_version` |
| 2 | **Mind** | Scenario & Context | `scenario`, `system_prompt`, `post_history_instructions`, `creator_notes` |
| 3 | **Voice** | Dialogue | `first_mes`, `mes_example` |
| 4 | **Ghost** | World Info / Lorebook | `character_book` (Lorebook entries, read/display via `LorebookService`) |

> <!-- TODO: Confirm this field-to-chapter mapping matches your intended UX flow. -->

- All chapter forms are **Signal-based** — no `FormsModule` or `ReactiveFormsModule` required.
- Validation errors surface inline, not on submit.
- Chapter completion state is tracked via a `computed()` signal (e.g., required fields filled = chapter marked ✓).

### 4.3 Live Mirror (Right Pane)

- Renders a **real-time preview** of the character card as it would appear in a SillyTavern-style frontend.
- Displays: avatar image, name, tags, description excerpt, and first message.
- Updates reactively via `computed()` from the `EditorService` signal — zero manual subscriptions.

### 4.4 Visual Language

- **Aesthetic:** Clean, high-contrast "Studio" design. Think audio production software meets creative tool.
- **Theming:** CSS Custom Properties (`--color-bg`, `--color-surface`, `--color-accent`, etc.) with a `data-theme` attribute on `<html>`.
- **Shipped Themes (v1):**
  - `dark` — Default. Deep charcoal background, cool grey surfaces, amber/gold accent.
  - `light` — Off-white background, warm surfaces, same accent family.
- Additional themes are explicitly out of scope for v1. The CSS variable architecture makes them easy to add in future iterations.
- **Typography:** System-appropriate sans-serif stack for body. Monospace for any raw output panels.
- **Motion:** Subtle transitions on chapter navigation, card preview updates, and error state reveals. No decorative animation that cannot be disabled via `prefers-reduced-motion`.

### 4.5 Avatar Image Handling

- Users drag-and-drop or file-select a PNG avatar.
- The avatar is displayed in the Live Mirror immediately upon upload.
- On export, the edited card data is injected into the original PNG binary (not re-encoded).

---

## 5. Accessibility (AODA Compliance)

- Every interactive element must be reachable and operable via keyboard alone.
- Use Angular CDK `A11yModule` for focus management (trapping in modals, focus restore on close).
- All form fields must have associated `<label>` elements or `aria-label`.
- Error messages must be announced via `aria-live="polite"`.
- Colour contrast must meet **WCAG 2.1 AA** minimum (4.5:1 for body text, 3:1 for large text / UI components).
- The 4-chapter stepper must expose correct ARIA roles: `role="tablist"` / `role="tab"` / `role="tabpanel"` or equivalent `progressbar` semantics.
- `prefers-reduced-motion` must suppress all non-essential animations.
- `prefers-color-scheme` should initialize the correct theme before first paint (no flash).

---

## 6. Deployment & Privacy

### 6.1 Zero-Server Policy

- **No REST API calls at runtime.** All processing (PNG parsing, JSON encoding, validation) is performed in-memory (`ArrayBuffer`, `Uint8Array`).
- No analytics, no crash reporting, no CDN font fetches without user consent.
- All fonts and assets must be bundled or available offline via the Service Worker.

### 6.2 PWA / Service Worker

- Implement a Service Worker (Angular `@angular/service-worker` or a custom Workbox config) to enable:
  - Full offline functionality after first load.
  - Asset precaching for all static resources.
- The app must be installable as a PWA on desktop and mobile.
- A `manifest.webmanifest` must define: name, short name, icons (at least 192×192 and 512×512), `display: standalone`, `theme_color`, `background_color`.

### 6.3 Localization

- Default locale: **`en-CA`** (Canadian English).
- All user-facing strings must be defined in a central `i18n` resource file (even if only `en-CA` ships in v1) to facilitate future translation.
- Date formatting must use Canadian conventions (ISO 8601 preferred for technical fields; `DD/MM/YYYY` for display fields if applicable).

### 6.4 CI/CD (GitHub Actions)

A GitHub Actions pipeline is included in the agent prompt. The pipeline handles production build and deployment to GitHub Pages on every push to `main`.

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build -- --configuration production --base-href /tavern-quill/
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist/tavern-quill/browser
```

---

## 7. Starter Cards

Three placeholder starter cards are bundled with the app as **static JSON assets** (not PWA-cached at runtime). They ensure the UI is never empty on first load and serve as schema validation fixtures during development and testing.

Archetypes (names intentionally omitted — the implementing team should choose names that don't conflict with well-known community cards):

1. **Assistant archetype** — Minimal fields only (`name`, `description`, `personality`, `first_mes`). Demonstrates the basics.
2. **Complex character archetype** — Fully populated: scenario, example dialogue, `post_history_instructions`, and an embedded lorebook with 2–3 sample entries. Demonstrates the full schema.
3. **Blank template** — All fields present and empty. Acts as a "start from scratch" option and as a canonical empty-state fixture for tests.

---

## 8. Out of Scope (v1)

The following are explicitly deferred to future versions:

- Full Lorebook editor (CRUD, sorting, keyword management).
- WASM tokenization (`TokenizationService` — hook is scaffolded, not implemented).
- Additional locales beyond `en-CA`.
- Card sharing / export to formats other than PNG (e.g., JSON-only export is a nice-to-have).
- Backend sync, cloud save, or any form of server-side persistence.
- Additional themes beyond `dark` and `light`. The CSS variable system is in place; new themes are a future community contribution opportunity.

---

## 10. Reference: Card Format, Example & JSON Schema

### 10.1 Annotated Real-World Example

The following is a representative SillyTavern V3 export. Annotations explain the purpose of each field grouping.

```jsonc
{
  // ── V2 Legacy Backfill (root level) ──────────────────────────────────────
  // These fields are duplicated from data{} for backward compatibility with
  // V2-only readers. On import, IGNORE these in favour of data{}. On export,
  // WRITE these by mirroring data{} values.
  "name": "Name",
  "description": "Personality",
  "personality": "Summary",
  "scenario": "Scenario",
  "first_mes": "Greeting",
  "mes_example": "Example Message",
  "avatar": "none",               // Always "none" when embedded in PNG
  "creatorcomment": "",           // V2-era alias for creator_notes; write empty string
  "create_date": "2026-03-15T16:23:16.796Z",  // ISO 8601; mirrors data.modified
  "talkativeness": "0.5",         // Mirrors data.extensions.talkativeness
  "fav": false,                   // Mirrors data.extensions.fav
  "creator": "",
  "tags": [],

  // ── V3 Spec Header ───────────────────────────────────────────────────────
  "spec": "chara_card_v3",        // Constant — never changes
  "spec_version": "3.0",          // Constant — never changes

  // ── Canonical V3 Data Object ─────────────────────────────────────────────
  // This is the source of truth. All editor logic reads from and writes to here.
  "data": {
    "name": "Name",
    "description": "Personality",
    "personality": "Summary",
    "scenario": "Scenario",
    "first_mes": "Greeting",
    "mes_example": "Example Message",
    "creator_notes": "",
    "system_prompt": "",
    "post_history_instructions": "",
    "character_version": "",
    "creator": "",
    "tags": [],
    "alternate_greetings": [],     // Array of string — selectable alternative first messages

    // SillyTavern-specific extensions. Round-trip opaquely; do not require.
    "extensions": {
      "talkativeness": "0.5",
      "fav": false,
      "world": "",
      "depth_prompt": {
        "prompt": "",
        "depth": 4,
        "role": "system"
      }
    }

    // character_book: omitted when no lorebook is present
  }
}
```

---

### 10.2 JSON Schema (Improved)

The following schema corrects the auto-generated draft. Key changes from the raw export schema:
- `spec` and `spec_version` use `const` to enforce exact values.
- `tags`, `alternate_greetings` typed as `string[]` not untyped arrays.
- `extensions` inside `data` uses `additionalProperties: true` — SillyTavern-specific keys are allowed but not required.
- `depth_prompt.role` uses `enum`.
- Root-level legacy fields are present but clearly separated from the `data` canonical fields.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SillyTavernCardV3",
  "description": "A SillyTavern chara_card_v3 export. Root-level fields are V2 backfill; data{} is canonical.",
  "type": "object",
  "required": [
    "name", "description", "personality", "scenario",
    "first_mes", "mes_example", "avatar", "creatorcomment",
    "create_date", "talkativeness", "creator", "tags", "fav",
    "spec", "spec_version", "data"
  ],
  "properties": {
    "spec":         { "const": "chara_card_v3" },
    "spec_version": { "const": "3.0" },
    "name":         { "type": "string" },
    "description":  { "type": "string" },
    "personality":  { "type": "string" },
    "scenario":     { "type": "string" },
    "first_mes":    { "type": "string" },
    "mes_example":  { "type": "string" },
    "avatar":       { "type": "string" },
    "creatorcomment": { "type": "string" },
    "create_date":  { "type": "string", "format": "date-time" },
    "talkativeness": { "type": "string" },
    "creator":      { "type": "string" },
    "fav":          { "type": "boolean" },
    "tags": {
      "type": "array",
      "items": { "type": "string" }
    },

    "data": {
      "type": "object",
      "required": [
        "name", "description", "personality", "scenario",
        "first_mes", "mes_example", "creator_notes", "system_prompt",
        "post_history_instructions", "tags", "creator",
        "character_version", "alternate_greetings", "extensions"
      ],
      "properties": {
        "name":                      { "type": "string" },
        "description":               { "type": "string" },
        "personality":               { "type": "string" },
        "scenario":                  { "type": "string" },
        "first_mes":                 { "type": "string" },
        "mes_example":               { "type": "string" },
        "creator_notes":             { "type": "string" },
        "system_prompt":             { "type": "string" },
        "post_history_instructions": { "type": "string" },
        "character_version":         { "type": "string" },
        "creator":                   { "type": "string" },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        },
        "alternate_greetings": {
          "type": "array",
          "items": { "type": "string" }
        },
        "extensions": {
          "type": "object",
          "additionalProperties": true,
          "properties": {
            "talkativeness": { "type": "string" },
            "fav":           { "type": "boolean" },
            "world":         { "type": "string" },
            "depth_prompt": {
              "type": "object",
              "required": ["prompt", "depth", "role"],
              "properties": {
                "prompt": { "type": "string" },
                "depth":  { "type": "number" },
                "role":   { "type": "string", "enum": ["system", "user", "assistant"] }
              }
            }
          }
        },
        "character_book": {
          "type": "object",
          "description": "Optional embedded lorebook. See LorebookService for schema.",
          "properties": {
            "name":        { "type": "string" },
            "description": { "type": "string" },
            "entries": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["id", "keys", "content", "enabled", "insertion_order"],
                "properties": {
                  "id":               { "type": "number" },
                  "keys":             { "type": "array", "items": { "type": "string" } },
                  "content":          { "type": "string" },
                  "enabled":          { "type": "boolean" },
                  "insertion_order":  { "type": "number" },
                  "case_sensitive":   { "type": "boolean" },
                  "comment":          { "type": "string" },
                  "extensions":       { "type": "object", "additionalProperties": true }
                }
              }
            },
            "extensions": { "type": "object", "additionalProperties": true }
          }
        }
      }
    }
  }
}
```


## 9. Open Questions

All questions have been resolved. This spec is ready to hand to an implementing agent.

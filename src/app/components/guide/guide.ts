import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [RouterModule],
  template: `
    <article class="guide-container">
      <header class="guide-header">
        <h1>Mastering SillyTavern V3 Character Cards</h1>
        <p class="guide-subtitle">A Comprehensive Guide to Modern AI Roleplay Architecture</p>
      </header>

      <section class="guide-toc">
        <h2>Contents</h2>
        <ul>
          <li><a href="/TavernQuill/guide#v3-spec">The V3 Spec: What's New?</a></li>
          <li><a href="/TavernQuill/guide#metadata">PNG Metadata Extraction</a></li>
          <li><a href="/TavernQuill/guide#best-practices">Prompt Engineering Best Practices</a></li>
        </ul>
      </section>

      <section id="v3-spec" class="guide-section">
        <h2>The V3 Spec: Enhanced Intelligence</h2>
        <p>
          The SillyTavern V3 specification represents a significant leap forward in how LLMs consume character state. 
          Unlike previous generations, V3 introduces native fields for <strong>Depth Prompts</strong>, 
          <strong>Talkativeness</strong>, and sophisticated <strong>Post-History Instructions</strong>.
        </p>
        <p>
          TavernQuill ensures every card you export is 100% compliant with the latest schema, 
          eliminating parsing errors in SillyTavern and other compatible frontends.
        </p>
      </section>

      <section id="metadata" class="guide-section">
        <h2>How PNG Metadata Works</h2>
        <p>
          Did you know your character avatar is more than just an image? TavernQuill uses 
          browser-native Canvas APIs to embed your character's entire personality directly 
          into the PNG's auxiliary chunks. This means your character <em>is</em> the image file.
        </p>
      </section>

      <footer class="guide-footer">
        <p>Ready to start building?</p>
        <a routerLink="/soul" class="btn btn-accent">Launch the Architect</a>
      </footer>
    </article>
  `,
  styles: [`
    .guide-container { padding: 2rem; max-width: 800px; margin: 0 auto; color: var(--color-text); }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--color-accent); }
    .guide-subtitle { font-size: 1.25rem; color: var(--color-text-muted); margin-bottom: 2rem; }
    .guide-section { margin-bottom: 3rem; }
    .guide-section h2 { font-size: 1.75rem; margin-bottom: 1rem; color: var(--color-text); border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 0.5rem; }
    .guide-section p { line-height: 1.7; margin-bottom: 1rem; color: var(--color-text-secondary); }
    .guide-toc { background: var(--color-surface-1); padding: 1.5rem; border-radius: var(--radius-lg); margin-bottom: 2rem; }
    .guide-toc h2 { font-size: 1.25rem; margin-bottom: 1rem; }
    .guide-toc ul { list-style: none; padding: 0; }
    .guide-toc li { margin-bottom: 0.5rem; }
    .guide-toc a { color: var(--color-accent); text-decoration: none; }
    .guide-toc a:hover { text-decoration: underline; }
    .guide-footer { text-align: center; padding: 3rem; background: var(--color-surface-1); border-radius: var(--radius-xl); }
  `]
})
export class GuideComponent {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Guide: SillyTavern V3 Character Creation — TavernQuill');
    this.meta.updateTag({ name: 'description', content: 'Learn the technical art of crafting cards. This guide covers the SillyTavern V3 specification, PNG metadata embedding, and AI prompting best practices.' });
  }
}

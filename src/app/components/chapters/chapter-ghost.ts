import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { EditorService } from '../../services/editor.service';
import { LorebookService } from '../../services/lorebook.service';
import { I18N, I18nStrings } from '../../i18n/en-ca';

@Component({
  selector: 'app-chapter-ghost',
  standalone: true,
  templateUrl: './chapter-ghost.html',
  styleUrl: './chapter-ghost.css',
})
export class ChapterGhostComponent {
  protected readonly editor = inject(EditorService);
  protected readonly lorebook = inject(LorebookService);
  protected readonly i18n = inject<I18nStrings>(I18N);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Lorebook & World Info Ghost Editor — SillyTavern V3');
    this.meta.updateTag({ name: 'description', content: 'Extract, edit, and build lorebooks and world info directly from your PNG character cards. TavernQuill provides the ultimate SillyTavern ghost data editor.' });
    this.meta.updateTag({ property: 'og:title', content: 'Lorebook & World Info Ghost Editor — SillyTavern V3' });
    this.editor.setChapter(3);
  }
}

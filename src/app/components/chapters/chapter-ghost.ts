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
    this.title.setTitle('Ghost: World Info & Lorebooks — TavernQuill');
    this.meta.updateTag({ name: 'description', content: 'Extract and edit lorebooks and world info from your character cards. Full support for SillyTavern V3 world info specifications.' });
    this.meta.updateTag({ property: 'og:title', content: 'Ghost: World Info & Lorebooks — TavernQuill' });
    this.editor.setChapter(3);
  }
}

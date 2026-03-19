import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { EditorService } from '../../services/editor.service';
import { I18N, I18nStrings } from '../../i18n/en-ca';

@Component({
  selector: 'app-chapter-mind',
  standalone: true,
  templateUrl: './chapter-mind.html',
  styleUrl: './chapter-mind.css',
})
export class ChapterMindComponent {
  protected readonly editor = inject(EditorService);
  protected readonly i18n = inject<I18nStrings>(I18N);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Mind: Scenario & Context — TavernQuill');
    this.meta.updateTag({ name: 'description', content: 'Design your SillyTavern V3 character scenario, system prompts, and context notes. Fine-tune how your AI character interacts with the world.' });
    this.meta.updateTag({ property: 'og:title', content: 'Mind: Scenario & Context — TavernQuill' });
    this.editor.setChapter(1);
  }

  protected onFieldChange(
    field: 'scenario' | 'system_prompt' | 'post_history_instructions' | 'creator_notes',
    event: Event,
  ): void {
    const el = event.target as HTMLTextAreaElement;
    this.editor.updateField(field, el.value);
  }
}

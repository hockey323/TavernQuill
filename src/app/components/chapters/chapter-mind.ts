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
    this.title.setTitle('Scenario & Mind Context Editor — SillyTavern V3 Architect');
    this.meta.updateTag({ name: 'description', content: 'Craft your character\'s scenario, system prompts, and mind context with precision. TavernQuill is the ultimate architect for SillyTavern V3 character logic.' });
    this.meta.updateTag({ property: 'og:title', content: 'Scenario & Mind Context Editor — SillyTavern V3 Architect' });
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

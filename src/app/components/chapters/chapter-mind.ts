import { Component, inject } from '@angular/core';
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

  protected onFieldChange(
    field: 'scenario' | 'system_prompt' | 'post_history_instructions' | 'creator_notes',
    event: Event,
  ): void {
    const el = event.target as HTMLTextAreaElement;
    this.editor.updateField(field, el.value);
  }
}

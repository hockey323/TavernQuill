import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { EditorService } from '../../services/editor.service';
import { I18N, I18nStrings } from '../../i18n/en-ca';

@Component({
  selector: 'app-chapter-voice',
  standalone: true,
  templateUrl: './chapter-voice.html',
  styleUrl: './chapter-voice.css',
})
export class ChapterVoiceComponent {
  protected readonly editor = inject(EditorService);
  protected readonly i18n = inject<I18nStrings>(I18N);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Voice, Greetings & Dialogue Editor — SillyTavern V3');
    this.meta.updateTag({ name: 'description', content: 'Craft authentic greetings and dialogue examples for your AI character. TavernQuill provides the premium voice editor for the SillyTavern community.' });
    this.meta.updateTag({ property: 'og:title', content: 'Voice, Greetings & Dialogue Editor — SillyTavern V3' });
    this.editor.setChapter(2);
  }

  protected readonly mesExamplePlaceholder =
    'Example conversations showing the character\'s tone and style…\n\nUse <START> to separate examples.\n{{user}}: User message\n{{char}}: Character response';

  protected onFieldChange(field: 'first_mes' | 'mes_example', event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this.editor.updateField(field, el.value);
  }

  protected onGreetingChange(index: number, event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    const greetings = [...this.editor.cardData().alternate_greetings];
    greetings[index] = el.value;
    this.editor.updateField('alternate_greetings', greetings);
  }

  protected addGreeting(): void {
    const greetings = [...this.editor.cardData().alternate_greetings, ''];
    this.editor.updateField('alternate_greetings', greetings);
  }

  protected removeGreeting(index: number): void {
    const greetings = this.editor.cardData().alternate_greetings.filter((_, i) => i !== index);
    this.editor.updateField('alternate_greetings', greetings);
  }
}

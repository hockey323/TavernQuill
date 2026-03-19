import { Component, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { EditorService } from '../../services/editor.service';
import { I18N, I18nStrings } from '../../i18n/en-ca';

@Component({
  selector: 'app-chapter-soul',
  standalone: true,
  templateUrl: './chapter-soul.html',
  styleUrl: './chapter-soul.css',
})
export class ChapterSoulComponent {
  protected readonly editor = inject(EditorService);
  protected readonly i18n = inject<I18nStrings>(I18N);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Character Soul Editor — SillyTavern Identity Architect');
    this.meta.updateTag({ name: 'description', content: 'The premium architect for SillyTavern character identity and soul. Refine personality traits, creator tags, and core character data in our browser-native editor.' });
    this.meta.updateTag({ property: 'og:title', content: 'Character Soul Editor — SillyTavern Identity Architect' });
    this.editor.setChapter(0);
  }

  protected onFieldChange(field: 'name' | 'description' | 'personality' | 'creator' | 'character_version', event: Event): void {
    const el = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.editor.updateField(field, el.value);
  }

  protected onTagsChange(event: Event): void {
    const el = event.target as HTMLInputElement;
    const tags = el.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    this.editor.updateField('tags', tags);
  }

  protected get tagsString(): string {
    return this.editor.cardData().tags.join(', ');
  }
}

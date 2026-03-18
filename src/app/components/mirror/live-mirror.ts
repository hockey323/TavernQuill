import { Component, inject, computed } from '@angular/core';
import { EditorService } from '../../services/editor.service';
import { I18N, I18nStrings } from '../../i18n/en-ca';

@Component({
  selector: 'app-live-mirror',
  standalone: true,
  templateUrl: './live-mirror.html',
  styleUrl: './live-mirror.css',
})
export class LiveMirrorComponent {
  protected readonly editor = inject(EditorService);
  protected readonly i18n = inject<I18nStrings>(I18N);

  protected readonly descriptionExcerpt = computed(() => {
    const desc = this.editor.cardData().description;
    if (desc.length <= 300) return desc;
    return desc.substring(0, 297) + '…';
  });

  protected readonly hasContent = computed(() => {
    const d = this.editor.cardData();
    return d.name.trim().length > 0 || d.description.trim().length > 0;
  });
}

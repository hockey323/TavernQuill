import { Component, inject } from '@angular/core';
import { LorebookService } from '../../services/lorebook.service';
import { I18N, I18nStrings } from '../../i18n/en-ca';

@Component({
  selector: 'app-chapter-ghost',
  standalone: true,
  templateUrl: './chapter-ghost.html',
  styleUrl: './chapter-ghost.css',
})
export class ChapterGhostComponent {
  protected readonly lorebook = inject(LorebookService);
  protected readonly i18n = inject<I18nStrings>(I18N);
}

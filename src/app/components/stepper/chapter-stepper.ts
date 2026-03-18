import { Component, inject } from '@angular/core';
import { EditorService } from '../../services/editor.service';
import { I18N, I18nStrings } from '../../i18n/en-ca';

interface ChapterInfo {
  icon: string;
  titleKey: 'soul' | 'mind' | 'voice' | 'ghost';
}

@Component({
  selector: 'app-chapter-stepper',
  standalone: true,
  templateUrl: './chapter-stepper.html',
  styleUrl: './chapter-stepper.css',
})
export class ChapterStepperComponent {
  protected readonly editor = inject(EditorService);
  protected readonly i18n = inject<I18nStrings>(I18N);

  protected readonly chapters: ChapterInfo[] = [
    { icon: '✦', titleKey: 'soul' },
    { icon: '◈', titleKey: 'mind' },
    { icon: '◉', titleKey: 'voice' },
    { icon: '◎', titleKey: 'ghost' },
  ];

  protected isComplete(index: number): boolean {
    switch (index) {
      case 0: return this.editor.soulComplete();
      case 1: return this.editor.mindComplete();
      case 2: return this.editor.voiceComplete();
      case 3: return this.editor.ghostComplete();
      default: return false;
    }
  }

  protected selectChapter(index: number): void {
    this.editor.setChapter(index);
  }

  protected onKeyDown(event: KeyboardEvent, index: number): void {
    let newIndex = index;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      newIndex = Math.min(index + 1, 3);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      newIndex = Math.max(index - 1, 0);
    } else if (event.key === 'Home') {
      event.preventDefault();
      newIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      newIndex = 3;
    }
    if (newIndex !== index) {
      this.editor.setChapter(newIndex);
      // Focus the new tab
      const tabs = document.querySelectorAll<HTMLElement>('[role="tab"]');
      tabs[newIndex]?.focus();
    }
  }
}

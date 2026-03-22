import { Component, inject, signal } from '@angular/core';
import { EditorService } from '../../services/editor.service';
import { PngService } from '../../services/png.service';
import { CharaCardV3 } from '../../models/chara-card.model';
import { I18N, I18nStrings } from '../../i18n/en-ca';

import assistantCard from '../../../assets/cards/assistant.json';
import complexCard from '../../../assets/cards/complex.json';
import blankCard from '../../../assets/cards/blank.json';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class ToolbarComponent {
  protected readonly editor = inject(EditorService);
  protected readonly pngService = inject(PngService);
  protected readonly i18n = inject<I18nStrings>(I18N);

  protected readonly isDark = signal(true);
  protected readonly showStarterMenu = signal(false);
  protected readonly importError = signal<string | null>(null);
  protected readonly isDragOver = signal(false);

  // ── Theme Toggle ──────────────────────────────────────────────────────

  protected toggleTheme(): void {
    const newDark = !this.isDark();
    this.isDark.set(newDark);
    document.documentElement.setAttribute('data-theme', newDark ? 'dark' : 'light');
  }

  // ── Import ────────────────────────────────────────────────────────────

  protected onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.importFile(input.files[0]);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.importFile(file);
    }
  }

  private async importFile(file: File): Promise<void> {
    this.importError.set(null);
    try {
      const result = await this.pngService.readChara(file);
      this.editor.loadCard(result.card, result.avatarBuffer, result.isV2Upgrade);
    } catch (e) {
      this.importError.set(e instanceof Error ? e.message : 'Failed to import card.');
    }
  }

  // ── Export ────────────────────────────────────────────────────────────

  protected async exportPng(): Promise<void> {
    const buffer = this.editor.avatarBuffer();
    if (!buffer) return;

    try {
      const blob = await this.pngService.writeChara(this.editor.card(), buffer);
      this.downloadBlob(blob, `${this.editor.cardData().name || 'character'}.png`);
    } catch (e) {
      this.importError.set(e instanceof Error ? e.message : 'Failed to export PNG.');
    }
  }

  protected async exportJson(): Promise<void> {
    try {
      const blob = await this.pngService.exportJson(this.editor.card());
      this.downloadBlob(blob, `${this.editor.cardData().name || 'character'}.json`);
    } catch (e) {
      this.importError.set(e instanceof Error ? e.message : 'Failed to export JSON.');
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Avatar Upload ─────────────────────────────────────────────────────

  protected onAvatarSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      file.arrayBuffer().then(buf => {
        this.editor.setAvatar(new Uint8Array(buf));
      });
    }
  }

  // ── Starter Cards ─────────────────────────────────────────────────────

  protected toggleStarterMenu(): void {
    this.showStarterMenu.update(v => !v);
  }

  protected loadStarter(type: 'assistant' | 'complex' | 'blank'): void {
    const cards: Record<string, unknown> = { assistant: assistantCard, complex: complexCard, blank: blankCard };
    const card = JSON.parse(JSON.stringify(cards[type])) as CharaCardV3;
    // Set fresh timestamps
    card.data.created = Date.now();
    card.data.modified = Date.now();
    this.editor.loadStarterCard(card);
    this.showStarterMenu.set(false);
  }

  protected newCard(): void {
    this.editor.resetToBlank();
  }
}

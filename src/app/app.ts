import { Component, inject } from '@angular/core';
import { ChapterStepperComponent } from './components/stepper/chapter-stepper';
import { ChapterSoulComponent } from './components/chapters/chapter-soul';
import { ChapterMindComponent } from './components/chapters/chapter-mind';
import { ChapterVoiceComponent } from './components/chapters/chapter-voice';
import { ChapterGhostComponent } from './components/chapters/chapter-ghost';
import { LiveMirrorComponent } from './components/mirror/live-mirror';
import { ToolbarComponent } from './components/toolbar/toolbar';
import { EditorService } from './services/editor.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ChapterStepperComponent,
    ChapterSoulComponent,
    ChapterMindComponent,
    ChapterVoiceComponent,
    ChapterGhostComponent,
    LiveMirrorComponent,
    ToolbarComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly editor = inject(EditorService);
}
